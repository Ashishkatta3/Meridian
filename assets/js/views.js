/* ===========================================================
   VIEWS — the pages added after the atlas: the home page in both its
   states, the events feed, the bucket list, the translator, the trip
   planner and the sign-up walkthrough.

   Everything here is called from the router in app.js and uses that
   file's helpers (esc, crumbs, secHead, ctl, worldMap and so on). None
   of it runs at load time, so load order against app.js does not
   matter.
   =========================================================== */

/* ===========================================================
   How much of the world, and what the month is good for
   =========================================================== */
function worldShare(){
  const c = counts();
  const tot = ALL_COUNTRIES.length;
  const pct = tot ? (c.countries / tot) * 100 : 0;
  return {
    been:c.countries, total:tot,
    pct: pct >= 10 ? Math.round(pct) : Math.round(pct * 10) / 10,
    conts:c.continents, cities:c.cities, states:c.states,
    places:c.places, wish:c.wish
  };
}

/* Countries whose own written "best time to go" includes this month. */
function bestThisMonth(month){
  const out = [];
  ALL_COUNTRIES.forEach(co=>{
    if (co.detailed) return;
    const pr = profileOf(co.slug);
    if (!pr || !pr.s) return;
    if (monthsFromText(pr.s).indexOf(month) >= 0) out.push({co, when:pr.s, blurb:pr.b || ''});
  });
  return out;
}

/* The retention engine: places already on the want list whose season
   has just come round. This is the one thing on the site that changes
   without anybody touching it. */
function windowOpen(month){
  return bestThisMonth(month).filter(x=>statusOf(x.co.id) === 'want');
}

/* Which scopes count as "where you are going" — anywhere marked want,
   anywhere marked been, and where you live now. */
function myScopes(){
  const s = new Set();
  ALL_COUNTRIES.forEach(co=>{
    const st = statusOf(co.id);
    if (st === 'want' || st === 'been') s.add(co.slug);
  });
  ATLAS.forEach(st=>{
    if (stateStatus(st) !== 'none') s.add('us:' + st.abbr);
    st.cities.forEach(c=>{ if (statusOf(c.id) !== 'none') s.add(c.key); });
  });
  const lc = livingCountry();
  if (lc) s.add(lc.slug);
  if (PREFS.homeCity && CITY_BY_KEY[PREFS.homeCity]){
    s.add(PREFS.homeCity);
    s.add('us:' + CITY_BY_KEY[PREFS.homeCity].state.abbr);
  }
  return [...s];
}

/* ===========================================================
   Event cards
   =========================================================== */
function evCard(x, opts){
  const e = x.e, n = x.n || evNext(e);
  const cat = EV_CAT[e.cat] || ['', 'var(--warm)'];
  const live = n.live;
  const href = e.ck && CITY_BY_KEY[e.ck] ? cityHref(CITY_BY_KEY[e.ck])
    : e.scope.indexOf('us:') === 0 && BY_ABBR[e.scope.slice(3).toLowerCase()]
      ? stateHref(BY_ABBR[e.scope.slice(3).toLowerCase()])
    : CO_BY_SLUG[e.scope] ? countryHref(CO_BY_SLUG[e.scope]) : '';
  return '<div class="evcard'+(live?' live':'')+'" style="--ev:'+cat[1]+'">'
    + '<span class="evtop"><span class="evcat">'+esc(cat[0])+'</span>'
    + '<span class="evcount'+(live?' on':'')+'">'+(live?'<i></i>':'')+evCountdown(e)+'</span></span>'
    + (href ? '<a class="evname" href="'+href+'">'+esc(e.name)+'</a>'
            : '<span class="evname">'+esc(e.name)+'</span>')
    + '<span class="evwhere">'+esc(e.place)+'</span>'
    + '<span class="evwhen">'+esc(evWhen(e, n))+'</span>'
    + ((opts && opts.full !== false) ? '<p class="evblurb">'+esc(e.blurb)+'</p>' : '')
    + '</div>';
}

function evStrip(list, opts){
  if (!list.length) return '';
  return '<div class="evgrid">' + list.map(x=>evCard(x, opts)).join('') + '</div>';
}

/* ===========================================================
   HOME — two different pages depending on whether anyone is signed in
   =========================================================== */
function viewHome(){
  routeIsNight = isNightAt(38,-97);
  return (CLOUD.on && CLOUD.user) ? homeSignedIn() : homeVisitor();
}

/* ---------- nobody signed in: what the world is doing ---------- */
function homeVisitor(){
  const now = new Date();
  const soon = evUpcoming(6, now).slice(0, 12);
  const liveNow = soon.filter(x=>x.n.live).length;
  const nPark = ATLAS.reduce((n,s)=>n + s.statewide.filter(p=>p.tag === 'NATIONAL PARK').length, 0);

  return '<div class="wrap" style="padding-top:64px">'
    + '<div class="hero"><div class="hero-main">'
    + '<span class="lab" style="color:var(--warm)">A LIVING TRAVEL ATLAS</span>'
    + '<h1 class="title-xl">The world is already doing something. Somewhere on this map, right now.</h1>'
    + '<p class="lede">Every country, every US state, every national park — with what is happening there this month, '
      + 'what the weather and the money are doing, and the words you will need when you arrive. '
      + 'Mark what you have seen and what you want to see, and the atlas starts answering back.</p>'
    + '<div style="display:flex;flex-wrap:wrap;gap:12px;padding-top:4px">'
    + '<a class="btn" href="#/welcome">Start your atlas</a>'
    + '<a class="btn ghost" href="#/continents">Just look around</a></div></div>'

    + '<div class="hero-side"><div class="board"><div class="board-h"><span class="lab">ON RIGHT NOW</span>'
    + '<span class="live"><i></i>'+pad2(liveNow)+'</span></div>'
    + soon.filter(x=>x.n.live).slice(0,6).map(x=>{
        const cat = EV_CAT[x.e.cat] || ['',''];
        return '<a class="board-r" href="#/events"><span class="board-city">'
          + '<span style="font-size:15px;font-weight:500">'+esc(x.e.name)+'</span>'
          + '<span class="lab-s">'+esc(x.e.place).toUpperCase()+'</span></span>'
          + '<span class="board-right"><span class="evcat" style="--ev:'+cat[1]+'">'+esc(cat[0])+'</span></span></a>';
      }).join('')
    + '<div style="padding:16px 18px"><a class="btn ghost" href="#/events" style="width:100%;justify-content:center">All '+EV.length+' events</a></div>'
    + '</div></div></div>'

    + '<div class="sec"><div class="stats">'
    + stat(ALL_COUNTRIES.length,'COUNTRIES')+stat(ALL_CITIES.length,'CITIES')
    + stat(CONTINENTS.length,'CONTINENTS')+stat(nPark,'NATIONAL PARKS')
    + stat(BK.length,'BUCKET LIST IDEAS')+stat(EV.length,'EVENTS TRACKED')+'</div></div>'

    /* the map comes before the calendar: it is the thing people
       recognise the site by, and it reads as the headline */
    + '<div class="sec"><div class="panel">'
    + '<div class="panel-head"><span class="lab">THE WHOLE WORLD</span>'
    + '<button class="btn ghost" data-dl="all">'+ICON.down+'every place as CSV</button></div>'
    + worldMap(mapPoints('all'), 520)+'</div></div>'

    + '<div class="sec">'+secHead('The next six months','SOONEST FIRST')
    + '<div style="padding-top:26px">'+evStrip(soon)+'</div>'
    + '<div style="padding-top:22px"><a class="btn ghost" href="#/events">See the whole calendar</a></div></div>'

    + '<div class="sec">'+secHead('What it does once you sign in','FOUR THINGS')
    + '<div class="grid g-cities" style="padding-top:28px">'
    + homeSell('Your own percentage','Mark the countries you have been to and the atlas works out how much of the world that actually is.','#/welcome')
    + homeSell('Events where you are going','Put somewhere on your want list and the calendar starts telling you when its season comes round.','#/events')
    + homeSell('A hundred things to do','Sandboarding in Peru, drift school in Japan, bobsled in St Moritz — with somewhere to book each one.','#/bucket')
    + homeSell('Translate on the spot','Type it or say it, in sixty languages, with the phrasebook for the country already loaded.','#/translate')
    + '</div></div></div>';
}
const homeSell = (t, b, href) =>
  '<a class="card go sell" href="'+href+'" style="min-height:150px">'
  + '<span class="card-t" style="font-size:22px">'+esc(t)+'</span>'
  + '<p class="row-d">'+esc(b)+'</p></a>';

/* ---------- signed in: your atlas, and what it has noticed ---------- */
function homeSignedIn(){
  const now = new Date(), month = now.getMonth() + 1;
  const W = worldShare();
  const name = (CLOUD.name || '').split(' ')[0] || '';
  const mine = evForScopes(myScopes(), 8, now).slice(0, 9);
  const opened = windowOpen(month).slice(0, 6);
  const best = (function(){
    const all = bestThisMonth(month);
    const notBeen = all.filter(x=>statusOf(x.co.id) !== 'been');
    const off = (month * 7) % Math.max(1, notBeen.length);
    return notBeen.slice(off).concat(notBeen.slice(0, off)).slice(0, 8);
  })();

  const hi = name ? 'Welcome back, ' + esc(name) + '.' : 'Welcome back.';

  return '<div class="wrap" style="padding-top:56px">'
    /* the number, big */
    + '<div class="hero"><div class="hero-main">'
    + '<span class="lab" style="color:var(--warm)">YOUR ATLAS</span>'
    + '<h1 class="title-xl">'+hi+'</h1>'
    + '<div class="bigpct"><span class="bigpct-n">'+W.pct+'<i>%</i></span>'
    + '<span class="bigpct-b"><span class="card-t" style="font-size:20px">of the world, so far</span>'
    + '<span class="note">'+W.been+' of '+W.total+' countries · '+W.conts+' of '+CONTINENTS.length+' continents · '
    + W.cities+' cities · '+W.states+' US states</span></span></div>'
    + '<div style="display:flex;flex-wrap:wrap;gap:12px;padding-top:8px">'
    + '<a class="btn" href="#/plan">Plan a trip</a>'
    + '<a class="btn ghost" href="#/want">Your want list ('+W.wish+')</a></div></div>'

    + '<div class="hero-side"><div class="board"><div class="board-h"><span class="lab">THE WINDOW JUST OPENED</span>'
    + '<span class="lab-s">'+pad2(opened.length)+'</span></div>'
    + (opened.length
        ? opened.map(x=>'<a class="board-r" href="'+countryHref(x.co)+'">'
            + '<span class="board-city"><span style="font-size:15px;font-weight:500">'+esc(x.co.name)+'</span>'
            + '<span class="lab-s">BEST: '+esc(x.when).toUpperCase()+'</span></span>'
            + '<span class="board-right"><span class="chip on">ON YOUR LIST</span></span></a>').join('')
        : '<div style="padding:18px"><p class="note">Nothing on your want list is in its best season this month. '
          + 'Add a few more places and this fills up on its own.</p>'
          + '<a class="btn ghost" href="#/continents" style="margin-top:12px">Browse the atlas</a></div>')
    + '</div></div></div>'

    /* their map */
    + '<div class="sec"><div class="panel">'
    + '<div class="panel-head"><span style="display:flex;flex-wrap:wrap;align-items:center;gap:16px">'
    + '<span class="lab">WHERE YOU HAVE BEEN</span>'
    + '<span class="chip warm"><span class="pin" style="width:8px;height:8px;box-shadow:none"></span>BEEN</span>'
    + '<span class="chip on"><span class="pin want" style="width:8px;height:8px;box-shadow:none"></span>WANT TO GO</span></span>'
    + '<button class="btn ghost" data-dl="all">'+ICON.down+'every place as CSV</button></div>'
    + worldMap(mapPoints(mapFilter), 520, {filter:true})+'</div></div>'

    /* events where they are going */
    + '<div class="sec">'+secHead('Coming up where you are going',
        mine.length ? 'FROM YOUR BEEN AND WANT LISTS' : 'NOTHING YET')
    + '<div style="padding-top:26px">'
    + (mine.length ? evStrip(mine)
      : blank('No events on your lists yet','Mark a few countries or cities as <strong>want to go</strong> and '
        + 'anything happening there over the next eight months shows up here by itself.'))
    + '</div></div>'

    /* best of the month */
    + '<div class="sec">'+secHead('Best places to be in '+PLAN_MON[month-1], pad2(best.length)+' OF '+bestThisMonth(month).length)
    + '<div class="grid g-cities" style="padding-top:28px">'
    + best.map(x=>'<div class="card'+(statusOf(x.co.id)==='want'?' wish':'')+'" style="min-height:168px">'
        + '<a class="go" href="'+countryHref(x.co)+'" style="display:flex;flex-direction:column;gap:7px">'
        + '<span class="card-t" style="font-size:24px">'+esc(x.co.name)+'</span>'
        + '<span class="lab-s">'+esc(x.co.continent.name).toUpperCase()+' · BEST '+esc(x.when).toUpperCase()+'</span>'
        + (x.blurb ? '<p class="row-d" style="margin-top:2px">'+esc(x.blurb.slice(0,96))+(x.blurb.length>96?'…':'')+'</p>' : '')
        + '</a><span class="card-foot">'+pinFor(statusOf(x.co.id))+ctl(x.co.id, x.co.name)+'</span></div>').join('')
    + '</div>'
    + '<p class="note" style="padding-top:16px">Worked out from each country’s own best-time-to-go, which is why the list '
    + 'changes completely next month.</p></div>'

    /* quick doors */
    + '<div class="sec">'+secHead('Carry on','')
    + '<div class="grid g-cities" style="padding-top:28px">'
    + homeSell('The bucket list','A hundred things rather than a hundred places, each with somewhere to book it.','#/bucket')
    + homeSell('Plan a trip','Give it a place, a number of days and a budget and it writes the days out.','#/plan')
    + homeSell('Translate','Type or speak, in sixty languages.','#/translate')
    + homeSell('The board','A badge for everywhere you have been.','#/board')
    + '</div></div></div>';
}

/* ===========================================================
   EVENTS — the whole calendar
   =========================================================== */
let evFilter = 'all', evWindow = 6;
function viewEvents(){
  routeIsNight = isNightAt(38,-97);
  const now = new Date();
  let list = evUpcoming(evWindow, now);
  if (evFilter === 'mine'){
    const want = new Set(myScopes());
    list = list.filter(x=>want.has(x.e.scope) || want.has(x.e.ck));
  } else if (evFilter !== 'all'){
    list = list.filter(x=>x.e.cat === evFilter);
  }
  const cats = Object.keys(EV_CAT);
  const btn = (v,l) => '<button type="button" data-evfilter="'+v+'" aria-pressed="'+(evFilter===v)+'">'+l+'</button>';
  const wbtn = n => '<button type="button" data-evwindow="'+n+'" aria-pressed="'+(evWindow===n)+'">'+n+' MONTHS</button>';

  return crumbs([['World','#/continents'],['Events','']])
  + '<div class="wrap"><div style="padding-top:36px">'
  + '<h1 class="title-l">The calendar</h1>'
  + '<p class="lede" style="padding-top:14px">Carnival, migrations, blossom, aurora season, balloon fiestas — '
  + 'the things that only happen at one time of year, and when the next one is. '
  + 'Dates that move with the moon or with Easter say so rather than guessing.</p></div>'

  + '<div class="filterbar" style="margin-top:28px">'
  + '<span class="mapfilter">'+btn('all','ALL '+evUpcoming(evWindow, now).length)+btn('mine','ON MY LISTS')+'</span>'
  + '<span class="mapfilter">'+wbtn(3)+wbtn(6)+wbtn(12)+'</span></div>'
  + '<div class="catbar">'+cats.map(c=>'<button type="button" class="catbtn" data-evfilter="'+c+'" '
      + 'aria-pressed="'+(evFilter===c)+'" style="--ev:'+EV_CAT[c][1]+'">'+EV_CAT[c][0]+'</button>').join('')+'</div>'

  + '<div class="sec" style="padding-top:28px">'
  + (list.length ? evStrip(list)
    : blank('Nothing in that window','Try a longer window, or a different category. '
      + (evFilter==='mine' ? 'Nothing on your been or want lists has an event in this period.' : '')))
  + '</div></div>';
}

/* ===========================================================
   BUCKET LIST
   =========================================================== */
let bkFilter = 'all', bkNowOnly = false;
function viewBucket(){
  routeIsNight = isNightAt(38,-97);
  const month = new Date().getMonth() + 1;
  let list = BK.slice();
  if (bkFilter !== 'all') list = list.filter(b=>b.cat === bkFilter);
  if (bkNowOnly) list = list.filter(b=>bkInMonth(b, month));
  const doneN = BK.filter(b=>statusOf(b.id) === 'been').length;
  const wantN = BK.filter(b=>statusOf(b.id) === 'want').length;

  const cards = list.map(b=>{
    const st = statusOf(b.id), cat = BK_CAT[b.cat] || ['',''];
    const co = CO_BY_SLUG[b.country];
    const open = bkInMonth(b, month);
    return '<div class="bk'+(st==='been'?' done':'')+(st==='want'?' wish':'')+'" style="--ev:'+cat[1]+'">'
      + '<span class="bk-top"><span class="evcat">'+esc(cat[0])+'</span>'
      + '<span class="bk-season'+(open?' open':'')+'">'+(open?'POSSIBLE NOW · ':'')+esc(bkSeason(b))+'</span></span>'
      + '<span class="bk-n">'+esc(b.name)+'</span>'
      + '<span class="bk-where">'+esc(b.place)
        + (co ? ' · <a href="'+countryHref(co)+'">'+esc(co.name)+'</a>' : '')+'</span>'
      + '<p class="bk-b">'+esc(b.blurb)+'</p>'
      + '<span class="bk-links">'+bkLinks(b).map(l=>
          '<a class="bklink" href="'+esc(l[1])+'" target="_blank" rel="noopener nofollow">'
          + esc(l[0])+'<span>'+esc(l[2])+'</span></a>').join('')+'</span>'
      + '<span class="bk-foot">'+ctl(b.id, b.name)+'</span></div>';
  }).join('');

  const btn = (v,l) => '<button type="button" class="catbtn" data-bkfilter="'+v+'" aria-pressed="'+(bkFilter===v)+'"'
    + (BK_CAT[v] ? ' style="--ev:'+BK_CAT[v][1]+'"' : '')+'>'+l+'</button>';

  return crumbs([['World','#/continents'],['Bucket list','']])
  + '<div class="wrap"><div style="padding-top:36px">'
  + '<h1 class="title-l">A hundred things, not a hundred places</h1>'
  + '<p class="lede" style="padding-top:14px">Most travel lists are places. This one is things you do — sandboarding '
  + 'the dunes at Huacachina, drift school at Ebisu, the natural-ice bob run at St Moritz, kayaking a bay that lights up '
  + 'when you move. Each one says when it is possible and links out to somewhere that will actually sell it to you.</p></div>'

  + '<div class="stats" style="margin-top:30px">'+stat(BK.length,'THINGS TO DO')+stat(doneN,'DONE')
  + stat(wantN,'ON YOUR LIST')+stat(BK.filter(b=>bkInMonth(b,month)).length,'POSSIBLE THIS MONTH')+'</div>'

  + '<div class="filterbar" style="margin-top:26px">'
  + '<span class="mapfilter"><button type="button" data-bknow="1" aria-pressed="'+bkNowOnly+'">'
  + (bkNowOnly?'SHOWING WHAT IS IN SEASON':'ONLY WHAT IS IN SEASON')+'</button></span></div>'
  + '<div class="catbar">'+btn('all','EVERYTHING')
  + Object.keys(BK_CAT).map(c=>btn(c, BK_CAT[c][0])).join('')+'</div>'

  + '<div class="sec" style="padding-top:28px"><div class="bkgrid">'+cards+'</div>'
  + '<p class="note" style="padding-top:22px">The booking links are searches rather than fixed product pages, so they '
  + 'keep working when an operator changes its listings. Prices and availability are whatever the marketplace says '
  + 'today — nothing on this page is cached.</p></div></div>';
}

/* ===========================================================
   TRANSLATOR
   =========================================================== */
let trTo = '', trFrom = 'en', trText = '', trOut = '', trNote = '', trBusy = false, trHeard = '';
function viewTranslate(){
  routeIsNight = isNightAt(38,-97);
  if (!trTo){
    const lc = livingCountry();
    trTo = (lc && trLangOf(lc.slug)) || 'es';
  }
  return crumbs([['World','#/continents'],['Translate','']])
  + '<div class="wrap"><div style="padding-top:36px">'
  + '<h1 class="title-l">Say it there</h1>'
  + '<p class="lede" style="padding-top:14px">Type it or speak it, in sixty languages, and hear it back in the local '
  + 'voice so you can copy the sound rather than guess at the spelling.</p></div>'
  + '<div class="sec" style="padding-top:28px">'+trPanel({big:true})+'</div></div>';
}

/* The same panel appears on country pages, smaller. */
function trPanel(opts){
  const big = !!(opts && opts.big);
  const L = trList();
  const opt = c => '<option value="'+c+'"'+(trTo===c?' selected':'')+'>'+esc(trName(c))
    + (trNative(c) && trNative(c) !== trName(c) ? ' — ' + esc(trNative(c)) : '')+'</option>';
  const picker = '<select data-trto aria-label="Translate into">'
    + '<optgroup label="Most travelled">'+L.major.map(opt).join('')+'</optgroup>'
    + '<optgroup label="Everything else">'+L.rest.map(opt).join('')+'</optgroup></select>';
  /* The button is offered whenever the browser can speak at all. Whether
     a voice for THIS language exists is decided when it is pressed, by
     trSpeak, which explains itself rather than going quiet — the voice
     list is often still empty at the moment this markup is built. */
  const canHear = TR_CAN_SPEAK;

  return '<div class="trbox'+(big?' big':'')+'">'
    + '<div class="trhead"><span class="lab">ENGLISH INTO</span>'+picker
    + (TR_CAN_LISTEN
        ? '<button type="button" class="micbtn" data-trmic aria-label="Speak instead of typing">'
          + '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" '
          + 'stroke-linecap="round"><path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>'
          + '<path d="M5 11a7 7 0 0 0 14 0M12 18v4"/></svg>SPEAK</button>'
        : '')
    + '</div>'
    + '<div class="trio">'
    + '<label class="hidden" for="trin">What you want to say</label>'
    + '<textarea id="trin" rows="'+(big?3:2)+'" placeholder="Where is the station?" data-trin>'+esc(trText)+'</textarea>'
    + '<div class="trrow">'
    + '<button class="btn" data-trgo>'+(trBusy?'Translating…':'Translate')+'</button>'
    + (trHeard ? '<span class="chip warm">HEARD: '+esc(trHeard)+'</span>' : '')
    + '<span class="note" style="margin-left:auto">'
      + (TR_CAN_LISTEN ? 'Microphone works in this browser.' : 'This browser cannot do voice input — Chrome, Edge and Safari can.')
      + '</span></div>'
    + (trOut
      ? '<div class="trout"'+(trRTL(trTo)?' dir="rtl"':'')+' lang="'+esc(trTo)+'">'
        + '<span class="trout-t">'+esc(trOut)+'</span>'
        + '<span class="trout-r">'
        + (canHear ? '<button type="button" class="tbtn" data-trsay>'
            + '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" '
            + 'stroke-linecap="round"><path d="M11 5 6 9H3v6h3l5 4V5z"/><path d="M16 9a4 4 0 0 1 0 6"/>'
            + '<path d="M19 6a8 8 0 0 1 0 12"/></svg>HEAR IT</button>' : '')
        + '<button type="button" class="tbtn" data-trcopy>COPY</button></span></div>'
      : '')
    + (trNote ? '<p class="note" style="color:var(--warm);padding-top:10px">'+esc(trNote)+'</p>' : '')
    + '</div></div>';
}

/* ===========================================================
   TRIP PLANNER
   =========================================================== */
let plDest = '', plDays = 5, plBudget = 'mid', plTotal = '', plResult = null, plBusy = false, plMsg = '';
function viewPlan(){
  routeIsNight = isNightAt(38,-97);
  const coOpts = ALL_COUNTRIES.slice().sort((a,b)=>a.name.localeCompare(b.name))
    .map(c=>'<option value="country:'+c.slug+'"'+(plDest==='country:'+c.slug?' selected':'')+'>'+esc(c.name)+'</option>').join('');
  const cityOpts = ALL_CITIES.slice().sort((a,b)=>a.name.localeCompare(b.name))
    .map(c=>'<option value="city:'+c.key+'"'+(plDest==='city:'+c.key?' selected':'')+'>'+esc(c.name)+', '+c.state.abbr+'</option>').join('');
  const bbtn = (v,l,s) => '<label class="budget'+(plBudget===v?' on':'')+'">'
    + '<input type="radio" name="plbudget" value="'+v+'"'+(plBudget===v?' checked':'')+' data-plbudget>'
    + '<span class="card-t" style="font-size:19px">'+l+'</span><span class="note">'+s+'</span></label>';

  return crumbs([['World','#/continents'],['Plan','']])
  + '<div class="wrap"><div style="padding-top:36px">'
  + '<h1 class="title-l">Plan the days</h1>'
  + '<p class="lede" style="padding-top:14px">Tell it where, how long and roughly what you have to spend, and it writes '
  + 'the days out of this atlas — the attractions, the parks, the restaurants and anything that happens to be on while '
  + 'you are there. Everything it suggests exists on a page in this site, which is the point.</p></div>'

  + '<div class="sec" style="padding-top:28px"><div class="planbox">'
  + '<div class="setgrid">'
  + '<label class="setbox"><span class="lab">WHERE</span>'
  + '<select data-pldest><option value="">— choose a place —</option>'
  + '<optgroup label="Countries">'+coOpts+'</optgroup>'
  + '<optgroup label="US cities">'+cityOpts+'</optgroup></select>'
  + '<span class="note">Countries plan from the written highlights; US cities plan from the attraction and restaurant lists.</span></label>'
  + '<label class="setbox"><span class="lab">HOW MANY DAYS</span>'
  + '<input type="number" min="1" max="21" value="'+plDays+'" data-pldays>'
  + '<span class="note">One to twenty-one.</span></label>'
  + '<label class="setbox"><span class="lab">TOTAL BUDGET, IF YOU HAVE ONE</span>'
  + '<input type="text" inputmode="numeric" value="'+esc(plTotal)+'" placeholder="e.g. 1800" data-pltotal>'
  + '<span class="note">Optional, excluding flights. Used to say whether the number is tight or generous for that place.</span></label>'
  + '</div>'
  + '<div class="budgets">'+bbtn('low','Lean','Parks, markets, walking and what costs nothing.')
  + bbtn('mid','Comfortable','A paid attraction most days and a proper dinner.')
  + bbtn('high','No limit','The guided things and the restaurants worth booking.')+'</div>'
  + '<div class="edrow" style="padding-top:18px"><button class="btn" data-plgo>'
  + (plBusy?'Working…':'Write the itinerary')+'</button>'
  + (plResult?'<button class="btn ghost" data-plclear>Start again</button>':'')
  + (plMsg?'<span class="note" style="color:var(--warm)">'+esc(plMsg)+'</span>':'')+'</div>'
  + '</div></div>'
  + (plResult ? planHTML(plResult) : '')
  + '<div class="sec"><p class="note">This planner is deliberately not a chatbot. Every line it writes comes from a row '
  + 'in this atlas, so it cannot invent a museum or a festival that does not exist — the trade-off being that it only '
  + 'knows places the atlas covers. <code>assets/js/plan.js</code> explains how to put a real model behind it when you '
  + 'are ready, and why the key has to live on a server rather than in this page.</p></div></div>';
}

function planHTML(p){
  const m = p.money;
  const kindIcon = {event:ICON.star, activity:ICON.flag, food:ICON.check, sight:ICON.compass};
  return '<div class="sec">'+secHead(p.days.length+' days in '+esc(p.where),
      p.budget.name.toUpperCase()+' · '+esc(p.month).toUpperCase())
  + '<div class="intel" style="margin-top:22px">'
  + '<div class="intel-c"><span class="lab">HOW IT IS PITCHED</span>'
  + '<span class="intel-v">'+esc(p.budget.name)+'</span><span class="note">'+esc(p.budget.note)+'</span></div>'
  + '<div class="intel-c"><span class="lab">TYPICAL COST THERE</span>'
  + '<span class="intel-v">'+esc(m.bandRange)+'</span>'
  + '<span class="note">'+esc(m.bandName)+' by world standards, per person, excluding flights. A rough planning figure, not a quote.</span></div>'
  + (m.perDay ? '<div class="intel-c"><span class="lab">YOUR BUDGET WORKS OUT AT</span>'
      + '<span class="intel-v">$'+m.perDay.toLocaleString()+' a day</span>'
      + '<span class="note">Which is '+esc(m.verdict)+'.</span></div>' : '')
  + (m.currency ? '<div class="intel-c"><span class="lab">THEY USE</span>'
      + '<span class="intel-v fx" data-fx="'+esc(m.currency[0])+'">—</span>'
      + '<span class="note fxnote">Live rate, fetched when this page loaded.</span></div>' : '')
  + '</div>'

  + (p.events.length ? '<div style="padding-top:26px">'+secHead('On while you are there', pad2(p.events.length))
      + '<div style="padding-top:20px">'+evStrip(p.events, {full:false})+'</div></div>' : '')

  + '<div class="plandays">'+p.days.map(d=>
      '<div class="planday"><div class="planday-h">'
      + '<span class="planday-n">'+d.label+'</span>'
      + '<span class="lab-s">'+esc(d.dateLabel).toUpperCase()+'</span></div>'
      + (d.blocks.length ? d.blocks.map(b=>
          '<div class="planrow k-'+b.kind+'">'
          + '<span class="planrow-i">'+(kindIcon[b.kind]||ICON.compass)+'</span>'
          + '<div class="planrow-b"><span class="lab-s">'+esc(b.time)+(b.tag?' · '+esc(b.tag):'')+'</span>'
          + (b.href ? '<a class="row-t" href="'+b.href+'">'+esc(b.title)+'</a>'
                    : '<span class="row-t">'+esc(b.title)+'</span>')
          + (b.note ? '<p class="row-d">'+esc(b.note)+'</p>' : '')
          + (b.where && b.where !== p.where ? '<span class="lab-s" style="color:var(--ghost)">'+esc(b.where).toUpperCase()+'</span>' : '')
          + (b.season ? '<span class="chip warm">'+esc(b.season)+'</span>' : '')
          + '</div></div>').join('')
        : '<div style="padding:18px"><p class="note">A free day. The atlas had nothing left written up for this one.</p></div>')
      + '</div>').join('')+'</div>'

  + (p.notes.length ? '<div style="padding-top:22px">'+p.notes.map(n=>'<p class="note">'+esc(n)+'</p>').join('')+'</div>' : '')
  + '<div style="padding-top:22px"><button class="btn ghost" data-plcsv>'+ICON.down+'Download as CSV</button></div>'
  + '</div>';
}

/* ===========================================================
   WELCOME — the four things worth asking once
   =========================================================== */
let obTab = 'been', obQuery = '';
function viewOnboard(){
  routeIsNight = isNightAt(38,-97);
  const passportOpts = PASSPORTS.map(pp=>
    '<option value="'+pp[0]+'"'+(PREFS.passport===pp[0]?' selected':'')+'>'+esc(pp[1])+'</option>').join('');
  const countryOpts = sel => '<option value="">— not set —</option>'
    + ALL_COUNTRIES.slice().sort((a,b)=>a.name.localeCompare(b.name))
      .map(c=>'<option value="'+c.slug+'"'+(sel===c.slug?' selected':'')+'>'+esc(c.name)+'</option>').join('');

  /* every country is rendered and the search box hides rather than
     re-renders, so typing never costs you the input focus */
  const pool = ALL_COUNTRIES.slice().sort((a,b)=>
    ((statusOf(b.id) !== 'none') - (statusOf(a.id) !== 'none'))
    || a.continent.name.localeCompare(b.continent.name)
    || a.name.localeCompare(b.name));

  const chips = pool.map(c=>{
    const st = statusOf(c.id);
    return '<button type="button" class="pick'+(st!=='none'?' on '+st:'')+'" data-obpick="'+c.id+'"'
      + ' data-obhay="'+esc(c.name+' '+c.continent.name)+'">'+esc(c.name)+'</button>';
  }).join('');

  const W = worldShare();
  const beenN = ALL_COUNTRIES.filter(c=>statusOf(c.id)==='been').length;
  const wantN = ALL_COUNTRIES.filter(c=>statusOf(c.id)==='want').length;

  return '<div class="wrap" style="padding-top:48px">'
  + '<div style="max-width:720px"><span class="lab" style="color:var(--warm)">FOUR QUESTIONS, ONCE</span>'
  + '<h1 class="title-xl" style="padding-top:12px">Set up your atlas</h1>'
  + '<p class="lede" style="padding-top:16px">Your passport decides the visa line on every country page. Where you live '
  + 'decides the money everything converts into. And the places you mark are what the home page uses to tell you when '
  + 'a season has come round. None of it is required, and all of it can be changed later in Account.</p></div>'

  + '<div class="sec">'+secHead('1 · Where you are from','PASSPORT AND HOME')
  + '<div class="setgrid" style="padding-top:22px">'
  + '<label class="setbox"><span class="lab">NATIONALITY / PASSPORT</span>'
  + '<select data-pref="passport">'+passportOpts+'</select>'
  + '<span class="note">Sets the visa category shown on all 179 country pages.</span></label>'
  + '<label class="setbox"><span class="lab">COUNTRY YOU LIVE IN</span>'
  + '<select data-pref="livingCountry">'+countryOpts(PREFS.livingCountry)+'</select>'
  + '<span class="note">Prices convert into this country’s currency.</span></label>'
  + '<label class="setbox"><span class="lab">CITY YOU LIVE IN</span>'
  + '<input type="text" id="homeport" value="'+esc(PREFS.home.name)+'" placeholder="Start typing a city">'
  + '<span class="note">Flight times are measured from here. Pick a match from the list.</span>'
  + '<span class="ac hidden" id="homeac"></span></label>'
  + '</div></div>'

  + '<div class="sec">'+secHead('2 · Where you have been, and want to go',
      '<span id="obcount">'+beenN+' BEEN · '+wantN+' WANT</span>')
  + '<div class="obbar" style="padding-top:20px">'
  + '<span class="mapfilter">'
  + '<button type="button" data-obtab="been" aria-pressed="'+(obTab==='been')+'">TAPPING MARKS: BEEN</button>'
  + '<button type="button" data-obtab="want" aria-pressed="'+(obTab==='want')+'">TAPPING MARKS: WANT TO GO</button>'
  + '</span>'
  + '<input type="search" id="obsearch" value="'+esc(obQuery)+'" placeholder="Search 179 countries…" autocomplete="off">'
  + '</div>'
  + '<div class="picks" style="padding-top:18px">'+chips+'</div>'
  + '<p class="note" style="padding-top:14px">Tap a country to mark it, tap again to clear it. '
  + 'Switch the toggle to swap between marking been and want. States, cities and parks are marked the same way '
  + 'on their own pages.</p></div>'

  + '<div class="sec"><div class="panel"><div class="panel-head" style="border:0">'
  + '<span style="display:flex;flex-direction:column;gap:6px">'
  + '<span class="card-t" style="font-size:26px" id="obpct">'+W.pct+'% of the world so far</span>'
  + '<span class="note" id="obpctsub">'+W.been+' of '+W.total+' countries. That number is on your home page from now on.</span></span>'
  + '<a class="btn" href="#/" data-obdone>Done — open my atlas</a></div></div></div>'
  + '</div>';
}

/* ===========================================================
   THE ATLAS INDEX — what the home page used to hold
   =========================================================== */
function viewContinents(){
  routeIsNight = isNightAt(38,-97);
  const C = counts(), now = new Date();
  const conts = CONTINENTS.map(ct=>{
    const n = ct.countries.filter(c=>countryStatus(c)==='been').length;
    const w = ct.countries.filter(c=>countryStatus(c)==='want').length;
    return placeCard({name:ct.name, id:ct.id, href:contHref(ct), status:continentStatus(ct),
      sub: n ? n+' OF '+ct.countries.length+' COUNTRIES' : (w ? w+' ON THE LIST' : ct.countries.length+' COUNTRIES')});
  }).join('');
  const board = BOARD.map((b,i)=>{
    const [name, sub, lat, lon, tz, href] = b, night = isNightAt(lat, lon, now), key = 'board'+i;
    return '<a class="board-r'+(night?' night':'')+'" href="'+href+'">'
      + '<span class="board-city"><span style="font-size:15px;font-weight:500;display:flex;align-items:center;gap:8px">'
      + (night?'<span class="nightdot"></span>':'')+esc(name)+'</span>'
      + '<span class="lab-s">'+esc(sub).toUpperCase()+' · '+fmtZone(now,tz)+'</span></span>'
      + '<span class="board-right"><span class="sky" data-wx="'+key+'" data-night="'+(night?1:0)+'" '
      + 'style="font-family:var(--mono);font-size:13px">'+glyph(night?'night':'clear',17)+'<span>—</span></span>'
      + '<span class="board-t" data-tz="'+tz+'">'+fmtTime(now,tz)+'</span></span></a>';
  }).join('');

  return crumbs([['World','']])
  + '<div class="wrap"><div class="hero" style="padding-top:36px"><div class="hero-main">'
  + '<h1 class="title-xl">Start at the top</h1>'
  + '<p class="lede">Continent, then country, then state, then city. Every page carries its own clock, its own weather, '
  + 'what the money is worth and what is happening there this year.</p>'
  + '<div style="display:flex;flex-wrap:wrap;gap:12px;padding-top:4px">'
  + '<a class="btn ghost" href="#/">See the map</a>'
  + '<a class="btn ghost" href="#/events">The calendar</a></div></div>'
  + '<div class="hero-side"><div class="board"><div class="board-h"><span class="lab">RIGHT NOW</span>'
  + '<span class="live"><i></i>LIVE</span></div>'+board+'</div></div></div>'
  + '<div class="sec"><div class="stats">'
  + stat(C.continents,'CONTINENTS')+stat(C.countries,'COUNTRIES')+stat(C.states,'STATES &amp; DISTRICTS')
  + stat(C.cities,'CITIES')+stat(C.places,'PARKS &amp; REGIONS')+stat(C.wish,'ON THE LIST')+'</div></div>'
  + '<div class="sec" id="continents">'+secHead('The seven','CONTINENT → COUNTRY → STATE → CITY')
  + '<div class="grid g-cities" style="padding-top:28px">'+conts+'</div></div></div>';
}

/* ===========================================================
   Panels bolted onto a country page
   =========================================================== */
function countryEvents(co){
  const own = evForCountry(co.slug);
  if (!own.length) return '';
  const list = own.map(e=>({e, n:evNext(e)})).sort((a,b)=>(b.n.live-a.n.live)||(a.n.start-b.n.start));
  return '<div class="sec">'+secHead('The year in events', pad2(list.length)+(co.detailed?' ACROSS THE STATES':''))
    + '<div style="padding-top:24px">'+evStrip(list.slice(0, 12))+'</div>'
    + (list.length > 12 ? '<div style="padding-top:18px"><a class="btn ghost" href="#/events">See the whole calendar</a></div>' : '')
    + '</div>';
}

function countryBucket(co){
  const own = bkByCountry(co.slug);
  if (!own.length) return '';
  const month = new Date().getMonth() + 1;
  return '<div class="sec">'+secHead('Things to do here', pad2(own.length)+' FROM THE BUCKET LIST')
    + '<div class="bkgrid" style="padding-top:24px">'
    + own.map(b=>{
        const st = statusOf(b.id), cat = BK_CAT[b.cat] || ['',''];
        const open = bkInMonth(b, month);
        return '<div class="bk'+(st==='been'?' done':'')+(st==='want'?' wish':'')+'" style="--ev:'+cat[1]+'">'
          + '<span class="bk-top"><span class="evcat">'+esc(cat[0])+'</span>'
          + '<span class="bk-season'+(open?' open':'')+'">'+(open?'POSSIBLE NOW · ':'')+esc(bkSeason(b))+'</span></span>'
          + '<span class="bk-n">'+esc(b.name)+'</span>'
          + '<span class="bk-where">'+esc(b.place)+'</span>'
          + '<p class="bk-b">'+esc(b.blurb)+'</p>'
          + '<span class="bk-links">'+bkLinks(b).map(l=>
              '<a class="bklink" href="'+esc(l[1])+'" target="_blank" rel="noopener nofollow">'
              + esc(l[0])+'<span>'+esc(l[2])+'</span></a>').join('')+'</span>'
          + '<span class="bk-foot">'+ctl(b.id, b.name)+'</span></div>';
      }).join('')
    + '</div></div>';
}

/* ===========================================================
   WIRING — re-attached after every render
   =========================================================== */
function vdl(name, text, mime){
  try {
    const b = new Blob([text], {type:(mime||'text/csv')+';charset=utf-8'});
    const u = URL.createObjectURL(b), a = document.createElement('a');
    a.href = u; a.download = name; document.body.appendChild(a); a.click();
    a.remove(); setTimeout(()=>URL.revokeObjectURL(u), 2000);
  } catch(e){}
}

function wireViews(){
  /* --- translator: inputs keep their own state so typing never rerenders --- */
  const tin = document.querySelector('[data-trin]');
  if (tin) tin.addEventListener('input', ()=>{ trText = tin.value; });
  const tsel = document.querySelector('[data-trto]');
  if (tsel) tsel.addEventListener('change', ()=>{
    trTo = tsel.value; trOut = ''; trNote = ''; trHeard = ''; rerender();
  });

  /* --- planner: same, no rerender while typing --- */
  const pd = document.querySelector('[data-pldest]');
  if (pd) pd.addEventListener('change', ()=>{ plDest = pd.value; });
  const pdays = document.querySelector('[data-pldays]');
  if (pdays) pdays.addEventListener('input', ()=>{ plDays = pdays.value; });
  const ptot = document.querySelector('[data-pltotal]');
  if (ptot) ptot.addEventListener('input', ()=>{ plTotal = ptot.value; });

  /* --- the currency converter repaints without a rerender --- */
  const fa = document.querySelector('[data-fxamt]');
  if (fa) fa.addEventListener('input', ()=>{ FXAMT = fa.value; paintConvert(); });

  /* --- onboarding search filters the chips in place --- */
  const ob = document.getElementById('obsearch');
  if (ob) ob.addEventListener('input', ()=>{ obQuery = ob.value; obFilter(); });
  if (obQuery) obFilter();
}

function obFilter(){
  const q = obQuery.trim().toLowerCase();
  document.querySelectorAll('.picks .pick').forEach(b=>{
    const hay = (b.dataset.obhay || b.textContent || '').toLowerCase();
    b.style.display = (!q || hay.indexOf(q) >= 0) ? '' : 'none';
  });
}

function obCount(){
  const el = document.getElementById('obcount');
  if (!el) return;
  const b = ALL_COUNTRIES.filter(c=>statusOf(c.id)==='been').length;
  const w = ALL_COUNTRIES.filter(c=>statusOf(c.id)==='want').length;
  el.textContent = b + ' BEEN · ' + w + ' WANT';
  const pc = document.getElementById('obpct');
  if (pc){
    const W = worldShare();
    pc.textContent = W.pct + '% of the world so far';
    const sub = document.getElementById('obpctsub');
    if (sub) sub.textContent = W.been + ' of ' + W.total + ' countries. That number is on your home page from now on.';
  }
}

/* ---------- one delegated click handler for everything new ---------- */
document.addEventListener('click', async e=>{
  const t = e.target;

  /* events page */
  const ef = t.closest('[data-evfilter]');
  if (ef){ evFilter = ef.dataset.evfilter; rerender(); return; }
  const ew = t.closest('[data-evwindow]');
  if (ew){ evWindow = +ew.dataset.evwindow; rerender(); return; }

  /* bucket list */
  const bf = t.closest('[data-bkfilter]');
  if (bf){ bkFilter = bf.dataset.bkfilter; rerender(); return; }
  const bn = t.closest('[data-bknow]');
  if (bn){ bkNowOnly = !bkNowOnly; rerender(); return; }

  /* phrasebook and translator speech — only ever on a press, and a
     refusal to speak is reported rather than swallowed */
  const say = t.closest('[data-say]');
  if (say){
    const r = trSpeak(say.dataset.say, say.dataset.saylang || trTo);
    if (r !== true){ trNote = r; rerender(); }
    return;
  }
  const tsay = t.closest('[data-trsay]');
  if (tsay){
    const r = trSpeak(trOut, trTo);
    if (r !== true){ trNote = r; rerender(); }
    return;
  }
  const tcopy = t.closest('[data-trcopy]');
  if (tcopy){
    try { await navigator.clipboard.writeText(trOut); tcopy.textContent = 'COPIED'; }
    catch(err){ tcopy.textContent = 'COPY FAILED'; }
    setTimeout(()=>{ if (tcopy) tcopy.textContent = 'COPY'; }, 1400);
    return;
  }

  /* translate */
  const tgo = t.closest('[data-trgo]');
  if (tgo){
    const box = document.querySelector('[data-trin]');
    if (box) trText = box.value;
    if (!trText.trim()){ trNote = 'Type something first.'; rerender(); return; }
    trBusy = true; trNote = ''; rerender();
    const r = await trTranslate(trText, trFrom, trTo);
    trBusy = false; trOut = r.text || ''; trNote = r.note || '';
    rerender();
    /* Deliberately silent. Translating gives you the text; hearing it is
       a separate press of HEAR IT, because a phone that reads every
       translation out loud by itself is unusable in a quiet room. */
    return;
  }

  /* microphone */
  const mic = t.closest('[data-trmic]');
  if (mic){
    if (!TR_CAN_LISTEN) return;
    if (mic.classList.contains('on')){ trListenStop(); mic.classList.remove('on'); return; }
    mic.classList.add('on');
    const box = document.querySelector('[data-trin]');
    trListen(trFrom, ev=>{
      if (ev.type === 'partial' && box) box.value = ev.text;
      else if (ev.type === 'final'){
        trText = ev.text; trHeard = ev.text;
        if (box) box.value = ev.text;
        const go = document.querySelector('[data-trgo]');
        if (go) go.click();
      } else if (ev.type === 'error'){
        trNote = ev.message; mic.classList.remove('on'); rerender();
      } else if (ev.type === 'end'){ mic.classList.remove('on'); }
    });
    return;
  }

  /* planner */
  const pb = t.closest('[data-plbudget]');
  if (pb){ plBudget = pb.value; rerender(); return; }
  const pgo = t.closest('[data-plgo]');
  if (pgo){
    const sel = document.querySelector('[data-pldest]');
    const dn = document.querySelector('[data-pldays]');
    const tn = document.querySelector('[data-pltotal]');
    if (sel) plDest = sel.value;
    if (dn) plDays = dn.value;
    if (tn) plTotal = tn.value;
    if (!plDest){ plMsg = 'Choose somewhere to go first.'; rerender(); return; }
    const [kind, key] = plDest.split(':');
    const obj = kind === 'country' ? CO_BY_SLUG[key] : CITY_BY_KEY[key];
    if (!obj){ plMsg = 'That place is not in the atlas.'; rerender(); return; }
    plMsg = ''; plBusy = true; rerender();
    plResult = await planTrip({dest:{kind, obj}, days:plDays, budget:plBudget, total:plTotal, start:new Date()});
    plBusy = false; rerender();
    return;
  }
  const pclr = t.closest('[data-plclear]');
  if (pclr){ plResult = null; plMsg = ''; rerender(); return; }
  const pcsv = t.closest('[data-plcsv]');
  if (pcsv && plResult){
    const rows = [['Day','Date','Slot','Kind','What','Where','Note']];
    plResult.days.forEach(d=>d.blocks.forEach(b=>rows.push(
      [d.label, d.dateLabel, b.time, b.kind, b.title, b.where || '', (b.note||'').replace(/\s+/g,' ')])));
    vdl('meridian-' + plResult.where.toLowerCase().replace(/[^a-z0-9]+/g,'-') + '-itinerary.csv', csvOf(rows));
    return;
  }

  /* onboarding */
  const ot = t.closest('[data-obtab]');
  if (ot){ obTab = ot.dataset.obtab; rerender(); return; }
  const op = t.closest('[data-obpick]');
  if (op){
    const id = op.dataset.obpick;
    setStatus(id, statusOf(id) === obTab ? 'none' : obTab);
    const now = statusOf(id);
    op.className = 'pick' + (now !== 'none' ? ' on ' + now : '');
    obCount();
    return;
  }
  const od = t.closest('[data-obdone]');
  if (od){ PREFS.onboarded = true; savePrefs(); return; }
});
