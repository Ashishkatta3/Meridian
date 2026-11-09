/* ===========================================================
   EVENTS — the world's calendar, as a traveller sees it.

   One row per recurring event or natural window:

     [ name, place, scope, cityKey, m1, d1, m2, d2, cat, blurb, flag ]

   scope    where it belongs. A country slug ("japan", "united-states"),
            or "us:XX" for a US state, so a state page can find its own.
   cityKey  "" or a key from data.js ("LA-new-orleans"), so a city page
            can find its own too.
   m1 d1    start month (1-12) and day
   m2 d2    end month and day. Same as the start for a one-day event.
            An end month BEFORE the start month means it crosses new year
            (northern lights: m1 9 -> m2 3).
   cat      bloom carnival culture food lights music nature sport wildlife
   flag     ''  the dates are fixed and can be trusted year to year
            'v' MOVEABLE. The date shifts every year — lunar calendars,
                Easter, "first Saturday of". The month is right; the day
                is only typical, so the site says "date varies" instead
                of printing a date that would be wrong.
            'w' a long WINDOW rather than an event — a season, a bloom,
                a migration. Shown as a range, never as a single day.

   Nothing here is fetched. These are the patterns of the year, which is
   exactly why they can be known in advance and are worth checking in on.
   =========================================================== */

const EVENTS = [

/* ---------- JANUARY ---------- */
["Harbin Ice and Snow Festival","Harbin","china","",1,5,2,25,"culture","Whole city blocks carved out of Songhua River ice and lit from inside. The largest ice sculptures on earth, in -20°C.",""],
["Sydney Festival","Sydney","australia","",1,5,1,26,"culture","Three weeks of outdoor theatre, music and art across the city in peak southern summer.","v"],
["Rose Parade","Pasadena, California","us:CA","CA-los-angeles",1,1,1,1,"culture","Floats built entirely from flowers and seed, down Colorado Boulevard on New Year's morning.",""],
["Mummers Parade","Philadelphia","us:PA","PA-philadelphia",1,1,1,1,"culture","String bands in feathers and sequins, a New Year's Day tradition since 1901.",""],
["Sundance Film Festival","Park City, Utah","us:UT","UT-park-city",1,22,2,1,"culture","Independent film in a ski town. Tickets and beds both need booking months out.","v"],
["Australian Open","Melbourne","australia","",1,12,2,1,"sport","The first tennis major of the year, played in serious heat.","v"],
["Up Helly Aa","Lerwick, Shetland","united-kingdom","",1,28,1,28,"culture","A replica galley dragged through town by torchlight and burned. Last Tuesday in January.","v"],
["Tamborrada","San Sebastián","spain","",1,20,1,20,"food","Twenty-four hours of drumming, and the best pintxos city in Spain at its loudest.",""],
["Dakar Rally","Saudi Arabia","saudi-arabia","",1,3,1,18,"sport","Two weeks of desert rally raid across the Empty Quarter.","v"],
["Fur Rendezvous","Anchorage, Alaska","us:AK","AK-anchorage",1,23,2,8,"culture","Snowshoe softball, outhouse racing and a running of the reindeer down Fourth Avenue.","v"],
["Grey whales arrive","Baja California","mexico","",1,1,3,31,"wildlife","Grey whales calve in the warm lagoons of Baja after swimming down from the Arctic. Boats get close enough to touch.","w"],
["Serengeti calving season","Ndutu, Tanzania","tanzania","",1,15,3,15,"wildlife","Half a million wildebeest born in a few weeks on the short-grass plains, with every predator in the ecosystem waiting.","w"],
["Salt flat mirror season","Salar de Uyuni","bolivia","",12,15,4,15,"nature","A few inches of rain turn the world's largest salt flat into a perfect mirror of the sky.","w"],
["Humpback whale season","Maui, Hawaii","us:HI","HI-lahaina",12,15,4,15,"wildlife","Thousands of humpbacks calve and breach in the shallow channel between Maui, Lanai and Molokai.","w"],

/* ---------- FEBRUARY ---------- */
["Rio Carnival","Rio de Janeiro","brazil","",2,5,2,10,"carnival","Samba schools parade through the Sambadrome while the rest of the city goes to the street blocos. Five days before Ash Wednesday.","v"],
["Mardi Gras","New Orleans, Louisiana","us:LA","LA-new-orleans",2,9,2,9,"carnival","Parades roll for two weeks and peak on Fat Tuesday, 47 days before Easter. Book a year out.","v"],
["Venice Carnival","Venice","italy","",1,30,2,9,"carnival","Masks, capes and the Flight of the Angel from the campanile into Piazza San Marco.","v"],
["Sapporo Snow Festival","Sapporo","japan","",2,4,2,11,"culture","Hundreds of snow and ice sculptures through Odori Park, some the size of buildings.",""],
["Chinese New Year","China, Singapore, Taiwan, Vietnam","china","",2,6,2,20,"culture","The largest annual human migration on earth. Everything closes, everything is red, and transport is impossible.","v"],
["Carnival of Santa Cruz","Tenerife","spain","",2,5,2,15,"carnival","The biggest carnival in Europe, and the one that most resembles Rio.","v"],
["Nice Carnival","Nice","france","",2,13,3,1,"carnival","Flower battles along the Promenade des Anglais and enormous papier-mâché heads.","v"],
["Groundhog Day","Punxsutawney, Pennsylvania","us:PA","PA-punxsutawney",2,2,2,2,"culture","Thirty thousand people in a Pennsylvania field at dawn to watch a groundhog.",""],
["Tucson Gem and Mineral Show","Tucson, Arizona","us:AZ","AZ-tucson",2,1,2,15,"culture","The largest mineral show on earth takes over the entire city, not just a hall.","v"],
["Daytona 500","Daytona Beach, Florida","us:FL","FL-daytona-beach",2,15,2,15,"sport","NASCAR's biggest race opens the season rather than closing it.","v"],
["Monarch butterflies","Michoacán","mexico","",11,15,3,15,"wildlife","Hundreds of millions of monarchs cluster on oyamel firs so densely the branches bend.","w"],
["Northern lights season","Tromsø, Abisko, Reykjavík","norway","",9,1,3,31,"lights","Dark skies and high auroral activity. September and March are statistically the best months, not December.","w"],

/* ---------- MARCH ---------- */
["Holi","North India and Nepal","india","",3,10,3,11,"culture","Powder paint, water and total social levelling for one day. Mathura and Vrindavan go hardest. Date varies with the lunar calendar.","v"],
["St Patrick's Day","Dublin","ireland","",3,15,3,18,"culture","Four days around the 17th, and the one time of year Dublin is genuinely full.",""],
["Las Fallas","Valencia","spain","",3,15,3,19,"culture","Enormous satirical effigies built for a year, then burned simultaneously across the city at midnight.",""],
["Nowruz","Samarkand and Tashkent","uzbekistan","",3,20,3,21,"culture","Persian new year on the spring equinox, kept across Central Asia. Two weeks of visiting, and the roads are packed.",""],
["Cherry blossom","Tokyo and Kyoto","japan","",3,25,4,10,"bloom","Sakura moves north up the islands over six weeks. Tokyo usually peaks in the last days of March.","v"],
["National Cherry Blossom Festival","Washington, DC","us:DC","DC-washington",3,20,4,14,"bloom","Three thousand Japanese cherries around the Tidal Basin, a gift from Tokyo in 1912.","v"],
["SXSW","Austin, Texas","us:TX","TX-austin",3,13,3,21,"music","Music, film and tech in one overwhelming week. The city's hotel prices quadruple.","v"],
["Ultra Music Festival","Miami, Florida","us:FL","FL-miami",3,27,3,29,"music","Electronic music on Bayfront Park, and the anchor of Miami Music Week.","v"],
["Iditarod","Anchorage to Nome, Alaska","us:AK","AK-anchorage",3,7,3,20,"sport","A thousand miles of sled dog racing across the Alaskan interior.","v"],
["Sandhill crane migration","Platte River, Nebraska","us:NE","NE-kearney",3,1,4,10,"wildlife","Half a million cranes stage on one stretch of shallow river. One of North America's great wildlife spectacles and almost nobody goes.","w"],
["Semana Santa","Seville","spain","",3,21,3,28,"culture","Hooded brotherhoods carry float after float through the night for a week before Easter.","v"],
["Keukenhof tulips","Lisse","netherlands","",3,20,5,10,"bloom","Seven million bulbs planted by hand, and the only reliable way to see Dutch tulips on a schedule.","w"],
["Whale shark season","Ningaloo Reef","australia","",3,15,7,31,"wildlife","The largest fish on earth, reliably, in water you can swim in from the beach.","w"],

/* ---------- APRIL ---------- */
["Songkran","Thailand","thailand","",4,13,4,15,"carnival","Thai new year, fought nationwide with water pistols and buckets. Chiang Mai is the epicentre.",""],
["Coachella","Indio, California","us:CA","CA-palm-springs",4,10,4,19,"music","Two identical weekends in the desert, and the template every festival since has copied.","v"],
["Boston Marathon","Boston, Massachusetts","us:MA","MA-boston",4,20,4,20,"sport","The oldest annual marathon in the world, run on Patriots' Day. You have to qualify.","v"],
["King's Day","Amsterdam","netherlands","",4,27,4,27,"culture","The whole country wears orange, sells its possessions on the pavement and drinks on boats.",""],
["Fiesta San Antonio","San Antonio, Texas","us:TX","TX-san-antonio",4,16,4,26,"culture","Ten days of river parades and cascarones. Bigger locally than anything else in Texas.","v"],
["The Masters","Augusta, Georgia","us:GA","GA-augusta",4,9,4,12,"sport","The only golf major played on the same course every year. Tickets go by lottery.","v"],
["Merrie Monarch Festival","Hilo, Hawaii","us:HI","HI-hilo",4,5,4,11,"culture","The world championship of hula, and the most serious cultural event in the islands.","v"],
["Baisakhi","Punjab","india","",4,13,4,14,"culture","Harvest festival and Sikh new year. Amritsar and the Golden Temple at their fullest.",""],
["Lavender has not started yet","Provence","france","",4,1,4,1,"bloom","A note, not an event: Provence lavender peaks in July, not spring. Come for almond and cherry blossom instead.","v"],

/* ---------- MAY ---------- */
["Kentucky Derby","Louisville, Kentucky","us:KY","KY-louisville",5,2,5,2,"sport","Two minutes of racing, a week of parties, and more hats than anywhere else in America.","v"],
["Cannes Film Festival","Cannes","france","",5,12,5,23,"culture","The industry's most important week. The screenings are closed but the Croisette is not.","v"],
["Monaco Grand Prix","Monte Carlo","monaco","",5,21,5,24,"sport","Formula One through actual streets, with barriers inches from the cars.","v"],
["Chelsea Flower Show","London","united-kingdom","",5,19,5,23,"bloom","The most prestigious garden show in the world, in the grounds of the Royal Hospital.","v"],
["Cooper's Hill Cheese Rolling","Brockworth, England","united-kingdom","",5,25,5,25,"sport","A wheel of Double Gloucester thrown down a near-vertical hill, followed by volunteers. Injuries are routine.","v"],
["Indianapolis 500","Indianapolis, Indiana","us:IN","IN-indianapolis",5,24,5,24,"sport","Three hundred thousand people, the largest single-day sporting crowd anywhere.","v"],
["Cinco de Mayo","Puebla","mexico","",5,5,5,5,"culture","Commemorates the 1862 battle. Much bigger in the United States than in most of Mexico.",""],
["Feria de Abril","Seville","spain","",4,25,5,2,"culture","A temporary city of striped marquees, sherry and sevillanas on the far bank of the Guadalquivir.","v"],
["Electric Daisy Carnival","Las Vegas, Nevada","us:NV","NV-las-vegas",5,15,5,17,"music","Three nights at the Motor Speedway, sunset to sunrise.","v"],
["Hangout Festival","Gulf Shores, Alabama","us:AL","AL-gulf-shores",5,15,5,17,"music","A festival staged directly on the sand of the Gulf coast.","v"],
["Spoleto Festival","Charleston, South Carolina","us:SC","SC-charleston",5,22,6,7,"culture","Opera, chamber music and theatre across the historic city for seventeen days.","v"],
["Tulip Time","Holland, Michigan","us:MI","MI-holland",5,2,5,10,"bloom","Six million tulips and a Dutch-settled town that takes the theme entirely seriously.","v"],
["Great Migration begins","Serengeti","tanzania","",5,15,7,15,"wildlife","The herds start moving north and west from the southern plains towards the Grumeti.","w"],

/* ---------- JUNE ---------- */
["Glastonbury Festival","Pilton, England","united-kingdom","",6,24,6,28,"music","Two hundred thousand people in a Somerset dairy farm. Tickets sell out in minutes, in October.","v"],
["Midsummer","Sweden","sweden","",6,19,6,21,"culture","The most important day in the Swedish year. Everything shuts, everyone leaves for the countryside.","v"],
["Inti Raymi","Cusco","peru","",6,24,6,24,"culture","The Inca festival of the sun, re-enacted at Sacsayhuamán above the city.",""],
["Summer solstice","Stonehenge","united-kingdom","",6,20,6,21,"nature","The one night a year the stones are open to walk among, for sunrise on the longest day.",""],
["CMA Fest","Nashville, Tennessee","us:TN","TN-nashville",6,4,6,7,"music","Four days of country music with the whole of downtown as the venue.","v"],
["Bonnaroo","Manchester, Tennessee","us:TN","TN-nashville",6,11,6,14,"music","A farm in middle Tennessee, four days, and a campsite the size of a town.","v"],
["Telluride Bluegrass","Telluride, Colorado","us:CO","CO-telluride",6,18,6,21,"music","A box canyon at 8,750 feet with a stage at the end of it.","v"],
["Portland Rose Festival","Portland, Oregon","us:OR","OR-portland",6,1,6,14,"bloom","Fleet week, a dragon boat race and the largest children's parade in the country.","v"],
["Laconia Motorcycle Week","Laconia, New Hampshire","us:NH","NH-laconia",6,13,6,21,"culture","The oldest motorcycle rally in the United States, running since 1916.","v"],
["Firefly Music Festival","Dover, Delaware","us:DE","DE-dover",6,19,6,21,"music","Delaware's one large festival, in the woodland beside the speedway.","v"],
["Summerfest","Milwaukee, Wisconsin","us:WI","WI-milwaukee",6,25,7,5,"music","The largest music festival in the world by attendance, on the Lake Michigan lakefront.","v"],
["NYC Pride","New York City","us:NY","NY-new-york-city",6,28,6,28,"culture","The march commemorates Stonewall, which happened eleven blocks from the route.","v"],
["Lavender in bloom","Valensole, Provence","france","",6,25,7,20,"bloom","The plateau turns solid purple for about three weeks, and the harvest starts before August.","w"],
["Hemis Festival","Ladakh","india","",6,25,6,26,"culture","Masked dances in a monastery courtyard at 12,000 feet. Date set by the Tibetan calendar.","v"],

/* ---------- JULY ---------- */
["Running of the Bulls","Pamplona","spain","",7,6,7,14,"culture","San Fermín. Eight mornings of bulls through the old town, and eight nights that do not end.",""],
["Bastille Day","Paris","france","",7,14,7,14,"culture","A military parade down the Champs-Élysées in the morning, fireworks at the Eiffel Tower at night.",""],
["Gion Matsuri","Kyoto","japan","",7,1,7,31,"culture","A thousand years old. Two float processions, on the 17th and the 24th, with hoko the height of houses.",""],
["Naadam","Ulaanbaatar","mongolia","",7,11,7,13,"sport","Wrestling, horse racing and archery, and the one time of year the whole country converges.",""],
["Tour de France","France","france","",7,4,7,26,"sport","Three weeks, and free to watch from any roadside in the country.","v"],
["Calgary Stampede","Calgary","canada","",7,3,7,12,"culture","Ten days of rodeo and chuckwagon racing that shuts down the city's dress code.","v"],
["Il Palio","Siena","italy","",7,2,7,2,"sport","Ninety seconds of bareback horse racing around the Piazza del Campo. Again on 16 August.",""],
["Boryeong Mud Festival","Boryeong","south-korea","",7,17,7,26,"carnival","Mineral mud from the Boryeong flats, applied enthusiastically to everybody.","v"],
["Comic-Con","San Diego, California","us:CA","CA-san-diego",7,23,7,26,"culture","A hundred and thirty thousand people and the hardest convention badge in America to get.","v"],
["Cheyenne Frontier Days","Cheyenne, Wyoming","us:WY","WY-cheyenne",7,17,7,26,"culture","The world's largest outdoor rodeo, running since 1897.","v"],
["EAA AirVenture","Oshkosh, Wisconsin","us:WI","WI-oshkosh",7,20,7,26,"culture","For one week the world's busiest air traffic control tower, with ten thousand aircraft flown in.","v"],
["Chincoteague Pony Swim","Chincoteague, Virginia","us:VA","VA-chincoteague",7,29,7,29,"wildlife","Wild ponies swum across the channel at slack tide, as they have been since 1925.","v"],
["Essence Festival","New Orleans, Louisiana","us:LA","LA-new-orleans",7,3,7,6,"music","The largest celebration of African-American music and culture in the country.","v"],
["Montreux Jazz Festival","Montreux","switzerland","",7,3,7,18,"music","Two weeks on Lake Geneva, and much broader than the name suggests.","v"],
["Great Migration river crossings","Masai Mara and Serengeti","kenya","",7,15,10,15,"wildlife","The herds cross the Mara River. The single most dramatic wildlife event on earth, and entirely weather-dependent.","w"],
["Midnight sun","North Cape","norway","",5,15,7,31,"nature","The sun does not set at all above the Arctic Circle for ten weeks.","w"],

/* ---------- AUGUST ---------- */
["Edinburgh Festival Fringe","Edinburgh","united-kingdom","",8,7,8,31,"culture","The largest arts festival in the world. Three thousand shows, and the city triples in size.","v"],
["La Tomatina","Buñol","spain","",8,26,8,26,"carnival","A hundred and fifty tonnes of tomatoes, one hour, one street. Last Wednesday in August.","v"],
["Notting Hill Carnival","London","united-kingdom","",8,30,8,31,"carnival","Europe's largest street carnival, over the August bank holiday, with sound systems on every corner.","v"],
["Burning Man","Black Rock Desert, Nevada","us:NV","NV-reno",8,30,9,7,"culture","A temporary city of seventy thousand in an alkali desert, and nothing is for sale inside it.","v"],
["Sturgis Motorcycle Rally","Sturgis, South Dakota","us:SD","SD-rapid-city",8,7,8,16,"culture","Half a million motorcycles in a town of seven thousand.","v"],
["Obon","Japan","japan","",8,13,8,16,"culture","The dead are welcomed home with lanterns and bon odori dancing. Transport is fully booked.",""],
["Perseid meteor shower","Northern hemisphere","united-states","",8,11,8,13,"lights","The year's most reliable meteor shower, up to a hundred an hour from a dark site.",""],
["Palio di Siena","Siena","italy","",8,16,8,16,"sport","The second running of the year, and the more prestigious of the two.",""],
["Monterey Car Week","Monterey, California","us:CA","CA-monterey",8,12,8,16,"culture","Pebble Beach Concours and the most valuable collection of cars assembled anywhere, annually.","v"],
["Lollapalooza","Chicago, Illinois","us:IL","IL-chicago",7,30,8,2,"music","Four days in Grant Park with the skyline directly behind the stage.","v"],
["Maine Lobster Festival","Rockland, Maine","us:ME","ME-rockland",8,5,8,9,"food","Twenty thousand pounds of lobster, cooked in the world's largest lobster cooker.","v"],
["Sziget Festival","Budapest","hungary","",8,11,8,16,"music","Six days on an island in the Danube, and one of Europe's cheapest big festivals.","v"],
["Little League World Series","Williamsport, Pennsylvania","us:PA","PA-williamsport",8,13,8,23,"sport","Free to attend, and televised worldwide.","v"],
["Woodward Dream Cruise","Detroit, Michigan","us:MI","MI-detroit",8,15,8,15,"culture","Forty thousand classic cars on sixteen miles of one avenue.","v"],
["Minnesota State Fair","Saint Paul, Minnesota","us:MN","MN-minneapolis",8,27,9,7,"food","The Great Minnesota Get-Together. Everything on a stick, two million visitors.","v"],
["Iowa State Fair","Des Moines, Iowa","us:IA","IA-des-moines",8,13,8,23,"food","A cow sculpted in butter, and the model every other state fair follows.","v"],

/* ---------- SEPTEMBER ---------- */
["Oktoberfest","Munich","germany","",9,19,10,4,"food","Sixteen days, six million litres, and it mostly happens in September despite the name.","v"],
["La Mercè","Barcelona","spain","",9,21,9,24,"culture","Human castles, fire runs and free concerts for the city's patron saint.",""],
["Kwita Izina","Volcanoes National Park","rwanda","",9,5,9,5,"wildlife","Baby mountain gorillas are publicly named in a national ceremony. A conservation success story made into a festival.","v"],
["Venice Film Festival","Venice","italy","",8,26,9,5,"culture","The oldest film festival in the world, on the Lido.","v"],
["Galway International Oyster Festival","Galway","ireland","",9,25,9,27,"food","The world oyster opening championship, and the oldest oyster festival anywhere.","v"],
["Great American Beer Festival","Denver, Colorado","us:CO","CO-denver",9,17,9,19,"food","Two thousand beers from eight hundred breweries, poured in one hall.","v"],
["Pendleton Round-Up","Pendleton, Oregon","us:OR","OR-pendleton",9,9,9,12,"sport","One of the oldest rodeos in the country, with a genuine Native American encampment.","v"],
["Jacaranda bloom","Pretoria","south-africa","",9,25,11,10,"bloom","Seventy thousand jacaranda trees turn the whole city purple for about six weeks.","w"],
["Fall foliage begins","Vermont and New Hampshire","us:VT","VT-stowe",9,20,10,20,"nature","Peak colour moves south about a hundred miles a week. Northern Vermont goes first.","w"],
["Mid-Autumn Festival","China and Vietnam","china","",9,25,9,27,"culture","Mooncakes, lanterns and the second most important holiday in the Chinese year.","v"],

/* ---------- OCTOBER ---------- */
["Albuquerque International Balloon Fiesta","Albuquerque, New Mexico","us:NM","NM-albuquerque",10,3,10,11,"culture","Six hundred balloons launched in mass ascension at dawn, in the one valley whose wind pattern lets them come back.","v"],
["Diwali","India, Nepal, Singapore","india","",10,25,11,10,"lights","Oil lamps, fireworks and the biggest holiday in the Indian year. Date set by the lunar calendar.","v"],
["Formula One United States Grand Prix","Austin, Texas","us:TX","TX-austin",10,23,10,25,"sport","Circuit of the Americas, and the best-attended race on the F1 calendar.","v"],
["Austin City Limits","Austin, Texas","us:TX","TX-austin",10,2,10,11,"music","Two weekends in Zilker Park, and far easier to get into than SXSW.","v"],
["Bridge Day","Fayetteville, West Virginia","us:WV","WV-fayetteville",10,17,10,17,"sport","The New River Gorge Bridge closes to traffic and opens to BASE jumpers. Third Saturday in October.","v"],
["Ironman World Championship","Kailua-Kona, Hawaii","us:HI","HI-kailua-kona",10,10,10,10,"sport","The original Ironman, on the lava fields of the Big Island.","v"],
["Circleville Pumpkin Show","Circleville, Ohio","us:OH","OH-columbus",10,21,10,24,"food","Ohio's oldest and largest festival, built entirely around pumpkins.","v"],
["Frankfurt Book Fair","Frankfurt","germany","",10,14,10,18,"culture","The publishing world's annual meeting, open to the public for the final two days.","v"],
["Norsk Høstfest","Minot, North Dakota","us:ND","ND-minot",9,29,10,3,"culture","North America's largest Scandinavian festival, in the middle of the northern plains.","v"],
["Polar bear season","Churchill, Manitoba","canada","",10,1,11,20,"wildlife","Bears gather on the shore waiting for Hudson Bay to freeze. Tundra buggies get within metres.","w"],
["Red crab migration","Christmas Island","australia","",10,15,12,20,"wildlife","Fifty million crabs cross the island to the sea. Roads close for them.","w"],
["Fall foliage peak","New England","us:MA","MA-boston",10,5,10,25,"nature","Peak colour through southern Vermont, the Berkshires and the Catskills.","w"],

/* ---------- NOVEMBER ---------- */
["Day of the Dead","Oaxaca and Mexico City","mexico","",11,1,11,2,"culture","Graveside vigils, marigolds and comparsas. Oaxaca is the place to be, and it books out.",""],
["Loi Krathong and Yi Peng","Chiang Mai","thailand","",11,3,11,5,"lights","Floating baskets on the river and thousands of paper lanterns released into the sky. Full moon of the twelfth lunar month.","v"],
["Melbourne Cup","Melbourne","australia","",11,3,11,3,"sport","The race that stops a nation, and a public holiday in Victoria. First Tuesday in November.","v"],
["Macy's Thanksgiving Day Parade","New York City","us:NY","NY-new-york-city",11,26,11,26,"culture","Balloons down Central Park West, and the inflation the night before is the better show.","v"],
["Pushkar Camel Fair","Pushkar","india","",11,20,11,28,"culture","Fifty thousand camels traded, raced and paraded beside a sacred lake.","v"],
["Guy Fawkes Night","Lewes and across England","united-kingdom","",11,5,11,5,"culture","Bonfires and fireworks nationwide. Lewes does it with burning tar barrels and is genuinely alarming.",""],
["Thanksgiving","United States","united-states","",11,26,11,26,"food","The busiest travel week of the American year. Fourth Thursday in November.","v"],
["Gorilla trekking dry season","Bwindi and Volcanoes","uganda","",12,1,2,28,"wildlife","Drier trails and better visibility for the steep walk up to the habituated groups.","w"],

/* ---------- DECEMBER ---------- */
["Christmas markets","Nuremberg, Dresden, Vienna, Strasbourg","germany","",11,28,12,24,"food","Glühwein, lebkuchen and wooden stalls in the old squares. Nuremberg's is the one to measure others by.",""],
["Hogmanay","Edinburgh","united-kingdom","",12,30,1,1,"carnival","A torchlight procession, a street party for a hundred thousand, and a swim in the Forth on New Year's Day.",""],
["New Year's Eve fireworks","Sydney Harbour","australia","",12,31,12,31,"carnival","The first major city to see midnight, and it builds the display around the bridge.",""],
["Réveillon","Copacabana, Rio de Janeiro","brazil","",12,31,12,31,"carnival","Two million people in white on one beach, and offerings floated out to Iemanjá.",""],
["Las Posadas","Mexico","mexico","",12,16,12,24,"culture","Nine nights of processions re-enacting the search for shelter, ending at a different house each night.",""],
["Junkanoo","Nassau","bahamas","",12,26,12,26,"carnival","Crepe paper costumes, goombay drums and cowbells from two in the morning. Again on New Year's Day.",""],
["Honolulu Marathon","Honolulu, Hawaii","us:HI","HI-honolulu",12,13,12,13,"sport","No qualifying time, thirty thousand runners, and a five o'clock start to beat the heat.","v"],
["Art Basel Miami Beach","Miami Beach, Florida","us:FL","FL-miami",12,3,12,6,"culture","The largest art fair in the Americas, and the week the entire city is booked.","v"],
["Times Square New Year's Eve","New York City","us:NY","NY-new-york-city",12,31,12,31,"carnival","A million people, no bathrooms, and eight hours of standing. Worth knowing before you commit.",""],
["Christmas in Lapland","Rovaniemi","finland","",12,1,12,26,"culture","Reindeer, snow that is guaranteed, and the official Santa Claus Village on the Arctic Circle.",""],
["Antarctic season","Antarctic Peninsula","antarctic-peninsula","",11,1,3,15,"wildlife","The only window ships can reach the peninsula. December and January are peak penguin chick season.","w"],

/* ---------- year-round, worth knowing ---------- */
["Bioluminescent bay","Vieques, Puerto Rico","puerto-rico","",1,1,12,31,"lights","Mosquito Bay is the brightest bioluminescent bay in the world. Go on a new moon, in dry season, for the best glow.","w"],
["Great Barrier Reef coral spawning","Queensland","australia","",11,1,12,15,"nature","The entire reef spawns over a few nights after the November full moon.","v"],
["Iguazú at full flow","Iguazú Falls","argentina","",12,1,3,31,"nature","Wet season puts the most water over the falls, though spray can close the walkways.","w"]
];

/* ===========================================================
   Reading the calendar
   =========================================================== */
const EV_CAT = {
  bloom:   ['BLOOM','#e05c8a'],
  carnival:['CARNIVAL','#f0603a'],
  culture: ['CULTURE','#c9842f'],
  food:    ['FOOD','#d4a017'],
  lights:  ['LIGHTS','#5f6fd4'],
  music:   ['MUSIC','#8d4fc9'],
  nature:  ['NATURE','#2e9e73'],
  sport:   ['SPORT','#2f86c9'],
  wildlife:['WILDLIFE','#6b9b2f']
};

/* Each row, unpacked once into something the views can use. */
const EV = EVENTS.map((r,i)=>({
  i, name:r[0], place:r[1], scope:r[2], ck:r[3],
  m1:r[4], d1:r[5], m2:r[6], d2:r[7],
  cat:r[8], blurb:r[9], flag:r[10] || '',
  varies: r[10] === 'v', window: r[10] === 'w',
  wraps: r[6] < r[4],
  id: 'ev:' + i + ':' + (r[0].toLowerCase().replace(/[^a-z0-9]+/g,'-'))
}));

/* The next time this event comes round, as a real date, counted from
   `from`. An event already running returns today, so "happening now"
   sorts to the front. */
function evNext(e, from){
  const now = from || new Date();
  const y = now.getFullYear();
  for (let add = 0; add <= 1; add++){
    const start = new Date(y + add, e.m1 - 1, e.d1);
    let end = new Date(y + add + (e.wraps ? 1 : 0), e.m2 - 1, e.d2);
    end.setHours(23,59,59);
    if (now >= start && now <= end) return {start, end, live:true, days:0};
    if (start > now){
      return {start, end, live:false,
        days: Math.round((start - now) / 86400000)};
    }
    /* a wrapping window may have started last year and still be running */
    if (e.wraps){
      const s0 = new Date(y + add - 1, e.m1 - 1, e.d1);
      const e0 = new Date(y + add, e.m2 - 1, e.d2); e0.setHours(23,59,59);
      if (now >= s0 && now <= e0) return {start:s0, end:e0, live:true, days:0};
    }
  }
  const start = new Date(y + 1, e.m1 - 1, e.d1);
  return {start, end:start, live:false, days: Math.round((start - now)/86400000)};
}

/* How to print a date we are confident about, and how to hedge one we
   are not. A moveable feast gets its month, never a made-up day. */
function evWhen(e, n){
  const M = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const d = n || evNext(e);
  const sameDay = e.m1 === e.m2 && e.d1 === e.d2;
  if (e.window){
    return M[e.m1-1] + ' – ' + M[e.m2-1] + (e.varies ? '' : '');
  }
  if (e.varies){
    return sameDay || e.m1 === e.m2
      ? M[e.m1-1] + ' · date varies'
      : M[e.m1-1] + '–' + M[e.m2-1] + ' · dates vary';
  }
  if (sameDay) return M[e.m1-1] + ' ' + e.d1;
  if (e.m1 === e.m2) return M[e.m1-1] + ' ' + e.d1 + '–' + e.d2;
  return M[e.m1-1] + ' ' + e.d1 + ' – ' + M[e.m2-1] + ' ' + e.d2;
}

/* A short human line: running now, or how long until it does. */
function evCountdown(e, from){
  const n = evNext(e, from);
  if (n.live) return e.window ? 'IN SEASON NOW' : 'HAPPENING NOW';
  const d = n.days;
  if (d <= 1)  return 'TOMORROW';
  if (d <= 14) return 'IN ' + d + ' DAYS';
  if (d <= 60) return 'IN ' + Math.round(d/7) + ' WEEKS';
  return 'IN ' + Math.round(d/30) + ' MONTHS';
}

/* Everything starting or running within the next `months`, soonest first. */
function evUpcoming(months, from){
  const now = from || new Date();
  const cut = new Date(now.getTime() + (months || 6) * 30.5 * 86400000);
  return EV.map(e=>({e, n:evNext(e, now)}))
    .filter(x=>x.n.live || x.n.start <= cut)
    .sort((a,b)=> (b.n.live - a.n.live) || (a.n.start - b.n.start));
}

/* Events belonging to one country, one US state, or one city. */
const evForCountry = s => EV.filter(e=>
  e.scope === s || (s === 'united-states' && e.scope.indexOf('us:') === 0));
const evForState   = a => EV.filter(e=>e.scope === 'us:' + a);
const evForCity    = k => EV.filter(e=>e.ck === k);

/* Anything in a set of scopes — used for "events where you are going". */
function evForScopes(scopes, months, from){
  const want = new Set(scopes);
  return evUpcoming(months || 8, from).filter(x=>want.has(x.e.scope) || want.has(x.e.ck));
}

/* Which months are best for a place, read out of the written profile.
   "May–Jun, Sep–Oct" becomes [5,6,9,10], which the home page matches
   against the current month.

   Named monthsFromText, not bestMonths: features.js already has a
   bestMonths() that reads a climate row, and it loads after this file. */
const MON_RE = {jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12};
function monthsFromText(text){
  if (!text) return [];
  const out = new Set();
  const t = String(text).toLowerCase();
  const ranges = t.match(/[a-z]{3}[a-z]*\s*[–\-]\s*[a-z]{3}[a-z]*/g) || [];
  ranges.forEach(r=>{
    const p = r.split(/[–\-]/).map(s=>MON_RE[s.trim().slice(0,3)]);
    if (!p[0] || !p[1]) return;
    let m = p[0];
    for (let i = 0; i < 12; i++){ out.add(m); if (m === p[1]) break; m = m === 12 ? 1 : m + 1; }
  });
  (t.match(/[a-z]{3,}/g) || []).forEach(w=>{
    const m = MON_RE[w.slice(0,3)];
    if (m) out.add(m);
  });
  return [...out];
}
