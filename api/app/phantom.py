"""Synthetic anatomical head phantom in Hounsfield units (HU).

An axial slice at the level of the lateral ventricles, built from simple
shapes with realistic tissue HU values. It is procedural — no patient data.
"""

import numpy as np
from skimage.filters import gaussian

# Typical CT numbers (HU).
AIR = -1000
FAT = -90
SKIN = 45
BONE_CORTICAL = 1500
BONE_DIPLOE = 650
GREY = 40
WHITE = 28
DEEP_GREY = 37
CSF = 7
FALX = 55
CALCIFICATION = 250


def _ellipse(x, y, cx, cy, a, b, angle_deg=0.0):
    t = np.deg2rad(angle_deg)
    xr = (x - cx) * np.cos(t) + (y - cy) * np.sin(t)
    yr = -(x - cx) * np.sin(t) + (y - cy) * np.cos(t)
    return (xr / a) ** 2 + (yr / b) ** 2


def head_phantom(n: int) -> np.ndarray:
    """Return an n×n HU image; anterior (forehead) is at the top."""
    y, x = np.mgrid[-1 : 1 : n * 1j, -1 : 1 : n * 1j]
    theta = np.arctan2(y, x)
    rng = np.random.default_rng(0)  # fixed anatomy: every case shows the same patient
    hu = np.full((n, n), AIR, dtype=float)

    # Slightly irregular skull outline, like a real head.
    wobble = 1 + 0.012 * np.sin(3 * theta) + 0.008 * np.cos(5 * theta + 0.7)
    head = _ellipse(x, y, 0, 0.02, 0.74, 0.9) * wobble**2

    hu[head <= 1.0] = SKIN
    hu[head <= 0.98] = FAT
    skull_outer = head <= 0.962
    skull_inner = head <= 0.84
    hu[skull_outer] = BONE_CORTICAL
    diploe = (head <= 0.935) & (head > 0.87) & (np.abs(np.sin(theta)) > 0.35)  # thicker at front and back
    hu[diploe] = BONE_DIPLOE

    # Brain: a folded cortex (grey) over white matter; sulci are the thin
    # zero-crossings of a smooth random field, filled with CSF.
    brain = skull_inner
    depth = 1 - head / 0.84  # 0 at the inner table, 1 at the centre
    folds = gaussian(rng.standard_normal((n, n)), sigma=n / 70)
    folds = (folds - folds.mean()) / folds.std()
    cortex_depth = np.clip(0.13 + 0.04 * folds, 0.07, 0.2)  # thicker on gyri, thinner in sulci
    hu[brain] = WHITE
    hu[brain & (depth < cortex_depth)] = GREY
    sulci = brain & (np.abs(folds) < 0.22) & (depth < cortex_depth + 0.03)
    hu[sulci] = CSF
    hu[brain & (depth < 0.028)] = CSF  # thin CSF rim under the skull

    # Deep grey nuclei (basal ganglia, thalami).
    for sx in (-1, 1):
        hu[_ellipse(x, y, sx * 0.19, 0.02, 0.07, 0.13, sx * 15) <= 1] = DEEP_GREY
        hu[_ellipse(x, y, sx * 0.1, 0.22, 0.06, 0.08) <= 1] = DEEP_GREY

    # Lateral ventricles (frontal horns + bodies) and the third ventricle.
    for sx in (-1, 1):
        hu[_ellipse(x, y, sx * 0.075, -0.2, 0.045, 0.16, sx * -22) <= 1] = CSF
        hu[_ellipse(x, y, sx * 0.1, 0.12, 0.035, 0.16, sx * 10) <= 1] = CSF
        hu[_ellipse(x, y, sx * 0.1, 0.25, 0.018, 0.018) <= 1] = CALCIFICATION  # choroid plexus
    hu[_ellipse(x, y, 0, 0.03, 0.01, 0.07) <= 1] = CSF

    # Falx cerebri: thin midline membrane between the hemispheres, in front of
    # and behind the ventricles; the interhemispheric fissure holds some CSF.
    midline = (np.abs(x) < 0.012) & brain & (depth < 0.55) & ((y < -0.42) | (y > 0.45))
    hu[midline] = CSF
    hu[midline & (np.abs(x) < 0.004)] = FALX

    # Faint soft-tissue texture so flat regions do not look synthetic.
    texture = gaussian(rng.standard_normal((n, n)), sigma=1.5) * 3
    hu[brain] += texture[brain]
    return gaussian(hu, sigma=0.6, preserve_range=True)
