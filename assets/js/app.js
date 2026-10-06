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
const saveAdded = () => { try { localStorage.setItem(ADD_KEY, JSON.stringify(ADDED)); } catch(e){} };
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

/* ---------- been / want to go / no mark ---------- */
const STORE_KEY = 'meridian-status';
let STATUS = {};
try { STATUS = JSON.parse(localStorage.getItem(STORE_KEY) || '{}'); } catch(e){ STATUS = {}; }
const saveStatus = () => { try { localStorage.setItem(STORE_KEY, JSON.stringify(STATUS)); } catch(e){} };
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
async function offerFile(filename, text){
  let dl = null;
  try { if (window.claude && claude.use) dl = await claude.use('downloads'); } catch(e){}
  if (dl){ try { await dl.save({filename, data:text}); } catch(e){} return; }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text],{type:'text/csv'}));
  a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href), 4000);
}
const mark = id => statusOf(id).toUpperCase();
function cityRows(c){
  const at = ', '+c.name+', '+c.state.name;
  const rows = [[c.name+' — city centre', c.name+', '+c.state.name, 'CITY', mark(c.id), '']];
  c.todo.forEach(t=>rows.push([t.title, t.title+at, t.tag, mark(t.id), t.desc]));
  c.eat.forEach(e=>rows.push([e.name, e.name+at, 'RESTAURANT', mark(e.id), e.note||'']));
  return rows;
}
function stateRows(st){
  const rows = [];
  st.statewide.forEach(p=>rows.push([p.title, p.title+', '+st.name, p.tag, mark(p.id), p.desc]));
  st.cities.filter(c=>statusOf(c.id)!=='none' || c.todo.length).forEach(c=>rows.push(...cityRows(c)));
  return rows;
}
function countryRows(co){
  const rows = [[co.capital+' — capital', co.capital+', '+co.name, 'CAPITAL', mark(co.id), '']];
  addedFor(co.slug).forEach(a=>rows.push([a.n, a.n+', '+co.name, a.k.toUpperCase(), mark(a.id), '']));
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
  else offerFile('meridian-all-places.csv', csvOf(worldRows()));
});

/* ---------- icons and the been / want control ---------- */
const ICON = {
  down:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="M12 3.5v12"/><path d="m7.4 11.2 4.6 4.6 4.6-4.6"/><path d="M4.5 19.5h15"/></svg>',
  compass:'<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m15 9-2 4-4 2 2-4Z"/></svg>',
  check:'<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m4.5 12.8 5 5 10-11"/></svg>',
  flag:'<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5.5 21V4.2M5.5 5.2h12l-2.4 4 2.4 4h-12"/></svg>'
};
function ctl(id, label){
  const v = statusOf(id);
  return '<span class="statusctl" data-id="'+id+'" role="group" aria-label="'+esc(label||'Status')+'">'
    + '<button type="button" class="been" data-v="been" aria-pressed="'+(v==='been')+'">'+ICON.check+'BEEN</button>'
    + '<button type="button" class="want" data-v="want" aria-pressed="'+(v==='want')+'">'+ICON.flag+'WANT</button></span>';
}
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
function worldMap(points, height, view){
  const pins = points.map(p=>{
    const cls = p.s === 'been' ? 'p-been' : p.s === 'want' ? 'p-want' : 'p-none';
    const halo = p.s === 'none' ? '' :
      '<circle class="halo'+(p.s==='want'?' w':'')+'" cx="'+p.x.toFixed(2)+'" cy="'+p.y.toFixed(2)+'" r="2.4" data-r="2.4"/>';
    return halo + '<circle class="'+cls+'" cx="'+p.x.toFixed(2)+'" cy="'+p.y.toFixed(2)+'" r="1.1" data-r="1.1"'
      + ' data-href="'+p.h+'"><title>'+esc(p.n)+'</title></circle>'
      + '<text class="t'+p.t+'" x="'+(p.x+2.4).toFixed(2)+'" y="'+(p.y+0.9).toFixed(2)+'" font-size="2.6" data-fs="2.6">'+esc(p.n)+'</text>';
  }).join('');
  const v = view || {x:0,y:0,w:360,h:180};
  return '<div class="worldmap" style="height:'+height+'px" data-map="1">'
    + '<svg viewBox="'+v.x+' '+v.y+' '+v.w+' '+v.h+'" preserveAspectRatio="xMidYMid meet" role="img" aria-label="World map of your places">'
    + '<g class="land">'+landPaths()+'</g><g class="pins">'+pins+'</g></svg>'
    + '<span class="maphint">SCROLL TO ZOOM · DRAG TO PAN</span>'
    + '<span class="mapctl"><button type="button" data-zoom="in" aria-label="Zoom in">+</button>'
    + '<button type="button" data-zoom="out" aria-label="Zoom out">−</button>'
    + '<button type="button" data-zoom="reset" aria-label="Reset the map">⤢</button></span></div>';
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
    function paint(){
      v.w = clamp(v.w, 14, 360); v.h = v.w/2;
      v.x = clamp(v.x, -12, 372 - v.w); v.y = clamp(v.y, -12, 192 - v.h);
      svg.setAttribute('viewBox', v.x.toFixed(3)+' '+v.y.toFixed(3)+' '+v.w.toFixed(3)+' '+v.h.toFixed(3));
      const k = v.w/360;
      el.querySelectorAll('.pins circle').forEach(c=>c.setAttribute('r', (parseFloat(c.dataset.r)*k).toFixed(3)));
      el.querySelectorAll('.pins text').forEach(t=>{
        t.setAttribute('font-size', (parseFloat(t.dataset.fs)*k).toFixed(3));
        t.setAttribute('x', (parseFloat(t.getAttribute('x'))));
      });
      el.classList.toggle('zoom1', v.w < 200);
      el.classList.toggle('zoom2', v.w < 70);
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
    svg.addEventListener('click', e=>{
      const c = e.target.closest('circle[data-href]');
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
function placeCard(o){
  const s = o.status;
  return '<div class="card'+(s==='none'?' empty':'')+(s==='want'?' wish':'')+'" style="min-height:'+(o.min||168)+'px">'
    + '<a class="go" href="'+o.href+'" style="display:flex;flex-direction:column;gap:7px">'
    + '<span class="card-t"'+(o.small?' style="font-size:26px"':'')+'>'+esc(o.name)+'</span>'
    + '<span class="lab-s"'+(s==='none'?' style="color:var(--ghost)"':'')+'>'+o.sub+'</span></a>'
    + '<span class="card-foot">'+pinFor(s)+ctl(o.id, o.name)+'</span></div>';
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

  const feat = FEATURED.map(k=>{
    const c = CITY_BY_KEY[k]; if (!c) return '';
    const night = isNightAt(c.lat,c.lon);
    return '<div class="card'+(night?' night':'')+'" style="min-height:200px"><a class="go" href="'+cityHref(c)+'" style="display:flex;flex-direction:column;gap:8px">'
      + '<span class="lab-s">'+esc(c.state.name).toUpperCase()+'</span>'
      + '<span class="card-t" style="font-size:34px">'+esc(c.name)+'</span>'
      + '<span class="lab-s"><span data-tz="'+c.tz+'">'+fmtTime(now,c.tz)+'</span> · '+c.todo.length+' THINGS TO DO</span></a>'
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
    + worldMap(mapPoints('all'), 460)+'</div></div>'

    + '<div class="sec">'+secHead('Most recently added', C.cities+' CITIES LOGGED')
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
      '<div class="sec">'+secHead(k === 'Park or region' ? 'Parks and regions' : k+'s', pad2(list.length))
      + list.map(i=>'<div class="added"><span class="added-n">'+pinFor(kind)
        + '<a href="'+i.href+'" style="color:var(--ink)">'+esc(i.name)+'</a>'
        + (i.sub ? '<span class="lab-s">'+esc(i.sub).toUpperCase()+'</span>' : '')+'</span>'
        + (i.tz ? '<span class="mono" style="font-size:13px" data-tz="'+i.tz+'">'+fmtTime(new Date(),i.tz)+'</span>' : '')
        + ctl(i.id, i.name)+'</div>').join('')+'</div>').join('')
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
    return '<div class="card'+(s==='none'?' empty':'')+(s==='want'?' wish':'')+(night?' night':'')+'" style="min-height:160px">'
      + '<a class="go" href="'+countryHref(co)+'" style="display:flex;flex-direction:column;gap:7px">'
      + '<span class="card-t" style="font-size:26px">'+esc(co.name)+'</span>'
      + '<span class="lab-s"'+(s==='none'?' style="color:var(--ghost)"':'')+'>'
      + '<span data-tz="'+co.tz+'">'+fmtTime(new Date(),co.tz)+'</span> · '+esc(co.capital).toUpperCase()+'</span></a>'
      + '<span class="card-foot"><span style="display:flex;align-items:center;gap:10px">'+pinFor(s)
      + '<span class="chip warm" data-wx="co-'+co.slug+'" data-night="'+(night?1:0)+'">'+glyph(night?'night':'clear',14)+'<span>—</span></span></span>'
      + ctl(co.id, co.name)+'</span></div>';
  }).join('');
  return crumbs([['World','#/continents'],[ct.name,'']])
  + '<div class="wrap"><div style="padding-top:36px;display:flex;flex-wrap:wrap;gap:32px;align-items:flex-end;justify-content:space-between">'
  + '<div style="flex:999 1 460px;min-width:0"><h1 class="title-xl">'+esc(ct.name)+'</h1>'
  + '<p class="lede" style="padding-top:18px">'+esc(ct.blurb)+'</p></div>'
  + '<div style="flex:0 0 auto">'+ctl(ct.id, ct.name)+'</div></div>'
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
  const hero = '<div class="wrap"><div style="padding-top:36px"><div class="hero"><div class="hero-main">'
    + '<h1 class="title-xl">'+esc(co.name)+'</h1>'
    + '<span class="lab">'+esc(co.continent.name).toUpperCase()+' · CAPITAL '+esc(co.capital).toUpperCase()+' · '+coord(co.lat,co.lon)+'</span>'
    + ro.html
    + '<div style="display:flex;flex-wrap:wrap;align-items:center;gap:12px">'+ctl(co.id, co.name)
    + '<span class="chip warm">'+glyph(ro.night?'night':'clear',14)+(ro.night?'IT IS NIGHT IN ':'IT IS DAYTIME IN ')+esc(co.capital).toUpperCase()+'</span></div>'
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

  const sug = SUGGEST[co.slug] || [[],[]];
  const mine = addedFor(co.slug);
  const have = new Set(mine.map(a=>a.id));
  const sugList = (list, kind) => list.map(r=>{
    const [n, lat, lon, tz] = r, id = addedId(co.slug, kind, n), inList = have.has(id);
    return '<span class="sug'+(inList?' in':'')+'"><span>'+esc(n)+'</span>'
      + (inList ? '<button type="button" data-rm="'+id+'" aria-label="Remove '+esc(n)+'">×</button>'
                : '<button type="button" data-add="'+esc(n)+'" data-co="'+co.slug+'" data-kind="'+kind+'" data-lat="'+lat+'" data-lon="'+lon+'"'
                  + (tz?' data-tz="'+tz+'"':'')+' aria-label="Add '+esc(n)+'">+</button>')+'</span>';
  }).join('');

  const mineHTML = mine.length ? mine.map(a=>{
    const night = isNightAt(a.lat, a.lon);
    return '<div class="added"><span class="added-n">'+pinFor(statusOf(a.id))+esc(a.n)
      + '<span class="lab-s">'+(a.k==='city'?'CITY':'REGION')+'</span></span>'
      + '<span class="mono" style="font-size:13px;display:flex;align-items:center;gap:8px">'
      + (night?'<span class="nightdot"></span>':'')+'<span data-tz="'+a.tz+'">'+fmtTime(new Date(),a.tz)+'</span></span>'
      + ctl(a.id, a.n)+'<button class="rm" data-rm="'+a.id+'">REMOVE</button></div>';
  }).join('') : blank('Nothing added yet','Pick from the suggestions below and they land here, with their own clock, a been/want mark and a pin on the world map.');

  return head + hero + '<div class="wrap">'
    + '<div class="sec">'+secHead('Your places in '+esc(co.name), pad2(mine.length))+mineHTML+'</div>'
    + (sug[0].length ? '<div class="sec">'+secHead('Regions', 'CLICK TO ADD · '+sug[0].length+' SUGGESTED')
        + '<div class="sugs">'+sugList(sug[0],'region')+'</div></div>' : '')
    + (sug[1].length ? '<div class="sec">'+secHead('Major cities', 'CLICK TO ADD · '+sug[1].length+' SUGGESTED')
        + '<div class="sugs">'+sugList(sug[1],'city')+'</div></div>' : '')
    + '<div class="sec">'+secHead('Things to do','00 LOGGED')
    + blank('Nothing logged for '+esc(co.name)+' yet','Add entries to the TODO list in data.js, keyed to a place you have added above.')
    + '</div></div>';
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
  const places = c.todo.length
    ? '<div class="places"><div class="places-l">'
      + c.todo.map(t=>'<a href="https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(t.title+', '+c.name+', '+c.state.name)+'" target="_blank" rel="noopener">'+pinFor(statusOf(t.id))+esc(t.title)+'</a>').join('')
      + '</div><div class="places-r"><span class="note">Each name opens in Google Maps. The CSV carries all of them, and your marks, in one import.</span></div></div>'
    : '';
  return crumbs([['World','#/continents'],[HOME_CONT.name, contHref(HOME_CONT)],[USA.name, countryHref(USA)],[c.state.name, stateHref(c.state)],[c.name,'']])
  + '<div class="wrap"><div style="padding-top:36px"><div class="hero"><div class="hero-main">'
  + '<h1 class="title-xl">'+esc(c.name)+'</h1>'
  + '<span class="lab">'+esc(c.state.name).toUpperCase()+', UNITED STATES · '+coord(c.lat,c.lon)+'</span>'
  + ro.html
  + '<div style="display:flex;flex-wrap:wrap;align-items:center;gap:12px">'+ctl(c.id, c.name)
  + '<span class="chip warm">'+glyph(ro.night?'night':'clear',14)+(ro.night?'IT IS NIGHT IN ':'IT IS DAYTIME IN ')+esc(c.name).toUpperCase()+'</span></div>'
  + '<p class="note">The page follows this city\u2019s clock, not yours — override it with the control up top.</p></div>'
  + '<div class="hero-side"><div class="board"><div class="board-h"><span class="lab">SAVED PLACES</span>'
  + '<span class="lab-s">'+pad2(c.todo.length+c.eat.length)+'</span></div>'
  + '<div style="padding:18px"><p class="note" style="margin-bottom:14px">One CSV with every pin on this page, ready for Google My Maps.</p>'
  + '<button class="btn" data-dl="city:'+c.key+'">'+ICON.down+c.slug+'-places.csv</button></div></div></div></div></div>'
  + '<div class="sec">'+secHead('Things to do', pad2(c.todo.length)+' LISTED')
  + (c.todo.length ? rowsHTML(c.todo) : blank('Nothing logged here yet','Add entries for this city to TODO in data.js.'))+'</div>'
  + '<div class="sec">'+secHead('Where I ate', pad2(c.eat.length)+' LOGGED')
  + (c.eat.length
    ? '<div class="grid g-wide" style="padding-top:28px">'+c.eat.map(e=>'<div class="card" style="justify-content:flex-start;gap:12px;min-height:0">'
      + '<span class="lab-s">'+esc(e.cuisine||'')+'</span><span class="card-t">'+esc(e.name)+'</span>'
      + '<p class="row-d">'+esc(e.note||'')+'</p><span class="card-foot">'+ctl(e.id, e.name)+'</span></div>').join('')+'</div>'
    : blank('No restaurants logged yet','Add them to EAT in data.js — name, cuisine and one line on whether it was worth it.'))+'</div>'
  + (places ? '<div class="sec">'+secHead('On the map','OPENS IN GOOGLE MAPS')+'<div class="panel" style="margin-top:28px">'+places+'</div></div>' : '')
  + '<div class="pagenav">'
  + '<a href="'+cityHref(prev)+'"><span class="lab-s">← PREVIOUS</span><span class="nt">'+esc(prev.name)+'</span></a>'
  + '<a class="lab" href="'+stateHref(c.state)+'" style="padding:8px 0">ALL OF '+esc(c.state.name).toUpperCase()+'</a>'
  + '<a class="nx" href="'+cityHref(next)+'"><span class="lab-s">NEXT →</span><span class="nt">'+esc(next.name)+'</span></a>'
  + '</div></div>';
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
  else {
    const ct = CONT_BY_SLUG[first];
    if (!ct) html = viewMissing();
    else if (parts.length === 1){ html = viewContinent(ct); title = ct.name+' — Meridian';
      points = ct.countries.map(c=>({key:'co-'+c.slug, lat:c.lat, lon:c.lon})).slice(0,40); }
    else {
      const co = ct.countries.find(c=>c.slug === parts[1]);
      if (!co) html = viewMissing();
      else if (parts.length === 2 || !co.detailed){
        html = viewCountry(co); title = co.name+' — Meridian'; foot = co.tz.toUpperCase().replace(/_/g,' ');
        points = [{key:'co-'+co.slug, lat:co.lat, lon:co.lon}];
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
  applyTheme(); tick(); wireMaps();
  loadWeather(points);
  lastRoute = raw;
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
