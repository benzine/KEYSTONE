"use client";

/**
 * Services — Section 03 · THE JOURNEYS.
 * Six journey cards ride a ring AROUND the morphing gold solid (cube → octa
 * → icosahedron → sphere) in #svc-svg: near cards larger at the bottom of
 * the ring, far cards smaller at the top, connection lines in #svc-conn and
 * the "IN FOCUS" readout below. The ring is projected in JavaScript and
 * emitted as pure 2D transforms (translate + scale), so every engine paints
 * the same orbit; paint order is plain z-index banding. Skipped entirely in
 * simple / reduced mode, exactly like the original's html.simple bail-out.
 */

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useKc } from "./KcProvider";
import { clamp, RAD } from "@/lib/keystone/kc-core";

gsap.registerPlugin(ScrollTrigger);

/* ---- wireframe geometry (exact port of script-07's math) ---- */

type Vec3 = [number, number, number];
interface Geom {
  v: Vec3[];
  e: [number, number][];
}

const PHI = (1 + Math.sqrt(5)) / 2;

function dist(a: Vec3, b: Vec3): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

function edgesByMinDist(v: Vec3[]): [number, number][] {
  let min = 1e9;
  for (let i = 0; i < v.length; i++) {
    for (let j = i + 1; j < v.length; j++) {
      min = Math.min(min, dist(v[i], v[j]));
    }
  }
  const e: [number, number][] = [];
  for (let i = 0; i < v.length; i++) {
    for (let j = i + 1; j < v.length; j++) {
      if (Math.abs(dist(v[i], v[j]) - min) < 1e-6) e.push([i, j]);
    }
  }
  return e;
}

const cube: Vec3[] = [];
[-1, 1].forEach((x) => {
  [-1, 1].forEach((y) => {
    [-1, 1].forEach((z) => {
      cube.push([x * 0.66, y * 0.66, z * 0.66]);
    });
  });
});

const octa: Vec3[] = [
  [1, 0, 0],
  [-1, 0, 0],
  [0, 1, 0],
  [0, -1, 0],
  [0, 0, 1],
  [0, 0, -1],
];

const icoRaw: number[][] = [
  [0, 1, PHI], [0, 1, -PHI], [0, -1, PHI], [0, -1, -PHI],
  [1, PHI, 0], [1, -PHI, 0], [-1, PHI, 0], [-1, -PHI, 0],
  [PHI, 0, 1], [-PHI, 0, 1], [PHI, 0, -1], [-PHI, 0, -1],
];
const ico: Vec3[] = icoRaw.map((v) => {
  const l = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / l, v[1] / l, v[2] / l];
});

/* Sphere: five latitude rings of 12 plus six survey meridians. */
const sphV: Vec3[] = [];
const sphE: [number, number][] = [];
[-60, -30, 0, 30, 60].forEach((lat) => {
  const start = sphV.length;
  const r = Math.cos(lat * RAD);
  const y = Math.sin(lat * RAD);
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2;
    sphV.push([r * Math.cos(a), y, r * Math.sin(a)]);
  }
  for (let k = 0; k < 12; k++) {
    sphE.push([start + k, start + ((k + 1) % 12)]);
  }
});
for (let m = 0; m < 6; m++) {
  const a = (m / 6) * Math.PI * 2;
  const r0 = Math.cos(a);
  const r1 = Math.sin(a);
  const pts: number[] = [];
  [-80, -50, -20, 20, 50, 80].forEach((lat) => {
    const r = Math.cos(lat * RAD);
    const y = Math.sin(lat * RAD);
    pts.push(sphV.push([r * r0, y, r * r1]) - 1);
  });
  for (let k2 = 0; k2 < pts.length - 1; k2++) {
    sphE.push([pts[k2], pts[k2 + 1]]);
  }
}

const GEOMS: Geom[] = [
  { v: cube, e: edgesByMinDist(cube) },
  { v: octa, e: edgesByMinDist(octa) },
  { v: ico, e: edgesByMinDist(ico) },
  { v: sphV, e: sphE },
];

/* The orbit ring's plane, tilted back from the screen: the bottom of the
   ring is nearest the viewer, the top is farthest. 35 degrees gives the
   reference composition's mix of vertical sweep and near/far size spread. */
const TILT = 35 * RAD;
const SIN_TILT = Math.sin(TILT);
const COS_TILT = Math.cos(TILT);

/* Project + rotate a geometry, returning an SVG path string. */
function geomPath(g: Geom, rx: number, ry: number, S: number): string {
  const cy = Math.cos(ry);
  const sy = Math.sin(ry);
  const cx = Math.cos(rx);
  const sx = Math.sin(rx);
  const pts = g.v.map((v) => {
    const X = v[0] * cy + v[2] * sy;
    const Z = -v[0] * sy + v[2] * cy;
    const Y = v[1] * cx - Z * sx;
    const Z2 = v[1] * sx + Z * cx;
    const f = 3.2 / (3.2 - Z2);
    return [X * f * S, -Y * f * S] as [number, number];
  });
  let d = "";
  g.e.forEach((e) => {
    d +=
      "M" + pts[e[0]][0].toFixed(1) + " " + pts[e[0]][1].toFixed(1) +
      "L" + pts[e[1]][0].toFixed(1) + " " + pts[e[1]][1].toFixed(1);
  });
  return d;
}

const TITLES = [
  "THE CUSTOM HOME JOURNEY",
  "THE RENOVATION JOURNEY",
  "THE ADDITION JOURNEY",
  "THE INTERIOR ARCHITECTURE JOURNEY",
  "THE LANDSCAPE JOURNEY",
  "THE INVESTMENT JOURNEY",
];

export default function Services() {
  const { state, reduced } = useKc();
  const rootRef = useRef<HTMLElement>(null);
  /* Re-init the scene when the layout breakpoint is crossed (the original
     only checked html.simple once at load; re-running keeps the orbit
     alive if the viewport grows from narrow back to wide). */
  const [bp, setBp] = useState(0);

  useEffect(() => {
    const mq = window.matchMedia("(max-width:760px)");
    const onChange = () => setBp((v) => v + 1);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const el = rootRef.current;
    const stage = el?.querySelector<HTMLElement>("#svc-stage");
    if (!el || !stage) return;

    /* Original gate: html.classList.contains('simple') — reduced also implies
       simple (KcProvider adds it), but the class may not be applied yet when
       child effects run, so check the flag directly too. */
    const isSimple =
      reduced ||
      document.documentElement.classList.contains("simple") ||
      window.matchMedia("(max-width:760px)").matches;
    if (isSimple) return;

    const KCState = state.current;
    const paths = Array.from(el.querySelectorAll<SVGPathElement>("#svc-svg path"));
    const cards = Array.from(el.querySelectorAll<HTMLElement>(".svc-card"));
    const connG = el.querySelector<SVGGElement>("#svc-conn");
    const orbitE = el.querySelector<SVGEllipseElement>("#orbit-e");
    const linesSvg = el.querySelector<SVGSVGElement>("#svc-lines");
    const readout = el.querySelector<HTMLElement>("#svc-readout");
    const ctx3d = el.querySelector<HTMLElement>("#svc-3d");
    const wrap = el.querySelector<HTMLElement>("#svc-svg-wrap");
    if (
      !connG ||
      !orbitE ||
      !linesSvg ||
      !readout ||
      !ctx3d ||
      !wrap ||
      paths.length < 4 ||
      cards.length === 0
    ) {
      return;
    }

    /* Scene hardening: every property the orbit's correctness depends on is
       pinned here as an INLINE style, written by the same code that animates
       the cards — inline wins the cascade over any stylesheet, so even a
       stale cached CSS file cannot move the lattice plane (z) or re-enable
       the CSS 3D pipeline (perspective) behind this scene's back. The orbit
       itself is computed in JS and emitted as pure 2D transforms below. */
    ctx3d.style.perspective = "none";
    wrap.style.zIndex = "20";
    console.info("[KC] THE JOURNEYS · REV F · ring orbit active");

    /* one connection line per card, center → card */
    const connLines: SVGLineElement[] = cards.map(() => {
      const l = document.createElementNS("http://www.w3.org/2000/svg", "line");
      l.setAttribute("class", "conn");
      connG.appendChild(l);
      return l;
    });

    let frontIdx = 0;

    /* visibility + scroll progress for the section */
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: el,
        start: "top bottom",
        end: "bottom top",
        onToggle: (s) => {
          KCState.vis.svc = s.isActive;
        },
      });
      ScrollTrigger.create({
        trigger: el,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (s) => {
          KCState.svcP = s.progress;
        },
      });
    }, el);

    const drawServices = (t: number): void => {
      const w = stage.clientWidth;
      const h = stage.clientHeight;
      const p = KCState.svcP;
      const bump =
        Math.exp(-Math.pow((p - 0.35) / 0.07, 2)) +
        Math.exp(-Math.pow((p - 0.7) / 0.07, 2));
      const R = (w < 760 ? 150 : clamp(w * 0.23, 200, 330)) + bump * 120;
      const rot = p * 540 + t * 7;
      const B = [0.26, 0.52, 0.78];
      const gi = p < B[0] ? 0 : p < B[1] ? 1 : p < B[2] ? 2 : 3;
      const ops = [0, 0, 0, 0];
      ops[gi] = 1;
      B.forEach((b, k) => {
        const d = Math.abs(p - b);
        if (d < 0.07) {
          ops[k] = Math.max(ops[k], 1 - d / 0.07);
          ops[k + 1] = Math.max(ops[k + 1], d / 0.07);
        }
      });
      const rx = -0.42 + Math.sin(t * 0.3) * 0.07;
      const ry = p * 9 + t * 0.22;
      const scale = 1 + bump * 0.2;

      /* Ring orbit, zero CSS 3D dependence. The cards ride a circle of radius
         R lying in a plane tilted TILT degrees back from the screen, so the
         bottom of the ring is nearest the viewer (cards large) and the top
         is farthest (cards small). Each card's 3D ring position is projected
         HERE — f = PERSP / (PERSP - z) is the standard perspective divide —
         and emitted as translate(x,y) + scale: plain 2D transforms every
         engine composes identically, no 3D rendering context involved at
         all. This is the reference composition: cards orbiting all the way
         AROUND a clearly visible central solid (upper arc + lower arc),
         never a flat single-axis carousel. */
      const PERSP = 1150;

      /* morphing wireframe */
      for (let i = 0; i < 4; i++) {
        if (ops[i] < 0.02) {
          paths[i].setAttribute("opacity", "0");
          continue;
        }
        paths[i].setAttribute("d", geomPath(GEOMS[i], rx, ry, 92 * scale));
        paths[i].setAttribute("opacity", ops[i].toFixed(2));
        paths[i].setAttribute("stroke", i === 3 ? "#C9A962" : "#8C7853");
      }

      /* ring geometry for this frame (TILT fixed at module scope) */
      const zFront = R * SIN_TILT;
      const fFront = PERSP / (PERSP - zFront);
      const fBack = PERSP / (PERSP + zFront);

      /* orbiting cards */
      let best = -2;
      let bestI = 0;
      cards.forEach((card, i) => {
        const a = rot + i * 60;
        const ca = Math.cos(a * RAD);
        const sa = Math.sin(a * RAD);
        const z = ca * R * SIN_TILT; /* + toward viewer, - behind */
        const f = PERSP / (PERSP - z); /* projected size & position */
        const x = sa * R * f; /* ring horizontal offset */
        const y = ca * R * COS_TILT * f; /* + = below center (near) */
        const depth = (ca + 1) / 2;
        card.style.transform =
          "translate(-50%,-50%) translate(" +
          x.toFixed(1) +
          "px," +
          y.toFixed(1) +
          "px) scale(" +
          f.toFixed(4) +
          ")";
        card.style.opacity = (0.22 + 0.78 * depth).toFixed(2);
        /* Explicit paint order, no engine 3D-context sort involved: the card
           sits behind the lattice plane (z < 0, depth < 0.5) while banded
           10-19 and in front of it (z > 0, depth > 0.5) while banded 21-30,
           with the svg wrap at z-index 20 as the fixed z=0 plane — plain
           z-index on positioned siblings, composed identically by every
           engine: rear cards below the gold lattice, front cards above it,
           card-over-card by depth band. */
        card.style.zIndex =
          depth > 0.5
            ? String(21 + Math.round((depth - 0.5) * 18))
            : String(10 + Math.round(depth * 18));
        card.style.borderColor =
          depth > 0.85 ? "rgba(201,169,98,.8)" : "rgba(140,120,83,.4)";
        card.style.setProperty("--tint", ((1 - depth) * 0.22).toFixed(3));
        if (depth > best) {
          best = depth;
          bestI = i;
        }
      });

      /* front-card readout */
      if (bestI !== frontIdx) {
        frontIdx = bestI;
        readout.textContent =
          "IN FOCUS · 0" + (frontIdx + 1) + " · " + TITLES[frontIdx];
        gsap.fromTo(readout, { opacity: 0.2 }, { opacity: 1, duration: 0.5 });
      }

      /* dotted ring guide: an ellipse hugging the projected card path —
         horizontal extremes at ±R, vertical extremes at ±R·cosTILT scaled by
         the front/back projection factors, its center nudged down by the
         front/back asymmetry exactly like the real projected ring. */
      linesSvg.setAttribute("viewBox", "0 0 " + w + " " + h);
      orbitE.setAttribute("cx", String(w / 2));
      orbitE.setAttribute(
        "cy",
        (h / 2 + (R * COS_TILT * (fFront - fBack)) / 2).toFixed(1),
      );
      orbitE.setAttribute("rx", R.toFixed(1));
      orbitE.setAttribute("ry", (R * COS_TILT * ((fFront + fBack) / 2)).toFixed(1));
      orbitE.setAttribute("stroke-dashoffset", (-rot * 1.2).toFixed(1));
      const sr = stage.getBoundingClientRect();
      connLines.forEach((l, i) => {
        const r = cards[i].getBoundingClientRect();
        l.setAttribute("x1", String(w / 2));
        l.setAttribute("y1", String(h / 2));
        l.setAttribute("x2", (r.left + r.width / 2 - sr.left).toFixed(1));
        l.setAttribute("y2", (r.top + r.height / 2 - sr.top).toFixed(1));
        l.setAttribute(
          "opacity",
          (parseFloat(cards[i].style.opacity || "1") * 0.8).toFixed(2),
        );
        l.setAttribute("stroke-dashoffset", (-rot * 1.6).toFixed(1));
      });
    };

    const onTicker = (t: number) => {
      if (KCState.vis.svc && !KCState.modalOpen) {
        drawServices(t);
      }
    };
    gsap.ticker.add(onTicker);

    return () => {
      gsap.ticker.remove(onTicker);
      connLines.forEach((l) => l.remove());
      ctx.revert();
    };
  }, [state, reduced, bp]);

  return (
    <section
      ref={rootRef}
      id="sec-services"
      className="sec"
      data-name="THE JOURNEYS"
      data-index="03"
      data-accent="#8C7853"
      data-theme="dark"
    >
  <div className="stage stage-dark" id="svc-stage">
    <div className="stage-head">
      <div className="sec-label light">03 · THE JOURNEYS</div>
      <h2>Six ways to begin.</h2>
      <p>Structure and beauty, held to one standard, whatever the complexity.</p>
    </div>
    <svg id="svc-lines" aria-hidden="true"><ellipse className="orbit-e" id="orbit-e" cx="500" cy="500" rx="300" ry="60" /><g id="svc-conn"></g></svg>
    <div id="svc-3d">
      <div id="svc-svg-wrap"><div id="svc-glow"></div>
        <svg id="svc-svg" viewBox="-170 -170 340 340" aria-hidden="true"><path /><path /><path /><path /></svg>
      </div>
      <div className="svc-card" data-hover><div className="svc-num">01</div><svg width="26" height="26" viewBox="0 0 26 26" fill="none" strokeWidth="1.3"><path d="M3 12 L13 4 L23 12 M6 10 V21 H20 V10 M11 21 V15 H15 V21" /></svg><h3>The Custom Home Journey</h3><p className="svc-line">From empty lot to move-in day.</p><p className="svc-desc">Architecture and construction under one accountable hand, from first sketch to final key.</p></div>
      <div className="svc-card" data-hover><div className="svc-num">02</div><svg width="26" height="26" viewBox="0 0 26 26" fill="none" strokeWidth="1.3"><rect x="4" y="4" width="12" height="12" /><rect x="10" y="10" width="12" height="12" /></svg><h3>The Renovation Journey</h3><p className="svc-line">Honoring the past, designing the future.</p><p className="svc-desc">Surgical updates to beloved structures. New systems and light thread through old bones without a scar.</p></div>
      <div className="svc-card" data-hover><div className="svc-num">03</div><svg width="26" height="26" viewBox="0 0 26 26" fill="none" strokeWidth="1.3"><rect x="5" y="5" width="16" height="16" /><path d="M13 9 V17 M9 13 H17" /></svg><h3>The Addition Journey</h3><p className="svc-line">More house, same calm.</p><p className="svc-desc">Additions that read as if always intended, matching the original rhythm and roofline, then quietly exceeding both.</p></div>
      <div className="svc-card" data-hover><div className="svc-num">04</div><svg width="26" height="26" viewBox="0 0 26 26" fill="none" strokeWidth="1.3"><path d="M13 3 V9 M7 14 L13 8 L19 14 Z" /><circle cx="13" cy="18" r="1.6" /><path d="M8 21 L6 23 M18 21 L20 23 M13 21 V24" /></svg><h3>The Interior Architecture Journey</h3><p className="svc-line">Where materials meet light.</p><p className="svc-desc">Millwork and daylight choreographed together, interiors planned with the same rigor as the envelope.</p></div>
      <div className="svc-card" data-hover><div className="svc-num">05</div><svg width="26" height="26" viewBox="0 0 26 26" fill="none" strokeWidth="1.3"><path d="M13 22 V10 M13 12 C8 10 7 5 12 4 C14 7 14 10 13 12 M13 12 C18 10 19 5 14 4" /><path d="M5 22 H21" /></svg><h3>The Landscape Journey</h3><p className="svc-line">Extending the home into the land.</p><p className="svc-desc">Terraces and native planting that carry the building's lines out past the last wall.</p></div>
      <div className="svc-card" data-hover><div className="svc-num">06</div><svg width="26" height="26" viewBox="0 0 26 26" fill="none" strokeWidth="1.3"><path d="M4 21 H9 V17 H13 V13 H17 V9 H21" /><path d="M17 5 L21 9 M21 5 L21 9" /></svg><h3>The Investment Journey</h3><p className="svc-line">Building value that compounds.</p><p className="svc-desc">Resale modeling and lifecycle costing on every decision. A home engineered to appreciate in every sense.</p></div>
    </div>
    <div id="svc-readout">IN FOCUS · 01 · THE CUSTOM HOME JOURNEY</div>
    <div className="sheet-tag">SHT A-201 · JOURNEYS · REV F</div>
  </div>
</section>
  );
}
