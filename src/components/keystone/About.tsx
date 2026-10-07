"use client";

/**
 * About — Section 01 · THE STUDIO.
 * React port of the original markup + script-06 scene: headline weight
 * scrub, magnetic word drifts, reveal-image parallax, the material survey
 * plate (survey points, leader lines, material cards), the pinned material
 * runway inside #mat-pin, and the material detail modal. The #mat-modal
 * element itself is rendered by <MatModal /> at page level; this component
 * drives it imperatively, matching the original's class-toggling approach.
 */

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useKc } from "./KcProvider";
import { splitWords } from "@/lib/keystone/kc-core";

gsap.registerPlugin(ScrollTrigger);

/* Material detail data — port of script-06's MATS array. */
interface MatData {
  loc: string;
  long: string;
}
const MATS: MatData[] = [
  {
    loc: "ORIGIN · LOCAL POUR, BOULDER CO",
    long: "Poured in place against Douglas fir boards, each wall records the grain of its formwork like a fingerprint. We seal it matte and let time draw the mineral bloom.",
  },
  {
    loc: "ORIGIN · OHIO VALLEY",
    long: "Cut radially so the grain runs straight and the boards hold their plane for a century. Three coats of hardwax oil; after twenty years it reads as amber rather than wood.",
  },
  {
    loc: "ORIGIN · ARCHITECTURAL ALLOY",
    long: "Left unsealed so the alloy may answer every hand that touches it. Handles begin gold-bright and retire to a deep museum brown, a record of the household kept in metal.",
  },
  {
    loc: "ORIGIN · TIVOLI QUARRIES",
    long: "Cut from the same banks that built Rome. Honed rather than polished, the stone keeps its open pores and, with them, the shadow of every decade of weather and every dinner party.",
  },
  {
    loc: "ORIGIN · FLANDERS FLAX",
    long: "Woven from flax retted in the field, washed until the weave relaxes. Curtains that move like slow water, and soften for as long as the house stands.",
  },
];

/* React port of the original KC.UI.closeMatModal registry hook: script-06
   registered it and script-17's global ESC handler called it. Exposed here
   as window.__kcCloseMatModal and mirrored as the "kc:close-mat-modal"
   document event so the chrome/ESC port can close the material sheet. */
declare global {
  interface Window {
    __kcCloseMatModal?: () => void;
  }
}

export default function About() {
  const { reduced } = useKc();
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    /* ---- material survey plate (runs in every mode, like script-06) ---- */
    const plate = el.querySelector<HTMLElement>("#mat-plate");
    if (!plate) return;

    const photoWrap = el.querySelector<HTMLElement>("#plate-photo");
    const spot = el.querySelector<HTMLElement>("#mat-spot");
    const points = Array.from(plate.querySelectorAll<HTMLElement>(".mat-point"));
    const cards = Array.from(plate.querySelectorAll<HTMLElement>(".mat-card"));
    const lines = Array.from(
      plate.querySelectorAll<SVGLineElement>("#mat-lines line"),
    );
    const lineDrawn: boolean[] = [];

    /* Leader lines are measured from live geometry (points → cards). */
    const layoutLines = (): void => {
      if (!lines.length || !plate.isConnected) return;
      const fig = plate.getBoundingClientRect();
      if (fig.width < 10) return;
      points.forEach((pt, i) => {
        const card = cards[i];
        const ln = lines[i];
        if (!card || !ln) return;
        const pr = pt.getBoundingClientRect();
        const cr = card.getBoundingClientRect();
        ln.setAttribute("x1", (pr.left + pr.width / 2 - fig.left).toFixed(1));
        ln.setAttribute("y1", (pr.top + pr.height / 2 - fig.top).toFixed(1));
        ln.setAttribute("x2", (cr.left + cr.width / 2 - fig.left).toFixed(1));
        ln.setAttribute("y2", (cr.top - fig.top).toFixed(1));
        const len = ln.getTotalLength();
        ln.style.strokeDasharray = String(len);
        if (!lineDrawn[i]) ln.style.strokeDashoffset = String(len);
      });
    };
    layoutLines();
    window.addEventListener("resize", layoutLines);
    ScrollTrigger.addEventListener("refresh", layoutLines);
    if (document.fonts?.ready) document.fonts.ready.then(layoutLines);

    /* ---- survey spotlight focus / blur ---- */
    function focusMat(i: number) {
      const pt = points[i];
      if (!pt || !spot || !photoWrap) return;
      spot.style.setProperty("--sx", pt.style.left);
      spot.style.setProperty("--sy", pt.style.top);
      spot.style.opacity = "1";
      photoWrap.classList.add("mat-dim");
    }
    function blurMat() {
      if (spot) spot.style.opacity = "0";
      photoWrap?.classList.remove("mat-dim");
    }

    /* ---- material detail modal (#mat-modal lives in <MatModal />) ---- */
    const modal = document.getElementById("mat-modal");
    const modalCard = modal?.querySelector<HTMLElement>(".mm-card") ?? null;
    const mmSwatch = document.getElementById("mm-swatch");
    const mmName = document.getElementById("mm-name");
    const mmLoc = document.getElementById("mm-loc");
    const mmLong = document.getElementById("mm-long");
    const closeBtn = document.getElementById("mat-modal-close");
    let lastFocus: HTMLElement | null = null;

    function openModal(i: number) {
      const m = MATS[i];
      const card = cards[i];
      if (!m || !card || !modal) return;
      lastFocus = document.activeElement as HTMLElement | null;
      const swatch = card.querySelector<HTMLElement>(".mat-swatch");
      const h4 = card.querySelector<HTMLElement>("h4");
      if (mmSwatch && swatch) mmSwatch.style.background = swatch.style.background;
      if (mmName && h4) mmName.textContent = h4.textContent;
      if (mmLoc) mmLoc.textContent = m.loc;
      if (mmLong) mmLong.textContent = m.long;
      modal.classList.add("on");
      blurMat();
      if (modalCard) {
        gsap.fromTo(
          modalCard,
          { opacity: 0, scale: 0.94, y: 10 },
          { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: "power3.out" },
        );
      }
      closeBtn?.focus();
    }
    function closeModal() {
      modal?.classList.remove("on");
      if (lastFocus?.focus) lastFocus.focus();
    }

    /* Cross-component close channels (original: KC.UI.closeMatModal). */
    window.__kcCloseMatModal = closeModal;
    const onCoordEvent = () => closeModal();
    document.addEventListener("kc:close-mat-modal", onCoordEvent);
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onEsc);

    /* ---- plate + modal interactions ---- */
    const off: (() => void)[] = [];
    function listen(target: Element, type: string, fn: EventListener) {
      target.addEventListener(type, fn);
      off.push(() => target.removeEventListener(type, fn));
    }

    cards.forEach((card, i) => {
      const enter = () => focusMat(i);
      const leave = () => blurMat();
      const focus = () => focusMat(i);
      const blur = () => blurMat();
      const click = () => openModal(i);
      const key = (e: KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openModal(i);
        }
      };
      listen(card, "mouseenter", enter);
      listen(card, "mouseleave", leave);
      listen(card, "focus", focus);
      listen(card, "blur", blur);
      listen(card, "click", click);
      listen(card, "keydown", key as EventListener);
    });

    points.forEach((pt, i) => {
      const enter = () => {
        if (!spot) return;
        spot.style.setProperty("--sx", pt.style.left);
        spot.style.setProperty("--sy", pt.style.top);
        spot.style.opacity = "1";
      };
      const leave = () => blurMat();
      const click = () => openModal(i);
      listen(pt, "mouseenter", enter);
      listen(pt, "mouseleave", leave);
      listen(pt, "click", click);
    });

    if (closeBtn) listen(closeBtn, "click", () => closeModal());
    if (modal) {
      listen(modal, "click", (e) => {
        if (e.target === modal) closeModal();
      });
    }

    /* ---- scroll choreography (skipped when reduced, like script-06) ---- */
    const ctx = gsap.context(() => {
      if (reduced) return;

      /* headline weight scrub */
      gsap.fromTo(
        "#about-h",
        { fontWeight: 300 },
        {
          fontWeight: 560,
          ease: "none",
          scrollTrigger: {
            trigger: "#about-h",
            start: "top 85%",
            end: "top 25%",
            scrub: 1,
          },
        },
      );

      /* magnetic word drifts */
      el.querySelectorAll<HTMLElement>(".magnetic").forEach((p) => {
        splitWords(p).forEach((w, i) => {
          const off2 = (((i * 13) % 9) - 4) * 11 * (i % 2 ? 1 : -1);
          gsap.fromTo(
            w,
            { x: off2, opacity: 0.1 },
            {
              x: 0,
              opacity: 1,
              ease: "none",
              scrollTrigger: {
                trigger: w,
                start: "top 92%",
                end: "top 60%",
                scrub: 1.2,
              },
            },
          );
        });
      });

      /* reveal-image parallax (the plate has its own scene) */
      el.querySelectorAll<HTMLElement>(".reveal-img").forEach((node) => {
        if (node.id === "mat-plate") return;
        const img = node.querySelector("img");
        gsap.fromTo(
          node,
          { opacity: 0, scale: 1.06 },
          {
            opacity: 1,
            scale: 1,
            ease: "none",
            scrollTrigger: {
              trigger: node,
              start: "top 95%",
              end: "top 55%",
              scrub: 1,
            },
          },
        );
        if (img) {
          gsap.fromTo(
            img,
            { scale: 1.22 },
            {
              scale: 1,
              ease: "none",
              scrollTrigger: {
                trigger: node,
                start: "top 95%",
                end: "top 40%",
                scrub: 1,
              },
            },
          );
        }
      });

      /* values reveal */
      el.querySelectorAll<HTMLElement>(".values li").forEach((li) => {
        gsap.from(li, {
          opacity: 0,
          y: 34,
          duration: 1.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: li,
            start: "top 88%",
            toggleActions: "play none none reverse",
          },
        });
      });

      /* REV1 — the plate pins (CSS sticky inside #mat-pin) while the five
         cards materialize at 20 / 35 / 50 / 65 / 80 % of the runway */
      const matPin = el.querySelector("#mat-pin");
      gsap.set(points, { scale: 0, opacity: 0 });
      gsap.set(cards, { opacity: 0, y: 24 });
      const mtl = gsap.timeline({
        scrollTrigger: {
          trigger: matPin,
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });
      mtl.to(
        points,
        { scale: 1, opacity: 1, stagger: 0.025, duration: 0.05, ease: "back.out(2.2)" },
        0.02,
      );
      [0.2, 0.35, 0.5, 0.65, 0.8].forEach((at, i) => {
        mtl.to(cards[i], { opacity: 1, y: 0, duration: 0.08, ease: "power2.out" }, at);
        const ln = lines[i];
        if (ln) {
          mtl.to(
            ln,
            {
              strokeDashoffset: 0,
              duration: 0.08,
              ease: "none",
              onStart: () => {
                lineDrawn[i] = true;
              },
            },
            at,
          );
        }
      });
      mtl.to({}, { duration: 0.16 });
    }, el);

    return () => {
      window.removeEventListener("resize", layoutLines);
      ScrollTrigger.removeEventListener("refresh", layoutLines);
      off.forEach((fn) => fn());
      off.length = 0;
      document.removeEventListener("kc:close-mat-modal", onCoordEvent);
      window.removeEventListener("keydown", onEsc);
      delete window.__kcCloseMatModal;
      ctx.revert();
    };
  }, [reduced]);

  return (
    <section
      ref={rootRef}
      id="sec-about"
      className="sec"
      data-name="THE STUDIO"
      data-index="01"
      data-accent="#A67B5B"
      data-theme="dark"
    >
  <div className="about-bg" aria-hidden="true"><div className="about-blob b1"></div><div className="about-blob b2"></div><div className="about-blob b3"></div></div>
  <div className="wrap about-wrap">
    <div className="sec-label light">01 · THE STUDIO</div>
    <h2 id="about-h"><em>We build the stage</em> for life's most important moments.</h2>
    <p className="about-lead">Keystone Collective began with an argument. In the autumn of 2004, an architect and a builder disagreed over eleven centimeters of glass, specifically whether a window should reach the corner or stop short and let the wall speak. They resolved it by building the wall and the window as one piece, and discovered they shared a conviction. A home deserves the patience of both the person who draws it and the person who sets it in stone.</p>
    <div className="about-grid">
      <div className="about-figs">
        <figure className="about-fig reveal-img" data-perspective>
          <div className="fig-frame photo photo-frame"><img src="/images/61726f535b24412fb7c47a9482e11188.jpeg" alt="Board-formed concrete wall in the Keystone studio" loading="lazy"  /></div>
          <figcaption>BOARD-FORMED CONCRETE · CURED 28 DAYS</figcaption>
        </figure>
        <figure className="about-fig about-fig-sm reveal-img" data-perspective>
          <div className="fig-frame photo photo-frame"><img src="/images/93b180fd558b4445ad81e5c4caf6a47f.jpeg" alt="Quartersawn white oak millwork detail" loading="lazy"  /></div>
          <figcaption>WHITE OAK · QUARTERSAWN, OIL FINISH</figcaption>
        </figure>
      </div>
      <div className="about-col">
        <p className="magnetic">Twenty years and eighty-four homes later, we still argue about the details. The argument is the method. Every millimeter gets contested and defended, because the details are the house and the house has to hold a life.</p>
        <blockquote>“A home is the quiet architecture of a life.”</blockquote>
        <p className="magnetic">We work slowly on purpose. Twelve projects a year, never more. That is enough to know every client's name and every oak we refused to cut.</p>
      </div>
    </div>
    <div id="mat-pin">
      <figure className="plate reveal-img" id="mat-plate">
        <div className="plate-img photo photo-frame plate-photo" id="plate-photo">
          <img id="mat-photo" src="/images/real/studio-plate.jpg" alt="The Keystone studio at golden hour with material survey points" loading="lazy"  />
          <div id="mat-spot" aria-hidden="true"></div>
          <button className="mat-point" data-i="0" style={{ "left": "15%", "top": "44%" }} aria-label="Board-formed concrete survey point" data-cursor="DETAIL"><i /></button>
          <button className="mat-point" data-i="1" style={{ "left": "36%", "top": "66%" }} aria-label="Quartersawn white oak survey point" data-cursor="DETAIL"><i /></button>
          <button className="mat-point" data-i="2" style={{ "left": "55%", "top": "30%" }} aria-label="Unsealed bronze survey point" data-cursor="DETAIL"><i /></button>
          <button className="mat-point" data-i="3" style={{ "left": "73%", "top": "58%" }} aria-label="Italian travertine survey point" data-cursor="DETAIL"><i /></button>
          <button className="mat-point" data-i="4" style={{ "left": "89%", "top": "34%" }} aria-label="Belgian linen survey point" data-cursor="DETAIL"><i /></button>
        </div>
        <svg className="mat-lines" aria-hidden="true" id="mat-lines"><line /><line /><line /><line /><line /></svg>
        <div className="mat-cards" id="mat-cards">
          <article className="mat-card reg-corners" data-i="0" tabIndex={0} data-cursor="DETAIL"><span className="mat-swatch" style={{ "background": "#A9A5A0" }}></span><h4>Board-Formed Concrete</h4><div className="mat-spec"><div><b>ORIGIN</b> LOCAL POUR · BOULDER CO</div><div><b>FINISH</b> SEALED MATTE</div><div><b>AGING</b> MINERAL BLOOM</div></div></article>
          <article className="mat-card reg-corners" data-i="1" tabIndex={0} data-cursor="DETAIL"><span className="mat-swatch" style={{ "background": "#A67B5B" }}></span><h4>Quartersawn White Oak</h4><div className="mat-spec"><div><b>ORIGIN</b> OHIO VALLEY</div><div><b>FINISH</b> HARDWAX OIL</div><div><b>AGING</b> DEEPENS TO AMBER</div></div></article>
          <article className="mat-card reg-corners" data-i="2" tabIndex={0} data-cursor="DETAIL"><span className="mat-swatch" style={{ "background": "#8C7853" }}></span><h4>Unsealed Bronze</h4><div className="mat-spec"><div><b>ORIGIN</b> ARCHITECTURAL ALLOY</div><div><b>FINISH</b> LIVING PATINA</div><div><b>AGING</b> MUSEUM BROWN</div></div></article>
          <article className="mat-card reg-corners" data-i="3" tabIndex={0} data-cursor="DETAIL"><span className="mat-swatch" style={{ "background": "#D4C5B0" }}></span><h4>Italian Travertine</h4><div className="mat-spec"><div><b>ORIGIN</b> TIVOLI QUARRIES</div><div><b>FINISH</b> HONED</div><div><b>AGING</b> RECORDS DECADES</div></div></article>
          <article className="mat-card reg-corners" data-i="4" tabIndex={0} data-cursor="DETAIL"><span className="mat-swatch" style={{ "background": "#E8E2D4" }}></span><h4>Belgian Linen</h4><div className="mat-spec"><div><b>ORIGIN</b> FLANDERS FLAX</div><div><b>FINISH</b> STONE-WASHED</div><div><b>AGING</b> SOFTENS YEARLY</div></div></article>
        </div>
        <figcaption className="plate-cap"><span>THE STUDIO AT GOLDEN HOUR · FIVE MATERIALS, SURVEYED</span><span>BOULDER, COLORADO · 39.99° N / 105.28° W</span></figcaption>
      </figure>
    </div>
    <ul className="values">
      <li><span className="v-num">01</span><h3>Material honesty</h3><p>We specify materials that age with intent. Oak deepens, and bronze keeps a record of every hand.</p></li>
      <li><span className="v-num">02</span><h3>Craft in perpetuity</h3><p>Every joint is detailed twice, once for the craftsman's hands and once for the century that follows.</p></li>
      <li><span className="v-num">03</span><h3>The client as co-author</h3><p>Your life is the program. We are its translators.</p></li>
      <li><span className="v-num">04</span><h3>Stewardship of the land</h3><p>We build on the land, never over it. The grove was here first.</p></li>
    </ul>
    <div className="about-note reveal-img">
      <span className="who">Marcus Hale, Principal</span>
      <p>“I design the way a mason sets stone, one decision at a time, and every one of them load-bearing.”</p>
    </div>
  </div>
</section>
  );
}
