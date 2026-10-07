/** Knowledge-center phase data — ported from the original page's PHASES array. */

export interface Phase {
  name: string;
  quote: string;
  dur: string;
  what: string;
  del: [string, string][];
  role: string;
  dec: string[];
  note: string;
  next: string;
}

export const PHASES: Phase[] = [
  {
    name: "DISCOVERY",
    quote: "We listen first. The land, and the life you intend for it.",
    dur: "4-6 WEEKS",
    what: "We walk the land with you at two or three different hours of the day, in weather you would actually live in. We chart the sun\u2019s fall and the water\u2019s path, and we defer to the neighbors\u2019 trees. Then we sit for long-form interviews about how you actually cook, argue, rest, and gather, rather than how a brochure says you should.",
    del: [
      ["Site + solar analysis", "Solar path, wind, slope, drainage, and view corridors, mapped before anything is drawn."],
      ["Client interviews", "Two structured sessions and one over a long dinner. The program comes from your life."],
      ["Programming document", "A written brief covering every room and every ritual. Your house in words first."],
      ["Budget frame", "An honest first cost model so the design begins inside the truth."],
    ],
    role: "Walk the site with us and talk honestly about budget. Then tell us the moments the house must hold.",
    dec: ["Which rooms must catch the morning", "Where you will sit at dusk", "What the house must never block", "How much house is enough house"],
    note: "\u201CThe land has already decided half the plan. Our job in Discovery is to be quiet long enough to hear it.\u201D · Marcus Hale",
    next: "NEXT · PHASE 02 DESIGN · LINES DRAWN WITH INTENTION →",
  },
  {
    name: "DESIGN",
    quote: "Lines drawn with intention. Every millimeter considered.",
    dur: "10-14 WEEKS",
    what: "Schematic design moves from bubble diagrams to massing studies you can hold. We model the house in three dimensions against the real sun, then test the section, the cut that tells the truth about light and structure. Material palettes arrive as physical boards, oak you can smell and stone cold to the touch.",
    del: [
      ["Schematic designs", "Plans and sections at 1:100, iterated with you in the room."],
      ["3D massing studies", "The house tested against hour-by-hour sun across all four seasons."],
      ["Material palettes", "Physical sample boards showing finish and aging direction for every surface."],
      ["Three presentations", "Structured decision meetings, each one narrower and more certain than the last."],
    ],
    role: "Review schematics, attend three presentations, choose between real options, and give feedback within a week of each meeting.",
    dec: ["The overall massing and roofline", "Primary material direction", "Window strategy, which views earn glass", "Open-versus-defined rooms"],
    note: "\u201CA drawing is a question. We keep drawing until the house stops arguing back.\u201D · Elena V\u00E1squez",
    next: "NEXT · PHASE 03 DOCUMENTATION · PRECISION IN EVERY DETAIL →",
  },
  {
    name: "DOCUMENTATION",
    quote: "Precision in every detail. The blueprint for the dream.",
    dur: "6-10 WEEKS",
    what: "Every millimeter agreed in Design becomes a written instruction, from full construction drawings to specifications that name materials by quarry and finish, with engineering coordinated so structure and ducts never quarrel on site. We assemble the permit package and shepherd it through the jurisdiction ourselves.",
    del: [
      ["Construction documents", "Drawings complete enough that two different builders would build the same house."],
      ["Specifications", "Materials named to source, grade, finish, and acceptable aging."],
      ["Permit package", "Assembled and defended by us, from submission to approval. You never deal with the counter."],
      ["Engineering coordination", "Structure and services resolved on paper, where changes cost pencils rather than beams."],
    ],
    role: "Final material selections on the palettes plus sign-off on the detail set. One review of the specification book after that.",
    dec: ["Final finishes and hardware", "Lighting layer, ambient and task", "Fixture and appliance schedule", "Allowance reconciliation"],
    note: "\u201CDocumentation is where the money is protected. A detail drawn twice on paper is a beam cut once on site.\u201D · Marcus Hale",
    next: "NEXT · PHASE 04 CONSTRUCTION · BUILT WITH HANDS →",
  },
  {
    name: "CONSTRUCTION",
    quote: "Built with hands, guided by vision.",
    dur: "10-18 MONTHS",
    what: "Our own crews and a short list of master trades mobilize. The site is photographed and logged weekly; you walk it at every phase boundary. Quality assurance runs ahead of inspection. We catch the millimeter before the building department asks about it. Selections with long lead times are tracked on a decision calendar you can see.",
    del: [
      ["Weekly progress updates", "Photographs and a written log each week, plus a straight answer about weather and schedule."],
      ["Quality assurance", "Our own inspections at every phase boundary, before the official ones."],
      ["Client walkthroughs", "Structured site walks at foundation, framing, drywall, and pre-finish."],
      ["Selection tracking", "Every tile and fixture on a visible deadline calendar."],
    ],
    role: "Walk the site at milestones and make remaining selections on schedule. Attend the framing walkthrough too. It is the last cheap moment to move a wall.",
    dec: ["Finish and fixture selections", "Cabinetry final review", "Landscape installation window", "Punch-list tolerance for the wood"],
    note: "\u201CThe clients who walk the framing feel the house become theirs before the drywall closes it.\u201D · James Okafor",
    next: "NEXT · PHASE 05 DELIVERY · KEYS IN HAND →",
  },
  {
    name: "DELIVERY",
    quote: "Keys in hand. A home ready for life.",
    dur: "2-4 WEEKS + FIRST MONTH",
    what: "The pre-delivery walkthrough is done with a roll of blue tape and two hours of honesty. Every item found goes on the punch list with an owner and a date. You receive the owner\u2019s manual with as-built drawings and warranty documents, plus a maintenance calendar for every material we specified, written for humans. We return at thirty days and again at the first anniversary.",
    del: [
      ["Pre-delivery walkthrough", "The blue-tape audit, performed together, before you take possession."],
      ["Punch list", "Every item owned and dated, closed before move-in."],
      ["Owner\u2019s manual", "As-builts and warranties, plus a care calendar for oak, stone, bronze, and linen."],
      ["Move-in coordination", "Movers and utilities arranged, and the first month of small questions handled."],
      ["30-day + 1-year return", "We come back, twice, and make it right."],
    ],
    role: "Walk the house with blue tape in hand and keep the care calendar somewhere findable. Then live in it.",
    dec: ["Move-in date", "Which plants move in first", "The first dinner to cook in it"],
    note: "\u201CA home is delivered ready to begin recording your years.\u201D · Marcus Hale",
    next: "JOURNEY COMPLETE · BEGIN THE CONVERSATION →",
  },
];
