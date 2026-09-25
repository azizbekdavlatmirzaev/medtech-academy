"""Training case catalogue.

Public fields are sent to the browser. The answer (component and whether it is
a device fault) stays on the server and is only used by the grader.
"""

from dataclasses import dataclass

# 3D part ids must match the mesh / hotspot names in the web viewer.
COMPONENTS: dict[str, dict[str, str]] = {
    "detector": {
        "name_uz": "Detektor massivi",
        "description_uz": "Bemordan o‘tgan rentgen nurlarini o‘lchaydigan minglab kanallar.",
    },
    "xray_tube": {
        "name_uz": "Rentgen trubkasi va generator",
        "description_uz": "Rentgen nurini hosil qiladi; eskirganda foton soni kamayadi.",
    },
    "bowtie_filter": {
        "name_uz": "Bowtie filtri va kalibrovka",
        "description_uz": "Nur spektrini tekislaydi; nur qattiqlashuvi tuzatishi shunga bog‘liq.",
    },
    "das_slip_ring": {
        "name_uz": "Ma’lumot yig‘ish tizimi (DAS) va slip-ring",
        "description_uz": "Aylanayotgan gantrydan ma’lumotni uzatadi; uzilishda proyeksiyalar yo‘qoladi.",
    },
    "gantry": {
        "name_uz": "Gantry",
        "description_uz": "Trubka va detektor o‘rnatilgan aylanuvchi halqa.",
    },
    "table": {
        "name_uz": "Bemor stoli",
        "description_uz": "Bemorni gantry ichiga aniq siljitadi.",
    },
}

# Answer used for artifacts that are not caused by the device.
NOT_A_DEVICE_FAULT = "none"


@dataclass(frozen=True)
class Case:
    id: str
    fault: str
    seed: int
    title_uz: str
    symptom_uz: str
    difficulty: int  # 1 easy … 3 hard
    component: str  # answer: a COMPONENTS key or NOT_A_DEVICE_FAULT
    explanation_uz: str  # reference explanation for the grader

    def public(self) -> dict:
        return {
            "id": self.id,
            "title_uz": self.title_uz,
            "symptom_uz": self.symptom_uz,
            "difficulty": self.difficulty,
        }


CASES: list[Case] = [
    Case(
        id="ring-01",
        fault="ring",
        seed=1,
        title_uz="Konsentrik halqalar",
        symptom_uz="Ertalabdan beri barcha bemorlarning tasvirida markaz atrofida bir xil halqalar ko‘rinmoqda.",
        difficulty=1,
        component="detector",
        explanation_uz="Bir yoki bir nechta detektor kanali noto‘g‘ri kuchaytiradi. Xato har bir burchakda bir xil joyda bo‘lgani uchun qayta tiklashda halqa hosil bo‘ladi. Detektor kalibrovkasi (air calibration) qilinadi, yordam bermasa modul almashtiriladi.",
    ),
    Case(
        id="noise-01",
        fault="noise",
        seed=1,
        title_uz="Donador tasvir",
        symptom_uz="Oxirgi haftalarda tasvirlar donador bo‘lib qoldi, protokol o‘zgarmagan. Trubka ishlagan soatlari ko‘p.",
        difficulty=1,
        component="xray_tube",
        explanation_uz="Detektorga yetib kelgan foton soni kam — kvant shovqini oshgan. Sabab ko‘pincha eskirgan rentgen trubkasi yoki generator chiqish quvvati pasayishi. Trubka toki va kVp o‘lchanadi, trubka ishlash tarixi tekshiriladi.",
    ),
    Case(
        id="cupping-01",
        fault="cupping",
        seed=1,
        title_uz="Markaz qorong‘i",
        symptom_uz="Bir xil zichlikdagi fantomda markaz chetlarga qaraganda qorong‘iroq chiqmoqda. Yaqinda dasturiy yangilanish bo‘lgan.",
        difficulty=2,
        component="bowtie_filter",
        explanation_uz="Nur qattiqlashuvi (beam hardening) tuzatilmagan: uzun yo‘ldan o‘tgan nur kuchsizroq so‘riladi va markaz qorong‘i ko‘rinadi (cupping). Nur qattiqlashuvi kalibrovkasi va bowtie filtri tekshiriladi.",
    ),
    Case(
        id="missing-01",
        fault="missing_views",
        seed=1,
        title_uz="Bir yo‘nalishdagi chiziqlar",
        symptom_uz="Ba’zi skanerlarda bir yo‘nalishda to‘g‘ri chiziqlar paydo bo‘ladi; tizim jurnalida vaqti-vaqti bilan aloqa uzilishi xatosi bor.",
        difficulty=2,
        component="das_slip_ring",
        explanation_uz="Proyeksiyalarning bir qismi yo‘qolgan — gantrydan ma’lumot uzatishda uzilish. Slip-ring cho‘tkalari va ma’lumot yig‘ish tizimi (DAS) ulanishlari tekshiriladi.",
    ),
    Case(
        id="motion-01",
        fault="motion",
        seed=1,
        title_uz="Ikki qavat konturlar",
        symptom_uz="Faqat bitta bemorning tasvirida konturlar ikki qavat chiqdi. Undan oldingi va keyingi bemorlarda muammo yo‘q.",
        difficulty=3,
        component=NOT_A_DEVICE_FAULT,
        explanation_uz="Bu uskuna nosozligi emas — bemor skanerlash vaqtida qimirlagan. Faqat bitta bemorda bo‘lgani asosiy belgi. Bemorga tushuntiriladi, fiksatsiya qilinadi va qayta skanerlanadi; uskunani ta’mirlash shart emas.",
    ),
    Case(
        id="ring-02",
        fault="ring",
        seed=2,
        title_uz="Tungi smenadan keyin halqa",
        symptom_uz="Xona sovutish tizimi tunda o‘chib qolgan. Ertalab birinchi skanerlardan boshlab tasvirda halqalar bor.",
        difficulty=2,
        component="detector",
        explanation_uz="Detektor harorat o‘zgarishiga sezgir; kanallar kuchayishi o‘zgarib halqa beradi. Xona harorati tiklanadi, detektor isigach kalibrovka qilinadi.",
    ),
]

CASES_BY_ID: dict[str, Case] = {c.id: c for c in CASES}
