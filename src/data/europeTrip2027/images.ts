import type { Day, Item } from "../../types";

/**
 * Cover photos for the sightseeing items, keyed by the item's `date|time`.
 *
 * All are Wikimedia Commons thumbnails (960 px wide), picked by hand from each
 * place's Wikipedia lead image or a Commons search, so every URL is freely
 * licensed, hotlinkable and stable. Rest, meal, transfer and packing items
 * carry no photo on purpose.
 */
export const ITEM_IMAGES: Record<string, string> = {
  // Munich
  "2027-09-01|11:00":
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/72/Riemer_See_20260716_153203.jpg/960px-Riemer_See_20260716_153203.jpg",
  "2027-09-02|09:30":
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/14/Deutsches_Museum_Portrait_4.jpg/960px-Deutsches_Museum_Portrait_4.jpg",
  "2027-09-02|16:00":
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/da/Frauenkirche_Munich_-_View_from_Peterskirche_Tower2.jpg/960px-Frauenkirche_Munich_-_View_from_Peterskirche_Tower2.jpg",
  "2027-09-02|16:30":
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ef/Viktualienmarkt_2016.jpg/960px-Viktualienmarkt_2016.jpg",
  "2027-09-03|09:30":
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f6/Hellabrunn_Elefantenhaus_2016.jpg/960px-Hellabrunn_Elefantenhaus_2016.jpg",
  // Dolomites
  "2027-09-04|12:00":
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/44/IA_Hofgarten_A.jpg/960px-IA_Hofgarten_A.jpg",
  "2027-09-04|14:00":
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4e/Sterzing-Zwoelferturm2.jpg/960px-Sterzing-Zwoelferturm2.jpg",
  "2027-09-05|09:00":
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5f/Saslonch_udu_da_Mont_de_Seuc.jpg/960px-Saslonch_udu_da_Mont_de_Seuc.jpg",
  "2027-09-06|08:30":
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a1/Odle%2C_Puez_and_Sella_groups_from_Seceda%2C_South_Tyrol_-_panorama.jpg/960px-Odle%2C_Puez_and_Sella_groups_from_Seceda%2C_South_Tyrol_-_panorama.jpg",
  "2027-09-06|14:00":
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3c/Rittnerbahn_01.jpg/960px-Rittnerbahn_01.jpg",
  "2027-09-07|08:30":
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/33/I-Bruneck_008.jpg/960px-I-Bruneck_008.jpg",
  "2027-09-07|12:00":
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/56/20190626.Lienz.-011.jpg/960px-20190626.Lienz.-011.jpg",
  "2027-09-07|15:30":
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/84/Lake_Bled_from_the_Mountain.jpg/960px-Lake_Bled_from_the_Mountain.jpg",
  // Slovenia
  "2027-09-08|10:30":
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/67/Ljubljanski_grad_in_Grajski_gri%C4%8D.jpg/960px-Ljubljanski_grad_in_Grajski_gri%C4%8D.jpg",
  "2027-09-08|15:30":
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0b/Ljubljana_%28322%29_%283896844335%29.jpg/960px-Ljubljana_%28322%29_%283896844335%29.jpg",
  "2027-09-09|09:30":
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2b/Pletna_in_Bled_2004.jpg/960px-Pletna_in_Bled_2004.jpg",
  "2027-09-09|11:30":
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b8/The_Great_Bled_Castle.jpg/960px-The_Great_Bled_Castle.jpg",
  "2027-09-09|15:00":
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6b/Slovenia_-_Waterfall_Sum_-_Vintgar_Klamm_%2843686688490%29.jpg/960px-Slovenia_-_Waterfall_Sum_-_Vintgar_Klamm_%2843686688490%29.jpg",
  "2027-09-10|10:00":
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/74/Postojna_%2822206343750%29.jpg/960px-Postojna_%2822206343750%29.jpg",
  "2027-09-10|14:00":
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0e/H%C3%B6hlenburg_Predjama_in_Slovenien.jpg/960px-H%C3%B6hlenburg_Predjama_in_Slovenien.jpg",
  "2027-09-11|10:00":
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1c/Lipica_stud_farm_1.JPG/960px-Lipica_stud_farm_1.JPG",
  // Austrian Alps
  "2027-09-12|10:00":
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/aa/Railjet_793_bei_Bad_Hofgastein.jpg/960px-Railjet_793_bei_Bad_Hofgastein.jpg",
  "2027-09-12|11:00":
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/29/Tauernsouthportal.jpg/960px-Tauernsouthportal.jpg",
  "2027-09-12|16:00":
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6e/Zell_am_See.Wiki.jpeg/960px-Zell_am_See.Wiki.jpeg",
  "2027-09-13|09:00":
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/76/Schmittenh%C3%B6he_-_Gipfel.JPG/960px-Schmittenh%C3%B6he_-_Gipfel.JPG",
  "2027-09-13|15:30":
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/60/Kaprun_-_Stausee_Mooserboden_mit_Denkmal.JPG/960px-Kaprun_-_Stausee_Mooserboden_mit_Denkmal.JPG",
  "2027-09-14|08:00":
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3c/Grossglockner_road.jpg/960px-Grossglockner_road.jpg",
  "2027-09-14|10:30":
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/57/20210901.Kaiser-Franz-Joseph-H%C3%B6he%2C_Grossglockner.-013.jpg/960px-20210901.Kaiser-Franz-Joseph-H%C3%B6he%2C_Grossglockner.-013.jpg",
  "2027-09-14|13:30":
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9d/Gro%C3%9Fglockner_Hochalpenstra%C3%9Fe_Gro%C3%9Fglocknerblick.jpg/960px-Gro%C3%9Fglockner_Hochalpenstra%C3%9Fe_Gro%C3%9Fglocknerblick.jpg",
  "2027-09-15|11:00":
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/25/Hellbrunn2.JPG/960px-Hellbrunn2.JPG",
  // Salzburg
  "2027-09-16|09:30":
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/dd/Salzburg_-_Festung_Hohensalzburg.JPG/960px-Salzburg_-_Festung_Hohensalzburg.JPG",
  "2027-09-16|17:00":
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f4/2153_-_Salzburg_-_Mirabellgarten_and_Festung_Hohensalzburg.JPG/960px-2153_-_Salzburg_-_Mirabellgarten_and_Festung_Hohensalzburg.JPG",
  "2027-09-17|09:30":
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ae/Untersberg_salzburg_sunset.jpg/960px-Untersberg_salzburg_sunset.jpg",
  // Optional extras (tag "Optional"), same sources
  "2027-09-02|17:30":
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b2/Alter_Peter_%26_Christkindlmarkt.jpg/960px-Alter_Peter_%26_Christkindlmarkt.jpg",
  "2027-09-02|18:00":
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/60/Hofbrauhaus.JPG/960px-Hofbrauhaus.JPG",
  "2027-09-02|18:30":
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d0/Abzweigung_Schwabinger_Bachs_-_Eisbach.jpg/960px-Abzweigung_Schwabinger_Bachs_-_Eisbach.jpg",
  "2027-09-03|15:30":
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0b/Image-Schloss_Nymphenburg_Munich_CC_edit3.jpg/960px-Image-Schloss_Nymphenburg_Munich_CC_edit3.jpg",
  "2027-09-03|16:00":
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/ce/BMW_Welt%2C_M%C3%BAnich%2C_Alemania16.jpg/960px-BMW_Welt%2C_M%C3%BAnich%2C_Alemania16.jpg",
  "2027-09-03|16:30":
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d1/M%C3%BCnchen_-_Olympische_Bauten.jpg/960px-M%C3%BCnchen_-_Olympische_Bauten.jpg",
  "2027-09-04|13:00":
    "https://upload.wikimedia.org/wikipedia/commons/2/26/IA_GoldenesDachl-A.jpg",
  "2027-09-04|13:15":
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/00/Mandlspitze.jpg/960px-Mandlspitze.jpg",
  "2027-09-05|16:00":
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4c/Kastelruth_mit_Kirche_Sankt_Peter_und_Paul.jpg/960px-Kastelruth_mit_Kirche_Sankt_Peter_und_Paul.jpg",
  "2027-09-05|16:30":
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c8/V%C3%B6lser_Weiher_%28Piotr_Kuczynski%29.jpg/960px-V%C3%B6lser_Weiher_%28Piotr_Kuczynski%29.jpg",
  "2027-09-06|13:00":
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/18/BozenArchMuseum.jpg/960px-BozenArchMuseum.jpg",
  "2027-09-06|15:30":
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/14/Bozen-Bolzano_from_the_Oswaldpromenade.jpg/960px-Bozen-Bolzano_from_the_Oswaldpromenade.jpg",
  "2027-09-07|09:45":
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3e/Pragser_Wildsee_Seekofel_von_Bucht.jpg/960px-Pragser_Wildsee_Seekofel_von_Bucht.jpg",
  "2027-09-07|11:30":
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a6/Schloss_Bruck.JPG/960px-Schloss_Bruck.JPG",
  "2027-09-07|17:00":
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3c/Radovljica_%283%29.jpg/960px-Radovljica_%283%29.jpg",
  "2027-09-08|11:45":
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/74/Dragons_Bridge%2C_Ljubljana_2.jpg/960px-Dragons_Bridge%2C_Ljubljana_2.jpg",
  "2027-09-08|12:00":
    "https://upload.wikimedia.org/wikipedia/commons/9/9d/StNicholas-Ljubljana.JPG",
  "2027-09-08|14:00":
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/24/Neboti%C4%8Dnik-3428009.jpg/960px-Neboti%C4%8Dnik-3428009.jpg",
  "2027-09-09|16:30":
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/58/Aerial_image_of_Lake_Bohinj_%28view_from_the_south%29.jpg/960px-Aerial_image_of_Lake_Bohinj_%28view_from_the_south%29.jpg",
  "2027-09-10|15:00":
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/70/SkocjanskeJame_2013jpg.jpg/960px-SkocjanskeJame_2013jpg.jpg",
  "2027-09-10|15:30":
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c1/Piran%2C_Slovenia%2C_Viewpoint.jpg/960px-Piran%2C_Slovenia%2C_Viewpoint.jpg",
  "2027-09-11|13:30":
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c1/Piran%2C_Slovenia%2C_Viewpoint.jpg/960px-Piran%2C_Slovenia%2C_Viewpoint.jpg",
  "2027-09-11|14:00":
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/59/%C5%A0tanjel_view_at_village_06072008_00.jpg/960px-%C5%A0tanjel_view_at_village_06072008_00.jpg",
  "2027-09-12|09:45":
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f5/Villach_panorama.jpg/960px-Villach_panorama.jpg",
  "2027-09-12|12:00":
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/37/Bad_Gastein_Centre_1997-02-01.jpg/960px-Bad_Gastein_Centre_1997-02-01.jpg",
  "2027-09-12|17:00":
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/51/Burg_Kaprun_00.jpg/960px-Burg_Kaprun_00.jpg",
  "2027-09-13|14:30":
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9b/2005-07-31_pinzgau_sigmund-thun-klamm_01.JPG/960px-2005-07-31_pinzgau_sigmund-thun-klamm_01.JPG",
  "2027-09-13|15:00":
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/78/Kitzsteinhorn3.jpg/960px-Kitzsteinhorn3.jpg",
  "2027-09-13|16:00":
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a1/Austrian.waterfall.at.krimml.arp.jpg/960px-Austrian.waterfall.at.krimml.arp.jpg",
  "2027-09-14|11:30":
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/74/Heiligenblut_kirche2.jpg/960px-Heiligenblut_kirche2.jpg",
  "2027-09-16|11:00":
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6a/Salzburg%2C_Getreidegasse_9%2C_Mozarts_Geburtshaus.jpg/960px-Salzburg%2C_Getreidegasse_9%2C_Mozarts_Geburtshaus.jpg",
  "2027-09-16|11:30":
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/45/Salzburg_Cathedral_1.jpg/960px-Salzburg_Cathedral_1.jpg",
  "2027-09-16|12:00":
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6d/Stift_St_Peter2.JPG/960px-Stift_St_Peter2.JPG",
  "2027-09-17|11:30":
    "https://upload.wikimedia.org/wikipedia/commons/3/3a/D%C3%BCrrnberg_%28Salzwelten%29.jpg",
  "2027-09-17|13:30":
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/59/K%C3%B6nigsee_in_Bayern.jpg/960px-K%C3%B6nigsee_in_Bayern.jpg",
  "2027-09-17|14:00":
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/62/St._Wolfgang_im_Salzkammergut_-_Ortsansicht.JPG/960px-St._Wolfgang_im_Salzkammergut_-_Ortsansicht.JPG",
  "2027-09-17|16:30":
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/47/1944_-_Salzburg_-_Mozart_Wohnhaus%2C_Makartplatz_%28cropped%29.jpg/960px-1944_-_Salzburg_-_Mozart_Wohnhaus%2C_Makartplatz_%28cropped%29.jpg",
  "2027-09-02|15:00":
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/de/Antiquarium%2C_M%C3%BCnchner_Residenz.jpg/960px-Antiquarium%2C_M%C3%BCnchner_Residenz.jpg",
  "2027-09-08|17:00":
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fd/La_maison_de_Jo%C5%BEe_Ple%C4%8Dnik_%28Ljubljana%29_%289375937247%29.jpg/960px-La_maison_de_Jo%C5%BEe_Ple%C4%8Dnik_%28Ljubljana%29_%289375937247%29.jpg",
  "2027-09-09|14:30":
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/59/Radovljica_Linhartov_Trg_Schloss_Thurn_Ausschnitt_13052015_3676.jpg/960px-Radovljica_Linhartov_Trg_Schloss_Thurn_Ausschnitt_13052015_3676.jpg",
  "2027-09-09|16:00":
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a6/Lake-Bled-from-Ojstrica-2021-Luka-Peternel.jpg/960px-Lake-Bled-from-Ojstrica-2021-Luka-Peternel.jpg",
  "2027-09-14|09:30":
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/62/Fuscher_Lacke_Panorama_Gro%C3%9Fglocknerhochalpenstra%C3%9Fe.jpg/960px-Fuscher_Lacke_Panorama_Gro%C3%9Fglocknerhochalpenstra%C3%9Fe.jpg",
  "2027-09-14|13:00":
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/53/Gro%C3%9Fglockner-hochalpenstra%C3%9Fe6114.JPG/960px-Gro%C3%9Fglockner-hochalpenstra%C3%9Fe6114.JPG",
  "2027-09-15|16:00":
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2a/Stiegl_Brauerei_3.jpg/960px-Stiegl_Brauerei_3.jpg",
  "2027-09-15|13:30":
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f9/Schloss_Hellbrunn_-_Festsaal_%285%29.jpg/960px-Schloss_Hellbrunn_-_Festsaal_%285%29.jpg",
  "2027-09-16|18:00":
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/70/Salzburg_-_Augustiner_Br%C3%A4u_%28b%29.JPG/960px-Salzburg_-_Augustiner_Br%C3%A4u_%28b%29.JPG",
  "2027-09-01|16:30":
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/02/Biergarten_am_Chinesischen_Turm_im_Englischer_Garten_%28Lehel%29%2C_M%C3%BCnchen_2.jpg/960px-Biergarten_am_Chinesischen_Turm_im_Englischer_Garten_%28Lehel%29%2C_M%C3%BCnchen_2.jpg",
  "2027-09-06|16:30":
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1a/Resciesa_Mont_Dedite_y_Danter_la_Montes_Urtijei.jpg/960px-Resciesa_Mont_Dedite_y_Danter_la_Montes_Urtijei.jpg",
  "2027-09-18|09:00":
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fd/Aerial_image_of_the_Fraueninsel.jpg/960px-Aerial_image_of_the_Fraueninsel.jpg",
  "2027-09-15|13:00":
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5a/Katta_%28Lemur_catta%29_Breitmaulnashorn_%28Ceratotherium_simum%29_Zoo_Salzburg_2014_b.jpg/960px-Katta_%28Lemur_catta%29_Breitmaulnashorn_%28Ceratotherium_simum%29_Zoo_Salzburg_2014_b.jpg",
};

export function imageKey(date: string, item: Pick<Item, "time">): string {
  return `${date}|${item.time}`;
}

/** New days with each item's cover photo attached where one is listed. */
export function withImages(days: readonly Day[]): Day[] {
  return days.map((day) => ({
    ...day,
    items: day.items.map((item) => {
      const image = ITEM_IMAGES[imageKey(day.date, item)];
      return image ? { ...item, image } : item;
    }),
  }));
}
