import numpy as np
import pytest

from app.phantom import BONE_CORTICAL, CSF, WHITE
from app.simulator import FAULTS, SIZE, phantom, simulate, to_uint8


@pytest.fixture(scope="module")
def normal():
    return simulate("normal", seed=1)


@pytest.fixture(scope="module")
def white_matter():
    return np.abs(phantom() - WHITE) < 3


def test_normal_slice_has_realistic_hu(normal, white_matter):
    assert normal.shape == (SIZE, SIZE)
    assert abs(normal[white_matter].mean() - WHITE) < 3  # tissue keeps its CT number
    assert 1 < normal[white_matter].std() < 8  # clinical-level quantum noise, not zero
    assert normal.max() > BONE_CORTICAL * 0.6  # skull stays bright
    assert normal[np.abs(phantom() - CSF) < 2].mean() < 20  # ventricles are dark


@pytest.mark.parametrize("fault", [f for f in FAULTS if f != "normal"])
def test_every_fault_changes_the_image(normal, white_matter, fault):
    rmse = np.sqrt(((simulate(fault, seed=1) - normal)[white_matter] ** 2).mean())
    assert rmse > 1.0  # at least 1 HU of change in brain tissue


def test_noise_fault_is_noisier(normal, white_matter):
    assert simulate("noise", seed=1)[white_matter].std() > 1.3 * normal[white_matter].std()


def test_cupping_darkens_the_centre(normal):
    c = SIZE // 2
    centre = (slice(c - 20, c + 20), slice(c - 60, c - 30))  # white matter left of the ventricles
    assert simulate("cupping", seed=1)[centre].mean() < normal[centre].mean() - 5


def test_same_seed_is_reproducible():
    assert np.array_equal(simulate("ring", seed=7), simulate("ring", seed=7))


def test_different_seed_gives_a_new_case():
    assert not np.array_equal(simulate("ring", seed=1), simulate("ring", seed=2))


def _radial_symmetry(diff: np.ndarray) -> float:
    # |mean| / std of the error on the circle where it is strongest:
    # high when the error depends only on the distance from the centre.
    y, x = np.indices(diff.shape)
    r = np.hypot(x - SIZE / 2, y - SIZE / 2).round().astype(int)
    per_radius = [diff[r == k] for k in range(5, SIZE // 2 - 5)]
    strongest = max(per_radius, key=lambda v: abs(v.mean()))
    return abs(strongest.mean()) / strongest.std()


def test_ring_error_is_radially_symmetric(normal):
    ring = _radial_symmetry(simulate("ring", seed=1) - normal)
    noise = _radial_symmetry(simulate("noise", seed=1) - normal)
    assert ring > 1.5
    assert ring > 3 * noise


def test_unknown_fault_is_rejected():
    with pytest.raises(ValueError):
        simulate("broken")


def test_to_uint8_range(normal):
    img = to_uint8(normal)
    assert img.dtype == np.uint8 and img.min() >= 0 and img.max() <= 255
