"""Troubleshooting playbooks: symptom → check → cause → fix → confirm.

These are educational reconstructions based on the CT literature, not records
of real hospital incidents. Real cases from the Ministry will be added later.
"""

import re
from dataclasses import dataclass

SAFETY_AFTER_REPAIR = (
    "Ta’mirdan keyin uskuna klinik ishga qaytishidan oldin elektr xavfsizligi tekshiruvi "
    "(IEC 62353 mantig‘ida) va sifat nazorati fantom skaneri o‘tkaziladi."
)


@dataclass(frozen=True)
class Step:
    title_uz: str
    text_uz: str


@dataclass(frozen=True)
class Playbook:
    id: str
    device: str
    title_uz: str
    symptom_uz: str
    component: str
    tags: tuple[str, ...]
    case_id: str  # related trainer case
    steps: tuple[Step, ...]

    def summary(self) -> dict:
        return {
            "id": self.id,
            "device": self.device,
            "title_uz": self.title_uz,
            "symptom_uz": self.symptom_uz,
            "component": self.component,
            "tags": list(self.tags),
            "case_id": self.case_id,
        }

    def detail(self) -> dict:
        return {
            **self.summary(),
            "steps": [{"title_uz": s.title_uz, "text_uz": s.text_uz} for s in self.steps],
            "safety_uz": SAFETY_AFTER_REPAIR,
        }


PLAYBOOKS: list[Playbook] = [
    Playbook(
        id="pb-ring",
        device="KT",
        title_uz="Barcha tasvirlarda konsentrik halqalar",
        symptom_uz="Ertalabdan beri har bir bemorda markaz atrofida bir xil radiusli halqalar; fantomda ham takrorlanadi.",
        component="detector",
        tags=("Detektor", "Kalibrovka", "Halqa"),
        case_id="ring-01",
        steps=(
            Step("Simptom", "Halqalar barcha bemorlarda va fantomda bir xil joyda — bemorga bog‘liq emas."),
            Step("Tekshiruv", "Suv fantomi skanerlanadi; xona harorati va detektor harorati jurnali ko‘riladi."),
            Step("Sabab", "Bir yoki bir nechta detektor kanali kuchayishi og‘gan (gain drift)."),
            Step("Yechim", "Havo kalibrovkasi (air calibration) qilinadi; halqa qolsa, detektor moduli almashtiriladi."),
            Step("Tasdiqlash", "Suv fantomida bir xillik (uniformity) va shovqin me’yorda ekani tekshiriladi."),
        ),
    ),
    Playbook(
        id="pb-noise",
        device="KT",
        title_uz="Tasvirlar asta-sekin donador bo‘lib qoldi",
        symptom_uz="Protokol o‘zgarmagan, lekin haftalar davomida shovqin ortib bormoqda; trubka ishlagan soatlari ko‘p.",
        component="xray_tube",
        tags=("Rentgen trubkasi", "Generator", "Shovqin"),
        case_id="noise-01",
        steps=(
            Step("Simptom", "Butun tasvir bo‘ylab bir tekis donadorlik; asta-sekin kuchaygan."),
            Step("Tekshiruv", "Trubka toki (mA) va kVp o‘lchanadi; trubka ishlash tarixi va xato jurnali ko‘riladi."),
            Step("Sabab", "Rentgen trubkasi eskirgan yoki generator chiqish quvvati pasaygan — fotonlar kam."),
            Step("Yechim", "Generator kalibrovkasi; chiqish tiklanmasa, trubka almashtirish rejalashtiriladi."),
            Step("Tasdiqlash", "Fantomda shovqin (HU standart og‘ishi) etalon qiymatga qaytgani tekshiriladi."),
        ),
    ),
    Playbook(
        id="pb-cupping",
        device="KT",
        title_uz="Bir xil fantomda markaz qorong‘i",
        symptom_uz="Dasturiy yangilanishdan keyin suv fantomida markaz chetlardan qorong‘iroq chiqmoqda.",
        component="bowtie_filter",
        tags=("Filtr", "Kalibrovka", "Cupping"),
        case_id="cupping-01",
        steps=(
            Step("Simptom", "Radial profil markazga qarab pasayadi (cupping)."),
            Step("Tekshiruv", "Nur qattiqlashuvi tuzatish jadvallari va bowtie filtri konfiguratsiyasi tekshiriladi."),
            Step("Sabab", "Yangilanishdan keyin nur qattiqlashuvi tuzatishi noto‘g‘ri yoki o‘chib qolgan."),
            Step("Yechim", "Nur qattiqlashuvi kalibrovkasi qayta o‘tkaziladi; filtr sozlamasi tiklanadi."),
            Step("Tasdiqlash", "Suv fantomida markaz va chet HU farqi me’yorga tushgani o‘lchanadi."),
        ),
    ),
    Playbook(
        id="pb-missing",
        device="KT",
        title_uz="Vaqti-vaqti bilan bir yo‘nalishdagi chiziqlar",
        symptom_uz="Ba’zi skanerlarda to‘g‘ri chiziqlar; jurnalda ma’lumot uzatishda uzilish xatolari.",
        component="das_slip_ring",
        tags=("DAS", "Slip-ring", "Chiziqlar"),
        case_id="missing-01",
        steps=(
            Step("Simptom", "Chiziqlar hamma skanerda emas, vaqti-vaqti bilan; xato jurnalida aloqa uzilishi."),
            Step("Tekshiruv", "Slip-ring cho‘tkalari va kontaktlari, DAS ulanishlari va kabellari ko‘zdan kechiriladi."),
            Step("Sabab", "Aylanayotgan gantrydan ma’lumot uzatishda uzilish — proyeksiyalar yo‘qoladi."),
            Step("Yechim", "Kontaktlar tozalanadi, eskirgan cho‘tkalar almashtiriladi, ulanishlar mahkamlanadi."),
            Step("Tasdiqlash", "Bir necha ketma-ket fantom skanerida chiziqlar va jurnal xatolari yo‘qligi tekshiriladi."),
        ),
    ),
    Playbook(
        id="pb-motion",
        device="KT",
        title_uz="Faqat bitta bemorda ikki qavat konturlar",
        symptom_uz="Oldingi va keyingi bemorlarda muammo yo‘q; faqat bitta tekshiruvda konturlar siljigan.",
        component="none",
        tags=("Bemor", "Harakat", "Uskuna emas"),
        case_id="motion-01",
        steps=(
            Step("Simptom", "Artefakt faqat bitta bemorda — uskuna nosozligi ehtimoli past."),
            Step("Tekshiruv", "Keyingi bemor yoki fantom tasviri toza ekani tekshiriladi."),
            Step("Sabab", "Bemor skanerlash paytida qimirlagan."),
            Step("Yechim", "Bemorga tushuntiriladi, fiksatsiya qilinadi, kerak bo‘lsa qisqaroq protokol bilan qayta skanerlanadi."),
            Step("Tasdiqlash", "Qayta skanerda artefakt yo‘q — keraksiz ta’mir chaqiruvining oldi olindi."),
        ),
    ),
]

PLAYBOOKS_BY_ID: dict[str, Playbook] = {p.id: p for p in PLAYBOOKS}

_WORD = re.compile(r"[\w‘’'ʻ]+", re.UNICODE)


def _tokens(text: str) -> set[str]:
    # Crude stemming: compare the first 5 letters so "halqalar" matches "halqa".
    return {w.lower()[:5] for w in _WORD.findall(text) if len(w) > 2}


def search(query: str) -> list[Playbook]:
    """Rank playbooks by keyword overlap with the query (symptom text or tag)."""
    q = _tokens(query)
    if not q:
        return PLAYBOOKS

    def score(p: Playbook) -> int:
        haystack = _tokens(" ".join([p.title_uz, p.symptom_uz, *p.tags]))
        return len(q & haystack)

    ranked = sorted(PLAYBOOKS, key=score, reverse=True)
    return [p for p in ranked if score(p) > 0]
