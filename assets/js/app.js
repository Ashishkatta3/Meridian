/* ===========================================================
   MERIDIAN — engine, views and router.
   Your data lives in data.js. world.js and land.js are generated.
   =========================================================== */
const slug = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
const esc = s => String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const pad2 = n => String(n).padStart(2,'0');
const clamp = (v,a,b) => v < a ? a : v > b ? b : v;

/* ---------- the United States, in detail ---------- */
const ATLAS = STATES.map(([name,abbr,tz,cities])=>{
  const st = {name, abbr, tz, slug:abbr.toLowerCase(), id:'state:'+abbr,
    statewide:(STATEWIDE[abbr]||[]).map(([t,lat,lon,d,tag,b])=>
      ({title:t, lat, lon, desc:d, tag, id:'place:'+abbr+':'+slug(t), seed:b?'been':'none'}))};
  st.cities = cities.map(([cn,lat,lon,ctz])=>{
    const s = slug(cn), key = abbr+'-'+s;
    return {name:cn, slug:s, key, id:'city:'+key, lat, lon, tz:ctz||tz, state:st,
      seed: VISITED.has(key) ? 'been' : 'none',
      todo:(TODO[key]||[]).map(([t,d,g])=>({title:t, desc:d, tag:g, id:'todo:'+key+':'+slug(t)})),
      eat:(EAT[key]||[]).map(([n,c,note])=>({name:n, cuisine:c, note, id:'eat:'+key+':'+slug(n)}))};
  });
  return st;
});
const BY_ABBR = Object.fromEntries(ATLAS.map(s=>[s.slug,s]));
const ALL_CITIES = ATLAS.flatMap(s=>s.cities);
const CITY_BY_KEY = Object.fromEntries(ALL_CITIES.map(c=>[c.key,c]));

/* ---------- the world ---------- */
const CONTINENTS = WORLD.map(([name,blurb,countries])=>{
  const cont = {name, blurb, slug:slug(name), id:'cont:'+slug(name)};
  cont.countries = countries.map(([cn,cap,lat,lon,tz])=>({
    name:cn, slug:slug(cn), id:'country:'+slug(cn), capital:cap, lat, lon, tz,
    continent:cont, detailed: cn === DETAILED_COUNTRY,
    seed: cn === DETAILED_COUNTRY ? 'been' : 'none'}));
  return cont;
});
const CONT_BY_SLUG = Object.fromEntries(CONTINENTS.map(c=>[c.slug,c]));
const ALL_COUNTRIES = CONTINENTS.flatMap(c=>c.countries);
const CO_BY_SLUG = Object.fromEntries(ALL_COUNTRIES.map(c=>[c.slug,c]));
const USA = ALL_COUNTRIES.find(c=>c.detailed);
const HOME_CONT = USA.continent;

/* ---------- places you add from the suggestion lists ---------- */
const ADD_KEY = 'meridian-added';
let ADDED = [];
try { ADDED = JSON.parse(localStorage.getItem(ADD_KEY) || '[]'); } catch(e){ ADDED = []; }
const saveAdded = () => { try { localStorage.setItem(ADD_KEY, JSON.stringify(ADDED)); } catch(e){} cloudPushSoon(); };
const addedId = (co,kind,name) => 'add:'+co+':'+kind+':'+slug(name);
const addedFor = co => ADDED.filter(a=>a.c === co);
function addPlace(coSlug, kind, name, lat, lon, tz){
  const id = addedId(coSlug, kind, name);
  if (ADDED.some(a=>a.id === id)) return;
  const co = CO_BY_SLUG[coSlug];
  ADDED.push({id, c:coSlug, cont:co.continent.slug, k:kind, n:name, lat, lon, tz:tz||co.tz});
  saveAdded(); setStatus(id, 'want');
}
function removePlace(id){
  ADDED = ADDED.filter(a=>a.id !== id);
  saveAdded(); delete STATUS[id]; saveStatus();
}

/* ===========================================================
   ENTRIES — things to do, places to eat and notes that YOU
   write in the browser. Nothing here needs a code change.
   Text lives in localStorage; photos live in IndexedDB, which
   has room for far more than localStorage would.
   =========================================================== */
const ENT_KEY = 'meridian-entries';
let ENTRIES = {};
try { ENTRIES = JSON.parse(localStorage.getItem(ENT_KEY) || '{}'); } catch(e){ ENTRIES = {}; }
const saveEntries = () => { try { localStorage.setItem(ENT_KEY, JSON.stringify(ENTRIES)); } catch(e){
  alert('Your browser would not save that — you may be out of local storage.'); } cloudPushSoon(); };

let PHOTO_DB = null;
function photoDB(){
  if (PHOTO_DB) return PHOTO_DB;
  PHOTO_DB = new Promise((res,rej)=>{
    if (!window.indexedDB) return rej(new Error('no indexeddb'));
    const r = indexedDB.open('meridian-photos', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('photos');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  return PHOTO_DB;
}
async function photoPut(id, dataURL, localOnly){
  const db = await photoDB();
  await new Promise((res,rej)=>{ const t = db.transaction('photos','readwrite');
    t.objectStore('photos').put(dataURL, id); t.oncomplete = res; t.onerror = ()=>rej(t.error); });
  if (!localOnly) cloudPutPhoto(id, dataURL);
}
async function photoGet(id){
  try {
    const db = await photoDB();
    const local = await new Promise((res,rej)=>{ const t = db.transaction('photos','readonly');
      const q = t.objectStore('photos').get(id); q.onsuccess = ()=>res(q.result); q.onerror = ()=>rej(q.error); });
    if (local) return local;
  } catch(e){}
  const remote = await cloudGetPhoto(id);               // signed in on a new device
  if (remote) { try { await photoPut(id, remote, true); } catch(e){} }
  return remote;
}
async function photoDel(id){
  try { const db = await photoDB();
    const t = db.transaction('photos','readwrite'); t.objectStore('photos').delete(id); } catch(e){}
  cloudDelPhoto(id);
}
/* shrink on the way in so a phone photo does not eat the quota */
function readPhoto(file){
  return new Promise((res,rej)=>{
    const fr = new FileReader();
    fr.onerror = rej;
    fr.onload = () => {
      const img = new Image();
      img.onerror = rej;
      img.onload = () => {
        const max = 1600, k = Math.min(1, max/Math.max(img.width, img.height));
        const cv = document.createElement('canvas');
        cv.width = Math.round(img.width*k); cv.height = Math.round(img.height*k);
        cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
        res(cv.toDataURL('image/jpeg', 0.82));
      };
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  });
}
async function paintPhotos(){
  const imgs = [...document.querySelectorAll('img[data-photo]')];
  for (const el of imgs){
    try { const d = await photoGet(el.dataset.photo); if (d) el.src = d; } catch(e){}
  }
}

const seedEntries = (scope, kind) => {
  const c = CITY_BY_KEY[scope];
  if (!c) return [];
  return kind === 'todo'
    ? c.todo.map(t=>({id:t.id, t:t.title, d:t.desc, g:t.tag, ph:[]}))
    : c.eat.map(e=>({id:e.id, t:e.name, d:e.note||'', g:e.cuisine||'', ph:[]}));
};
const entriesOf = (scope, kind) => {
  const k = scope+'|'+kind;
  return ENTRIES[k] ? ENTRIES[k] : seedEntries(scope, kind);
};
function mutateEntries(scope, kind, fn){
  const k = scope+'|'+kind;
  if (!ENTRIES[k]) ENTRIES[k] = seedEntries(scope, kind);
  fn(ENTRIES[k]);
  saveEntries();
}
const noteOf = scope => ENTRIES[scope+'|note'] || '';
function setNote(scope, text){
  if (text) ENTRIES[scope+'|note'] = text; else delete ENTRIES[scope+'|note'];
  saveEntries();
}

/* ===========================================================
   DATES, PREFERENCES AND THE WHOLE-JOURNAL EXPORT
   =========================================================== */
const DATE_KEY = 'meridian-dates', PREF_KEY = 'meridian-prefs';
let DATES = {}, PREFS = {passport:'united-states',
  home:{name:'Dallas–Fort Worth', lat:32.78, lon:-96.80, co:'united-states'},
  homeCountry:'', livingCountry:''};
try { DATES = JSON.parse(localStorage.getItem(DATE_KEY) || '{}'); } catch(e){ DATES = {}; }
try { PREFS = Object.assign(PREFS, JSON.parse(localStorage.getItem(PREF_KEY) || '{}')); } catch(e){}

const saveDates = () => { try { localStorage.setItem(DATE_KEY, JSON.stringify(DATES)); } catch(e){} cloudPushSoon(); };
const savePrefs = () => { try { localStorage.setItem(PREF_KEY, JSON.stringify(PREFS)); } catch(e){} cloudPushSoon(); };
function persistAllLocal(){
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(STATUS));
    localStorage.setItem(ADD_KEY, JSON.stringify(ADDED));
    localStorage.setItem(ENT_KEY, JSON.stringify(ENTRIES));
    localStorage.setItem(DATE_KEY, JSON.stringify(DATES));
    localStorage.setItem(PREF_KEY, JSON.stringify(PREFS));
    localStorage.setItem(TRIP_KEY, JSON.stringify(TRIPS));
  } catch(e){}
}

/* ---------- where you are from, and where you live now ----------
   Two different things. The passport decides the visa line; the
   country you actually live in decides the money you think in and
   which flights count as going home. */
const homeCountry = () =>
  CO_BY_SLUG[PREFS.homeCountry] || CO_BY_SLUG[PREFS.passport] || null;
const livingCountry = () =>
  CO_BY_SLUG[PREFS.livingCountry] || CO_BY_SLUG[(PREFS.home && PREFS.home.co) || ''] || homeCountry();
const homeMoney = () => {
  const co = livingCountry();
  return (co && currencyOf(co.slug)) || ['USD','$'];
};

const dateOf = id => DATES[id] || '';
function setDate(id, v){
  if (v) DATES[id] = v; else delete DATES[id];
  saveDates();
}
const prettyDate = v => {
  if (!v) return '';
  const [y, m] = v.split('-');
  if (!m) return y;
  return new Date(+y, +m-1, 1).toLocaleDateString('en-US', {month:'short', year:'numeric'});
};

/* ---------- how far away is it, and do you need a visa ---------- */
function greatCircle(a, b){
  const R = 6371, r = Math.PI/180;
  const dLat = (b.lat-a.lat)*r, dLon = (b.lon-a.lon)*r;
  const h = Math.sin(dLat/2)**2 + Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin(dLon/2)**2;
  return 2*R*Math.asin(Math.sqrt(h));
}
function flightEstimate(target){
  const km = greatCircle(PREFS.home, target);
  if (km < 60) return null;
  const hrs = km/850 + 0.6;                       // cruise plus taxi, climb and descent
  const h = Math.floor(hrs), m = Math.round((hrs-h)*60);
  return {km: Math.round(km), miles: Math.round(km*0.621371),
          text: (h?h+'h ':'') + (m?m+'m':''), direct: km < 13500};
}
const VISA_LABEL = {
  home:     ['YOUR OWN COUNTRY', 'No entry requirements to worry about.'],
  arrival:  ['VISA ON ARRIVAL',  'Issued at the border. Carry a passport photo, the fee in cash, and proof of onward travel.'],
  evisa:    ['E-VISA',           'Applied for online before you fly. Usually a few days, occasionally a few weeks.'],
  eta:      ['TRAVEL AUTHORISATION', 'A short online form, approved in minutes to a couple of days. Not a full visa.'],
  required: ['VISA REQUIRED',    'Applied for in advance, often in person at an embassy or visa centre. Start early — several weeks is common.'],
  closed:   ['ENTRY NOT PERMITTED', 'Entry is not currently available on this passport.']
};
function visaFor(countrySlug){
  const table = VISA[PREFS.passport];
  if (!table) return null;
  let code = table[countrySlug];
  if (!code) return null;
  let via = null;
  if (code.includes('|')){ const bits = code.split('|'); code = bits[0]; via = bits[1]; }
  if (code.startsWith('free:')){
    const days = code.slice(5);
    return {kind:'free', head:'VISA FREE', body: days
      ? 'Entry without a visa for up to ' + days + ' days.'
      : 'Entry without a visa for short visits.', via};
  }
  const L = VISA_LABEL[code] || VISA_LABEL.required;
  return {kind: code, head: L[0], body: L[1], via};
}
const passportName = () => (PASSPORTS.find(p=>p[0] === PREFS.passport) || ['','—'])[1];

/* ---------- the guide: shipped profiles, overridden by admin edits ---------- */
function profileOf(slug){
  const base = PROFILE[slug] || {b:'', s:'', p:[], w:[]};
  const over = (typeof GUIDE !== 'undefined' && GUIDE['country:'+slug]) || null;
  return over ? Object.assign({}, base, over) : base;
}

/* ---------- export and import: your journal as one file ---------- */
async function exportJournal(){
  const ids = [];
  Object.keys(ENTRIES).forEach(k=>{
    if (Array.isArray(ENTRIES[k])) ENTRIES[k].forEach(e=>(e.ph||[]).forEach(p=>ids.push(p)));
  });
  const photos = {};
  for (const id of [...new Set(ids)]){
    const d = await photoGet(id);
    if (d) photos[id] = d;
  }
  const blob = {
    meridian: 3,
    exported: new Date().toISOString(),
    status: STATUS, added: ADDED, entries: ENTRIES, dates: DATES, prefs: PREFS,
    trips: TRIPS, photos
  };
  const stamp = new Date().toISOString().slice(0,10);
  offerFile('meridian-journal-' + stamp + '.json', JSON.stringify(blob), 'application/json');
}
async function importJournal(file, merge){
  const text = await file.text();
  let d;
  try { d = JSON.parse(text); } catch(e){ return {error:'That file is not valid JSON.'}; }
  if (!d || !d.meridian) return {error:'That does not look like a Meridian export.'};
  if (merge){
    Object.assign(STATUS, d.status || {});
    Object.assign(DATES, d.dates || {});
    Object.assign(ENTRIES, d.entries || {});
    const have = new Set(ADDED.map(a=>a.id));
    (d.added || []).forEach(a=>{ if (!have.has(a.id)) ADDED.push(a); });
    const haveT = new Set(TRIPS.map(t=>t.id));
    (d.trips || []).forEach(t=>{ if (!haveT.has(t.id)) TRIPS.push(t); });
  } else {
    STATUS = d.status || {}; DATES = d.dates || {};
    ENTRIES = d.entries || {}; ADDED = d.added || [];
    TRIPS = d.trips || [];
  }
  if (d.prefs) PREFS = Object.assign(PREFS, d.prefs);
  let restored = 0;
  for (const [id, dataURL] of Object.entries(d.photos || {})){
    try { await photoPut(id, dataURL); restored++; } catch(e){}
  }
  persistAllLocal();
  cloudPushSoon();
  return {ok:true, photos:restored};
}

/* ---------- been / want to go / no mark ---------- */
const STORE_KEY = 'meridian-status';
let STATUS = {};
try { STATUS = JSON.parse(localStorage.getItem(STORE_KEY) || '{}'); } catch(e){ STATUS = {}; }
const saveStatus = () => { try { localStorage.setItem(STORE_KEY, JSON.stringify(STATUS)); } catch(e){} cloudPushSoon(); };
const SEED = {};
ALL_CITIES.forEach(c=>{ if (c.seed !== 'none') SEED[c.id] = c.seed; });
ATLAS.forEach(s=>s.statewide.forEach(p=>{ if (p.seed !== 'none') SEED[p.id] = p.seed; }));
ALL_COUNTRIES.forEach(c=>{ if (c.seed !== 'none') SEED[c.id] = c.seed; });

const statusOf = id => (id in STATUS) ? STATUS[id] : (SEED[id] || 'none');
const been = id => statusOf(id) === 'been';
const want = id => statusOf(id) === 'want';
function setStatus(id, v){ STATUS[id] = v; saveStatus(); }

function stateStatus(st){
  if (st.id in STATUS && STATUS[st.id] !== 'none') return STATUS[st.id];
  if (st.cities.some(c=>been(c.id)) || st.statewide.some(p=>been(p.id))) return 'been';
  if (st.cities.some(c=>want(c.id)) || st.statewide.some(p=>want(p.id))) return 'want';
  return statusOf(st.id);
}
function countryStatus(co){
  if (co.id in STATUS && STATUS[co.id] !== 'none') return STATUS[co.id];
  const own = addedFor(co.slug).map(a=>statusOf(a.id));
  if (co.detailed && ATLAS.some(s=>stateStatus(s)==='been')) return 'been';
  if (own.includes('been')) return 'been';
  if (co.detailed && ATLAS.some(s=>stateStatus(s)==='want')) return 'want';
  if (own.includes('want')) return 'want';
  return statusOf(co.id);
}
function continentStatus(ct){
  if (ct.id in STATUS && STATUS[ct.id] !== 'none') return STATUS[ct.id];
  const s = ct.countries.map(countryStatus);
  return s.includes('been') ? 'been' : s.includes('want') ? 'want' : statusOf(ct.id);
}
const counts = () => ({
  continents: CONTINENTS.filter(c=>continentStatus(c)==='been').length,
  countries: ALL_COUNTRIES.filter(c=>countryStatus(c)==='been').length,
  states: ATLAS.filter(s=>stateStatus(s)==='been').length,
  cities: ALL_CITIES.filter(c=>been(c.id)).length + ADDED.filter(a=>a.k==='city' && been(a.id)).length,
  places: ATLAS.reduce((n,s)=>n+s.statewide.filter(p=>been(p.id)).length,0)
          + ADDED.filter(a=>a.k==='region' && been(a.id)).length,
  wish: everything().filter(e=>statusOf(e.id)==='want').length
});
function everything(){
  const out = [];
  CONTINENTS.forEach(ct=>{
    out.push({id:ct.id, name:ct.name, kind:'Continent', href:contHref(ct)});
    ct.countries.forEach(co=>out.push({id:co.id, name:co.name, kind:'Country', sub:ct.name, href:countryHref(co), lat:co.lat, lon:co.lon, tz:co.tz}));
  });
  ATLAS.forEach(st=>{
    out.push({id:st.id, name:st.name, kind:'State', sub:'United States', href:stateHref(st)});
    st.statewide.forEach(p=>out.push({id:p.id, name:p.title, kind:'Park or region', sub:st.name, href:stateHref(st), lat:p.lat, lon:p.lon}));
    st.cities.forEach(c=>{
      out.push({id:c.id, name:c.name, kind:'City', sub:st.name, href:cityHref(c), lat:c.lat, lon:c.lon, tz:c.tz});
      c.todo.forEach(t=>out.push({id:t.id, name:t.title, kind:'Thing to do', sub:c.name, href:cityHref(c)}));
      c.eat.forEach(e=>out.push({id:e.id, name:e.name, kind:'Restaurant', sub:c.name, href:cityHref(c)}));
    });
  });
  ADDED.forEach(a=>out.push({id:a.id, name:a.n, kind: a.k==='city'?'City':'Region',
    sub:(CO_BY_SLUG[a.c]||{}).name||'', href:'#/'+a.cont+'/'+a.c, lat:a.lat, lon:a.lon, tz:a.tz}));
  return out;
}

/* ---------- sun position: NOAA sunrise equation, no network needed ---------- */
const RAD = Math.PI/180, J2000 = 2451545.0;
function sunTimes(lat, lon, when){
  const J = when.getTime()/86400000 + 2440587.5, lw = -lon;
  const n = Math.round(J - J2000 - 0.0009 - lw/360);
  const Js = J2000 + 0.0009 + lw/360 + n;
  const M = (357.5291 + 0.98560028*(Js - J2000)) % 360;
  const C = 1.9148*Math.sin(M*RAD) + 0.02*Math.sin(2*M*RAD) + 0.0003*Math.sin(3*M*RAD);
  const lam = (M + C + 180 + 102.9372) % 360;
  const Jt = Js + 0.0053*Math.sin(M*RAD) - 0.0069*Math.sin(2*lam*RAD);
  const dec = Math.asin(Math.sin(lam*RAD)*Math.sin(23.4397*RAD));
  const cosH = (Math.sin(-0.833*RAD) - Math.sin(lat*RAD)*Math.sin(dec)) / (Math.cos(lat*RAD)*Math.cos(dec));
  if (cosH >= 1) return {polar:'night'};
  if (cosH <= -1) return {polar:'day'};
  const H = Math.acos(cosH)/RAD, toDate = j => new Date((j - 2440587.5)*86400000);
  return {rise: toDate(Jt - H/360), set: toDate(Jt + H/360)};
}
function isNightAt(lat, lon, when){
  const t = sunTimes(lat, lon, when || new Date());
  if (t.polar) return t.polar === 'night';
  const now = (when||new Date()).getTime();
  return now < t.rise.getTime() || now > t.set.getTime();
}
const fmtTime = (d, tz) => { try { return new Intl.DateTimeFormat('en-US',{hour:'numeric',minute:'2-digit',timeZone:tz}).format(d); }
  catch(e){ return new Intl.DateTimeFormat('en-US',{hour:'numeric',minute:'2-digit'}).format(d); } };
const fmtZone = (d, tz) => { try { return new Intl.DateTimeFormat('en-US',{timeZoneName:'short',timeZone:tz})
  .formatToParts(d).find(p=>p.type==='timeZoneName').value; } catch(e){ return ''; } };
const fmtDay = (d, tz) => { try { return new Intl.DateTimeFormat('en-US',{weekday:'short',day:'numeric',month:'short',timeZone:tz}).format(d); } catch(e){ return ''; } };
const coord = (lat,lon)=> Math.abs(lat).toFixed(2)+'°'+(lat<0?'S':'N')+' '+Math.abs(lon).toFixed(2)+'°'+(lon<0?'W':'E');

/* ---------- sky glyphs: drawn, never emoji ---------- */
const G = {
  clear:'<circle cx="12" cy="12" r="4.3"/><path d="M12 2.2v2.4M12 19.4v2.4M2.2 12h2.4M19.4 12h2.4M5.1 5.1l1.7 1.7M17.2 17.2l1.7 1.7M18.9 5.1l-1.7 1.7M6.8 17.2l-1.7 1.7"/>',
  night:'<path d="M19.4 14.6A8 8 0 0 1 9.4 4.6a8 8 0 1 0 10 10Z"/>',
  partly:'<circle cx="9.2" cy="8.6" r="3"/><path d="M9.2 3.1v1.5M3.7 8.6h1.5M5.3 4.7l1.1 1.1M13.1 4.7 12 5.8"/><path d="M10.4 19.4h6.9a3.3 3.3 0 0 0 .3-6.6 5 5 0 0 0-9.4-1 2.9 2.9 0 0 0 2.2 7.6Z"/>',
  cloudy:'<path d="M7.3 18.4h9.4a3.9 3.9 0 0 0 .4-7.8 5.9 5.9 0 0 0-11.4 1.6 3.3 3.3 0 0 0 1.6 6.2Z"/>',
  rain:'<path d="M7.3 16.6h9.4a3.9 3.9 0 0 0 .4-7.8 5.9 5.9 0 0 0-11.4 1.6 3.3 3.3 0 0 0 1.6 6.2Z"/><path d="m9.2 19.1-.9 2.3M13 19.1l-.9 2.3M16.8 19.1l-.9 2.3"/>',
  snow:'<path d="M7.3 16.2h9.4a3.9 3.9 0 0 0 .4-7.8 5.9 5.9 0 0 0-11.4 1.6 3.3 3.3 0 0 0 1.6 6.2Z"/><path d="M9.4 20.1h.01M12.9 21.4h.01M16.4 20.1h.01"/>',
  storm:'<path d="M7.3 15.4h9.4a3.9 3.9 0 0 0 .4-7.8 5.9 5.9 0 0 0-11.4 1.6 3.3 3.3 0 0 0 1.6 6.2Z"/><path d="M13 17.2 10 21.3h3l-.9 2.3"/>',
  fog:'<path d="M3.4 8.6h12.4M5.8 12.4h14M3.4 16.2h10.6M17.8 16.2h2.6"/>'
};
const glyph = (k,size) => '<svg width="'+(size||19)+'" height="'+(size||19)+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(G[k]||G.cloudy)+'</svg>';
function codeToSky(code, night){
  if (code === 0) return night ? ['night','CLEAR'] : ['clear','CLEAR'];
  if (code === 1 || code === 2) return ['partly','PARTLY CLOUDY'];
  if (code === 3) return ['cloudy','OVERCAST'];
  if (code === 45 || code === 48) return ['fog','FOG'];
  if (code >= 95) return ['storm','THUNDERSTORM'];
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return ['snow','SNOW'];
  if (code >= 51) return ['rain','RAIN'];
  return ['cloudy','CLOUD'];
}

/* ---------- weather: Open-Meteo, free, no key ---------- */
const WX = {};
async function loadWeather(points){
  const need = points.filter(p=>p && !(p.key in WX));
  if (!need.length){ paintWeather(); return; }
  try{
    const url = 'https://api.open-meteo.com/v1/forecast?latitude='+need.map(p=>p.lat).join(',')
      +'&longitude='+need.map(p=>p.lon).join(',')
      +'&current=temperature_2m,weather_code&temperature_unit=fahrenheit';
    const r = await fetch(url);
    if (!r.ok) throw new Error('bad response');
    let j = await r.json();
    if (!Array.isArray(j)) j = [j];
    j.forEach((d,i)=>{ if (d && d.current) WX[need[i].key] = {t:Math.round(d.current.temperature_2m), c:d.current.weather_code}; });
    paintWeather();
  }catch(e){ /* offline or blocked: clocks and sun keep working */ }
}
function paintWeather(){
  document.querySelectorAll('[data-wx]').forEach(el=>{
    const w = WX[el.dataset.wx];
    if (!w) return;
    const night = el.dataset.night === '1', big = el.dataset.big === '1';
    const sky = codeToSky(w.c, night);
    el.innerHTML = glyph(sky[0], big?26:14) + '<span class="'+(big?'ro-v':'')+'">'+w.t+'°F</span>'
      + (big ? '<span class="lab-s" style="margin-left:4px">'+sky[1]+'</span>' : '');
  });
}

/* ---------- theme ---------- */
let themeMode = localStorage.getItem('meridian-theme') || 'auto';
let routeIsNight = false;
function applyTheme(){
  const dark = themeMode === 'auto' ? routeIsNight : themeMode === 'dark';
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.getElementById('themelab').textContent = themeMode.toUpperCase();
}
document.getElementById('themebtn').addEventListener('click',()=>{
  themeMode = themeMode === 'auto' ? 'light' : themeMode === 'light' ? 'dark' : 'auto';
  localStorage.setItem('meridian-theme', themeMode);
  applyTheme();
});

/* ---------- CSV export ---------- */
function csvOf(rows){
  const q = v => '"'+String(v==null?'':v).replace(/"/g,'""')+'"';
  return ['Name,Location,Category,Status,Notes'].concat(rows.map(r=>r.map(q).join(','))).join('\r\n');
}
async function offerFile(filename, text, mime){
  let dl = null;
  try { if (window.claude && claude.use) dl = await claude.use('downloads'); } catch(e){}
  if (dl){ try { await dl.save({filename, data:text}); } catch(e){} return; }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text],{type: mime || 'text/csv'}));
  a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href), 4000);
}
const mark = id => statusOf(id).toUpperCase();
function cityRows(c){
  const where = c.name+', '+c.state.name;
  return [[c.name+' — city centre', where, 'CITY', mark(c.id), noteOf(c.key)]]
    .concat(entryRows(c.key,'todo',where,'THING TO DO'), entryRows(c.key,'eat',where,'RESTAURANT'));
}
function placeRows(a){
  const co = CO_BY_SLUG[a.c] || {name:''};
  const where = a.n+', '+co.name;
  return [[a.n, where, a.k.toUpperCase(), mark(a.id), noteOf(a.id)]]
    .concat(entryRows(a.id,'todo',where,'THING TO DO'), entryRows(a.id,'eat',where,'RESTAURANT'));
}
function stateRows(st){
  const rows = [];
  st.statewide.forEach(p=>rows.push([p.title, p.title+', '+st.name, p.tag, mark(p.id), p.desc]));
  st.cities.filter(c=>statusOf(c.id)!=='none' || entriesOf(c.key,'todo').length).forEach(c=>rows.push(...cityRows(c)));
  return rows;
}
function countryRows(co){
  const rows = [[co.capital+' — capital', co.capital+', '+co.name, 'CAPITAL', mark(co.id), noteOf(co.id)]];
  addedFor(co.slug).forEach(a=>rows.push(...placeRows(a)));
  return rows;
}
function worldRows(){
  const rows = [];
  ALL_COUNTRIES.forEach(co=>{ if (countryStatus(co) !== 'none' || addedFor(co.slug).length) rows.push(...countryRows(co)); });
  ATLAS.forEach(st=>rows.push(...stateRows(st)));
  return rows;
}
document.addEventListener('click', e=>{
  const b = e.target.closest('[data-dl]');
  if (!b) return;
  const p = b.dataset.dl.split(':');
  if (p[0] === 'city'){ const c = CITY_BY_KEY[p[1]]; offerFile(c.slug+'-places.csv', csvOf(cityRows(c))); }
  else if (p[0] === 'state'){ const s = BY_ABBR[p[1]]; offerFile(s.slug+'-places.csv', csvOf(stateRows(s))); }
  else if (p[0] === 'country'){ const c = CO_BY_SLUG[p[1]]; offerFile(c.slug+'-places.csv', csvOf(countryRows(c))); }
  else if (p[0] === 'place'){ const a = ADDED.find(x=>x.id === b.dataset.dl.slice(6)); offerFile(slug(a.n)+'-places.csv', csvOf(placeRows(a))); }
  else offerFile('meridian-all-places.csv', csvOf(worldRows()));
});

/* ---------- icons and the been / want control ---------- */
const ICON = {
  down:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="M12 3.5v12"/><path d="m7.4 11.2 4.6 4.6 4.6-4.6"/><path d="M4.5 19.5h15"/></svg>',
  compass:'<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m15 9-2 4-4 2 2-4Z"/></svg>',
  check:'<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m4.5 12.8 5 5 10-11"/></svg>',
  flag:'<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5.5 21V4.2M5.5 5.2h12l-2.4 4 2.4 4h-12"/></svg>',
  star:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.6 14.6 9l5.9.8-4.3 4.1 1.1 5.8-5.3-2.9-5.3 2.9 1.1-5.8L3.5 9.8 9.4 9Z"/></svg>'
};
/* A continent is not somewhere you go on a date — it is the sum of the
   countries inside it. Dates belong to the places you actually stood in. */
const datable = id => !String(id).startsWith('cont:');
function ctl(id, label, withDate){
  const v = statusOf(id);
  const box = '<span class="statusctl" data-id="'+id+'" role="group" aria-label="'+esc(label||'Status')+'">'
    + '<button type="button" class="been" data-v="been" aria-pressed="'+(v==='been')+'">'+ICON.check+'BEEN</button>'
    + '<button type="button" class="want" data-v="want" aria-pressed="'+(v==='want')+'">'+ICON.flag+'WANT</button></span>';
  if (!withDate || v !== 'been' || !datable(id)) return box;
  return '<span class="ctlwrap">'+box
    + '<label class="whenbox"><span class="hidden">When did you go</span>'
    + '<input type="month" data-when="'+id+'" value="'+esc(dateOf(id))+'" max="2099-12"></label></span>';
}
const whenTag = id => (datable(id) && dateOf(id))
  ? '<span class="chip warm">'+esc(prettyDate(dateOf(id)))+'</span>' : '';
document.addEventListener('change', e=>{
  const w = e.target.closest('[data-when]');
  if (!w) return;
  setDate(w.dataset.when, w.value);
  rerender();
});
document.addEventListener('click', e=>{
  const btn = e.target.closest('.statusctl button');
  if (btn){
    e.preventDefault(); e.stopPropagation();
    const id = btn.closest('.statusctl').dataset.id;
    setStatus(id, statusOf(id) === btn.dataset.v ? 'none' : btn.dataset.v);
    return rerender();
  }
  const add = e.target.closest('[data-add]');
  if (add){
    e.preventDefault();
    const d = add.dataset;
    addPlace(d.co, d.kind, d.add, parseFloat(d.lat), parseFloat(d.lon), d.tz);
    return rerender();
  }
  const rm = e.target.closest('[data-rm]');
  if (rm){ e.preventDefault(); removePlace(rm.dataset.rm); return rerender(); }
});
function rerender(){ const y = window.scrollY; route(); window.scrollTo(0, y); }

document.addEventListener('click', async e=>{
  const a = e.target.closest('[data-auth]');
  if (a){
    e.preventDefault();
    const box = document.querySelector('[data-ed="auth"]');
    const val = sel => { const el = box && box.querySelector(sel); return el ? el.value.trim() : ''; };
    const mode = a.dataset.auth;
    if (mode === 'mode-up'){ AUTHMODE = 'up'; AUTHMSG = ''; return rerender(); }
    if (mode === 'mode-in'){ AUTHMODE = 'in'; AUTHMSG = ''; return rerender(); }
    if (mode === 'out'){ await cloudSignOut(); return; }
    if (mode === 'reset'){ const r = await cloudReset(val('.f-e')); AUTHMSG = r.error || r.note; return rerender(); }
    a.disabled = true; AUTHMSG = 'Working…'; 
    const r = mode === 'up' ? await cloudSignUp(val('.f-e'), val('.f-p2'), val('.f-n'))
                            : await cloudSignIn(val('.f-e'), val('.f-p2'));
    AUTHMSG = r.error || r.note || '';
    return rerender();
  }
  const ex = e.target.closest('[data-export]');
  if (ex){ e.preventDefault(); ex.disabled = true; await exportJournal(); ex.disabled = false; return; }

  const gs = e.target.closest('[data-guidesave]');
  if (gs){
    e.preventDefault();
    const sl = gs.dataset.guidesave, box = gs.closest('.editor');
    const spots = box.querySelector('.f-g2').value.split('\n').map(l=>l.trim()).filter(Boolean)
      .map(l=>{ const i = l.indexOf('|'); return i < 0 ? [l, ''] : [l.slice(0,i).trim(), l.slice(i+1).trim()]; });
    const body = {b: box.querySelector('.f-d').value.trim(), s: box.querySelector('.f-t').value.trim(),
                  p: spots, w: (PROFILE[sl]||{}).w || []};
    const r = await guideSave('country:'+sl, body);
    delete PENDING['guide|'+sl];
    if (r && r.error) alert(r.error);
    return rerender();
  }
  const gr = e.target.closest('[data-guidereset]');
  if (gr){
    e.preventDefault();
    await guideClear('country:'+gr.dataset.guidereset);
    delete PENDING['guide|'+gr.dataset.guidereset];
    return rerender();
  }
  const gopen = e.target.closest('[data-guide]');
  if (gopen){ e.preventDefault(); PENDING['guide|'+gopen.dataset.guide] = {t:'',d:'',g:'',keep:[],add:[]}; return rerender(); }
});

document.addEventListener('change', async e=>{
  const pf = e.target.closest('[data-pref]');
  if (pf){
    PREFS[pf.dataset.pref] = pf.value; savePrefs();
    if (pf.dataset.pref === 'livingCountry') loadRates(homeMoney()[0]);
    return rerender();
  }
  const im = e.target.closest('[data-import]');
  if (im && im.files && im.files[0]){
    const replace = im.dataset.import === 'replace';
    if (replace && !confirm('Replace everything currently on this device with the contents of that file?')) return;
    const r = await importJournal(im.files[0], !replace);
    alert(r.error ? r.error : 'Journal restored' + (r.photos ? ' with ' + r.photos + ' photo' + (r.photos===1?'':'s') : '') + '.');
    return rerender();
  }
});

/* home airport picker: every capital, plus every US city we know.
   It also remembers which country that city is in, which is what
   "living in" falls back to. */
function wireHomePort(){
  const box = document.getElementById('homeport');
  if (!box) return;
  const ac = document.getElementById('homeac');
  const pool = ALL_COUNTRIES.map(c=>[c.capital + ', ' + c.name, c.lat, c.lon, c.slug])
    .concat(ALL_CITIES.map(c=>[c.name + ', ' + c.state.abbr, c.lat, c.lon, USA.slug]));
  box.addEventListener('input', ()=>{
    const q = box.value.trim().toLowerCase();
    if (q.length < 2){ ac.classList.add('hidden'); return; }
    const hits = pool.filter(r=>r[0].toLowerCase().includes(q)).slice(0,7);
    if (!hits.length){ ac.classList.add('hidden'); return; }
    ac.innerHTML = hits.map(r=>'<button type="button">'+esc(r[0])+'</button>').join('');
    ac.classList.remove('hidden');
    [...ac.children].forEach((b,i)=>b.addEventListener('click', ()=>{
      PREFS.home = {name:hits[i][0], lat:hits[i][1], lon:hits[i][2], co:hits[i][3]};
      savePrefs();
      loadRates(homeMoney()[0]);
      rerender();
    }));
  });
}

/* ===========================================================
   TRIPS, ITINERARIES, BADGES — the controls
   =========================================================== */
document.addEventListener('click', async e=>{
  /* pick a month on any climate strip */
  const mo = e.target.closest('[data-month]');
  if (mo){ monthSel = +mo.dataset.month; return rerender(); }

  const mk = e.target.closest('[data-maketrip]');
  if (mk){
    const sugs = suggestTrips(datedBeen());
    const s = sugs[+mk.dataset.maketrip];
    if (s){ const t = tripCreate(s); location.hash = '#/trips/'+t.id; }
    return;
  }
  const td = e.target.closest('[data-tripdel]');
  if (td){
    if (!confirm('Delete this trip? The places and their dates stay — only the grouping goes.')) return;
    tripDelete(td.dataset.tripdel); location.hash = '#/trips'; return;
  }
  const drop = e.target.closest('[data-tripdrop]');
  if (drop){
    const [tid, pid] = drop.dataset.tripdrop.split('|');
    const t = tripOf(tid);
    if (t){ t.places = t.places.filter(p=>p !== pid); saveTrips(); }
    return rerender();
  }
  const da = e.target.closest('[data-dayadd]');
  if (da){ const t = tripOf(da.dataset.dayadd); if (t) dayAdd(t); return rerender(); }
  const dd = e.target.closest('[data-daydel]');
  if (dd){
    const [tid, i] = dd.dataset.daydel.split('|');
    const t = tripOf(tid); if (t) dayDel(t, +i);
    return rerender();
  }
  const sa = e.target.closest('[data-stopadd]');
  if (sa){
    const [tid, i] = sa.dataset.stopadd.split('|');
    const t = tripOf(tid); if (!t) return;
    const wrap = sa.closest('.addstop');
    const n = wrap.querySelector('.s-n').value.trim();
    if (!n) return;
    stopAdd(t, +i, n, wrap.querySelector('.s-t').value);
    return rerender();
  }
  const sd = e.target.closest('[data-stopdel]');
  if (sd){
    const [tid, i, j] = sd.dataset.stopdel.split('|');
    const t = tripOf(tid); if (t) stopDel(t, +i, +j);
    return rerender();
  }
  const sm = e.target.closest('[data-stopmove]');
  if (sm){
    const [tid, i, j, d] = sm.dataset.stopmove.split('|');
    const t = tripOf(tid); if (t) stopMove(t, +i, +j, +d);
    return rerender();
  }
  const doc = e.target.closest('[data-tripdoc]');
  if (doc){
    const t = tripOf(doc.dataset.tripdoc); if (!t) return;
    offerFile(slug(t.title || 'trip') + '-itinerary.doc',
      itineraryDoc(t, t.places.map(nameOfId)), 'application/msword');
    return;
  }

  /* badges: one, or the whole shelf */
  const sh = e.target.closest('[data-share]');
  if (sh){
    const [, name, sub] = sh.dataset.share.split('|');
    sh.disabled = true; const was = sh.textContent; sh.textContent = 'WORKING…';
    try {
      const svg = badgeSVG(name, sub, 420).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
      const png = await svgToPNG(svg, 420, 420, 2);
      const how = await shareBlob(png, slug(name)+'-badge.png', name + ' — Meridian');
      sh.textContent = how === 'saved' ? 'SAVED' : how === 'shared' ? 'SHARED' : was;
    } catch(err){ sh.textContent = 'COULD NOT SHARE'; }
    setTimeout(()=>{ sh.disabled = false; sh.textContent = was; }, 2200);
    return;
  }
  const sb = e.target.closest('[data-shareboard]');
  if (sb){
    sb.disabled = true; const was = sb.textContent; sb.textContent = 'Drawing…';
    try {
      const png = await boardPNG();
      const how = await shareBlob(png, 'meridian-board.png', 'My travel board — Meridian');
      sb.textContent = how === 'saved' ? 'Saved' : how === 'shared' ? 'Shared' : was;
    } catch(err){ sb.textContent = 'Could not share'; }
    setTimeout(()=>{ sb.disabled = false; sb.textContent = was; }, 2400);
    return;
  }
});
/* the whole board as one image: badges laid out in a grid with a count */
async function boardPNG(){
  const all = badgeItems();
  const cols = all.length <= 4 ? all.length || 1 : all.length <= 12 ? 4 : all.length <= 24 ? 6 : 8;
  const rows = Math.ceil(all.length / cols);
  const cell = 150, padX = 60, top = 150, bottom = 70;
  const W = cols*cell + padX*2, H = top + rows*cell + bottom;
  const C = counts();
  const tiles = all.map((x,i)=>{
    const cx = padX + (i % cols)*cell, cy = top + Math.floor(i/cols)*cell;
    const label = (x.name.length > 16 ? x.name.slice(0,15)+'…' : x.name).toUpperCase();
    return '<g transform="translate('+cx+','+cy+')">'
      + badgeSVG(x.name, x.sub, 120).replace('<svg ', '<svg x="15" y="6" ')
      + '<text x="75" y="142" text-anchor="middle" fill="#8a8178" font-family="ui-monospace,monospace" '
      + 'font-size="9" letter-spacing="1">'+esc(label)+'</text></g>';
  }).join('');
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'">'
    + '<rect width="'+W+'" height="'+H+'" fill="#13110f"/>'
    + '<text x="'+padX+'" y="72" fill="#f4efe7" font-family="Georgia,serif" font-size="44">The board</text>'
    + '<text x="'+padX+'" y="104" fill="#c9a227" font-family="ui-monospace,monospace" font-size="13" letter-spacing="3">'
    + C.countries + ' COUNTRIES · ' + C.states + ' STATES · ' + C.cities + ' CITIES</text>'
    + '<line x1="'+padX+'" y1="124" x2="'+(W-padX)+'" y2="124" stroke="#3a342c"/>'
    + tiles
    + '<text x="'+padX+'" y="'+(H-28)+'" fill="#6f675d" font-family="ui-monospace,monospace" font-size="11" letter-spacing="3">MERIDIAN</text>'
    + '</svg>';
  return svgToPNG(svg, W, H, 2);
}
document.addEventListener('change', e=>{
  const tt = e.target.closest('[data-triptitle]');
  if (tt){ const t = tripOf(tt.dataset.triptitle); if (t){ t.title = tt.value.trim() || t.title; saveTrips(); } return; }
  const tn = e.target.closest('[data-tripnote]');
  if (tn){ const t = tripOf(tn.dataset.tripnote); if (t){ t.note = tn.value; saveTrips(); } return; }
  const dl = e.target.closest('[data-daylabel]');
  if (dl){
    const [tid, i] = dl.dataset.daylabel.split('|');
    const t = tripOf(tid);
    if (t && t.days[+i]){ t.days[+i].label = dl.value.trim() || ('Day '+(+i+1)); saveTrips(); }
    return;
  }
});

/* ===========================================================
   SHARED MARKUP
   =========================================================== */
const contHref = ct => '#/'+ct.slug;
const countryHref = co => '#/'+co.continent.slug+'/'+co.slug;
const stateHref = s => countryHref(USA)+'/'+s.slug;
const cityHref = c => stateHref(c.state)+'/'+c.slug;

const crumbs = items => '<div class="wrap crumbs">' + items.map((it,i)=>
  i === items.length-1 ? '<span class="here">'+esc(it[0]).toUpperCase()+'</span>'
    : '<a href="'+it[1]+'">'+esc(it[0]).toUpperCase()+'</a>').join(' / ') + '</div>';
const secHead = (t,r) => '<div class="sec-head"><h2 class="h2">'+t+'</h2><span class="lab">'+(r||'')+'</span></div>';
const blank = (t,b) => '<div class="blank"><span style="color:var(--ghost)">'+ICON.compass+'</span><div class="blank-b"><span class="card-t">'+t+'</span><p class="row-d">'+b+'</p></div></div>';
const tag = t => '<span class="chip">'+esc(t)+'</span>';
const stat = (n,l)=>'<div style="display:flex;flex-direction:column;gap:8px"><span class="stat-n">'+n+'</span><span class="lab">'+l+'</span></div>';
const pinFor = s => '<span class="pin'+(s==='been'?'':s==='want'?' want':' off')+'"></span>';

/* a live clock + sky readout for any point on earth */
function readout(key, lat, lon, tz){
  const now = new Date(), sun = sunTimes(lat, lon, now), night = isNightAt(lat, lon, now);
  const sunLine = sun.polar ? (sun.polar === 'day' ? 'MIDNIGHT SUN' : 'POLAR NIGHT')
    : '↑ '+fmtTime(sun.rise,tz)+'<br>↓ '+fmtTime(sun.set,tz);
  return {night, html:'<div class="readout">'
    + '<span class="ro"><span class="lab">LOCAL TIME</span><span class="ro-v" data-tz="'+tz+'">'+fmtTime(now,tz)+'</span>'
    + '<span class="lab-s">'+fmtDay(now,tz)+' · '+fmtZone(now,tz)+'</span></span>'
    + '<span class="ro"><span class="lab">SKY</span><span class="sky" data-wx="'+key+'" data-night="'+(night?1:0)+'" data-big="1">'
    + glyph(night?'night':'clear',26)+'<span class="ro-v">—</span></span></span>'
    + '<span class="ro"><span class="lab">SUN</span><span class="ro-sun">'+sunLine+'</span></span></div>'};
}

/* ===========================================================
   THE WORLD MAP — scroll to zoom, drag to pan
   =========================================================== */
let LAND_D = null;
function landPaths(){
  if (LAND_D) return LAND_D;
  LAND_D = LAND.map(r=>{
    const pts = [];
    for (let i = 0; i < r.length; i += 2) pts.push((r[i]+180).toFixed(2)+' '+(90-r[i+1]).toFixed(2));
    return '<path d="M'+pts.join('L')+'Z"/>';
  }).join('');
  return LAND_D;
}
function mapPoints(filter){
  const out = [];
  const push = (lat,lon,s,n,h,t) => { if (lat == null || lon == null) return;
    if (filter && filter !== 'all' && s !== filter) return;
    out.push({x:lon+180, y:90-lat, s, n, h, t}); };
  ALL_COUNTRIES.forEach(co=>push(co.lat, co.lon, countryStatus(co), co.name, countryHref(co), 1));
  ATLAS.forEach(st=>{
    st.statewide.forEach(p=>push(p.lat, p.lon, statusOf(p.id), p.title, stateHref(st), 2));
    st.cities.forEach(c=>push(c.lat, c.lon, statusOf(c.id), c.name, cityHref(c), LABELLED.has(c.key)?1:2));
  });
  ADDED.forEach(a=>push(a.lat, a.lon, statusOf(a.id), a.n, '#/'+a.cont+'/'+a.c, 2));
  return out;
}
let MAPN = 0;
function worldMap(points, height, opts){
  const o = opts || {};
  const pins = points.map(p=>{
    const cls = p.s === 'been' ? 'p-been' : p.s === 'want' ? 'p-want' : 'p-none';
    const halo = p.s === 'none' ? '' :
      '<circle class="halo'+(p.s==='want'?' w':'')+'" cx="'+p.x.toFixed(2)+'" cy="'+p.y.toFixed(2)+'" r="2.4" data-r="2.4"/>';
    return halo + '<circle class="'+cls+'" cx="'+p.x.toFixed(2)+'" cy="'+p.y.toFixed(2)+'" r="1.1" data-r="1.1"'
      + ' data-href="'+p.h+'"><title>'+esc(p.n)+'</title></circle>'
      + '<text data-px="'+p.x.toFixed(2)+'" data-py="'+p.y.toFixed(2)+'" data-len="'+p.n.length
      + '" data-tier="'+p.t+'" data-pri="'+(p.s==='been'?0:p.s==='want'?1:2)+'"'
      + ' data-href="'+p.h+'">'+esc(p.n)+'</text>';
  }).join('');
  /* The night side, worked out from where the sun actually is at this
     moment. It is recomputed on every render, so a reload is always
     showing the real terminator rather than a picture of one. */
  const id = 'night'+(++MAPN), night = terminatorPath(new Date());
  const land = landPaths();
  const filter = o.filter
    ? '<span class="mapfilter onmap">'
      + ['all','been','want'].map(v=>'<button type="button" data-filter="'+v+'" aria-pressed="'
        + (mapFilter===v)+'">'+(v==='all'?'ALL':v==='been'?'BEEN':'WANT')+'</button>').join('')
      + '</span>' : '';
  return '<div class="worldmap" style="height:'+height+'px" data-map="1">'
    + '<svg viewBox="0 0 360 180" preserveAspectRatio="xMidYMid meet" role="img" aria-label="World map of your places, with the night side shaded">'
    + '<defs><clipPath id="'+id+'"><path d="'+night+'"/></clipPath></defs>'
    + '<g class="land">'+land+'</g>'
    + '<path class="nightwash" d="'+night+'"/>'
    + '<g class="land dark" clip-path="url(#'+id+')">'+land+'</g>'
    + '<g class="pins">'+pins+'</g></svg>'
    + '<span class="maphint">SCROLL TO ZOOM · DRAG TO PAN · CLICK A PLACE TO OPEN IT</span>'
    + filter
    + '<span class="mapctl"><button type="button" data-zoom="in" aria-label="Zoom in">+</button>'
    + '<button type="button" data-zoom="out" aria-label="Zoom out">−</button>'
    + '<button type="button" data-zoom="reset" aria-label="Reset the map">⤢</button></span>'
    + '<span class="maplegend"><i class="sun"></i>DAYLIGHT<i class="moon"></i>NIGHT</span></div>';
}
function wireMaps(){
  document.querySelectorAll('.worldmap').forEach(el=>{
    const svg = el.querySelector('svg');
    const v = {x:0, y:0, w:360, h:180};
    const geom = () => {
      const r = svg.getBoundingClientRect();
      const s = Math.min(r.width/v.w, r.height/v.h);
      return {r, s, ox:(r.width - v.w*s)/2, oy:(r.height - v.h*s)/2};
    };
    const circles = [...el.querySelectorAll('.pins circle')].map(c=>({el:c, r:parseFloat(c.dataset.r)}));
    /* labels are drawn strongest-first so that, where two collide, the place
       you have actually been keeps its name and the empty one loses it */
    const labels = [...el.querySelectorAll('.pins text')].map(t=>({
      el:t, px:+t.dataset.px, py:+t.dataset.py, len:+t.dataset.len,
      tier:+t.dataset.tier, pri:+t.dataset.pri
    })).sort((a,b)=> a.pri-b.pri || a.tier-b.tier || a.len-b.len);

    function paint(){
      v.w = clamp(v.w, 14, 360); v.h = v.w/2;
      v.x = clamp(v.x, -12, 372 - v.w); v.y = clamp(v.y, -12, 192 - v.h);
      svg.setAttribute('viewBox', v.x.toFixed(3)+' '+v.y.toFixed(3)+' '+v.w.toFixed(3)+' '+v.h.toFixed(3));
      const k = v.w/360;                       // everything that must hold its
      const fs = 2.9*k, halo = 0.85*k;         // on-screen size scales with the view
      for (const c of circles) c.el.setAttribute('r', (c.r*k).toFixed(3));

      const placed = [];
      let shown = 0;
      for (const L of labels){
        const vis = L.pri < 2 || (L.tier === 1 ? v.w < 230 : v.w < 55);
        let ok = vis && shown < 80
          && L.px > v.x - 4 && L.px < v.x + v.w && L.py > v.y - 2 && L.py < v.y + v.h;
        if (ok){
          const x0 = L.px + 2.6*k, y0 = L.py - fs*0.62;
          const w = L.len*fs*0.56, h = fs*1.1;
          for (const r of placed){
            if (x0 < r[2] && x0 + w > r[0] && y0 < r[3] && y0 + h > r[1]){ ok = false; break; }
          }
          if (ok){
            placed.push([x0, y0, x0 + w, y0 + h]);
            shown++;
            L.el.setAttribute('x', x0.toFixed(3));
            L.el.setAttribute('y', (L.py + fs*0.34).toFixed(3));
            L.el.setAttribute('font-size', fs.toFixed(3));
            L.el.setAttribute('stroke-width', halo.toFixed(3));
            L.el.style.opacity = '1';
          }
        }
        if (!ok) L.el.style.opacity = '0';
      }
    }
    function zoomAt(factor, cx, cy){
      const g = geom();
      const ux = v.x + (cx - g.r.left - g.ox)/g.s, uy = v.y + (cy - g.r.top - g.oy)/g.s;
      const nw = clamp(v.w*factor, 14, 360);
      const ns = Math.min(g.r.width/nw, g.r.height/(nw/2));
      const nox = (g.r.width - nw*ns)/2, noy = (g.r.height - (nw/2)*ns)/2;
      v.w = nw; v.h = nw/2;
      v.x = ux - (cx - g.r.left - nox)/ns;
      v.y = uy - (cy - g.r.top - noy)/ns;
      paint();
    }
    el.addEventListener('wheel', e=>{
      e.preventDefault();
      zoomAt(e.deltaY < 0 ? 0.82 : 1/0.82, e.clientX, e.clientY);
    }, {passive:false});
    let drag = null, moved = 0;
    svg.addEventListener('pointerdown', e=>{
      drag = {x:e.clientX, y:e.clientY, vx:v.x, vy:v.y, s:geom().s}; moved = 0;
      svg.setPointerCapture(e.pointerId); svg.classList.add('drag');
    });
    svg.addEventListener('pointermove', e=>{
      if (!drag) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      moved = Math.max(moved, Math.abs(dx) + Math.abs(dy));
      v.x = drag.vx - dx/drag.s; v.y = drag.vy - dy/drag.s; paint();
    });
    const stop = e => { if (drag){ drag = null; svg.classList.remove('drag');
      try { svg.releasePointerCapture(e.pointerId); } catch(err){} } };
    svg.addEventListener('pointerup', stop);
    svg.addEventListener('pointercancel', stop);
    /* both the dot and its name open the place */
    svg.addEventListener('click', e=>{
      const c = e.target.closest('[data-href]');
      if (c && moved < 6) location.hash = c.dataset.href;
    });
    el.querySelectorAll('[data-zoom]').forEach(b=>b.addEventListener('click', ()=>{
      const r = svg.getBoundingClientRect(), cx = r.left + r.width/2, cy = r.top + r.height/2;
      if (b.dataset.zoom === 'reset'){ v.x = 0; v.y = 0; v.w = 360; v.h = 180; paint(); }
      else zoomAt(b.dataset.zoom === 'in' ? 0.65 : 1/0.65, cx, cy);
    }));
    paint();
  });
}

/* ===========================================================
   VIEWS
   =========================================================== */
function rowsHTML(list){
  return list.map((t,i)=>'<div class="row"><span class="row-n">'+pad2(i+1)+'</span>'
    + '<div class="row-b"><span class="row-t">'+esc(t.title)+'</span>'
    + '<p class="row-d">'+esc(t.desc)+'</p><p class="row-note">[ your note ]</p></div>'
    + '<span class="row-tags">'+(t.tag?tag(t.tag):'')+ctl(t.id, t.title)+'</span></div>').join('');
}
/* ===========================================================
   THE ENTRY EDITOR — add, describe, illustrate, reorder,
   delete. All of it in the browser, none of it in the code.
   =========================================================== */
const PENDING = {};
const edKey = (scope, kind) => scope+'|'+kind;
function photoStrip(ids){
  if (!ids || !ids.length) return '';
  return '<span class="photos">'+ids.map(id=>
    '<button class="ph" type="button" data-light="'+id+'"><img data-photo="'+id+'" alt=""></button>').join('')+'</span>';
}
function editorHTML(key, kind){
  const p = PENDING[key];
  const open = !!p;
  const prev = !open ? '' : (p.keep.map(id=>
      '<span class="pv"><img data-photo="'+id+'" alt=""><button type="button" data-dropph="'+key+'|k|'+id+'">×</button></span>').join('')
    + p.add.map((d,i)=>'<span class="pv"><img src="'+d+'" alt=""><button type="button" data-dropph="'+key+'|n|'+i+'">×</button></span>').join(''));
  return '<div class="editor'+(open?'':' shut')+'" data-ed="'+key+'">'
    + '<input class="f-t" type="text" placeholder="'+(kind==='todo'?'What is it called?':'Restaurant name')+'" value="'+(open?esc(p.t):'')+'">'
    + '<textarea class="f-d" rows="3" placeholder="'+(kind==='todo'?'Describe it — what it is, when to go, what you thought':'What you ordered, and whether it was worth it')+'">'+(open?esc(p.d):'')+'</textarea>'
    + '<input class="f-g" type="text" placeholder="'+(kind==='todo'?'Tag — OUTDOORS, MUSEUM, FREE':'Cuisine — RAMEN, BARBECUE')+'" value="'+(open?esc(p.g):'')+'">'
    + '<span class="prev">'+prev+'</span>'
    + '<span class="edrow"><label class="filebtn">Add photos<input type="file" accept="image/*" multiple data-pick="'+key+'"></label>'
    + '<button class="btn" data-save="'+key+'">Save</button>'
    + '<button class="btn ghost" data-cancel="'+key+'">Cancel</button></span></div>';
}
function entrySection(scope, kind, heading, emptyMsg){
  const list = entriesOf(scope, kind), key = edKey(scope, kind);
  const rows = list.map((e,i)=>'<div class="row">'
    + '<span class="row-n">'+pad2(i+1)+'</span>'
    + '<div class="row-b"><span class="row-t">'+esc(e.t)+'</span>'
    + (e.d ? '<p class="row-d">'+esc(e.d)+'</p>' : '')
    + photoStrip(e.ph)+'</div>'
    + '<span class="row-tags">'+(e.g?tag(e.g):'')+ctl(e.id, e.t)
    + '<span class="tools">'
    + '<button class="tbtn" data-mv="'+key+'|'+i+'|-1"'+(i===0?' disabled':'')+' aria-label="Move up">↑</button>'
    + '<button class="tbtn" data-mv="'+key+'|'+i+'|1"'+(i===list.length-1?' disabled':'')+' aria-label="Move down">↓</button>'
    + '<button class="tbtn" data-edit="'+key+'|'+e.id+'">EDIT</button>'
    + '<button class="tbtn" data-del="'+key+'|'+e.id+'">DELETE</button>'
    + '</span></span></div>').join('');
  return '<div class="sec">'+secHead(heading, pad2(list.length)+' LISTED')
    + (list.length ? rows : blank('Nothing here yet', emptyMsg))
    + editorHTML(key, kind)
    + (PENDING[key] ? '' : '<div style="padding-top:22px"><button class="btn ghost" data-new="'+key+'">'
      + '+ Add '+(kind==='todo'?'a thing to do':'a place you ate')+'</button></div>')
    + '</div>';
}
function noteSection(scope){
  const key = scope+'|note', open = !!PENDING[key], note = noteOf(scope);
  if (open) return '<div class="editor" data-ed="'+key+'">'
    + '<textarea class="f-d" rows="3" placeholder="A line or two about this place">'+esc(PENDING[key].d)+'</textarea>'
    + '<span class="edrow"><button class="btn" data-save="'+key+'">Save</button>'
    + '<button class="btn ghost" data-cancel="'+key+'">Cancel</button></span></div>';
  return note
    ? '<p class="lede" style="padding-top:4px">'+esc(note)+' <button class="tbtn" data-note="'+key+'">EDIT</button></p>'
    : '<p style="padding-top:4px"><button class="btn ghost" data-note="'+key+'">+ Write a description</button></p>';
}
function entryRows(scope, kind, where, cat){
  return entriesOf(scope, kind).map(e=>[e.t, e.t+', '+where, e.g || cat, mark(e.id), e.d || '']);
}
async function savePhotos(list){
  const ids = [];
  for (const d of list){
    const id = 'ph_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8);
    try { await photoPut(id, d); ids.push(id); } catch(e){}
  }
  return ids;
}
document.addEventListener('change', async e=>{
  const pick = e.target.closest('[data-pick]');
  if (!pick) return;
  const key = pick.dataset.pick;
  if (!PENDING[key]) return;
  const ed = pick.closest('.editor');
  PENDING[key].t = ed.querySelector('.f-t') ? ed.querySelector('.f-t').value : PENDING[key].t;
  PENDING[key].d = ed.querySelector('.f-d').value;
  PENDING[key].g = ed.querySelector('.f-g') ? ed.querySelector('.f-g').value : '';
  for (const f of [...pick.files]){
    try { PENDING[key].add.push(await readPhoto(f)); } catch(err){}
  }
  rerender();
});
document.addEventListener('click', async e=>{
  const grab = ed => {
    const box = ed.closest('.editor');
    const t = box.querySelector('.f-t'), d = box.querySelector('.f-d'), g = box.querySelector('.f-g');
    return {t: t?t.value.trim():'', d: d?d.value.trim():'', g: g?g.value.trim():''};
  };
  const nw = e.target.closest('[data-new]');
  if (nw){ PENDING[nw.dataset.new] = {t:'', d:'', g:'', keep:[], add:[], id:null}; return rerender(); }

  const ed = e.target.closest('[data-edit]');
  if (ed){
    const [scope, kind, id] = ed.dataset.edit.split('|');
    const key = scope+'|'+kind;
    const it = entriesOf(scope, kind).find(x=>x.id === id);
    PENDING[key] = {t:it.t, d:it.d||'', g:it.g||'', keep:(it.ph||[]).slice(), add:[], id};
    return rerender();
  }
  const nt = e.target.closest('[data-note]');
  if (nt){ const key = nt.dataset.note; PENDING[key] = {d:noteOf(key.split('|')[0]), keep:[], add:[]}; return rerender(); }

  const cancel = e.target.closest('[data-cancel]');
  if (cancel){ delete PENDING[cancel.dataset.cancel]; return rerender(); }

  const drop = e.target.closest('[data-dropph]');
  if (drop){
    const [scope, kind, which, val] = drop.dataset.dropph.split('|');
    const key = scope+'|'+kind, p = PENDING[key];
    const box = drop.closest('.editor');
    Object.assign(p, grab(drop));
    if (which === 'k'){ p.keep = p.keep.filter(x=>x !== val); photoDel(val); }
    else p.add.splice(+val, 1);
    return rerender();
  }
  const save = e.target.closest('[data-save]');
  if (save){
    const key = save.dataset.save, p = PENDING[key];
    const bits = key.split('|'), kind = bits.pop(), scope = bits.join('|');
    const vals = grab(save);
    if (kind === 'note'){ setNote(scope, vals.d); delete PENDING[key]; return rerender(); }
    if (!vals.t){ save.closest('.editor').querySelector('.f-t').focus(); return; }
    const fresh = await savePhotos(p.add);
    const ph = p.keep.concat(fresh);
    mutateEntries(scope, kind, list=>{
      if (p.id){
        const it = list.find(x=>x.id === p.id);
        if (it){ it.t = vals.t; it.d = vals.d; it.g = vals.g; it.ph = ph; return; }
      }
      let id = kind+':'+scope+':'+slug(vals.t), n = 1;
      while (list.some(x=>x.id === id)) id = kind+':'+scope+':'+slug(vals.t)+'-'+(++n);
      list.push({id, t:vals.t, d:vals.d, g:vals.g, ph});
    });
    delete PENDING[key];
    return rerender();
  }
  const mv = e.target.closest('[data-mv]');
  if (mv){
    const [scope, kind, i, dir] = mv.dataset.mv.split('|');
    mutateEntries(scope, kind, list=>{
      const a = +i, b = a + (+dir);
      if (b < 0 || b >= list.length) return;
      const t = list[a]; list[a] = list[b]; list[b] = t;
    });
    return rerender();
  }
  const del = e.target.closest('[data-del]');
  if (del){
    const [scope, kind, id] = del.dataset.del.split('|');
    const it = entriesOf(scope, kind).find(x=>x.id === id);
    if (!confirm('Delete “'+(it?it.t:'this')+'”?')) return;
    (it && it.ph || []).forEach(photoDel);
    mutateEntries(scope, kind, list=>{
      const i = list.findIndex(x=>x.id === id);
      if (i > -1) list.splice(i, 1);
    });
    delete STATUS[id]; saveStatus();
    return rerender();
  }
  const light = e.target.closest('[data-light]');
  if (light){
    const d = await photoGet(light.dataset.light);
    if (!d) return;
    const box = document.createElement('div');
    box.className = 'lightbox';
    box.innerHTML = '<img src="'+d+'" alt=""><button type="button" aria-label="Close">×</button>';
    box.addEventListener('click', ()=>box.remove());
    document.body.appendChild(box);
  }
});

function placeCard(o){
  const s = o.status;
  return '<div class="card'+(s==='none'?' empty':'')+(s==='want'?' wish':'')+'" style="min-height:'+(o.min||168)+'px">'
    + '<a class="go" href="'+o.href+'" style="display:flex;flex-direction:column;gap:7px">'
    + '<span class="card-t"'+(o.small?' style="font-size:26px"':'')+'>'+esc(o.name)+'</span>'
    + '<span class="lab-s"'+(s==='none'?' style="color:var(--ghost)"':'')+'>'+o.sub+'</span></a>'
    + '<span class="card-foot">'+pinFor(s)+whenTag(o.id)+ctl(o.id, o.name)+'</span></div>';
}
function cityCard(c){
  const s = statusOf(c.id), night = isNightAt(c.lat,c.lon);
  return '<div class="card'+(s==='none'?' empty':'')+(s==='want'?' wish':'')+(night?' night':'')+'" style="min-height:184px">'
    + '<a class="go" href="'+cityHref(c)+'" style="display:flex;flex-direction:column;gap:7px">'
    + '<span class="card-t">'+esc(c.name)+'</span>'
    + '<span class="lab-s"'+(s==='none'?' style="color:var(--ghost)"':'')+'><span data-tz="'+c.tz+'">'+fmtTime(new Date(),c.tz)+'</span> · '+coord(c.lat,c.lon)+'</span></a>'
    + '<span class="card-foot"><span style="display:flex;align-items:center;gap:10px">'+pinFor(s)
    + '<span class="chip warm" data-wx="'+c.key+'" data-night="'+(night?1:0)+'">'+glyph(night?'night':'clear',14)+'<span>—</span></span></span>'
    + ctl(c.id, c.name)+'</span></div>';
}

/* ---------- home ---------- */
function viewHome(){
  routeIsNight = isNightAt(38,-97);
  const C = counts(), now = new Date();
  const board = BOARD.map((b,i)=>{
    const [name, sub, lat, lon, tz, href] = b, night = isNightAt(lat, lon, now), key = 'board'+i;
    return '<a class="board-r'+(night?' night':'')+'" href="'+href+'">'
      + '<span class="board-city"><span style="font-size:15px;font-weight:500;display:flex;align-items:center;gap:8px">'
      + (night?'<span class="nightdot"></span>':'')+esc(name)+'</span>'
      + '<span class="lab-s">'+esc(sub).toUpperCase()+' · '+fmtZone(now,tz)+'</span></span>'
      + '<span class="board-right"><span class="sky" data-wx="'+key+'" data-night="'+(night?1:0)+'" style="font-family:var(--mono);font-size:13px">'
      + glyph(night?'night':'clear',17)+'<span>—</span></span>'
      + '<span class="board-t" data-tz="'+tz+'">'+fmtTime(now,tz)+'</span></span></a>';
  }).join('');

  /* the three most recent things you marked, newest date first, with the
     shipped picks only as a fallback for a brand-new browser */
  const dated = everything().filter(x=>statusOf(x.id) === 'been' && dateOf(x.id))
    .sort((a,b)=>dateOf(b.id).localeCompare(dateOf(a.id)));
  const yours = dated.length ? dated.slice(0,3)
    : everything().filter(x=>x.kind === 'City' && statusOf(x.id) === 'been').slice(0,3);
  const recent = yours.length >= 3 ? yours.map(x=>x.id) : null;
  const feat = (recent || FEATURED).map(k=>{
    const c = CITY_BY_KEY[k] || CITY_BY_KEY[String(k).replace(/^city:/,'')]; if (!c) return '';
    const night = isNightAt(c.lat,c.lon);
    return '<div class="card'+(night?' night':'')+'" style="min-height:200px"><a class="go" href="'+cityHref(c)+'" style="display:flex;flex-direction:column;gap:8px">'
      + '<span class="lab-s">'+esc(c.state.name).toUpperCase()+'</span>'
      + '<span class="card-t" style="font-size:34px">'+esc(c.name)+'</span>'
      + '<span class="lab-s"><span data-tz="'+c.tz+'">'+fmtTime(now,c.tz)+'</span>'
      + (dateOf(c.id) ? ' · ' + esc(prettyDate(dateOf(c.id)).toUpperCase()) : ' · '+entriesOf(c.key,'todo').length+' THINGS TO DO')+'</span></a>'
      + '<span class="card-foot"><span class="chip warm" data-wx="'+c.key+'" data-night="'+(night?1:0)+'">'+glyph(night?'night':'clear',14)+'<span>—</span></span>'
      + ctl(c.id, c.name)+'</span></div>';
  }).join('');

  const conts = CONTINENTS.map(ct=>{
    const n = ct.countries.filter(c=>countryStatus(c)==='been').length;
    const w = ct.countries.filter(c=>countryStatus(c)==='want').length;
    return placeCard({name:ct.name, id:ct.id, href:contHref(ct), status:continentStatus(ct),
      sub: n ? n+' OF '+ct.countries.length+' COUNTRIES' : (w ? w+' ON THE LIST' : ct.countries.length+' COUNTRIES')});
  }).join('');

  return '<div class="wrap" style="padding-top:64px"><div class="hero">'
    + '<div class="hero-main">'
    + '<span class="lab" style="color:var(--warm)">A PERSONAL TRAVEL ATLAS</span>'
    + '<h1 class="title-xl">Somewhere on this map, the sun is still up.</h1>'
    + '<p class="lede">Every place I have travelled, kept as a living atlas — what there is to do, where I ate, and what the clock and the sky are doing there at this exact moment.</p>'
    + '<div style="display:flex;flex-wrap:wrap;gap:12px;padding-top:4px">'
    + '<a class="btn" href="#/continents">Enter the atlas</a>'
    + '<a class="btn ghost" href="#/map">See the map</a></div></div>'
    + '<div class="hero-side"><div class="board"><div class="board-h"><span class="lab">RIGHT NOW</span>'
    + '<span class="live"><i></i>LIVE</span></div>'+board+'</div>'
    + '<p class="note" style="margin-top:12px">Dimmed rows are places where the sun has already set.</p></div></div>'

    + '<div class="sec"><div class="stats">'
    + stat(C.continents,'CONTINENTS')+stat(C.countries,'COUNTRIES')+stat(C.states,'STATES &amp; DISTRICTS')
    + stat(C.cities,'CITIES')+stat(C.places,'PARKS &amp; REGIONS')+stat(C.wish,'ON THE LIST')+'</div></div>'

    + '<div class="sec"><div class="panel">'
    + '<div class="panel-head"><span style="display:flex;flex-wrap:wrap;align-items:center;gap:16px">'
    + '<span class="lab">THE WHOLE WORLD</span>'
    + '<span class="chip warm"><span class="pin" style="width:8px;height:8px;box-shadow:none"></span>BEEN</span>'
    + '<span class="chip on"><span class="pin want" style="width:8px;height:8px;box-shadow:none"></span>WANT TO GO</span></span>'
    + '<a class="btn ghost" href="#/map">Open the full map</a></div>'
    + worldMap(mapPoints(mapFilter), 460, {filter:true})+'</div></div>'

    + '<div class="sec">'+secHead(recent ? 'Where you were last' : 'Most recently added', C.cities+' CITIES LOGGED')
    + '<div class="grid g-wide" style="padding-top:28px">'+feat+'</div></div>'

    + '<div class="sec" id="continents">'+secHead('Start at the top','CONTINENT → COUNTRY → STATE → CITY')
    + '<div class="grid g-cities" style="padding-top:28px">'+conts+'</div></div>'

    + '<div class="sec"><p class="note">Mark anything as <strong>been</strong> or <strong>want to go</strong> — continents, countries, states, cities, parks, restaurants and every single thing to do. Marks are kept in this browser and drive the counts, the map pins and the CSV export.</p></div></div>';
}

/* ---------- full map page ---------- */
let mapFilter = 'all';
function viewMap(){
  routeIsNight = isNightAt(38,-97);
  const C = counts(), pts = mapPoints(mapFilter);
  const btn = (v,l) => '<button type="button" data-filter="'+v+'" aria-pressed="'+(mapFilter===v)+'">'+l+'</button>';
  return crumbs([['World','#/continents'],['Map','']])
  + '<div class="wrap"><div style="padding-top:36px;display:flex;flex-wrap:wrap;gap:24px;align-items:flex-end;justify-content:space-between">'
  + '<div><h1 class="title-l">The map</h1>'
  + '<p class="lede" style="padding-top:14px">Every country, every state and every city in the atlas. Scroll to zoom, drag to move, click a pin to open it.</p></div>'
  + '<span class="mapfilter">'+btn('all','ALL '+pts.length)+btn('been','BEEN')+btn('want','WANT TO GO')+'</span></div>'
  + '<div style="padding-top:28px"><div class="panel">'+worldMap(pts, 620)+'</div></div>'
  + '<div class="stats" style="margin-top:34px">'+stat(C.continents,'CONTINENTS')+stat(C.countries,'COUNTRIES')
  + stat(C.states,'STATES')+stat(C.cities,'CITIES')+stat(C.places,'PARKS &amp; REGIONS')+stat(C.wish,'ON THE LIST')+'</div>'
  + '<div class="sec" style="padding-top:40px"><div class="panel"><div class="panel-head" style="border:0">'
  + '<span style="display:flex;flex-direction:column;gap:6px"><span class="card-t" style="font-size:26px">Every pin, one file</span>'
  + '<span class="note">Imports into Google My Maps with your been and want marks in the Status column.</span></span>'
  + '<button class="btn" data-dl="all">'+ICON.down+'meridian-all-places.csv</button></div></div></div></div>';
}

/* ---------- been / want lists ---------- */
function viewList(kind){
  routeIsNight = isNightAt(38,-97);
  const items = everything().filter(e=>statusOf(e.id) === kind);
  const title = kind === 'been' ? 'Been there' : 'Want to go';
  const order = ['Continent','Country','State','City','Region','Park or region','Thing to do','Restaurant'];
  const groups = order.map(k=>[k, items.filter(i=>i.kind === k)]).filter(g=>g[1].length);
  const body = groups.length ? groups.map(([k, list])=>
      '<div class="sec">'+secHead(plural(k), pad2(list.length))
      + list.slice().sort((a,b)=>(dateOf(b.id)||'').localeCompare(dateOf(a.id)||''))
        .map(i=>'<div class="added"><span class="added-n">'+pinFor(kind)
        + '<a href="'+i.href+'" style="color:var(--ink)">'+esc(i.name)+'</a>'
        + (i.sub ? '<span class="lab-s">'+esc(i.sub).toUpperCase()+'</span>' : '')+'</span>'
        + ctl(i.id, i.name, kind === 'been')+'</div>').join('')+'</div>').join('')
    : blank(kind === 'been' ? 'Nothing marked yet' : 'Nothing on the list yet',
        'Open any continent, country, state or city and use the '+(kind==='been'?'BEEN':'WANT')+' button. Everything you mark collects here.');
  return crumbs([['World','#/continents'],[title,'']])
  + '<div class="wrap"><div style="padding-top:36px"><h1 class="title-l">'+title+'</h1>'
  + '<p class="lede" style="padding-top:14px">'+items.length+' marked, across every level of the atlas.</p></div>'
  + body + '</div>';
}

/* ---------- continent ---------- */
function viewContinent(ct){
  routeIsNight = isNightAt(38,-97);
  const n = ct.countries.filter(c=>countryStatus(c)==='been').length;
  const cards = ct.countries.map(co=>{
    const s = countryStatus(co), night = isNightAt(co.lat, co.lon);
    const sea = seasonNow('country:'+co.slug);
    return '<div class="card'+(s==='none'?' empty':'')+(s==='want'?' wish':'')+(night?' night':'')
      + (sea?' s-'+sea.k:'')+'" style="min-height:160px">'
      + '<a class="go" href="'+countryHref(co)+'" style="display:flex;flex-direction:column;gap:7px">'
      + '<span class="card-t" style="font-size:26px">'+esc(co.name)+'</span>'
      + '<span class="lab-s"'+(s==='none'?' style="color:var(--ghost)"':'')+'>'
      + '<span data-tz="'+co.tz+'">'+fmtTime(new Date(),co.tz)+'</span> · '
      + (sea ? esc(sea.label) : esc(co.capital).toUpperCase())+'</span></a>'
      + '<span class="card-foot"><span style="display:flex;align-items:center;gap:10px">'+pinFor(s)
      + '<span class="chip warm" data-wx="co-'+co.slug+'" data-night="'+(night?1:0)+'">'+glyph(night?'night':'clear',14)+'<span>—</span></span></span>'
      + ctl(co.id, co.name)+'</span></div>';
  }).join('');
  return crumbs([['World','#/continents'],[ct.name,'']])
  + '<div class="wrap"><div style="padding-top:36px;display:flex;flex-wrap:wrap;gap:32px;align-items:flex-end;justify-content:space-between">'
  + '<div style="flex:999 1 460px;min-width:0"><h1 class="title-xl">'+esc(ct.name)+'</h1>'
  + '<p class="lede" style="padding-top:18px">'+esc(ct.blurb)+'</p></div>'
  + '<div class="sec">'+secHead('Countries', n+' OF '+ct.countries.length+' LOGGED')
  + '<div class="grid g-cities" style="padding-top:28px">'+cards+'</div></div>'
  + '<div class="sec">'+secHead('Across the continent','00 LOGGED')
  + blank('Nothing logged at this level yet','Things that belong to the continent rather than one country — long rail routes, border crossings, road trips.')
  + '</div></div>';
}

/* ---------- country ---------- */
function viewCountry(co){
  const ro = readout('co-'+co.slug, co.lat, co.lon, co.tz);
  routeIsNight = ro.night;
  const head = crumbs([['World','#/continents'],[co.continent.name, contHref(co.continent)],[co.name,'']]);
  const sea = seasonNow('country:'+co.slug);
  const hero = '<div class="wrap"><div style="padding-top:36px"><div class="hero'+(sea?' s-'+sea.k:'')+'"><div class="hero-main">'
    + '<h1 class="title-xl">'+esc(co.name)+'</h1>'
    + '<span class="lab">'+esc(co.continent.name).toUpperCase()+' · CAPITAL '+esc(co.capital).toUpperCase()+' · '+coord(co.lat,co.lon)+'</span>'
    + (profileOf(co.slug).b ? '<p class="lede">'+esc(profileOf(co.slug).b)+'</p>' : '')
    + ro.html
    + '<div style="display:flex;flex-wrap:wrap;align-items:center;gap:12px">'+ctl(co.id, co.name, true)
    + '<span class="chip warm">'+glyph(ro.night?'night':'clear',14)+(ro.night?'IT IS NIGHT IN ':'IT IS DAYTIME IN ')+esc(co.capital).toUpperCase()+'</span>'
    + (sea ? '<span class="chip season s-'+sea.k+'">'+sea.label+'</span>' : '')+'</div>'
    + '<p class="note">The clock and the sky above are '+esc(co.capital)+'\u2019s own, and this page follows them into dark mode after sunset there.</p>'
    + '</div><div class="hero-side"><div class="board"><div class="board-h"><span class="lab">YOUR PLACES HERE</span>'
    + '<span class="lab-s">'+pad2(addedFor(co.slug).length)+'</span></div>'
    + '<div style="padding:18px"><p class="note" style="margin-bottom:14px">Everything you have added in '+esc(co.name)+', as one CSV for Google My Maps.</p>'
    + '<button class="btn" data-dl="country:'+co.slug+'">'+ICON.down+co.slug+'-places.csv</button></div></div></div></div></div>';

  if (co.detailed){
    const C = counts();
    const cards = ATLAS.map(s=>{
      const st = stateStatus(s);
      const nb = s.cities.filter(c=>been(c.id)).length + s.statewide.filter(p=>been(p.id)).length;
      return placeCard({name:s.name, id:s.id, href:stateHref(s), status:st, small:true, min:140,
        sub: nb ? s.abbr+' · '+nb+' LOGGED' : s.abbr+(st==='want'?' · ON THE LIST':' · NOT YET')});
    }).join('');
    return head + hero
      + '<div class="wrap"><div class="stats">'+stat(C.states,'STATES &amp; DISTRICTS')+stat(C.cities,'CITIES')
      + stat(C.places,'PARKS &amp; REGIONS')+stat(51-C.states,'STILL EMPTY')+'</div>'
      + '<div class="sec">'+secHead('Every state','USE THE SEARCH BOX TO JUMP')
      + '<div class="grid g-cities" style="padding-top:28px">'+cards+'</div></div></div>';
  }

  const pr = profileOf(co.slug);
  const sug = SUGGEST[co.slug] || [[],[]];
  const mine = addedFor(co.slug);
  const have = new Set(mine.map(a=>a.id));
  const spots = (pr.p || []).map(sp=>{
    const n = sp[0], line = sp[1], id = addedId(co.slug, 'city', n), inList = have.has(id);
    return '<div class="row"><span class="row-n">'+ICON.star+'</span>'
      + '<div class="row-b"><span class="row-t">'+esc(n)+'</span><p class="row-d">'+esc(line)+'</p></div>'
      + '<span class="row-tags">'+(inList
          ? '<span class="chip warm">ON YOUR LIST</span>'
          : '<button class="tbtn" data-add="'+esc(n)+'" data-co="'+co.slug+'" data-kind="city" data-lat="'+co.lat
            +'" data-lon="'+co.lon+'" data-tz="'+esc(co.tz)+'">+ ADD TO MY PLACES</button>')
      + '</span></div>';
  }).join('');
  const sugList = list => list.map(r=>{
    const [n, lat, lon] = r, id = addedId(co.slug, 'region', n);
    if (have.has(id)) return '';
    return '<span class="sug"><span>'+esc(n)+'</span>'
      + '<button type="button" data-add="'+esc(n)+'" data-co="'+co.slug+'" data-kind="region" data-lat="'+lat
      + '" data-lon="'+lon+'" aria-label="Add '+esc(n)+'">+</button></span>';
  }).join('');

  const mineHTML = mine.length ? mine.map(a=>
    '<div class="added"><span class="added-n">'+pinFor(statusOf(a.id))
      + '<a href="'+placeHref(a)+'" style="color:var(--ink)">'+esc(a.n)+'</a>'
      + '<span class="lab-s">'+(a.k==='city'?'CITY':'REGION')+'</span></span>'
      + ctl(a.id, a.n)+'<button class="rm" data-rm="'+a.id+'">REMOVE</button></div>').join('')
    : blank('Nothing added yet','Type a place below, or take one of the suggested regions. Each gets its own page with a clock, a description, things to do and where you ate.');

  const ckey = 'country:'+co.slug, season = seasonNow(ckey);
  return head + hero + '<div class="wrap">'
    + '<div class="sec">'+secHead('Getting there', 'FLIGHT · VISA · MONEY')+intelPanel(co)
    + moneyPanel(co)+'</div>'
    + '<div class="sec">'+secHead('The year in '+esc(co.name),
        season ? 'RIGHT NOW: '+season.label : 'MONTH BY MONTH')
    + climatePanel(ckey, co.name)+'</div>'
    + phrasePanel(co)
    + '<div class="sec">'+secHead('Well known for', pad2((pr.p||[]).length)+' PLACES')
    + (spots || blank('Nothing written yet','An admin can add the highlights for this country.'))
    + adminNote(co) + '</div>'
    + pairPanel(co)
    + '<div class="sec">'+secHead('Your places in '+esc(co.name), pad2(mine.length))+mineHTML
    + '<div class="addbox"><label class="hidden" for="newplace">Add a place</label>'
    + '<input id="newplace" type="text" autocomplete="off" placeholder="Add a place in '+esc(co.name)+'…" data-place-co="'+co.slug+'">'
    + '<button class="btn" data-place-go="'+co.slug+'">Add</button><span class="ac hidden" id="placeac"></span></div>'
    + '<p class="note" style="padding-top:10px">Start typing and known cities fill in with their own coordinates and timezone. Anything else is added at '+esc(co.capital)+'\u2019s position, and you can still describe it and photograph it.</p></div>'
    + (sug[0].length ? '<div class="sec">'+secHead('Regions of '+esc(co.name), 'CLICK TO ADD')
        + '<div class="sugs">'+sugList(sug[0])+'</div></div>' : '')
    + '</div>';
}

/* ---------- what it takes to get there ---------- */
function intelPanel(co){
  const pr = profileOf(co.slug);
  const fl = flightEstimate(co);
  const v  = visaFor(co.slug);
  const cells = [];
  if (fl) cells.push(['FROM ' + esc(PREFS.home.name).toUpperCase(), fl.text,
    fl.miles.toLocaleString() + ' miles · ' + (fl.direct ? 'within nonstop range' : 'expect a connection')]);
  else cells.push(['FROM HOME', 'You are here', 'Change your home airport in Account.']);
  if (v) cells.push(['ON A ' + esc(passportName()).toUpperCase() + ' PASSPORT', v.head,
    v.body + (v.via ? ' Follows ' + esc(v.via.replace(/-/g,' ')) + '\u2019s rules.' : '')]);
  if (pr.s) cells.push(['BEST TIME TO GO', pr.s, 'Shoulder months are usually cheaper and quieter.']);
  return '<div class="intel">' + cells.map(c=>
    '<div class="intel-c"><span class="lab">'+c[0]+'</span>'
    + '<span class="intel-v">'+esc(c[1])+'</span>'
    + '<span class="note">'+c[2]+'</span></div>').join('') + '</div>'
  + (v ? '<p class="note" style="padding-top:14px">Visa category from the passport-index dataset — a starting point, not legal advice. '
       + 'Processing times move constantly, so check the official portal for '+esc(co.name)+' before booking. '
       + '<a href="https://www.google.com/search?q='+encodeURIComponent('official visa '+co.name+' for '+passportName()+' citizens')
       + '" target="_blank" rel="noopener">Find the official source</a>.</p>' : '');
}
function pairPanel(co){
  const list = (profileOf(co.slug).w || []).map(sl=>CO_BY_SLUG[sl]).filter(Boolean);
  if (!list.length) return '';
  return '<div class="sec">'+secHead('Goes well with', 'ON THE SAME TRIP')
    + '<div class="grid g-cities" style="padding-top:28px">'
    + list.map(c=>placeCard({name:c.name, id:c.id, href:countryHref(c), status:countryStatus(c), small:true, min:150,
        sub: Math.round(greatCircle(co, c)*0.621371).toLocaleString() + ' MI FROM ' + esc(co.name).toUpperCase()})).join('')
    + '</div></div>';
}
/* ---------- the year, month by month ----------
   A measured row shows real degrees. An estimated row shows the band
   it falls in and says so, because a modelled number pretending to be
   a measurement is worse than no number at all. */
let monthSel = new Date().getMonth();
function climatePanel(key, name){
  const row = climateOf(key);
  if (!row) return '';
  const measured = row[1] === 'm';
  const best = new Set(bestMonths(row));
  const now = new Date().getMonth();
  const cells = MONTH.map((mn, m)=>{
    const ch = monthChar(row, m);
    return '<button type="button" class="cm b-'+ch.band.k+(m===monthSel?' on':'')+(best.has(m)?' best':'')+'"'
      + ' data-month="'+m+'" aria-pressed="'+(m===monthSel)+'"'
      + ' title="'+esc(name+' in '+mn+': '+ch.say)+'">'
      + '<span class="cm-m">'+MON3[m]+(m===now?'<i class="nowdot"></i>':'')+'</span>'
      + '<span class="cm-i">'+glyph(ch.icon, 17)+'</span>'
      + '<span class="cm-t">'+(measured ? C2F(ch.hi)+'°' : ch.band.label.slice(0,4))+'</span>'
      + '</button>';
  }).join('');
  const ch = monthChar(row, monthSel);
  const detail = '<div class="clim-d">'
    + '<span class="ro"><span class="lab">'+MONTH[monthSel].toUpperCase()+' IN '+esc(name).toUpperCase()+'</span>'
    + '<span class="intel-v">'+ch.say+'</span></span>'
    + '<span class="ro"><span class="lab">TYPICAL DAY</span><span class="cd-v">'
    + (measured ? C2F(ch.hi)+'° / '+C2F(ch.lo)+'°F' : ch.band.label)+'</span></span>'
    + '<span class="ro"><span class="lab">RAIN</span><span class="cd-v">'
    + (measured ? ch.rain+' mm' : ch.wetLabel)+'</span></span>'
    + (ch.snow ? '<span class="ro"><span class="lab">SNOW</span><span class="cd-v">'
        + (measured ? ch.snow+' days' : (ch.snowy===2?'LIKELY':'POSSIBLE'))+'</span></span>' : '')
    + '</div>';
  const bm = [...best].map(m=>MON3[m]).join(' · ');
  const srcLine = measured
    ? 'Real monthly averages recorded at ' + esc(row[2]) + '. Köppen class ' + esc(row[0]) + '.'
    : 'No weather station here, so this is the typical pattern for Köppen class <strong>' + esc(row[0])
      + '</strong> at this latitude, elevation and distance from the sea — bands, not measurements. '
      + 'Treat it as what the month is usually like, never as a forecast.';
  return '<div class="clim">'
    + '<div class="clim-grid">'+cells+'</div>'
    + detail
    + '<p class="note" style="padding-top:16px">'
    + (bm ? '<strong>Easiest months to be here: '+bm+'.</strong> ' : '')
    + srcLine + '</p></div>';
}
/* money, converted into whatever you actually spend at home */
function moneyPanel(co){
  const cur = currencyOf(co.slug), home = homeMoney();
  if (!cur || !cur[0]) return '';
  const same = cur[0] === home[0];
  return '<div class="intel" data-money="1">'
    + '<div class="intel-c"><span class="lab">THEY USE</span>'
    + '<span class="intel-v">'+esc(cur[1] || cur[0])+' '+esc(cur[0])+'</span>'
    + '<span class="note">'+esc(co.name)+'’s currency.</span></div>'
    + '<div class="intel-c"><span class="lab">ONE '+esc(cur[0])+' IS</span>'
    + '<span class="intel-v fx" data-fx="'+esc(cur[0])+'">'+(same ? 'your own money' : '—')+'</span>'
    + '<span class="note fxnote">'+(same
        ? 'The same money you live on, so nothing to convert.'
        : 'In '+esc(home[0])+', the currency where you live. Fetched live when the page loaded.')
    + '</span></div></div>';
}
function paintMoney(){
  const home = homeMoney();
  document.querySelectorAll('[data-fx]').forEach(el=>{
    const code = el.dataset.fx;
    if (code === home[0]) return;
    const r = rateFor(code);
    el.textContent = r == null ? (FX.note ? 'unavailable' : '—')
      : (home[1] || '') + fmtMoney(r) + ' ' + home[0];
  });
  if (FX.note) document.querySelectorAll('.fxnote').forEach(el=>{ el.textContent = FX.note; });
}
/* a handful of words that change how a place treats you */
function phrasePanel(co){
  const p = phrasesFor(co.slug);
  if (!p) return '';
  return '<div class="sec">'+secHead('A few words of '+esc(p.name), 'BEFORE YOU GO')
    + '<div class="phrases">'
    + p.rows.map(r=>'<div class="ph"><span class="ph-e">'+esc(r[0])+'</span>'
        + '<span class="ph-l" lang="'+esc(p.key)+'">'+esc(r[1])+'</span>'
        + (r[2] ? '<span class="ph-s">'+esc(r[2])+'</span>' : '')+'</div>').join('')
    + '</div><p class="note" style="padding-top:14px">The polite form in each case — the one that is never wrong with a stranger. '
    + 'The third line is how to say it, not a spelling.</p></div>';
}
/* admins can rewrite any of the guide text; everyone else just reads it */
function adminNote(co){
  if (typeof CLOUD === 'undefined' || !CLOUD.admin) return '';
  const open = !!PENDING['guide|'+co.slug];
  if (!open) return '<div style="padding-top:20px"><button class="btn ghost" data-guide="'+co.slug+'">Edit this country as admin</button></div>';
  const pr = profileOf(co.slug);
  return '<div class="editor" data-ed="guide|'+co.slug+'">'
    + '<span class="lab">ADMIN · THIS CHANGES THE SITE FOR EVERYONE</span>'
    + '<textarea class="f-d" rows="2" placeholder="One line on what this country is">'+esc(pr.b||'')+'</textarea>'
    + '<input class="f-t" type="text" placeholder="Best time to go" value="'+esc(pr.s||'')+'">'
    + '<textarea class="f-g2" rows="6" placeholder="One spot per line, as: Name | one short line">'
    + esc((pr.p||[]).map(x=>x[0]+' | '+x[1]).join('\n'))+'</textarea>'
    + '<span class="edrow"><button class="btn" data-guidesave="'+co.slug+'">Publish to everyone</button>'
    + '<button class="btn ghost" data-cancel="guide|'+co.slug+'">Cancel</button>'
    + '<button class="rm" data-guidereset="'+co.slug+'">Reset to shipped text</button></span></div>';
}

/* ---------- a place you added yourself ---------- */
const placeHref = a => '#/'+a.cont+'/'+a.c+'/'+slug(a.n);
function viewPlace(a, co){
  const ro = readout(a.id, a.lat, a.lon, a.tz);
  routeIsNight = ro.night;
  const todo = entriesOf(a.id,'todo'), eat = entriesOf(a.id,'eat');
  return crumbs([['World','#/continents'],[co.continent.name, contHref(co.continent)],[co.name, countryHref(co)],[a.n,'']])
  + '<div class="wrap"><div style="padding-top:36px"><div class="hero"><div class="hero-main">'
  + '<h1 class="title-xl">'+esc(a.n)+'</h1>'
  + '<span class="lab">'+esc(co.name).toUpperCase()+' · '+(a.k==='city'?'CITY':'REGION')+' · '+coord(a.lat,a.lon)+'</span>'
  + ro.html
  + '<div style="display:flex;flex-wrap:wrap;align-items:center;gap:12px">'+ctl(a.id, a.n)
  + '<span class="chip warm">'+glyph(ro.night?'night':'clear',14)+(ro.night?'IT IS NIGHT IN ':'IT IS DAYTIME IN ')+esc(a.n).toUpperCase()+'</span></div>'
  + noteSection(a.id)
  + '</div><div class="hero-side"><div class="board"><div class="board-h"><span class="lab">SAVED PLACES</span>'
  + '<span class="lab-s">'+pad2(todo.length+eat.length)+'</span></div>'
  + '<div style="padding:18px"><p class="note" style="margin-bottom:14px">Everything on this page as one CSV for Google My Maps.</p>'
  + '<button class="btn" data-dl="place:'+a.id+'">'+ICON.down+slug(a.n)+'-places.csv</button></div></div></div></div></div>'
  + entrySection(a.id, 'todo', 'Things to do', 'Add the first one — give it a description and as many photos as you like.')
  + entrySection(a.id, 'eat', 'Where I ate', 'Nothing eaten here on the record yet.')
  + '<div class="pagenav"><a href="'+countryHref(co)+'"><span class="lab-s">← BACK TO</span><span class="nt">'+esc(co.name)+'</span></a></div></div>';
}

/* ---------- state ---------- */
function viewState(st){
  const anchor = st.cities.find(c=>been(c.id)) || st.cities[0];
  routeIsNight = isNightAt(anchor.lat, anchor.lon);
  const nb = st.cities.filter(c=>been(c.id)).length;
  const wide = st.statewide.length ? rowsHTML(st.statewide)
    : blank('Nothing statewide yet','Parks, lakes, falls and regions that belong to no single city go in STATEWIDE in data.js.');
  const rank = c => statusOf(c.id)==='been' ? 0 : statusOf(c.id)==='want' ? 1 : 2;
  return crumbs([['World','#/continents'],[HOME_CONT.name, contHref(HOME_CONT)],[USA.name, countryHref(USA)],[st.name,'']])
  + '<div class="wrap"><div style="padding-top:36px;display:flex;flex-wrap:wrap;gap:40px;align-items:flex-end;justify-content:space-between">'
  + '<div style="flex:999 1 420px;min-width:0;display:flex;flex-direction:column;gap:18px">'
  + '<h1 class="title-xl">'+esc(st.name)+'</h1>'+ctl(st.id, st.name)+'</div>'
  + '<div class="readout" style="flex:0 0 auto">'
  + '<span class="ro"><span class="ro-v">'+nb+'</span><span class="lab">CITIES LOGGED</span></span>'
  + '<span class="ro"><span class="ro-v">'+st.statewide.filter(p=>been(p.id)).length+'</span><span class="lab">ACROSS THE STATE</span></span>'
  + '<span class="ro"><span class="ro-v">'+(st.cities.length-nb)+'</span><span class="lab">PAGES WAITING</span></span></div></div>'
  + '<div class="sec">'+secHead('The year in '+esc(st.name),
      (seasonNow('state:'+st.abbr) || {label:'MONTH BY MONTH'}).label)
  + climatePanel('state:'+st.abbr, st.name)+'</div>'
  + '<div class="sec">'+secHead('Across the state','PARKS, FALLS, LAKES AND REGIONS')+wide+'</div>'
  + '<div class="sec">'+secHead('Cities', nb+' OF '+st.cities.length+' LOGGED')
  + '<div class="grid g-cities" style="padding-top:28px">'+st.cities.slice().sort((a,b)=>rank(a)-rank(b)).map(cityCard).join('')+'</div></div>'
  + '<div class="sec"><div class="panel"><div class="panel-head" style="border:0">'
  + '<span style="display:flex;flex-direction:column;gap:6px"><span class="card-t" style="font-size:26px">Every '+esc(st.name)+' pin, one file</span>'
  + '<span class="note">The statewide places and every city below them, with your marks.</span></span>'
  + '<button class="btn" data-dl="state:'+st.slug+'">'+ICON.down+st.slug+'-places.csv</button></div></div></div></div>';
}

/* ---------- city ---------- */
function viewCity(c){
  const ro = readout(c.key, c.lat, c.lon, c.tz);
  routeIsNight = ro.night;
  const idx = c.state.cities.indexOf(c);
  const prev = c.state.cities[(idx-1+c.state.cities.length)%c.state.cities.length];
  const next = c.state.cities[(idx+1)%c.state.cities.length];
  const todo = entriesOf(c.key,'todo'), eat = entriesOf(c.key,'eat');
  const places = todo.length
    ? '<div class="places"><div class="places-l">'
      + todo.map(t=>'<a href="https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(t.t+', '+c.name+', '+c.state.name)+'" target="_blank" rel="noopener">'+pinFor(statusOf(t.id))+esc(t.t)+'</a>').join('')
      + '</div><div class="places-r"><span class="note">Each name opens in Google Maps. The CSV carries all of them, and your marks, in one import.</span></div></div>'
    : '';
  return crumbs([['World','#/continents'],[HOME_CONT.name, contHref(HOME_CONT)],[USA.name, countryHref(USA)],[c.state.name, stateHref(c.state)],[c.name,'']])
  + '<div class="wrap"><div style="padding-top:36px"><div class="hero"><div class="hero-main">'
  + '<h1 class="title-xl">'+esc(c.name)+'</h1>'
  + '<span class="lab">'+esc(c.state.name).toUpperCase()+', UNITED STATES · '+coord(c.lat,c.lon)+'</span>'
  + ro.html
  + '<div style="display:flex;flex-wrap:wrap;align-items:center;gap:12px">'+ctl(c.id, c.name)
  + '<span class="chip warm">'+glyph(ro.night?'night':'clear',14)+(ro.night?'IT IS NIGHT IN ':'IT IS DAYTIME IN ')+esc(c.name).toUpperCase()+'</span></div>'
  + noteSection(c.key)
  + '<p class="note">The page follows this city\u2019s clock, not yours — override it with the control up top.</p></div>'
  + '<div class="hero-side"><div class="board"><div class="board-h"><span class="lab">SAVED PLACES</span>'
  + '<span class="lab-s">'+pad2(todo.length+eat.length)+'</span></div>'
  + '<div style="padding:18px"><p class="note" style="margin-bottom:14px">One CSV with every pin on this page, ready for Google My Maps.</p>'
  + '<button class="btn" data-dl="city:'+c.key+'">'+ICON.down+c.slug+'-places.csv</button></div></div></div></div></div>'
  + entrySection(c.key, 'todo', 'Things to do', 'Add the first one — give it a description and as many photos as you like.')
  + entrySection(c.key, 'eat', 'Where I ate', 'Nothing eaten here on the record yet.')
  + '<div class="sec">'+secHead('The year in '+esc(c.name),
      (seasonNow('city:'+c.key) || {label:'MONTH BY MONTH'}).label)
  + climatePanel('city:'+c.key, c.name)+'</div>'
  + (places ? '<div class="sec">'+secHead('On the map','OPENS IN GOOGLE MAPS')+'<div class="panel" style="margin-top:28px">'+places+'</div></div>' : '')
  + '<div class="pagenav">'
  + '<a href="'+cityHref(prev)+'"><span class="lab-s">← PREVIOUS</span><span class="nt">'+esc(prev.name)+'</span></a>'
  + '<a class="lab" href="'+stateHref(c.state)+'" style="padding:8px 0">ALL OF '+esc(c.state.name).toUpperCase()+'</a>'
  + '<a class="nx" href="'+cityHref(next)+'"><span class="lab-s">NEXT →</span><span class="nt">'+esc(next.name)+'</span></a>'
  + '</div></div>';
}

/* ===========================================================
   TRIPS — a journey, not a list
   =========================================================== */
/* everything you have been to that carries a date, in one shape */
function datedBeen(){
  return everything()
    .filter(x=>statusOf(x.id) === 'been' && datable(x.id) && dateOf(x.id))
    .map(x=>({id:x.id, name:x.name, sub:x.sub || x.kind, kind:x.kind, href:x.href,
              date:dateOf(x.id), lat:x.lat, lon:x.lon}));
}
const nameOfId = id => {
  const hit = everything().find(x=>x.id === id);
  return hit ? hit.name : id;
};
const itemOfId = id => everything().find(x=>x.id === id) || null;

function viewTrips(){
  routeIsNight = isNightAt(38,-97);
  const items = datedBeen();
  const sugs = suggestTrips(items);
  const loose = (()=>{
    const inTrip = new Set(TRIPS.flatMap(t=>t.places));
    const inSug = new Set(sugs.flatMap(s=>s.places));
    return items.filter(x=>!inTrip.has(x.id) && !inSug.has(x.id));
  })();

  const mine = TRIPS.length ? TRIPS.slice()
    .sort((a,b)=>(b.from||'').localeCompare(a.from||''))
    .map(t=>{
      const names = t.places.map(nameOfId);
      const stops = t.days.reduce((n,d)=>n+d.stops.length, 0);
      return '<a class="card trip" href="#/trips/'+t.id+'">'
        + '<span class="lab-s">'+esc(tripSpan(t)).toUpperCase()+'</span>'
        + '<span class="card-t" style="font-size:26px">'+esc(t.title)+'</span>'
        + '<span class="note">'+esc(names.slice(0,4).join(' · '))
        + (names.length > 4 ? ' · +'+(names.length-4)+' more' : '')+'</span>'
        + '<span class="trip-foot"><span class="chip">'+pad2(t.places.length)+' PLACES</span>'
        + (t.days.length ? '<span class="chip warm">'+pad2(t.days.length)+' DAYS · '+pad2(stops)+' STOPS</span>'
                         : '<span class="chip">NO ITINERARY YET</span>')+'</span></a>';
    }).join('')
    : '';

  const suggested = sugs.length ? sugs.map((s,i)=>
      '<div class="added sug-trip"><span class="added-n">'
      + '<span class="card-t" style="font-size:19px">'+esc(s.title)+'</span>'
      + '<span class="lab-s">'+esc(s.names.join(' · ')).toUpperCase()+'</span></span>'
      + '<button class="btn" data-maketrip="'+i+'">Make this a trip</button></div>').join('')
    : '';

  return crumbs([['World','#/continents'],['Trips','']])
  + '<div class="wrap"><div style="padding-top:36px"><h1 class="title-l">Trips</h1>'
  + '<p class="lede" style="padding-top:14px">Places you marked as been, with a date, gathered into the journeys they '
  + 'actually belonged to — so the record reads as five trips rather than forty separate entries.</p></div>'

  + (mine ? '<div class="sec">'+secHead('Your trips', pad2(TRIPS.length))
      + '<div class="grid g-wide" style="padding-top:28px">'+mine+'</div></div>' : '')

  + (suggested ? '<div class="sec">'+secHead('Suggested from your dates', pad2(sugs.length))
      + '<p class="note" style="padding-bottom:18px">Visits whose months run into each other are almost always one journey. '
      + 'Confirm a grouping and it becomes a trip you can name, write up and plan day by day.</p>'
      + suggested + '</div>' : '')

  + (!mine && !suggested
      ? blank('No trips yet', 'Mark a few places as <strong>been</strong> and give them the month you went. '
        + 'Two or more in neighbouring months get offered here as a trip.')
      : '')

  + (loose.length ? '<div class="sec">'+secHead('Single visits', pad2(loose.length))
      + loose.sort((a,b)=>b.date.localeCompare(a.date)).map(x=>
        '<div class="added"><span class="added-n">'+pinFor('been')
        + '<a href="'+x.href+'" style="color:var(--ink)">'+esc(x.name)+'</a>'
        + '<span class="lab-s">'+esc(x.sub).toUpperCase()+'</span></span>'
        + '<span class="chip warm">'+esc(prettyDate(x.date))+'</span></div>').join('')
      + '<p class="note" style="padding-top:14px">On their own for now. Date another place in the same month and the pair becomes a trip.</p></div>' : '')
  + '</div>';
}

function viewTrip(t){
  routeIsNight = isNightAt(38,-97);
  const items = t.places.map(itemOfId).filter(Boolean);
  const names = items.map(x=>x.name);
  const placeRows = items.length ? items.map(x=>
      '<div class="added"><span class="added-n">'+pinFor('been')
      + '<a href="'+x.href+'" style="color:var(--ink)">'+esc(x.name)+'</a>'
      + '<span class="lab-s">'+esc(x.sub || x.kind).toUpperCase()
      + (dateOf(x.id) ? ' · '+esc(prettyDate(dateOf(x.id))).toUpperCase() : '')+'</span></span>'
      + '<button class="rm" data-tripdrop="'+t.id+'|'+x.id+'">REMOVE</button></div>').join('')
    : blank('Nothing in this trip','Add a place by marking it been with a date in the same month.');

  const days = t.days.length ? t.days.map((d,i)=>
      '<div class="day"><div class="day-h">'
      + '<input class="day-l" type="text" value="'+esc(d.label)+'" data-daylabel="'+t.id+'|'+i+'" aria-label="Name of this day">'
      + '<button class="rm" data-daydel="'+t.id+'|'+i+'">DELETE DAY</button></div>'
      + (d.stops.length ? '<div class="stops">'+d.stops.map((s,j)=>
          '<div class="stop"><span class="stop-t">'+(s.t ? esc(s.t) : '<i>—</i>')+'</span>'
          + '<span class="stop-n">'+esc(s.n)+'</span>'
          + '<span class="stop-b"><button class="tbtn" data-stopmove="'+t.id+'|'+i+'|'+j+'|-1" aria-label="Move up">↑</button>'
          + '<button class="tbtn" data-stopmove="'+t.id+'|'+i+'|'+j+'|1" aria-label="Move down">↓</button>'
          + '<button class="rm" data-stopdel="'+t.id+'|'+i+'|'+j+'">REMOVE</button></span></div>').join('')+'</div>' : '')
      + '<div class="addstop"><input type="text" class="s-n" placeholder="Where did you go?" aria-label="Place">'
      + '<input type="time" class="s-t" aria-label="Time of day, optional">'
      + '<button class="btn ghost" data-stopadd="'+t.id+'|'+i+'">Add stop</button></div>'
      + '<p class="note">The time is optional — leave it blank for a day you just wandered.</p></div>').join('')
    : blank('No days yet','Add a day and start filling in where you went. The time of day is optional.');

  const earned = items.filter(x=>x.kind === 'Country' || x.kind === 'State' || x.kind === 'City');
  return crumbs([['World','#/continents'],['Trips','#/trips'],[t.title,'']])
  + '<div class="wrap"><div style="padding-top:36px"><div class="hero"><div class="hero-main">'
  + '<span class="lab" style="color:var(--warm)">'+esc(tripSpan(t)).toUpperCase()+'</span>'
  + '<input class="trip-title" type="text" value="'+esc(t.title)+'" data-triptitle="'+t.id+'" aria-label="Trip name">'
  + '<p class="note">'+esc(names.join(' · '))+'</p>'
  + '<textarea class="trip-note" rows="3" placeholder="What was this trip? Write it however you like." '
  + 'data-tripnote="'+t.id+'">'+esc(t.note||'')+'</textarea>'
  + '</div><div class="hero-side"><div class="board"><div class="board-h"><span class="lab">THIS TRIP</span>'
  + '<span class="lab-s">'+pad2(t.places.length)+'</span></div>'
  + '<div style="padding:18px;display:flex;flex-direction:column;gap:10px">'
  + '<p class="note">The itinerary below as a document — it opens in Word, Pages or Docs, and prints to PDF.</p>'
  + '<button class="btn" data-tripdoc="'+t.id+'">'+ICON.down+'Export itinerary</button>'
  + '<button class="btn ghost" data-tripdel="'+t.id+'">Delete this trip</button>'
  + '</div></div></div></div></div>'

  + '<div class="sec">'+secHead('Places on this trip', pad2(items.length))+placeRows+'</div>'
  + '<div class="sec">'+secHead('Day by day', pad2(t.days.length)+' DAYS')
  + '<div style="padding-top:24px">'+days+'</div>'
  + '<div style="padding-top:20px"><button class="btn" data-dayadd="'+t.id+'">+ Add a day</button></div></div>'

  + (earned.length ? '<div class="sec">'+secHead('Earned on this trip', pad2(earned.length))
      + '<div class="badges" style="padding-top:26px">'
      + earned.map(x=>badgeCard(x.id, x.name, x.sub || x.kind)).join('')+'</div></div>' : '')
  + '</div>';
}

/* ===========================================================
   THE BOARD — what you brought back
   =========================================================== */
const plural = k => k === 'Country' ? 'Countries' : k === 'City' ? 'Cities'
  : k === 'Park or region' ? 'Parks and regions' : k + 's';
function badgeItems(){
  return everything()
    .filter(x=>['Continent','Country','State','City','Region','Park or region'].indexOf(x.kind) >= 0)
    .filter(x=>statusOf(x.id) === 'been')
    .map(x=>({id:x.id, name:x.name, sub:x.sub || x.kind, kind:x.kind, href:x.href}));
}
function badgeCard(id, name, sub){
  return '<div class="badge" data-badge="'+esc(id)+'">'
    + badgeSVG(name, sub, 132)
    + '<span class="badge-n">'+esc(name)+'</span>'
    + '<span class="lab-s">'+esc(sub).toUpperCase()+'</span>'
    + '<button class="tbtn" data-share="'+esc(id)+'|'+esc(name)+'|'+esc(sub)+'">SHARE</button></div>';
}
function viewBoard(){
  routeIsNight = isNightAt(38,-97);
  const all = badgeItems();
  const order = ['Continent','Country','State','City','Region','Park or region'];
  const groups = order.map(k=>[k, all.filter(x=>x.kind === k)]).filter(g=>g[1].length);
  const body = all.length
    ? groups.map(([k, list])=>'<div class="sec">'
        + secHead(plural(k), pad2(list.length))
        + '<div class="badges" style="padding-top:26px">'
        + list.map(x=>badgeCard(x.id, x.name, x.sub)).join('')+'</div></div>').join('')
    : blank('Nothing on the board yet',
        'Mark somewhere as <strong>been</strong> and its badge appears here. Each one is drawn from the '
        + 'place’s own name, so no two are alike.');
  return crumbs([['World','#/continents'],['Board','']])
  + '<div class="wrap"><div style="padding-top:36px;display:flex;flex-wrap:wrap;gap:24px;align-items:flex-end;justify-content:space-between">'
  + '<div><h1 class="title-l">The board</h1>'
  + '<p class="lede" style="padding-top:14px">One badge for every place you have been. The shape, the rim and the '
  + 'colours come from the place’s own name, so each badge belongs to that place and nowhere else — '
  + 'a shelf of them instead of a drawer of magnets.</p></div>'
  + (all.length ? '<button class="btn" data-shareboard="1">Share the whole board</button>' : '')+'</div>'
  + body + '</div>';
}

/* ---------- account: who you are, and where the journal lives ---------- */
let AUTHMODE = 'in', AUTHMSG = '';
function viewAccount(){
  routeIsNight = isNightAt(38,-97);
  const C = counts();
  const signedIn = CLOUD.on && CLOUD.user;
  let panel;
  if (!CLOUD.on){
    panel = blank('This copy saves to one browser only',
      'Everything you mark and write lives in this browser. To get accounts and a journal that follows you between devices, '
      + 'add free Supabase keys to <code>assets/js/config.js</code> and run <code>supabase/schema.sql</code>. '
      + 'The README walks through it in about ten minutes.');
  } else if (signedIn){
    panel = '<div class="panel"><div class="panel-head" style="border:0">'
      + '<span style="display:flex;flex-direction:column;gap:6px">'
      + '<span class="card-t" style="font-size:26px">'+esc(CLOUD.name || CLOUD.user.email)+'</span>'
      + '<span class="note">'+(CLOUD.admin ? 'Admin — your edits to the guide change the site for everyone.' : 'Signed in. Your journal syncs to every device you sign in on.')
      + (CLOUD.note ? ' <strong>'+esc(CLOUD.note)+'</strong>' : '')+'</span></span>'
      + '<button class="btn ghost" data-auth="out">Sign out</button></div></div>';
  } else {
    const t = AUTHMODE === 'up';
    panel = '<div class="editor" data-ed="auth">'
      + '<span class="lab">'+(t?'CREATE AN ACCOUNT':'SIGN IN')+'</span>'
      + (t?'<input class="f-n" type="text" placeholder="Your name" autocomplete="name">':'')
      + '<input class="f-e" type="email" placeholder="Email" autocomplete="username">'
      + '<input class="f-p2" type="password" placeholder="Password" autocomplete="'+(t?'new-password':'current-password')+'">'
      + (AUTHMSG ? '<p class="note" style="color:var(--warm)">'+esc(AUTHMSG)+'</p>' : '')
      + '<span class="edrow"><button class="btn" data-auth="'+(t?'up':'in')+'">'+(t?'Create account':'Sign in')+'</button>'
      + '<button class="btn ghost" data-auth="'+(t?'mode-in':'mode-up')+'">'+(t?'I already have one':'Create an account')+'</button>'
      + (t?'':'<button class="rm" data-auth="reset">Forgot password</button>')+'</span></div>';
  }

  const passportOpts = PASSPORTS.map(pp=>'<option value="'+pp[0]+'"'+(PREFS.passport===pp[0]?' selected':'')+'>'+esc(pp[1])+'</option>').join('');
  const hc = homeCountry(), lc = livingCountry(), money = homeMoney();
  const countryOpts = sel => '<option value="">— follow my other settings —</option>'
    + ALL_COUNTRIES.slice().sort((a,b)=>a.name.localeCompare(b.name))
      .map(c=>'<option value="'+c.slug+'"'+(sel===c.slug?' selected':'')+'>'+esc(c.name)+'</option>').join('');
  return crumbs([['World','#/continents'],['Account','']])
  + '<div class="wrap"><div style="padding-top:36px"><h1 class="title-l">Account</h1>'
  + '<p class="lede" style="padding-top:14px">Where your journal is kept, and the two settings that drive flight times and visa rules.</p></div>'
  + '<div class="sec">'+secHead('Your journal', signedIn ? 'SYNCED' : 'THIS BROWSER')+'<div style="padding-top:24px">'+panel+'</div></div>'

  + '<div class="sec">'+secHead('Travel settings','USED ON EVERY COUNTRY PAGE')
  + '<div class="setgrid">'
  + '<label class="setbox"><span class="lab">PASSPORT</span>'
  + '<select data-pref="passport">'+passportOpts+'</select>'
  + '<span class="note">Decides the visa line on every country page.</span></label>'
  + '<label class="setbox"><span class="lab">FLYING FROM</span>'
  + '<input type="text" id="homeport" value="'+esc(PREFS.home.name)+'" placeholder="Your home city">'
  + '<span class="note">Type a city and pick a match; flight times are measured from here.</span>'
  + '<span class="ac hidden" id="homeac"></span></label>'
  + '<label class="setbox"><span class="lab">HOME COUNTRY</span>'
  + '<select data-pref="homeCountry">'+countryOpts(PREFS.homeCountry)+'</select>'
  + '<span class="note">Where you are from. Left alone it follows your passport'
  + (hc ? ' — currently <strong>'+esc(hc.name)+'</strong>' : '')+'.</span></label>'
  + '<label class="setbox"><span class="lab">LIVING IN</span>'
  + '<select data-pref="livingCountry">'+countryOpts(PREFS.livingCountry)+'</select>'
  + '<span class="note">Where you are based now. Left alone it follows the city you fly from'
  + (lc ? ' — currently <strong>'+esc(lc.name)+'</strong>, so prices convert into '+esc(money[0]) : '')
  + '.</span></label>'
  + '</div>'
  + '<p class="note" style="padding-top:16px">These are deliberately separate. The passport decides whether you need a '
  + 'visa; the country you live in decides the money you think in. Plenty of people do not have the same answer for both.</p></div>'

  + '<div class="sec">'+secHead('Backup','KEEP A COPY')
  + '<div class="setgrid" style="padding-top:24px">'
  + '<div class="setbox"><span class="card-t" style="font-size:22px">Export everything</span>'
  + '<span class="note">One JSON file with every mark, date, entry, note and photo. Keep it somewhere safe.</span>'
  + '<button class="btn" data-export="1">'+ICON.down+'Download my journal</button></div>'
  + '<div class="setbox"><span class="card-t" style="font-size:22px">Restore from a file</span>'
  + '<span class="note">Merge adds anything missing. Replace wipes what is here first.</span>'
  + '<span class="edrow"><label class="filebtn">Choose a file<input type="file" accept="application/json" data-import="merge"></label>'
  + '<label class="filebtn">Replace<input type="file" accept="application/json" data-import="replace"></label></span></div>'
  + '</div></div>'

  + '<div class="sec">'+secHead('Your numbers','')
  + '<div class="stats">'+stat(C.continents,'CONTINENTS')+stat(C.countries,'COUNTRIES')+stat(C.states,'STATES')
  + stat(C.cities,'CITIES')+stat(C.places,'PARKS &amp; REGIONS')+stat(C.wish,'ON THE LIST')+'</div></div></div>';
}

function viewMissing(){
  routeIsNight = isNightAt(38,-97);
  return '<div class="wrap" style="padding-top:80px"><h1 class="title-l">No page at that address</h1>'
  + '<p class="lede" style="padding-top:16px">Try the search box, or <a href="#/continents">start again from the atlas</a>.</p></div>';
}

/* ===========================================================
   ROUTER
   =========================================================== */
let lastRoute = null, scrollTo = null;
function route(){
  const raw = location.hash.replace(/^#\/?/,'').split('?')[0];
  const parts = raw.split('/').filter(Boolean);
  let html, points = [], title = 'Meridian', foot = 'A PERSONAL TRAVEL ATLAS';
  scrollTo = null;
  const first = parts[0];

  if (!parts.length){ html = viewHome(); points = boardPoints(); }
  else if (first === 'continents'){ html = viewHome(); points = boardPoints(); scrollTo = 'continents'; }
  else if (first === 'map'){ html = viewMap(); title = 'The map — Meridian'; }
  else if (first === 'been' || first === 'want'){ html = viewList(first); title = (first==='been'?'Been there':'Want to go')+' — Meridian'; }
  else if (first === 'board'){ html = viewBoard(); title = 'The board — Meridian'; }
  else if (first === 'trips'){
    if (parts.length === 1){ html = viewTrips(); title = 'Trips — Meridian'; }
    else {
      const t = tripOf(parts[1]);
      if (!t) html = viewMissing();
      else { html = viewTrip(t); title = t.title + ' — Meridian'; foot = tripSpan(t).toUpperCase(); }
    }
  }
  else if (first === 'account'){ html = viewAccount(); title = 'Account — Meridian'; }
  else {
    const ct = CONT_BY_SLUG[first];
    if (!ct) html = viewMissing();
    else if (parts.length === 1){ html = viewContinent(ct); title = ct.name+' — Meridian';
      points = ct.countries.map(c=>({key:'co-'+c.slug, lat:c.lat, lon:c.lon})).slice(0,40); }
    else {
      const co = ct.countries.find(c=>c.slug === parts[1]);
      if (!co) html = viewMissing();
      else if (parts.length === 2){
        html = viewCountry(co); title = co.name+' — Meridian'; foot = co.tz.toUpperCase().replace(/_/g,' ');
        points = [{key:'co-'+co.slug, lat:co.lat, lon:co.lon}];
      } else if (!co.detailed){
        const a = addedFor(co.slug).find(x=>slug(x.n) === parts[2]);
        if (!a) html = viewMissing();
        else { html = viewPlace(a, co); title = a.n+' — Meridian'; foot = a.tz.toUpperCase().replace(/_/g,' ');
          points = [{key:a.id, lat:a.lat, lon:a.lon}]; }
      } else {
        const st = BY_ABBR[parts[2]];
        if (!st) html = viewMissing();
        else if (parts.length === 3){
          html = viewState(st); title = st.name+' — Meridian'; foot = st.tz.toUpperCase().replace(/_/g,' ');
          points = st.cities.map(c=>({key:c.key, lat:c.lat, lon:c.lon}));
        } else {
          const c = st.cities.find(x=>x.slug === parts[3]);
          if (!c) html = viewMissing();
          else { html = viewCity(c); title = c.name+', '+st.abbr+' — Meridian';
            foot = c.tz.toUpperCase().replace(/_/g,' '); points = [{key:c.key, lat:c.lat, lon:c.lon}]; }
        }
      }
    }
  }
  document.getElementById('app').innerHTML = html;
  document.title = title;
  document.getElementById('footnote').textContent = foot;
  document.querySelectorAll('.navlinks a[data-nav]').forEach(a=>
    a.classList.toggle('on', a.dataset.nav === (first || 'home')));
  applyTheme(); tick(); wireMaps(); paintPhotos(); wireAddBox(); wireHomePort(); paintAuthState();
  paintMoney();
  loadWeather(points);
  lastRoute = raw;
}
/* the add-a-place box: known cities fill themselves in */
function wireAddBox(){
  const box = document.getElementById('newplace');
  if (!box) return;
  const co = CO_BY_SLUG[box.dataset.placeCo];
  const ac = document.getElementById('placeac');
  const pool = (SUGGEST[co.slug] || [[],[]])[1] || [];
  const taken = new Set(addedFor(co.slug).map(a=>a.id));
  const match = () => {
    const q = box.value.trim().toLowerCase();
    if (q.length < 2) return [];
    return pool.filter(r=>r[0].toLowerCase().includes(q) && !taken.has(addedId(co.slug,'city',r[0]))).slice(0,7);
  };
  const commit = row => {
    const name = row ? row[0] : box.value.trim();
    if (!name) return;
    if (row) addPlace(co.slug, 'city', row[0], row[1], row[2], row[3]);
    else addPlace(co.slug, 'city', name, co.lat, co.lon, co.tz);
    box.value = ''; rerender();
  };
  box.addEventListener('input', ()=>{
    const hits = match();
    if (!hits.length){ ac.classList.add('hidden'); return; }
    ac.innerHTML = hits.map((r,i)=>'<button type="button" data-i="'+i+'">'+esc(r[0])+'</button>').join('');
    ac.classList.remove('hidden');
    [...ac.children].forEach((b,i)=>b.addEventListener('click', ()=>commit(hits[i])));
  });
  box.addEventListener('keydown', e=>{
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const hits = match();
    commit(hits.find(r=>r[0].toLowerCase() === box.value.trim().toLowerCase()) || hits[0] || null);
  });
  const go = document.querySelector('[data-place-go]');
  if (go) go.addEventListener('click', ()=>{
    const hits = match();
    commit(hits.find(r=>r[0].toLowerCase() === box.value.trim().toLowerCase()) || hits[0] || null);
  });
}
function paintAuthState(){
  const link = document.querySelector('[data-nav="account"]');
  if (!link) return;
  if (!CLOUD.on) link.textContent = 'Account';
  else if (CLOUD.state === 'syncing') link.textContent = 'Syncing…';
  else if (CLOUD.user) link.textContent = (CLOUD.name || CLOUD.user.email).split('@')[0] + (CLOUD.admin ? ' ·admin' : '');
  else link.textContent = 'Sign in';
}
const boardPoints = () => BOARD.map((b,i)=>({key:'board'+i, lat:b[2], lon:b[3]}));
function tick(){
  const now = new Date();
  document.querySelectorAll('[data-tz]').forEach(el=>{ el.textContent = fmtTime(now, el.dataset.tz); });
}
setInterval(tick, 1000);
document.addEventListener('click', e=>{
  const f = e.target.closest('[data-filter]');
  if (f){ mapFilter = f.dataset.filter; rerender(); }
});
window.addEventListener('hashchange', ()=>{
  const prev = lastRoute;
  route();
  if (scrollTo){
    const el = document.getElementById(scrollTo);
    if (el) el.scrollIntoView({behavior: prev === '' || prev === 'continents' ? 'smooth' : 'auto', block:'start'});
  } else window.scrollTo(0,0);
});

/* ===========================================================
   SEARCH
   =========================================================== */
const INDEX = [];
CONTINENTS.forEach(ct=>{
  INDEX.push({label:ct.name, sub:'CONTINENT', href:contHref(ct), rank:1});
  ct.countries.forEach(co=>INDEX.push({label:co.name, sub:'COUNTRY · '+ct.name.toUpperCase(), href:countryHref(co), rank:0}));
});
ATLAS.forEach(s=>{
  INDEX.push({label:s.name, sub:s.abbr+' · STATE', href:stateHref(s), rank:1});
  s.statewide.forEach(p=>INDEX.push({label:p.title, sub:s.abbr+' · '+p.tag, href:stateHref(s), rank:0}));
  s.cities.forEach(c=>INDEX.push({label:c.name, sub:s.abbr+' · CITY', href:cityHref(c), rank:1}));
});
const box = document.getElementById('search'), res = document.getElementById('results');
function runSearch(){
  const q = box.value.trim().toLowerCase();
  if (q.length < 2){ res.classList.add('hidden'); return; }
  const extra = ADDED.map(a=>({label:a.n, sub:((CO_BY_SLUG[a.c]||{}).name||'').toUpperCase(), href:'#/'+a.cont+'/'+a.c, rank:0}));
  const hits = INDEX.concat(extra).filter(e=>e.label.toLowerCase().includes(q))
    .sort((a,b)=> a.rank-b.rank || a.label.toLowerCase().indexOf(q)-b.label.toLowerCase().indexOf(q) || a.label.localeCompare(b.label))
    .slice(0,8);
  res.innerHTML = hits.length
    ? hits.map(h=>'<a href="'+h.href+'"><span>'+esc(h.label)+'</span><span class="r-sub">'+esc(h.sub)+'</span></a>').join('')
    : '<a href="#/continents"><span>Nothing by that name</span></a>';
  res.classList.remove('hidden');
}
box.addEventListener('input', runSearch);
box.addEventListener('focus', runSearch);
res.addEventListener('click', ()=>{ res.classList.add('hidden'); box.value=''; });
document.addEventListener('click', e=>{ if (!e.target.closest('.searchwrap')) res.classList.add('hidden'); });
box.addEventListener('keydown', e=>{ if (e.key === 'Escape'){ res.classList.add('hidden'); box.blur(); } });

route();
if (scrollTo){ const el = document.getElementById(scrollTo); if (el) el.scrollIntoView({block:'start'}); }
/* one keyless call for today's exchange rates, in the money you live on */
loadRates(homeMoney()[0]);
