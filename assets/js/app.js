/* ===========================================================
   MERIDIAN — engine, views and router.
   Data lives in assets/js/data.js. You should not need to edit
   this file to add a place.
   =========================================================== */
const slug = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
const esc = s => String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const pad2 = n => String(n).padStart(2,'0');

/* ---------- the atlas ---------- */
const ATLAS = STATES.map(([name,abbr,tz,cities])=>{
  const st = {name, abbr, tz, slug:abbr.toLowerCase(),
    statewide:(STATEWIDE[abbr]||[]).map(([t,lat,lon,d,tag,been])=>
      ({title:t, lat, lon, desc:d, tag, id:'place:'+abbr+':'+slug(t), seed:been?'been':'none'}))};
  st.id = 'state:'+abbr;
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

const CONTINENTS = WORLD.map(([name,blurb,countries])=>{
  const cont = {name, blurb, slug:slug(name), id:'cont:'+slug(name)};
  cont.countries = countries.map(cn=>({
    name:cn, slug:slug(cn), id:'country:'+slug(cn), continent:cont,
    detailed: cn === DETAILED_COUNTRY,
    seed: cn === DETAILED_COUNTRY ? 'been' : 'none'
  }));
  cont.seed = cont.countries.some(c=>c.seed==='been') ? 'been' : 'none';
  return cont;
});
const CONT_BY_SLUG = Object.fromEntries(CONTINENTS.map(c=>[c.slug,c]));
const ALL_COUNTRIES = CONTINENTS.flatMap(c=>c.countries);
const USA = ALL_COUNTRIES.find(c=>c.detailed);
const HOME_CONT = USA.continent;

/* ---------- been / want / nothing ---------- */
const STORE_KEY = 'meridian-status';
let STATUS = {};
try { STATUS = JSON.parse(localStorage.getItem(STORE_KEY) || '{}'); } catch(e) { STATUS = {}; }
const SEED = {};
ALL_CITIES.forEach(c=>{ if (c.seed !== 'none') SEED[c.id] = c.seed; });
ATLAS.forEach(s=>s.statewide.forEach(p=>{ if (p.seed !== 'none') SEED[p.id] = p.seed; }));
ALL_COUNTRIES.forEach(c=>{ if (c.seed !== 'none') SEED[c.id] = c.seed; });
CONTINENTS.forEach(c=>{ if (c.seed !== 'none') SEED[c.id] = c.seed; });

const statusOf = id => (id in STATUS) ? STATUS[id] : (SEED[id] || 'none');
const been = id => statusOf(id) === 'been';
const want = id => statusOf(id) === 'want';
function setStatus(id, v){
  if (v === 'none') STATUS[id] = 'none'; else STATUS[id] = v;
  try { localStorage.setItem(STORE_KEY, JSON.stringify(STATUS)); } catch(e){}
}
function stateStatus(st){
  if (st.id in STATUS && STATUS[st.id] !== 'none') return STATUS[st.id];
  if (st.cities.some(c=>been(c.id)) || st.statewide.some(p=>been(p.id))) return 'been';
  if (st.cities.some(c=>want(c.id)) || st.statewide.some(p=>want(p.id))) return 'want';
  return statusOf(st.id);
}
function countryStatus(co){
  if (co.id in STATUS && STATUS[co.id] !== 'none') return STATUS[co.id];
  if (co.detailed){
    if (ATLAS.some(s=>stateStatus(s)==='been')) return 'been';
    if (ATLAS.some(s=>stateStatus(s)==='want')) return 'want';
  }
  return statusOf(co.id);
}
function continentStatus(ct){
  if (ct.id in STATUS && STATUS[ct.id] !== 'none') return STATUS[ct.id];
  const s = ct.countries.map(countryStatus);
  if (s.includes('been')) return 'been';
  if (s.includes('want')) return 'want';
  return statusOf(ct.id);
}
const counts = () => ({
  continents: CONTINENTS.filter(c=>continentStatus(c)==='been').length,
  countries: ALL_COUNTRIES.filter(c=>countryStatus(c)==='been').length,
  states: ATLAS.filter(s=>stateStatus(s)==='been').length,
  cities: ALL_CITIES.filter(c=>been(c.id)).length,
  places: ATLAS.reduce((n,s)=>n+s.statewide.filter(p=>been(p.id)).length,0),
  wish: ALL_CITIES.filter(c=>want(c.id)).length
        + ALL_COUNTRIES.filter(c=>want(c.id)).length
        + ATLAS.reduce((n,s)=>n+s.statewide.filter(p=>want(p.id)).length,0)
});

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
  const H = Math.acos(cosH)/RAD;
  const toDate = j => new Date((j - 2440587.5)*86400000);
  return {rise: toDate(Jt - H/360), set: toDate(Jt + H/360)};
}
function isNightAt(lat, lon, when){
  const t = sunTimes(lat, lon, when || new Date());
  if (t.polar) return t.polar === 'night';
  const now = (when||new Date()).getTime();
  return now < t.rise.getTime() || now > t.set.getTime();
}
const fmtTime = (d, tz) => new Intl.DateTimeFormat('en-US',{hour:'numeric',minute:'2-digit',timeZone:tz}).format(d);
const fmtZone = (d, tz) => { try { return new Intl.DateTimeFormat('en-US',{timeZoneName:'short',timeZone:tz})
  .formatToParts(d).find(p=>p.type==='timeZoneName').value; } catch(e){ return ''; } };
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

/* ---------- weather (open-meteo, no key, no account) ---------- */
const WX = {};
async function loadWeather(points){
  const need = points.filter(p=>!(p.key in WX));
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
  }catch(e){ /* offline, or blocked by the host's content policy — clocks still run */ }
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

/* ---------- CSV export: imports straight into Google My Maps ---------- */
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
document.addEventListener('click', e=>{
  const b = e.target.closest('[data-dl]');
  if (!b) return;
  const bits = b.dataset.dl.split(':');
  if (bits[0] === 'city'){ const c = CITY_BY_KEY[bits[1]]; offerFile(c.slug+'-places.csv', csvOf(cityRows(c))); }
  else if (bits[0] === 'state'){ const s = BY_ABBR[bits[1]]; offerFile(s.slug+'-places.csv', csvOf(stateRows(s))); }
  else offerFile('meridian-all-places.csv', csvOf(ATLAS.flatMap(stateRows)));
});

/* ---------- the been / want control ---------- */
const ICON = {
  down:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="M12 3.5v12"/><path d="m7.4 11.2 4.6 4.6 4.6-4.6"/><path d="M4.5 19.5h15"/></svg>',
  compass:'<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m15 9-2 4-4 2 2-4Z"/></svg>',
  check:'<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m4.5 12.8 5 5 10-11"/></svg>',
  flag:'<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5.5 21V4.2M5.5 5.2h12l-2.4 4 2.4 4h-12"/></svg>'
};
function ctl(id, label){
  const v = statusOf(id);
  return '<span class="statusctl" data-id="'+id+'" role="group" aria-label="'+esc(label||'Your status for this place')+'">'
    + '<button type="button" class="been" data-v="been" aria-pressed="'+(v==='been')+'">'+ICON.check+'BEEN</button>'
    + '<button type="button" class="want" data-v="want" aria-pressed="'+(v==='want')+'">'+ICON.flag+'WANT</button></span>';
}
document.addEventListener('click', e=>{
  const btn = e.target.closest('.statusctl button');
  if (!btn) return;
  e.preventDefault(); e.stopPropagation();
  const id = btn.closest('.statusctl').dataset.id;
  setStatus(id, statusOf(id) === btn.dataset.v ? 'none' : btn.dataset.v);
  const y = window.scrollY; route(); window.scrollTo(0, y);
});

/* ===========================================================
   VIEWS
   =========================================================== */
const crumbs = items => '<div class="wrap crumbs">' + items.map((it,i)=>
  i === items.length-1 ? '<span class="here">'+esc(it[0]).toUpperCase()+'</span>'
    : '<a href="'+it[1]+'">'+esc(it[0]).toUpperCase()+'</a>').join(' / ') + '</div>';
const secHead = (title, right) => '<div class="sec-head"><h2 class="h2">'+title+'</h2><span class="lab">'+(right||'')+'</span></div>';
const blank = (title, body) => '<div class="blank"><span style="color:var(--ghost)">'+ICON.compass+'</span><div class="blank-b"><span class="card-t">'+title+'</span><p class="row-d">'+body+'</p></div></div>';
const tag = t => '<span class="chip">'+esc(t)+'</span>';
const stat = (n,l)=>'<div style="display:flex;flex-direction:column;gap:8px"><span class="stat-n">'+n+'</span><span class="lab">'+l+'</span></div>';
const pinFor = s => '<span class="pin'+(s==='been'?'':s==='want'?' want':' off')+'"></span>';

const contHref = ct => '#/'+ct.slug;
const countryHref = co => '#/'+co.continent.slug+'/'+co.slug;
const stateHref = s => countryHref(USA)+'/'+s.slug;
const cityHref = c => stateHref(c.state)+'/'+c.slug;

function rowsHTML(list){
  return list.map((t,i)=>{
    const s = statusOf(t.id);
    return '<div class="row"><span class="row-n">'+pad2(i+1)+'</span>'
    + '<div class="row-b"><span class="row-t">'+esc(t.title)+'</span>'
    + '<p class="row-d">'+esc(t.desc)+'</p>'
    + '<p class="row-note">[ your note ]</p></div>'
    + '<span class="row-tags">'+(t.tag?tag(t.tag):'')+ctl(t.id, t.title)+'</span></div>';
  }).join('');
}
function placeCard(obj){
  const s = obj.status, href = obj.href;
  return '<div class="card'+(s==='none'?' empty':'')+(s==='want'?' wish':'')+'" style="min-height:'+(obj.min||168)+'px">'
    + '<a class="go" href="'+href+'" style="display:flex;flex-direction:column;gap:7px">'
    + '<span class="card-t"'+(obj.small?' style="font-size:26px"':'')+'>'+esc(obj.name)+'</span>'
    + '<span class="lab-s"'+(s==='none'?' style="color:var(--ghost)"':'')+'>'+obj.sub+'</span></a>'
    + '<span class="card-foot">'+pinFor(s)+ctl(obj.id, obj.name)+'</span></div>';
}
function cityCard(c){
  const s = statusOf(c.id), night = isNightAt(c.lat,c.lon);
  const sub = '<span data-tz="'+c.tz+'">'+fmtTime(new Date(),c.tz)+'</span> · '+coord(c.lat,c.lon);
  return '<div class="card'+(s==='none'?' empty':'')+(s==='want'?' wish':'')+'" style="min-height:184px">'
    + '<a class="go" href="'+cityHref(c)+'" style="display:flex;flex-direction:column;gap:7px">'
    + '<span class="card-t">'+esc(c.name)+'</span>'
    + '<span class="lab-s"'+(s==='none'?' style="color:var(--ghost)"':'')+'>'+sub+'</span></a>'
    + '<span class="card-foot">'
    + '<span style="display:flex;align-items:center;gap:10px">'+pinFor(s)
    + '<span class="chip warm" data-wx="'+c.key+'" data-night="'+(night?1:0)+'">'+glyph(night?'night':'clear',14)+'<span>—</span></span></span>'
    + ctl(c.id, c.name)+'</span></div>';
}
function plot(points){
  const X = l => ((l+125)/58.5)*100, Y = l => ((49.4-l)/25)*100;
  const dots = points.filter(p=>p.lon>-126 && p.lon<-66 && p.lat>23.5 && p.lat<49.6).map(p=>
    '<span class="dot'+(p.s==='been'?'':' off')+'" style="left:'+X(p.lon).toFixed(2)+'%;top:'+Y(p.lat).toFixed(2)+'%" title="'+esc(p.label)+'">'
    + pinFor(p.s)+(p.show?'<b>'+esc(p.label).toUpperCase()+'</b>':'')+'</span>').join('');
  return '<div class="plot"><div class="plot-in">'+dots+'</div></div>';
}

/* ---------- home ---------- */
function viewHome(){
  routeIsNight = isNightAt(38,-97);
  const C = counts();
  const board = BOARD.map(k=>{
    const c = CITY_BY_KEY[k]; if (!c) return '';
    const night = isNightAt(c.lat,c.lon);
    return '<a class="board-r" href="'+cityHref(c)+'">'
      + '<span class="board-city"><span style="font-size:15px;font-weight:500">'+esc(c.name)+'</span>'
      + '<span class="lab-s">'+esc(c.state.name).toUpperCase()+' · '+fmtZone(new Date(),c.tz)+'</span></span>'
      + '<span class="board-right"><span class="sky" data-wx="'+c.key+'" data-night="'+(night?1:0)+'" style="font-family:var(--mono);font-size:13px">'
      + glyph(night?'night':'clear',17)+'<span>—</span></span>'
      + '<span class="board-t" data-tz="'+c.tz+'">'+fmtTime(new Date(),c.tz)+'</span></span></a>';
  }).join('');

  const pts = [];
  ATLAS.forEach(s=>{
    s.statewide.forEach(p=>pts.push({lat:p.lat,lon:p.lon,label:p.title,s:statusOf(p.id),show:false}));
    s.cities.forEach(c=>pts.push({lat:c.lat,lon:c.lon,label:c.name,s:statusOf(c.id),show:LABELLED.has(c.key)}));
  });

  const feat = FEATURED.map(k=>{
    const c = CITY_BY_KEY[k]; if (!c) return '';
    const night = isNightAt(c.lat,c.lon);
    return '<div class="card" style="min-height:200px"><a class="go" href="'+cityHref(c)+'" style="display:flex;flex-direction:column;gap:8px">'
      + '<span class="lab-s">'+esc(c.state.name).toUpperCase()+'</span>'
      + '<span class="card-t" style="font-size:34px">'+esc(c.name)+'</span>'
      + '<span class="lab-s"><span data-tz="'+c.tz+'">'+fmtTime(new Date(),c.tz)+'</span> · '+c.todo.length+' THINGS TO DO</span></a>'
      + '<span class="card-foot"><span class="chip warm" data-wx="'+c.key+'" data-night="'+(night?1:0)+'">'+glyph(night?'night':'clear',14)+'<span>—</span></span>'
      + ctl(c.id, c.name)+'</span></div>';
  }).join('');

  const conts = CONTINENTS.map(ct=>{
    const s = continentStatus(ct);
    const n = ct.countries.filter(c=>countryStatus(c)==='been').length;
    return placeCard({name:ct.name, id:ct.id, href:contHref(ct), status:s,
      sub: n ? n+' OF '+ct.countries.length+' COUNTRIES' : ct.countries.length+' COUNTRIES · NOT YET'});
  }).join('');

  return '<div class="wrap" style="padding-top:64px"><div class="hero">'
    + '<div class="hero-main">'
    + '<span class="lab" style="color:var(--warm)">A PERSONAL TRAVEL ATLAS</span>'
    + '<h1 class="title-xl">Somewhere on this map, the sun is still up.</h1>'
    + '<p class="lede">Every place I have travelled, kept as a living atlas — what there is to do, where I ate, and what the clock and the sky are doing there at this exact moment.</p>'
    + '<div style="display:flex;flex-wrap:wrap;gap:12px;padding-top:4px">'
    + '<a class="btn" href="'+countryHref(USA)+'">Enter the atlas</a>'
    + '<a class="btn ghost" href="#map">See the map</a></div></div>'
    + '<div class="hero-side"><div class="board"><div class="board-h"><span class="lab">RIGHT NOW</span>'
    + '<span class="live"><i></i>LIVE</span></div>'+board+'</div>'
    + '<p class="note" style="margin-top:12px">Clocks tick on their own. Conditions refresh when the page opens.</p></div></div>'

    + '<div class="sec"><div class="stats">'
    + stat(C.continents,'CONTINENTS')+stat(C.countries,'COUNTRIES')+stat(C.states,'STATES &amp; DISTRICTS')
    + stat(C.cities,'CITIES')+stat(C.places,'PARKS &amp; REGIONS')+stat(C.wish,'ON THE LIST')+'</div></div>'

    + '<div class="sec" id="map"><div class="panel">'
    + '<div class="panel-head"><span style="display:flex;flex-wrap:wrap;align-items:center;gap:16px">'
    + '<span class="lab">EVERY PIN, ONE PLACE</span>'
    + '<span class="chip warm"><span class="pin" style="width:8px;height:8px;box-shadow:none"></span>BEEN</span>'
    + '<span class="chip on"><span class="pin want" style="width:8px;height:8px;box-shadow:none"></span>WANT TO GO</span>'
    + '<span class="chip"><span class="pin off" style="width:8px;height:8px"></span>NO MARK</span></span>'
    + '<button class="btn" data-dl="all">'+ICON.down+'Download every place</button></div>'
    + plot(pts)+'</div>'
    + '<p class="note" style="margin-top:14px">The file is a CSV. In Google My Maps choose <em>Create a new map → Import</em>, then pick the Location column for placement and the Status or Category column for the pin colours.</p></div>'

    + '<div class="sec">'+secHead('Most recently added', C.cities+' CITIES LOGGED')
    + '<div class="grid g-wide" style="padding-top:28px">'+feat+'</div></div>'

    + '<div class="sec">'+secHead('Start at the top','CONTINENT → COUNTRY → STATE → CITY')
    + '<div class="grid g-cities" style="padding-top:28px">'+conts+'</div></div>'

    + '<div class="sec"><p class="note">Mark anything on this site as <strong>been</strong> or <strong>want</strong> — cities, states, countries, continents, and every single thing to do. Your marks are kept in this browser and feed the counts above, the map pins and the CSV export.</p></div></div>';
}

/* ---------- continent ---------- */
function viewContinent(ct){
  routeIsNight = isNightAt(38,-97);
  const n = ct.countries.filter(c=>countryStatus(c)==='been').length;
  const cards = ct.countries.map(co=>placeCard({
    name:co.name, id:co.id, href:countryHref(co), status:countryStatus(co), small:true, min:140,
    sub: co.detailed ? counts().states+' STATES LOGGED' : (countryStatus(co)==='want' ? 'ON THE LIST' : 'NOTHING LOGGED')
  })).join('');
  return crumbs([['World','#/'],[ct.name,'']])
  + '<div class="wrap"><div style="padding-top:40px;display:flex;flex-wrap:wrap;gap:32px;align-items:flex-end;justify-content:space-between">'
  + '<div style="flex:999 1 460px;min-width:0"><h1 class="title-xl">'+esc(ct.name)+'</h1>'
  + '<p class="lede" style="padding-top:18px">'+esc(ct.blurb)+'</p></div>'
  + '<div style="flex:0 0 auto">'+ctl(ct.id, ct.name)+'</div></div>'
  + '<div class="sec">'+secHead('Countries', n+' OF '+ct.countries.length+' LOGGED')
  + '<div class="grid g-cities" style="padding-top:28px">'+cards+'</div></div>'
  + '<div class="sec">'+secHead('Across the continent','00 LOGGED')
  + blank('Nothing logged at this level yet','Things that belong to the continent rather than any one country — long rail routes, border crossings, road trips — live here.')
  + '</div></div>';
}

/* ---------- country ---------- */
function viewCountry(co){
  routeIsNight = isNightAt(38,-97);
  const head = crumbs([['World','#/'],[co.continent.name, contHref(co.continent)],[co.name,'']]);
  if (!co.detailed){
    return head + '<div class="wrap"><div style="padding-top:40px;display:flex;flex-wrap:wrap;gap:32px;align-items:flex-end;justify-content:space-between">'
      + '<h1 class="title-xl" style="flex:999 1 420px;min-width:0">'+esc(co.name)+'</h1>'
      + '<div style="flex:0 0 auto">'+ctl(co.id, co.name)+'</div></div>'
      + '<div class="sec">'+secHead('Things to do','00 LOGGED')
      + blank('This page is ready and empty', 'Mark '+esc(co.name)+' as been or want above. To give it states, regions and cities, add it to the STATES list in <code>assets/js/data.js</code> and point DETAILED_COUNTRY at it.')
      + '</div>'
      + '<div class="sec">'+secHead('Cities','00 LOGGED')
      + blank('No cities yet','City pages appear here as soon as the country has entries in the data file.')
      + '</div></div>';
  }
  const C = counts();
  const cards = ATLAS.map(s=>{
    const st = stateStatus(s);
    const nb = s.cities.filter(c=>been(c.id)).length + s.statewide.filter(p=>been(p.id)).length;
    return placeCard({name:s.name, id:s.id, href:stateHref(s), status:st, small:true, min:140,
      sub: nb ? s.abbr+' · '+nb+' LOGGED' : s.abbr+(st==='want'?' · ON THE LIST':' · NOT YET')});
  }).join('');
  return head
  + '<div class="wrap"><div style="padding-top:40px;display:flex;flex-wrap:wrap;gap:32px;align-items:flex-end;justify-content:space-between">'
  + '<div style="flex:999 1 460px;min-width:0"><h1 class="title-xl">'+esc(co.name)+'</h1>'
  + '<p class="lede" style="padding-top:18px">Fifty states and one district, each with a page already waiting. '+C.states+' of them have something on it.</p></div>'
  + '<div style="flex:0 0 auto">'+ctl(co.id, co.name)+'</div></div>'
  + '<div class="stats" style="margin-top:34px">'+stat(C.states,'STATES &amp; DISTRICTS')+stat(C.cities,'CITIES')
  + stat(C.places,'PARKS &amp; REGIONS')+stat(51-C.states,'STILL EMPTY')+'</div>'
  + '<div class="sec">'+secHead('Nationwide','00 LOGGED')
  + blank('Nothing logged at this level yet','Things that are not tied to one state — a coast-to-coast drive, a chain of national parks, the Appalachian Trail.')
  + '</div>'
  + '<div class="sec">'+secHead('Every state','USE THE SEARCH BOX TO JUMP')
  + '<div class="grid g-cities" style="padding-top:28px">'+cards+'</div></div></div>';
}

/* ---------- state ---------- */
function viewState(st){
  const anchor = st.cities.find(c=>been(c.id)) || st.cities[0];
  routeIsNight = isNightAt(anchor.lat, anchor.lon);
  const nb = st.cities.filter(c=>been(c.id)).length;
  const wide = st.statewide.length ? rowsHTML(st.statewide)
    : blank('Nothing statewide yet','Parks, lakes, falls and regions that belong to no single city are listed here. Add them to STATEWIDE in the data file.');
  const rank = c => statusOf(c.id)==='been' ? 0 : statusOf(c.id)==='want' ? 1 : 2;
  const sorted = st.cities.slice().sort((a,b)=>rank(a)-rank(b));
  return crumbs([['World','#/'],[HOME_CONT.name, contHref(HOME_CONT)],[USA.name, countryHref(USA)],[st.name,'']])
  + '<div class="wrap"><div style="padding-top:40px;display:flex;flex-wrap:wrap;gap:40px;align-items:flex-end;justify-content:space-between">'
  + '<div style="flex:999 1 420px;min-width:0;display:flex;flex-direction:column;gap:18px">'
  + '<h1 class="title-xl">'+esc(st.name)+'</h1>'+ctl(st.id, st.name)+'</div>'
  + '<div class="readout" style="flex:0 0 auto">'
  + '<span class="ro"><span class="ro-v">'+nb+'</span><span class="lab">CITIES LOGGED</span></span>'
  + '<span class="ro"><span class="ro-v">'+st.statewide.filter(p=>been(p.id)).length+'</span><span class="lab">ACROSS THE STATE</span></span>'
  + '<span class="ro"><span class="ro-v">'+(st.cities.length-nb)+'</span><span class="lab">PAGES WAITING</span></span>'
  + '</div></div>'
  + '<div class="sec">'+secHead('Across the state','PARKS, FALLS, LAKES AND REGIONS')+wide+'</div>'
  + '<div class="sec">'+secHead('Cities', nb+' OF '+st.cities.length+' LOGGED')
  + '<div class="grid g-cities" style="padding-top:28px">'+sorted.map(cityCard).join('')+'</div></div>'
  + '<div class="sec"><div class="panel"><div class="panel-head" style="border:0">'
  + '<span style="display:flex;flex-direction:column;gap:6px"><span class="card-t" style="font-size:26px">Every '+esc(st.name)+' pin, one file</span>'
  + '<span class="note">Bundles the statewide places and every city below them, with your been and want marks.</span></span>'
  + '<button class="btn" data-dl="state:'+st.slug+'">'+ICON.down+st.slug+'-places.csv</button></div></div></div>'
  + '</div>';
}

/* ---------- city ---------- */
function viewCity(c){
  const now = new Date();
  const sun = sunTimes(c.lat, c.lon, now);
  const night = isNightAt(c.lat, c.lon, now);
  routeIsNight = night;
  const sunLine = sun.polar ? (sun.polar === 'day' ? 'MIDNIGHT SUN' : 'POLAR NIGHT')
    : '↑ '+fmtTime(sun.rise,c.tz)+'<br>↓ '+fmtTime(sun.set,c.tz);
  const idx = c.state.cities.indexOf(c);
  const prev = c.state.cities[(idx-1+c.state.cities.length)%c.state.cities.length];
  const next = c.state.cities[(idx+1)%c.state.cities.length];
  const places = c.todo.length
    ? '<div class="places"><div class="places-l">'
      + c.todo.map(t=>'<a href="https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(t.title+', '+c.name+', '+c.state.name)+'" target="_blank" rel="noopener">'+pinFor(statusOf(t.id))+esc(t.title)+'</a>').join('')
      + '</div><div class="places-r"><span class="note">Each name opens in Google Maps. The CSV carries all of them, and your marks, in one import.</span></div></div>'
    : '';
  return crumbs([['World','#/'],[HOME_CONT.name, contHref(HOME_CONT)],[USA.name, countryHref(USA)],[c.state.name, stateHref(c.state)],[c.name,'']])
  + '<div class="wrap"><div style="padding-top:40px"><div class="hero">'
  + '<div class="hero-main">'
  + '<h1 class="title-xl">'+esc(c.name)+'</h1>'
  + '<span class="lab">'+esc(c.state.name).toUpperCase()+', UNITED STATES · '+coord(c.lat,c.lon)+'</span>'
  + '<div class="readout">'
  + '<span class="ro"><span class="lab">LOCAL TIME</span><span class="ro-v" data-tz="'+c.tz+'">'+fmtTime(now,c.tz)+'</span></span>'
  + '<span class="ro"><span class="lab">SKY</span><span class="sky" data-wx="'+c.key+'" data-night="'+(night?1:0)+'" data-big="1">'
  + glyph(night?'night':'clear',26)+'<span class="ro-v">—</span></span></span>'
  + '<span class="ro"><span class="lab">SUN</span><span class="ro-sun">'+sunLine+'</span></span></div>'
  + '<div style="display:flex;flex-wrap:wrap;align-items:center;gap:12px">'
  + ctl(c.id, c.name)
  + '<span class="chip warm">'+glyph(night?'night':'clear',14)+(night?'IT IS NIGHT IN ':'IT IS DAYTIME IN ')+esc(c.name).toUpperCase()+'</span></div>'
  + '<p class="note">The page follows this city\u2019s clock, not yours — override it with the control up top.</p>'
  + '</div>'
  + '<div class="hero-side"><div class="board"><div class="board-h"><span class="lab">SAVED PLACES</span>'
  + '<span class="lab-s">'+pad2(c.todo.length+c.eat.length)+'</span></div>'
  + '<div style="padding:18px"><p class="note" style="margin-bottom:14px">One CSV with every pin on this page, ready to import into Google My Maps.</p>'
  + '<button class="btn" data-dl="city:'+c.key+'">'+ICON.down+c.slug+'-places.csv</button></div></div></div>'
  + '</div></div>'
  + '<div class="sec">'+secHead('Things to do', pad2(c.todo.length)+' LISTED')
  + (c.todo.length ? rowsHTML(c.todo) : blank('Nothing logged here yet','Add entries for this city to TODO in the data file and they appear here, on the map and in the CSV.'))
  + '</div>'
  + '<div class="sec">'+secHead('Where I ate', pad2(c.eat.length)+' LOGGED')
  + (c.eat.length
    ? '<div class="grid g-wide" style="padding-top:28px">'+c.eat.map(e=>'<div class="card" style="justify-content:flex-start;gap:12px;min-height:0">'
      + '<span class="lab-s">'+esc(e.cuisine||'')+'</span><span class="card-t">'+esc(e.name)+'</span>'
      + '<p class="row-d">'+esc(e.note||'')+'</p><span class="card-foot">'+ctl(e.id, e.name)+'</span></div>').join('')+'</div>'
    : blank('No restaurants logged yet','Add them to EAT in the data file — name, cuisine and one line on whether it was worth it.'))
  + '</div>'
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
  + '<p class="lede" style="padding-top:16px">Try the search box, or <a href="#/">start again from the atlas</a>.</p></div>';
}

/* ===========================================================
   ROUTER
   =========================================================== */
function route(){
  const parts = location.hash.replace(/^#\/?/,'').split('#')[0].split('/').filter(Boolean);
  let html, points = [], title = 'Meridian', foot = 'A PERSONAL TRAVEL ATLAS';
  const ct = parts[0] ? CONT_BY_SLUG[parts[0]] : null;
  if (!parts.length){ html = viewHome(); points = BOARD.concat(FEATURED); }
  else if (!ct){ html = viewMissing(); }
  else if (parts.length === 1){ html = viewContinent(ct); title = ct.name+' — Meridian'; }
  else {
    const co = ct.countries.find(c=>c.slug === parts[1]);
    if (!co){ html = viewMissing(); }
    else if (parts.length === 2 || !co.detailed){ html = viewCountry(co); title = co.name+' — Meridian'; }
    else {
      const st = BY_ABBR[parts[2]];
      if (!st){ html = viewMissing(); }
      else if (parts.length === 3){
        html = viewState(st); title = st.name+' — Meridian'; foot = st.tz.toUpperCase().replace('_',' ');
        points = st.cities.map(c=>c.key);
      } else {
        const c = st.cities.find(x=>x.slug === parts[3]);
        if (!c){ html = viewMissing(); }
        else { html = viewCity(c); title = c.name+', '+st.abbr+' — Meridian'; foot = c.tz.toUpperCase().replace('_',' '); points = [c.key]; }
      }
    }
  }
  document.getElementById('app').innerHTML = html;
  document.title = title;
  document.getElementById('footnote').textContent = foot;
  applyTheme();
  tick();
  loadWeather(points.map(k=>CITY_BY_KEY[k]).filter(Boolean).map(c=>({key:c.key, lat:c.lat, lon:c.lon})));
}
function tick(){
  const now = new Date();
  document.querySelectorAll('[data-tz]').forEach(el=>{ el.textContent = fmtTime(now, el.dataset.tz); });
}
setInterval(tick, 1000);
window.addEventListener('hashchange', ()=>{ route(); if (!location.hash.includes('#map')) window.scrollTo(0,0); });

/* ===========================================================
   SEARCH
   =========================================================== */
const INDEX = [];
CONTINENTS.forEach(ct=>{
  INDEX.push({label:ct.name, sub:'CONTINENT', href:contHref(ct), rank:1});
  ct.countries.forEach(co=>INDEX.push({label:co.name, sub:'COUNTRY · '+ct.name.toUpperCase(), href:countryHref(co), rank:co.detailed?0:2}));
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
  const hits = INDEX.filter(e=>e.label.toLowerCase().includes(q))
    .sort((a,b)=> a.rank-b.rank || a.label.toLowerCase().indexOf(q)-b.label.toLowerCase().indexOf(q) || a.label.localeCompare(b.label))
    .slice(0,8);
  res.innerHTML = hits.length
    ? hits.map(h=>'<a href="'+h.href+'"><span>'+esc(h.label)+'</span><span class="r-sub">'+esc(h.sub)+'</span></a>').join('')
    : '<a href="#/"><span>Nothing by that name</span></a>';
  res.classList.remove('hidden');
}
box.addEventListener('input', runSearch);
box.addEventListener('focus', runSearch);
res.addEventListener('click', ()=>{ res.classList.add('hidden'); box.value=''; });
document.addEventListener('click', e=>{ if (!e.target.closest('.searchwrap')) res.classList.add('hidden'); });
box.addEventListener('keydown', e=>{ if (e.key === 'Escape'){ res.classList.add('hidden'); box.blur(); } });

route();
