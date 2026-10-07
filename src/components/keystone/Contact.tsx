"use client";

/**
 * Contact — Section 09 · THE BEGINNING.
 * React port of the original script-14 scene: the #frag-layer convergence
 * (26 drifting glyphs/markers pulled into the #core as the section scrolls),
 * the "bang" snap (flash + warm light layers + form reveal), the
 * dream-form behaviors (submit → validation → #form-done overlay, idle
 * placeholder typing), the dwell-hint choreography, and the descent exit.
 */

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useKc } from "./KcProvider";

gsap.registerPlugin(ScrollTrigger);

const GLYPHS = [
  "ELEV +12.4 M",
  "LOT 7",
  "OAK",
  "DATUM",
  "N 40°00′",
  "SHT A-000",
  "∠ 45.00°",
  "TRAVERTINE",
  "REV C",
  "GRID 7.2",
];

const FIELD_IDS = ["#f-name", "#f-email", "#f-land", "#f-dream"] as const;

const PLACEHOLDER_PAIRS: ReadonlyArray<readonly [string, string]> = [
  ["#f-name", "Your name"],
  ["#f-email", "you@somewhere.com"],
  ["#f-land", "Town or coordinates"],
  ["#f-dream", "The light you want at breakfast…"],
];

export default function Contact() {
  const { state, reduced } = useKc();
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const stage = el.querySelector<HTMLElement>("#contact-stage");
    const fragLayer = el.querySelector<HTMLElement>("#frag-layer");
    const core = el.querySelector<HTMLElement>("#core");
    const contactIntro = el.querySelector<HTMLElement>("#contact-intro");
    const formWrap = el.querySelector<HTMLElement>("#contact-form-wrap");
    const formDone = el.querySelector<HTMLElement>("#form-done");
    const formEl = el.querySelector<HTMLFormElement>("#dream-form");
    if (
      !stage ||
      !fragLayer ||
      !core ||
      !contactIntro ||
      !formWrap ||
      !formDone ||
      !formEl
    ) {
      return;
    }

    const KCState = state.current;

    /* runtime flags — the original's closure vars */
    let contactTouched = false;
    let dwellStarted = false;
    const typingIvs: ReturnType<typeof setInterval>[] = [];
    const pendingTimeouts: ReturnType<typeof setTimeout>[] = [];

    /* every animation routes through this context so cleanup can revert it;
       created empty first so event-time animations can attach via ctx.add */
    const ctx = gsap.context(() => {}, el);

    /* ---- fragment field — 26 drifting arch pieces ---- */
    const frags: HTMLElement[] = [];
    ctx.add(() => {
      for (let i = 0; i < 26; i++) {
        const d = document.createElement("div");
        const kind = i % 5;
        d.className =
          "frag " +
          (kind === 0
            ? "frag-line"
            : kind === 1
              ? "frag-dot"
              : kind === 2
                ? "frag-ring"
                : kind === 3
                  ? "frag-cross"
                  : "frag-mono");
        if (kind === 4) d.textContent = GLYPHS[i % GLYPHS.length];
        const th = Math.random() * Math.PI * 2;
        const r = 240 + Math.random() * Math.max(320, stage.clientWidth * 0.28);
        fragLayer.appendChild(d);
        gsap.set(d, {
          x: Math.cos(th) * r,
          y: Math.sin(th) * r * 0.7,
          rotation: gsap.utils.random(-40, 40),
        });
        frags.push(d);
      }
    });

    /* ---- form field touch tracking (stops the idle typing) ---- */
    const markTouched = () => {
      contactTouched = true;
    };
    const fieldEls = FIELD_IDS.map((id) => el.querySelector(id)).filter(
      (f): f is Element => f !== null,
    );
    fieldEls.forEach((f) => {
      f.addEventListener("input", markTouched);
      f.addEventListener("focus", markTouched);
    });

    /* ---- idle placeholder typing ---- */
    const typePlaceholders = () => {
      let k = 0;
      const next = () => {
        if (k >= PLACEHOLDER_PAIRS.length) return;
        const [id, txt] = PLACEHOLDER_PAIRS[k++];
        const target = el.querySelector(id);
        if (!target) return;
        let i2 = 0;
        const iv = setInterval(() => {
          target.setAttribute("placeholder", txt.slice(0, ++i2));
          if (i2 >= txt.length) {
            clearInterval(iv);
            pendingTimeouts.push(setTimeout(next, 260));
          }
        }, 34);
        typingIvs.push(iv);
      };
      next();
    };

    /* ---- dream-form submit: validation → form out / form-done in ---- */
    const onFormSubmit = (e: Event) => {
      e.preventDefault();
      contactTouched = true;

      /* basic validation: name, email and dream are required */
      const nameEl = el.querySelector<HTMLInputElement>("#f-name");
      const emailEl = el.querySelector<HTMLInputElement>("#f-email");
      const dreamEl = el.querySelector<HTMLTextAreaElement>("#f-dream");
      const missing: HTMLElement[] = [];
      if (nameEl && !nameEl.value.trim()) missing.push(nameEl);
      if (emailEl && !/^\S+@\S+\.\S+$/.test(emailEl.value.trim()))
        missing.push(emailEl);
      if (dreamEl && !dreamEl.value.trim()) missing.push(dreamEl);
      if (missing.length > 0) {
        missing[0].focus();
        ctx.add(() => {
          missing.forEach((input) => {
            const field = input.closest(".field");
            if (!field) return;
            gsap.fromTo(
              field,
              { x: -7 },
              {
                x: 7,
                duration: 0.06,
                repeat: 5,
                yoyo: true,
                ease: "power1.inOut",
                clearProps: "x",
              },
            );
          });
        });
        return;
      }

      ctx.add(() => {
        gsap.fromTo(
          "#submit-ring",
          { scale: 0.6, opacity: 1 },
          { scale: 3, opacity: 0, duration: 0.9, ease: "power2.out" },
        );
        gsap.to(formWrap, {
          opacity: 0,
          y: -16,
          duration: 0.4,
          ease: "power2.in",
          onComplete: () => {
            formWrap.style.display = "none";
            formDone.style.display = "flex";
            gsap.fromTo(
              formDone,
              { opacity: 0, scale: 0.96 },
              { opacity: 1, scale: 1, duration: 0.8, ease: "power3.out" },
            );
          },
        });
      });
    };
    formEl.addEventListener("submit", onFormSubmit);

    /* ---- the convergence scene (full motion only) ---- */
    if (!reduced) {
      ctx.add(() => {
        gsap.set(".cs-block", { opacity: 0, y: 12 });

        /* the bang — everything snaps into the core */
        const bang = () => {
          KCState.bang = true;
          ctx.add(() => {
            gsap
              .timeline()
              .fromTo(
                "#bang-flash",
                { opacity: 0 },
                { opacity: 1, duration: 0.07, ease: "power1.in" },
              )
              .to("#bang-flash", { opacity: 0, duration: 0.6, ease: "power2.out" })
              .set([fragLayer, core], { display: "none" }, 0.08)
              .fromTo(
                "#contact-form-wrap",
                { opacity: 0, scale: 0.9, y: 26 },
                { opacity: 1, scale: 1, y: 0, duration: 0.9, ease: "power3.out" },
                0.16,
              )
              .fromTo(
                ".field",
                { opacity: 0, y: 16 },
                { opacity: 1, y: 0, stagger: 0.13, duration: 0.55, ease: "power2.out" },
                0.32,
              );
          });
          pendingTimeouts.push(
            setTimeout(() => {
              if (!contactTouched) typePlaceholders();
            }, 5000),
          );
        };

        /* scroll back above the threshold → re-arm the convergence */
        const resetConvergence = () => {
          KCState.bang = false;
          typingIvs.forEach((iv) => clearInterval(iv));
          typingIvs.length = 0;
          FIELD_IDS.forEach((id) => {
            const f = el.querySelector(id);
            if (f) f.setAttribute("placeholder", "");
          });
          ctx.add(() => {
            gsap.set(formDone, { display: "none" });
            gsap.set(formWrap, { clearProps: "all" });
            gsap.set([fragLayer, core, contactIntro], {
              clearProps: "display,opacity",
            });
          });
        };

        /* dwell — fields settle once the visitor lingers past the bang */
        const settleFields = () => {
          ctx.add(() => {
            gsap
              .timeline()
              .to(".field", { y: 3, duration: 0.16, ease: "power2.in", stagger: 0.05 })
              .to(".field", { y: 0, duration: 0.6, ease: "power3.out", stagger: 0.05 });
          });
        };

        const onContactUpdate = (self: ScrollTrigger) => {
          const p = self.progress;
          if (p > 0.32 && !KCState.bang) bang();
          else if (p < 0.22 && KCState.bang) resetConvergence();
          /* hard guard: below the bang threshold the form and its CTA are
             hidden (the class + CSS !important overrides any leaked inline
             opacity — the ghost-button bug in the original) */
          document.body.classList.toggle("contact-dormant", p < 0.32);
          if (p > 0.4 && !dwellStarted) {
            dwellStarted = true;
            settleFields();
          }
          if (p < 0.3) dwellStarted = false;
        };

        gsap
          .timeline({
            scrollTrigger: {
              trigger: el,
              start: "top top",
              end: "bottom bottom",
              scrub: 0.8,
              onUpdate: onContactUpdate,
            },
          })
          .to(
            frags,
            {
              x: 0,
              y: 0,
              scale: 0.25,
              rotation: "+=300",
              opacity: 1,
              duration: 0.24,
              ease: "power2.in",
              stagger: 0.008,
            },
            0.02,
          )
          .fromTo(
            core,
            { scale: 0.3, opacity: 0.35 },
            { scale: 1.6, opacity: 1, duration: 0.27, ease: "none" },
            0.02,
          )
          .to(contactIntro, { opacity: 0, y: -46, duration: 0.14, ease: "none" }, 0.16)
          .fromTo(
            "#contact-warm",
            { opacity: 0 },
            { opacity: 1, duration: 0.1, ease: "none" },
            0.28,
          )
          .add(
            () => {
              document.body.classList.toggle("contact-bright", true);
            },
            0.28,
          )
          .to("#contact-sheet", { opacity: 0, duration: 0.08 }, 0.3)
          .fromTo(
            "#contact-warm2",
            { opacity: 0 },
            { opacity: 1, duration: 0.4, ease: "none" },
            0.42,
          )
          /* The address column completes by ~0.62 (the original ran it to
             1.00, so the last block was never fully lit while the form was
             open). Everything the form carries is on screen well before the
             BEGIN landing depth (CONTACT_FORM_FRAC) and the exit at 0.92. */
          .fromTo(
            ".cs-block",
            { opacity: 0, y: 12 },
            { opacity: 1, y: 0, stagger: 0.035, duration: 0.14, ease: "none" },
            0.34,
          )
          .fromTo(
            "#dwell-hint",
            { opacity: 0 },
            { opacity: 1, duration: 0.05, ease: "none" },
            0.46,
          )
          .fromTo(
            "#contact-final",
            { opacity: 0, y: 14 },
            { opacity: 1, y: 0, duration: 0.08, ease: "none" },
            0.74,
          )
          .to("#dwell-hint", { opacity: 0, duration: 0.05, ease: "none" }, 0.82)
          .to(
            "#contact-form-wrap",
            { opacity: 0, y: -24, duration: 0.07, ease: "none" },
            0.92,
          );
      });
    }

    return () => {
      /* unwire listeners */
      formEl.removeEventListener("submit", onFormSubmit);
      fieldEls.forEach((f) => {
        f.removeEventListener("input", markTouched);
        f.removeEventListener("focus", markTouched);
      });

      /* stop timers */
      typingIvs.forEach((iv) => clearInterval(iv));
      pendingTimeouts.forEach((t) => clearTimeout(t));

      /* release global classes */
      document.body.classList.remove("contact-dormant", "contact-bright");

      /* reset placeholders (mirrors resetConvergence) */
      FIELD_IDS.forEach((id) => {
        const f = el.querySelector(id);
        if (f) f.setAttribute("placeholder", "");
      });

      /* revert collected animations + kill the scrub scene */
      ctx.revert();

      /* kill the async #form-done reveal (created outside the context) */
      gsap.killTweensOf(formDone);

      /* hard-reset the form state back to its CSS defaults */
      gsap.set(
        el.querySelectorAll(
          ".field, #bang-flash, #contact-warm, #contact-warm2, #contact-intro, #contact-sheet, #dwell-hint, #contact-final, .cs-block",
        ),
        { clearProps: "all" },
      );
      formDone.style.display = "";
      formWrap.style.display = "";

      /* remove generated fragments */
      frags.forEach((f) => f.remove());
    };
  }, [state, reduced]);

  return (
    <section
      ref={rootRef}
      id="sec-contact"
      className="sec"
      data-name="THE BEGINNING"
      data-index="09"
      data-accent="#B5651D"
      data-theme="dark"
    >
      <div className="stage stage-dark" id="contact-stage">
        <div id="contact-warm" aria-hidden="true"></div>
        <div id="contact-warm2" aria-hidden="true"></div>
        <div id="frag-layer" aria-hidden="true"></div>
        <div id="core" aria-hidden="true">
          <div className="core-glow"></div>
        </div>
        <div id="contact-intro">
          <div className="sec-label light" style={{ justifyContent: "center" }}>
            09 · THE BEGINNING
          </div>
          <h2>Everything converges.</h2>
          <p>Ten sections of journey. One point of focus.</p>
        </div>
        <div id="bang-flash" aria-hidden="true"></div>
        <div id="contact-form-wrap">
          <div className="contact-grid">
            <form id="dream-form">
              <h2>Tell Us About Your Dream</h2>
              <p className="cf-sub">
                Every great home begins with a conversation.
              </p>
              <div className="field">
                <label htmlFor="f-name">YOUR NAME</label>
                <input id="f-name" type="text" autoComplete="name" />
              </div>
              <div className="field">
                <label htmlFor="f-email">EMAIL</label>
                <input id="f-email" type="email" autoComplete="email" />
              </div>
              <div className="field">
                <label htmlFor="f-land">WHERE THE LAND IS</label>
                <input id="f-land" type="text" />
              </div>
              <div className="field">
                <label htmlFor="f-dream">THE DREAM</label>
                <textarea id="f-dream" rows={3}></textarea>
              </div>
              <button
                type="submit"
                id="submit-btn"
                className="btn-arch"
                data-tilt
                data-cursor="SEND"
              >
                BEGIN THE CONVERSATION
                <span id="submit-ring" aria-hidden="true"></span>
              </button>
            </form>
            <aside id="contact-side">
              <div className="cs-block">
                <h4>VISIT</h4>
                2114 CANYON BLVD
                <br />
                BOULDER, CO 80902
              </div>
              <div className="cs-block">
                <h4>CALL</h4>
                +1 (303) 555-0184
              </div>
              <div className="cs-block">
                <h4>WRITE</h4>
                HELLO@KEYSTONE-COLLECTIVE.STUDIO
              </div>
              <div className="cs-block">
                <h4>HOURS</h4>
                TUE-SAT · BY APPOINTMENT
              </div>
              <div className="cs-block">
                <p>
                  We take on twelve projects a year. We respond to every
                  message within two business days, usually with questions
                  about light.
                </p>
              </div>
            </aside>
          </div>
        </div>
        <div id="contact-final">
          Every great home begins with a conversation.
        </div>
        <div id="dwell-hint" aria-hidden="true">
          <span>SCROLL · THE DESCENT CONTINUES</span>
          <span className="dh-line">
            <i />
          </span>
        </div>
        <div id="form-done">
          <div>
            <h2>Received.</h2>
            <p>Ours starts within two business days.</p>
            <div className="fd-mono">
              INQUIRY 0417 · LOGGED · BOULDER STUDIO
            </div>
          </div>
        </div>
        <div className="sheet-tag" id="contact-sheet">
          SHT A-901 · CONVERGENCE · REV C
        </div>
      </div>
    </section>
  );
}
