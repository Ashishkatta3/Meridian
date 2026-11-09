/* ===========================================================
   CITIES — what to do, and what to eat, in the US cities people
   actually travel to.

   Extends data.js, same as parks.js. Loads after it and merges in,
   and anything already written in data.js by hand wins.

   USA_TODO  cityKey -> [ [title, description, TAG] ... ]
   USA_EAT   cityKey -> [ [name, what it is, why it is the one] ... ]

   On the restaurants: these are long-standing institutions rather
   than whatever opened last year, because a list of new openings is
   wrong within a season. Where a city is known for a dish rather than
   a room, the dish is the entry.
   =========================================================== */

const USA_TODO = {

/* ---------- west ---------- */
"CA-los-angeles":[
 ["The Getty Center","Richard Meier's travertine campus above the 405, with free admission and a tram up to it. The gardens are the point as much as the paintings.","MUSEUM"],
 ["Griffith Observatory","Free telescopes, a 1935 building, and the view of the Hollywood sign and the basin that every film uses.","OUTDOORS"],
 ["Grand Central Market","A 1917 food hall downtown that survived the city's decline and is now thirty stalls deep.","FOOD"],
 ["Walk Venice and Abbot Kinney","The boardwalk is a circus and Abbot Kinney a few blocks inland is the opposite. Do both in one afternoon.","NEIGHBOURHOOD"],
 ["Watts Towers","Seventeen interlocked sculptures built single-handed over thirty-three years out of steel, mortar and broken tile.","LANDMARK"]],
"CA-santa-barbara":[
 ["Old Mission Santa Barbara","The Queen of the Missions, 1786, with a Moorish fountain and a working Franciscan community.","HISTORIC"],
 ["County Courthouse tower","A Spanish Colonial Revival courthouse with a free clock tower you can climb for the whole red-tile view.","LANDMARK"],
 ["Funk Zone","Warehouse blocks turned into a wine trail you can walk between tasting rooms.","NEIGHBOURHOOD"],
 ["Channel Islands day boat","An hour across to Santa Cruz Island for sea caves and island foxes.","OUTDOORS"]],
"CA-monterey":[
 ["Monterey Bay Aquarium","Built in a former sardine cannery, with a kelp forest tank three storeys tall and an open-sea exhibit.","MUSEUM"],
 ["17-Mile Drive","A private toll road through Pebble Beach past the Lone Cypress.","OUTDOORS"],
 ["Point Lobos","Headlands, sea otters and cypress on what Robert Louis Stevenson may have used for Treasure Island.","OUTDOORS"],
 ["Cannery Row","Steinbeck's street, now mostly shops, with the history worth reading before you walk it.","NEIGHBOURHOOD"]],
"CA-south-lake-tahoe":[
 ["Emerald Bay","A glacial bay with an island and a Scandinavian mansion, from an overlook on Highway 89.","OUTDOORS"],
 ["Heavenly gondola","Up 2,800 feet from the middle of town for the whole lake and the Carson Valley behind.","OUTDOORS"],
 ["Sand Harbor","The clearest water on the lake, on the Nevada side, with granite boulders to swim between.","OUTDOORS"]],
"CA-napa":[
 ["Napa Valley Wine Train","Three hours in restored 1915 Pullman cars up the valley and back, with lunch.","FOOD"],
 ["Oxbow Public Market","Local producers in one shed, and a cheaper way into the valley's food than the restaurants.","FOOD"],
 ["Castello di Amorosa","A castle built to 13th-century Tuscan specification, with a torture chamber, because the owner wanted one.","LANDMARK"]],
"NV-las-vegas":[
 ["The Neon Museum","The signs the casinos threw away, lit again in a boneyard. Book the night tour.","MUSEUM"],
 ["Hoover Dam","Seven hundred and twenty-six feet of 1930s concrete, with a tour down into the generator hall.","LANDMARK"],
 ["Red Rock Canyon loop","Thirteen miles of scenic drive twenty minutes from the Strip, with sandstone the Strip has no interest in.","OUTDOORS"],
 ["Fremont Street","The original Vegas, before the Strip, with the old casinos and a canopy screen over five blocks.","NEIGHBOURHOOD"],
 ["Atomic Museum","The Nevada Test Site, told properly, including the tourism the city built around the mushroom clouds.","MUSEUM"]],
"AZ-phoenix":[
 ["Desert Botanical Garden","Fifty thousand desert plants in the Papago buttes, best in the hour before closing.","OUTDOORS"],
 ["Taliesin West","Frank Lloyd Wright's winter home and school, built into the desert out of its own rock.","LANDMARK"],
 ["Musical Instrument Museum","Fifteen thousand instruments with headphones that play each one as you reach it.","MUSEUM"],
 ["Camelback Mountain","Twelve hundred feet up in 1.2 miles. Not a walk — a scramble, and it gets people in summer.","OUTDOORS"]],
"AZ-sedona":[
 ["Cathedral Rock","The most photographed formation in Arizona, reached by a short, steep, slickrock scramble.","OUTDOORS"],
 ["Chapel of the Holy Cross","A 1956 chapel built straight out of a red rock spur, by a student of Frank Lloyd Wright.","LANDMARK"],
 ["Pink Jeep to Broken Arrow","The only legal way onto some of the slickrock, and worth the tourist-trap feeling.","OUTDOORS"],
 ["Oak Creek Canyon","A sixteen-mile drive down from the Mogollon Rim, with a natural waterslide at Slide Rock.","OUTDOORS"]],
"AZ-page":[
 ["Antelope Canyon","Upper for the light beams at midday, Lower for the shapes and ladders. Navajo guide required for both.","OUTDOORS"],
 ["Horseshoe Bend","A 1.5-mile round-trip walk to a thousand-foot drop with no railing for most of its length.","OUTDOORS"],
 ["Lake Powell by boat","Ninety-six canyons of flooded sandstone, best from a rented boat to Rainbow Bridge.","OUTDOORS"]],
"UT-moab":[
 ["Delicate Arch at sunset","A three-mile round trip over slickrock to the arch on the state's number plate. Take water, take a torch.","OUTDOORS"],
 ["Island in the Sky","The Canyonlands district with a paved rim road, Mesa Arch at dawn, and Grand View Point.","OUTDOORS"],
 ["Raft Westwater Canyon","Grade III–IV on the Colorado in the oldest exposed rock in the region.","OUTDOORS"],
 ["Dead Horse Point at dusk","The gooseneck view, and a far quieter overlook than anything inside the parks.","OUTDOORS"]],
"UT-springdale":[
 ["Zion Narrows bottom-up","Wade up the Virgin River into a slot with 300-metre walls. No permit needed from this end.","OUTDOORS"],
 ["Angels Landing","A chained ridge walk with 400-metre drops either side, now by permit lottery only.","OUTDOORS"],
 ["Canyon Overlook","Half a mile for the view most people queue three hours for, on the east side of the tunnel.","OUTDOORS"]],
"UT-salt-lake-city":[
 ["Temple Square","The headquarters of the Latter-day Saints, free to walk, with the Tabernacle's famous acoustics.","HISTORIC"],
 ["Antelope Island causeway","Seven miles across the Great Salt Lake to a bison herd and water you float in.","OUTDOORS"],
 ["Big and Little Cottonwood","Four ski areas inside forty minutes of downtown, with the lightest snow in the country.","OUTDOORS"]],
"NM-santa-fe":[
 ["Georgia O'Keeffe Museum","The largest collection of her work anywhere, ten minutes from the plaza.","MUSEUM"],
 ["Canyon Road","Half a mile of adobe galleries, a hundred of them, walked end to end in an afternoon.","NEIGHBOURHOOD"],
 ["Loretto Chapel staircase","A spiral stair with no centre support and no nails, built by a carpenter who left without being paid.","LANDMARK"],
 ["Meow Wolf","A Victorian house you walk into and come out of somewhere else entirely. Built by local artists, funded by George R. R. Martin.","MUSEUM"],
 ["High Road to Taos","Fifty-six miles through Chimayó and Truchas instead of the fast road up the gorge.","OUTDOORS"]],
"NM-albuquerque":[
 ["Sandia Peak Tramway","Two and a half miles of cable to 10,378 feet, the longest aerial tram in the Americas.","OUTDOORS"],
 ["Old Town","Ten blocks of adobe around a 1793 plaza, with San Felipe de Neri still in use.","NEIGHBOURHOOD"],
 ["Petroglyph National Monument","Twenty-four thousand images carved into basalt on the city's western edge.","HISTORIC"],
 ["Balloon Museum","Why this valley and no other, explained properly — the box wind pattern that lets balloons come back.","MUSEUM"]],
"CO-denver":[
 ["Red Rocks Amphitheatre","Two three-hundred-foot sandstone monoliths with a stage between them. Free to walk when nothing is on.","OUTDOORS"],
 ["Denver Art Museum","A Libeskind building with the best collection of American Indian art in any US museum.","MUSEUM"],
 ["Union Station","A 1914 station restored as the city's living room, with bars on the concourse.","LANDMARK"],
 ["RiNo murals","A warehouse district repainted every year at the Crush Walls festival.","NEIGHBOURHOOD"]],
"CO-aspen":[
 ["Maroon Bells","Shuttle up the valley to the most photographed mountains on the continent, reflected in a glacial lake.","OUTDOORS"],
 ["Independence Pass","Twelve thousand and ninety-five feet on a road that closes with the first real snow.","OUTDOORS"],
 ["Aspen Mountain gondola","Straight up from the end of the main street, with hiking at the top in summer.","OUTDOORS"]],
"CO-telluride":[
 ["Free gondola to Mountain Village","The only free public gondola in the country, over the ridge, running until midnight.","OUTDOORS"],
 ["Bridal Veil Falls","Colorado's tallest free-falling waterfall, 365 feet, with a power station on the lip.","FALLS"],
 ["Box canyon main street","A town with mountains closing the end of the street, which is why it looks like that.","NEIGHBOURHOOD"]],
"OR-portland":[
 ["Powell's City of Books","A whole city block of new and used books over nine colour-coded rooms.","LANDMARK"],
 ["Japanese Garden","Twelve acres in the West Hills, considered among the most authentic outside Japan.","OUTDOORS"],
 ["Columbia River Gorge day trip","Multnomah Falls, Vista House and the old highway, within an hour.","OUTDOORS"],
 ["Mount Hood loop","A glaciated volcano with summer skiing and Timberline Lodge on its shoulder.","OUTDOORS"]],
"WA-seattle":[
 ["Pike Place Market","A working market since 1907, and the lower levels are where it stops being a photograph.","FOOD"],
 ["Chihuly Garden and Glass","Blown glass installed as a garden under the Space Needle, which is the better of the two tickets.","MUSEUM"],
 ["Ferry to Bainbridge","Thirty-five minutes each way for the skyline, the Olympics and the cheapest cruise in the city.","OUTDOORS"],
 ["Museum of Pop Culture","A Gehry building holding Hendrix, Nirvana and science fiction, which is a very Seattle combination.","MUSEUM"],
 ["Discovery Park","Five hundred and thirty-four acres on a bluff with a lighthouse and no city noise.","OUTDOORS"]],

/* ---------- mountain and plains ---------- */
"WY-jackson":[
 ["Elk antler arches","Four arches on the town square built from antlers shed on the National Elk Refuge.","LANDMARK"],
 ["Snake River float","A scenic float under the Tetons, which is how most people first see the range properly.","OUTDOORS"],
 ["Jackson Hole aerial tram","Four thousand one hundred and thirty-nine vertical feet in nine minutes, with waffles at the top.","OUTDOORS"],
 ["National Museum of Wildlife Art","Five thousand works, and a building set into a hillside opposite the elk refuge.","MUSEUM"]],
"MT-whitefish":[
 ["Going-to-the-Sun Road","Fifty miles over Logan Pass through Glacier. Vehicle reservations in summer, and it opens late.","OUTDOORS"],
 ["Whitefish Mountain Resort","Night skiing in winter, an alpine slide and a zipline the rest of the year.","OUTDOORS"],
 ["Flathead Lake drive","The east shore road through cherry orchards, with swimming at Yellow Bay.","OUTDOORS"]],
"SD-rapid-city":[
 ["Mount Rushmore","Best at the evening lighting ceremony, and better still from the Presidential Trail underneath.","MONUMENT"],
 ["Needles Highway","Fourteen miles of granite spires and tunnels cut barely wider than a car.","OUTDOORS"],
 ["Crazy Horse Memorial","Carved since 1948, funded privately, and deliberately unfinished on any schedule.","MONUMENT"],
 ["Badlands Loop Road","Thirty-one miles with overlooks every few minutes, and bighorn on the road at dawn.","OUTDOORS"]],
"ID-boise":[
 ["Boise River Greenbelt","Twenty-five miles of path along the river through the middle of the city.","OUTDOORS"],
 ["Old Idaho Penitentiary","A prison from 1872 to 1973, left as it was, with solitary cells open.","HISTORIC"],
 ["Basque Block","The largest Basque community in the United States, with a museum and a frontón.","NEIGHBOURHOOD"]],

/* ---------- midwest ---------- */
"MO-st-louis":[
 ["Gateway Arch tram","A five-minute ride in a tiny capsule to a window 630 feet up.","MONUMENT"],
 ["City Museum","A shoe factory rebuilt as a climbable sculpture out of salvage, with a school bus on the roof.","MUSEUM"],
 ["Forest Park","Larger than Central Park, with five free museums and the zoo in it.","OUTDOORS"],
 ["Anheuser-Busch brewery","A national historic landmark with Clydesdales and a free tasting at the end.","FOOD"]],
"MN-minneapolis":[
 ["Chain of Lakes","Thirteen miles of connected lakes with a path round all of them inside the city.","OUTDOORS"],
 ["Walker Art Center and Sculpture Garden","Contemporary art and the Spoonbridge and Cherry, which the city has adopted as its emblem.","MUSEUM"],
 ["Minnehaha Falls","Fifty-three feet in a city park, and frozen solid for much of the winter.","FALLS"],
 ["Mill City Museum","Built inside the ruins of the largest flour mill in the world after it burned.","MUSEUM"]],
"MI-detroit":[
 ["Detroit Institute of Arts","Diego Rivera's Detroit Industry murals fill an entire courtyard, and the city fought bankruptcy to keep them.","MUSEUM"],
 ["The Henry Ford and Greenfield Village","Rosa Parks's bus, the Wright brothers' shop, and a working 1920s village over 240 acres.","MUSEUM"],
 ["Eastern Market","Six blocks of sheds, trading since 1891, with murals on everything.","FOOD"],
 ["Belle Isle","An island park between the US and Canada, designed by Olmsted, with an aquarium from 1904.","OUTDOORS"]],
"MI-mackinac-island":[
 ["Circle the island by bicycle","Eight miles on M-185, the only state highway in America with no cars on it.","OUTDOORS"],
 ["Grand Hotel porch","Six hundred and sixty feet of it, the longest in the world, with a dress code after six.","HISTORIC"],
 ["Fort Mackinac","A British fort from 1780 on the bluff, with cannon firing on the hour.","HISTORIC"]],
"WI-milwaukee":[
 ["Milwaukee Art Museum","Calatrava's Quadracci Pavilion opens and closes its 217-foot brise soleil twice a day.","MUSEUM"],
 ["Harley-Davidson Museum","The company archive, including Serial Number One, in its home city.","MUSEUM"],
 ["Historic Third Ward","Warehouse blocks and the Public Market, walkable from downtown on the Riverwalk.","NEIGHBOURHOOD"],
 ["Lakefront Brewery tour","The least reverent brewery tour in the country, and the one locals actually take.","FOOD"]],
"OH-cleveland":[
 ["Rock and Roll Hall of Fame","A Pei building on the lakefront, and the archive is better than the plaques.","MUSEUM"],
 ["West Side Market","A 1912 market hall with a vaulted tile ceiling and a hundred stands.","FOOD"],
 ["Cleveland Museum of Art","Free admission, an Armor Court, and one of the best collections in the country.","MUSEUM"],
 ["Cuyahoga Valley Scenic Railroad","Through the national park between here and Akron, with a bike-aboard service.","OUTDOORS"]],
"OH-cincinnati":[
 ["Over-the-Rhine","The largest intact Italianate historic district in the United States, and Findlay Market in the middle.","NEIGHBOURHOOD"],
 ["National Underground Railroad Freedom Center","On the north bank of the river people crossed to be free.","MUSEUM"],
 ["Cincinnati Zoo","The second oldest in the country, and the best in it at breeding.","OUTDOORS"],
 ["Roebling Suspension Bridge","Built 1866 as the longest in the world, and the prototype for Brooklyn.","LANDMARK"]],
"IN-indianapolis":[
 ["Indianapolis Motor Speedway","Two and a half miles of oval, a museum inside it, and a bus lap when nothing is running.","LANDMARK"],
 ["Cultural Trail","Eight miles of protected path linking six cultural districts, built for pedestrians first.","OUTDOORS"],
 ["Newfields","An art museum with a hundred-acre art-and-nature park behind it.","MUSEUM"]],
"NE-omaha":[
 ["Henry Doorly Zoo","The largest indoor desert and one of the largest indoor rainforests in the world.","OUTDOORS"],
 ["Old Market","Brick warehouses and cobbled streets, now the centre of the city's eating.","NEIGHBOURHOOD"],
 ["Durham Museum","Inside Union Station, an art deco terminal left largely as it was.","MUSEUM"]],
"OK-oklahoma-city":[
 ["Oklahoma City National Memorial","A field of 168 empty chairs, the survivor tree, and a reflecting pool on the footprint of the street.","MONUMENT"],
 ["National Cowboy and Western Heritage Museum","Serious about the West, including the parts the films leave out.","MUSEUM"],
 ["Bricktown","Warehouses and a mile of canal with water taxis, walkable from downtown.","NEIGHBOURHOOD"]],

/* ---------- south ---------- */
"GA-atlanta":[
 ["Martin Luther King Jr. National Historical Park","His birth home, Ebenezer Baptist Church and the tomb, on one free site.","HISTORIC"],
 ["Georgia Aquarium","Whale sharks and manta rays in a tank of 6.3 million gallons.","MUSEUM"],
 ["BeltLine Eastside Trail","A railway corridor turned into a walkable, muralled spine through the east side.","OUTDOORS"],
 ["Ponce City Market","A Sears distribution building, now food and shops, with a rooftop fairground.","FOOD"]],
"GA-savannah":[
 ["The squares","Twenty-two of Oglethorpe's original twenty-four, each with its own trees and monument.","NEIGHBOURHOOD"],
 ["Bonaventure Cemetery","Live oaks, Spanish moss and Victorian statuary on a bluff over the Wilmington River.","HISTORIC"],
 ["Wormsloe tartan oak avenue","A 1.5-mile allée of four hundred live oaks to a tabby ruin.","HISTORIC"],
 ["Tybee Island","Eighteen miles out, with a climbable 1736 lighthouse and a flat beach.","OUTDOORS"]],
"SC-charleston":[
 ["Rainbow Row and the Battery","Thirteen Georgian houses in pastel, and a seawall promenade round the point.","NEIGHBOURHOOD"],
 ["Fort Sumter","Boat out to where the Civil War started, which the rangers explain without flinching.","HISTORIC"],
 ["Aiken-Rhett House","Left unrestored on purpose, including the slave quarters, which makes it the most honest house museum in the city.","HISTORIC"],
 ["Angel Oak","A live oak between four and five hundred years old, with limbs resting on the ground.","OUTDOORS"]],
"NC-asheville":[
 ["Biltmore Estate","Two hundred and fifty rooms, the largest private house in America, with Olmsted's grounds around it.","HISTORIC"],
 ["Blue Ridge Parkway overlooks","Craggy Gardens and Mount Mitchell, the highest point east of the Mississippi, within an hour.","OUTDOORS"],
 ["River Arts District","Two hundred working studios in old industrial buildings along the French Broad.","NEIGHBOURHOOD"],
 ["Sliding Rock","A sixty-foot natural waterslide into a cold pool, with a lifeguard in summer.","OUTDOORS"]],
"TN-memphis":[
 ["National Civil Rights Museum","Built around the Lorraine Motel, with Room 306 kept as it was.","MUSEUM"],
 ["Graceland","Smaller than people expect, and more interesting for it. The jungle room is upstairs in the plans and not in the tour.","HISTORIC"],
 ["Stax Museum of American Soul Music","On the site of the studio, with Isaac Hayes's gold-trimmed Cadillac in the middle.","MUSEUM"],
 ["Beale Street","Three blocks of live blues every night, and the Peabody ducks ten minutes away.","NEIGHBOURHOOD"]],
"TN-gatlinburg":[
 ["Cades Cove loop","Eleven miles round a valley of 19th-century homesteads, with bears. Vehicle-free on Wednesdays in summer.","OUTDOORS"],
 ["Clingmans Dome","The highest point in the park at 6,643 feet, with a ramp to an observation tower.","OUTDOORS"],
 ["Roaring Fork Motor Nature Trail","A one-way five-mile lane past cabins and a waterfall you can walk behind.","OUTDOORS"],
 ["Ober Mountain tramway","Straight out of the main street to a small ski area above the town.","OUTDOORS"]],
"KY-louisville":[
 ["Churchill Downs and the Derby Museum","The twin spires, and a museum that puts you on the track when there is no racing.","LANDMARK"],
 ["Louisville Slugger Museum","Bats made on site since 1884, and you leave with a miniature one.","MUSEUM"],
 ["Urban Bourbon Trail","Distilleries inside the city, so you can do it without driving.","FOOD"],
 ["Muhammad Ali Center","His life told as six core principles rather than as a fight record.","MUSEUM"]],
"AL-birmingham":[
 ["Civil Rights Institute","Opposite 16th Street Baptist Church and Kelly Ingram Park, where the 1963 campaign happened.","MUSEUM"],
 ["Vulcan Park","The largest cast-iron statue in the world, on a ridge over the city it was made for.","LANDMARK"],
 ["Sloss Furnaces","A blast furnace works from 1882, left standing, and open to walk through.","HISTORIC"]],
"MS-biloxi":[
 ["Biloxi Lighthouse","Cast iron, 1848, and kept lit by two women for more than fifty years between them.","LANDMARK"],
 ["Ohr-O'Keefe Museum","Gehry pods built for the pottery of George Ohr, the self-styled mad potter of Biloxi.","MUSEUM"],
 ["Shrimp boat trip","An hour on a working trawl, and the net comes up where you can see it.","OUTDOORS"]],
"FL-orlando":[
 ["Wekiwa Springs","A constant 72 degrees, twenty minutes from the parks, with canoes and no queue.","OUTDOORS"],
 ["Winter Park and the Morse Museum","The largest collection of Tiffany glass in the world, and a boat tour through the canals.","MUSEUM"],
 ["Kennedy Space Center","An hour east: Atlantis, a Saturn V lying on its side, and launches you can time a visit around.","MUSEUM"],
 ["Leu Gardens","Fifty acres of camellias and a 19th-century farmhouse, which is the city before the parks.","OUTDOORS"]],
"FL-st-augustine":[
 ["Castillo de San Marcos","The oldest masonry fort in the continental US, built of coquina, which absorbed cannonballs rather than shattering.","HISTORIC"],
 ["St George Street","Pedestrian blocks through the 18th-century colonial quarter.","NEIGHBOURHOOD"],
 ["Lightner Museum","A Gilded Age hotel turned museum, with the pool as the dining room.","MUSEUM"],
 ["St Augustine Lighthouse","Two hundred and nineteen steps, and the keepers' house as a shipwreck museum.","LANDMARK"]],
"WV-fayetteville":[
 ["New River Gorge Bridge","Eight hundred and seventy-six feet above the river, with a catwalk tour underneath it.","LANDMARK"],
 ["Raft the Lower Gorge","Grade IV–V in summer, and the best commercial whitewater east of the Rockies.","OUTDOORS"],
 ["Endless Wall Trail","Three miles along the clifftop with the gorge opening underneath at Diamond Point.","OUTDOORS"]],

/* ---------- northeast ---------- */
"MA-boston":[
 ["Freedom Trail","Two and a half miles of red brick line through sixteen sites, ending at the Bunker Hill Monument.","HISTORIC"],
 ["Isabella Stewart Gardner Museum","A Venetian palazzo built around a courtyard, with the empty frames from the 1990 theft still hanging.","MUSEUM"],
 ["Fenway Park","The oldest ballpark in the majors, 1912, with a tour when the team is away.","LANDMARK"],
 ["Harvard and Cambridge","The Yard, the Glass Flowers at the natural history museum, and a bookshop on every corner.","NEIGHBOURHOOD"],
 ["Boston Harbor Islands","Thirty-four islands by ferry, with a Civil War fort on Georges Island.","OUTDOORS"]],
"MA-salem":[
 ["Peabody Essex Museum","The oldest continuously operating museum in the country, with a Qing house moved from China.","MUSEUM"],
 ["Witch Trials Memorial","Twenty stone benches beside the old burying point, deliberately plain.","MONUMENT"],
 ["The House of the Seven Gables","A 1668 house that Hawthorne wrote around, with a secret staircase.","HISTORIC"]],
"ME-portland":[
 ["Portland Head Light","Commissioned by George Washington, lit in 1791, in a park with the Atlantic on three sides.","LANDMARK"],
 ["Old Port","Cobbled blocks of chandlers and warehouses, now the best eating in northern New England.","NEIGHBOURHOOD"],
 ["Casco Bay mail boat","Three hours round the Calendar Islands on the working mail run.","OUTDOORS"]],
"ME-bar-harbor":[
 ["Cadillac Mountain sunrise","The first sunrise in the country between October and March. Vehicle reservation required.","OUTDOORS"],
 ["Carriage roads by bicycle","Forty-five miles of crushed stone, no cars, and seventeen stone bridges, paid for by Rockefeller.","OUTDOORS"],
 ["Jordan Pond House","Popovers on the lawn with the Bubbles behind the pond, served since the 1890s.","FOOD"],
 ["Bass Harbor Head Light","The quiet side of the island, and the best light in the evening.","LANDMARK"]],
"ME-rockland":[
 ["Farnsworth Art Museum","Three generations of Wyeths, and the Olson House where Christina's World was painted.","MUSEUM"],
 ["Rockland Breakwater Light","A mile of granite out into the bay, walkable when the sea is calm.","LANDMARK"],
 ["Windjammer day sail","Working schooners out of the harbour, some over a hundred years old.","OUTDOORS"]],
"NH-portsmouth":[
 ["Strawbery Banke","Ten acres of houses from 1695 to 1954 on their original sites, furnished to different decades.","HISTORIC"],
 ["Isles of Shoals cruise","Nine islands six miles out, with a hotel, a marine lab and a murder story.","OUTDOORS"],
 ["Market Square","A compact brick centre with more good food per block than its size suggests.","NEIGHBOURHOOD"]],
"VT-burlington":[
 ["Church Street Marketplace","Four blocks closed to cars since 1981, with the Adirondacks at the end of the side streets.","NEIGHBOURHOOD"],
 ["Shelburne Museum","Thirty-nine buildings including a steamboat hauled overland, on forty-five acres.","MUSEUM"],
 ["Lake Champlain ferry","Across to New York in twelve minutes, with the Green Mountains behind you.","OUTDOORS"],
 ["Ben & Jerry's factory","Half an hour south in Waterbury, with a flavour graveyard outside.","FOOD"]],
"RI-newport":[
 ["Cliff Walk","Three and a half miles with the Atlantic on one side and the Gilded Age mansions on the other.","OUTDOORS"],
 ["The Breakers","Seventy rooms built for the Vanderbilts in 1895, as a summer cottage.","HISTORIC"],
 ["International Tennis Hall of Fame","The oldest grass courts still in competitive use, and you can book one.","MUSEUM"],
 ["Ocean Drive","Ten miles round the point past Castle Hill and Brenton Point.","OUTDOORS"]],
"MD-baltimore":[
 ["American Visionary Art Museum","Self-taught artists only, including a fifty-five-foot whirligig outside.","MUSEUM"],
 ["Fort McHenry","Where the flag was still there in 1814, with the ramparts open.","HISTORIC"],
 ["Lexington Market","Trading since 1782, and the crab cake is the reason to go.","FOOD"],
 ["Fell's Point","Cobbles, a working tug pier and the oldest continuously operating tavern in the state.","NEIGHBOURHOOD"]],
"MD-annapolis":[
 ["US Naval Academy","Noon formation in term time, and the crypt of John Paul Jones under the chapel.","HISTORIC"],
 ["City Dock","Eighteenth-century streets running straight into the water, with a Kunta Kinte memorial at the head.","NEIGHBOURHOOD"],
 ["Sail the Chesapeake","Two-hour trips on a wooden schooner from the dock.","OUTDOORS"]],
"VA-williamsburg":[
 ["Colonial Williamsburg","Three hundred acres of restored and reconstructed 18th-century town, with tradespeople working in period.","HISTORIC"],
 ["Jamestown Settlement","Where the English landed in 1607, with three reconstructed ships and an ongoing dig.","HISTORIC"],
 ["Yorktown Battlefield","Where Cornwallis surrendered, with the siege lines walkable.","HISTORIC"]],
"NY-buffalo":[
 ["Niagara Falls","Twenty minutes north. The Cave of the Winds deck puts you under Bridal Veil, and the US side is the cheaper one.","FALLS"],
 ["Frank Lloyd Wright's Martin House","Six interconnected buildings from 1905, restored over twenty-five years and $50 million.","LANDMARK"],
 ["Albright-Knox at Buffalo AKG","Modern and contemporary, with a serious abstract expressionist holding.","MUSEUM"],
 ["Silo City","Grain elevators Le Corbusier admired, now open for tours and concerts.","HISTORIC"]],
"PA-philadelphia":[
 ["Independence Hall and the Liberty Bell","Where both the Declaration and the Constitution were signed. Free, but timed tickets in summer.","HISTORIC"],
 ["Philadelphia Museum of Art","The steps, and then inside, where there is a genuinely great collection behind them.","MUSEUM"],
 ["Reading Terminal Market","An 1893 train shed with eighty vendors, including Pennsylvania Dutch stalls that shut on Sundays.","FOOD"],
 ["Eastern State Penitentiary","The first true penitentiary in the world, left as a ruin, with Al Capone's cell furnished.","HISTORIC"],
 ["Barnes Foundation","Hung exactly as Albert Barnes arranged it, which is unlike any other museum you will visit.","MUSEUM"]]
};

const USA_EAT = {
"NY-new-york-city":[
 ["Katz's Delicatessen","Pastrami on rye","Hand-carved since 1888. Keep the ticket they give you at the door or you pay a penalty."],
 ["Russ & Daughters","Appetizing","Smoked fish and bagels from a 1914 Lower East Side counter, still in the family."],
 ["Di Fara","Pizza","Dom DeMarco made every pie himself for sixty years in Midwood. Worth the subway ride."],
 ["Peter Luger","Porterhouse","Brooklyn, 1887, cash or their own card only, and the steak comes already sliced."]],
"IL-chicago":[
 ["Lou Malnati's","Deep dish","The butter crust and the sausage patty. Order it when you sit down — it takes 45 minutes."],
 ["Al's Beef","Italian beef","Ordered dipped, eaten standing, leaning forward. The original on Taylor Street."],
 ["Portillo's","Chicago dog","Dragged through the garden: mustard, relish, onion, tomato, sport pepper, celery salt. Never ketchup."]],
"LA-new-orleans":[
 ["Café du Monde","Beignets and café au lait","Open since 1862 and almost always open now. Do not wear black."],
 ["Willie Mae's Scotch House","Fried chicken","A Treme institution rebuilt by volunteers after Katrina."],
 ["Commander's Palace","Creole","Turtle soup and bread pudding soufflé in the Garden District, since 1893. Jacket preferred."],
 ["Cochon","Cajun","Whole-hog cooking done seriously, in the Warehouse District."]],
"TX-austin":[
 ["Franklin Barbecue","Brisket","Aaron Franklin's queue starts before the doors do. They sell out most days."],
 ["Veracruz All Natural","Migas taco","Started as a trailer and is still the best breakfast taco in a city of them."],
 ["Matt's El Rancho","Bob Armstrong dip","Tex-Mex since 1952, and the dip is on the menu because a customer asked for it off-menu."]],
"TX-san-antonio":[
 ["Mi Tierra Café","Tex-Mex","Open since 1941, open round the clock, and the Christmas decorations never come down."]],
"TX-houston":[
 ["The Original Ninfa's on Navigation","Fajitas","Where fajitas were introduced to a restaurant menu in 1973."]],
"TX-dallas-fort-worth":[
 ["Pecan Lodge","Brisket","Deep Ellum, and the beef rib is the order if they still have one."]],
"CA-san-francisco":[
 ["Swan Oyster Depot","Oysters and crab","Eighteen stools, no tables, cash preferred, counter service since 1912."],
 ["Tartine Bakery","Morning bun","The bread that changed American baking. Go early or go to the Manufactory."],
 ["La Taqueria","Mission burrito","No rice, which starts arguments, and is the right call."],
 ["Zuni Café","Roast chicken for two","Ordered for two, takes an hour, arrives on bread salad. A San Francisco institution."]],
"CA-los-angeles":[
 ["Philippe the Original","French dip","Claims to have invented it in 1908. Sawdust on the floor, coffee still cheap."],
 ["Langer's Delicatessen","Hot pastrami, #19","Nora Ephron thought it was the best pastrami in America, and she had opinions."],
 ["Guelaguetza","Oaxacan mole","Koreatown, family-run, and the reason to understand mole negro."],
 ["Grand Central Market","Everything","Thirty stalls under one roof downtown, including tacos worth the queue."]],
"CA-san-diego":[
 ["Las Cuatro Milpas","Rolled tacos","Barrio Logan, cash only, closes when the tortillas run out."],
 ["Hodad's","Burger","Ocean Beach, surfboards on the ceiling, and a burger that needs both hands."]],
"CA-monterey":[
 ["Monterey's Fish House","Grilled sardines","Away from Cannery Row, which is why locals eat here. Book ahead."]],
"CA-santa-barbara":[
 ["La Super-Rica Taqueria","Tacos","A shack Julia Child ate at weekly, and the menu has not been modernised."]],
"NV-las-vegas":[
 ["Lotus of Siam","Northern Thai","In a strip mall, and has been the best Thai restaurant in the country for twenty years."],
 ["Raku","Robata","Open until three in the morning for the city's own chefs after their shifts."]],
"WA-seattle":[
 ["Pike Place Chowder","Clam chowder","In the market, in an alley, and there is always a line. It moves."],
 ["Dick's Drive-In","Deluxe burger","A local chain since 1954 that pays its staff properly and takes cash."],
 ["Canlis","Pacific Northwest","Midcentury modern, floor-to-ceiling glass over Lake Union, and a jacket."]],
"OR-portland":[
 ["Voodoo Doughnut","Doughnuts","More of a landmark than a bakery now, but still open at three in the morning."],
 ["Apizza Scholls","Pizza","Limited dough each day, no slices, and no modifications to the toppings."],
 ["Screen Door","Fried chicken and waffles","Weekend queues round the block, and worth one of them."]],
"CO-denver":[
 ["Biker Jim's","Elk and reindeer sausage","Cream cheese from a caulking gun and coca-cola onions. Entirely serious."],
 ["Rioja","Spanish-Mediterranean","On Larimer Square, and the reason the city's dining got taken seriously."]],
"AZ-phoenix":[
 ["Pizzeria Bianco","Margherita","Chris Bianco won a James Beard award for making pizza in a former machine shop."],
 ["Barrio Café","Mexican","Cochinita pibil and guacamole made at the table, in a muraled neighbourhood."]],
"AZ-tucson":[
 ["El Charro Café","Carne seca","The oldest Mexican restaurant in continuous family operation in the country. Beef dried in a cage on the roof."],
 ["Cafe Poca Cosa","Daily menu","Written on a chalkboard twice a day and nothing repeats."]],
"NM-santa-fe":[
 ["The Shed","Red chile enchiladas","In a 1692 adobe off the plaza. Book, or wait."],
 ["Cafe Pasqual's","Huevos motuleños","Open since 1979, murals by Leovigildo Martinez, communal table if you are alone."]],
"NM-albuquerque":[
 ["Frontier Restaurant","Sweet roll and green chile","Opposite the university, open since 1971, enormous, and the sweet roll is the move."],
 ["Mary & Tito's Café","Carne adovada","A James Beard America's Classic, and the stuffed sopaipilla is why."]],
"UT-salt-lake-city":[
 ["Red Iguana","Mole","Seven moles, a queue every night, and a second location that has the same queue."]],
"MO-st-louis":[
 ["Pappy's Smokehouse","Dry-rub ribs","Smoked over apple and cherry, and they stop when they sell out."],
 ["Ted Drewes","Frozen custard","A concrete, served upside down to prove it is thick enough. On old Route 66."]],
"MO-kansas-city":[
 ["Joe's Kansas City Bar-B-Que","Z-Man sandwich","Inside a working petrol station, and still worth the detour."],
 ["Arthur Bryant's","Burnt ends","The sauce is gritty and that is deliberate. Trueman Capote and presidents have eaten here."]],
"TN-nashville":[
 ["Hattie B's","Hot chicken","Start at medium. Hot is hotter than you think and Shut the Cluck Up is not a joke."],
 ["Arnold's Country Kitchen","Meat and three","Cafeteria line, roast beef, and a James Beard award."]],
"TN-memphis":[
 ["Central BBQ","Pulled pork","The ribs are dry-rubbed and the nachos are a legitimate order."],
 ["Charlie Vergos' Rendezvous","Dry ribs","In a basement alley downtown since 1948, and dry rub is the Memphis way."],
 ["Gus's World Famous Fried Chicken","Fried chicken","Spicy, battered, and the original is in Mason, half an hour out."]],
"GA-atlanta":[
 ["Mary Mac's Tea Room","Southern","The last of Atlanta's tea rooms. Write your own order on the pad."],
 ["Busy Bee Café","Fried chicken","On the west side since 1947, and a civil rights movement meeting place."],
 ["The Varsity","Chili dog","What'll ya have. Shouted at you since 1928."]],
"GA-savannah":[
 ["Mrs. Wilkes' Dining Room","Family-style Southern","Ten to a table, bowls passed round, cash only, lunch only, and you clear your own plate."],
 ["The Grey","Low-country","In a restored 1938 Greyhound bus terminal, and the reason the city is a food destination now."]],
"SC-charleston":[
 ["Rodney Scott's BBQ","Whole-hog","Cooked over wood for twelve hours. A James Beard best chef for doing exactly one thing."],
 ["Husk","Southern","Nothing on the menu that is not grown or raised in the South. The menu changes daily."],
 ["Bowens Island","Roasted oysters","Shovelled onto a table under a wet sack. A shack on the marsh, and a Beard classic."]],
"NC-asheville":[
 ["Buxton Hall Barbecue","Eastern-style pork","Whole hog over wood, in a former skating rink, with banana pudding after."],
 ["12 Bones Smokehouse","Blueberry chipotle ribs","Lunch only, weekdays only, and the Obamas went twice."]],
"KY-louisville":[
 ["The Brown Hotel","Hot Brown","Invented here in 1926: turkey, bacon, Mornay, under the grill. Order it where it started."],
 ["Jack Fry's","Pork chop","Open since 1933, originally a bookmaker's front, now the city's best dining room."]],
"FL-miami":[
 ["Versailles","Cuban","The unofficial parliament of Little Havana. Order a cortadito at the window."],
 ["Joe's Stone Crab","Stone crab claws","October to May only, because that is the season. No reservations, ever."]],
"FL-key-west":[
 ["Blue Heaven","Key lime pie","In a yard where Hemingway refereed boxing. Roosters wander between the tables."]],
"MA-boston":[
 ["Neptune Oyster","Lobster roll","Warm with butter, not cold with mayonnaise. Forty-two seats and no reservations."],
 ["Union Oyster House","Oysters","The oldest restaurant in continuous service in the United States, 1826."],
 ["Mike's Pastry","Cannoli","In the North End, cash, and the boxes are tied with string you will see all over the city."]],
"ME-portland":[
 ["Eventide Oyster Co.","Brown butter lobster roll","On a steamed bun, which started an argument and won it."],
 ["Duckfat","Belgian fries","Fried in duck fat, with a poutine that justifies itself."]],
"ME-bar-harbor":[
 ["Thurston's Lobster Pound","Steamed lobster","Picked from a tank, eaten on a dock in Bernard with a bib and a view."]],
"RI-newport":[
 ["The Black Pearl","Clam chowder","On Bannister's Wharf, in a cup, outside, in any weather."]],
"RI-providence":[
 ["Al Forno","Grilled pizza","They invented grilled pizza here in 1980, and the baked pasta is the other order."]],
"CT-new-haven":[
 ["Frank Pepe Pizzeria Napoletana","White clam pie","Coal-fired since 1925, and the clam pie is not optional."],
 ["Louis' Lunch","Hamburger sandwich","Claims the first hamburger, 1900, broiled vertically. No ketchup, and they mean it."]],
"CT-mystic":[
 ["Abbott's Lobster in the Rough","Hot lobster roll","Outdoor picnic tables on Noank harbour, BYO wine, closed in winter."]],
"NY-buffalo":[
 ["Anchor Bar","Buffalo wings","Invented here in 1964. Medium is the baseline, and blue cheese, not ranch."],
 ["Ted's Hot Dogs","Charcoal-broiled hot dog","A local chain since 1927, with loganberry to drink."]],
"PA-philadelphia":[
 ["John's Roast Pork","Roast pork sandwich","With sharp provolone and broccoli rabe, which is the sandwich locals actually rate above cheesesteak."],
 ["Pat's King of Steaks","Cheesesteak","Order wiz wit. Geno's is across the street and the rivalry is the attraction."],
 ["Zahav","Israeli","A James Beard outstanding restaurant, and the lamb shoulder needs booking well ahead."]],
"PA-pittsburgh":[
 ["Primanti Bros.","Almost-famous sandwich","Fries and slaw inside the sandwich, because that is how shift workers ate it one-handed."]],
"MD-baltimore":[
 ["Faidley's Seafood","Jumbo lump crab cake","In Lexington Market, broiled not fried, eaten standing at a counter."]],
"MD-annapolis":[
 ["Cantler's Riverside Inn","Steamed blue crabs","Brown paper, wooden mallet, Old Bay, and a dock to arrive at by boat."]],
"DC-washington":[
 ["Ben's Chili Bowl","Chili half-smoke","On U Street since 1958, stayed open through the 1968 riots, and still cash-friendly."],
 ["Old Ebbitt Grill","Oysters","The oldest bar in the city, and the oyster happy hour is the reason to arrive early."]],
"MI-detroit":[
 ["Buddy's Pizza","Detroit-style square pizza","Invented in this building in 1946, in blue steel pans from the car plants."],
 ["Lafayette Coney Island","Coney dog","Next door to its rival American Coney Island. Pick one and commit."]],
"OH-cincinnati":[
 ["Skyline Chili","Three-way","Cinnamon-spiced chili on spaghetti under a mound of shredded cheddar. It makes sense locally."],
 ["Graeter's","French pot ice cream","Two-gallon batches, hand-paddled, with chocolate chips the size of a thumb."]],
"OH-cleveland":[
 ["Slyman's","Corned beef sandwich","A pound of it, hand-cut, and you will not finish it."],
 ["West Side Market","Everything","Bratwurst, pierogi and crepes under a 1912 vaulted tile ceiling."]],
"WI-milwaukee":[
 ["Kopp's Frozen Custard","Butter burger and custard","Two flavours of the day on top of vanilla and chocolate, posted monthly."],
 ["Mader's","German","Open since 1902, with a collection of armour on the walls."]],
"MN-minneapolis":[
 ["Matt's Bar","Jucy Lucy","Cheese sealed inside the patty. Spelled their way, and it will burn your mouth."]],
"IN-indianapolis":[
 ["St. Elmo Steak House","Shrimp cocktail","The horseradish is so strong it is served as a dare. Since 1902."]],
"HI-honolulu":[
 ["Helena's Hawaiian Food","Pipikaula short ribs","A James Beard America's Classic, family-run, and closes early."],
 ["Leonard's Bakery","Malasadas","Portuguese doughnuts, no hole, rolled in sugar, since 1952."],
 ["Ono Seafood","Poke","Ordered by the pound at a counter and eaten on a kerb. That is the correct way."]],
"HI-hilo":[
 ["Cafe 100","Loco moco","They claim to have popularised it. Rice, burger, egg, gravy, and a window to order at."]],
"HI-kailua-kona":[
 ["Da Poke Shack","Poke bowl","Behind a condo block, and consistently rated the best on the island."]],
"AK-anchorage":[
 ["Moose's Tooth","Pizza and house beer","The busiest pizzeria in the state, and the brewery across town is the same people."],
 ["Snow City Cafe","Reindeer sausage hash","Breakfast, queues, and a crab cake benedict."]],
"AK-juneau":[
 ["Tracy's King Crab Shack","King crab legs","On the dock by the cruise berths, and worth it despite that."]],
"WY-jackson":[
 ["Snake River Grill","Game","Elk, bison and a serious wine list, on the town square. Book in season."]],
"SD-rapid-city":[
 ["Tally's Silver Spoon","Bison","Downtown, local meat, and a proper breakfast before the Black Hills."]],
"AL-birmingham":[
 ["Saw's BBQ","Pulled pork with white sauce","Alabama white sauce is mayonnaise and vinegar, and it works."]],
"VA-richmond":[
 ["Sally Bell's Kitchen","Boxed lunch","A paper box with a sandwich, a deviled egg half and a cupcake upside down. Unchanged since 1926."]],
"FL-st-augustine":[
 ["Columbia Restaurant","Paella and 1905 salad","Founded in Tampa in 1905, and the salad is tossed at the table."]],
"NM-taos":[
 ["Love Apple","New Mexican","In a former chapel, by candlelight, cash only, and tiny. Book."]],
"CO-telluride":[
 ["Brown Dog Pizza","Detroit-style pizza","Won the World Pizza Championship in Italy with a Detroit square, which Telluride finds very funny."]],
"MT-whitefish":[
 ["Loula's Café","Pie","Nine kinds daily, and the huckleberry is the one if it is on."]],
"ID-boise":[
 ["Fork","Idaho trout","Locally sourced to a fault, in a 1910 bank building downtown."]],
"OK-oklahoma-city":[
 ["Cattlemen's Steakhouse","Ribeye","In Stockyards City since 1910, and it was once won in a dice game."]],
"NE-omaha":[
 ["Block 16","Croque Garcon burger","A fried egg and a hash brown on top. A former food truck that stayed."]],
"MS-biloxi":[
 ["Mary Mahoney's","Gumbo","In a 1737 French house, one of the oldest buildings on the Gulf Coast."]],
"UT-moab":[
 ["Milt's Stop & Eat","Burger and shake","Open since 1954, the oldest restaurant in town, and eight stools."]],
"WV-fayetteville":[
 ["Pies & Pints","Pizza","Started here before it spread, and the grape-and-gorgonzola is the house oddity worth ordering."]],
"MA-salem":[
 ["Turner's Seafood","Lobster bake","In Lyceum Hall, where Alexander Graham Bell made the first long-distance call."]],
"VT-burlington":[
 ["Hen of the Wood","Mushroom toast","In a 19th-century grist mill in Waterbury, or the Burlington room by the hotel."]],
"NH-portsmouth":[
 ["Row 34","Oysters","Their own oyster farm up the coast, and a raw bar to work through."]],
"MI-mackinac-island":[
 ["Grand Hotel dining room","Pecan ball","Five courses, a dress code, and a dessert the hotel is known for."]],
"IA-des-moines":[
 ["Zombie Burger","Burger","Over-the-top by design, in the East Village, and the milkshakes are the same."]],
"KS-kansas-city":[
 ["Joe's Kansas City Bar-B-Que","Burnt ends","The Kansas side, in the petrol station, and the original of the two."]],
"AR-hot-springs":[
 ["McClard's Bar-B-Q","Ribs and tamale spread","Open since 1928, and Bill Clinton grew up eating here."]],
"NC-charlotte":[
 ["Price's Chicken Coop","Fried chicken","Takeaway only, cash only, and a queue of office workers at noon."]],
"SC-myrtle-beach":[
 ["Sea Captain's House","She-crab soup","In a 1930 beach cottage, with the Atlantic through the dining room windows."]]
};

/* ---------- merge, same rules as parks.js ---------- */
(function mergeCities(){
  if (typeof TODO === 'undefined' || typeof EAT === 'undefined') return;
  Object.keys(USA_TODO).forEach(k=>{
    TODO[k] = TODO[k] || [];
    const have = new Set(TODO[k].map(r=>String(r[0]).toLowerCase()));
    USA_TODO[k].forEach(r=>{ if (!have.has(String(r[0]).toLowerCase())) TODO[k].push(r); });
  });
  Object.keys(USA_EAT).forEach(k=>{
    EAT[k] = EAT[k] || [];
    const have = new Set(EAT[k].map(r=>String(r[0]).toLowerCase()));
    USA_EAT[k].forEach(r=>{ if (!have.has(String(r[0]).toLowerCase())) EAT[k].push(r); });
  });
})();
