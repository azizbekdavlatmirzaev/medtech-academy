"""Emergency drills: smoke, fire, sparks and overheating in the CT room.

Each drill is a short sequence of decisions. Answers are checked on the
server; some wrong options are critical (they endanger people) and are
flagged as such. Procedures follow general fire-safety practice for
electrical medical equipment (RACE: Rescue, Alarm, Contain, Extinguish) and
must be adapted to the hospital's own emergency plan.
"""

from dataclasses import dataclass

SOURCE = "Umumiy yong‘in xavfsizligi tartibi (RACE) va tibbiy elektr uskunalar bo‘yicha xavfsizlik qoidalari; muassasa favqulodda rejasi ustuvor."


@dataclass(frozen=True)
class Option:
    id: str
    text_uz: str
    critical: bool = False  # choosing it would put people in danger


@dataclass(frozen=True)
class Step:
    prompt_uz: str
    options: tuple[Option, ...]
    answer: str
    explanation_uz: str


@dataclass(frozen=True)
class Drill:
    id: str
    title_uz: str
    situation_uz: str
    effect: str  # "smoke" | "fire" | "sparks" | "overheat"
    part: str  # 3D part where the effect appears
    steps: tuple[Step, ...]

    def public(self) -> dict:
        return {
            "id": self.id,
            "title_uz": self.title_uz,
            "situation_uz": self.situation_uz,
            "effect": self.effect,
            "part": self.part,
            "steps": [
                {"prompt_uz": s.prompt_uz, "options": [{"id": o.id, "text_uz": o.text_uz} for o in s.options]} for s in self.steps
            ],
        }


EMERGENCY_STOP = Option("stop", "Favqulodda to‘xtatish (Emergency Stop) tugmasini bosish")

DRILLS: list[Drill] = [
    Drill(
        id="tutun-trubka",
        title_uz="Skanerlash paytida tutun",
        situation_uz="Bemor skanerlanmoqda. To‘satdan gantry ichidan tutun chiqa boshladi, kuygan izolyatsiya hidi kelmoqda.",
        effect="smoke",
        part="xray_tube",
        steps=(
            Step(
                "Birinchi harakatingiz?",
                (
                    Option("finish", "Skanerlash tugashini kutish — bir necha soniya qoldi"),
                    EMERGENCY_STOP,
                    Option("water", "Gantryga suv sepish", critical=True),
                    Option("leave", "Xonadan chiqib, eshikni yopish va kutish"),
                ),
                "stop",
                "Birinchi navbatda nurlanish va aylanish to‘xtatiladi: Emergency Stop tugmasi quvvatni darhol uzadi. Suv tok urishiga olib keladi.",
            ),
            Step(
                "Bemor bilan nima qilasiz?",
                (
                    Option("evacuate", "Bemorni stoldan tushirib, xavfsiz joyga olib chiqish"),
                    Option("wait", "Bemorni stolda qoldirib, muhandisni chaqirish", critical=True),
                    Option("push", "Stolni gantry ichiga surib qo‘yish", critical=True),
                ),
                "evacuate",
                "Odam xavfsizligi uskunadan muhim: bemor darhol tutundan uzoqlashtiriladi. Stol qo‘lda chiqariladi (Emergency Stop’dan keyin qo‘lda chiqarish rejimi).",
            ),
            Step(
                "Keyingi qadam?",
                (
                    Option("report", "Asosiy uzgichdan tokni uzish, xonani ventilyatsiya qilish va servisga xabar berish"),
                    Option("restart", "Uskunani qayta yoqib, tutun yana chiqadimi — tekshirish", critical=True),
                    Option("next", "Keyingi bemorni boshqa protokol bilan skanerlash"),
                ),
                "report",
                "Uskuna vakolatli muhandis tekshirmaguncha qayta yoqilmaydi. Hodisa jurnalga yoziladi.",
            ),
        ),
    ),
    Drill(
        id="yongin-kabel",
        title_uz="Stol ostida olov",
        situation_uz="Bemor stolining ostidagi kabel ulanishidan olov chiqdi. Xonada bemor bor.",
        effect="fire",
        part="table",
        steps=(
            Step(
                "Birinchi harakatingiz?",
                (
                    Option("rescue", "Emergency Stop’ni bosib, bemorni xonadan olib chiqish"),
                    Option("extinguish", "Avval olovni o‘chirishga urinish, bemor keyin"),
                    Option("save", "Uskunani saqlab qolish uchun kabelni qo‘l bilan tortib uzish", critical=True),
                ),
                "rescue",
                "RACE tartibi: avval Rescue — odamlarni qutqarish. Tokni Emergency Stop orqali uzing, yonayotgan kabelga qo‘l tekkizmang.",
            ),
            Step(
                "Signal berish?",
                (
                    Option("alarm", "Yong‘in signalini yoqish va 101 ga qo‘ng‘iroq qilish, xona eshigini yopish"),
                    Option("quiet", "Bemorlarni vahimaga solmaslik uchun hech kimga aytmaslik", critical=True),
                    Option("later", "Olov o‘chgandan keyin rahbarga xabar berish"),
                ),
                "alarm",
                "Alarm va Contain: signal beriladi, yong‘in xizmati chaqiriladi, eshik yopilib olov tarqalishi cheklanadi.",
            ),
            Step(
                "Olovni nima bilan o‘chirish mumkin (xavfsiz bo‘lsa)?",
                (
                    Option("co2", "Karbonat angidrid (CO₂) o‘t o‘chirgich"),
                    Option("water", "Suv", critical=True),
                    Option("foam", "Suvli ko‘pikli o‘t o‘chirgich", critical=True),
                    Option("blanket", "Bemorning choyshabi"),
                ),
                "co2",
                "Tok ostidagi elektr uskunani faqat CO₂ (yoki elektr uchun mo‘ljallangan kukunli) o‘t o‘chirgich bilan o‘chiriladi. Suv va suvli ko‘pik tok o‘tkazadi.",
            ),
        ),
    ),
    Drill(
        id="uchqun-slipring",
        title_uz="Gantry orqasidan uchqun",
        situation_uz="Gantry aylanayotganda orqa qopqoq ortidan uchqun va chirsillagan ovoz chiqmoqda; jurnalda aloqa uzilishi xatolari.",
        effect="sparks",
        part="das_slip_ring",
        steps=(
            Step(
                "Birinchi harakatingiz?",
                (
                    EMERGENCY_STOP,
                    Option("open", "Qopqoqni ochib, uchqun qayerdanligini ko‘rish", critical=True),
                    Option("continue", "Skanerlashni davom ettirish — tasvir baribir chiqyapti"),
                ),
                "stop",
                "Uchqun — elektr yoyi belgisi. Avval aylanish va quvvat to‘xtatiladi; tok ostidagi qopqoq ochilmaydi.",
            ),
            Step(
                "Uskunani qanday qoldirasiz?",
                (
                    Option("lockout", "Tokni uzib, “Ta’mirda — yoqilmasin” belgisini osish (lockout/tagout)"),
                    Option("off", "Shunchaki o‘chirib qo‘yish, ertalab ko‘ramiz"),
                    Option("sign", "Faqat eshikka “Ishlamaydi” deb yozish"),
                ),
                "lockout",
                "Lockout/tagout: uskunani kimdir bilmasdan qayta yoqib yubormasligi uchun quvvat bloklanadi va belgi osiladi.",
            ),
            Step(
                "Kim tuzatadi?",
                (
                    Option("engineer", "Vakolatli servis muhandisi slip-ring cho‘tkalari va kontaktlarini tekshiradi"),
                    Option("operator", "Operator o‘zi qopqoqni ochib, cho‘tkalarni tozalaydi", critical=True),
                    Option("nobody", "Uchqun to‘xtasa, ta’mir shart emas"),
                ),
                "engineer",
                "Yuqori kuchlanishli qismlarga faqat o‘qitilgan va ruxsati bor muhandis tegadi. Ta’mirdan keyin xavfsizlik tekshiruvi o‘tkaziladi.",
            ),
        ),
    ),
    Drill(
        id="qizib-trubka",
        title_uz="Rentgen trubkasi qizib ketdi",
        situation_uz="Ketma-ket uzun protokollardan keyin konsolda “Tube overheat” ogohlantirishi chiqdi, gantry yonida issiq havo va hid.",
        effect="overheat",
        part="xray_tube",
        steps=(
            Step(
                "Birinchi harakatingiz?",
                (
                    Option("cool", "Skanerlashni to‘xtatib, trubka issiqlik yuki (heat units) pasayishini kutish"),
                    Option("override", "Ogohlantirishni o‘chirib, protokolni takrorlash", critical=True),
                    Option("lower", "kVp ni pasaytirib, darhol davom ettirish"),
                ),
                "cool",
                "Qizib ketgan trubkaga qo‘shimcha yuk berish uni ishdan chiqaradi va yong‘in xavfini oshiradi. Konsoldagi issiqlik monitori me’yorga qaytishini kuting.",
            ),
            Step(
                "Nimani tekshirasiz?",
                (
                    Option("cooling", "Sovutish tizimi (ventilyator, moy/suv aylanishi) ishlayotganini va xona haroratini"),
                    Option("image", "Faqat oxirgi tasvir sifatini"),
                    Option("nothing", "Hech narsa — ogohlantirish o‘zi yo‘qoladi"),
                ),
                "cooling",
                "Qizib ketishning ko‘p sababi — sovutish tizimi nosozligi yoki xona sovutishining o‘chishi.",
            ),
            Step(
                "Sovutish ishlamayotgan bo‘lsa?",
                (
                    Option("stop_service", "Uskunani ishlatmaslik va servisga xabar berish; bemorlarni boshqa uskunaga yo‘naltirish"),
                    Option("short", "Faqat qisqa protokollar bilan ishlashni davom ettirish"),
                    Option("fan", "Uy ventilyatorini gantry yoniga qo‘yib ishlash"),
                ),
                "stop_service",
                "Sovutish tiklanmaguncha uskuna ishlatilmaydi; bemorlar navbati boshqa KT ga o‘tkaziladi.",
            ),
        ),
    ),
]

DRILLS_BY_ID: dict[str, Drill] = {d.id: d for d in DRILLS}
