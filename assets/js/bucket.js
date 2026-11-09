/* ===========================================================
   BUCKET — a hundred things to do, not a hundred places to see.

   One row per activity:

     [ name, place, country, cat, m1, m2, blurb, query, official ]

   country   a country slug from world.js, so the activity can appear
             on that country's page
   cat       the kind of thing it is, keyed into BK_CAT below
   m1 m2     the months it is actually possible. m2 < m1 means the
             window crosses new year. 1–12 means all year.
   query     what to search a booking marketplace for. Deliberately
             not a deep link: operators come and go, and a product URL
             that 404s in six months is worse than a search that works.
   official  the operator's own site, only where that operator IS the
             activity and is not going anywhere.

   ---------------------------------------------------------
   MONEY: paste your affiliate IDs into BK_PARTNER below and every
   outbound link on the site starts earning. Until then the links work
   exactly the same, they just do not pay. Sign up at
   partner.getyourguide.com and viatorpartners.com — both are free.
   =========================================================== */

const BK_PARTNER = {
  getyourguide: "",   // your GetYourGuide partner_id
  viator:       ""    // your Viator campaign / pid
};

const BK_CAT = {
  drive:  ['ON WHEELS',   '#d2622f'],
  air:    ['IN THE AIR',  '#3f8fd0'],
  water:  ['IN THE WATER','#1f8fa8'],
  snow:   ['ON SNOW',     '#6c8fc4'],
  height: ['UP HIGH',     '#7a6ac4'],
  rush:   ['PURE NERVE',  '#e0504f'],
  wild:   ['WILDLIFE',    '#5f9b35'],
  light:  ['AFTER DARK',  '#4a5bbf'],
  culture:['BEING THERE', '#c08a2c'],
  food:   ['AT THE TABLE','#cf9a1f'],
  rail:   ['THE LONG WAY','#8a7f6d']
};

const BUCKET = [

/* ---------- on wheels ---------- */
["Drift school at Ebisu Circuit","Fukushima","japan","drive",3,11,"The spiritual home of drifting. Beginner days put you in a prepared car with an instructor and let you destroy tyres legally.","drift experience Ebisu Circuit Japan",""],
["Drive the Leh–Ladakh highway","Ladakh","india","drive",6,9,"Five hundred kilometres over passes above 17,000 feet. Open only in summer, and the altitude is not a joke.","Leh Ladakh road trip motorcycle tour",""],
["Ice driving in Swedish Lapland","Arjeplog","sweden","drive",1,3,"Where every car manufacturer tests winter handling. You get the same frozen lakes and the same instructors.","ice driving experience Swedish Lapland",""],
["4x4 across Erg Chebbi","Merzouga","morocco","drive",10,4,"Dune bashing into the Sahara, then a camp with no light pollution for three hundred kilometres.","Merzouga 4x4 desert tour Erg Chebbi",""],
["Street karting in costume","Tokyo","japan","drive",1,12,"Go-karts on public Tokyo roads, in costume, through Shibuya at night. You need an International Driving Permit — get it before you fly.","street kart Tokyo experience",""],
["Tourist laps of the Nordschleife","Nürburg","germany","drive",3,11,"Thirteen miles and seventy-three corners of the Green Hell, open to anyone with a road car and twenty-five euros.","Nurburgring Nordschleife tourist drive","https://nuerburgring.de/"],
["Ride the Hai Van Pass","Da Nang to Hue","vietnam","drive",2,8,"The coastal pass Top Gear made famous. Hire a bike with luggage transfer and do it in a day.","Hai Van Pass motorbike tour Vietnam",""],
["Drive Route 66 end to end","Chicago to Santa Monica","united-states","drive",4,10,"Two thousand four hundred miles of the old alignment, which takes two weeks to do properly.","Route 66 road trip guided tour",""],
["Transfăgărășan Highway","Carpathians","romania","drive",6,10,"Ceaușescu's military road over the mountains. Closed by snow more than half the year.","Transfagarasan highway tour Romania",""],
["Great Ocean Road","Victoria","australia","drive",1,12,"Two hundred and forty kilometres of cliff road, the Twelve Apostles, and koalas at Kennett River.","Great Ocean Road tour from Melbourne",""],
["Carretera Austral","Patagonia","chile","drive",11,3,"Twelve hundred kilometres of mostly gravel through fjords and ice fields, with ferries you have to book.","Carretera Austral Patagonia self drive",""],
["Iceland's Ring Road","Route 1","iceland","drive",6,9,"Waterfalls, glaciers, puffins and black sand in one 1,332-kilometre loop. Ten days is the minimum.","Iceland ring road self drive tour",""],

/* ---------- in the air ---------- */
["Take your first flying lesson","Anywhere with a flight school","united-states","air",1,12,"An introductory flight puts you in the left seat with an instructor on the pedals. An hour, and it logs towards a licence if you continue.","introductory flight lesson discovery flight",""],
["Skydive over Palm Jumeirah","Dubai","united-arab-emirates","air",10,4,"Thirteen thousand feet over an artificial archipelago. The most photographed tandem exit in the world.","Dubai Palm Jumeirah tandem skydive",""],
["Balloon over Cappadocia","Göreme","turkey","air",4,10,"A hundred and fifty balloons up at once over rock valleys and cave churches. Flights cancel for wind constantly, so allow spare days.","Cappadocia hot air balloon flight",""],
["Balloon over the Masai Mara","Mara Triangle","kenya","air",7,10,"Dawn launch over the migration, landing to a breakfast laid out on the plain.","Masai Mara hot air balloon safari",""],
["Paraglide over Phewa Lake","Pokhara","nepal","air",10,4,"Thermals off Sarangkot with the Annapurnas on the skyline. One of the cheapest tandem flights anywhere.","Pokhara paragliding tandem flight",""],
["Helicopter over Victoria Falls","Livingstone","zambia","air",2,7,"The Flight of Angels. Fifteen minutes, and the only way to see the whole width of the falls at once.","Victoria Falls helicopter flight",""],
["Skydive over Interlaken","Bernese Oberland","switzerland","air",5,10,"Out of a helicopter, over glaciers, with the Eiger and Jungfrau filling the window.","Interlaken skydiving helicopter",""],
["Fly into Milford Sound","Fiordland","new-zealand","air",11,4,"A small plane or floatplane over the Southern Alps, landing on the water between thousand-metre walls.","Milford Sound scenic flight",""],
["Weightless parabolic flight","Las Vegas","united-states","air",1,12,"A modified 727 flies fifteen parabolas and you float for thirty seconds at a time. The closest you get to orbit on a tourist budget.","zero gravity weightless flight experience","https://www.gozerog.com/"],
["Fly a glider over the Alps","Innsbruck","austria","air",5,9,"Engineless, riding mountain waves, for hours. Quieter than anything else you will do in the air.","glider flight Alps scenic Innsbruck",""],

/* ---------- in the water ---------- */
["Kayak a bioluminescent bay","Mosquito Bay, Vieques","puerto-rico","water",1,12,"The brightest bioluminescent bay on earth. Every paddle stroke lights up. Book a new-moon night in dry season or you will see almost nothing.","Vieques bioluminescent bay kayak tour",""],
["Dive the Great Blue Hole","Lighthouse Reef","belize","water",4,6,"A 124-metre sinkhole with a stalactite ceiling at forty metres. Advanced certification and a serious operator only.","Great Blue Hole dive Belize",""],
["Swim with whale sharks","Ningaloo Reef","australia","water",3,7,"The largest fish on earth, in water clear enough to see it coming. Spotter planes find them and you slip in.","Ningaloo Reef whale shark swim",""],
["Cage dive with great whites","Gansbaai","south-africa","water",5,9,"Shark Alley, between a seal colony and an island. You are in the cage; the boat stays put.","Gansbaai great white shark cage diving",""],
["Dive between two continents","Silfra, Þingvellir","iceland","water",6,9,"A flooded rift between the North American and Eurasian plates, in glacial meltwater with a hundred metres of visibility.","Silfra fissure snorkeling diving Iceland",""],
["Raft the Zambezi","Batoka Gorge","zambia","water",8,12,"Grade five, straight out of the base of Victoria Falls, through a gorge you cannot climb out of.","Zambezi white water rafting Victoria Falls",""],
["Learn to surf in Peniche","Estremadura","portugal","water",5,10,"Beach breaks on both sides of a peninsula, so something is always working whatever the wind does.","Peniche surf lesson camp Portugal",""],
["Snorkel with orcas","Skjervøy","norway","water",11,1,"Herring draw orca and humpback into the fjords in winter. You are in a drysuit, in the Arctic, in the dark half of the year.","Norway orca whale snorkeling Skjervoy",""],
["Night dive with manta rays","Kona, Hawaii","united-states","water",1,12,"Lights on the seabed draw plankton, plankton draws mantas, and they feed in loops around you for an hour.","Kona manta ray night snorkel Hawaii",""],
["Dive Blue Corner","Rock Islands","palau","water",11,5,"Reef hooks into the wall, hang in the current, and watch sharks work the corner. Consistently rated the best dive on earth.","Palau Blue Corner diving liveaboard",""],
["Kayak through Ha Long Bay","Quảng Ninh","vietnam","water",10,4,"Nearly two thousand limestone karsts. Paddling gets you into caves and lagoons the junks cannot reach.","Ha Long Bay kayaking overnight cruise",""],
["Swim the Devil's Pool","Victoria Falls","zambia","water",8,12,"A rock lip at the very edge of a hundred-metre drop, with a natural wall holding you in. Only safe in low water.","Devils Pool Livingstone Island tour",""],
["Canyoning in the Blue Mountains","Katoomba","australia","water",10,4,"Abseiling into slot canyons and swimming out through them. Empress and Claustral are the classics.","Blue Mountains canyoning abseiling tour",""],
["Cenote diving in Yucatán","Tulum","mexico","water",1,12,"Freshwater caverns in limestone, with light shafts and haloclines. Some are open-water, some need cave training.","Tulum cenote diving snorkeling tour",""],

/* ---------- on snow ---------- */
["Bobsled the Olympia Bob Run","St Moritz","switzerland","snow",12,2,"The only natural-ice bob run left in the world, rebuilt by hand every winter since 1904. Guests ride between the pilot and brakeman at 130 km/h.","St Moritz bob run guest ride","https://www.olympia-bobrun.ch/"],
["Ski the Vallée Blanche","Chamonix","france","snow",1,4,"Twenty kilometres off the Aiguille du Midi, across a glacier, with a guide and a harness. Not a piste.","Vallee Blanche guided ski Chamonix",""],
["Heli-ski the Chugach","Valdez, Alaska","united-states","snow",3,4,"The steepest skiable terrain with the deepest maritime snowpack anywhere. Weather days are part of the deal.","Alaska heli skiing Chugach Valdez",""],
["Dog sled across Finnmark","Alta","norway","snow",1,3,"Driving your own team for days, sleeping in wilderness cabins, under the aurora if it behaves.","Alta dog sledding multi day expedition",""],
["Sleep in an ice hotel","Jukkasjärvi","sweden","snow",12,4,"Rebuilt from the Torne River every December, melted back into it every spring. One night in ice, one in a warm room.","Icehotel Jukkasjarvi overnight stay","https://www.icehotel.com/"],
["Ski Japan's powder","Niseko, Hokkaido","japan","snow",12,3,"Fifteen metres of dry snow a season, blown off Siberia across the Sea of Japan. Tree runs and an onsen after.","Niseko ski package Hokkaido powder",""],
["Snowmobile a glacier","Langjökull","iceland","snow",10,5,"An hour on Iceland's second largest ice cap, which is otherwise a flat white nothing you cannot walk on.","Langjokull glacier snowmobile tour",""],
["Ice climbing in the Ouray park","Ouray, Colorado","united-states","snow",12,3,"A gorge farmed for ice with sprinklers every night, so two hundred routes are reliably frozen all winter.","Ouray ice park climbing guide lesson",""],

/* ---------- up high ---------- */
["Trek to Everest Base Camp","Khumbu","nepal","height",3,5,"Twelve days up the valley to 5,364 metres. The Khumbu, not the summit, and still the best mountain walk on earth.","Everest base camp trek guided",""],
["Climb Kilimanjaro","Moshi","tanzania","height",1,3,"Five thousand eight hundred and ninety-five metres, no technical climbing, and a pass rate that depends entirely on how slowly you go.","Kilimanjaro climb Machame Lemosho route",""],
["Walk the Inca Trail","Cusco to Machu Picchu","peru","height",5,9,"Four days over two passes, arriving through the Sun Gate at dawn. Five hundred permits a day, released six months out.","Inca Trail trek permit Machu Picchu",""],
["Via ferrata in the Dolomites","Cortina d'Ampezzo","italy","height",6,9,"Steel cable and iron rungs bolted into vertical limestone, laid down in the First World War and maintained ever since.","Dolomites via ferrata guided climb",""],
["Climb Fuji overnight","Yamanashi","japan","height",7,9,"Up through the night from the fifth station to be on the summit for sunrise. Open only in July and August.","Mount Fuji climbing tour overnight",""],
["The W Trek","Torres del Paine","chile","height",11,3,"Five days between granite towers and a glacier, with refugios you must book the day they open.","Torres del Paine W trek refugio booking",""],
["Tour du Mont Blanc","Chamonix","france","height",6,9,"A hundred and seventy kilometres around the massif through three countries, hut to hut.","Tour du Mont Blanc guided trek",""],
["Climb the Sydney Harbour Bridge","Sydney","australia","height",1,12,"Up the arch to 134 metres on a walkway with a harness, which is the only legal way up.","Sydney Harbour Bridge climb","https://www.bridgeclimb.com/"],
["Walk the Camino de Santiago","Saint-Jean to Santiago","spain","height",4,10,"Eight hundred kilometres over five weeks, or the last hundred in a week for the certificate. Albergues the whole way.","Camino de Santiago walking tour",""],
["Hike the Narrows","Zion, Utah","united-states","height",6,9,"Sixteen miles down a slot canyon in the Virgin River, often waist-deep, with walls three hundred metres high.","Zion Narrows hike permit guide",""],
["Trek the Annapurna Circuit","Annapurna","nepal","height",10,11,"Two hundred kilometres over the Thorong La at 5,416 metres, through climate zones from paddy to permafrost.","Annapurna circuit trek guided Nepal",""],
["Stand on the Trolltunga","Odda","norway","height",6,9,"A rock slab jutting out seven hundred metres above a fjord, after a ten-hour round-trip walk.","Trolltunga guided hike Norway",""],

/* ---------- pure nerve ---------- */
["Sandboard the Huacachina dunes","Ica","peru","rush",1,12,"A desert oasis surrounded by dunes two hundred metres high. Buggy up, board down, repeat until dark.","Huacachina sandboarding buggy tour Peru",""],
["Bungee off the Verzasca Dam","Ticino","switzerland","rush",4,10,"Two hundred and twenty metres, off the dam from the opening of GoldenEye. The highest commercial dam jump there is.","Verzasca dam bungee jump 007",""],
["Bungee at Victoria Falls Bridge","Livingstone","zambia","rush",1,12,"A hundred and eleven metres into the Zambezi gorge, from a bridge between two countries.","Victoria Falls bridge bungee jump",""],
["Zipline across a canyon","Copper Canyon, Chihuahua","mexico","rush",10,4,"Seven lines and two suspension bridges across a canyon system deeper than the Grand Canyon.","Copper Canyon zipline ZipRider Barrancas",""],
["Skydive over Everest","Syangboche","nepal","rush",10,11,"Exit at 29,500 feet with oxygen, land at 12,350. The most expensive tandem jump in the world and the only one at altitude.","Everest skydive expedition Nepal",""],
["Volcano boarding Cerro Negro","León","nicaragua","rush",11,4,"Walk up an active cinder cone and come down the ash on a plywood board at speed, in a boiler suit.","Cerro Negro volcano boarding Leon",""],
["Walk the Caminito del Rey","El Chorro","spain","rush",1,12,"A boardwalk pinned to a gorge wall a hundred metres up, rebuilt after years of being the most dangerous path in Spain.","Caminito del Rey tickets guided walk",""],
["Base jump off the Sky Tower","Auckland","new-zealand","rush",1,12,"A wire-guided jump from 192 metres onto a target in the plaza, at 85 km/h.","Auckland Sky Tower SkyJump",""],
["Cliff dive at Rick's Cafe","Negril","jamaica","rush",1,12,"Eleven metres off a limestone cliff into clear water at sunset, with an audience.","Negril Ricks Cafe cliff jumping sunset",""],
["Abseil off Table Mountain","Cape Town","south-africa","rush",10,4,"A hundred and twelve metres down the face of the Western Table, with the city directly below your boots.","Table Mountain abseiling Cape Town",""],

/* ---------- wildlife ---------- */
["Track mountain gorillas","Bwindi Impenetrable Forest","uganda","wild",6,9,"One hour with a habituated family, after a steep muddy walk. A thousand dollars a permit, and the reason they still exist.","Bwindi gorilla trekking permit Uganda",""],
["See a river crossing","Masai Mara","kenya","wild",7,10,"Wildebeest piling into the Mara River with crocodiles waiting. Entirely unscheduled — you wait at a crossing point for days.","Masai Mara migration safari river crossing",""],
["Polar bears from a tundra buggy","Churchill, Manitoba","canada","wild",10,11,"Bears waiting for Hudson Bay to freeze, from a vehicle with wheels taller than they are.","Churchill polar bear tundra buggy tour",""],
["Galápagos by live-aboard","Galápagos Islands","ecuador","wild",1,12,"The outer islands need a boat. Sleeping aboard is the only way to reach Fernandina and Genovesa.","Galapagos liveaboard cruise diving",""],
["Find orangutans in Borneo","Sepilok and Danum Valley","malaysia","wild",3,10,"Rehabilitation centres are the reliable sighting; Danum Valley primary forest is the real one.","Borneo orangutan Sepilok Danum Valley tour",""],
["Stand in the monarch forests","Michoacán","mexico","wild",11,3,"Oyamel firs bent under the weight of hundreds of millions of butterflies, at three thousand metres.","Monarch butterfly sanctuary Michoacan tour",""],
["Look for tigers in Ranthambore","Rajasthan","india","wild",4,6,"Dry season concentrates them at the waterholes. Zones are allocated by ballot, so book several drives.","Ranthambore tiger safari jeep booking",""],
["Walk among penguins","Antarctic Peninsula","antarctic-peninsula","wild",11,2,"A ten-day crossing of the Drake and then rookeries of a hundred thousand birds that have no fear of you.","Antarctica expedition cruise peninsula",""],
["See Komodo dragons","Komodo and Rinca","indonesia","wild",4,11,"Three-metre monitor lizards on two islands and nowhere else, with rangers and forked sticks.","Komodo dragon island tour Labuan Bajo",""],
["Snorkel with sea lions","Espíritu Santo, La Paz","mexico","wild",8,11,"A colony that plays with swimmers, in the Sea of Cortez Cousteau called the world's aquarium.","La Paz sea lion snorkeling Espiritu Santo",""],

/* ---------- after dark ---------- */
["Chase the aurora from Abisko","Abisko, Lapland","sweden","light",9,3,"A rain shadow over the lake gives the clearest skies in Scandinavia, and a chairlift to a station above the valley cloud.","Abisko northern lights tour Aurora Sky Station",""],
["Stargaze in the Atacama","San Pedro de Atacama","chile","light",4,10,"The driest desert on earth at 2,400 metres, which is why the professional observatories are there.","Atacama astronomy stargazing tour",""],
["Stand in a total eclipse","Wherever the next path falls","united-states","light",1,12,"Two to seven minutes of totality, which is nothing like a partial eclipse. People plan years around the path.","total solar eclipse tour next path",""],
["Watch synchronous fireflies","Great Smoky Mountains","united-states","light",6,6,"One species flashes in unison for two weeks a year. Access is by lottery, drawn in April.","Elkmont synchronous firefly lottery Smokies",""],
["Release a lantern at Yi Peng","Chiang Mai","thailand","light",11,11,"Thousands of paper lanterns at once on the full moon of the twelfth lunar month. The ticketed events are the ones that get the photograph.","Yi Peng lantern festival Chiang Mai",""],
["Sleep under Wadi Rum","Wadi Rum","jordan","light",10,4,"Sandstone towers, no light within sixty kilometres, and the Milky Way bright enough to read by.","Wadi Rum bubble camp overnight desert",""],

/* ---------- being there ---------- */
["Run with the bulls","Pamplona","spain","culture",7,7,"Eight hundred and twenty-five metres, two and a half minutes, and no barrier between you and six fighting bulls.","San Fermin Pamplona running of the bulls",""],
["Sit ringside at sumo","Tokyo","japan","culture",1,9,"Fifteen days, six times a year, three of them in Tokyo. Buy a box seat and stay for the top division.","sumo tournament tickets Tokyo basho",""],
["Stay in a ryokan with a private onsen","Hakone or Kinosaki","japan","culture",1,12,"Tatami, a kaiseki dinner served in your room, and a hot spring bath on your own balcony.","ryokan private onsen Hakone booking",""],
["Sleep in a Bedouin camp","Wadi Rum","jordan","culture",10,4,"Goat-hair tents, zarb cooked in a pit, and a 4x4 out to the rock bridges at first light.","Wadi Rum Bedouin camp experience",""],
["Dance at a milonga","Buenos Aires","argentina","culture",3,11,"Not the dinner show. A neighbourhood hall where locals dance until four, and a beginner class first.","Buenos Aires milonga tango class local",""],
["Stay with a nomad family in a ger","Central Mongolia","mongolia","culture",6,9,"Felt, a stove in the middle, fermented mare's milk, and horses you are expected to ride.","Mongolia ger stay nomad family tour",""],
["Get hit by a tomato at La Tomatina","Buñol","spain","culture",8,8,"One hour, one street, a hundred and fifty tonnes of tomatoes. Goggles and clothes you will throw away.","La Tomatina Bunol ticket transport",""],
["Parade with a samba school","Rio de Janeiro","brazil","culture",2,3,"Schools sell costumes to visitors and you walk in the Sambadrome with them. You rehearse, and then you are in it.","Rio Carnival samba school parade costume",""],
["Sauna then cut a hole in the ice","Finnish Lakeland","finland","culture",12,3,"Eighty degrees, then two degrees, then back, three times. The national pastime and genuinely good for you.","Finland sauna ice swimming avanto experience",""],
["Watch the Palio from the piazza","Siena","italy","culture",7,8,"Ninety seconds of bareback racing on a dirt track laid over the square. The centre is free and packed.","Palio di Siena contrada tickets",""],

/* ---------- at the table ---------- */
["Sit at a sushi counter in Tokyo","Tokyo","japan","food",1,12,"Omakase, twenty pieces, no menu, and the chef watching how fast you eat. Many of the best seat eight people.","Tokyo omakase sushi counter reservation",""],
["Hunt truffles in Alba","Piedmont","italy","food",10,12,"A trifolao, his dog, and a hillside at dawn, then the thing you found shaved over tajarin at lunch.","Alba white truffle hunting experience Piedmont",""],
["Crawl the pintxos bars","San Sebastián","spain","food",5,10,"One plate and one glass per bar, then move. The Parte Vieja has thirty bars in four streets.","San Sebastian pintxos tour Parte Vieja",""],
["Eat your way through Bangkok","Bangkok","thailand","food",11,2,"Boat noodles, grilled pork, mango sticky rice, from stalls that have cooked one dish for forty years.","Bangkok street food tour evening",""],
["Pick coffee at harvest","Antigua","guatemala","food",11,3,"A finca on the slope of a volcano during the picking season, from cherry to cup in one day.","Antigua Guatemala coffee farm tour harvest",""],

/* ---------- the long way ---------- */
["Ride the Trans-Mongolian","Ulaanbaatar to Beijing","mongolia","rail",5,9,"The Trans-Siberian's southern branch: across the Gobi, through the Erlian border change of gauge, and into Beijing.","Trans Mongolian railway tickets itinerary",""],
["Take the Glacier Express","Zermatt to St Moritz","switzerland","rail",1,12,"Eight hours, 291 bridges and 91 tunnels, in a panoramic carriage at an average of thirty-six kilometres an hour.","Glacier Express ticket booking Switzerland",""],
["Cross Canada by rail","Toronto to Vancouver","canada","rail",5,9,"Four nights on The Canadian through the Shield, the prairies and the Rockies, in a dome car.","Via Rail The Canadian sleeper booking",""],
["Ride the Death Railway","Kanchanaburi","thailand","rail",11,2,"The surviving stretch over the Wampo viaduct, built by prisoners of war, with a museum that does not look away.","Kanchanaburi Death Railway bridge River Kwai tour",""],
["Rovos Rail to Victoria Falls","Pretoria to Victoria Falls","south-africa","rail",4,10,"Three nights of wood panelling and no wi-fi, ending at the falls.","luxury train Pretoria Victoria Falls Rovos",""]
];

/* ===========================================================
   Reading the list
   =========================================================== */
const BK = BUCKET.map((r,i)=>({
  i, name:r[0], place:r[1], country:r[2], cat:r[3],
  m1:r[4], m2:r[5], blurb:r[6], query:r[7], official:r[8] || '',
  allYear: r[4] === 1 && r[5] === 12,
  wraps: r[5] < r[4],
  id: 'bk:' + i + ':' + r[0].toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')
}));

const bkByCountry = s => BK.filter(b=>b.country === s);

/* Is this possible in the given month? */
function bkInMonth(b, m){
  if (b.allYear) return true;
  return b.wraps ? (m >= b.m1 || m <= b.m2) : (m >= b.m1 && m <= b.m2);
}

const BK_MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const bkSeason = b => b.allYear ? 'ALL YEAR'
  : b.m1 === b.m2 ? BK_MON[b.m1-1].toUpperCase()
  : BK_MON[b.m1-1].toUpperCase() + '–' + BK_MON[b.m2-1].toUpperCase();

/* Where to send someone who wants to actually book it. A search, not a
   product page, so the link still works in a year. Affiliate IDs from
   BK_PARTNER are appended when they are filled in. */
function bkLinks(b){
  const q = encodeURIComponent(b.query);
  const gyg = 'https://www.getyourguide.com/s/?q=' + q
    + (BK_PARTNER.getyourguide ? '&partner_id=' + encodeURIComponent(BK_PARTNER.getyourguide) : '');
  const via = 'https://www.viator.com/searchResults/all?text=' + q
    + (BK_PARTNER.viator ? '&pid=' + encodeURIComponent(BK_PARTNER.viator) : '');
  const out = [
    ['GetYourGuide', gyg, 'Check dates and prices'],
    ['Viator', via, 'Compare operators']
  ];
  if (b.official) out.unshift(['The operator', b.official, 'Book direct']);
  return out;
}
