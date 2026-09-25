import numpy as np
import pytest

from app.simulator import FAULTS, SIZE, simulate, to_uint8


@pytest.fixture(scope="module")
def normal():
    return simulate("normal", seed=1)


def test_normal_is_close_to_phantom_range(normal):
    assert normal.shape == (SIZE, SIZE)
    assert -0.2 < normal.min() and normal.max() < 1.2


@pytest.mark.parametrize("fault", [f for f in FAULTS if f != "normal"])
def test_every_fault_changes_the_image(normal, fault):
    rmse = np.sqrt(((simulate(fault, seed=1) - normal) ** 2).mean())
    assert rmse > 0.005


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
