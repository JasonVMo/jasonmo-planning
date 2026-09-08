# Overview

This repository will be set up to be able to represent personal tracking items. In particular travel plans, events, home projects, and other things that will come up in the future.

## Top Level Categories

### Calendar

This top-level category should have a navigatable calendar view that shows upcoming events or vacations of importance.

### Trips

This should contain a list of trips coming up with categorized research. If a trip contains multiple segments the research should be segment specific. For example on my upcoming trip to Acadia and New York we fly in to Maine, spend 4 full days in Acadia, then fly to New York City, spend a few days there, then fly back to Seattle. So a trip with multiple segments should have an additional layer of hierarchy, while a trip with only one stop should omit that level and have the research as sub-pages for the trip itself.

Structure of a trip segment should have a landing page at the root, with flights, reservations, lodging, etc. Then sub-pages may include:
- **Things to Do** - activities, tours, viewpoints, etc.
- **Hikes & Walks** - a list of hikes with brief descriptions, pictures, alltrails links, and drive times in the overall list. This category is only relevant on certain kinds of trips. For cities this may include walking tours or routes of note.
- **Restaurants** - research on restaurants in the cities or towns we will be visiting
- **Getting Ready** - expected weather, packing notes, things yet to be reserved, reservations or tours that need to be booked, important dates, etc.

For a trip with multiple segments there should be an overall trip page that summarizes the travel arrangements and timelines.

### Events

These should contain references to various events coming up which should show up on the calendar view. Events should be grouped by category. Start with the following event category pages:
- **Seahawks Games** - We have Seahawks season tickets and go to half the home games. This year we are going to the Patriots, Chargers, Chiefs, and Giants games. Games should have start times, what network they are being broadcast on, and any other special information about the games.
- **Concerts** - Upcoming concerts of interest with information about venue, time, when tickets go on sale, ticketing service and so forth. I'm primarily interested in indie bands like The Strokes, The Shins, Yeah Yeah Yeahs, Nation of Language, Wet Leg, Death Cab for Cutie, The National, Vampire Weekend, or similar bands. Big name acts like Paul McCartney, U2, Elton John, Lady Gaga, Pit Bull, Flo Rida, are also of interest.
- **Productions** - Upcoming plays or musicals at the Seattle Repertory Theater, 5th Avenue, or Paramount
- **Festivals & Events** - This is for other odds & ends.

### Archive

Once events or trips are more than a week in the past they should be moved to the archive section.

## Research Context

There should be grounding information about the types of activities that we like. Some starting context:
### Things to Do
- **museums** - include can't miss museums, or museums that are quirky, unique, or kitchy.
- **roadside attractions** - we love quick stops for silly roadside attractions, quirky shops.
- **local flavor** - we love local markets, night markets, local festivals, or other things that are unique to the area.
- **walking** - we like walking cities, experiencing local culture, and generally like roaming
- **photography** - I'm into photography and like taking pictures and calling out good viewpoints or photo points is worthwhile

### Hikes & Walks
- we are pretty flexible on difficulty, hikes less than 10 miles and up to 4000 feet of climbing are fine.
- also include moderate difficulty hikes that are highly regarded
- for easy hikes ones that are quick stops from the car can be incorporated into a day plan
- group hikes by region and area if relevant
- try to include pictures

### Restaurants
- we only go to fancy restaurants if they are can't miss establishments
- most dining has a focus on good mid-range value
- places that are local, farm-to-table, unique, interesting are good
- we try to avoid tourist trap restaurants unless they unique in terms of views or some other attributes
- we are adventurous and like ethnic food of all types.
- we like to vary the types of places we eat, so though we like seafood we wouldn't want it every day

### Lodging
- we tend to avoid big resorts and all-inclusives in most cases
- we prefer places that are either good values or have good local flavor
- location and walkability are important when possible
- AirBnbs or other home/apartment rentals are favorites of ours when staying multiple days and when the cost is reasonable

### Flights
- our home base is Seattle
- we have status on Alaska so prefer alaska flights when possible
- we tend to avoid basic economy
- if Alaska is not available, partner airlines like American are preferred
- we try to fly direct when possible
- we try to avoid red-eye flights when possible
- flights should have a standard formatted tile representation

## Initial Trips

These are the initial trips that should be researched and seeded

### Sequioa National Park

#### Itinerary:
- Departure: Seattle to Fresno, SEA -> FAT, Alaska 383, Tue, Sep 15 @12:59pm to Tue Sep 15 @3:21pm, Confirmation: CRDUWN
- Rental Car: Budget via Costco Travel, 9/15@4pm -> 9/20@3pm, Fastbreak #: SS766U, Costco Confirmation: C500742223, Budget Confirmation: 03535977US4
- Lodging: Tue September 15th 4pm to Sunday September 20th 11am, Three Rivers AirBnb, 40711 Old Three Rivers Rd, CA 93271, https://www.airbnb.com/trips/v1/1684085702659113068
- Return:  FAT -> SEA, Alaska 394, Sun Sep 20 @4:21pm to Sun Sep 20 @6:39pm

#### Activities:
- Research the best hikes, grouped by region
- We will likely want to go to Kings Canyon at some point
- Be sure to research expected weather at Three Rivers (where we are staying), the Foothills visitor center, and the Lodgepole Visitors center
- Look for other things to do, things to be aware of in terms of hours, reservations we may want to get and so forth
- Look at various sources like travel blogs and other articles

Incorporate the email discussion in `./prior-research/email-discussion.pdf`

### Acadia & New York City

This trip has two segments, Acadia National Park & Bar Harbor Maine, then New York City and Hoboken New Jersey

#### Itinerary:
- Flight: Mon 10/5, AA 1872, Depart SEA @6:12am - Arrive ORD @12:26pm, AA 3683: Depart ORD @1:36pm - Arrive BGR @5:20pm, Confirmation CVCDKL
- Rental Car: Bangor International Airport, Enterprise, Oct 5 @5:45pm to Oct 10 @12pm, rented via myEHTrip, confirmation 2132296621
- Lodging Oct 5-6 - Need to book this, looking for someplace cost-effective, NEED TO BOOK
- Lodging Oct 6-10 - Days Inn Bar Harbor, Check-in 10/6 @4pm, Check-out 10/10 @11am
- Flight: Sat 10/10, AA 4343, Depart BGR @12:57pm - Arrive LGA @2:41pm, Confirmation OJSPPT
- Lodging Oct 10-13 - Stay in Hoboken NJ close to Steven's institute of technology, NEED TO BOOK
- Flight: Tue Oct 13 - Alaska 373, Depart EWR @9:30am - Arrive SEA @12:35pm, Confirmation IIIHRY

#### Segment1 - Acadia National Park
- Research things to do, options for lodging on the day we arrive, weather, fall foliage and so forth
- Incorporate parts of prior research from the markdown files in the `./prior-research/acadia` folder where relevant, though delete those files once incorporated and reworked.
- Include information on how to navigate using the island busses
- For hikes include whether the hikes should be accessed via busses or driving and expected travel time to get there.
- Look for day trips in the surrounding areas.
- Put together some suggested day itineraries
- Put together a section for what to do if it rains

#### Segment2 - New York City

The primary purpose of the visit is to visit our son Dylan who is a student at Steven's institute of technology. We will want to stay in Hoboken NJ and don't plan to have a car on the trip.
- include information on how to get from LGR airport to Hoboken
- include information on current Broadway shows, which ones are hot, which ones are good values, best ways to get tickets, showtimes and so on. Shows should include links to the homepages for the shows.
- look for any other notable events going on in Hoboken, Brooklyn, or NYC on those dates.



