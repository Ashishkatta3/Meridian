# Meridian

A personal travel atlas. Continents → countries → states → cities, with the real
local time and current weather at every place, a theme that follows the
destination's own clock, and a **been / want to go** mark on everything.

No build step, no framework, no dependencies. Three files and a stylesheet.

---

## Two ways to run this

**Local only (default).** Clone, host, done. Everything you mark and write is
saved in that one browser. No account, no server, nothing leaves the page.

**With accounts (optional).** Add free Supabase keys and the site gains sign-in,
passwords, an admin role, and a journal that follows you to any device. Takes
about ten minutes — see *Accounts and the database* below.

---

## Put it on GitHub Pages

1. Make a new repository and upload everything in this folder (keep the structure).
2. **Settings → Pages → Source:** *Deploy from a branch*, branch `main`, folder `/ (root)`.
3. Wait a minute. It will be live at `https://<your-username>.github.io/<repo>/`.

The `.nojekyll` file is already here — it stops GitHub from ignoring folders and
is the usual reason a Pages site loads with no styling.

To run it locally, don't open `index.html` directly from the file system (browsers
block the scripts). Serve it instead:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

---

## Files

```
index.html              page shell — nav, footer, nothing else
assets/js/config.js     YOUR SUPABASE KEYS. Blank = local-only mode.
assets/js/cloud.js      accounts, sync and the admin guide. Dormant without keys.
assets/js/visa.js       generated: visa rules for 16 passports x 179 countries
assets/js/profile.js    the guide: a blurb, a season, 4 spots and trip pairings
                        for all 179 countries — 716 places in total
assets/js/climate.js    generated: twelve months of weather character for 179
                        countries, 51 states and 193 cities
assets/js/local.js      currency and language for every country, with a card of
                        phrases in 68 languages
assets/js/features.js   trips, itineraries, badges, the daylight terminator,
                        live exchange rates
supabase/schema.sql     run this once in the Supabase SQL editor
assets/css/styles.css   the whole design: tokens, light + dark, every component
assets/js/data.js       YOUR DATA. The only file you need to edit.
assets/js/world.js      generated: 179 countries, each with its capital's
                        coordinates and IANA timezone, plus ~2,700 regions and
                        ~3,200 major cities offered as click-to-add suggestions
assets/js/land.js       generated: world coastlines for the map (Natural Earth
                        1:110m, simplified — public domain)
assets/js/app.js        engine, views, router. You should not have to touch this.
build.sh                optional: bundles everything into dist/index.html as one file
.nojekyll               required by GitHub Pages
```

The two generated files come from [GeoNames](https://geonames.org) (CC BY 4.0),
the [countries-states-cities database](https://github.com/dr5hn/countries-states-cities-database)
(ODbL) and [Natural Earth](https://naturalearthdata.com) (public domain).

---

## Adding places

Everything lives in `assets/js/data.js`.

**A country** — all 179 are already there in `world.js`, each with a live clock,
sunrise and sunset, weather and a map pin. To add one that is missing, append
`[name, capital, lat, lon, timezone]` to the right continent in `WORLD`.

**A city or region in any country** — you do not edit a file for this. Open the
country page and type into **Add a place**. Known cities autocomplete and bring
their own coordinates and timezone; anything else is added at the capital's
position. Suggested regions sit below as one-click chips.

Each place you add gets a full page of its own: live clock, sunrise and sunset,
weather, a description you write, things to do, where you ate, and a CSV export.

**A city** — add it to its state's list in `STATES` as `[name, latitude, longitude]`.
A fourth item overrides the timezone for cities in a state that spans two
(Panama City, Florida is the example).

```js
["Texas","TX","America/Chicago",[
  ["Austin",30.27,-97.74],
  ["Marfa",30.31,-104.02]        // ← new
]],
```

**Things to do and restaurants** — you do not edit a file for these either. Open
any city or place page and use **+ Add a thing to do** or **+ Add a place you
ate**. Each entry takes a name, a description, a tag and as many photos as you
like, and the ↑ ↓ buttons reorder the list. EDIT and DELETE do what they say.

The lists in `TODO` and `EAT` in `data.js` are only the starting contents. The
moment you edit, reorder or add anything for a city, that city's list is copied
into your browser and your copy wins from then on — the seeds in the file are
left untouched as a fallback for a fresh browser.

Photos are shrunk to 1600px and stored in IndexedDB rather than localStorage,
which has room for a few images at most. Text entries stay in localStorage.

**Parks, falls, lakes and regions** that belong to no single city go in
`STATEWIDE`, under the state's abbreviation:
`[title, latitude, longitude, description, tag, been]`.

**Pre-marking a place as visited** — add its key to `VISITED`. This is only the
starting state; anything you click in the browser overrides it.

**Giving another country states and cities** — point `DETAILED_COUNTRY` at it and
put its regions into `STATES`. The state and city levels follow automatically.

---

## The map

The home page and `#/map` both show the whole world. **Scroll to zoom, drag to
pan, click a pin — or its name — to open that place.** Pins hold their size as you zoom.

**Day and night are drawn on it.** The shaded half is wherever the sun is
currently below the horizon, worked out from the sun's real position at the
moment the page renders — so land in daylight and land at night are different
colours, and reloading moves the line. It is computed, not fetched: no
network call, nothing to go stale.

Three views: everything, only the places you have been, or only the ones you
want to go. The toggle sits on the map itself.

Pins hold their size as you zoom. Labels are placed with
collision detection — where two names would overlap, the place you have marked
keeps its label and the unmarked one loses it — so the map stays readable at
every zoom level instead of turning into a wall of overlapping text.

Coastlines are drawn as SVG from `land.js` with a plain equirectangular
projection, so there is no tile server, no API key and no network call.

---

## Accounts and the database

Without this the site works fine — it just cannot know who you are.

1. Create a free project at [supabase.com](https://supabase.com). The free tier
   covers 50,000 monthly users, 500MB of database and 1GB of photos.
2. Open **SQL Editor → New query**, paste the whole of `supabase/schema.sql`,
   and run it. That creates the tables, the security policies and the photo bucket.
3. Copy **Project Settings → API → Project URL** and the **anon public** key into
   `assets/js/config.js`.
4. Reload the site, open **Account**, and create your account.

The anon key is designed to be public and is safe to commit. It grants nothing on
its own — the row-level security policies in the schema are what actually guard
the data, and they are enforced by Postgres, not by the JavaScript. A tampered
browser still cannot read another person's journal.

**Email confirmation** is on by default in Supabase. For a private site, turn it
off under Authentication → Providers → Email so people can sign in immediately.

### Becoming an admin

Admin cannot be granted from the browser, by design. Sign up through the site
first, then run this once in the SQL editor:

```sql
update public.profiles set is_admin = true
where id = (select id from auth.users where email = 'you@example.com');
```

An admin sees an **Edit this country as admin** button on every country page.
Edits there go to the shared `guide` table and change the site for everyone —
the blurb, the best season, and the list of well-known spots. Everyone else
reads the same guide but can only mark and write in their own journal.

### What lives where

| | |
|---|---|
| The atlas — countries, cities, coordinates, visa rules, the guide | Shipped in the JS files, same for everyone |
| Admin edits to the guide | `guide` table, shared, admin-writable |
| Your marks, dates, trips, itineraries, places, entries and notes | `vault` table, one row, yours only |
| Your photos | Storage bucket, in a folder only you can open |

Your whole journal is a single JSON document in one row. Signing in pulls it,
every change pushes it back a second later. One row and one writer means there
is no half-synced state to debug — and it is why trips and itineraries needed no
database change at all: they are new keys in the same document.

---

## Been / want to go

Every place carries a two-button control: **BEEN** and **WANT**. Click one to set
it, click it again to clear it. Nothing selected is the third state.

Marks are saved in the browser's `localStorage` under `meridian-status`, so they
are per-device and need no account or server. They drive the counts on the home
page, the colour of every map pin, the sort order of city lists, and the Status
column in the CSV export.

States, countries and continents inherit upward: a state shows as *been* when any
city or park inside it is, unless you set it yourself.

### Backing it up

**Account → Export** writes one JSON file containing every mark, date, trip,
itinerary, entry, note and photo. Import merges it back, or replaces what is there. Do this even
if you are signed in — a local file is the only backup nobody can revoke.

To wipe everything and start over, run this in the browser console:

```js
localStorage.removeItem('meridian-status');    // been / want marks
localStorage.removeItem('meridian-added');     // places you added
localStorage.removeItem('meridian-entries');   // your entries and notes
indexedDB.deleteDatabase('meridian-photos');   // your photos
location.reload();
```

---

## Trip planning

Every country page answers the three questions you actually ask before booking:

**How far is it** — a nonstop-equivalent flight time from your home city,
calculated great-circle from its coordinates. Set your home city in Account.

**Do I need a visa** — the requirement for your passport, from the
[passport-index dataset](https://github.com/ilyankou/passport-index-dataset),
covering 16 common passports. It gives you the *category* — visa free, visa on
arrival, eVisa, travel authorisation or full visa — plus what that category
usually involves, and a link to find the official portal.

This is deliberately a category and not a processing time. Those change
constantly and country by country; a number here would be wrong within months
and could cost someone a trip. Check the official source before you book.

**When to go** — the best months, and which countries combine well with it on
one trip, with the distance between them.

---

## The year, month by month

Every country, state and city page carries a twelve-month strip. Each month is
coloured by how warm it usually is and carries a mark for rain or snow, so the
shape of the year is visible at a glance: where the wet season sits, which
months bring snow, when the heat becomes the point. Click any month to read it
in full. The months that are easiest to travel in are dotted, and the strip says
which they are.

**Two kinds of row, and the site always tells you which you are looking at.**

**Measured** — 88 of them. Real recorded monthly averages for a named weather
station, from the [Climate JSON dataset](https://github.com/michaelx/climate),
built on historical observations. These show actual degrees, because they are
actual degrees. Tokyo, Paris, Bangkok, 29 US cities and 42 countries in all.

**Estimated** — the remaining 335. There is no station, so the row is modelled:
the real [Köppen–Geiger climate class](https://www.npmjs.com/package/koppen-climate-lookup)
at that coordinate (a half-degree global grid) plus latitude, elevation and
distance to the coast, calibrated against the 105 measured cities and then
constrained to satisfy the definition of its own Köppen class. Typical error is
about 3°C on a monthly high, and worse for a few awkward climates — deep
continental interiors, tropical high altitude.

So estimated rows show **bands** — cold, mild, hot, rainy, snowy — and never a
specific temperature. A modelled number dressed up as a measurement is worse
than no number, and three degrees is the difference between a band being right
and a reading being wrong. The same reasoning as the visa categories further
down: say what is known, at the precision it is actually known to.

Country cards and pages also pick up a tint from the season that country is in
right now — hemisphere-aware, and in the tropics reporting the wet or dry season
instead, because that is the distinction that matters there.

---

## Trips

Marking forty places as *been* gives you a list of forty things. The **Trips**
page gathers them back into the journeys they belonged to.

Anything you marked been and gave a month to is grouped by when you went: same
month, or neighbouring months if the places are close enough that you plausibly
went straight on. February in Iceland and March in Texas stay separate; a run
from late September in Italy into early October in Spain stays one trip, where
grouping by calendar month alone would have torn it in half.

Confirm a suggestion and it becomes a trip you can rename, write up, and plan
day by day: days, stops in order, and a time of day on each stop if you want one
— optional, because some days you just wandered.

**Export** writes the itinerary as a document. It opens in Word, Pages or Google
Docs and prints to PDF.

---

## The board

One badge for every place you have been — countries, states, cities, parks.

Each badge is drawn from the place's own name: the name decides the palette, the
motif and the rim, so the same place always produces the same badge and no two
places produce the same one. Nothing is downloaded; they are SVG, generated in
the browser.

Any badge can be shared or saved as an image, and **Share the whole board**
renders the full shelf — every badge, with your counts — as a single picture.
On a phone that opens the normal share sheet; elsewhere it saves a PNG.

---

## Money and language

Every country page shows which currency the place uses and what one unit of it
is worth in the money you actually live on. Rates are fetched once when the page
loads, from a free keyless source ([open.er-api.com](https://open.er-api.com),
falling back to [Frankfurter](https://www.frankfurter.app)). If both are
unreachable the line says so and everything else carries on.

Countries where English is not an official or near-universal working language
get a card of ten phrases in the local language — hello, please, thank you, yes
and no, excuse me, do you speak English, how much, where is the toilet, I don't
understand, help. The polite form in each case, the one that is never wrong with
a stranger, with a pronunciation line for every non-Latin script. 68 languages.

---

## Where you are from, and where you live

Three separate settings in **Account**, because for plenty of people they are
three different answers:

| | |
|---|---|
| **Passport** | decides the visa requirement on every country page |
| **Home country** | where you are from. Follows the passport unless you set it |
| **Living in** | where you are based now, which decides the money prices convert into. Follows the city you fly from unless you set it |

---

## Clocks, sun and weather

**Clocks** use the browser's own `Intl` with each place's IANA timezone. No
network. Every country runs one off its capital, so Japan shows Tokyo's time and
Kenya shows Nairobi's.

**Sunrise and sunset** are computed from latitude and longitude with the NOAA
sunrise equation, in `app.js`. No network, and correct year-round — this is what
decides whether a page loads light or dark.

**Weather** comes from [Open-Meteo](https://open-meteo.com) — free, no API key, no
account. It is a single `fetch` in `app.js`, batched so one request covers every
place on the page. If it is blocked or you are offline,
the sky indicator falls back to the sun or moon glyph with a dash instead of a
temperature, and everything else keeps working.

To switch to Celsius, change `temperature_unit=fahrenheit` to `celsius` in
`loadWeather()` and the `°F` labels nearby.

---

## The map export

Every city page, every state page and the home page offer a CSV. Import it into
Google My Maps with **Create a new map → Import**, choose the *Location* column
to place the pins and the *Status* or *Category* column to colour them. Google
geocodes from the Location text, so attractions land on the right building rather
than all stacking on the city centre.

---

## Theme

Pages follow the local clock of the place you are looking at — a city or country
page opens dark when it is night there. Anywhere a list shows several places at
once, the ones where the sun has already set are dimmed. The **AUTO / LIGHT / DARK** control in the header
overrides it and the choice is remembered.

All colours are CSS custom properties at the top of `styles.css`, defined once for
light and once for `html[data-theme="dark"]`. Change them in one place.

---

## Credits

Typefaces: Instrument Serif, Space Grotesk and JetBrains Mono, via Google Fonts.

Data: live weather from [Open-Meteo](https://open-meteo.com); exchange rates
from [open.er-api.com](https://open.er-api.com) with
[Frankfurter](https://www.frankfurter.app) as a fallback; visa requirements from
the [passport-index dataset](https://github.com/ilyankou/passport-index-dataset)
(CC BY-SA 4.0); measured climate from
[Climate JSON](https://github.com/michaelx/climate); Köppen–Geiger climate
classes from [koppen-climate-lookup](https://www.npmjs.com/package/koppen-climate-lookup);
capital elevations from Wikipedia; places and coordinates from
[GeoNames](https://geonames.org), the
[countries-states-cities database](https://github.com/dr5hn/countries-states-cities-database)
and [Natural Earth](https://naturalearthdata.com).

Everything else — the climate model, the daylight terminator, the badges, the
trip grouping — is computed in the browser, hand-written and dependency-free.
