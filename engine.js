/* Mein Kleiderschrank – Regelwerk und Outfit-Generator
   Läuft komplett auf dem Gerät. Keine Daten verlassen das Handy. */
(function (root) {
  'use strict';

  // ---------------------------------------------------------------- Farben
  const COLORS = [
    ['schwarz', 'Schwarz', '#1b1b1d', 1, ['dunkel']],
    ['weiss', 'Weiß', '#f6f6f3', 1, []],
    ['creme', 'Creme', '#ede3cc', 1, ['erd', 'pastell']],
    ['beige', 'Beige', '#d6c19f', 1, ['erd']],
    ['hautfarben', 'Hautfarben', '#d9b39b', 1, ['haut']],
    ['camel', 'Camel', '#b5884f', 1, ['erd']],
    ['braun', 'Braun', '#6a4328', 1, ['erd', 'dunkel']],
    ['hellgrau', 'Hellgrau', '#c7c8ca', 1, ['pastell']],
    ['grau', 'Grau', '#8a8c90', 1, []],
    ['anthrazit', 'Anthrazit', '#3d4046', 1, ['dunkel']],
    ['navy', 'Dunkelblau', '#1f2b4a', 1, ['dunkel']],
    ['jeansblau', 'Jeansblau', '#4f6f96', 1, []],
    ['khaki', 'Khaki', '#a69c6e', 1, ['erd']],
    ['oliv', 'Olivgrün', '#5d6633', 0, ['erd', 'dunkel']],
    ['gruen', 'Grün', '#2f8a4a', 0, ['kraeftig']],
    ['mint', 'Mint', '#a9dcc4', 0, ['pastell']],
    ['petrol', 'Petrol', '#1d5d66', 0, ['dunkel']],
    ['tuerkis', 'Türkis', '#2ab0ae', 0, ['kraeftig']],
    ['hellblau', 'Hellblau', '#a4c6e8', 0, ['pastell']],
    ['blau', 'Blau', '#2c5cc5', 0, ['kraeftig']],
    ['flieder', 'Flieder', '#c6b4e0', 0, ['pastell']],
    ['lila', 'Lila', '#6c3d9e', 0, ['kraeftig']],
    ['rosa', 'Rosa', '#f1bccb', 0, ['pastell']],
    ['pink', 'Pink', '#d8357f', 0, ['kraeftig']],
    ['rot', 'Rot', '#c62334', 0, ['kraeftig']],
    ['bordeaux', 'Bordeaux', '#6b1b2c', 0, ['dunkel', 'erd']],
    ['koralle', 'Koralle', '#ef7d68', 0, ['kraeftig']],
    ['orange', 'Orange', '#e5772a', 0, ['kraeftig']],
    ['rost', 'Rostrot', '#a24a28', 0, ['erd']],
    ['senf', 'Senfgelb', '#c99d26', 0, ['erd']],
    ['gelb', 'Gelb', '#f1d13d', 0, ['kraeftig']],
    ['silber', 'Silber', '#c3c5cc', 1, ['metall']],
    ['gold', 'Gold', '#c8a24a', 1, ['metall']]
  ].map(([id, name, hex, neutral, groups]) => {
    const rgb = hexToRgb(hex);
    return { id, name, hex, neutral: !!neutral, groups, rgb, lab: rgbToLab(rgb), hsl: rgbToHsl(rgb) };
  });
  const COLOR = Object.fromEntries(COLORS.map(c => [c.id, c]));

  const FARBTYP = {
    fruehling: { name: 'Frühling', good: ['creme', 'beige', 'camel', 'koralle', 'orange', 'gelb', 'tuerkis', 'mint', 'gruen', 'hellblau', 'jeansblau', 'gold'], bad: ['schwarz', 'anthrazit', 'grau', 'bordeaux', 'lila', 'silber', 'petrol'] },
    sommer: { name: 'Sommer', good: ['hellgrau', 'grau', 'navy', 'jeansblau', 'hellblau', 'rosa', 'flieder', 'mint', 'petrol', 'weiss', 'silber'], bad: ['orange', 'senf', 'camel', 'rost', 'gelb', 'schwarz', 'koralle', 'gold'] },
    herbst: { name: 'Herbst', good: ['camel', 'braun', 'oliv', 'senf', 'rost', 'bordeaux', 'petrol', 'khaki', 'creme', 'beige', 'orange', 'gold'], bad: ['weiss', 'rosa', 'flieder', 'pink', 'hellblau', 'hellgrau', 'schwarz', 'silber'] },
    winter: { name: 'Winter', good: ['schwarz', 'weiss', 'navy', 'rot', 'pink', 'blau', 'lila', 'anthrazit', 'tuerkis', 'bordeaux', 'silber', 'grau'], bad: ['beige', 'camel', 'senf', 'orange', 'rost', 'khaki', 'oliv', 'creme', 'gold', 'koralle'] }
  };
  const UNTERTON = {
    warm: { good: ['creme', 'beige', 'camel', 'braun', 'oliv', 'senf', 'rost', 'koralle', 'orange', 'gold', 'khaki', 'tuerkis'], bad: ['silber', 'flieder', 'pink', 'hellgrau'] },
    kuehl: { good: ['weiss', 'grau', 'navy', 'blau', 'hellblau', 'rosa', 'pink', 'flieder', 'lila', 'bordeaux', 'silber', 'petrol'], bad: ['orange', 'senf', 'rost', 'camel', 'gold', 'khaki'] }
  };

  // ---------------------------------------------------------------- Typen
  // slot: top | mid | bottom | onepiece | outer | shoes | acc | other
  const CATEGORIES = [
    { id: 'oberteile', name: 'Oberteile', slots: ['top'] },
    { id: 'lagen', name: 'Jacken zum Drüberziehen', slots: ['mid'] },
    { id: 'unterteile', name: 'Hosen & Röcke', slots: ['bottom'] },
    { id: 'einteiler', name: 'Kleider & Einteiler', slots: ['onepiece'] },
    { id: 'jacken', name: 'Jacken & Mäntel', slots: ['outer'] },
    { id: 'schuhe', name: 'Schuhe', slots: ['shoes'] },
    { id: 'beine', name: 'Strumpfhosen', slots: ['legs'] },
    { id: 'accessoires', name: 'Accessoires', slots: ['acc', 'other'] }
  ];
  const T = (name, slot, f, w, icon, extra) => Object.assign({ name, slot, f, w, icon }, extra || {});
  const TYPES = {
    tshirt: T('T-Shirt', 'top', 2, 1, '👕', { base: 1, underOk: 1 }),
    top: T('Top / Trägertop', 'top', 2, 1, '👚', { base: 1, traeger: 1 }),
    langarm: T('Langarmshirt', 'top', 2, 2, '👕', { base: 1, underOk: 1 }),
    bluse: T('Bluse', 'top', 4, 1, '👚', { base: 1, collar: 1, underOk: 1 }),
    hemd: T('Hemd', 'top', 4, 2, '👔', { base: 1, collar: 1, underOk: 1, layerOk: 1 }),
    polo: T('Poloshirt', 'top', 3, 1, '👕', { base: 1, collar: 1 }),
    body: T('Body', 'top', 3, 1, '🩱', { base: 1, underOk: 1 }),
    pullover: T('Pullover', 'top', 3, 3, '🧶', { knit: 1, overBase: 1 }),
    rollkragen: T('Rollkragenpullover', 'top', 3, 3, '🧶', { knit: 1, underOk: 1 }),
    sweatshirt: T('Sweatshirt', 'top', 2, 3, '👕', { knit: 1, overBase: 1, sporty: 1 }),
    hoodie: T('Hoodie', 'top', 1, 3, '👕', { knit: 1, sporty: 1, hood: 1 }),

    cardigan: T('Strickjacke', 'mid', 3, 2, '🧶', { open: 1 }),
    blazer: T('Blazer / Sakko', 'mid', 4, 2, '🧥', { open: 1 }),
    sweatjacke: T('Sweatjacke', 'mid', 1, 2, '🧥', { open: 1, sporty: 1 }),
    weste: T('Weste / Pullunder', 'mid', 3, 1, '🦺', { open: 1, vest: 1 }),
    overshirt: T('Overshirt / Hemdjacke', 'mid', 2, 3, '🧥', { open: 1, shirtjacket: 1 }),

    jeans: T('Jeans', 'bottom', 2, 3, '👖', { denim: 1 }),
    stoffhose: T('Stoffhose', 'bottom', 4, 2, '👖'),
    chino: T('Chino', 'bottom', 3, 2, '👖'),
    weitehose: T('Weite Hose / Culotte', 'bottom', 3, 2, '👖'),
    leggings: T('Leggings', 'bottom', 1, 2, '👖', { sporty: 1, legLayer: 1 }),
    jogginghose: T('Jogginghose', 'bottom', 1, 3, '👖', { sporty: 1, lounge: 1 }),
    cargohose: T('Cargohose', 'bottom', 1, 3, '👖'),
    shorts: T('Shorts', 'bottom', 1, 1, '🩳', { short: 1 }),
    rock_kurz: T('Rock (kurz)', 'bottom', 2, 1, '👗', { short: 1, skirt: 1 }),
    rock_lang: T('Rock (midi / lang)', 'bottom', 3, 2, '👗', { skirt: 1 }),

    kleid_kurz: T('Kleid (kurz)', 'onepiece', 3, 1, '👗', { short: 1, dress: 1 }),
    kleid_lang: T('Kleid (midi / lang)', 'onepiece', 3, 2, '👗', { dress: 1 }),
    traegerkleid: T('Trägerkleid / Slipkleid', 'onepiece', 3, 1, '👗', { dress: 1, traeger: 1 }),
    jumpsuit: T('Jumpsuit', 'onepiece', 3, 2, '👗'),

    jeansjacke: T('Jeansjacke', 'outer', 1, 2, '🧥', { rain: 0, denim: 1 }),
    lederjacke: T('Lederjacke', 'outer', 2, 2, '🧥', { rain: 1 }),
    blouson: T('Blouson / leichte Jacke', 'outer', 3, 2, '🧥', { rain: 1 }),
    uebergang: T('Übergangsjacke', 'outer', 2, 2, '🧥', { rain: 1 }),
    regenjacke: T('Regenjacke', 'outer', 1, 1, '🧥', { rain: 2 }),
    trench: T('Trenchcoat', 'outer', 4, 2, '🧥', { rain: 1 }),
    mantel: T('Mantel', 'outer', 4, 4, '🧥', { rain: 1 }),
    parka: T('Parka', 'outer', 2, 4, '🧥', { rain: 2 }),
    winterjacke: T('Winter- / Daunenjacke', 'outer', 2, 5, '🧥', { rain: 1 }),

    strumpfhose: T('Strumpfhose', 'legs', 3, 2, '🧦', { legLayer: 1 }),

    sneaker: T('Sneaker (schlicht)', 'shoes', 2, 2, '👟', { minT: 3, maxT: 32, rain: 1 }),
    laufschuhe: T('Lauf- / Sportschuhe', 'shoes', 1, 2, '👟', { minT: 0, maxT: 34, rain: 1, sporty: 1 }),
    ballerinas: T('Ballerinas', 'shoes', 3, 1, '🥿', { minT: 12, maxT: 34, rain: 0 }),
    loafer: T('Loafer', 'shoes', 4, 2, '👞', { minT: 5, maxT: 30, rain: 1 }),
    derby: T('Derby / Schnürschuhe', 'shoes', 4, 2, '👞', { minT: 0, maxT: 28, rain: 1 }),
    slingbacks: T('Slingbacks', 'shoes', 4, 1, '👠', { minT: 14, maxT: 34, rain: 0 }),
    pumps: T('Pumps', 'shoes', 5, 1, '👠', { minT: 10, maxT: 32, rain: 0 }),
    sandalen: T('Sandalen', 'shoes', 2, 1, '👡', { minT: 16, maxT: 45, rain: 0, open: 1 }),
    sandaletten: T('Sandaletten (Absatz)', 'shoes', 4, 1, '👡', { minT: 17, maxT: 45, rain: 0, open: 1 }),
    stiefeletten: T('Stiefeletten', 'shoes', 3, 3, '👢', { minT: -10, maxT: 20, rain: 1, boot: 1 }),
    stiefel: T('Stiefel', 'shoes', 3, 4, '👢', { minT: -15, maxT: 16, rain: 1, boot: 1 }),
    winterstiefel: T('Winterstiefel', 'shoes', 1, 5, '🥾', { minT: -30, maxT: 9, rain: 2, boot: 1 }),

    schal: T('Schal', 'acc', 2, 3, '🧣', { sub: 'schal', below: 10 }),
    tuch: T('Tuch / Halstuch', 'acc', 3, 1, '🧣', { sub: 'tuch' }),
    muetze: T('Mütze', 'acc', 1, 3, '🧶', { sub: 'muetze', below: 4 }),
    hut: T('Hut', 'acc', 3, 2, '👒', { sub: 'hut' }),
    cap: T('Cap / Basecap', 'acc', 1, 1, '🧢', { sub: 'cap' }),
    handschuhe: T('Handschuhe', 'acc', 2, 3, '🧤', { sub: 'handschuhe', below: 2 }),
    sonnenbrille: T('Sonnenbrille', 'acc', 3, 0, '🕶️', { sub: 'sonnenbrille' }),
    tasche: T('Tasche', 'acc', 3, 0, '👜', { sub: 'tasche' }),
    guertel: T('Gürtel', 'acc', 3, 0, '➰', { sub: 'guertel' }),
    schmuck: T('Schmuck', 'acc', 3, 0, '💍', { sub: 'schmuck' }),
    einstecktuch: T('Einstecktuch', 'acc', 4, 0, '🤵', { sub: 'einstecktuch' }),
    uhr: T('Uhr', 'other', 3, 0, '⌚'),
    sonstiges: T('Sonstiges', 'other', 3, 0, '✨')
  };

  // ---------------------------------------------------------------- Material, Muster, Passform
  const MATERIALS = {
    baumwolle: { name: 'Baumwolle' }, leinen: { name: 'Leinen', tags: ['summer', 'boho'] },
    viskose: { name: 'Viskose' }, polyester: { name: 'Polyester' }, elasthan: { name: 'Elasthan' },
    polyamid: { name: 'Polyamid / Nylon' }, acryl: { name: 'Acryl' }, modal: { name: 'Modal' }, lyocell: { name: 'Lyocell / Tencel' },
    wolle: { name: 'Wolle', tags: ['winter', 'classic'] }, merino: { name: 'Merino', tags: ['winter'] },
    kaschmir: { name: 'Kaschmir', tags: ['winter', 'fine', 'classic'] },
    seide: { name: 'Seide', tags: ['rainBad', 'fine', 'party', 'romantic'] }, satin: { name: 'Satin', tags: ['party', 'fine'] },
    samt: { name: 'Samt', tags: ['party', 'winter', 'fine'] }, spitze: { name: 'Spitze', tags: ['romantic', 'party'] },
    chiffon: { name: 'Chiffon', tags: ['romantic', 'summer'] }, pailletten: { name: 'Pailletten', tags: ['party'] },
    strick: { name: 'Strick', tags: ['winter'] }, flanell: { name: 'Flanell', tags: ['winter', 'classic'] }, jersey: { name: 'Jersey', tags: ['casual'] },
    denim: { name: 'Denim' }, cord: { name: 'Cord', tags: ['winter', 'preppy'] }, tweed: { name: 'Tweed', tags: ['winter', 'classic', 'preppy'] },
    leder: { name: 'Leder', tags: ['edgy'] }, kunstleder: { name: 'Kunstleder', tags: ['edgy'] },
    wildleder: { name: 'Wildleder', tags: ['rainBad', 'boho'] }, fleece: { name: 'Fleece', tags: ['sporty', 'winter'] },
    funktion: { name: 'Funktionsmaterial', tags: ['sporty'] }, daunen: { name: 'Daunen', tags: ['winter'] }
  };
  const PATTERNS = {
    uni: { name: 'Einfarbig', bold: 0 }, gestreift: { name: 'Gestreift', bold: 0.5 }, gepunktet: { name: 'Gepunktet', bold: 0.5 },
    kariert: { name: 'Kariert', bold: 1 }, gebluemt: { name: 'Geblümt', bold: 1 }, animal: { name: 'Animal-Print', bold: 1 },
    gemustert: { name: 'Anderes Muster', bold: 1 }, print: { name: 'Aufdruck / Logo', bold: 1 }
  };
  const FITS = { eng: 'Eng anliegend', normal: 'Normal', weit: 'Weit / oversized' };
  const WARMTH = ['', 'Sehr leicht', 'Leicht', 'Mittel', 'Warm', 'Sehr warm'];
  const FORMALITY = ['', 'Sehr lässig', 'Lässig', 'Gepflegt', 'Schick', 'Sehr schick'];
  const TIGHTS = ['', 'hauchdünn', 'fein', 'blickdicht', 'dick', 'Thermo'];
  const STATUS = { verfuegbar: 'Im Schrank', waesche: 'In der Wäsche', weggeraeumt: 'Weggeräumt', verliehen: 'Verliehen / Reparatur' };
  const CONDITION = { neu: 'Wie neu', gut: 'Gut', getragen: 'Sichtbar getragen', abgetragen: 'Abgetragen' };

  // ---------------------------------------------------------------- Anlässe
  const OCCASIONS = {
    alltag: { name: 'Alltag', lo: 1, hi: 3, target: 2 },
    arbeit: { name: 'Arbeit' },
    party: { name: 'Party', lo: 2, hi: 5, target: 3.4 },
    elegant: { name: 'Elegant', lo: 3, hi: 5, target: 4.3, shoeStrict: 1 }
  };
  const DRESSCODES = {
    locker: { name: 'Locker', lo: 1.5, hi: 3, target: 2.4 },
    businesscasual: { name: 'Business Casual', lo: 2, hi: 4, target: 3.2 },
    business: { name: 'Business', lo: 3, hi: 5, target: 4, shoeStrict: 1 }
  };
  function occasionDef(occ, profile) {
    if (occ === 'arbeit') {
      const d = DRESSCODES[profile.dresscode] || DRESSCODES.businesscasual;
      return Object.assign({ id: 'arbeit', name: 'Arbeit' }, d);
    }
    return Object.assign({ id: occ }, OCCASIONS[occ] || OCCASIONS.alltag);
  }

  // ---------------------------------------------------------------- Stile mit ihren ungeschriebenen Regeln
  const STYLES = {
    italienisch: {
      name: 'Italienisch', desc: 'Lässige Eleganz: Feinstrick, Stoffhose, Loafer, Naturmaterialien',
      like: { types: ['stoffhose', 'chino', 'weitehose', 'hemd', 'bluse', 'polo', 'pullover', 'rollkragen', 'cardigan', 'blazer', 'loafer', 'derby', 'slingbacks', 'ballerinas', 'pumps', 'sandaletten', 'stiefeletten', 'mantel', 'trench', 'blouson', 'lederjacke', 'kleid_lang', 'rock_lang', 'tshirt'], colors: ['navy', 'creme', 'beige', 'camel', 'braun', 'oliv', 'grau', 'weiss', 'schwarz', 'bordeaux'], patterns: ['uni', 'gestreift'], materials: ['leinen', 'baumwolle', 'wolle', 'merino', 'kaschmir', 'flanell', 'seide', 'viskose', 'leder', 'wildleder', 'strick'], fits: ['normal'] },
      avoid: { types: ['hoodie', 'sweatshirt', 'sweatjacke', 'jogginghose', 'cargohose', 'leggings', 'laufschuhe', 'regenjacke', 'parka', 'winterstiefel'], patterns: ['print', 'animal'], materials: ['funktion', 'fleece', 'pailletten'] },
      maxAccents: 1, maxBold: 1, extraNeutrals: ['oliv', 'hellblau'],
      rules: [
        o => pieces(o, true).some(i => i.formality >= 4 || (i.materials || []).some(m => ['seide', 'kaschmir'].includes(m))) ? [1.5, 'Mindestens ein elegantes Element'] : [-1.5, 'Es fehlt ein elegantes Element'],
        o => { const n = statementCount(o); return n <= 1 ? [1, 'Ein Blickfang genügt, der Rest bleibt ruhig'] : [-2.5 * (n - 1), 'Zu viele Hingucker auf einmal']; },
        (o, C) => o.bottom && o.bottom.type === 'jeans' ? (C.gender === 'm' ? [-1.5, 'Chino oder Stoffhose wäre italienischer als Jeans'] : [-0.4, null]) : (o.bottom && ['stoffhose', 'chino', 'weitehose'].includes(o.bottom.type) ? [1, 'Stoffhose oder Chino statt Jeans'] : null),
        o => hasBlazer(o) ? [1.2, 'Sakko bzw. Blazer als Basis'] : null,
        o => [o.top, o.mid].some(i => i && ['pullover', 'cardigan', 'rollkragen', 'polo'].includes(i.type) && i.warmth <= 3 && i.fit !== 'weit') ? [1, 'Feinstrick statt Sweatshirt'] : null,
        o => o.shoes && o.shoes.type === 'sneaker' ? ((o.shoes.materials || []).some(m => m === 'leder' || m === 'wildleder') ? [0.8, 'Schlichte Ledersneaker statt Sportschuhen'] : [-0.8, null]) : null,
        o => (o.top && o.top.fit === 'weit' && !(o.bottom && o.bottom.fit === 'eng')) ? [-1, null] : null,
        // Wetter-Varianten
        (o, C) => { const m = pieces(o, false).flatMap(i => i.materials || []);
          if (C.tMax >= 22 && m.some(x => x === 'leinen' || x === 'baumwolle')) return [1, 'Leinen oder Baumwolle für warme Tage'];
          if (C.tMax <= 13 && m.some(x => ['wolle', 'merino', 'kaschmir', 'flanell'].includes(x))) return [1, 'Wolle oder Kaschmir für kalte Tage'];
          return null; },
        (o, C) => { if (!o.outer) return null;
          if (C.rain && o.outer.type === 'trench') return [1.5, 'Trenchcoat: die elegante Antwort auf Regen'];
          if (C.tMin < 10 && C.tMin >= -1 && o.outer.type === 'mantel') return [1.5, 'Wollmantel statt Daunenjacke'];
          if (C.tMin < -1 && o.outer.type === 'winterjacke') return [1, 'Bei Frost geht Wärme vor'];
          return null; },
        (o, C) => { const bl = [o.mid, o.layer].find(i => i && i.type === 'blazer'); if (!bl || C.tMax > 16) return null;
          const knit = [o.top, o.mid].find(i => i && i !== bl && ['rollkragen', 'pullover'].includes(i.type)); if (!knit) return null;
          if (o.layer && o.top && o.top.typeDef.collar) return [2, shortType(o.top) + ', Feinstrick und Sakko – italienisches Layering'];
          return knit.warmth <= 3 ? [1.5, 'Feinstrick unter dem Sakko: warm und trotzdem elegant'] : [0.3, null]; },
        (o, C) => (o.outer && ['mantel', 'trench'].includes(o.outer.type) && hasBlazer(o)) ? [0.8, (o.outer.type === 'mantel' ? 'Mantel' : 'Trenchcoat') + ' über dem Sakko – italienisch gelayert'] : null,
        // Farb-Varianten je Wetter
        (o, C) => { const big = pieces(o, false); if (!big.length) return null;
          if (C.tMax >= 22) return big.filter(i => prim(i).lab[0] >= 70).length / big.length >= 0.5 ? [0.8, 'Helle Sommerfarben wie Creme, Weiß und Hellblau'] : null;
          if (C.tMax <= 12) return big.filter(i => { const c = prim(i); return c.groups.includes('erd') || c.groups.includes('dunkel') || ['grau', 'anthrazit'].includes(c.id); }).length / big.length >= 0.6 ? [0.6, 'Gedeckte Wintertöne wie Grau, Braun, Navy und Camel'] : null;
          return null; },
        o => (o.shoes && ['braun', 'camel'].includes(prim(o.shoes).id) && o.bottom && ['navy', 'grau', 'anthrazit', 'jeansblau', 'hellgrau'].includes(prim(o.bottom).id)) ? [0.8, 'Braune Lederschuhe zu Blau oder Grau – sehr italienisch'] : null,
        (o, C) => (C.rain && o.shoes && ['loafer', 'derby', 'stiefeletten'].includes(o.shoes.type)) ? [0.8, 'Glattleder statt Wildleder bei Regen'] : null
      ],
      tips: [
        (o, C) => C.rain ? 'Regenschirm statt Kapuze – passt besser zum Look.' : null,
        (o, C) => (C.spread >= 6 && C.tMax >= 16 && C.tMax <= 25 && !o.mid && !o.layer) ? 'Für den kühleren Abend einen Feinstrick-Pullover locker über die Schultern legen – typisch italienisch.' : null,
        (o, C) => (C.gender !== 'w' && o.top && o.top.type === 'hemd') ? 'Hemdkragen offen tragen, ein bis zwei Knöpfe auf.' : null,
        o => TONAL_TIP(o),
        (o, C) => TUCK(o, C),
        (o, C) => (C.gender !== 'm' && o.onepiece && o.onepiece.typeDef.dress) ? 'Ein schmaler Gürtel in der Taille macht das Kleid noch eleganter.' : null,
        (o, C) => (C.tMax >= 17 && ((o.top && ['hemd', 'pullover', 'langarm', 'rollkragen'].includes(o.top.type)) || o.mid)) ? 'Ärmel leicht hochschieben – ein bewusst lockeres Detail.' : null,
        (o, C) => (C.tMax >= 22 && o.shoes && o.shoes.type === 'loafer') ? 'Loafer mit unsichtbaren Füßlingen tragen.' : null,
        (o, C) => (C.tMin < 8 && o.outer && ['mantel', 'trench'].includes(o.outer.type)) ? 'Schal locker um den Hals legen statt eng zu binden.' : null
      ]
    },
    klassisch: {
      name: 'Klassisch', desc: 'Zeitlos, klare Schnitte, gedeckte Farben',
      like: { types: ['bluse', 'hemd', 'blazer', 'stoffhose', 'chino', 'trench', 'mantel', 'loafer', 'pumps', 'rollkragen', 'pullover', 'cardigan', 'rock_lang', 'kleid_lang', 'ballerinas', 'stiefeletten'], colors: ['navy', 'weiss', 'beige', 'camel', 'grau', 'schwarz', 'creme', 'bordeaux'], patterns: ['uni', 'gestreift'], materials: ['wolle', 'kaschmir', 'seide', 'tweed', 'baumwolle'], fits: ['normal'] },
      avoid: { types: ['hoodie', 'jogginghose', 'cargohose', 'sweatjacke', 'leggings', 'sweatshirt'], patterns: ['animal', 'print'], materials: ['pailletten', 'fleece', 'funktion'] },
      maxAccents: 1, maxBold: 1, tips: [(o, C) => TUCK(o, C), (o, C) => C.rain ? 'Bei Regen lieber Schirm als Kapuze.' : null],
      rules: [
        o => (hasBlazer(o) && o.bottom && ['stoffhose', 'chino', 'rock_lang'].includes(o.bottom.type)) ? [2, 'Blazer mit Stoffhose oder Rock: die klassische Basis'] : null,
        (o, C) => (o.layer && o.layer.type === 'blazer' && C.tMax <= 16) ? [1.2, 'Drei Lagen mit Blazer – klassisch und warm'] : null,
        o => (o.mid && o.mid.typeDef.slot === 'top' && o.mid.typeDef.layerOk) ? [-1.5, 'Offenes Hemd über Shirt ist eher lässig als klassisch'] : null,
        o => neutralShare(o) >= 0.75 ? [1.5, 'Überwiegend Basisfarben – typisch klassisch'] : null
      ]
    },
    casual: {
      name: 'Casual', desc: 'Lässig, bequem, aber gepflegt',
      like: { types: ['jeans', 'tshirt', 'langarm', 'pullover', 'sweatshirt', 'chino', 'sneaker', 'jeansjacke', 'cardigan', 'hemd', 'uebergang', 'stiefeletten'], colors: [], patterns: ['uni', 'gestreift', 'kariert'], materials: ['baumwolle', 'jersey', 'denim', 'strick'], fits: ['normal', 'weit'] },
      avoid: { types: ['pumps'], patterns: [], materials: ['pailletten'] },
      maxAccents: 2, maxBold: 1, denimOk: 1,
      tips: [o => (o.mid && (o.mid.type === 'overshirt' || o.mid.type === 'hemd')) ? (o.mid.type === 'hemd' ? 'Hemd' : 'Overshirt') + ' offen lassen und die Ärmel ein- bis zweimal umschlagen.' : null],
      rules: [
        o => (o.bottom && ['jeans', 'chino'].includes(o.bottom.type) && o.shoes && o.shoes.type === 'sneaker') ? [1.5, 'Hose plus Sneaker: entspannte Basis'] : null,
        o => (hasBlazer(o) && o.bottom && o.bottom.type === 'jeans') ? [1.5, 'Blazer zur Jeans – gewollter Stilbruch'] : null,
        o => (o.mid && (o.mid.type === 'overshirt' || (o.mid.typeDef.slot === 'top' && o.mid.typeDef.layerOk))) ? [1.5, 'Offenes Hemd oder Overshirt über dem Shirt'] : null,
        o => (o.top && o.top.typeDef.hood && !o.mid && o.outer && ['jeansjacke', 'lederjacke', 'uebergang'].includes(o.outer.type)) ? [1, 'Hoodie unter der Jacke'] : null
      ]
    },
    minimalistisch: {
      name: 'Minimalistisch', desc: 'Wenige Farben, klare Linien, kein Schnickschnack',
      like: { types: ['tshirt', 'rollkragen', 'stoffhose', 'weitehose', 'mantel', 'blazer', 'loafer', 'sneaker', 'kleid_lang', 'hemd'], colors: ['schwarz', 'weiss', 'grau', 'beige', 'creme', 'anthrazit', 'navy', 'camel', 'hellgrau'], patterns: ['uni'], materials: ['wolle', 'kaschmir', 'baumwolle', 'leinen'], fits: ['normal', 'weit'] },
      avoid: { types: ['hoodie'], patterns: ['gebluemt', 'animal', 'print', 'gemustert', 'kariert', 'gepunktet'], materials: ['pailletten', 'spitze'] },
      maxAccents: 0, maxBold: 0, tips: [o => TONAL_TIP(o)],
      rules: [
        o => toneInTone(o) ? [2.5, 'Ton in Ton – minimalistisch auf den Punkt'] : null,
        o => ([o.mid, o.layer, o.outer].some(i => i && ['blazer', 'mantel'].includes(i.type)) && [o.top, o.under].some(i => i && i.type === 'rollkragen')) ? [1, 'Rollkragen unter Blazer oder Mantel – klare Linie'] : null,
        o => null
      ]
    },
    sportlich: {
      name: 'Sportlich', desc: 'Sneaker, bequeme Schnitte, Athleisure',
      like: { types: ['sneaker', 'hoodie', 'sweatshirt', 'sweatjacke', 'leggings', 'tshirt', 'jogginghose', 'jeans', 'regenjacke', 'parka', 'polo', 'shorts'], colors: [], patterns: ['uni', 'gestreift', 'print'], materials: ['funktion', 'jersey', 'baumwolle', 'fleece'], fits: ['normal', 'weit', 'eng'] },
      avoid: { types: ['pumps', 'bluse', 'sandaletten', 'stoffhose', 'mantel'], patterns: ['gebluemt'], materials: ['seide', 'satin', 'spitze', 'pailletten'] },
      maxAccents: 2, maxBold: 1, denimOk: 1,
      rules: [
        o => (o.shoes && o.shoes.type === 'sneaker') ? [2, 'Sneaker – Pflicht beim sportlichen Look'] : (o.shoes ? [-2, 'Sportlicher Look ohne Sneaker'] : null),
        o => (o.mid && o.mid.type === 'sweatjacke') ? [1, 'Sweatjacke als Lage – sportlich'] : null
      ]
    },
    streetwear: {
      name: 'Streetwear', desc: 'Oversized, Sneaker, Hoodies, Statement-Prints',
      like: { types: ['hoodie', 'sweatshirt', 'cargohose', 'jeans', 'sneaker', 'tshirt', 'parka', 'jeansjacke', 'weitehose', 'winterjacke'], colors: ['schwarz', 'weiss', 'grau', 'oliv', 'khaki', 'beige'], patterns: ['uni', 'print'], materials: ['baumwolle', 'denim', 'jersey', 'funktion'], fits: ['weit'] },
      avoid: { types: ['pumps', 'bluse', 'ballerinas', 'sandaletten', 'stoffhose'], patterns: ['gebluemt', 'gepunktet'], materials: ['seide', 'spitze', 'chiffon'] },
      maxAccents: 2, maxBold: 1, oversizeOk: 1, denimOk: 1, tips: [o => TONAL_TIP(o)],
      rules: [
        o => (o.shoes && o.shoes.type === 'sneaker') ? [1.5, 'Sneaker gehören dazu'] : null,
        o => (o.top && o.top.fit === 'weit') ? [1, 'Oversized oben – typisch Streetwear'] : null,
        o => (o.mid && o.mid.type === 'blazer' && o.top && o.top.type === 'hoodie') ? [1, 'Hoodie unterm Blazer – Streetwear-Twist'] : null,
        o => (o.top && o.top.typeDef.hood && (o.outer || (o.mid && o.mid.type === 'overshirt'))) ? [1.5, 'Hoodie unter Jacke oder Overshirt – Streetwear-Layering'] : null,
        o => (o.mid && o.mid.type === 'overshirt' && !(o.top && o.top.typeDef.hood)) ? [1, 'Overshirt als lässige Lage'] : null
      ]
    },
    romantisch: {
      name: 'Romantisch', desc: 'Kleider, Röcke, zarte Farben, verspielte Details',
      like: { types: ['bluse', 'kleid_kurz', 'kleid_lang', 'rock_lang', 'rock_kurz', 'cardigan', 'ballerinas', 'sandaletten', 'stiefeletten', 'trench'], colors: ['rosa', 'flieder', 'creme', 'weiss', 'mint', 'hellblau', 'beige', 'koralle'], patterns: ['uni', 'gebluemt', 'gepunktet'], materials: ['spitze', 'chiffon', 'seide', 'viskose'], fits: ['normal', 'eng'] },
      avoid: { types: ['cargohose', 'hoodie', 'jogginghose', 'sweatjacke', 'winterstiefel'], patterns: ['animal', 'print'], materials: ['funktion', 'fleece'] },
      maxAccents: 2, maxBold: 1,
      rules: [
        o => (o.onepiece && o.onepiece.typeDef.dress) || (o.bottom && o.bottom.typeDef.skirt) || [o.top, o.under].some(i => i && i.type === 'bluse') || hasMaterial(o, 'spitze') ? [2, 'Mindestens ein feminines Element'] : [-1.5, 'Es fehlt ein verspieltes Element'],
        o => (o.onepiece && o.onepiece.typeDef.dress && o.mid && o.mid.type === 'cardigan') ? [1.5, 'Zarte Strickjacke über dem Kleid'] : null,
        o => (o.under && ['bluse', 'hemd'].includes(o.under.type)) ? [1.5, 'Bluse unter dem Trägerkleid – verspielt'] : null
      ]
    },
    boho: {
      name: 'Boho', desc: 'Fließende Schnitte, Erdtöne, Muster und Naturmaterialien',
      like: { types: ['kleid_lang', 'rock_lang', 'bluse', 'cardigan', 'weitehose', 'stiefel', 'stiefeletten', 'sandalen', 'weste'], colors: ['creme', 'beige', 'camel', 'braun', 'rost', 'senf', 'oliv', 'khaki', 'bordeaux', 'koralle'], patterns: ['gebluemt', 'gemustert', 'uni'], materials: ['leinen', 'wildleder', 'baumwolle', 'viskose', 'spitze'], fits: ['weit'] },
      avoid: { types: ['blazer', 'pumps', 'sweatjacke', 'jogginghose'], patterns: ['print'], materials: ['funktion', 'pailletten'] },
      maxAccents: 2, maxBold: 2, oversizeOk: 1,
      tips: [o => (o.mid || o.under) ? 'Lagen in verschiedenen Längen und Stoffen kombinieren – das macht den Boho-Look aus.' : null],
      rules: [
        o => earthShare(o) >= 0.5 ? [2, 'Erdtöne – typisch Boho'] : null,
        o => (o.onepiece && o.onepiece.type === 'kleid_lang') || (o.bottom && ['rock_lang', 'weitehose'].includes(o.bottom.type)) ? [1.5, 'Fließende, lange Silhouette'] : null,
        o => (o.mid && ['weste', 'cardigan'].includes(o.mid.type)) ? [1.5, 'Weste oder lange Strickjacke als Boho-Lage'] : null
      ]
    },
    edgy: {
      name: 'Rockig / Edgy', desc: 'Schwarz, Leder, Boots, klare Kanten',
      like: { types: ['lederjacke', 'jeans', 'stiefel', 'stiefeletten', 'tshirt', 'hoodie', 'rock_kurz', 'kleid_kurz', 'leggings', 'winterstiefel'], colors: ['schwarz', 'anthrazit', 'grau', 'bordeaux', 'weiss', 'jeansblau'], patterns: ['uni', 'print', 'animal'], materials: ['leder', 'kunstleder', 'denim'], fits: ['eng', 'normal'] },
      avoid: { types: ['ballerinas', 'polo'], patterns: ['gebluemt', 'gepunktet'], materials: ['chiffon'] },
      maxAccents: 1, maxBold: 1, denimOk: 1,
      rules: [
        o => darkShare(o) >= 0.5 ? [2, 'Dunkle Basis – rockig'] : null,
        o => (hasMaterial(o, 'leder') || hasMaterial(o, 'kunstleder') || (o.shoes && o.shoes.typeDef.boot) || (o.outer && o.outer.type === 'lederjacke')) ? [1.5, 'Ein hartes Element wie Leder oder Boots'] : null,
        o => (o.top && o.top.typeDef.hood && o.outer && o.outer.type === 'lederjacke') ? [1, 'Hoodie unter der Lederjacke'] : null
      ]
    },
    preppy: {
      name: 'Preppy', desc: 'Kragen, Strick, Chino – College-Look',
      like: { types: ['hemd', 'bluse', 'polo', 'pullover', 'cardigan', 'chino', 'rock_kurz', 'loafer', 'blazer', 'trench', 'ballerinas', 'weste'], colors: ['navy', 'weiss', 'rot', 'gruen', 'camel', 'bordeaux', 'hellblau', 'beige'], patterns: ['uni', 'gestreift', 'kariert'], materials: ['baumwolle', 'wolle', 'cord', 'tweed', 'kaschmir'], fits: ['normal'] },
      avoid: { types: ['hoodie', 'jogginghose', 'cargohose', 'leggings'], patterns: ['animal', 'print'], materials: ['pailletten', 'funktion'] },
      maxAccents: 2, maxBold: 1,
      tips: [o => (o.mid && (o.mid.typeDef.knit || o.mid.typeDef.vest) && o.top && o.top.typeDef.collar) ? 'Hemdkragen über den Pullover legen und die Manschetten leicht herausschauen lassen.' : null],
      rules: [
        o => (o.mid && (o.mid.typeDef.knit || o.mid.typeDef.vest) && o.top && o.top.typeDef.collar) ? [3, o.mid.typeDef.vest ? 'Kragen schaut aus dem Pullunder – Preppy-Klassiker' : 'Kragen schaut aus dem Pullover – Preppy-Klassiker'] : null,
        (o, C) => (o.layer && o.layer.type === 'blazer' && o.top && o.top.typeDef.collar && C.tMax <= 18) ? [2, shortType(o.top) + ', Strick und Blazer – Preppy in Reinform'] : null,
        o => pieces(o, false).some(i => prim(i).id === 'schwarz') ? [-0.5, null] : null,
        o => (o.shoes && o.shoes.type === 'loafer') ? [1, 'Loafer runden den Look ab'] : null
      ]
    },
    chic: {
      name: 'Elegant / Chic', desc: 'Hochwertige Materialien, schmale Linien, wenig Farbe',
      like: { types: ['blazer', 'stoffhose', 'kleid_lang', 'kleid_kurz', 'bluse', 'pumps', 'loafer', 'mantel', 'trench', 'rollkragen', 'sandaletten', 'stiefeletten', 'rock_lang'], colors: ['schwarz', 'weiss', 'creme', 'camel', 'navy', 'grau', 'bordeaux', 'beige'], patterns: ['uni'], materials: ['seide', 'kaschmir', 'wolle', 'satin', 'samt'], fits: ['normal', 'eng'] },
      avoid: { types: ['hoodie', 'sweatshirt', 'sweatjacke', 'jogginghose', 'cargohose', 'leggings', 'winterstiefel'], patterns: ['print', 'gemustert'], materials: ['fleece', 'funktion', 'jersey'] },
      maxAccents: 1, maxBold: 1, tips: [o => TONAL_TIP(o)],
      rules: [
        o => toneInTone(o) ? [2, 'Monochrom wirkt besonders edel'] : null,
        o => (o.shoes && o.shoes.type === 'sneaker') ? [-1.5, 'Sneaker brechen den eleganten Look'] : null,
        o => (hasBlazer(o) && [o.top, o.under, o.mid].some(i => i && i.type === 'rollkragen')) ? [1, 'Rollkragen unter dem Blazer – elegant'] : null,
        o => (o.mid && o.mid.typeDef.slot === 'top' && o.mid.typeDef.layerOk) ? [-1.5, null] : null
      ]
    }
  };
  Object.entries(STYLES).forEach(([k, s]) => { s.id = k; s.tips = s.tips || []; s.extraNeutrals = s.extraNeutrals || []; });

  // ---------------------------------------------------------------- Grundausstattung je Stil (für „Ergänzen“)
  // t: passende Typen, c: empfohlene Farben, m: Material, g: nur für 'w' oder 'm', need: Material ist Pflicht
  const E_ = (t, c, title, why, extra) => Object.assign({ t, c, title, why }, extra || {});
  const ESSENTIALS = {
    italienisch: [
      E_(['stoffhose', 'chino', 'weitehose'], ['creme', 'navy', 'beige', 'schwarz'], 'Stoffhose oder Chino', 'Die Basis des italienischen Looks: sauberer Fall, gerades oder elegant weites Bein, eher hoher Bund.', { m: ['wolle', 'baumwolle', 'leinen'] }),
      E_(['hemd', 'bluse'], ['weiss', 'hellblau', 'creme'], 'Hemd oder Bluse in Weiß, Hellblau oder Creme', 'Hemd mit offenem Kragen oder Seidenbluse ersetzt das bedruckte T-Shirt.', { m: ['baumwolle', 'seide', 'leinen'] }),
      E_(['pullover', 'rollkragen', 'cardigan'], ['navy', 'camel', 'creme', 'grau'], 'Feiner Strick', 'Feinstrick wirkt gepflegter als Sweatshirts und lässt sich unter Sakko oder Mantel tragen.', { m: ['merino', 'kaschmir'] }),
      E_(['blazer'], ['navy', 'beige', 'braun', 'grau'], 'Weicher Blazer bzw. Sakko', 'Unstrukturiert, ohne starke Schulterpolster – zu Stoffhose, Jeans, Rock oder Kleid.'),
      E_(['loafer', 'derby'], ['braun', 'schwarz'], 'Loafer aus Leder', 'Der italienische Schuh schlechthin – statt klobiger Sportschuhe.', { m: ['leder', 'wildleder'] }),
      E_(['trench'], ['beige', 'navy'], 'Trenchcoat', 'Die elegante Antwort auf Regen und Übergangswetter.'),
      E_(['mantel'], ['camel', 'navy', 'grau'], 'Wollmantel', 'Für kalte Tage – eleganter als Daunen- oder Funktionsjacken.', { m: ['wolle'] }),
      E_(['sneaker'], ['weiss', 'creme'], 'Schlichte Ledersneaker', 'Wenn es lässig sein soll: glattes Leder, kein Logo.', { m: ['leder'], need: ['leder', 'wildleder'] }),
      E_(['guertel'], ['braun', 'schwarz'], 'Ledergürtel', 'Abgestimmt auf die Schuhe – ein typisch italienisches Detail.', { m: ['leder'] }),
      E_(['kleid_lang', 'rock_lang'], ['schwarz', 'bordeaux', 'creme', 'navy'], 'Midikleid oder fließender Rock', 'Wickelkleid, Etuikleid oder Rock mit schönem Fall.', { g: 'w', m: ['viskose', 'seide'] }),
      E_(['slingbacks', 'ballerinas', 'pumps'], ['schwarz', 'creme', 'braun'], 'Slingbacks oder Ballerinas', 'Elegante flache oder halbhohe Schuhe für Büro und Abend.', { g: 'w', m: ['leder'] }),
      E_(['tasche'], ['braun', 'camel', 'schwarz'], 'Schlichte Ledertasche', 'Gut verarbeitet und formschön statt großer Logos.', { m: ['leder'] }),
      E_(['tuch'], ['bordeaux', 'navy', 'creme'], 'Seidentuch', 'Ein Detail, das einen schlichten Look sofort italienisch wirken lässt.', { m: ['seide'] }),
      E_(['schmuck'], ['gold'], 'Goldschmuck', 'Creolen, eine feine Kette oder ein markanter Ring – ein bis zwei Stücke genügen.', { g: 'w' }),
      E_(['einstecktuch'], ['bordeaux', 'navy', 'creme'], 'Einstecktuch', 'Locker im Sakko getragen – der letzte Schliff.', { g: 'm' })
    ],
    klassisch: [
      E_(['blazer'], ['navy', 'schwarz', 'grau'], 'Blazer', 'Macht jede Kombination sofort klassisch.'),
      E_(['bluse', 'hemd'], ['weiss', 'hellblau'], 'Weiße Bluse oder weißes Hemd', 'Der klassische Allrounder.'),
      E_(['stoffhose'], ['navy', 'schwarz', 'grau'], 'Stoffhose', 'Gerade geschnitten, in einer Basisfarbe.'),
      E_(['rollkragen', 'pullover'], ['navy', 'camel', 'grau'], 'Feinstrick-Pullover', 'Pullover in Basisfarbe, solo oder über der Bluse.'),
      E_(['trench'], ['beige'], 'Trenchcoat', 'Zeitlos und regentauglich.'),
      E_(['mantel'], ['camel', 'navy'], 'Wollmantel', 'Klassisch warm durch den Winter.'),
      E_(['loafer', 'pumps', 'derby'], ['schwarz', 'braun'], 'Loafer oder Pumps', 'Klassische Lederschuhe für Büro und Anlass.'),
      E_(['tasche'], ['schwarz', 'braun', 'camel'], 'Ledertasche', 'Schlicht und hochwertig.')
    ],
    casual: [
      E_(['jeans'], ['jeansblau', 'navy'], 'Gut sitzende Jeans', 'Die Basis für lässige Looks.'),
      E_(['tshirt'], ['weiss', 'grau', 'navy'], 'Basic-T-Shirts', 'Uni in Weiß, Grau oder Navy – passen zu allem.'),
      E_(['pullover', 'sweatshirt'], ['grau', 'navy', 'creme'], 'Pullover oder Sweatshirt', 'Bequem für kühlere Tage.'),
      E_(['sneaker'], ['weiss'], 'Weiße Sneaker', 'Passen zu Jeans, Chino und Kleid.'),
      E_(['jeansjacke', 'uebergang'], ['jeansblau', 'oliv', 'navy'], 'Jeans- oder Übergangsjacke', 'Für Frühling und Herbst.'),
      E_(['cardigan'], ['grau', 'beige', 'navy'], 'Strickjacke', 'Für den Zwiebellook.')
    ],
    minimalistisch: [
      E_(['tshirt'], ['schwarz', 'weiss', 'grau'], 'Schlichte T-Shirts', 'In Schwarz, Weiß und Grau – die Grundlage.'),
      E_(['stoffhose', 'weitehose'], ['schwarz', 'grau', 'beige'], 'Klare Stoffhose', 'Gerade oder weit, ohne Details.'),
      E_(['rollkragen'], ['schwarz', 'creme', 'grau'], 'Rollkragenpullover', 'Ruhig, warm und schnörkellos.'),
      E_(['mantel'], ['schwarz', 'camel', 'grau'], 'Schlichter Mantel', 'Klare Linie, keine Verzierungen.'),
      E_(['hemd', 'bluse'], ['weiss'], 'Weißes Hemd', 'Klar und zeitlos.'),
      E_(['loafer', 'sneaker'], ['schwarz', 'weiss'], 'Schlichte Schuhe', 'Loafer oder Sneaker ohne Logo.')
    ],
    sportlich: [
      E_(['sneaker', 'laufschuhe'], ['weiss', 'grau', 'schwarz'], 'Sneaker', 'Pflicht beim sportlichen Look.'),
      E_(['leggings', 'jogginghose'], ['schwarz', 'grau', 'navy'], 'Leggings oder Jogger', 'Bequem für Alltag und Bewegung.'),
      E_(['hoodie', 'sweatjacke'], ['grau', 'navy', 'schwarz'], 'Hoodie oder Sweatjacke', 'Die sportliche Lage.'),
      E_(['regenjacke', 'parka'], ['schwarz', 'navy', 'oliv'], 'Funktions- oder Regenjacke', 'Für Wind und Wetter.'),
      E_(['tshirt'], ['weiss', 'grau', 'schwarz'], 'T-Shirts', 'Uni oder mit dezentem Print.')
    ],
    streetwear: [
      E_(['hoodie'], ['schwarz', 'grau', 'creme'], 'Oversized Hoodie', 'Das Herzstück der Streetwear.'),
      E_(['cargohose', 'weitehose'], ['schwarz', 'oliv', 'khaki'], 'Cargo- oder weite Hose', 'Weite Silhouette, praktische Taschen.'),
      E_(['sneaker'], ['weiss', 'schwarz'], 'Statement-Sneaker', 'Schuhe sind in der Streetwear zentral.'),
      E_(['parka', 'winterjacke', 'uebergang'], ['schwarz', 'oliv'], 'Bomber- oder Pufferjacke', 'Die typische Streetwear-Jacke.'),
      E_(['cap'], ['schwarz', 'weiss'], 'Cap', 'Das klassische Accessoire.')
    ],
    romantisch: [
      E_(['kleid_lang', 'kleid_kurz'], ['rosa', 'creme', 'flieder', 'mint'], 'Kleid mit zartem Muster', 'Florale oder gepunktete Kleider sind das Herz des romantischen Stils.'),
      E_(['bluse'], ['creme', 'rosa', 'weiss'], 'Romantische Bluse', 'Mit Spitze, Rüschen oder fließendem Stoff.', { m: ['spitze', 'chiffon', 'seide'] }),
      E_(['rock_lang'], ['rosa', 'creme', 'beige'], 'Midirock', 'Fließend und feminin.'),
      E_(['cardigan'], ['creme', 'rosa', 'hellblau'], 'Zarte Strickjacke', 'In Pastell über Kleid oder Bluse.'),
      E_(['ballerinas'], ['creme', 'rosa', 'beige'], 'Ballerinas', 'Feminine, flache Schuhe.')
    ],
    boho: [
      E_(['kleid_lang', 'rock_lang'], ['creme', 'rost', 'senf', 'braun'], 'Maxikleid oder Maxirock', 'Lang, fließend, gern gemustert.'),
      E_(['bluse'], ['creme', 'weiss'], 'Lockere Bluse', 'Luftig, gern mit Stickerei.', { m: ['baumwolle', 'leinen'] }),
      E_(['stiefeletten', 'stiefel'], ['braun', 'camel'], 'Wildleder-Stiefeletten', 'Erdige Farbe, weiches Material.', { m: ['wildleder'] }),
      E_(['weitehose'], ['beige', 'braun', 'oliv'], 'Weite Hose', 'Fließender Stoff, entspannter Schnitt.'),
      E_(['weste', 'cardigan'], ['camel', 'creme'], 'Weste oder lange Strickjacke', 'Die typische Boho-Lage.'),
      E_(['hut'], ['braun', 'beige'], 'Hut', 'Ob Strohhut oder Filzhut – ein Boho-Klassiker.')
    ],
    edgy: [
      E_(['lederjacke'], ['schwarz'], 'Schwarze Lederjacke', 'Das Erkennungszeichen des rockigen Stils.'),
      E_(['jeans'], ['schwarz', 'anthrazit'], 'Schwarze Jeans', 'Schmal geschnitten.'),
      E_(['stiefel', 'stiefeletten'], ['schwarz'], 'Boots', 'Robust und kantig.'),
      E_(['tshirt'], ['schwarz', 'grau', 'weiss'], 'Schwarze T-Shirts', 'Uni oder mit Bandprint.'),
      E_(['kleid_kurz', 'rock_kurz'], ['schwarz'], 'Kurzes schwarzes Kleid oder Rock', 'Gern zu Boots und Lederjacke.')
    ],
    preppy: [
      E_(['hemd', 'bluse'], ['hellblau', 'weiss'], 'Hemd oder Bluse mit Kragen', 'Damit der Kragen aus dem Pullover schauen kann.'),
      E_(['pullover'], ['navy', 'bordeaux', 'gruen'], 'Pullover zum Drüberziehen', 'Über Hemd oder Bluse – der Preppy-Klassiker.'),
      E_(['chino'], ['beige', 'navy'], 'Chino', 'Die Preppy-Hose schlechthin.'),
      E_(['loafer'], ['braun', 'bordeaux'], 'Loafer', 'Passen zu Chino, Rock und Kleid.'),
      E_(['blazer'], ['navy'], 'Navy-Blazer', 'Gern mit goldenen Knöpfen.'),
      E_(['trench'], ['beige'], 'Trenchcoat', 'Klassisch und regentauglich.')
    ],
    chic: [
      E_(['blazer'], ['schwarz', 'camel', 'creme'], 'Gut geschnittener Blazer', 'Macht jedes Outfit sofort elegant.'),
      E_(['stoffhose'], ['schwarz', 'creme'], 'Elegante Stoffhose', 'Mit Bügelfalte oder weitem Bein.'),
      E_(['bluse'], ['creme', 'weiss', 'schwarz'], 'Seidenbluse', 'Fließend und edel.', { m: ['seide'] }),
      E_(['pumps', 'slingbacks'], ['schwarz', 'beige'], 'Pumps oder Slingbacks', 'Elegante Schuhe für Büro und Abend.'),
      E_(['mantel'], ['camel', 'schwarz'], 'Eleganter Mantel', 'Klar geschnitten, gern aus Wolle oder Kaschmir.'),
      E_(['kleid_lang'], ['schwarz', 'navy'], 'Schlichtes Midikleid', 'Etui- oder Wickelkleid für jeden Anlass.'),
      E_(['tasche'], ['schwarz', 'camel'], 'Hochwertige Ledertasche', 'Schlicht, ohne Logo.', { m: ['leder'] })
    ]
  };
  const NO_STYLE = { id: '', tips: [], extraNeutrals: [], name: 'Allround', like: { types: [], colors: [], patterns: [], materials: [], fits: [] }, avoid: { types: [], patterns: [], materials: [] }, maxAccents: 2, maxBold: 1, rules: [] };

  // ---------------------------------------------------------------- Farb-Hilfen
  function hexToRgb(hex) { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function rgbToHsl([r, g, b]) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b); let h = 0, s = 0; const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min; s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60;
    }
    return [h, s, l];
  }
  function rgbToLab([r, g, b]) {
    const f = v => { v /= 255; return v > 0.04045 ? Math.pow((v + 0.055) / 1.055, 2.4) : v / 12.92; };
    const R = f(r), G = f(g), B = f(b);
    let x = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047, y = (R * 0.2126 + G * 0.7152 + B * 0.0722), z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
    const g3 = v => v > 0.008856 ? Math.cbrt(v) : 7.787 * v + 16 / 116;
    x = g3(x); y = g3(y); z = g3(z);
    return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
  }
  function labDist(a, b) { return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]); }
  function nearestColor(rgb, exclude) {
    const lab = rgbToLab(rgb); let best = null, bd = 1e9;
    for (const c of COLORS) {
      if (exclude && exclude.includes(c.id)) continue;
      if (c.groups.includes('metall') || c.groups.includes('haut')) continue; // Metallic und Hautfarben lassen sich vom Foto nicht sicher erkennen
      const d = labDist(lab, c.lab); if (d < bd) { bd = d; best = c; }
    }
    return best ? best.id : 'grau';
  }
  function hueDist(a, b) { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; }

  // Farberkennung aus Pixeldaten (RGBA, w×h). Gibt [Hauptfarbe, Zweitfarbe?] zurück.
  function detectColors(data, w, h) {
    const border = [], center = [];
    const bw = Math.max(2, Math.round(Math.min(w, h) * 0.07));
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4; if (data[i + 3] < 128) continue;
      const px = [data[i], data[i + 1], data[i + 2]];
      if (x < bw || y < bw || x >= w - bw || y >= h - bw) border.push(px);
      else if (x > w * 0.15 && x < w * 0.85 && y > h * 0.12 && y < h * 0.88) center.push(px);
    }
    const labs = center.map(rgbToLab);
    const bgClusters = kmeans(border.map(rgbToLab), 2, 6).filter(c => c.share > 0.3);
    let fg = labs.filter(l => !bgClusters.some(c => labDist(l, c.mean) < 14));
    if (fg.length < labs.length * 0.15) fg = labs; // Hintergrund nicht trennbar
    const cl = kmeans(fg, 4, 8).sort((a, b) => b.share - a.share);
    const toId = lab => nearestColor(labToRgb(lab));
    const first = toId(cl[0].mean);
    const out = [first];
    for (const c of cl.slice(1)) {
      if (c.share < 0.18) break;
      const id = toId(c.mean);
      if (id !== first && labDist(c.mean, cl[0].mean) > 18) { out.push(id); break; }
    }
    return out;
  }
  function kmeans(points, k, iter) {
    if (!points.length) return [{ mean: [50, 0, 0], share: 1 }];
    k = Math.min(k, points.length);
    let means = [];
    for (let i = 0; i < k; i++) means.push(points[Math.floor((i + 0.5) * points.length / k)].slice());
    let assign = new Array(points.length).fill(0);
    for (let it = 0; it < iter; it++) {
      for (let p = 0; p < points.length; p++) {
        let bi = 0, bd = 1e9;
        for (let m = 0; m < k; m++) { const d = labDist(points[p], means[m]); if (d < bd) { bd = d; bi = m; } }
        assign[p] = bi;
      }
      const sums = means.map(() => [0, 0, 0, 0]);
      for (let p = 0; p < points.length; p++) { const s = sums[assign[p]]; s[0] += points[p][0]; s[1] += points[p][1]; s[2] += points[p][2]; s[3]++; }
      means = means.map((m, i) => sums[i][3] ? [sums[i][0] / sums[i][3], sums[i][1] / sums[i][3], sums[i][2] / sums[i][3]] : m);
    }
    const counts = new Array(k).fill(0); assign.forEach(a => counts[a]++);
    return means.map((mean, i) => ({ mean, share: counts[i] / points.length })).filter(c => c.share > 0);
  }
  function labToRgb([L, a, b]) {
    let y = (L + 16) / 116, x = a / 500 + y, z = y - b / 200;
    const f = v => { const v3 = v * v * v; return v3 > 0.008856 ? v3 : (v - 16 / 116) / 7.787; };
    x = f(x) * 0.95047; y = f(y); z = f(z) * 1.08883;
    let r = x * 3.2406 + y * -1.5372 + z * -0.4986, g = x * -0.9689 + y * 1.8758 + z * 0.0415, bl = x * 0.0557 + y * -0.2040 + z * 1.0570;
    const c = v => Math.max(0, Math.min(255, Math.round((v > 0.0031308 ? 1.055 * Math.pow(v, 1 / 2.4) - 0.055 : 12.92 * v) * 255)));
    return [c(r), c(g), c(bl)];
  }

  // ---------------------------------------------------------------- Etikett lesen
  const LABEL_WORDS = {
    baumwolle: ['baumwolle', 'cotton', 'coton', 'cotone', 'algodon', 'katoen', 'bawelna'],
    polyester: ['polyester', 'poliester', 'poliestere'],
    viskose: ['viskose', 'viscose', 'viscosa', 'rayon'],
    elasthan: ['elasthan', 'elastane', 'elastan', 'spandex', 'lycra', 'elasthanne'],
    merino: ['merino', 'merinos', 'merinowolle'],
    wolle: ['wolle', 'wool', 'laine', 'lana', 'schurwolle', 'virgin'],
    kaschmir: ['kaschmir', 'cashmere', 'cachemire', 'cachemira', 'cashmir'],
    leinen: ['leinen', 'linen', 'lin', 'lino', 'linnen'],
    seide: ['seide', 'silk', 'soie', 'seta', 'seda'],
    polyamid: ['polyamid', 'polyamide', 'nylon', 'poliamida', 'poliammide'],
    acryl: ['acryl', 'acrylic', 'acrylique', 'acrilico'],
    modal: ['modal'], lyocell: ['lyocell', 'tencel'],
    leder: ['leder', 'leather', 'cuir', 'pelle', 'piel'],
    daunen: ['daunen', 'daune', 'duvet', 'piumino', 'plumon']
  };
  function normWord(s) { return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zß]/g, ''); }
  function parseLabel(text) {
    const lookup = word => {
      const w = normWord(word); if (w.length < 3) return null;
      for (const [id, words] of Object.entries(LABEL_WORDS)) if (words.some(x => w === x || (x.length >= 5 && w.startsWith(x)))) return id;
      return null;
    };
    const parse = t => {
      // Tokens in Lesereihenfolge: Prozentzahlen und Materialwörter
      const toks = []; let m;
      const re = /(\d{1,3})\s*[%％]|([A-Za-zÀ-ÿß]{3,})/g;
      while ((m = re.exec(t))) {
        if (m[1]) { const p = +m[1]; if (p > 0 && p <= 100) toks.push({ p }); }
        else { const id = lookup(m[2]); if (id) toks.push({ id }); }
      }
      const found = {};
      const first = toks.findIndex(x => x.p || x.id);
      const pctFirst = first >= 0 && toks[first].p != null;
      for (let i = 0; i < toks.length - 1; i++) {
        const a = toks[i], b = toks[i + 1];
        if (pctFirst && a.p != null && b.id && !(b.id in found)) { found[b.id] = a.p; i++; }
        else if (!pctFirst && a.id && b.p != null && !(a.id in found)) { found[a.id] = b.p; i++; }
      }
      return found;
    };
    const clean = text.replace(/\s+/g, ' ');
    const cut = clean.split(/\b(?:innen)?futter|lining|doublure|fodera|forro|voering/i)[0];
    let found = parse(cut);
    if (!Object.keys(found).length) found = parse(clean);
    const list = Object.entries(found).map(([id, pct]) => ({ id, pct })).sort((a, b) => b.pct - a.pct);
    let warmthHint = 0;
    const pct = id => (found[id] || 0);
    if (pct('daunen') >= 50) warmthHint = 2;
    else if (pct('wolle') + pct('merino') + pct('kaschmir') >= 50) warmthHint = 1;
    else if (pct('leinen') >= 50 || pct('seide') >= 70) warmthHint = -1;
    return { materials: list, warmthHint };
  }

  // ---------------------------------------------------------------- Outfit-Hilfen
  // under: Shirt unter dem Trägerkleid · mid: Zwischenlage · layer: offene Lage über der Zwischenlage (z. B. Sakko über Pullover)
  const MAIN_SLOTS = ['top', 'under', 'mid', 'layer', 'bottom', 'onepiece'];
  const ORDER = ['outer', 'layer', 'mid', 'top', 'under', 'onepiece', 'bottom', 'legs', 'shoes'];
  function pieces(o, withOuterShoes) {
    const out = [];
    for (const s of MAIN_SLOTS) if (o[s]) out.push(o[s]);
    if (withOuterShoes) { if (o.outer) out.push(o.outer); if (o.shoes) out.push(o.shoes); }
    return out;
  }
  const prim = it => it._c || COLOR[it.colors && it.colors[0]] || COLOR.grau;   // _c: beim Vorbereiten zwischengespeichert
  function neutralShare(o) { const p = pieces(o, true); return p.filter(i => prim(i).neutral).length / (p.length || 1); }
  function earthShare(o) { const p = pieces(o, true); return p.filter(i => prim(i).groups.includes('erd')).length / (p.length || 1); }
  function darkShare(o) { const p = pieces(o, true); return p.filter(i => ['schwarz', 'anthrazit'].includes(prim(i).id) || prim(i).groups.includes('dunkel')).length / (p.length || 1); }
  function colorCount(o) { const s = new Set(); pieces(o, true).forEach(i => (i.colors || []).forEach(c => s.add(c))); return s.size; }
  function toneInTone(o) {
    const p = pieces(o, false); if (p.length < 2) return false;
    const cs = p.map(prim);
    if (cs.every(c => c.id === cs[0].id)) return true;
    const fam = c => c.groups.includes('erd') ? 'erd' : (['schwarz', 'anthrazit', 'grau', 'hellgrau', 'weiss', 'silber'].includes(c.id) ? 'grau' : c.id);
    return cs.every(c => fam(c) === fam(cs[0])) && p.every(i => (i.pattern || 'uni') === 'uni');
  }
  function statementCount(o) {
    return pieces(o, true).filter(i => (PATTERNS[i.pattern] || PATTERNS.uni).bold >= 1 || prim(i).groups.includes('kraeftig') || prim(i).groups.includes('metall') ||
      (i.materials || []).some(m => ['pailletten', 'satin'].includes(m))).length;
  }
  function familyCount(o) {
    const fam = id => ['braun', 'camel', 'beige', 'khaki'].includes(id) ? 'braun' : ['weiss', 'creme'].includes(id) ? 'weiss' : ['grau', 'hellgrau', 'anthrazit', 'silber'].includes(id) ? 'grau' : id;
    return new Set(pieces(o, true).map(i => fam(prim(i).id))).size;
  }
  // Ton in Ton lebt von unterschiedlichen Stoffen
  function TONAL_TIP(o) {
    return (toneInTone(o) || tonalInfo(o)) ? 'Bei Ton in Ton verschiedene Stoffe mischen, etwa Strick zu Seide, Wolle zu Leinen oder Leder – dann wirkt es lebendig statt flach.' : null;
  }
  // Oberteil in den Bund stecken (für Frauen bzw. ohne Angabe)
  function TUCK(o, C) {
    return (C.gender !== 'm' && o.top && !(o.mid && !isOpenLayer(o.mid)) && ['bluse', 'tshirt', 'top', 'body', 'langarm'].includes(o.top.type) && o.bottom && ['stoffhose', 'weitehose', 'chino', 'jeans', 'rock_lang', 'rock_kurz'].includes(o.bottom.type))
      ? 'Oberteil vorne in den Bund stecken – das betont die Taille.' : null;
  }
  function hasMaterial(o, m) { return pieces(o, true).some(i => (i.materials || []).includes(m)); }
  function boldCount(o) { return pieces(o, true).reduce((s, i) => s + ((PATTERNS[i.pattern] || PATTERNS.uni).bold), 0); }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const fmtDeg = v => { const r = Math.round(v); return (r < 0 ? '−' : '') + Math.abs(r); };
  function coreKey(o) { return MAIN_SLOTS.map(s => o[s] ? o[s].id : '').filter(Boolean).sort().join('+'); }
  function fullKey(o) { return ORDER.map(s => o[s] ? o[s].id : '').filter(Boolean).sort().join('+'); }
  function pairKey(a, b) { return a < b ? a + '|' + b : b + '|' + a; }
  function daysBetween(a, b) { return Math.round((Date.parse(b) - Date.parse(a)) / 864e5); }
  function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return ((h >>> 0) % 10000) / 10000; }

  // ---------------------------------------------------------------- Lagen (Layering)
  // Offene Lage: Strickjacke, Blazer, Weste, Overshirt – oder ein Hemd, das offen über einem Shirt getragen wird
  const isOpenLayer = it => !!it.typeDef.open || (!!it.typeDef.layerOk && it.typeDef.slot === 'top');
  const hasBlazer = o => [o.mid, o.layer].some(i => i && i.type === 'blazer');
  const shortType = it => { const n = it.typeDef.name.replace(/ \(.*\)/, '').split(' / '); return n[0].endsWith('-') && n[1] ? n[1] : n[0]; };

  // Zwischenlage: Pullover über Basis-Oberteil, offenes Hemd über Shirt oder offene Lage über Oberteil/Kleid?
  function midFits(mid, o) {
    const md = mid.typeDef;
    if (md.slot === 'top') {
      if (o.onepiece || !o.top || o.top.id === mid.id) return false;
      if (md.knit && md.overBase) return !!o.top.typeDef.base;                 // Pullover/Sweatshirt über Shirt, Bluse, Hemd
      if (md.layerOk) return ['tshirt', 'top', 'langarm', 'body'].includes(o.top.type) && !(mid.materials || []).some(m => m === 'seide' || m === 'satin'); // Hemd offen über Shirt
      return false;
    }
    if (o.onepiece) return !!md.open && !md.vest;
    if (!o.top) return false;
    const td = o.top.typeDef;
    if (md.open) {
      if (td.hood) return mid.type === 'blazer' || mid.type === 'overshirt';
      if (td.knit && mid.type !== 'blazer' && mid.type !== 'overshirt') return false;
      return true;
    }
    return false;
  }
  // Dritte Lage: Blazer, Strickjacke oder Overshirt über Pullover bzw. Pullunder
  function layerFits(l, o) {
    if (!o.mid || o.onepiece || !o.top || l.id === o.mid.id || l.id === o.top.id) return false;
    const ld = l.typeDef, md = o.mid.typeDef;
    if (ld.slot !== 'mid' || !ld.open || ld.vest) return false;
    if (md.vest) return ['blazer', 'cardigan', 'overshirt'].includes(l.type);
    if (md.knit && md.overBase) return ['blazer', 'overshirt'].includes(l.type);
    return false;
  }
  // Strumpfhose unter Rock, Kleid, Shorts oder Hose; Leggings unter Rock, Kleid oder Shorts
  const bareLegs = b => !!(b && (b.typeDef.skirt || b.typeDef.dress || b.typeDef.short));
  function legsFits(l, o) {
    const b = o.bottom || o.onepiece; if (!b || !l.typeDef.legLayer || b.id === l.id) return false;
    if (l.typeDef.slot !== 'legs') return bareLegs(b);                       // Leggings nur unter Rock, Kleid, Shorts
    return bareLegs(b) || ['jeans', 'stoffhose', 'chino', 'weitehose', 'cargohose', 'jumpsuit'].includes(b.type);
  }
  const legsVisible = o => !!(o.legs && bareLegs(o.bottom || o.onepiece));
  // Shirt, Bluse oder feiner Rollkragen unter dem Träger- bzw. Slipkleid
  function underFits(u, o) {
    return !!(o.onepiece && o.onepiece.typeDef.traeger && u.typeDef.slot === 'top' && u.typeDef.underOk && u.warmth <= 3);
  }

  // ---------------------------------------------------------------- Farbregeln
  // Farbtemperatur der Akzentfarben (Neutraltöne passen zu beidem)
  const WARM = new Set(['creme', 'beige', 'camel', 'braun', 'khaki', 'oliv', 'senf', 'rost', 'orange', 'koralle', 'gelb', 'gold']);
  const KUEHL = new Set(['hellblau', 'blau', 'petrol', 'tuerkis', 'mint', 'flieder', 'lila', 'rosa', 'pink', 'silber']);
  const chroma = c => Math.hypot(c.lab[1], c.lab[2]);
  // Farbfamilien für Ton-in-Ton-Abstufungen
  const TONE_FAM = { creme: 'erd', beige: 'erd', camel: 'erd', braun: 'erd', khaki: 'erd', weiss: 'unbunt', hellgrau: 'unbunt', grau: 'unbunt', anthrazit: 'unbunt', schwarz: 'unbunt', silber: 'unbunt',
    hellblau: 'blau', jeansblau: 'blau', blau: 'blau', navy: 'blau', mint: 'gruen', gruen: 'gruen', oliv: 'gruen', petrol: 'petrol', tuerkis: 'petrol', flieder: 'lila', lila: 'lila',
    rosa: 'rot', pink: 'rot', rot: 'rot', bordeaux: 'rot', koralle: 'orange', orange: 'orange', rost: 'orange', senf: 'gelb', gelb: 'gelb', gold: 'gelb' };
  const toneFam = id => TONE_FAM[id] || id;

  // Bekannte Farbpaare. kind: near = zu ähnlich („knapp daneben“), clash = beißt sich,
  // heikel = je nach Stil ein No-Go, klassiker = bewährte Kombination. w = Stärke
  const PAIRS = {};
  const P_ = (a, b, kind, w, why) => { PAIRS[pairKey(a, b)] = { kind, w, why }; };
  P_('schwarz', 'navy', 'near', 1.5, 'Schwarz und Dunkelblau direkt nebeneinander wirken wie ein Versehen');
  P_('schwarz', 'anthrazit', 'near', 1.2, 'Anthrazit neben Schwarz wirkt wie verwaschenes Schwarz');
  P_('navy', 'anthrazit', 'near', 1, 'Dunkelblau und Anthrazit sind sich zu ähnlich');
  P_('navy', 'petrol', 'near', 0.8, 'Dunkelblau und Petrol sind sich zu ähnlich');
  P_('weiss', 'creme', 'near', 1.2, 'Neben Reinweiß wirkt Creme schnell vergilbt');
  P_('hellgrau', 'silber', 'near', 0.8, 'Hellgrau und Silber sind sich zu ähnlich');
  P_('beige', 'khaki', 'near', 1, 'Beige und Khaki sind fast, aber nicht ganz gleich');
  P_('camel', 'khaki', 'near', 0.7, 'Camel und Khaki sind sich zu ähnlich');
  P_('rot', 'koralle', 'near', 1.2, 'Rot und Koralle sind sich zu ähnlich');
  P_('rot', 'rost', 'near', 1, 'Rot und Rostrot sind sich zu ähnlich');
  P_('koralle', 'orange', 'near', 1, 'Koralle und Orange sind sich zu ähnlich');
  P_('koralle', 'rost', 'near', 0.8, 'Koralle und Rostrot sind sich zu ähnlich');
  P_('rost', 'orange', 'near', 0.8, 'Rostrot und Orange sind sich zu ähnlich');
  P_('gelb', 'senf', 'near', 1, 'Gelb und Senfgelb sind sich zu ähnlich');
  P_('gruen', 'tuerkis', 'near', 0.8, 'Grün und Türkis sind sich zu ähnlich');
  P_('gruen', 'oliv', 'near', 0.8, 'Grün und Oliv sind sich zu ähnlich');
  P_('blau', 'jeansblau', 'near', 0.7, 'Zwei Blautöne, die sich zu nah sind');
  P_('rot', 'pink', 'clash', 1.5, 'Rot und Pink beißen sich');
  P_('rot', 'orange', 'clash', 1.2, 'Rot und Orange beißen sich');
  P_('rot', 'gruen', 'clash', 1.2, 'Rot und Grün in voller Stärke wirken wie Weihnachten');
  P_('pink', 'orange', 'clash', 1.2, 'Pink und Orange beißen sich');
  P_('pink', 'koralle', 'clash', 1.2, 'Pink und Koralle beißen sich');
  P_('pink', 'bordeaux', 'clash', 0.8, 'Pink und Bordeaux beißen sich');
  P_('schwarz', 'braun', 'heikel', 1, 'Schwarz und Braun gelten klassisch als No-Go');
  P_('navy', 'weiss', 'klassiker', 1, 'Dunkelblau und Weiß – frisch und klar');
  P_('navy', 'creme', 'klassiker', 1, 'Dunkelblau und Creme – weicher als Weiß');
  P_('navy', 'braun', 'klassiker', 1, 'Dunkelblau und Braun – ein Klassiker');
  P_('navy', 'camel', 'klassiker', 1, 'Dunkelblau und Camel – zeitlos');
  P_('navy', 'beige', 'klassiker', 0.8, 'Dunkelblau und Beige – zeitlos');
  P_('navy', 'grau', 'klassiker', 0.8, 'Dunkelblau und Grau – ruhig und edel');
  P_('navy', 'hellblau', 'klassiker', 0.8, 'Hell- und Dunkelblau abgestuft');
  P_('navy', 'bordeaux', 'klassiker', 0.6, 'Dunkelblau und Bordeaux – gedeckt und edel');
  P_('schwarz', 'weiss', 'klassiker', 1, 'Schwarz-Weiß – klarer geht es nicht');
  P_('schwarz', 'creme', 'klassiker', 0.8, 'Schwarz und Creme – weicher als Schwarz-Weiß');
  P_('schwarz', 'camel', 'klassiker', 0.8, 'Schwarz und Camel – elegant');
  P_('grau', 'camel', 'klassiker', 0.8, 'Grau und Camel – kühl und warm im Gleichgewicht');
  P_('grau', 'braun', 'klassiker', 0.6, 'Grau und Braun – gedeckt und edel');
  P_('grau', 'bordeaux', 'klassiker', 0.8, 'Grau und Bordeaux – gedeckt und edel');
  P_('grau', 'rosa', 'klassiker', 0.8, 'Grau und Rosa – zart und modern');
  P_('camel', 'weiss', 'klassiker', 0.8, 'Camel und Weiß – hell und edel');
  P_('jeansblau', 'weiss', 'klassiker', 1, 'Jeans und Weiß – der lässige Klassiker');
  P_('jeansblau', 'camel', 'klassiker', 0.8, 'Jeansblau und Camel – lässig und warm');
  P_('jeansblau', 'hellblau', 'klassiker', 0.6, 'Hellblau zur Jeans – ein lässiger Klassiker');
  P_('oliv', 'creme', 'klassiker', 0.8, 'Oliv und Creme – erdig und frisch');
  P_('oliv', 'camel', 'klassiker', 0.8, 'Oliv und Camel – erdig und warm');
  P_('oliv', 'weiss', 'klassiker', 0.6, 'Oliv und Weiß – frisch');
  P_('oliv', 'rosa', 'klassiker', 0.6, 'Oliv und Rosa – überraschend harmonisch');
  P_('hellblau', 'beige', 'klassiker', 0.8, 'Hellblau und Beige – sommerlich leicht');
  P_('hellblau', 'camel', 'klassiker', 0.8, 'Hellblau und Camel – frisch und warm');
  P_('bordeaux', 'camel', 'klassiker', 0.6, 'Bordeaux und Camel – herbstlich edel');
  P_('rost', 'creme', 'klassiker', 0.6, 'Rostrot und Creme – warm und weich');
  P_('rost', 'navy', 'klassiker', 0.6, 'Rostrot und Dunkelblau – warm trifft kühl');
  P_('senf', 'navy', 'klassiker', 0.6, 'Senfgelb und Dunkelblau – lebendig und gedeckt');
  P_('senf', 'petrol', 'klassiker', 0.6, 'Senfgelb und Petrol – Retro-Klassiker');
  P_('koralle', 'tuerkis', 'klassiker', 0.6, 'Koralle und Türkis – sommerlich');

  // Beziehung zweier Farben (unabhängig vom Stil)
  const REL_CACHE = {};
  function colorRel(a, b) {
    if (a === b) return { kind: 'same' };
    const key = pairKey(a, b);
    if (REL_CACHE[key]) return REL_CACHE[key];
    let r = PAIRS[key];
    if (!r) {
      const A = COLOR[a] || COLOR.grau, B = COLOR[b] || COLOR.grau;
      const dE = labDist(A.lab, B.lab), cA = chroma(A), cB = chroma(B), hd = hueDist(A.hsl[0], B.hsl[0]);
      const tA = WARM.has(a) ? 1 : KUEHL.has(a) ? -1 : 0, tB = WARM.has(b) ? 1 : KUEHL.has(b) ? -1 : 0;
      if (A.neutral && B.neutral) r = dE < 15 ? { kind: 'near', w: 0.6, why: A.name + ' und ' + B.name + ' sind sich zu ähnlich' } : { kind: 'neutral' };
      else if (A.neutral || B.neutral) r = { kind: 'accent' };
      else if (dE < 18) r = { kind: 'near', w: 0.8, why: A.name + ' und ' + B.name + ' sind sich zu ähnlich' };
      else if (A.groups.includes('pastell') && B.groups.includes('pastell')) r = { kind: 'harmonie', w: 1, why: 'Zarte Pastelltöne harmonieren' };
      else if (hd >= 150) r = (cA > 45 && cB > 45 && Math.abs(A.lab[0] - B.lab[0]) < 25)
        ? { kind: 'grell', w: 1, why: A.name + ' und ' + B.name + ' in voller Stärke wirken grell' }
        : { kind: 'harmonie', w: 1.2, why: 'Gegenfarben, eine davon gedämpft – spannend und stimmig' };
      else if (hd >= 55 && hd <= 140 && A.hsl[1] > 0.4 && B.hsl[1] > 0.4 && cA > 20 && cB > 20) r = { kind: 'clash', w: 1, why: A.name + ' und ' + B.name + ' beißen sich' };
      else if (tA * tB < 0 && cA > 35 && cB > 35) r = { kind: 'temp', w: 1, why: (tA > 0 ? A.name + ' (warm) und ' + B.name + ' (kühl)' : B.name + ' (warm) und ' + A.name + ' (kühl)') + ' vertragen sich schlecht' };
      else if (hd <= 40) r = { kind: 'harmonie', w: 1, why: 'Benachbarte Farbtöne harmonieren' };
      else r = { kind: 'ok' };
    }
    REL_CACHE[key] = r;
    return r;
  }

  // Welche Teile berühren sich optisch? [Teil A, Teil B, Gewicht]
  function touching(o) {
    const P = [], add = (a, b, w) => { if (a && b && a !== b) P.push([a, b, w]); };
    const legs = o.bottom || o.onepiece;
    const closedMid = o.mid && !isOpenLayer(o.mid);   // Pullover verdeckt das Oberteil fast ganz
    if (o.onepiece) {
      add(o.under, o.onepiece, 0.9); add(o.mid, o.onepiece, 0.9); add(o.mid, o.under, 0.5);
    } else {
      add(o.top, o.bottom, closedMid ? 0.3 : 1);
      add(o.mid, o.top, closedMid ? 0.5 : 0.8);
      add(o.mid, o.bottom, closedMid ? 1 : 0.7);
      add(o.layer, o.mid, 0.8); add(o.layer, o.bottom, 0.7); add(o.layer, o.top, 0.3);
    }
    const inner = o.layer || o.mid || o.top || o.onepiece;
    add(o.outer, inner, 0.6);
    if (inner !== legs) add(o.outer, legs, 0.5);
    add(o.shoes, legs, 0.5);
    return P;
  }

  // Ton in Ton abgestuft: Mehrere Töne einer Farbfamilie in Hell und Dunkel
  function tonalInfo(o) {
    const big = pieces(o, false).concat(o.outer ? [o.outer] : []);
    if (big.length < 2) return null;
    const cnt = {}, ids = {};
    for (const it of big) { const f = toneFam(prim(it).id); cnt[f] = (cnt[f] || 0) + 1; (ids[f] = ids[f] || new Set()).add(prim(it).id); }
    const [f, n] = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0];
    if (n < 2 || n / big.length < 0.66 || ids[f].size < 2) return null;
    const Ls = big.filter(i => toneFam(prim(i).id) === f).map(i => prim(i).lab[0]);
    const span = Math.max(...Ls) - Math.min(...Ls);
    if (span < 12 || (f === 'unbunt' && span > 60)) return null;   // Schwarz-Weiß ist Kontrast, kein Ton in Ton
    return { fam: f, dark: Math.max(...Ls) <= 60 };
  }

  // Farbwelt je Stil
  // accents: passende Akzentfarben · avoid: Farben, die nicht zum Stil passen · maxColors: Hauptfarben
  // contrast: idealer Hell-Dunkel-Abstand oben/unten (0–100) · tonal: Bonus für Ton in Ton abgestuft
  // near/clash/grell/heikel/klassiker/harmony: wie stark diese Farbbeziehungen zählen
  // pairs: eigene Bewertung einzelner Paare · echo: Bonus, wenn eine Farbe wieder aufgegriffen wird
  // frame: Bonus für helle Lage innen, dunkle außen · shoesDark: Schuhe nicht heller als die Hose
  // darkMax: höchster Anteil dunkler Teile · temp: bevorzugte Farbtemperatur · layers: Lagen-Regeln in Worten
  const PAL_DEFAULT = { accents: [], avoid: [], maxColors: 4, maxBonus: 0, maxWhy: null, countAll: false, contrast: [10, 90], tonalOk: true, contrastWhy: null,
    tonal: 0, tonalWhy: 'Ton in Ton abgestuft', temp: null, near: 1, clash: 1, grell: 1, blocking: 0, heikel: 0.5, klassiker: 0.6, harmony: 1, echo: 0.5, frame: 0,
    shoesDark: 0, darkMax: null, darkWhy: null, pairs: {}, layers: [], layerPref: -0.3,
    leggings: -0.5, tightsColor: 0, tightsPattern: -1, tightsFine: 0 };
  const PALETTES = {
    italienisch: { leggings: -2, tightsColor: 0, tightsPattern: -1, tightsFine: 0.6, contrastText: 'Weiche Kontraste, gern Ton in Ton abgestuft – Creme statt Reinweiß zu Dunkelblau', layerPref: 0.6, accents: ['bordeaux', 'oliv', 'rost', 'rot', 'senf', 'hellblau', 'gruen', 'petrol'], avoid: ['pink', 'tuerkis', 'gelb', 'orange', 'lila', 'koralle', 'flieder', 'mint'],
      maxColors: 3, maxBonus: 1, contrast: [0, 55], contrastWhy: 'Weiche Kontraste statt hartem Schwarz-Weiß', tonal: 1.2, tonalWhy: 'Abgestufte Töne einer Farbfamilie – sehr italienisch',
      near: 1, clash: 1.2, grell: 1.5, heikel: 0, klassiker: 1, echo: 0.8, frame: 0.6,
      pairs: { 'navy|schwarz': [-0.4, null], 'braun|navy': [1.5, 'Blau und Braun – der italienische Klassiker'], 'braun|grau': [1, 'Grau und Braun – typisch italienisch'],
        'hellblau|navy': [1.2, 'Hellblau und Dunkelblau abgestuft – azzurro e blu'], 'creme|navy': [1.2, 'Dunkelblau mit Creme statt Reinweiß – weicher'], 'schwarz|weiss': [-0.6, 'Hartes Schwarz-Weiß wirkt wenig italienisch'], 'creme|weiss': [-0.5, null] },
      layers: ['Hemd, Feinstrick und Sakko an kalten Tagen', 'Feinstrick unter dem Sakko statt Sweatshirt', 'Mantel oder Trench über dem Sakko', 'Bei kühlen Abenden einen Pullover über die Schultern legen', 'Helle Lage innen, dunklere außen', 'Strumpfhose blickdicht in Schwarz, Dunkelblau oder Braun, im Sommer fein oder hautfarben – keine Leggings unter Rock oder Kleid'] },
    klassisch: { leggings: -2, tightsColor: 0, tightsPattern: -1, tightsFine: 0.6, contrastText: 'Klarer Hell-Dunkel-Kontrast, etwa Dunkelblau zu Weiß', layerPref: 0.3, accents: ['bordeaux', 'rot', 'hellblau', 'rosa', 'gruen', 'petrol'], avoid: ['pink', 'orange', 'gelb', 'tuerkis', 'lila', 'koralle', 'mint', 'senf'],
      maxColors: 3, maxBonus: 0.5, contrast: [25, 90], contrastWhy: 'Klarer Hell-Dunkel-Kontrast – typisch klassisch', tonal: 0.5,
      near: 1.3, clash: 1.2, grell: 1.5, heikel: 1.8, klassiker: 1, echo: 0.8, frame: 0.6, shoesDark: 1,
      pairs: { 'navy|weiss': [1.2, 'Dunkelblau und Weiß – der klassische Kontrast'] },
      layers: ['Hemd oder Bluse unter dem Pullover, Kragen sichtbar', 'Pullunder oder Feinstrick unter dem Blazer', 'Mantel über dem Blazer', 'Strumpfhose schlicht in Schwarz, Dunkelblau oder Hautfarben – keine Leggings unter dem Rock'] },
    casual: { leggings: 0, tightsColor: 0.3, tightsPattern: -0.3, pairs: { 'jeansblau|grau': [0.6, 'Jeans und Grau – lässig'], 'jeansblau|oliv': [0.6, 'Jeans und Oliv – entspannt'], 'jeansblau|navy': [0.6, 'Jeans und Dunkelblau – Ton in Ton lässig'] }, contrastText: 'Frei – nur oben und unten nicht fast gleich hell', layerPref: -0.3, maxColors: 4, contrast: [10, 90], near: 1, clash: 1, grell: 0.8, heikel: 0.3, klassiker: 0.8, echo: 0.6,
      layers: ['Offenes Hemd oder Overshirt über dem T-Shirt', 'Hoodie unter der Jeans- oder Übergangsjacke', 'Strickjacke für den Zwiebellook', 'Blickdichte Strumpfhose oder Leggings unter Rock und Kleid, dazu Stiefel oder Sneaker'] },
    minimalistisch: { leggings: -1, tightsColor: 0, tightsPattern: -1.5, pairs: { 'schwarz|weiss': [1.2, 'Schwarz-Weiß – minimalistisch klar'], 'beige|weiss': [0.6, 'Beige und Weiß – ruhig und hell'], 'camel|schwarz': [0.8, 'Camel und Schwarz – reduziert und warm'] }, contrastText: 'Entweder Ton in Ton oder klar wie Schwarz-Weiß, nichts dazwischen', layerPref: -0.6, maxColors: 3, maxBonus: 1, maxWhy: ['Höchstens drei Farben', 'Zu viele Farben für einen minimalistischen Look'], countAll: true,
      contrast: [55, 100], contrastWhy: 'Klarer Kontrast statt Mittelmaß', contrastMid: 'Weder Ton in Ton noch klarer Kontrast', near: 1.6, clash: 1.5, grell: 1.5, heikel: 0.8, klassiker: 0.5, echo: 0,
      layers: ['Rollkragen unter Blazer oder Mantel', 'Lagen Ton in Ton oder klar Schwarz-Weiß', 'Lieber zwei Lagen als drei', 'Strumpfhose uni im Ton von Rock oder Schuhen – nichts Gemustertes'] },
    sportlich: { leggings: 1, tightsPattern: -0.5, pairs: { 'navy|weiss': [0.8, 'Dunkelblau und Weiß – sportlich frisch'], 'schwarz|weiss': [0.8, 'Schwarz-Weiß – sportlich klar'], 'grau|navy': [0.6, 'Grau und Dunkelblau – Trainings-Klassiker'] }, contrastText: 'Kräftige Kontraste, Color-Blocking erlaubt', layerPref: -1.2, maxColors: 4, contrast: [30, 100], contrastWhy: 'Kräftiger Kontrast – sportlich frisch', near: 0.8, clash: 0.6, grell: 0.2, blocking: 0.8, heikel: 0.2, klassiker: 0.6, echo: 0.8,
      layers: ['Sweatjacke über dem Shirt', 'Funktionsjacke als äußerste Lage', 'Leggings unter Rock oder Kleid, dazu Sneaker'] },
    streetwear: { leggings: 0.5, tightsColor: 0.3, tightsPattern: 0.3, pairs: { 'oliv|schwarz': [0.8, 'Oliv und Schwarz – urban'], 'beige|schwarz': [0.6, 'Beige und Schwarz – clean'], 'khaki|weiss': [0.6, 'Khaki und Weiß – lässig'], 'grau|schwarz': [0.6, 'Grau und Schwarz – urban abgestuft'] }, contrastText: 'Ton in Ton von Kopf bis Fuß oder ein bewusster Kontrast', layerPref: 0, maxColors: 3, maxBonus: 0.5, contrast: null, tonal: 1.2, tonalWhy: 'Ton in Ton von Kopf bis Fuß – typisch Streetwear', near: 1, clash: 0.8, grell: 0.5, blocking: 0.6, heikel: 0, klassiker: 0.5, echo: 1,
      layers: ['Hoodie unter Jacke oder Overshirt', 'Overshirt offen über dem T-Shirt', 'Oversized-Lagen über schmaler Hose', 'Leggings oder blickdichte Strumpfhose unter Rock und Shorts'] },
    romantisch: { leggings: -1, tightsColor: 0.6, tightsPattern: 0.8, tightsFine: 0.4, contrastText: 'Sanfte, helle Kontraste, kein hartes Schwarz-Weiß', layerPref: -0.6, accents: ['rosa', 'flieder', 'mint', 'hellblau', 'koralle', 'bordeaux'], avoid: ['orange', 'gelb', 'senf', 'gruen', 'tuerkis', 'oliv', 'rost'],
      maxColors: 3, contrast: [0, 40], contrastWhy: 'Sanfte, helle Kontraste', contrastHigh: 'Harter Hell-Dunkel-Kontrast wirkt wenig romantisch', tonal: 0.6, tonalWhy: 'Zarte Abstufungen einer Farbe',
      near: 1, clash: 1.3, grell: 1.5, heikel: 0.5, klassiker: 0.8, harmony: 1.5, echo: 0.8, darkMax: 0.5, darkWhy: 'Viel Dunkles wirkt wenig romantisch',
      pairs: { 'schwarz|weiss': [-0.8, 'Hartes Schwarz-Weiß wirkt wenig romantisch'], 'rosa|creme': [1, 'Rosa und Creme – zart und weich'], 'rosa|grau': [1, 'Rosa und Grau – zart und modern'],
        'flieder|creme': [0.8, 'Flieder und Creme – verträumt'], 'mint|weiss': [0.8, 'Mint und Weiß – frisch'], 'hellblau|weiss': [0.8, 'Hellblau und Weiß – luftig'], 'bordeaux|rosa': [0.6, 'Bordeaux und Rosa – romantisch abgestuft'] },
      layers: ['Zarte Strickjacke über dem Kleid', 'Bluse unter dem Träger- oder Slipkleid', 'Feiner Rollkragen unter dem Trägerkleid im Winter', 'Feine oder zart gemusterte Strumpfhose, gern farbig – Leggings eher nicht'] },
    boho: { leggings: 0, tightsColor: 0.8, tightsPattern: 0.6, contrastText: 'Weiche, erdige Übergänge in warmen Tönen', layerPref: 0.3, accents: ['rost', 'senf', 'oliv', 'bordeaux', 'koralle', 'tuerkis', 'petrol', 'orange'], avoid: ['pink', 'lila', 'blau', 'flieder'],
      maxColors: 4, contrast: [0, 50], contrastWhy: 'Weiche, erdige Übergänge', tonal: 1, tonalWhy: 'Erdtöne in Abstufungen', temp: 'warm',
      pairs: { 'rost|creme': [1, 'Rostrot und Creme – warm und weich'], 'senf|braun': [0.8, 'Senfgelb und Braun – erdig'], 'oliv|rost': [0.8, 'Oliv und Rostrot – herbstlich'], 'camel|creme': [0.8, 'Camel und Creme – sanft abgestuft'], 'tuerkis|braun': [0.8, 'Türkis und Braun – wie Schmuck auf Leder'], 'bordeaux|senf': [0.6, 'Bordeaux und Senf – satte Erdtöne'] },
      near: 0.8, clash: 1, grell: 1.2, heikel: 0, klassiker: 0.8, echo: 1, darkMax: 0.5, darkWhy: 'Viel Schwarz wirkt wenig nach Boho',
      layers: ['Weste oder lange Strickjacke über Bluse oder Kleid', 'Shirt unter dem Trägerkleid', 'Lagen in verschiedenen Längen und Stoffen', 'Strumpfhose in Erdtönen wie Bordeaux, Senf oder Oliv, gern mit Stiefeln'] },
    edgy: { leggings: 0.5, tightsColor: 0, tightsPattern: 0.8, tightsFine: 0.4, contrastText: 'Harte Kontraste oder alles dunkel abgestuft', layerPref: -0.8, accents: ['bordeaux', 'rot'], avoid: ['rosa', 'flieder', 'mint', 'hellblau', 'gelb', 'koralle', 'orange'],
      maxColors: 3, contrast: [45, 100], contrastWhy: 'Harter Kontrast – rockig', tonal: 0.8, tonalWhy: 'Dunkle Töne in Abstufungen', near: 1, clash: 1, grell: 1, heikel: 0.3, klassiker: 0.6, echo: 0.6,
      pairs: { 'anthrazit|schwarz': [0.5, 'Schwarz und Anthrazit – bewusst „washed“'], 'schwarz|weiss': [1, 'Schwarz-Weiß – rockig klar'], 'bordeaux|schwarz': [1, 'Schwarz und Bordeaux – dunkel und edel'],
        'rot|schwarz': [0.8, 'Schwarz mit Rot – rockiger Akzent'], 'grau|schwarz': [0.6, 'Schwarz und Grau – kühl abgestuft'], 'jeansblau|schwarz': [0.6, 'Schwarz zu Denim – rockig'] },
      layers: ['Hoodie oder Shirt unter der Lederjacke', 'Dunkle Lagen Ton in Ton', 'Schwarze Strumpfhose – blickdicht, fein oder gemustert – zu Boots'] },
    preppy: { leggings: -1, tightsColor: 0.8, tightsPattern: 0.3, contrastText: 'Frischer, klarer Kontrast wie Dunkelblau, Weiß und Rot', layerPref: 0.6, accents: ['rot', 'gruen', 'bordeaux', 'hellblau', 'rosa', 'gelb'], avoid: ['lila', 'tuerkis', 'orange', 'koralle'],
      maxColors: 4, contrast: [25, 90], tonalOk: false, contrastWhy: 'Frischer Kontrast – typisch Preppy', near: 1.2, clash: 1, grell: 1, heikel: 1.2, klassiker: 1.2, echo: 1, shoesDark: 0.6,
      pairs: { 'navy|rot': [1.2, 'Dunkelblau und Rot – Preppy pur'], 'gruen|navy': [1, 'Dunkelblau und Grün – College-Klassiker'], 'navy|rosa': [0.8, 'Dunkelblau und Rosa – frisch'], 'khaki|navy': [0.8, 'Dunkelblau und Khaki – College-Look'] },
      layers: ['Kragen schaut aus Pullover oder Pullunder', 'Hemd, Pullunder und Blazer', 'Trenchcoat als äußerste Lage', 'Blickdichte Strumpfhose in Dunkelblau, Bordeaux oder Grün zum Rock'] },
    chic: { leggings: -2, tightsColor: 0, tightsPattern: -1, tightsFine: 1, contrastText: 'Entweder Ton in Ton oder klar wie Schwarz-Weiß oder Camel-Schwarz', layerPref: 0, accents: ['rot', 'bordeaux'], avoid: ['orange', 'gelb', 'tuerkis', 'mint', 'lila', 'koralle', 'gruen', 'senf'],
      maxColors: 3, maxBonus: 0.5, contrast: [55, 100], contrastWhy: 'Klare Kontraste wie Schwarz-Weiß oder Camel-Schwarz', contrastMid: 'Weder Ton in Ton noch klarer Kontrast',
      pairs: { 'camel|schwarz': [1, 'Camel und Schwarz – elegant'], 'creme|schwarz': [1, 'Schwarz und Creme – weicher als Schwarz-Weiß'], 'bordeaux|schwarz': [0.6, 'Schwarz und Bordeaux – edel'] },
      near: 1.5, clash: 1.5, grell: 1.5, heikel: 1, klassiker: 1, echo: 0.6, frame: 0.6, shoesDark: 0.8,
      layers: ['Rollkragen unter dem Blazer', 'Mantel über dem Blazer', 'Alle Lagen Ton in Ton', 'Feine schwarze oder hautfarbene Strumpfhose – keine Leggings'] },
    allround: { maxColors: 4, contrast: [10, 90] }
  };
  const mkPal = d => { const p = Object.assign({}, PAL_DEFAULT, d || {}); const pr = {}; for (const [k, v] of Object.entries(p.pairs)) { const [a, b] = k.split('|'); pr[pairKey(a, b)] = v; } p.pairs = pr; return p; };
  Object.values(STYLES).forEach(s => { s.palette = mkPal(PALETTES[s.id]); });
  NO_STYLE.palette = mkPal(PALETTES.allround);

  // Regeln eines Stils in Worten (für die Anzeige im Profil)
  function styleRules(id) {
    const s = STYLES[id]; if (!s) return null;
    const p = s.palette;
    const own = c => (s.like.colors.includes(c) || p.accents.includes(c)) && !p.avoid.includes(c);
    const good = [], bad = [];
    for (const [k, v] of Object.entries(p.pairs)) { const [a, b] = k.split('|'); if (v[0] > 0) good.push([a, b, v[1], v[0]]); else if (v[0] < 0) bad.push([a, b, v[1] || COLOR[a].name + ' und ' + COLOR[b].name + ' nur in Ausnahmen', 9]); }
    good.sort((x, y) => y[3] - x[3]);
    for (const [k, r] of Object.entries(PAIRS)) {
      const [a, b] = k.split('|'); if (p.pairs[k]) continue;
      if (r.kind === 'klassiker' && p.klassiker >= 0.8 && own(a) && own(b) && r.w >= 0.8) good.push([a, b, r.why, 0]);
      if (r.kind === 'heikel' && p.heikel >= 1) bad.push([a, b, r.why, 8]);
      if (r.kind === 'near' && p.near >= 1 && r.w >= 1 && !p.avoid.includes(a) && !p.avoid.includes(b)) bad.push([a, b, r.why, 5 + r.w]);
      if (r.kind === 'clash' && p.clash >= 1 && (own(a) || own(b)) && r.w >= 1.2) bad.push([a, b, r.why, 4]);
    }
    bad.sort((x, y) => y[3] - x[3]);
    const words = ['keine', 'eine', 'zwei', 'drei', 'vier', 'fünf'];
    return {
      name: s.name, base: s.like.colors.filter(c => COLOR[c].neutral || s.extraNeutrals.includes(c)), accents: p.accents.filter(c => !s.like.colors.includes(c) || !(COLOR[c].neutral || s.extraNeutrals.includes(c))), avoid: p.avoid,
      good: good.slice(0, 8).map(x => x.slice(0, 3)), bad: bad.slice(0, 6).map(x => x.slice(0, 3)), contrast: p.contrastText || null,
      limits: [p.maxColors ? 'Höchstens ' + words[p.maxColors] + ' Hauptfarben' : null,
        s.maxAccents ? 'Höchstens ' + ['', 'ein Farbakzent', 'zwei Farbakzente', 'drei Farbakzente'][s.maxAccents] : 'Keine Farbakzente, nur Basisfarben',
        s.maxBold >= 1 ? 'Höchstens ' + ['', 'ein auffälliges Muster', 'zwei auffällige Muster'][Math.floor(s.maxBold)] : 'Keine auffälligen Muster'].filter(Boolean),
      warm: p.temp === 'warm', layers: p.layers.filter(x => !/Strumpfhose|Leggings/.test(x)), legs: p.layers.filter(x => /Strumpfhose|Leggings/.test(x))
    };
  }

  // Farbbewertung für einen Stil
  function colorStyle(o, C, s) {
    const p = s.palette, why = []; let sc = 0;
    const all = pieces(o, true);
    const push = (d, w) => { sc += d; if (w) why.push([d, w]); };
    // 1) Farben, die sich berühren
    let neg = 0, pos = 0, worst = null, best = null;
    const seen = new Set();
    for (const [a, b, w] of touching(o)) {
      const ca = prim(a).id, cb = prim(b).id; if (ca === cb) continue;
      const key = pairKey(ca, cb), r = colorRel(ca, cb), ov = p.pairs[key];
      let d = 0, txt = r.why;
      if (ov) { d = ov[0] * w; txt = ov[1]; }
      else if (r.kind === 'near') d = -1.3 * r.w * w * p.near * (a === o.shoes || b === o.shoes ? 0.3 : 1);
      else if (r.kind === 'clash') d = -2.5 * r.w * w * p.clash;
      else if (r.kind === 'temp') d = -1.5 * r.w * w * p.clash;
      else if (r.kind === 'grell') { if (p.blocking) { d = p.blocking * w; txt = 'Color-Blocking: kräftige Farben bewusst kombiniert'; } else d = -1.8 * r.w * w * p.grell; }
      else if (r.kind === 'heikel') d = -1.2 * r.w * w * p.heikel;
      else if (r.kind === 'klassiker') d = r.w * w * p.klassiker;
      else if (r.kind === 'harmonie') d = 0.6 * r.w * w * p.harmony;
      if (seen.has(key)) d *= 0.5; seen.add(key);
      if (d < 0) { neg += d; if (!worst || d < worst[0]) worst = [d, txt]; }
      else if (d > 0) { pos += d; if (!best || d > best[0]) best = [d, txt]; }
    }
    neg = Math.max(neg, -6); pos = Math.min(pos, 2.5);
    if (neg) push(neg, worst && worst[1]);
    if (pos) push(pos, pos >= 0.5 && best ? best[1] : null);

    // 2) Anzahl der Hauptfarben (Schuhe in Leder-Grundfarben zählen nicht mit)
    if (p.maxColors) {
      const n = p.countAll ? colorCount(o) : (() => {
        const fam = id => ['braun', 'camel', 'beige', 'khaki'].includes(id) ? 'braun' : ['weiss', 'creme'].includes(id) ? 'weiss' : ['grau', 'hellgrau', 'anthrazit', 'silber'].includes(id) ? 'grau' : id;
        const big = pieces(o, false).concat(o.outer ? [o.outer] : []);
        if (o.shoes && !prim(o.shoes).neutral) big.push(o.shoes);
        return new Set(big.map(i => fam(prim(i).id))).size;
      })();
      const words = ['', 'eine', 'zwei', 'drei', 'vier', 'fünf'];
      if (n <= p.maxColors) { if (p.maxBonus) push(p.maxBonus, p.maxWhy ? p.maxWhy[0] : 'Höchstens ' + words[p.maxColors] + ' Hauptfarben'); }
      else push(-1.5 * (n - p.maxColors), p.maxWhy ? p.maxWhy[1] : 'Mehr als ' + words[p.maxColors] + ' Hauptfarben');
    }

    // 3) Akzentfarben passend zur Farbwelt des Stils
    const acc = [...new Set(all.map(prim).filter(c => !c.neutral).map(c => c.id))];
    const bad = acc.filter(c => p.avoid.includes(c));
    if (bad.length) push(-1.2 * bad.length, COLOR[bad[0]].name + ' passt nicht in die Farbwelt von ' + s.name);
    else if (acc.length === 1) {
      if (p.accents.includes(acc[0])) push(1, COLOR[acc[0]].name + ' als einzelner Akzent');
      else if (!p.accents.length) push(0.5, COLOR[acc[0]].name + ' als Farbakzent');
    }

    // 4) Hell-Dunkel-Kontrast zwischen oben und unten
    if (p.contrast) {
      const up = o.onepiece ? (o.layer || o.mid) : (o.layer || o.mid || o.top), low = o.onepiece || o.bottom;
      if (up && low) {
        const cu = prim(up), cl = prim(low), dL = Math.abs(cu.lab[0] - cl.lab[0]);
        const tonal = cu.id === cl.id || toneFam(cu.id) === toneFam(cl.id);
        const [lo, hi] = p.contrast;
        if (dL >= lo && dL <= hi) { if (p.contrastWhy) push(0.7, p.contrastWhy); }
        else if (dL < lo) {
          if (!(tonal && p.tonalOk)) push(-Math.min(1.5, 0.4 + (lo - dL) / 25), dL < 15 ? 'Oben und unten fast gleich hell – wirkt flach' : (p.contrastMid || 'Etwas wenig Hell-Dunkel-Kontrast für den Stil'));
        } else push(-Math.min(1.5, 0.4 + (dL - hi) / 25), p.contrastHigh || 'Harter Hell-Dunkel-Kontrast passt weniger zum Stil');
      }
    }

    // 5) Ton in Ton abgestuft
    if (p.tonal) { const t = tonalInfo(o); if (t && !(s.id === 'edgy' && !t.dark)) push(p.tonal, p.tonalWhy); }

    // 6) Farbtemperatur
    if (p.temp === 'warm') {
      if (all.filter(i => WARM.has(prim(i).id)).length / (all.length || 1) >= 0.5) push(0.6, 'Warme Farbwelt');
      if (acc.some(c => KUEHL.has(c) && chroma(COLOR[c]) > 30)) push(-1, 'Kühle Knallfarbe passt nicht in die warme Farbwelt');
    }

    // 7) Farbe wird wieder aufgegriffen
    if (p.echo) {
      let echo = null;
      for (const it of all) {
        if ((it.pattern || 'uni') === 'uni') continue;
        const cs = (it.colors || []).slice(0, 3).filter(c => c !== 'weiss' && c !== 'schwarz');
        if (all.some(j => j !== it && (j.pattern || 'uni') === 'uni' && cs.includes(prim(j).id))) { echo = 'Das Muster greift eine Farbe des Outfits auf'; break; }
      }
      if (!echo && acc.length <= 2) { const cnt = {}; for (const it of all) { const c = prim(it); if (!c.neutral) cnt[c.id] = (cnt[c.id] || 0) + 1; } if (Object.values(cnt).some(v => v >= 2)) echo = 'Die Akzentfarbe wird wieder aufgegriffen'; }
      if (echo) push(p.echo, echo);
    }

    // 8) Helle Lage innen, dunklere außen
    if (p.frame) {
      const outerL = o.layer || (o.mid && isOpenLayer(o.mid) ? o.mid : null);
      const innerL = o.layer ? o.mid : (o.under || o.top || o.onepiece);
      if (outerL && innerL && prim(innerL).lab[0] - prim(outerL).lab[0] >= 25) push(p.frame, 'Helle Lage innen, dunklere außen – rahmt das Gesicht');
    }

    // 9) Schuhe nicht deutlich heller als die Hose (klassische Regel, nicht im Sommer)
    if (p.shoesDark && o.shoes && o.bottom && C.tMax < 20 && o.shoes.formality >= 3 && !['sneaker', 'sandalen', 'sandaletten'].includes(o.shoes.type)
      && prim(o.shoes).lab[0] - prim(o.bottom).lab[0] > 30) push(-0.8 * p.shoesDark, 'Schuhe deutlich heller als die Hose – wirkt unruhig');

    // 10) Zu viel Dunkles
    if (p.darkMax != null && darkShare(o) > p.darkMax) push(-1, p.darkWhy);
    // 11) Passen drei Lagen übereinander zum Stil?
    if (o.layer && p.layerPref) push(p.layerPref, null);
    // 12) Strumpfhose oder Leggings unter Rock und Kleid
    if (legsVisible(o)) {
      const lg = o.legs, c = prim(lg);
      if (lg.type === 'leggings' && p.leggings) push(p.leggings, p.leggings < 0 ? 'Leggings unter Rock oder Kleid passt wenig zu ' + s.name : 'Leggings unter Rock oder Kleid – lässig');
      if (!c.neutral) { if (p.avoid.includes(c.id)) push(-1.2, c.name + ' passt nicht in die Farbwelt von ' + s.name); else if (p.tightsColor) push(p.tightsColor, 'Farbige Strumpfhose als Akzent'); else push(-0.8, null); }
      if ((lg.pattern || 'uni') !== 'uni' && p.tightsPattern) push(p.tightsPattern, p.tightsPattern > 0 ? 'Gemusterte Strumpfhose – verspieltes Detail' : 'Gemusterte Strumpfhose passt wenig zum Stil');
      if (p.tightsFine && C.tMax >= 12 && lg.type === 'strumpfhose' && lg.warmth <= 2 && ['schwarz', 'hautfarben'].includes(c.id)) push(p.tightsFine, 'Feine Strumpfhose – elegant');
    }
    return { sc, why };
  }

  // ---------------------------------------------------------------- Kontext (Wetter, Profil, Anlass)
  const MONTH_AVG = [[-2, 4], [-1, 6], [2, 10], [5, 15], [9, 19], [12, 22], [14, 24], [14, 24], [10, 19], [7, 14], [3, 8], [0, 5]];
  function seasonOf(dateStr) { const m = new Date(dateStr + 'T12:00:00').getMonth(); return m >= 2 && m <= 4 ? 'fruehling' : m <= 7 && m >= 5 ? 'sommer' : m >= 8 && m <= 10 ? 'herbst' : 'winter'; }
  function buildContext(opts) {
    const { weather, profile, learn, occasion, date } = opts;
    const sens = { friert: -3, normal: 0, schwitzt: 3 }[profile.sensitivity || 'normal'] || 0;
    const offset = sens + clamp((learn && learn.tempOffset) || 0, -4, 4);
    let tMin, tMax, rain = false, snow = false, assumed = false, rainProb = 0;
    if (weather) {
      tMin = weather.feelMin; tMax = weather.feelMax; rain = !!weather.rain; snow = !!weather.snow; rainProb = weather.rainProb || 0;
    } else {
      const m = new Date(date + 'T12:00:00').getMonth(); [tMin, tMax] = MONTH_AVG[m]; assumed = true;
    }
    const occ = occasionDef(occasion, profile);
    // „Mindestens ein elegantes Element in jedes Alltagsoutfit“: Alltag bei eleganten Stilen etwas gehobener
    if (occ.id === 'alltag' && (profile.styles || []).some(s => ['italienisch', 'chic', 'klassisch', 'preppy'].includes(s))) { occ.target = 2.6; occ.hi = 3.5; }
    const styles = (profile.styles || []).map(s => STYLES[s]).filter(Boolean);
    return {
      date, season: seasonOf(date), occasion: occ,
      rawMin: tMin, rawMax: tMax,
      tMin: tMin + offset, tMax: tMax + offset, spread: tMax - tMin, rain: rain || snow, snow, rainProb, assumed,
      styles: styles.length ? styles : [NO_STYLE],
      styleIds: (profile.styles || []).filter(s => STYLES[s]),
      favs: profile.favColors || [], nogos: profile.nogoColors || [],
      farbtyp: FARBTYP[profile.farbtyp] || null, unterton: UNTERTON[profile.unterton] || null,
      gender: profile.gender || '',
      sunny: !!(weather && weather.code != null && weather.code <= 2 && !rain && !snow),
      metalPref: ['fruehling', 'herbst'].includes(profile.farbtyp) || (!profile.farbtyp && profile.unterton === 'warm') ? 'gold' : (['sommer', 'winter'].includes(profile.farbtyp) || (!profile.farbtyp && profile.unterton === 'kuehl') ? 'silber' : null),
      learn: Object.assign({ pairs: {}, colorPairs: {}, itemOcc: {}, tempOffset: 0 }, learn || {})
    };
  }

  // Grobe Ausschlüsse pro Teil
  function hardOk(it, C) {
    const t = it.typeDef, occ = C.occasion, f = it.formality;
    if ((C.nogos || []).includes(it.colors && it.colors[0])) return false;
    if (t.slot === 'other') return false;
    if (t.slot === 'acc') return true;
    if (t.slot === 'shoes') {
      if (f < occ.lo - (occ.shoeStrict ? 0 : 1)) return false;
      if (t.open && (C.tMax < 18 || C.rain)) return false;
      if (it.type === 'winterstiefel' && C.tMax > 15) return false;
      if (it.type === 'stiefel' && C.tMax > 24) return false;
      return true;
    }
    if (t.slot === 'legs') {
      if (C.tMax > 24 || (it.warmth >= 4 && C.tMax > 15) || (it.warmth >= 3 && C.tMax > 20)) return false;
      return true;
    }
    if (t.slot === 'outer') {
      if (f < occ.lo - 1.5) return false;
      if (it.warmth >= 5 && C.tMin > 12) return false;
      if (it.warmth >= 4 && C.tMin > 17) return false;
      return true;
    }
    if (f < occ.lo - 0.5 || f > occ.hi + 1) return false;
    if (it.type === 'shorts' && (C.tMax < 17 || occ.id === 'arbeit' || occ.id === 'elegant')) return false;
    if (it.type === 'jogginghose' && !C.styleIds.includes('sportlich')) return false;
    if (t.lounge && occ.id !== 'alltag') return false;
    if ((t.slot === 'top' || t.slot === 'onepiece') && it.warmth >= 4 && C.tMax > 22) return false;
    if ((t.slot === 'top' || t.slot === 'onepiece' || t.slot === 'mid') && it.warmth >= 3 && C.tMax > 26) return false;
    if (t.slot === 'bottom' && it.warmth >= 4 && C.tMax > 26) return false;
    return true;
  }

  // ---------------------------------------------------------------- Bewertung
  // parts: welche Teilbereiche bewertet werden (inner, outer, shoes)
  function evaluate(o, C, parts) {
    parts = parts || { inner: true, outer: true, shoes: true };
    let score = 0; const plus = [], minus = [];
    const add = (d, why) => { score += d; if (why) (d >= 0 ? plus : minus).push([d, why]); };
    const occ = C.occasion;
    const main = pieces(o, false), all = pieces(o, true);
    const fmtT = fmtDeg(C.rawMin) + ' bis ' + fmtDeg(C.rawMax) + ' °C';
    const zwiebel = C.spread >= 6 && C.tMin < 16;

    // --- Wärme oben
    const upper = o.onepiece || o.top;
    if (upper) {
      const inner = upper.warmth + (o.under ? o.under.warmth * 0.7 : 0) + (o.mid ? o.mid.warmth * 0.8 : 0) + (o.layer ? o.layer.warmth * 0.7 : 0);
      const target = clamp((26 - C.tMax) / 4 + 1, 1, 4); // drinnen ohne Jacke; draußen wärmt die Jacke
      const diff = inner - target;
      const removable = o.layer || (o.mid && isOpenLayer(o.mid) ? o.mid : null);   // Lage, die man mittags ausziehen kann
      if (diff < -0.7) { if (parts.inner) add(-2.5 * (-diff - 0.7), 'Oben herum eher zu kühl'); }
      else if (diff > 0.7) { let pen = 2 * (diff - 0.7); if (removable && zwiebel) pen *= 0.6; add(-pen, 'Oben herum eher zu warm'); }
      else if (parts.inner) add(1.5, 'Passende Wärme für ' + fmtT);
      if (parts.inner && removable && zwiebel) add(1.5, 'Zwiebellook: ' + (removable.typeDef.slot === 'top' ? 'offenes Hemd' : shortType(removable)) + ' kann mittags aus');
      if (o.mid && C.tMin >= 19) add(-1.5, null);
      if (o.layer && (C.tMax >= 22 || C.tMin >= 14)) add(C.tMax >= 22 ? -3 : -1.5, 'Drei Lagen sind bei dem Wetter zu viel');
    }
    // --- Wärme Beine
    const legs = o.bottom || o.onepiece;
    if (legs) {
      const bare = bareLegs(legs), lw = o.legs ? o.legs.warmth : 0;
      let target = clamp((26 - C.tMax) / 5 + 1, 1, 3.2);
      if (C.tMax < 5) target = Math.min(4, target + (5 - C.tMax) * 0.1);       // bei Frost darf es unten wärmer sein
      // Unter Rock und Kleid wärmt vor allem die Strumpfhose, unter der Hose kommt sie dazu
      const eff = !o.legs ? legs.warmth : bare ? Math.max(legs.warmth, lw * 0.9) + Math.min(legs.warmth, lw) * 0.4 : legs.warmth + lw * 0.5;
      const diff = eff - target;
      if (bare && C.hasLegs && diff < -0.5) add(-2.5 * (-diff - 0.5), 'Beine eher zu luftig angezogen');   // nackte Beine kühlen schneller aus
      else if (Math.abs(diff) > 0.8) { const pen = 1.3 * (Math.abs(diff) - 0.8); add(-pen, pen >= 1.5 ? (diff < 0 ? 'Beine eher zu luftig angezogen' : (o.legs ? 'Unten herum eher zu warm' : 'Hose eher zu warm')) : null); }
      const opaque = o.legs && lw >= (C.tMax < 10 ? 3 : 2);
      if (legs.typeDef.short && C.tMax < 18) {
        if (opaque) add(0.5, (o.legs.type === 'leggings' ? 'Leggings drunter' : 'Blickdichte Strumpfhose') + ' – so geht kurz auch bei Kühle');
        else add(-2.5, 'Kurz geschnitten bei unter 18 °C');
      }
      if (bare && !o.legs && C.tMax < 14 && C.hasLegs) add(-1.5, 'Bei der Kühle besser mit Strumpfhose');
    }
    // Strumpfhose und Leggings
    if (o.legs) {
      const lg = o.legs, vis = legsVisible(o), base = o.onepiece || o.bottom;
      const fine = lg.type === 'strumpfhose' && lg.warmth <= 1;
      if (C.tMax >= 20 && !(fine && vis && (occ.shoeStrict || occ.id === 'elegant'))) add(-1.5, 'Strumpfhose ist bei der Wärme eher unnötig');
      if (!vis) { if (C.tMax < 3) add(0.8, 'Strumpfhose unter der Hose – wärmt bei Frost'); else add(-0.8, null); }
      else {
        const lc = prim(lg), name = lg.type === 'leggings' ? 'Leggings' : 'Strumpfhose', what = o.onepiece ? 'Kleid' : 'Rock';
        if (lg.type === 'leggings' && (occ.id === 'elegant' || (occ.id === 'arbeit' && occ.shoeStrict))) add(-2.5, 'Leggings unter ' + what + ' ist dafür zu lässig');
        if (occ.id === 'elegant' && lg.warmth >= 4) add(-1.2, 'Dicke Wollstrumpfhose wirkt für Elegant zu rustikal');
        if (lc.id !== 'hautfarben') {
          const sameShoe = o.shoes && (prim(o.shoes).id === lc.id || (toneFam(prim(o.shoes).id) === toneFam(lc.id) && Math.abs(prim(o.shoes).lab[0] - lc.lab[0]) < 15));
          if (sameShoe || prim(base).id === lc.id) add(1, name + ' im Ton ' + (sameShoe ? 'der Schuhe' : o.onepiece ? 'des Kleides' : 'des Rocks') + ' – streckt das Bein');
          else if (o.shoes && lg.warmth >= 2 && lc.lab[0] < 40 && prim(o.shoes).lab[0] > 70 && o.shoes.type !== 'sneaker') add(-1.2, 'Helle Schuhe zu dunkler Strumpfhose unterbrechen das Bein');
          const r = colorRel(lc.id, prim(base).id);
          if (['clash', 'grell', 'temp'].includes(r.kind)) add(-2, r.why);
          else if (r.kind === 'near') add(-1, r.why);
        }
        if ((lg.pattern || 'uni') !== 'uni' && (PATTERNS[base.pattern] || PATTERNS.uni).bold >= 0.5) add(-2, 'Gemusterte Strumpfhose zu gemustertem ' + what + ' ist zu viel');
      }
    }
    // --- Jacke
    if (parts.outer) {
      const need = C.tMin < 17 || C.rain;
      if (!o.outer) { if (need && C.hasOuter) add(-8, 'Ohne Jacke zu kalt'); }
      else if (!need) add(-3, 'Jacke ist bei dem Wetter überflüssig');
      else {
        const jT = clamp((20 - C.tMin) / 4, 1, 5), d = o.outer.warmth - jT;
        if (Math.abs(d) <= 0.8) add(1.5, 'Jacke passt zu ' + fmtDeg(C.rawMin) + ' °C am Morgen');
        else add(-2 * (Math.abs(d) - 0.8), d < 0 ? 'Jacke eher zu dünn' : 'Jacke eher zu warm');
        if (C.rain) { const r = o.outer.typeDef.rain || 0; if (r === 0) add(-4, 'Jacke ist nicht regentauglich'); else if (r === 2) add(1.5, 'Regenfeste Jacke'); }
      }
    }
    // --- Schuhe
    if (parts.shoes) {
      if (!o.shoes) { if (C.hasShoes) add(-6, 'Ohne Schuhe'); }
      else {
        const t = o.shoes.typeDef;
        if (C.tMin < t.minT) add(-Math.min(6, 1.5 * (t.minT - C.tMin) / 3), 'Schuhe eher zu luftig');
        if (C.tMax > t.maxT) add(-Math.min(6, 1.5 * (C.tMax - t.maxT) / 3), 'Schuhe eher zu warm');
        if (C.rain && t.rain === 0) add(-4, 'Schuhe vertragen keinen Regen');
        if (C.snow && o.shoes.type === 'winterstiefel') add(2, 'Winterstiefel bei Schnee');
        if (C.tMax >= 26 && t.open) add(1, 'Luftige Schuhe für die Hitze');
        if (((o.onepiece && o.onepiece.typeDef.dress) || (o.bottom && o.bottom.typeDef.skirt)) && C.tMax < 12) {
          const warmLegs = o.legs && o.legs.warmth >= 3;
          if (t.boot) add(1, warmLegs ? 'Stiefel und blickdichte Strumpfhose – warm und stimmig' : 'Stiefel zum Rock bei Kälte');
          else if (warmLegs && C.tMax >= 3 && !t.open) add(0.3, null);         // geschlossene Schuhe mit dicker Strumpfhose gehen auch
          else add(-4, 'Rock oder Kleid bei Kälte besser mit Stiefeln' + (o.legs ? '' : ' und Strumpfhose'));
        }
      }
    }
    if (C.rain) for (const it of all) if ((it.materials || []).some(m => (MATERIALS[m] && MATERIALS[m].tags || []).includes('rainBad'))) add(-4, it.typeDef.name + ' aus empfindlichem Material bei Regen');

    // --- Material & Jahreszeit
    for (const it of main) {
      const tags = (it.materials || []).flatMap(m => (MATERIALS[m] && MATERIALS[m].tags) || []);
      if (tags.includes('summer') && C.tMax < 12) add(C.tMax < 8 ? -3 : -1, C.tMax < 8 ? 'Sommerstoff bei dieser Kälte' : null);
      if (tags.includes('winter') && C.tMax > 23) add(-1.5, null);
    }

    // --- Farben
    // (Harmonie, Kontrast und Farbanzahl bewertet der jeweilige Stil, siehe colorStyle)
    const colored = all.filter(i => !prim(i).neutral);
    const accents = [...new Set(colored.map(i => prim(i).id))];
    let favPts = 0;
    for (const it of all) if (C.favs.includes(prim(it).id)) favPts += 1.2;
    if (favPts) add(Math.min(3.6, favPts), 'Mit deiner Lieblingsfarbe');
    for (const it of all) if (it.colors && it.colors[1] && C.nogos.includes(it.colors[1])) add(-2, null);
    const face = o.under || ((o.mid && o.mid.typeDef.knit && !isOpenLayer(o.mid)) ? o.mid : (o.onepiece || o.top));
    if (face) {
      const cid = prim(face).id;
      if (C.farbtyp) {
        if (C.farbtyp.good.includes(cid)) add(2, prim(face).name + ' steht deinem Farbtyp');
        else if (C.farbtyp.bad.includes(cid)) add(-2, prim(face).name + ' ist nah am Gesicht nicht ideal für dich');
      } else if (C.unterton) {
        if (C.unterton.good.includes(cid)) add(1, prim(face).name + ' passt zu deinem Hautunterton');
        else if (C.unterton.bad.includes(cid)) add(-1, null);
      }
    }
    // Jahreszeit
    let seas = 0;
    for (const it of main) {
      const c = prim(it);
      if ((C.season === 'fruehling' || C.season === 'sommer') && (c.groups.includes('pastell') || c.groups.includes('kraeftig') || c.id === 'weiss')) seas += 0.4;
      if ((C.season === 'herbst' || C.season === 'winter') && (c.groups.includes('erd') || c.groups.includes('dunkel'))) seas += 0.4;
    }
    if (seas) add(Math.min(1, seas), seas >= 0.8 ? 'Farben passen zur Jahreszeit' : null);
    // gelernte Farbpaare
    const mcols = [...new Set(main.map(i => prim(i).id))];
    for (let i = 0; i < mcols.length; i++) for (let j = i + 1; j < mcols.length; j++) {
      const v = C.learn.colorPairs[pairKey(mcols[i], mcols[j])];
      if (v) add(v, v < 0 ? 'Diese Farbkombi mochtest du nicht' : null);
    }

    // --- Anlass
    const fs = main.map(i => i.formality); if (o.shoes) fs.push(o.shoes.formality);
    const avg = fs.reduce((a, b) => a + b, 0) / (fs.length || 1);
    const fd = Math.abs(avg - occ.target);
    if (fd < 0.5) add(1, 'Passt zum Anlass ' + occ.name); else add(-2.2 * (fd - 0.5), fd > 1 ? (avg < occ.target ? 'Etwas zu lässig für ' + occ.name : 'Etwas zu schick für ' + occ.name) : null);
    const spreadF = Math.max(...fs) - Math.min(...fs);
    if (spreadF > 2) add(-3 * (spreadF - 2), 'Teile passen vom Stil her nicht zusammen');
    if (occ.id === 'arbeit') {
      if (o.top && o.top.typeDef.traeger && !o.mid) add(-5, 'Trägertop bei der Arbeit nur mit Jacke darüber');
      if (o.onepiece && o.onepiece.typeDef.traeger && !o.mid && !o.under) add(-4, 'Trägerkleid bei der Arbeit nur mit Shirt darunter oder Jacke darüber');
      if (o.bottom && o.bottom.type === 'rock_kurz' || o.onepiece && o.onepiece.type === 'kleid_kurz') add(occ.shoeStrict ? -3 : -1.5, 'Kurzer Rock ist im Büro heikel');
      if (main.some(i => ['print', 'animal'].includes(i.pattern))) add(occ.shoeStrict ? -3 : -1.5, 'Auffälliger Print fürs Büro');
    }
    if (occ.id === 'party') {
      const statement = all.some(i => (i.materials || []).some(m => (MATERIALS[m] && MATERIALS[m].tags || []).includes('party')) || prim(i).groups.includes('metall') || (PATTERNS[i.pattern] || PATTERNS.uni).bold >= 1 || prim(i).groups.includes('kraeftig'));
      if (statement) add(2.5, 'Mit Hingucker-Teil für die Party');
      else if (darkShare(o) >= 0.6) add(0.5, 'Dunkel und schlicht – geht immer');
      else add(-1, 'Für eine Party eher unauffällig');
    }
    if (occ.id === 'elegant') {
      if (o.onepiece && o.onepiece.typeDef.dress) add(1.5, 'Kleid für den eleganten Anlass');
      if (main.some(i => (i.materials || []).some(m => (MATERIALS[m] && MATERIALS[m].tags || []).includes('fine')))) add(1, 'Edles Material');
    }

    // --- Lieblingsteile und Zustand
    const favN = all.filter(i => i.fav).length;
    if (favN) add(Math.min(2.4, favN * 0.8), 'Mit deinem Lieblingsteil');
    for (const it of all) {
      if (it.condition === 'abgetragen' && occ.id !== 'alltag') add(-4, 'Abgetragenes Teil – eher für den Alltag');
      else if (it.condition === 'getragen' && (occ.id === 'elegant' || occ.id === 'party')) add(-1.5, null);
    }

    // --- Allgemeine ungeschriebene Regeln
    const ub = o.top, lb = o.bottom;
    if (ub && lb) {
      if (ub.fit === 'weit' && lb.fit === 'weit') add(-2.5, 'Weit zu weit wirkt schnell formlos');
      else if ((ub.fit === 'weit' && lb.fit === 'eng') || (ub.fit === 'eng' && lb.fit === 'weit')) add(1.5, 'Weit trifft schmal – ausgewogene Silhouette');
    }
    const denims = all.filter(i => i.typeDef.denim || (i.materials || []).includes('denim')).length;
    if (o.mid && o.mid.typeDef.knit && o.top && o.top.typeDef.collar) add(1, 'Kragen unter dem Pullover');
    if (o.top && o.top.typeDef.hood && hasBlazer(o)) add(-2, null);

    // --- Lagen (Layering): dünn innen, dicker außen; schmal über weit geht nicht
    const stack = o.onepiece ? [o.under, o.onepiece, o.mid].filter(Boolean) : [o.top, o.mid, o.layer].filter(Boolean);
    for (let i = 0; i + 1 < stack.length; i++) {
      const inn = stack[i], out = stack[i + 1];
      if (inn === o.onepiece || out === o.onepiece) continue;
      if (inn.warmth >= out.warmth + 2 && isOpenLayer(out)) add(-1.2, 'Dickes Teil unter dünnerer Lage trägt auf');
      if (inn.fit === 'weit' && out.fit === 'eng') add(-1.5, 'Weites Teil unter enger Lage – passt kaum drunter');
    }
    if (o.mid && o.mid.typeDef.vest && o.top && o.top.typeDef.collar) add(0.8, 'Pullunder über Hemd oder Bluse');
    if (o.mid && o.mid.typeDef.slot === 'top' && o.mid.typeDef.layerOk) {
      if (occ.id === 'elegant') add(-2.5, 'Offenes Hemd über Shirt ist zu lässig für Elegant');
      else if (occ.id === 'arbeit' && occ.shoeStrict) add(-1.5, 'Offenes Hemd über Shirt ist zu lässig fürs Büro');
      else add(0.5, null);
    }
    if (o.under) {
      if (C.tMax <= 16) add(1.2, shortType(o.under) + ' unter dem Trägerkleid – macht es kältetauglich');
      else if (C.tMax >= 23) add(o.under.warmth >= 2 ? -2 : -0.8, o.under.warmth >= 2 ? 'Langärmliges unter dem Kleid ist bei der Wärme zu viel' : null);
      else if (C.tMax < 23) add(0.3, null);
    }
    if (o.layer && C.tMax <= 8) add(0.5, 'Mehrere dünne Lagen halten wärmer als eine dicke');
    if (o.outer) {
      const ot = o.outer.type, inside = [o.layer, o.mid, o.top].filter(Boolean);
      const slim = ['lederjacke', 'jeansjacke', 'blouson'].includes(ot);
      const jn = { lederjacke: 'der Lederjacke', jeansjacke: 'der Jeansjacke', blouson: 'dem Blouson' }[ot];
      if (hasBlazer(o) && slim) add(-1.5, 'Sakko unter ' + jn + ' trägt auf');
      else if (o.layer && slim) add(-1.5, 'Drei Lagen unter ' + jn + ' tragen auf');
      else if (hasBlazer(o) && ['mantel', 'trench'].includes(ot)) add(0.6, null);
      if (slim && inside.some(i => i.warmth >= 4 && (i.typeDef.knit || i.typeDef.slot === 'mid'))) add(-1, 'Dicker Strick unter ' + jn + ' trägt auf');
    }

    // --- Stil (bester passender Stil zählt)
    let best = null;
    for (const s of C.styles) {
      let sc = 0, wsum = 0; const why = [];
      for (const it of all) {
        const w = (it === o.outer || it === o.shoes) ? 0.6 : 1; wsum += w;
        let v = 0;
        if (s.like.types.includes(it.type)) v += 1.4; else if (s.avoid.types.includes(it.type)) v -= 2.5;
        if (s.like.patterns.includes(it.pattern || 'uni')) v += 0.4; else if (s.avoid.patterns.includes(it.pattern)) v -= 1.5;
        const mats = it.materials || [];
        if (mats.some(m => s.like.materials.includes(m))) v += 0.6; if (mats.some(m => s.avoid.materials.includes(m))) v -= 1.5;
        if (it.fit && s.like.fits.includes(it.fit)) v += 0.3;
        if (s.like.colors.includes(prim(it).id)) v += 0.6;
        sc += v * w;
      }
      sc = wsum ? sc / wsum * 4 : 0;
      const accN = accents.filter(a => !s.extraNeutrals.includes(a)).length;
      if (accN > s.maxAccents) { sc -= 3.5 * (accN - s.maxAccents); why.push([-3.5, 'Mehr Farbakzente, als dein Stil verträgt']); }
      const bc = boldCount(o);
      if (bc > s.maxBold + 0.01) { sc -= 4 * (bc - s.maxBold); why.push([-4, 'Zu viele Muster auf einmal']); }
      if (o.top && o.bottom && o.top.fit === 'weit' && o.bottom.fit === 'weit' && s.oversizeOk) sc += 3; // hebt die allgemeine Regel auf
      if (denims >= 2 && !s.denimOk) { sc -= 2.5; why.push([-2.5, 'Denim zu Denim nur ganz bewusst']); }
      if (o.top && o.top.typeDef.hood && hasBlazer(o) && s === STYLES.streetwear) sc += 2;
      const col = colorStyle(o, C, s); sc += col.sc; why.push(...col.why);
      for (const r of s.rules) { const res = r(o, C); if (res) { sc += res[0]; why.push(res); } }
      if (!best || sc > best.sc) best = { s, sc, why };
    }
    let tips = [];
    if (best) {
      score += best.sc; best.why.forEach(w => (w[0] >= 0 ? plus : minus).push(w));
      if (parts.tips !== false) tips = best.s.tips.map(t => t(o, C)).filter(Boolean);
    }

    // --- Verlauf & Gelerntes
    let recent = 0;
    for (const it of main) {
      if (it.lastWorn) {
        const d = daysBetween(it.lastWorn, C.date);
        if (d >= 0 && d <= 1) recent = Math.min(recent, -5);
        else if (d >= 2 && d <= 3) recent = Math.min(recent, -2.5);
        else if (d >= 4 && d <= 7) recent = Math.min(recent, occ.id === 'arbeit' ? -1.5 : -0.7);
        else if (d > 30) score += 0.3;
      } else score += 0.2;
    }
    if (recent) add(recent * (main.length > 2 ? 1.2 : 1), recent <= -2.5 ? 'Teile wurden erst kürzlich getragen' : null);
    const ids = main.map(i => i.id);
    let pairSum = 0;
    for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) pairSum += C.learn.pairs[pairKey(ids[i], ids[j])] || 0;
    if (pairSum) add(clamp(pairSum, -8, 4), pairSum > 0 ? 'Diese Kombi hat dir schon gefallen' : 'Ähnliche Kombi hast du abgelehnt');
    for (const id of ids) { const v = C.learn.itemOcc[id + '|' + occ.id]; if (v) add(v, v < 0 ? 'Passt laut dir nicht zu ' + occ.name : null); }
    if (C.likedKeys && C.likedKeys.has(coreKey(o))) add(2, 'Eins deiner Lieblingsoutfits');

    // --- etwas Abwechslung beim Neu-Mischen
    score += hash(fullKey(o) + '|' + C.seed) * 1.6;

    return { score, plus, minus, tips, style: best && best.s !== NO_STYLE ? best.s.name : null, styleId: best ? best.s.id : '' };
  }

  // ---------------------------------------------------------------- Generator
  function prepare(items) {
    return items.map(it => Object.assign({}, it, { typeDef: TYPES[it.type] || TYPES.sonstiges, formality: it.formality || (TYPES[it.type] || {}).f || 3, warmth: it.warmth || (TYPES[it.type] || {}).w || 2, _c: COLOR[it.colors && it.colors[0]] || COLOR.grau }));
  }

  function generate(rawItems, C, opts) {
    opts = opts || {};
    const all = prepare(rawItems);
    const pinned = opts.pinnedId ? all.find(i => i.id === opts.pinnedId) : null;
    const avail = all.filter(i => (i.status || 'verfuegbar') === 'verfuegbar');
    const ok = avail.filter(i => hardOk(i, C));
    const bySlot = s => ok.filter(i => i.typeDef.slot === s);
    let tops = bySlot('top'), bottoms = bySlot('bottom'), ones = bySlot('onepiece');
    let mids = ok.filter(i => i.typeDef.slot === 'mid' || (i.typeDef.knit && i.typeDef.overBase) || i.typeDef.layerOk);
    let layers = ok.filter(i => i.typeDef.slot === 'mid' && i.typeDef.open && !i.typeDef.vest);
    let unders = ok.filter(i => i.typeDef.underOk && i.warmth <= 3);
    let outers = bySlot('outer'), shoes = bySlot('shoes');
    let legwear = ok.filter(i => i.typeDef.legLayer);
    const accs = ok.filter(i => i.typeDef.slot === 'acc');
    C.hasOuter = avail.some(i => i.typeDef.slot === 'outer');
    C.hasShoes = avail.some(i => i.typeDef.slot === 'shoes');
    C.hasLegs = legwear.some(i => i.typeDef.slot === 'legs');
    C.likedKeys = new Set((opts.rated || []).filter(r => r.rating > 0).map(r => r.coreKey));
    const disliked = new Set((opts.rated || []).filter(r => r.rating < 0).map(r => r.coreKey));
    const notes = [];

    let forceMid = null, forceOuter = null, forceShoes = null, forceAcc = null, forceLegs = null;
    const extraCores = [];
    if (pinned) {
      const s = pinned.typeDef.slot;
      if (s === 'top') {
        // Ein Pullover oder Hemd kann auch als Zwischenlage dienen, ein dünnes Oberteil auch unter einem Trägerkleid
        if ((pinned.typeDef.knit && pinned.typeDef.overBase) || pinned.typeDef.layerOk)
          for (const t of tops) for (const b of bottoms) { const c = { top: t, bottom: b, mid: pinned, _fixMid: 1 }; if (t !== pinned && midFits(pinned, c)) extraCores.push(c); }
        for (const d of ones) { const c = { onepiece: d, under: pinned, _fixUnder: 1 }; if (underFits(pinned, c)) extraCores.push(c); }
        tops = [pinned]; ones = [];
      }
      else if (s === 'bottom') {
        // Leggings können auch unter Rock oder Kleid getragen werden
        if (pinned.typeDef.legLayer) {
          for (const t of tops) for (const b of bottoms) { const c = { top: t, bottom: b, _fixLegs: pinned }; if (b !== pinned && legsFits(pinned, c)) extraCores.push(c); }
          for (const d of ones) { const c = { onepiece: d, _fixLegs: pinned }; if (legsFits(pinned, c)) extraCores.push(c); }
        }
        bottoms = [pinned]; ones = [];
      }
      else if (s === 'legs') { forceLegs = pinned; }
      else if (s === 'onepiece') { ones = [pinned]; tops = []; bottoms = []; }
      else if (s === 'mid') { forceMid = pinned; }
      else if (s === 'outer') { forceOuter = pinned; }
      else if (s === 'shoes') { forceShoes = pinned; }
      else if (s === 'acc') { forceAcc = pinned; }
      if (!hardOk(pinned, C)) notes.push(pinned.typeDef.name + ' passt eigentlich nicht zu Wetter oder Anlass – trotzdem eingeplant.');
    }

    // Vorauswahl: nur die passendsten Lagen, Jacken und Schuhe durchprobieren
    const quick = it => {
      const t = it.typeDef, occ = C.occasion; let q = -Math.abs(it.formality - occ.target);
      if (t.slot === 'outer') { q -= Math.abs(it.warmth - clamp((20 - C.tMin) / 4, 1, 5)); if (C.rain) q += (t.rain || 0) - 1; }
      if (t.slot === 'shoes') { if (C.tMin < t.minT) q -= (t.minT - C.tMin) / 3; if (C.tMax > t.maxT) q -= (C.tMax - t.maxT) / 3; if (C.rain && !t.rain) q -= 2; }
      for (const s of C.styles) if (s.like.types.includes(it.type)) { q += 0.8; break; }
      if (C.favs.includes(prim(it).id)) q += 0.5;
      return q + hash(it.id + C.seed) * 0.6;
    };
    const topN = (arr, n) => arr.length <= n ? arr : arr.map(i => [quick(i), i]).sort((a, b) => b[0] - a[0]).slice(0, n).map(x => x[1]);
    mids = topN(mids, 16); layers = topN(layers, 6); unders = topN(unders, 6); outers = topN(outers, 8); shoes = topN(shoes, 10); legwear = topN(legwear, 6);

    // 1) Basis-Kombinationen
    const cores = extraCores.slice();
    for (const t of tops) for (const b of bottoms) cores.push({ top: t, bottom: b });
    for (const d of ones) cores.push({ onepiece: d });
    if (!cores.length) {
      const why = [];
      if (!avail.some(i => ['top', 'onepiece'].includes(i.typeDef.slot))) why.push('Oberteile oder Kleider');
      if (!avail.some(i => ['bottom', 'onepiece'].includes(i.typeDef.slot))) why.push('Hosen, Röcke oder Kleider');
      return { outfits: [], notes, empty: why.length ? 'Es fehlen noch ' + why.join(' und ') + ' im Schrank.' : 'Für ' + C.occasion.name + ' bei diesem Wetter passt gerade nichts zusammen. Prüfe, ob Teile in der Wäsche sind, oder probiere einen anderen Anlass.' };
    }
    const coreParts = { inner: false, outer: false, shoes: false, tips: false };
    let coreList = cores;
    if (forceLegs) {   // festgepinnte Strumpfhose: nur Unterteile, unter die sie passt
      coreList = cores.filter(c => legsFits(forceLegs, c));
      if (!coreList.length) { notes.push('Zu dieser Strumpfhose passt gerade kein Rock, Kleid oder keine Hose.'); coreList = cores; forceLegs = null; }
    }
    coreList.forEach(o => { o._s = evaluate(o, C, coreParts).score; });
    coreList.sort((a, b) => b._s - a._s);
    const topCores = coreList.slice(0, 100);

    // 2) Lagen, Jacke, Schuhe ergänzen
    const full = [];
    const innerParts = { inner: true, outer: false, shoes: false, tips: false };
    const closedMid = m => m && ((m.typeDef.knit && m.typeDef.overBase) || m.typeDef.vest);
    for (const core of topCores) {
      // a) Shirt unter dem Trägerkleid
      const bases = [core];
      if (core.onepiece && core.onepiece.typeDef.traeger && !core._fixUnder)
        for (const u of unders) { const o = Object.assign({}, core, { under: u }); if (underFits(u, o)) bases.push(o); }
      // b) Zwischenlage
      const midCands = [];
      for (const base of bases) {
        const midOpts = base._fixMid ? [base.mid] : forceMid ? [forceMid] : [null].concat(mids.filter(m => m.id !== (base.top && base.top.id)));
        for (const m of midOpts) {
          const o = Object.assign({}, base, { mid: m || undefined });
          if (m && !midFits(m, o) && !forceMid) continue;
          midCands.push({ o, s: evaluate(o, C, innerParts).score });
        }
        // festgepinnte offene Lage auch als dritte Lage über Pullover oder Pullunder
        if (forceMid && !base.onepiece) for (const m of mids) {
          if (m === forceMid || !closedMid(m)) continue;
          const o = Object.assign({}, base, { mid: m, layer: forceMid });
          if (midFits(m, o) && layerFits(forceMid, o)) midCands.push({ o, s: evaluate(o, C, innerParts).score });
        }
      }
      midCands.sort((a, b) => b.s - a.s);
      // c) Dritte Lage über einer geschlossenen Zwischenlage (z. B. Sakko über Pullover)
      const layered = [];
      for (const mc of midCands.slice(0, 3)) {
        if (!closedMid(mc.o.mid) || mc.o.layer) continue;
        for (const l of layers) { const o = Object.assign({}, mc.o, { layer: l }); if (layerFits(l, o)) layered.push({ o, s: evaluate(o, C, innerParts).score }); }
      }
      const pool = midCands.concat(layered).sort((a, b) => b.s - a.s);
      for (const mc of pool.slice(0, topCores.length < 4 ? 5 : 2)) {
        let o = mc.o;
        const outOpts = forceOuter ? [forceOuter] : [null].concat(outers);
        let bestO = null;
        for (const j of outOpts) { const t = Object.assign({}, o, { outer: j || undefined }); const s = evaluate(t, C, { inner: true, outer: true, shoes: false, tips: false }).score; if (!bestO || s > bestO.s) bestO = { o: t, s }; }
        o = bestO.o;
        // Strumpfhose oder Leggings: nur wo sinnvoll – unter Rock, Kleid, Shorts bei Kühle, unter der Hose bei Frost
        const base = o.bottom || o.onepiece;
        let legOpts = [null];
        if (o._fixLegs) legOpts = [o._fixLegs];
        else if (forceLegs) legOpts = [forceLegs];
        else if (legwear.length && base && ((bareLegs(base) && C.tMax < 22) || C.tMax < 5)) {
          const fit = legwear.filter(l => legsFits(l, o));
          if (fit.length) legOpts = [null].concat(fit.map(l => [evaluate(Object.assign({}, o, { legs: l }), C, { inner: true, outer: true, shoes: false, tips: false }).score, l]).sort((a, b) => b[0] - a[0]).slice(0, 2).map(x => x[1]));
        }
        const shoeOpts = forceShoes ? [forceShoes] : (shoes.length ? shoes : [null]);
        let bestS = null;
        const shoeScores = [];
        legOpts.forEach((lg, li) => {
          // Mit der ersten Variante alle Schuhe probieren, für weitere Strumpfhosen nur die drei besten Schuhe
          const opts = li === 0 ? shoeOpts : shoeScores.sort((a, b) => b[0] - a[0]).slice(0, 3).map(x => x[1]);
          for (const sh of opts) {
            const t = Object.assign({}, o, { shoes: sh || undefined, legs: lg || undefined }); const ev = evaluate(t, C);
            if (li === 0) shoeScores.push([ev.score, sh]);
            if (!bestS || ev.score > bestS.ev.score) bestS = { o: t, ev };
          }
        });
        const ck = coreKey(bestS.o);
        if (disliked.has(ck)) continue;
        full.push(bestS);
      }
    }
    full.sort((a, b) => b.ev.score - a.ev.score);

    // 3) Drei unterschiedliche Outfits wählen
    const chosen = [], seen = new Set();
    const coreIds = o => MAIN_SLOTS.map(s => o[s] && o[s].id).filter(Boolean);
    for (const maxShared of [0, 1, 2, 9]) {
      for (const f of full) {
        if (chosen.length >= (opts.count || 3)) break;
        const k = fullKey(f.o); if (seen.has(k)) continue;
        const ids = coreIds(f.o);
        if (chosen.every(c => coreIds(c.o).filter(x => ids.includes(x)).length <= maxShared)) { chosen.push(f); seen.add(k); }
      }
    }

    // 4) Accessoires
    for (const c of chosen) { const a = pickAccessories(c.o, accs, C, forceAcc, c.ev.styleId); c.o.acc = a.list; c.accWhy = a.why; }

    return { outfits: chosen.map(c => finish(c.o, c.ev, C, c.accWhy)), notes };
  }

  function pickAccessories(o, accs, C, forceAcc, styleId) {
    const res = [], why = [];
    const sty = styleId || '';
    const elegant = ['italienisch', 'klassisch', 'chic', 'preppy', 'romantisch'];
    const worn = pieces(o, true);
    const used = new Set(worn.map(i => prim(i).id));
    const accentsNow = new Set(worn.filter(i => !prim(i).neutral).map(i => prim(i).id));
    const shoeCol = o.shoes ? prim(o.shoes).id : null;
    const fam = id => ['braun', 'camel', 'beige', 'khaki', 'creme'].includes(id) ? 'braun' : ['schwarz', 'anthrazit'].includes(id) ? 'schwarz' : id;
    const mats = a => a.materials || [];
    if (C.rain) accs = accs.filter(a => !mats(a).some(m => ((MATERIALS[m] || {}).tags || []).includes('rainBad')));
    const pal = (STYLES[sty] || NO_STYLE).palette;
    const rate = a => {
      const c = prim(a); let r = (used.has(c.id) ? 2 : 0) + (c.neutral ? 1 : 0) + (C.favs.includes(c.id) ? 1 : 0) + hash(a.id + C.seed) * 0.5;
      if (!c.neutral && !used.has(c.id) && accentsNow.size >= 1) r -= 1.5; // kein zweiter, neuer Farbakzent
      if (pal.avoid.includes(c.id)) r -= 2; else if (pal.accents.includes(c.id) && !accentsNow.size) r += 0.8;
      for (const it of worn) {   // keine Farbe, die sich mit dem Outfit beißt oder knapp danebenliegt
        const k = colorRel(c.id, prim(it).id).kind;
        if (k === 'clash' || k === 'grell' || k === 'temp') { r -= 3; break; }
        if (k === 'near') r -= 1;
      }
      return r;
    };
    const of = sub => accs.filter(a => a.typeDef.sub === sub && a !== forceAcc);
    const best = (list, extra) => list.map(a => [rate(a) + (extra ? extra(a) : 0), a]).sort((x, y) => y[0] - x[0])[0];
    const add = (b, w) => { if (b && !res.includes(b[1])) { res.push(b[1]); if (w) why.push(w); } };
    const has = sub => res.some(a => a.typeDef.sub === sub);
    if (forceAcc) res.push(forceAcc);

    // Wärme
    if (C.tMin < 10 && !has('schal')) add(best(of('schal'), a => elegant.includes(sty) && mats(a).some(m => ['wolle', 'kaschmir', 'merino'].includes(m)) ? 1 : 0));
    if (!has('muetze') && !has('hut') && !has('cap')) {
      if (C.tMin < 4) add(best(of('muetze').concat(of('hut').filter(h => h.warmth >= 3)), a => a.typeDef.sub === 'hut' ? (['italienisch', 'klassisch', 'chic', 'boho'].includes(sty) ? 2 : -0.5) : 0));
      else if (C.sunny && C.tMax >= 24) {
        const b = best(of('hut').filter(h => h.warmth <= 2).concat(of('cap')), a => a.typeDef.sub === 'cap' ? (['sportlich', 'streetwear', 'casual'].includes(sty) ? 1.5 : -3) : (['sportlich', 'streetwear'].includes(sty) ? -1 : 1));
        if (b && b[0] > 0) add(b, 'Hut als Sonnenschutz');
      }
    }
    if (C.tMin < 2 && !has('handschuhe')) add(best(of('handschuhe')));
    if (C.sunny && C.tMax >= 15 && !has('sonnenbrille')) add(best(of('sonnenbrille')), 'Sonnenbrille bei Sonne');

    // Stil-Akzente: ein bis zwei gezielte Details genügen
    const ACCENT_SUBS = ['tuch', 'einstecktuch', 'schmuck'];
    const accentRoom = () => (statementCount(o) >= 1 ? 1 : 2) - res.filter(a => ACCENT_SUBS.includes(a.typeDef.sub)).length > 0;
    if (accentRoom() && !has('schal') && !has('tuch') && C.tMin >= 6 && C.tMax <= 26 && boldCount(o) < 1 && elegant.concat(['boho']).includes(sty)) {
      const b = best(of('tuch'), a => (mats(a).includes('seide') ? 1 : 0) + (!prim(a).neutral && accentsNow.size === 0 ? 1.5 : 0));
      if (b && b[0] >= 1.5) add(b, sty === 'italienisch' ? 'Seidentuch als lässiges Detail' : 'Tuch als Akzent');
    }
    if (hasBlazer(o) && ['italienisch', 'klassisch', 'chic', 'preppy'].includes(sty) && ['arbeit', 'elegant', 'party'].includes(C.occasion.id) && !has('einstecktuch') && accentRoom()) add(best(of('einstecktuch')), 'Einstecktuch im Sakko');
    const loops = (o.bottom && ['jeans', 'stoffhose', 'chino', 'weitehose', 'cargohose'].includes(o.bottom.type)) || (o.onepiece && o.onepiece.typeDef.dress && C.gender !== 'm');
    if (loops && !has('guertel')) {
      const b = best(of('guertel').filter(g => g.formality >= C.occasion.lo - 1), a => shoeCol ? (prim(a).id === shoeCol ? 3 : fam(prim(a).id) === fam(shoeCol) ? 2 : -2) : 0);
      if (b && b[0] >= 2) add(b, shoeCol && fam(prim(b[1]).id) === fam(shoeCol) ? 'Gürtel passt zu den Schuhen' : null);
    }
    if (!has('tasche')) {
      const occ = C.occasion;
      const bags = of('tasche').filter(a => a.formality >= occ.lo - 1 && a.formality <= occ.hi + 1 && !(sty === 'italienisch' && a.pattern === 'print'));
      const b = best(bags, a => (shoeCol && fam(prim(a).id) === fam(shoeCol) ? 1.5 : 0) + (elegant.includes(sty) && mats(a).includes('leder') ? 1 : 0));
      add(b, b && shoeCol && fam(prim(b[1]).id) === fam(shoeCol) ? 'Tasche und Schuhe aufeinander abgestimmt' : null);
    }
    if ((['arbeit', 'party', 'elegant'].includes(C.occasion.id) || ['italienisch', 'chic', 'romantisch', 'boho'].includes(sty)) && !has('schmuck') && accentRoom()) {
      const metal = a => prim(a).id === 'gold' ? 'gold' : prim(a).id === 'silber' ? 'silber' : null;
      const b = best(of('schmuck'), a => (C.metalPref && metal(a) === C.metalPref ? 2 : 0) + (sty === 'italienisch' && metal(a) === 'gold' ? 1 : 0));
      add(b, b && C.metalPref && metal(b[1]) === C.metalPref ? (C.metalPref === 'gold' ? 'Goldschmuck passt zu deinem Typ' : 'Silberschmuck passt zu deinem Typ') : null);
    }
    return { list: res, why };
  }

  function finish(o, ev, C, accWhy) {
    const slots = {};
    for (const s of ORDER) if (o[s]) slots[s] = o[s].id;
    const uniq = arr => { const seen = new Set(); return arr.filter(([, w]) => w && !seen.has(w) && seen.add(w)); };
    const plus = uniq(ev.plus.slice().sort((a, b) => b[0] - a[0])).slice(0, 3).map(x => x[1]).concat((accWhy || []).slice(0, 1));
    const minus = uniq(ev.minus.slice().sort((a, b) => a[0] - b[0])).filter(x => x[0] <= -1.5).slice(0, 2).map(x => x[1]);
    const warn = [];
    if ((C.tMin < 17 || C.rain) && !o.outer && !C.hasOuter) warn.push('Keine Jacke im Schrank – denk an eine Jacke.');
    if (!o.shoes && !C.hasShoes) warn.push('Noch keine Schuhe im Schrank.');
    const stackS = (o.onepiece ? ['under', 'onepiece', 'mid'] : ['top', 'mid', 'layer']).concat(['outer']).filter(s => o[s]);
    const layers = stackS.length >= 3 ? stackS.map(s => (s === 'mid' && o.mid.typeDef.slot === 'top' && o.mid.typeDef.layerOk) ? shortType(o.mid) + ' (offen)' : shortType(o[s])) : [];
    const tips = (ev.tips || []).slice();
    if (!o.legs && bareLegs(o.bottom || o.onepiece) && C.tMax < 14 && !C.hasLegs) tips.unshift('Bei der Kühle eine blickdichte Strumpfhose drunter. Erfasse deine Strumpfhosen im Schrank, dann plane ich sie mit ein.');
    return { slots, acc: (o.acc || []).map(a => a.id), score: Math.round(ev.score * 10) / 10, plus, minus, warn, tips: tips.slice(0, 2), style: ev.style, coreKey: coreKey(o), key: fullKey(o), layers };
  }

  // Alternativen für ein einzelnes Teil im Outfit
  function alternatives(rawItems, outfit, slot, C, opts) {
    const all = prepare(rawItems);
    const byId = Object.fromEntries(all.map(i => [i.id, i]));
    const base = {};
    for (const [s, id] of Object.entries(outfit.slots)) if (byId[id]) base[s] = byId[id];
    C.hasOuter = all.some(i => i.typeDef.slot === 'outer' && (i.status || 'verfuegbar') === 'verfuegbar');
    C.hasShoes = all.some(i => i.typeDef.slot === 'shoes' && (i.status || 'verfuegbar') === 'verfuegbar');
    C.hasLegs = all.some(i => i.typeDef.slot === 'legs' && (i.status || 'verfuegbar') === 'verfuegbar');
    C.likedKeys = new Set(((opts && opts.rated) || []).filter(r => r.rating > 0).map(r => r.coreKey));
    const avail = all.filter(i => (i.status || 'verfuegbar') === 'verfuegbar' && hardOk(i, C));
    let cands;
    if (slot === 'mid') cands = avail.filter(i => i.typeDef.slot === 'mid' || (i.typeDef.knit && i.typeDef.overBase) || i.typeDef.layerOk);
    else if (slot === 'layer') cands = avail.filter(i => i.typeDef.slot === 'mid' && i.typeDef.open && !i.typeDef.vest);
    else if (slot === 'under') cands = avail.filter(i => i.typeDef.underOk && i.warmth <= 3);
    else if (slot === 'legs') cands = avail.filter(i => i.typeDef.legLayer);
    else cands = avail.filter(i => i.typeDef.slot === slot);
    const res = [];
    const optional = ['mid', 'outer', 'layer', 'under', 'legs'].includes(slot);
    const list = optional ? [null].concat(cands) : cands;
    const usedIds = new Set(Object.entries(base).filter(([s]) => s !== slot).map(([, i]) => i.id));
    for (const c of list) {
      if (c && base[slot] && c.id === base[slot].id) continue;
      if (c && usedIds.has(c.id)) continue;
      const o = Object.assign({}, base, { [slot]: c || undefined });
      if (slot === 'mid' && !c && o.layer) { o.mid = o.layer; delete o.layer; }   // ohne Pullover rückt das Sakko nach innen
      if (o.mid && !midFits(o.mid, o)) continue;
      if (o.layer && !layerFits(o.layer, o)) { if (slot === 'layer') continue; delete o.layer; }
      if (o.under && !underFits(o.under, o)) { if (slot === 'under') continue; delete o.under; }
      if (o.legs && !legsFits(o.legs, o)) { if (slot === 'legs') continue; delete o.legs; }
      const ev = evaluate(o, C);
      res.push({ id: c ? c.id : null, score: ev.score, outfit: finish(Object.assign(o, { acc: [] }), ev, C) });
    }
    res.sort((a, b) => b.score - a.score);
    return res.slice(0, 16);
  }

  // Wetterdaten von Open-Meteo in Tageswerte umrechnen (7–20 Uhr)
  function summarizeWeather(json) {
    const h = json.hourly, d = json.daily, days = [];
    for (let i = 0; i < d.time.length; i++) {
      const date = d.time[i];
      const idx = h.time.map((t, k) => [t, k]).filter(([t]) => t.startsWith(date)).filter(([t]) => { const hr = +t.slice(11, 13); return hr >= 7 && hr <= 20; }).map(([, k]) => k);
      const feel = idx.map(k => h.apparent_temperature[k]).filter(v => v != null);
      const temp = idx.map(k => h.temperature_2m[k]).filter(v => v != null);
      const prec = idx.reduce((s, k) => s + (h.precipitation[k] || 0), 0);
      const prob = Math.max(0, ...idx.map(k => h.precipitation_probability[k] || 0));
      const code = d.weather_code[i];
      const snow = [71, 73, 75, 77, 85, 86].includes(code);
      const rainy = [61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(code);
      days.push({
        date, code,
        tMin: Math.min(...temp), tMax: Math.max(...temp),
        feelMin: Math.min(...feel), feelMax: Math.max(...feel),
        rainProb: prob, precip: Math.round(prec * 10) / 10,
        rain: prec >= 1 || (prob >= 55 && prec >= 0.2) || (rainy && prob >= 40), snow
      });
    }
    return days;
  }
  const WEATHER_TEXT = c => c === 0 ? 'Klar' : c <= 2 ? 'Heiter bis wolkig' : c === 3 ? 'Bedeckt' : c <= 48 ? 'Nebel' : c <= 57 ? 'Nieselregen' : c <= 67 ? 'Regen' : c <= 77 ? 'Schnee' : c <= 82 ? 'Regenschauer' : c <= 86 ? 'Schneeschauer' : 'Gewitter';
  const WEATHER_ICON = c => c === 0 ? '☀️' : c <= 2 ? '⛅' : c === 3 ? '☁️' : c <= 48 ? '🌫️' : c <= 67 ? '🌧️' : c <= 77 ? '❄️' : c <= 82 ? '🌦️' : c <= 86 ? '🌨️' : '⛈️';

  // Lernen aus Bewertungen
  function learnFrom(learn, outfit, rating, reason, occasion, colorsOf) {
    learn = Object.assign({ pairs: {}, colorPairs: {}, itemOcc: {}, tempOffset: 0 }, learn || {});
    const ids = MAIN_SLOTS.map(s => outfit.slots[s]).filter(Boolean);
    const step = rating > 0 ? 1.2 : (reason === 'stil' ? -2 : -1.2);
    if (rating > 0 || !reason || reason === 'stil' || reason === 'sonst') {
      for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
        const k = pairKey(ids[i], ids[j]); learn.pairs[k] = clamp((learn.pairs[k] || 0) + step, -6, 4);
      }
    }
    if (rating < 0 && reason === 'farben') {
      const cols = [...new Set(ids.map(colorsOf).filter(Boolean))];
      for (let i = 0; i < cols.length; i++) for (let j = i + 1; j < cols.length; j++) { const k = pairKey(cols[i], cols[j]); learn.colorPairs[k] = clamp((learn.colorPairs[k] || 0) - 1.5, -6, 0); }
    }
    if (rating < 0 && reason === 'warm') learn.tempOffset = clamp((learn.tempOffset || 0) + 0.7, -4, 4);
    if (rating < 0 && reason === 'kalt') learn.tempOffset = clamp((learn.tempOffset || 0) - 0.7, -4, 4);
    if (rating < 0 && reason === 'anlass') for (const id of ids) { const k = id + '|' + occasion; learn.itemOcc[k] = clamp((learn.itemOcc[k] || 0) - 1.5, -6, 0); }
    return learn;
  }


  // ---------------------------------------------------------------- Kombinierbarkeit, Aussortieren, Ergänzen
  function pairOk(a, b) {
    if (Math.abs(a.formality - b.formality) > 2) return false;
    const k = colorRel(prim(a).id, prim(b).id).kind;
    if (k === 'clash' || k === 'grell') return false;
    if ((PATTERNS[a.pattern] || PATTERNS.uni).bold >= 1 && (PATTERNS[b.pattern] || PATTERNS.uni).bold >= 1) return false;
    return true;
  }
  function partnersOf(it, all) {
    const s = it.typeDef.slot;
    if (s === 'top') return all.filter(x => x.typeDef.slot === 'bottom' && pairOk(it, x));
    if (s === 'bottom') return all.filter(x => x.typeDef.slot === 'top' && pairOk(it, x));
    return null;
  }
  function partnerInfo(rawItems, id) {
    const all = prepare(rawItems); const it = all.find(i => i.id === id); if (!it) return null;
    const p = partnersOf(it, all); if (!p) return null;
    return { count: p.length, noun: it.typeDef.slot === 'top' ? (p.length === 1 ? 'Unterteil' : 'Unterteilen') : (p.length === 1 ? 'Oberteil' : 'Oberteilen') };
  }
  const PLURAL = new Set(['leggings', 'shorts', 'sneaker', 'laufschuhe', 'ballerinas', 'loafer', 'derby', 'slingbacks', 'pumps', 'sandalen', 'sandaletten', 'stiefeletten', 'stiefel', 'winterstiefel', 'handschuhe']);
  const FUNCTIONAL = new Set(['regenjacke', 'parka', 'winterjacke', 'winterstiefel']);
  const MEN_UNUSUAL = new Set(['bluse', 'top', 'body', 'rock_kurz', 'rock_lang', 'kleid_kurz', 'kleid_lang', 'traegerkleid', 'strumpfhose', 'ballerinas', 'slingbacks', 'pumps', 'sandaletten', 'schmuck', 'leggings']);
  const genderOk = (type, gender) => gender !== 'm' || !MEN_UNUSUAL.has(type);
  function styleFit(it, styles) {
    let best = null;
    for (const s of styles) {
      let v = 0; const neg = [];
      if (s.like.types.includes(it.type)) v += 1.4; else if (s.avoid.types.includes(it.type)) { v -= 2.5; neg.push(it.typeDef.name.split(' / ')[0] + (PLURAL.has(it.type) ? ' passen' : ' passt')); }
      if (s.like.patterns.includes(it.pattern || 'uni')) v += 0.4; else if (s.avoid.patterns.includes(it.pattern)) { v -= 1.5; neg.push('Das Muster „' + PATTERNS[it.pattern].name + '“ passt'); }
      const mats = it.materials || [];
      if (mats.some(m => s.like.materials.includes(m))) v += 0.6;
      const bad = mats.filter(m => s.avoid.materials.includes(m)); if (bad.length) { v -= 1.5; neg.push('Das Material ' + MATERIALS[bad[0]].name + ' passt'); }
      if (s.like.colors.includes(prim(it).id)) v += 0.6;
      if (!best || v > best.v) best = { v, s, neg };
    }
    return best;
  }
  function review(rawItems, profile, opts) {
    opts = opts || {};
    const now = opts.now || Date.now(), today = opts.today;
    const all = prepare(rawItems);
    const styles = (profile.styles || []).map(s => STYLES[s]).filter(Boolean);
    const ft = FARBTYP[profile.farbtyp], nogos = profile.nogoColors || [];
    const trackDays = opts.trackingSince ? daysBetween(opts.trackingSince, today) : 0;
    const rated = opts.rated || [];
    const groups = {}, dup = {};
    for (const it of all) { if (['acc', 'other'].includes(it.typeDef.slot)) continue; const k = it.type + '|' + (it.colors || [])[0] + '|' + (it.pattern || 'uni'); (groups[k] = groups[k] || []).push(it); }
    for (const g of Object.values(groups)) if (g.length >= 3) g.slice().sort((a, b) => (b.fav ? 1 : 0) - (a.fav ? 1 : 0) || (b.wearCount || 0) - (a.wearCount || 0) || (b.created || 0) - (a.created || 0)).slice(2).forEach(it => { dup[it.id] = g.length; });
    const nTops = all.filter(i => i.typeDef.slot === 'top').length, nBottoms = all.filter(i => i.typeDef.slot === 'bottom').length;
    const out = [];
    for (const it of all) {
      if (it.fav || (it.keepUntil && it.keepUntil > now)) continue;
      const r = [], c = prim(it), slot = it.typeDef.slot;
      const clothing = ['top', 'mid', 'bottom', 'onepiece', 'outer', 'shoes'].includes(slot);
      if (nogos.includes(c.id)) r.push([3, 'Die Farbe ' + c.name + ' steht auf deiner No-Go-Liste.']);
      if (it.condition === 'abgetragen') r.push([3, 'Du hast es als abgetragen markiert.']);
      if (styles.length && clothing) {
        const f = styleFit(it, styles);
        const sn = styles.length === 1 ? ' „' + styles[0].name + '“' : '';
        if (f && f.v <= -1.5 && f.neg.length) {
          if (FUNCTIONAL.has(it.type)) r.push([1, f.neg[0] + ' nicht zu deinem Stil' + sn + ', ist als Wetterschutz aber sinnvoll.']);
          else r.push([2.5, f.neg[0] + ' nicht zu deinem Stil' + sn + '. Behalte es, wenn du es für Sport oder zu Hause brauchst.']);
        }
      }
      if (ft && (slot === 'top' || slot === 'onepiece') && ft.bad.includes(c.id)) r.push([1.5, c.name + ' ist nah am Gesicht für den Farbtyp ' + ft.name + ' eher ungünstig.']);
      if (trackDays >= 60 && (it.status || 'verfuegbar') === 'verfuegbar') {
        if (!it.lastWorn && it.created && now - it.created >= 90 * 864e5) r.push([2, 'Seit ' + Math.floor((now - it.created) / (30 * 864e5)) + ' Monaten im Schrank und noch nie getragen.']);
        else if (it.lastWorn && daysBetween(it.lastWorn, today) >= 365) r.push([2, 'Seit über einem Jahr nicht mehr getragen.']);
      }
      const p = partnersOf(it, all);
      if (p && p.length === 0 && (slot === 'top' ? nBottoms : nTops) >= 3) r.push([2, 'Passt farblich oder vom Stil her zu keinem ' + (slot === 'top' ? 'deiner Unterteile.' : 'deiner Oberteile.')]);
      if (dup[it.id]) r.push([1.5, 'Du hast ' + dup[it.id] + '-mal ' + it.typeDef.name + ' in ' + c.name + ' – zwei reichen meist.']);
      const nd = rated.filter(x => x.rating < 0 && Object.values(x.slots).includes(it.id)).length;
      const nl = rated.filter(x => x.rating > 0 && Object.values(x.slots).includes(it.id)).length;
      if (nd >= 3 && nl === 0) r.push([1.5, 'Steckt in ' + nd + ' Outfits, die du abgelehnt hast.']);
      // Farbtyp oder Doppelte allein sind kein Grund – erst zusammen mit einem weiteren Hinweis
      const w = r.reduce((s, x) => s + x[0], 0);
      if (w >= 2) out.push({ id: it.id, weight: w, reasons: r.sort((a, b) => b[0] - a[0]).map(x => x[1]) });
    }
    return out.sort((a, b) => b.weight - a.weight);
  }

  function virtualItem(type, color, mats) {
    const t = TYPES[type];
    return { id: 'v_' + type + '_' + color, type, typeDef: t, colors: [color], pattern: 'uni', materials: mats || [], fit: 'normal', formality: clamp(t.f, 1, 5), warmth: clamp(t.w || 2, 1, 5), status: 'verfuegbar' };
  }
  function pickColors(cands, profile, slot) {
    const nogo = profile.nogoColors || [], fav = profile.favColors || [], ft = FARBTYP[profile.farbtyp];
    const face = ['top', 'onepiece', 'mid', 'acc'].includes(slot);
    return [...new Set(cands)].filter(c => COLOR[c] && !nogo.includes(c))
      .map((c, i) => [c, -i * 0.1 + (fav.includes(c) ? 1 : 0) + (face && ft && ft.good.includes(c) ? 0.8 : 0) - (face && ft && ft.bad.includes(c) ? 1.5 : 0)])
      .sort((a, b) => b[1] - a[1]).slice(0, 3).map(x => x[0]);
  }
  const WETTER_WORT = { kalt: 'kaltem', mild: 'mildem', warm: 'warmem' };
  function gaps(rawItems, profile, opts) {
    opts = opts || {};
    const today = opts.today, hidden = new Set(opts.hidden || []);
    const all = prepare(rawItems);
    const styles = (profile.styles || []).map(s => STYLES[s]).filter(Boolean);
    const st = styles[0] ? styles[0].id : '';
    const gender = profile.gender || '';
    const elegantS = ['italienisch', 'klassisch', 'chic', 'preppy', 'romantisch', 'minimalistisch'].includes(st);
    const sportyS = ['sportlich', 'streetwear'].includes(st);
    const recs = [];
    const R = (id, prio, group, type, cands, title, why, extra) => {
      const t = TYPES[type]; if (!t) return;
      recs.push(Object.assign({ id, prio, group, type, colors: pickColors(cands, profile, t.slot), mats: [], title: title || t.name, why }, extra || {}));
    };
    const has = pred => all.some(pred);
    const slotOf = i => i.typeDef.slot;
    const rainBad = i => (i.materials || []).some(m => ((MATERIALS[m] || {}).tags || []).includes('rainBad'));

    // Wetter
    if (!has(i => slotOf(i) === 'outer' && i.warmth >= 4))
      R('wx-warm', 1, 'wetter', elegantS ? 'mantel' : sportyS ? 'parka' : 'winterjacke', elegantS ? ['camel', 'navy', 'grau', 'schwarz'] : ['schwarz', 'navy', 'oliv', 'grau'],
        elegantS ? 'Warmer Wollmantel' : 'Warme Winterjacke', 'Für Tage unter 5 °C fehlt dir eine wirklich warme Jacke. Bisher muss die App mit dünneren Jacken und vielen Lagen planen.', { mats: elegantS ? ['wolle'] : [] });
    if (!has(i => slotOf(i) === 'outer' && (i.typeDef.rain || 0) >= 1 && i.warmth <= 3 && !rainBad(i)))
      R('wx-rain', 1, 'wetter', elegantS ? 'trench' : sportyS ? 'regenjacke' : 'uebergang', elegantS ? ['beige', 'navy'] : ['navy', 'oliv', 'schwarz'],
        elegantS ? 'Trenchcoat' : 'Regenfeste Übergangsjacke', 'Für Regen bei milden Temperaturen fehlt eine leichte, regentaugliche Jacke.');
    if (!has(i => slotOf(i) === 'shoes' && i.typeDef.minT <= 0))
      R('wx-coldshoes', 1, 'wetter', sportyS ? 'winterstiefel' : 'stiefeletten', ['braun', 'schwarz'], sportyS ? 'Warme Winterstiefel' : 'Stiefeletten aus Glattleder', 'Für Frost und Schneematsch fehlen geschlossene, warme Schuhe.', { mats: sportyS ? [] : ['leder'] });
    else if (!has(i => slotOf(i) === 'shoes' && (i.typeDef.rain || 0) >= 1 && !rainBad(i)))
      R('wx-rainshoes', 1, 'wetter', elegantS ? 'derby' : 'stiefeletten', ['braun', 'schwarz'], 'Regentaugliche Lederschuhe', 'Alle deine Schuhe sind empfindlich bei Nässe. Für Regentage fehlt ein Paar aus Glattleder.', { mats: ['leder'] });
    if (gender !== 'm' && all.filter(i => i.typeDef.skirt || i.typeDef.dress).length >= 2 && !has(i => i.type === 'strumpfhose' && i.warmth >= 3))
      R('wx-tights', 2, 'wetter', 'strumpfhose', ['schwarz', 'navy', 'braun', 'anthrazit', 'bordeaux'], 'Blickdichte Strumpfhose',
        'Damit Röcke und Kleider auch im Herbst und Winter tragbar sind. Am vielseitigsten: 60–80 den, in Schwarz oder im Ton deiner Stiefel.', { warmth: 3 });
    if (!has(i => slotOf(i) === 'mid') && all.filter(i => slotOf(i) === 'top').length >= 2)
      R('wx-layer', 2, 'wetter', elegantS && st !== 'romantisch' ? 'blazer' : sportyS ? 'sweatjacke' : 'cardigan', ['navy', 'beige', 'grau', 'camel'], null, 'Für wechselhafte Tage fehlt eine Lage zum Drüberziehen und Ausziehen – der Zwiebellook.');

    // Anlässe
    const SCEN = [['kalt', 0, 6], ['mild', 10, 17], ['warm', 21, 28]];
    const firstNeutral = ['navy', 'grau', 'schwarz', 'beige'].find(c => !(profile.nogoColors || []).includes(c)) || 'grau';
    const chooseType = (slot, C) => {
      const order = [];
      styles.forEach(s => s.like.types.forEach(t => { if (!order.includes(t)) order.push(t); }));
      Object.keys(TYPES).forEach(t => { if (!order.includes(t)) order.push(t); });
      for (const t of order) {
        if (TYPES[t].slot !== slot || styles.some(s => s.avoid.types.includes(t))) continue;
        if (TYPES[t].traeger) continue;
        if (!genderOk(t, gender)) continue;
        if (gender === 'w' && t === 'hemd' && TYPES.bluse) { const vb = virtualItem('bluse', firstNeutral); if (hardOk(vb, C) && Math.abs(vb.formality - C.occasion.target) <= 1.2) return 'bluse'; }
        if (slot === 'shoes' && (TYPES[t].minT > C.tMin + 3 || TYPES[t].maxT < C.tMax - 3)) continue;
        const v = virtualItem(t, firstNeutral);
        if (hardOk(v, C) && Math.abs(v.formality - C.occasion.target) <= 1.2) return t;
      }
      return null;
    };
    for (const occ of ['arbeit', 'alltag', 'party', 'elegant']) {
      const missing = {};
      for (const [lab, lo, hi] of SCEN) {
        const C = buildContext({ weather: { feelMin: lo, feelMax: hi }, profile, occasion: occ, date: today });
        const ok = all.filter(i => hardOk(i, C));
        const tops = ok.filter(i => slotOf(i) === 'top'), bottoms = ok.filter(i => slotOf(i) === 'bottom'), ones = ok.filter(i => slotOf(i) === 'onepiece');
        let cores = ones.length;
        outer: for (const t of tops) for (const b of bottoms) if (pairOk(t, b)) { cores++; break outer; }
        if (!cores) { const k = (!tops.length) ? 'top' : 'bottom'; (missing[k] = missing[k] || []).push(lab); }
        if (!ok.some(i => slotOf(i) === 'shoes')) (missing.shoes = missing.shoes || []).push(lab);
      }
      for (const [slot, labs] of Object.entries(missing)) {
        const sc = SCEN.find(x => x[0] === (labs.includes('mild') ? 'mild' : labs[0]));
        const C = buildContext({ weather: { feelMin: sc[1], feelMax: sc[2] }, profile, occasion: occ, date: today });
        const type = chooseType(slot, C); if (!type) continue;
        const occName = { arbeit: 'die Arbeit', alltag: 'den Alltag', party: 'Partys', elegant: 'elegante Anlässe' }[occ];
        const noun = slot === 'top' ? 'kein passendes Oberteil' : slot === 'bottom' ? 'keine passende Hose und keinen passenden Rock' : 'keine passenden Schuhe';
        const when = labs.length < 3 ? ' bei ' + labs.map(l => WETTER_WORT[l]).join(' und ') + ' Wetter' : '';
        const cands = slot === 'shoes' ? (type === 'sneaker' ? ['weiss', 'creme'] : ['braun', 'schwarz', 'camel']) : slot === 'top' ? ['weiss', 'creme', 'hellblau', 'navy'] : (styles.length ? styles.flatMap(s => s.like.colors).filter(c => COLOR[c].neutral) : []);
        R('occ-' + occ + '-' + slot, (occ === 'arbeit' || occ === 'alltag') ? 1 : 2, 'anlass', type, cands.concat(['navy', 'schwarz', 'beige', 'grau']),
          TYPES[type].name + ' für ' + occName, 'Für ' + occName + when + ' findet die App bisher ' + noun + '.');
      }
    }

    // Grundausstattung des Stils
    for (const s of styles.slice(0, 2)) {
      for (const e of (ESSENTIALS[s.id] || [])) {
        if (e.g && e.g !== gender) continue;
        if (all.some(i => e.t.includes(i.type) && (!e.need || (i.materials || []).some(m => e.need.includes(m))))) continue;
        R('ess-' + s.id + '-' + e.t[0], 2, 'stil', e.t[0], e.c, e.title, e.why, { mats: e.m || [], need: e.need || null, style: s.name, allTypes: e.t });
      }
    }

    // Mehr Kombinationen
    const tops = all.filter(i => slotOf(i) === 'top'), bottoms = all.filter(i => slotOf(i) === 'bottom');
    const neutralC = [...new Set((styles.length ? styles.flatMap(s => s.like.colors) : []).filter(c => COLOR[c].neutral).concat(['navy', 'schwarz', 'beige', 'grau', 'weiss', 'creme', 'jeansblau']))]
      .filter(c => !(profile.nogoColors || []).includes(c));
    for (const [slot, own, opp, noun, oppNoun] of [['bottom', bottoms, tops, 'Unterteile', 'Oberteile'], ['top', tops, bottoms, 'Oberteile', 'Unterteile']]) {
      if (opp.length < 3) continue;
      const orphans = opp.filter(o => partnersOf(o, all).length <= 1);
      if (opp.length / Math.max(1, own.length) < 2.2 && !orphans.length) continue;
      const typeCands = [...new Set((styles.length ? styles.flatMap(s => s.like.types) : []).concat(slot === 'bottom' ? ['stoffhose', 'jeans', 'chino', 'rock_lang'] : ['tshirt', 'bluse', 'hemd', 'pullover']))]
        .filter(t => TYPES[t] && TYPES[t].slot === slot && !TYPES[t].traeger && genderOk(t, gender) && !styles.some(s => s.avoid.types.includes(t))).slice(0, 5);
      let best = null;
      for (const t of typeCands) for (const c of neutralC.slice(0, 6)) {
        if (own.some(i => i.type === t && prim(i).id === c)) continue;
        const v = virtualItem(t, c);
        const gain = opp.filter(o => pairOk(v, o)).length;
        const fix = orphans.filter(o => pairOk(v, o)).length;
        const sc = gain + 2 * fix + 2 * orphans.filter(o => o.fav && pairOk(v, o)).length;
        if (!best || sc > best.sc) best = { t, c, gain, fix, sc };
      }
      if (best && best.gain >= 3) {
        const why = 'Du hast ' + opp.length + ' ' + oppNoun + ', aber nur ' + own.length + ' ' + noun + '. ' + TYPES[best.t].name + ' in ' + COLOR[best.c].name + ' passt zu ' + best.gain + ' davon' +
          (best.fix ? ', darunter ' + best.fix + (best.fix === 1 ? ' Teil, das' : ' Teile, die') + ' bisher kaum kombinierbar ' + (best.fix === 1 ? 'ist.' : 'sind.') : '.');
        recs.push({ id: 'kombi-' + slot + '-' + best.t + '-' + best.c, prio: 2, group: 'kombi', type: best.t, colors: [best.c], mats: [], title: TYPES[best.t].name + ' in ' + COLOR[best.c].name, why, gain: best.gain });
      }
    }

    // Kleinigkeiten
    const coldAcc = [['schal', 'Schal'], ['handschuhe', 'Handschuhe']].filter(([t]) => !has(i => i.type === t));
    if (!has(i => i.type === 'muetze' || (i.type === 'hut' && i.warmth >= 3))) coldAcc.push(['muetze', elegantS ? 'Mütze oder Filzhut' : 'Mütze']);
    if (coldAcc.length) R('acc-cold', 3, 'klein', coldAcc[0][0], ['camel', 'grau', 'navy', 'schwarz'], 'Für kalte Tage: ' + coldAcc.map(x => x[1]).join(', '), 'Fehlt im Schrank – die App plant solche Accessoires automatisch ein, wenn es kalt wird.', { mats: elegantS ? ['wolle', 'kaschmir'] : [] });
    if (!has(i => i.type === 'sonnenbrille')) R('acc-sun', 3, 'klein', 'sonnenbrille', ['schwarz', 'braun'], null, 'Für sonnige Tage – die App schlägt sie bei Sonne automatisch vor.');
    if (bottoms.filter(b => ['jeans', 'stoffhose', 'chino', 'weitehose'].includes(b.type)).length >= 2 && !has(i => i.type === 'guertel')) {
      const shoeCols = all.filter(i => slotOf(i) === 'shoes').map(i => prim(i).id).filter(c => ['braun', 'schwarz', 'camel'].includes(c));
      R('acc-belt', 3, 'klein', 'guertel', shoeCols.concat(['braun', 'schwarz']), 'Ledergürtel', 'Passend zur Farbe deiner Schuhe – so wirkt ein Outfit stimmig.', { mats: ['leder'] });
    }
    if (!has(i => i.type === 'tasche')) R('acc-bag', 3, 'klein', 'tasche', ['braun', 'schwarz', 'camel'], 'Schlichte Tasche', 'Die App stimmt Taschen farblich auf die Schuhe ab.', { mats: ['leder'] });

    // Doppelte zusammenführen, Ausgeblendetes weglassen
    const outRecs = [];
    for (const r of recs.sort((a, b) => a.prio - b.prio || (b.gain || 0) - (a.gain || 0))) {
      const types = r.allTypes || [r.type];
      const twin = r.group === 'kombi' ? null : outRecs.find(x => x.group !== 'kombi' && (types.includes(x.type) || (x.allTypes || []).includes(r.type)));
      if (twin) {
        twin.ids.push(r.id);
        if (r.group === 'stil') { if (!/Stil/.test(twin.why)) twin.why += ' Außerdem typisch für den Stil ' + r.style + '.'; if (twin.group === 'anlass') twin.colors = r.colors; }
        continue;
      }
      r.ids = [r.id]; outRecs.push(r);
    }
    const visible = outRecs.filter(r => !r.ids.some(id => hidden.has(id)));
    let combos = all.filter(i => slotOf(i) === 'onepiece').length;
    for (const t of tops) for (const b of bottoms) if (pairOk(t, b)) combos++;
    return { recs: visible, stats: { items: all.length, combos, tops: tops.length, bottoms: bottoms.length }, hiddenCount: hidden.size };
  }

  const api = { COLORS, COLOR, FARBTYP, TYPES, CATEGORIES, MATERIALS, PATTERNS, FITS, WARMTH, FORMALITY, STATUS, OCCASIONS, DRESSCODES, STYLES, ORDER,
    detectColors, nearestColor, parseLabel, review, gaps, partnerInfo, CONDITION, ESSENTIALS, styleRules, colorRel, TIGHTS, buildContext, generate, alternatives, summarizeWeather, WEATHER_TEXT, WEATHER_ICON, learnFrom, coreKey, seasonOf };
  root.Engine = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof self !== 'undefined' ? self : this);
