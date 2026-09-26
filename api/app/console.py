"""Operator console: scan protocol -> image, dose and quality feedback.

The model is deliberately simple and physically honest:
- tube output (photons) scales with mAs and roughly with kV^2.5;
- the photons a voxel collects scale with the reconstructed slice thickness;
- quantum noise follows from the photon count in the simulator;
- dose (CTDIvol) scales with mAs and kV^2.5, not with slice thickness.
Dose figures are a teaching estimate, not a calibrated dosimetry model.
"""

from dataclasses import dataclass
from functools import lru_cache

import numpy as np
from pydantic import BaseModel, Field

from app.simulator import I0_NORMAL, SOFT_KERNEL_SIGMA, acquire, phantom

KV_OPTIONS = (80, 100, 120, 140)
THICKNESS_OPTIONS = (1.0, 2.5, 5.0)
KERNELS = {"soft": SOFT_KERNEL_SIGMA, "sharp": 0.0}

# Reference head protocol: 120 kV, 300 mAs, 5 mm, soft kernel. Its photon
# count is set so brain noise is about 3.5 HU, like a clinical head scan (the
# trainer images use more photons to keep their artifacts clean).
REF_KV, REF_MAS, REF_THICKNESS = 120, 300, 5.0
REF_PHOTONS = I0_NORMAL / 19
CTDI_PER_MAS = 0.18  # mGy per mAs for a head scan at 120 kV (typical order of magnitude)
DRL_HEAD_CTDI = 60.0  # mGy, European diagnostic reference level for adult head CT (RP 180)
SCAN_LENGTH_CM = 15.0  # adult head, skull base to vertex

WINDOWS = {"brain": (40, 80), "soft": (40, 400), "bone": (500, 2000)}

# Grey and white matter: where image noise matters for diagnosis.
_TRUE = phantom()
_BRAIN = (_TRUE >= 20) & (_TRUE <= 45)


class Protocol(BaseModel):
    kv: int = Field(default=REF_KV)
    mas: int = Field(default=REF_MAS, ge=20, le=500)
    thickness: float = Field(default=REF_THICKNESS)
    kernel: str = Field(default="soft")
    patient_instructed: bool = True  # told to keep still
    door_closed: bool = True


@dataclass(frozen=True)
class Feedback:
    level: str  # "ok" | "warn" | "error"
    text_uz: str


def validate(p: Protocol) -> None:
    if p.kv not in KV_OPTIONS:
        raise ValueError(f"kV must be one of {KV_OPTIONS}")
    if p.thickness not in THICKNESS_OPTIONS:
        raise ValueError(f"slice thickness must be one of {THICKNESS_OPTIONS}")
    if p.kernel not in KERNELS:
        raise ValueError(f"kernel must be one of {tuple(KERNELS)}")


def photons(p: Protocol) -> float:
    return REF_PHOTONS * (p.mas / REF_MAS) * (p.kv / REF_KV) ** 2.5 * (p.thickness / REF_THICKNESS)


def ctdi_vol(p: Protocol) -> float:
    return CTDI_PER_MAS * p.mas * (p.kv / REF_KV) ** 2.5


@lru_cache(maxsize=48)
def _image(i0: float, motion: bool, kernel: str) -> np.ndarray:
    return acquire(i0, motion=motion, kernel_sigma=KERNELS[kernel], seed=3)


@lru_cache(maxsize=4)
def _clean(kernel: str) -> np.ndarray:
    # The same reconstruction without photon noise: the difference is pure noise.
    return acquire(float("inf"), kernel_sigma=KERNELS[kernel])


def scan(p: Protocol) -> tuple[np.ndarray, dict]:
    validate(p)
    motion = not p.patient_instructed
    hu = _image(round(photons(p), -3), motion, p.kernel)
    noise_sd = float(np.std((hu - _clean(p.kernel))[_BRAIN])) if not motion else float("nan")
    ctdi = ctdi_vol(p)
    feedback = _feedback(p, ctdi, noise_sd)
    return hu, {
        "ctdi_vol": round(ctdi, 1),
        "dlp": round(ctdi * SCAN_LENGTH_CM),
        "drl_ctdi": DRL_HEAD_CTDI,
        "noise_sd": None if motion else round(noise_sd, 1),
        "quality": _quality(noise_sd, motion),
        "feedback": [f.__dict__ for f in feedback],
    }


def _quality(noise_sd: float, motion: bool) -> str:
    if motion:
        return "yaroqsiz"
    if noise_sd <= 5:
        return "yaxshi"
    if noise_sd <= 8:
        return "qoniqarli"
    return "past"


def _feedback(p: Protocol, ctdi: float, noise_sd: float) -> list[Feedback]:
    out: list[Feedback] = []
    if not p.patient_instructed:
        out.append(Feedback("error", "Bemor skanerlash paytida qimirladi: tasvirda chiziqlar va ikki qavat konturlar bor. Skanerdan oldin bemorga qimirlamaslikni ayting."))
    if ctdi > DRL_HEAD_CTDI:
        out.append(Feedback("warn", f"Doza (CTDIvol {ctdi:.0f} mGy) bosh KT uchun diagnostik referens darajadan ({DRL_HEAD_CTDI:.0f} mGy) yuqori. ALARA: mAs yoki kV ni kamaytiring."))
    elif ctdi < DRL_HEAD_CTDI * 0.4 and noise_sd > 8:
        out.append(Feedback("warn", "Doza juda past, tasvir shovqinli: kichik o‘zgarishlar ko‘rinmay qolishi mumkin. mAs ni oshiring yoki qalinroq kesim tanlang."))
    if not np.isnan(noise_sd) and noise_sd > 8:
        out.append(Feedback("warn", f"Shovqin yuqori (SD {noise_sd:.1f} HU): kulrang va oq modda farqi yo‘qoladi."))
    if p.kernel == "sharp":
        out.append(Feedback("warn", "O‘tkir (suyak) kernel miya to‘qimasida shovqinni oshiradi — miya uchun yumshoq kernel, suyak uchun o‘tkir kernel tanlanadi."))
    if p.thickness == 1.0:
        out.append(Feedback("ok", "1 mm kesim mayda detallarni yaxshi ko‘rsatadi, lekin har bir kesimda foton kam — shovqin ko‘proq."))
    if not out:
        out.append(Feedback("ok", "Protokol to‘g‘ri: doza me’yorda, tasvir diagnostik sifatda."))
    return out
