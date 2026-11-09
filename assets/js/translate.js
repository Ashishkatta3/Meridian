/* ===========================================================
   TRANSLATE — type it or say it, in the language of where you are.

   Three separate capabilities, and they fail independently so that
   losing one never takes the panel down with it:

   1. TEXT      MyMemory's public endpoint. Free, no key, CORS open,
                and rate-limited per IP rather than per account, which
                is why there is a cache in front of it. If it refuses,
                the panel says so and the phrasebook in local.js is
                still sitting right there on the page.

   2. SPEAKING  SpeechSynthesis. Works in every current browser. The
                voice list loads asynchronously and is empty on the
                first call in some browsers, which is handled below.

   3. LISTENING  SpeechRecognition. Chrome, Edge and Safari only —
                Firefox has never shipped it. So the microphone is a
                progressive enhancement: if the browser cannot do it,
                the button is never drawn, rather than drawn and broken.
                On a phone it needs HTTPS and a permission grant.

   Language keys are ISO 639-1, the same keys local.js already uses for
   the phrasebook, so a country page knows its own language for free.
   =========================================================== */

/* code -> [English name, endonym, speech tag, rtl] */
const TR_LANG = {
  en:['English','English','en-US',0],
  es:['Spanish','Español','es-ES',0],
  fr:['French','Français','fr-FR',0],
  de:['German','Deutsch','de-DE',0],
  it:['Italian','Italiano','it-IT',0],
  pt:['Portuguese','Português','pt-PT',0],
  nl:['Dutch','Nederlands','nl-NL',0],
  sv:['Swedish','Svenska','sv-SE',0],
  no:['Norwegian','Norsk','nb-NO',0],
  da:['Danish','Dansk','da-DK',0],
  fi:['Finnish','Suomi','fi-FI',0],
  is:['Icelandic','Íslenska','is-IS',0],
  pl:['Polish','Polski','pl-PL',0],
  cs:['Czech','Čeština','cs-CZ',0],
  sk:['Slovak','Slovenčina','sk-SK',0],
  hu:['Hungarian','Magyar','hu-HU',0],
  ro:['Romanian','Română','ro-RO',0],
  hr:['Croatian','Hrvatski','hr-HR',0],
  sr:['Serbian','Српски','sr-RS',0],
  sl:['Slovenian','Slovenščina','sl-SI',0],
  bg:['Bulgarian','Български','bg-BG',0],
  mk:['Macedonian','Македонски','mk-MK',0],
  sq:['Albanian','Shqip','sq-AL',0],
  el:['Greek','Ελληνικά','el-GR',0],
  uk:['Ukrainian','Українська','uk-UA',0],
  et:['Estonian','Eesti','et-EE',0],
  lv:['Latvian','Latviešu','lv-LV',0],
  lt:['Lithuanian','Lietuvių','lt-LT',0],
  tr:['Turkish','Türkçe','tr-TR',0],
  ru:['Russian','Русский','ru-RU',0],
  ka:['Georgian','ქართული','ka-GE',0],
  hy:['Armenian','Հայերեն','hy-AM',0],
  az:['Azerbaijani','Azərbaycan','az-AZ',0],
  kk:['Kazakh','Қазақ','kk-KZ',0],
  uz:['Uzbek','Oʻzbek','uz-UZ',0],
  ar:['Arabic','العربية','ar-SA',1],
  he:['Hebrew','עברית','he-IL',1],
  fa:['Persian','فارسی','fa-IR',1],
  ur:['Urdu','اردو','ur-PK',1],
  hi:['Hindi','हिन्दी','hi-IN',0],
  bn:['Bengali','বাংলা','bn-BD',0],
  ne:['Nepali','नेपाली','ne-NP',0],
  si:['Sinhala','සිංහල','si-LK',0],
  th:['Thai','ไทย','th-TH',0],
  vi:['Vietnamese','Tiếng Việt','vi-VN',0],
  km:['Khmer','ខ្មែរ','km-KH',0],
  lo:['Lao','ລາວ','lo-LA',0],
  my:['Burmese','မြန်မာ','my-MM',0],
  ms:['Malay','Bahasa Melayu','ms-MY',0],
  id:['Indonesian','Bahasa Indonesia','id-ID',0],
  tl:['Filipino','Filipino','fil-PH',0],
  zh:['Chinese','中文','zh-CN',0],
  ja:['Japanese','日本語','ja-JP',0],
  ko:['Korean','한국어','ko-KR',0],
  mn:['Mongolian','Монгол','mn-MN',0],
  sw:['Swahili','Kiswahili','sw-KE',0],
  am:['Amharic','አማርኛ','am-ET',0],
  so:['Somali','Soomaali','so-SO',0],
  af:['Afrikaans','Afrikaans','af-ZA',0],
  mg:['Malagasy','Malagasy','mg-MG',0]
};

/* The ones that go at the top of the picker, because they cover most
   of where most people go. */
const TR_MAJOR = ['es','fr','de','it','pt','zh','ja','ko','ar','hi','ru','th','vi','tr','id','nl','pl','el','he','sv'];

const trName   = c => (TR_LANG[c] || [c])[0];
const trNative = c => (TR_LANG[c] || ['', c])[1];
const trTag    = c => (TR_LANG[c] || ['','','en-US'])[2];
const trRTL    = c => !!(TR_LANG[c] || [])[3];
const trKnown  = c => !!TR_LANG[c];

/* Languages in picker order: the major ones first, then the rest
   alphabetically by English name. */
function trList(){
  const major = TR_MAJOR.filter(trKnown);
  const rest  = Object.keys(TR_LANG)
    .filter(c => c !== 'en' && major.indexOf(c) < 0)
    .sort((a,b)=>trName(a).localeCompare(trName(b)));
  return {major, rest};
}

/* The language of a country, from the phrasebook table, so opening
   Japan preselects Japanese without anyone choosing it. */
function trLangOf(countrySlug){
  const c = (typeof SPEAKS !== 'undefined' && SPEAKS[countrySlug]) || '';
  return trKnown(c) && c !== 'en' ? c : '';
}

/* ---------- 1. text ---------- */
const TR_CACHE = {};
const trKey = (t,f,to) => f + '>' + to + '|' + t.trim().toLowerCase();

try {
  const saved = sessionStorage.getItem('meridian-tr');
  if (saved) Object.assign(TR_CACHE, JSON.parse(saved));
} catch(e){}

function trRemember(k, v){
  TR_CACHE[k] = v;
  try {
    const keys = Object.keys(TR_CACHE);
    if (keys.length > 400) keys.slice(0, 100).forEach(x=>delete TR_CACHE[x]);
    sessionStorage.setItem('meridian-tr', JSON.stringify(TR_CACHE));
  } catch(e){}
}

/* Resolves to {text, cached, note}. Never rejects: a failed
   translation is a message on the page, not an exception. */
async function trTranslate(text, from, to){
  const t = String(text || '').trim();
  if (!t) return {text:'', note:''};
  if (from === to) return {text:t, note:'Same language — nothing to translate.'};
  const k = trKey(t, from, to);
  if (TR_CACHE[k]) return {text:TR_CACHE[k], cached:true, note:''};

  const url = 'https://api.mymemory.translated.net/get?q=' + encodeURIComponent(t)
    + '&langpair=' + encodeURIComponent(from + '|' + to)
    + '&de=meridian@localhost';
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error('http ' + r.status);
    const j = await r.json();
    const out = j && j.responseData && j.responseData.translatedText;
    if (!out) throw new Error('empty');
    /* MyMemory returns its quota message in the translation field */
    if (/MYMEMORY WARNING|QUERY LENGTH LIMIT/i.test(out))
      return {text:'', note:'The free translation quota for this network is used up for today. The phrasebook below still works.'};
    const clean = String(out)
      .replace(/&quot;/g,'"').replace(/&#39;/g,"'")
      .replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>');
    trRemember(k, clean);
    return {text:clean, note:''};
  } catch(e){
    return {text:'', note:'Could not reach the translation service. Check your connection and try again.'};
  }
}

/* ---------- 2. speaking ---------- */
const TR_CAN_SPEAK = typeof window !== 'undefined'
  && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';

/* Voices load asynchronously; the first call often sees an empty list. */
let TR_VOICES = [];
function trLoadVoices(){
  if (!TR_CAN_SPEAK) return;
  try { TR_VOICES = window.speechSynthesis.getVoices() || []; } catch(e){ TR_VOICES = []; }
}
if (TR_CAN_SPEAK){
  trLoadVoices();
  try { window.speechSynthesis.onvoiceschanged = trLoadVoices; } catch(e){}
}

/* Does this device actually have a voice for the language? Saying a
   Thai sentence in an English voice is worse than not offering it. */
function trHasVoice(code){
  if (!TR_CAN_SPEAK) return false;
  if (!TR_VOICES.length) trLoadVoices();
  if (!TR_VOICES.length) return true;      // unknown yet — let them try
  const want = trTag(code).toLowerCase().slice(0,2);
  return TR_VOICES.some(v=>String(v.lang||'').toLowerCase().slice(0,2) === want);
}

function trSpeak(text, code){
  if (!TR_CAN_SPEAK || !text) return false;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(String(text));
    const tag = trTag(code);
    u.lang = tag;
    if (!TR_VOICES.length) trLoadVoices();
    const two = tag.toLowerCase().slice(0,2);
    const v = TR_VOICES.find(x=>String(x.lang||'').toLowerCase() === tag.toLowerCase())
           || TR_VOICES.find(x=>String(x.lang||'').toLowerCase().slice(0,2) === two);
    if (v) u.voice = v;
    u.rate = 0.92;                 // a shade slow, because it is being copied
    window.speechSynthesis.speak(u);
    return true;
  } catch(e){ return false; }
}

const trStopSpeaking = () => { try { window.speechSynthesis.cancel(); } catch(e){} };

/* ---------- 3. listening ---------- */
const TR_SR = typeof window !== 'undefined'
  && (window.SpeechRecognition || window.webkitSpeechRecognition);
const TR_CAN_LISTEN = !!TR_SR;

let TR_REC = null;

/* Start listening. onEvent is called with:
     {type:'partial', text}   as you speak
     {type:'final',   text}   when it settles
     {type:'end'}             always, once
     {type:'error', message}  instead of final
   Returns a function that stops it, or null if unsupported. */
function trListen(code, onEvent){
  if (!TR_CAN_LISTEN) return null;
  trListenStop();
  let rec;
  try { rec = new TR_SR(); } catch(e){ return null; }
  rec.lang = trTag(code);
  rec.interimResults = true;
  rec.continuous = false;
  rec.maxAlternatives = 1;

  let settled = false;
  rec.onresult = ev => {
    let partial = '', final = '';
    for (let i = ev.resultIndex; i < ev.results.length; i++){
      const r = ev.results[i];
      if (r.isFinal) final += r[0].transcript; else partial += r[0].transcript;
    }
    if (final.trim()){ settled = true; onEvent({type:'final', text:final.trim()}); }
    else if (partial.trim()) onEvent({type:'partial', text:partial.trim()});
  };
  rec.onerror = ev => {
    settled = true;
    const m = ev && ev.error;
    onEvent({type:'error', message:
      m === 'not-allowed' || m === 'service-not-allowed'
        ? 'Microphone permission was refused. Allow it in the address bar and try again.'
      : m === 'no-speech' ? 'Nothing was heard. Try again, closer to the microphone.'
      : m === 'network' ? 'Speech recognition needs a connection and could not reach the service.'
      : 'The microphone could not be used just now.'});
  };
  rec.onend = () => { TR_REC = null; onEvent({type:'end', settled}); };

  try { rec.start(); } catch(e){ return null; }
  TR_REC = rec;
  return trListenStop;
}

function trListenStop(){
  if (!TR_REC) return;
  try { TR_REC.stop(); } catch(e){}
  TR_REC = null;
}
