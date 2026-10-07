"use client";

/**
 * Ledger — Section 02 · THE LEDGER.
 *
 * The company history is an arch under construction. Scroll sets each
 * era in place, a stone craned up from beyond the frame's sill rises
 * into its joint, settles with a recoil and a dust burst, and takes
 * its engraved years.
 * The digit-column year counter rolls continuously from 2004 to 2026
 * as the masonry rises. When the eighth voussoir is set, the keystone
 * drops from above, the timber centering is struck and falls away, the
 * gold thrust line draws through the load path, and the inscription
 * appears inside the opening. The arch stands on its own.
 *
 * Simple / reduced modes keep the finished arch and a readable ledger
 * list, exactly like the other stage sections.
 */

import { useEffect, useRef, type CSSProperties } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { useKc } from "./KcProvider";
import {
  LEDGER,
  LG_ORDER,
  voussoirGeo,
  keystoneGeo,
  stoneDetail,
  keystoneDetail,
  pierBlocks,
  groundHatches,
  THRUST_D,
  CENTER_D,
} from "@/lib/keystone/ledger";

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

const VOUS = 8;
const TOTAL = 100;
const BAND0 = 5;
const BAND = 9.5;
const LOCK = BAND0 + VOUS * BAND;
/** compression flash order, crown outward */
const FLASH_ORDER = [8, 6, 7, 4, 5, 2, 3, 0, 1];

const STONE_GEOS = Array.from({ length: VOUS }, (_, i) => voussoirGeo(i));
const STONE_DET = Array.from({ length: VOUS }, (_, i) => stoneDetail(i));
const KEY_GEO = keystoneGeo();
const KEY_DET = keystoneDetail();
const PIER_L = pierBlocks(-1);
const PIER_R = pierBlocks(1);
const HATCHES = groundHatches();
/* the yard sits below the frame line: stones wait out of sight and
   rise into the picture as if craned past the camera sill */
const FLOOR = 690;
/* dust hanging in the light shaft, deterministic so server and
   client render identical markup */
const MOTES = Array.from({ length: 14 }, (_, i) => {
  const s = -170 + i * 32 + ((i * 29) % 37) * 0.6;
  const across = ((i * 71) % 140) - 70 + Math.sin(i * 2.1) * 22;
  return {
    x: +(560 + 0.42 * s + 0.91 * across).toFixed(1),
    y: +(330 + 0.91 * s - 0.42 * across).toFixed(1),
    r: +(0.9 + ((i * 17) % 13) / 11).toFixed(2),
  };
});
/* keystone thud dust bursts, crown + both haunches */
const KEY_DUST = [
  [600, 214],
  [432, 430],
  [768, 430],
];

/* default year shown before the effect takes over (and in simple
   mode, where the arch renders fully built) */
const REST_YEAR = "2026";

export default function Ledger() {
  const { reduced } = useKc();
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    /* Simple mode (narrow viewport / reduced motion): the static
       finished arch carries the section, CSS lays the eras out as a
       list. Same bail-out contract as the other stage sections. */
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const mqNarrow = window.matchMedia("(max-width:760px)").matches;
    if (
      mqNarrow ||
      prefersReduced ||
      reduced ||
      document.documentElement.classList.contains("simple")
    ) {
      return;
    }

    const stones = Array.from(
      el.querySelectorAll<SVGGElement>(".lg-stone[data-stone]"),
    );
    const flashes = Array.from(
      el.querySelectorAll<SVGPathElement>(".lg-flash"),
    );
    const engraves = Array.from(
      el.querySelectorAll<SVGTextElement>(".lg-engrave"),
    );
    const dusts = Array.from(
      el.querySelectorAll<SVGCircleElement>(".lg-dust[data-stone]"),
    );
    const stacks = Array.from(
      el.querySelectorAll<HTMLElement>(".lc-stack"),
    );
    const eras = Array.from(
      el.querySelectorAll<HTMLElement>(".lg-era"),
    );
    const stockEl = el.querySelector<SVGTextElement>("#lg-stock");
    const thrust = el.querySelector<SVGPathElement>("#lg-thrust");
    if (
      stones.length < 9 ||
      flashes.length < 9 ||
      engraves.length < 9 ||
      dusts.length < 8 ||
      stacks.length !== 4 ||
      eras.length !== 10 ||
      !thrust
    ) {
      return;
    }

    let curEra = 0;
    let curYear = 2004;

    /* hide the thrust line before the timeline owns it */
    const thrustLen = thrust.getTotalLength();
    thrust.style.strokeDasharray = String(thrustLen);
    thrust.style.strokeDashoffset = String(thrustLen);

    const ctx = gsap.context(() => {
      /* entrance, on approach — the panel is fully set before the pin */
      gsap.from("#ledger-h2", {
        opacity: 0,
        y: 26,
        duration: 1.1,
        ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 72%" },
      });
      gsap.from("#ledger-year", {
        opacity: 0,
        duration: 0.9,
        delay: 0.12,
        scrollTrigger: { trigger: el, start: "top 72%" },
      });
      gsap.from("#ledger-eras", {
        opacity: 0,
        duration: 0.9,
        delay: 0.26,
        scrollTrigger: { trigger: el, start: "top 72%" },
      });
      gsap.from("#lg-stock", {
        opacity: 0,
        duration: 0.8,
        delay: 0.2,
        scrollTrigger: { trigger: el, start: "top 72%" },
      });

      /* dust hanging in the shaft, drifting on its own clock and
         gated to the section's active range so nothing runs
         offscreen */
      const motes = Array.from(
        el.querySelectorAll<SVGCircleElement>(".lg-mote"),
      );
      if (motes.length) {
        gsap.to("#lg-motes", {
          opacity: 1,
          duration: 2.4,
          ease: "power1.inOut",
          scrollTrigger: { trigger: el, start: "top 60%" },
        });
        const drift = gsap.timeline({ paused: true });
        motes.forEach((m, i) => {
          drift.to(
            m,
            {
              y: 26 + (i % 5) * 6,
              x: 10 + (i % 3) * 5,
              duration: 7 + (i % 6) * 1.4,
              repeat: -1,
              yoyo: true,
              ease: "sine.inOut",
              delay: i * 0.31,
            },
            0,
          );
          drift.to(
            m,
            {
              opacity: 0.14 + ((i * 23) % 42) / 100,
              duration: 3 + (i % 4),
              repeat: -1,
              yoyo: true,
              ease: "sine.inOut",
              delay: i * 0.47,
            },
            0,
          );
        });
        ScrollTrigger.create({
          trigger: el,
          start: "top 85%",
          end: "bottom top",
          onToggle: (self) => (self.isActive ? drift.play() : drift.pause()),
        });
      }

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.8,
          onUpdate: (self) => {
            const p = self.progress * 100;
            let idx = 0;
            if (p >= LOCK) idx = 9;
            else if (p >= BAND0) idx = 1 + Math.floor((p - BAND0) / BAND);
            if (idx !== curEra) {
              curEra = idx;
              eras.forEach((node, i) => node.classList.toggle("on", i === idx));
              if (stockEl) {
                const placed = Math.max(0, Math.min(VOUS, idx - 1));
                stockEl.textContent = "STOCK · " + (VOUS - placed);
              }
            }
            let year: number;
            if (p < BAND0) year = 2004;
            else if (p < LOCK) {
              const k = Math.min(VOUS - 1, Math.floor((p - BAND0) / BAND));
              const local = (p - BAND0 - k * BAND) / BAND;
              year = LEDGER[k].y0 + local * (LEDGER[k].y1 - LEDGER[k].y0);
            } else {
              year = 2024 + ((p - LOCK) / (TOTAL - LOCK)) * 2;
            }
            const yr = Math.max(2004, Math.min(2026, Math.round(year)));
            if (yr !== curYear) {
              curYear = yr;
              const digits = String(yr).padStart(4, "0");
              stacks.forEach((c, i) =>
                gsap.set(c, { y: `-${+digits[i] * 1.1}em` }),
              );
            }
          },
        },
      });

      /* the camera: one slow push-in across the whole build, a settle
         that crops the ground by a hair as the arch completes. the
         light counter-drifts to hold the parallax. */
      tl.fromTo(
        "#lg-scene",
        { scale: 1 },
        { scale: 1.045, duration: TOTAL, ease: "none", svgOrigin: "600 358" },
        0,
      );
      tl.fromTo(
        "#lg-light",
        { x: 24 },
        { x: -24, duration: TOTAL, ease: "none" },
        0,
      );

      /* the light comes on with the thrust: the paper warms as the
         load path proves itself */
      tl.fromTo(
        "#lg-warm",
        { opacity: 0 },
        { opacity: 0.55, duration: 11, ease: "none" },
        LOCK + 7.4,
      );

      /* ---- the eight voussoirs ---- */
      for (let k = 0; k < VOUS; k++) {
        const stone = stones[k];
        const geo = STONE_GEOS[k];
        const dx = (k % 2 === 0 ? -1 : 1) * (30 + ((k * 13) % 17));
        const dy = FLOOR - geo.centroid[1];
        const pos = BAND0 + k * BAND;
        const fly = 4.4;

        gsap.set(stone, {
          x: dx,
          y: dy,
          rotation: k % 2 === 0 ? -7 : 6,
          transformOrigin: "center center",
        });
        tl.to(
          stone,
          {
            motionPath: {
              path: [
                { x: dx, y: dy },
                { x: dx * 0.45, y: dy * 0.4 },
                { x: 0, y: 0 },
              ],
              curviness: 1.1,
            },
            duration: fly,
            ease: "power1.inOut",
          },
          pos,
        );
        tl.to(
          stone,
          { rotation: 0, duration: fly, ease: "power1.inOut" },
          pos,
        );

        /* settle, recoil, dust */
        tl.to(
          "#lg-arch",
          { y: 2.5, duration: 0.45, ease: "power2.in", svgOrigin: "600 440" },
          pos + fly,
        );
        tl.to(
          "#lg-arch",
          { y: 0, duration: 1.1, ease: "elastic.out(1, 0.55)", svgOrigin: "600 440" },
          pos + fly + 0.45,
        );
        tl.fromTo(
          dusts[k],
          { attr: { r: 3 }, opacity: 0.75 },
          { attr: { r: 26 }, opacity: 0, duration: 1.7, ease: "power1.out" },
          pos + fly,
        );

        /* engraved years appear once the stone is set */
        tl.from(
          engraves[k],
          { opacity: 0, duration: 1.6, ease: "power1.out" },
          pos + fly + 0.7,
        );
      }

      /* ---- the keystone, the thud, the strike, the thrust ---- */
      const key = stones[8];
      gsap.set(key, { y: -130, opacity: 0 });

      tl.to(key, { opacity: 1, duration: 0.9, ease: "power1.in" }, LOCK + 3.0)
        .to(key, { y: 0, duration: 4.2, ease: "power2.in" }, LOCK + 0.9)
        /* the thud */
        .to("#lg-arch", { y: 4, duration: 0.35, ease: "power3.in", svgOrigin: "600 440" }, LOCK + 5.1)
        .to("#lg-arch", { y: 0, duration: 1.5, ease: "elastic.out(1, 0.5)", svgOrigin: "600 440" }, LOCK + 5.45)
        .fromTo(
          ".lg-dust[data-key]",
          { attr: { r: 4 }, opacity: 0.85 },
          { attr: { r: 34 }, opacity: 0, duration: 1.9, ease: "power1.out" },
          LOCK + 5.1,
        )
        /* centering struck, the arch takes its own weight */
        .to("#lg-centering", { y: 46, opacity: 0, duration: 1.9, ease: "power2.in" }, LOCK + 5.6)
        /* the thrust line draws through the load path */
        .to(thrust, { strokeDashoffset: 0, duration: 2.2, ease: "none" }, LOCK + 7)
        /* compression flashes run from the crown outward */
        .fromTo(
          FLASH_ORDER.map((i) => flashes[i]),
          { opacity: 0 },
          { opacity: 0.62, duration: 0.4, ease: "power1.out", stagger: 0.3 },
          LOCK + 7.3,
        )
        .to(
          FLASH_ORDER.map((i) => flashes[i]),
          { opacity: 0, duration: 0.7, ease: "power1.out", stagger: 0.3 },
          LOCK + 8.05,
        )
        /* the inscription inside the opening */
        .from("#lg-final", { opacity: 0, y: 12, duration: 1.8, ease: "power2.out" }, LOCK + 12.2)
        /* pin the timeline length to the band math */
        .set({}, {}, TOTAL);
    }, el);

    return () => {
      ctx.revert();
    };
  }, [reduced]);

  return (
    <section
      ref={rootRef}
      id="sec-ledger"
      className="sec"
      data-name="THE LEDGER"
      data-index="02"
      data-accent="#8C7853"
      data-theme="light"
    >
      <div className="stage" id="ledger-stage">
        <div id="ledger-corner">
          <div className="sec-label">02 · THE LEDGER</div>
        </div>

        <div id="ledger-panel">
          <h2 id="ledger-h2">
            Twenty-two years,
            <br />
            set in stone.
          </h2>
          <div className="lc-eyebrow" aria-hidden="true">LEDGER YEAR</div>
          <div id="ledger-year" aria-hidden="true">
            {REST_YEAR.split("").map((ch, i) => (
              <div className="lc-col" key={i}>
                <div
                  className="lc-stack"
                  style={{ transform: `translateY(-${+ch * 1.1}em)` }}
                >
                  {Array.from({ length: 10 }, (_, n) => (
                    <span className="lc-d" key={n}>
                      {n}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <span className="sr-only">The years run from 2004 to 2026.</span>
          <div id="ledger-eras">
            <div className="lg-era on" data-era="0">
              <div className="lg-eyebrow">THE LEDGER · BOULDER CO</div>
              <h3 className="lg-title">The years become masonry.</h3>
              <p className="lg-story">
                Every era of the studio is one stone in this arch. Scroll
                to set the first one and the counter begins to run.
              </p>
              <div className="lg-stat">8 VOUSSOIRS · 1 KEYSTONE</div>
            </div>
            {LEDGER.map((era, k) => (
              <div className="lg-era" data-era={k + 1} key={era.eyebrow}>
                <div className="lg-eyebrow">{era.eyebrow}</div>
                <h3 className="lg-title">{era.title}</h3>
                <p className="lg-story">{era.story}</p>
                <div className="lg-stat">{era.stat}</div>
              </div>
            ))}
          </div>
        </div>

        <svg id="ledger-arch" viewBox="210 96 780 524" aria-hidden="true">
          <defs>
            {/* one gradient per stone, the axis runs extrados to
                intrados in the stone's own user space so the shading
                rides the flight transforms */}
            {STONE_DET.map((sd, i) => (
              <linearGradient
                key={i}
                id={`lg-sg${i}`}
                gradientUnits="userSpaceOnUse"
                x1={sd.g1[0]}
                y1={sd.g1[1]}
                x2={sd.g2[0]}
                y2={sd.g2[1]}
                style={
                  {
                    "--s-hi": sd.hi,
                    "--s-mid": sd.mid,
                    "--s-lo": sd.lo,
                    "--s-hi-d": sd.hiD,
                    "--s-mid-d": sd.midD,
                    "--s-lo-d": sd.loD,
                  } as CSSProperties
                }
              >
                <stop offset="0" className="lg-gh" />
                <stop offset=".52" className="lg-gm" />
                <stop offset="1" className="lg-gl" />
              </linearGradient>
            ))}
            <linearGradient
              id="lg-sg8"
              gradientUnits="userSpaceOnUse"
              x1={KEY_DET.g1[0]}
              y1={KEY_DET.g1[1]}
              x2={KEY_DET.g2[0]}
              y2={KEY_DET.g2[1]}
              style={
                {
                  "--s-hi": KEY_DET.hi,
                  "--s-mid": KEY_DET.mid,
                  "--s-lo": KEY_DET.lo,
                  "--s-hi-d": KEY_DET.hiD,
                  "--s-mid-d": KEY_DET.midD,
                  "--s-lo-d": KEY_DET.loD,
                } as CSSProperties
              }
            >
              <stop offset="0" className="lg-gh" />
              <stop offset=".52" className="lg-gm" />
              <stop offset="1" className="lg-gl" />
            </linearGradient>
            {/* coursed pier blocks, each block shades top to bottom */}
            <linearGradient id="lg-pier-g" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" className="lg-ph" />
              <stop offset=".55" className="lg-pm" />
              <stop offset="1" className="lg-pl" />
            </linearGradient>
            <radialGradient id="lg-mott-g">
              <stop offset="0" className="lg-mh" />
              <stop offset="1" className="lg-ml" />
            </radialGradient>
            <radialGradient id="lg-shadow-g">
              <stop offset="0" className="lg-shc" />
              <stop offset="1" className="lg-sho" />
            </radialGradient>
            {/* paper vignette over the drawing, elliptical falloff */}
            <radialGradient
              id="lg-vig"
              gradientUnits="userSpaceOnUse"
              cx="600"
              cy="358"
              r="560"
              gradientTransform="translate(600 358) scale(1 0.74) translate(-600 -358)"
            >
              <stop offset="0" className="lg-v1" />
              <stop offset=".55" className="lg-v1" />
              <stop offset="1" className="lg-v2" />
            </radialGradient>
            {/* stone grain, one raster-cached noise tile */}
            <pattern
              id="lg-grain"
              width="140"
              height="140"
              patternUnits="userSpaceOnUse"
            >
              <rect
                x="0"
                y="0"
                width="140"
                height="140"
                filter="url(#lg-noise)"
              />
            </pattern>
            <filter
              id="lg-noise"
              x="0"
              y="0"
              width="140"
              height="140"
              filterUnits="userSpaceOnUse"
              colorInterpolationFilters="sRGB"
            >
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.5"
                numOctaves="2"
                seed="17"
                stitchTiles="stitch"
              />
              <feColorMatrix
                type="matrix"
                values="0 0 0 0 0.4  0 0 0 0 0.37  0 0 0 0 0.31  0 0 0 0.55 0"
              />
            </filter>
            <clipPath id="lg-clip">
              <rect x="210" y="96" width="780" height="524" />
            </clipPath>
            <radialGradient id="lg-dust-g">
              <stop offset="0" stopColor="#CFC9BB" stopOpacity=".9" />
              <stop offset="1" stopColor="#CFC9BB" stopOpacity="0" />
            </radialGradient>
            {/* the light shaft, a soft column entering the frame from
                the upper left and sinking through the crown */}
            <radialGradient id="lg-shaft-g">
              <stop offset="0" className="lg-swc" />
              <stop offset=".5" className="lg-swm" />
              <stop offset="1" className="lg-swx" />
            </radialGradient>
            <radialGradient id="lg-shaft-c">
              <stop offset="0" className="lg-cwc" />
              <stop offset=".55" className="lg-cwm" />
              <stop offset="1" className="lg-cwx" />
            </radialGradient>
            {/* ground haze, aerial perspective at the piers' feet */}
            <radialGradient id="lg-fog-g">
              <stop offset="0" className="lg-fgc" />
              <stop offset="1" className="lg-fgx" />
            </radialGradient>
            {/* the warm grade that arrives with the thrust line */}
            <radialGradient
              id="lg-warm-g"
              gradientUnits="userSpaceOnUse"
              cx="600"
              cy="330"
              r="430"
            >
              <stop offset="0" className="lg-wc" />
              <stop offset="1" className="lg-wx" />
            </radialGradient>
            {/* key-light wash, upper left, matching the sitewide light */}
            <radialGradient id="lg-wash-g">
              <stop offset="0" className="lg-wac" />
              <stop offset="1" className="lg-wax" />
            </radialGradient>
          </defs>

          {/* the light: key wash + shaft, behind the masonry */}
          <g id="lg-light" clipPath="url(#lg-clip)">
            <ellipse
              className="lg-wash"
              cx="320"
              cy="170"
              rx="330"
              ry="220"
              fill="url(#lg-wash-g)"
            />
            <ellipse
              className="lg-shaft"
              cx="560"
              cy="330"
              rx="150"
              ry="500"
              transform="rotate(-24.8 560 330)"
              fill="url(#lg-shaft-g)"
            />
            <ellipse
              className="lg-shaft lg-shaft-core"
              cx="560"
              cy="330"
              rx="64"
              ry="330"
              transform="rotate(-24.8 560 330)"
              fill="url(#lg-shaft-c)"
            />
          </g>

          {/* the scene, clipped to the cinema frame */}
          <g id="lg-scene" clipPath="url(#lg-clip)">
          {/* ground + datum */}
          <g id="lg-ground">
            <line x1="216" y1="600" x2="984" y2="600" className="lg-ground-line" />
            {HATCHES.map((h, i) => (
              <line
                key={i}
                x1={h[0]}
                y1={h[1]}
                x2={h[0] - 9}
                y2={h[1] + 13}
                className="lg-hatch"
              />
            ))}
            <line x1="280" y1="440" x2="920" y2="440" className="lg-datum" />
            <text x="856" y="429" className="lg-datum-t">DATUM ±0.00</text>
            <text
              x="958"
              y="586"
              textAnchor="end"
              className="lg-stock"
              id="lg-stock"
            >
              STOCK · 8
            </text>
          </g>

          {/* ground contact, the masonry sits on the paper */}
          <g id="lg-shadow">
            <ellipse className="lg-gsh" cx="600" cy="599" rx="330" ry="14" />
            <ellipse className="lg-gsh2" cx="600" cy="597" rx="168" ry="10" />
            <ellipse className="lg-gsh3" cx="359" cy="598" rx="95" ry="8" />
            <ellipse className="lg-gsh3" cx="841" cy="598" rx="95" ry="8" />
          </g>

          {/* ground haze behind the piers, distance in the air */}
          <g id="lg-fog">
            <ellipse className="lg-fog" cx="420" cy="596" rx="250" ry="30" />
            <ellipse className="lg-fog" cx="790" cy="598" rx="270" ry="34" />
          </g>

          {/* piers, the ground was here first */}
          <g id="lg-piers">
            {[...PIER_L, ...PIER_R].map((b, i) => (
              <g className="lg-pierg" key={i}>
                <rect
                  className="lg-pier"
                  x={b.x}
                  y={b.y}
                  width={b.w}
                  height={b.h}
                />
                <rect
                  className={`lg-pier-tint${b.tint >= 0 ? " pos" : ""}`}
                  x={b.x}
                  y={b.y}
                  width={b.w}
                  height={b.h}
                  opacity={Math.abs(b.tint)}
                />
                <rect
                  className="lg-pier-grain"
                  x={b.x}
                  y={b.y}
                  width={b.w}
                  height={b.h}
                />
                <rect
                  className="lg-pier-ao"
                  x={b.x}
                  y={b.y}
                  width={b.w}
                  height={5.5}
                />
                <line
                  className="lg-pier-top"
                  x1={b.x}
                  y1={b.y}
                  x2={b.x + b.w}
                  y2={b.y}
                />
                <line
                  className="lg-pier-bot"
                  x1={b.x}
                  y1={b.y + b.h}
                  x2={b.x + b.w}
                  y2={b.y + b.h}
                />
                <line
                  className="lg-pier-left"
                  x1={b.x}
                  y1={b.y}
                  x2={b.x}
                  y2={b.y + b.h}
                />
              </g>
            ))}
          </g>

          {/* timber centering, struck after the keystone */}
          <g id="lg-centering">
            <path d={CENTER_D} className="lg-center-arc" />
            <line x1="456" y1="296" x2="456" y2="600" className="lg-prop" />
            <line x1="744" y1="296" x2="744" y2="600" className="lg-prop" />
          </g>

          {/* the arch itself, cut limestone */}
          <g id="lg-arch">
            {STONE_GEOS.map((g, i) => {
              const sd = STONE_DET[i];
              return (
                <g className="lg-stone" data-stone={i} key={i}>
                  <path
                    className="lg-body"
                    d={g.d}
                    style={{ fill: `url(#lg-sg${i})` }}
                  />
                  {sd.mottle.map((m, j) => (
                    <ellipse
                      key={j}
                      className="lg-mott"
                      cx={m.cx}
                      cy={m.cy}
                      rx={m.rx}
                      ry={m.ry}
                      transform={`rotate(${m.a} ${m.cx} ${m.cy})`}
                    />
                  ))}
                  <path className="lg-bed" d={sd.bed} />
                  <path className="lg-grain" d={g.d} />
                  <path className="lg-ao" d={sd.joint} />
                  <path className="lg-ao2" d={sd.joint} />
                  <path className="lg-arris-in" d={sd.arrisIn} />
                  <path
                    className="lg-arris-out"
                    d={sd.arrisOut}
                    style={{ "--ao": sd.ao } as CSSProperties}
                  />
                  <path className="lg-flash" d={g.d} />
                  <g
                    className="lg-engrave"
                    transform={`rotate(${g.angle} ${g.centroid[0]} ${g.centroid[1]})`}
                  >
                    <text
                      className="lg-eng-sh"
                      x={g.centroid[0]}
                      y={g.centroid[1] + 1.4}
                    >
                      {LEDGER[i].engrave}
                    </text>
                    <text className="lg-eng-t" x={g.centroid[0]} y={g.centroid[1]}>
                      {LEDGER[i].engrave}
                    </text>
                  </g>
                </g>
              );
            })}
            <g className="lg-stone lg-key" data-stone="8">
              <path
                className="lg-body lg-key-body"
                d={KEY_GEO.d}
                style={{ fill: "url(#lg-sg8)" }}
              />
              {KEY_DET.mottle.map((m, j) => (
                <ellipse
                  key={j}
                  className="lg-mott"
                  cx={m.cx}
                  cy={m.cy}
                  rx={m.rx}
                  ry={m.ry}
                  transform={`rotate(${m.a} ${m.cx} ${m.cy})`}
                />
              ))}
              <path className="lg-bed" d={KEY_DET.bed} />
              <path className="lg-grain" d={KEY_GEO.d} />
              <path className="lg-ao" d={KEY_DET.joint} />
              <path className="lg-ao2" d={KEY_DET.joint} />
              <path className="lg-arris-in" d={KEY_DET.arrisIn} />
              <path
                className="lg-arris-out"
                d={KEY_DET.arrisOut}
                style={{ "--ao": KEY_DET.ao } as CSSProperties}
              />
              <path className="lg-flash" d={KEY_GEO.d} />
              {/* the chiseled mark, pressed in and gilded */}
              <path
                className="lg-km-cut"
                d="M600 162.4 L609.6 172 L600 181.6 L590.4 172 Z"
              />
              <path className="lg-km-b" d="M600 180 L608 172 L592 172 Z" />
              <path className="lg-km-a" d="M600 164 L608 172 L592 172 Z" />
              <path className="lg-km-glint" d="M600 164.1 L592.6 171.4" />
              <g className="lg-engrave">
                <text className="lg-eng-sh" x="600" y="203.4">
                  {LEDGER[8].engrave}
                </text>
                <text className="lg-eng-t" x="600" y="202">
                  {LEDGER[8].engrave}
                </text>
              </g>
            </g>
          </g>

          {/* dust bursts at the joints */}
          <g id="lg-dusts">
            {STONE_GEOS.map((g, i) => (
              <circle
                key={i}
                className="lg-dust"
                data-stone={i}
                cx={g.centroid[0]}
                cy={g.centroid[1]}
                r="3"
              />
            ))}
            {KEY_DUST.map((d, i) => (
              <circle
                key={`k${i}`}
                className="lg-dust"
                data-key={i}
                cx={d[0]}
                cy={d[1]}
                r="4"
              />
            ))}
          </g>

          {/* the line of thrust, drawn once the arch stands */}
          <path id="lg-thrust" d={THRUST_D} className="lg-thrust" />

          {/* the inscription inside the opening */}
          <g id="lg-final">
            <text x="600" y="512" textAnchor="middle" className="lg-final-t">
              THE ARCH STANDS
            </text>
            <text x="600" y="542" textAnchor="middle" className="lg-final-s">
              CENTERING STRUCK · THRUST HOLDS · 2004 · 2026
            </text>
          </g>

          {/* a sliver of foreground haze at the sill, the rising
              stones pass through it on their way up */}
          <ellipse
            className="lg-fog lg-fog-fg"
            cx="600"
            cy="592"
            rx="220"
            ry="20"
          />
          </g>

          {/* dust motes hanging in the shaft */}
          <g id="lg-motes" clipPath="url(#lg-clip)">
            {MOTES.map((m, i) => (
              <circle
                key={i}
                className="lg-mote"
                cx={m.x}
                cy={m.y}
                r={m.r}
              />
            ))}
          </g>

          {/* atmosphere, the drawing sits in the paper */}
          <g id="lg-atmos" clipPath="url(#lg-clip)">
            <rect
              className="lg-agrain"
              x="210"
              y="96"
              width="780"
              height="524"
              fill="url(#lg-grain)"
            />
            <rect
              id="lg-warm"
              x="210"
              y="96"
              width="780"
              height="524"
              fill="url(#lg-warm-g)"
              opacity="0"
            />
            <rect
              className="lg-avig"
              x="210"
              y="96"
              width="780"
              height="524"
              fill="url(#lg-vig)"
            />
          </g>
        </svg>

        <div id="ledger-sheet">SHT B-102 · LEDGER OF YEARS · REV A</div>
      </div>
    </section>
  );
}
