/**
 * The Ledger — company history as masonry.
 *
 * Data + deterministic geometry for the arch timeline (section 02).
 * Every stone outline is generated from a fixed seed so the server and
 * the client render identical shapes. The arch is a true semicircle,
 * 8 jittered voussoirs plus a protruding keystone, springing from two
 * masonry piers. Real vaulting practice drives the choreography, stones
 * are set alternately from each springer, the timber centering carries
 * them until the keystone drops, and the struck centering leaves the
 * thrust line to carry the load.
 */

export interface LedgerEra {
  /** machine years engraved on the stone, e.g. "2004 · 05" */
  engrave: string;
  y0: number;
  y1: number;
  eyebrow: string;
  title: string;
  story: string;
  stat: string;
}

export const LEDGER: LedgerEra[] = [
  {
    engrave: "2004 · 05",
    y0: 2004,
    y1: 2005,
    eyebrow: "VOUSSOIR 01 · 2004-2005",
    title: "The Argument",
    story:
      "An architect and a builder disagree over eleven centimeters of glass. They resolve it by building the wall and the window as one piece, and found the studio that winter.",
    stat: "TWO FOUNDERS · ONE DESK",
  },
  {
    engrave: "2005 · 07",
    y0: 2005,
    y1: 2007,
    eyebrow: "VOUSSOIR 02 · 2005-2007",
    title: "First Walls",
    story:
      "Early commissions on the Front Range teach a lesson that survives every project since. The one who draws and the one who builds sit at the same table, or the house pays for it.",
    stat: "FIRST HOUSES · FRONT RANGE",
  },
  {
    engrave: "2008 · 09",
    y0: 2008,
    y1: 2009,
    eyebrow: "VOUSSOIR 03 · 2008-2009",
    title: "The Long Pause",
    story:
      "The recession empties the drafting boards. The studio spends those years restoring barns and kitchens instead of raising new roofs, and comes out of it leaner, with the argument intact.",
    stat: "4 RESTORATIONS · 0 LAYOFFS",
  },
  {
    engrave: "2010 · 11",
    y0: 2010,
    y1: 2011,
    eyebrow: "VOUSSOIR 04 · 2010-2011",
    title: "The Daylight Decade",
    story:
      "Elena arrives from Houston, where her courtyard houses kept outperforming their own models. Light becomes the studio's first material, and every other decision arranges itself around it.",
    stat: "ELENA · DAYLIGHT AS MATERIAL",
  },
  {
    engrave: "2012 · 13",
    y0: 2012,
    y1: 2013,
    eyebrow: "VOUSSOIR 05 · 2012-2013",
    title: "The Method, Written",
    story:
      "After a project nearly slips on good intentions, the five phases are set down in ink. Discovery through delivery, in order, every time. The sequence still holds.",
    stat: "5 PHASES · 0 SHORTCUTS",
  },
  {
    engrave: "2014 · 15",
    y0: 2014,
    y1: 2015,
    eyebrow: "VOUSSOIR 06 · 2014-2015",
    title: "The Collective Forms",
    story:
      "James keeps the promises and Daniel resolves the forces early, on paper. The practice takes the word Collective into its name and its org chart.",
    stat: "NINE DESKS · ONE TABLE",
  },
  {
    engrave: "2016 · 19",
    y0: 2016,
    y1: 2019,
    eyebrow: "VOUSSOIR 07 · 2016-2019",
    title: "Materials and Models",
    story:
      "Nina's archive of four hundred samples moves in beside the drafting tables, and Daniel's passive-thermal model learns to predict January. The studio commits to houses that can prove what they promise.",
    stat: "400 SAMPLES · 1.5°F",
  },
  {
    engrave: "2020 · 23",
    y0: 2020,
    y1: 2023,
    eyebrow: "VOUSSOIR 08 · 2020-2023",
    title: "Proof",
    story:
      "Solstice Yard holds sixty-eight degrees at midnight in January, and Longfield Barn gains a modern house without touching its historic frame. Meridian certifies Passive House Plus, and the Mies jury shortlists the studio.",
    stat: "MIES SHORTLIST · 2023",
  },
  {
    engrave: "2024 · 26",
    y0: 2024,
    y1: 2026,
    eyebrow: "KEYSTONE · 2024-2026",
    title: "The Present",
    story:
      "Cascadia rises on its plinth and the Pritzker jury writes the studio among the nominees. The argument over the corner window continues, politely, twenty-two years in.",
    stat: "PRITZKER NOMINEE · 2024",
  },
];

/* ------------------------------------------------------------------ */
/* Arch geometry, viewBox 1200 x 620                                   */
/* ------------------------------------------------------------------ */

export const LG = {
  cx: 600,
  cy: 440,
  r0: 212,
  r1: 270,
  vw: 19.5,
} as const;

/** voussoir center angles in setting order, springers first */
export const LG_ORDER = [
  -80.25, 80.25, -60.75, 60.75, -41.25, 41.25, -21.75, 21.75,
];

function prng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const P = (r: number, aDeg: number): [number, number] => {
  const a = (aDeg * Math.PI) / 180;
  return [
    +(LG.cx + r * Math.sin(a)).toFixed(1),
    +(LG.cy - r * Math.cos(a)).toFixed(1),
  ];
};

export interface StoneGeo {
  d: string;
  centroid: [number, number];
  angle: number;
  /** extrados edge points, springing side toward crown side */
  out: [number, number][];
  /** intrados edge points, crown side back toward springing side */
  inn: [number, number][];
}

export function voussoirGeo(i: number): StoneGeo {
  const c = LG_ORDER[i];
  const half = LG.vw / 2;
  const a0 = c - half;
  const a1 = c + half;
  const rand = prng(4100 + i * 97);
  const j = () => (rand() - 0.5) * 7;
  const out = [0, 1, 2, 3].map((k) =>
    P(LG.r1 + 1.5 + j(), a0 + (k * LG.vw) / 3),
  );
  const inn = [0, 1, 2, 3].map((k) =>
    P(LG.r0 + j(), a1 - (k * LG.vw) / 3),
  );
  const d =
    "M " +
    out.map((p) => p.join(" ")).join(" L ") +
    " L " +
    inn.map((p) => p.join(" ")).join(" L ") +
    " Z";
  const rm = (LG.r0 + LG.r1) / 2 + (rand() - 0.5) * 4;
  return { d, centroid: P(rm, c), angle: c, out, inn };
}

export function keystoneGeo(): StoneGeo {
  const rand = prng(777);
  const j = () => (rand() - 0.5) * 5;
  const oL = P(LG.r1 + 14 + j(), -13);
  const oR = P(LG.r1 + 14 + j(), 13);
  const iR = P(LG.r0 - 4 + j(), 11);
  const iL = P(LG.r0 - 4 + j(), -11);
  const d =
    "M " + oL.join(" ") + " L " + oR.join(" ") +
    " L " + iR.join(" ") + " L " + iL.join(" ") + " Z";
  return {
    d,
    centroid: P((LG.r0 + LG.r1) / 2 + 5, 0),
    angle: 0,
    out: [oL, oR],
    inn: [iL, iR],
  };
}

/** pier masonry blocks below the springing line */
export interface PierBlock {
  x: number;
  y: number;
  w: number;
  h: number;
  /** per-block tonal drift, negative darkens, positive lightens */
  tint: number;
}
export function pierBlocks(side: -1 | 1): PierBlock[] {
  const rand = prng(side < 0 ? 2101 : 8103);
  const x0 = side < 0 ? LG.cx - LG.r1 + 3 : LG.cx + LG.r0 - 3;
  const w = LG.r1 - LG.r0 - 6;
  const blocks: PierBlock[] = [];
  for (let c = 0; c < 3; c++) {
    const y = 442 + c * 44;
    const h = 42 - Math.floor(rand() * 3);
    const split = 0.35 + rand() * 0.3;
    blocks.push({ x: x0, y, w: +(w * split).toFixed(1), h, tint: +((rand() - 0.5) * 0.1).toFixed(3) });
    blocks.push({ x: +(x0 + w * split + 1.5).toFixed(1), y, w: +(w * (1 - split) - 1.5).toFixed(1), h, tint: +((rand() - 0.5) * 0.1).toFixed(3) });
  }
  blocks.push({ x: x0 - 15, y: 574, w: w + 30, h: 26, tint: +((rand() - 0.5) * 0.06).toFixed(3) });
  return blocks;
}

/** ground hatch ticks under the datum line */
export function groundHatches(): [number, number][] {
  const rand = prng(1204);
  const out: [number, number][] = [];
  for (let x = 214; x <= 986; x += 24 + Math.floor(rand() * 3)) {
    out.push([x, 604]);
  }
  return out;
}

/** the gold thrust line along the arc's centerline */
export const THRUST_D =
  "M " + P(241, -90).join(" ") + " A 241 241 0 0 1 " + P(241, 90).join(" ");

/** the timber centering arc just below the intrados */
export const CENTER_D =
  "M " + P(204, -90).join(" ") + " A 204 204 0 0 1 " + P(204, 90).join(" ");

/* ------------------------------------------------------------------ */
/* Stone material, deterministic rendering detail                      */
/*                                                                     */
/* The drafting apparatus stays ink. The masonry reads as cut          */
/* limestone: light falls from the top left sitewide, so each          */
/* voussoir's shading resolves from its own radial angle to that       */
/* light. Every value below is derived from seeded PRNG arithmetic     */
/* so the server and the client render identical markup.               */
/* ------------------------------------------------------------------ */

/** unit vector toward the light, upper left */
const LTO: [number, number] = [-0.42, -0.91];

/** how squarely a stone's outward face meets the light, -1..1 */
function litAt(cDeg: number): number {
  const a = (cDeg * Math.PI) / 180;
  return 0.91 * Math.cos(a) - 0.42 * Math.sin(a);
}

type RGB = [number, number, number];
const hx = (h: string): RGB => [
  parseInt(h.slice(1, 3), 16),
  parseInt(h.slice(3, 5), 16),
  parseInt(h.slice(5, 7), 16),
];
const mixc = (a: RGB, b: RGB, t: number): RGB => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];
const scalec = (c: RGB, f: number): RGB => [c[0] * f, c[1] * f, c[2] * f];
const rgbs = (c: RGB): string =>
  "#" +
  c
    .map((v) =>
      Math.max(0, Math.min(255, Math.round(v)))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("");

const PAL = {
  /* light theme, warm cream to cool occlusion */
  hiA: hx("#F4EBD4"),
  hiB: hx("#D7CFC0"),
  loA: hx("#8E8878"),
  loB: hx("#B3AC9E"),
  /* dark theme, charcoal with bronze light */
  dHiA: hx("#4E4634"),
  dHiB: hx("#33302A"),
  dLoA: hx("#1C1C1E"),
  dLoB: hx("#242322"),
  /* keystone warmth */
  key: hx("#E6D6AE"),
  keyD: hx("#6A5A39"),
} as const;

const avgPt = (ps: [number, number][]): [number, number] => [
  +(ps.reduce((s, p) => s + p[0], 0) / ps.length).toFixed(1),
  +(ps.reduce((s, p) => s + p[1], 0) / ps.length).toFixed(1),
];

export interface StoneDetail {
  /** gradient axis, extrados biased toward the light down to intrados */
  g1: [number, number];
  g2: [number, number];
  /** light theme stops */
  hi: string;
  mid: string;
  lo: string;
  /** dark theme stops */
  hiD: string;
  midD: string;
  loD: string;
  /** extrados light catch strength, CSS opacity */
  ao: string;
  /** faint bedding lines along the stone's own radial axis */
  bed: string;
  /** ambient occlusion slivers on both radial joints */
  joint: string;
  arrisOut: string;
  arrisIn: string;
  /** mineral mottling blobs */
  mottle: { cx: number; cy: number; rx: number; ry: number; a: number }[];
}

export function stoneDetail(i: number): StoneDetail {
  const c = LG_ORDER[i];
  const geo = voussoirGeo(i);
  const rand = prng(9110 + i * 173);
  const t = Math.max(0, Math.min(1, (litAt(c) + 0.3) / 1.3));
  const drift = 1 + (rand() - 0.5) * 0.16;
  const hi = mixc(mixc(PAL.hiB, PAL.hiA, t), PAL.key, 0.14 * t);
  const lo = mixc(PAL.loA, PAL.loB, t * 0.9);
  const mid = mixc(lo, hi, 0.52);
  const hiD = mixc(PAL.dHiB, PAL.dHiA, t);
  const loD = mixc(PAL.dLoA, PAL.dLoB, t * 0.6);
  const midD = mixc(loD, hiD, 0.52);

  const om = avgPt(geo.out);
  const im = avgPt(geo.inn);
  const g1: [number, number] = [
    +(om[0] + LTO[0] * 16).toFixed(1),
    +(om[1] + LTO[1] * 16).toFixed(1),
  ];

  /* strata follow the cut, two faint beds per stone */
  const bed = [-0.22, 0.3]
    .map((f) => {
      const a = c + f * LG.vw + (rand() - 0.5) * 2.4;
      const p1 = P(LG.r1 - 2.5, a + (rand() - 0.5) * 2);
      const pm = P((LG.r0 + LG.r1) / 2, a + (rand() - 0.5) * 3.5);
      const p2 = P(LG.r0 + 2.5, a - (rand() - 0.5) * 2);
      return `M ${p1[0]} ${p1[1]} Q ${pm[0]} ${pm[1]} ${p2[0]} ${p2[1]}`;
    })
    .join(" ");

  const mottle = Array.from(
    { length: 2 + (rand() < 0.75 ? 1 : 0) },
    () => {
      const rm = LG.r0 + 12 + rand() * (LG.r1 - LG.r0 - 24);
      const a = c + (rand() - 0.5) * 12;
      const p = P(rm, a);
      return {
        cx: p[0],
        cy: p[1],
        rx: +(9 + rand() * 13).toFixed(1),
        ry: +(5 + rand() * 7).toFixed(1),
        a: +(c + (rand() - 0.5) * 10).toFixed(1),
      };
    },
  );

  const arrisOut = "M " + geo.out.map((p) => p.join(" ")).join(" L ");
  const arrisIn = "M " + geo.inn.map((p) => p.join(" ")).join(" L ");
  const joint =
    `M ${geo.out[0].join(" ")} L ${geo.inn[3].join(" ")} ` +
    `M ${geo.out[3].join(" ")} L ${geo.inn[0].join(" ")}`;

  return {
    g1,
    g2: im,
    hi: rgbs(scalec(hi, drift)),
    mid: rgbs(scalec(mid, drift)),
    lo: rgbs(scalec(lo, drift)),
    hiD: rgbs(hiD),
    midD: rgbs(midD),
    loD: rgbs(loD),
    ao: (0.55 + 0.4 * t).toFixed(2),
    bed,
    mottle,
    arrisOut,
    arrisIn,
    joint,
  };
}

export function keystoneDetail(): StoneDetail {
  const geo = keystoneGeo();
  const rand = prng(7771);
  const drift = 1 + (rand() - 0.5) * 0.08;
  const hi = mixc(PAL.hiA, PAL.key, 0.4);
  const lo = mixc(PAL.loB, PAL.loA, 0.5);
  const mid = mixc(lo, hi, 0.5);
  const hiD = mixc(PAL.dHiA, PAL.keyD, 0.38);
  const loD = mixc(PAL.dLoB, PAL.dLoA, 0.5);
  const midD = mixc(loD, hiD, 0.5);

  const om = avgPt(geo.out);
  const im = avgPt(geo.inn);
  const g1: [number, number] = [
    +(om[0] + LTO[0] * 14).toFixed(1),
    +(om[1] + LTO[1] * 14).toFixed(1),
  ];

  /* beds run with the stone, clear of the engraved mark */
  const bed = [-1, 1]
    .map((s) => {
      const x0 = 600 + s * (12.5 + rand() * 4);
      const xm = 600 + s * (13 + rand() * 4);
      const x1 = 600 + s * (9 + rand() * 3);
      return `M ${x0.toFixed(1)} 167 Q ${xm.toFixed(1)} 201 ${x1.toFixed(1)} 233`;
    })
    .join(" ");

  const mottle = Array.from({ length: 2 }, () => ({
    cx: +(600 + (rand() - 0.5) * 46).toFixed(1),
    cy: +(192 + rand() * 34).toFixed(1),
    rx: +(9 + rand() * 9).toFixed(1),
    ry: +(5.5 + rand() * 5).toFixed(1),
    a: +((rand() - 0.5) * 16).toFixed(1),
  }));

  const arrisOut = `M ${geo.out[0].join(" ")} L ${geo.out[1].join(" ")}`;
  const arrisIn = `M ${geo.inn[0].join(" ")} L ${geo.inn[1].join(" ")}`;
  const joint =
    `M ${geo.out[0].join(" ")} L ${geo.inn[0].join(" ")} ` +
    `M ${geo.out[1].join(" ")} L ${geo.inn[1].join(" ")}`;

  return {
    g1,
    g2: im,
    hi: rgbs(scalec(hi, drift)),
    mid: rgbs(scalec(mid, drift)),
    lo: rgbs(scalec(lo, drift)),
    hiD: rgbs(hiD),
    midD: rgbs(midD),
    loD: rgbs(loD),
    ao: "0.8",
    bed,
    mottle,
    arrisOut,
    arrisIn,
    joint,
  };
}
