/* ===========================================================
   PLAN — ask three questions, get a real itinerary.

   This builds a day-by-day plan out of what the atlas already knows:
   the attractions in cities.js, the parks in parks.js, the written
   highlights in profile.js, the activities in bucket.js, the events in
   events.js and the month-by-month climate in climate.js.

   It is deliberately NOT a language model. Everything it says is
   traceable to a row in this repository, which means it cannot invent a
   museum that closed in 2019 or a festival that does not exist. The
   trade-off is that it only knows places the atlas covers, and it says
   so when it runs short.

   ---------------------------------------------------------
   UPGRADING THIS TO A REAL AI PLANNER

   Do not put an API key in this file. Anything here is readable by
   anyone who opens the page, and a leaked key is billed to you.

   The shape to aim for is:

     1. Deploy a Supabase Edge Function that holds the key as a secret
        and takes {dest, days, budget, month} as its body.
     2. Have it call the model with planContext() below as grounding,
        so the model is working from this atlas rather than from memory.
     3. Replace the body of planTrip() with a fetch to that function,
        and keep buildPlan() as the fallback for when it is unreachable.

   planContext() exists for exactly that purpose: it returns everything
   the atlas knows about a destination as plain text, ready to drop into
   a prompt. Nothing else in the site calls it yet.
   =========================================================== */

/* Roughly what a mid-range day costs, per person, excluding flights.
   Three bands is all that can be defended without a live price feed;
   anything more precise would be a guess dressed as a number. */
const PLAN_BAND = {
  1:['Inexpensive','$40–70 a day'],
  2:['Moderate','$80–150 a day'],
  3:['Expensive','$170–300 a day']
};

/* Country -> band. Anything unlisted is treated as moderate. */
const PLAN_COST = {
  3:['united-states','canada','united-kingdom','ireland','france','germany','netherlands','belgium',
     'luxembourg','switzerland','austria','denmark','sweden','norway','finland','iceland','italy',
     'japan','south-korea','singapore','australia','new-zealand','israel','united-arab-emirates',
     'qatar','kuwait','bahrain','monaco','bermuda','french-polynesia','new-caledonia','greenland',
     'maldives','seychelles','barbados','aruba','saint-lucia','antigua-and-barbuda','curacao'],
  1:['india','nepal','bangladesh','pakistan','sri-lanka','bhutan','vietnam','cambodia','laos',
     'myanmar','indonesia','philippines','thailand','mongolia','uzbekistan','kyrgyzstan','tajikistan',
     'turkmenistan','kazakhstan','egypt','morocco','tunisia','algeria','ethiopia','kenya','tanzania',
     'uganda','rwanda','burundi','malawi','mozambique','madagascar','zambia','zimbabwe','ghana',
     'nigeria','senegal','gambia','mali','burkina-faso','benin','togo','cameroon','sudan','somalia',
     'eritrea','djibouti','bolivia','peru','ecuador','colombia','paraguay','guatemala','honduras',
     'el-salvador','nicaragua','guyana','suriname','ukraine','moldova','albania','north-macedonia',
     'serbia','bosnia-and-herzegovina','armenia','azerbaijan','georgia','turkey','lesotho','eswatini']
};
const PLAN_BAND_OF = {};
Object.keys(PLAN_COST).forEach(b => PLAN_COST[b].forEach(s => { PLAN_BAND_OF[s] = +b; }));
const planBand = slug => PLAN_BAND_OF[slug] || 2;

/* What each budget answer changes about the plan itself. */
const PLAN_BUDGET = {
  low: {name:'Lean',      perDay:2, free:true,  bucket:0, meals:1,
        note:'Weighted towards parks, markets, walking and the things that cost nothing.'},
  mid: {name:'Comfortable',perDay:3, free:false, bucket:1, meals:1,
        note:'A paid attraction or two most days, and one sit-down meal.'},
  high:{name:'No limit',  perDay:3, free:false, bucket:2, meals:2,
        note:'Includes the guided and ticketed things, and the restaurants worth booking.'}
};

const PLAN_MON = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];

/* ===========================================================
   Gathering what the atlas knows
   =========================================================== */

/* Everything we could put in a day, for one destination.
   `dest` is {kind:'city'|'state'|'country', obj}. */
function planPool(dest){
  const sights = [], outdoors = [], food = [], activities = [];

  const pushTodo = (city) => (city.todo || []).forEach(t=>{
    const row = {title:t.title, note:t.desc, tag:t.tag || '', where:city.name,
                 href:(typeof cityHref === 'function' ? cityHref(city) : ''), free: /OUTDOORS|NEIGHBOURHOOD/.test(t.tag||'')};
    (row.free ? outdoors : sights).push(row);
  });
  const pushEat = (city) => (city.eat || []).forEach(e=>{
    food.push({title:e.name, note:e.note, tag:e.cuisine, where:city.name,
               href:(typeof cityHref === 'function' ? cityHref(city) : '')});
  });
  const pushParks = (st) => (st.statewide || []).forEach(p=>{
    outdoors.push({title:p.title, note:p.desc, tag:p.tag || '', where:st.name,
                   href:(typeof stateHref === 'function' ? stateHref(st) : ''), free:true});
  });

  if (dest.kind === 'city'){
    pushTodo(dest.obj); pushEat(dest.obj);
    if (dest.obj.state) pushParks(dest.obj.state);
  } else if (dest.kind === 'state'){
    pushParks(dest.obj);
    (dest.obj.cities || []).forEach(c=>{ pushTodo(c); pushEat(c); });
  } else {
    const co = dest.obj;
    const pr = (typeof profileOf === 'function' ? profileOf(co.slug) : {}) || {};
    (pr.p || []).forEach(sp=>sights.push({title:sp[0], note:sp[1], tag:'HIGHLIGHT', where:co.name,
      href:(typeof countryHref === 'function' ? countryHref(co) : '')}));
    if (typeof SUGGEST !== 'undefined' && SUGGEST[co.slug])
      (SUGGEST[co.slug][0] || []).forEach(r=>outdoors.push({title:r[0], note:'A region of '+co.name+' worth a day or two.',
        tag:'REGION', where:co.name, free:true,
        href:(typeof countryHref === 'function' ? countryHref(co) : '')}));
    if (co.detailed && typeof ATLAS !== 'undefined')
      ATLAS.slice(0, 8).forEach(st=>pushParks(st));
  }

  if (typeof BK !== 'undefined'){
    const slug = dest.kind === 'country' ? dest.obj.slug
      : (typeof USA !== 'undefined' ? USA.slug : 'united-states');
    bkByCountry(slug).forEach(b=>activities.push({
      title:b.name, note:b.blurb, tag:BK_CAT[b.cat] ? BK_CAT[b.cat][0] : '', where:b.place,
      href:'#/bucket', bucket:true, season:bkSeason(b), m1:b.m1, m2:b.m2, allYear:b.allYear, wraps:b.wraps}));
  }
  return {sights, outdoors, food, activities};
}

/* The events that will actually be on while they are there. */
function planEvents(dest, start, days){
  if (typeof EV === 'undefined') return [];
  const scopes = dest.kind === 'country'
    ? [dest.obj.slug].concat(dest.obj.detailed ? EV.filter(e=>e.scope.indexOf('us:')===0).map(e=>e.scope) : [])
    : dest.kind === 'state' ? ['us:' + dest.obj.abbr]
    : ['us:' + (dest.obj.state ? dest.obj.state.abbr : ''), dest.obj.key];
  const want = new Set(scopes);
  const end = new Date(start.getTime() + days * 86400000);
  return EV.filter(e=>{
    if (!want.has(e.scope) && !want.has(e.ck)) return false;
    const n = evNext(e, start);
    return n.live || n.start <= end;
  }).map(e=>({e, n:evNext(e, start)}))
    .sort((a,b)=>a.n.start - b.n.start)
    .slice(0, 6);
}

/* ===========================================================
   Building the days
   =========================================================== */

/* Deterministic shuffle so the same question always gives the same
   answer, but two different cities do not get the same ordering. */
function planRotate(list, seed){
  if (!list.length) return [];
  const out = list.slice();
  let h = 2166136261;
  const s = String(seed);
  for (let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  const off = Math.abs(h) % out.length;
  return out.slice(off).concat(out.slice(0, off));
}

function buildPlan(opts){
  const dest   = opts.dest;
  const days   = Math.max(1, Math.min(21, parseInt(opts.days, 10) || 5));
  const budget = PLAN_BUDGET[opts.budget] || PLAN_BUDGET.mid;
  const start  = opts.start instanceof Date ? opts.start : new Date();
  const month  = start.getMonth() + 1;

  const name = dest.kind === 'city'
    ? dest.obj.name + ', ' + (dest.obj.state ? dest.obj.state.abbr : '')
    : dest.obj.name;

  const pool = planPool(dest);
  const seed = name + '|' + days + '|' + opts.budget;

  /* Activities only if they are possible in the month being planned. */
  const inSeason = a => a.allYear ? true
    : a.wraps ? (month >= a.m1 || month <= a.m2) : (month >= a.m1 && month <= a.m2);
  const acts = planRotate(pool.activities.filter(inSeason), seed).slice(0, budget.bucket * Math.ceil(days/3));

  /* Lean trips lead with the free things; the others interleave. */
  let primary = budget.free
    ? planRotate(pool.outdoors, seed).concat(planRotate(pool.sights, seed))
    : (function(){
        const a = planRotate(pool.sights, seed), b = planRotate(pool.outdoors, seed + 'o'), out = [];
        for (let i = 0; i < Math.max(a.length, b.length); i++){ if (a[i]) out.push(a[i]); if (b[i]) out.push(b[i]); }
        return out;
      })();

  const meals = planRotate(pool.food, seed + 'f');
  const evs   = planEvents(dest, start, days);

  let pi = 0, mi = 0, ai = 0;
  const out = [];
  const shortOf = [];

  for (let d = 0; d < days; d++){
    const when = new Date(start.getTime() + d * 86400000);
    const blocks = [];

    /* an event that is live on this specific day outranks a sight */
    const todays = evs.filter(x=>{
      const s = new Date(x.n.start), e = new Date(x.n.end);
      return when >= new Date(s.getFullYear(), s.getMonth(), s.getDate())
          && when <= new Date(e.getFullYear(), e.getMonth(), e.getDate());
    });
    if (todays.length){
      const x = todays[0];
      blocks.push({time:'ON TODAY', kind:'event', title:x.e.name,
        note:x.e.blurb, tag:(EV_CAT[x.e.cat] || [''])[0], where:x.e.place});
    }

    const want = budget.perDay - (todays.length ? 1 : 0);
    for (let k = 0; k < want; k++){
      if (ai < acts.length && k === want - 1 && (d % 3 === 1)){
        const a = acts[ai++];
        blocks.push({time:'THE BIG ONE', kind:'activity', title:a.title, note:a.note,
          tag:a.tag, where:a.where, href:a.href, season:a.season});
        continue;
      }
      if (pi >= primary.length){ shortOf.push('sights'); break; }
      const p = primary[pi++];
      blocks.push({time: k === 0 ? 'MORNING' : k === 1 ? 'AFTERNOON' : 'LATE',
        kind:'sight', title:p.title, note:p.note, tag:p.tag, where:p.where, href:p.href});
    }

    for (let m = 0; m < budget.meals; m++){
      if (mi >= meals.length){ if (meals.length) mi = 0; else { shortOf.push('food'); break; } }
      const f = meals[mi++];
      blocks.push({time: m === 0 ? 'DINNER' : 'LUNCH', kind:'food', title:f.title,
        note:f.note, tag:f.tag, where:f.where, href:f.href});
    }

    out.push({n:d + 1, date:when,
      label:'Day ' + (d + 1),
      dateLabel:when.toLocaleDateString('en-US',{weekday:'short', day:'numeric', month:'short'}),
      blocks});
  }

  /* money */
  const slug = dest.kind === 'country' ? dest.obj.slug
    : (typeof USA !== 'undefined' ? USA.slug : 'united-states');
  const band = planBand(slug);
  const cur = (typeof currencyOf === 'function' ? currencyOf(slug) : null);
  const total = parseFloat(opts.total) || 0;
  const perDay = total ? Math.round(total / days) : 0;

  /* what a mid-range day costs in this band, as a midpoint, used only
     to tell them whether their own number is tight or generous */
  const mid = band === 1 ? 55 : band === 3 ? 235 : 115;
  const verdict = !perDay ? ''
    : perDay < mid * 0.6 ? 'tight for ' + name + ' — hostels, street food and free sights'
    : perDay < mid * 1.4 ? 'about right for ' + name + ' at a mid-range standard'
    : 'generous for ' + name + ', so build in the guided and ticketed things';

  const climate = (typeof seasonNow === 'function' && typeof climateOf === 'function')
    ? climateOf(dest.kind === 'city' ? dest.obj.key
      : dest.kind === 'country' ? 'country:' + dest.obj.slug : '') : null;

  const notes = [];
  if (shortOf.indexOf('sights') >= 0)
    notes.push('The atlas ran out of written attractions for ' + name + ' before day ' + days
      + '. The later days are thinner on purpose rather than padded with things nobody checked.');
  if (!pool.food.length)
    notes.push('No restaurants are written up for ' + name + ' yet, so meals are left to you.');
  if (dest.kind === 'country' && !dest.obj.detailed)
    notes.push('Country-level plans work from the written highlights. Add your own places on the '
      + name + ' page and they will be used here too.');

  return {
    where:name, days:out, events:evs, budget, month:PLAN_MON[start.getMonth()],
    money:{band, bandName:PLAN_BAND[band][0], bandRange:PLAN_BAND[band][1],
           currency:cur, total, perDay, verdict},
    climate, notes, dest
  };
}

/* ===========================================================
   TEMPORARY in-browser AI planner.

   ⚠️  THE KEY BELOW IS VISIBLE TO ANYONE WHO OPENS THE PAGE.
   This is fine ONLY because:
     - the site is private and link-shared, not public, and
     - the free OpenRouter key's worst case is a used-up daily quota,
       not a bill.
   Do NOT paste a paid xAI or Groq key here — that is real money anyone
   with the link could spend. Move to the Edge Function (see top of
   file) before the site goes public, and delete this key.

   Why OpenRouter and not Groq or xAI here:
     - Groq is free but BLOCKS browser calls (CORS), so it cannot be
       reached from a page without a backend proxy.
     - xAI Grok allows browser calls but has no free tier.
     - OpenRouter allows browser calls AND has free models — the only
       one that works from the browser for free. All three speak the
       same OpenAI-style API, so switching later is a 3-line change.
   =========================================================== */
const AI = {
  on:    true,                                             // flip to false to force the built-in planner
  url:   'https://openrouter.ai/api/v1/chat/completions',
  model: 'meta-llama/llama-3.3-70b-instruct:free',         // free; see openrouter.ai/models (the ":free" ones)
  key:   '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',                                               // ← paste your OpenRouter key: openrouter.ai/keys
  // --- to use xAI Grok instead (PAID, needs card + credits at console.x.ai) ---
  //   url:'https://api.x.ai/v1/chat/completions', model:'grok-3', key:'xai-...'
  // --- Groq works only once you move to the Edge Function (browser-blocked) ---
  //   url:'https://api.groq.com/openai/v1/chat/completions', model:'llama-3.3-70b-versatile'
};

/* Ask the model for the day-by-day blocks, grounded in the atlas.
   Returns an array of { blocks:[...] } per day, or null on any failure
   so the caller falls back to the deterministic plan. */
async function planAI(opts){
  if (!AI.on || !AI.key) return null;
  const dest   = opts.dest;
  const days   = Math.max(1, Math.min(21, parseInt(opts.days, 10) || 5));
  const budget = PLAN_BUDGET[opts.budget] || PLAN_BUDGET.mid;
  const start  = opts.start instanceof Date ? opts.start : new Date();
  const name   = dest.obj.name;

  const sys = 'You are a travel planner. Build a day-by-day itinerary. '
    + 'PREFER the places listed under GROUNDING below — they are verified. '
    + 'You may add well-known places not listed, but for any place NOT in the '
    + 'grounding, set its "href" to '
    + '"https://www.google.com/maps/search/?api=1&query=" + the place name and city, '
    + 'url-encoded, so it can be checked. Never invent opening hours or prices. '
    + 'Reply with ONLY valid JSON, no markdown, in exactly this shape: '
    + '{"days":[{"blocks":[{"time":"MORNING","kind":"sight","title":"","note":"",'
    + '"tag":"","where":"","href":""}]}]}. '
    + '"kind" is one of: sight, food, activity, event. "time" is a short label '
    + 'like MORNING, AFTERNOON, EVENING, DINNER. Keep "note" to one sentence.';

  const user = 'DESTINATION: ' + name + '\n'
    + 'DAYS: ' + days + '\n'
    + 'MONTH: ' + PLAN_MON[start.getMonth()] + '\n'
    + 'BUDGET: ' + budget.name + ' — ' + budget.note + '\n'
    + 'Give exactly ' + days + ' day objects.\n\n'
    + 'GROUNDING:\n' + planContext(dest);

  /* fall back rather than hang if the network is slow */
  const ctrl = new AbortController();
  const timer = setTimeout(()=>ctrl.abort(), 28000);
  try {
    const r = await fetch(AI.url, {
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'Authorization':'Bearer ' + AI.key,
        /* OpenRouter likes these two; harmless elsewhere */
        'HTTP-Referer':'https://meridian.local',
        'X-Title':'Meridian'
      },
      body: JSON.stringify({
        model: AI.model,
        temperature: 0.7,
        max_tokens: 2200,
        messages:[{role:'system', content:sys}, {role:'user', content:user}]
      }),
      signal: ctrl.signal
    });
    clearTimeout(timer);
    if (!r.ok) return null;
    const j = await r.json();
    let text = j && j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
    if (!text) return null;

    /* models sometimes wrap JSON in prose or ```json fences — dig it out */
    let data;
    try { data = JSON.parse(text); }
    catch(e){
      const a = text.indexOf('{'), b = text.lastIndexOf('}');
      if (a < 0 || b < 0) return null;
      try { data = JSON.parse(text.slice(a, b + 1)); } catch(e2){ return null; }
    }
    if (!data || !Array.isArray(data.days) || !data.days.length) return null;

    /* keep only the fields the renderer uses, and only valid kinds */
    const kinds = {sight:1, food:1, activity:1, event:1};
    return data.days.map(d=>({
      blocks: (Array.isArray(d.blocks) ? d.blocks : [])
        .filter(x=>x && x.title)
        .map(x=>({
          time:  String(x.time || '').slice(0, 24) || 'LATER',
          kind:  kinds[x.kind] ? x.kind : 'sight',
          title: String(x.title).slice(0, 120),
          note:  String(x.note || '').slice(0, 300),
          tag:   String(x.tag || '').slice(0, 40),
          where: String(x.where || ''),
          href:  /^https?:\/\//.test(x.href || '') || String(x.href||'').indexOf('#/') === 0 ? x.href : ''
        }))
    }));
  } catch(e){ clearTimeout(timer); return null; }
}

/* The public entry point. Builds the deterministic plan first — it carries
   the dates, money, climate, events and notes — then, if the model answers,
   swaps its richer blocks in day by day. If the model is off, keyless, slow
   or fails, you simply get the deterministic plan. Nothing else changes. */
async function planTrip(opts){
  const base = buildPlan(opts);
  const ai = await planAI(opts);
  if (ai){
    base.days.forEach((day, i)=>{ if (ai[i] && ai[i].blocks && ai[i].blocks.length) day.blocks = ai[i].blocks; });
    base.ai = true;
  } else {
    base.ai = false;
  }
  return base;
}

/* ===========================================================
   Grounding text for a future AI planner. Unused by the site today.
   =========================================================== */
function planContext(dest){
  const p = planPool(dest);
  const name = dest.obj.name;
  const line = r => '- ' + r.title + (r.tag ? ' ['+r.tag+']' : '') + ': ' + (r.note || '');
  const out = ['DESTINATION: ' + name];
  const slug = dest.kind === 'country' ? dest.obj.slug : (typeof USA !== 'undefined' ? USA.slug : '');
  out.push('COST BAND: ' + PLAN_BAND[planBand(slug)][0] + ' (' + PLAN_BAND[planBand(slug)][1] + ')');
  if (p.sights.length)     out.push('\nSIGHTS:\n'     + p.sights.map(line).join('\n'));
  if (p.outdoors.length)   out.push('\nOUTDOORS:\n'   + p.outdoors.map(line).join('\n'));
  if (p.food.length)       out.push('\nFOOD:\n'       + p.food.map(line).join('\n'));
  if (p.activities.length) out.push('\nACTIVITIES:\n' + p.activities.map(line).join('\n'));
  const evs = planEvents(dest, new Date(), 365);
  if (evs.length) out.push('\nEVENTS:\n' + evs.map(x=>'- ' + x.e.name + ' (' + evWhen(x.e, x.n) + '): ' + x.e.blurb).join('\n'));
  return out.join('\n');
}
