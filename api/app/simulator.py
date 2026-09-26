"""Physics-based CT fault simulator.

A synthetic head (in HU) is converted to X-ray attenuation, forward-projected
into a sinogram of line integrals, and measured with photon (quantum) noise.
Each fault corrupts the measurement the way the failing component would, then
the slice is reconstructed with filtered back-projection and shown in a
clinical brain window, so every artifact is genuine.
"""

from functools import lru_cache

import numpy as np
from skimage.filters import gaussian
from skimage.transform import iradon, radon

from app.phantom import head_phantom

SIZE = 320
N_ANGLES = 720
MU_WATER = 0.0148  # attenuation of water per pixel (0.019/mm × 0.78 mm pixels)
I0_NORMAL = 2.0e7  # unattenuated photons per detector reading (dose-equivalent)
SOFT_KERNEL_SIGMA = 0.8  # smoothing of a clinical soft-tissue reconstruction kernel, in pixels
BRAIN_WINDOW = (40, 80)  # level, width in HU

FAULTS = ("normal", "ring", "noise", "cupping", "missing_views", "motion")

_PHANTOM_HU = head_phantom(SIZE)


def phantom() -> np.ndarray:
    """The ground-truth head slice in HU."""
    return _PHANTOM_HU.copy()


def _attenuation(hu: np.ndarray) -> np.ndarray:
    return np.clip(MU_WATER * (1 + hu / 1000), 0, None)


def _angles() -> np.ndarray:
    # Full 360° rotation like a real gantry; with 180° a faulty channel would
    # only trace a half ring.
    return np.linspace(0.0, 360.0, N_ANGLES, endpoint=False)


def _measure(p: np.ndarray, i0: float, noise_rng: np.random.Generator) -> np.ndarray:
    # Photon counting: I = I0·exp(-p) with Poisson noise (Gaussian approximation,
    # std = sqrt(I)). The same noise field is reused for every fault of a seed,
    # so comparing a faulty slice with a normal one isolates the artifact.
    counts = i0 * np.exp(-p)
    noisy = counts + np.sqrt(counts) * noise_rng.standard_normal(p.shape)
    return -np.log(np.clip(noisy, 1.0, None) / i0)


def _ring(p: np.ndarray, rng: np.random.Generator) -> np.ndarray:
    # Detector channels with a wrong gain g: I' = g·I, i.e. p' = p - ln g.
    # A constant error at one detector position across all angles
    # back-projects into a ring.
    out = p.copy()
    n_det = out.shape[0]
    offsets = rng.choice(np.arange(30, 115), size=3, replace=False) * rng.choice([-1, 1], size=3)
    channels = n_det // 2 + offsets
    for ch in channels:
        out[ch, :] -= np.log(rng.uniform(0.975, 0.982))
    return out


def _cupping(p: np.ndarray, rng: np.random.Generator) -> np.ndarray:
    # Beam hardening without correction: long paths are under-estimated,
    # the centre of the head looks darker than its periphery.
    k = rng.uniform(0.0035, 0.0045)
    return p - k * p**2


def _missing_views(p: np.ndarray, rng: np.random.Generator) -> np.ndarray:
    # Data acquisition / slip-ring dropout: a block of projections is lost and
    # the system repeats the last good reading for the missing angles.
    out = p.copy()
    start = int(rng.integers(1, N_ANGLES - 50))
    out[:, start : start + 40] = out[:, start - 1 : start]
    return out


def _motion(att: np.ndarray, theta: np.ndarray, rng: np.random.Generator) -> np.ndarray:
    # Patient moves half-way through the scan; the device is fine.
    shift = int(rng.integers(4, 7))
    moved = np.roll(att, shift, axis=1)
    half = N_ANGLES // 2
    first = radon(att, theta=theta[:half], circle=True)
    second = radon(moved, theta=theta[half:], circle=True)
    return np.concatenate([first, second], axis=1)


def simulate(fault: str, seed: int = 0) -> np.ndarray:
    """Return a reconstructed CT slice in HU for the given fault."""
    if fault not in FAULTS:
        raise ValueError(f"unknown fault: {fault}")
    rng = np.random.default_rng(seed)
    noise_rng = np.random.default_rng(seed + 10_000)
    att = _attenuation(_PHANTOM_HU)
    theta = _angles()

    p = _motion(att, theta, rng) if fault == "motion" else radon(att, theta=theta, circle=True)
    if fault == "cupping":
        p = _cupping(p, rng)

    # Too few photons (ageing tube / generator) means more quantum noise.
    i0 = I0_NORMAL / 25 if fault == "noise" else I0_NORMAL
    p = _measure(p, i0, noise_rng)

    if fault == "ring":
        p = _ring(p, rng)
    elif fault == "missing_views":
        p = _missing_views(p, rng)

    mu = iradon(p, theta=theta, filter_name="shepp-logan", circle=True)
    mu = gaussian(mu, sigma=SOFT_KERNEL_SIGMA, preserve_range=True)
    return (mu / MU_WATER - 1) * 1000


@lru_cache(maxsize=1)
def _still_sinogram() -> np.ndarray:
    # The patient never changes, so the noiseless projections are computed once.
    return radon(_attenuation(_PHANTOM_HU), theta=_angles(), circle=True)


def acquire(i0: float, *, motion: bool = False, kernel_sigma: float = SOFT_KERNEL_SIGMA, seed: int = 0) -> np.ndarray:
    """Scan the healthy device with an operator-chosen photon count and kernel.

    Used by the operator console: fewer photons (lower mAs / kV, thinner
    slices) give more quantum noise; a patient who was not told to keep
    still adds motion artifacts.
    """
    rng = np.random.default_rng(seed)
    noise_rng = np.random.default_rng(seed + 10_000)
    att = _attenuation(_PHANTOM_HU)
    theta = _angles()
    p = _motion(att, theta, rng) if motion else _still_sinogram().copy()
    if np.isfinite(i0):
        p = _measure(p, i0, noise_rng)
    mu = iradon(p, theta=theta, filter_name="shepp-logan", circle=True)
    if kernel_sigma > 0:
        mu = gaussian(mu, sigma=kernel_sigma, preserve_range=True)
    return (mu / MU_WATER - 1) * 1000


def to_uint8(hu: np.ndarray, window: tuple[float, float] = BRAIN_WINDOW) -> np.ndarray:
    level, width = window
    return (np.clip((hu - (level - width / 2)) / width, 0.0, 1.0) * 255).astype(np.uint8)
