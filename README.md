# Meridian

A personal travel atlas. Continents → countries → states → cities, with the real
local time and current weather at every place, a theme that follows the
destination's own clock, and a **been / want to go** mark on everything.

No build step, no framework, no dependencies. Three files and a stylesheet.

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
pan, click a pin to open it.** Pins hold their size as you zoom. Labels are placed with
collision detection — where two names would overlap, the place you have marked
keeps its label and the unmarked one loses it — so the map stays readable at
every zoom level instead of turning into a wall of overlapping text. The `#/map` page can filter
down to just the places you have been or just the ones you want to go.

Coastlines are drawn as SVG from `land.js` with a plain equirectangular
projection, so there is no tile server, no API key and no network call.

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

To wipe everything and start over, run this in the browser console:

```js
localStorage.removeItem('meridian-status');    // been / want marks
localStorage.removeItem('meridian-added');     // places you added
localStorage.removeItem('meridian-entries');   // your entries and notes
indexedDB.deleteDatabase('meridian-photos');   // your photos
location.reload();
```

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
Weather: Open-Meteo. Everything else is hand-written and dependency-free.
