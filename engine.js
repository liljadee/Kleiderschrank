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
    { id: 'oberteile', name: 'Oberteile', slots: ['top', 'insert'] },
    { id: 'lagen', name: 'Strickjacken, Blazer & Westen', slots: ['mid'] },
    { id: 'unterteile', name: 'Hosen & Röcke', slots: ['bottom'] },
    { id: 'einteiler', name: 'Kleider & Einteiler', slots: ['onepiece'] },
    { id: 'jacken', name: 'Jacken & Mäntel', slots: ['outer'] },
    { id: 'schuhe', name: 'Schuhe', slots: ['shoes'] },
    { id: 'beine', name: 'Strumpfhosen', slots: ['legs'] },
    { id: 'accessoires', name: 'Accessoires', slots: ['acc', 'other'] }
  ];
  const T = (name, slot, f, w, icon, extra) => Object.assign({ name, slot, f, w, icon }, extra || {});
  const TYPES = {
    tshirt: T('T-Shirt', 'top', 2, 1, '👕', { base: 1, underOk: 1, sleeves: 'kurz' }),
    top: T('Top / Trägertop', 'top', 2, 1, '👚', { base: 1, traeger: 1, sleeves: 'ohne' }),
    langarm: T('Langarmshirt', 'top', 2, 2, '👕', { base: 1, underOk: 1, sleeves: 'lang' }),
    bluse: T('Bluse', 'top', 4, 1, '👚', { base: 1, collar: 1, underOk: 1, sleeves: 'lang', sleevesEdit: 1, collarEdit: 1 }),
    hemd: T('Hemd', 'top', 4, 2, '👔', { base: 1, collar: 1, underOk: 1, layerOk: 1, sleeves: 'lang', sleevesEdit: 1, collarEdit: 1 }),
    polo: T('Poloshirt', 'top', 3, 1, '👕', { base: 1, collar: 1, sleeves: 'kurz' }),
    body: T('Body', 'top', 3, 1, '🩱', { base: 1, underOk: 1, sleeves: 'lang', sleevesEdit: 1 }),
    pullover: T('Pullover', 'top', 3, 3, '🧶', { knit: 1, overBase: 1, sleeves: 'lang', neckEdit: ['rund', 'v'], neck: 'rund' }),
    rollkragen: T('Rollkragenpullover', 'top', 3, 3, '🧶', { knit: 1, underOk: 1, sleeves: 'lang' }),
    sweatshirt: T('Sweatshirt', 'top', 2, 3, '👕', { knit: 1, overBase: 1, sporty: 1, sleeves: 'lang' }),
    hoodie: T('Hoodie', 'top', 1, 3, '👕', { knit: 1, sporty: 1, hood: 1, sleeves: 'lang' }),
    kragen: T('Blusenkragen / Kragen-Einsatz', 'insert', 4, 1, '👔', { collar: 1, insert: 1 }),
    cardigan_top: T('Cardigan zugeknöpft (als Oberteil)', 'top', 3, 2, '🧶', { knit: 1, base: 1, sleeves: 'lang', sleevesEdit: 1, neckEdit: ['rund', 'v'], neck: 'rund' }),
    strickshirt: T('Feinstrick-Shirt / Kurzarmpullover', 'top', 3, 2, '🧶', { knit: 1, sleeves: 'kurz', sleevesEdit: 1 }),
    tunika: T('Tunika / Longbluse', 'top', 2, 1, '👚', { base: 1, long: 1, sleeves: 'lang', sleevesEdit: 1 }),
    crop: T('Crop-Top / kurzes Oberteil', 'top', 2, 1, '👚', { base: 1, crop: 1, sleeves: 'kurz', sleevesEdit: 1 }),
    corsage: T('Corsage / Bustier', 'top', 4, 1, '👙', { base: 1, traeger: 1, sleeves: 'ohne' }),

    cardigan: T('Strickjacke / Cardigan', 'mid', 3, 2, '🧶', { open: 1 }),
    longcardigan: T('Lange Strickjacke / Long-Cardigan', 'mid', 2, 3, '🧶', { open: 1, long: 1 }),
    kimono: T('Kimono / leichte Überjacke', 'mid', 2, 1, '🥻', { open: 1, long: 1 }),
    blazer: T('Blazer / Sakko', 'mid', 4, 2, '🧥', { open: 1 }),
    sweatjacke: T('Sweatjacke', 'mid', 1, 2, '🧥', { open: 1, sporty: 1 }),
    weste: T('Weste / Pullunder', 'mid', 3, 1, '🦺', { open: 1, vest: 1 }),
    overshirt: T('Overshirt / Hemdjacke', 'mid', 2, 3, '🧥', { open: 1, shirtjacket: 1 }),

    jeans: T('Jeans', 'bottom', 2, 3, '👖', { denim: 1, legCut: 'gerade' }),
    stoffhose: T('Stoffhose', 'bottom', 4, 2, '👖', { legCut: 'gerade' }),
    chino: T('Chino', 'bottom', 3, 2, '👖', { legCut: 'gerade' }),
    weitehose: T('Weite Hose / Culotte', 'bottom', 3, 2, '👖', { legCut: 'weit' }),
    leggings: T('Leggings', 'bottom', 1, 2, '👖', { sporty: 1, legLayer: 1, legCut: 'roehre', legCutFixed: 1 }),
    jogginghose: T('Jogginghose', 'bottom', 1, 3, '👖', { sporty: 1, lounge: 1, legCut: 'zulaufend' }),
    cargohose: T('Cargohose', 'bottom', 1, 3, '👖', { legCut: 'gerade' }),
    shorts: T('Shorts', 'bottom', 1, 1, '🩳', { short: 1 }),
    rock_kurz: T('Rock (kurz)', 'bottom', 2, 1, '👗', { short: 1, skirt: 1, lens: ['mini', 'knie'], len: 'mini', shape: 'gerade' }),
    rock_lang: T('Rock (midi / lang)', 'bottom', 3, 2, '👗', { skirt: 1, lens: ['midi', 'maxi'], len: 'midi', shape: 'gerade' }),

    kleid_kurz: T('Kleid (kurz)', 'onepiece', 3, 1, '👗', { short: 1, dress: 1, lens: ['mini', 'knie'], len: 'knie', shape: 'gerade', sleeves: 'kurz', sleevesEdit: 1 }),
    kleid_lang: T('Kleid (midi / lang)', 'onepiece', 3, 2, '👗', { dress: 1, lens: ['midi', 'maxi'], len: 'midi', shape: 'gerade', sleeves: 'kurz', sleevesEdit: 1 }),
    traegerkleid: T('Trägerkleid / Slipkleid', 'onepiece', 3, 1, '👗', { dress: 1, traeger: 1, lens: ['mini', 'knie', 'midi', 'maxi'], len: 'midi', shape: 'gerade', sleeves: 'ohne' }),
    strickkleid: T('Strickkleid', 'onepiece', 3, 4, '🧶', { dress: 1, knit: 1, knitDress: 1, needLegs: 1, lens: ['mini', 'knie', 'midi', 'maxi'], len: 'knie', shape: 'gerade', sleeves: 'lang', sleevesEdit: 1, neckEdit: ['rund', 'v', 'rollkragen'], neck: 'rund' }),
    blusenkleid: T('Hemdblusenkleid', 'onepiece', 3, 2, '👗', { dress: 1, collar: 1, lens: ['knie', 'midi', 'maxi'], len: 'midi', shape: 'gerade', sleeves: 'lang', sleevesEdit: 1 }),
    abendkleid: T('Abend- / Cocktailkleid', 'onepiece', 5, 1, '👗', { dress: 1, evening: 1, lens: ['mini', 'knie', 'midi', 'maxi'], len: 'midi', shape: 'eng', sleeves: 'ohne', sleevesEdit: 1 }),
    jumpsuit: T('Jumpsuit', 'onepiece', 3, 2, '👗', { legCut: 'gerade', sleeves: 'kurz', sleevesEdit: 1 }),
    latzhose: T('Latzhose / Overall', 'onepiece', 1, 3, '👖', { legCut: 'gerade', overall: 1 }),

    jeansjacke: T('Jeansjacke', 'outer', 1, 2, '🧥', { rain: 0, denim: 1 }),
    lederjacke: T('Lederjacke', 'outer', 2, 2, '🧥', { rain: 1 }),
    blouson: T('Blouson / Bomberjacke', 'outer', 3, 2, '🧥', { rain: 1 }),
    uebergang: T('Übergangsjacke / Steppjacke', 'outer', 2, 2, '🧥', { rain: 1 }),
    steppweste: T('Steppweste', 'outer', 2, 2, '🦺', { rain: 1, vestOuter: 1 }),
    cape: T('Poncho / Cape', 'outer', 3, 3, '🧥', { rain: 0 }),
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
    slingbacks: T('Slingbacks', 'shoes', 4, 1, '👠', { minT: 14, maxT: 34, rain: 0, heel: 'mittel', heelEdit: 1 }),
    pumps: T('Pumps', 'shoes', 5, 1, '👠', { minT: 10, maxT: 32, rain: 0, heel: 'hoch', heelEdit: 1 }),
    sandalen: T('Sandalen', 'shoes', 2, 1, '👡', { minT: 16, maxT: 45, rain: 0, open: 1 }),
    sandaletten: T('Sandaletten (Absatz)', 'shoes', 4, 1, '👡', { minT: 17, maxT: 45, rain: 0, open: 1, heel: 'hoch', heelEdit: 1 }),
    stiefeletten: T('Stiefeletten', 'shoes', 3, 3, '👢', { minT: -10, maxT: 20, rain: 1, boot: 1, heel: 'flach', heelEdit: 1 }),
    stiefel: T('Stiefel mit Schaft', 'shoes', 3, 4, '👢', { minT: -15, maxT: 16, rain: 1, boot: 1, tall: 1, heel: 'flach', heelEdit: 1 }),
    overknees: T('Overknee-Stiefel', 'shoes', 3, 4, '👢', { minT: -10, maxT: 16, rain: 1, boot: 1, tall: 1, heel: 'flach', heelEdit: 1 }),
    boots: T('Schnür- / Bikerboots', 'shoes', 2, 3, '🥾', { minT: -12, maxT: 20, rain: 1, boot: 1, chunky: 1 }),
    mules: T('Mules / Pantoletten', 'shoes', 3, 1, '👡', { minT: 15, maxT: 34, rain: 0, heel: 'flach', heelEdit: 1 }),
    espadrilles: T('Espadrilles', 'shoes', 2, 1, '👡', { minT: 18, maxT: 34, rain: 0 }),
    bootsschuhe: T('Bootsschuhe / Mokassins', 'shoes', 2, 1, '👞', { minT: 12, maxT: 32, rain: 1 }),
    winterstiefel: T('Winterstiefel', 'shoes', 1, 5, '🥾', { minT: -30, maxT: 9, rain: 2, boot: 1, tall: 1 }),

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
    krawatte: T('Krawatte / Fliege', 'acc', 5, 0, '👔', { sub: 'krawatte' }),
    haarschmuck: T('Haarschmuck / Haarreif', 'acc', 3, 0, '🎀', { sub: 'haarschmuck' }),
    uhr: T('Uhr', 'other', 3, 0, '⌚'),
    sonstiges: T('Sonstiges', 'other', 3, 0, '✨')
  };

  // ---------------------------------------------------------------- „Was ist was?“: kurze Erklärung und Suchbegriff für Beispielbilder
  const INFO = {
    tshirt: ['Kurzärmliges Shirt aus Baumwoll-Jersey, rund oder mit V-Ausschnitt.', 'T-Shirt Damen Outfit'],
    top: ['Ärmelloses Oberteil mit dünnen oder breiten Trägern, auch Tanktop genannt.', 'Trägertop Outfit'],
    langarm: ['Shirt aus weichem Jersey mit langen Ärmeln – Basis und gute Lage unter Pullovern.', 'Longsleeve Shirt Outfit'],
    bluse: ['Oberteil aus Webstoff, meist mit Knopfleiste. Mit oder ohne Kragen, mit langen, kurzen oder ohne Ärmel.', 'Bluse Damen Outfit'],
    hemd: ['Durchgeknöpftes Oberteil mit Kragen, für Damen und Herren.', 'Hemd Outfit'],
    polo: ['Shirt mit kurzem Kragen und kurzer Knopfleiste, sportlich-gepflegt.', 'Poloshirt Outfit'],
    body: ['Oberteil, das wie ein Badeanzug im Schritt geschlossen wird – rutscht nicht aus der Hose.', 'Body Oberteil Outfit'],
    pullover: ['Gestrickter Pulli ohne Knöpfe, mit Rundhals oder V-Ausschnitt.', 'Strickpullover Outfit'],
    rollkragen: ['Pullover mit hohem, umgeschlagenem Kragen am Hals.', 'Rollkragenpullover Outfit'],
    sweatshirt: ['Pulli aus weichem, innen angerautem Baumwollstoff, ohne Kapuze.', 'Sweatshirt Outfit'],
    hoodie: ['Sweatshirt mit Kapuze, oft mit Kängurutasche.', 'Hoodie Outfit'],
    kragen: ['Nur ein Blusenkragen ohne Bluse – wird unter Pullover oder Strickkleid gezogen, damit der Kragen herausschaut.', 'Blusenkragen Einsatz unter Pullover'],
    cardigan_top: ['Feiner Cardigan, der zugeknöpft als Oberteil getragen wird – ohne etwas darunter.', 'zugeknöpfter Cardigan als Oberteil'],
    strickshirt: ['Gestricktes Oberteil mit kurzen Ärmeln, feiner als ein Pullover – auch unter dem Blazer schön.', 'Strickshirt Kurzarm Outfit'],
    tunika: ['Langes, lockeres Oberteil, das über die Hüfte reicht – am besten zu schmalen Hosen oder Leggings.', 'Tunika Outfit'],
    crop: ['Kurzes Oberteil, das oberhalb der Taille endet – zu Hosen und Röcken mit hohem Bund.', 'Crop Top Outfit High Waist'],
    corsage: ['Eng anliegendes, oft verstärktes Oberteil ohne Ärmel – eher für Party und Abend.', 'Corsage Top Outfit'],
    cardigan: ['Strickjacke mit durchgehender Knopfleiste oder offen, wird über anderen Oberteilen getragen.', 'Cardigan Strickjacke Outfit'],
    longcardigan: ['Strickjacke, die bis über den Po oder bis zum Knie reicht.', 'Long Cardigan Outfit'],
    kimono: ['Leichte, offene Überjacke mit weiten Ärmeln, oft gemustert – typisch Boho.', 'Kimono Jacke Outfit'],
    blazer: ['Taillierte Stoffjacke mit Reverskragen, beim Mann Sakko genannt.', 'Blazer Outfit'],
    sweatjacke: ['Jacke aus Sweatstoff mit Reißverschluss, oft mit Kapuze.', 'Sweatjacke Outfit'],
    weste: ['Ärmellose Lage über Hemd oder Bluse: als Strick-Pullunder oder als Anzugweste.', 'Pullunder Outfit'],
    overshirt: ['Robustes Hemd aus dickerem Stoff, das wie eine leichte Jacke offen getragen wird.', 'Overshirt Shacket Outfit'],
    jeans: ['Hose aus Denim. Bein: Bootcut, gerade oder eng.', 'Jeans Outfit'],
    stoffhose: ['Hose aus Web- oder Anzugstoff, oft mit Bügelfalte.', 'Stoffhose Damen Outfit'],
    chino: ['Hose aus festem Baumwollstoff, zwischen Jeans und Anzughose.', 'Chino Outfit'],
    weitehose: ['Hose mit weitem Bein; die Culotte ist eine weite, wadenlange Variante.', 'Weite Hose Culotte Outfit'],
    leggings: ['Eng anliegende, dehnbare Hose – als Hose oder unter Röcken, Kleidern und Tuniken.', 'Leggings Outfit'],
    jogginghose: ['Bequeme Hose aus Sweatstoff mit Gummibund.', 'Jogginghose Outfit'],
    cargohose: ['Lockere Hose mit aufgesetzten Seitentaschen.', 'Cargohose Outfit'],
    shorts: ['Kurze Hose, auch Bermudas.', 'Shorts Outfit'],
    rock_kurz: ['Rock, der über dem Knie endet: Mini- oder knielanger Rock.', 'Minirock Outfit'],
    rock_lang: ['Rock bis zur Wade (Midi) oder zum Knöchel (Maxi).', 'Midirock Outfit'],
    kleid_kurz: ['Kleid, das über oder am Knie endet.', 'Kleid knielang Outfit'],
    kleid_lang: ['Kleid bis zur Wade (Midi) oder zum Knöchel (Maxi).', 'Midikleid Outfit'],
    traegerkleid: ['Kleid mit dünnen Trägern, oft aus fließendem Satin (Slipdress). Im Winter mit Shirt darunter.', 'Slipdress Outfit'],
    strickkleid: ['Gestricktes Kleid – im Prinzip ein überlanger Pullover. Mit Rundhals, V-Ausschnitt oder Rollkragen; immer mit Strumpfhose oder Leggings.', 'Strickkleid Outfit'],
    blusenkleid: ['Kleid wie eine verlängerte Bluse, mit Kragen und Knopfleiste, oft mit Gürtel.', 'Hemdblusenkleid Outfit'],
    abendkleid: ['Festliches Kleid für Party, Hochzeit oder Gala – kurz als Cocktailkleid, lang als Abendkleid.', 'Cocktailkleid Abendkleid'],
    jumpsuit: ['Einteiler aus Oberteil und langer Hose.', 'Jumpsuit Outfit'],
    latzhose: ['Hose mit Latz und Trägern, darunter ein Shirt oder Pullover.', 'Latzhose Outfit'],
    jeansjacke: ['Kurze Jacke aus Denim.', 'Jeansjacke Outfit'],
    lederjacke: ['Jacke aus Leder oder Kunstleder, oft im Biker-Schnitt.', 'Lederjacke Outfit'],
    blouson: ['Kurze, leichte Jacke mit Bündchen an Saum und Ärmeln, auch Bomberjacke.', 'Bomberjacke Outfit'],
    uebergang: ['Leichte Jacke für Frühling und Herbst, oft gesteppt.', 'Steppjacke Outfit'],
    steppweste: ['Gesteppte, ärmellose Jacke – über Pullover oder Hemd.', 'Steppweste Outfit'],
    cape: ['Ärmelloser Umhang, der über den Schultern liegt. Ein Statement-Teil.', 'Poncho Cape Outfit'],
    regenjacke: ['Wasserdichte Jacke, oft mit Kapuze.', 'Regenjacke Outfit'],
    trench: ['Leichter Mantel mit Gürtel, oft zweireihig und in Beige.', 'Trenchcoat Outfit'],
    mantel: ['Langer Mantel aus Wolle oder Wollmischung.', 'Wollmantel Outfit'],
    parka: ['Lange, sportliche Jacke mit Kapuze, oft gefüttert.', 'Parka Outfit'],
    winterjacke: ['Dick gefütterte Jacke für Frost, zum Beispiel mit Daunen.', 'Daunenjacke Outfit'],
    strumpfhose: ['Unter Rock, Kleid oder Hose. Dicke in den (Denier): bis 20 hauchdünn, 60–80 blickdicht, ab 100 sehr warm.', 'Strumpfhose blickdicht Outfit'],
    sneaker: ['Schlichter Turnschuh für den Alltag, nicht zum Sport.', 'weiße Sneaker Outfit'],
    laufschuhe: ['Sportschuh zum Laufen oder Trainieren.', 'Laufschuhe'],
    ballerinas: ['Flacher, offener Schuh ohne Absatz.', 'Ballerinas Outfit'],
    loafer: ['Flacher Slipper aus Leder ohne Schnürung.', 'Loafer Damen Outfit'],
    derby: ['Schnürschuh aus Leder, zum Beispiel Oxford oder Brogue.', 'Schnürschuhe Outfit'],
    slingbacks: ['Schuh mit Riemchen um die Ferse statt geschlossener Hinterkappe.', 'Slingbacks Outfit'],
    pumps: ['Geschlossener Schuh mit Absatz. Kleiner Absatz heißt Kitten Heel.', 'Pumps Outfit'],
    sandalen: ['Flacher, offener Sommerschuh mit Riemen.', 'Sandalen Outfit'],
    sandaletten: ['Offener Schuh mit Riemchen und Absatz.', 'Sandaletten Absatz Outfit'],
    stiefeletten: ['Stiefel, der am Knöchel endet – flach oder mit Absatz, zum Beispiel Chelsea Boots.', 'Stiefeletten Outfit'],
    stiefel: ['Stiefel mit hohem Schaft bis zur Wade oder zum Knie.', 'Stiefel hoher Schaft Outfit'],
    overknees: ['Stiefel, deren Schaft über das Knie reicht.', 'Overknee Stiefel Outfit'],
    boots: ['Robuste, knöchelhohe Schnürboots oder Bikerboots mit dicker Sohle.', 'Schnürboots Outfit'],
    mules: ['Schuh ohne Fersenteil zum Hineinschlüpfen, flach oder mit Absatz.', 'Mules Schuhe Outfit'],
    espadrilles: ['Sommerschuh aus Stoff mit Sohle aus geflochtenem Jute.', 'Espadrilles Outfit'],
    bootsschuhe: ['Lederschuh mit Schnürung rundum und rutschfester Sohle, auch Mokassin.', 'Bootsschuhe Outfit'],
    winterstiefel: ['Warm gefütterter, rutschfester Stiefel für Schnee.', 'Winterstiefel'],
    schal: ['Langes Tuch aus Wolle oder Strick gegen Kälte.', 'Schal Outfit'],
    tuch: ['Kleines Tuch, oft aus Seide, um Hals, Haare oder Tasche gebunden.', 'Seidentuch binden Outfit'],
    muetze: ['Strickmütze gegen Kälte.', 'Strickmütze Outfit'],
    hut: ['Hut als Sonnenschutz oder Stilmittel, zum Beispiel Stroh- oder Filzhut.', 'Hut Outfit'],
    cap: ['Baseballkappe mit Schirm.', 'Cap Outfit'],
    handschuhe: ['Gegen Kälte, aus Strick oder Leder.', 'Lederhandschuhe'],
    sonnenbrille: ['Schützt die Augen und rundet den Look ab.', 'Sonnenbrille Outfit'],
    tasche: ['Handtasche, Shopper, Umhängetasche oder Clutch.', 'Handtasche Outfit'],
    guertel: ['Gürtel für die Hose oder zum Betonen der Taille über Kleid und Strick.', 'Gürtel Taille Outfit'],
    schmuck: ['Ketten, Ohrringe, Armbänder und Ringe.', 'Schmuck Outfit'],
    einstecktuch: ['Kleines Tuch für die Brusttasche des Sakkos.', 'Einstecktuch Sakko'],
    krawatte: ['Krawatte oder Fliege zum Hemd mit Kragen.', 'Krawatte Outfit'],
    haarschmuck: ['Haarreif, Spange oder Schleife – ein verspieltes Detail.', 'Haarreif Outfit'],
    uhr: ['Armbanduhr.', 'Armbanduhr Outfit'],
    sonstiges: ['Alles, was in keine andere Kategorie passt.', 'Outfit']
  };
  const STYLE_IMG = { italienisch: 'Italian style Outfit', klassisch: 'klassischer Stil Outfit', casual: 'casual Outfit', minimalistisch: 'minimalistisch Outfit', sportlich: 'Athleisure Outfit', streetwear: 'Streetwear Outfit', romantisch: 'romantischer Stil Outfit', boho: 'Boho Outfit', edgy: 'Rock Chic Outfit', preppy: 'Preppy Outfit', chic: 'elegant chic Outfit', skandinavisch: 'Scandi Style Outfit', franzoesisch: 'Parisian Chic Outfit', quietluxury: 'Quiet Luxury Outfit', vintage: 'Vintage Retro Outfit', glamour: 'Glamour Outfit', kreativ: 'eklektisch Outfit Mustermix', grunge: 'Grunge Outfit', darkacademia: 'Dark Academia Outfit', maritim: 'maritimer Look Outfit' };
  // ---------------------------------------------------------------- Wirkung: Spielraum von lässig (1) bis festlich (5)
  // Viele Teile sind für sich neutral und passen sich an – erst die Kombination macht sie lässig oder schick.
  const FR = {
    tshirt: [1, 3], top: [1.5, 3.5], langarm: [1, 2.8], bluse: [2.5, 5], hemd: [2, 5], polo: [2, 3.5], body: [2, 4.5], pullover: [1.5, 4], rollkragen: [2, 4.8],
    sweatshirt: [1, 2.5], hoodie: [1, 2], kragen: [3, 4.5], cardigan_top: [2, 4], strickshirt: [2, 4], tunika: [1.5, 3.5], crop: [1, 3], corsage: [3.5, 5],
    cardigan: [2, 4], longcardigan: [1.5, 3.5], kimono: [1.5, 3.5], blazer: [2.5, 5], sweatjacke: [1, 2], weste: [2.5, 4.5], overshirt: [1.5, 3],
    jeans: [1, 3.3], stoffhose: [2.5, 5], chino: [2, 4], weitehose: [2, 4.5], leggings: [1, 2], jogginghose: [1, 1.5], cargohose: [1, 2.5], shorts: [1, 2.5], rock_kurz: [1.5, 4], rock_lang: [2, 4.5],
    kleid_kurz: [2, 4.5], kleid_lang: [2, 5], traegerkleid: [2, 5], strickkleid: [2, 4], blusenkleid: [2, 4], abendkleid: [4.5, 5], jumpsuit: [2, 4.5], latzhose: [1, 2],
    jeansjacke: [1, 2.5], lederjacke: [1.5, 4], blouson: [2, 3.5], uebergang: [1.5, 3], regenjacke: [1, 2], trench: [2.5, 5], mantel: [3, 5], parka: [1, 2.5], winterjacke: [1, 2.5], steppweste: [1.5, 3], cape: [2.5, 4.5],
    strumpfhose: [1, 5], sneaker: [1, 3], laufschuhe: [1, 1.5], ballerinas: [2, 4], loafer: [2.5, 4.5], derby: [3, 5], slingbacks: [3, 5], pumps: [3.5, 5], sandalen: [1, 3], sandaletten: [3, 5],
    stiefeletten: [2, 4.5], stiefel: [2, 4], overknees: [2.5, 4.5], boots: [1, 3], mules: [2.5, 4.5], espadrilles: [1, 2.5], bootsschuhe: [1.5, 3], winterstiefel: [1, 2.5],
    schal: [1, 4], tuch: [2, 5], muetze: [1, 2.5], hut: [2, 4], cap: [1, 2], handschuhe: [1, 4], sonnenbrille: [1, 4], tasche: [1, 5], guertel: [1, 5], schmuck: [2, 5], einstecktuch: [3.5, 5], krawatte: [4, 5], haarschmuck: [1.5, 4]
  };
  const VIBES = { laessig: 'Macht lässig', neutral: 'Neutral – passt sich an', schick: 'Macht schick' };
  // Ältere Angabe „Wirkung 1–5“ übernehmen: deutlich unter dem Typ = lässig, deutlich darüber = schick
  const vibeOf = it => VIBES[it.vibe] ? it.vibe : (typeof it.formality === 'number' ? (it.formality - (TYPES[it.type] || TYPES.sonstiges).f <= -1 ? 'laessig' : it.formality - (TYPES[it.type] || TYPES.sonstiges).f >= 1 ? 'schick' : 'neutral') : 'neutral');
  function fRange(it) {
    const d = TYPES[it.type] || TYPES.sonstiges;
    let [lo, hi] = FR[it.type] || [Math.max(1, d.f - 1), Math.min(5, d.f + 1)];
    const m = it.materials || [], pat = it.pattern || 'uni';
    if (m.includes('pailletten')) { lo += 1.2; hi += 0.4; }
    else if (m.some(x => ['seide', 'satin', 'samt', 'spitze', 'kaschmir'].includes(x))) { lo += 0.4; hi += 0.3; }
    if (m.some(x => ['fleece', 'funktion'].includes(x))) hi -= 0.8;
    else if (m.some(x => ['jersey', 'denim'].includes(x)) && !d.denim && d.slot !== 'legs') hi -= 0.4;
    if (pat === 'print') hi -= 1;
    if (it.condition === 'getragen') hi -= 0.4; else if (it.condition === 'abgetragen') hi -= 1.2;
    const v = vibeOf(it);
    if (v === 'laessig') { hi = Math.max(lo + 0.5, hi - 1); lo -= 0.3; }
    else if (v === 'schick') { lo = Math.min(hi - 0.5, lo + 1); hi += 0.3; }
    lo = clamp(lo, 1, 5); hi = clamp(hi, lo + 0.3, 5.3);
    return [lo, hi];
  }
  // Wirkung eines Outfits: Teile mit engem Spielraum prägen den Look, wandelbare passen sich an
  function lookLevel(items, outer) {
    let sw = 0, sv = 0;
    for (const it of items) { const w = (it === outer ? 0.5 : 1) / (it.fHi - it.fLo + 0.6); sw += w; sv += w * (it.fLo + it.fHi) / 2; }
    return sw ? sv / sw : 3;
  }
  const rangeDist = (it, t) => t < it.fLo ? it.fLo - t : t > it.fHi ? t - it.fHi : 0;
  const LOOK_NAMES = [[1.7, 'sportlich-lässig'], [2.4, 'lässig'], [3.1, 'lässig-schick'], [3.8, 'schick'], [9, 'festlich']];
  const lookName = L => LOOK_NAMES.find(x => L < x[0])[1];

  // ---------------------------------------------------------------- Material, Muster, Passform
  const MATERIALS = {
    baumwolle: { name: 'Baumwolle' }, leinen: { name: 'Leinen', tags: ['summer', 'boho'] },
    viskose: { name: 'Viskose' }, polyester: { name: 'Polyester' }, elasthan: { name: 'Elasthan' },
    polyamid: { name: 'Polyamid / Nylon' }, acryl: { name: 'Acryl' }, modal: { name: 'Modal' }, lyocell: { name: 'Lyocell / Tencel' },
    wolle: { name: 'Wolle', tags: ['winter', 'classic'] }, merino: { name: 'Merino', tags: ['winter'] },
    mohair: { name: 'Mohair', tags: ['winter'] }, alpaka: { name: 'Alpaka', tags: ['winter', 'fine'] },
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
  // Schnitt: Bein bei Hosen, Länge und Form bei Röcken und Kleidern, Ärmel und Kragen bei Oberteilen
  const LEG_CUTS = { schlag: 'Bootcut / Schlag', gerade: 'Gerade', roehre: 'Eng / Röhre' };
  const LEG_OLD = { zulaufend: 'roehre', weit: 'gerade' };                       // ältere Angaben aus Version 1.4
  const NECKS = { rund: 'Rundhals', v: 'V-Ausschnitt', rollkragen: 'Rollkragen' };
  const HEELS = { flach: 'Flach', mittel: 'Kleiner Absatz', hoch: 'Hoher Absatz' };
  const LENGTHS = { mini: 'Mini', knie: 'Knielang', midi: 'Midi', maxi: 'Maxi' };
  const SKIRT_SHAPES = { eng: 'Eng / Bleistift', gerade: 'Gerade / A-Linie', weit: 'Weit schwingend', wickel: 'Wickel / tailliert' };
  const SLEEVES = { ohne: 'Ärmellos', kurz: 'Kurze Ärmel', lang: 'Lange Ärmel' };
  const tdOf = it => it.typeDef || TYPES[it.type] || TYPES.sonstiges;
  const legCutOf = it => { const d = tdOf(it); if (!d.legCut) return null; if (d.legCutFixed) return d.legCut; const v = LEG_OLD[it.legCut] || it.legCut; return LEG_CUTS[v] ? v : d.legCut; };
  // Weit geschnitten? Bootcut immer, gerade Hosen je nach Passform oder Typ
  const wideLeg = it => { const c = legCutOf(it); return c === 'schlag' || it.legCut === 'weit' || (c === 'gerade' && (it.fit === 'weit' || it.type === 'weitehose')); };
  const neckOf = it => { const d = tdOf(it); if (it.type === 'rollkragen') return 'rollkragen'; return d.neckEdit ? (d.neckEdit.includes(it.neck) ? it.neck : d.neck) : null; };
  const heelOf = it => { const d = tdOf(it); return d.heelEdit && HEELS[it.heel] ? it.heel : (d.heel || 'flach'); };
  const lengthOf = it => { const d = tdOf(it); return d.lens ? (d.lens.includes(it.length) ? it.length : d.len) : null; };
  const shapeOf = it => { const d = tdOf(it); return d.shape ? (SKIRT_SHAPES[it.shape] ? it.shape : d.shape) : null; };
  const sleevesOf = it => { const d = tdOf(it); return d.sleevesEdit && SLEEVES[it.sleeves] ? it.sleeves : (d.sleeves || null); };
  const hasCollar = it => { const d = tdOf(it); return d.collarEdit && typeof it.collar === 'boolean' ? it.collar : !!d.collar; };
  const isShortIt = it => { const L = lengthOf(it); return L ? ['mini', 'knie'].includes(L) : !!tdOf(it).short; };
  // Kratzt auf der Haut? Standard aus dem Material, im Editor änderbar
  const scratchyDefault = it => { const m = it.materials || []; return m.some(x => ['wolle', 'mohair', 'alpaka', 'tweed'].includes(x)) && !m.some(x => ['merino', 'kaschmir', 'seide', 'baumwolle', 'viskose'].includes(x)); };
  const isScratchy = it => typeof it.scratchy === 'boolean' ? it.scratchy : scratchyDefault(it);
  // Dünnes Teil mit langen Ärmeln zum Drunterziehen
  const thinLong = u => tdOf(u).slot === 'top' && sleevesOf(u) === 'lang' && (u.warmth || tdOf(u).w) <= 2 && !isScratchy(u) && ['langarm', 'body', 'rollkragen', 'bluse', 'hemd'].includes(u.type);
  // Farbtupfer: alles außer Schwarz, Weiß, Grau (und Creme als gebrochenes Weiß)
  const UNBUNT = new Set(['schwarz', 'weiss', 'grau', 'hellgrau', 'anthrazit', 'silber', 'creme', 'hautfarben']);
  const colorDot = it => (it.colors || []).slice(0, (it.pattern || 'uni') === 'uni' ? 1 : 2).some(c => c && !UNBUNT.has(c));
  const WARMTH = ['', 'Sehr leicht', 'Leicht', 'Mittel', 'Warm', 'Sehr warm'];
  const FORMALITY = ['', 'Sehr lässig', 'Lässig', 'Gepflegt', 'Schick', 'Sehr schick'];
  const TIGHTS = ['', 'hauchdünn', 'fein', 'blickdicht', 'dick', 'Thermo'];
  const STATUS = { verfuegbar: 'Im Schrank', waesche: 'In der Wäsche', weggeraeumt: 'Weggeräumt', verliehen: 'Verliehen / Reparatur' };
  const CONDITION = { neu: 'Wie neu', gut: 'Gut', getragen: 'Sichtbar getragen', abgetragen: 'Abgetragen' };

  // ---------------------------------------------------------------- Anlässe
  const OCCASIONS = {
    alltag: { name: 'Alltag', lo: 1, hi: 3, target: 2, hint: 'Tagsüber: bequem und praktisch, flache Schuhe, kein Glitzer.' },
    arbeit: { name: 'Arbeit', hint: 'Gepflegt nach deinem Dresscode, ruhige Muster, nichts Bauchfreies oder Glänzendes.' },
    party: { name: 'Party', lo: 2, hi: 5, target: 3.6, hint: 'Abends ausgehen: mindestens ein Hingucker – Glanz, Farbe, Muster, Schnitt oder Absatz.' },
    elegant: { name: 'Elegant', lo: 3, hi: 5, target: 4.3, shoeStrict: 1, hint: 'Festlich und edel: Kleid, Anzug oder Kostüm, feine Stoffe, ruhige Muster.' }
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
      like: { types: ['strickshirt', 'mules', 'espadrilles', 'blusenkleid', 'strickkleid', 'stoffhose', 'chino', 'weitehose', 'hemd', 'bluse', 'polo', 'pullover', 'rollkragen', 'cardigan', 'blazer', 'loafer', 'derby', 'slingbacks', 'ballerinas', 'pumps', 'sandaletten', 'stiefeletten', 'mantel', 'trench', 'blouson', 'lederjacke', 'kleid_lang', 'rock_lang', 'tshirt'], colors: ['navy', 'creme', 'beige', 'camel', 'braun', 'oliv', 'grau', 'weiss', 'schwarz', 'bordeaux'], patterns: ['uni', 'gestreift'], materials: ['leinen', 'baumwolle', 'wolle', 'merino', 'kaschmir', 'flanell', 'seide', 'viskose', 'leder', 'wildleder', 'strick'], fits: ['normal'] },
      avoid: { types: ['hoodie', 'sweatshirt', 'sweatjacke', 'jogginghose', 'cargohose', 'leggings', 'laufschuhe', 'regenjacke', 'parka', 'winterstiefel'], patterns: ['print', 'animal'], materials: ['funktion', 'fleece', 'pailletten'] },
      maxAccents: 1, maxBold: 1, extraNeutrals: ['oliv', 'hellblau'], highLow: 1,
      rules: [
        o => pieces(o, true).some(i => i.fHi >= 4.5 || (i.materials || []).some(m => ['seide', 'kaschmir'].includes(m))) ? [1.5, 'Mindestens ein elegantes Element'] : [-1.5, 'Es fehlt ein elegantes Element'],
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
          if (o.layer && o.top && hasCollar(o.top)) return [2, shortType(o.top) + ', Feinstrick und Sakko – italienisches Layering'];
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
      like: { types: ['blusenkleid', 'cardigan_top', 'kragen', 'bluse', 'hemd', 'blazer', 'stoffhose', 'chino', 'trench', 'mantel', 'loafer', 'pumps', 'rollkragen', 'pullover', 'cardigan', 'rock_lang', 'kleid_lang', 'ballerinas', 'stiefeletten'], colors: ['navy', 'weiss', 'beige', 'camel', 'grau', 'schwarz', 'creme', 'bordeaux'], patterns: ['uni', 'gestreift'], materials: ['wolle', 'kaschmir', 'seide', 'tweed', 'baumwolle'], fits: ['normal'] },
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
      like: { types: ['latzhose', 'strickshirt', 'steppweste', 'boots', 'strickkleid', 'jeans', 'tshirt', 'langarm', 'pullover', 'sweatshirt', 'chino', 'sneaker', 'jeansjacke', 'cardigan', 'hemd', 'uebergang', 'stiefeletten'], colors: [], patterns: ['uni', 'gestreift', 'kariert'], materials: ['baumwolle', 'jersey', 'denim', 'strick'], fits: ['normal', 'weit'] },
      avoid: { types: ['pumps'], patterns: [], materials: ['pailletten'] },
      maxAccents: 2, maxBold: 1, denimOk: 1, highLow: 1,
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
      like: { types: ['strickshirt', 'mules', 'strickkleid', 'tshirt', 'rollkragen', 'stoffhose', 'weitehose', 'mantel', 'blazer', 'loafer', 'sneaker', 'kleid_lang', 'hemd'], colors: ['schwarz', 'weiss', 'grau', 'beige', 'creme', 'anthrazit', 'navy', 'camel', 'hellgrau'], patterns: ['uni'], materials: ['wolle', 'kaschmir', 'baumwolle', 'leinen'], fits: ['normal', 'weit'] },
      avoid: { types: ['cape', 'hoodie'], patterns: ['gebluemt', 'animal', 'print', 'gemustert', 'kariert', 'gepunktet'], materials: ['pailletten', 'spitze'] },
      maxAccents: 0, maxBold: 0, highLow: 1, tips: [o => TONAL_TIP(o)],
      rules: [
        o => toneInTone(o) ? [2.5, 'Ton in Ton – minimalistisch auf den Punkt'] : null,
        o => ([o.mid, o.layer, o.outer].some(i => i && ['blazer', 'mantel'].includes(i.type)) && [o.top, o.under].some(i => i && i.type === 'rollkragen')) ? [1, 'Rollkragen unter Blazer oder Mantel – klare Linie'] : null,
        o => null
      ]
    },
    sportlich: {
      name: 'Sportlich', desc: 'Sneaker, bequeme Schnitte, Athleisure',
      like: { types: ['steppweste', 'sneaker', 'hoodie', 'sweatshirt', 'sweatjacke', 'leggings', 'tshirt', 'jogginghose', 'jeans', 'regenjacke', 'parka', 'polo', 'shorts'], colors: [], patterns: ['uni', 'gestreift', 'print'], materials: ['funktion', 'jersey', 'baumwolle', 'fleece'], fits: ['normal', 'weit', 'eng'] },
      avoid: { types: ['cape', 'pumps', 'bluse', 'sandaletten', 'stoffhose', 'mantel'], patterns: ['gebluemt'], materials: ['seide', 'satin', 'spitze', 'pailletten'] },
      maxAccents: 2, maxBold: 1, denimOk: 1,
      rules: [
        o => (o.shoes && o.shoes.type === 'sneaker') ? [2, 'Sneaker – Pflicht beim sportlichen Look'] : (o.shoes ? [-2, 'Sportlicher Look ohne Sneaker'] : null),
        o => (o.mid && o.mid.type === 'sweatjacke') ? [1, 'Sweatjacke als Lage – sportlich'] : null
      ]
    },
    streetwear: {
      name: 'Streetwear', desc: 'Oversized, Sneaker, Hoodies, Statement-Prints',
      like: { types: ['boots', 'crop', 'latzhose', 'hoodie', 'sweatshirt', 'cargohose', 'jeans', 'sneaker', 'tshirt', 'parka', 'jeansjacke', 'weitehose', 'winterjacke'], colors: ['schwarz', 'weiss', 'grau', 'oliv', 'khaki', 'beige'], patterns: ['uni', 'print'], materials: ['baumwolle', 'denim', 'jersey', 'funktion'], fits: ['weit'] },
      avoid: { types: ['pumps', 'bluse', 'ballerinas', 'sandaletten', 'stoffhose'], patterns: ['gebluemt', 'gepunktet'], materials: ['seide', 'spitze', 'chiffon'] },
      maxAccents: 2, maxBold: 1, oversizeOk: 1, denimOk: 1, highLow: 1, manyStatements: 1, tips: [o => TONAL_TIP(o)],
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
      like: { types: ['blusenkleid', 'haarschmuck', 'cardigan_top', 'strickkleid', 'kragen', 'bluse', 'kleid_kurz', 'kleid_lang', 'rock_lang', 'rock_kurz', 'cardigan', 'ballerinas', 'sandaletten', 'stiefeletten', 'trench'], colors: ['rosa', 'flieder', 'creme', 'weiss', 'mint', 'hellblau', 'beige', 'koralle'], patterns: ['uni', 'gebluemt', 'gepunktet'], materials: ['spitze', 'chiffon', 'seide', 'viskose'], fits: ['normal', 'eng'] },
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
      like: { types: ['kimono', 'tunika', 'longcardigan', 'espadrilles', 'cape', 'boots', 'strickkleid', 'kleid_lang', 'rock_lang', 'bluse', 'cardigan', 'weitehose', 'stiefel', 'stiefeletten', 'sandalen', 'weste'], colors: ['creme', 'beige', 'camel', 'braun', 'rost', 'senf', 'oliv', 'khaki', 'bordeaux', 'koralle'], patterns: ['gebluemt', 'gemustert', 'uni'], materials: ['leinen', 'wildleder', 'baumwolle', 'viskose', 'spitze'], fits: ['weit'] },
      avoid: { types: ['blazer', 'pumps', 'sweatjacke', 'jogginghose'], patterns: ['print'], materials: ['funktion', 'pailletten'] },
      maxAccents: 2, maxBold: 2, oversizeOk: 1, manyStatements: 1,
      tips: [o => (o.mid || o.under) ? 'Lagen in verschiedenen Längen und Stoffen kombinieren – das macht den Boho-Look aus.' : null],
      rules: [
        o => earthShare(o) >= 0.5 ? [2, 'Erdtöne – typisch Boho'] : null,
        o => (o.onepiece && o.onepiece.type === 'kleid_lang') || (o.bottom && ['rock_lang', 'weitehose'].includes(o.bottom.type)) ? [1.5, 'Fließende, lange Silhouette'] : null,
        o => (o.mid && ['weste', 'cardigan'].includes(o.mid.type)) ? [1.5, 'Weste oder lange Strickjacke als Boho-Lage'] : null
      ]
    },
    edgy: {
      name: 'Rockig / Edgy', desc: 'Schwarz, Leder, Boots, klare Kanten',
      like: { types: ['boots', 'overknees', 'corsage', 'lederjacke', 'jeans', 'stiefel', 'stiefeletten', 'tshirt', 'hoodie', 'rock_kurz', 'kleid_kurz', 'leggings', 'winterstiefel'], colors: ['schwarz', 'anthrazit', 'grau', 'bordeaux', 'weiss', 'jeansblau'], patterns: ['uni', 'print', 'animal'], materials: ['leder', 'kunstleder', 'denim'], fits: ['eng', 'normal'] },
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
      like: { types: ['bootsschuhe', 'steppweste', 'cardigan_top', 'kragen', 'hemd', 'bluse', 'polo', 'pullover', 'cardigan', 'chino', 'rock_kurz', 'loafer', 'blazer', 'trench', 'ballerinas', 'weste'], colors: ['navy', 'weiss', 'rot', 'gruen', 'camel', 'bordeaux', 'hellblau', 'beige'], patterns: ['uni', 'gestreift', 'kariert'], materials: ['baumwolle', 'wolle', 'cord', 'tweed', 'kaschmir'], fits: ['normal'] },
      avoid: { types: ['hoodie', 'jogginghose', 'cargohose', 'leggings'], patterns: ['animal', 'print'], materials: ['pailletten', 'funktion'] },
      maxAccents: 2, maxBold: 1,
      tips: [o => (o.mid && (o.mid.typeDef.knit || o.mid.typeDef.vest) && o.top && hasCollar(o.top)) ? 'Hemdkragen über den Pullover legen und die Manschetten leicht herausschauen lassen.' : null],
      rules: [
        o => (o.mid && (o.mid.typeDef.knit || o.mid.typeDef.vest) && o.top && hasCollar(o.top)) ? [3, o.mid.typeDef.vest ? 'Kragen schaut aus dem Pullunder – Preppy-Klassiker' : 'Kragen schaut aus dem Pullover – Preppy-Klassiker'] : null,
        (o, C) => (o.layer && o.layer.type === 'blazer' && o.top && hasCollar(o.top) && C.tMax <= 18) ? [2, shortType(o.top) + ', Strick und Blazer – Preppy in Reinform'] : null,
        o => pieces(o, false).some(i => prim(i).id === 'schwarz') ? [-0.5, null] : null,
        o => (o.shoes && o.shoes.type === 'loafer') ? [1, 'Loafer runden den Look ab'] : null
      ]
    },
    chic: {
      name: 'Elegant / Chic', desc: 'Hochwertige Materialien, schmale Linien, wenig Farbe',
      like: { types: ['mules', 'abendkleid', 'strickshirt', 'strickkleid', 'blazer', 'stoffhose', 'kleid_lang', 'kleid_kurz', 'bluse', 'pumps', 'loafer', 'mantel', 'trench', 'rollkragen', 'sandaletten', 'stiefeletten', 'rock_lang'], colors: ['schwarz', 'weiss', 'creme', 'camel', 'navy', 'grau', 'bordeaux', 'beige'], patterns: ['uni'], materials: ['seide', 'kaschmir', 'wolle', 'satin', 'samt'], fits: ['normal', 'eng'] },
      avoid: { types: ['hoodie', 'sweatshirt', 'sweatjacke', 'jogginghose', 'cargohose', 'leggings', 'winterstiefel'], patterns: ['print', 'gemustert'], materials: ['fleece', 'funktion', 'jersey'] },
      maxAccents: 1, maxBold: 1, tips: [o => TONAL_TIP(o)],
      rules: [
        o => toneInTone(o) ? [2, 'Monochrom wirkt besonders edel'] : null,
        o => (o.shoes && o.shoes.type === 'sneaker') ? [-1.5, 'Sneaker brechen den eleganten Look'] : null,
        o => (hasBlazer(o) && [o.top, o.under, o.mid].some(i => i && i.type === 'rollkragen')) ? [1, 'Rollkragen unter dem Blazer – elegant'] : null,
        o => (o.mid && o.mid.typeDef.slot === 'top' && o.mid.typeDef.layerOk) ? [-1.5, null] : null
      ]
    },
    skandinavisch: {
      name: 'Skandinavisch', desc: 'Reduziert, hell und gemütlich: Strick, lässige Oversize-Lagen, Naturtöne, Sneaker',
      like: { types: ['pullover', 'rollkragen', 'cardigan', 'longcardigan', 'strickkleid', 'strickshirt', 'tshirt', 'langarm', 'hemd', 'jeans', 'weitehose', 'stoffhose', 'rock_lang', 'kleid_lang', 'mantel', 'trench', 'regenjacke', 'sneaker', 'stiefeletten', 'loafer', 'boots', 'schal', 'muetze', 'tasche'], colors: ['weiss', 'creme', 'beige', 'hellgrau', 'grau', 'schwarz', 'camel', 'oliv', 'hellblau', 'navy'], patterns: ['uni', 'gestreift'], materials: ['wolle', 'merino', 'kaschmir', 'alpaka', 'baumwolle', 'leinen', 'denim', 'leder', 'strick'], fits: ['weit', 'normal'] },
      avoid: { types: ['pumps', 'sandaletten', 'corsage', 'jogginghose', 'abendkleid', 'overknees'], patterns: ['animal', 'gebluemt', 'print'], materials: ['pailletten', 'satin', 'funktion'] },
      maxAccents: 1, maxBold: 0.5, oversizeOk: 1, highLow: 1,
      tips: [o => TONAL_TIP(o), (o, C) => C.tMax < 12 ? 'Einen großen Schal locker umlegen – typisch skandinavisch.' : null, () => 'Schmuck schlicht halten: kleine Ohrringe oder eine feine Kette.'],
      rules: [
        o => { const up = (o.mid && !isOpenLayer(o.mid)) ? o.mid : o.top, low = o.bottom; return up && low && up.fit === 'weit' && (legCutOf(low) === 'roehre' || low.fit === 'eng' || (low.typeDef.skirt && shapeOf(low) === 'eng')) ? [1.5, 'Weit oben, schmal unten – typisch skandinavisch'] : null; },
        o => pieces(o, false).some(i => i.typeDef.knit || ['cardigan', 'longcardigan'].includes(i.type)) ? [1, 'Strick als Hauptdarsteller'] : null,
        o => ((o.onepiece && o.onepiece.typeDef.dress) || (o.bottom && o.bottom.typeDef.skirt)) && o.shoes && ['sneaker', 'boots'].includes(o.shoes.type) ? [1, 'Kleid oder Rock mit Sneakern oder Boots – lässig nordisch'] : null,
        o => neutralShare(o) >= 0.8 ? [1, 'Helle Naturtöne und Neutrales'] : null,
        o => statementCount(o) >= 1 ? [-0.8, null] : null
      ]
    },
    franzoesisch: {
      name: 'Französisch / Pariser Chic', desc: 'Mühelos elegant: Streifenshirt, Blazer, gerade Jeans, Trench, Ballerinas – höchstens drei Farben',
      like: { types: ['tshirt', 'langarm', 'bluse', 'hemd', 'pullover', 'cardigan', 'cardigan_top', 'blazer', 'jeans', 'stoffhose', 'rock_lang', 'rock_kurz', 'kleid_kurz', 'kleid_lang', 'blusenkleid', 'trench', 'mantel', 'ballerinas', 'loafer', 'stiefeletten', 'sneaker', 'slingbacks', 'mules', 'tuch', 'guertel', 'tasche', 'schmuck'], colors: ['navy', 'weiss', 'creme', 'schwarz', 'beige', 'camel', 'grau', 'rot', 'jeansblau'], patterns: ['uni', 'gestreift', 'gepunktet'], materials: ['baumwolle', 'seide', 'wolle', 'kaschmir', 'leinen', 'denim', 'leder', 'wildleder'], fits: ['normal'] },
      avoid: { types: ['hoodie', 'jogginghose', 'laufschuhe', 'cargohose', 'cap', 'sweatjacke', 'leggings', 'crop'], patterns: ['print', 'animal'], materials: ['pailletten', 'funktion', 'fleece'] },
      maxAccents: 1, maxBold: 1, highLow: 1,
      tips: [(o, C) => TUCK(o, C) ? 'Oberteil nur vorne halb in den Bund stecken und die Ärmel hochschieben – das „je ne sais quoi“.' : null, () => 'Ein rotes Detail reicht als Akzent – etwa Lippenstift, Tuch oder Tasche.'],
      rules: [
        o => [o.top, o.mid].some(i => i && i.pattern === 'gestreift' && ['tshirt', 'langarm', 'pullover'].includes(i.type)) ? [1.5, 'Streifenshirt – der französische Klassiker'] : null,
        o => o.outer && o.outer.type === 'trench' ? [1, 'Trenchcoat – très parisien'] : null,
        o => o.bottom && o.bottom.type === 'jeans' && legCutOf(o.bottom) !== 'roehre' && (hasBlazer(o) || (o.shoes && ['ballerinas', 'loafer'].includes(o.shoes.type))) ? [1.5, 'Gerade Jeans mit Blazer oder Ballerinas – mühelos'] : null,
        o => o.shoes ? (heelOf(o.shoes) !== 'hoch' ? [0.5, null] : [-0.5, null]) : null,
        (o, C) => C.occasion.id === 'alltag' && pieces(o, true).every(i => i.fLo >= 3) ? [-1, 'Zu durchgestylt – französisch heißt: nie ganz auf Anlass gekleidet'] : null
      ]
    },
    quietluxury: {
      name: 'Quiet Luxury / Old Money', desc: 'Unaufdringlicher Luxus: edle Naturmaterialien, Ton in Ton, keine Logos',
      like: { types: ['pullover', 'rollkragen', 'cardigan', 'cardigan_top', 'bluse', 'hemd', 'polo', 'blazer', 'stoffhose', 'weitehose', 'chino', 'rock_lang', 'kleid_lang', 'blusenkleid', 'mantel', 'trench', 'loafer', 'ballerinas', 'derby', 'slingbacks', 'mules', 'sneaker', 'guertel', 'tasche', 'schmuck', 'tuch'], colors: ['creme', 'camel', 'beige', 'navy', 'weiss', 'grau', 'braun', 'schwarz'], patterns: ['uni', 'gestreift'], materials: ['kaschmir', 'merino', 'wolle', 'seide', 'leinen', 'baumwolle', 'leder', 'wildleder', 'alpaka'], fits: ['normal'] },
      avoid: { types: ['hoodie', 'sweatshirt', 'jogginghose', 'cargohose', 'laufschuhe', 'cap', 'leggings', 'boots', 'crop', 'corsage', 'sweatjacke'], patterns: ['print', 'animal', 'gebluemt'], materials: ['pailletten', 'polyester', 'acryl', 'funktion', 'fleece', 'kunstleder'] },
      maxAccents: 1, maxBold: 0.5, highLow: 1,
      tips: [o => TONAL_TIP(o), (o, C) => C.tMax >= 14 && C.tMax <= 24 && !o.mid ? 'Einen Kaschmirpullover locker über die Schultern legen.' : null, () => 'Schmuck dezent: Perlenohrringe oder eine schlichte Uhr.'],
      rules: [
        o => { const n = pieces(o, true).filter(i => (i.materials || []).some(m => ['kaschmir', 'merino', 'seide', 'wolle', 'leinen', 'alpaka', 'leder', 'wildleder'].includes(m))).length; return n >= 2 ? [2, 'Edle Naturmaterialien – das Herz von Quiet Luxury'] : n === 0 ? [-1, 'Ohne edle Materialien wirkt es nicht nach Quiet Luxury'] : null; },
        o => pieces(o, true).some(i => (i.materials || []).some(m => ['polyester', 'acryl'].includes(m)) && !(i.materials || []).some(m => ['wolle', 'kaschmir', 'seide'].includes(m))) ? [-1.5, 'Kunstfaser sieht man – lieber Naturmaterial'] : null,
        o => (toneInTone(o) || tonalInfo(o)) ? [1.5, 'Ton in Ton – leiser Luxus'] : null,
        o => o.shoes && ['loafer', 'ballerinas', 'derby'].includes(o.shoes.type) ? [1, 'Loafer oder Ballerinas aus Leder'] : null
      ]
    },
    vintage: {
      name: 'Vintage / Retro', desc: 'Inspiriert von früheren Jahrzehnten: Midirock, betonte Taille, Punkte, Karo, Bootcut',
      like: { types: ['bluse', 'cardigan', 'cardigan_top', 'rollkragen', 'pullover', 'rock_lang', 'rock_kurz', 'kleid_kurz', 'kleid_lang', 'blusenkleid', 'weitehose', 'stoffhose', 'jeans', 'mantel', 'trench', 'ballerinas', 'pumps', 'loafer', 'stiefeletten', 'slingbacks', 'tuch', 'guertel', 'haarschmuck', 'tasche', 'kragen'], colors: ['bordeaux', 'senf', 'oliv', 'rost', 'creme', 'navy', 'rot', 'braun', 'petrol', 'beige'], patterns: ['gepunktet', 'kariert', 'gebluemt', 'gestreift', 'uni'], materials: ['wolle', 'baumwolle', 'seide', 'cord', 'tweed', 'viskose', 'wildleder'], fits: ['normal', 'eng'] },
      avoid: { types: ['hoodie', 'jogginghose', 'laufschuhe', 'cargohose', 'sweatjacke', 'cap', 'leggings'], patterns: ['print'], materials: ['funktion', 'fleece'] },
      maxAccents: 2, maxBold: 1,
      tips: [() => 'Ein Retro-Teil mit modernen Basics kombinieren – sonst wirkt es schnell verkleidet.', (o, C) => TUCK(o, C)],
      rules: [
        o => [o.onepiece, o.bottom].some(i => i && lengthOf(i) === 'midi') ? [1.5, 'Midilänge – typisch Retro'] : null,
        o => o.bottom && legCutOf(o.bottom) === 'schlag' && o.shoes && heelOf(o.shoes) !== 'flach' ? [1.5, 'Bootcut mit Absatz – 70er-Flair'] : null,
        o => pieces(o, false).some(i => ['gepunktet', 'kariert'].includes(i.pattern)) ? [1, 'Punkte oder Karo – Retro-Muster'] : null,
        o => (o.onepiece && ['wickel', 'eng'].includes(shapeOf(o.onepiece) || '')) || (o.bottom && (o.bottom.typeDef.skirt || o.bottom.type === 'weitehose')) ? [0.8, 'Betonte Taille'] : null
      ]
    },
    glamour: {
      name: 'Glamourös / Sexy', desc: 'Figurbetont, Glanz und Absätze – Aufmerksamkeit erwünscht',
      like: { types: ['top', 'body', 'bluse', 'corsage', 'rock_kurz', 'rock_lang', 'kleid_kurz', 'kleid_lang', 'traegerkleid', 'abendkleid', 'stoffhose', 'jeans', 'blazer', 'lederjacke', 'mantel', 'pumps', 'sandaletten', 'slingbacks', 'overknees', 'stiefel', 'stiefeletten', 'schmuck', 'tasche'], colors: ['schwarz', 'rot', 'bordeaux', 'weiss', 'gold', 'silber', 'creme', 'pink'], patterns: ['uni', 'animal'], materials: ['seide', 'satin', 'samt', 'spitze', 'pailletten', 'leder', 'kunstleder', 'elasthan'], fits: ['eng'] },
      avoid: { types: ['hoodie', 'sweatshirt', 'jogginghose', 'cargohose', 'laufschuhe', 'parka', 'regenjacke', 'overshirt', 'latzhose', 'longcardigan', 'steppweste', 'bootsschuhe'], patterns: ['kariert', 'print'], materials: ['fleece', 'funktion', 'cord'] },
      maxAccents: 1, maxBold: 1, manyStatements: 1,
      tips: [() => 'Ein Hingucker darf groß sein: auffälliger Schmuck, roter Lippenstift oder eine glänzende Tasche.'],
      rules: [
        o => pieces(o, false).some(i => i.fit === 'eng' || (i.typeDef.skirt && shapeOf(i) === 'eng') || (i.typeDef.dress && ['eng', 'wickel'].includes(shapeOf(i) || ''))) ? [1.5, 'Figurbetont – glamourös'] : [-0.8, 'Etwas mehr Figur zeigen'],
        o => o.shoes ? (heelOf(o.shoes) !== 'flach' ? [2, 'Absatz gehört dazu'] : [-1, 'Flache Schuhe nehmen dem Look den Glamour']) : null,
        o => pieces(o, false).some(i => (i.materials || []).some(m => ['seide', 'satin', 'samt', 'spitze', 'pailletten', 'leder', 'kunstleder'].includes(m))) ? [1.5, 'Glanz oder Leder'] : null,
        o => pieces(o, false).every(i => i.fit === 'weit' || i.typeDef.knit) ? [-1.5, 'Weite, gemütliche Teile verstecken die Figur'] : null
      ]
    },
    kreativ: {
      name: 'Kreativ / Eklektisch', desc: 'Mutige Farben, Mustermix und ungewöhnliche Kombinationen – Regeln bewusst brechen',
      like: { types: ['kimono', 'tunika', 'hemd', 'bluse', 'pullover', 'cardigan', 'longcardigan', 'overshirt', 'weitehose', 'jeans', 'rock_lang', 'kleid_lang', 'latzhose', 'jumpsuit', 'blazer', 'mantel', 'cape', 'boots', 'sneaker', 'mules', 'loafer', 'tuch', 'schmuck', 'hut', 'haarschmuck'], colors: ['senf', 'petrol', 'rost', 'pink', 'gruen', 'orange', 'lila', 'tuerkis', 'rot', 'koralle', 'gelb', 'blau'], patterns: ['gebluemt', 'kariert', 'gestreift', 'gepunktet', 'gemustert', 'animal', 'print'], materials: ['leinen', 'cord', 'samt', 'wolle', 'seide', 'denim'], fits: ['weit', 'normal'] },
      avoid: { types: [], patterns: [], materials: [] },
      maxAccents: 3, maxBold: 2, manyStatements: 1, highLow: 1, oversizeOk: 1,
      tips: [() => 'Ein unerwartetes Detail macht den Look: farbige Socken, ein auffälliger Gürtel oder großer Schmuck.'],
      rules: [
        o => neutralShare(o) >= 0.85 ? [-1.5, 'Für Kreativ zu brav – ein Farbtupfer oder Muster fehlt'] : null,
        o => boldCount(o) >= 1 ? [1, 'Muster als Statement'] : null,
        o => pieces(o, true).filter(i => !prim(i).neutral).length >= 2 ? [1, 'Mehrere Farben mutig kombiniert'] : null
      ]
    },
    grunge: {
      name: 'Grunge', desc: '90er-Lässigkeit: Karohemd, Jeans, Boots, Lagen in Schwarz und gedeckten Tönen',
      like: { types: ['hemd', 'tshirt', 'langarm', 'hoodie', 'cardigan', 'longcardigan', 'overshirt', 'pullover', 'jeans', 'rock_kurz', 'traegerkleid', 'kleid_kurz', 'lederjacke', 'jeansjacke', 'parka', 'boots', 'stiefel', 'sneaker', 'muetze'], colors: ['schwarz', 'anthrazit', 'grau', 'bordeaux', 'oliv', 'braun', 'jeansblau', 'khaki', 'rost'], patterns: ['kariert', 'uni', 'print'], materials: ['denim', 'flanell', 'leder', 'baumwolle', 'strick', 'cord'], fits: ['weit', 'normal'] },
      avoid: { types: ['cape', 'pumps', 'slingbacks', 'sandaletten', 'blazer', 'polo', 'abendkleid', 'kragen', 'loafer', 'bootsschuhe'], patterns: ['gepunktet', 'gebluemt'], materials: ['seide', 'satin', 'pailletten', 'kaschmir'] },
      maxAccents: 1, maxBold: 1.5, oversizeOk: 1, denimOk: 1, highLow: 1,
      tips: [o => [o.top, o.mid].some(i => i && i.pattern === 'kariert') ? 'Karohemd offen über dem Shirt tragen oder um die Hüfte knoten.' : null],
      rules: [
        o => [o.top, o.mid, o.layer].some(i => i && i.pattern === 'kariert') ? [2, 'Karohemd – Grunge pur'] : null,
        o => o.shoes ? (['boots', 'stiefel'].includes(o.shoes.type) ? [2, 'Schwere Boots gehören dazu'] : o.shoes.type === 'sneaker' ? [0.5, null] : [-1, null]) : null,
        o => o.under && o.onepiece && o.onepiece.typeDef.traeger ? [2, 'Slipkleid mit Shirt drunter – 90er-Grunge'] : null,
        o => darkShare(o) >= 0.5 ? [1, 'Dunkle, verwaschene Töne'] : null
      ]
    },
    darkacademia: {
      name: 'Dark Academia', desc: 'Bibliothek und Uni-Flair: Tweed, Rollkragen, Strick, Karo und dunkle Erdtöne',
      like: { types: ['hemd', 'bluse', 'rollkragen', 'pullover', 'cardigan', 'weste', 'blazer', 'kragen', 'stoffhose', 'chino', 'rock_lang', 'rock_kurz', 'kleid_lang', 'mantel', 'trench', 'loafer', 'derby', 'stiefeletten', 'tasche', 'schal'], colors: ['braun', 'bordeaux', 'oliv', 'schwarz', 'anthrazit', 'camel', 'creme', 'grau', 'navy', 'senf'], patterns: ['kariert', 'uni', 'gestreift'], materials: ['tweed', 'wolle', 'cord', 'flanell', 'leder', 'merino', 'baumwolle'], fits: ['normal'] },
      avoid: { types: ['jogginghose', 'leggings', 'laufschuhe', 'sandalen', 'cap', 'sandaletten', 'crop', 'corsage', 'hoodie', 'sweatjacke'], patterns: ['gebluemt', 'print', 'animal'], materials: ['pailletten', 'funktion', 'fleece', 'satin'] },
      maxAccents: 1, maxBold: 1,
      tips: [() => 'Eine lederne Aktentasche statt Rucksack – der Rest ergibt sich.'],
      rules: [
        o => hasMaterial(o, 'tweed') || hasMaterial(o, 'cord') || hasMaterial(o, 'flanell') ? [1.5, 'Tweed, Cord oder Flanell – akademisch'] : null,
        o => (o.mid && (o.mid.typeDef.knit || o.mid.typeDef.vest) && o.top && hasCollar(o.top)) || (o.under && o.under.type === 'kragen') ? [2, 'Kragen unter Pullover oder Pullunder'] : null,
        o => hasBlazer(o) && [o.top, o.mid].some(i => i && i.type === 'rollkragen') ? [1.5, 'Rollkragen unter dem Blazer'] : null,
        o => o.shoes && ['loafer', 'derby'].includes(o.shoes.type) ? [1.5, 'Loafer oder Schnürschuhe'] : null,
        o => darkShare(o) + earthShare(o) >= 0.7 ? [1, 'Dunkle Erdtöne'] : null
      ]
    },
    maritim: {
      name: 'Maritim / Coastal', desc: 'Blau-Weiß, Streifen, Leinen, Bootsschuhe – frisch wie am Meer',
      like: { types: ['tshirt', 'langarm', 'hemd', 'bluse', 'pullover', 'polo', 'cardigan', 'chino', 'jeans', 'shorts', 'weitehose', 'rock_lang', 'kleid_kurz', 'kleid_lang', 'blusenkleid', 'blouson', 'regenjacke', 'trench', 'steppweste', 'bootsschuhe', 'espadrilles', 'sneaker', 'sandalen', 'loafer', 'tuch', 'guertel', 'hut', 'sonnenbrille'], colors: ['navy', 'weiss', 'creme', 'hellblau', 'rot', 'beige', 'blau'], patterns: ['gestreift', 'uni'], materials: ['leinen', 'baumwolle', 'denim', 'strick'], fits: ['normal'] },
      avoid: { types: ['cape', 'pumps', 'overknees', 'corsage', 'abendkleid', 'jogginghose', 'boots', 'winterstiefel'], patterns: ['animal', 'print'], materials: ['pailletten', 'samt', 'satin', 'kunstleder'] },
      maxAccents: 1, maxBold: 1,
      tips: [(o, C) => C.sunny ? 'Sonnenbrille und Strohhut machen den Look komplett.' : null],
      rules: [
        o => pieces(o, false).some(i => i.pattern === 'gestreift') ? [1.5, 'Streifen – maritim'] : null,
        o => o.shoes && ['bootsschuhe', 'espadrilles'].includes(o.shoes.type) ? [1.5, 'Bootsschuhe oder Espadrilles'] : null,
        (o, C) => C.tMax >= 20 && hasMaterial(o, 'leinen') ? [1, 'Leinen – luftig wie am Meer'] : null,
        o => pieces(o, false).some(i => prim(i).id === 'schwarz') ? [-0.8, 'Dunkelblau statt Schwarz wirkt maritimer'] : null
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
    ],
    skandinavisch: [
      E_(['pullover', 'cardigan'], ['creme', 'hellgrau', 'beige'], 'Grober Strickpullover oder Cardigan', 'Das Herz des Scandi-Looks – gern etwas weiter geschnitten.', { m: ['wolle', 'merino'] }),
      E_(['jeans'], ['jeansblau', 'schwarz'], 'Gerade Jeans', 'Schlicht, ohne Waschungseffekte.', { m: ['denim'] }),
      E_(['mantel'], ['camel', 'grau', 'schwarz'], 'Schlichter Wollmantel', 'Klar geschnitten, gern oversized.', { m: ['wolle'] }),
      E_(['sneaker'], ['weiss'], 'Weiße Leder-Sneaker', 'Zu Jeans, Kleid und Rock.', { m: ['leder'] }),
      E_(['strickkleid'], ['grau', 'creme', 'schwarz'], 'Strickkleid', 'Mit Stiefeletten oder Sneakern – alltagstauglich und gemütlich.')
    ],
    franzoesisch: [
      E_(['langarm', 'tshirt'], ['navy', 'weiss'], 'Streifenshirt (Marinière)', 'Blau-weiß gestreift – das französische Basic schlechthin.', { m: ['baumwolle'] }),
      E_(['blazer'], ['schwarz', 'navy'], 'Schwarzer oder dunkelblauer Blazer', 'Locker über Shirt und Jeans.'),
      E_(['jeans'], ['jeansblau'], 'Gerade Jeans', 'Gerades Bein, klassisches Blau.', { m: ['denim'] }),
      E_(['trench'], ['beige'], 'Beiger Trenchcoat', 'Das Pariser Übergangsteil.'),
      E_(['ballerinas', 'loafer'], ['schwarz', 'beige'], 'Ballerinas oder Loafer', 'Flach und bequem – Pariserinnen laufen viel.')
    ],
    quietluxury: [
      E_(['pullover', 'rollkragen'], ['creme', 'camel', 'grau'], 'Kaschmirpullover', 'Fein, schlicht, ohne Logo.', { m: ['kaschmir'] }),
      E_(['stoffhose'], ['creme', 'navy', 'grau'], 'Stoffhose mit Bügelfalte', 'Sauberer Fall, gern aus Wolle.', { m: ['wolle'] }),
      E_(['bluse', 'hemd'], ['weiss', 'creme'], 'Hemd oder Seidenbluse', 'Perfekt sitzend, ohne Schnickschnack.', { m: ['seide', 'baumwolle'] }),
      E_(['mantel'], ['camel'], 'Camel-Mantel', 'Lang, aus Wolle oder Kaschmir.', { m: ['wolle', 'kaschmir'] }),
      E_(['loafer'], ['braun', 'schwarz'], 'Leder-Loafer', 'Schlicht, gepflegt, ohne auffälliges Logo.', { m: ['leder'] })
    ],
    vintage: [
      E_(['rock_lang'], ['bordeaux', 'navy', 'braun'], 'Midirock', 'A-Linie oder Plissee – der Retro-Klassiker.'),
      E_(['cardigan', 'cardigan_top'], ['creme', 'senf', 'bordeaux'], 'Feiner Cardigan', 'Zugeknöpft als Oberteil oder offen über der Bluse.'),
      E_(['bluse'], ['creme', 'weiss'], 'Bluse mit Kragen', 'Gern mit Bubikragen oder Schleife.'),
      E_(['guertel'], ['braun', 'schwarz'], 'Taillengürtel', 'Betont die Taille über Kleid und Strick.')
    ],
    glamour: [
      E_(['pumps', 'sandaletten'], ['schwarz', 'hautfarben'], 'Pumps oder Sandaletten mit Absatz', 'Der Absatz macht den Look.'),
      E_(['kleid_kurz', 'kleid_lang'], ['schwarz', 'rot'], 'Figurbetontes Kleid', 'Etui- oder Wickelkleid.'),
      E_(['top', 'bluse'], ['schwarz', 'creme'], 'Satin- oder Seidentop', 'Glanz für den Abend und unter dem Blazer.', { m: ['satin', 'seide'] }),
      E_(['schmuck'], ['gold', 'silber'], 'Auffälliger Schmuck', 'Ein großer Hingucker statt vieler kleiner.')
    ],
    kreativ: [
      E_(['kimono', 'longcardigan'], ['senf', 'petrol', 'rost'], 'Kimono oder Long-Cardigan', 'Lässige, auffällige Lage über allem.'),
      E_(['hemd', 'bluse'], ['senf', 'gruen', 'pink'], 'Gemustertes Hemd oder Bluse', 'Der Startpunkt für Mustermix.'),
      E_(['weitehose'], ['rost', 'petrol', 'senf'], 'Farbige weite Hose', 'Farbe von unten – mutig und bequem.')
    ],
    grunge: [
      E_(['hemd', 'overshirt'], ['bordeaux', 'oliv', 'schwarz'], 'Karohemd aus Flanell', 'Offen über dem Shirt oder um die Hüfte.', { m: ['flanell'] }),
      E_(['boots'], ['schwarz'], 'Schnür- oder Bikerboots', 'Die schweren Boots gehören dazu.', { m: ['leder'] }),
      E_(['jeans'], ['schwarz', 'jeansblau'], 'Lässige Jeans', 'Gern verwaschen oder mit Rissen.', { m: ['denim'] }),
      E_(['lederjacke'], ['schwarz'], 'Lederjacke', 'Über Hoodie, Karohemd oder Slipkleid.')
    ],
    darkacademia: [
      E_(['blazer'], ['braun', 'grau', 'oliv'], 'Tweed-Blazer', 'Gern kariert oder mit Fischgrat.', { m: ['tweed', 'wolle'] }),
      E_(['rollkragen'], ['creme', 'schwarz', 'braun'], 'Rollkragenpullover', 'Unter dem Blazer oder solo.', { m: ['merino', 'wolle'] }),
      E_(['weste'], ['grau', 'braun', 'bordeaux'], 'Pullunder', 'Über dem Hemd mit Kragen.'),
      E_(['loafer', 'derby'], ['braun', 'schwarz'], 'Loafer oder Schnürschuhe', 'Aus Leder, gern etwas robuster.', { m: ['leder'] }),
      E_(['rock_lang', 'stoffhose'], ['braun', 'grau'], 'Karierter Rock oder Stoffhose', 'Wolle oder Tweed, gedeckte Karos.')
    ],
    maritim: [
      E_(['langarm', 'tshirt'], ['navy', 'weiss'], 'Streifenshirt', 'Marine-weiß – das maritime Basic.', { m: ['baumwolle'] }),
      E_(['chino', 'weitehose'], ['weiss', 'creme', 'navy'], 'Helle Chino oder Leinenhose', 'Weiß oder Creme für den Sommer.', { m: ['baumwolle', 'leinen'] }),
      E_(['bootsschuhe', 'espadrilles'], ['braun', 'navy'], 'Bootsschuhe oder Espadrilles', 'Bequem und typisch maritim.'),
      E_(['pullover'], ['navy', 'creme'], 'Zopfstrick- oder Fischerpullover', 'Für kühle Abende am Wasser.', { m: ['wolle', 'baumwolle'] })
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
    return pieces(o, true).filter(i => (PATTERNS[i.pattern] || PATTERNS.uni).bold >= 1 || prim(i).groups.includes('kraeftig') || prim(i).groups.includes('metall') || ['cape', 'kimono', 'overknees', 'corsage'].includes(i.type) ||
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
      if (md.knit && md.overBase) return !!o.top.typeDef.base && !o.top.typeDef.knit && !o.top.typeDef.long;   // Pullover/Sweatshirt über Shirt, Bluse, Hemd
      if (md.layerOk) return ['tshirt', 'top', 'langarm', 'body'].includes(o.top.type) && !(mid.materials || []).some(m => m === 'seide' || m === 'satin'); // Hemd offen über Shirt
      return false;
    }
    if (o.onepiece) return !!md.open && !md.vest && (!o.onepiece.typeDef.knitDress || mid.type === 'blazer') && (!o.onepiece.typeDef.overall || ['cardigan', 'overshirt', 'sweatjacke', 'longcardigan'].includes(mid.type));
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
  // Was darunter: Shirt unter Träger- oder ärmellosem Kleid, dünnes Langarm unter Strickkleid oder Rollkragen,
  // Blusenkragen-Einsatz unter Pullover, Sweatshirt oder Strickkleid
  function underHost(o) {
    if (o.onepiece) { const d = o.onepiece; return !!(d.typeDef.traeger || d.typeDef.knitDress || d.typeDef.overall || (d.typeDef.dress && sleevesOf(d) === 'ohne')); }
    return !!(o.top && o.top.typeDef.knit && !o.top.typeDef.hood);
  }
  function underFits(u, o) {
    const ud = u.typeDef;
    if (ud.slot === 'insert') {
      if (o.onepiece) return !!o.onepiece.typeDef.knitDress && neckOf(o.onepiece) !== 'rollkragen';
      return !!(o.top && o.top.typeDef.knit && !o.top.typeDef.hood && o.top.type !== 'rollkragen');
    }
    if (o.onepiece && o.onepiece.typeDef.overall) return ud.slot === 'top' && (ud.base || ud.knit) && !ud.crop && !ud.long && u.warmth <= 4;   // Oberteil unter der Latzhose
    if (ud.slot !== 'top' || !ud.underOk || u.warmth > 3) return false;
    if (o.onepiece) {
      const d = o.onepiece;
      if (d.typeDef.knitDress) return thinLong(u);
      return !!(d.typeDef.traeger || (d.typeDef.dress && sleevesOf(d) === 'ohne'));
    }
    if (o.top && o.top.typeDef.knit && !o.top.typeDef.overBase && !o.top.typeDef.hood) return thinLong(u) && ['langarm', 'body', 'rollkragen'].includes(u.type) && u.id !== o.top.id;
    return false;
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
      if (o.under) add(o.under, o.top, o.under.typeDef.slot === 'insert' ? 0.8 : 0.1);
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
    skandinavisch: { accents: ['hellblau', 'mint', 'flieder', 'rosa', 'oliv'], avoid: ['pink', 'orange', 'gelb', 'rot', 'lila', 'tuerkis', 'koralle'], maxColors: 3, maxBonus: 0.5, contrast: [0, 50], contrastWhy: 'Sanfte, helle Kontraste', tonal: 1.2, tonalWhy: 'Helle Naturtöne Ton in Ton', near: 1.2, clash: 1.2, grell: 1.5, heikel: 0.3, klassiker: 0.6, echo: 0.5, layerPref: 0.6, leggings: -0.5, tightsColor: 0, tightsPattern: -1, contrastText: 'Sanft und hell, gern Ton in Ton in Creme, Grau und Beige', layers: ['Grober Strick über Hemd oder Shirt', 'Oversize-Mantel über schmalen Lagen', 'Strickkleid mit Stiefeletten oder Sneakern', 'Strumpfhose blickdicht in Schwarz oder Grau'] },
    franzoesisch: { accents: ['rot', 'bordeaux', 'hellblau'], avoid: ['pink', 'orange', 'gelb', 'lila', 'tuerkis', 'mint', 'koralle', 'gruen'], maxColors: 3, maxBonus: 1, maxWhy: ['Höchstens drei Farben – à la française', 'Mehr als drei Farben wirkt nicht mehr französisch'], contrast: [25, 95], contrastWhy: 'Klarer Kontrast wie Marine zu Weiß', near: 1.3, clash: 1.3, grell: 1.5, heikel: 0.8, klassiker: 1, echo: 0.8, frame: 0.6, layerPref: 0, leggings: -1.5, tightsColor: 0, tightsPattern: -0.5, tightsFine: 0.8, pairs: { 'navy|weiss': [1.2, 'Marine und Weiß – französischer geht es nicht'], 'navy|rot': [1, 'Bleu, blanc, rouge'], 'beige|schwarz': [0.8, 'Beige und Schwarz – Pariser Klassiker'], 'jeansblau|weiss': [1, 'Jeans und Weiß – mühelos'] }, contrastText: 'Klar und ruhig: Marine, Weiß, Schwarz, Beige – Rot als einziger Akzent', layers: ['Blazer locker über Streifenshirt', 'Trench offen über allem', 'Pullover über die Schultern', 'Feine schwarze Strumpfhose zu Rock und Ballerinas'] },
    quietluxury: { accents: ['bordeaux', 'oliv', 'gruen'], avoid: ['pink', 'orange', 'gelb', 'tuerkis', 'lila', 'koralle', 'mint', 'rot', 'senf'], maxColors: 3, maxBonus: 1, contrast: [0, 45], contrastWhy: 'Leise Kontraste', tonal: 1.5, tonalWhy: 'Abgestuft in Creme, Camel und Navy', near: 1.3, clash: 1.5, grell: 2, heikel: 0.5, klassiker: 1, echo: 0.6, frame: 0.6, layerPref: 0.6, leggings: -2, tightsColor: 0, tightsPattern: -1.5, tightsFine: 0.6, pairs: { 'camel|creme': [1.2, 'Camel und Creme – leiser Luxus'], 'creme|navy': [1, 'Navy und Creme'], 'camel|grau': [1, 'Grau und Camel'] }, contrastText: 'Leise: Ton in Ton in Creme, Camel, Grau und Navy', layers: ['Pullover über die Schultern gelegt', 'Feinstrick unter dem Blazer', 'Langer Wollmantel über allem', 'Feine Strumpfhose, keine Leggings'] },
    vintage: { accents: ['bordeaux', 'senf', 'rost', 'oliv', 'rot', 'petrol'], avoid: ['pink', 'tuerkis', 'flieder', 'mint'], maxColors: 4, contrast: [10, 70], contrastWhy: 'Warme, satte Kontraste', tonal: 0.6, temp: 'warm', near: 1, clash: 1, grell: 1, heikel: 0.3, klassiker: 0.8, echo: 1, layerPref: 0, leggings: -1.5, tightsColor: 0.8, tightsPattern: 0.6, pairs: { 'bordeaux|senf': [1, 'Bordeaux und Senf – Retro-Klassiker'], 'navy|rot': [1, 'Rot und Marine – 50er-Flair'], 'oliv|senf': [0.8, 'Oliv und Senf – 70er'] }, contrastText: 'Satte, warme Töne wie Bordeaux, Senf, Oliv und Rost', layers: ['Cardigan über Bluse oder Kleid', 'Blusenkragen unter dem Pullover', 'Farbige Strumpfhose zum Midirock'] },
    glamour: { accents: ['rot', 'bordeaux', 'pink'], avoid: ['oliv', 'khaki', 'senf', 'mint'], maxColors: 3, contrast: [40, 100], contrastWhy: 'Starker Kontrast – glamourös', near: 1.2, clash: 1.2, grell: 1, heikel: 0.5, klassiker: 0.8, echo: 0.8, layerPref: -1, leggings: -2, tightsColor: 0, tightsPattern: 0.6, tightsFine: 1, pairs: { 'rot|schwarz': [1.2, 'Schwarz und Rot – glamourös'], 'schwarz|weiss': [0.8, 'Schwarz-Weiß – dramatisch'] }, contrastText: 'Stark: Schwarz, Rot, Metallic', layers: ['Lieber eine Lage als drei', 'Blazer oder Lederjacke über dem Glanzteil', 'Feine Strumpfhose zu Absatz'] },
    kreativ: { maxColors: 5, contrast: null, near: 0.8, clash: 0.4, grell: 0, blocking: 1, heikel: 0, klassiker: 0.3, harmony: 1.2, echo: 1.5, layerPref: 0.5, leggings: 0, tightsColor: 1, tightsPattern: 1, contrastText: 'Alles erlaubt – Color-Blocking und Mustermix mit gemeinsamer Farbe', layers: ['Lagen in verschiedenen Längen und Stoffen', 'Kimono oder Cape als Statement', 'Farbige oder gemusterte Strumpfhose'] },
    grunge: { accents: ['bordeaux', 'oliv', 'rost'], avoid: ['rosa', 'mint', 'flieder', 'hellblau', 'gelb', 'pink', 'koralle', 'tuerkis'], maxColors: 4, contrast: null, tonal: 0.8, tonalWhy: 'Dunkle, verwaschene Töne', near: 0.5, clash: 1, grell: 1, heikel: 0, klassiker: 0.4, echo: 0.6, layerPref: 1, leggings: 0.3, tightsColor: 0, tightsPattern: 0.8, contrastText: 'Gedeckt und dunkel: Schwarz, Grau, Bordeaux, Oliv, Denim', layers: ['Karohemd offen über dem Shirt', 'Shirt unter dem Slipkleid', 'Lederjacke über Hoodie', 'Blickdichte schwarze Strumpfhose zu Boots'] },
    darkacademia: { accents: ['bordeaux', 'oliv', 'senf'], avoid: ['rosa', 'mint', 'flieder', 'hellblau', 'pink', 'gelb', 'orange', 'tuerkis', 'koralle'], maxColors: 3, maxBonus: 0.5, contrast: [10, 60], contrastWhy: 'Gedämpfte Kontraste', tonal: 1, tonalWhy: 'Erdtöne in Abstufungen', temp: 'warm', near: 1, clash: 1.2, grell: 1.5, heikel: 0, klassiker: 0.8, echo: 0.8, layerPref: 1, leggings: -2, tightsColor: 0.4, tightsPattern: 0.4, contrastText: 'Dunkel und warm: Braun, Bordeaux, Oliv, Schwarz, Creme', layers: ['Hemd, Pullunder und Blazer', 'Rollkragen unter dem Blazer', 'Langer Mantel über allem', 'Blickdichte Strumpfhose zum Faltenrock'] },
    maritim: { accents: ['rot', 'hellblau', 'gelb'], avoid: ['pink', 'lila', 'flieder', 'orange', 'senf', 'rost'], maxColors: 3, maxBonus: 0.8, contrast: [30, 95], contrastWhy: 'Frischer Kontrast wie Marine zu Weiß', near: 1.2, clash: 1.2, grell: 1.5, heikel: 0.8, klassiker: 1, echo: 0.8, layerPref: 0, leggings: -1, tightsColor: 0, tightsPattern: -1, pairs: { 'navy|weiss': [1.5, 'Marine und Weiß – maritim'], 'navy|rot': [1, 'Marine und Rot – wie Signalflaggen'], 'hellblau|weiss': [0.8, 'Hellblau und Weiß – frisch'] }, contrastText: 'Marine, Weiß, Creme – Rot oder Gelb als Akzent', layers: ['Pullover locker über die Schultern', 'Steppweste über dem Streifenshirt', 'Trench bei Wind und Regen'] },
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
    if (p.shoesDark && o.shoes && o.bottom && C.tMax < 20 && o.shoes.fHi >= 4 && !['sneaker', 'sandalen', 'sandaletten'].includes(o.shoes.type)
      && prim(o.shoes).lab[0] - prim(o.bottom).lab[0] > 30) push(-0.8 * p.shoesDark, 'Schuhe deutlich heller als die Hose – wirkt unruhig');

    // 10) Zu viel Dunkles
    if (p.darkMax != null && darkShare(o) > p.darkMax) push(-1, p.darkWhy);
    // 11) Passen drei Lagen übereinander zum Stil?
    if (o.layer && p.layerPref) push(p.layerPref, null);
    // 12) Strumpfhose oder Leggings unter Rock und Kleid
    if (legsVisible(o)) {
      const lg = o.legs, c = prim(lg);
      const knitD = o.onepiece && o.onepiece.typeDef.knitDress;
      if (lg.type === 'leggings' && p.leggings) push(p.leggings * (knitD && p.leggings < 0 ? 0.3 : 1), p.leggings < 0 ? (knitD ? null : 'Leggings unter Rock oder Kleid passt wenig zu ' + s.name) : 'Leggings unter ' + (knitD ? 'dem Strickkleid' : 'Rock oder Kleid') + ' – lässig');
      if (!c.neutral) { if (p.avoid.includes(c.id)) push(-1.2, c.name + ' passt nicht in die Farbwelt von ' + s.name); else if (p.tightsColor) push(p.tightsColor, 'Farbige Strumpfhose als Akzent'); else push(-0.8, null); }
      if ((lg.pattern || 'uni') !== 'uni' && p.tightsPattern) push(p.tightsPattern, p.tightsPattern > 0 ? 'Gemusterte Strumpfhose – verspieltes Detail' : 'Gemusterte Strumpfhose passt wenig zum Stil');
      if (p.tightsFine && C.tMax >= 12 && lg.type === 'strumpfhose' && lg.warmth <= 2 && ['schwarz', 'hautfarben'].includes(c.id)) push(p.tightsFine, 'Feine Strumpfhose – elegant');
    }
    return { sc, why };
  }

  const NO_COLOR = 'Nur Schwarz, Weiß und Grau – es fehlt ein Farbtupfer';
  // ---------------------------------------------------------------- Figurtypen
  // A: Hüfte breiter als Schultern · V: Schultern breiter als Hüfte · H: gerade, wenig Taille
  // X: Sanduhr, schmale Taille · O: rundere Körpermitte
  const FIGURES = {
    A: { name: 'A – Birne', look: 'Hüfte breiter als die Schultern, schmale Taille', aim: 'Blick nach oben lenken: helle oder gemusterte Oberteile, dunkle schlichte Unterteile, A-Linie und Bootcut' },
    V: { name: 'V – Apfel / athletisch', look: 'Schultern breiter als die Hüfte, schmale Beine', aim: 'Volumen nach unten bringen: helle oder gemusterte Unterteile, weite Hosen, V-Ausschnitt, oben schlicht' },
    H: { name: 'H – gerade', look: 'Schultern, Taille und Hüfte etwa gleich breit', aim: 'Taille schaffen: Gürtel, Wickelschnitte, taillierte Teile, offene Lagen' },
    X: { name: 'X – Sanduhr', look: 'Schultern und Hüfte gleich breit, deutlich schmalere Taille', aim: 'Taille zeigen: taillierte Schnitte, Wickelkleider, Gürtel – nichts Formloses' },
    O: { name: 'O – rund', look: 'Mehr Volumen an Bauch und Körpermitte, oft schlanke Beine', aim: 'Lange Linien: offene Lagen, V-Ausschnitt, fließende Stoffe, Ton in Ton – nichts Enges an der Mitte' }
  };
  function figureRules(o, C, add) {
    const F = C.figur;
    const up = (o.mid && !isOpenLayer(o.mid)) ? o.mid : (o.top || o.onepiece), low = o.bottom;
    if (!up) return;
    const bold = i => (PATTERNS[i.pattern] || PATTERNS.uni).bold >= 0.5;
    const Lu = prim(up).lab[0], Ll = low ? prim(low).lab[0] : null;
    const cut = low && legCutOf(low), form = low && low.typeDef.skirt ? shapeOf(low) : null;
    const lowFlare = low && (cut === 'schlag' || wideLeg(low) || form === 'gerade' || form === 'weit');
    const dShape = o.onepiece && o.onepiece.typeDef.dress ? shapeOf(o.onepiece) : null;
    const openLayer = (o.mid && isOpenLayer(o.mid)) || o.layer;
    const upFit = (o.mid && !isOpenLayer(o.mid)) ? o.mid.fit : (o.top ? o.top.fit : o.onepiece.fit);
    if (F === 'A') {
      if (low && (Ll - Lu > 20 || (bold(low) && !bold(up)))) add(-1.2, 'Helles oder gemustertes Unterteil betont die Hüfte (Figurtyp A)');
      else if (low && (Lu - Ll > 20 || (bold(up) && !bold(low)))) add(1, 'Heller oder gemustert oben, dunkler unten – gleicht Figurtyp A aus');
      if (lowFlare) add(0.8, 'Nach unten ausgestellt – schmeichelt Figurtyp A');
      if (low && (low.materials || []).some(m => ['satin', 'seide', 'leder', 'kunstleder'].includes(m))) add(-1, 'Glänzendes Unterteil betont die Hüfte');
      if (dShape === 'gerade' || dShape === 'wickel') add(0.6, null);
    } else if (F === 'V') {
      if (low && (Ll - Lu > 20 || (bold(low) && !bold(up)))) add(1, 'Heller oder gemustert unten – gleicht breite Schultern aus (Figurtyp V)');
      else if (low && bold(up) && !bold(low)) add(-1, 'Muster oben betont die Schultern (Figurtyp V)');
      if (low && (cut === 'schlag' || wideLeg(low) || form === 'weit')) add(1, 'Volumen unten balanciert die Schultern');
      if (neckOf(up) === 'v') add(0.6, 'V-Ausschnitt streckt die Schulterpartie');
      if (upFit === 'weit') add(-0.5, null);
    } else if (F === 'H') {
      if (dShape === 'wickel' || dShape === 'eng' || (o.top && o.top.fit === 'eng' && !o.mid)) add(1, 'Geformte Taille – gut für Figurtyp H');
      if (openLayer) add(0.5, null);
      if (dShape === 'gerade' && !o.mid) add(-0.6, 'Gerade Kleider wirken bei Figurtyp H ohne Gürtel formlos');
    } else if (F === 'X') {
      if (upFit === 'weit') add(-1.2, 'Weite Oberteile verstecken die Taille (Figurtyp X)');
      if (dShape === 'wickel' || dShape === 'eng' || upFit === 'eng') add(1, 'Taillierte Schnitte zeigen die Sanduhr-Figur');
      else if (dShape === 'gerade') add(-0.6, null);
    } else if (F === 'O') {
      if (openLayer) add(1, 'Offene Lage bildet eine lange Linie (Figurtyp O)');
      if (neckOf(up) === 'v') add(0.8, 'V-Ausschnitt streckt den Oberkörper');
      if (upFit === 'eng') add(-1, 'Enge Oberteile betonen die Körpermitte (Figurtyp O)');
      if (o.top && o.top.typeDef.crop) add(-1.5, null);
    }
    if (C.petite) {
      if (toneInTone(o)) add(0.5, 'Ton in Ton streckt die Silhouette');
      const midiLen = [o.onepiece, o.bottom].some(i => i && lengthOf(i) === 'midi');
      if (midiLen && o.shoes && heelOf(o.shoes) === 'flach' && !o.shoes.typeDef.tall) add(-0.6, 'Midi mit flachen Schuhen staucht bei kleiner Größe – etwas Absatz streckt');
    }
  }
  // ---------------------------------------------------------------- Schuhe zum Schnitt
  // Feste Stilregeln: Was passt zum Bein der Hose, zur Länge und Form von Rock und Kleid?
  function shoeCutRules(o, C, add) {
    const sh = o.shoes, st = sh.type, sd = sh.typeDef;
    const tall = !!sd.tall;                                                   // Stiefel mit Schaft
    const hl = heelOf(sh), heel = hl !== 'flach' && !sd.boot;
    const ankle = st === 'stiefeletten' || st === 'boots';
    const flat = ['ballerinas', 'sandalen', 'loafer', 'derby', 'mules', 'espadrilles', 'bootsschuhe'].includes(st) && hl === 'flach';
    const sneak = ['sneaker', 'laufschuhe'].includes(st);
    const pants = o.bottom && legCutOf(o.bottom) ? o.bottom : (o.onepiece && legCutOf(o.onepiece) ? o.onepiece : null);
    if (pants) {
      const cut = legCutOf(pants), wide = wideLeg(pants);
      if (cut === 'schlag') {
        if (tall) add(-4, 'Stiefel mit Schaft passen nicht zur Schlaghose');
        else if (heel || (ankle && hl !== 'flach')) add(1.5, (ankle ? 'Stiefeletten mit Absatz' : 'Absatz') + ' unter dem Bootcut – streckt das Bein');
        else if (ankle) add(0.8, 'Stiefeletten unter dem Bootcut');
        else if (st === 'ballerinas' || st === 'sandalen') add(-1.5, 'Flache Schuhe verschwinden unter dem Schlag');
        else if (sneak) add(-0.8, 'Zum Bootcut besser Absatz, Plateau oder Stiefeletten');
      } else if (cut === 'roehre') {
        if (tall) add(1.5, 'Enge Hose in die Stiefel gesteckt – passt perfekt');
        else if (sneak || st === 'loafer' || st === 'ballerinas') add(0.6, 'Schmale Hose zeigt den Knöchel – ideal für flache Schuhe');
        else if (ankle || heel) add(0.5, null);
      } else {
        if (tall) add(-0.8, 'Unter gerader Hose lieber Stiefeletten als Stiefel mit Schaft');
        if (wide) { if (heel || (ankle && hl !== 'flach')) add(0.8, 'Etwas Absatz zur weiten Hose – streckt die Silhouette'); else if (st === 'ballerinas') add(-0.5, null); }
      }
    }
    const skirt = o.onepiece && o.onepiece.typeDef.dress ? o.onepiece : (o.bottom && o.bottom.typeDef.skirt ? o.bottom : null);
    if (skirt) {
      const len = lengthOf(skirt), form = shapeOf(skirt), what = skirt === o.onepiece ? 'Kleid' : 'Rock';
      if (len === 'mini') { if (tall && C.tMax < 16) add(1.5, (st === 'overknees' ? 'Overknees' : 'Stiefel mit Schaft') + ' zum Mini – ein Klassiker'); }
      else if (len === 'knie') {
        if (tall && C.tMax < 16) add(1.2, 'Stiefel bis unters Knie – kein Spalt zum ' + what);
        else if (heel) add(1, 'Pumps zum knielangen ' + what + ' – zeitlos');
      } else if (len === 'midi') {
        if (tall && C.tMax < 16) add(1.5, 'Stiefel verschwinden unter dem Midi-' + what + ' – kein Spalt');
        else if (heel) add(0.5, null);
      } else if (len === 'maxi') {
        if (flat || ankle || sneak) add(0.6, 'Flache Schuhe zum Maxi-' + what);
        else if (heel) add(-0.5, null);
      }
      if (len === 'maxi' && st === 'overknees') add(-1, null);
      if (form === 'eng') {
        if (heel) add(1, 'Absatz zum engen ' + what + ' – elegante Linie');
        else if (sneak) add(-0.8, 'Sneaker zum engen ' + what + ' wirken unentschlossen');
      } else if (form === 'weit' && (st === 'ballerinas' || sneak || ankle)) add(0.6, 'Schwingender ' + what + ' mit flachen Schuhen – leicht und lässig');
      if (skirt.typeDef.knitDress && (tall || ankle)) add(1, 'Strickkleid mit Stiefeln – ein Herbst-Klassiker');
    }
    if (st === 'overknees') {
      if (C.occasion.id === 'arbeit') add(-2, 'Overknees sind fürs Büro zu gewagt');
      else if (C.occasion.id === 'elegant') add(-1, null);
    }
    if (sd.chunky && C.occasion.id === 'elegant') add(-2, 'Schwere Boots passen nicht zum festlichen Anlass');
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
      figur: FIGURES[profile.figur] ? profile.figur : null, petite: parseInt(profile.height, 10) > 0 && parseInt(profile.height, 10) < 160,
      gender: profile.gender || '', needColor: profile.colorDot !== false && profile.colorDot !== 'aus',
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
      if (it.fHi < occ.lo - (occ.shoeStrict ? 0 : 0.8)) return false;
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
      if (it.fHi < occ.lo - 1.2) return false;
      if (it.warmth >= 5 && C.tMin > 12) return false;
      if (it.warmth >= 4 && C.tMin > 17) return false;
      return true;
    }
    if (t.slot === 'insert') return true;
    if (t.knitDress && C.tMax > 18) return false;                    // Strickkleid nur an kühlen Tagen
    if (it.fHi < occ.lo - 0.3 || it.fLo > occ.hi + 0.7) return false;
    if (t.evening && !['party', 'elegant'].includes(occ.id)) return false;      // Abendkleid nur abends
    if (t.crop && occ.id === 'arbeit') return false;
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
      const sleeveAdj = it => !it || !it.typeDef.sleevesEdit ? 0 : ({ ohne: -0.5, kurz: -0.3 }[sleevesOf(it)] || 0);
      const inner = upper.warmth + sleeveAdj(upper) + (neckOf(upper) === 'rollkragen' && upper.type !== 'rollkragen' ? 0.4 : 0) + (o.under && o.under.typeDef.slot !== 'insert' ? o.under.warmth * 0.7 : 0) + (o.mid ? o.mid.warmth * 0.8 : 0) + (o.layer ? o.layer.warmth * 0.7 : 0);
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
      const lb = legs.typeDef.dress ? Math.min(legs.warmth, ['midi', 'maxi'].includes(lengthOf(legs)) ? 3 : 2) : legs.warmth;   // ein Kleid wärmt vor allem oben
      const eff = !o.legs ? lb : bare ? Math.max(lb, lw * 0.9) + Math.min(lb, lw) * 0.4 : lb + lw * 0.5;
      const diff = eff - target;
      if (bare && C.hasLegs && diff < -0.5) add(-2.5 * (-diff - 0.5), 'Beine eher zu luftig angezogen');   // nackte Beine kühlen schneller aus
      else if (Math.abs(diff) > 0.8) { const pen = 1.3 * (Math.abs(diff) - 0.8); add(-pen, pen >= 1.5 ? (diff < 0 ? 'Beine eher zu luftig angezogen' : (o.legs ? 'Unten herum eher zu warm' : 'Hose eher zu warm')) : null); }
      const opaque = o.legs && lw >= (C.tMax < 10 ? 3 : 2);
      if (isShortIt(legs) && C.tMax < 18) {
        if (opaque) add(0.5, (o.legs.type === 'leggings' ? 'Leggings drunter' : 'Blickdichte Strumpfhose') + ' – so geht kurz auch bei Kühle');
        else add(-2.5, 'Kurz geschnitten bei unter 18 °C');
      }
      if (legs.typeDef.needLegs && !o.legs) add(C.hasLegs || C.hasLeggings ? -3 : -0.5, 'Unter das Strickkleid gehört eine Strumpfhose oder Leggings');
      else if (bare && !o.legs && C.tMax < 14 && C.hasLegs) add(-1.5, 'Bei der Kühle besser mit Strumpfhose');
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
        shoeCutRules(o, C, add);
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
    const face = (o.under && (o.onepiece || o.under.typeDef.slot === 'insert')) ? o.under : ((o.mid && o.mid.typeDef.knit && !isOpenLayer(o.mid)) ? o.mid : (o.onepiece || o.top));
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
    // Farbtupfer: nicht nur Schwarz, Weiß und Grau (Einstellung im Profil)
    if (C.needColor && !all.concat(legsVisible(o) ? [o.legs] : []).some(colorDot)) add(-2, NO_COLOR);
    // gelernte Farbpaare
    const mcols = [...new Set(main.map(i => prim(i).id))];
    for (let i = 0; i < mcols.length; i++) for (let j = i + 1; j < mcols.length; j++) {
      const v = C.learn.colorPairs[pairKey(mcols[i], mcols[j])];
      if (v) add(v, v < 0 ? 'Diese Farbkombi mochtest du nicht' : null);
    }

    // --- Anlass
    // Wirkung: prägende Teile bestimmen den Look, wandelbare passen sich an
    const lookItems = main.concat(o.shoes ? [o.shoes] : [], o.outer ? [o.outer] : []);
    const L = lookLevel(lookItems, o.outer);
    const fd = Math.abs(L - occ.target);
    if (fd < 0.5) add(1, 'Passt zum Anlass ' + occ.name); else add(-2.2 * (fd - 0.5), fd > 1 ? (L < occ.target ? 'Etwas zu lässig für ' + occ.name : 'Etwas zu schick für ' + occ.name) : null);
    // Teile, die nicht zur Gesamtwirkung passen (z. B. Jogginghose zum Blazer)
    const misfits = [];
    for (const it of lookItems) {
      const d = L < it.fLo ? it.fLo - L : L > it.fHi ? L - it.fHi : 0;
      if (d > 0.5) misfits.push([it, d, L < it.fLo ? 'schick' : 'lässig']);
    }
    for (const [it, d, dir] of misfits) add(-2.5 * (d - 0.5) * (it === o.outer ? 0.5 : 1), d > 0.9 ? shortType(it) + ' wirkt zu ' + dir + ' für den Rest' : null);
    // --- Anlass-Profile: was Alltag, Arbeit, Party und Elegant unterscheidet
    const matTag = (i, tag) => (i.materials || []).some(m => ((MATERIALS[m] || {}).tags || []).includes(tag));
    const hasMat = (i, ms) => (i.materials || []).some(m => ms.includes(m));
    const heels = !!(o.shoes && heelOf(o.shoes) !== 'flach');
    const highHeels = !!(o.shoes && heelOf(o.shoes) === 'hoch');
    const miniOn = (o.bottom && o.bottom.typeDef.skirt && lengthOf(o.bottom) === 'mini') || (o.onepiece && lengthOf(o.onepiece) === 'mini');
    const sleeveless = !o.mid ? [o.onepiece, o.top].find(i => i && sleevesOf(i) === 'ohne') : null;
    // Was man sieht: ein Oberteil unter einem geschlossenen Pullover zählt nicht als Hingucker
    const seen = all.filter(i => !(i === o.top && o.mid && !isOpenLayer(o.mid)) && !(i === o.under && i.typeDef.slot !== 'insert'));
    if (occ.id === 'alltag') {
      if (all.some(i => hasMat(i, ['pailletten']))) add(-3, 'Pailletten sind eher etwas für den Abend');
      else if (main.some(i => hasMat(i, ['satin', 'samt']) || prim(i).groups.includes('metall'))) add(-1, 'Glanz wirkt tagsüber schnell zu festlich');
      if (highHeels) add(-1.5, 'Hohe Absätze sind im Alltag unpraktisch');
      else if (o.shoes && ['sneaker', 'loafer', 'ballerinas', 'stiefeletten', 'derby', 'sandalen', 'stiefel'].includes(o.shoes.type)) add(0.6, null);
    }
    if (occ.id === 'arbeit') {
      if (o.top && o.top.typeDef.traeger && !o.mid) add(-5, 'Trägertop bei der Arbeit nur mit Jacke darüber');
      if (o.onepiece && o.onepiece.typeDef.traeger && !o.mid && !o.under) add(-4, 'Trägerkleid bei der Arbeit nur mit Shirt darunter oder Jacke darüber');
      else if (sleeveless && !sleeveless.typeDef.traeger && !o.mid) add(occ.shoeStrict ? -2.5 : -1, 'Ärmellos im Büro besser mit Blazer oder Strickjacke darüber');
      if (miniOn) add(occ.shoeStrict ? -3 : -1.5, 'Mini ist im Büro heikel');
      if (main.some(i => ['print', 'animal'].includes(i.pattern))) add(occ.shoeStrict ? -3 : -1.5, 'Auffälliger Print fürs Büro');
      if (all.some(i => hasMat(i, ['pailletten']))) add(-3, 'Pailletten sind fürs Büro zu festlich');
    }
    if (occ.id === 'party') {
      // Hingucker, gewichtet: Glanz und Metallic zählen mehr als eine kräftige Farbe
      const cloth = seen.filter(i => i !== o.outer && i !== o.shoes);
      const sig = [];
      if (cloth.some(i => matTag(i, 'party') || hasMat(i, ['leder', 'kunstleder']))) sig.push(1.2);
      if (cloth.some(i => prim(i).groups.includes('metall'))) sig.push(1.2);
      if (cloth.some(i => (PATTERNS[i.pattern] || PATTERNS.uni).bold >= 1)) sig.push(0.8);
      if (cloth.some(i => prim(i).groups.includes('kraeftig'))) sig.push(0.7); else if (cloth.some(i => ['bordeaux', 'petrol', 'rot'].includes(prim(i).id))) sig.push(0.4);
      if ((o.top && (o.top.typeDef.traeger || o.top.type === 'body') && !o.mid) || (o.onepiece && o.onepiece.typeDef.traeger) || miniOn || sleeveless) sig.push(1);
      if (heels) sig.push(highHeels ? 1 : 0.7); else if (o.shoes && (o.shoes.typeDef.boot && !o.shoes.typeDef.chunky)) sig.push(0.4);
      const party = sig.reduce((a, b) => a + b, 0);
      if (party >= 1) add(Math.min(3.5, 1 + party), 'Mit Hingucker für die Party');
      else if (party > 0) add(-1.5, 'Für eine Party fehlt ein echter Hingucker');
      else add(-3, 'Für eine Party fehlt ein Hingucker');
      if (o.shoes && ['loafer', 'derby', 'ballerinas', 'sneaker'].includes(o.shoes.type)) add(-0.5, null);
      if (o.outer && ['regenjacke', 'parka', 'winterjacke'].includes(o.outer.type) && !C.rain) add(-1, 'Für den Abend lieber Mantel oder Lederjacke');
      if (o.bottom && o.bottom.type === 'jeans' && party < 1.5) add(-1, 'Jeans brauchen zur Party ein glänzendes oder auffälliges Oberteil');
      const office = hasBlazer(o) && o.bottom && ['stoffhose', 'chino', 'weitehose'].includes(o.bottom.type) || (o.mid && !isOpenLayer(o.mid) && o.top && hasCollar(o.top));
      if (office && party < 1.5) add(-2, 'Wirkt eher nach Büro als nach Party');
      const everyday = o.top && ['tshirt', 'langarm', 'sweatshirt', 'hoodie', 'polo'].includes(o.top.type) && !o.mid && o.shoes && ['sneaker', 'laufschuhe'].includes(o.shoes.type);
      if (everyday && party < 1.5) add(-2.5, 'Wirkt zu alltäglich für eine Party');
      if (all.some(i => i.typeDef.knit && !i.typeDef.knitDress && i.warmth >= 4)) add(-1, 'Dicker Strick wirkt für den Abend zu gemütlich');
      if (all.some(i => i.typeDef.sporty)) add(-3, 'Sportliches passt nicht zur Party');
      if (o.mid && ['overshirt', 'cardigan', 'sweatjacke', 'longcardigan'].includes(o.mid.type)) add(-1, shortType(o.mid) + ' wirkt abends schnell zu gemütlich');
      if (o.shoes && o.shoes.type === 'sneaker' && !C.styleIds.some(id => ['streetwear', 'casual', 'sportlich'].includes(id))) add(-0.8, 'Zur Party lieber Stiefeletten oder Absatz');
    }
    if (occ.id === 'elegant') {
      if (o.onepiece && o.onepiece.typeDef.dress && !o.onepiece.typeDef.knitDress) add(1.5, 'Kleid für den eleganten Anlass');
      const bl = [o.mid, o.layer].find(i => i && i.type === 'blazer');
      if (bl && (o.bottom || o.onepiece) && prim(bl).id === prim(o.bottom || o.onepiece).id) add(1.5, 'Anzug- oder Kostüm-Look – passend zum festlichen Anlass');
      if (main.some(i => matTag(i, 'fine'))) add(1, 'Edles Material');
      if (main.some(i => ['print', 'animal'].includes(i.pattern))) add(-1.5, 'Für festliche Anlässe lieber ruhige Muster');
      if (all.some(i => i.typeDef.knit && i.warmth >= 4)) add(-1.5, 'Grober Strick ist für festliche Anlässe zu rustikal');
      else if (main.some(i => (i.typeDef.knit || i.type === 'cardigan') && !hasMat(i, ['kaschmir', 'seide', 'merino']) && !(i === o.top && o.mid && !isOpenLayer(o.mid)))) add(-0.8, 'Strick wirkt festlich schnell zu gemütlich – lieber Blazer oder Feinstrick');
      if (miniOn) add(-1.5, 'Mini ist für festliche Anlässe zu kurz');
      if (main.some(i => hasMat(i, ['leder', 'kunstleder']))) add(-1, 'Leder wirkt eher rockig als festlich');
      if (legsVisible(o) && o.legs.warmth >= 3 && !UNBUNT.has(prim(o.legs).id)) add(-0.8, null);
      if (o.shoes && ['stiefeletten', 'stiefel'].includes(o.shoes.type) && C.tMax >= 5) add(-0.5, null);
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
      const cut = legCutOf(lb), form = lb.typeDef.skirt ? shapeOf(lb) : null;
      const lowW = (cut === 'roehre' || form === 'eng') ? 'eng' : (wideLeg(lb) || form === 'weit') ? 'weit' : lb.fit;
      const upW = (o.mid && !isOpenLayer(o.mid)) ? o.mid.fit : ub.fit;
      if (upW === 'weit' && lowW === 'weit') add(-2.5, 'Weit zu weit wirkt schnell formlos');
      else if ((upW === 'weit' && lowW === 'eng') || (upW === 'eng' && lowW === 'weit')) add(1.5, 'Weit trifft schmal – ausgewogene Silhouette');
      if (cut === 'schlag' && upW !== 'weit' && !o.mid) add(0.4, null);
    }
    const denims = all.filter(i => i.typeDef.denim || (i.materials || []).includes('denim')).length;
    if (o.mid && o.mid.typeDef.knit && o.top && hasCollar(o.top)) add(1, 'Kragen unter dem Pullover');
    if (o.top && o.top.typeDef.hood && hasBlazer(o)) add(-2, null);

    // --- Allgemeine Stylisten-Regeln
    // Muster mischen: nie zweimal dasselbe Muster, und nur mit gemeinsamer Farbe
    const pats = main.filter(i => (PATTERNS[i.pattern] || PATTERNS.uni).bold >= 0.5 && !(i === o.top && o.mid && !isOpenLayer(o.mid)));
    if (pats.length >= 2) {
      const [a, b] = pats, shared = (a.colors || []).some(c => (b.colors || []).includes(c));
      if (a.pattern === b.pattern) add(-1.5, 'Zweimal ' + PATTERNS[a.pattern].name.toLowerCase() + ' wirkt unruhig – Muster lieber mischen');
      else if (!shared) add(-1.5, 'Zwei Muster ohne gemeinsame Farbe wirken zusammengewürfelt');
      else add(0.8, 'Mustermix mit gemeinsamer Farbe');
    }
    // Haut zeigen: entweder Bein oder Schulter
    const showsLeg = (o.bottom && (o.bottom.type === 'shorts' || (o.bottom.typeDef.skirt && lengthOf(o.bottom) === 'mini'))) || (o.onepiece && lengthOf(o.onepiece) === 'mini');
    const showsTop = !o.mid && [o.top, o.onepiece].some(i => i && (i.typeDef.traeger || i.typeDef.crop || sleevesOf(i) === 'ohne'));
    if (showsLeg && showsTop && !(legsVisible(o) && o.legs.warmth >= 3)) add(['arbeit', 'elegant'].includes(occ.id) ? -2 : occ.id === 'party' ? -0.6 : -1, 'Entweder Bein oder Schulter zeigen – beides zugleich ist zu viel');
    // Weit über weit
    if ([o.top, o.mid, o.layer].filter(i => i && i.fit === 'weit').length >= 2) add(-1, 'Weit über weit – die Silhouette verschwindet');
    // Lange Oberteile und lange Lagen über schmalem Unterteil
    const lowPiece = o.bottom || null, slimLow = lowPiece && (legCutOf(lowPiece) === 'roehre' || (lowPiece.typeDef.skirt && shapeOf(lowPiece) === 'eng'));
    if (o.top && o.top.typeDef.long) {
      if (slimLow) add(1, shortType(o.top) + ' über schmalem Unterteil – ausgewogen');
      else if (lowPiece && (wideLeg(lowPiece) || (lowPiece.typeDef.skirt && lengthOf(lowPiece) !== 'mini'))) add(-1.5, shortType(o.top) + ' zu weitem oder langem Unterteil wirkt formlos');
    }
    const longMid = [o.mid, o.layer].find(i => i && i.typeDef.long);
    if (longMid) {
      if (slimLow) add(0.8, 'Lange Lage über schmalem Unterteil – streckt');
      else if ((o.onepiece && lengthOf(o.onepiece) === 'maxi') || (lowPiece && lowPiece.typeDef.skirt && lengthOf(lowPiece) === 'maxi')) add(-0.8, 'Lange Lage und Maxilänge – zu viel Länge');
    }
    if (o.outer && o.outer.typeDef.vestOuter) {
      if (hasBlazer(o)) add(-2, 'Steppweste über dem Sakko passt nicht');
      const arm = o.layer || o.mid || o.top || o.onepiece;
      if (arm && sleevesOf(arm) && sleevesOf(arm) !== 'lang' && C.tMin < 15) add(-1.2, 'Unter der Steppweste lange Ärmel – sonst frieren die Arme');
    }
    if (parts.inner && o.onepiece && o.onepiece.typeDef.overall && !o.under) add(-6, 'Unter die Latzhose gehört ein Oberteil');
    if (o.mid || o.layer) add(0.4, null);                                    // drittes Teil macht das Outfit fertig

    // --- Ärmel, Kragen und kratzige Stoffe
    if (parts.inner) {
      if (o.top && o.top.type === 'hemd' && sleevesOf(o.top) !== 'lang' && hasBlazer(o)) add(-2, 'Kurzärmliges Hemd unter dem Sakko gilt als Stilbruch');
      if (o.under && o.under.typeDef.slot === 'insert') add(0.6, 'Blusenkragen schaut heraus – wirkt wie eine Bluse, ohne aufzutragen');
      if (o.mid && o.mid.typeDef.knit && neckOf(o.mid) === 'v' && o.top && hasCollar(o.top)) add(0.5, 'V-Ausschnitt zeigt den Kragen darunter');
      if (o.top && o.top.typeDef.crop && o.mid && !isOpenLayer(o.mid)) add(-1, null);
      const realUnder = o.under && o.under.typeDef.slot !== 'insert' ? o.under : null;
      const skin = realUnder || o.onepiece || o.top;                          // liegt direkt auf der Haut
      if (skin && isScratchy(skin)) add(C.hasBase ? -3 : -1.5, 'Kratzige Wolle direkt auf der Haut – ein dünnes Langarmshirt gehört drunter');
      else if (realUnder && isScratchy(o.onepiece || o.top)) add(1.2, 'Dünne Lage unter der Wolle – nichts kratzt');
      if (o.mid && isScratchy(o.mid)) {
        const inner = realUnder || o.top || o.onepiece, sl = inner && sleevesOf(inner);
        if (sl && sl !== 'lang') add(isOpenLayer(o.mid) ? -1 : -1.5, 'Unter kratziger Wolle besser lange Ärmel');
        else if (sl === 'lang' && !isScratchy(inner) && !isOpenLayer(o.mid)) add(1, 'Lange Ärmel unter dem Wollpullover – nichts kratzt');
      }
    }

    // --- Figurtyp (A, V, H, X, O) und Körpergröße
    if (C.figur) figureRules(o, C, add);

    // --- Lagen (Layering): dünn innen, dicker außen; schmal über weit geht nicht
    const stack = o.onepiece ? [o.under, o.onepiece, o.mid].filter(Boolean) : [o.top, o.mid, o.layer].filter(Boolean);
    for (let i = 0; i + 1 < stack.length; i++) {
      const inn = stack[i], out = stack[i + 1];
      if (inn === o.onepiece || out === o.onepiece) continue;
      if (inn.warmth >= out.warmth + 2 && isOpenLayer(out)) add(-1.2, 'Dickes Teil unter dünnerer Lage trägt auf');
      if (inn.fit === 'weit' && out.fit === 'eng') add(-1.5, 'Weites Teil unter enger Lage – passt kaum drunter');
    }
    if (o.mid && o.mid.typeDef.vest && o.top && hasCollar(o.top)) add(0.8, 'Pullunder über Hemd oder Bluse');
    if (o.mid && o.mid.typeDef.slot === 'top' && o.mid.typeDef.layerOk) {
      if (occ.id === 'elegant') add(-2.5, 'Offenes Hemd über Shirt ist zu lässig für Elegant');
      else if (occ.id === 'arbeit' && occ.shoeStrict) add(-1.5, 'Offenes Hemd über Shirt ist zu lässig fürs Büro');
      else add(0.5, null);
    }
    if (o.under && o.onepiece && !o.onepiece.typeDef.knitDress && !o.onepiece.typeDef.overall) {
      if (C.tMax <= 16) add(1.2, shortType(o.under) + (o.onepiece.typeDef.traeger ? ' unter dem Trägerkleid' : ' unter dem ärmellosen Kleid') + ' – macht es kältetauglich');
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
      if (denims >= 2) {
        const dn = all.filter(i => i.typeDef.denim || (i.materials || []).includes('denim'));
        const same = new Set(dn.map(i => prim(i).id)).size < dn.length;
        if (same) { sc -= 2; why.push([-2, 'Jeans zu Jeans im gleichen Ton wirkt wie aus Versehen']); }
        else if (!s.denimOk) { sc -= 2.5; why.push([-2.5, 'Denim zu Denim nur ganz bewusst']); }
        else { sc += 0.6; why.push([0.6, 'Denim zu Denim in zwei Waschungen']); }
      }
      // Ein Statement-Teil genügt (außer in mutigen Stilen)
      if (!s.manyStatements && s.id !== 'italienisch') { const n = statementCount(o); if (n >= 2) { sc -= 1.2 * (n - 1); why.push([-1.2 * (n - 1), 'Zwei Hingucker konkurrieren – ein Statement-Teil reicht']); } }
      if (s.oversizeOk && [o.top, o.mid, o.layer].filter(i => i && i.fit === 'weit').length >= 2) sc += 1;
      if (o.top && o.top.typeDef.hood && hasBlazer(o) && s === STYLES.streetwear) sc += 2;
      if (s.highLow && misfits.length === 1 && misfits[0][1] <= 1.6 && misfits[0][0] !== o.outer) { sc += 2.5 * (misfits[0][1] - 0.5) + 0.8; why.push([0.8, 'Gewollter Stilbruch: ' + shortType(misfits[0][0]) + ' macht den Look ' + (misfits[0][2] === 'lässig' ? 'lässiger' : 'schicker')]); }
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

    return { score, plus, minus, tips, style: best && best.s !== NO_STYLE ? best.s.name : null, styleId: best ? best.s.id : '', look: L };
  }

  // ---------------------------------------------------------------- Generator
  function prepare(items) {
    return items.map(it => { const [fLo, fHi] = fRange(it); return Object.assign({}, it, { typeDef: TYPES[it.type] || TYPES.sonstiges, fLo, fHi, formality: (fLo + fHi) / 2, warmth: it.warmth || (TYPES[it.type] || {}).w || 2, _c: COLOR[it.colors && it.colors[0]] || COLOR.grau }); });
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
    const inserts = ok.filter(i => i.typeDef.slot === 'insert');
    const overallTops = ok.filter(i => i.typeDef.slot === 'top' && (i.typeDef.base || i.typeDef.knit) && !i.typeDef.crop && !i.typeDef.long).slice(0, 40);
    let outers = bySlot('outer'), shoes = bySlot('shoes');
    let legwear = ok.filter(i => i.typeDef.legLayer);
    const accs = ok.filter(i => i.typeDef.slot === 'acc');
    C.hasOuter = avail.some(i => i.typeDef.slot === 'outer');
    C.hasShoes = avail.some(i => i.typeDef.slot === 'shoes');
    C.hasLegs = legwear.some(i => i.typeDef.slot === 'legs');
    C.hasLeggings = legwear.some(i => i.type === 'leggings');
    C.hasBase = ok.some(thinLong);
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
      else if (s === 'insert') {   // Blusenkragen: unter Pullover, Sweatshirt oder Strickkleid
        for (const t of tops) for (const b of bottoms) { const c = { top: t, bottom: b, under: pinned, _fixUnder: 1 }; if (underFits(pinned, c)) extraCores.push(c); }
        for (const d of ones) { const c = { onepiece: d, under: pinned, _fixUnder: 1 }; if (underFits(pinned, c)) extraCores.push(c); }
        tops = []; ones = [];
        if (!extraCores.length) notes.push('Zum Blusenkragen passt gerade kein Pullover oder Strickkleid.');
      }
      else if (s === 'onepiece') { ones = [pinned]; tops = []; bottoms = []; }
      else if (s === 'mid') { forceMid = pinned; }
      else if (s === 'outer') { forceOuter = pinned; }
      else if (s === 'shoes') { forceShoes = pinned; }
      else if (s === 'acc') { forceAcc = pinned; }
      if (!hardOk(pinned, C)) notes.push(pinned.typeDef.name + ' passt eigentlich nicht zu Wetter oder Anlass – trotzdem eingeplant.');
    }

    // Vorauswahl: nur die passendsten Lagen, Jacken und Schuhe durchprobieren
    const quick = it => {
      const t = it.typeDef, occ = C.occasion; let q = -(occ.target < it.fLo ? it.fLo - occ.target : occ.target > it.fHi ? occ.target - it.fHi : 0);
      if (t.slot === 'outer') { q -= Math.abs(it.warmth - clamp((20 - C.tMin) / 4, 1, 5)); if (C.rain) q += (t.rain || 0) - 1; }
      if (t.slot === 'shoes') { if (C.tMin < t.minT) q -= (t.minT - C.tMin) / 3; if (C.tMax > t.maxT) q -= (C.tMax - t.maxT) / 3; if (C.rain && !t.rain) q -= 2; }
      for (const s of C.styles) if (s.like.types.includes(it.type)) { q += 0.8; break; }
      if (C.favs.includes(prim(it).id)) q += 0.5;
      return q + hash(it.id + C.seed) * 0.6;
    };
    const topN = (arr, n) => arr.length <= n ? arr : arr.map(i => [quick(i), i]).sort((a, b) => b[0] - a[0]).slice(0, n).map(x => x[1]);
    mids = topN(mids, 16); layers = topN(layers, 6); unders = [...new Set(topN(unders, 6).concat(topN(unders.filter(thinLong), 3)))].concat(topN(inserts, 3)); outers = topN(outers, 7); shoes = topN(shoes, 8); legwear = topN(legwear, 6);

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
    const topCores = coreList.slice(0, 80);

    // 2) Lagen, Jacke, Schuhe ergänzen
    const full = [];
    const innerParts = { inner: true, outer: false, shoes: false, tips: false };
    const closedMid = m => m && ((m.typeDef.knit && m.typeDef.overBase) || m.typeDef.vest);
    for (const core of topCores) {
      // a) Shirt unter dem Trägerkleid
      const bases = [core];
      if (!core._fixUnder && underHost(core))
        for (const u of (core.onepiece && core.onepiece.typeDef.overall ? overallTops : unders)) { const o = Object.assign({}, core, { under: u }); if (underFits(u, o)) bases.push(o); }
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
    const waist = ['X', 'H'].includes(C.figur) && C.gender !== 'm' && (o.onepiece ? o.onepiece.typeDef.dress && !o.onepiece.typeDef.knitDress || o.onepiece.typeDef.knitDress : true);
    if (loops && !has('guertel') && C.figur !== 'O') {
      const b = best(of('guertel').filter(g => g.fHi >= C.occasion.lo - 0.5), a => shoeCol ? (prim(a).id === shoeCol ? 3 : fam(prim(a).id) === fam(shoeCol) ? 2 : -2) : 0);
      if (b && b[0] >= (waist ? 0 : 2)) add(b, waist ? 'Gürtel betont die Taille' : shoeCol && fam(prim(b[1]).id) === fam(shoeCol) ? 'Gürtel passt zu den Schuhen' : null);
    }
    if (C.gender === 'm' && o.top && hasCollar(o.top) && o.top.type === 'hemd' && hasBlazer(o) && (C.occasion.id === 'elegant' || (C.occasion.id === 'arbeit' && C.occasion.shoeStrict)) && !has('krawatte'))
      add(best(of('krawatte')), 'Krawatte zum Sakko');
    if (['romantisch', 'preppy', 'vintage'].includes(sty) && !has('haarschmuck') && !has('muetze') && !has('hut') && accentRoom() && C.occasion.id !== 'arbeit') {
      const b = best(of('haarschmuck')); if (b && b[0] >= 1) add(b, 'Haarschmuck als verspieltes Detail');
    }
    if (!has('tasche')) {
      const occ = C.occasion;
      const bags = of('tasche').filter(a => a.fHi >= occ.lo - 0.5 && a.fLo <= occ.hi + 0.5 && !(sty === 'italienisch' && a.pattern === 'print'));
      const b = best(bags, a => (shoeCol && fam(prim(a).id) === fam(shoeCol) ? 1.5 : 0) + (elegant.includes(sty) && mats(a).includes('leder') ? 1 : 0));
      add(b, b && shoeCol && fam(prim(b[1]).id) === fam(shoeCol) ? 'Tasche und Schuhe aufeinander abgestimmt' : null);
    }
    if ((['arbeit', 'party', 'elegant'].includes(C.occasion.id) || ['italienisch', 'chic', 'romantisch', 'boho'].includes(sty)) && !has('schmuck') && accentRoom()) {
      const metal = a => prim(a).id === 'gold' ? 'gold' : prim(a).id === 'silber' ? 'silber' : null;
      const b = best(of('schmuck'), a => (C.metalPref && metal(a) === C.metalPref ? 2 : 0) + (sty === 'italienisch' && metal(a) === 'gold' ? 1 : 0));
      add(b, b && C.metalPref && metal(b[1]) === C.metalPref ? (C.metalPref === 'gold' ? 'Goldschmuck passt zu deinem Typ' : 'Silberschmuck passt zu deinem Typ') : null);
    }
    const DOT_SUBS = ['tuch', 'schal', 'tasche', 'muetze', 'hut', 'guertel', 'einstecktuch', 'handschuhe'];
    const dotAcc = a => DOT_SUBS.includes(a.typeDef.sub) && colorDot(a);
    if (C.needColor && !worn.concat(legsVisible(o) ? [o.legs] : []).some(colorDot) && !res.some(dotAcc)) {
      const cands = accs.filter(a => dotAcc(a) && a !== forceAcc && !(a.typeDef.sub === 'schal' && C.tMin >= 15) && !(['muetze', 'handschuhe'].includes(a.typeDef.sub) && C.tMin >= 8)
        && !(a.typeDef.sub === 'einstecktuch' && !hasBlazer(o)) && !(a.typeDef.sub === 'guertel' && !loops) && !(a.typeDef.sub === 'hut' && a.warmth >= 3 && C.tMin >= 8));
      const b = best(cands, a => ({ tuch: 1, schal: 0.8, tasche: 0.6 }[a.typeDef.sub] || 0));
      if (b && b[0] > -2) {
        const i = res.findIndex(x => x.typeDef.sub === b[1].typeDef.sub); if (i >= 0) res.splice(i, 1);
        res.push(b[1]); why.unshift('Farbtupfer: ' + shortType(b[1]) + ' in ' + prim(b[1]).name);
      }
    }
    return { list: res, why };
  }

  function finish(o, ev, C, accWhy) {
    const slots = {};
    for (const s of ORDER) if (o[s]) slots[s] = o[s].id;
    const uniq = arr => { const seen = new Set(); return arr.filter(([, w]) => w && !seen.has(w) && seen.add(w)); };
    const dotByAcc = (o.acc || []).some(a => colorDot(a) && a.typeDef.sub !== 'schmuck' && a.typeDef.sub !== 'sonnenbrille');
    const plus = uniq(ev.plus.slice().sort((a, b) => b[0] - a[0])).slice(0, 3).map(x => x[1]).concat((accWhy || []).slice(0, 1));
    const minus = uniq(ev.minus.slice().sort((a, b) => a[0] - b[0])).filter(x => x[0] <= -1.5 && !(dotByAcc && x[1] === NO_COLOR)).slice(0, 2).map(x => x[1]);
    const warn = [];
    if ((C.tMin < 17 || C.rain) && !o.outer && !C.hasOuter) warn.push('Keine Jacke im Schrank – denk an eine Jacke.');
    if (!o.shoes && !C.hasShoes) warn.push('Noch keine Schuhe im Schrank.');
    const stackS = (o.onepiece ? ['under', 'onepiece', 'mid'] : ['under', 'top', 'mid', 'layer']).concat(['outer']).filter(s => o[s]);
    const layers = stackS.length >= 3 ? stackS.map(s => (s === 'mid' && o.mid.typeDef.slot === 'top' && o.mid.typeDef.layerOk) ? shortType(o.mid) + ' (offen)' : shortType(o[s])) : [];
    const tips = (ev.tips || []).slice();
    if (!o.legs && o.onepiece && o.onepiece.typeDef.needLegs && !C.hasLegs && !C.hasLeggings) tips.unshift('Unter das Strickkleid gehört eine Strumpfhose oder Leggings. Erfasse sie im Schrank, dann plane ich sie mit ein.');
    else if (!o.legs && bareLegs(o.bottom || o.onepiece) && C.tMax < 14 && !C.hasLegs) tips.unshift('Bei der Kühle eine blickdichte Strumpfhose drunter. Erfasse deine Strumpfhosen im Schrank, dann plane ich sie mit ein.');
    const skinIt = (o.under && o.under.typeDef.slot !== 'insert') ? o.under : (o.onepiece || o.top);
    if (skinIt && isScratchy(skinIt) && !C.hasBase) tips.unshift('Unter ' + shortType(skinIt) + ' aus kratziger Wolle ein dünnes Langarmshirt ziehen. Erfasse eins im Schrank, dann plane ich es mit ein.');
    if (C.needColor && !dotByAcc && ev.minus.some(x => x[1] === NO_COLOR)) tips.push('Ein Farbtupfer fehlt: ein Tuch, ein Schal oder eine Tasche in Camel, Cognac, Bordeaux oder Dunkelblau.');
    const thirdAcc = (o.acc || []).some(a => ['guertel', 'tuch', 'schal', 'einstecktuch'].includes(a.typeDef.sub));
    if (!o.mid && !o.layer && !o.outer && !thirdAcc && !o.onepiece) tips.push('Ein drittes Teil – Gürtel, Tuch oder eine leichte Jacke über den Schultern – macht das Outfit komplett.');
    if ([o.top, o.onepiece].some(i => i && neckOf(i) === 'rollkragen') && (o.acc || []).some(a => a.typeDef.sub === 'schmuck')) tips.push('Zum Rollkragen eine lange Kette statt einer kurzen.');
    if (o.top && o.top.typeDef.crop) tips.unshift('Zum kurzen Oberteil eine Hose oder einen Rock mit hohem Bund – so bleibt die Proportion stimmig.');
    return { slots, acc: (o.acc || []).map(a => a.id), score: Math.round(ev.score * 10) / 10, plus, minus, warn, tips: tips.slice(0, 2), style: ev.style, coreKey: coreKey(o), key: fullKey(o), layers, look: ev.look != null ? lookName(ev.look) : null };
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
    C.hasLeggings = all.some(i => i.type === 'leggings' && (i.status || 'verfuegbar') === 'verfuegbar');
    C.hasBase = all.some(i => thinLong(i) && (i.status || 'verfuegbar') === 'verfuegbar');
    C.likedKeys = new Set(((opts && opts.rated) || []).filter(r => r.rating > 0).map(r => r.coreKey));
    const avail = all.filter(i => (i.status || 'verfuegbar') === 'verfuegbar' && hardOk(i, C));
    let cands;
    if (slot === 'mid') cands = avail.filter(i => i.typeDef.slot === 'mid' || (i.typeDef.knit && i.typeDef.overBase) || i.typeDef.layerOk);
    else if (slot === 'layer') cands = avail.filter(i => i.typeDef.slot === 'mid' && i.typeDef.open && !i.typeDef.vest);
    else if (slot === 'under') cands = avail.filter(i => (i.typeDef.underOk && i.warmth <= 3) || i.typeDef.slot === 'insert' || (base.onepiece && base.onepiece.typeDef.overall && i.typeDef.slot === 'top'));
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
    if (a.fHi < b.fLo - 0.5 || b.fHi < a.fLo - 0.5) return false;
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
  const MEN_UNUSUAL = new Set(['bluse', 'top', 'body', 'rock_kurz', 'rock_lang', 'kleid_kurz', 'kleid_lang', 'traegerkleid', 'strumpfhose', 'strickkleid', 'kragen', 'ballerinas', 'slingbacks', 'pumps', 'sandaletten', 'schmuck', 'leggings']);
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
    const v = { id: 'v_' + type + '_' + color, type, typeDef: t, colors: [color], pattern: 'uni', materials: mats || [], fit: 'normal', warmth: clamp(t.w || 2, 1, 5), status: 'verfuegbar' };
    const [fLo, fHi] = fRange(v); return Object.assign(v, { fLo, fHi, formality: (fLo + fHi) / 2, _c: COLOR[color] || COLOR.grau });
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
    if (all.some(i => ['top', 'onepiece'].includes(slotOf(i)) && i.typeDef.knit && isScratchy(i)) && !has(thinLong))
      R('wx-base', 2, 'wetter', 'langarm', ['weiss', 'creme', 'schwarz', 'grau'], 'Dünnes Langarmshirt zum Drunterziehen',
        'Damit Wollpullover und Strickkleider nicht auf der Haut kratzen. Am besten schmal geschnitten aus Baumwolle, Modal oder Seide.', { warmth: 1 });
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
        if (gender === 'w' && t === 'hemd' && TYPES.bluse) { const vb = virtualItem('bluse', firstNeutral); if (hardOk(vb, C) && rangeDist(vb, C.occasion.target) <= 0.8) return 'bluse'; }
        if (slot === 'shoes' && (TYPES[t].minT > C.tMin + 3 || TYPES[t].maxT < C.tMax - 3)) continue;
        const v = virtualItem(t, firstNeutral);
        if (hardOk(v, C) && rangeDist(v, C.occasion.target) <= 0.8) return t;
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
    detectColors, nearestColor, parseLabel, review, gaps, partnerInfo, CONDITION, ESSENTIALS, styleRules, colorRel, TIGHTS,
    LEG_CUTS, LENGTHS, SKIRT_SHAPES, SLEEVES, legCutOf, lengthOf, shapeOf, sleevesOf, hasCollar, isScratchy, scratchyDefault,
    NECKS, HEELS, neckOf, heelOf, VIBES, vibeOf, fRange, FIGURES, INFO, STYLE_IMG, buildContext, generate, alternatives, summarizeWeather, WEATHER_TEXT, WEATHER_ICON, learnFrom, coreKey, seasonOf };
  root.Engine = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof self !== 'undefined' ? self : this);
