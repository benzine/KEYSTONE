"use client";

/**
 * Team — Section 08 · THE PEOPLE.
 * React port of the original script-13 scene: the #team-canvas constellation
 * (150 twinkling background stars + 9 member stars that drift in from a
 * random scatter and lock into an arch outline as the section scrolls,
 * driven by state.teamP), member card positioning + materialize flashes on
 * the scrubbed timeline, and the team-cta reveal.
 * Member cards open the knowledge-center sheet via useKc().openKcm
 * (replaces the original script-16 trigger binding).
 */

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useKc } from "./KcProvider";
import { fitCanvas, clamp, smoothstep, RAD } from "@/lib/keystone/kc-core";
import { MEMBERS } from "@/lib/keystone/members";
import { kcImg } from "@/lib/keystone/images";

gsap.registerPlugin(ScrollTrigger);

export default function Team() {
  const { state, reduced, openKcm } = useKc();
  const rootRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = rootRef.current;
    const cv = canvasRef.current;
    if (!el || !cv) return;

    /* Simple layout (narrow / reduced): the original script-13 bails before
       any canvas or positioning work and lets the html.simple CSS take over.
       Computed here because the provider's html.simple class may not be
       applied yet when this child effect first runs. */
    const simple =
      window.matchMedia("(max-width:760px)").matches ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      reduced;
    if (simple) return;

    const KCState = state.current;

    /* ---- member constellation positions (1 lead star + 8 on the arch) ---- */
    const members = Array.from(el.querySelectorAll<HTMLElement>(".member"));
    const targets: { x: number; y: number }[] = [{ x: 0.5, y: 0.36 }];
    for (let i = 0; i < 8; i++) {
      const a = (180 - (i + 1) * 20) * RAD;
      targets.push({
        x: 0.5 + 0.33 * Math.cos(a),
        y: 0.76 - 0.4 * Math.sin(a),
      });
    }
    members.forEach((m, i) => {
      const tg = targets[i];
      if (!tg) return;
      m.style.left = tg.x * 100 + "%";
      m.style.top = tg.y * 100 + "%";
    });

    /* scattered start positions the stars assemble from */
    const scatter = targets.map(() => ({ x: Math.random(), y: Math.random() }));
    const bgStars: {
      x: number;
      y: number;
      r: number;
      sp: number;
      ph: number;
    }[] = [];
    for (let i = 0; i < 150; i++) {
      bgStars.push({
        x: Math.random(),
        y: Math.random(),
        r: 0.4 + Math.random() * 1.1,
        sp: 0.5 + Math.random() * 1.6,
        ph: Math.random() * 6.28,
      });
    }

    let TC = fitCanvas(cv);
    const onResize = () => {
      TC = fitCanvas(cv);
    };
    window.addEventListener("resize", onResize);

    /* visibility gate for the canvas ticker */
    const visTrigger = ScrollTrigger.create({
      trigger: el,
      start: "top bottom",
      end: "bottom top",
      onToggle: (s) => {
        KCState.vis.team = s.isActive;
      },
    });

    /* ---- constellation drawing loop ---- */
    const onTicker = (t: number) => {
      if (!KCState.vis.team || KCState.modalOpen) return;
      const ctx = TC.ctx;
      const w = TC.w;
      const h = TC.h;
      ctx.clearRect(0, 0, w, h);

      const p = KCState.teamP;
      const s = smoothstep(p, 0.05, 0.45);
      const faint = clamp(0.15 + p * 1.7, 0, 1);
      const lineA = clamp((p - 0.4) / 0.2, 0, 1) * 0.6;

      bgStars.forEach((st) => {
        const a = (0.25 + 0.5 * Math.abs(Math.sin(t * st.sp + st.ph))) * faint;
        ctx.fillStyle = `rgba(232,230,225,${a.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(st.x * w, st.y * h, st.r, 0, 6.283);
        ctx.fill();
      });

      const pos = targets.map((tg, i) => {
        const sc = scatter[i];
        const x = (sc.x + (tg.x - sc.x) * s) * w;
        const y = (sc.y + (tg.y - sc.y) * s) * h;
        const lead = i === 0;
        ctx.fillStyle = lead
          ? `rgba(201,169,98,${((0.5 + s * 0.5) * faint).toFixed(2)})`
          : `rgba(232,230,225,${((0.3 + s * 0.55) * faint).toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(x, y, lead ? 3.4 : 2.3, 0, 6.283);
        ctx.fill();
        ctx.fillStyle = lead ? "rgba(201,169,98,.12)" : "rgba(232,230,225,.08)";
        ctx.beginPath();
        ctx.arc(x, y, lead ? 11 : 7, 0, 6.283);
        ctx.fill();
        return { x, y };
      });

      if (lineA > 0) {
        /* arch outline: satellites → keystone → satellites */
        ctx.strokeStyle = `rgba(201,169,98,${lineA.toFixed(3)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        const order = [1, 2, 3, 4, 0, 5, 6, 7, 8];
        order.forEach((oi, k) => {
          const q = pos[oi];
          if (k === 0) ctx.moveTo(q.x, q.y);
          else ctx.lineTo(q.x, q.y);
        });
        ctx.stroke();
      }
    };
    gsap.ticker.add(onTicker);

    /* ---- scroll-scrubbed assembly ---- */
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
          onUpdate: (self) => {
            KCState.teamP = self.progress;
          },
        },
      });
      tl.from(
        "#team-stage .stage-head",
        { opacity: 0, y: 44, duration: 0.08, ease: "none" },
        0.02,
      );
      members.forEach((m, i) => {
        const at = 0.58 + i * 0.028;
        const flash = m.querySelector(".flash");
        if (flash) {
          tl.fromTo(
            flash,
            { scale: 0.1, opacity: 0.95 },
            { scale: 3.4, opacity: 0, duration: 0.06, ease: "power2.out" },
            at,
          );
        }
        tl.fromTo(
          m,
          { opacity: 0, scale: 0.65 },
          { opacity: 1, scale: 1, duration: 0.07, ease: "power2.out" },
          at + 0.012,
        );
      });
      tl.from("#team-cta", { opacity: 0, y: 20, duration: 0.08, ease: "none" }, 0.88);
    }, el);

    return () => {
      window.removeEventListener("resize", onResize);
      gsap.ticker.remove(onTicker);
      visTrigger.kill();
      ctx.revert();
      members.forEach((m) => {
        m.style.left = "";
        m.style.top = "";
      });
    };
  }, [state, reduced]);

  return (
    <section
      ref={rootRef}
      id="sec-team"
      className="sec"
      data-name="THE PEOPLE"
      data-index="08"
      data-accent="#C9A962"
      data-theme="dark"
    >
      <div className="stage stage-dark" id="team-stage">
        <canvas ref={canvasRef} id="team-canvas" aria-hidden="true"></canvas>
        <div className="stage-head">
          <div className="sec-label light">08 · THE PEOPLE</div>
          <h2>Every studio is a constellation.</h2>
          <p>Nine stars. One arch.</p>
        </div>
        <div id="member-field">
          {MEMBERS.map((m, i) => (
            <div
              key={m.name}
              className={i === 0 ? "member lead" : "member"}
              data-hover
              data-cursor="VIEW"
              tabIndex={0}
              role="button"
              aria-label={`View profile: ${m.name}`}
              onClick={() => openKcm({ type: "member", index: i })}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openKcm({ type: "member", index: i });
                }
              }}
            >
              <div className="flash"></div>
              <div className="member-inner">
                <div className="member-photo">
                  <img src={kcImg(m.img + "-prof")} alt={m.name} loading="lazy" />
                </div>
                <div className="member-name">{m.name}</div>
                <div className="member-role">{m.role}</div>
              </div>
            </div>
          ))}
        </div>
        <div id="team-cta">
          <a
            className="u-draw"
            href="mailto:careers@keystone-collective.studio"
            data-cursor="JOIN"
          >
            Join our constellation
          </a>
          <span className="tc-note">
            WE HIRE FOR PATIENCE · CAREERS@KEYSTONE-COLLECTIVE.STUDIO
          </span>
        </div>
        <div className="sheet-tag">SHT A-601 · PERSONNEL · REV C</div>
      </div>
    </section>
  );
}
