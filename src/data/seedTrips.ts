import type { Stay, TripData } from "../types";

/** Demo trips, transcribed from the original prototype. Used only by the
 *  optional `npm run seed` script — never loaded by the running app. */
export type SeedTrip = Omit<TripData, "ownerId">;

const granvia: Stay = {
  name: "Hotel Granvia Kyoto",
  localName: "ホテルグランヴィア京都",
  desc: "Above Kyoto Station — easy & step-free",
  address: "JR Kyoto Station, Shiokoji-dori, Shimogyo-ku",
  phone: "+81 75-344-8888",
};

const avenida: Stay = {
  name: "Hotel Avenida Palace",
  localName: "Hotel Avenida Palace",
  desc: "Central, near the old town",
  address: "Rua 1º de Dezembro 123, Lisboa",
  phone: "+351 21 321 8100",
};

const anantara: Stay = {
  name: "Anantara Hoi An Resort",
  localName: "Anantara Hội An Resort",
  desc: "Riverside garden resort",
  address: "1 Pham Hong Thai, Hội An",
  phone: "+84 235 3914 555",
};

const kyoto: SeedTrip = {
  title: "Mum & Dad's Kyoto Trip",
  dest: "Kyoto",
  country: "Japan",
  cover: "#C2541F",
  visibility: "public",
  password: "kyoto",
  published: true,
  nativeLang: { code: "ja", label: "日本語" },
  currency: { code: "JPY", symbol: "¥", home: "AUD", homeSymbol: "A$", perHome: 98 },
  hotel: granvia,
  contacts: [
    { label: "Police", value: "110", kind: "emergency" },
    { label: "Ambulance & Fire", value: "119", kind: "emergency" },
    { label: "Emma (daughter)", value: "+81 80-1234-5678", kind: "family" },
    { label: "Hotel front desk", value: "+81 75-344-8888", kind: "hotel" },
    { label: "Australian Embassy, Tokyo", value: "+81 3-5232-4111", kind: "embassy" },
  ],
  phrases: [
    { en: "Hello", local: "Konnichiwa", pron: "kon-nee-chee-wah" },
    { en: "Thank you", local: "Arigatō", pron: "ah-ree-gah-toh" },
    { en: "Where is the toilet?", local: "Toire wa doko desu ka?", pron: "toy-reh wah doh-koh" },
  ],
  days: [
    {
      date: "2026-06-24",
      theme: "Arrival in Kyoto",
      weather: "26°",
      stay: granvia,
      flights: [{ time: "14:05", flightNo: "QF61", from: "Sydney (SYD)", to: "Osaka (KIX)", kind: "arrival" }],
      items: [
        { kind: "stay", time: "17:30", title: "Check in — Hotel Granvia", local: "ホテルグランヴィア京都にチェックイン", place: "Above Kyoto Station", tag: "Hotel", note: "Your room is on the 12th floor with a city view. Check-in is on the 3rd-floor lobby.", cost: "", tip: "Have your passport ready at the desk." },
        { kind: "meal", time: "19:00", title: "Dinner at Nishiki Market", local: "錦市場で夕食", place: "Short, easy walk", tag: "Dinner", note: "Try the tamagoyaki (sweet omelette) and grilled skewers. Plenty of small stalls — take your time and share.", cost: "≈ ¥2,000", tip: "" },
      ],
    },
    {
      date: "2026-06-25",
      theme: "Eastern Kyoto",
      weather: "28°",
      stay: granvia,
      flights: [],
      items: [
        { kind: "attraction", time: "09:00", title: "Kiyomizu-dera Temple", local: "清水寺", place: "Hilltop wooden temple", tag: "Temple", note: "A beautiful temple with views over the city from its wooden stage. There are some gentle slopes.", cost: "¥500", tip: "Wear comfortable shoes." },
        { kind: "meal", time: "12:30", title: "Lunch — Okonomiyaki", local: "お好み焼き（昼食）", place: "Near Yasaka Shrine", tag: "Lunch", note: "Savoury pancakes cooked at your table.", cost: "≈ ¥1,800", tip: "" },
        { kind: "attraction", time: "14:30", title: "Stroll through Gion", local: "祇園を散策", place: "Old geisha district", tag: "Walk", note: "Flat, easy lanes with traditional wooden houses. You may spot a geiko in the early evening.", cost: "Free", tip: "" },
        { kind: "meal", time: "18:30", title: "Dinner at Pontocho Alley", local: "先斗町で夕食", place: "Riverside lanterns", tag: "Dinner", note: "A narrow lane of restaurants beside the river.", cost: "≈ ¥4,000", tip: 'Reservation under "Emma" at 6:30.' },
      ],
    },
    {
      date: "2026-06-26",
      theme: "Arashiyama",
      weather: "29°",
      stay: granvia,
      flights: [],
      items: [
        { kind: "attraction", time: "09:30", title: "Bamboo Grove walk", local: "竹林の小径", place: "Famous tall bamboo path", tag: "Walk", note: "A flat, gentle 15-minute walk through towering bamboo. Best in the morning before the crowds.", cost: "Free", tip: "Benches along the way to rest." },
        { kind: "attraction", time: "11:00", title: "Tenryu-ji Temple garden", local: "天龍寺庭園", place: "Zen garden & pond", tag: "Temple", note: "A peaceful garden you can enjoy at a slow pace, with seats by the pond.", cost: "¥500", tip: "" },
        { kind: "meal", time: "13:00", title: "Lunch — Yudofu by the river", local: "湯豆腐（昼食）", place: "Warm tofu hot pot", tag: "Lunch", note: "A Kyoto speciality — gentle, warm tofu served by the water.", cost: "≈ ¥2,500", tip: "" },
        { kind: "attraction", time: "15:00", title: "Iwatayama Monkey Park", local: "嵐山モンキーパーク", place: "Hilltop views (optional)", tag: "Nature", note: "A 20-minute uphill walk to see wild monkeys and a view over Kyoto.", cost: "¥600", tip: "Optional — only if you feel up to it. Otherwise rest by the river." },
        { kind: "meal", time: "19:00", title: "Kaiseki dinner — Kikunoi Roan", local: "菊乃井 露庵（懐石）", place: "Special set dinner", tag: "Dinner", note: "A multi-course seasonal dinner. Relaxed and unhurried.", cost: "¥8,000", tip: 'Reservation under "Emma" at 7:00 sharp.' },
      ],
    },
    {
      date: "2026-06-27",
      theme: "Fushimi & Tea",
      weather: "30°",
      stay: granvia,
      flights: [],
      items: [
        { kind: "attraction", time: "08:30", title: "Fushimi Inari Shrine", local: "伏見稲荷大社", place: "Thousands of red gates", tag: "Shrine", note: "Walk through the famous red torii gates. You can go as far as feels comfortable and turn back.", cost: "Free", tip: "Go early to beat the heat." },
        { kind: "meal", time: "12:00", title: "Lunch — Udon noodles", local: "うどん（昼食）", place: "Near the shrine", tag: "Lunch", note: "Warm, comforting noodle soup.", cost: "≈ ¥1,500", tip: "" },
        { kind: "attraction", time: "15:00", title: "Uji matcha tasting", local: "宇治抹茶の試飲", place: "Famous green-tea town", tag: "Tea", note: "A short train ride to Uji for a relaxed matcha tasting.", cost: "¥1,200", tip: "" },
      ],
    },
    {
      date: "2026-06-28",
      theme: "Golden Pavilion",
      weather: "27°",
      stay: granvia,
      flights: [],
      items: [
        { kind: "attraction", time: "09:00", title: "Kinkaku-ji (Golden Pavilion)", local: "金閣寺", place: "Gold temple on a lake", tag: "Temple", note: "The golden temple reflected in the pond — a flat, easy path loops around it.", cost: "¥500", tip: "" },
        { kind: "attraction", time: "11:30", title: "Ryoan-ji rock garden", local: "龍安寺 石庭", place: "Peaceful zen garden", tag: "Garden", note: "Sit quietly and enjoy the famous raked-stone garden.", cost: "¥500", tip: "" },
        { kind: "meal", time: "13:30", title: "Lunch — Soba noodles", local: "そば（昼食）", place: "Light and cool", tag: "Lunch", note: "Cold buckwheat noodles, perfect for a warm day.", cost: "≈ ¥1,400", tip: "" },
        { kind: "attraction", time: "16:00", title: "Rest & tea at the hotel", local: "ホテルで休憩", place: "Take it easy", tag: "Rest", note: "A free afternoon to relax before your last day.", cost: "", tip: "" },
      ],
    },
    {
      date: "2026-06-29",
      theme: "Departure",
      weather: "26°",
      stay: granvia,
      flights: [{ time: "16:30", flightNo: "QF62", from: "Osaka (KIX)", to: "Sydney (SYD)", kind: "departure" }],
      items: [
        { kind: "stay", time: "10:00", title: "Check out", local: "チェックアウト", place: "Leave luggage at the desk", tag: "Hotel", note: "The front desk can hold your bags if you want a last look around.", cost: "", tip: "" },
        { kind: "attraction", time: "11:00", title: "Last shopping", local: "京都駅でお買い物", place: "Kyoto Station shops", tag: "Shopping", note: "Pick up gifts and snacks at the station before you leave.", cost: "", tip: "" },
      ],
    },
  ],
};

const lisbon: SeedTrip = {
  title: "Lisbon with the Grandkids",
  dest: "Lisbon",
  country: "Portugal",
  cover: "#2F7D5B",
  visibility: "private",
  password: "pastel",
  published: false,
  nativeLang: { code: "pt", label: "Português" },
  currency: { code: "EUR", symbol: "€", home: "AUD", homeSymbol: "A$", perHome: 0.61 },
  hotel: avenida,
  contacts: [
    { label: "Emergency (EU)", value: "112", kind: "emergency" },
    { label: "Hotel front desk", value: "+351 21 321 8100", kind: "hotel" },
  ],
  phrases: [
    { en: "Hello", local: "Olá", pron: "oh-lah" },
    { en: "Thank you", local: "Obrigado", pron: "oh-bree-gah-doo" },
  ],
  days: [
    {
      date: "2026-08-10",
      theme: "Alfama & trams",
      weather: "29°",
      stay: avenida,
      flights: [{ time: "11:30", flightNo: "TP24", from: "Sydney (SYD)", to: "Lisbon (LIS)", kind: "arrival" }],
      items: [{ kind: "attraction", time: "16:00", title: "Tram 28 ride", local: "Passeio no Elétrico 28", place: "Through the old town", tag: "Walk", note: "", cost: "", tip: "" }],
    },
    {
      date: "2026-08-11",
      theme: "Belém",
      weather: "30°",
      stay: avenida,
      flights: [],
      items: [
        { kind: "meal", time: "10:00", title: "Pastéis de Belém", local: "Pastéis de Belém", place: "Famous custard tarts", tag: "Treat", note: "", cost: "", tip: "" },
        { kind: "attraction", time: "12:00", title: "Belém Tower", local: "Torre de Belém", place: "Riverside landmark", tag: "Sight", note: "", cost: "", tip: "" },
      ],
    },
  ],
};

const hoian: SeedTrip = {
  title: "Hội An Getaway",
  dest: "Hội An",
  country: "Vietnam",
  cover: "#7A5AA6",
  visibility: "public",
  password: "lantern",
  published: true,
  nativeLang: { code: "vi", label: "Tiếng Việt" },
  currency: { code: "VND", symbol: "₫", home: "AUD", homeSymbol: "A$", perHome: 16500 },
  hotel: anantara,
  contacts: [
    { label: "Emergency", value: "113", kind: "emergency" },
    { label: "Resort desk", value: "+84 235 3914 555", kind: "hotel" },
  ],
  phrases: [
    { en: "Hello", local: "Xin chào", pron: "sin chow" },
    { en: "Thank you", local: "Cảm ơn", pron: "gam un" },
  ],
  days: [
    {
      date: "2026-09-05",
      theme: "Old Town lanterns",
      weather: "31°",
      stay: anantara,
      flights: [{ time: "13:20", flightNo: "VN960", from: "Sydney (SYD)", to: "Da Nang (DAD)", kind: "arrival" }],
      items: [
        { kind: "attraction", time: "17:00", title: "Lantern-lit Old Town", local: "Phố cổ đèn lồng", place: "Evening stroll", tag: "Walk", note: "", cost: "", tip: "" },
        { kind: "meal", time: "19:00", title: "Riverside dinner", local: "Bữa tối bên sông", place: "Local cao lầu", tag: "Dinner", note: "", cost: "", tip: "" },
      ],
    },
  ],
};

export const seedTrips: SeedTrip[] = [kyoto, lisbon, hoian];
