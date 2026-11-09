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
/* Twelve travel-poster palettes: [gradient from, gradient to, light ink,
   ribbon]. Bright on purpose — a shelf of these should look like a wall
   of enamel pins, not a drawer of commemorative coins. */
const BADGE_INK = [
  ['#FF5E5B','#FFB400','#FFF8E7','#B3331F'],
  ['#00A6A6','#4ECDC4','#F0FFFE','#055E60'],
  ['#5F2D8C','#C44FD6','#FBEEFF','#3C1559'],
  ['#0B6E4F','#8AC926','#F5FFE8','#09462F'],
  ['#1A4E8C','#4CC9F0','#EAF8FF','#10325C'],
  ['#D62828','#F77F00','#FFF4E6','#8C1414'],
  ['#7F2982','#E36414','#FFF0E0','#4E1551'],
  ['#006D77','#83C5BE','#EDF6F9','#02454C'],
  ['#B5179E','#F72585','#FFEAF6','#730F63'],
  ['#3A0CA3','#4361EE','#E8EBFF','#250774'],
  ['#FB8500','#FFB703','#FFFBF0','#A85600'],
  ['#2D6A4F','#52B788','#EBFFF5','#1B4332']
];

/* Six outlines. A badge is recognisable from across the room by its
   shape before you read the name. */
function badgeOutline(i){
  const S = [
    '<circle cx="50" cy="46" r="42"/>',
    '<path d="M9 11h82v41c0 22-19 34-41 41-22-7-41-19-41-41z"/>',
    '<path d="M50 4 88 25v42L50 88 12 67V25z"/>',
    '<rect x="10" y="6" width="80" height="80" rx="19"/>',
    '<path d="M32 5h36l23 23v36L68 87H32L9 64V28z"/>',
    '<path d="M11 8h78v54L50 90 11 62z"/>'
  ];
  return S[i % S.length];
}

/* Sixteen motifs, drawn in a 64-square and scaled into the shape.
   Each is [strokePaths, fillPaths]. */
function badgeMotif(i){
  const M = [
    /* peaks and sun */        [['M6 46h52','M14 44 28 20l9 13 7-9 12 20'], ['46 12 4']],
    /* sun over water */      [['M8 44h48M14 38h36'], ['32 20 9']],
    /* skyline */             [['M6 46h52'], ['12 26 8 20','24 18 9 28','38 24 8 22','50 30 7 16']],
    /* palm */                [['M32 46V24','M32 24c-8-6-16-4-20 2','M32 24c8-6 16-4 20 2','M32 24c-4-8-2-14 4-18','M32 24c4-8 10-10 16-8','M6 48h52']],
    /* pagoda */              [['M10 20h44l-8-8H18zM14 32h36l-7-8H21zM20 44h24l-5-8H25zM32 44v6M8 52h48']],
    /* bridge */              [['M4 44h56','M14 44V14M50 44V14','M14 18c12 14 24 14 36 0','M20 44V30M28 44V26M36 44V26M44 44V30']],
    /* aurora */              [['M6 34c10-14 22-14 32 0s14 12 20 4','M6 44c10-14 22-14 32 0s14 12 20 4','M10 24c8-10 18-10 26 0'], ['14 12 1.6','50 16 1.6','40 8 1.3']],
    /* cactus */              [['M30 50V18M30 32c-6 0-9-3-9-9v6c0 6 3 9 9 9M30 28c6 0 9-4 9-10v8c0 6-3 10-9 10','M8 52h48'], ['48 14 5']],
    /* lighthouse */          [['M26 48 30 18h8l4 30zM28 30h12','M24 48h20','M42 22l12-6M42 26l12 6','M6 52h52']],
    /* volcano */             [['M8 48h48','M16 48 30 20h6l14 28','M30 20c0-6 4-8 4-14M36 20c2-5 6-6 7-11']],
    /* pines */               [['M8 48h48','M18 44 18 30M32 44V24M46 44V30'], ['18 18 7 12','32 10 9 14','46 18 7 12']],
    /* canyon arch */         [['M8 50h48','M14 50V24c0-10 24-10 24 0v26','M38 50V28c0-6 12-6 12 0v22']],
    /* island */              [['M4 46c8-4 14-4 22 0s14 4 22 0','M34 40V26','M34 26c-6-5-12-3-15 2','M34 26c6-5 12-3 15 2'], ['14 16 5']],
    /* compass rose */        [['M32 8v48M8 32h48','M20 20 44 44M44 20 20 44'], ['32 32 4']],
    /* aeroplane */           [['M32 10v40','M10 34 32 26l22 8','M22 50l10-5 10 5']],
    /* anchor */              [['M32 18v30','M18 32h28','M12 38c0 12 10 18 20 18s20-6 20-18'], ['32 12 5']]
  ];
  const m = M[i % M.length];
  return {stroke:m[0] || [], fill:m[1] || []};
}

let BADGE_N = 0;
function badgeSVG(name, sub, size){
  const h = hashOf(name + '|' + (sub||''));
  const pal = BADGE_INK[h % BADGE_INK.length];
  const shape = badgeOutline(h >> 3);
  const motif = badgeMotif(h >> 7);
  const s = size || 150;
  const uid = 'b' + (++BADGE_N) + (h % 9973);

  /* Circles are written "cx cy r" and rects "x y w h" to keep the
     table above readable; they are expanded here. */
  const fills = motif.fill.map(f=>{
    const n = f.trim().split(/\s+/).map(Number);
    return n.length === 3
      ? '<circle cx="'+n[0]+'" cy="'+n[1]+'" r="'+n[2]+'"/>'
      : '<rect x="'+n[0]+'" y="'+n[1]+'" width="'+n[2]+'" height="'+n[3]+'" rx="1"/>';
  }).join('');
  const strokes = motif.stroke.map(d=>'<path d="'+d+'"/>').join('');

  const label = (name.length > 17 ? name.slice(0,16) + '…' : name).toUpperCase();
  const fs = label.length > 13 ? 8 : label.length > 9 ? 9.5 : 11;
  const MAXW = 80, est = label.length * (fs * 0.62 + 0.9);
  const fit = est > MAXW ? ' textLength="'+MAXW+'" lengthAdjust="spacingAndGlyphs"' : '';

  return '<svg class="badge-svg" viewBox="0 0 100 122" width="'+s+'" height="'+Math.round(s*1.22)+'" '
    + 'role="img" aria-label="Badge for '+esc(name)+'">'
    + '<defs>'
      + '<linearGradient id="g'+uid+'" x1="0" y1="0" x2="0.65" y2="1">'
      + '<stop offset="0" stop-color="'+pal[0]+'"/><stop offset="1" stop-color="'+pal[1]+'"/></linearGradient>'
      + '<clipPath id="c'+uid+'"><g>'+shape+'</g></clipPath>'
    + '</defs>'

    /* the shape, with a soft highlight sweep across it */
    + '<g fill="url(#g'+uid+')">'+shape+'</g>'
    + '<g clip-path="url(#c'+uid+')">'
      + '<path d="M-10 70 110 2v-20H-10z" fill="#ffffff" opacity="0.10"/>'
    + '</g>'
    /* a thin light rim, and a dotted one inside it */
    + '<g fill="none" stroke="'+pal[2]+'" stroke-width="2.2" opacity="0.9">'+shape+'</g>'
    + '<g fill="none" stroke="'+pal[2]+'" stroke-width="0.9" stroke-dasharray="1.5 3.5" opacity="0.65" '
      + 'transform="translate(50,46) scale(0.86) translate(-50,-46)">'+shape+'</g>'

    /* the motif */
    + '<g transform="translate(50,42) scale(0.92) translate(-32,-30)">'
      + '<g fill="'+pal[2]+'">'+fills+'</g>'
      + '<g fill="none" stroke="'+pal[2]+'" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">'
      + strokes+'</g></g>'

    /* the ribbon */
    + '<path d="M3 90 11 84v26L3 116z" fill="'+pal[3]+'" opacity="0.85"/>'
    + '<path d="M97 90 89 84v26l8 6z" fill="'+pal[3]+'" opacity="0.85"/>'
    + '<rect x="9" y="84" width="82" height="26" rx="4" fill="'+pal[3]+'"/>'
    + '<rect x="9" y="84" width="82" height="26" rx="4" fill="none" stroke="'+pal[2]+'" stroke-width="1" opacity="0.5"/>'
    + '<text x="50" y="101.5" text-anchor="middle" fill="'+pal[2]+'" '
    + 'font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-weight="600" '
    + 'font-size="'+fs+'" letter-spacing="0.6"'+fit+'>'+esc(label)+'</text>'
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
