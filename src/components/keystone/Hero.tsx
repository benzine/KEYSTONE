"use client";

/**
 * Hero — Section 00 · AWAKENING.
 * React port of the original hero markup + script-05 scene:
 * title char-split intro, particle canvas, scroll-scrubbed dolly/parallax,
 * letter scatter, flare choreography.
 *
 * NEW: cinematic aerial video backdrop (Pexels 7304871) — dual-element
 * crossfade loop so the seam never blanks; reveals over the photo layers
 * once frames are decoded; pauses off-screen; reduced-motion keeps photos.
 */

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useKc } from "./KcProvider";
import { fitCanvas, splitChars } from "@/lib/keystone/kc-core";
import { whenBooted } from "@/lib/keystone/boot";

gsap.registerPlugin(ScrollTrigger);

/* crossfade window at the loop seam (seconds) */
const VIDEO_XFADE = 1.7;

export default function Hero() {
  const { state, reduced } = useKc();
  const rootRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoLayerRef = useRef<HTMLDivElement>(null);
  const videoARef = useRef<HTMLVideoElement>(null);
  const videoBRef = useRef<HTMLVideoElement>(null);

  /* ---- aerial backdrop: autoplay, loop, seamless crossfade ---- */
  useEffect(() => {
    const layer = videoLayerRef.current;
    const a = videoARef.current;
    const b = videoBRef.current;
    const section = rootRef.current;
    if (!layer || !a || !b || !section || reduced) return;

    const src = "/videos/hero-aerial.mp4";
    a.src = src;
    b.src = src;
    a.muted = true;
    b.muted = true;

    let active: HTMLVideoElement = a;
    let standby: HTMLVideoElement = b;
    let crossfading = false;
    let started = false;
    const cleanups: (() => void)[] = [];

    gsap.set(b, { opacity: 0 });

    const swapTo = (v: HTMLVideoElement) => {
      active = v;
      standby = v === a ? b : a;
    };

    /* the seam: as the active element approaches its end, start the standby
       from zero and cross-fade — the eye never sees a reset or a blank */
    const startCrossfade = () => {
      if (crossfading) return;
      crossfading = true;
      const from = active;
      const to = standby;
      to.currentTime = 0;
      to.play()?.catch(() => {});
      gsap.to(to, { opacity: 1, duration: VIDEO_XFADE, ease: "power1.inOut" });
      gsap.to(from, {
        opacity: 0,
        duration: VIDEO_XFADE,
        ease: "power1.inOut",
        onComplete: () => {
          from.pause();
          from.currentTime = 0;
          swapTo(to);
          crossfading = false;
        },
      });
    };

    const onTime = (e: Event) => {
      const v = e.target as HTMLVideoElement;
      if (v !== active || crossfading) return;
      if (!v.duration || !isFinite(v.duration)) return;
      if (v.duration - v.currentTime <= VIDEO_XFADE + 0.08) startCrossfade();
    };
    [a, b].forEach((v) => {
      v.addEventListener("timeupdate", onTime);
      cleanups.push(() => v.removeEventListener("timeupdate", onTime));
    });

    /* hard safety net — if a timeupdate is ever missed, plain-loop instead */
    const onEnded = (e: Event) => {
      const v = e.target as HTMLVideoElement;
      if (v !== active) return;
      v.currentTime = 0;
      v.play()?.catch(() => {});
    };
    [a, b].forEach((v) => {
      v.addEventListener("ended", onEnded);
      cleanups.push(() => v.removeEventListener("ended", onEnded));
    });

    /* first decoded frames → fade the layer in over the photo plates and
       flip hero chrome to dark-mode legibility */
    const onPlaying = () => {
      if (started) return;
      started = true;
      layer.classList.add("on");
      document.body.classList.add("hero-video-on");
      const nav = document.getElementById("nav");
      nav?.classList.add("on-dark");
      document.body.classList.add("sec-dark");
    };
    a.addEventListener("playing", onPlaying);
    cleanups.push(() => a.removeEventListener("playing", onPlaying));

    const playActive = () => {
      active.play()?.catch(() => {});
    };

    const p = a.play();
    if (p && typeof p.catch === "function") {
      p.catch(() => {
        /* autoplay refused (battery saver etc.) — retry once on interaction */
        const retry = () => {
          a.play()?.catch(() => {});
          window.removeEventListener("pointerdown", retry);
        };
        window.addEventListener("pointerdown", retry);
        cleanups.push(() => window.removeEventListener("pointerdown", retry));
      });
    }

    /* pause the backdrop while the hero is off-screen */
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries[0]?.isIntersecting ?? true;
        if (!vis) {
          a.pause();
          b.pause();
        } else if (started) {
          playActive();
        }
      },
      { threshold: 0.02 },
    );
    io.observe(section);
    cleanups.push(() => io.disconnect());

    /* cinematic slow drift — a barely-there push-in that keeps the frame
       alive; both elements drift in lockstep so the crossfade is seamless */
    const drift = gsap.to([a, b], {
      scale: 1.07,
      duration: 26,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
    });
    cleanups.push(() => {
      drift.kill();
    });

    return () => {
      cleanups.forEach((fn) => fn());
      gsap.killTweensOf([a, b]);
      a.pause();
      b.pause();
      if (started) {
        layer.classList.remove("on");
        document.body.classList.remove("hero-video-on");
        /* only strip the dark chrome if the theme isn't dark anyway —
           applySection re-syncs on the next scroll tick */
        if (!document.documentElement.classList.contains("theme-dark")) {
          document.getElementById("nav")?.classList.remove("on-dark");
          document.body.classList.remove("sec-dark");
        }
      }
    };
  }, [reduced]);

  useEffect(() => {
    const el = rootRef.current;
    const cv = canvasRef.current;
    if (!el || !cv) return;

    const KCState = state.current;

    /* ---- split headline + tagline into chars ---- */
    const title = el.querySelector<HTMLElement>("#hero-title");
    const tagline = el.querySelector<HTMLElement>("#hero-tagline");
    const letters = title ? splitChars(title, "hero-letter") : [];
    if (tagline) splitChars(tagline, "tag-ch");

    /* ---- particle field canvas ---- */
    let HC = fitCanvas(cv);
    const parts: { x: number; y: number; z: number; r: number }[] = [];
    for (let i = 0; i < 340; i++) {
      parts.push({
        x: Math.random(),
        y: Math.random(),
        z: 0.3 + Math.random() * 0.7,
        r: 0.6 + Math.random() * 1.7,
      });
    }
    function drawHero(dt: number) {
      const ctx = HC.ctx;
      const w = HC.w;
      const h = HC.h;
      ctx.clearRect(0, 0, w, h);
      const p = KCState.heroP;
      const cr = Math.round(214 + (123 - 214) * p);
      const cg = Math.round(183 + (167 - 183) * p);
      const cb = Math.round(140 + (188 - 140) * p);
      for (let i = 0; i < parts.length; i++) {
        const pt = parts[i];
        pt.x -= (0.014 + KCState.nvel * 0.11) * pt.z * dt;
        pt.y -= (0.006 + KCState.nvel * 0.03) * pt.z * dt;
        if (pt.x < -0.02) pt.x = 1.02;
        if (pt.y < -0.02) pt.y = 1.02;
        ctx.globalAlpha = (0.14 + pt.z * 0.4) * (0.7 + p * 0.3);
        ctx.fillStyle = `rgb(${cr},${cg},${cb})`;
        ctx.beginPath();
        ctx.arc(pt.x * w, pt.y * h, pt.r * pt.z * (1 + p * 0.6), 0, 6.283);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    const onResize = () => {
      HC = fitCanvas(cv);
    };
    window.addEventListener("resize", onResize);

    /* visibility flag for the canvas ticker */
    const visTrigger = ScrollTrigger.create({
      trigger: el,
      start: "top bottom",
      end: "bottom top",
      onToggle: (s) => {
        KCState.vis.hero = s.isActive;
      },
    });

    const onTicker = (_t: number, dms: number) => {
      if (KCState.vis.hero && !KCState.modalOpen) {
        drawHero(Math.min(dms / 1000, 0.05));
      }
    };
    gsap.ticker.add(onTicker);

    /* ---- intro + scrub scene ---- */
    let intro: gsap.core.Timeline | null = null;
    let ungate: (() => void) | null = null;
    const ctx = gsap.context(() => {
      if (reduced) return;

      /* the letter-rise waits for the preloader curtain to start lifting
         (lib/keystone/boot.ts) so the hero plays into the reveal instead
         of burning off unseen behind the boot sheet */
      ungate = whenBooted(() => {
        intro = gsap.timeline({ delay: 0.2 });
        intro
          .from(el.querySelectorAll(".hero-letter"), {
            yPercent: 120,
            opacity: 0,
            stagger: 0.05,
            duration: 1.15,
            ease: "power4.out",
          })
          .from(
            ["#hero-eyebrow", "#hero-sub"],
            { opacity: 0, y: 14, stagger: 0.14, duration: 0.9, ease: "power3.out" },
            0.35,
          )
          .from("#hero-cta", { opacity: 0, y: 18, duration: 0.9, ease: "power3.out" }, 0.7)
          .from("#scroll-hint", { opacity: 0, duration: 0.9 }, 0.9);
      });

      gsap.to("#hero-cta .btn-arch", {
        y: "+=12",
        duration: 2.6,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
      });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: "bottom top",
          scrub: 0.9,
          onUpdate: (self) => {
            KCState.heroP = self.progress;
            document
              .getElementById("nav")
              ?.classList.toggle(
                "on-dark",
                self.progress > 0.55 ||
                  document.documentElement.classList.contains("theme-dark") ||
                  document.body.classList.contains("hero-video-on"),
              );
          },
        },
      });
      tl.to("#hero-dolly", { scale: 1.3, ease: "none", duration: 1 }, 0)
        .to("#lyr-horizon", { yPercent: -36, ease: "none", duration: 1 }, 0)
        .to("#lyr-photo", { yPercent: -42, ease: "none", duration: 1 }, 0)
        .to("#lyr-shapes", { yPercent: -66, rotation: 9, ease: "none", duration: 1 }, 0)
        .to("#lyr-rays", { opacity: 0.5, rotation: -5, duration: 0.35, ease: "none" }, 0.06)
        .to("#lyr-rays", { opacity: 0, duration: 0.25, ease: "none" }, 0.55)
        .to("#lyr-skycool", { opacity: 1, duration: 0.5, ease: "none" }, 0.04)
        .fromTo("#hp-cool", { opacity: 0 }, { opacity: 1, duration: 0.5, ease: "none" }, 0.04)
        .to("#lyr-skywarm", { opacity: 0, duration: 0.55, ease: "none" }, 0.12)
        .to("#hp-warm", { opacity: 0, duration: 0.55, ease: "none" }, 0.12)
        .to("#hero-title", { color: "#F5F1EA", duration: 0.22, ease: "none" }, 0.2)
        .fromTo("#lyr-blueprint", { opacity: 0 }, { opacity: 0.55, duration: 0.16, ease: "none" }, 0.18)
        .to("#lyr-blueprint", { opacity: 0.07, duration: 0.22, ease: "none" }, 0.5)
        .fromTo(
          ".hero-float",
          { opacity: 0, y: 22 },
          { opacity: 1, y: 0, stagger: 0.05, duration: 0.14, ease: "none" },
          0.09,
        )
        .to(".hero-float", { opacity: 0, y: -46, stagger: 0.04, duration: 0.16, ease: "none" }, 0.38)
        .fromTo(
          "#hero-title",
          { fontWeight: 280, letterSpacing: "0.09em" },
          { fontWeight: 640, letterSpacing: "-0.015em", duration: 0.3, ease: "none" },
          0,
        )
        .to("#hero-eyebrow", { opacity: 0, y: -20, duration: 0.1, ease: "none" }, 0.18)
        .to("#hero-sub", { opacity: 0, duration: 0.08, ease: "none" }, 0.26);

      letters.forEach((L, i) => {
        tl.to(
          L,
          {
            x: gsap.utils.random(-260, 260),
            y: gsap.utils.random(-220, 220),
            rotation: gsap.utils.random(-85, 85),
            opacity: 0,
            filter: "blur(9px)",
            duration: 0.26,
            ease: "power1.in",
          },
          0.16 + i * 0.012,
        );
      });

      tl.fromTo(
        ".tag-ch",
        {
          opacity: 0,
          y: () => gsap.utils.random(-46, 46),
          x: () => gsap.utils.random(-34, 34),
        },
        {
          opacity: 1,
          y: 0,
          x: 0,
          stagger: { each: 0.006, from: "random" },
          duration: 0.18,
          ease: "power2.out",
        },
        0.5,
      )
        .fromTo("#hero-defn", { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.1, ease: "none" }, 0.6)
        .to("#hero-copy", { opacity: 0, y: -90, filter: "blur(5px)", duration: 0.14, ease: "none" }, 0.86)
        .to("#hero-tagline-wrap", { opacity: 0, y: -60, duration: 0.1, ease: "none" }, 0.88)
        .fromTo("#flare-warm", { opacity: 0 }, { opacity: 0.95, duration: 0.14, ease: "none" }, 0.18)
        .to("#flare-warm", { opacity: 0, duration: 0.18, ease: "none" }, 0.52)
        .fromTo("#flare-cool", { opacity: 0 }, { opacity: 0.9, duration: 0.18, ease: "none" }, 0.5)
        .to("#flare-cool", { opacity: 0.22, duration: 0.26, ease: "none" }, 0.8)
        .fromTo("#flare", { xPercent: -24 }, { xPercent: 8, duration: 1, ease: "none" }, 0)
        .fromTo("#vignette", { opacity: 0.32 }, { opacity: 0.82, duration: 1, ease: "none" }, 0)
        .to("#hero-cta", { opacity: 0, y: -34, duration: 0.08, ease: "none" }, 0.04)
        .to("#scroll-hint", { opacity: 0, duration: 0.04, ease: "none" }, 0.01);
    }, el);

    return () => {
      window.removeEventListener("resize", onResize);
      gsap.ticker.remove(onTicker);
      visTrigger.kill();
      ctx.revert();
      ungate?.();
      intro?.kill();
    };
  }, [state, reduced]);

  return (
    <section
      ref={rootRef}
      id="sec-hero"
      className="sec"
      data-name="AWAKENING"
      data-index="00"
      data-accent="#C9A962"
      data-theme="light"
    >
      <div className="stage" id="hero-stage">
        <div id="hero-dolly">
          <div id="hero-tilt">
            <div className="h-layer" id="lyr-skywarm" />
            <div className="h-layer" id="lyr-skycool" />
            <div className="h-layer" id="lyr-photo" aria-hidden="true">
              <div className="hero-photo" id="hp-warm" />
              <div className="hero-photo" id="hp-cool" />
            </div>
            <div id="hero-video" ref={videoLayerRef} aria-hidden="true">
              <video
                ref={videoARef}
                muted
                playsInline
                autoPlay
                loop={false}
                preload="auto"
                disablePictureInPicture
                tabIndex={-1}
              />
              <video
                ref={videoBRef}
                muted
                playsInline
                loop={false}
                preload="auto"
                disablePictureInPicture
                tabIndex={-1}
              />
              <div className="hv-veil" />
              <div className="hv-grade" />
            </div>
            <div className="h-layer" id="lyr-rays">
              <div className="ray r1" />
              <div className="ray r2" />
            </div>
            <div className="h-layer" id="lyr-horizon">
              <svg viewBox="0 0 1440 320" preserveAspectRatio="none" aria-hidden="true">
                <path
                  d="M0 190 C180 150 320 210 520 185 C720 160 900 205 1120 180 C1280 165 1380 190 1440 175 L1440 320 H0 Z"
                  fill="rgba(44,44,44,.22)"
                />
                <path
                  d="M0 250 C200 220 380 260 620 240 C860 225 1060 265 1440 235 L1440 320 H0 Z"
                  fill="rgba(30,30,28,.5)"
                />
              </svg>
            </div>
            <div className="h-layer" id="lyr-shapes">
              <div className="arch-shape" id="arch-form">
                <svg viewBox="0 0 120 150" aria-hidden="true">
                  <g stroke="currentColor" strokeWidth="1.4" fill="none">
                    <path d="M10 120 A50 50 0 0 1 110 120" />
                    <path d="M30 120 A30 30 0 0 1 90 120" />
                    <line x1="34" y1="105" x2="16.7" y2="95" />
                    <line x1="86" y1="105" x2="103.3" y2="95" />
                    <line x1="10" y1="120" x2="10" y2="134" />
                    <line x1="110" y1="120" x2="110" y2="134" />
                    <line x1="30" y1="120" x2="30" y2="134" />
                    <line x1="90" y1="120" x2="90" y2="134" />
                  </g>
                  <path
                    d="M35 76.7 A50 50 0 0 1 85 76.7 L75 94 A30 30 0 0 0 45 94 Z"
                    fill="#C9A962"
                    opacity=".92"
                  />
                </svg>
                <div className="cap">THE KEYSTONE</div>
              </div>
              <svg className="arch-shape" id="survey-mark" viewBox="0 0 100 100" aria-hidden="true">
                <g stroke="currentColor" fill="none" strokeWidth="1.2">
                  <circle cx="50" cy="50" r="34" strokeDasharray="5 7" />
                  <line x1="50" y1="4" x2="50" y2="96" />
                  <line x1="4" y1="50" x2="96" y2="50" />
                  <circle cx="50" cy="50" r="3" fill="currentColor" stroke="none" />
                </g>
              </svg>
            </div>
            <div className="h-layer" id="lyr-blueprint">
              <div className="bp-mark m1">DATUM +0.000</div>
              <div className="bp-mark m2">GRID 7.20 M</div>
            </div>
            <canvas ref={canvasRef} id="hero-canvas" aria-hidden="true" />
            <div className="hero-float fl1">TRAVERTINE · 24.6 MPA</div>
            <div className="hero-float fl2">WHITE OAK · QUARTERSAWN</div>
            <div className="hero-float fl3">BOARD-FORMED CONCRETE · 28 DAY CURE</div>
            <div className="hero-float fl4">BRONZE · UNSEALED PATINA</div>
            <div id="hero-copy">
              <div id="hero-eyebrow">
                ARCHITECTS &amp; BUILDERS · BOULDER, COLORADO · EST. 2004
              </div>
              <h1 id="hero-title" aria-label="Keystone">
                KEYSTONE
              </h1>
              <div id="hero-sub">C O L L E C T I V E</div>
            </div>
            <div id="hero-tagline-wrap">
              <p id="hero-tagline">The stone that holds everything together.</p>
              <div id="hero-defn">
                ( N. ) THE WEDGE AT THE APEX OF AN ARCH THAT LOCKS EVERY OTHER
                STONE IN PLACE
              </div>
            </div>
            <div id="hero-cta">
              <button
                className="btn-arch"
                data-target="#sec-about"
                data-tilt
                data-cursor="DESCEND"
              >
                BEGIN YOUR JOURNEY
              </button>
            </div>
            <div id="scroll-hint">
              <span>SCROLL TO DESCEND</span>
              <span className="hint-line">
                <i />
              </span>
            </div>
            <div id="flare" aria-hidden="true">
              <div className="flare-group" id="flare-warm">
                <div className="streak" />
                <div className="ghost g1" />
                <div className="ghost g2" />
                <div className="ghost g3" />
              </div>
              <div className="flare-group" id="flare-cool">
                <div className="streak" />
                <div className="ghost g1" />
                <div className="ghost g2" />
                <div className="ghost g3" />
              </div>
            </div>
            <div id="vignette" aria-hidden="true" />
            <div id="vignette-vel" aria-hidden="true" />
          </div>
        </div>
        <div className="sheet-tag">SHT A-000 · SITE PLAN · REV C</div>
      </div>
    </section>
  );
}
