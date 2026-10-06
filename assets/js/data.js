/* ===========================================================
   DATA — this is the only part you edit to add places.
   STATES : [name, abbr, timezone, [ [city, lat, lon, tzOverride?] ... ]]
   VISITED: "AB-city-slug" keys for places you have been
   TODO   : things to do, keyed the same way  [title, description, tag]
   STATEWIDE: parks / regions / falls that belong to no single city
   EAT    : restaurants, keyed the same way   [name, cuisine, note]
   =========================================================== */
const STATES = [
["Alabama","AL","America/Chicago",[["Birmingham",33.52,-86.80],["Huntsville",34.73,-86.59],["Montgomery",32.38,-86.30],["Mobile",30.69,-88.04]]],
["Alaska","AK","America/Anchorage",[["Anchorage",61.22,-149.90],["Juneau",58.30,-134.42],["Fairbanks",64.84,-147.72],["Seward",60.10,-149.44]]],
["Arizona","AZ","America/Phoenix",[["Phoenix",33.45,-112.07],["Tucson",32.22,-110.97],["Sedona",34.87,-111.76],["Flagstaff",35.20,-111.65]]],
["Arkansas","AR","America/Chicago",[["Little Rock",34.75,-92.29],["Hot Springs",34.50,-93.06],["Fayetteville",36.06,-94.16]]],
["California","CA","America/Los_Angeles",[["Los Angeles",34.05,-118.24],["San Francisco",37.77,-122.42],["San Diego",32.72,-117.16],["Sacramento",38.58,-121.49],["San Jose",37.34,-121.89],["Santa Barbara",34.42,-119.70],["Monterey",36.60,-121.89],["Palm Springs",33.83,-116.55]]],
["Colorado","CO","America/Denver",[["Denver",39.74,-104.99],["Colorado Springs",38.83,-104.82],["Boulder",40.01,-105.27],["Aspen",39.19,-106.82]]],
["Connecticut","CT","America/New_York",[["Hartford",41.76,-72.67],["New Haven",41.31,-72.93],["Mystic",41.35,-71.97]]],
["Delaware","DE","America/New_York",[["Wilmington",39.74,-75.55],["Dover",39.16,-75.52],["Rehoboth Beach",38.72,-75.08]]],
["District of Columbia","DC","America/New_York",[["Washington",38.91,-77.04]]],
["Florida","FL","America/New_York",[["Miami",25.76,-80.19],["Key West",24.56,-81.78],["Tampa",27.95,-82.46],["Sarasota",27.34,-82.53],["Panama City",30.16,-85.66,"America/Chicago"],["Destin",30.39,-86.50,"America/Chicago"],["Tallahassee",30.44,-84.28],["Orlando",28.54,-81.38],["Jacksonville",30.33,-81.66],["St. Augustine",29.90,-81.31]]],
["Georgia","GA","America/New_York",[["Atlanta",33.75,-84.39],["Savannah",32.08,-81.09],["Athens",33.96,-83.38]]],
["Hawaii","HI","Pacific/Honolulu",[["Honolulu",21.31,-157.86],["Hilo",19.71,-155.08],["Lahaina",20.88,-156.68]]],
["Idaho","ID","America/Boise",[["Boise",43.62,-116.20],["Coeur d'Alene",47.68,-116.78],["Idaho Falls",43.49,-112.03]]],
["Illinois","IL","America/Chicago",[["Chicago",41.88,-87.63],["Springfield",39.80,-89.64],["Galena",42.42,-90.43]]],
["Indiana","IN","America/Indiana/Indianapolis",[["Indianapolis",39.77,-86.16],["Bloomington",39.17,-86.53],["South Bend",41.68,-86.25]]],
["Iowa","IA","America/Chicago",[["Des Moines",41.59,-93.62],["Iowa City",41.66,-91.53],["Dubuque",42.50,-90.66]]],
["Kansas","KS","America/Chicago",[["Wichita",37.69,-97.34],["Kansas City",39.11,-94.63],["Lawrence",38.97,-95.24]]],
["Kentucky","KY","America/New_York",[["Louisville",38.25,-85.76],["Lexington",38.04,-84.50],["Bowling Green",36.99,-86.44,"America/Chicago"]]],
["Louisiana","LA","America/Chicago",[["New Orleans",29.95,-90.07],["Baton Rouge",30.45,-91.19],["Lafayette",30.22,-92.02],["Shreveport",32.53,-93.75]]],
["Maine","ME","America/New_York",[["Portland",43.66,-70.26],["Bar Harbor",44.39,-68.20],["Augusta",44.31,-69.78]]],
["Maryland","MD","America/New_York",[["Baltimore",39.29,-76.61],["Frederick",39.41,-77.41],["Annapolis",38.98,-76.49],["Ocean City",38.34,-75.08]]],
["Massachusetts","MA","America/New_York",[["Boston",42.36,-71.06],["Cambridge",42.37,-71.11],["Salem",42.52,-70.90],["Provincetown",42.05,-70.19]]],
["Michigan","MI","America/Detroit",[["Detroit",42.33,-83.05],["Ann Arbor",42.28,-83.74],["Grand Rapids",42.96,-85.67],["Traverse City",44.76,-85.62]]],
["Minnesota","MN","America/Chicago",[["Minneapolis",44.98,-93.27],["Saint Paul",44.95,-93.09],["Duluth",46.79,-92.10]]],
["Mississippi","MS","America/Chicago",[["Jackson",32.30,-90.18],["Biloxi",30.40,-88.89],["Natchez",31.56,-91.40]]],
["Missouri","MO","America/Chicago",[["St. Louis",38.63,-90.20],["Kansas City",39.10,-94.58],["Branson",36.64,-93.22]]],
["Montana","MT","America/Denver",[["Billings",45.78,-108.50],["Bozeman",45.68,-111.04],["Missoula",46.87,-113.99],["Whitefish",48.41,-114.34]]],
["Nebraska","NE","America/Chicago",[["Omaha",41.26,-95.93],["Lincoln",40.81,-96.68]]],
["Nevada","NV","America/Los_Angeles",[["Las Vegas",36.17,-115.14],["Reno",39.53,-119.81],["Carson City",39.16,-119.77]]],
["New Hampshire","NH","America/New_York",[["Manchester",42.99,-71.46],["Portsmouth",43.07,-70.76],["North Conway",44.05,-71.13]]],
["New Jersey","NJ","America/New_York",[["Jersey City",40.73,-74.07],["Newark",40.74,-74.17],["Atlantic City",39.36,-74.42],["Princeton",40.35,-74.66],["Cape May",38.94,-74.92]]],
["New Mexico","NM","America/Denver",[["Albuquerque",35.08,-106.65],["Santa Fe",35.69,-105.94],["Taos",36.41,-105.57]]],
["New York","NY","America/New_York",[["New York City",40.71,-74.01],["Buffalo",42.89,-78.88],["Rochester",43.16,-77.61],["Syracuse",43.05,-76.15],["Albany",42.65,-73.76],["Ithaca",42.44,-76.50],["Saratoga Springs",43.08,-73.78],["Montauk",41.04,-71.95]]],
["North Carolina","NC","America/New_York",[["Charlotte",35.23,-80.84],["Raleigh",35.78,-78.64],["Asheville",35.60,-82.55],["Wilmington",34.23,-77.94]]],
["North Dakota","ND","America/Chicago",[["Fargo",46.88,-96.79],["Bismarck",46.81,-100.78],["Medora",46.92,-103.52,"America/Denver"]]],
["Ohio","OH","America/New_York",[["Columbus",39.96,-83.00],["Cleveland",41.50,-81.69],["Cincinnati",39.10,-84.51]]],
["Oklahoma","OK","America/Chicago",[["Oklahoma City",35.47,-97.52],["Tulsa",36.15,-95.99]]],
["Oregon","OR","America/Los_Angeles",[["Portland",45.52,-122.68],["Bend",44.06,-121.32],["Eugene",44.05,-123.09],["Cannon Beach",45.89,-123.96]]],
["Pennsylvania","PA","America/New_York",[["Philadelphia",39.95,-75.17],["Pittsburgh",40.44,-80.00],["Harrisburg",40.27,-76.88],["Hershey",40.29,-76.65],["Gettysburg",39.83,-77.23],["Lancaster",40.04,-76.31]]],
["Rhode Island","RI","America/New_York",[["Providence",41.82,-71.41],["Newport",41.49,-71.31]]],
["South Carolina","SC","America/New_York",[["Charleston",32.78,-79.93],["Columbia",34.00,-81.03],["Greenville",34.85,-82.39],["Myrtle Beach",33.69,-78.89]]],
["South Dakota","SD","America/Chicago",[["Sioux Falls",43.55,-96.73],["Rapid City",44.08,-103.23,"America/Denver"],["Deadwood",44.38,-103.73,"America/Denver"]]],
["Tennessee","TN","America/Chicago",[["Nashville",36.16,-86.78],["Memphis",35.15,-90.05],["Chattanooga",35.05,-85.31,"America/New_York"],["Knoxville",35.96,-83.92,"America/New_York"],["Gatlinburg",35.71,-83.51,"America/New_York"]]],
["Texas","TX","America/Chicago",[["Houston",29.76,-95.37],["Dallas-Fort Worth",32.78,-96.80],["Austin",30.27,-97.74],["San Antonio",29.42,-98.49],["Fredericksburg",30.27,-98.87],["Galveston",29.30,-94.80],["Corpus Christi",27.80,-97.40],["El Paso",31.76,-106.49,"America/Denver"]]],
["Utah","UT","America/Denver",[["Salt Lake City",40.76,-111.89],["Moab",38.57,-109.55],["Park City",40.65,-111.50],["Springdale",37.19,-112.99]]],
["Vermont","VT","America/New_York",[["Burlington",44.48,-73.21],["Stowe",44.47,-72.69],["Montpelier",44.26,-72.58]]],
["Virginia","VA","America/New_York",[["Richmond",37.54,-77.44],["Virginia Beach",36.85,-75.98],["Charlottesville",38.03,-78.48],["Alexandria",38.80,-77.05],["Williamsburg",37.27,-76.71]]],
["Washington","WA","America/Los_Angeles",[["Seattle",47.61,-122.33],["Spokane",47.66,-117.43],["Tacoma",47.25,-122.44],["Port Angeles",48.12,-123.43]]],
["West Virginia","WV","America/New_York",[["Charleston",38.35,-81.63],["Morgantown",39.63,-79.96],["Lewisburg",37.80,-80.45]]],
["Wisconsin","WI","America/Chicago",[["Milwaukee",43.04,-87.91],["Madison",43.07,-89.40],["Sturgeon Bay",44.83,-87.38]]],
["Wyoming","WY","America/Denver",[["Cheyenne",41.14,-104.82],["Jackson",43.48,-110.76],["Cody",44.53,-109.06]]]
];

const VISITED = new Set([
"NY-new-york-city","NJ-jersey-city",
"FL-miami","FL-key-west","FL-tampa","FL-sarasota","FL-panama-city","FL-destin","FL-tallahassee",
"PA-pittsburgh","PA-hershey","PA-harrisburg",
"DC-washington","VA-richmond","MD-frederick",
"TN-nashville","LA-new-orleans",
"TX-houston","TX-dallas-fort-worth","TX-austin","TX-fredericksburg","TX-san-antonio",
"IL-chicago","CA-san-diego","CA-san-francisco"
]);

/* Parks, falls, lakes and regions that sit under a state rather than a city.
   [ title, lat, lon, description, tag, been ] */
const STATEWIDE = {
NY:[
 ["Niagara Falls",43.08,-79.07,"Three falls on the Canadian border. The Cave of the Winds deck puts you directly under Bridal Veil.","FALLS",true],
 ["Letchworth State Park",42.57,-78.00,"Seventeen miles of gorge cut by the Genesee River, with three major waterfalls and cliffs up to 550 feet.","STATE PARK",true],
 ["The Finger Lakes",42.67,-76.80,"Eleven long glacial lakes with the densest run of wineries in the state, and a gorge trail at nearly every southern end.","REGION",true]
],
VA:[
 ["Shenandoah National Park",38.53,-78.35,"Skyline Drive runs 105 miles along the Blue Ridge with seventy-five overlooks and Old Rag at the southern end.","NATIONAL PARK",true]
],
TN:[
 ["Great Smoky Mountains National Park",35.65,-83.51,"The most visited national park in the country, straddling the North Carolina line. Cades Cove loop opens at dawn.","NATIONAL PARK",true]
],
WV:[
 ["Harpers Ferry",39.33,-77.74,"Where the Shenandoah meets the Potomac and three states meet. The town is West Virginia; the park reaches into Virginia and Maryland.","HISTORIC",true]
]
};

/* Things to do. [ title, description, tag ] */
const TODO = {
"NY-new-york-city":[
 ["Central Park","843 acres. The Ramble and Bethesda Terrace are the parts worth slowing down for.","OUTDOORS"],
 ["The Metropolitan Museum of Art","Two million works across two million square feet. The roof garden opens in warm months.","MUSEUM"],
 ["Brooklyn Bridge","Walk it from the Brooklyn side early, before the crowd fills the centre lane.","WALK"]
],
"NJ-jersey-city":[
 ["Liberty State Park","The closest land view of the Statue of Liberty, with the whole Manhattan skyline behind it.","OUTDOORS"],
 ["Exchange Place waterfront","The ferry crosses to lower Manhattan in under ten minutes.","VIEW"]
],
"FL-miami":[
 ["Wynwood Walls","A warehouse district turned open-air mural gallery, repainted constantly.","ART"],
 ["Vizcaya Museum and Gardens","A 1916 bayfront villa with ten acres of formal Italian gardens.","HISTORIC"],
 ["South Beach Art Deco District","Around 800 preserved buildings between 5th and 23rd.","WALK"]
],
"FL-key-west":[
 ["Mallory Square at sunset","Street performers gather nightly for the last twenty minutes of light.","FREE"],
 ["Ernest Hemingway Home","Still home to several dozen six-toed cats descended from the originals.","HISTORIC"],
 ["Southernmost Point buoy","Ninety miles to Cuba, and a queue for the photo most of the day.","LANDMARK"]
],
"FL-tampa":[
 ["Ybor City","The old cigar quarter, with free-roaming roosters and the 1905 Columbia Restaurant.","WALK"],
 ["Tampa Riverwalk","Two and a half miles along the Hillsborough, linking most of downtown.","OUTDOORS"]
],
"FL-sarasota":[
 ["Siesta Key Beach","Quartz sand so pale it stays cool underfoot in August.","BEACH"],
 ["The Ringling","The circus magnate's art museum, Venetian Gothic mansion and a scale model of the whole circus.","MUSEUM"]
],
"FL-panama-city":[
 ["St. Andrews State Park","Dunes, a jetty and flat water on the lagoon side.","OUTDOORS"],
 ["Shell Island","An undeveloped barrier island, reachable only by boat.","BEACH"]
],
"FL-destin":[
 ["Henderson Beach State Park","Thirty-foot dunes above the clearest water on the panhandle.","BEACH"],
 ["Destin Harbor Boardwalk","The fishing fleet unloads the day's catch mid-afternoon.","WALK"]
],
"FL-tallahassee":[
 ["Cascades Park","An amphitheatre and waterfall at the edge of downtown.","OUTDOORS"],
 ["Florida State Capitol","The restored 1845 capitol stands in front of the modern tower.","LANDMARK"]
],
"PA-pittsburgh":[
 ["Duquesne Incline","An 1877 funicular up Mount Washington to the view of the three rivers.","VIEW"],
 ["The Andy Warhol Museum","The largest museum anywhere devoted to a single artist.","MUSEUM"],
 ["The Strip District","Markets, delis and the original Primanti Brothers counter.","FOOD"]
],
"PA-hershey":[
 ["Hersheypark","Fourteen roller coasters on the hill above the chocolate factory.","THEME PARK"],
 ["Hershey Gardens","Twenty-three acres, including an indoor butterfly atrium.","OUTDOORS"]
],
"PA-harrisburg":[
 ["Pennsylvania State Capitol","A Beaux-Arts dome modelled on St. Peter's, free to tour.","LANDMARK"],
 ["Riverfront Park","A long promenade on the Susquehanna, the widest river on the east coast.","WALK"]
],
"DC-washington":[
 ["The National Mall","Two miles of monuments with free national museums along both sides.","WALK"],
 ["National Air and Space Museum","Free, and holds the Wright Flyer and the Apollo 11 command module.","MUSEUM"],
 ["Tidal Basin cherry blossom","Peak bloom lasts roughly a week, usually late March.","SEASONAL"]
],
"VA-richmond":[
 ["Virginia Museum of Fine Arts","Free, and open 365 days a year.","MUSEUM"],
 ["James River Park System","Class III and IV rapids running through the middle of the city.","OUTDOORS"]
],
"MD-frederick":[
 ["Carroll Creek Park","A canal walk with painted bridges through the middle of town.","WALK"],
 ["Downtown Frederick","Fifty blocks of preserved 18th and 19th century buildings.","HISTORIC"]
],
"TN-nashville":[
 ["Country Music Hall of Fame","Traces the music back to its string-band and gospel roots.","MUSEUM"],
 ["Lower Broadway","Live music from late morning to closing, and no cover anywhere.","MUSIC"],
 ["Centennial Park","Holds a full-scale replica of the Parthenon, complete with the statue.","OUTDOORS"]
],
"LA-new-orleans":[
 ["Jackson Square","Laid out in 1721 as the Place d'Armes, with St. Louis Cathedral behind it.","LANDMARK"],
 ["Frenchmen Street","Three blocks of live brass and jazz past the edge of the Quarter.","AFTER DARK"],
 ["St. Charles streetcar","The oldest streetcar line still running anywhere, under the Garden District oaks.","RIDE"],
 ["City Park","Thirteen hundred acres holding one of the largest stands of mature live oaks left.","OUTDOORS"]
],
"TX-houston":[
 ["Space Center Houston","Historic Mission Control and a complete Saturn V lying on its side.","MUSEUM"],
 ["The Museum District","Nineteen museums inside a mile and a half, several of them free.","MUSEUM"],
 ["Buffalo Bayou Park","160 acres of trail and cistern directly below downtown.","OUTDOORS"]
],
"TX-dallas-fort-worth":[
 ["Fort Worth Stockyards","A longhorn drive down Exchange Avenue twice a day.","HISTORIC"],
 ["Dallas Arts District","The largest contiguous arts district in the country, nineteen blocks of it.","ART"],
 ["Kimbell Art Museum","Louis Kahn's vaulted galleries; the permanent collection is free.","MUSEUM"]
],
"TX-austin":[
 ["Barton Springs Pool","Three acres of spring-fed water in Zilker Park, holding 68-70°F all year.","OUTDOORS"],
 ["Texas State Capitol","Pink granite, and taller than the national Capitol. Free tours run all day.","LANDMARK"],
 ["Congress Avenue Bridge bats","North America's largest urban bat colony pours out at dusk, March to October.","SEASONAL"],
 ["South Congress Avenue","Boot shops, murals and the long view back up the hill to the dome.","WALK"],
 ["Lady Bird Lake Trail","A ten-mile crushed-granite loop straight through downtown.","OUTDOORS"]
],
"TX-fredericksburg":[
 ["Enchanted Rock","A 425-foot pink granite dome a short drive north; go at first light in summer.","OUTDOORS"],
 ["Main Street","German bakeries, and the National Museum of the Pacific War at the east end.","WALK"]
],
"TX-san-antonio":[
 ["The Alamo","Free entry to the mission church, in the middle of downtown.","HISTORIC"],
 ["River Walk","Fifteen miles of walkway one storey below the street.","WALK"],
 ["San Antonio Missions","Four Spanish colonial missions on a World Heritage trail you can bike.","HISTORIC"]
],
"IL-chicago":[
 ["Art Institute of Chicago","The second largest art museum in the country.","MUSEUM"],
 ["Architecture river cruise","Still the clearest way to read the skyline.","TOUR"],
 ["Millennium Park","Cloud Gate, and free concerts under the Pritzker shell all summer.","FREE"]
],
"CA-san-diego":[
 ["Balboa Park","Twelve hundred acres holding seventeen museums and the zoo.","OUTDOORS"],
 ["La Jolla Cove","Sea lions, sea caves and a protected area for snorkelling.","BEACH"],
 ["USS Midway Museum","An aircraft carrier you walk the flight deck and hangar of.","MUSEUM"]
],
"CA-san-francisco":[
 ["Golden Gate Bridge","Walk the east sidewalk; Battery Spencer has the view back.","LANDMARK"],
 ["Golden Gate Park","Larger than Central Park, with the de Young and the conservatory inside.","OUTDOORS"],
 ["Alcatraz Island","Book weeks ahead. The night tour is the better one.","TOUR"]
]
};

/* Restaurants. Add entries as [ name, cuisine, note ]. */
const EAT = {};

/* Country and continent level things to do. */
const COUNTRY_TODO = [];
const CONTINENT_TODO = [];

/* ===========================================================
   THE WORLD — continents and the countries under them.
   Add a country by adding its name to the list. Every country
   gets its own page, whether or not anything is logged on it.
   =========================================================== */
const WORLD = [
["North America","Blue Ridge to the Rio Grande, and everything that drains into the Gulf.",[
 "United States","Canada","Mexico","Guatemala","Belize","Honduras","El Salvador","Nicaragua","Costa Rica","Panama",
 "Cuba","Jamaica","Dominican Republic","Haiti","Puerto Rico","Bahamas","Barbados","Trinidad and Tobago",
 "Saint Lucia","Antigua and Barbuda","Grenada","Aruba","Curacao","Bermuda","Greenland"]],
["South America","The Andes down one side, the Amazon across the middle.",[
 "Brazil","Argentina","Chile","Peru","Bolivia","Ecuador","Colombia","Venezuela","Uruguay","Paraguay",
 "Guyana","Suriname","French Guiana"]],
["Europe","Short distances, long histories, very good trains.",[
 "United Kingdom","Ireland","France","Spain","Portugal","Italy","Germany","Netherlands","Belgium","Luxembourg",
 "Switzerland","Austria","Czechia","Poland","Hungary","Slovakia","Slovenia","Croatia","Bosnia and Herzegovina",
 "Serbia","Montenegro","Albania","North Macedonia","Greece","Bulgaria","Romania","Moldova","Denmark","Sweden",
 "Norway","Finland","Iceland","Estonia","Latvia","Lithuania","Ukraine","Malta","Cyprus","Monaco","Andorra","San Marino"]],
["Asia","The largest continent, and the one with the most time zones to cross.",[
 "Japan","South Korea","China","Taiwan","Mongolia","Thailand","Vietnam","Cambodia","Laos","Myanmar","Malaysia",
 "Singapore","Indonesia","Philippines","Brunei","India","Sri Lanka","Nepal","Bhutan","Maldives","Pakistan",
 "Bangladesh","United Arab Emirates","Saudi Arabia","Qatar","Bahrain","Kuwait","Oman","Jordan","Israel","Lebanon",
 "Turkey","Georgia","Armenia","Azerbaijan","Uzbekistan","Kazakhstan","Kyrgyzstan","Tajikistan","Turkmenistan"]],
["Africa","Fifty-four countries, and more ecological range than any other landmass.",[
 "Morocco","Algeria","Tunisia","Libya","Egypt","Sudan","Ethiopia","Eritrea","Djibouti","Somalia","Kenya",
 "Tanzania","Uganda","Rwanda","Burundi","South Africa","Lesotho","Eswatini","Namibia","Botswana","Zimbabwe",
 "Zambia","Malawi","Mozambique","Madagascar","Mauritius","Seychelles","Ghana","Nigeria","Senegal","Gambia",
 "Ivory Coast","Mali","Burkina Faso","Benin","Togo","Cameroon","Gabon","Congo","Democratic Republic of the Congo",
 "Angola","Cape Verde"]],
["Oceania","Mostly ocean, and the first places on earth to see each new day.",[
 "Australia","New Zealand","Fiji","Papua New Guinea","French Polynesia","Samoa","Tonga","Vanuatu",
 "Solomon Islands","New Caledonia","Cook Islands","Palau","Micronesia","Marshall Islands","Kiribati"]],
["Antarctica","No permanent residents, and a season that runs November to March.",[
 "Antarctic Peninsula","Ross Sea","South Georgia"]]
];

/* The only country with states and cities wired up so far. Point this at
   another country later and the state and city levels follow it. */
const DETAILED_COUNTRY = "United States";

/* Which cities appear on the homepage clock board, which three are
   featured below the map, and which map pins carry a label. */
const BOARD = ["NY-new-york-city","IL-chicago","TX-austin","CA-san-francisco"];
const FEATURED = ["TX-austin","LA-new-orleans","CA-san-francisco"];
const LABELLED = new Set(["NY-new-york-city","IL-chicago","TX-austin","CA-san-francisco","CA-san-diego",
  "FL-miami","LA-new-orleans","TN-nashville","DC-washington","WA-seattle","CO-denver","CA-los-angeles"]);
