/* Mein Kleiderschrank – Oberfläche. Alle Daten bleiben auf dem Gerät (IndexedDB). */
(() => {
  'use strict';
  const E = window.Engine;
  const app = document.getElementById('app');
  const sheetsEl = document.getElementById('sheets');
  const toastRoot = document.getElementById('toast-root');

  // ------------------------------------------------------------ Hilfen
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const pad = n => String(n).padStart(2, '0');
  const localDate = d => { d = d || new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  const addDays = n => { const d = new Date(); d.setDate(d.getDate() + n); return localDate(d); };
  const WD = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  const MON = ['Jan.', 'Feb.', 'März', 'Apr.', 'Mai', 'Juni', 'Juli', 'Aug.', 'Sep.', 'Okt.', 'Nov.', 'Dez.'];
  const MON_LONG = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  const fmtDate = (iso, wd) => { const d = new Date(iso + 'T12:00:00'); return (wd === false ? '' : WD[d.getDay()] + '., ') + d.getDate() + '. ' + MON[d.getMonth()]; };
  const deg = v => { const r = Math.round(v); return (r < 0 ? '−' : '') + Math.abs(r); };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const typeOf = it => E.TYPES[it.type] || E.TYPES.sonstiges;
  const colorOf = id => E.COLOR[id] || E.COLOR.grau;
  const itemLabel = it => typeOf(it).name + ', ' + colorOf(it.colors && it.colors[0]).name;
  const shortName = it => typeOf(it).name.replace(/ \(.*\)/, '').split(' / ')[0];
  const byId = id => S.items.find(i => i.id === id);
  const catOfType = type => { const t = E.TYPES[type]; if (!t) return 'oberteile'; const c = E.CATEGORIES.find(c => c.slots.includes(t.slot)); return c ? c.id : 'accessoires'; };
  const mb = b => (b / 1048576).toFixed(b < 10485760 ? 1 : 0).replace('.', ',') + ' MB';

  // ------------------------------------------------------------ Datenbank
  const DB = (() => {
    let dbp;
    const open = () => dbp || (dbp = new Promise((res, rej) => {
      const r = indexedDB.open('kleiderschrank', 1);
      r.onupgradeneeded = () => { const db = r.result; for (const s of ['items', 'photos', 'outfits', 'history', 'kv']) if (!db.objectStoreNames.contains(s)) db.createObjectStore(s, { keyPath: s === 'kv' ? 'k' : 'id' }); };
      r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
    }));
    const req = r => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
    const tx = async (stores, mode, fn) => {
      const db = await open();
      return new Promise((res, rej) => {
        const t = db.transaction(stores, mode); let out;
        Promise.resolve(fn(t)).then(v => { out = v; }, rej);
        t.oncomplete = () => res(out); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error);
      });
    };
    return {
      all: s => tx(s, 'readonly', t => req(t.objectStore(s).getAll())),
      get: (s, k) => tx(s, 'readonly', t => req(t.objectStore(s).get(k))),
      put: (s, v) => tx(s, 'readwrite', t => { t.objectStore(s).put(v); }),
      putMany: (s, arr) => tx(s, 'readwrite', t => { const st = t.objectStore(s); arr.forEach(v => st.put(v)); }),
      del: (s, k) => tx(s, 'readwrite', t => { t.objectStore(s).delete(k); }),
      clearAll: () => tx(['items', 'photos', 'outfits', 'history', 'kv'], 'readwrite', t => { ['items', 'photos', 'outfits', 'history', 'kv'].forEach(s => t.objectStore(s).clear()); })
    };
  })();
  const saveKV = (k, v) => DB.put('kv', { k, v });

  // ------------------------------------------------------------ Zustand
  const DEFAULT_PROFILE = { age: '', height: '', gender: '', hair: '', skin: '', unterton: '', farbtyp: '', favColors: [], nogoColors: [], styles: [], sensitivity: 'normal', dresscode: 'businesscasual', location: null };
  const S = {
    view: 'outfits', items: [], urls: new Map(), photoBytes: 0, profile: Object.assign({}, DEFAULT_PROFILE), learn: {}, rated: [], history: [], meta: {}, pin: null,
    day: 0, occasion: 'alltag', pinnedId: null, seed: 0, result: null,
    weather: null, weatherState: 'idle', weatherFetched: 0,
    cat: 'alle', status: 'alle', savedTab: 'liked', pinCat: 'alle', city: { q: '', results: null, busy: false },
    smode: 'alle', selMode: false, sel: new Set(), gapHidden: []
  };

  async function load() {
    const [items, photos, rated, history, kv] = await Promise.all([DB.all('items'), DB.all('photos'), DB.all('outfits'), DB.all('history'), DB.all('kv')]);
    S.items = items.sort((a, b) => (b.created || 0) - (a.created || 0));
    for (const p of photos) { S.urls.set(p.id, URL.createObjectURL(p.blob)); S.photoBytes += p.blob.size || 0; }
    S.rated = rated.sort((a, b) => b.created - a.created);
    S.history = history.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.created - a.created));
    const m = Object.fromEntries(kv.map(x => [x.k, x.v]));
    S.profile = Object.assign({}, DEFAULT_PROFILE, m.profile || {});
    S.learn = m.learn || {};
    S.meta = m.meta || {};
    S.pin = m.pin || null;
    S.gapHidden = m.gapHidden || [];
    if (m.weather) { S.weather = m.weather; S.weatherFetched = m.weather.fetched || 0; }
    S.occasion = S.meta.lastOccasion || 'alltag';
  }
  const saveMeta = () => saveKV('meta', S.meta);
  let profileTimer;
  const saveProfile = () => { clearTimeout(profileTimer); profileTimer = setTimeout(() => saveKV('profile', S.profile), 250); };
  const invalidate = () => { S.result = null; };

  // ------------------------------------------------------------ Wetter (Open-Meteo, ohne Konto)
  const getPosition = () => new Promise((res, rej) => {
    if (!navigator.geolocation) return rej(new Error('nogeo'));
    navigator.geolocation.getCurrentPosition(p => res(p.coords), rej, { enableHighAccuracy: false, timeout: 12000, maximumAge: 30 * 60000 });
  });
  async function refreshWeather(force) {
    const loc = S.profile.location;
    if (!loc) { S.weatherState = 'none'; return; }
    const today = localDate();
    const w = S.weather;
    if (!force && w && w.today === today && Date.now() - w.fetched < 3600e3 && (loc.mode === 'gps' || (w.lat === loc.lat && w.lon === loc.lon))) { S.weatherState = 'ok'; return; }
    S.weatherState = 'loading'; if (S.view === 'outfits') rerender();
    try {
      let lat = loc.lat, lon = loc.lon;
      if (loc.mode === 'gps') {
        try { const c = await getPosition(); lat = Math.round(c.latitude * 100) / 100; lon = Math.round(c.longitude * 100) / 100; S.profile.location = Object.assign({}, loc, { lat, lon }); saveProfile(); }
        catch (e) { if (lat == null) throw e; }
      }
      const url = 'https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon +
        '&hourly=temperature_2m,apparent_temperature,precipitation_probability,precipitation&daily=weather_code&timezone=auto&forecast_days=4';
      const r = await fetch(url, { referrerPolicy: 'no-referrer' });
      if (!r.ok) throw new Error('http ' + r.status);
      const days = E.summarizeWeather(await r.json());
      S.weather = { today, fetched: Date.now(), lat, lon, days };
      saveKV('weather', S.weather);
      S.weatherState = 'ok';
    } catch (e) {
      S.weatherState = S.weather && S.weather.days ? 'stale' : 'error';
    }
    invalidate(); if (S.view === 'outfits') rerender();
  }
  const dayWeather = date => S.weather && S.weather.days && S.weather.days.find(d => d.date === date);

  // ------------------------------------------------------------ Vorschläge
  function ctx() {
    const date = addDays(S.day);
    const w = dayWeather(date);
    const C = E.buildContext({ weather: w, profile: S.profile, learn: S.learn, occasion: S.occasion, date });
    C.seed = S.seed;
    return { C, w, date };
  }
  function compute() {
    const { C } = ctx();
    if (S.pinnedId && !byId(S.pinnedId)) S.pinnedId = null;
    S.result = E.generate(S.items, C, { pinnedId: S.pinnedId, rated: S.rated });
    S.result.date = C.date;
  }

  // ------------------------------------------------------------ Bausteine
  const dotsHTML = it => '<span class="dots">' + (it.colors || []).filter(Boolean).map(c => '<span class="dot" style="background:' + colorOf(c).hex + '"></span>').join('') + '</span>';
  function tileHTML(it, o) {
    o = o || {};
    const url = S.urls.get(it.id), t = typeOf(it), c = colorOf(it.colors && it.colors[0]);
    const inner = url ? '<img src="' + url + '" alt=""' + (o.lazy ? ' loading="lazy"' : '') + ' decoding="async">' : '<span aria-hidden="true">' + t.icon + '</span>';
    const bg = url ? '' : ' style="background:' + c.hex + '40"';
    return '<button class="tile ' + (o.cls || '') + '" data-act="' + (o.act || 'noop') + '" ' + (o.data || '') + ' aria-label="' + esc(o.aria || itemLabel(it)) + '"' + (o.selected != null ? ' aria-pressed="' + !!o.selected + '"' : '') + '>' +
      '<span class="img"' + bg + '>' + inner + (o.badge ? '<span class="badge">' + esc(o.badge) + '</span>' : '') + (o.pin ? '<span class="pinmark" title="festgepinnt">📌</span>' : (o.fav && it.fav ? '<span class="favmark" aria-label="Lieblingsteil">♥</span>' : '')) + (o.selected != null ? '<span class="selmark' + (o.selected ? ' on' : '') + '" aria-hidden="true">' + (o.selected ? '✓' : '') + '</span>' : '') + (o.dots ? dotsHTML(it) : '') + '</span>' +
      (o.label === false ? '' : '<span class="lbl">' + esc(o.label || itemLabel(it)) + '</span>') + '</button>';
  }
  const chip = (act, data, label, pressed, extra) => '<button class="chip ' + (extra || '') + '" data-act="' + act + '" ' + data + ' aria-pressed="' + (pressed ? 'true' : 'false') + '">' + label + '</button>';
  const swatchChip = (act, data, cid, pressed) => chip(act, data, '<span class="dot" style="background:' + colorOf(cid).hex + '"></span>' + esc(colorOf(cid).name), pressed, 'swatch');

  // ------------------------------------------------------------ Ansicht: Outfits
  function weatherHTML() {
    const { C, w, date } = ctx();
    const loc = S.profile.location;
    if (!loc) {
      return '<section class="weather" aria-label="Wetter"><div class="wx-main">Wetter einrichten</div><p class="wx-sub">Mit Wettervorhersage passen die Vorschläge zur Temperatur. Bis dahin rechne ich mit typischen Werten für ' + MON_LONG[new Date(date + 'T12:00').getMonth()] + '.</p>' +
        '<div class="wx-setup"><button class="btn tape-btn" data-act="loc-gps">Standort verwenden</button><button class="btn" data-act="go-profile-loc">Ort eingeben</button></div></section>';
    }
    if (S.weatherState === 'loading' && !w) return '<section class="weather"><div class="busy"><span class="spin"></span>Wetter wird geladen</div></section>';
    if (!w) {
      const msg = S.weatherState === 'error' ? 'Das Wetter ließ sich nicht laden. Ich rechne mit typischen Werten für die Jahreszeit.' : 'Für diesen Tag gibt es noch keine Vorhersage. Ich rechne mit typischen Werten.';
      return '<section class="weather"><div class="wx-top"><span class="wx-icon">🌡️</span><div><div class="wx-main">Etwa ' + deg(C.rawMin) + ' bis ' + deg(C.rawMax) + ' °C</div><div class="wx-sub">' + msg + '</div></div></div>' +
        '<div class="wx-setup"><button class="btn" data-act="wx-retry">Erneut laden</button></div></section>';
    }
    const pos = t => clamp((t + 10) / 45 * 100, 0, 100);
    const lo = pos(w.tMin), hi = pos(w.tMax);
    const tips = [];
    if (w.snow) tips.push('Schnee möglich: warme, rutschfeste Schuhe.');
    else if (w.rain) tips.push('Regen: regenfeste Jacke und Schuhe einplanen – oder den Schirm.');
    if (w.feelMax - w.feelMin >= 6 && C.tMin < 16) tips.push('Morgens frisch, später deutlich wärmer – Zwiebellook hilft.');
    if (w.feelMin < 4) tips.push('Schal und Mütze lohnen sich.');
    if (w.feelMax >= 27) tips.push('Heiß: luftige Stoffe wie Leinen oder Baumwolle.');
    const stale = S.weatherState === 'stale' ? '<p class="wx-tips muted">Offline – Stand ' + new Date(S.weather.fetched).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr.</p>' : '';
    const rainTxt = w.rainProb >= 20 ? ', Regenrisiko ' + Math.round(w.rainProb / 10) * 10 + ' %' : '';
    return '<section class="weather" aria-label="Wetter">' +
      '<div class="wx-top"><span class="wx-icon" aria-hidden="true">' + E.WEATHER_ICON(w.code) + '</span><div><div class="wx-main">' + deg(w.tMin) + ' bis ' + deg(w.tMax) + ' °C</div>' +
      '<div class="wx-sub">' + E.WEATHER_TEXT(w.code) + rainTxt + ', gefühlt ' + deg(w.feelMin) + ' bis ' + deg(w.feelMax) + ' °C</div></div></div>' +
      '<div class="tape" role="img" aria-label="Temperaturspanne ' + deg(w.tMin) + ' bis ' + deg(w.tMax) + ' Grad"><span class="range" style="left:' + lo + '%;width:' + Math.max(3, hi - lo) + '%"></span></div>' +
      '<div class="tape-scale" aria-hidden="true"><span style="left:0;transform:none">−10</span><span style="left:22.2%">0</span><span style="left:44.4%">10</span><span style="left:66.7%">20</span><span style="left:88.9%">30</span></div>' +
      (tips.length ? '<p class="wx-tips">' + tips.join(' ') + '</p>' : '') + stale + '</section>';
  }

  function outfitHTML(o, idx) {
    const it = s => o.slots[s] && byId(o.slots[s]);
    const isToday = S.day === 0;
    const liked = S.rated.some(r => r.rating > 0 && r.key === o.key);
    const worn = S.history.some(h => h.date === S.result.date && h.key === o.key);
    const mainS = o.slots.onepiece ? ['onepiece'] : ['top', 'bottom'];
    const main = mainS.map(s => it(s) ? tileHTML(it(s), { act: 'tile', data: 'data-o="' + idx + '" data-slot="' + s + '"', pin: o.slots[s] === S.pinnedId }) : '').join('');
    const extras = ['mid', 'outer', 'shoes'].filter(s => it(s)).map(s => tileHTML(it(s), { act: 'tile', data: 'data-o="' + idx + '" data-slot="' + s + '"', label: shortName(it(s)), pin: o.slots[s] === S.pinnedId, aria: itemLabel(it(s)) }))
      .concat((o.acc || []).map(id => byId(id)).filter(Boolean).map(a => tileHTML(a, { act: 'tile', data: 'data-o="' + idx + '" data-slot="acc" data-id="' + a.id + '"', label: shortName(a), pin: a.id === S.pinnedId, aria: itemLabel(a) }))).join('');
    const why = o.plus.slice(0, 4).map(x => '<li>' + esc(x) + '</li>').join('') + o.minus.map(x => '<li class="neg">' + esc(x) + '</li>').join('') + o.warn.map(x => '<li class="warn">' + esc(x) + '</li>').join('') +
      (o.tips || []).map(x => '<li class="tip"><b>Tipp:</b> ' + esc(x) + '</li>').join('');
    return '<article class="outfit" aria-label="Vorschlag ' + (idx + 1) + '">' +
      '<div class="outfit-top"><span class="n">Vorschlag ' + (idx + 1) + '</span>' + (o.style ? '<span class="style-tag">' + esc(o.style) + '</span>' : '') + '</div>' +
      '<div class="lay-main' + (mainS.length === 1 ? ' one' : '') + '">' + main + '</div>' +
      (extras ? '<div class="lay-extra">' + extras + '</div>' : '') +
      (why ? '<ul class="why">' + why + '</ul>' : '') +
      '<div class="oact' + (isToday ? '' : ' two') + '">' +
      '<button class="btn like" data-act="like" data-o="' + idx + '" aria-pressed="' + liked + '">' + (liked ? '♥ Gemerkt' : '♡ Gefällt mir') + '</button>' +
      '<button class="btn" data-act="dislike" data-o="' + idx + '">Nicht so</button>' +
      (isToday ? '<button class="btn ' + (worn ? '' : 'primary') + '" data-act="worn" data-o="' + idx + '"' + (worn ? ' disabled' : '') + '>' + (worn ? '✓ Getragen' : 'Heute getragen') + '</button>' : '') +
      '</div></article>';
  }

  function backupDue() {
    if (S.items.length < 5) return false;
    const last = S.meta.lastBackup || 0;
    return Date.now() - last > 30 * 864e5;
  }

  function viewOutfits() {
    const days = [0, 1, 2].map(n => { const d = addDays(n); const dt = new Date(d + 'T12:00'); return chip('day', 'data-n="' + n + '"', ['Heute', 'Morgen', 'Übermorgen'][n] + '<small>' + WD[dt.getDay()] + '. ' + dt.getDate() + '.' + (dt.getMonth() + 1) + '.</small>', S.day === n); })
      .join('').replace(/class="chip "/g, '');
    const occs = ['arbeit', 'alltag', 'party', 'elegant'].map(k => chip('occ', 'data-k="' + k + '"', E.OCCASIONS[k].name, S.occasion === k)).join('');
    let h = '<div class="view"><div class="head"><h1>Was ziehe ich an?</h1></div>' +
      '<div class="seg" role="group" aria-label="Tag">' + days + '</div>' +
      '<div class="chips occ" role="group" aria-label="Anlass">' + occs + '</div>' + weatherHTML();

    const needProfile = !(S.profile.styles || []).length;
    if (S.items.length < 3 || needProfile) {
      h += '<div class="note"><p><b>So startest du</b></p><ol class="steps">' +
        '<li' + (needProfile ? '' : ' class="muted"') + '>Profil ausfüllen – vor allem Stil, Farben und Temperaturempfinden.</li>' +
        '<li' + (S.items.length >= 3 ? ' class="muted"' : '') + '>Kleidung fotografieren: Oberteile, Hosen oder Röcke, Schuhe und Jacken (' + S.items.length + ' bisher).</li>' +
        '<li' + (S.profile.location ? ' class="muted"' : '') + '>Wetter einrichten – dann gibt es hier jeden Tag drei Vorschläge.</li></ol>' +
        '<div class="row">' + (needProfile ? '<button class="btn" data-act="nav" data-v="profil">Zum Profil</button>' : '') + '<button class="btn tape-btn" data-act="add">Teil hinzufügen</button></div></div>';
    } else if (backupDue()) {
      h += '<div class="note"><p>' + (S.meta.lastBackup ? 'Deine letzte Sicherung ist über einen Monat alt.' : 'Du hast deinen Schrank noch nie gesichert.') + ' Geht das Handy verloren oder werden die Browserdaten gelöscht, sind sonst alle Teile weg.</p><div class="row"><button class="btn tape-btn" data-act="backup">Jetzt sichern</button><button class="linkbtn" data-act="backup-later">Später</button></div></div>';
    }

    const p = S.pinnedId && byId(S.pinnedId);
    if (S.items.length) h += '<div class="pinrow">' + (p
      ? '<div class="pinned">' + (S.urls.get(p.id) ? '<img src="' + S.urls.get(p.id) + '" alt="">' : '<span class="ph" style="display:grid;place-items:center;background:' + colorOf(p.colors[0]).hex + '40">' + typeOf(p).icon + '</span>') + '<span class="t">📌 ' + esc(itemLabel(p)) + '</span><button class="x" data-act="unpin" aria-label="Festpinnen aufheben">×</button></div>'
      : '<button class="btn" data-act="pin-pick">📌 Teil festpinnen</button><span class="muted small">Outfits um ein bestimmtes Teil bauen</span>') + '</div>';

    if (S.items.length) {
      if (!S.result) compute();
      const r = S.result;
      h += '<div class="ohead"><h2>' + (r.outfits.length === 1 ? 'Ein Vorschlag' : r.outfits.length + ' Vorschläge') + '</h2>' + (r.outfits.length ? '<button class="btn ghost" data-act="shuffle">Neu mischen</button>' : '') + '</div>';
      r.notes.forEach(n => { h += '<div class="note"><p>' + esc(n) + '</p></div>'; });
      if (r.empty) h += '<div class="note"><p>' + esc(r.empty) + '</p><button class="btn tape-btn" data-act="add">Teil hinzufügen</button></div>';
      r.outfits.forEach((o, i) => { h += outfitHTML(o, i); });
      if (r.outfits.length && r.outfits.length < 3) h += '<p class="muted small">Für mehr Auswahl brauche ich mehr passende Teile im Schrank – oder einige sind gerade in der Wäsche.</p>';
    }
    return h + '</div>';
  }

  // ------------------------------------------------------------ Ansicht: Schrank
  const trackingSince = () => S.history.length ? S.history.reduce((m, e) => e.date < m ? e.date : m, S.history[0].date) : null;
  const reviewList = () => E.review(S.items, S.profile, { today: localDate(), trackingSince: trackingSince(), rated: S.rated });
  function viewSchrank() {
    const rv = reviewList();
    const nFav = S.items.filter(i => i.fav).length;
    const seg = [['alle', 'Alle Teile', S.items.length], ['lieblinge', 'Lieblinge', nFav], ['aussortieren', 'Aussortieren', rv.length]]
      .map(([k, n, c]) => '<button data-act="smode" data-k="' + k + '" aria-pressed="' + (S.smode === k) + '">' + n + '<small>' + c + '</small></button>').join('');
    let h = '<div class="view has-fab' + (S.selMode ? ' has-sel' : '') + '"><div class="head"><h1>Schrank</h1><span class="muted">' + S.items.length + ' Teile</span></div>' +
      '<div class="seg" role="group" aria-label="Ansicht">' + seg + '</div>';

    if (S.smode === 'aussortieren') {
      h += '<div class="note"><p>Diese Teile würde ich mir genauer ansehen. Ob etwas verwaschen, ausgeleiert oder voller Knötchen ist, sehe ich auf dem Foto nicht – markiere es dafür im Teil unter „Zustand“.</p>' +
        (trackingSince() ? '' : '<p class="muted small">Hinweise wie „lange nicht getragen“ kommen dazu, sobald du ein paar Wochen lang „Heute getragen“ nutzt.</p>') + '</div>';
      if (!rv.length) h += '<p class="muted">Gerade gibt es nichts, was ich aussortieren würde.</p>';
      rv.forEach(r => {
        const it = byId(r.id); if (!it) return;
        h += '<article class="rev">' + tileHTML(it, { act: 'edit', data: 'data-id="' + it.id + '"', label: false }) +
          '<div class="rev-body"><h3>' + esc(itemLabel(it)) + '</h3><ul class="why">' + r.reasons.map(x => '<li class="neg">' + esc(x) + '</li>').join('') + '</ul></div>' +
          '<div class="rev-act"><button class="btn" data-act="rev-keep" data-id="' + it.id + '">Behalten</button><button class="btn" data-act="rev-fav" data-id="' + it.id + '">♡ Liebling</button><button class="btn danger" data-act="rev-del" data-id="' + it.id + '">Löschen</button></div></article>';
      });
      return h + '</div>';
    }

    const base = S.smode === 'lieblinge' ? S.items.filter(i => i.fav) : S.items;
    const counts = {};
    base.forEach(i => { const c = catOfType(i.type); counts[c] = (counts[c] || 0) + 1; });
    const cats = [chip('cat', 'data-k="alle"', 'Alle <span class="muted">' + base.length + '</span>', S.cat === 'alle')]
      .concat(E.CATEGORIES.filter(c => counts[c.id] || S.cat === c.id).map(c => chip('cat', 'data-k="' + c.id + '"', esc(c.name) + ' <span class="muted">' + (counts[c.id] || 0) + '</span>', S.cat === c.id))).join('');
    let list = base.filter(i => S.cat === 'alle' || catOfType(i.type) === S.cat);
    if (S.status !== 'alle') list = list.filter(i => (i.status || 'verfuegbar') === S.status);
    const nW = S.items.filter(i => i.status === 'waesche').length;
    h += '<div class="chips scroll" role="group" aria-label="Kategorie" style="margin-top:12px">' + cats + '</div>' +
      '<div class="toolbar"><label class="sr" for="st">Zustand</label><select id="st" data-field="status-filter">' +
      [['alle', 'Alle Zustände']].concat(Object.entries(E.STATUS)).map(([k, v]) => '<option value="' + k + '"' + (S.status === k ? ' selected' : '') + '>' + v + (k === 'waesche' && nW ? ' (' + nW + ')' : '') + '</option>').join('') + '</select>' +
      (S.items.length ? '<button class="btn" data-act="' + (S.selMode ? 'sel-cancel' : 'sel-start') + '">' + (S.selMode ? 'Fertig' : 'Auswählen') + '</button>' : '') + '</div>' +
      (nW && !S.selMode ? '<div class="row" style="margin-top:10px"><button class="btn" data-act="laundry-done">Wäsche ist fertig – alles zurück in den Schrank</button></div>' : '');
    if (!S.items.length) h += '<div class="note" style="margin-top:18px"><p>Dein Schrank ist noch leer. Fotografiere dein erstes Teil – am besten flach hingelegt auf einem ruhigen Untergrund, der sich farblich vom Teil abhebt.</p><button class="btn tape-btn" data-act="add">Erstes Teil hinzufügen</button></div>';
    else if (S.smode === 'lieblinge' && !base.length) h += '<p class="muted" style="margin-top:18px">Noch keine Lieblingsteile. Öffne ein Teil und tippe oben auf das Herz – Lieblingsteile schlägt die App öfter vor und nie zum Aussortieren.</p>';
    else if (!list.length) h += '<p class="muted" style="margin-top:18px">Keine Teile mit diesem Filter.</p>';
    else h += '<div class="grid">' + list.map(i => tileHTML(i, {
      act: S.selMode ? 'sel-toggle' : 'edit', data: 'data-id="' + i.id + '"', label: typeOf(i).name, dots: true, lazy: true, fav: true,
      selected: S.selMode ? S.sel.has(i.id) : null,
      cls: (i.status || 'verfuegbar') !== 'verfuegbar' ? 'off' : '', badge: (i.status || 'verfuegbar') !== 'verfuegbar' ? E.STATUS[i.status] : ''
    })).join('') + '</div>';
    h += '</div>';
    if (S.selMode) {
      const n = S.sel.size;
      h += '<div class="selbar" role="toolbar" aria-label="Auswahl"><div class="row spread"><b>' + n + ' ausgewählt</b><button class="linkbtn" data-act="sel-all">Alle auswählen</button></div>' +
        '<div class="selbtns"><button class="btn" data-act="sel-fav"' + (n ? '' : ' disabled') + '>♥ Lieblinge</button><button class="btn" data-act="sel-wash"' + (n ? '' : ' disabled') + '>In die Wäsche</button>' +
        '<button class="btn" data-act="sel-back"' + (n ? '' : ' disabled') + '>In den Schrank</button><button class="btn danger" data-act="sel-del"' + (n ? '' : ' disabled') + '>Löschen</button></div></div>';
    } else h += '<button class="fab" data-act="add"><span aria-hidden="true">＋</span> Teil hinzufügen</button>';
    return h;
  }

  // ------------------------------------------------------------ Ansicht: Ergänzen
  const SHAPES = {
    shirt: 'M31 18 42 13Q50 21 58 13L69 18 87 33 78 43 70 37V87H30V37L22 43 13 33Z',
    long: 'M31 15 42 11Q50 19 58 11L69 15 85 33 91 79 81 81 71 43V89H29V43L19 81 9 79 15 33Z',
    vest: 'M33 14 42 11Q50 30 58 11L67 14 72 30 70 88H30L28 30Z',
    coat: 'M31 10 42 7Q50 13 58 7L69 10 85 28 91 84 81 86 71 40V95H29V40L19 86 9 84 15 28Z',
    trousers: 'M31 9H69L74 93H56L50 37 44 93H26Z',
    wide: 'M32 9H68L82 93H55L50 41 45 93H18Z',
    shorts: 'M30 20H70L76 62H54L50 42 46 62H24Z',
    skirt: 'M36 14H64L80 88H20Z',
    miniskirt: 'M35 22H65L77 70H23Z',
    dress: 'M40 8H46Q50 15 54 8H60L63 30 57 40 79 93H21L43 40 37 30Z',
    shoe: 'M8 64Q10 50 24 52L42 54Q54 42 70 45Q88 49 92 64V72H8Z',
    heel: 'M10 46Q14 44 20 47Q42 60 72 60Q88 60 91 68V73H34L29 88H21V66Q13 60 10 46Z',
    boot: 'M33 12H57V58Q60 65 77 67Q91 69 91 79V86H30V64Z',
    bag: 'M20 40H80L86 90H14Z',
    scarf: 'M28 12H72V30Q60 40 63 90H50L47 40Q38 36 28 30Z',
    beanie: 'M22 72Q22 26 50 24Q78 26 78 72Z',
    generic: 'M22 22H78V78H22Z'
  };
  const SHAPE_OF = {
    tshirt: 'shirt', top: 'shirt', polo: 'shirt', body: 'shirt', bluse: 'shirt+collar', hemd: 'long+collar', langarm: 'long', pullover: 'long', rollkragen: 'long', sweatshirt: 'long', hoodie: 'long',
    cardigan: 'long+open', blazer: 'long+lapel', sweatjacke: 'long+open', weste: 'vest',
    jeans: 'trousers', stoffhose: 'trousers', chino: 'trousers', leggings: 'trousers', jogginghose: 'trousers', cargohose: 'trousers', weitehose: 'wide', shorts: 'shorts', rock_kurz: 'miniskirt', rock_lang: 'skirt',
    kleid_kurz: 'dress', kleid_lang: 'dress', jumpsuit: 'dress',
    jeansjacke: 'long+open', lederjacke: 'long+lapel', blouson: 'long+open', uebergang: 'coat+open', regenjacke: 'coat+open', trench: 'coat+lapel', mantel: 'coat+lapel', parka: 'coat+open', winterjacke: 'coat+open',
    sneaker: 'shoe', laufschuhe: 'shoe', ballerinas: 'shoe', loafer: 'shoe', derby: 'shoe', pumps: 'heel', slingbacks: 'heel', sandaletten: 'heel', sandalen: 'sandal', stiefeletten: 'boot', stiefel: 'boot', winterstiefel: 'boot',
    tasche: 'bag', schal: 'scarf', tuch: 'scarf', einstecktuch: 'scarf', hut: 'hat', muetze: 'beanie', cap: 'beanie', handschuhe: 'beanie', guertel: 'belt', sonnenbrille: 'glasses', schmuck: 'ring', uhr: 'ring'
  };
  function illus(type, hex) {
    const [base, ...mods] = (SHAPE_OF[type] || 'generic').split('+');
    const dk = 'rgba(0,0,0,.3)', f = 'fill="' + hex + '" stroke="' + dk + '" stroke-width="1.5" stroke-linejoin="round"';
    let b;
    if (base === 'hat') b = '<path ' + f + ' d="M30 64Q30 30 50 29Q70 30 70 64Z"/><ellipse ' + f + ' cx="50" cy="66" rx="44" ry="10"/>';
    else if (base === 'belt') b = '<rect ' + f + ' x="5" y="42" width="90" height="15" rx="3"/><rect x="14" y="38" width="20" height="23" rx="3" fill="none" stroke="#b8923a" stroke-width="3"/>';
    else if (base === 'glasses') b = '<circle ' + f + ' cx="30" cy="52" r="16"/><circle ' + f + ' cx="70" cy="52" r="16"/><path d="M46 50Q50 45 54 50M14 48 4 42M86 48 96 42" fill="none" stroke="' + dk + '" stroke-width="3"/>';
    else if (base === 'ring') b = '<circle cx="50" cy="60" r="22" fill="none" stroke="' + hex + '" stroke-width="8"/><circle cx="50" cy="60" r="26" fill="none" stroke="' + dk + '" stroke-width="1"/><path ' + f + ' d="M42 32 50 22 58 32 50 40Z"/>';
    else if (base === 'sandal') b = '<rect ' + f + ' x="8" y="68" width="84" height="8" rx="4"/><path d="M26 68Q36 48 52 68M54 68Q66 46 80 68" fill="none" stroke="' + hex + '" stroke-width="6"/>';
    else b = '<path ' + f + ' d="' + SHAPES[base] + '"/>';
    const top = base === 'coat' ? 7 : base === 'long' ? 11 : 13, bottom = base === 'coat' ? 95 : 89;
    if (mods.includes('collar')) b += '<path d="M42 ' + top + ' 50 ' + (top + 11) + ' 58 ' + top + '" fill="none" stroke="' + dk + '" stroke-width="2"/><path d="M50 ' + (top + 11) + 'V86" stroke="' + dk + '" stroke-width="2" stroke-dasharray="1 7" stroke-linecap="round"/>';
    if (mods.includes('lapel')) b += '<path d="M42 ' + top + ' 50 ' + (top + 34) + ' 58 ' + top + '" fill="none" stroke="' + dk + '" stroke-width="2"/><path d="M50 ' + (top + 34) + 'V' + bottom + '" stroke="' + dk + '" stroke-width="1.5"/>';
    if (mods.includes('open')) b += '<path d="M50 ' + (top + 6) + 'V' + bottom + '" stroke="' + dk + '" stroke-width="2"/>';
    if (base === 'bag') b += '<path d="M34 40Q34 16 50 16Q66 16 66 40" fill="none" stroke="' + dk + '" stroke-width="4"/>';
    if (base === 'trousers' || base === 'wide') b += '<path d="M32 15H68" stroke="' + dk + '" stroke-width="1.5"/>';
    return '<svg viewBox="0 0 100 100" aria-hidden="true">' + b + '</svg>';
  }
  function gapCardHTML(r) {
    const t = E.TYPES[r.type], c0 = colorOf(r.colors[0]);
    const names = r.colors.map(c => colorOf(c).name);
    const colorTxt = names.length > 1 ? names.slice(0, -1).join(', ') + ' oder ' + names[names.length - 1] : names[0];
    const g = S.profile.gender === 'w' ? ' Damen' : S.profile.gender === 'm' ? ' Herren' : '';
    const mat = r.mats && r.mats[0] && E.MATERIALS[r.mats[0]] ? ' ' + E.MATERIALS[r.mats[0]].name : '';
    const q = t.name.replace(/ \(.*\)/, '').split(' / ')[0] + ' ' + c0.name + mat + g;
    return '<article class="gap"><div class="gap-ill" style="background:' + c0.hex + '26">' + illus(r.type, c0.hex) + '</div><div class="gap-body">' +
      '<h3>' + esc(r.title) + '</h3><div class="gap-colors">' + r.colors.map(c => '<span class="dot" style="background:' + colorOf(c).hex + '"></span>').join('') + '<span>' + esc(colorTxt) + (mat ? ',' + esc(mat) : '') + '</span></div>' +
      '<p>' + esc(r.why) + '</p>' +
      '<div class="row"><a class="btn" href="https://duckduckgo.com/?ia=images&iax=images&q=' + encodeURIComponent(q) + '" target="_blank" rel="noopener noreferrer">Beispielbilder</a>' +
      '<button class="btn" data-act="gap-have" data-type="' + r.type + '" data-c="' + r.colors[0] + '" data-m="' + (r.need ? r.need[0] : (r.mats && r.mats.length === 1 ? r.mats[0] : '')) + '" aria-label="Hab ich schon – im Schrank hinzufügen">Hab ich</button>' +
      '<button class="linkbtn" data-act="gap-hide" data-id="' + esc(r.id) + '">Ausblenden</button></div></div></article>';
  }
  function viewErgaenzen() {
    const res = E.gaps(S.items, S.profile, { today: localDate(), hidden: S.gapHidden });
    const st = res.stats;
    let h = '<div class="view"><div class="head"><h1>Ergänzen</h1></div>' +
      '<p>Was deinem Schrank noch fehlt – abgeleitet aus Wetter, Anlässen, deinem Stil und den Kombinationen, die heute schon möglich sind.</p>' +
      (S.items.length ? '<p class="muted small">Aus ' + st.tops + ' Oberteilen und ' + st.bottoms + ' Unterteilen ergeben sich bisher ' + st.combos + ' stimmige Grundkombinationen.</p>' : '') +
      '<div class="note"><p>Die Liste geht davon aus, dass dein Schrank vollständig in der App ist. Was du besitzt, aber noch nicht fotografiert hast, erscheint hier sonst als „fehlt“.</p></div>';
    if (!(S.profile.styles || []).length) h += '<div class="note"><p>Wähle im Profil deinen Stil – dann zeige ich dir auch, was dafür typisch ist.</p><button class="btn" data-act="nav" data-v="profil">Zum Profil</button></div>';
    const groups = [['Fehlt für Wetter und Anlässe', r => r.group === 'wetter' || r.group === 'anlass'], ['Mehr Kombinationen', r => r.group === 'kombi'],
      ['Typisch für deinen Stil', r => r.group === 'stil'], ['Kleinigkeiten', r => r.group === 'klein']];
    let any = false;
    for (const [title, fn] of groups) {
      const list = res.recs.filter(fn); if (!list.length) continue; any = true;
      h += '<h2>' + esc(title) + '</h2>' + list.map(gapCardHTML).join('');
    }
    if (!any) h += '<p class="muted">Dein Schrank ist gut ausgestattet – mir fällt gerade nichts ein, was fehlt.</p>';
    if (S.gapHidden.length) h += '<p style="margin-top:18px"><button class="linkbtn" data-act="gap-unhide">Ausgeblendete Vorschläge wieder zeigen (' + S.gapHidden.length + ')</button></p>';
    return h + '<p class="muted small" style="margin-top:14px">Die Beispielbilder öffnen eine Bildersuche im Browser. Die App selbst zeigt keine Werbung und verdient an nichts mit.</p></div>';
  }

  // ------------------------------------------------------------ Ansicht: Gespeichert
  function stripHTML(slots, acc) {
    const ids = E.ORDER.map(s => slots[s]).filter(Boolean).concat(acc || []);
    return '<div class="strip">' + ids.map(byId).filter(Boolean).map(i => tileHTML(i, { act: 'edit', data: 'data-id="' + i.id + '"', label: typeOf(i).name, aria: itemLabel(i), cls: (i.status || 'verfuegbar') !== 'verfuegbar' ? 'off' : '' })).join('') + '</div>';
  }
  const REASONS = { farben: 'Farben passen nicht', warm: 'Zu warm angezogen', kalt: 'Zu kalt angezogen', stil: 'Nicht mein Stil', anlass: 'Passt nicht zum Anlass', sonst: 'Ohne Angabe' };
  function viewGespeichert() {
    const liked = S.rated.filter(r => r.rating > 0), nope = S.rated.filter(r => r.rating < 0);
    const tabs = [['liked', 'Lieblinge', liked.length], ['history', 'Verlauf', S.history.length], ['nope', 'Abgelehnt', nope.length]]
      .map(([k, n, c]) => '<button data-act="saved-tab" data-k="' + k + '" aria-pressed="' + (S.savedTab === k) + '">' + n + '<small>' + c + '</small></button>').join('');
    let h = '<div class="view"><div class="head"><h1>Gespeichert</h1></div><div class="seg" role="group" aria-label="Liste">' + tabs + '</div><div style="margin-top:14px">';
    const occName = k => (E.OCCASIONS[k] || {}).name || '';
    if (S.savedTab === 'liked') {
      if (!liked.length) h += '<p class="muted">Outfits, die dir gefallen, landen hier. Tippe dazu bei einem Vorschlag auf „Gefällt mir“.</p>';
      liked.forEach(r => {
        const off = Object.values(r.slots).map(byId).some(i => i && (i.status || 'verfuegbar') !== 'verfuegbar');
        h += '<div class="saved">' + stripHTML(r.slots, r.acc) + '<div class="meta"><span>' + esc(occName(r.occasion)) + (r.style ? ', ' + esc(r.style) : '') + (off ? '<br><span style="color:var(--nope)">Teile gerade nicht im Schrank</span>' : '') + '</span><span class="row"><button class="btn" data-act="saved-wear" data-id="' + r.id + '">Heute anziehen</button><button class="btn ghost" data-act="rated-del" data-id="' + r.id + '" aria-label="Aus Lieblingen entfernen">Entfernen</button></span></div></div>';
      });
    } else if (S.savedTab === 'history') {
      if (!S.history.length) h += '<p class="muted">Hier erscheint, was du an welchem Tag getragen hast. Tippe dazu bei einem Vorschlag auf „Heute getragen“.</p>';
      S.history.forEach(e => {
        h += '<div class="saved">' + stripHTML(e.slots, e.acc) + '<div class="meta"><span>' + fmtDate(e.date) + ', ' + esc(occName(e.occasion)) + '</span><button class="btn ghost" data-act="hist-del" data-id="' + e.id + '">Entfernen</button></div></div>';
      });
    } else {
      if (!nope.length) h += '<p class="muted">Abgelehnte Outfits schlägt die App nicht mehr vor. Hier kannst du sie wieder zulassen.</p>';
      nope.forEach(r => {
        h += '<div class="saved">' + stripHTML(r.slots, r.acc) + '<div class="meta"><span>' + esc(REASONS[r.reason] || 'Abgelehnt') + ', ' + esc(occName(r.occasion)) + '</span><button class="btn" data-act="rated-del" data-id="' + r.id + '">Wieder zulassen</button></div></div>';
      });
    }
    return h + '</div></div>';
  }

  // ------------------------------------------------------------ Ansicht: Profil
  function viewProfil() {
    const P = S.profile;
    const one = (k, opts) => '<div class="chips">' + opts.map(([v, n]) => chip('pf', 'data-k="' + k + '" data-v="' + v + '"', n, P[k] === v)).join('') + '</div>';
    const loc = P.location;
    let h = '<div class="view"><div class="head"><h1>Profil</h1></div>';
    h += '<section class="card"><h2>Stil</h2><p class="muted small">Mehrfachauswahl. Jeder Stil hat eigene Regeln – etwa wie viele Farben und Muster er verträgt oder welche Schuhe dazugehören.</p><div class="chips stylechips">' +
      Object.entries(E.STYLES).map(([k, s]) => chip('pf-multi', 'data-k="styles" data-v="' + k + '"', esc(s.name) + '<small>' + esc(s.desc) + '</small>', (P.styles || []).includes(k))).join('') + '</div></section>';
    h += '<section class="card"><h2>Farben</h2><label class="f">Lieblingsfarben</label><div class="chips">' + E.COLORS.map(c => swatchChip('pf-multi', 'data-k="favColors" data-v="' + c.id + '"', c.id, (P.favColors || []).includes(c.id))).join('') + '</div>' +
      '<label class="f">No-Go-Farben <small>– Teile in diesen Farben schlage ich nicht vor</small></label><div class="chips">' + E.COLORS.map(c => swatchChip('pf-multi', 'data-k="nogoColors" data-v="' + c.id + '"', c.id, (P.nogoColors || []).includes(c.id))).join('') + '</div></section>';
    h += '<section class="card"><h2>Typ</h2>' +
      '<label class="f">Farbtyp</label>' + one('farbtyp', [['fruehling', 'Frühling'], ['sommer', 'Sommer'], ['herbst', 'Herbst'], ['winter', 'Winter'], ['', 'Weiß ich nicht']]) +
      '<label class="f">Hautunterton <small>– zählt, wenn du deinen Farbtyp nicht kennst</small></label>' + one('unterton', [['warm', 'Warm'], ['kuehl', 'Kühl'], ['neutral', 'Neutral'], ['', 'Weiß ich nicht']]) +
      '<p class="muted small" style="margin-top:8px">Faustregel: Steht dir Goldschmuck besser, ist dein Unterton eher warm, bei Silber eher kühl.</p>' +
      '<label class="f">Hautton</label>' + one('skin', [['hell', 'Hell'], ['mittel', 'Mittel'], ['oliv', 'Oliv'], ['dunkel', 'Dunkel']]) +
      '<label class="f">Haarfarbe</label>' + one('hair', [['blond', 'Blond'], ['braun', 'Braun'], ['schwarz', 'Schwarz'], ['rot', 'Rot'], ['grau', 'Grau / Weiß'], ['andere', 'Andere']]) +
      '<div class="two-col"><div><label class="f" for="pf-age">Alter</label><input id="pf-age" type="number" inputmode="numeric" min="10" max="110" data-field="age" value="' + esc(P.age) + '"></div>' +
      '<div><label class="f" for="pf-h">Größe in cm</label><input id="pf-h" type="number" inputmode="numeric" min="100" max="230" data-field="height" value="' + esc(P.height) + '"></div></div>' +
      '<label class="f">Geschlecht <small>– nur für passende Styling-Tipps, etwa „Bluse in den Bund stecken“</small></label>' + one('gender', [['w', 'Weiblich'], ['m', 'Männlich'], ['d', 'Divers'], ['', 'Keine Angabe']]) + '</section>';
    h += '<section class="card"><h2>Alltag</h2><label class="f">Temperaturempfinden</label>' + one('sensitivity', [['friert', 'Friere schnell'], ['normal', 'Normal'], ['schwitzt', 'Schwitze schnell']]) +
      '<label class="f">Dresscode bei der Arbeit</label>' + one('dresscode', [['locker', 'Locker'], ['businesscasual', 'Business Casual'], ['business', 'Business']]) +
      (S.learn && Math.abs(S.learn.tempOffset || 0) >= 0.7 ? '<p class="muted small" style="margin-top:8px">Aus deinen Bewertungen gelernt: Ich rechne mit ' + (S.learn.tempOffset < 0 ? 'etwas kälter' : 'etwas wärmer') + ' als vorhergesagt (' + (S.learn.tempOffset > 0 ? '+' : '−') + Math.abs(S.learn.tempOffset).toFixed(1).replace('.', ',') + ' °C).</p>' : '') + '</section>';
    h += '<section class="card" id="loc"><h2>Wetter-Standort</h2><p>' + (loc ? (loc.mode === 'gps' ? 'Aktueller Standort (ungefähr)' : esc(loc.name)) : 'Noch nicht eingerichtet.') + '</p>' +
      '<div class="row"><button class="btn" data-act="loc-gps">Aktuellen Standort verwenden</button>' + (loc ? '<button class="btn ghost" data-act="loc-clear">Entfernen</button>' : '') + '</div>' +
      '<label class="f" for="city">Oder Ort suchen</label><div class="row" style="flex-wrap:nowrap"><input id="city" type="search" placeholder="z. B. Leipzig" data-field="city-q" value="' + esc(S.city.q) + '" enterkeyhint="search"><button class="btn" data-act="city-search">Suchen</button></div>' +
      (S.city.busy ? '<div class="busy"><span class="spin"></span>Suche läuft</div>' : '') +
      (S.city.results ? (S.city.results.length ? '<div class="chips" style="margin-top:10px">' + S.city.results.map((r, i) => chip('city-pick', 'data-i="' + i + '"', esc(r.label), false)).join('') + '</div>' : '<p class="muted small" style="margin-top:8px">Kein Ort gefunden.</p>') : '') +
      '<p class="muted small" style="margin-top:10px">Für das Wetter wird nur ein auf etwa 1 km gerundeter Standort an den kostenlosen Dienst Open-Meteo geschickt. Sonst verlässt nichts dein Handy.</p></section>';
    h += '<section class="card"><h2>Sicherheit und Daten</h2>' +
      '<label class="f">App-Sperre</label><p class="muted small">Eine PIN schützt vor neugierigen Blicken, wenn jemand dein entsperrtes Handy in der Hand hat.</p><div class="row">' +
      (S.pin ? '<button class="btn" data-act="pin-set">PIN ändern</button><button class="btn ghost danger" data-act="pin-remove">PIN entfernen</button>' : '<button class="btn" data-act="pin-set">PIN festlegen</button>') + '</div>' +
      '<label class="f">Sicherung</label><p class="muted small">Letzte Sicherung: ' + (S.meta.lastBackup ? new Date(S.meta.lastBackup).toLocaleDateString('de-DE') : 'noch nie') + '. Die Datei ist mit deinem Passwort verschlüsselt.</p>' +
      '<div class="row"><button class="btn tape-btn" data-act="backup">Sicherung erstellen</button><button class="btn" data-act="restore">Sicherung laden</button></div>' +
      '<label class="f">Speicherplatz</label><p class="muted small" id="storage">' + S.items.length + ' Teile, Fotos zusammen ' + mb(S.photoBytes) + '.</p>' +
      '<div class="row" style="margin-top:14px"><button class="btn ghost" data-act="learn-reset">Gelerntes zurücksetzen</button><button class="btn ghost danger" data-act="wipe">Alle Daten löschen</button></div></section>';
    return h + '<p class="muted small" style="text-align:center">Mein Kleiderschrank, Version 1.2.1</p></div>';
  }

  // ------------------------------------------------------------ Rendern
  function render() {
    const y = window.scrollY;
    const v = S.view;
    app.innerHTML = v === 'schrank' ? viewSchrank() : v === 'ergaenzen' ? viewErgaenzen() : v === 'gespeichert' ? viewGespeichert() : v === 'profil' ? viewProfil() : viewOutfits();
    document.querySelectorAll('nav.tabs button').forEach(b => { if (b.dataset.nav === v) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
    window.scrollTo(0, render.keep ? y : 0); render.keep = false;
  }
  const rerender = () => { render.keep = true; render(); };

  // ------------------------------------------------------------ Sheets & Toast
  let sheetFn = null, sheetOpen = false;
  function openSheet(fn, label) {
    sheetFn = fn;
    if (!sheetOpen) { history.pushState({ sheet: 1 }, ''); sheetOpen = true; }
    sheetsEl.innerHTML = '<div class="sheet-wrap"><div class="sheet" role="dialog" aria-modal="true" aria-label="' + esc(label || 'Dialog') + '"><div class="grab"></div><div class="sheet-body"></div></div></div>';
    refreshSheet(true);
  }
  function refreshSheet(top) {
    const sh = sheetsEl.querySelector('.sheet'); if (!sh || !sheetFn) return;
    const y = sh.scrollTop;
    sh.querySelector('.sheet-body').innerHTML = sheetFn();
    sh.scrollTop = top ? 0 : y;
  }
  function closeSheet(fromPop) {
    if (!sheetOpen) return;
    sheetsEl.innerHTML = ''; sheetFn = null; sheetOpen = false; ED = null;
    if (!fromPop) history.back();
  }
  window.addEventListener('popstate', () => { if (sheetOpen) closeSheet(true); });
  sheetsEl.addEventListener('click', e => { if (e.target.classList.contains('sheet-wrap')) closeSheet(); });
  const sheetHead = title => '<div class="sheet-head"><h2>' + esc(title) + '</h2><button class="x" data-act="close" aria-label="Schließen">×</button></div>';

  let toastTimer;
  function toast(msg, actLabel, fn) {
    clearTimeout(toastTimer);
    toastRoot.innerHTML = '<div class="toast" role="status"><span>' + esc(msg) + '</span>' + (actLabel ? '<button>' + esc(actLabel) + '</button>' : '') + '</div>';
    if (actLabel) toastRoot.querySelector('button').onclick = () => { toastRoot.innerHTML = ''; fn(); };
    toastTimer = setTimeout(() => { toastRoot.innerHTML = ''; }, actLabel ? 6000 : 3200);
  }

  // ------------------------------------------------------------ Fotos
  async function processPhoto(file) {
    const bmp = await createImageBitmap(file);
    const max = 900, sc = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const w = Math.round(bmp.width * sc), h = Math.round(bmp.height * sc);
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    cv.getContext('2d').drawImage(bmp, 0, 0, w, h);
    let blob = await new Promise(r => cv.toBlob(r, 'image/webp', 0.78));
    if (!blob || blob.type !== 'image/webp') blob = await new Promise(r => cv.toBlob(r, 'image/jpeg', 0.8));
    const s2 = 96 / Math.max(w, h), sw = Math.max(8, Math.round(w * s2)), shh = Math.max(8, Math.round(h * s2));
    const small = document.createElement('canvas'); small.width = sw; small.height = shh;
    const sctx = small.getContext('2d', { willReadFrequently: true }); sctx.drawImage(cv, 0, 0, sw, shh);
    const colors = E.detectColors(sctx.getImageData(0, 0, sw, shh).data, sw, shh);
    bmp.close && bmp.close();
    return { blob, canvas: cv, colors };
  }
  async function canvasFromBlob(blob) {
    const bmp = await createImageBitmap(blob);
    const cv = document.createElement('canvas'); cv.width = bmp.width; cv.height = bmp.height;
    cv.getContext('2d').drawImage(bmp, 0, 0); return cv;
  }

  // ------------------------------------------------------------ Teil-Editor
  let ED = null;
  function openEditor(item, preset) {
    ED = {
      isNew: !item,
      item: item ? JSON.parse(JSON.stringify(item)) : Object.assign({ id: uid(), type: '', colors: [], pattern: 'uni', materials: [], fit: 'normal', status: 'verfuegbar', condition: 'gut', note: '' }, preset || {}),
      url: item ? S.urls.get(item.id) : null, blob: null, canvas: null, target: 0, palette: false,
      cat: item ? catOfType(item.type) : (preset && preset.type ? catOfType(preset.type) : 'oberteile'), touched: { warmth: !!item, formality: !!item, colors: !!item }, ocr: null, busy: false
    };
    openSheet(renderEditor, ED.isNew ? 'Teil hinzufügen' : 'Teil bearbeiten');
  }
  function renderEditor() {
    if (!ED) return '';
    const it = ED.item, t = E.TYPES[it.type];
    let h = '<div class="sheet-head"><h2>' + (ED.isNew ? 'Teil hinzufügen' : 'Teil bearbeiten') + '</h2><div class="row" style="gap:8px;flex-wrap:nowrap">' +
      '<button class="x favbtn" data-act="ed-fav" aria-pressed="' + !!it.fav + '" aria-label="Lieblingsteil">' + (it.fav ? '♥' : '♡') + '</button>' +
      '<button class="x" data-act="close" aria-label="Schließen">×</button></div></div>';
    if (ED.fromGap) h += '<div class="note small" style="margin-top:4px"><p>Typ' + (it.materials.length ? ', Material' : '') + ' und Farbe sind aus dem Vorschlag übernommen. Prüf sie kurz – mit einem Foto erkennt die App die Farbe deines Teils selbst.</p></div>';
    if (ED.busy) h += '<div class="busy"><span class="spin"></span>Foto wird vorbereitet</div>';
    else if (ED.url) h += '<div class="photo"><img src="' + ED.url + '" alt="Foto des Teils" data-act="ed-photo-tap"></div><div class="row" style="margin-top:8px"><button class="btn ghost" data-act="ed-camera">Neues Foto</button><button class="btn ghost" data-act="ed-gallery">Aus Galerie</button></div>';
    else h += '<div class="photo-empty"><p>Leg das Teil flach hin und fotografiere es von oben. Am besten auf einem ruhigen Untergrund, der sich farblich deutlich vom Teil abhebt – helle Teile also nicht aufs weiße Bettlaken.</p><button class="btn tape-btn" data-act="ed-camera">📷 Foto aufnehmen</button><button class="btn" data-act="ed-gallery">Aus Galerie wählen</button></div>';

    if (!ED.isNew) {
      const orig = byId(it.id), info = [];
      if (orig) info.push(orig.wearCount ? 'Getragen: ' + orig.wearCount + '-mal' + (orig.lastWorn ? ', zuletzt am ' + fmtDate(orig.lastWorn) : '') : 'Noch nicht als getragen erfasst.');
      const pi = E.partnerInfo(S.items, it.id); if (pi) info.push('Passt zu ' + pi.count + ' ' + pi.noun + ' in deinem Schrank.');
      const rv = reviewList().find(x => x.id === it.id);
      h += '<div class="note small" style="margin-top:12px"><p>' + info.map(esc).join(' ') + '</p>' + (rv ? '<p><b>Ich würde es aussortieren:</b> ' + rv.reasons.map(esc).join(' ') + '</p><div class="row"><button class="btn" data-act="rev-keep" data-id="' + it.id + '">Behalten</button></div>' : '') + '</div>';
    }
    const c0 = it.colors[0] && colorOf(it.colors[0]), c1 = it.colors[1] && colorOf(it.colors[1]);
    h += '<label class="f">Farbe ' + (ED.url && !ED.touched.colors ? '<small>– automatisch erkannt, bitte prüfen</small>' : '') + '</label>' +
      '<div class="colorpick"><button data-act="ed-target" data-t="0" aria-pressed="' + (ED.palette && ED.target === 0) + '"><span class="dot" style="background:' + (c0 ? c0.hex : 'transparent') + '"></span><span>Hauptfarbe<small>' + (c0 ? esc(c0.name) : 'wählen') + '</small></span></button>' +
      '<button data-act="ed-target" data-t="1" aria-pressed="' + (ED.palette && ED.target === 1) + '"><span class="dot" style="background:' + (c1 ? c1.hex : 'transparent') + '"></span><span>Zweitfarbe<small>' + (c1 ? esc(c1.name) : 'keine') + '</small></span></button></div>';
    if (ED.palette) {
      h += '<p class="muted small" style="margin:8px 0 0">' + (ED.url ? 'Tippe aufs Foto, um die Farbe genau dort zu übernehmen, oder wähle hier:' : 'Wähle die ' + (ED.target ? 'Zweitfarbe' : 'Hauptfarbe') + ':') + '</p><div class="palette">' +
        (ED.target === 1 ? '<button data-act="ed-color" data-c="" aria-pressed="' + !it.colors[1] + '"><span class="dot" style="background:transparent"></span>Keine</button>' : '') +
        E.COLORS.map(c => '<button data-act="ed-color" data-c="' + c.id + '" aria-pressed="' + (it.colors[ED.target] === c.id) + '"><span class="dot" style="background:' + c.hex + '"></span>' + esc(c.name) + '</button>').join('') + '</div>';
    }

    h += '<label class="f">Was ist es?</label><div class="chips scroll">' + E.CATEGORIES.map(c => chip('ed-cat', 'data-k="' + c.id + '"', esc(c.name), ED.cat === c.id)).join('') + '</div>' +
      '<div class="typegrid" style="margin-top:10px">' + Object.entries(E.TYPES).filter(([, d]) => E.CATEGORIES.find(c => c.id === ED.cat).slots.includes(d.slot))
        .map(([k, d]) => chip('ed-type', 'data-k="' + k + '"', '<span class="em" aria-hidden="true">' + d.icon + '</span>' + esc(d.name), it.type === k)).join('') + '</div>';

    if (t) {
      const slot = t.slot;
      if (!['acc', 'other'].includes(slot) || ['schal', 'tuch', 'einstecktuch', 'tasche', 'hut', 'muetze'].includes(it.type)) {
        h += '<label class="f">Muster</label><div class="chips">' + Object.entries(E.PATTERNS).map(([k, p]) => chip('ed-pattern', 'data-k="' + k + '"', p.name, (it.pattern || 'uni') === k)).join('') + '</div>';
      }
      h += '<label class="f">Material <small>– mehrere möglich</small></label>' +
        '<button class="btn" data-act="ed-label" style="margin-bottom:10px">🏷️ Etikett fotografieren und lesen</button>';
      if (ED.ocr) {
        if (ED.ocr.state === 'busy') h += '<div class="busy"><span class="spin"></span>' + esc(ED.ocr.msg) + '</div>';
        else if (ED.ocr.state === 'done' && ED.ocr.materials.length) h += '<div class="note ocr"><p>Gefunden: ' + ED.ocr.materials.map(m => m.pct + ' % ' + esc(E.MATERIALS[m.id].name)).join(', ') + '</p><button class="btn tape-btn" data-act="ed-ocr-apply">Übernehmen</button></div>';
        else if (ED.ocr.state === 'done') h += '<div class="note ocr"><p>Auf dem Foto habe ich keine Materialangabe gefunden. Tipp: Etikett glatt ziehen, nah herangehen, gutes Licht. Oder wähle das Material unten selbst.</p></div>';
        else if (ED.ocr.state === 'error') h += '<div class="note ocr"><p>' + esc(ED.ocr.msg) + '</p></div>';
      }
      const COMMON = ['baumwolle', 'polyester', 'viskose', 'elasthan', 'wolle', 'kaschmir', 'leinen', 'seide', 'denim', 'leder', 'strick', 'jersey'];
      const mats = Object.entries(E.MATERIALS).filter(([k]) => ED.allMats || COMMON.includes(k) || (it.materials || []).includes(k));
      h += '<div class="chips">' + mats.map(([k, m]) => chip('ed-mat', 'data-k="' + k + '"', esc(m.name), (it.materials || []).includes(k))).join('') +
        (ED.allMats ? '' : '<button class="chip" data-act="ed-allmats" aria-pressed="false">Weitere …</button>') + '</div>';
      if (!['shoes', 'acc', 'other'].includes(slot) || ['hut', 'schal'].includes(it.type)) {
        h += '<label class="f">Dicke <small>– ' + (it.type === 'hut' ? '1–2 = Sommerhut, 3–5 = Winterhut' : 'wie warm hält das Teil?') + '</small></label><div class="scale" role="group" aria-label="Dicke">' + [1, 2, 3, 4, 5].map(n => '<button data-act="ed-warmth" data-n="' + n + '" aria-pressed="' + (it.warmth === n) + '"><b>' + n + '</b>' + E.WARMTH[n] + '</button>').join('') + '</div>';
      }
      if (['top', 'mid', 'bottom', 'onepiece'].includes(slot)) {
        h += '<label class="f">Passform</label><div class="chips">' + Object.entries(E.FITS).map(([k, n]) => chip('ed-fit', 'data-k="' + k + '"', n, (it.fit || 'normal') === k)).join('') + '</div>';
      }
      if (!['other'].includes(slot) && !['schal', 'muetze', 'handschuhe', 'sonnenbrille', 'cap'].includes(it.type)) {
        h += '<label class="f">Wirkung <small>– wie schick ist das Teil?</small></label><div class="scale" role="group" aria-label="Wirkung">' + [1, 2, 3, 4, 5].map(n => '<button data-act="ed-formality" data-n="' + n + '" aria-pressed="' + (it.formality === n) + '"><b>' + n + '</b>' + E.FORMALITY[n] + '</button>').join('') + '</div>';
      }
      h += '<label class="f">Zustand <small>– sieht man es dem Teil an?</small></label><div class="chips">' + Object.entries(E.CONDITION).map(([k, n]) => chip('ed-cond', 'data-k="' + k + '"', n, (it.condition || 'gut') === k)).join('') + '</div>';
      h += '<label class="f">Wo ist das Teil gerade?</label><div class="chips">' + Object.entries(E.STATUS).map(([k, n]) => chip('ed-status', 'data-k="' + k + '"', n, (it.status || 'verfuegbar') === k)).join('') + '</div>';
      h += '<label class="f" for="ed-note">Notiz <small>– optional</small></label><textarea id="ed-note" data-field="ed-note" placeholder="z. B. Lieblingsteil, kneift etwas, nur für besondere Anlässe">' + esc(it.note) + '</textarea>';
    }
    h += '<div class="sheet-foot">' + (ED.isNew ? '' : '<button class="btn danger" data-act="ed-delete">Löschen</button>') + '<button class="btn primary" data-act="ed-save">Speichern</button></div>';
    return h;
  }
  async function edSetPhoto(file) {
    if (!file || !ED) return;
    ED.busy = true; refreshSheet();
    try {
      const p = await processPhoto(file);
      if (!ED) return;
      if (ED.url && ED.blob) URL.revokeObjectURL(ED.url);
      ED.blob = p.blob; ED.canvas = p.canvas; ED.url = URL.createObjectURL(p.blob);
      if (!ED.touched.colors) ED.item.colors = p.colors.slice(0, 2);
    } catch (e) { toast('Das Foto ließ sich nicht öffnen. Bitte versuche ein anderes.'); }
    if (ED) { ED.busy = false; refreshSheet(); }
  }
  async function edPhotoTap(ev, img) {
    if (!ED) return;
    if (!ED.canvas) { try { const b = ED.blob || await (await fetch(ED.url)).blob(); ED.canvas = await canvasFromBlob(b); } catch (e) { return; } }
    const cv = ED.canvas, r = img.getBoundingClientRect();
    const scale = Math.min(r.width / cv.width, r.height / cv.height);
    const dw = cv.width * scale, dh = cv.height * scale, x0 = (r.width - dw) / 2, y0 = (r.height - dh) / 2;
    const x = (ev.clientX - r.left - x0) / scale, y = (ev.clientY - r.top - y0) / scale;
    if (x < 0 || y < 0 || x >= cv.width || y >= cv.height) return;
    const s = 4, d = cv.getContext('2d', { willReadFrequently: true }).getImageData(clamp(Math.round(x) - s, 0, cv.width - 1), clamp(Math.round(y) - s, 0, cv.height - 1), s * 2 + 1, s * 2 + 1).data;
    let R = 0, G = 0, B = 0, n = 0; for (let i = 0; i < d.length; i += 4) { R += d[i]; G += d[i + 1]; B += d[i + 2]; n++; }
    const id = E.nearestColor([R / n, G / n, B / n]);
    ED.item.colors[ED.target] = id; ED.touched.colors = true;
    if (ED.target === 1 && ED.item.colors[0] === id) ED.item.colors.splice(1, 1);
    toast((ED.target ? 'Zweitfarbe' : 'Hauptfarbe') + ': ' + colorOf(id).name);
    refreshSheet();
  }

  // Etikett lesen (Texterkennung läuft im Browser; Sprachdaten werden einmalig geladen)
  const loadScript = src => new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('load')); document.head.appendChild(s); });
  async function edScanLabel(file) {
    if (!file || !ED) return;
    ED.ocr = { state: 'busy', msg: 'Etikett wird gelesen' }; refreshSheet();
    try {
      if (!window.Tesseract) {
        if (!navigator.onLine) throw new Error('offline');
        ED.ocr.msg = 'Texterkennung wird einmalig geladen'; refreshSheet();
        await loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js');
      }
      const bmp = await createImageBitmap(file);
      const sc = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
      const cv = document.createElement('canvas'); cv.width = Math.round(bmp.width * sc); cv.height = Math.round(bmp.height * sc);
      const cx = cv.getContext('2d', { willReadFrequently: true }); cx.drawImage(bmp, 0, 0, cv.width, cv.height);
      const img = cx.getImageData(0, 0, cv.width, cv.height), d = img.data;
      let lo = 255, hi = 0; const g = new Uint8ClampedArray(d.length / 4);
      for (let i = 0, j = 0; i < d.length; i += 4, j++) { const v = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]; g[j] = v; if (v < lo) lo = v; if (v > hi) hi = v; }
      const span = Math.max(1, hi - lo);
      for (let i = 0, j = 0; i < d.length; i += 4, j++) { const v = (g[j] - lo) * 255 / span; d[i] = d[i + 1] = d[i + 2] = v; }
      cx.putImageData(img, 0, 0);
      const worker = await window.Tesseract.createWorker('deu', 1, { logger: m => { if (ED && ED.ocr && m.status === 'recognizing text') { const p = Math.round(m.progress * 100); if (p % 10 === 0) { ED.ocr.msg = 'Etikett wird gelesen – ' + p + ' %'; refreshSheet(); } } } });
      const { data } = await worker.recognize(cv);
      await worker.terminate();
      const res = E.parseLabel(data.text || '');
      if (ED) { ED.ocr = { state: 'done', materials: res.materials.filter(m => E.MATERIALS[m.id]), warmthHint: res.warmthHint }; refreshSheet(); }
    } catch (e) {
      if (ED) { ED.ocr = { state: 'error', msg: e.message === 'offline' || e.message === 'load' ? 'Fürs erste Lesen braucht die App einmal Internet, um die Texterkennung zu laden.' : 'Das Etikett ließ sich nicht lesen. Wähle das Material bitte selbst.' }; refreshSheet(); }
    }
  }

  async function edSave() {
    const it = ED.item;
    if (!it.type) return toast('Bitte wähle, was es ist.');
    if (!it.colors[0]) { ED.palette = true; ED.target = 0; refreshSheet(); return toast('Bitte wähle eine Farbe.'); }
    const t = E.TYPES[it.type];
    it.colors = it.colors.filter(Boolean).slice(0, 2);
    if (!it.warmth) it.warmth = clamp(t.w || 2, 1, 5);
    if (!it.formality) it.formality = clamp(t.f || 3, 1, 5);
    if (ED.isNew) { it.created = Date.now(); it.wearCount = 0; it.lastWorn = null; }
    it.updated = Date.now();
    await DB.put('items', it);
    if (ED.blob) {
      await DB.put('photos', { id: it.id, blob: ED.blob });
      const old = S.urls.get(it.id); if (old && old !== ED.url) URL.revokeObjectURL(old);
      S.urls.set(it.id, ED.url); S.photoBytes += ED.blob.size;
    }
    const i = S.items.findIndex(x => x.id === it.id);
    if (i >= 0) S.items[i] = it; else S.items.unshift(it);
    if (!S.meta.persistAsked && navigator.storage && navigator.storage.persist) { S.meta.persistAsked = true; saveMeta(); navigator.storage.persist().catch(() => {}); }
    const wasNew = ED.isNew;
    closeSheet(); invalidate(); rerender();
    toast(wasNew ? 'Im Schrank gespeichert' : 'Änderungen gespeichert', wasNew ? 'Noch eins' : null, () => openEditor(null));
  }
  async function deleteItem(id) {
    await DB.del('items', id); await DB.del('photos', id);
    const u = S.urls.get(id); if (u) URL.revokeObjectURL(u); S.urls.delete(id);
    S.items = S.items.filter(i => i.id !== id);
    if (S.pinnedId === id) S.pinnedId = null;
    invalidate();
  }

  // ------------------------------------------------------------ Outfit-Aktionen
  function swapSheet(idx, slot, accId) {
    const o = S.result.outfits[idx];
    const cur = byId(slot === 'acc' ? accId : o.slots[slot]);
    return () => {
      let h = sheetHead(cur ? itemLabel(cur) : 'Teil');
      if (cur) h += '<div class="pickgrid" style="grid-template-columns:1fr 1.4fr;align-items:center">' + tileHTML(cur, { act: 'noop', label: false }) +
        '<div style="display:grid;gap:8px"><button class="btn" data-act="pin" data-id="' + cur.id + '">📌 Festpinnen</button><button class="btn" data-act="edit" data-id="' + cur.id + '">Bearbeiten</button>' +
        (cur.lastWorn ? '<span class="muted small">Zuletzt getragen: ' + fmtDate(cur.lastWorn) + '</span>' : '') + '</div></div>';
      h += '<h3>Stattdessen</h3>';
      let alts;
      if (slot === 'acc') {
        const sub = typeOf(cur).sub;
        alts = [{ id: null }].concat(S.items.filter(i => i.id !== cur.id && typeOf(i).sub === sub && (i.status || 'verfuegbar') === 'verfuegbar').map(i => ({ id: i.id })));
      } else {
        const { C } = ctx();
        alts = E.alternatives(S.items, o, slot, C, { rated: S.rated });
      }
      SW = { idx, slot, accId, alts };
      if (!alts.length) h += '<p class="muted">Kein anderes passendes Teil im Schrank.</p>';
      else h += '<div class="pickgrid">' + alts.map((a, i) => a.id ? tileHTML(byId(a.id), { act: 'swap-pick', data: 'data-i="' + i + '"', label: typeOf(byId(a.id)).name, aria: itemLabel(byId(a.id)) })
        : '<button class="tile alt-none" data-act="swap-pick" data-i="' + i + '"><span class="img">Ohne</span><span class="lbl">Weglassen</span></button>').join('') + '</div>';
      return h;
    };
  }
  let SW = null;

  function ratedRecord(o, rating, reason) {
    return { id: uid(), key: o.key, coreKey: o.coreKey, slots: Object.assign({}, o.slots), acc: (o.acc || []).slice(), rating, reason: reason || null, occasion: S.occasion, style: o.style, created: Date.now() };
  }
  const colorOfId = id => { const i = byId(id); return i && i.colors && i.colors[0]; };
  function applyLearn(rec, sign) {
    const d = E.learnFrom({}, { slots: rec.slots }, rec.rating, rec.reason, rec.occasion, colorOfId);
    const L = Object.assign({ pairs: {}, colorPairs: {}, itemOcc: {}, tempOffset: 0 }, S.learn);
    for (const k of ['pairs', 'colorPairs', 'itemOcc']) { L[k] = Object.assign({}, L[k]); for (const [kk, v] of Object.entries(d[k])) { const nv = clamp((L[k][kk] || 0) + sign * v, -6, 4); if (Math.abs(nv) < 0.01) delete L[k][kk]; else L[k][kk] = nv; } }
    L.tempOffset = clamp((L.tempOffset || 0) + sign * (d.tempOffset || 0), -4, 4);
    S.learn = L; saveKV('learn', L);
  }
  async function addRated(rec) { S.rated.unshift(rec); await DB.put('outfits', rec); applyLearn(rec, 1); }
  async function removeRated(id) { const r = S.rated.find(x => x.id === id); if (!r) return; S.rated = S.rated.filter(x => x.id !== id); await DB.del('outfits', id); applyLearn(r, -1); }

  async function markWorn(slots, acc, key, occasion) {
    const date = localDate();
    const e = { id: uid(), date, slots: Object.assign({}, slots), acc: (acc || []).slice(), key, occasion, created: Date.now() };
    S.history.unshift(e); await DB.put('history', e);
    const ids = Object.values(slots).concat(acc || []);
    const changed = [];
    for (const id of ids) { const it = byId(id); if (!it) continue; it.wearCount = (it.wearCount || 0) + 1; if (!it.lastWorn || it.lastWorn < date) it.lastWorn = date; changed.push(it); }
    await DB.putMany('items', changed);
    return e;
  }
  async function recomputeWear() {
    const last = {}, count = {};
    for (const e of S.history) for (const id of Object.values(e.slots).concat(e.acc || [])) { count[id] = (count[id] || 0) + 1; if (!last[id] || e.date > last[id]) last[id] = e.date; }
    for (const it of S.items) { it.lastWorn = last[it.id] || null; it.wearCount = count[it.id] || 0; }
    await DB.putMany('items', S.items);
  }
  function laundrySheet(slots) {
    const ids = ['top', 'mid', 'bottom', 'onepiece'].map(s => slots[s]).filter(Boolean);
    LS = { ids, sel: new Set() };
    return () => sheetHead('Getragen ✓') + '<p>Was kommt danach in die Wäsche? Diese Teile schlage ich erst wieder vor, wenn du sie zurücklegst.</p><div class="pickgrid">' +
      LS.ids.map(byId).filter(Boolean).map(i => tileHTML(i, { act: 'laundry-toggle', data: 'data-id="' + i.id + '"', label: (LS.sel.has(i.id) ? '🧺 ' : '') + typeOf(i).name, badge: LS.sel.has(i.id) ? 'Wäsche' : '' })).join('') + '</div>' +
      '<div class="sheet-foot"><button class="btn primary" data-act="laundry-ok">Fertig</button></div>';
  }
  let LS = null;

  function dislikeSheet(idx) {
    return () => sheetHead('Was passt nicht?') + '<p class="muted">Damit ich dazulerne. Dieses Outfit schlage ich nicht mehr vor.</p><div style="display:grid;gap:8px">' +
      Object.entries(REASONS).map(([k, n]) => '<button class="btn block" data-act="dislike-reason" data-o="' + idx + '" data-r="' + k + '">' + esc(n) + '</button>').join('') + '</div>';
  }

  function pinPickSheet() {
    const avail = S.items.filter(i => (i.status || 'verfuegbar') === 'verfuegbar' && typeOf(i).slot !== 'other');
    const list = avail.filter(i => S.pinCat === 'alle' || catOfType(i.type) === S.pinCat).sort((a, b) => (b.fav ? 1 : 0) - (a.fav ? 1 : 0));
    return sheetHead('Teil festpinnen') + '<p class="muted small">Die Vorschläge werden um dieses Teil herum gebaut.</p>' +
      '<div class="chips scroll" style="margin-bottom:12px">' + [chip('pin-cat', 'data-k="alle"', 'Alle', S.pinCat === 'alle')].concat(E.CATEGORIES.map(c => chip('pin-cat', 'data-k="' + c.id + '"', esc(c.name), S.pinCat === c.id))).join('') + '</div>' +
      (list.length ? '<div class="pickgrid">' + list.map(i => tileHTML(i, { act: 'pin', data: 'data-id="' + i.id + '"', label: typeOf(i).name, aria: itemLabel(i), dots: true, fav: true })).join('') + '</div>' : '<p class="muted">Hier ist gerade nichts im Schrank.</p>');
  }

  // ------------------------------------------------------------ PIN
  const enc = new TextEncoder();
  const hex = buf => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  const pinHash = async (pin, salt) => hex(await crypto.subtle.digest('SHA-256', enc.encode(salt + ':' + pin)));
  function keypadHTML(act, n) {
    return '<div class="pin-dots" aria-hidden="true">' + [0, 1, 2, 3].map(i => '<i class="' + (i < n ? 'on' : '') + '"></i>').join('') + '</div><div class="keypad">' +
      [1, 2, 3, 4, 5, 6, 7, 8, 9].map(k => '<button data-act="' + act + '" data-k="' + k + '">' + k + '</button>').join('') +
      '<span></span><button data-act="' + act + '" data-k="0">0</button><button class="txt" data-act="' + act + '" data-k="del" aria-label="Löschen">⌫</button></div>';
  }
  let PS = null;
  function pinSetSheet() {
    return sheetHead(PS.stage === 'new' ? 'Neue PIN' : 'PIN wiederholen') + '<div style="display:grid;justify-items:center;gap:18px;padding:10px 0 20px"><p class="muted">' + (PS.stage === 'new' ? 'Wähle vier Ziffern.' : 'Gib die PIN zur Bestätigung noch einmal ein.') + '</p>' + keypadHTML('pin-key', PS.cur.length) + '</div>';
  }
  let lockEl = null, lockCur = '', hiddenAt = 0;
  function showLock() {
    if (!S.pin || lockEl) return;
    lockCur = '';
    lockEl = document.createElement('div'); lockEl.className = 'lock'; lockEl.setAttribute('role', 'dialog'); lockEl.setAttribute('aria-label', 'App entsperren');
    document.body.appendChild(lockEl); drawLock();
    lockEl.addEventListener('click', async e => {
      const b = e.target.closest('[data-act="lock-key"]'); if (!b) return;
      const k = b.dataset.k;
      if (k === 'del') lockCur = lockCur.slice(0, -1); else if (lockCur.length < 4) lockCur += k;
      drawLock();
      if (lockCur.length === 4) {
        if (await pinHash(lockCur, S.pin.salt) === S.pin.hash) { lockEl.remove(); lockEl = null; }
        else { lockCur = ''; drawLock(); const d = lockEl.querySelector('.pin-dots'); d.classList.add('shake'); }
      }
    });
  }
  function drawLock() { lockEl.innerHTML = '<img src="icon-192.png" alt="" width="64" height="64" style="border-radius:16px"><h1>PIN eingeben</h1>' + keypadHTML('lock-key', lockCur.length); }
  document.addEventListener('visibilitychange', () => { if (document.hidden) hiddenAt = Date.now(); else if (S.pin && hiddenAt && Date.now() - hiddenAt > 3 * 60000) showLock(); });

  // ------------------------------------------------------------ Sicherung (AES-GCM, Schlüssel aus Passwort)
  const b64 = blob => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.onerror = rej; r.readAsDataURL(blob); });
  async function deriveKey(pw, salt, iter) {
    const base = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: iter, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }
  async function buildBackup(pw) {
    const photos = await DB.all('photos');
    const data = { app: 'kleiderschrank', v: 1, created: new Date().toISOString(), items: S.items, rated: S.rated, history: S.history, profile: S.profile, learn: S.learn, photos: [] };
    for (const p of photos) data.photos.push({ id: p.id, type: p.blob.type, b64: await b64(p.blob) });
    const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12)), iter = 250000;
    const key = await deriveKey(pw, salt, iter);
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(data)));
    const head = JSON.stringify({ format: 'kleiderschrank-backup', v: 1, iter, salt: btoa(String.fromCharCode(...salt)), iv: btoa(String.fromCharCode(...iv)) }) + '\n';
    return new Blob([head, new Uint8Array(ct)], { type: 'application/octet-stream' });
  }
  async function readBackup(file, pw) {
    const buf = new Uint8Array(await file.arrayBuffer());
    const nl = buf.indexOf(10); if (nl < 0) throw new Error('format');
    const head = JSON.parse(new TextDecoder().decode(buf.slice(0, nl)));
    if (head.format !== 'kleiderschrank-backup') throw new Error('format');
    const ub = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
    const key = await deriveKey(pw, ub(head.salt), head.iter);
    let plain;
    try { plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: ub(head.iv) }, key, buf.slice(nl + 1)); } catch (e) { throw new Error('pw'); }
    return JSON.parse(new TextDecoder().decode(plain));
  }
  async function restoreBackup(data) {
    await DB.clearAll();
    const photos = [];
    for (const p of data.photos || []) photos.push({ id: p.id, blob: await (await fetch('data:' + (p.type || 'image/webp') + ';base64,' + p.b64)).blob() });
    await DB.putMany('items', data.items || []);
    await DB.putMany('photos', photos);
    await DB.putMany('outfits', data.rated || []);
    await DB.putMany('history', data.history || []);
    await saveKV('profile', data.profile || {});
    await saveKV('learn', data.learn || {});
    S.meta.lastBackup = Date.now(); await saveMeta();
    if (S.pin) await saveKV('pin', S.pin);
  }
  let BK = null;
  function backupSheet() {
    const canShare = !!(navigator.canShare && navigator.share);
    if (BK.mode === 'restore') {
      return sheetHead('Sicherung laden') + '<p>Datei: ' + esc(BK.file.name) + '</p><label class="f" for="bk1">Passwort der Sicherung</label><input id="bk1" type="password" autocomplete="current-password" data-field="bk-pw1" value="' + esc(BK.pw1) + '">' +
        '<div class="note"><p>Achtung: Die Sicherung ersetzt alles, was jetzt in der App gespeichert ist.</p></div>' + (BK.busy ? '<div class="busy"><span class="spin"></span>' + esc(BK.busy) + '</div>' : '') + (BK.err ? '<p style="color:var(--nope)">' + esc(BK.err) + '</p>' : '') +
        '<div class="sheet-foot"><button class="btn primary" data-act="bk-restore"' + (BK.busy ? ' disabled' : '') + '>Sicherung laden</button></div>';
    }
    return sheetHead('Sicherung erstellen') + '<p>Die Sicherungsdatei enthält deinen ganzen Schrank samt Fotos und ist mit deinem Passwort verschlüsselt. Speichere sie an einem zweiten Ort, zum Beispiel auf deinem PC oder in deiner Cloud.</p>' +
      '<label class="f" for="bk1">Passwort <small>– mindestens 8 Zeichen</small></label><input id="bk1" type="password" autocomplete="new-password" data-field="bk-pw1" value="' + esc(BK.pw1) + '">' +
      '<label class="f" for="bk2">Passwort wiederholen</label><input id="bk2" type="password" autocomplete="new-password" data-field="bk-pw2" value="' + esc(BK.pw2) + '">' +
      '<p class="muted small" style="margin-top:10px">Ohne dieses Passwort lässt sich die Sicherung nicht öffnen – auch nicht von mir. Notiere es dir gut.</p>' +
      (BK.busy ? '<div class="busy"><span class="spin"></span>' + esc(BK.busy) + '</div>' : '') + (BK.err ? '<p style="color:var(--nope)">' + esc(BK.err) + '</p>' : '') +
      '<div class="sheet-foot"><button class="btn primary" data-act="bk-save"' + (BK.busy ? ' disabled' : '') + '>Als Datei speichern</button>' + (canShare ? '<button class="btn" data-act="bk-share"' + (BK.busy ? ' disabled' : '') + '>Teilen …</button>' : '') + '</div>';
  }
  async function doBackup(share) {
    BK.err = '';
    if ((BK.pw1 || '').length < 8) { BK.err = 'Das Passwort braucht mindestens 8 Zeichen.'; return refreshSheet(); }
    if (BK.pw1 !== BK.pw2) { BK.err = 'Die Passwörter stimmen nicht überein.'; return refreshSheet(); }
    BK.busy = 'Sicherung wird verschlüsselt'; refreshSheet();
    try {
      const blob = await buildBackup(BK.pw1);
      const name = 'kleiderschrank-sicherung-' + localDate() + '.kleiderschrank';
      if (share) {
        const file = new File([blob], name, { type: 'application/octet-stream' });
        if (navigator.canShare({ files: [file] })) await navigator.share({ files: [file], title: 'Kleiderschrank-Sicherung' });
        else throw new Error('noshare');
      } else {
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
        setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
      }
      S.meta.lastBackup = Date.now(); saveMeta();
      closeSheet(); rerender(); toast(share ? 'Sicherung geteilt' : 'Sicherung gespeichert – du findest sie unter Downloads');
    } catch (e) {
      if (e && e.name === 'AbortError') { BK.busy = ''; return refreshSheet(); }
      BK.busy = ''; BK.err = 'Das hat nicht geklappt. Bitte versuche es noch einmal.'; refreshSheet();
    }
  }

  // ------------------------------------------------------------ Ereignisse
  const A = {
    noop() {},
    close() { closeSheet(); },
    nav(el) { S.view = el.dataset.v; render(); },
    day(el) { S.day = +el.dataset.n; invalidate(); rerender(); },
    occ(el) { S.occasion = el.dataset.k; S.meta.lastOccasion = S.occasion; saveMeta(); invalidate(); rerender(); },
    shuffle() { S.seed++; invalidate(); rerender(); },
    add() { openEditor(null); },
    edit(el) { const it = byId(el.dataset.id); if (it) { if (sheetOpen) { sheetFn = null; } openEditor(it); } },
    'go-profile-loc'() { S.view = 'profil'; render(); setTimeout(() => { const el = document.getElementById('city'); if (el) { el.scrollIntoView({ block: 'center' }); el.focus(); } }, 50); },
    'wx-retry'() { refreshWeather(true); },
    async 'loc-gps'() {
      toast('Standort wird ermittelt');
      try {
        const c = await getPosition();
        S.profile.location = { mode: 'gps', lat: Math.round(c.latitude * 100) / 100, lon: Math.round(c.longitude * 100) / 100, name: 'Aktueller Standort' };
        saveProfile(); toast('Standort gespeichert'); refreshWeather(true); rerender();
      } catch (e) { toast('Standort nicht verfügbar. Erlaube den Zugriff oder suche einen Ort.'); }
    },
    'loc-clear'() { S.profile.location = null; S.weather = null; saveProfile(); saveKV('weather', null); invalidate(); rerender(); },
    async 'city-search'() {
      const q = S.city.q.trim(); if (q.length < 2) return;
      S.city.busy = true; rerender();
      try {
        const r = await fetch('https://geocoding-api.open-meteo.com/v1/search?count=6&language=de&format=json&name=' + encodeURIComponent(q), { referrerPolicy: 'no-referrer' });
        const j = await r.json();
        S.city.results = (j.results || []).map(x => ({ label: [x.name, x.admin1, x.country].filter(Boolean).join(', '), lat: Math.round(x.latitude * 100) / 100, lon: Math.round(x.longitude * 100) / 100 }));
      } catch (e) { S.city.results = null; toast('Suche nicht möglich – bist du online?'); }
      S.city.busy = false; rerender();
    },
    'city-pick'(el) {
      const r = S.city.results[+el.dataset.i];
      S.profile.location = { mode: 'city', lat: r.lat, lon: r.lon, name: r.label };
      S.city = { q: '', results: null, busy: false }; saveProfile(); toast('Ort gespeichert: ' + r.label); refreshWeather(true); rerender();
    },
    pf(el) { const k = el.dataset.k, v = el.dataset.v; S.profile[k] = (S.profile[k] === v && ['farbtyp', 'unterton', 'skin', 'hair', 'gender'].includes(k)) ? '' : v; saveProfile(); invalidate(); rerender(); },
    'pf-multi'(el) {
      const k = el.dataset.k, v = el.dataset.v, arr = (S.profile[k] || []).slice(); const i = arr.indexOf(v);
      if (i >= 0) arr.splice(i, 1); else arr.push(v);
      S.profile[k] = arr;
      if (k === 'favColors' && i < 0) S.profile.nogoColors = (S.profile.nogoColors || []).filter(x => x !== v);
      if (k === 'nogoColors' && i < 0) S.profile.favColors = (S.profile.favColors || []).filter(x => x !== v);
      saveProfile(); invalidate(); rerender();
    },
    cat(el) { S.cat = el.dataset.k; rerender(); },
    smode(el) { S.smode = el.dataset.k; S.selMode = false; S.sel.clear(); S.cat = 'alle'; rerender(); },
    'sel-start'() { S.selMode = true; S.sel.clear(); rerender(); },
    'sel-cancel'() { S.selMode = false; S.sel.clear(); rerender(); },
    'sel-toggle'(el) { const id = el.dataset.id; if (S.sel.has(id)) S.sel.delete(id); else S.sel.add(id); rerender(); },
    'sel-all'() { app.querySelectorAll('.grid [data-act="sel-toggle"]').forEach(b => S.sel.add(b.dataset.id)); rerender(); },
    async 'sel-fav'() { const ch = [...S.sel].map(byId).filter(Boolean); ch.forEach(i => { i.fav = true; }); await DB.putMany('items', ch); invalidate(); A['sel-cancel'](); toast(ch.length + ' als Lieblingsteil markiert'); },
    async 'sel-wash'() { const ch = [...S.sel].map(byId).filter(Boolean); ch.forEach(i => { i.status = 'waesche'; }); await DB.putMany('items', ch); invalidate(); A['sel-cancel'](); toast(ch.length + ' in der Wäsche'); },
    async 'sel-back'() { const ch = [...S.sel].map(byId).filter(Boolean); ch.forEach(i => { i.status = 'verfuegbar'; }); await DB.putMany('items', ch); invalidate(); A['sel-cancel'](); toast(ch.length + ' zurück im Schrank'); },
    async 'sel-del'() {
      const ids = [...S.sel]; if (!ids.length) return;
      if (!confirm(ids.length + (ids.length === 1 ? ' Teil' : ' Teile') + ' endgültig löschen?')) return;
      for (const id of ids) await deleteItem(id);
      A['sel-cancel'](); toast(ids.length + (ids.length === 1 ? ' Teil gelöscht' : ' Teile gelöscht'));
    },
    async 'rev-keep'(el) {
      const it = byId(el.dataset.id); if (!it) return; it.keepUntil = Date.now() + 182 * 864e5; await DB.put('items', it);
      if (ED && ED.item.id === it.id) { ED.item.keepUntil = it.keepUntil; refreshSheet(); } else rerender();
      toast('Behalten – ich frage frühestens in einem halben Jahr wieder');
    },
    async 'rev-fav'(el) { const it = byId(el.dataset.id); if (!it) return; it.fav = true; await DB.put('items', it); invalidate(); rerender(); toast('Als Lieblingsteil markiert'); },
    async 'rev-del'(el) { if (!confirm('Dieses Teil endgültig löschen?')) return; await deleteItem(el.dataset.id); rerender(); toast('Gelöscht'); },
    'gap-have'(el) {
      openEditor(null, { type: el.dataset.type, colors: [el.dataset.c], materials: el.dataset.m ? [el.dataset.m] : [], warmth: clamp(E.TYPES[el.dataset.type].w || 2, 1, 5), formality: clamp(E.TYPES[el.dataset.type].f || 3, 1, 5) });
      ED.fromGap = true; refreshSheet(true);
    },
    'gap-hide'(el) { S.gapHidden.push(el.dataset.id); saveKV('gapHidden', S.gapHidden); rerender(); toast('Ausgeblendet', 'Rückgängig', () => { S.gapHidden.pop(); saveKV('gapHidden', S.gapHidden); rerender(); }); },
    'gap-unhide'() { S.gapHidden = []; saveKV('gapHidden', []); rerender(); },
    async 'laundry-done'() {
      const w = S.items.filter(i => i.status === 'waesche'); w.forEach(i => { i.status = 'verfuegbar'; });
      await DB.putMany('items', w); invalidate(); rerender(); toast(w.length + (w.length === 1 ? ' Teil ist' : ' Teile sind') + ' zurück im Schrank');
    },
    'saved-tab'(el) { S.savedTab = el.dataset.k; rerender(); },
    async 'rated-del'(el) { await removeRated(el.dataset.id); invalidate(); rerender(); },
    async 'hist-del'(el) { S.history = S.history.filter(e => e.id !== el.dataset.id); await DB.del('history', el.dataset.id); await recomputeWear(); invalidate(); rerender(); },
    async 'saved-wear'(el) { const r = S.rated.find(x => x.id === el.dataset.id); if (!r) return; await markWorn(r.slots, r.acc, r.key, r.occasion); invalidate(); openSheet(laundrySheet(r.slots), 'Wäsche'); },
    'backup-later'() { S.meta.lastBackup = Date.now() - 23 * 864e5; saveMeta(); rerender(); },
    // Outfits
    tile(el) { openSheet(swapSheet(+el.dataset.o, el.dataset.slot, el.dataset.id), 'Teil tauschen'); },
    'swap-pick'(el) {
      const a = SW.alts[+el.dataset.i], o = S.result.outfits[SW.idx];
      if (SW.slot === 'acc') { o.acc = o.acc.filter(x => x !== SW.accId); if (a.id) o.acc.push(a.id); }
      else { const acc = o.acc; S.result.outfits[SW.idx] = Object.assign(a.outfit, { acc }); }
      closeSheet(); rerender();
    },
    pin(el) { S.pinnedId = el.dataset.id; invalidate(); closeSheet(); S.view = 'outfits'; render(); toast('Festgepinnt – die Vorschläge bauen darauf auf'); },
    unpin() { S.pinnedId = null; invalidate(); rerender(); },
    'pin-pick'() { if (!S.items.length) return toast('Füge zuerst Teile zum Schrank hinzu.'); openSheet(pinPickSheet, 'Teil festpinnen'); },
    'pin-cat'(el) { S.pinCat = el.dataset.k; refreshSheet(); },
    async like(el) {
      const o = S.result.outfits[+el.dataset.o];
      const ex = S.rated.find(r => r.rating > 0 && r.key === o.key);
      if (ex) { await removeRated(ex.id); toast('Aus Lieblingen entfernt'); }
      else { await addRated(ratedRecord(o, 1)); toast('Bei den Lieblingen gespeichert'); }
      rerender();
    },
    dislike(el) { openSheet(dislikeSheet(+el.dataset.o), 'Ablehnen'); },
    async 'dislike-reason'(el) {
      const o = S.result.outfits[+el.dataset.o];
      const ex = S.rated.find(r => r.rating > 0 && r.key === o.key); if (ex) await removeRated(ex.id);
      const rec = ratedRecord(o, -1, el.dataset.r);
      await addRated(rec);
      closeSheet(); invalidate(); rerender();
      toast('Wird nicht mehr vorgeschlagen', 'Rückgängig', async () => { await removeRated(rec.id); invalidate(); rerender(); });
    },
    async worn(el) {
      const o = S.result.outfits[+el.dataset.o];
      await markWorn(o.slots, o.acc, o.key, S.occasion);
      rerender(); openSheet(laundrySheet(o.slots), 'Wäsche');
    },
    'laundry-toggle'(el) { const id = el.dataset.id; if (LS.sel.has(id)) LS.sel.delete(id); else LS.sel.add(id); refreshSheet(); },
    async 'laundry-ok'() {
      const ch = [...LS.sel].map(byId).filter(Boolean); ch.forEach(i => { i.status = 'waesche'; });
      if (ch.length) await DB.putMany('items', ch);
      closeSheet(); rerender(); toast(ch.length ? 'Gespeichert, ' + ch.length + ' in der Wäsche' : 'Als getragen gespeichert');
    },
    // Editor
    'ed-camera'() { document.getElementById('file-camera').click(); },
    'ed-gallery'() { document.getElementById('file-gallery').click(); },
    'ed-label'() { document.getElementById('file-label').click(); },
    'ed-photo-tap'(el, ev) { if (ED && ED.palette) edPhotoTap(ev, el); else if (ED) { ED.palette = true; ED.target = 0; refreshSheet(); toast('Tippe aufs Teil, um die Hauptfarbe zu übernehmen'); } },
    'ed-target'(el) { const t = +el.dataset.t; ED.palette = !(ED.palette && ED.target === t); ED.target = t; refreshSheet(); },
    'ed-color'(el) {
      const c = el.dataset.c; ED.touched.colors = true;
      if (ED.target === 1) { if (c) ED.item.colors[1] = c; else ED.item.colors.splice(1, 1); }
      else { ED.item.colors[0] = c; if (ED.item.colors[1] === c) ED.item.colors.splice(1, 1); }
      ED.palette = false; refreshSheet();
    },
    'ed-cat'(el) { ED.cat = el.dataset.k; refreshSheet(); },
    'ed-type'(el) {
      const k = el.dataset.k, t = E.TYPES[k]; ED.item.type = k;
      if (!ED.touched.warmth) ED.item.warmth = clamp(t.w || 2, 1, 5);
      if (!ED.touched.formality) ED.item.formality = clamp(t.f || 3, 1, 5);
      if (k === 'jeans' && !(ED.item.materials || []).length) ED.item.materials = ['denim'];
      refreshSheet();
    },
    'ed-allmats'() { ED.allMats = true; refreshSheet(); },
    'ed-pattern'(el) { ED.item.pattern = el.dataset.k; refreshSheet(); },
    'ed-mat'(el) { const k = el.dataset.k, m = ED.item.materials || (ED.item.materials = []); const i = m.indexOf(k); if (i >= 0) m.splice(i, 1); else m.push(k); refreshSheet(); },
    'ed-warmth'(el) { ED.item.warmth = +el.dataset.n; ED.touched.warmth = true; refreshSheet(); },
    'ed-formality'(el) { ED.item.formality = +el.dataset.n; ED.touched.formality = true; refreshSheet(); },
    'ed-fit'(el) { ED.item.fit = el.dataset.k; refreshSheet(); },
    'ed-status'(el) { ED.item.status = el.dataset.k; refreshSheet(); },
    'ed-cond'(el) { ED.item.condition = el.dataset.k; refreshSheet(); },
    'ed-fav'() { ED.item.fav = !ED.item.fav; refreshSheet(); },
    'ed-ocr-apply'() {
      const r = ED.ocr; ED.item.materials = [...new Set(r.materials.map(m => m.id))];
      if (!ED.touched.warmth && r.warmthHint && ED.item.type) ED.item.warmth = clamp((E.TYPES[ED.item.type].w || 2) + r.warmthHint, 1, 5);
      ED.ocr = null; refreshSheet(); toast('Material übernommen');
    },
    'ed-save'() { edSave(); },
    async 'ed-delete'() {
      if (!confirm('Dieses Teil endgültig löschen – zum Beispiel, weil du es aussortiert hast?')) return;
      const id = ED.item.id; closeSheet(); await deleteItem(id); rerender(); toast('Gelöscht');
    },
    // PIN
    'pin-set'() { PS = { stage: 'new', first: '', cur: '' }; openSheet(pinSetSheet, 'PIN festlegen'); },
    async 'pin-key'(el) {
      const k = el.dataset.k;
      if (k === 'del') PS.cur = PS.cur.slice(0, -1); else if (PS.cur.length < 4) PS.cur += k;
      refreshSheet();
      if (PS.cur.length < 4) return;
      if (PS.stage === 'new') { PS.first = PS.cur; PS.cur = ''; PS.stage = 'confirm'; setTimeout(refreshSheet, 150); return; }
      if (PS.cur !== PS.first) { PS = { stage: 'new', first: '', cur: '' }; toast('Die PINs waren unterschiedlich. Bitte noch einmal.'); return refreshSheet(); }
      const salt = hex(crypto.getRandomValues(new Uint8Array(16)));
      S.pin = { salt, hash: await pinHash(PS.cur, salt) }; await saveKV('pin', S.pin);
      closeSheet(); rerender(); toast('PIN ist aktiv');
    },
    async 'pin-remove'() { if (!confirm('PIN-Sperre wirklich entfernen?')) return; S.pin = null; await DB.del('kv', 'pin'); rerender(); toast('PIN entfernt'); },
    // Sicherung
    backup() { BK = { mode: 'save', pw1: '', pw2: '', busy: '', err: '' }; openSheet(backupSheet, 'Sicherung erstellen'); },
    'bk-save'() { doBackup(false); },
    'bk-share'() { doBackup(true); },
    restore() { document.getElementById('file-backup').click(); },
    async 'bk-restore'() {
      BK.err = ''; BK.busy = 'Sicherung wird entschlüsselt'; refreshSheet();
      try {
        const data = await readBackup(BK.file, BK.pw1);
        BK.busy = 'Daten werden wiederhergestellt'; refreshSheet();
        await restoreBackup(data);
        location.reload();
      } catch (e) { BK.busy = ''; BK.err = e.message === 'pw' ? 'Das Passwort passt nicht zu dieser Sicherung.' : 'Diese Datei ist keine gültige Kleiderschrank-Sicherung.'; refreshSheet(); }
    },
    async 'learn-reset'() { if (!confirm('Alles Gelernte aus Bewertungen zurücksetzen? Deine Lieblinge bleiben erhalten.')) return; S.learn = {}; await saveKV('learn', {}); invalidate(); rerender(); toast('Gelerntes zurückgesetzt'); },
    async wipe() {
      if (!confirm('Wirklich alle Daten löschen? Schrank, Fotos, Profil und Verlauf sind danach weg.')) return;
      if (!confirm('Letzte Rückfrage: Alles unwiderruflich löschen?')) return;
      await DB.clearAll(); location.reload();
    }
  };

  function dispatch(e) {
    const el = e.target.closest('[data-act]'); if (!el || el.disabled) return;
    const fn = A[el.dataset.act]; if (fn) { e.preventDefault(); fn(el, e); }
  }
  app.addEventListener('click', dispatch);
  sheetsEl.addEventListener('click', dispatch);
  document.querySelector('nav.tabs').addEventListener('click', e => { const b = e.target.closest('[data-nav]'); if (b) { S.view = b.dataset.nav; if (S.view === 'outfits' && S.weatherState !== 'loading') refreshWeather(false); render(); } });

  function onField(e) {
    const f = e.target.dataset && e.target.dataset.field; if (!f) return;
    const v = e.target.value;
    if (f === 'age' || f === 'height') { S.profile[f] = v; saveProfile(); }
    else if (f === 'city-q') { S.city.q = v; if (e.type === 'keydown') { e.preventDefault(); A['city-search'](); } }
    else if (f === 'status-filter') { S.status = v; rerender(); }
    else if (f === 'ed-note' && ED) ED.item.note = v;
    else if (f === 'bk-pw1' && BK) BK.pw1 = v;
    else if (f === 'bk-pw2' && BK) BK.pw2 = v;
  }
  document.addEventListener('input', onField);
  document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.dataset && e.target.dataset.field === 'city-q') onField(e); });

  const onFile = (id, fn) => document.getElementById(id).addEventListener('change', e => { const f = e.target.files && e.target.files[0]; e.target.value = ''; if (f) fn(f); });
  onFile('file-camera', edSetPhoto);
  onFile('file-gallery', edSetPhoto);
  onFile('file-label', edScanLabel);
  onFile('file-backup', f => { BK = { mode: 'restore', file: f, pw1: '', busy: '', err: '' }; openSheet(backupSheet, 'Sicherung laden'); });

  // ------------------------------------------------------------ Start
  async function start() {
    try { await load(); }
    catch (e) { app.innerHTML = '<div class="view"><div class="note"><p>Der Speicher dieses Browsers ist nicht verfügbar. Öffne die App bitte in Chrome und nicht im privaten Modus.</p></div></div>'; return; }
    if (S.pin) showLock();
    render();
    refreshWeather(false);
    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) navigator.serviceWorker.register('sw.js').catch(() => {});
    window.addEventListener('online', () => { if (S.weatherState === 'stale' || S.weatherState === 'error') refreshWeather(true); });
  }
  window.__app = { S, A, DB, render }; // nur zum Testen
  start();
})();
