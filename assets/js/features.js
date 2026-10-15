/* ===========================================================
   FEATURES — the parts of Meridian that are about a journey
   rather than a place: what a month is usually like, where the
   daylight is right now, which visits belong to one trip, what
   a day of that trip looked like, what you earned by going, and
   what the money and the language are when you get there.

   Nothing in here talks to a server except the exchange rates,
   which are one free keyless call made when the page loads.
   =========================================================== */

const MONTH  = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];
const MON3   = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

/* ===========================================================
   1. CLIMATE — twelve months of character for a place
   =========================================================== */
const climateOf = key => (typeof CLIMATE !== 'undefined' && CLIMATE[key]) || null;
const C2F = c => Math.round(c*9/5 + 32);

/* Temperature bands. Wide enough that an estimated row landing a
   couple of degrees out still lands in the right band. */
const BANDS = [
  [-99, -6, 'freezing', 'FREEZING'],
  [ -6,  4, 'cold',     'COLD'],
  [  4, 13, 'cool',     'COOL'],
  [ 13, 21, 'mild',     'MILD'],
  [ 21, 28, 'warm',     'WARM'],
  [ 28, 35, 'hot',      'HOT'],
  [ 35, 99, 'searing',  'SEARING']
];
function bandOf(c){
  for (const b of BANDS) if (c > b[0] && c <= b[1]) return {k:b[2], label:b[3]};
  return {k:'mild', label:'MILD'};
}
/* What one month is like: a temperature band plus whatever the sky
   is doing often enough to change how the month feels. */
function monthChar(row, m){
  if (!row) return null;
  const hi = row[3][m], lo = row[4][m], rain = row[5][m], snow = row[6][m];
  const mean = (hi+lo)/2;
  const band = bandOf(hi);
  let wet = 'dry', wetLabel = 'DRY';
  if (rain >= 160){ wet = 'soaked'; wetLabel = 'VERY WET'; }
  else if (rain >= 90){ wet = 'wet'; wetLabel = 'WET'; }
  else if (rain >= 35){ wet = 'damp'; wetLabel = 'SOME RAIN'; }
  else if (rain >= 12){ wet = 'dry'; wetLabel = 'MOSTLY DRY'; }
  else { wet = 'arid'; wetLabel = 'DRY'; }
  const snowy = snow >= 8 ? 2 : snow >= 2 ? 1 : 0;
  let icon = 'clear';
  if (snowy) icon = 'snow';
  else if (wet === 'soaked' || wet === 'wet') icon = 'rain';
  else if (wet === 'damp') icon = 'partly';
  else if (band.k === 'searing' || band.k === 'hot') icon = 'clear';
  return {hi, lo, mean, rain, snow, band, wet, wetLabel, snowy, icon,
    /* one short phrase for the month */
    say: snowy === 2 ? 'Snowy' : snowy === 1 ? 'Snow possible'
       : wet === 'soaked' ? 'Heavy rain' : wet === 'wet' ? 'Rainy'
       : band.k === 'searing' ? 'Very hot' : band.k === 'hot' ? 'Hot'
       : band.k === 'freezing' ? 'Freezing' : band.k === 'cold' ? 'Cold'
       : band.k === 'cool' ? 'Cool' : band.k === 'warm' ? 'Warm' : 'Mild'};
}
/* A score for how pleasant a month tends to be — used to pick out
   the best window to go, and never shown as a number. */
function monthScore(ch){
  if (!ch) return 0;
  let s = 100;
  const t = ch.hi;
  if (t > 32) s -= (t-32)*6; else if (t > 28) s -= (t-28)*2.5;
  if (t < 16) s -= (16-t)*3.2;
  s -= Math.min(34, ch.rain/5.5);
  s -= ch.snow*1.6;
  return s;
}
function bestMonths(row){
  if (!row) return [];
  const sc = MONTH.map((n,m)=>({m, s:monthScore(monthChar(row,m))}));
  const top = sc.slice().sort((a,b)=>b.s-a.s)[0].s;
  return sc.filter(x=>x.s >= top-11).map(x=>x.m);
}
/* Which season a place is in right now — hemisphere aware, and in
   the tropics it reports the wet or dry season instead, because
   that is the distinction that actually matters there. */
function seasonNow(key, when){
  const row = climateOf(key);
  if (!row) return null;
  const m = (when || new Date()).getMonth();
  const ch = monthChar(row, m);
  const rains = row[5], span = Math.max(...rains) - Math.min(...rains);
  const temps = row[3], tspan = Math.max(...temps) - Math.min(...temps);
  if (tspan < 9 && span > 55)
    return rains[m] >= (Math.max(...rains)+Math.min(...rains))/2
      ? {k:'wet', label:'WET SEASON'} : {k:'dry', label:'DRY SEASON'};
  if (tspan < 9) return {k:'even', label:'MUCH THE SAME ALL YEAR'};
  const warmest = temps.indexOf(Math.max(...temps));
  const d = ((m - warmest) + 12) % 12;          // months since the warmest
  if (ch && ch.snowy === 2) return {k:'winter', label:'WINTER'};
  if (d <= 1 || d >= 11) return {k:'summer', label:'SUMMER'};
  if (d <= 4) return {k:'autumn', label:'AUTUMN'};
  if (d <= 7) return {k:'winter', label:'WINTER'};
  return {k:'spring', label:'SPRING'};
}

/* ===========================================================
   2. DAYLIGHT — where on earth the sun is up, right now
   =========================================================== */
function subsolar(when){
  const d = (when.getTime()/86400000 + 2440587.5) - 2451545.0;
  const g = (357.529 + 0.98560028*d) * RAD;
  const q = 280.459 + 0.98564736*d;
  const L = (q + 1.915*Math.sin(g) + 0.020*Math.sin(2*g)) * RAD;
  const e = (23.439 - 0.00000036*d) * RAD;
  const dec = Math.asin(Math.sin(e)*Math.sin(L));
  let ra = Math.atan2(Math.cos(e)*Math.sin(L), Math.cos(L)) / RAD;   // degrees
  let gmst = (18.697374558 + 24.06570982441908*d) % 24;
  if (gmst < 0) gmst += 24;
  let lon = ra - gmst*15;
  lon = ((lon + 540) % 360) - 180;
  return {dec, lon};
}
/* The night side as one SVG path in map space (x = lon+180, y = 90-lat).
   Recomputed on every render, so a reload always shows the real thing. */
function terminatorPath(when){
  const s = subsolar(when || new Date());
  const tanDec = Math.tan(s.dec);
  if (Math.abs(tanDec) < 1e-7) {                      // equinox: a clean meridian
    const x = ((s.lon + 180) + 180) % 360;
    return 'M'+x.toFixed(2)+' 0 L'+(x+180).toFixed(2)+' 0 L'+(x+180).toFixed(2)+' 180 L'+x.toFixed(2)+' 180 Z';
  }
  const pts = [];
  for (let i = 0; i <= 360; i++){
    const lon = -180 + i;
    const H = (lon - s.lon) * RAD;
    const lat = Math.atan(-Math.cos(H)/tanDec) / RAD;
    pts.push([(lon+180), (90-lat)]);
  }
  const darkSouth = s.dec > 0;                        // northern summer -> south is dark
  const edge = darkSouth ? 180 : 0;
  return 'M' + pts.map(p=>p[0].toFixed(2)+' '+p[1].toFixed(2)).join('L')
       + 'L360 '+edge+' L0 '+edge+' Z';
}

/* ===========================================================
   3. TRIPS — visits on nearby dates are almost always one journey
   =========================================================== */
const TRIP_KEY = 'meridian-trips';
let TRIPS = [];
try { TRIPS = JSON.parse(localStorage.getItem(TRIP_KEY) || '[]'); } catch(e){ TRIPS = []; }
const saveTrips = () => {
  try { localStorage.setItem(TRIP_KEY, JSON.stringify(TRIPS)); } catch(e){}
  if (typeof cloudPushSoon === 'function') cloudPushSoon();
};
const tripId = () => 't' + Date.now().toString(36) + Math.random().toString(36).slice(2,6);
const tripOf = id => TRIPS.find(t=>t.id === id) || null;
const tripHolding = placeId => TRIPS.find(t=>t.places.indexOf(placeId) >= 0) || null;

/* Group the dated places you have been by when you went. Two visits
   belong together when their months touch — which keeps a trip that
   runs from the end of one month into the next in one piece, where
   grouping by calendar month alone would tear it in half. */
function suggestTrips(items){
  const dated = items.filter(x=>x.date).slice()
    .sort((a,b)=>a.date.localeCompare(b.date));
  const taken = new Set(TRIPS.flatMap(t=>t.places));
  const free = dated.filter(x=>!taken.has(x.id));
  const out = []; let run = [];
  const monthNum = s => { const [y,m] = s.split('-'); return (+y)*12 + (+m||1) - 1; };
  /* Same month: one trip, wherever they are. Neighbouring months: one trip
     only if the places are near enough that you plausibly went straight on
     — otherwise February in Iceland and March in Texas become one journey,
     which they almost certainly were not. */
  const together = (a, b) => {
    const gap = monthNum(b.date) - monthNum(a.date);
    if (gap === 0) return true;
    if (gap > 1) return false;
    if (a.lat == null || b.lat == null) return true;
    return greatCircle({lat:a.lat, lon:a.lon}, {lat:b.lat, lon:b.lon}) < 3000;
  };
  for (const x of free){
    if (!run.length || together(run[run.length-1], x)) run.push(x);
    else { if (run.length > 1) out.push(run); run = [x]; }
  }
  if (run.length > 1) out.push(run);
  return out.map(g=>({
    from: g[0].date, to: g[g.length-1].date,
    places: g.map(x=>x.id),
    names: g.map(x=>x.name),
    title: tripTitle(g)
  }));
}
/* Name it after the places themselves. Several cities inside one country
   collapse to the country, so a week around Japan reads as "Japan" rather
   than as a list of four city names. */
function tripTitle(g){
  const own = x => ['Country','Continent','State'].indexOf(x.kind) >= 0;
  const names = [...new Set(g.map(x=>own(x) ? x.name : (x.sub || x.name)))];
  const where = names.length === 1 ? names[0]
    : names.length === 2 ? names[0] + ' and ' + names[1]
    : names.length === 3 ? names[0] + ', ' + names[1] + ' and ' + names[2]
    : names.slice(0,2).join(', ') + ' and ' + (names.length-2) + ' more';
  return where + ', ' + prettyDate(g[0].date);
}
function tripCreate(sug){
  const t = {id:tripId(), title:sug.title, from:sug.from, to:sug.to,
             places:sug.places.slice(), note:'', days:[]};
  TRIPS.push(t); saveTrips(); return t;
}
function tripDelete(id){ TRIPS = TRIPS.filter(t=>t.id !== id); saveTrips(); }
function tripSpan(t){
  if (!t.from) return '';
  const a = prettyDate(t.from), b = prettyDate(t.to);
  return a === b ? a : a + ' – ' + b;
}

/* ---------- itinerary: days, each with stops ---------- */
function dayAdd(t){ t.days.push({label:'Day '+(t.days.length+1), stops:[]}); saveTrips(); }
function dayDel(t, i){ t.days.splice(i,1); saveTrips(); }
function stopAdd(t, di, name, time){
  t.days[di].stops.push({n:name, t:time||''}); saveTrips();
}
function stopDel(t, di, si){ t.days[di].stops.splice(si,1); saveTrips(); }
function stopMove(t, di, si, dir){
  const s = t.days[di].stops, j = si + dir;
  if (j < 0 || j >= s.length) return;
  [s[si], s[j]] = [s[j], s[si]]; saveTrips();
}
/* The itinerary as a document anything can open: Word, Pages, Docs,
   or a browser that prints it to PDF. */
function itineraryDoc(t, placeNames){
  const row = (l,r) => '<tr><td class="t">'+esc(l)+'</td><td>'+r+'</td></tr>';
  const days = t.days.length ? t.days.map((d,i)=>
      '<h2>'+esc(d.label || ('Day '+(i+1)))+'</h2>'
      + (d.stops.length
         ? '<table>'+d.stops.map(s=>row(s.t || '—', esc(s.n))).join('')+'</table>'
         : '<p class="muted">Nothing planned for this day.</p>')
    ).join('')
    : '<p class="muted">No days written yet.</p>';
  return '<!doctype html><html><head><meta charset="utf-8">'
  + '<title>'+esc(t.title)+'</title><style>'
  + 'body{font-family:Georgia,"Times New Roman",serif;max-width:40em;margin:3em auto;padding:0 1.5em;color:#1a1a1a;line-height:1.6}'
  + 'h1{font-size:2em;margin:0 0 .1em}h2{font-size:1.15em;margin:2em 0 .4em;border-bottom:1px solid #ddd;padding-bottom:.3em}'
  + '.sub{color:#666;font-size:.95em;margin:0 0 2em}table{border-collapse:collapse;width:100%}'
  + 'td{padding:.42em .6em .42em 0;vertical-align:top;border-bottom:1px solid #f0f0f0}'
  + 'td.t{width:7.5em;color:#666;font-variant-numeric:tabular-nums}'
  + '.muted{color:#888}ul{padding-left:1.2em}.foot{margin-top:3em;color:#888;font-size:.85em;border-top:1px solid #ddd;padding-top:1em}'
  + '</style></head><body>'
  + '<h1>'+esc(t.title)+'</h1>'
  + '<p class="sub">'+esc(tripSpan(t))+(placeNames.length ? ' · ' + esc(placeNames.join(' · ')) : '')+'</p>'
  + (t.note ? '<p>'+esc(t.note).replace(/\n/g,'<br>')+'</p>' : '')
  + days
  + (placeNames.length ? '<h2>Places on this trip</h2><ul>'+placeNames.map(n=>'<li>'+esc(n)+'</li>').join('')+'</ul>' : '')
  + '<p class="foot">From Meridian · '+new Date().toLocaleDateString('en-US',{dateStyle:'long'})+'</p>'
  + '</body></html>';
}

/* ===========================================================
   4. BADGES — something to keep from each place you have been.
   Drawn, not downloaded: the shape and palette come from the
   place's own name, so every badge is that place's and no other.
   =========================================================== */
function hashOf(s){
  let h = 2166136261;
  for (let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return Math.abs(h);
}
const BADGE_INK = [
  ['#1c3f5e','#e8b14a','#f3ece0'], ['#5e1c2c','#d9a441','#f5ece6'],
  ['#1f4536','#cfa13a','#eef0e6'], ['#3a2259','#d79a4e','#f0eaf3'],
  ['#5a3410','#dfc04a','#f6eee2'], ['#13394a','#bcd6c8','#eef3f2'],
  ['#4a1530','#e0a6ad','#f7ebee'], ['#243a1c','#d2c050','#eff1e4']
];
/* eight motifs, picked by the place's own hash */
function badgeMotif(i, c){
  const M = [
    '<path d="M22 46 34 22l12 24Z"/><path d="M14 46h40"/>',                       // peak
    '<circle cx="34" cy="31" r="10"/><path d="M14 46h40M20 38h28"/>',             // sun over water
    '<path d="M20 46V24h28v22"/><path d="M26 46V34h6v12M38 36h6v10"/>',           // old town
    '<path d="M34 16v30M22 24h24M19 46h30"/><path d="M26 24c0 8 4 14 8 14s8-6 8-14"/>', // gate
    '<path d="M16 42c6-4 12-4 18 0s12 4 18 0"/><path d="M16 34c6-4 12-4 18 0s12 4 18 0"/><circle cx="34" cy="20" r="5"/>',
    '<path d="M34 14 44 40H24Z"/><path d="M18 46h32"/>',                          // pyramid
    '<circle cx="34" cy="30" r="12"/><path d="M34 18v24M22 30h24"/>',             // compass rose
    '<path d="M20 46V22l14-8 14 8v24"/><path d="M30 46V34h8v12"/>'                // house on a hill
  ];
  return M[i % M.length];
}
function badgeSVG(name, sub, size){
  const h = hashOf(name + '|' + (sub||''));
  const pal = BADGE_INK[h % BADGE_INK.length];
  const motif = badgeMotif(h >> 3, pal[1]);
  const s = size || 150;
  const ring = (h >> 7) % 3;               // three rim treatments
  const rim = ring === 0
    ? '<circle cx="34" cy="34" r="31" fill="none" stroke="'+pal[1]+'" stroke-width="1.4" stroke-dasharray="2.5 2.5"/>'
    : ring === 1
    ? '<circle cx="34" cy="34" r="31.5" fill="none" stroke="'+pal[1]+'" stroke-width="2.6"/>'
    : '<circle cx="34" cy="34" r="31" fill="none" stroke="'+pal[1]+'" stroke-width="1.2"/>'
      + '<circle cx="34" cy="34" r="28.4" fill="none" stroke="'+pal[1]+'" stroke-width="0.7"/>';
  /* The name sits inside the rim. Long names are squeezed to fit rather
     than being allowed to run over the edge, so "United States" and
     "Fiji" both sit cleanly within the same circle. */
  const label = (name.length > 18 ? name.slice(0,17) + '…' : name).toUpperCase();
  const fs = label.length > 12 ? 4.4 : label.length > 8 ? 5.2 : 6;
  const MAXW = 38, est = label.length * (fs*0.60 + 0.85);
  const fit = est > MAXW ? ' textLength="'+MAXW+'" lengthAdjust="spacingAndGlyphs"' : '';
  return '<svg class="badge-svg" viewBox="0 0 68 68" width="'+s+'" height="'+s+'" role="img" aria-label="Badge for '+esc(name)+'">'
    + '<circle cx="34" cy="34" r="33" fill="'+pal[0]+'"/>'
    + rim
    + '<g fill="none" stroke="'+pal[2]+'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" transform="translate(0,-6) scale(0.82) translate(7,7)">'
    + motif + '</g>'
    + '<text x="34" y="53.5" text-anchor="middle" fill="'+pal[2]+'" font-family="ui-monospace,monospace" '
    + 'font-size="'+fs+'" letter-spacing="0.85"'+fit+'>'+esc(label)+'</text>'
    + '</svg>';
}
/* Turn any badge, or the whole board, into a PNG the person can keep
   or send. Canvas only — nothing is uploaded anywhere. */
function svgToPNG(svgText, w, h, scale){
  return new Promise((res, rej)=>{
    const img = new Image();
    const blob = new Blob([svgText], {type:'image/svg+xml;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    img.onload = ()=>{
      const k = scale || 3, cv = document.createElement('canvas');
      cv.width = w*k; cv.height = h*k;
      const g = cv.getContext('2d');
      g.imageSmoothingEnabled = true;
      g.drawImage(img, 0, 0, cv.width, cv.height);
      URL.revokeObjectURL(url);
      cv.toBlob(b=>b ? res(b) : rej(new Error('no blob')), 'image/png');
    };
    img.onerror = ()=>{ URL.revokeObjectURL(url); rej(new Error('bad svg')); };
    img.src = url;
  });
}
async function shareBlob(blob, filename, title){
  const file = new File([blob], filename, {type:'image/png'});
  if (navigator.canShare && navigator.canShare({files:[file]})){
    try { await navigator.share({files:[file], title: title || 'Meridian'}); return 'shared'; }
    catch(e){ if (e && e.name === 'AbortError') return 'cancelled'; }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href), 4000);
  return 'saved';
}

/* ===========================================================
   5. MONEY — live rates, fetched once when the page loads
   =========================================================== */
const FX = {base:'USD', rates:null, when:'', note:''};
const currencyOf = slug => (typeof CURRENCY !== 'undefined' && CURRENCY[slug]) || null;

async function loadRates(base){
  FX.base = base || 'USD';
  const sources = [
    'https://open.er-api.com/v6/latest/' + FX.base,
    'https://api.frankfurter.app/latest?from=' + FX.base
  ];
  for (const url of sources){
    try {
      const r = await fetch(url);
      if (!r.ok) continue;
      const j = await r.json();
      const rates = j.rates || (j.conversion_rates);
      if (!rates || !Object.keys(rates).length) continue;
      FX.rates = rates;
      FX.when = j.time_last_update_utc || j.date || '';
      FX.note = '';
      if (typeof paintMoney === 'function') paintMoney();
      return true;
    } catch(e){ /* try the next one */ }
  }
  FX.note = 'Live rates are unavailable right now.';
  if (typeof paintMoney === 'function') paintMoney();
  return false;
}
/* one unit of `code`, expressed in the money you live on */
function rateFor(code){
  if (!FX.rates || !code) return null;
  if (code === FX.base) return 1;
  const r = FX.rates[code];
  return r ? 1/r : null;
}
function fmtMoney(v){
  if (v == null) return '—';
  if (v >= 100) return v.toFixed(0);
  if (v >= 1)   return v.toFixed(2);
  if (v >= 0.01) return v.toFixed(3);
  return v.toPrecision(2);
}

/* ===========================================================
   6. LANGUAGE
   =========================================================== */
function phrasesFor(slug){
  if (typeof SPEAKS === 'undefined') return null;
  const key = SPEAKS[slug];
  if (!key || key === 'en') return null;
  const p = (typeof PHRASE !== 'undefined') && PHRASE[key];
  return p ? {key, name:p[0], rows:p[1]} : null;
}
