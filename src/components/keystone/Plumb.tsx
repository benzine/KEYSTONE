"use client";

/**
 * Plumb — the plumb-line back-to-top button.
 * Full port of the original script-17 plumb bob:
 *  - `.show` past 600px of scroll (this wiring was missing in the first
 *    React pass — the button rendered but never became visible)
 *  - click → instant jump to top, hero scrub at-rest restore after the
 *    scrub settles (3 frames), plus the silent self-heal safety net
 *  - assembly drop-and-return animation on every ascent
 *  - pendulum physics on the ticker (scroll-velocity driven) + wire
 *    length (--wl) shortens as the page is read
 */

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useKc } from "./KcProvider";
import { clamp } from "@/lib/keystone/kc-core";

export default function Plumb() {
  const { state, reduced } = useKc();
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const btn = btnRef.current;
    if (!btn) return;
    const assembly = btn.querySelector<HTMLElement>(".pb-assembly");

    const PB = { theta: 0, omega: 0, hover: false, busy: false };

    const onScroll = () => btn.classList.toggle("show", window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    const onEnter = () => {
      PB.hover = true;
    };
    const onLeave = () => {
      PB.hover = false;
    };
    btn.addEventListener("mouseenter", onEnter);
    btn.addEventListener("mouseleave", onLeave);
    btn.addEventListener("focus", onEnter);
    btn.addEventListener("blur", onLeave);

    /* At-rest contract after an ascent: KEYSTONE visible; tagline chars
       hidden (opacity 0); wrap visible; definition hidden. clearProps ONLY
       where the CSS default IS the at-rest state. */
    const restoreHero = () => {
      gsap.set("#hero-copy", { clearProps: "opacity,y,filter" });
      gsap.set("#hero-tagline-wrap", { opacity: 1 });
      gsap.set(".hero-letter", { clearProps: "transform,opacity,filter" });
      gsap.set(".tag-ch", { opacity: 0, clearProps: "transform,filter" });
      gsap.set("#hero-defn", { clearProps: "opacity,y" });
      gsap.set(
        ["#hero-eyebrow", "#hero-sub", "#scroll-hint", "#hero-cta"],
        { clearProps: "opacity,y" },
      );
      gsap.set("#hero-title", { clearProps: "color,fontWeight,letterSpacing" });
    };

    const onClick = () => {
      if (PB.busy) return;
      PB.busy = true;
      PB.hover = false;
      window.scrollTo(0, 0);
      /* the scrub lands on the next 1-2 frames — restore AFTER it settles */
      let n = 0;
      const tick = () => {
        n++;
        if (n >= 3) requestAnimationFrame(restoreHero);
        else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      /* safety net: stranded title OR leaked tagline → self-heal silently */
      window.setTimeout(() => {
        const c = document.getElementById("hero-copy");
        const t = document.querySelector<HTMLElement>(".tag-ch");
        const badCopy = !!c && parseFloat(getComputedStyle(c).opacity) < 0.5;
        const badTag = !!t && parseFloat(getComputedStyle(t).opacity) > 0.5;
        if (badCopy || badTag) restoreHero();
      }, 400);
      if (assembly) {
        gsap
          .timeline({
            onComplete: () => {
              PB.busy = false;
              PB.theta = 5;
              PB.omega = 0;
            },
          })
          .to(assembly, { y: 160, opacity: 0, duration: 0.4, ease: "power2.in" })
          .set(assembly, { y: -160 })
          .to(assembly, {
            y: 0,
            opacity: 1,
            duration: 0.85,
            ease: "power3.out",
            delay: 0.6,
          });
      } else {
        PB.busy = false;
      }
    };
    btn.addEventListener("click", onClick);

    /* pendulum physics + wire length — full motion only */
    let ticker: ((t: number) => void) | null = null;
    if (!reduced && assembly) {
      ticker = () => {
        const S = state.current;
        if (PB.hover) {
          PB.omega *= 0.72;
          PB.theta *= 0.82;
        } else {
          const drive = clamp(S.vel, -46, 46) * 0.0045;
          PB.omega += -PB.theta * 0.0042 - PB.omega * 0.012 + drive;
        }
        PB.theta = clamp(PB.theta + PB.omega, -26, 26);
        gsap.set(assembly, { rotation: PB.theta });
        const h = document.documentElement.scrollHeight - window.innerHeight;
        const prog = h > 0 ? clamp(window.scrollY / h, 0, 1) : 0;
        assembly.style.setProperty("--wl", (86 - prog * 46).toFixed(1) + "px");
      };
      gsap.ticker.add(ticker);
    }

    return () => {
      window.removeEventListener("scroll", onScroll);
      btn.removeEventListener("mouseenter", onEnter);
      btn.removeEventListener("mouseleave", onLeave);
      btn.removeEventListener("focus", onEnter);
      btn.removeEventListener("blur", onLeave);
      btn.removeEventListener("click", onClick);
      if (ticker) gsap.ticker.remove(ticker);
      if (assembly) {
        gsap.killTweensOf(assembly);
        gsap.set(assembly, { clearProps: "all" });
      }
      btn.classList.remove("show");
    };
  }, [state, reduced]);

  return (
    <button
      ref={btnRef}
      id="plumb"
      aria-label="Back to top"
      data-cursor="ASCEND"
    >
      <span className="pb-guide" aria-hidden="true" />
      <span className="pb-pin" aria-hidden="true" />
      <span className="pb-assembly" aria-hidden="true">
        <span className="pb-wire" />
        <span className="pb-weight" />
      </span>
    </button>
  );
}
