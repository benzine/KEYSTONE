"use client";

/**
 * Process — Section 04 · THE METHOD.
 * React port of the original markup + script-08 scene: the pinned
 * horizontal timeline (#proc-track scrubbed sideways), the progress dial
 * (#proc-dial with arc / bead / ticks / number), the drawn ribbon paths
 * (#ribbon-main / #ribbon-echo + nodes), phase proximity effects, and the
 * scroll-velocity ribbon skew. Phase cards open the knowledge-center modal
 * (replaces the original script-16 trigger binding).
 */

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useKc } from "./KcProvider";
import { clamp } from "@/lib/keystone/kc-core";
import { PHASES } from "@/lib/keystone/phases";

gsap.registerPlugin(ScrollTrigger);

const SVG_NS = "http://www.w3.org/2000/svg";

export default function Process() {
  const { state, reduced, openKcm } = useKc();
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = rootRef.current;
    const track = el?.querySelector<HTMLElement>("#proc-track");
    const stage = el?.querySelector<HTMLElement>("#proc-stage");
    const ticks = el?.querySelector<SVGGElement>("#dial-ticks");
    if (!el || !track || !stage || !ticks) return;
    const KCState = state.current;

    /* ---- progress dial ticks (24 around the ring) ---- */
    ticks.replaceChildren();
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      const l = document.createElementNS(SVG_NS, "line");
      l.setAttribute("x1", (50 + Math.cos(a) * 38).toFixed(1));
      l.setAttribute("y1", (50 + Math.sin(a) * 38).toFixed(1));
      l.setAttribute("x2", (50 + Math.cos(a) * 43).toFixed(1));
      l.setAttribute("y2", (50 + Math.sin(a) * 43).toFixed(1));
      ticks.appendChild(l);
    }

    /* ---- timeline ribbon (rebuilt on refresh so it tracks layout) ---- */
    const svg = el.querySelector<SVGSVGElement>("#proc-ribbon");
    const pm = el.querySelector<SVGPathElement>("#ribbon-main");
    const pe = el.querySelector<SVGPathElement>("#ribbon-echo");
    const nodesG = el.querySelector<SVGGElement>("#ribbon-nodes");
    let lenMain = 0;
    let lenEcho = 0;

    const buildRibbon = (): void => {
      if (!svg || !pm || !pe || !nodesG || !track.isConnected) return;
      const W = track.scrollWidth;
      if (!W) return;
      svg.setAttribute("viewBox", "0 0 " + W + " 150");
      svg.style.width = W + "px";
      const xs = Array.from(
        el.querySelectorAll<HTMLElement>(".proc-phase, .proc-intro, .proc-end"),
      ).map((node) => node.offsetLeft + Math.min(node.offsetWidth, 340) / 2);
      let d = "M " + xs[0] + " 84";
      let de = "M " + xs[0] + " 96";
      for (let i = 1; i < xs.length; i++) {
        const mx = (xs[i - 1] + xs[i]) / 2;
        const up = i % 2;
        d +=
          " C " + mx + " " + (up ? 16 : 150) +
          ", " + mx + " " + (up ? 150 : 16) +
          ", " + xs[i] + " 84";
        de +=
          " C " + mx + " " + (up ? 40 : 124) +
          ", " + mx + " " + (up ? 124 : 40) +
          ", " + xs[i] + " 96";
      }
      pm.setAttribute("d", d);
      pe.setAttribute("d", de);
      lenMain = pm.getTotalLength();
      lenEcho = pe.getTotalLength();
      pm.style.strokeDasharray = String(lenMain);
      pe.style.strokeDasharray = String(lenEcho);
      nodesG.replaceChildren();
      xs.forEach((x) => {
        const c = document.createElementNS(SVG_NS, "circle");
        c.setAttribute("cx", String(x));
        c.setAttribute("cy", "84");
        c.setAttribute("r", "3.5");
        nodesG.appendChild(c);
        const r = document.createElementNS(SVG_NS, "circle");
        r.setAttribute("class", "nring");
        r.setAttribute("cx", String(x));
        r.setAttribute("cy", "84");
        r.setAttribute("r", "8");
        nodesG.appendChild(r);
      });
    };
    buildRibbon();
    ScrollTrigger.addEventListener("refreshInit", buildRibbon);

    /* scroll-velocity skew on the ribbon (added below, full motion only) */
    const onVelTick = () => {
      if (KCState.procP > 0 && KCState.procP < 1 && !KCState.modalOpen && svg) {
        gsap.set(svg, { skewX: clamp(KCState.vel * 0.25, -6, 6) });
      }
    };

    /* ---- scroll choreography (skipped when reduced, like script-08) ---- */
    const ctx = gsap.context(() => {
      if (reduced) return;

      const phases = Array.from(el.querySelectorAll<HTMLElement>(".proc-phase"));
      const inners = phases.map((ph) =>
        ph.querySelector<HTMLElement>(".ph-inner"),
      );
      const spins = phases.map((ph) => {
        const survey = ph.querySelector<SVGSVGElement>(".survey");
        return survey
          ? gsap.to(survey, { rotation: 360, duration: 1.8, ease: "none", repeat: -1 })
          : null;
      });

      const dialNum = el.querySelector<HTMLElement>("#dial-num");
      const bead = el.querySelector<SVGCircleElement>("#dial-bead");

      const onProcUpdate = (self: ScrollTrigger): void => {
        KCState.procP = self.progress;
        const prog = self.progress;
        if (dialNum) {
          dialNum.textContent =
            String(Math.round(prog * 100)).padStart(2, "0") + "%";
        }
        if (bead) {
          const ang = ((90 + prog * 360) * Math.PI) / 180;
          bead.setAttribute("cx", (50 + 44 * Math.cos(ang)).toFixed(1));
          bead.setAttribute("cy", (50 + 44 * Math.sin(ang)).toFixed(1));
        }
        phases.forEach((ph, i) => {
          const inner = inners[i];
          const r = ph.getBoundingClientRect();
          const d = Math.abs(r.left + r.width / 2 - window.innerWidth / 2);
          const prox = Math.max(0, 1 - d / (window.innerWidth * 0.55));
          spins[i]?.timeScale(0.06 + prox * 1.3);
          if (inner) {
            gsap.set(inner, { opacity: 0.3 + prox * 0.7, scale: 0.95 + prox * 0.05 });
          }
        });
      };

      const trig = {
        trigger: el,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.85,
        invalidateOnRefresh: true,
      };

      /* pinned horizontal scrub of the track */
      gsap.to(track, {
        x: () => -(track.scrollWidth - stage.clientWidth + 40),
        ease: "none",
        scrollTrigger: {
          ...trig,
          onUpdate: (self) => onProcUpdate(self),
        },
      });

      /* ribbon path drawing */
      if (pm) {
        gsap.fromTo(
          pm,
          { strokeDashoffset: () => lenMain },
          { strokeDashoffset: 0, ease: "none", scrollTrigger: trig },
        );
      }
      if (pe) {
        gsap.fromTo(
          pe,
          { strokeDashoffset: () => lenEcho },
          { strokeDashoffset: 0, ease: "none", scrollTrigger: trig },
        );
      }

      /* progress dial arc */
      const arc = el.querySelector<SVGCircleElement>("#dial-arc");
      if (arc) {
        const C = 2 * Math.PI * 44;
        arc.style.strokeDasharray = String(C);
        gsap.fromTo(
          arc,
          { strokeDashoffset: C },
          { strokeDashoffset: 0, ease: "none", scrollTrigger: trig },
        );
      }

      /* slow dial tick rotation */
      gsap.to(ticks, {
        rotation: 360,
        svgOrigin: "50 50",
        duration: 26,
        ease: "none",
        repeat: -1,
      });

      gsap.ticker.add(onVelTick);
    }, el);

    return () => {
      ScrollTrigger.removeEventListener("refreshInit", buildRibbon);
      gsap.ticker.remove(onVelTick);
      if (svg) gsap.set(svg, { skewX: 0 });
      ctx.revert();
    };
  }, [state, reduced]);

  return (
    <section
      ref={rootRef}
      id="sec-process"
      className="sec"
      data-name="THE METHOD"
      data-index="04"
      data-accent="#B5651D"
      data-theme="light"
    >
  <div className="stage" id="proc-stage">
    <div id="proc-corner"><div className="sec-label">04 · THE METHOD</div></div>
    <div id="proc-track">
      <div className="proc-intro">
        <div className="sec-label">SEQUENCE</div>
        <h2>Five phases.<br  />No shortcuts.</h2>
        <p className="pi-sub">Twenty years of refinement, compressed into one sequence.</p>
        <p className="pi-note">SCROLL · THE TIMELINE MOVES SIDEWAYS →</p>
      </div>
      <article className="proc-phase" tabIndex={0} role="button" data-cursor="OPEN" aria-label={`Open phase detail: ${PHASES[0].name}`} onClick={(e) => openKcm({ type: "phase", index: 0, trigger: e.currentTarget })} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openKcm({ type: "phase", index: 0, trigger: e.currentTarget }); } }}><div className="ghost-n">01</div><svg className="survey" viewBox="0 0 40 40" fill="none" strokeWidth="1.2"><circle cx="20" cy="20" r="14" strokeDasharray="4 5" /><line x1="20" y1="2" x2="20" y2="38" /><line x1="2" y1="20" x2="38" y2="20" /></svg><div className="ph-inner"><div className="ph-copy"><div className="ph-meta">PHASE 01 · WEEKS 1-4</div><h3>Discovery</h3><p className="ph-quote">“We listen first. The land, and the life you intend for it.”</p><ul className="ph-deliv"><li>SITE + SOLAR ANALYSIS</li><li>CLIENT INTERVIEWS</li><li>PROGRAMMING DOCUMENT</li></ul></div><figure className="ph-img" data-perspective><div className="fig-frame photo photo-frame"><img src="/images/bc80a497173c46c38d6307fb2c065ae1.jpeg" alt="Site survey at dawn" loading="lazy"  /></div><figcaption>THE LAND, FIRST</figcaption></figure></div></article>
      <article className="proc-phase" tabIndex={0} role="button" data-cursor="OPEN" aria-label={`Open phase detail: ${PHASES[1].name}`} onClick={(e) => openKcm({ type: "phase", index: 1, trigger: e.currentTarget })} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openKcm({ type: "phase", index: 1, trigger: e.currentTarget }); } }}><div className="ghost-n">02</div><svg className="survey" viewBox="0 0 40 40" fill="none" strokeWidth="1.2"><circle cx="20" cy="20" r="14" strokeDasharray="4 5" /><line x1="20" y1="2" x2="20" y2="38" /><line x1="2" y1="20" x2="38" y2="20" /></svg><div className="ph-inner"><div className="ph-copy"><div className="ph-meta">PHASE 02 · WEEKS 5-16</div><h3>Design</h3><p className="ph-quote">“Lines drawn with intention. Every millimeter considered.”</p><ul className="ph-deliv"><li>SCHEMATIC DESIGNS</li><li>3D MASSING STUDIES</li><li>MATERIAL PALETTES</li></ul></div><figure className="ph-img" data-perspective><div className="fig-frame photo photo-frame"><img src="/images/20e8d5b74b8840678d40bd8cfed3721d.jpeg" alt="Design studio models" loading="lazy"  /></div><figcaption>MASSING + LIGHT</figcaption></figure></div></article>
      <article className="proc-phase" tabIndex={0} role="button" data-cursor="OPEN" aria-label={`Open phase detail: ${PHASES[2].name}`} onClick={(e) => openKcm({ type: "phase", index: 2, trigger: e.currentTarget })} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openKcm({ type: "phase", index: 2, trigger: e.currentTarget }); } }}><div className="ghost-n">03</div><svg className="survey" viewBox="0 0 40 40" fill="none" strokeWidth="1.2"><circle cx="20" cy="20" r="14" strokeDasharray="4 5" /><line x1="20" y1="2" x2="20" y2="38" /><line x1="2" y1="20" x2="38" y2="20" /></svg><div className="ph-inner"><div className="ph-copy"><div className="ph-meta">PHASE 03 · WEEKS 17-24</div><h3>Documentation</h3><p className="ph-quote">“Precision in every detail. The blueprint for the dream.”</p><ul className="ph-deliv"><li>CONSTRUCTION DOCUMENTS</li><li>SPECIFICATIONS</li><li>PERMIT PACKAGES</li></ul></div><figure className="ph-img" data-perspective><div className="fig-frame photo photo-frame"><img src="/images/37b0ea6621f747b9a1378f74b28677bc.jpeg" alt="Construction drawings" loading="lazy"  /></div><figcaption>1:5 DETAIL SETS</figcaption></figure></div></article>
      <article className="proc-phase" tabIndex={0} role="button" data-cursor="OPEN" aria-label={`Open phase detail: ${PHASES[3].name}`} onClick={(e) => openKcm({ type: "phase", index: 3, trigger: e.currentTarget })} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openKcm({ type: "phase", index: 3, trigger: e.currentTarget }); } }}><div className="ghost-n">04</div><svg className="survey" viewBox="0 0 40 40" fill="none" strokeWidth="1.2"><circle cx="20" cy="20" r="14" strokeDasharray="4 5" /><line x1="20" y1="2" x2="20" y2="38" /><line x1="2" y1="20" x2="38" y2="20" /></svg><div className="ph-inner"><div className="ph-copy"><div className="ph-meta">PHASE 04 · MONTHS 7-18</div><h3>Construction</h3><p className="ph-quote">“Built with hands, guided by vision.”</p><ul className="ph-deliv"><li>WEEKLY PROGRESS UPDATES</li><li>QUALITY ASSURANCE</li><li>CLIENT WALKTHROUGHS</li></ul></div><figure className="ph-img" data-perspective><div className="fig-frame photo photo-frame"><img src="/images/299bad8bbd7d402b90bfca23af5c2307.jpeg" alt="Framing at golden hour" loading="lazy"  /></div><figcaption>SITE, EVERY WEEK</figcaption></figure></div></article>
      <article className="proc-phase" tabIndex={0} role="button" data-cursor="OPEN" aria-label={`Open phase detail: ${PHASES[4].name}`} onClick={(e) => openKcm({ type: "phase", index: 4, trigger: e.currentTarget })} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openKcm({ type: "phase", index: 4, trigger: e.currentTarget }); } }}><div className="ghost-n">05</div><svg className="survey" viewBox="0 0 40 40" fill="none" strokeWidth="1.2"><circle cx="20" cy="20" r="14" strokeDasharray="4 5" /><line x1="20" y1="2" x2="20" y2="38" /><line x1="2" y1="20" x2="38" y2="20" /></svg><div className="ph-inner"><div className="ph-copy"><div className="ph-meta">PHASE 05 · THE FIRST MORNING</div><h3>Delivery</h3><p className="ph-quote">“Keys in hand. A home ready for life.”</p><ul className="ph-deliv"><li>MOVE-IN COORDINATION</li><li>WARRANTY DOCUMENTATION</li><li>THE OWNER'S MANUAL</li></ul></div><figure className="ph-img" data-perspective><div className="fig-frame photo photo-frame"><img src="/images/ae2eb5761b3d482ea021d2948f95c56e.jpeg" alt="Finished home at dusk" loading="lazy"  /></div><figcaption>FIRST LIGHT, OWNED</figcaption></figure></div></article>
      <div className="proc-end"><h3>Then, one morning,<br  />keys in hand.</h3><button className="btn-arch" data-target="#sec-cases" data-tilt data-cursor="CONTINUE">SEE THE WORK ↓</button></div>
      <svg id="proc-ribbon" aria-hidden="true"><path id="ribbon-echo" d="" /><path id="ribbon-main" d="" /><g id="ribbon-nodes"></g></svg>
    </div>
    <div id="proc-dial" aria-hidden="true">
      <svg viewBox="0 0 100 100"><circle className="dial-track" cx="50" cy="50" r="44" /><circle id="dial-arc" cx="50" cy="50" r="44" /><circle id="dial-bead" cx="50" cy="94" r="3" /><g id="dial-ticks"></g></svg>
      <div id="dial-num">00%</div>
    </div>
    <div id="proc-sheet">SHT A-301 · SEQUENCE · REV C</div>
  </div>
</section>
  );
}
