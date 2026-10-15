/* ===========================================================
   CLOUD — accounts, and a journal that follows you between devices.

   Everything here is optional. With no Supabase keys in config.js the
   whole module stays dormant and the site behaves exactly as it did
   before: local browser storage, no accounts, nothing leaves the page.

   The sync model is deliberately simple. Your journal is one JSON
   document. Signing in pulls it; every change pushes it back, debounced.
   One row, one writer, so there is no half-saved state to reason about.
   =========================================================== */
const CLOUD = {
  on: false,          // keys present and client loaded
  sb: null,           // the supabase client
  user: null,         // the signed-in user
  admin: false,
  state: 'off',       // off | out | in | syncing | error
  note: ''
};

const cfg = (window.MERIDIAN_CONFIG || {});
const CLOUD_READY = (async function initCloud(){
  if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) return false;
  try {
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    CLOUD.sb = createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true }
    });
    CLOUD.on = true;
    CLOUD.state = 'out';
    const { data } = await CLOUD.sb.auth.getSession();
    if (data && data.session) await cloudOnSignIn(data.session.user);
    CLOUD.sb.auth.onAuthStateChange((evt, session)=>{
      if (evt === 'SIGNED_OUT'){ CLOUD.user = null; CLOUD.admin = false; CLOUD.state = 'out'; safeRender(); }
    });
    return true;
  } catch (e) {
    CLOUD.state = 'error';
    CLOUD.note = 'Could not reach Supabase. Check the URL and key in config.js.';
    return false;
  }
})();

const safeRender = () => { try { if (typeof route === 'function') route(); } catch(e){} };

async function cloudOnSignIn(user){
  CLOUD.user = user;
  CLOUD.state = 'syncing';
  safeRender();
  try {
    const { data } = await CLOUD.sb.from('profiles').select('is_admin, display_name').eq('id', user.id).maybeSingle();
    CLOUD.admin = !!(data && data.is_admin);
    CLOUD.name = (data && data.display_name) || user.email;
  } catch(e){ CLOUD.admin = false; }
  await cloudPull();
  await guidePull();
  CLOUD.state = 'in';
  safeRender();
}

/* ---------- auth ---------- */
async function cloudSignUp(email, password, name){
  await CLOUD_READY;
  if (!CLOUD.on) return {error:'Accounts are not configured on this copy of the site.'};
  const { data, error } = await CLOUD.sb.auth.signUp({
    email, password, options: { data: { display_name: name || email.split('@')[0] } }
  });
  if (error) return {error: error.message};
  if (!data.session) return {note:'Check your email for a confirmation link, then sign in.'};
  await cloudOnSignIn(data.session.user);
  return {ok:true};
}
async function cloudSignIn(email, password){
  await CLOUD_READY;
  if (!CLOUD.on) return {error:'Accounts are not configured on this copy of the site.'};
  const { data, error } = await CLOUD.sb.auth.signInWithPassword({ email, password });
  if (error) return {error: error.message};
  await cloudOnSignIn(data.user);
  return {ok:true};
}
async function cloudSignOut(){
  if (!CLOUD.on) return;
  await CLOUD.sb.auth.signOut();
  CLOUD.user = null; CLOUD.admin = false; CLOUD.state = 'out';
  safeRender();
}
async function cloudReset(email){
  await CLOUD_READY;
  if (!CLOUD.on) return {error:'Accounts are not configured.'};
  const { error } = await CLOUD.sb.auth.resetPasswordForEmail(email, { redirectTo: location.href });
  return error ? {error: error.message} : {note:'Password reset email sent.'};
}

/* ---------- the journal, as one document ---------- */
function journal(){
  return { v: 3, status: STATUS, added: ADDED, entries: ENTRIES, dates: DATES,
           prefs: PREFS, trips: TRIPS };
}
function loadJournal(d){
  if (!d) return;
  if (d.status)  STATUS  = d.status;
  if (d.added)   ADDED   = d.added;
  if (d.entries) ENTRIES = d.entries;
  if (d.dates)   DATES   = d.dates;
  if (d.trips)   TRIPS   = d.trips;
  if (d.prefs)   PREFS   = Object.assign(PREFS, d.prefs);
  persistAllLocal();
}
async function cloudPull(){
  if (!CLOUD.on || !CLOUD.user) return;
  try {
    const { data, error } = await CLOUD.sb.from('vault').select('data').eq('user_id', CLOUD.user.id).maybeSingle();
    if (error) throw error;
    if (data && data.data && Object.keys(data.data).length) loadJournal(data.data);
    else await cloudPush(true);     // first sign-in: seed the cloud from this browser
  } catch(e){ CLOUD.note = 'Could not load your journal: ' + (e.message || e); }
}
let pushTimer = null;
function cloudPushSoon(){
  if (!CLOUD.on || !CLOUD.user) return;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(()=>cloudPush(), 1200);
}
async function cloudPush(immediate){
  if (!CLOUD.on || !CLOUD.user) return;
  try {
    const { error } = await CLOUD.sb.from('vault')
      .upsert({ user_id: CLOUD.user.id, data: journal(), updated_at: new Date().toISOString() });
    if (error) throw error;
    CLOUD.note = '';
  } catch(e){ CLOUD.note = 'Changes are saved on this device but did not reach the cloud: ' + (e.message || e); }
}

/* ---------- photos ---------- */
async function cloudPutPhoto(id, dataURL){
  if (!CLOUD.on || !CLOUD.user) return false;
  try {
    const blob = await (await fetch(dataURL)).blob();
    const { error } = await CLOUD.sb.storage.from('photos')
      .upload(CLOUD.user.id + '/' + id + '.jpg', blob, { contentType:'image/jpeg', upsert:true });
    return !error;
  } catch(e){ return false; }
}
async function cloudGetPhoto(id){
  if (!CLOUD.on || !CLOUD.user) return null;
  try {
    const { data, error } = await CLOUD.sb.storage.from('photos').download(CLOUD.user.id + '/' + id + '.jpg');
    if (error || !data) return null;
    return await new Promise(res=>{ const fr = new FileReader(); fr.onload = ()=>res(fr.result); fr.readAsDataURL(data); });
  } catch(e){ return null; }
}
async function cloudDelPhoto(id){
  if (!CLOUD.on || !CLOUD.user) return;
  try { await CLOUD.sb.storage.from('photos').remove([CLOUD.user.id + '/' + id + '.jpg']); } catch(e){}
}

/* ---------- the shared guide, written by admins ---------- */
let GUIDE = {};
try { GUIDE = JSON.parse(localStorage.getItem('meridian-guide') || '{}'); } catch(e){ GUIDE = {}; }
async function guidePull(){
  if (!CLOUD.on) return;
  try {
    const { data, error } = await CLOUD.sb.from('guide').select('key, data');
    if (error) throw error;
    GUIDE = {};
    (data || []).forEach(r=>{ GUIDE[r.key] = r.data; });
    try { localStorage.setItem('meridian-guide', JSON.stringify(GUIDE)); } catch(e){}
  } catch(e){ /* keep whatever was cached */ }
}
async function guideSave(key, data){
  GUIDE[key] = data;
  try { localStorage.setItem('meridian-guide', JSON.stringify(GUIDE)); } catch(e){}
  if (!CLOUD.on || !CLOUD.admin) return {error:'You are not signed in as an admin, so this is saved on this device only.'};
  const { error } = await CLOUD.sb.from('guide')
    .upsert({ key, data, updated_by: CLOUD.user.id, updated_at: new Date().toISOString() });
  return error ? {error: error.message} : {ok:true};
}
async function guideClear(key){
  delete GUIDE[key];
  try { localStorage.setItem('meridian-guide', JSON.stringify(GUIDE)); } catch(e){}
  if (CLOUD.on && CLOUD.admin) await CLOUD.sb.from('guide').delete().eq('key', key);
}
