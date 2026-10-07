"use client";

/**
 * Insights — Section 06 · THE THINKING.
 * React port of the original markup + script-11: the "Ideas, connected"
 * network canvas (nodes, connections whose density rises with scroll depth,
 * live-card spokes, hover pulses), card reveal choreography, and the
 * article-card → knowledge-center triggers (from the original script-16).
 */

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useKc } from "./KcProvider";
import { fitCanvas } from "@/lib/keystone/kc-core";
import { ARTICLES } from "@/lib/keystone/articles";

gsap.registerPlugin(ScrollTrigger);

interface InsNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  g: boolean;
}

interface InsPulse {
  x: number;
  y: number;
  r: number;
  a: number;
}

export default function Insights() {
  const { state, reduced, openKcm } = useKc();
  const rootRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = rootRef.current;
    const cv = canvasRef.current;
    if (!el || !cv) return;

    const KCState = state.current;
    const cards = Array.from(el.querySelectorAll<HTMLElement>(".ins-card"));

    /* Reduced motion (KC.reduced = prefers-reduced OR setting): no canvas
       field, no reveal choreography — CSS handles the static layout. */
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduced || prefersReduced) return;

    let IC = fitCanvas(cv);
    const nodes: InsNode[] = [];
    const pulses: InsPulse[] = [];

    const newNode = (): InsNode => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.00012,
      vy: (Math.random() - 0.5) * 0.00012,
      g: Math.random() < 0.14,
    });

    /* Hovering a card emits an ink ripple into the network. */
    const enters = cards.map((card) => () => {
      const r = card.getBoundingClientRect();
      const s = cv.getBoundingClientRect();
      pulses.push({
        x: r.left + r.width / 2 - s.left,
        y: r.top + r.height / 2 - s.top,
        r: 10,
        a: 0.8,
      });
    });
    cards.forEach((c, i) => c.addEventListener("mouseenter", enters[i]));

    const onResize = () => {
      IC = fitCanvas(cv);
    };
    window.addEventListener("resize", onResize);

    const ctx = gsap.context(() => {
      /* Visibility + density progress flags for the canvas ticker. */
      ScrollTrigger.create({
        trigger: el,
        start: "top bottom",
        end: "bottom top",
        onToggle: (s) => {
          KCState.vis.ins = s.isActive;
        },
      });
      ScrollTrigger.create({
        trigger: el,
        start: "top 80%",
        end: "bottom 65%",
        onUpdate: (s) => {
          KCState.insP = s.progress;
        },
      });

      /* Card + glow reveal choreography. */
      cards.forEach((card) => {
        const glow = card.querySelector(".ins-glow");
        gsap
          .timeline({
            scrollTrigger: {
              trigger: card,
              start: "top 88%",
              toggleActions: "play none none reverse",
            },
          })
          .fromTo(
            glow,
            { scale: 0.15, opacity: 1 },
            { scale: 2.8, opacity: 0, duration: 1.2, ease: "power2.out" },
            0,
          )
          .fromTo(
            card,
            { opacity: 0, scale: 0.55, y: 42 },
            { opacity: 1, scale: 1, y: 0, duration: 1.1, ease: "power3.out" },
            0.08,
          );
      });
    }, el);

    /* The network field itself. */
    const drawInsights = (t: number, dms: number) => {
      if (!KCState.vis.ins || KCState.modalOpen) return;
      const dt = Math.min(dms / 1000, 0.05);
      const g = IC.ctx;
      const w = IC.w;
      const h = IC.h;
      g.clearRect(0, 0, w, h);

      /* Target node count grows with scroll depth through the section. */
      const target = Math.round(24 + KCState.insP * 88);
      while (nodes.length < target) nodes.push(newNode());
      while (nodes.length > target) nodes.pop();
      nodes.forEach((n) => {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > 1) n.vx *= -1;
        if (n.y < 0 || n.y > 1) n.vy *= -1;
      });

      const boost = 0.45 + KCState.nvel * 0.9;
      g.lineWidth = 1;
      let i: number;
      let j: number;
      for (i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = (a.x - b.x) * w;
          const dy = (a.y - b.y) * h;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 130) {
            const al = (1 - d / 130) * (0.2 + 0.18 * Math.sin(t * 2 + i + j)) * boost;
            g.strokeStyle = `rgba(123,167,188,${al.toFixed(3)})`;
            g.beginPath();
            g.moveTo(a.x * w, a.y * h);
            g.lineTo(b.x * w, b.y * h);
            g.stroke();
          }
        }
      }
      nodes.forEach((n) => {
        g.fillStyle = n.g
          ? `rgba(201,169,98,${(0.4 + 0.3 * Math.sin(t * 1.5 + n.x * 9)).toFixed(3)})`
          : `rgba(123,167,188,${(0.3 + 0.25 * Math.sin(t * 2 + n.y * 7)).toFixed(3)})`;
        g.beginPath();
        g.arc(n.x * w, n.y * h, n.g ? 2.1 : 1.4, 0, 6.283);
        g.fill();
      });

      /* Spoke the live article cards into the network. */
      const s = cv.getBoundingClientRect();
      const live = cards
        .filter((c) => parseFloat(getComputedStyle(c).opacity) > 0.5)
        .map((c) => {
          const r = c.getBoundingClientRect();
          return { x: r.left + r.width / 2 - s.left, y: r.top + r.height / 2 - s.top };
        });
      g.strokeStyle = `rgba(201,169,98,${(0.28 * boost).toFixed(3)})`;
      live.forEach((p, idx) => {
        if (idx < live.length - 1) {
          g.beginPath();
          g.moveTo(p.x, p.y);
          g.lineTo(live[idx + 1].x, live[idx + 1].y);
          g.stroke();
        }
        nodes
          .map((n) => ({ n, d: Math.hypot(n.x * w - p.x, n.y * h - p.y) }))
          .sort((u, v) => u.d - v.d)
          .slice(0, 2)
          .forEach((o) => {
            g.beginPath();
            g.moveTo(p.x, p.y);
            g.lineTo(o.n.x * w, o.n.y * h);
            g.stroke();
          });
      });

      /* Hover ripples. */
      for (let k = pulses.length - 1; k >= 0; k--) {
        const p = pulses[k];
        p.r += dt * 260;
        p.a -= dt * 0.9;
        if (p.a <= 0) {
          pulses.splice(k, 1);
          continue;
        }
        g.strokeStyle = `rgba(201,169,98,${p.a.toFixed(3)})`;
        g.beginPath();
        g.arc(p.x, p.y, p.r, 0, 6.283);
        g.stroke();
      }
    };
    gsap.ticker.add(drawInsights);

    return () => {
      window.removeEventListener("resize", onResize);
      cards.forEach((c, i) => c.removeEventListener("mouseenter", enters[i]));
      gsap.ticker.remove(drawInsights);
      ctx.revert();
    };
  }, [state, reduced]);

  const openArticle = (i: number, card: HTMLElement) => {
    openKcm({ type: "article", index: i, trigger: card });
  };

  const onCardKey = (i: number) => (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openKcm({ type: "article", index: i, trigger: e.currentTarget });
    }
  };

  return (
    <>
      <section
        ref={rootRef}
        id="sec-insights"
        className="sec"
        data-name="THE THINKING"
        data-index="06"
        data-accent="#7BA7BC"
        data-theme="dark"
      >
        <canvas id="ins-canvas" aria-hidden="true" ref={canvasRef} />
        <div className="wrap ins-wrap">
          <div id="ins-head">
            <div className="sec-label light">06 · THE THINKING</div>
            <h2>Ideas, connected.</h2>
            <p>The studio&apos;s research notes, from material science to the long view.</p>
          </div>
          <div id="ins-density">NETWORK DENSITY INCREASES WITH DEPTH ↓</div>
          <div className="ins-grid">
            <article
              className="ins-card ins-feature"
              data-hover
              data-cursor="READ"
              tabIndex={0}
              role="button"
              aria-label={`Read article: ${ARTICLES[0].title}`}
              onClick={(e) => openArticle(0, e.currentTarget)}
              onKeyDown={onCardKey(0)}
            >
              <div className="ins-cover photo">
                <img
                  src="/images/215c780b6be547a4830cfe92998d17a2.jpeg"
                  alt="Afternoon light moving across a travertine wall"
                  loading="lazy"
                />
                <span className="ins-cover-tag">FIELD NOTES · NO. 12</span>
              </div>
              <div className="ins-glow"></div>
              <div className="ins-meta">
                <span>ESSAY</span>
                <span>NOV 2026</span>
                <span>12 MIN</span>
              </div>
              <h3>The Case for Slower Houses</h3>
              <p>
                We argue for patience in an industry optimized for speed.
                Project by project, this essay shows the return, from fewer
                change orders to homes that age like they were meant to.
              </p>
              <a className="ins-link u-draw" data-hover data-cursor="READ">
                READ THE ESSAY
              </a>
            </article>
            <article
              className="ins-card ins-c2"
              data-hover
              data-cursor="READ"
              tabIndex={0}
              role="button"
              aria-label={`Read article: ${ARTICLES[1].title}`}
              onClick={(e) => openArticle(1, e.currentTarget)}
              onKeyDown={onCardKey(1)}
            >
              <div className="ins-glow"></div>
              <div className="ins-meta">
                <span>MATERIALS</span>
                <span>SEP 2026</span>
              </div>
              <h3>Travertine: A Stone That Remembers</h3>
              <p>
                Why we specify a stone that records every decade of weather and
                every dinner party.
              </p>
            </article>
            <article
              className="ins-card ins-c3"
              data-hover
              data-cursor="READ"
              tabIndex={0}
              role="button"
              aria-label={`Read article: ${ARTICLES[2].title}`}
              onClick={(e) => openArticle(2, e.currentTarget)}
              onKeyDown={onCardKey(2)}
            >
              <div className="ins-glow"></div>
              <div className="ins-meta">
                <span>SUSTAINABILITY</span>
                <span>AUG 2026</span>
              </div>
              <h3>Passive Design Before Panels</h3>
              <p>
                Orientation and mass do more for a heating bill than any gadget
                ever will.
              </p>
            </article>
            <article
              className="ins-card ins-c4"
              data-hover
              data-cursor="READ"
              tabIndex={0}
              role="button"
              aria-label={`Read article: ${ARTICLES[3].title}`}
              onClick={(e) => openArticle(3, e.currentTarget)}
              onKeyDown={onCardKey(3)}
            >
              <div className="ins-glow"></div>
              <div className="ins-meta">
                <span>CRAFT</span>
                <span>JUN 2026</span>
              </div>
              <h3>What 200 Walkthroughs Taught Us About Light</h3>
              <p>
                Notes from the golden hour, taken standing in unfinished rooms.
              </p>
            </article>
            <article
              className="ins-card ins-c5"
              data-hover
              data-cursor="READ"
              tabIndex={0}
              role="button"
              aria-label={`Read article: ${ARTICLES[4].title}`}
              onClick={(e) => openArticle(4, e.currentTarget)}
              onKeyDown={onCardKey(4)}
            >
              <div className="ins-glow"></div>
              <div className="ins-meta">
                <span>DESIGN</span>
                <span>MAR 2026</span>
              </div>
              <h3>The Body Sets the Grid</h3>
              <p>
                Every proportion we use traces back to a body moving through a
                room.
              </p>
            </article>
          </div>
        </div>
      </section>
    </>
  );
}
