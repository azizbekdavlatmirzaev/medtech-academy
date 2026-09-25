"""Interactive quiz: theory and image questions.

Image questions show a slice rendered by our simulator (a different seed from
the trainer cases). Correct options stay on the server.
"""

from dataclasses import dataclass

SRC_HSIEH = "Hsieh J. Computed Tomography: Principles, Design, Artifacts, and Recent Advances (SPIE Press)"
SRC_IAEA_RPOP = "IAEA — Radiation Protection of Patients (RPOP): Kompyuter tomografiyasi"
SRC_IAEA_BASICS = "IAEA — Nurlanishdan himoyalanish asoslari (ochiq o‘quv materiallari)"

ARTIFACT_OPTIONS = [
    ("ring", "Halqa artefakti"),
    ("noise", "Kvant shovqini"),
    ("cupping", "Cupping (nur qattiqlashuvi)"),
    ("motion", "Bemor harakati"),
    ("missing_views", "Tushib qolgan proyeksiyalar (chiziqlar)"),
]


@dataclass(frozen=True)
class Question:
    id: str
    kind: str  # "choice" | "image"
    topic: str
    difficulty: int
    prompt_uz: str
    options: list[tuple[str, str]]
    answer: str
    explanation_uz: str
    source: str
    fault: str | None = None  # simulator fault for image questions
    seed: int = 3

    def public(self) -> dict:
        return {
            "id": self.id,
            "kind": self.kind,
            "topic": self.topic,
            "difficulty": self.difficulty,
            "prompt_uz": self.prompt_uz,
            "options": [{"id": oid, "text_uz": text} for oid, text in self.options],
            "image": f"/quiz/{self.id}/image.png" if self.kind == "image" else None,
        }


def _image_q(qid: str, fault: str, difficulty: int, explanation: str, seed: int = 3) -> Question:
    return Question(
        id=qid,
        kind="image",
        topic="Artefaktlar",
        difficulty=difficulty,
        prompt_uz="Tasvirda ko‘rsatilgan artefakt turini aniqlang.",
        options=ARTIFACT_OPTIONS,
        answer=fault,
        explanation_uz=explanation,
        source=SRC_HSIEH,
        fault=fault,
        seed=seed,
    )


QUESTIONS: list[Question] = [
    Question(
        id="q01",
        kind="choice",
        topic="Artefaktlar",
        difficulty=1,
        prompt_uz="Uchinchi avlod KT’da markaz atrofida konsentrik halqalar paydo bo‘lishining eng asosiy sababi nima?",
        options=[
            ("a", "Bemorning tekshiruv vaqtida qimirlashi"),
            ("b", "Detektor elementi kalibrovkasining og‘ishi"),
            ("c", "Rentgen trubkasi filamentining eskirishi"),
            ("d", "Slip-ring kontaktlarida uchqun hosil bo‘lishi"),
        ],
        answer="b",
        explanation_uz="Bitta detektor elementi noto‘g‘ri kuchaytirsa, xato har bir burchakda bir xil radiusda takrorlanadi va qayta tiklashda halqa bo‘lib ko‘rinadi. Yechim — havo kalibrovkasi, kerak bo‘lsa modulni almashtirish.",
        source=SRC_HSIEH,
    ),
    _image_q(
        "q02",
        "ring",
        1,
        "Markazga nisbatan konsentrik aylanalar — detektor kanali xatosining klassik belgisi.",
    ),
    Question(
        id="q03",
        kind="choice",
        topic="Tasvir sifati",
        difficulty=2,
        prompt_uz="Boshqa sharoitlar o‘zgarmasa, KT tasviridagi kvant shovqinini kamaytirish uchun nima qilinadi?",
        options=[
            ("a", "mAs (trubka toki × vaqt) oshiriladi"),
            ("b", "Kesim qalinligi kamaytiriladi"),
            ("c", "Pitch oshiriladi"),
            ("d", "Keskinroq rekonstruksiya filtri tanlanadi"),
        ],
        answer="a",
        explanation_uz="Shovqin detektorga yetgan fotonlar soniga bog‘liq: mAs oshsa fotonlar ko‘payadi va shovqin taxminan 1/√mAs ga kamayadi. Yupqa kesim, yuqori pitch va keskin filtr shovqinni oshiradi. Ammo mAs oshishi bemor dozasini ham oshiradi.",
        source=SRC_HSIEH,
    ),
    _image_q(
        "q04",
        "noise",
        1,
        "Butun tasvir bo‘ylab bir tekis donadorlik — fotonlar kamligi (kvant shovqini). Trubka chiqishi va protokol parametrlari tekshiriladi.",
    ),
    Question(
        id="q05",
        kind="choice",
        topic="Nurlanish xavfsizligi",
        difficulty=1,
        prompt_uz="ALARA tamoyili nimani anglatadi?",
        options=[
            ("a", "Dozani oqilona erishiladigan darajada past saqlash"),
            ("b", "Har bir tekshiruvda maksimal tasvir sifatiga erishish"),
            ("c", "Tekshiruvni imkon qadar tez o‘tkazish"),
            ("d", "Faqat kattalar uchun dozani cheklash"),
        ],
        answer="a",
        explanation_uz="ALARA — As Low As Reasonably Achievable: diagnostik vazifani bajarish uchun yetarli bo‘lgan eng past dozani tanlash.",
        source=SRC_IAEA_RPOP,
    ),
    Question(
        id="q06",
        kind="choice",
        topic="Artefaktlar",
        difficulty=2,
        prompt_uz="Bir xil zichlikdagi fantomda markaz chetlarga qaraganda qorong‘iroq chiqmoqda (cupping). Bu qaysi fizik hodisa bilan bog‘liq?",
        options=[
            ("a", "Nur qattiqlashuvi (beam hardening)"),
            ("b", "Parsial hajm effekti"),
            ("c", "Aliasing"),
            ("d", "Kvant shovqini"),
        ],
        answer="a",
        explanation_uz="Polixromatik nur obyektdan o‘tganda yumshoq fotonlar ko‘proq yutiladi va nur ‘qattiqlashadi’. Uzun yo‘lda so‘nish kam baholanadi — markaz qorong‘i chiqadi. Nur qattiqlashuvi kalibrovkasi va bowtie filtri tekshiriladi.",
        source=SRC_HSIEH,
    ),
    _image_q(
        "q07",
        "motion",
        3,
        "Konturlar ikki qavat va siljigan — bemor skanerlash paytida qimirlagan. Bu uskuna nosozligi emas: bemor fiksatsiya qilinib, qayta skanerlanadi.",
    ),
    Question(
        id="q08",
        kind="choice",
        topic="Nurlanish xavfsizligi",
        difficulty=1,
        prompt_uz="Xodimni nurlanishdan himoya qilishning uchta asosiy tamoyili qaysi?",
        options=[
            ("a", "Vaqt, masofa, ekranlash"),
            ("b", "Kuchlanish, tok, vaqt"),
            ("c", "Filtr, kollimator, detektor"),
            ("d", "Harorat, namlik, bosim"),
        ],
        answer="a",
        explanation_uz="Nurlanish maydonida kamroq vaqt bo‘lish, manbadan uzoqroq turish (doza masofa kvadratiga teskari kamayadi) va himoya ekranlaridan foydalanish.",
        source=SRC_IAEA_BASICS,
    ),
    _image_q(
        "q09",
        "missing_views",
        2,
        "Bir yo‘nalishdagi chiziqlar — proyeksiyalarning bir qismi yo‘qolgan. Ma’lumot yig‘ish tizimi (DAS) va slip-ring ulanishlari tekshiriladi.",
    ),
    Question(
        id="q10",
        kind="choice",
        topic="Nosozlikni topish",
        difficulty=3,
        prompt_uz="Artefakt faqat bitta bemorda paydo bo‘ldi, undan oldingi va keyingi bemorlarda yo‘q. Birinchi navbatda nimani o‘ylash kerak?",
        options=[
            ("a", "Detektor modulini almashtirish kerak"),
            ("b", "Sabab bemor bilan bog‘liq (harakat, metall implant)"),
            ("c", "Rentgen trubkasi ishdan chiqqan"),
            ("d", "Gantry podshipnigi yeyilgan"),
        ],
        answer="b",
        explanation_uz="Uskuna nosozligi odatda barcha bemorlarda takrorlanadi. Faqat bitta bemorda bo‘lsa, avval bemor omillari tekshiriladi — keraksiz ta’mir va xarajatning oldi olinadi.",
        source=SRC_HSIEH,
    ),
]

QUESTIONS_BY_ID: dict[str, Question] = {q.id: q for q in QUESTIONS}
