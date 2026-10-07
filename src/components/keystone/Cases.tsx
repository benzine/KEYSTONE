"use client";

/**
 * Cases — Section 05 · THE WORK.
 * React port of the original markup + script-09: the gravity-well orbital
 * arrangement of the six case cards (scroll-scrubbed entry, continuous orbit
 * physics, front-card focus readout) plus the card → case-modal triggers.
 *
 * KC_CASES is the React analogue of the original KC.CASES registry: the
 * CaseModal component uses it to detach/reattach the trigger card from the
 * orbit while a project sheet is open.
 *
 * REV D: the cards are vertically centered on the stage mid-line (every y
 * the tick and the fly-in timeline write carries − offsetHeight/2, so the
 * card CENTER rides the orbit instead of the card TOP). The original
 * anchored the card top at 50%, which parked every near card low enough
 * that the stage's overflow edge cut its metrics off (measured: the front
 * card clipped ~180-200px in both the original and the port). Centering
 * keeps the whole scaled card inside the stage at every viewport height.
 */

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useKc } from "./KcProvider";
import { clamp, smoothstep, RAD } from "@/lib/keystone/kc-core";

gsap.registerPlugin(ScrollTrigger);

export interface CaseOrbEntry {
  el: HTMLElement;
  a: number;
  detached: boolean;
  story: HTMLElement | null;
  mets: HTMLElement | null;
}

/** Shared orbit registry — port of KC.CASES (script-09 registers, script-10 detaches). */
export const KC_CASES: {
  orb: CaseOrbEntry[];
  live: boolean;
  stage: HTMLElement | null;
} = { orb: [], live: false, stage: null };

const META: [string, string][] = [
  ["MERIDIAN HOUSE", "8,400 SQ FT"],
  ["TRAVERTINE COURT", "LEED GOLD"],
  ["LONGFIELD BARN", "ADAPTIVE REUSE"],
  ["CASCADIA RIDGE", "NET-ZERO READY"],
  ["FENWICK HOLLOW", "RAISED +12 FT"],
  ["SOLSTICE YARD", "R-48 WALLS"],
];

const SLOT = [90, 150, 210, 270, 330, 30].map((a) => a * RAD);

export default function Cases() {
  const { state, reduced, openCase } = useKc();
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const KCState = state.current;
    const html = document.documentElement;

    /* #case-all is a placeholder link — never navigate. */
    const caseAll = el.querySelector<HTMLElement>("#case-all");
    const onCaseAllClick = (e: Event) => e.preventDefault();
    caseAll?.addEventListener("click", onCaseAllClick);

    /* Simple mode (narrow viewport / reduced motion): stacked layout is
       driven purely by CSS — no orbital machinery, exactly like script-09.
       The condition is computed directly (html.simple may not be applied
       yet at first mount, since KcProvider's layout effect runs after
       this child effect). */
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const mqNarrow = window.matchMedia("(max-width:760px)").matches;
    if (mqNarrow || prefersReduced || reduced || html.classList.contains("simple")) {
      return () => {
        caseAll?.removeEventListener("click", onCaseAllClick);
      };
    }

    const stage = el.querySelector<HTMLElement>("#case-stage");
    const cards = Array.from(el.querySelectorAll<HTMLElement>(".case-card"));
    const readout = el.querySelector<HTMLElement>("#case-readout");
    if (!stage || cards.length === 0 || !readout) {
      return () => {
        caseAll?.removeEventListener("click", onCaseAllClick);
      };
    }

    KC_CASES.stage = stage;
    console.info("[KC] THE WORK · REV D · centered orbit active");

    const rx = () => clamp(stage.clientWidth * 0.38, 210, 560);
    const ry = () => clamp(stage.clientHeight * 0.19, 110, 175);
    /* Short-viewport fit: below ~740px of stage height the scaled front card
       (image + body + metrics ≈ 440px, ×1.12 at full depth) cannot fit under
       the ring's front excursion, so the whole orbit scales down gently.
       Desktop heights (740px and up) get factor 1 — geometry unchanged. */
    const fit = () => clamp((stage.clientHeight - 80) / 660, 0.78, 1);
    /* Cards are laid out with their TOP at the stage's 50% line; every orbit
       y therefore subtracts half the card height so the CENTER rides the
       ring (see the REV D note in the header). offsetHeight ignores the
       transform's scale, so the compensation stays correct mid-flight. */
    const halfH = (c: HTMLElement) => c.offsetHeight / 2;

    let orbitLive = false;
    let frontIdx = -2;

    const orb: CaseOrbEntry[] = cards.map((c) => ({
      el: c,
      a: 0,
      detached: false,
      story: c.querySelector<HTMLElement>(".case-story"),
      mets: c.querySelector<HTMLElement>(".case-metrics"),
    }));
    KC_CASES.orb = orb;
    KC_CASES.live = false;

    const ctx = gsap.context(() => {
      /* Visibility flag for the orbit ticker. */
      ScrollTrigger.create({
        trigger: el,
        start: "top bottom",
        end: "bottom top",
        onToggle: (s) => {
          KCState.vis.cases = s.isActive;
        },
      });

      gsap.from("#case-stage .stage-head", {
        opacity: 0,
        y: 44,
        ease: "none",
        scrollTrigger: { trigger: el, start: "top 60%", end: "top 10%", scrub: 1 },
      });

      function onCaseUpdate(self: ScrollTrigger) {
        KCState.caseP = self.progress;
        KC_CASES.live = self.progress > 0.58;
        if (KC_CASES.live && !orbitLive) {
          orbitLive = true;
          orb.forEach((o, i) => {
            o.a = SLOT[i];
          });
        } else if (!KC_CASES.live) {
          orbitLive = false;
        }
      }

      /* Cards fly in from the sides and settle onto their orbital slots. */
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
          invalidateOnRefresh: true,
          onUpdate: onCaseUpdate,
        },
      });
      tl.fromTo(
        "#well",
        { opacity: 0, scale: 0.5 },
        { opacity: 1, scale: 1, duration: 0.25, ease: "none" },
        0.05,
      );

      const entries: [number, number][] = [
        [1, -0.3],
        [-1, 0.28],
        [1, -0.22],
        [-1, 0.32],
        [1, -0.36],
        [-1, 0.26],
      ];
      cards.forEach((c, i) => {
        const dir = entries[i][0];
        const fy = entries[i][1];
        tl.fromTo(
          c,
          {
            x: () => dir * stage.clientWidth * 0.75,
            y: () => fy * stage.clientHeight - halfH(c),
            rotation: dir * 14,
            opacity: 0,
            scale: 0.7,
          },
          {
            x: () => Math.cos(SLOT[i]) * rx(),
            y: () => Math.sin(SLOT[i]) * ry() * fit() - halfH(c),
            rotation: 0,
            opacity: 1,
            scale: fit(),
            duration: 0.16,
            ease: "power2.in",
          },
          0.12 + i * 0.06,
        );
      });
      tl.to({}, { duration: 0.29 });
    }, el);

    /* Continuous orbital drift around the gravity well. */
    const orbitTick = (_t: number, dms: number) => {
      if (!KCState.vis.cases || !orbitLive) return;
      const dt = Math.min(dms / 1000, 0.05) * (KCState.modalOpen ? 0.12 : 1);
      const rxv = rx();
      const ryv = ry() * fit();
      const fitv = fit();
      let best = -2;
      let bestI = 0;
      orb.forEach((o, i) => {
        if (o.detached) return;
        o.a += dt * (0.08 + KCState.nvel * 0.8);
        const depth = (Math.sin(o.a) + 1) / 2;
        const front = smoothstep(depth, 0.78, 1);
        gsap.set(o.el, {
          x: Math.cos(o.a) * rxv,
          y: Math.sin(o.a) * ryv - front * 18 * fitv - halfH(o.el),
          scale: (0.72 + 0.3 * depth + front * 0.1) * fitv,
          opacity: 0.26 + 0.74 * depth,
          rotation: Math.sin(o.a) * 3,
          zIndex: 10 + Math.round(depth * 20),
        });
        o.el.style.borderColor =
          front > 0.5 ? "rgba(201,169,98,.7)" : "rgba(140,120,83,.42)";
        o.el.style.filter = `blur(${(Math.round((1 - depth) * 4) / 2).toFixed(1)}px)`;
        const m = clamp((depth - 0.7) / 0.26, 0, 1);
        if (o.story) o.story.style.opacity = String(m);
        if (o.mets) o.mets.style.opacity = String(m);
        if (depth > best) {
          best = depth;
          bestI = i;
        }
      });
      if (!KCState.modalOpen && bestI !== frontIdx) {
        frontIdx = bestI;
        readout.textContent = `IN FOCUS · ${META[bestI][0]} · ${META[bestI][1]}`;
        gsap.fromTo(readout, { opacity: 0.2 }, { opacity: 1, duration: 0.5 });
      }
    };
    gsap.ticker.add(orbitTick);

    return () => {
      gsap.ticker.remove(orbitTick);
      ctx.revert();
      KC_CASES.orb = [];
      KC_CASES.live = false;
      KC_CASES.stage = null;
      caseAll?.removeEventListener("click", onCaseAllClick);
    };
  }, [state, reduced]);

  const onCardKeyDown = (key: string) => (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openCase(key, e.currentTarget);
    }
  };

  return (
    <>
      <section
        ref={rootRef}
        id="sec-cases"
        className="sec"
        data-name="THE WORK"
        data-index="05"
        data-accent="#C9A962"
        data-theme="dark"
      >
        <div className="stage stage-dark" id="case-stage">
          <div className="stage-head">
            <div className="sec-label light">05 · THE WORK</div>
            <h2>Results are our center of gravity.</h2>
            <p>Six homes, drawn to scale and pulled toward what matters.</p>
          </div>
          <div id="well" aria-hidden="true">
            <div className="well-ring"></div>
            <div className="well-ring r2"></div>
            <div className="well-core"></div>
          </div>
          <div
            className="case-card"
            data-hover
            data-project="meridian"
            tabIndex={0}
            role="button"
            aria-label="Open Meridian House project feature"
            data-cursor="OPEN"
            onClick={(e) => openCase("meridian", e.currentTarget)}
            onKeyDown={onCardKeyDown("meridian")}
          >
            <div className="case-img photo">
              <img
                src="/images/real/case-meridian-1.jpg"
                alt="Meridian House"
                loading="lazy"
              />
            </div>
            <div className="case-body">
              <h3>Meridian House</h3>
              <div className="case-loc">BOULDER, COLORADO</div>
              <p className="case-story">
                A family of five on a west-facing slope, sharing it with a
                stubborn aspen grove we refused to cut.
              </p>
              <div className="case-metrics">
                <div>
                  <b>8,400</b>
                  <span>SQ FT</span>
                </div>
                <div>
                  <b>26</b>
                  <span>MONTHS</span>
                </div>
                <div>
                  <b>PH+</b>
                  <span>CERTIFIED</span>
                </div>
              </div>
            </div>
          </div>
          <div
            className="case-card"
            data-hover
            data-project="travertine"
            tabIndex={0}
            role="button"
            aria-label="Open Travertine Court project feature"
            data-cursor="OPEN"
            onClick={(e) => openCase("travertine", e.currentTarget)}
            onKeyDown={onCardKeyDown("travertine")}
          >
            <div className="case-img photo">
              <img
                src="/images/real/case-travertine-1.jpg"
                alt="Travertine Court"
                loading="lazy"
              />
            </div>
            <div className="case-body">
              <h3>Travertine Court</h3>
              <div className="case-loc">SCOTTSDALE, ARIZONA</div>
              <p className="case-story">
                A courtyard house that turns its back on the sun and its face to
                the shade.
              </p>
              <div className="case-metrics">
                <div>
                  <b>6,100</b>
                  <span>SQ FT</span>
                </div>
                <div>
                  <b>19</b>
                  <span>MONTHS</span>
                </div>
                <div>
                  <b>LEED</b>
                  <span>GOLD</span>
                </div>
              </div>
            </div>
          </div>
          <div
            className="case-card"
            data-hover
            data-project="longfield"
            tabIndex={0}
            role="button"
            aria-label="Open Longfield Barn project feature"
            data-cursor="OPEN"
            onClick={(e) => openCase("longfield", e.currentTarget)}
            onKeyDown={onCardKeyDown("longfield")}
          >
            <div className="case-img photo">
              <img
                src="/images/real/case-longfield-1.jpg"
                alt="Longfield Barn"
                loading="lazy"
              />
            </div>
            <div className="case-body">
              <h3>Longfield Barn</h3>
              <div className="case-loc">HUDSON VALLEY, NEW YORK</div>
              <p className="case-story">
                A 1907 dairy barn, reimagined without forgetting a single beam.
              </p>
              <div className="case-metrics">
                <div>
                  <b>4,750</b>
                  <span>SQ FT</span>
                </div>
                <div>
                  <b>14</b>
                  <span>MONTHS</span>
                </div>
                <div>
                  <b>1907</b>
                  <span>ORIGIN</span>
                </div>
              </div>
            </div>
          </div>
          <div
            className="case-card"
            data-hover
            data-project="cascadia"
            tabIndex={0}
            role="button"
            aria-label="Open Cascadia Ridge project feature"
            data-cursor="OPEN"
            onClick={(e) => openCase("cascadia", e.currentTarget)}
            onKeyDown={onCardKeyDown("cascadia")}
          >
            <div className="case-img photo">
              <img
                src="/images/real/case-cascadia-1.jpg"
                alt="Cascadia Ridge"
                loading="lazy"
              />
            </div>
            <div className="case-body">
              <h3>Cascadia Ridge</h3>
              <div className="case-loc">PORTLAND, OREGON</div>
              <p className="case-story">
                A ridge-line home that earns its view and pays for its own
                power.
              </p>
              <div className="case-metrics">
                <div>
                  <b>7,200</b>
                  <span>SQ FT</span>
                </div>
                <div>
                  <b>22</b>
                  <span>MONTHS</span>
                </div>
                <div>
                  <b>0</b>
                  <span>NET ENERGY</span>
                </div>
              </div>
            </div>
          </div>
          <div
            className="case-card"
            data-hover
            data-project="fenwick"
            tabIndex={0}
            role="button"
            aria-label="Open Fenwick Hollow project feature"
            data-cursor="OPEN"
            onClick={(e) => openCase("fenwick", e.currentTarget)}
            onKeyDown={onCardKeyDown("fenwick")}
          >
            <div className="case-img photo">
              <img
                src="/images/real/case-fenwick-1.jpg"
                alt="Fenwick Hollow"
                loading="lazy"
              />
            </div>
            <div className="case-body">
              <h3>Fenwick Hollow</h3>
              <div className="case-loc">CHARLESTON, SOUTH CAROLINA</div>
              <p className="case-story">
                A low-country house raised on piers, wrapped in deep shade and
                river light.
              </p>
              <div className="case-metrics">
                <div>
                  <b>5,300</b>
                  <span>SQ FT</span>
                </div>
                <div>
                  <b>17</b>
                  <span>MONTHS</span>
                </div>
                <div>
                  <b>+12</b>
                  <span>FT ON PIERS</span>
                </div>
              </div>
            </div>
          </div>
          <div
            className="case-card"
            data-hover
            data-project="solstice"
            tabIndex={0}
            role="button"
            aria-label="Open Solstice Yard project feature"
            data-cursor="OPEN"
            onClick={(e) => openCase("solstice", e.currentTarget)}
            onKeyDown={onCardKeyDown("solstice")}
          >
            <div className="case-img photo">
              <img
                src="/images/real/case-solstice-1.jpg"
                alt="Solstice Yard"
                loading="lazy"
              />
            </div>
            <div className="case-body">
              <h3>Solstice Yard</h3>
              <div className="case-loc">SANTA FE, NEW MEXICO</div>
              <p className="case-story">
                Adobe walls thick enough to hold the day&apos;s heat past
                midnight.
              </p>
              <div className="case-metrics">
                <div>
                  <b>3,900</b>
                  <span>SQ FT</span>
                </div>
                <div>
                  <b>12</b>
                  <span>MONTHS</span>
                </div>
                <div>
                  <b>R-48</b>
                  <span>WALLS</span>
                </div>
              </div>
            </div>
          </div>
          <div id="case-readout">IN FOCUS · MERIDIAN HOUSE · 8,400 SQ FT</div>
          <a id="case-all" href="#" data-cursor="SOON">
            VIEW THE FULL PORTFOLIO ↗
          </a>
          <div className="sheet-tag">SHT A-401 · RECORD SET · REV D</div>
        </div>
      </section>
    </>
  );
}
