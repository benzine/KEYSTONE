"use client";

/**
 * Tools — Section 07 · THE INSTRUMENTS.
 * React port of the original script-12: the instrument dial (tick ring,
 * drag-to-point needle, label/tab/pos switching with cross-fade panels),
 * the Budget Compass, the Palette Curator, the Sun Path Compass and the
 * Construction Chronicle. Data tables and math are ported verbatim.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useKc } from "./KcProvider";
import { clamp, downloadText, RAD } from "@/lib/keystone/kc-core";

gsap.registerPlugin(ScrollTrigger);

/* ===================== data tables (ported from script-12) ===================== */

const NAMES = ["BUDGET COMPASS", "PALETTE CURATOR", "SUN PATH COMPASS", "CONSTRUCTION CHRONICLE"];

const BC_TYPES = ["CUSTOM HOME", "MAJOR RENOVATION", "ADDITION", "INTERIOR ARCHITECTURE"];
const BC_TYPEB = [340, 285, 305, 185];
const BC_FINN = ["STANDARD", "PREMIUM", "LUXURY", "BESPOKE"];
const BC_FINM = [1, 1.22, 1.48, 1.85];
const BC_SITEN = ["FLAT / ACCESSIBLE", "SLOPED / RURAL", "STEEP / REMOTE"];
const BC_SITEM = [1, 1.08, 1.16];
const BC_SUSL = ["CODE MINIMUM", "ABOVE CODE", "HIGH PERFORMANCE", "NEAR PASSIVE", "NET-ZERO READY"];

interface BcSlice {
  label: string;
  pct: number;
  color: string;
}
const BC_SLICES: BcSlice[] = [
  { label: "SITE WORK", pct: 12, color: "#7BA7BC" },
  { label: "FOUNDATION", pct: 14, color: "#8C7853" },
  { label: "FRAMING", pct: 18, color: "#A67B5B" },
  { label: "SYSTEMS", pct: 15, color: "#B5651D" },
  { label: "FINISHES", pct: 28, color: "#C9A962" },
  { label: "FEES & CONT.", pct: 13, color: "#6B7F5A" },
];
const DONUT_C = 2 * Math.PI * 64;

interface PcRoom {
  n: string;
  /** per-category quantity multipliers: [countertops, flooring, cabinetry, hardware] */
  a: [number, number, number, number];
}
const PC_ROOMS: PcRoom[] = [
  { n: "KITCHEN", a: [55, 280, 38, 24] },
  { n: "MASTER BATH", a: [18, 110, 16, 18] },
  { n: "LIVING ROOM", a: [0, 420, 60, 20] },
  { n: "FLOORING ALL", a: [0, 3200, 0, 0] },
];
const TIERN = ["BUDGET", "STANDARD", "PREMIUM", "LUXURY"];

interface PcOpt {
  n: string;
  o: string;
  t: 0 | 1 | 2 | 3;
  cost: number;
  sw: string;
  f: string;
}
interface PcCat {
  n: string;
  opts: PcOpt[];
}
const PC_CATS: PcCat[] = [
  {
    n: "COUNTERTOPS",
    opts: [
      { n: "BUTCHER BLOCK", o: "MAPLE · LOCAL", t: 0, cost: 38, sw: "linear-gradient(135deg,#D8B48A,#C89A6B)", f: "butcher block counters" },
      { n: "QUARTZ", o: "ENGINEERED STONE", t: 1, cost: 78, sw: "linear-gradient(135deg,#E2DFD8,#D8D5CE)", f: "quiet quartz counters" },
      { n: "SOAPSTONE", o: "VERMONT QUARRIES", t: 2, cost: 124, sw: "linear-gradient(135deg,#666664,#545452)", f: "soapstone counters that hold heat" },
      { n: "CALACATTA MARBLE", o: "CARRARA · ITALY", t: 3, cost: 215, sw: "linear-gradient(135deg,#F2EEE7,#DDE2DC)", f: "veined marble counters" },
    ],
  },
  {
    n: "FLOORING",
    opts: [
      { n: "ENGINEERED OAK", o: "3-PLY · PREFINISHED", t: 0, cost: 11, sw: "linear-gradient(135deg,#C29872,#B08A62)", f: "engineered oak underfoot" },
      { n: "QUARTERSAWN OAK", o: "OHIO VALLEY", t: 1, cost: 18, sw: "linear-gradient(135deg,#B58761,#A67B5B)", f: "quartersawn oak floors" },
      { n: "TRAVERTINE", o: "TIVOLI · HONED", t: 2, cost: 27, sw: "linear-gradient(135deg,#DFD2BF,#D4C5B0)", f: "honed travertine floors" },
      { n: "RECLAIMED CHESTNUT", o: "BARN DEMOLITION", t: 3, cost: 36, sw: "linear-gradient(135deg,#9A7550,#8A6A48)", f: "reclaimed chestnut floors" },
    ],
  },
  {
    n: "CABINETRY",
    opts: [
      { n: "PAINTED MDF", o: "SHAKER · SATIN", t: 0, cost: 90, sw: "linear-gradient(135deg,#F0EBE0,#E8E2D4)", f: "painted shaker cabinetry" },
      { n: "FLAT-CUT VENEER", o: "WHITE OAK FACE", t: 1, cost: 150, sw: "linear-gradient(135deg,#C4A177,#B9996E)", f: "flat-cut oak veneer cabinets" },
      { n: "QUARTERSAWN OAK", o: "SOLID FRAME", t: 2, cost: 240, sw: "linear-gradient(135deg,#B08460,#A67B5B)", f: "solid quartersawn casework" },
      { n: "BLACK WALNUT", o: "SOLID · OILED", t: 3, cost: 360, sw: "linear-gradient(135deg,#6E503A,#5E4632)", f: "oiled walnut casework" },
    ],
  },
  {
    n: "HARDWARE",
    opts: [
      { n: "SATIN NICKEL", o: "PLATED", t: 0, cost: 9, sw: "linear-gradient(135deg,#D6D6D3,#C9C9C6)", f: "nickel at the hand" },
      { n: "MATTE BLACK", o: "POWDERCOAT", t: 1, cost: 14, sw: "linear-gradient(135deg,#3A3835,#2E2C2A)", f: "matte black at the hand" },
      { n: "UNSEALED BRONZE", o: "ARCHITECTURAL ALLOY", t: 2, cost: 26, sw: "linear-gradient(135deg,#9C8760,#8C7853)", f: "living bronze at the hand" },
      { n: "SOLID BRASS", o: "UNLACQUERED", t: 3, cost: 38, sw: "linear-gradient(135deg,#D8B872,#C9A962)", f: "unlacquered brass at the hand" },
    ],
  },
];

interface SpSeason {
  n: string;
  azS: number;
  azE: number;
  rN: number;
}
const SP_SEASONS: SpSeason[] = [
  { n: "SUMMER SOLSTICE", azS: 62, azE: 298, rN: 44 },
  { n: "EQUINOX", azS: 90, azE: 270, rN: 84 },
  { n: "WINTER SOLSTICE", azS: 112, azE: 248, rN: 118 },
];
const SP_CARDS: [string, number, number][] = [["N", 190, 20], ["E", 362, 194], ["S", 190, 370], ["W", 16, 194]];
const SP_HOURS: [number, string][] = [[0, "6"], [0.5, "12"], [1, "18"]];
/** glazing edges: top / east / south / west of the house square */
const SP_GL: [number, number, number, number][] = [
  [-19, -19, 19, -19],
  [19, -19, 19, 19],
  [-19, 19, 19, 19],
  [-19, -19, -19, 19],
];
const FACADES = ["NORTH FAÇADE", "EAST FAÇADE", "SOUTH FAÇADE", "WEST FAÇADE"];

interface TlPhase {
  n: string;
  w: number;
}
const TL_PHASES: TlPhase[] = [
  { n: "PRE-CONSTRUCTION", w: 8 },
  { n: "FOUNDATION", w: 6 },
  { n: "FRAMING", w: 10 },
  { n: "ROUGH-IN & DRYWALL", w: 10 },
  { n: "FINISHES", w: 12 },
  { n: "LANDSCAPE & CLOSE", w: 6 },
];
const TL_TOGGLES: { w: number[] }[] = [
  { w: [0, 0, 0, 0, 3, 0] },
  { w: [-2, 0, 0, 0, 0, 0] },
  { w: [0, 1, 2, 0, 0, 0] },
];
interface TlDecision {
  ph: number;
  off: number;
  label: string;
}
const TL_DECISIONS: TlDecision[] = [
  { ph: 0, off: 6, label: "SITE STAKING CONFIRMED" },
  { ph: 2, off: 4, label: "WINDOW PACKAGE LOCKED" },
  { ph: 3, off: 2, label: "TILE SELECTION DUE" },
  { ph: 3, off: 6, label: "FIXTURE & PAINT SELECTIONS" },
  { ph: 4, off: 8, label: "LANDSCAPE PLAN FINAL" },
];

/* ===================== pure helpers ===================== */

const isSimple = () => document.documentElement.classList.contains("simple");

function monthly(P: number): number {
  const r = 0.065 / 12;
  const n = 360;
  return Math.round((P * r) / (1 - Math.pow(1 + r, -n)));
}

function mixRGB(a: number[], b: number[], t: number): number[] {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

const rgbStr = (c: number[]): string => "rgb(" + c[0] + "," + c[1] + "," + c[2] + ")";

const norm = (a: number): number => ((a % 360) + 360) % 360;
const dev180 = (a: number): number => {
  let d = norm(a);
  if (d > 180) d -= 360;
  return d;
};

const spPt = (az: number, r: number): [number, number] => {
  const a = az * RAD;
  return [190 + r * Math.sin(a), 190 - r * Math.cos(a)];
};

const arcPtsOf = (s: SpSeason): [number, number][] => {
  const steps = 44;
  const pts: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const az = s.azS + (s.azE - s.azS) * t;
    const r = 148 - (148 - s.rN) * Math.sin(Math.PI * t);
    pts.push(spPt(az, r));
  }
  return pts;
};

const ARC_PTS: [number, number][][] = SP_SEASONS.map(arcPtsOf);

const arcD = (pts: [number, number][]): string =>
  pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join("");

/** Arc-length interpolation along a season polyline (SVG getPointAtLength port). */
function pointAtLength(pts: [number, number][], t: number): [number, number] {
  const cum = [0];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    cum.push(total);
  }
  const target = t * total;
  for (let i = 1; i < cum.length; i++) {
    if (cum[i] >= target) {
      const f = (target - cum[i - 1]) / Math.max(1e-9, cum[i] - cum[i - 1]);
      /* Round to 2dp: Node and V8 Chrome diverge in the last FP bits,
         which caused an SSR hydration attribute mismatch on cx/cy. */
      return [
        Math.round((pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f) * 100) / 100,
        Math.round((pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f) * 100) / 100,
      ];
    }
  }
  return pts[pts.length - 1];
}

function pcNote(o: PcOpt[]): string {
  if (o[1].t === 1 && o[0].n === "SOAPSTONE") {
    return "White oak and soapstone age beautifully together. Both deepen in tone with the years.";
  }
  if (o[0].n === "CALACATTA MARBLE") {
    return "Marble requires periodic sealing, and citrus will etch it. Some households love the record and some regret it.";
  }
  if (o[3].n === "UNSEALED BRONZE" && o[2].t === 2) {
    return "Bronze hardware on quartersawn oak is our house signature. The patina will record every hand that passes.";
  }
  if (o[1].t === 0 && o[0].t === 3) {
    return "A balanced palette ages better than an extreme one. Consider stepping the flooring up one tier.";
  }
  if (o[1].t === 3) {
    return "Reclaimed chestnut carries its previous century with it. We mill it thin so the old scars stay legible.";
  }
  if (o[1].t === 2 && o[0].t === 2) {
    return "Stone on stone. Keep the two in different finishes and the rooms will breathe.";
  }
  return "Combine materials that age at the same pace. A palette is a promise about the next thirty years.";
}

/* ===================== the custom drag slider (makeSlider port) ===================== */

interface KSliderProps {
  min: number;
  max: number;
  value: number;
  step?: number;
  ticks?: number;
  label: string;
  onChange: (v: number) => void;
}

function KSlider({ min, max, value, step, ticks = 11, label, onChange }: KSliderProps) {
  const elRef = useRef<HTMLDivElement>(null);
  const downRef = useRef(false);
  const p = clamp((value - min) / (max - min), 0, 1);

  const setFromX = (x: number) => {
    const el = elRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const pp = clamp((x - r.left - 5) / (r.width - 10), 0, 1);
    let v = min + pp * (max - min);
    if (step) v = Math.round(v / step) * step;
    onChange(v);
  };

  return (
    <div
      ref={elRef}
      className="k-slider"
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={Math.round(value)}
      onPointerDown={(e) => {
        downRef.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        setFromX(e.clientX);
      }}
      onPointerMove={(e) => {
        if (downRef.current) setFromX(e.clientX);
      }}
      onPointerUp={() => {
        downRef.current = false;
      }}
      onKeyDown={(e) => {
        const st = step || (max - min) / 50;
        let v = value;
        if (e.key === "ArrowRight" || e.key === "ArrowUp") v += st;
        if (e.key === "ArrowLeft" || e.key === "ArrowDown") v -= st;
        if (e.key === "Home") v = min;
        if (e.key === "End") v = max;
        if (v !== value) {
          e.preventDefault();
          onChange(clamp(v, min, max));
        }
      }}
    >
      <div className="ks-track">
        <div className="ks-fill" style={{ width: p * 100 + "%" }} />
      </div>
      <div className="ks-ticks">
        {Array.from({ length: ticks }, (_, t) => (
          <i key={t} style={{ left: (t / (ticks - 1)) * 100 + "%" }} />
        ))}
      </div>
      <div className="ks-thumb" style={{ left: "calc(" + p * 100 + "% + " + (5 - p * 10) + "px)" }} />
    </div>
  );
}

/* ===================== the section ===================== */

export default function Tools() {
  const { state, reduced } = useKc();

  /* ---- refs ---- */
  const rootRef = useRef<HTMLElement>(null);
  const dialRef = useRef<HTMLDivElement>(null);
  const needleRef = useRef<SVGGElement>(null);
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const bcNeedleRef = useRef<SVGGElement>(null);
  const leafRef = useRef<SVGSVGElement>(null);
  const dlBtnRef = useRef<HTMLButtonElement>(null);
  const sliceRefs = useRef<(SVGCircleElement | null)[]>([]);
  const totalRef = useRef<HTMLDivElement>(null);
  const finRef = useRef<HTMLElement>(null);
  const rotGRef = useRef<SVGGElement>(null);
  const sunRef = useRef<SVGCircleElement>(null);
  const weeksRef = useRef<HTMLSpanElement>(null);
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);

  const dialRotRef = useRef(45);
  const dialDownRef = useRef(false);
  const prevActiveRef = useRef(0);
  const firstActiveRef = useRef(true);
  const bootRef = useRef(false);
  const sunTRef = useRef(0);
  const moneyPrev = useRef({ total: 0, fin: 0 });
  const tlFirstRef = useRef(true);
  const tlWeeksPrev = useRef(52);

  /* ---- UI state (original module vars) ---- */
  const [active, setActiveIdx] = useState(0);
  const [readout, setReadout] = useState("INSTRUMENT 01 · BUDGET COMPASS · CALIBRATING");
  const [bc, setBc] = useState({ type: 0, size: 3500, finish: 1, site: 0, sustain: 1 });
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [sel, setSel] = useState([1, 1, 1, 1]);
  const [room, setRoom] = useState(0);
  const [rot, setRot] = useState(0);
  const [season, setSeason] = useState(1);
  const [glz, setGlz] = useState([false, false, true, false]);
  const [tlOn, setTlOn] = useState([false, false, false]);

  /* ---- Budget Compass math (recalc port) ---- */
  const total =
    BC_TYPEB[bc.type] * bc.size * BC_FINM[bc.finish] * BC_SITEM[bc.site] * (1 + (bc.sustain / 4) * 0.09);
  const bcCol = rgbStr(
    mixRGB(mixRGB([52, 48, 42], [181, 101, 29], (bc.finish / 3) * 0.55), [107, 127, 90], (bc.sustain / 4) * 0.6),
  );
  const cvText =
    hoverIdx != null
      ? "$" + Math.round((total * BC_SLICES[hoverIdx].pct) / 100).toLocaleString("en-US")
      : "$" + Math.round(total).toLocaleString("en-US");
  const clText = hoverIdx != null ? BC_SLICES[hoverIdx].label + " · " + BC_SLICES[hoverIdx].pct + "%" : "TOTAL INVESTMENT";

  /* ---- Palette Curator math (update port) ---- */
  const pcOpts = PC_CATS.map((c, i) => c.opts[sel[i]]);
  const pcAvg = (pcOpts[0].t + pcOpts[1].t + pcOpts[2].t + pcOpts[3].t) / 4;
  const pcReg = pcAvg < 1 ? "A quiet" : pcAvg < 2 ? "A warm mineral" : "A rare-material";
  const pcDesc = pcReg + " palette · " + pcOpts[1].f + ", " + pcOpts[0].f + ", " + pcOpts[2].f + ", and " + pcOpts[3].f + ".";
  let pcBase = 0;
  let pcCur = 0;
  let pcMaxD = 0;
  PC_CATS.forEach((c, i) => {
    pcBase += c.opts[1].cost * PC_ROOMS[room].a[i];
    pcCur += c.opts[sel[i]].cost * PC_ROOMS[room].a[i];
    pcMaxD += (c.opts[3].cost - c.opts[1].cost) * PC_ROOMS[room].a[i];
  });
  const pcDelta = pcCur - pcBase;
  const pcP = clamp(Math.abs(pcDelta) / Math.max(1, pcMaxD), 0, 1) * 50;
  const pcFillStyle =
    pcDelta >= 0 ? { left: "50%", width: pcP + "%" } : { left: 50 - pcP + "%", width: pcP + "%" };
  const pcDeltaText =
    pcDelta === 0
      ? "$0 · AT BASELINE"
      : pcDelta < 0
        ? "−$" + Math.abs(pcDelta).toLocaleString("en-US") + " · BELOW BASELINE"
        : "+$" + pcDelta.toLocaleString("en-US") + " · ABOVE BASELINE";
  const pcNoteText = pcNote(pcOpts);

  /* ---- Sun Path Compass math (update port) ---- */
  const southBearing = norm(180 + rot);
  const facadeBearings = [norm(rot), norm(90 + rot), norm(180 + rot), norm(270 + rot)];
  const activeGlz = glz
    .map((on, i) => (on ? { n: FACADES[i], b: facadeBearings[i] } : null))
    .filter((f): f is { n: string; b: number } => f !== null);
  const lightFor = (az: number): string => {
    if (!activeGlz.length) return "NO GLAZING PLACED";
    const hits = activeGlz.filter((f) => Math.abs(dev180(f.b - az)) <= 60);
    if (!hits.length) return "NONE · NO GLAZING IN THIS LIGHT";
    return hits.map((f) => f.n + " · " + Math.round(f.b) + "°").join(" · ");
  };
  const sGain = activeGlz.reduce((acc, f) => acc + Math.max(0, Math.cos(dev180(f.b - 180) * RAD)), 0);
  const gain = activeGlz.length ? Math.round(clamp(0.15 + 0.85 * (sGain / 1.7), 0, 1) * 100) : 0;
  const gainText = gain + "%" + (gain >= 70 ? " · EXCELLENT" : gain >= 40 ? " · WORKABLE" : " · POOR");
  const gainClass = "sr-v" + (gain >= 70 ? " good" : gain < 40 ? " warn" : "");
  const sS = activeGlz.reduce((acc, f) => Math.max(acc, Math.cos(dev180(f.b - 180) * RAD)), 0);
  const passiveLevel = sS >= 0.7 ? 3 : sS >= 0.25 ? 2 : sS > 0 ? 1 : 0;
  const sW = activeGlz.reduce((acc, f) => Math.max(acc, Math.cos(dev180(f.b - 270) * RAD)), 0);
  const heatText = !activeGlz.length
    ? "NO GLAZING"
    : sW >= 0.6
      ? "HIGH · SHADE THE WEST GLASS"
      : sW >= 0.25
        ? "MODERATE · OVERHANGS ADVISED"
        : "LOW";
  const heatClass = !activeGlz.length ? "sr-v" : sW >= 0.6 ? "sr-v warn" : sW >= 0.25 ? "sr-v" : "sr-v good";
  const tiltDev = dev180(southBearing - 180);
  const tiltLoss = Math.round((1 - Math.cos(tiltDev * RAD)) * 60);
  const tiltText =
    "34° TILT · " +
    (Math.abs(tiltDev) <= 25
      ? "AZIMUTH OPTIMAL (SOUTH)"
      : "Δ" + Math.abs(Math.round(tiltDev)) + "° FROM SOUTH · YIELD LOSS ≈ " + tiltLoss + "%");

  /* ---- Construction Chronicle math (weeks port) ---- */
  const tl = useMemo(() => {
    const w = TL_PHASES.map((ph) => ph.w);
    tlOn.forEach((on, i) => {
      if (on) TL_TOGGLES[i].w.forEach((add, k) => (w[k] += add));
    });
    const clamped = w.map((x) => Math.max(2, x));
    const total = clamped.reduce((a, b) => a + b, 0);
    const starts: number[] = [];
    let acc = 0;
    clamped.forEach((wk) => {
      starts.push(acc);
      acc += wk;
    });
    return { w: clamped, total, starts };
  }, [tlOn]);

  /* ---- switching (setActive port) ---- */
  const choose = (idx: number) => {
    const i = clamp(Math.round(idx), 0, 3);
    if (i === active) return;
    setActiveIdx(i);
    setReadout("INSTRUMENT 0" + (i + 1) + " · " + NAMES[i] + " · CALIBRATED");
  };

  /* panel cross-fade + needle rotation, driven by [active] */
  useEffect(() => {
    const idx = active;
    const instant = firstActiveRef.current;
    firstActiveRef.current = false;
    /* original: setActive returns early when the index is unchanged */
    if (!instant && idx === prevActiveRef.current) return;

    const simple = isSimple();
    const panels = panelRefs.current.filter((x): x is HTMLDivElement => x !== null);
    const inEl = panelRefs.current[idx] ?? null;
    let tl: gsap.core.Timeline | null = null;

    if (simple) {
      /* simple mode: CSS display switch only, exactly as the original */
    } else if (instant || reduced) {
      gsap.set(panels, { autoAlpha: 0 });
      if (inEl) gsap.set(inEl, { autoAlpha: 1, x: 0 });
    } else {
      const outEl = panelRefs.current[prevActiveRef.current] ?? null;
      tl = gsap.timeline();
      if (outEl) {
        tl.to(outEl, { x: -64, autoAlpha: 0, duration: 0.32, ease: "power2.in", overwrite: "auto" }, 0);
      }
      if (inEl) {
        tl.fromTo(inEl, { x: 64, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.5, ease: "power3.out" }, 0.16);
      }
    }
    prevActiveRef.current = idx;

    let nt: gsap.core.Tween | null = null;
    const needle = needleRef.current;
    if (needle) {
      let target = 45 + idx * 90;
      while (target - dialRotRef.current > 180) target -= 360;
      while (target - dialRotRef.current < -180) target += 360;
      dialRotRef.current = target;
      if (instant || simple) {
        gsap.set(needle, { rotation: target, svgOrigin: "0 0" });
      } else {
        nt = gsap.to(needle, {
          rotation: target,
          duration: 0.7,
          ease: "power3.inOut",
          svgOrigin: "0 0",
          overwrite: "auto",
        });
      }
    }
    return () => {
      tl?.kill();
      nt?.kill();
    };
  }, [active, reduced]);

  /* boot: dial sweep + CALIBRATED readout when the section first enters view */
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    let bootTween: gsap.core.Tween | null = null;
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: el,
        start: "top bottom",
        end: "bottom top",
        onToggle: (s) => {
          state.current.vis.tools = s.isActive;
          if (s.isActive && !bootRef.current) {
            bootRef.current = true;
            if (!isSimple() && needleRef.current) {
              bootTween = gsap.fromTo(
                needleRef.current,
                { rotation: -315 },
                {
                  rotation: 45,
                  duration: 1.3,
                  ease: "power3.inOut",
                  svgOrigin: "0 0",
                  onComplete: () => {
                    setReadout("INSTRUMENT 01 · " + NAMES[0] + " · CALIBRATED");
                  },
                },
              );
            }
          }
        },
      });
    }, el);
    return () => {
      bootTween?.kill();
      ctx.revert();
    };
  }, [state]);

  /* Budget Compass: money count-ups + gauge spin (recalc gsap side effects) */
  useEffect(() => {
    const tweens: gsap.core.Tween[] = [];
    const fin = monthly(total * 0.8);
    const totalEl = totalRef.current;
    if (totalEl) {
      const o = { v: moneyPrev.current.total };
      moneyPrev.current.total = total;
      tweens.push(
        gsap.to(o, {
          v: total,
          duration: 0.7,
          ease: "power2.out",
          overwrite: true,
          onUpdate: () => {
            totalEl.textContent = "$" + Math.round(o.v).toLocaleString("en-US");
          },
        }),
      );
    }
    const finEl = finRef.current;
    if (finEl) {
      const o = { v: moneyPrev.current.fin };
      moneyPrev.current.fin = fin;
      tweens.push(
        gsap.to(o, {
          v: fin,
          duration: 0.7,
          ease: "power2.out",
          overwrite: true,
          onUpdate: () => {
            finEl.textContent = "$" + Math.round(o.v).toLocaleString("en-US");
          },
        }),
      );
    }
    let spinTween: gsap.core.Tween | null = null;
    const spinT = window.setTimeout(() => {
      if (bcNeedleRef.current) {
        spinTween = gsap.to(bcNeedleRef.current, {
          rotation: "+=360",
          duration: 0.55,
          ease: "power2.out",
          overwrite: true,
        });
      }
    }, 90);
    return () => {
      window.clearTimeout(spinT);
      spinTween?.kill();
      tweens.forEach((t) => t.kill());
    };
  }, [total]);

  /* donut slices: one-time sweep-in (drawSlices port) */
  useEffect(() => {
    const tweens: gsap.core.Tween[] = [];
    sliceRefs.current.forEach((c, i) => {
      if (!c) return;
      const len = (DONUT_C * BC_SLICES[i].pct) / 100;
      const dash = len.toFixed(1) + " " + DONUT_C.toFixed(1);
      if (reduced) {
        c.setAttribute("stroke-dasharray", dash);
      } else {
        tweens.push(
          gsap.to(c, {
            attr: { "stroke-dasharray": dash },
            duration: 0.8,
            delay: 0.15 + i * 0.09,
            ease: "power2.inOut",
          }),
        );
      }
    });
    return () => {
      tweens.forEach((t) => t.kill());
    };
  }, [reduced]);

  /* donut hover: dim the other slices (hoverSlice/leaveSlice port) */
  useEffect(() => {
    sliceRefs.current.forEach((c, k) => {
      if (!c) return;
      gsap.to(c, {
        opacity: hoverIdx === null || hoverIdx === k ? 1 : 0.3,
        duration: 0.25,
        overwrite: "auto",
      });
    });
  }, [hoverIdx]);

  /* sustainability leaf scale (readout side effect port) */
  useEffect(() => {
    if (!leafRef.current) return;
    const t = gsap.to(leafRef.current, {
      scale: 0.6 + (bc.sustain / 4) * 0.55,
      transformOrigin: "50% 100%",
      duration: 0.4,
      ease: "power2.out",
      overwrite: "auto",
    });
    return () => {
      t.kill();
    };
  }, [bc.sustain]);

  /* Sun Path: house rotation (gsap.to rotG port) */
  useEffect(() => {
    if (!rotGRef.current) return;
    const t = gsap.to(rotGRef.current, { rotation: rot, duration: 0.5, ease: "power3.out" });
    return () => {
      t.kill();
    };
  }, [rot]);

  /* Sun Path: travelling sun (ticker port, alive once the instrument opened) */
  useEffect(() => {
    if (active !== 2) return;
    const pts = ARC_PTS[season];
    if (reduced) {
      const q = pointAtLength(pts, 0.5);
      const sun = sunRef.current;
      if (sun) {
        sun.setAttribute("cx", String(q[0]));
        sun.setAttribute("cy", String(q[1]));
      }
      return;
    }
    const onTick = (_t: number, dms: number) => {
      if (!state.current.vis.tools || state.current.modalOpen) return;
      sunTRef.current += Math.min(dms / 1000, 0.05) / 12;
      if (sunTRef.current > 1) sunTRef.current -= 1;
      const q = pointAtLength(pts, sunTRef.current);
      const sun = sunRef.current;
      if (sun) {
        sun.setAttribute("cx", q[0].toFixed(1));
        sun.setAttribute("cy", q[1].toFixed(1));
      }
    };
    gsap.ticker.add(onTick);
    return () => {
      gsap.ticker.remove(onTick);
    };
  }, [active, season, reduced, state]);

  /* season change restarts the travelling sun (sunT = 0 port) */
  useEffect(() => {
    sunTRef.current = 0;
  }, [season]);

  /* Construction Chronicle: bar widths + weeks count-up (render port) */
  useEffect(() => {
    const animate = !tlFirstRef.current;
    tlFirstRef.current = false;
    const tweens: gsap.core.Tween[] = [];
    barRefs.current.forEach((bar, i) => {
      if (!bar) return;
      const pct = (tl.w[i] / tl.total) * 100;
      if (animate && !reduced) {
        tweens.push(gsap.to(bar, { width: pct + "%", duration: 0.6, ease: "power3.out" }));
      } else {
        bar.style.width = pct + "%";
      }
    });
    const wkEl = weeksRef.current;
    if (wkEl) {
      if (animate && !reduced) {
        const from = tlWeeksPrev.current || tl.total;
        const o = { v: from };
        tweens.push(
          gsap.to(o, {
            v: tl.total,
            duration: 0.6,
            ease: "power2.out",
            onUpdate: () => {
              wkEl.textContent = String(Math.round(o.v));
            },
          }),
        );
      } else {
        wkEl.textContent = String(tl.total);
      }
    }
    tlWeeksPrev.current = tl.total;
    return () => {
      tweens.forEach((t) => t.kill());
    };
  }, [tl, reduced]);

  /* ---- dial drag (pointer port of the #inst-dial handlers) ---- */
  const angleAt = (clientX: number, clientY: number): number => {
    const dial = dialRef.current;
    if (!dial) return 0;
    const r = dial.getBoundingClientRect();
    const dx = clientX - (r.left + r.width / 2);
    const dy = clientY - (r.top + r.height / 2);
    return (((Math.atan2(dy, dx) * 180) / Math.PI + 90 + 360) % 360);
  };

  const onDownload = () => {
    downloadText("keystone-preliminary-estimate.txt", [
      "KEYSTONE COLLECTIVE · PRELIMINARY ESTIMATE",
      "GENERATED " +
        new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }).toUpperCase(),
      "",
      "PROJECT TYPE ......... " + BC_TYPES[bc.type],
      "SIZE ................. " + bc.size.toLocaleString("en-US") + " SQ FT",
      "FINISH LEVEL ......... " + BC_FINN[bc.finish],
      "SITE ................. " + BC_SITEN[bc.site],
      "SUSTAINABILITY ....... " + BC_SUSL[bc.sustain],
      "",
      "ESTIMATED INVESTMENT . $" + Math.round(total).toLocaleString("en-US"),
      "PER SQUARE FOOT ...... $" + Math.round(total / bc.size).toLocaleString("en-US"),
      "FINANCING ............ ~$" + monthly(total * 0.8).toLocaleString("en-US") + "/MO AT 6.5% / 30Y / 20% DOWN",
      "",
      "ALLOCATION",
      BC_SLICES.map((s) => "  " + s.label + " " + s.pct + "%  $" + Math.round((total * s.pct) / 100).toLocaleString("en-US")).join("\n"),
      "",
      "A PRELIMINARY ESTIMATE ONLY.",
      "© 2026 KEYSTONE COLLECTIVE · BOULDER, COLORADO",
    ]);
    const btn = dlBtnRef.current;
    if (btn) {
      gsap.fromTo(
        btn,
        { letterSpacing: ".28em" },
        { letterSpacing: ".36em", duration: 0.4, yoyo: true, repeat: 1, ease: "power2.inOut" },
      );
    }
  };

  const bcBtn = (on: boolean) => "bc-btn" + (on ? " on" : "");

  return (
    <>
      <section
        ref={rootRef}
        id="sec-tools"
        className="sec"
        data-name="THE INSTRUMENTS"
        data-index="07"
        data-accent="#8C7853"
        data-theme="light"
      >
        <div className="stage" id="tools-stage">
          <div className="stage-head">
            <div className="sec-label">07 · THE INSTRUMENTS</div>
            <h2>Measurement you can trust.</h2>
            <p>Precision tools for thoughtful decisions.</p>
          </div>
          <div className="inst-layout">
            <div className="inst-dial-col">
              <button
                className={"inst-dial-label idl-ne" + (active === 0 ? " on" : "")}
                data-app="0"
                aria-label="Open the Budget Compass"
                onClick={() => choose(0)}
              >
                <span className="idl-n">01</span>
                <span className="idl-t">BUDGET</span>
              </button>
              <button
                className={"inst-dial-label idl-se" + (active === 1 ? " on" : "")}
                data-app="1"
                aria-label="Open the Palette Curator"
                onClick={() => choose(1)}
              >
                <span className="idl-n">02</span>
                <span className="idl-t">PALETTE</span>
              </button>
              <button
                className={"inst-dial-label idl-sw" + (active === 2 ? " on" : "")}
                data-app="2"
                aria-label="Open the Sun Path Compass"
                onClick={() => choose(2)}
              >
                <span className="idl-n">03</span>
                <span className="idl-t">SUN PATH</span>
              </button>
              <button
                className={"inst-dial-label idl-nw" + (active === 3 ? " on" : "")}
                data-app="3"
                aria-label="Open the Construction Chronicle"
                onClick={() => choose(3)}
              >
                <span className="idl-n">04</span>
                <span className="idl-t">CHRONICLE</span>
              </button>
              <div
                id="inst-dial"
                aria-hidden="true"
                ref={dialRef}
                onPointerDown={(e) => {
                  dialDownRef.current = true;
                  e.currentTarget.setPointerCapture(e.pointerId);
                }}
                onPointerMove={(e) => {
                  if (!dialDownRef.current) return;
                  const a = angleAt(e.clientX, e.clientY);
                  if (needleRef.current) gsap.set(needleRef.current, { rotation: a, svgOrigin: "0 0" });
                  dialRotRef.current = a;
                }}
                onPointerUp={(e) => {
                  if (!dialDownRef.current) return;
                  dialDownRef.current = false;
                  const a = angleAt(e.clientX, e.clientY);
                  const idx = clamp(Math.round(((a - 45 + 360) % 360) / 90) % 4, 0, 3);
                  choose(idx);
                }}
              >
                <svg viewBox="-110 -110 220 220">
                  <circle className="dl-ring" r="104" />
                  <g id="dl-ticks">
                    {Array.from({ length: 24 }, (_, i) => {
                      const a = i * 15 * RAD;
                      return (
                        <line
                          key={i}
                          className="dl-tick"
                          x1={(97 * Math.sin(a)).toFixed(1)}
                          y1={(-97 * Math.cos(a)).toFixed(1)}
                          x2={(104 * Math.sin(a)).toFixed(1)}
                          y2={(-104 * Math.cos(a)).toFixed(1)}
                        />
                      );
                    })}
                  </g>
                  <g id="dl-pos-g">
                    <circle className={"dl-pos" + (active === 0 ? " on" : "")} data-app="0" r="5.5" cx="59.4" cy="-59.4" onClick={() => choose(0)} />
                    <circle className={"dl-pos" + (active === 1 ? " on" : "")} data-app="1" r="5.5" cx="59.4" cy="59.4" onClick={() => choose(1)} />
                    <circle className={"dl-pos" + (active === 2 ? " on" : "")} data-app="2" r="5.5" cx="-59.4" cy="59.4" onClick={() => choose(2)} />
                    <circle className={"dl-pos" + (active === 3 ? " on" : "")} data-app="3" r="5.5" cx="-59.4" cy="-59.4" onClick={() => choose(3)} />
                  </g>
                  <g id="dl-needle" ref={needleRef}>
                    <line x1="0" y1="12" x2="0" y2="-72" />
                    <circle r="5" />
                  </g>
                </svg>
              </div>
            </div>
            <div id="inst-tabs" role="tablist" aria-label="Instruments">
              <button className={"it-btn" + (active === 0 ? " on" : "")} data-app="0" role="tab" aria-selected={active === 0} onClick={() => choose(0)}>
                01 · BUDGET
              </button>
              <button className={"it-btn" + (active === 1 ? " on" : "")} data-app="1" role="tab" aria-selected={active === 1} onClick={() => choose(1)}>
                02 · PALETTE
              </button>
              <button className={"it-btn" + (active === 2 ? " on" : "")} data-app="2" role="tab" aria-selected={active === 2} onClick={() => choose(2)}>
                03 · SUN PATH
              </button>
              <button className={"it-btn" + (active === 3 ? " on" : "")} data-app="3" role="tab" aria-selected={active === 3} onClick={() => choose(3)}>
                04 · CHRONICLE
              </button>
            </div>
            <div className="inst-stage">
              <div className={"instrument" + (active === 0 ? " active" : "")} id="app-budget" ref={(el) => { panelRefs.current[0] = el; }}>
                <div className="inst-head">
                  <div className="inst-sheet">SHT T-101 · BUDGET COMPASS</div>
                  <h3>The Budget Compass</h3>
                  <p className="inst-sub">A preliminary estimate, drawn honestly, the way we draw one.</p>
                </div>
                <div className="bc-grid">
                  <div>
                    <div className="bc-field">
                      <div className="bc-flabel">PROJECT TYPE</div>
                      <div className="bc-btns" id="bc-types">
                        <button className={bcBtn(bc.type === 0)} data-i="0" onClick={() => setBc((s) => ({ ...s, type: 0 }))}>
                          <svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M2 7 L8.5 2 L15 7 M4 6 V14 H13 V6 M7.5 14 V10 H9.5 V14" /></svg>
                          CUSTOM HOME
                        </button>
                        <button className={bcBtn(bc.type === 1)} data-i="1" onClick={() => setBc((s) => ({ ...s, type: 1 }))}>
                          <svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M2 12 H15 M4 12 V5 H13 V12 M6 5 V3.5 H11 V5 M6 8 H11" /></svg>
                          MAJOR RENOVATION
                        </button>
                        <button className={bcBtn(bc.type === 2)} data-i="2" onClick={() => setBc((s) => ({ ...s, type: 2 }))}>
                          <svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="currentColor" strokeWidth="1.2"><rect x="1.5" y="7" width="8" height="7" /><path d="M9.5 7 L9.5 3 H15.5 V14 H9.5 M4 7 V5 H7" /></svg>
                          ADDITION
                        </button>
                        <button className={bcBtn(bc.type === 3)} data-i="3" onClick={() => setBc((s) => ({ ...s, type: 3 }))}>
                          <svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M3 13 C5 9 7 9 8.5 11 C10 8 12 8 14 12 M3 5 C5 2.5 7 3 8.5 5 C10 2.5 12 2.5 14 5" /></svg>
                          INTERIOR ONLY
                        </button>
                      </div>
                    </div>
                    <div className="bc-field">
                      <div className="bc-flabel">SIZE</div>
                      <div className="bc-size-read">
                        <span id="bc-size-val">{Math.round(bc.size).toLocaleString("en-US")}</span>
                        <span className="bc-sqft">SQ FT</span>
                      </div>
                      <div id="bc-size-slider">
                        <KSlider
                          min={1500}
                          max={8000}
                          value={bc.size}
                          step={50}
                          ticks={14}
                          label="Home size, square feet"
                          onChange={(v) => setBc((s) => ({ ...s, size: v }))}
                        />
                      </div>
                    </div>
                    <div className="bc-field">
                      <div className="bc-flabel">FINISH LEVEL</div>
                      <div className="bc-btns" id="bc-finish">
                        <button className={bcBtn(bc.finish === 0)} data-i="0" onClick={() => setBc((s) => ({ ...s, finish: 0 }))}>
                          <span className="bc-swatch" style={{ background: "#B9B4AC" }}></span>STANDARD
                        </button>
                        <button className={bcBtn(bc.finish === 1)} data-i="1" onClick={() => setBc((s) => ({ ...s, finish: 1 }))}>
                          <span className="bc-swatch" style={{ background: "#A67B5B" }}></span>PREMIUM
                        </button>
                        <button className={bcBtn(bc.finish === 2)} data-i="2" onClick={() => setBc((s) => ({ ...s, finish: 2 }))}>
                          <span className="bc-swatch" style={{ background: "#D4C5B0" }}></span>LUXURY
                        </button>
                        <button className={bcBtn(bc.finish === 3)} data-i="3" onClick={() => setBc((s) => ({ ...s, finish: 3 }))}>
                          <span className="bc-swatch" style={{ background: "#C9A962" }}></span>BESPOKE
                        </button>
                      </div>
                    </div>
                    <div className="bc-field">
                      <div className="bc-flabel">SITE COMPLEXITY</div>
                      <div className="bc-btns" id="bc-site">
                        <button className={bcBtn(bc.site === 0)} data-i="0" onClick={() => setBc((s) => ({ ...s, site: 0 }))}>
                          FLAT / ACCESSIBLE
                        </button>
                        <button className={bcBtn(bc.site === 1)} data-i="1" onClick={() => setBc((s) => ({ ...s, site: 1 }))}>
                          SLOPED / RURAL
                        </button>
                        <button className={bcBtn(bc.site === 2)} data-i="2" onClick={() => setBc((s) => ({ ...s, site: 2 }))}>
                          STEEP / REMOTE
                        </button>
                      </div>
                    </div>
                    <div className="bc-field">
                      <div className="bc-flabel">SUSTAINABILITY</div>
                      <div className="bc-sus-row">
                        <svg id="bc-leaf" ref={leafRef} width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
                          <path
                            d="M10 18 C10 10 6 4 2 2 C2 2 3 12 6 15 C4 15 3 14 2 13 C3 16 6 18 10 18 Z M10 18 C10 10 14 4 18 2 C18 2 17 12 14 15 C16 15 17 14 18 13 C17 16 14 18 10 18 Z"
                            fill="#6B7F5A"
                          />
                        </svg>
                        <span id="bc-sus-label">{BC_SUSL[bc.sustain]}</span>
                      </div>
                      <div id="bc-sus-slider">
                        <KSlider
                          min={0}
                          max={4}
                          value={bc.sustain}
                          step={1}
                          ticks={5}
                          label="Sustainability level"
                          onChange={(v) => setBc((s) => ({ ...s, sustain: Math.round(v) }))}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="bc-results reg-corners">
                    <div className="bc-r-head">
                      <span>ESTIMATED INVESTMENT</span>
                      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
                        <circle cx="13" cy="13" r="11" stroke="#8C7853" strokeWidth="1" />
                        <g id="bc-needle" ref={bcNeedleRef}>
                          <path d="M13 4 L15.5 13 L13 12.5 L10.5 13 Z" fill="#B5651D" />
                          <circle cx="13" cy="13" r="1.6" fill="#2C2C2C" />
                        </g>
                      </svg>
                    </div>
                    <div id="bc-total" ref={totalRef} style={{ color: bcCol }} />
                    <div className="bc-donut-wrap">
                      <svg id="bc-donut" viewBox="0 0 200 200" aria-hidden="true">
                        <g id="bc-slices" transform="rotate(-90 100 100)">
                          {BC_SLICES.map((s, i) => {
                            const cum = BC_SLICES.slice(0, i).reduce((acc, x) => acc + x.pct * 3.6, 0);
                            return (
                              <circle
                                key={i}
                                ref={(el) => { sliceRefs.current[i] = el; }}
                                cx="100"
                                cy="100"
                                r="64"
                                fill="none"
                                stroke={s.color}
                                strokeWidth="26"
                                strokeDasharray={"0 " + DONUT_C.toFixed(1)}
                                transform={"rotate(" + (cum - 90).toFixed(2) + " 100 100)"}
                                style={{ cursor: "pointer" }}
                                onMouseEnter={() => setHoverIdx(i)}
                                onMouseLeave={() => setHoverIdx(null)}
                              />
                            );
                          })}
                        </g>
                        <text
                          id="bc-cv"
                          x="100"
                          y="99"
                          textAnchor="middle"
                          style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "15px", fill: bcCol, fontWeight: "500" }}
                        >
                          {cvText}
                        </text>
                        <text
                          id="bc-cl"
                          x="100"
                          y="116"
                          textAnchor="middle"
                          style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "7.5px", letterSpacing: "2px", fill: "#8C7853" }}
                        >
                          {clText}
                        </text>
                      </svg>
                      <ul id="bc-legend">
                        {BC_SLICES.map((s, i) => (
                          <li key={i} onMouseEnter={() => setHoverIdx(i)} onMouseLeave={() => setHoverIdx(null)}>
                            <i style={{ background: s.color }} />
                            <span className="lg-n">{s.label}</span>
                            <span className="lg-v">
                              {"$" + Math.round((total * s.pct) / 100).toLocaleString("en-US") + " · " + s.pct + "%"}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bc-r-lines">
                      <div>
                        PER SQUARE FOOT · <b id="bc-psf">{"$" + Math.round(total / bc.size)}</b>
                      </div>
                      <div>
                        FINANCING · <b id="bc-fin" ref={finRef} />
                        <span className="bc-fin-note">AT 6.5% OVER 30 YEARS WITH 20% DOWN</span>
                      </div>
                    </div>
                    <button className="btn-arch" id="bc-download" ref={dlBtnRef} data-cursor="SAVE" onClick={onDownload}>
                      DOWNLOAD PRELIMINARY ESTIMATE
                    </button>
                    <p className="bc-disclaim">A PRELIMINARY ESTIMATE ONLY. EVERY KEYSTONE BUDGET IS ASSEMBLED LINE BY LINE, WITH YOU, DURING DOCUMENTATION.</p>
                  </div>
                </div>
              </div>
              <div className={"instrument" + (active === 1 ? " active" : "")} id="app-palette" ref={(el) => { panelRefs.current[1] = el; }}>
                <div className="inst-head">
                  <div className="inst-sheet">SHT T-201 · PALETTE CURATOR</div>
                  <h3>The Palette Curator</h3>
                  <p className="inst-sub">Choose materials together, and watch cost and character move as one.</p>
                </div>
                <div className="pc-grid">
                  <div className="pc-rooms" id="pc-rooms">
                    {PC_ROOMS.map((r, i) => (
                      <button key={i} className={"pc-room" + (room === i ? " on" : "")} onClick={() => setRoom(i)}>
                        {r.n}
                      </button>
                    ))}
                  </div>
                  <div id="pc-cats">
                    {PC_CATS.map((cat, ci) => (
                      <div key={ci} className="pc-cat">
                        <div className="pc-cat-label">{cat.n}</div>
                        <div className="pc-opts">
                          {cat.opts.map((opt, i) => (
                            <button
                              key={i}
                              className={"pc-opt" + (sel[ci] === i ? " on" : "")}
                              data-cursor="CHOOSE"
                              onClick={() => setSel((prev) => prev.map((v, k) => (k === ci ? i : v)))}
                            >
                              <span className="pc-sw" style={{ background: opt.sw }} />
                              <span>
                                <span className="po-n">{opt.n}</span>
                                <span className="po-o">{opt.o}</span>
                              </span>
                              <span className={"pc-tier t" + opt.t}>{TIERN[opt.t]}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="pc-preview reg-corners">
                      <div className="pc-pv-label">AESTHETIC PREVIEW</div>
                      <div className="pc-strip" id="pc-strip">
                        {pcOpts.map((op, i) => (
                          <i key={i} style={{ background: op.sw }} />
                        ))}
                      </div>
                      <p id="pc-desc">{pcDesc}</p>
                    </div>
                    <div className="pc-cost">
                      <div className="pc-cost-label">COST IMPACT</div>
                      <div className="pcm-track">
                        <span className="pcm-base"></span>
                        <span id="pcm-fill" style={pcFillStyle}></span>
                      </div>
                      <div id="pc-delta" className={pcDelta < 0 ? "under" : ""}>
                        {pcDeltaText}
                      </div>
                    </div>
                    <div className="pc-note">
                      <div className="pc-note-label">ARCHITECT&apos;S NOTE</div>
                      <p id="pc-note-text">{pcNoteText}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className={"instrument" + (active === 2 ? " active" : "")} id="app-sun" ref={(el) => { panelRefs.current[2] = el; }}>
                <div className="inst-head">
                  <div className="inst-sheet">SHT T-301 · SUN PATH COMPASS</div>
                  <h3>The Sun Path Compass</h3>
                  <p className="inst-sub">Rotate the lot and place the glass. Read the day&apos;s light.</p>
                </div>
                <div className="sp-grid">
                  <div className="sp-controls">
                    <div className="bc-field">
                      <div className="bc-flabel">LOT ORIENTATION</div>
                      <div className="bc-size-read" style={{ marginBottom: "0" }}>
                        <span style={{ fontFamily: "'Fraunces',serif", fontWeight: 560, fontSize: "1.3rem" }}>
                          <span id="sp-rot-val">{rot}</span>°
                        </span>
                        <small style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "8px", letterSpacing: ".3em", color: "var(--bronze)", marginLeft: "8px" }}>
                          SOUTH FAÇADE → <span id="sp-bearing">{Math.round(southBearing)}</span>°
                        </small>
                      </div>
                      <div id="sp-rot-slider">
                        <KSlider
                          min={0}
                          max={360}
                          value={rot}
                          step={5}
                          ticks={13}
                          label="Lot orientation, degrees"
                          onChange={(v) => setRot(Math.round(v))}
                        />
                      </div>
                    </div>
                    <div className="bc-field">
                      <div className="bc-flabel">MAJOR GLAZING · FAÇADES</div>
                      <div className="sp-chips">
                        {FACADES.map((f, i) => (
                          <button
                            key={i}
                            className={"sp-chip" + (glz[i] ? " on" : "")}
                            data-f={i}
                            onClick={() => setGlz((prev) => prev.map((v, k) => (k === i ? !v : v)))}
                          >
                            {f.replace(" FAÇADE", "")}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="bc-field">
                      <div className="bc-flabel">SEASON</div>
                      <div className="sp-seasons">
                        {SP_SEASONS.map((s, i) => (
                          <button key={i} className={"sp-se" + (season === i ? " on" : "")} data-s={i} onClick={() => setSeason(i)}>
                            {s.n}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="sp-diagram" style={{ position: "relative" }}>
                      <svg id="sp-svg" viewBox="0 0 380 380">
                        <circle className="sp-ring" cx="190" cy="190" r="148" />
                        <circle className="sp-ring" cx="190" cy="190" r="118" opacity="0.4" />
                        {SP_CARDS.map((c) => (
                          <text key={c[0]} className="sp-cardinal" x={c[1]} y={c[2]} textAnchor="middle">
                            {c[0]}
                          </text>
                        ))}
                        {ARC_PTS.map((pts, i) => (
                          <path key={i} className={"sp-arc" + (season === i ? " on" : "")} d={arcD(pts)} />
                        ))}
                        {ARC_PTS.flatMap((pts, si) =>
                          SP_HOURS.map(([t, lab], hi) => {
                            const q = pointAtLength(pts, t);
                            return (
                              <g key={si + "-" + hi}>
                                <circle className="sp-hour" cx={q[0]} cy={q[1]} r="2.4" />
                                <text
                                  x={q[0] + (q[0] < 190 ? -12 : 10)}
                                  y={q[1] + 3}
                                  textAnchor="middle"
                                  style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "8px", fill: "rgba(44,44,44,.55)" }}
                                >
                                  {lab}
                                </text>
                              </g>
                            );
                          }),
                        )}
                        <g transform="translate(190 190)">
                          <g className="sp-house" ref={rotGRef}>
                            <rect x="-19" y="-19" width="38" height="38" />
                            <line x1="0" y1="19" x2="0" y2="27" />
                            {SP_GL.map((g, i) => (
                              <line key={i} className={"sp-gl" + (glz[i] ? " on" : "")} x1={g[0]} y1={g[1]} x2={g[2]} y2={g[3]} />
                            ))}
                          </g>
                        </g>
                        <circle id="sp-sun" ref={sunRef} cx="190" cy="266" r="8" />
                      </svg>
                      <div id="sp-season-tag">{SP_SEASONS[season].n + " · SUN POSITIONS, 6H-18H"}</div>
                    </div>
                    <div className="sp-reads">
                      <div className="sp-read">
                        <span className="sr-l">MORNING LIGHT</span>
                        <span className="sr-v" id="sp-morning">
                          {lightFor(90)}
                        </span>
                      </div>
                      <div className="sp-read">
                        <span className="sr-l">MIDDAY LIGHT</span>
                        <span className="sr-v" id="sp-noon">
                          {lightFor(180)}
                        </span>
                      </div>
                      <div className="sp-read">
                        <span className="sr-l">AFTERNOON LIGHT</span>
                        <span className="sr-v" id="sp-after">
                          {lightFor(270)}
                        </span>
                      </div>
                      <div className="sp-read">
                        <span className="sr-l">SOLAR GAIN POTENTIAL</span>
                        <span className={gainClass} id="sp-gain">
                          {gainText}
                        </span>
                      </div>
                      <div className="sp-read">
                        <span className="sr-l">PASSIVE HEATING · WINTER</span>
                        <span className="sr-v" id="sp-passive">
                          <span className="sp-dots">
                            {[0, 1, 2].map((i) => (
                              <i key={i} className={i < passiveLevel ? "on" : ""} />
                            ))}
                          </span>
                          <span id="sp-passive-t">{["POOR", "MODEST", "GOOD", "EXCELLENT"][passiveLevel]}</span>
                        </span>
                      </div>
                      <div className="sp-read">
                        <span className="sr-l">OVERHEATING RISK · SUMMER</span>
                        <span className={heatClass} id="sp-heat">
                          {heatText}
                        </span>
                      </div>
                      <div className="sp-read">
                        <span className="sr-l">OPTIMAL PANEL GEOMETRY</span>
                        <span className="sr-v" id="sp-tilt">
                          {tiltText}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className={"instrument" + (active === 3 ? " active" : "")} id="app-timeline" ref={(el) => { panelRefs.current[3] = el; }}>
                <div className="inst-head">
                  <div className="inst-sheet">SHT T-401 · CONSTRUCTION CHRONICLE</div>
                  <h3>The Construction Chronicle</h3>
                  <p className="inst-sub">Every decision moves the calendar. Watch it happen.</p>
                </div>
                <div className="tl-controls">
                  <button
                    className={"tl-tgl" + (tlOn[0] ? " on" : "")}
                    data-t="0"
                    aria-pressed={tlOn[0] ? "true" : "false"}
                    onClick={() => setTlOn((prev) => prev.map((v, k) => (k === 0 ? !v : v)))}
                  >
                    <span className="tg-n">CUSTOM CABINETRY</span>
                    <span className="tg-d">+3 WEEKS · FINISHES</span>
                  </button>
                  <button
                    className={"tl-tgl" + (tlOn[1] ? " on" : "")}
                    data-t="1"
                    aria-pressed={tlOn[1] ? "true" : "false"}
                    onClick={() => setTlOn((prev) => prev.map((v, k) => (k === 1 ? !v : v)))}
                  >
                    <span className="tg-n">PRE-SELECTED MATERIALS</span>
                    <span className="tg-d">−2 WEEKS · SELECTIONS EARLY</span>
                  </button>
                  <button
                    className={"tl-tgl" + (tlOn[2] ? " on" : "")}
                    data-t="2"
                    aria-pressed={tlOn[2] ? "true" : "false"}
                    onClick={() => setTlOn((prev) => prev.map((v, k) => (k === 2 ? !v : v)))}
                  >
                    <span className="tg-n">WINTER CONSTRUCTION START</span>
                    <span className="tg-d">+3 WEEKS · WEATHER</span>
                  </button>
                </div>
                <div className="tl-total">
                  <span id="tl-weeks" ref={weeksRef} />
                  <span className="tl-wk">WEEKS</span>
                  <span id="tl-months">{"≈ " + Math.round(tl.total / 4.33) + " MONTHS"}</span>
                </div>
                <div id="tl-chart">
                  {TL_PHASES.map((p, i) => (
                    <div className="tl-row" key={i}>
                      <div className="tl-label">
                        {p.n} · <b>{tl.w[i] + " WK"}</b>
                      </div>
                      <div className="tl-track">
                        <div className="tl-bar" ref={(el) => { barRefs.current[i] = el; }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="tl-lane" id="tl-lane">
                  <div className="tl-today" aria-hidden="true" />
                  {TL_DECISIONS.map((d, i) => (
                    <div
                      key={i}
                      className="tl-dec"
                      style={{ left: ((tl.starts[d.ph] + d.off) / tl.total) * 100 + "%" }}
                    >
                      <i />
                      <span>{d.label}</span>
                    </div>
                  ))}
                </div>
                <p className="tl-note">DECISION POINTS (◆) MARK CONTRACTUAL DEADLINES. BARS RE-FLOW LIVE AS TOGGLES CHANGE.</p>
              </div>
            </div>
          </div>
          <div id="inst-readout">{readout}</div>
          <div className="sheet-tag">SHT T-000 · INSTRUMENT SET · REV C</div>
        </div>
      </section>
    </>
  );
}
