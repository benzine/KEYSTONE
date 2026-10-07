/** Team member data — ported from the original page's MEMBERS array. */

export interface Member {
  name: string;
  role: string;
  img: string;
  bio: string[];
  cred: string;
  proj: [string, string][];
  sketch: string;
  personal: string;
}

export const MEMBERS: Member[] = [
  {
    name: "Marcus Hale",
    role: "PRINCIPAL ARCHITECT",
    img: "keystone-marcus",
    bio: [
      "Marcus founded Keystone in 2004 with a builder he once argued with over eleven centimeters of glass. The argument became the method. He trained at Cornell, practiced in San Francisco and Copenhagen, and came home to Boulder to build houses slow enough to be right.",
      "His design philosophy is section-first. \u201CThe section is where a building stops performing and becomes honest.\u201D Clients describe review meetings with him as equal parts architecture seminar and confession.",
    ],
    cred: "B.ARCH, CORNELL · RA, COLORADO & CALIFORNIA · 24 YEARS",
    proj: [
      ["Meridian House", "keystone-meridian"],
      ["Solstice Yard", "keystone-solstice"],
    ],
    sketch: "\u201CI draw the section first. The section is where a building becomes honest.\u201D",
    personal: "When not drafting, he is restoring a 1968 Land Rover Defender, slowly, and with the same patience he demands of concrete.",
  },
  {
    name: "Elena V\u00E1squez",
    role: "SENIOR DESIGNER",
    img: "keystone-elena",
    bio: [
      "Elena is the studio\u2019s conscience on daylight. She joined from a Houston practice where her courtyard houses kept outperforming their models, and has spent sixteen years refining a single conviction, that light is the first material and every other decision is furniture for it.",
      "Our window-seats and slot windows are hers, along with most of the moments clients mention first when they describe living in a Keystone house.",
    ],
    cred: "M.ARCH, RICE UNIVERSITY · LEED AP · 16 YEARS",
    proj: [
      ["Travertine Court", "keystone-travertine"],
      ["Fenwick Hollow", "keystone-fenwick"],
    ],
    sketch: "\u201CA window is a framing device. Decide what the room believes is important, then draw that.\u201D",
    personal: "Competitive bread baker. Her sourdough starters are named after completed projects.",
  },
  {
    name: "James Okafor",
    role: "DIR. OF CONSTRUCTION",
    img: "keystone-james",
    bio: [
      "James spent a decade framing other architects\u2019 drawings before deciding he would rather keep the promises than interpret them. He runs our sites with a quality-assurance culture borrowed from aerospace, one that catches the millimeter before the inspector and never lets the schedule make the craft apologize.",
      "He is the reason our punch lists are short and our framers stay for decades.",
    ],
    cred: "BS CONSTRUCTION MGMT, PURDUE · CGC · 22 YEARS",
    proj: [
      ["Cascadia Ridge", "keystone-cascadia"],
      ["Longfield Barn", "keystone-longfield"],
    ],
    sketch: "\u201CA drawing is a promise. My job is keeping it.\u201D",
    personal: "Weekend luthier. Makes violins poorly, but with great conviction.",
  },
  {
    name: "Sofia Lindqvist",
    role: "INTERIOR ARCHITECTURE",
    img: "keystone-sofia",
    bio: [
      "Sofia trained at Konstfack in Stockholm, where she learned that a room is finished at the moment removing one more thing would make it poorer. She plans interiors as architecture, with millwork and daylight choreographed together rather than decorated afterward.",
      "Her famously quiet palettes rely on oak that deepens and linen that softens with the years.",
    ],
    cred: "M.FURNITURE & INTERIOR ARCHITECTURE, KONSTFACK · 14 YEARS",
    proj: [
      ["Travertine Court", "keystone-travertine"],
      ["Meridian House", "keystone-meridian"],
    ],
    sketch: "\u201CA room is finished when removing one more thing would make it poorer.\u201D",
    personal: "Collects mid-century Swedish glass and is slowly, correctly, restoring a 1907 farmhouse.",
  },
  {
    name: "Daniel Reyes",
    role: "STRUCTURAL ENGINEER",
    img: "keystone-daniel",
    bio: [
      "Daniel joined from bridge engineering, which is why our houses read as calm. He resolves forces early, on paper, where changes cost pencils. He co-authored the passive-thermal model that predicted Solstice Yard\u2019s winter performance within a degree and a half.",
      "He is the studio\u2019s translator between the drawing and gravity.",
    ],
    cred: "MS CIVIL ENGINEERING, BERKELEY · SE · 18 YEARS",
    proj: [
      ["Longfield Barn", "keystone-longfield"],
      ["Cascadia Ridge", "keystone-cascadia"],
    ],
    sketch: "\u201CGravity always gets a vote. I just translate its handwriting.\u201D",
    personal: "Boulders on weekends. Builds furniture engineered to hold books and absolutely nothing else.",
  },
  {
    name: "Amara Chen",
    role: "LANDSCAPE ARCHITECT",
    img: "keystone-amara",
    bio: [
      "Amara\u2019s brief is simple to state and hard to honor. The grove was here first. She designs plantings that make the house apologize gracefully to the land, with native grasses on plinths and drainage that becomes a feature rather than a pipe.",
      "Her landscapes are at their best in year seven, which she considers the point.",
    ],
    cred: "MLA, UNIVERSITY OF OREGON · 12 YEARS",
    proj: [
      ["Solstice Yard", "keystone-solstice"],
      ["Meridian House", "keystone-meridian"],
    ],
    sketch: "\u201CThe grove was here first. The house should apologize gracefully.\u201D",
    personal: "Guerrilla gardener of native seed mixes. Keeps bees, who also work in native materials.",
  },
  {
    name: "Theo Brandt",
    role: "PROJECT MANAGER",
    img: "keystone-theo",
    bio: [
      "Theo treats a schedule as a drawing of time and gives it the same care as a section. Clients know him as the person who tells them the truth about weather and lead times, and about which decision can politely wait one more week.",
      "He is also the studio\u2019s resident hand-drawing fundamentalist; the first lines of every project pass through his pencil.",
    ],
    cred: "B.ARCH + MBA, CU DENVER · 11 YEARS",
    proj: [
      ["Fenwick Hollow", "keystone-fenwick"],
      ["Cascadia Ridge", "keystone-cascadia"],
    ],
    sketch: "\u201CA schedule is a drawing of time. It deserves the same care.\u201D",
    personal: "Marathon pacer. His vegetable garden is run off a spreadsheet, and the spreadsheet wins.",
  },
  {
    name: "Nina Petrova",
    role: "MATERIALS RESEARCHER",
    img: "keystone-nina",
    bio: [
      "Nina came to architecture sideways, through a doctorate in materials science at ETH. She keeps a living archive of four hundred samples and reads their aging the way others read books, which is how the studio specifies oak that will look better in year thirty than in the brochure.",
      "Her material stories run throughout this site; the surveyed plate in Section 01 is her field work.",
    ],
    cred: "PHD MATERIALS SCIENCE, ETH Z\u00DCRICH · 9 YEARS",
    proj: [
      ["Solstice Yard", "keystone-solstice"],
      ["Longfield Barn", "keystone-longfield"],
    ],
    sketch: "\u201CEvery material keeps a diary. I read them so the walls can tell the truth.\u201D",
    personal: "Her sample archive is organized by decade of expected patina. Also by mood. The two systems disagree.",
  },
  {
    name: "Owen Fitzgerald",
    role: "MASTER CARPENTER",
    img: "keystone-owen",
    bio: [
      "Owen apprenticed in a lineage of joiners going back three generations and carries twenty-seven years of it in his hands. He built the free-standing house inside Longfield Barn without touching the historic frame, a project he describes as \u201Ca conversation, held at arm\u2019s length, for fourteen months.\u201D",
      "Our millwork standard is his standard, with joints detailed twice, once for the craftsman and once for the century that follows.",
    ],
    cred: "MASTER JOINER, DUBLIN LINEAGE · 31 YEARS",
    proj: [
      ["Longfield Barn", "keystone-longfield"],
      ["Meridian House", "keystone-meridian"],
    ],
    sketch: "\u201CWood remembers the weather it grew in. Cut it like you believe that.\u201D",
    personal: "Whittles spoons during meetings. His 1907 hand plane is named Doris, and Doris outranks him.",
  },
];
