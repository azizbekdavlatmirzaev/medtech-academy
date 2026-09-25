"""Physics-based CT fault simulator.

A CT slice is reconstructed from projections (a sinogram). Each fault corrupts
the sinogram the way the failing component would, then the slice is
reconstructed with filtered back-projection, so the artifact is genuine.
"""

import numpy as np
from skimage.data import shepp_logan_phantom
from skimage.transform import iradon, radon, resize

SIZE = 256
N_ANGLES = 360
# Fixed display window so every case is rendered on the same intensity scale.
WINDOW = (-0.1, 1.1)

FAULTS = ("normal", "ring", "noise", "cupping", "missing_views", "motion")


def phantom() -> np.ndarray:
    return resize(shepp_logan_phantom(), (SIZE, SIZE), anti_aliasing=True)


def _angles() -> np.ndarray:
    # Full 360° rotation like a real gantry; with 180° a faulty channel would
    # only trace a half ring.
    return np.linspace(0.0, 360.0, N_ANGLES, endpoint=False)


def _reconstruct(sinogram: np.ndarray, theta: np.ndarray) -> np.ndarray:
    return iradon(sinogram, theta=theta, filter_name="ramp", circle=True)


def _ring(sino: np.ndarray, rng: np.random.Generator) -> np.ndarray:
    # Detector channels with a wrong gain: a constant error at one detector
    # position across all angles back-projects into a ring.
    out = sino.copy()
    n_det = out.shape[0]
    channels = rng.choice(np.arange(n_det // 4, 3 * n_det // 4), size=3, replace=False)
    for ch in channels:
        out[ch, :] *= rng.uniform(0.88, 0.92)
    return out


def _noise(sino: np.ndarray, rng: np.random.Generator) -> np.ndarray:
    # Too few photons (ageing tube / generator): Poisson noise on the measured
    # intensity I = I0 * exp(-p), converted back to line integrals.
    i0 = 2.0e3
    scale = 0.02  # maps phantom line integrals to realistic attenuation
    counts = rng.poisson(i0 * np.exp(-sino * scale)).clip(min=1)
    return -np.log(counts / i0) / scale


def _cupping(sino: np.ndarray, rng: np.random.Generator) -> np.ndarray:
    # Beam hardening without correction: long paths are under-estimated,
    # the centre of the object looks darker than its edge.
    k = rng.uniform(0.004, 0.006)
    return sino - k * sino**2


def _missing_views(sino: np.ndarray, rng: np.random.Generator) -> np.ndarray:
    # Data acquisition / slip-ring dropout: a block of projections is lost.
    out = sino.copy()
    start = rng.integers(0, N_ANGLES - 40)
    out[:, start : start + 30] = 0.0
    return out


def _motion(image: np.ndarray, theta: np.ndarray, rng: np.random.Generator) -> np.ndarray:
    # Patient moves half-way through the scan; the device is fine.
    shift = int(rng.integers(6, 10))
    moved = np.roll(image, shift, axis=1)
    half = N_ANGLES // 2
    first = radon(image, theta=theta[:half], circle=True)
    second = radon(moved, theta=theta[half:], circle=True)
    return np.concatenate([first, second], axis=1)


def simulate(fault: str, seed: int = 0) -> np.ndarray:
    """Return a reconstructed CT slice (float array) for the given fault."""
    if fault not in FAULTS:
        raise ValueError(f"unknown fault: {fault}")
    rng = np.random.default_rng(seed)
    image = phantom()
    theta = _angles()

    if fault == "motion":
        sino = _motion(image, theta, rng)
    else:
        sino = radon(image, theta=theta, circle=True)
        if fault == "ring":
            sino = _ring(sino, rng)
        elif fault == "noise":
            sino = _noise(sino, rng)
        elif fault == "cupping":
            sino = _cupping(sino, rng)
        elif fault == "missing_views":
            sino = _missing_views(sino, rng)

    return _reconstruct(sino, theta)


def to_uint8(slice_: np.ndarray) -> np.ndarray:
    lo, hi = WINDOW
    return (np.clip((slice_ - lo) / (hi - lo), 0.0, 1.0) * 255).astype(np.uint8)
