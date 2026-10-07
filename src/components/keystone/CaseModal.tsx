"use client";

/**
 * CaseModal — project monograph sheet.
 * React port of the original script-10: populates the sheet from PROJECTS,
 * plays the overlay/flare/sheet/stagger open choreography, locks the page,
 * manages focus + ESC/Tab keys, the photo lightbox, and the sheet download.
 *
 * The modal element stays in the DOM (matching the original CSS) and is
 * driven imperatively (an "on" class + gsap timelines, like the original),
 * with the sheet content rendered from the caseKey prop. The parent owns
 * { caseKey, trigger } and clears them via onClose() once the close flow
 * completes.
 */

import { useCallback, useEffect, useRef, type RefObject } from "react";
import gsap from "gsap";
import { useKc } from "./KcProvider";
import { KC_CASES } from "./Cases";
import { downloadText, type KcState } from "@/lib/keystone/kc-core";
import { kcImg } from "@/lib/keystone/images";
import { PROJECTS } from "@/lib/keystone/projects";

interface CaseModalProps {
  caseKey: string | null;
  trigger: HTMLElement | null;
  onClose: () => void;
}

/** The shared runtime flags live on the mutable state ref owned by KcProvider. */
function setModalOpen(state: RefObject<KcState>, v: boolean): void {
  state.current.modalOpen = v;
}

export default function CaseModal({ caseKey, trigger, onClose }: CaseModalProps) {
  const { state, reduced, goTo } = useKc();

  const rootRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const flareRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const sheettagRef = useRef<HTMLDivElement>(null);
  const planImgRef = useRef<HTMLImageElement>(null);

  /* Lightbox — driven imperatively like the original. */
  const lbRef = useRef<HTMLDivElement>(null);
  const lbImgRef = useRef<HTMLImageElement>(null);
  const lbCapRef = useRef<HTMLDivElement>(null);
  const lbCloseRef = useRef<HTMLButtonElement>(null);
  const lbOnRef = useRef(false);

  /* Flow bookkeeping. */
  const openRef = useRef(false);
  const closingRef = useRef(false);
  const triggerRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const reducedRef = useRef(reduced);
  const keyBoundRef = useRef(false);
  const keyHandlerRef = useRef<((e: KeyboardEvent) => void) | null>(null);
  const flowCtxRef = useRef<gsap.Context | null>(null);

  /* Latest-prop refs so the imperative flows read current values. */
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);
  useEffect(() => {
    reducedRef.current = reduced;
  }, [reduced]);
  useEffect(() => {
    triggerRef.current = trigger;
  }, [trigger]);

  /* ---------- lightbox ---------- */

  const openLightbox = useCallback((src: string, cap: string) => {
    const lb = lbRef.current;
    if (!lb) return;
    if (lbImgRef.current) lbImgRef.current.src = src;
    if (lbCapRef.current) lbCapRef.current.textContent = cap;
    lbOnRef.current = true;
    lb.classList.add("on");
    gsap.fromTo(lb, { opacity: 0 }, { opacity: 1, duration: 0.3 });
    lbCloseRef.current?.focus();
  }, []);

  const closeLightbox = useCallback(() => {
    if (!lbOnRef.current) return;
    lbOnRef.current = false;
    const lb = lbRef.current;
    if (lb) {
      gsap.to(lb, {
        opacity: 0,
        duration: 0.25,
        onComplete: () => {
          lb.classList.remove("on");
        },
      });
    }
    closeBtnRef.current?.focus();
  }, []);

  /* ---------- keyboard trap ---------- */

  const focusables = useCallback((): HTMLElement[] => {
    const sel =
      'button, a[href], input, textarea, select, [tabindex]:not([tabindex="-1"])';
    const root = rootRef.current;
    if (!root) return [];
    let out = Array.from(root.querySelectorAll<HTMLElement>(sel));
    if (lbOnRef.current && lbRef.current) {
      out = out.concat(
        Array.from(lbRef.current.querySelectorAll<HTMLElement>(sel)),
      );
    }
    return out.filter(
      (el) => el.offsetParent !== null || el === document.activeElement,
    );
  }, []);

  const unbindKeys = useCallback(() => {
    if (!keyBoundRef.current) return;
    keyBoundRef.current = false;
    const h = keyHandlerRef.current;
    if (h) document.removeEventListener("keydown", h, true);
    keyHandlerRef.current = null;
  }, []);

  /* ---------- close flow (port of script-10 close) ---------- */

  const finishClose = useCallback(() => {
    openRef.current = false;
    closingRef.current = false;
    setModalOpen(state, false);
    document.documentElement.classList.remove("modal-locked");
    triggerRef.current?.focus();
    onCloseRef.current?.();
  }, [state]);

  const runCloseFlow = useCallback(() => {
    const root = rootRef.current;
    const overlay = overlayRef.current;
    const flare = flareRef.current;
    const sheet = sheetRef.current;
    const scrollEl = scrollRef.current;
    if (!root || !overlay || !flare || !sheet || !scrollEl) return;

    /* Interrupt any in-flight intro (ESC during open): freeze its partial state. */
    flowCtxRef.current?.kill();
    flowCtxRef.current = null;

    const card = triggerRef.current;
    const orbEntry = KC_CASES.orb.find((o) => o.el === card);
    const restore = () => {
      if (card) gsap.set(card, { clearProps: "opacity,scale" });
      if (orbEntry) orbEntry.detached = false;
    };

    if (reducedRef.current) {
      root.classList.remove("on");
      gsap.set([overlay, sheet], { clearProps: "all" });
      restore();
      /* Visually instant; the state release runs on the next tick. */
      const rctx = gsap.context(() => {
        gsap.delayedCall(0, finishClose);
      }, root);
      flowCtxRef.current = rctx;
      return;
    }

    const sections = Array.from(scrollEl.querySelectorAll<HTMLElement>(".cm-sec"));
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          root.classList.remove("on");
          gsap.set([overlay, sheet, flare], { clearProps: "all" });
          gsap.set(sections, { clearProps: "all" });
          finishClose();
        },
      });
      tl.to(
        sections,
        { y: -18, opacity: 0, stagger: 0.03, duration: 0.28, ease: "power2.in" },
        0,
      )
        .to(sheet, { opacity: 0, scale: 0.97, y: 10, duration: 0.3, ease: "power2.in" }, 0.12)
        .to(overlay, { opacity: 0, duration: 0.4, ease: "power1.in" }, 0.2)
        .add(() => restore(), 0.42);
    }, root);
    flowCtxRef.current = ctx;
  }, [finishClose]);

  const requestClose = useCallback(() => {
    if (!openRef.current || closingRef.current) return;
    closingRef.current = true;
    unbindKeys();
    runCloseFlow();
  }, [runCloseFlow, unbindKeys]);

  const bindKeys = useCallback(() => {
    if (keyBoundRef.current) return;
    keyBoundRef.current = true;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        if (lbOnRef.current) closeLightbox();
        else requestClose();
        return;
      }
      if (e.key === "Tab") {
        const f = focusables();
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        const active = document.activeElement;
        if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    keyHandlerRef.current = onKey;
    document.addEventListener("keydown", onKey, true);
  }, [closeLightbox, focusables, requestClose]);

  /* ---------- open flow (port of script-10 openModal) ---------- */

  /* caseKey null → key: open the sheet. Requests that arrive while
     animating are ignored (matching the original); while closing, the
     parent's key is released so the next click re-triggers this effect. */
  useEffect(() => {
    if (!caseKey) return;
    if (openRef.current) {
      if (closingRef.current) onCloseRef.current?.();
      return;
    }

    const P = PROJECTS[caseKey];
    const root = rootRef.current;
    const overlay = overlayRef.current;
    const flare = flareRef.current;
    const sheet = sheetRef.current;
    const scrollEl = scrollRef.current;
    const closeBtn = closeBtnRef.current;
    const sheettag = sheettagRef.current;
    if (!P || !root || !overlay || !flare || !sheet || !scrollEl || !closeBtn || !sheettag) {
      return;
    }

    openRef.current = true;
    setModalOpen(state, true);
    document.documentElement.classList.add("modal-locked");
    root.classList.add("on");
    scrollEl.scrollTop = 0;

    /* Detach the trigger card from the Cases orbit while the sheet is open. */
    const card = triggerRef.current;
    const orbEntry = KC_CASES.orb.find((o) => o.el === card);
    if (orbEntry) orbEntry.detached = true;

    const heroImg = root.querySelector<HTMLElement>("#cm-hero-img");
    const heroResolve = root.querySelector<HTMLElement>("#cm-hero-resolve");
    const sections = Array.from(scrollEl.querySelectorAll<HTMLElement>(".cm-sec"));
    const regs = Array.from(root.querySelectorAll<HTMLElement>(".cm-reg"));

    if (reduced) {
      if (card) gsap.set(card, { opacity: 0 });
      gsap.set([overlay, sheet], { opacity: 1 });
      closeBtn.focus();
      bindKeys();
      return;
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          closeBtn.focus();
          bindKeys();
        },
      });
      tl.fromTo(
        overlay,
        { opacity: 0 },
        { opacity: 0.85, duration: 0.3, ease: "power1.out" },
        0,
      );
      if (card) {
        tl.to(card, { scale: 1.06, opacity: 0, duration: 0.3, ease: "power2.inOut" }, 0);
      }
      tl.fromTo(
        flare,
        { opacity: 0, xPercent: -120 },
        { opacity: 1, xPercent: -40, duration: 0.28, ease: "power2.out" },
        0.1,
      )
        .to(flare, { xPercent: 120, opacity: 0, duration: 0.3, ease: "power2.in" }, 0.34)
        .fromTo(
          sheet,
          { opacity: 0, scale: 0.94, y: 24 },
          { opacity: 1, scale: 1, y: 0, duration: 0.55, ease: "power3.out" },
          0.18,
        )
        .fromTo(
          sections,
          { x: (i: number) => (i % 2 ? 42 : -42), opacity: 0 },
          { x: 0, opacity: 1, stagger: 0.05, duration: 0.5, ease: "power3.out" },
          0.3,
        );
      if (heroImg) {
        tl.fromTo(
          heroImg,
          { filter: "blur(16px) grayscale(.7)", scale: 1.05 },
          { filter: "blur(0px) grayscale(0)", scale: 1, duration: 1, ease: "power2.out" },
          0.35,
        );
      }
      if (heroResolve) {
        tl.fromTo(
          heroResolve,
          { opacity: 1 },
          { opacity: 0, duration: 0.8, ease: "power2.inOut" },
          0.35,
        );
      }
      tl.fromTo(
        regs,
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, stagger: 0.04, duration: 0.3, ease: "back.out(2)" },
        0.6,
      ).fromTo(sheettag, { opacity: 0 }, { opacity: 1, duration: 0.4 }, 0.7);
    }, root);
    flowCtxRef.current = ctx;
  }, [caseKey, state, reduced, bindKeys]);

  /* Pull-down-to-close on the sheet's scroll area (touch). */
  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl) return;
    let tsY = 0;
    let tsX = 0;
    const onTS = (e: TouchEvent) => {
      tsY = e.touches[0].clientY;
      tsX = e.touches[0].clientX;
    };
    const onTE = (e: TouchEvent) => {
      if (scrollEl.scrollTop <= 0) {
        const dy = e.changedTouches[0].clientY - tsY;
        const dx = e.changedTouches[0].clientX - tsX;
        if (dy > 90 && Math.abs(dx) < 70) {
          requestClose();
        }
      }
    };
    scrollEl.addEventListener("touchstart", onTS, { passive: true });
    scrollEl.addEventListener("touchend", onTE, { passive: true });
    return () => {
      scrollEl.removeEventListener("touchstart", onTS);
      scrollEl.removeEventListener("touchend", onTE);
    };
  }, [requestClose]);

  /* Unmount safety: unbind keys, revert flows, release the page lock. */
  useEffect(() => {
    return () => {
      const h = keyHandlerRef.current;
      if (h) document.removeEventListener("keydown", h, true);
      keyHandlerRef.current = null;
      keyBoundRef.current = false;
      flowCtxRef.current?.revert();
      flowCtxRef.current = null;
      if (openRef.current || closingRef.current) {
        openRef.current = false;
        closingRef.current = false;
        setModalOpen(state, false);
        document.documentElement.classList.remove("modal-locked");
      }
    };
  }, [state]);

  /* ---------- content handlers ---------- */

  const onGalleryActivate = (i: number) => {
    const P = caseKey ? PROJECTS[caseKey] : null;
    if (!P) return;
    openLightbox(
      kcImg(`${P.id}-g${i + 1}`, 1400, 1000),
      `${P.g[i]} · ${P.name.toUpperCase()}`,
    );
  };

  const onPlanActivate = () => {
    const P = caseKey ? PROJECTS[caseKey] : null;
    if (!P) return;
    openLightbox(
      planImgRef.current?.src || kcImg(`${P.id}-plan`, 1400, 900),
      `FLOOR PLAN · SCHEMATIC · ${P.name.toUpperCase()}`,
    );
  };

  const onDiscuss = () => {
    requestClose();
    setTimeout(() => {
      goTo("#sec-contact");
    }, 350);
  };

  const onSheetDl = () => {
    const P = caseKey ? PROJECTS[caseKey] : null;
    if (!P) return;
    downloadText(`keystone-${P.id}-sheet.txt`, [
      "KEYSTONE COLLECTIVE · PROJECT SHEET",
      "",
      `${P.name} · ${P.loc}`,
      P.style,
      "",
      `SIZE      ${P.size} SQ FT`,
      `DURATION  ${P.dur} MONTHS`,
      `COMPLETED ${P.year}`,
      "",
      `THE BRIEF · ${P.brief}`,
      "",
      "THE CHALLENGE",
      P.challenge,
      "",
      "THE SOLUTION",
      P.solution,
      "",
      "THE INNOVATION",
      P.innovation,
      "",
      "MATERIALS",
      P.mats.map((m) => `  ${m.name} · ${m.spec}`).join("\n"),
      "",
      `IN THE CLIENTS\u2019 WORDS · ${P.client}`,
      P.quote,
      "",
      `© ${new Date().getFullYear()} KEYSTONE COLLECTIVE · FULL DOCUMENTATION AVAILABLE UPON REQUEST`,
    ]);
  };

  const P = caseKey ? PROJECTS[caseKey] : null;

  return (
    <>
      {/* CASE STUDY MONOGRAPH MODAL */}
      <div
        id="case-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cm-name"
        ref={rootRef}
      >
        <div id="cm-overlay" ref={overlayRef} onClick={requestClose}></div>
        <div id="cm-flare" ref={flareRef} aria-hidden="true"></div>
        <div id="cm-sheet" ref={sheetRef}>
          <span className="cm-reg tl" aria-hidden="true"></span>
          <span className="cm-reg tr" aria-hidden="true"></span>
          <span className="cm-reg bl" aria-hidden="true"></span>
          <span className="cm-reg br" aria-hidden="true"></span>
          <div className="cm-topbar">
            <div>
              <h2 id="cm-name">{P ? P.name : "Project"}</h2>
              <div id="cm-loc">{P ? P.loc : "LOCATION"}</div>
            </div>
            <div className="cm-topbar-right">
              <span id="cm-sheetno">{P ? P.sheet : "SHT A-100"}</span>
              <button
                className="x-close"
                id="cm-close"
                ref={closeBtnRef}
                aria-label="Close project feature"
                onClick={requestClose}
              >
                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <path d="M1 1 L11 11 M11 1 L1 11" />
                  <path
                    d="M1 1 L1 3 M1 1 L3 1 M11 11 L11 9 M11 11 L9 11"
                    opacity=".6"
                  />
                </svg>
              </button>
            </div>
          </div>
          <div id="cm-scroll" ref={scrollRef}>
            <section className="cm-sec cm-hero">
              <div className="photo">
                <img
                  id="cm-hero-img"
                  alt={P ? `${P.name}, principal photograph` : ""}
                  src={P ? kcImg(`${P.id}-hero`, 1600, 900) : undefined}
                />
                <div id="cm-hero-resolve" aria-hidden="true"></div>
                <p className="cm-brief" id="cm-brief">
                  {P?.brief}
                </p>
                <span className="cm-style-tag" id="cm-style">
                  {P?.style}
                </span>
              </div>
            </section>
            <section className="cm-sec">
              <div className="cm-strip" id="cm-metrics">
                {P && (
                  <>
                    <div className="cm-metric">
                      <b>{P.size}</b>
                      <span>SQ FT</span>
                    </div>
                    <div className="cm-metric">
                      <b>{P.dur}</b>
                      <span>MONTHS</span>
                    </div>
                    <div className="cm-metric">
                      <b>{P.year}</b>
                      <span>COMPLETED</span>
                    </div>
                    <div className="cm-metric">
                      <b>{P.loc.split(",")[0]}</b>
                      <span>LOCATION</span>
                    </div>
                  </>
                )}
              </div>
            </section>
            <section className="cm-sec cm-narr">
              <div className="cm-kick">01 · THE CHALLENGE</div>
              <p id="cm-challenge">{P?.challenge}</p>
              <div className="cm-kick">02 · THE SOLUTION</div>
              <p id="cm-solution">{P?.solution}</p>
              <div className="cm-kick">03 · THE INNOVATION</div>
              <p id="cm-innovation">{P?.innovation}</p>
            </section>
            <section className="cm-sec">
              <div className="cm-kick">04 · PHOTOGRAPHS</div>
              <div className="cm-gallery" id="cm-gallery">
                {P &&
                  P.g.map((cap, i) => (
                    <figure
                      key={i}
                      className="cm-g-item photo photo-frame"
                      data-i={i}
                      tabIndex={0}
                      role="button"
                      aria-label={`Enlarge photograph: ${cap}`}
                      onClick={() => onGalleryActivate(i)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onGalleryActivate(i);
                        }
                      }}
                    >
                      <img src={kcImg(`${P.id}-g${i + 1}`, 900, 640)} alt={cap} />
                      <figcaption>{cap}</figcaption>
                    </figure>
                  ))}
              </div>
            </section>
            <section className="cm-sec">
              <div className="cm-kick">05 · MATERIAL PALETTE</div>
              <div className="cm-mats" id="cm-mats">
                {P &&
                  P.mats.map((m, i) => (
                    <div className="cm-mat" key={i}>
                      <i style={{ background: m.color }} />
                      <h5>{m.name}</h5>
                      <span>{m.spec}</span>
                    </div>
                  ))}
              </div>
            </section>
            <section className="cm-sec">
              <div className="cm-kick">06 · DRAWINGS</div>
              <figure
                className="cm-plan photo photo-frame"
                id="cm-plan"
                tabIndex={0}
                role="button"
                aria-label="Enlarge floor plan"
                data-cursor="ZOOM"
                onClick={onPlanActivate}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onPlanActivate();
                  }
                }}
              >
                <img
                  id="cm-plan-img"
                  ref={planImgRef}
                  alt="Schematic floor plan"
                  src={P ? kcImg(`${P.id}-plan`, 1400, 900) : undefined}
                />
              </figure>
              <div className="cm-plan-label">
                FLOOR PLAN · SCHEMATIC · FULL DOCUMENTATION AVAILABLE UPON REQUEST
              </div>
            </section>
            <section className="cm-sec">
              <div className="cm-kick">07 · IN THE CLIENTS&apos; WORDS</div>
              <div className="cm-quote-wrap">
                <blockquote className="cm-quote" id="cm-quote">
                  {P?.quote}
                </blockquote>
                <div className="cm-client">
                  <img
                    id="cm-client-img"
                    alt=""
                    src={P ? kcImg(`${P.id}-client`, 160, 160) : undefined}
                  />
                  <div>
                    <span className="cc-n" id="cm-client">
                      {P?.client}
                    </span>
                    <span className="cc-r" id="cm-client-role">
                      PROJECT CLIENTS
                    </span>
                  </div>
                </div>
              </div>
            </section>
            <section className="cm-sec cm-cta">
              <button
                className="btn-arch"
                id="cm-discuss"
                data-cursor="TALK"
                onClick={onDiscuss}
              >
                DISCUSS A SIMILAR PROJECT
              </button>
              <button
                className="btn-arch"
                id="cm-sheet-dl"
                data-cursor="SAVE"
                onClick={onSheetDl}
              >
                DOWNLOAD PROJECT SHEET
              </button>
              <button
                id="cm-return"
                style={{
                  background: "none",
                  border: "none",
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: "9px",
                  letterSpacing: ".28em",
                  color: "var(--bronze)",
                  cursor: "pointer",
                  padding: "12px 4px",
                }}
                data-cursor="CLOSE"
                onClick={requestClose}
              >
                ← RETURN TO ALL WORK
              </button>
            </section>
          </div>
          <div id="cm-sheettag" ref={sheettagRef}>
            {P ? `${P.sheet} · PROJECT FEATURE` : "SHT A-100 · PROJECT FEATURE"}
          </div>
        </div>
      </div>
      {/* ENLARGED PHOTOGRAPH LIGHTBOX */}
      <div
        id="cm-lightbox"
        role="dialog"
        aria-modal="true"
        aria-label="Enlarged photograph"
        ref={lbRef}
        onClick={(e) => {
          if (e.target === e.currentTarget) closeLightbox();
        }}
      >
        <button
          className="x-close"
          id="cm-lb-close"
          ref={lbCloseRef}
          aria-label="Close enlarged photograph"
          onClick={closeLightbox}
        >
          <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2">
            <path d="M1 1 L11 11 M11 1 L1 11" />
            <path d="M1 1 L1 3 M1 1 L3 1 M11 11 L11 9 M11 11 L9 11" opacity=".6" />
          </svg>
        </button>
        <img id="cm-lb-img" alt="" ref={lbImgRef} />
        <div id="cm-lb-cap" ref={lbCapRef}></div>
      </div>
    </>
  );
}
