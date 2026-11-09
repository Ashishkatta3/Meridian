/* ===========================================================
   PARKS — every national park, and the state parks worth the drive.

   This file EXTENDS data.js rather than replacing it, so anything you
   add there by hand survives. It loads after data.js and merges in.

   USA_CITIES  abbr -> [ [city, lat, lon, tzOverride?] ... ]
               Towns that exist mostly because something near them is
               worth seeing. Appended to that state's city list.

   USA_PARKS   abbr -> [ [title, lat, lon, description, TAG] ... ]
               All 61 national parks that sit in a state or DC (the two
               in the territories are left out because the atlas has no
               page for them), plus the state parks, seashores,
               lakeshores and monuments that people actually plan around.

   TAG is printed on the card: NATIONAL PARK, STATE PARK, MONUMENT,
   SEASHORE, LAKESHORE, PRESERVE, FALLS, CANYON, RECREATION AREA.
   =========================================================== */

const USA_CITIES = {
AL:[["Gulf Shores",30.25,-87.70]],
AZ:[["Page",36.91,-111.46]],
CA:[["South Lake Tahoe",38.93,-119.98],["Napa",38.30,-122.29]],
CO:[["Telluride",37.94,-107.81],["Durango",37.27,-107.88]],
FL:[["Daytona Beach",29.21,-81.02]],
GA:[["Augusta",33.47,-81.97]],
HI:[["Kailua-Kona",19.64,-155.99],["Lihue",21.98,-159.37]],
ID:[["Sun Valley",43.70,-114.35]],
ME:[["Rockland",44.10,-69.11]],
MI:[["Holland",42.79,-86.11],["Mackinac Island",45.85,-84.62]],
NC:[["Nags Head",35.96,-75.62]],
ND:[["Minot",48.23,-101.30]],
NE:[["Kearney",40.70,-99.08]],
NH:[["Laconia",43.53,-71.47]],
OR:[["Pendleton",45.67,-118.79]],
PA:[["Punxsutawney",40.95,-78.97],["Williamsport",41.24,-77.00]],
VA:[["Chincoteague",37.93,-75.38]],
WA:[["Leavenworth",47.60,-120.66]],
WI:[["Oshkosh",44.02,-88.54]],
WV:[["Fayetteville",38.05,-81.10]]
};

const USA_PARKS = {

AL:[
 ["Little River Canyon",34.46,-85.63,"A river that runs most of its length along a mountain top, then falls into the deepest canyon east of the Mississippi.","PRESERVE"],
 ["Gulf State Park",30.25,-87.65,"Two miles of white quartz sand and a 28-mile trail network through maritime forest behind it.","STATE PARK"],
 ["DeSoto State Park",34.50,-85.62,"Waterfalls, rhododendron and sandstone bluffs on Lookout Mountain.","STATE PARK"]],

AK:[
 ["Denali National Park",63.33,-150.50,"Six million acres and one road, 92 miles long, which private vehicles may drive only the first 15 of. North America's highest peak is visible about a third of the time.","NATIONAL PARK"],
 ["Kenai Fjords National Park",59.92,-149.65,"Forty glaciers flowing out of the Harding Icefield. Exit Glacier is the only one you can walk to.","NATIONAL PARK"],
 ["Glacier Bay National Park",58.50,-137.00,"A bay that was solid ice in 1794 and is now 65 miles of open water. Most people see it from a ship.","NATIONAL PARK"],
 ["Wrangell–St. Elias National Park",61.00,-142.00,"The largest national park in the United States — bigger than Switzerland — with nine of the sixteen highest peaks in the country.","NATIONAL PARK"],
 ["Katmai National Park",58.50,-155.00,"Brooks Falls, where brown bears stand in the current and catch salmon mid-air.","NATIONAL PARK"],
 ["Gates of the Arctic National Park",67.78,-153.30,"No roads, no trails, no campgrounds. You charter a bush plane and are left there.","NATIONAL PARK"],
 ["Kobuk Valley National Park",67.33,-159.12,"Sand dunes above the Arctic Circle, crossed twice a year by half a million caribou.","NATIONAL PARK"],
 ["Lake Clark National Park",60.97,-153.42,"Two active volcanoes, a turquoise lake and the densest coastal brown bear population anywhere.","NATIONAL PARK"]],

AZ:[
 ["Grand Canyon National Park",36.06,-112.14,"A mile deep, 277 river miles long, and 1.8 billion years of rock in the walls. The North Rim is a thousand feet higher and shuts in winter.","NATIONAL PARK"],
 ["Petrified Forest National Park",35.07,-109.78,"Fallen Triassic trees turned to agate, in a painted desert of banded clay.","NATIONAL PARK"],
 ["Saguaro National Park",32.25,-110.50,"Two districts either side of Tucson, protecting the only forest of the giant saguaro, which takes 70 years to grow an arm.","NATIONAL PARK"],
 ["Antelope Canyon",36.86,-111.37,"A slot canyon on Navajo land, enterable only with a Navajo guide. Upper gets the light beams, Lower gets the shapes.","CANYON"],
 ["Horseshoe Bend",36.88,-111.51,"A thousand-foot cliff above a 270-degree turn in the Colorado, ten minutes' walk from the car park.","CANYON"],
 ["Monument Valley",36.98,-110.11,"The sandstone buttes of every Western ever filmed, on a Navajo tribal park loop road.","MONUMENT"]],

AR:[
 ["Hot Springs National Park",34.52,-93.05,"Forty-seven thermal springs and a row of 1920s bathhouses, two of which still fill their tubs from the source.","NATIONAL PARK"],
 ["Buffalo National River",36.03,-92.76,"The first national river in the country, undammed for 135 miles under limestone bluffs.","PRESERVE"],
 ["Petit Jean State Park",35.12,-92.93,"Arkansas's first state park, with a 95-foot waterfall and Civilian Conservation Corps stonework.","STATE PARK"]],

CA:[
 ["Yosemite National Park",37.83,-119.50,"Granite walls, the highest waterfall in North America and sequoias. The valley floor is seven square miles and holds most of the traffic.","NATIONAL PARK"],
 ["Death Valley National Park",36.51,-117.08,"The hottest, driest and lowest place in North America. Badwater Basin is 282 feet below sea level.","NATIONAL PARK"],
 ["Joshua Tree National Park",33.87,-115.90,"Where the Mojave and Colorado deserts meet, with boulder piles that made it a world rock-climbing site.","NATIONAL PARK"],
 ["Sequoia National Park",36.49,-118.57,"General Sherman, the largest tree on earth by volume, and the Giant Forest around it.","NATIONAL PARK"],
 ["Kings Canyon National Park",36.89,-118.55,"A glacial canyon deeper than the Grand Canyon in places, and far emptier than its neighbour.","NATIONAL PARK"],
 ["Redwood National and State Parks",41.40,-124.00,"The tallest trees in the world, in a 40-mile strip of coastal fog that they depend on.","NATIONAL PARK"],
 ["Channel Islands National Park",34.01,-119.42,"Five islands an hour offshore with 150 endemic species. No cars, no shops, and you carry your water in.","NATIONAL PARK"],
 ["Lassen Volcanic National Park",40.50,-121.42,"All four types of volcano in one park, with boiling mud pots and a lake the colour of milk.","NATIONAL PARK"],
 ["Pinnacles National Park",36.49,-121.16,"Spires left from a volcano the San Andreas Fault split and carried 200 miles north. California condors nest here.","NATIONAL PARK"],
 ["Big Sur and Point Lobos",36.27,-121.81,"Ninety miles of the Santa Lucias dropping straight into the Pacific, with Point Lobos at the north end.","STATE PARK"]],

CO:[
 ["Rocky Mountain National Park",40.34,-105.68,"Sixty peaks above 12,000 feet and Trail Ridge Road, the highest continuous paved road in the country. Closed by snow more than half the year.","NATIONAL PARK"],
 ["Mesa Verde National Park",37.23,-108.46,"Cliff dwellings built into alcoves by the Ancestral Puebloans and abandoned around 1300. Cliff Palace has 150 rooms.","NATIONAL PARK"],
 ["Great Sand Dunes National Park",37.73,-105.51,"The tallest dunes in North America, 750 feet high, with a seasonal creek at the base you can sit in.","NATIONAL PARK"],
 ["Black Canyon of the Gunnison",38.57,-107.72,"A gorge so narrow and deep that parts of the floor get 33 minutes of sunlight a day.","NATIONAL PARK"],
 ["Garden of the Gods",38.88,-104.87,"Red sandstone fins tilted vertical by the uplift of Pikes Peak, free to enter, in the middle of Colorado Springs.","MONUMENT"],
 ["Maroon Bells",39.07,-106.99,"The most photographed mountains in North America. Shuttle only in summer, and the road is closed in winter.","RECREATION AREA"]],

CT:[
 ["Gillette Castle State Park",41.42,-72.43,"A medieval-looking stone house built by an actor who played Sherlock Holmes, above the Connecticut River.","STATE PARK"],
 ["Hammonasset Beach State Park",41.26,-72.54,"Two miles of Long Island Sound shoreline and the most visited park in the state.","STATE PARK"]],

DE:[
 ["Cape Henlopen State Park",38.78,-75.09,"Where Delaware Bay meets the Atlantic, with a walking dune and a Second World War observation tower.","STATE PARK"],
 ["Bombay Hook",39.25,-75.47,"Tidal marsh on the Atlantic Flyway. Thousands of snow geese stage here in late autumn.","PRESERVE"]],

DC:[
 ["Rock Creek Park",38.96,-77.05,"Seventeen hundred acres of wooded valley inside the city, twice the size of Central Park.","RECREATION AREA"],
 ["The National Mall",38.89,-77.02,"Two miles from the Capitol to the Lincoln Memorial, with the Smithsonian museums down both sides and no admission charge.","MONUMENT"]],

FL:[
 ["Everglades National Park",25.29,-80.90,"A river 60 miles wide and a few inches deep. The largest subtropical wilderness in the United States, and the only place alligators and crocodiles share.","NATIONAL PARK"],
 ["Biscayne National Park",25.49,-80.21,"Ninety-five per cent water. Mangrove shoreline, the northernmost Florida Keys and a maritime heritage trail of six wrecks.","NATIONAL PARK"],
 ["Dry Tortugas National Park",24.63,-82.87,"Seventy miles west of Key West by boat or seaplane, built around a 19th-century brick fort and some of the clearest water in the country.","NATIONAL PARK"],
 ["Bahia Honda State Park",24.66,-81.28,"The best beach in the Keys, with the old rail bridge standing beside it.","STATE PARK"],
 ["Silver Springs State Park",29.21,-82.05,"Glass-bottom boats over artesian springs, running since the 1870s, with wild rhesus macaques on the banks.","STATE PARK"]],

GA:[
 ["Cumberland Island National Seashore",30.83,-81.44,"Wild horses, live oaks and a ruined Carnegie mansion on an island reachable only by ferry, capped at 300 visitors a day.","SEASHORE"],
 ["Okefenokee Swamp",30.74,-82.14,"Four hundred thousand acres of blackwater swamp and peat bog, best seen from a canoe trail with a permit.","PRESERVE"],
 ["Providence Canyon State Park",32.07,-84.91,"Georgia's Little Grand Canyon, carved entirely by bad 19th-century farming practice.","STATE PARK"],
 ["Tallulah Gorge State Park",34.74,-83.39,"A thousand-foot gorge with a suspension bridge across it and permits required to reach the floor.","STATE PARK"]],

HI:[
 ["Haleakalā National Park",20.72,-156.17,"A dormant volcano you drive to 10,000 feet up for sunrise, with a reservation. The crater holds its own desert.","NATIONAL PARK"],
 ["Hawaiʻi Volcanoes National Park",19.38,-155.20,"Kīlauea, one of the most active volcanoes on earth, with lava tubes and steam vents and an eruption schedule nobody controls.","NATIONAL PARK"],
 ["Nā Pali Coast State Park",22.17,-159.64,"Seventeen miles of fluted cliffs on Kauai with no road. Boat, helicopter, or the Kalalau Trail on foot.","STATE PARK"],
 ["Waimea Canyon State Park",22.07,-159.66,"The Grand Canyon of the Pacific, 3,000 feet deep in red volcanic rock.","CANYON"]],

ID:[
 ["Craters of the Moon",43.42,-113.52,"Lava fields, cinder cones and caves across the Snake River Plain. Apollo astronauts trained here.","MONUMENT"],
 ["Sawtooth National Recreation Area",44.17,-114.93,"Forty peaks over 10,000 feet and 400 alpine lakes, with no paved road through the range.","RECREATION AREA"],
 ["Shoshone Falls",42.59,-114.40,"Higher than Niagara, at its best in spring when irrigation draw-off is lowest.","FALLS"]],

IL:[
 ["Starved Rock State Park",41.32,-88.99,"Eighteen sandstone canyons off the Illinois River, with waterfalls that freeze into columns in winter.","STATE PARK"],
 ["Garden of the Gods",37.60,-88.38,"Sandstone formations on a ridge in the Shawnee National Forest, 320 million years old.","RECREATION AREA"],
 ["Cahokia Mounds",38.66,-90.06,"The largest pre-Columbian settlement north of Mexico. Monks Mound is bigger at the base than the Great Pyramid.","MONUMENT"]],

IN:[
 ["Indiana Dunes National Park",41.63,-87.05,"Fifteen miles of Lake Michigan shoreline and dunes up to 200 feet, with steel mills on both sides of it.","NATIONAL PARK"],
 ["Turkey Run State Park",39.88,-87.20,"Sandstone ravines and hemlock, walked on ladders bolted into the rock.","STATE PARK"]],

IA:[
 ["Effigy Mounds",43.09,-91.19,"Two hundred prehistoric mounds, 31 of them shaped as bears and birds, above the Mississippi.","MONUMENT"],
 ["Maquoketa Caves State Park",42.12,-90.78,"Thirteen caves linked by a trail, some of which you crawl through.","STATE PARK"]],

KS:[
 ["Tallgrass Prairie National Preserve",38.43,-96.56,"Eleven thousand acres of the four per cent of tallgrass prairie that was never ploughed, with a bison herd.","PRESERVE"],
 ["Monument Rocks",38.80,-100.76,"Chalk pillars 70 feet high in open wheat country, the first National Natural Landmark named in the country.","MONUMENT"]],

KY:[
 ["Mammoth Cave National Park",37.19,-86.10,"Four hundred and twenty mapped miles, the longest cave system known, and surveyors are still adding to it.","NATIONAL PARK"],
 ["Red River Gorge",37.82,-83.62,"Over a hundred natural sandstone arches and some of the best sport climbing in the eastern United States.","RECREATION AREA"],
 ["Cumberland Falls State Park",36.84,-84.34,"A 68-foot curtain falls that throws a moonbow on clear nights around the full moon — one of two in the world.","FALLS"]],

LA:[
 ["Atchafalaya Basin",30.20,-91.50,"The largest wetland and swamp in the United States, best entered by flat-bottomed boat out of Henderson.","PRESERVE"],
 ["Chicot State Park",30.80,-92.28,"Cypress-tupelo swamp with a paddling trail through flooded forest.","STATE PARK"]],

ME:[
 ["Acadia National Park",44.35,-68.21,"Granite coastline, 45 miles of carriage roads built by Rockefeller, and Cadillac Mountain, the first place in the country to see sunrise part of the year.","NATIONAL PARK"],
 ["Baxter State Park",45.90,-68.92,"Katahdin, the northern end of the Appalachian Trail, in a park deliberately kept roadless and uncrowded by permit.","STATE PARK"]],

MD:[
 ["Assateague Island National Seashore",38.25,-75.15,"Thirty-seven miles of barrier island with two wild horse herds and no development on it at all.","SEASHORE"],
 ["Deep Creek Lake State Park",39.52,-79.30,"Maryland's largest freshwater lake, in the Allegheny highlands where the state gets actual winter.","STATE PARK"]],

MA:[
 ["Cape Cod National Seashore",41.92,-69.98,"Forty miles of Atlantic beach, kettle ponds and the dune shacks, protected by Kennedy in 1961.","SEASHORE"],
 ["Mohawk Trail",42.64,-72.95,"The first scenic auto road in New England, over the Berkshires with a hairpin turn at Hairpin Turn.","RECREATION AREA"]],

MI:[
 ["Isle Royale National Park",47.99,-88.91,"An island in Lake Superior, closed all winter, reachable by ferry or seaplane. Wolves and moose, and the least visited park in the lower 48.","NATIONAL PARK"],
 ["Pictured Rocks National Lakeshore",46.55,-86.46,"Fifteen miles of mineral-stained sandstone cliffs on Lake Superior, best seen from the water.","LAKESHORE"],
 ["Sleeping Bear Dunes",44.88,-86.05,"Dunes 450 feet above Lake Michigan, with a climb that defeats most people halfway up.","LAKESHORE"],
 ["Mackinac Island State Park",45.85,-84.62,"Eighty per cent of an island where no cars have been allowed since 1898. Horses, bicycles and fudge.","STATE PARK"]],

MN:[
 ["Voyageurs National Park",48.50,-92.88,"Forty per cent water, on the Canadian border, and the interior is reachable only by boat.","NATIONAL PARK"],
 ["Boundary Waters Canoe Area",47.98,-91.50,"A million acres, eleven hundred lakes, motors banned, and you portage between them.","PRESERVE"],
 ["Itasca State Park",47.21,-95.20,"The headwaters of the Mississippi, where you can step across it on stones.","STATE PARK"],
 ["Gooseberry Falls State Park",47.14,-91.47,"Five waterfalls in a short walk on the Lake Superior north shore.","FALLS"]],

MS:[
 ["Gulf Islands National Seashore",30.23,-88.90,"Barrier islands with white quartz sand, reachable by ferry, and almost empty midweek.","SEASHORE"],
 ["Natchez Trace Parkway",32.30,-90.42,"Four hundred and forty-four miles of parkway on a road the Choctaw and Chickasaw used first. No commercial traffic at all.","RECREATION AREA"]],

MO:[
 ["Gateway Arch National Park",38.62,-90.18,"The tallest monument in the country, 630 feet, with a tram inside the leg to a window at the top.","NATIONAL PARK"],
 ["Ozark National Scenic Riverways",37.15,-91.40,"The first national park area to protect a river system. Spring-fed, clear, and floated on inner tubes.","PRESERVE"],
 ["Elephant Rocks State Park",37.65,-90.69,"Granite boulders a billion and a half years old, sitting on each other end to end like circus elephants.","STATE PARK"]],

MT:[
 ["Glacier National Park",48.76,-113.79,"The Going-to-the-Sun Road over Logan Pass, 762 lakes, and 25 glaciers left of the 150 that were here in 1850.","NATIONAL PARK"],
 ["Beartooth Highway",45.03,-109.47,"Sixty-eight miles to 10,947 feet, which Charles Kuralt called the most beautiful drive in America. Open roughly June to October.","RECREATION AREA"],
 ["Flathead Lake",47.87,-114.08,"The largest natural freshwater lake west of the Mississippi, with cherry orchards along the east shore.","RECREATION AREA"]],

NE:[
 ["Scotts Bluff",41.83,-103.71,"An eight-hundred-foot promontory that was the landmark on the Oregon Trail, with wagon ruts still visible.","MONUMENT"],
 ["Chimney Rock",41.70,-103.35,"The most mentioned landmark in pioneer diaries, and the one that told them the plains were ending.","MONUMENT"],
 ["Toadstool Geologic Park",42.86,-103.65,"Badlands formations and a fossil trackway in the far north-west corner of the state.","STATE PARK"]],

NV:[
 ["Great Basin National Park",38.98,-114.30,"Bristlecone pines five thousand years old, a limestone cave, and some of the darkest skies in the country.","NATIONAL PARK"],
 ["Valley of Fire State Park",36.48,-114.52,"Nevada's oldest state park: Aztec sandstone the colour of rust, with petroglyphs.","STATE PARK"],
 ["Red Rock Canyon",36.13,-115.43,"A 13-mile scenic loop twenty minutes from the Las Vegas Strip, with sandstone walls climbers come for.","RECREATION AREA"]],

NH:[
 ["Franconia Notch State Park",44.14,-71.68,"A mountain pass with the Flume Gorge, a cable car up Cannon Mountain, and the profile that fell off the cliff in 2003.","STATE PARK"],
 ["Mount Washington",44.27,-71.30,"The worst weather in the world was recorded here. A cog railway and an auto road both reach the top.","RECREATION AREA"],
 ["White Mountain National Forest",44.10,-71.40,"Eight hundred thousand acres, the Presidential Range, and the Appalachian Mountain Club hut system.","PRESERVE"]],

NJ:[
 ["Island Beach State Park",39.80,-74.08,"Ten miles of undeveloped barrier island, which is close to unique on this coast.","STATE PARK"],
 ["Delaware Water Gap",41.15,-75.00,"A mile-wide notch the river cut through the Kittatinny Ridge, with 100 miles of trail either side.","RECREATION AREA"]],

NM:[
 ["Carlsbad Caverns National Park",32.17,-104.44,"A chamber big enough to hold fourteen football fields, entered down a switchback path, and 400,000 bats flying out at dusk in summer.","NATIONAL PARK"],
 ["White Sands National Park",32.78,-106.17,"Two hundred and seventy-five square miles of gypsum dunes, white as snow and cool to walk on. Closes for missile tests.","NATIONAL PARK"],
 ["Bandelier National Monument",35.78,-106.27,"Ancestral Puebloan cliff dwellings in volcanic tuff, with ladders up into the cavates.","MONUMENT"],
 ["Bisti Badlands",36.26,-108.25,"Hoodoos and petrified wood in a wilderness with no trails and no signs. Navigation is on you.","PRESERVE"]],

NY:[
 ["Adirondack Park",44.11,-73.92,"Six million acres — bigger than Yellowstone, Yosemite, Grand Canyon and Glacier combined — and half of it is private land inside the line.","STATE PARK"],
 ["Watkins Glen State Park",42.37,-76.89,"Nineteen waterfalls in two miles, on a gorge path that goes under and behind several of them.","STATE PARK"],
 ["Fire Island National Seashore",40.65,-73.15,"A barrier island with no roads, car-free communities, and the Sunken Forest behind the dunes.","SEASHORE"]],

NC:[
 ["Blue Ridge Parkway",35.57,-82.45,"Four hundred and sixty-nine miles of ridge-top road with no billboards, no trucks and no tolls. The most visited unit of the park service.","RECREATION AREA"],
 ["Cape Hatteras National Seashore",35.25,-75.53,"Seventy miles of the Outer Banks, the Hatteras lighthouse, and the graveyard of the Atlantic offshore.","SEASHORE"],
 ["Chimney Rock State Park",35.43,-82.25,"A granite monolith with an elevator inside it and a 404-foot waterfall next door.","STATE PARK"]],

ND:[
 ["Theodore Roosevelt National Park",46.98,-103.54,"The badlands that turned a sickly New York politician into a conservationist. Bison, wild horses and a painted canyon.","NATIONAL PARK"]],

OH:[
 ["Cuyahoga Valley National Park",41.24,-81.55,"A river that caught fire in 1969, now a park with a working scenic railroad through it between Cleveland and Akron.","NATIONAL PARK"],
 ["Hocking Hills State Park",39.43,-82.54,"Recessed caves, gorges and Old Man's Cave, in sandstone that holds its own cool microclimate.","STATE PARK"]],

OK:[
 ["Wichita Mountains",34.73,-98.71,"Granite mountains on the southern plains with free-ranging bison, longhorn and elk.","PRESERVE"],
 ["Beavers Bend State Park",34.14,-94.68,"Pine forest, a cold tailwater trout river, and the most un-Oklahoma landscape in Oklahoma.","STATE PARK"],
 ["Turner Falls Park",34.42,-97.15,"A 77-foot falls into a natural swimming pool, in the Arbuckle Mountains.","FALLS"]],

OR:[
 ["Crater Lake National Park",42.94,-122.10,"The deepest lake in the United States, in a collapsed volcano, fed only by rain and snow — which is why it is that blue.","NATIONAL PARK"],
 ["Columbia River Gorge",45.58,-121.90,"Eighty miles of canyon with 90 waterfalls on the Oregon side, including Multnomah.","RECREATION AREA"],
 ["Smith Rock State Park",44.37,-121.14,"Where American sport climbing was invented, on welded tuff above the Crooked River.","STATE PARK"]],

PA:[
 ["Ricketts Glen State Park",41.33,-76.28,"Twenty-two named waterfalls on a loop trail down two converging glens.","STATE PARK"],
 ["Ohiopyle State Park",39.87,-79.49,"Fourteen miles of the Youghiogheny through the Laurel Highlands, and the busiest whitewater in the east.","STATE PARK"],
 ["Presque Isle State Park",42.15,-80.11,"A sandy peninsula into Lake Erie with eleven beaches and the best birding in the state.","STATE PARK"]],

RI:[
 ["Block Island",41.17,-71.58,"Twelve miles offshore, forty per cent conserved, with Mohegan Bluffs and almost no chain anything.","RECREATION AREA"],
 ["Beavertail State Park",41.45,-71.40,"A lighthouse on the southern tip of Conanicut Island with the open Atlantic on three sides.","STATE PARK"]],

SC:[
 ["Congaree National Park",33.78,-80.78,"The largest old-growth bottomland hardwood forest left in the country, with some of the tallest trees in the east and a boardwalk over the floodplain.","NATIONAL PARK"],
 ["Hunting Island State Park",32.38,-80.44,"A barrier island with a climbable lighthouse and a beach of dead trees being reclaimed by the sea.","STATE PARK"],
 ["Caesars Head State Park",35.11,-82.63,"An escarpment overlook at the edge of the Blue Ridge, and Raven Cliff Falls nearby.","STATE PARK"]],

SD:[
 ["Badlands National Park",43.85,-102.34,"Layered buttes eroding at an inch a year, with the largest mixed-grass prairie in the park system behind them.","NATIONAL PARK"],
 ["Wind Cave National Park",43.57,-103.48,"One of the longest caves in the world, with boxwork formations found almost nowhere else, under a bison prairie.","NATIONAL PARK"],
 ["Mount Rushmore",43.88,-103.46,"Sixty-foot heads carved between 1927 and 1941, on land in the Black Hills the Lakota never ceded.","MONUMENT"],
 ["Custer State Park",43.75,-103.42,"Seventy-one thousand acres, a 1,500-head bison herd, and the Needles Highway through granite spires.","STATE PARK"]],

TN:[
 ["Great Smoky Mountains National Park",35.61,-83.49,"The most visited national park in the country, free to enter, with 19,000 documented species and fog that gave it the name.","NATIONAL PARK"],
 ["Fall Creek Falls State Park",35.66,-85.35,"A 256-foot falls, the highest free-fall waterfall east of the Mississippi.","FALLS"]],

TX:[
 ["Big Bend National Park",29.25,-103.25,"Eight hundred thousand acres in a bend of the Rio Grande, with three ecosystems and the darkest measured skies in the lower 48.","NATIONAL PARK"],
 ["Guadalupe Mountains National Park",31.92,-104.87,"The highest point in Texas and a Permian fossil reef, with McKittrick Canyon turning colour in late October.","NATIONAL PARK"],
 ["Palo Duro Canyon State Park",34.94,-101.69,"The second largest canyon in the country, 800 feet deep, which you drive down into.","CANYON"],
 ["Padre Island National Seashore",27.00,-97.30,"Seventy miles of undeveloped barrier island, the longest in the world, and a Kemp's ridley turtle release site.","SEASHORE"],
 ["Enchanted Rock",30.51,-98.82,"A pink granite dome 425 feet high that creaks at night as it cools. Day passes sell out.","STATE PARK"]],

UT:[
 ["Zion National Park",37.30,-113.05,"A canyon you walk up rather than look down into, with the Narrows in the river and Angels Landing on a fin. Shuttle only most of the year.","NATIONAL PARK"],
 ["Bryce Canyon National Park",37.57,-112.18,"Not a canyon but an amphitheatre of hoodoos, formed by 200 freeze-thaw cycles a year.","NATIONAL PARK"],
 ["Arches National Park",38.73,-109.59,"More than two thousand natural arches in one park, with timed entry in season because the queue reached the highway.","NATIONAL PARK"],
 ["Canyonlands National Park",38.20,-109.93,"Four districts split by two rivers, with no road between them. The Maze takes days to reach.","NATIONAL PARK"],
 ["Capitol Reef National Park",38.37,-111.26,"A hundred-mile wrinkle in the earth's crust, with a Mormon orchard at Fruita you can still pick from.","NATIONAL PARK"],
 ["Dead Horse Point State Park",38.48,-109.74,"A gooseneck of the Colorado two thousand feet below a mesa, and a quieter view than the park next door.","STATE PARK"],
 ["Antelope Island State Park",41.03,-112.21,"An island in the Great Salt Lake with a bison herd and brine flies in their millions.","STATE PARK"]],

VT:[
 ["Green Mountain National Forest",43.50,-72.90,"Four hundred thousand acres with the Long Trail — the oldest long-distance path in the country — down the spine.","PRESERVE"],
 ["Camel's Hump State Park",44.32,-72.89,"The only undeveloped high peak in Vermont, with alpine tundra on top.","STATE PARK"],
 ["Lake Champlain",44.50,-73.30,"A hundred and twenty miles between Vermont and New York, with ferries across it and the Adirondacks behind.","RECREATION AREA"]],

VA:[
 ["Shenandoah National Park",38.53,-78.35,"A hundred and five miles of Skyline Drive on the Blue Ridge, with 500 miles of trail and waterfalls in the hollows.","NATIONAL PARK"],
 ["Chincoteague and Assateague",37.92,-75.36,"The Virginia end of the barrier island, with the wild pony herd that swims the channel every July.","SEASHORE"],
 ["Great Falls Park",38.99,-77.25,"The Potomac dropping 76 feet in less than a mile, fifteen miles from the White House.","RECREATION AREA"]],

WA:[
 ["Mount Rainier National Park",46.85,-121.75,"An active volcano with more glaciers than any other peak in the lower 48, and wildflower meadows at Paradise in late July.","NATIONAL PARK"],
 ["Olympic National Park",47.80,-123.60,"Three distinct ecosystems in one park: temperate rainforest, 73 miles of wild coast, and glaciated peaks.","NATIONAL PARK"],
 ["North Cascades National Park",48.70,-121.20,"Three hundred and twelve glaciers, a third of all those in the lower 48, and almost nobody in them.","NATIONAL PARK"],
 ["Palouse Falls State Park",46.66,-118.22,"A 198-foot falls into a basalt bowl, left by ice-age floods, in the middle of wheat country.","FALLS"],
 ["Deception Pass State Park",48.41,-122.64,"The most visited park in the state, under a 1935 bridge over a tidal race that runs at eight knots.","STATE PARK"]],

WV:[
 ["New River Gorge National Park",38.07,-81.08,"The newest national park, on one of the oldest rivers on the continent, under a bridge that opens to BASE jumpers one day a year.","NATIONAL PARK"],
 ["Blackwater Falls State Park",39.11,-79.49,"A sixty-two-foot falls stained amber by hemlock and spruce tannins.","FALLS"],
 ["Seneca Rocks",38.83,-79.37,"A quartzite fin 900 feet above the valley, where the 10th Mountain Division learned to climb.","RECREATION AREA"]],

WI:[
 ["Apostle Islands National Lakeshore",46.92,-90.66,"Twenty-one islands in Lake Superior, with sea caves that freeze into walk-in ice formations in a cold enough winter.","LAKESHORE"],
 ["Devil's Lake State Park",43.42,-89.73,"Quartzite bluffs five hundred feet above a lake with no inlet or outlet. The busiest park in the state.","STATE PARK"],
 ["Door County",45.10,-87.20,"A peninsula with eleven lighthouses, five state parks and a fish boil tradition.","RECREATION AREA"]],

WY:[
 ["Yellowstone National Park",44.60,-110.50,"The first national park in the world, sitting on a supervolcano, with half the planet's geysers and a wolf population reintroduced in 1995.","NATIONAL PARK"],
 ["Grand Teton National Park",43.79,-110.68,"A fault block range rising seven thousand feet off the valley floor with no foothills at all.","NATIONAL PARK"],
 ["Devils Tower",44.59,-104.72,"An igneous column 867 feet high, the first national monument ever declared, and sacred to over twenty tribes.","MONUMENT"]]
};

/* ===========================================================
   Merge into data.js. Cities are appended to their state; parks are
   appended to that state's statewide list. Anything already in data.js
   by the same name wins, so hand edits there are never overwritten.
   =========================================================== */
(function mergeUSA(){
  if (typeof STATES === 'undefined') return;
  const byAbbr = {};
  STATES.forEach(row => { byAbbr[row[1]] = row; });

  Object.keys(USA_CITIES).forEach(ab => {
    const row = byAbbr[ab]; if (!row) return;
    const have = new Set(row[3].map(c => String(c[0]).toLowerCase()));
    USA_CITIES[ab].forEach(c => { if (!have.has(String(c[0]).toLowerCase())) row[3].push(c); });
  });

  if (typeof STATEWIDE === 'undefined') return;
  Object.keys(USA_PARKS).forEach(ab => {
    STATEWIDE[ab] = STATEWIDE[ab] || [];
    const have = new Set(STATEWIDE[ab].map(p => String(p[0]).toLowerCase()));
    USA_PARKS[ab].forEach(p => { if (!have.has(String(p[0]).toLowerCase())) STATEWIDE[ab].push(p); });
  });
})();
