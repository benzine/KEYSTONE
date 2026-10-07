/** Case study project data — ported from the original page's PROJECTS object. */

export interface ProjectMat {
  name: string;
  spec: string;
  color: string;
}

export interface Project {
  id: string;
  key: string;
  name: string;
  sheet: string;
  loc: string;
  style: string;
  size: string;
  dur: string;
  year: string;
  brief: string;
  challenge: string;
  solution: string;
  innovation: string;
  g: string[];
  mats: ProjectMat[];
  quote: string;
  client: string;
}

export const PROJECTS: Record<string, Project> = {
  meridian: {
    id: "keystone-meridian",
    key: "meridian",
    name: "Meridian House",
    sheet: "SHT A-101",
    loc: "BOULDER, COLORADO",
    style: "CONTEMPORARY HILLSIDE · PASSIVE HOUSE PLUS",
    size: "8,400",
    dur: "26",
    year: "2023",
    brief: "A house that lets the hillside keep its opinion.",
    challenge:
      "The county had already marked the aspen grove as significant. The family of five wanted Front Range views from their west-facing slope without surrendering their privacy or a single tree.",
    solution:
      "We cut the section into the slope in three slow steps, letting board-formed concrete retaining walls become the architecture itself. The glazed east face takes the morning; the west closes to a stone spine with slot windows calibrated to the afternoon.",
    innovation:
      "The overhang geometry was solved per-window against fifty years of solar data, full winter sun on the thermal-mass floors and zero summer penetration at noon. The blower-door result certified the house Passive House Plus.",
    g: [
      "THE EAST GLAZING AT SIX-FORTY A.M.",
      "CONCRETE SPINE, BOARD-FORMED",
      "KITCHEN · OAK ON TRAVERTINE",
      "THE SLOT WINDOWS, WEST",
      "ASPEN GROVE, UNTOUCHED",
    ],
    mats: [
      { name: "Board-Formed Concrete", spec: "LOCAL POUR · SEALED MATTE", color: "#A9A5A0" },
      { name: "Quartersawn White Oak", spec: "OHIO VALLEY · HARDWAX OIL", color: "#A67B5B" },
      { name: "Italian Travertine", spec: "TIVOLI · HONED", color: "#D4C5B0" },
      { name: "Blackened Steel", spec: "ARCHITECTURAL · WAXED", color: "#3A3733" },
      { name: "Unsealed Bronze", spec: "LIVING PATINA", color: "#8C7853" },
    ],
    quote:
      "\u201CThey argued about our window for three weeks. Then they built it exactly right. Our daughter learned to walk holding that concrete wall.\u201D",
    client: "THE HALLORAN FAMILY",
  },
  travertine: {
    id: "keystone-travertine",
    key: "travertine",
    name: "Travertine Court",
    sheet: "SHT A-102",
    loc: "SCOTTSDALE, ARIZONA",
    style: "DESERT CONTEMPORARY · LEED GOLD",
    size: "6,100",
    dur: "19",
    year: "2022",
    brief: "A house that turns its back to the sun and its face to the shade.",
    challenge:
      "A desert lot with a view the clients loved and a sun they couldn\u2019t survive. They asked for glass, and for a house that would stay cold in August.",
    solution:
      "We folded the plan around a single north-facing court, pulling every principal room\u2019s light off the courtyard\u2019s shaded wall. The street face is a quiet travertine wall; the house only happens once you\u2019re inside.",
    innovation:
      "La sombra is a porch whose depth was computed against the summer solstice sun, full shade at noon in July and full sun in January. The court\u2019s micro-climate runs twelve degrees below the desert.",
    g: [
      "THE COURT AT DUSK",
      "LA SOMBRA · COMPUTED SHADE",
      "TRAVERTINE WALL, STREET FACE",
      "BRONZE SCREEN DETAIL",
      "MESQUITE AND GRAVEL",
    ],
    mats: [
      { name: "Italian Travertine", spec: "TIVOLI · HONED", color: "#D4C5B0" },
      { name: "Rammed Earth", spec: "SONORAN · STABILIZED", color: "#B9996E" },
      { name: "Bronze Screens", spec: "CAST, PERFORATED", color: "#8C7853" },
      { name: "Mesquite", spec: "REGIONAL · OILED", color: "#7A5236" },
      { name: "Lime Plaster", spec: "BREATHABLE WHITE", color: "#EAE5D8" },
    ],
    quote:
      "\u201CWe sit outside in the court in August. Our neighbors think we own a different zip code.\u201D",
    client: "R. & C. DELGADO",
  },
  longfield: {
    id: "keystone-longfield",
    key: "longfield",
    name: "Longfield Barn",
    sheet: "SHT A-103",
    loc: "HUDSON VALLEY, NEW YORK",
    style: "ADAPTIVE REUSE · TIMBER FRAME",
    size: "4,750",
    dur: "14",
    year: "2021",
    brief: "A 1907 dairy barn that gained a house without losing a beam.",
    challenge:
      "The barn was structurally sound and romantically wrecked, with every sill hand-joined and exactly one hundred and fourteen years tired. The clients wanted modern living inside without touching the frame.",
    solution:
      "We built a free-standing house of steel and glass inside the barn, held clear of the historic frame on its own foundation. The two structures converse but never touch.",
    innovation:
      "The original hay-drop became a ridge skylight of structural glass. Daylight now falls exactly where the hay once did, and the barn\u2019s ventilation path still works.",
    g: [
      "THE FRAME, RE-CLEAVED",
      "HOUSE WITHIN A HOUSE",
      "HAY-DROP SKYLIGHT, RIDGE",
      "KITCHEN · OAK ON STEEL",
      "SILLS, 1907",
    ],
    mats: [
      { name: "Reclaimed Chestnut", spec: "BARN DEMOLITION · 1907", color: "#8A6A48" },
      { name: "Quartersawn White Oak", spec: "OHIO VALLEY · HARDWAX", color: "#A67B5B" },
      { name: "Structural Glass", spec: "LAMINATED, LOW-IRON", color: "#DCE3E3" },
      { name: "Blackened Steel", spec: "ARCHITECTURAL · WAXED", color: "#3A3733" },
      { name: "Belgian Linen", spec: "FLANDERS FLAX · WASHED", color: "#E8E2D4" },
    ],
    quote:
      "\u201CWe live inside a building that remembers being a barn. On windy nights it still creaks in the old rhythm.\u201D",
    client: "THE WERNER FAMILY",
  },
  cascadia: {
    id: "keystone-cascadia",
    key: "cascadia",
    name: "Cascadia Ridge",
    sheet: "SHT A-104",
    loc: "PORTLAND, OREGON",
    style: "NET-ZERO RANCH · SOLAR ROOF",
    size: "7,200",
    dur: "22",
    year: "2024",
    brief: "A ridge-line home that earns its view and pays for its own power.",
    challenge:
      "An exposed ridge with a nine-month building season, a view that demanded glass, and clients who refused an energy bill.",
    solution:
      "We massed the house as a single leaning bar that steps with the ridge, putting glass where the land falls away and solid wall where the weather comes from.",
    innovation:
      "The roof is the array, a standing-seam solar roof with no penetrations, feeding a battery wall. Air-tightness tested at 0.4 ACH50. The utility meter has run backward since month three.",
    g: [
      "THE LEANING BAR, FROM BELOW",
      "SEAM-ROOF ARRAY",
      "GREAT ROOM · THE VIEW WALL",
      "BATTERY WALL, UTILITY",
      "FOG ROLLING IN, USUAL",
    ],
    mats: [
      { name: "Standing-Seam Steel", spec: "SOLAR-INTEGRATED", color: "#6E7378" },
      { name: "Douglas Fir", spec: "REGIONAL · FSC", color: "#A9855C" },
      { name: "Polished Concrete", spec: "LOCAL POUR · SEALED", color: "#B7B3AC" },
      { name: "Unsealed Bronze", spec: "LIVING PATINA", color: "#8C7853" },
      { name: "Sheep-Wool Insulation", spec: "WASHINGTON · BATTED", color: "#E5DFCF" },
    ],
    quote:
      "\u201COur January bill was a credit. Our architect sends it to prospects as a hero image.\u201D",
    client: "M. OKAFOR-ADEYEMI",
  },
  fenwick: {
    id: "keystone-fenwick",
    key: "fenwick",
    name: "Fenwick Hollow",
    sheet: "SHT A-105",
    loc: "CHARLESTON, SOUTH CAROLINA",
    style: "LOW-COUNTRY MODERN · RAISED",
    size: "5,300",
    dur: "17",
    year: "2023",
    brief: "A low-country house raised twelve feet to meet the river light.",
    challenge:
      "The site sat in a flood zone with a view of the Ashley River and low-country light the clients described as honey all day. Building high enough to insure meant risking a house on stilts that felt like a house on stilts.",
    solution:
      "We raised the house on a masonry plinth planted with native grasses, then wrapped the living floor in a deep shade porch that reads as the house\u2019s real façade. The under-croft became a cool, shaded outdoor room.",
    innovation:
      "Storm shutters of bronze mesh swing on heavy hinges to become the summer shading system, rated for 140 mph and tuned for four o\u2019clock glare.",
    g: [
      "THE PLINTH AND GRASSES",
      "SHADE PORCH · THE REAL FAÇADE",
      "RIVER LIGHT, 4 P.M.",
      "BRONZE MESH SHUTTERS",
      "THE UNDER-CROFT",
    ],
    mats: [
      { name: "Tabby Concrete", spec: "OYSTER SHELL · LOCAL", color: "#C4BCA8" },
      { name: "Reclaimed Cypress", spec: "RIVER SINKER · SAWN", color: "#9A7B52" },
      { name: "Bronze Mesh", spec: "WOVEN, FRAMED", color: "#8C7853" },
      { name: "Lime Stucco", spec: "THREE-COAT · WHITE", color: "#EDE8DA" },
      { name: "Ipe Decking", spec: "FSC CERTIFIED", color: "#6E4A2E" },
    ],
    quote:
      "\u201CThe hurricane came, the shutters closed, the house didn\u2019t notice. Then we opened them to the river again.\u201D",
    client: "THE BEAUFORT FAMILY",
  },
  solstice: {
    id: "keystone-solstice",
    key: "solstice",
    name: "Solstice Yard",
    sheet: "SHT A-106",
    loc: "SANTA FE, NEW MEXICO",
    style: "PASSIVE ADOBE · THERMAL MASS",
    size: "3,900",
    dur: "12",
    year: "2020",
    brief: "Adobe walls thick enough to hold the day\u2019s heat past midnight.",
    challenge:
      "A high-desert site with a forty-degree daily swing. The clients wanted a house that heats itself through the night and cools itself through the day, with no compressor and no drama.",
    solution:
      "We massed the house around two courtyards with the windows sized like apertures, every square foot of south glass computed against the mass behind it. The walls are twenty-four inches of stabilized earth.",
    innovation:
      "A thermal model predicted indoor temperatures for the first year of occupancy, and the loggers agreed within 1.5°F. At midnight in January the house held 68°F with the fire unlit.",
    g: [
      "SOUTH APERTURES, SIZED",
      "THE EARTH WALLS, 24 IN.",
      "COURTYARD ONE, MORNING",
      "VIGAS AND LATILLAS",
      "SNOW ON ADOBE",
    ],
    mats: [
      { name: "Stabilized Adobe", spec: "ON-SITE EARTH · 24 IN.", color: "#C0A274" },
      { name: "Saltillo Tile", spec: "HAND-FIRED · MEXICO", color: "#B4744A" },
      { name: "Cedar Vigas", spec: "REGIONAL · HEWN", color: "#8A6A48" },
      { name: "Chimay\u00F3 Wool", spec: "HAND-WOVEN", color: "#A65B4B" },
      { name: "Unsealed Bronze", spec: "LIVING PATINA", color: "#8C7853" },
    ],
    quote:
      "\u201CWe watched the model say the house would hold its heat. We didn\u2019t believe it until the first January.\u201D",
    client: "E. & R. MONTOYA",
  },
};

export const CASE_ORDER = [
  "meridian",
  "travertine",
  "longfield",
  "cascadia",
  "fenwick",
  "solstice",
] as const;
