import type { Stay } from "../../types";
import { zh } from "./zh";

/**
 * The five bases, each with its own nights. The nights model is
 * `checkIn <= date < checkOut`, so Munich 1-4 Sep is the nights of the 1st,
 * 2nd and 3rd; the 4th is the drive to Ortisei.
 *
 * `city` + `location` place each base on the traveler map (city centres, not
 * the hotel door — the exact hotels are still to be booked).
 */

export const moxyMunichMesse: Stay = {
  name: "Moxy Munich Messe",
  desc: "Out in Riem. Flat ground, with the Riem Arcaden mall and Riemer Park next door.",
  address: "Messestadt Riem, Munich",
  city: "Munich",
  location: { lat: 48.1374, lng: 11.5755 },
  note: "Two rooms at about €65 a night, paid in cash. We only book this if the hotel confirms by email that a family room takes a cot. If not, the backup is the family room at Jugendherberge München Park in Thalkirchen (next to the zoo, about €150 a night), or an A&O München family room. Ask for early check-in, since we land at 7am on 1 Sep.",
  checkIn: "2027-09-01",
  checkOut: "2027-09-04",
  t: zh({
    name: "慕尼黑展览中心 Moxy 酒店",
    desc: "在 Riem 区。地方平坦，隔壁就是 Riem Arcaden 购物中心和 Riemer 公园。",
    note: "两间房，每晚大约 65 欧元，付现金。要等酒店邮件确认家庭房可以放婴儿床才订。不行的话，备选是 Thalkirchen 的慕尼黑公园青年旅舍家庭房（就在动物园旁边，每晚约 150 欧元），或者 A&O 慕尼黑的家庭房。9 月 1 日早上 7 点落地，记得申请提前入住。",
  }),
};

export const ortiseiApartment: Stay = {
  name: "Ortisei apartment (Val Gardena)",
  desc: "Sleeps five, with a proper kitchen so we can do our own breakfasts and dinners.",
  address: "Ortisei / St. Ulrich, Val Gardena",
  city: "Ortisei",
  location: { lat: 46.5747, lng: 11.6713 },
  note: "Either the Roter Hahn farm stay or Apartments Stina, from about €178 a night in cash. Email the host directly rather than booking through a site. The Val Gardena guest card comes with the stay.",
  checkIn: "2027-09-04",
  checkOut: "2027-09-07",
  t: zh({
    name: "奥蒂塞伊公寓（加尔代纳山谷）",
    desc: "住五个人，有正规厨房，早餐和晚餐可以自己做。",
    note: "Roter Hahn 农庄民宿或 Apartments Stina 两家选一家，每晚大约 178 欧元起，付现金。直接发邮件给房东订，不走订房网站。入住会送加尔代纳山谷宾客卡。",
  }),
};

export const fourPointsLjubljana: Stay = {
  name: "Four Points by Sheraton Ljubljana Mons",
  desc: "Free parking, and Bled is 40 minutes away.",
  address: "Pot za Brdom 4, Ljubljana",
  city: "Ljubljana",
  location: { lat: 46.0569, lng: 14.5058 },
  note: "Two rooms for five nights on 208k Marriott points (104k a room, the fifth night is free). Check that a cot fits in a standard room. Grandparents take the second room. Worth re-checking the points price each month and rebooking if it drops.",
  checkIn: "2027-09-07",
  checkOut: "2027-09-12",
  t: zh({
    name: "卢布尔雅那 Mons 福朋喜来登酒店",
    desc: "免费停车，到布莱德湖 40 分钟。",
    note: "两间房住五晚，用 20.8 万万豪积分（每间 10.4 万分，第五晚免费）。要确认标准房放得下婴儿床。祖父母住第二间。每个月再查一次积分价，降了就重新订。",
  }),
};

export const zellApartment: Stay = {
  name: "Zell am See apartment",
  desc: "Sleeps five, has a kitchen, and the Summer Card is included.",
  address: "Zell am See / Kaprun",
  city: "Zell am See",
  location: { lat: 47.3226, lng: 12.7948 },
  note: "Get quotes from Apartment Zell City (100 m from the CityXpress lift), Bergliebe Kaprun Top 2 and Haus Wilhelmina. We are aiming for €150 to 200 a night in cash. It has to be a Summer Card partner, because the card covers the Schmittenhöhe lift, the Kaprun reservoirs and the lake boat. The card starts working at 3pm on the day we arrive.",
  checkIn: "2027-09-12",
  checkOut: "2027-09-15",
  t: zh({
    name: "采尔湖公寓",
    desc: "住五个人，有厨房，含夏季卡。",
    note: "向 Apartment Zell City（离 CityXpress 缆车 100 米）、Bergliebe Kaprun Top 2 和 Haus Wilhelmina 三家问价。目标是每晚 150 到 200 欧元，付现金。一定要选夏季卡合作的房东，因为夏季卡包了施米滕山缆车、卡普伦高山水库和湖上游船。夏季卡从我们到的那天下午 3 点开始能用。",
  }),
};

export const jufaSalzburg: Stay = {
  name: "JUFA Hotel Salzburg City",
  desc: "Family room with breakfast included and parking at the hotel.",
  address: "Josef-Preis-Allee 18, Salzburg",
  city: "Salzburg",
  location: { lat: 47.8095, lng: 13.055 },
  note: "About €170 to 220 a night in cash. Before booking, compare it with an apartment that has parking in Anif or Grödig, near Hellbrunn.",
  checkIn: "2027-09-15",
  checkOut: "2027-09-18",
  t: zh({
    name: "萨尔茨堡城市 JUFA 酒店",
    desc: "家庭房，含早餐，酒店里能停车。",
    note: "每晚大约 170 到 220 欧元，付现金。订之前先和 Anif 或 Grödig（海尔布伦宫附近）带停车位的公寓比一比价。",
  }),
};

export const stays: Stay[] = [
  moxyMunichMesse,
  ortiseiApartment,
  fourPointsLjubljana,
  zellApartment,
  jufaSalzburg,
];
