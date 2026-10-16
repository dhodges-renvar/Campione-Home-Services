export type Service = { title: string; body: string };
export type Faq = { q: string; a: string };
export type Step = { title: string; body: string };

export type Division = {
  slug: string;
  name: string;
  /** Short label for the fan-deck row. Keep to one or two words. */
  short: string;
  /** The division colour, straight off the Home Services fan deck. */
  color: string;
  /** Same hue, darkened where needed so it passes contrast as TEXT on paper. */
  colorText: string;
  /** Text colour to use ON TOP of `color`. Light swatches take ink, not white. */
  colorOn: string;
  /** Who the page is written for. Changes the CTA and the proof block. */
  audience: 'home' | 'trade';
  tagline: string;
  /** One paragraph. Reads as the answer to "what is this and why you". */
  lead: string;
  icon: IconKey;
  heroKicker: string;
  services: Service[];
  process: Step[];
  included: string[];
  notIncluded: string[];
  faq: Faq[];
  metaTitle: string;
  metaDesc: string;
  /** Plain-language service names for schema markup and llms.txt. */
  schemaServices: string[];
};

export type IconKey =
  | 'roller'
  | 'trowel'
  | 'clipboard'
  | 'siding'
  | 'spray'
  | 'sparkle';

export const DIVISIONS: Division[] = [
  // ───────────────────────────────────────────────────────────── PAINTING
  {
    slug: 'painting',
    name: 'Painting',
    short: 'Painting',
    color: '#2D6CA2',
    colorText: '#2D6CA2',
    colorOn: '#FFFFFF',
    audience: 'home',
    icon: 'roller',
    tagline: 'Paint that still looks right in year five.',
    heroKicker: 'Interior · Exterior · Cabinets · Specialty finish',
    lead:
      'Most repaints fail at the prep, not the paint. We measure every surface, write the prep into the scope so you can see it, and put the coats on in the order the manufacturer actually specifies. That is the whole difference between a job that photographs well on day one and one that still looks right when you sell the house.',
    services: [
      {
        title: 'Interior repaints',
        body: 'Walls, ceilings, trim, doors and closets. Furniture moved and covered, floors protected wall to wall, and a room-by-room scope so nobody argues later about whether the closet interiors were included.',
      },
      {
        title: 'Cabinet refinishing',
        body: 'Doors and drawer fronts come off, get degreased, sanded and sprayed in a controlled space, then go back on numbered hardware. Boxes are sprayed in place with containment. A conversion or urethane finish, not wall paint on cabinets.',
      },
      {
        title: 'Trim, doors and millwork',
        body: 'Base, casing, crown, wainscot, panel molding, columns, beams and built-ins — priced per linear foot or per piece rather than buried in a square-foot number, so you can see what you are paying for.',
      },
      {
        title: 'Specialty finishes',
        body: 'Lime wash, limewash-over-brick, Venetian plaster, glazing, metallics and color-matched accent work. Sample boards go up in your light before we commit to a wall.',
      },
      {
        title: 'New construction & builder work',
        body: 'Spray-and-backroll production painting on a schedule, Level 4 or Level 5 substrate, punch lists turned around in days not weeks. One invoice per phase.',
      },
      {
        title: 'Occupied-home repaints',
        body: 'People are living there. We work in a sequence that keeps the kitchen and at least one bath usable, clean up at the end of every day, and never leave an open paint can in a house with kids.',
      },
    ],
    process: [
      { title: 'Measured estimate', body: 'We measure on site, not from a photo. Every surface gets a quantity and a line item.' },
      { title: 'Written scope', body: 'You get the prep, the product, the sheen and the number of coats in writing before anyone tapes a baseboard.' },
      { title: 'Prep, then paint', body: 'Protection, repairs, caulk, prime, then coats. The order is not negotiable and it is where the longevity comes from.' },
      { title: 'Walkthrough with a light', body: 'We walk it with you holding a bright light at a low angle. Anything you can see, we fix before we invoice.' },
    ],
    included: [
      'Furniture moved and covered, floors and fixtures protected',
      'Nail holes, dents and cracks filled and sanded',
      'Caulking at trim-to-wall and trim-to-trim joints',
      'Spot priming on repairs, stains and bare substrate',
      'Two finish coats unless the scope says otherwise in writing',
      'Daily cleanup and full cleanup at completion',
      'Written warranty on labor',
    ],
    notIncluded: [
      'Lead-safe abatement on pre-1978 surfaces (quoted separately when required)',
      'Wallpaper removal (priced as its own line item)',
      'Drywall replacement beyond patching — that moves to the drywall division',
      'Moving pianos, safes, aquariums or electronics',
    ],
    faq: [
      {
        q: 'How much does it cost to paint the interior of a house in Monroe, GA?',
        a: 'For an occupied repaint of walls, ceilings and trim, most homes in our area land between $3.50 and $6.50 per square foot of floor area, depending on ceiling height, how much trim and millwork there is, how many colors, and how much repair the walls need. A whole-house interior with high ceilings and heavy trim prices very differently from a three-bedroom ranch, which is why we measure instead of quoting over the phone.',
      },
      {
        q: 'How long does a repaint take?',
        a: 'A single room is a day. Three or four rooms with trim is usually two to three days. A whole-house interior repaint runs five to ten working days. Cabinet refinishing is four to six days because the finish has to cure between coats, and we will tell you up front which days you cannot use the kitchen.',
      },
      {
        q: 'Do you use Sherwin-Williams or Benjamin Moore?',
        a: 'Both, plus PPG and Behr Pro on builder work. The product gets chosen for the surface and the exposure, not from a loyalty program. Your estimate names the exact product line and sheen so you can look it up.',
      },
      {
        q: 'Will I get the same person from the estimate to the end of the job?',
        a: 'Yes. The person who measures your house is the person you call during the job, and the person who walks it with you at the end.',
      },
      {
        q: 'Do you paint cabinets, or do they have to be replaced?',
        a: 'If the boxes are solid and the doors are not delaminating, refinishing gets you a new-looking kitchen for a fraction of replacement. Thermofoil and some laminates are not good candidates and we will say so rather than take the job.',
      },
    ],
    metaTitle: 'House Painters in Monroe, GA | Interior, Exterior & Cabinets',
    metaDesc:
      'Interior and exterior painting, cabinet refinishing and specialty finishes in Monroe, Loganville, Winder and metro Atlanta. Measured estimates, written scopes, since 2017.',
    schemaServices: [
      'Interior house painting',
      'Exterior house painting',
      'Kitchen cabinet refinishing',
      'Trim and millwork painting',
      'Specialty and decorative finishes',
      'New construction painting',
    ],
  },

  // ───────────────────────────────────────────────────────────── DRYWALL
  {
    slug: 'drywall',
    name: 'Drywall',
    short: 'Drywall',
    color: '#546A7B',
    colorText: '#4C6174',
    colorOn: '#FFFFFF',
    audience: 'home',
    icon: 'trowel',
    tagline: 'Level 5 is a standard, not a sales word.',
    heroKicker: 'Hang · Finish · Repair · Level 5 skim',
    lead:
      'Drywall is the surface every other finish sits on, and a bad finish shows up the moment someone turns on a lamp. We hang, tape and finish to the ASTM levels by name — and when a scope calls for Level 5, that means a skim coat over the entire surface, not a heavier second coat on the joints.',
    services: [
      {
        title: 'Hang and finish',
        body: 'New construction, additions and whole-floor remodels. 1/2", 5/8", Type X, moisture-resistant and abuse-resistant board, specified per room rather than one board type for the whole house.',
      },
      {
        title: 'Level 5 skim coat',
        body: 'The full-surface skim required anywhere you have critical lighting, gloss paint or large flat planes. Priced separately and clearly, because it is real additional labor and material.',
      },
      {
        title: 'Repairs and patches',
        body: 'Water damage, settlement cracks, popped screws, doorknob holes, old can-light scars. Texture matched to the existing surface so the repair does not read as a repair.',
      },
      {
        title: 'Ceilings and popcorn removal',
        body: 'Scrape, skim and refinish to smooth, or re-texture to match an adjacent ceiling. Containment and dust control are part of the scope, not an upsell.',
      },
      {
        title: 'High and vaulted ceilings',
        body: 'Stairwells, two-story foyers and vaults get their own rate because they genuinely cost more to hang and finish. We price the high areas separately rather than applying a lift rate to the whole house.',
      },
      {
        title: 'Garage, basement and attic finish-out',
        body: 'Unfinished space turned into finished space, including fire-rated assemblies where code requires them at the garage-to-house separation.',
      },
    ],
    process: [
      { title: 'Board takeoff', body: 'Square footage converted to actual sheet counts by size, so material is ordered for the job rather than guessed.' },
      { title: 'Hang', body: 'Screw pattern and board layout that minimizes butt joints in sightlines and keeps seams off the corners of openings.' },
      { title: 'Tape and finish', body: 'Tape, two fill coats, then finish — and a full skim on top if the scope is Level 5.' },
      { title: 'Sand and light check', body: 'Sanded, then checked under raking light before the painter ever shows up. Catching it here is a fraction of the cost of catching it in primer.' },
    ],
    included: [
      'Board, fasteners, tape, compound and corner bead',
      'Dust containment and daily debris removal',
      'Texture matched to adjacent existing surfaces',
      'Finish level stated by ASTM number in the written scope',
      'Raking-light inspection before paint',
    ],
    notIncluded: [
      'Framing corrections — bowed or out-of-plane studs are flagged, not fixed, unless added to scope',
      'Insulation and vapor barrier',
      'Priming and painting (our painting division, quoted together on request)',
      'Asbestos testing or abatement on older textured ceilings',
    ],
    faq: [
      {
        q: 'What is the difference between Level 4 and Level 5 drywall finish?',
        a: 'Level 4 is tape plus two coats of compound over joints and fasteners, with the field of the board left bare. It is the standard for flat and matte paint in ordinary lighting. Level 5 adds a thin skim coat of compound across the entire surface, which equalizes the texture between the finished joints and the paper face of the board. You need Level 5 wherever you have critical lighting — big windows, wall sconces, long flat walls — or any sheen above eggshell. Paint cannot hide a Level 4 finish under gloss.',
      },
      {
        q: 'How much does drywall repair cost?',
        a: 'Small patches — a doorknob hole or a few popped screws — generally run a service-call minimum rather than a per-piece price, because the mobilization is most of the cost. Larger repairs are priced by board, by finish area and by the texture match required. Water damage usually needs the source fixed first; we will tell you if we think you are patching over an active leak.',
      },
      {
        q: 'Do you charge more for high ceilings?',
        a: 'Yes, and only for the high areas. A walkout basement or a two-story foyer costs more to hang and finish than an eight-foot room, so that square footage gets its own rate. Applying a vaulted-ceiling rate to an entire house is one of the most common ways drywall quotes get inflated, and we do not do it.',
      },
      {
        q: 'Can you work directly for a builder on a production schedule?',
        a: 'That is a large share of what this division does. Multi-unit and multi-lot work on a schedule, with board specified per room and finish level specified per plan.',
      },
    ],
    metaTitle: 'Drywall Contractor in Monroe, GA | Hang, Finish & Level 5 Repair',
    metaDesc:
      'Drywall hanging, taping, Level 5 skim coat, ceiling and water-damage repair in Monroe, Loganville and metro Atlanta. Texture matched, finish level in writing.',
    schemaServices: [
      'Drywall installation',
      'Drywall taping and finishing',
      'Level 5 skim coat',
      'Drywall repair',
      'Popcorn ceiling removal',
      'Basement and garage finishing',
    ],
  },

  // ───────────────────────────────────────────────────────────── EXTERIORS
  {
    slug: 'exteriors',
    name: 'Exteriors',
    short: 'Exteriors',
    color: '#A0563A',
    colorText: '#9A5035',
    colorOn: '#FFFFFF',
    audience: 'home',
    icon: 'siding',
    tagline: 'Fix the wood before you paint it.',
    heroKicker: 'Siding · Trim · Rot repair · Decks · Fences',
    lead:
      'Paint is not a repair. If the fascia is soft or the sill is gone, coating it buys you one season and hides the problem from the next person who looks. We open it up, replace what has failed, flash and caulk the joints that let water in, and then finish it — so the paint is protecting sound wood instead of holding rotten wood together.',
    services: [
      {
        title: 'Wood rot and siding repair',
        body: 'Fascia, soffit, rake board, frieze, corner boards, window sills and door casings. Replaced in kind — or in a composite where the detail keeps failing — with the cause of the water addressed, not just the symptom.',
      },
      {
        title: 'Siding replacement',
        body: 'Hardie and fiber cement, LP SmartSide, cedar, vinyl and board-and-batten. Full elevations or targeted sections blended into the existing run.',
      },
      {
        title: 'Exterior painting',
        body: 'Measured per elevation and per material, because brick, fiber cement, wood and stucco take different prep, different primer and different quantities. Washed, scraped, sanded, spot-primed, caulked and coated.',
      },
      {
        title: 'Decks and porches',
        body: 'Board replacement, railing and baluster repair, structural hardware, then clean, brighten and stain or seal. Pressure-treated, cedar and composite.',
      },
      {
        title: 'Fences and gates',
        body: 'Repair, section replacement, post resetting, and staining or sealing. We will tell you honestly when a fence is past the point where repair is cheaper than replacement.',
      },
      {
        title: 'Garage doors, shutters and ironwork',
        body: 'Front-of-house details that carry most of the curb appeal and get skipped on most exterior quotes. Prepped and finished properly, including the hardware.',
      },
    ],
    process: [
      { title: 'Elevation walk', body: 'We walk all four sides and probe anything suspect with an awl. Soft wood gets found now or found later at a worse price.' },
      { title: 'Repairs first', body: 'Carpentry, flashing and caulk before any coating. Repair quantities are listed as their own line items so nothing is hidden in a lump sum.' },
      { title: 'Wash and prep', body: 'Soft wash, scrape, sand, spot prime. Chalky and failing coatings get a bonding primer, not a prayer.' },
      { title: 'Finish and inspect', body: 'Coated per material, then walked with you. Gutters and walkways left clean.' },
    ],
    included: [
      'Four-elevation inspection with rot probing',
      'Repair quantities itemized separately from coating',
      'Soft washing and surface prep',
      'Caulking at all penetrations, joints and transitions',
      'Landscaping, windows, roofing and hardscape protected',
      'Debris hauled off at completion',
    ],
    notIncluded: [
      'Roofing, gutters and gutter guards',
      'Structural framing or foundation work',
      'Window and door replacement (we repair and finish, we do not supply units)',
      'Unknown rot behind siding — found, documented and priced before we proceed',
    ],
    faq: [
      {
        q: 'Do you need a license for exterior repair work in Georgia?',
        a: 'Repair and replacement of siding, trim, fascia, decks and fences is maintenance work and does not require a residential contractor license in Georgia. Structural alterations, additions and work over the state threshold do, and that work runs through our construction management division under a licensed holder.',
      },
      {
        q: 'How do I know if I have wood rot or just peeling paint?',
        a: 'Press an awl or a screwdriver into the wood at the bottom of a trim board, a window sill, or the end grain of a fascia. Sound wood resists. Rot gives. Peeling paint over hard wood is a coating failure and is far cheaper to fix than rot, so it is worth knowing which one you have before you buy a paint job.',
      },
      {
        q: 'How often should a house be repainted on the outside in Georgia?',
        a: 'In this climate, fiber cement and well-prepped wood run seven to ten years on the shaded elevations and five to seven on the south and west sides, which take the real sun load. Stucco goes longer. A house that needed repainting after three years had a prep problem, not a paint problem.',
      },
      {
        q: 'Can you repair just one section of siding to match the rest?',
        a: 'Usually, yes. Matching profile and exposure on an existing run is routine. Matching a weathered color is harder, which is why we are honest about when a repair is going to need the full elevation repainted to look right.',
      },
    ],
    metaTitle: 'Exterior Repair & Siding Contractor in Monroe, GA | Rot, Decks, Fences',
    metaDesc:
      'Wood rot repair, siding replacement, exterior painting, deck and fence work in Monroe, Loganville, Winder and metro Atlanta. Repairs itemized, cause of water addressed.',
    schemaServices: [
      'Wood rot repair',
      'Siding repair and replacement',
      'Exterior painting',
      'Deck repair and staining',
      'Fence repair and staining',
      'Trim and fascia replacement',
    ],
  },

  // ─────────────────────────────────────────────── CONSTRUCTION MANAGEMENT
  {
    slug: 'construction-management',
    name: 'Construction Management',
    short: 'Construction Mgmt',
    color: '#38523F',
    colorText: '#38523F',
    colorOn: '#FFFFFF',
    audience: 'trade',
    icon: 'clipboard',
    tagline: 'Someone on site who answers for the schedule.',
    heroKicker: 'For builders, owners and licensed GCs',
    lead:
      'Projects do not usually fail on craftsmanship. They fail in the gaps — the sub who was never called, the inspection nobody scheduled, the decision that sat for nine days. We run the trades, the schedule and the field decisions on your behalf, under your license, and give you one person to call who already knows the answer.',
    services: [
      {
        title: 'Field supervision',
        body: 'Daily presence on site. Trades sequenced, deliveries staged, conflicts resolved at the wall instead of over email three days later.',
      },
      {
        title: 'Subcontractor management',
        body: 'Scopes written so two subs cannot both exclude the same work. Bids leveled against each other. Performance tracked against the dates they committed to.',
      },
      {
        title: 'Schedule and sequencing',
        body: 'A real critical path with inspection holds and material lead times in it, updated weekly, with the one or two items actually driving the finish date called out by name.',
      },
      {
        title: 'Owner and builder reporting',
        body: 'A weekly report with photos, percent complete, what moved, what is at risk and what decision we need from you — in a format you can forward to a lender or an owner without rewriting it.',
      },
      {
        title: 'Budget and change control',
        body: 'Schedule of values, marked-up sub bids, and change orders priced and approved before work proceeds. No surprises at closeout.',
      },
      {
        title: 'Closeout and punch',
        body: 'Punch generated, assigned by trade, driven to zero, with warranties, manuals and lien waivers collected before final payment.',
      },
    ],
    process: [
      { title: 'Scope and license alignment', body: 'We confirm who holds the license, who holds the contract, and exactly where our authority starts and stops. In writing, before mobilization.' },
      { title: 'Buyout', body: 'Trades scoped, bid, leveled and awarded, with the gaps between scopes closed before anyone is on site.' },
      { title: 'Run the job', body: 'Daily field presence, weekly schedule update, weekly written report, change orders handled as they arise.' },
      { title: 'Close it out', body: 'Punch to zero, documentation collected, final accounting reconciled against the schedule of values.' },
    ],
    included: [
      'Named field manager assigned to your project',
      'Weekly written progress report with photographs',
      'Subcontractor scoping, leveling and coordination',
      'Schedule maintenance with inspection and lead-time holds',
      'Change order documentation and approval tracking',
      'Punch list generation and closeout documentation',
    ],
    notIncluded: [
      'Acting as the licensed general contractor of record — we work under your license or an identified licensee',
      'Design, architecture and engineering',
      'Permit fees, impact fees and utility connections',
      'Financing, draw administration and lender coordination unless added to scope',
    ],
    faq: [
      {
        q: 'What is the difference between construction management and general contracting?',
        a: 'A general contractor holds the contract, carries the license and takes the risk on the trades. A construction manager runs the work on behalf of whoever holds that contract — scheduling, scoping, coordinating subs, reporting and driving the punch — without being the licensed party of record. We operate as the construction manager under a licensed holder, which is stated in writing at the start of every engagement.',
      },
      {
        q: 'What size projects do you manage?',
        a: 'Our recent managed projects have run from roughly $95,000 to $220,000 in installed value, coordinating up to ten trades on a single job. That is the band where an owner or builder needs daily presence but cannot justify a full-time superintendent.',
      },
      {
        q: 'How is construction management priced?',
        a: 'Either a percentage of construction value or a fixed monthly management fee, depending on how defined the scope is and how long the schedule runs. Both are quoted against a written scope of management services so you know what the fee covers and what it does not.',
      },
      {
        q: 'Can you manage a project where the trades are already under contract?',
        a: 'Yes. Taking over a job mid-flight is common. The first week is spent reading the existing contracts, finding the scope gaps and building a real schedule from where the job actually is rather than where the original schedule says it should be.',
      },
    ],
    metaTitle: 'Construction Management in Monroe, GA | Field Supervision & Sub Coordination',
    metaDesc:
      'Construction management for builders, owners and licensed GCs in metro Atlanta. Field supervision, subcontractor coordination, scheduling and weekly reporting.',
    schemaServices: [
      'Construction management',
      'Field supervision',
      'Subcontractor coordination',
      'Project scheduling',
      'Change order management',
      'Project closeout',
    ],
  },

  // ─────────────────────────────────────────────────────── PRESSURE WASHING
  {
    slug: 'pressure-washing',
    name: 'Pressure Washing',
    short: 'Pressure Wash',
    color: '#2E9B8F',
    colorText: '#1E7A70',
    colorOn: '#0E1114',
    audience: 'home',
    icon: 'spray',
    tagline: 'The cheapest thing you can do for the house.',
    heroKicker: 'Soft wash · Concrete · Decks · Commercial',
    lead:
      'A wash is the highest-return exterior work there is: a few hundred dollars that makes a house look years younger and keeps organic growth from eating into the paint and the wood. The trick is pressure discipline — soft wash on anything painted, and real pressure only on hardscape that can take it.',
    services: [
      {
        title: 'House soft washing',
        body: 'Low pressure and the right detergent on siding, stucco, brick, soffit and gutters. Mildew and algae killed at the root rather than blasted off the surface along with your paint.',
      },
      {
        title: 'Driveways and walkways',
        body: 'Surface-cleaner passes with even overlap so you do not get zebra stripes. Rust, oil, tannin and battery acid treated as their own problems with their own chemistry.',
      },
      {
        title: 'Decks, patios and screened porches',
        body: 'Cleaned and brightened at a pressure the wood can survive, ready for stain or sealer. We can wash only, or wash and finish in one trip.',
      },
      {
        title: 'Roof soft wash',
        body: 'The black streaking on asphalt shingles is algae and it is removable without pressure. Chemistry and dwell time, never a wand on a roof.',
      },
      {
        title: 'Fences and retaining walls',
        body: 'Wood, vinyl and masonry. Washing before staining is most of the reason a stain job lasts, and it is the step most often skipped.',
      },
      {
        title: 'Commercial and recurring',
        body: 'Storefronts, dumpster pads, sidewalks, drive-throughs and parking decks, on a monthly or quarterly schedule with before-and-after photos on file.',
      },
    ],
    process: [
      { title: 'Walk and protect', body: 'Plants pre-wetted and covered, fixtures and outlets protected, drainage path identified before the pump starts.' },
      { title: 'Treat', body: 'Detergent applied and given its dwell time. This is the step that actually does the work.' },
      { title: 'Rinse at the right pressure', body: 'Soft wash on anything painted or coated. Pressure only where the substrate can take it.' },
      { title: 'Final rinse and check', body: 'Landscaping rinsed, windows checked for spotting, walk-around with you if you are home.' },
    ],
    included: [
      'Water-fed from your spigot, or we bring our own supply',
      'Plant and landscape pre-wetting and protection',
      'Biodegradable detergents appropriate to each surface',
      'Before-and-after photos on commercial accounts',
      'Full rinse-down of adjacent hardscape and plantings',
    ],
    notIncluded: [
      'Repairing coatings that were already failing before the wash',
      'Removing stains that have penetrated concrete past the surface — we will tell you in advance when we expect that',
      'Window cleaning (available through our cleaning division)',
      'Gutter interior cleanout unless added to scope',
    ],
    faq: [
      {
        q: 'How much does pressure washing a house cost?',
        a: 'A typical single-family soft wash in our area runs $250 to $600 depending on square footage, height and how much organic growth there is. Driveways are generally priced per square foot. Bundling the house, driveway and walkways in one visit is meaningfully cheaper than three separate trips because the setup is most of the cost.',
      },
      {
        q: 'Will pressure washing damage my siding or paint?',
        a: 'High pressure absolutely can — it drives water behind siding, etches wood and strips coatings. That is why painted and coated surfaces get soft-washed: low pressure plus the right detergent, which cleans better anyway because it kills the organism instead of knocking it loose.',
      },
      {
        q: 'How often should I wash my house in Georgia?',
        a: 'Every one to two years for most homes here. Shaded north elevations and anything under tree cover grow back faster and may want annual attention. Washing before a repaint is not optional — it is the first step of prep.',
      },
      {
        q: 'Can you remove the black streaks on my roof?',
        a: 'Yes. Those streaks are gloeocapsa magma, an algae, and they come off with a soft wash and the correct chemistry. Anyone putting a pressure wand on an asphalt roof is removing granules and shortening its life.',
      },
    ],
    metaTitle: 'Pressure Washing in Monroe, GA | House Soft Wash, Driveways, Roofs',
    metaDesc:
      'House soft washing, driveway and concrete cleaning, deck and roof washing in Monroe, Loganville, Winder and metro Atlanta. Residential and recurring commercial.',
    schemaServices: [
      'House soft washing',
      'Driveway and concrete cleaning',
      'Deck and patio washing',
      'Roof soft washing',
      'Fence washing',
      'Commercial pressure washing',
    ],
  },

  // ───────────────────────────────────────────────────────────── CLEANING
  {
    slug: 'cleaning',
    name: 'Cleaning',
    short: 'Cleaning',
    color: '#D4A03C',
    colorText: '#8A6418',
    colorOn: '#0E1114',
    audience: 'home',
    icon: 'sparkle',
    tagline: 'The last trade before anyone sees it.',
    heroKicker: 'Post-construction · Move-in/out · Recurring',
    lead:
      'Construction cleaning is its own trade. Drywall dust settles three times before it stops, paint overspray needs a blade and not a rag, and a house that is 99 percent finished and dusty reads as unfinished to a buyer. We do the cleaning that comes after the work — ours or anyone else\'s.',
    services: [
      {
        title: 'Post-construction cleaning',
        body: 'Rough, final and touch-up phases. Dust pulled off horizontal surfaces top-down, overspray razored off glass, label and sticker removal, vents and registers wiped, floors done last.',
      },
      {
        title: 'Final clean before closing',
        body: 'The clean that happens after the punch list and before the walkthrough. Including the things that get missed: the tops of doors, inside cabinets and drawers, light lenses, and window tracks.',
      },
      {
        title: 'Move-in and move-out',
        body: 'Empty-house deep clean — appliance interiors, cabinet interiors, baseboards, blinds, bathrooms down to the grout. Documented with photos for a security deposit when you need it.',
      },
      {
        title: 'Turns and make-readies',
        body: 'Portfolio work for property managers on a standing scope, so every unit is cleaned to the same checklist and photographed the same way.',
      },
      {
        title: 'Recurring residential',
        body: 'Weekly, biweekly or monthly, same crew, written checklist. Sensible for the houses we already painted and want to stay looking that way.',
      },
      {
        title: 'Window and light-fixture detail',
        body: 'Interior glass, tracks and sills, plus pendant and chandelier cleaning — the add-on nobody thinks about until the afternoon light hits.',
      },
    ],
    process: [
      { title: 'Scope by checklist', body: 'You get the actual room-by-room checklist in advance. No ambiguity about whether inside the oven was included.' },
      { title: 'Top-down', body: 'Ceilings, fans and tops of cabinets first, floors last. Doing it in the other order means doing it twice.' },
      { title: 'Detail pass', body: 'Glass, tracks, hardware, switch plates and vents — the small surfaces that decide whether a house reads as clean.' },
      { title: 'Photo and sign-off', body: 'Photographed on completion. On portfolio and construction work those photos go in the file.' },
    ],
    included: [
      'All supplies, equipment and HEPA vacuums',
      'Written room-by-room checklist before we start',
      'Top-down sequencing with floors last',
      'Completion photos on construction and portfolio work',
      'Trash and debris removed from the property',
    ],
    notIncluded: [
      'Construction debris hauling in volume — that is a dumpster, not a clean',
      'Mold remediation and biohazard cleanup',
      'Carpet and upholstery extraction (subcontracted on request)',
      'Exterior window washing above the second story',
    ],
    faq: [
      {
        q: 'What is post-construction cleaning and why does it cost more than regular cleaning?',
        a: 'Drywall dust is abrasive, electrostatic and settles repeatedly — you cannot get it in one pass. Paint overspray, caulk, adhesive and labels have to come off with blades and solvents rather than a spray bottle. It is a different skill set, different equipment and several times the labor hours of a routine clean, which is why it is priced on its own.',
      },
      {
        q: 'Do you clean after other contractors, not just your own crews?',
        a: 'Yes. A good share of this division is cleaning behind other builders and remodelers. We do not need to have done the construction to clean up after it.',
      },
      {
        q: 'Can you do recurring cleaning for a rental portfolio?',
        a: 'That is the core of the property-manager side. Standing scope, same checklist every unit, photo documentation, net terms, and one invoice per cycle rather than per address.',
      },
      {
        q: 'How is cleaning priced?',
        a: 'Routine cleaning is priced by square footage and frequency. Post-construction, move-out and deep cleans are priced by the hour or by a walked scope, because the condition varies enormously and a square-foot number would be a guess.',
      },
    ],
    metaTitle: 'Post-Construction & Move-Out Cleaning in Monroe, GA',
    metaDesc:
      'Post-construction cleaning, final cleans, move-in/move-out and recurring cleaning in Monroe, Loganville and metro Atlanta. Written checklists, photo documentation.',
    schemaServices: [
      'Post-construction cleaning',
      'Final construction clean',
      'Move-in and move-out cleaning',
      'Rental turn and make-ready cleaning',
      'Recurring house cleaning',
      'Window and fixture detail cleaning',
    ],
  },
];

/** Order the fan deck renders in. Painting is the lead division; CM anchors the trade end. */
export const DECK_ORDER = [
  'painting',
  'drywall',
  'exteriors',
  'pressure-washing',
  'cleaning',
  'construction-management',
] as const;

export const divisionsInDeckOrder = (): Division[] =>
  DECK_ORDER.map((slug) => DIVISIONS.find((d) => d.slug === slug)!).filter(Boolean);

export const getDivision = (slug: string): Division | undefined =>
  DIVISIONS.find((d) => d.slug === slug);
