"use client";

/**
 * Preloader — Sheet 00 · THE OVERTURE.
 *
 * A drafted arch assembles itself while the site settles: the centering
 * guides fade onto the sheet, the piers land, voussoirs rise pair by
 * pair from the springs, and once fonts and the window load are in, the
 * keystone drops, the centering is struck, the gold line of thrust draws
 * down through the masonry, and the wordmark tracks in. The curtain then
 * lifts over the hero, whose letter-rise entrance is gated to the same
 * beat (lib/keystone/boot.ts) so the reveal arrives already in motion.
 *
 * Same-session reloads run an abbreviated cut. Reduced motion gets the
 * locked arch and wordmark as a brief static card that simply fades.
 * A hard cap keeps a stalled asset from ever trapping the visitor.
 */

import { useEffect, useId, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useKc } from "./KcProvider";
import { markBooted } from "@/lib/keystone/boot";

gsap.registerPlugin(ScrollTrigger);

/* ------------------------------------------------------------------ */
/* arch geometry — one semicircular ring of cut stone                  */
/* ------------------------------------------------------------------ */

const CX = 160;
const CY = 148;
const RI = 50;
const RO = 72;

const pt = (deg: number, r: number): [number, number] => {
  const rad = (deg * Math.PI) / 180;
  return [CX + r * Math.cos(rad), CY - r * Math.sin(rad)];
};

/** annulus wedge between two angles; joints baked into the endpoints */
const wedge = (aHi: number, aLo: number): string => {
  const f = (n: number) => n.toFixed(2);
  const [x0, y0] = pt(aHi, RO);
  const [x1, y1] = pt(aLo, RO);
  const [x2, y2] = pt(aLo, RI);
  const [x3, y3] = pt(aHi, RI);
  return `M${f(x0)} ${f(y0)} A${RO} ${RO} 0 0 1 ${f(x1)} ${f(y1)} L${f(x2)} ${f(y2)} A${RI} ${RI} 0 0 0 ${f(x3)} ${f(y3)} Z`;
};

/* voussoirs in setting order: springs first, then up toward the crown */
const GAP = 1.8;
const SPAN = (79 - 3 * GAP) / 3;
const V0 = 101 + GAP;
const VOUS: string[] = [
  wedge(V0 + 2 * (SPAN + GAP), 180),
  wedge(0, 180 - (V0 + 2 * (SPAN + GAP))),
  wedge(V0 + SPAN + GAP, V0 + 2 * SPAN + GAP),
  wedge(180 - (V0 + 2 * SPAN + GAP), 180 - (V0 + SPAN + GAP)),
  wedge(V0, V0 + SPAN),
  wedge(180 - (V0 + SPAN), 180 - V0),
];
const KEYSTONE = wedge(101, 79);

/* ground hatching under the spring line, drafting-sheet style */
const HATCH: string[] = [];
for (let x = 82; x <= 236; x += 12) HATCH.push(`M${x} 209 L${x + 6} 203`);

const STATUS = [
  "DRAFTING THE CENTERING",
  "CUTTING THE VOUSSOIRS",
  "SETTING THE STONES",
  "THE KEY IS SET",
];

export default function Preloader() {
  const { reduced } = useKc();
  const rootRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);

  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const stoneId = `plst${uid}`;
  const goldId = `plg${uid}`;
  const flashId = `plf${uid}`;

  useEffect(() => {
    const el = rootRef.current;
    const inner = innerRef.current;
    if (!el || !inner || done) return;

    const html = document.documentElement;
    const isReduced =
      reduced ||
      html.classList.contains("reduced") ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let revisit = false;
    try {
      revisit = sessionStorage.getItem("kc-seen") === "1";
    } catch {
      /* private mode — always the full cut */
    }

    const num = el.querySelector<HTMLElement>(".pl-num")!;
    const stat = el.querySelector<HTMLElement>(".pl-status")!;
    const bar = el.querySelector<HTMLElement>(".pl-bar")!;
    const stones = Array.from(el.querySelectorAll<SVGElement>(".pl-stone"));
    const key = el.querySelector<SVGElement>(".pl-key")!;
    const guides = Array.from(el.querySelectorAll<SVGElement>(".pl-guides path"));
    const build = el.querySelector<SVGElement>(".pl-build")!;
    const flash = el.querySelector<SVGElement>(".pl-flash")!;
    const shock = el.querySelector<SVGElement>(".pl-shock")!;
    const thrust = el.querySelector<SVGPathElement>(".pl-thrust")!;
    const count = el.querySelector<HTMLElement>(".pl-count")!;
    const wk = el.querySelector<HTMLElement>(".pl-wk")!;
    const rule = el.querySelector<HTMLElement>(".pl-wrule")!;
    const wc = el.querySelector<HTMLElement>(".pl-wc")!;

    const thrustLen = thrust.getTotalLength();
    thrust.style.strokeDasharray = `${thrustLen}`;

    const setNum = (v: number) => {
      num.textContent = String(Math.round(v)).padStart(3, "0");
      bar.style.transform = `scaleX(${(v / 100).toFixed(3)})`;
      stat.textContent = v < 34 ? STATUS[0] : v < 68 ? STATUS[1] : STATUS[2];
    };

    const anims: gsap.core.Animation[] = [];
    const waits: number[] = [];
    const keep = (a: gsap.core.Animation) => {
      anims.push(a);
      return a;
    };
    const wait = (ms: number) =>
      new Promise<void>((res) => {
        waits.push(window.setTimeout(res, ms));
      });

    /* gates: real window load + real fonts, both with hard caps */
    const bootReady = new Promise<void>((res) => {
      if (document.readyState === "complete") res();
      else window.addEventListener("load", () => res(), { once: true });
      waits.push(window.setTimeout(res, 4200));
    });
    const fontsReady = Promise.race([
      (document.fonts?.ready ?? Promise.resolve()).then(() => undefined),
      new Promise<void>((r) => {
        waits.push(window.setTimeout(r, 3200));
      }),
    ]);

    let dead = false;
    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      html.classList.remove("booting");
      try {
        sessionStorage.setItem("kc-seen", "1");
      } catch {
        /* ignore */
      }
      markBooted();
      requestAnimationFrame(() => ScrollTrigger.refresh());
      setDone(true);
    };

    /* a stalled boot must never trap the visitor */
    waits.push(
      window.setTimeout(() => {
        if (!dead && !finished) finish();
      }, 9000),
    );

    html.classList.add("booting");
    window.scrollTo(0, 0);

    const run = async () => {
      try {
        if (isReduced) {
          /* the locked arch as a still card, then a plain fade */
          keep(gsap.set(guides, { opacity: 0 }));
          keep(gsap.set([...stones, key], { opacity: 1 }));
          keep(gsap.set(thrust, { opacity: 1, strokeDashoffset: 0 }));
          keep(gsap.set(count, { opacity: 0 }));
          keep(gsap.set(wk, { opacity: 1 }));
          keep(gsap.set(rule, { scaleX: 1 }));
          keep(gsap.set(wc, { opacity: 1 }));
          setNum(100);
          stat.textContent = STATUS[3];
          await wait(900);
          if (dead) return;
          keep(
            gsap.to(el, {
              opacity: 0,
              duration: 0.38,
              ease: "power1.inOut",
              onComplete: finish,
            }),
          );
          return;
        }

        const fast = revisit ? 0.42 : 1;
        const state = { v: 0 };

        /* the sheet: guides + counter */
        keep(
          gsap.fromTo(
            guides,
            { opacity: 0 },
            { opacity: 1, duration: 0.55 + 0.25 * fast, ease: "power1.out" },
          ),
        );
        keep(
          gsap.to(state, {
            v: 88,
            duration: 1.85 * fast,
            delay: 0.1,
            ease: "power1.inOut",
            onUpdate: () => setNum(state.v),
          }),
        );

        /* phase A — the masonry rises with the count */
        const delays = [0.32, 0.44, 0.68, 0.8, 1.04, 1.16, 1.4, 1.52].map(
          (d) => d * fast,
        );
        stones.forEach((s, i) => {
          keep(
            gsap.fromTo(
              s,
              { opacity: 0, y: -14, scale: 0.94, transformOrigin: "50% 50%" },
              {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 0.32 + 0.18 * fast,
                ease: "power3.out",
                delay: delays[i],
              },
            ),
          );
        });

        await wait(2050 * fast);
        if (dead) return;
        await Promise.all([bootReady, fontsReady]);
        if (dead) return;

        /* phase B — the key */
        keep(
          gsap.to(state, {
            v: 100,
            duration: 0.5,
            ease: "power2.in",
            onUpdate: () => setNum(state.v),
          }),
        );
        await wait(460);
        if (dead) return;

        keep(
          gsap.fromTo(
            key,
            { y: -64, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.42, ease: "power3.in" },
          ),
        );
        await wait(430);
        if (dead) return;

        /* impact: the arch takes the load, the centering is struck,
           the line of thrust reveals the load path */
        const impact = gsap.timeline();
        keep(impact);
        impact
          .to(build, { y: 2, duration: 0.07, yoyo: true, repeat: 1, ease: "power1.inOut" }, 0)
          .to(guides, { opacity: 0, duration: 0.32, ease: "power1.out" }, 0.05)
          .fromTo(
            flash,
            { opacity: 0, scale: 0.4, transformOrigin: "50% 50%" },
            { opacity: 0.95, scale: 1.45, duration: 0.16, ease: "power2.out" },
            0.02,
          )
          .to(flash, { opacity: 0, duration: 0.4, ease: "power1.in" }, 0.2)
          .fromTo(
            shock,
            { opacity: 0.7, scale: 0.25, transformOrigin: "50% 50%" },
            { opacity: 0, scale: 1.05, duration: 0.55, ease: "power2.out" },
            0.02,
          )
          .fromTo(
            thrust,
            { opacity: 1, strokeDashoffset: thrustLen },
            { strokeDashoffset: 0, duration: 0.6, ease: "power2.inOut" },
            0.16,
          );
        await wait(600);
        if (dead) return;

        stat.textContent = STATUS[3];
        await wait(620);
        if (dead) return;

        /* the wordmark */
        const fs = parseFloat(getComputedStyle(wk).fontSize) || 60;
        const wt = gsap.timeline();
        keep(wt);
        wt.to(count, { opacity: 0, y: -26, duration: 0.3, ease: "power2.in" }, 0)
          .fromTo(
            wk,
            {
              opacity: 0,
              y: 28,
              letterSpacing: fs * 0.34,
              textIndent: fs * 0.34,
            },
            {
              opacity: 1,
              y: 0,
              letterSpacing: fs * 0.16,
              textIndent: fs * 0.16,
              duration: 0.95,
              ease: "power4.out",
            },
            0.16,
          )
          .fromTo(
            rule,
            { scaleX: 0 },
            { scaleX: 1, duration: 0.45, ease: "power2.out" },
            0.55,
          )
          .fromTo(
            wc,
            { opacity: 0, y: 12 },
            { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" },
            0.62,
          );
        await wait(revisit ? 1100 : 1450);
        if (dead) return;

        /* the curtain lifts; the hero rises into the reveal */
        const ex = gsap.timeline({ onComplete: finish });
        keep(ex);
        ex.call(() => html.classList.remove("booting"), undefined, 0.2)
          .to(inner, { y: 42, opacity: 0, duration: 0.55, ease: "power2.in" }, 0)
          .to(bar, { opacity: 0, duration: 0.25 }, 0)
          .to(el, { yPercent: -100, duration: 1.02, ease: "power4.inOut" }, 0.14)
          .call(markBooted, undefined, 0.42);
      } catch {
        finish();
      }
    };

    run();

    return () => {
      dead = true;
      waits.forEach((t) => window.clearTimeout(t));
      anims.forEach((a) => a.kill());
      html.classList.remove("booting");
    };
  }, [reduced]);

  if (done) return null;

  return (
    <div
      id="preloader"
      ref={rootRef}
      role="status"
      aria-label="Keystone Collective is loading"
    >
      <div className="pl-inner" ref={innerRef} aria-hidden="true">
        <span className="pl-reg n" />
        <span className="pl-reg s" />
        <span className="pl-reg e" />
        <span className="pl-reg w" />
        <div className="pl-top">
          <div className="pl-anno">
            <b>KEYSTONE COLLECTIVE</b>
            ARCHITECTS &amp; BUILDERS
          </div>
          <div className="pl-anno pl-right">BOULDER · COLORADO</div>
        </div>
        <div className="pl-stage">
          <svg className="pl-arch" viewBox="0 0 320 214">
            <defs>
              <linearGradient id={stoneId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#37322B" />
                <stop offset="1" stopColor="#221F1A" />
              </linearGradient>
              <linearGradient id={goldId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#E4C88A" />
                <stop offset=".55" stopColor="#C9A962" />
                <stop offset="1" stopColor="#8A6D33" />
              </linearGradient>
              <radialGradient id={flashId}>
                <stop offset="0" stopColor="#F5E1A6" stopOpacity=".95" />
                <stop offset=".5" stopColor="#C9A962" stopOpacity=".38" />
                <stop offset="1" stopColor="#C9A962" stopOpacity="0" />
              </radialGradient>
            </defs>
            <g className="pl-guides">
              <path className="pl-guide-arc" d="M99 148 A61 61 0 0 1 221 148" />
              <path className="pl-spring" d="M78 148 H242" />
              <path className="pl-cross" d="M154 148 H166 M160 142 V154" />
            </g>
            <path className="pl-ground" d="M72 203 H248" />
            {HATCH.map((d, i) => (
              <path className="pl-hatch" key={`h${i}`} d={d} />
            ))}
            <g className="pl-build">
              <g className="pl-stone">
                <rect x="88" y="148" width="22" height="48" fill={`url(#${stoneId})`} />
                <rect x="81" y="196" width="36" height="7" fill={`url(#${stoneId})`} />
              </g>
              <g className="pl-stone">
                <rect x="210" y="148" width="22" height="48" fill={`url(#${stoneId})`} />
                <rect x="204" y="196" width="36" height="7" fill={`url(#${stoneId})`} />
              </g>
              {VOUS.map((d, i) => (
                <path className="pl-stone" key={`v${i}`} d={d} fill={`url(#${stoneId})`} />
              ))}
              <path className="pl-key" d={KEYSTONE} fill={`url(#${goldId})`} />
            </g>
            <circle className="pl-flash" cx="160" cy="87" r="30" fill={`url(#${flashId})`} />
            <circle className="pl-shock" cx="160" cy="87" r="30" />
            <path className="pl-thrust" d="M99 203 V148 A61 61 0 0 1 221 148 V203" />
          </svg>
          <div className="pl-slot">
            <div className="pl-count">
              <div className="pl-num-row">
                <span className="pl-num">000</span>
                <i className="pl-pct">%</i>
              </div>
              <div className="pl-status">DRAFTING THE CENTERING</div>
            </div>
            <div className="pl-word">
              <div className="pl-wk">KEYSTONE</div>
              <span className="pl-wrule" />
              <div className="pl-wc">COLLECTIVE</div>
            </div>
          </div>
        </div>
        <div className="pl-foot">
          <div className="pl-anno">40.0150° N · 105.2705° W</div>
          <div className="pl-anno pl-right">EST. 2004</div>
        </div>
      </div>
      <div className="pl-bar" aria-hidden="true" />
    </div>
  );
}
