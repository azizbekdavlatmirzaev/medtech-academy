import type { PartId } from "@/components/CtScanner";

export type Chapter = { at: number; title: string; text: string; part: PartId | null; xray: boolean };

export type Lesson = {
  id: string;
  module: number;
  moduleTitle: string;
  title: string;
  track: "Operator" | "Muhandis";
  level: string;
  terms: string[];
  chapters: Chapter[];
  duration: number; // seconds
};

export const LESSONS: Lesson[] = [
  {
    id: "kt-qanday-ishlaydi",
    module: 1,
    moduleTitle: "KT qanday ishlaydi",
    title: "KT uskunasining tuzilishi: gantrydan tasvirgacha",
    track: "Operator",
    level: "Boshlang‘ich",
    terms: ["Gantry", "Rentgen trubkasi", "Detektor", "Slip-ring", "Proyeksiya"],
    duration: 48,
    chapters: [
      { at: 0, title: "Gantry", text: "Gantry — KT ning aylanuvchi halqasi. Uning ichida rentgen trubkasi va detektor bir-biriga qarama-qarshi o‘rnatilgan.", part: "gantry", xray: false },
      { at: 8, title: "Rentgen trubkasi", text: "Trubka yuqori kuchlanish (kVp) va tok (mA) bilan rentgen nurini hosil qiladi. Nur bemor orqali yelpig‘ich shaklida o‘tadi.", part: "xray_tube", xray: true },
      { at: 16, title: "Bowtie filtri", text: "Filtr nurni tekislaydi: bemorning chetlariga kamroq doza tushadi va nur spektri barqarorlashadi.", part: "bowtie_filter", xray: true },
      { at: 24, title: "Detektor massivi", text: "Minglab detektor kanallari bemordan o‘tgan nurni o‘lchaydi. Har bir burchakdagi o‘lchov — bitta proyeksiya.", part: "detector", xray: true },
      { at: 32, title: "Slip-ring va DAS", text: "Gantry to‘xtovsiz aylanadi: slip-ring quvvat va ma’lumotni aylanayotgan qismdan uzatadi, DAS signalni raqamga aylantiradi.", part: "das_slip_ring", xray: true },
      { at: 40, title: "Bemor stoli", text: "Stol bemorni gantry ichiga aniq siljitadi. Proyeksiyalardan kompyuter kesim tasvirini tiklaydi.", part: "table", xray: false },
    ],
  },
  {
    id: "halqa-artefakti",
    module: 4,
    moduleTitle: "Artefaktlar va diagnostika",
    title: "Halqa artefakti: detektor kalibrovkasi",
    track: "Muhandis",
    level: "O‘rta",
    terms: ["Halqa artefakti", "Gain drift", "Havo kalibrovkasi", "Suv fantomi"],
    duration: 40,
    chapters: [
      { at: 0, title: "Belgi", text: "Barcha bemorlarda markaz atrofida bir xil radiusli konsentrik halqalar — klassik halqa artefakti.", part: null, xray: true },
      { at: 8, title: "Fizika", text: "Bitta detektor kanali noto‘g‘ri kuchaytirsa, xato har bir burchakda bir xil masofada takrorlanadi va qayta tiklashda aylana chizadi.", part: "detector", xray: true },
      { at: 18, title: "Tekshiruv", text: "Suv fantomi skanerlanadi, detektor harorati va xona sovutish tizimi jurnali ko‘riladi.", part: "detector", xray: true },
      { at: 28, title: "Yechim", text: "Havo kalibrovkasi (air calibration) o‘tkaziladi. Halqa qolsa, nosoz detektor moduli almashtiriladi.", part: "detector", xray: true },
    ],
  },
  {
    id: "nurlanish-xavfsizligi",
    module: 3,
    moduleTitle: "Nurlanish xavfsizligi",
    title: "ALARA: dozani oqilona past saqlash",
    track: "Operator",
    level: "Boshlang‘ich",
    terms: ["ALARA", "mAs", "Vaqt · masofa · ekranlash", "Kollimatsiya"],
    duration: 32,
    chapters: [
      { at: 0, title: "ALARA", text: "ALARA — diagnostik vazifa uchun yetarli bo‘lgan eng past dozani tanlash tamoyili.", part: null, xray: false },
      { at: 8, title: "Parametrlar", text: "mAs oshsa shovqin kamayadi, lekin doza oshadi. Protokol bemor yoshi va vazniga moslanadi.", part: "xray_tube", xray: true },
      { at: 16, title: "Xodim himoyasi", text: "Vaqt, masofa, ekranlash: nurlanish zonasida kam bo‘lish, manbadan uzoq turish, himoya ekranidan foydalanish.", part: "gantry", xray: false },
      { at: 24, title: "Bemor joylashuvi", text: "Bemor gantry markazida to‘g‘ri joylashtirilsa, bowtie filtri to‘g‘ri ishlaydi va ortiqcha doza tushmaydi.", part: "table", xray: false },
    ],
  },
];

export const MODULES = [
  { n: 1, title: "KT qanday ishlaydi" },
  { n: 2, title: "Bemorni joylashtirish" },
  { n: 3, title: "Nurlanish xavfsizligi" },
  { n: 4, title: "Artefaktlar va diagnostika" },
  { n: 5, title: "Nosozlikni topish" },
];
