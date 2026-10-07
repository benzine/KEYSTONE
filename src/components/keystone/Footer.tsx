"use client";

/**
 * Footer — Section 09 · THE DESCENT.
 * React port of the original script-15 footer scene: the #foot-mark giant
 * watermark reveal (opacity / rise / letter-spacing tracking-in on scroll)
 * and the staggered .foot-reveal entrances (cols + minimap + meta).
 *
 * ENHANCEMENTS:
 *  - #honors — affiliations & awards seal row (line-art institutional
 *    medallions, stagger + gold light-sweep on scroll)
 *  - #foot-bottom — social icons (FB · YT · Insta · X) at the very bottom
 *  - #ifx-credit — infografix.site credit: characters rise in with
 *    letter-tracking, then a gold sheen sweeps the wordmark forever
 * (The [data-tilt] / [data-perspective] hovers from the tail of the
 * original script-15 block are wired globally in KcProvider — not
 * re-registered here. The minimap's [data-target] clicks go through the
 * provider's delegation; .mm-node hover + active states are pure
 * keystone.css — active toggling lives in the provider's section theming.)
 */

import { useEffect, useId, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useKc } from "./KcProvider";
import { Facebook, Youtube, Instagram } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

/* ------------------------------------------------------------------ */
/* Honors — institutional seals                                        */
/* ------------------------------------------------------------------ */

interface SealDef {
  mono: string;
  name: string;
  sub: string;
  est: string;
}

const HONORS: SealDef[] = [
  {
    mono: "AIA",
    name: "AMERICAN INSTITUTE OF ARCHITECTS",
    sub: "FELLOW · FAIA",
    est: "EST. 1857",
  },
  {
    mono: "RIBA",
    name: "ROYAL INSTITUTE OF BRITISH ARCHITECTS",
    sub: "INT'L FELLOW",
    est: "EST. 1834",
  },
  {
    mono: "P",
    name: "PRITZKER ARCHITECTURE PRIZE",
    sub: "NOMINEE · 2024",
    est: "EST. 1979",
  },
  {
    mono: "RAIC",
    name: "ROYAL ARCHITECTURAL INSTITUTE OF CANADA",
    sub: "HONORARY FELLOW",
    est: "EST. 1907",
  },
  {
    mono: "MIES",
    name: "EU PRIZE · MIES VAN DER ROHE",
    sub: "SHORTLIST · 2023",
    est: "EST. 1987",
  },
  {
    mono: "LEED",
    name: "U.S. GREEN BUILDING COUNCIL",
    sub: "LEED FELLOW",
    est: "EST. 1993",
  },
];

/** One laurel leaf on a polar arc around the seal center, its
 *  rotation baked into the path points so the shared gradient can
 *  sweep it in absolute coordinates. */
function LaurelLeaf({
  deg,
  radius,
  flip,
}: {
  deg: number;
  radius: number;
  flip: boolean;
}) {
  const rad = (deg * Math.PI) / 180;
  const x = 42 + radius * Math.cos(rad);
  const y = 42 + radius * Math.sin(rad);
  const rot = (deg + 90 + (flip ? 12 : -12)) * (Math.PI / 180);
  const pts = [
    [-3.4, 0],
    [0, 1.7],
    [3.4, 0],
  ].map(([px, py]) => [
    x + px * Math.cos(rot) - py * Math.sin(rot),
    y + px * Math.sin(rot) + py * Math.cos(rot),
  ]);
  return (
    <path
      d={`M${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)} Q${pts[1][0].toFixed(2)} ${pts[1][1].toFixed(2)} ${pts[2][0].toFixed(2)} ${pts[2][1].toFixed(2)}`}
    />
  );
}

/** A pair of laurel sprigs flanking the bottom of the seal. Every
 *  leaf path is baked in absolute seal coordinates (no transform),
 *  so the sheen gradient reads in one shared user space. */
function Laurels({ ink }: { ink: string }) {
  const left = [104, 118, 132, 146, 160];
  const right = [76, 62, 48, 34, 20];
  return (
    <g strokeWidth="1.1" strokeLinecap="round" fill="none" stroke={ink}>
      <path d="M25.5 60.5 Q29 47 38.5 39.5" />
      <path d="M58.5 60.5 Q55 47 45.5 39.5" />
      {left.map((d) => (
        <LaurelLeaf key={d} deg={d} radius={29.5} flip />
      ))}
      {right.map((d) => (
        <LaurelLeaf key={d} deg={d} radius={29.5} flip={false} />
      ))}
    </g>
  );
}

function Seal({ def }: { def: SealDef }) {
  const monoSize = def.mono.length >= 4 ? 10.5 : 14;
  /* the light that passes through this medallion lives inside its
     own engraving: every line is stroked with a gradient whose gold
     band waits off-canvas (x1 -130) until the row sweep translates
     it across the seal. the caption text carries the same band as a
     clipped background, so the whole badge catches the light. */
  const gid = "hng" + useId().replace(/[^a-zA-Z0-9]/g, "");
  const ink = `url(#${gid})`;
  return (
    <div className="hn-seal">
      <svg viewBox="0 0 84 84" role="img" aria-label={`${def.name} seal`}>
        <defs>
          <linearGradient
            id={gid}
            gradientUnits="userSpaceOnUse"
            x1="-130"
            y1="61"
            x2="-46"
            y2="23"
          >
            <stop offset="0" className="hn-ga" />
            <stop offset=".22" className="hn-ga" />
            <stop offset=".38" className="hn-gb" />
            <stop offset=".5" className="hn-gc" />
            <stop offset=".62" className="hn-gb" />
            <stop offset=".78" className="hn-ga" />
            <stop offset="1" className="hn-ga" />
          </linearGradient>
        </defs>
        <circle
          cx="42"
          cy="42"
          r="40"
          fill="none"
          stroke={ink}
          strokeWidth="1"
          opacity=".55"
        />
        <circle
          cx="42"
          cy="42"
          r="34.5"
          fill="none"
          stroke={ink}
          strokeWidth=".8"
          strokeDasharray="1.6 3"
          opacity=".7"
        />
        <Laurels ink={ink} />
        <path
          d="M42 10.2 L44.2 12.9 42 15.6 39.8 12.9 Z"
          fill="#C9A962"
          opacity=".9"
        />
        <text
          x="42"
          y="40"
          textAnchor="middle"
          fontFamily="'JetBrains Mono',monospace"
          fontWeight="500"
          fontSize={monoSize}
          letterSpacing=".5"
          fill={ink}
        >
          {def.mono}
        </text>
        <text
          x="42"
          y="55"
          textAnchor="middle"
          fontFamily="'JetBrains Mono',monospace"
          fontSize="5.6"
          letterSpacing="1.1"
          fill={ink}
          opacity=".66"
        >
          {def.est}
        </text>
      </svg>
      <div className="hn-name">{def.name}</div>
      <div className="hn-sub">{def.sub}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Social icons                                                        */
/* ------------------------------------------------------------------ */

const XGlyph = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.451-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644Z" />
  </svg>
);

const SOCIALS = [
  {
    label: "Facebook",
    href: "https://www.facebook.com",
    icon: <Facebook strokeWidth={1.6} />,
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com",
    icon: <Youtube strokeWidth={1.6} />,
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com",
    icon: <Instagram strokeWidth={1.6} />,
  },
  { label: "X", href: "https://x.com", icon: <XGlyph /> },
];

/* ------------------------------------------------------------------ */
/* infografix credit — kinetic wordmark                                */
/* ------------------------------------------------------------------ */

const IFX_WORD = "INFOGRAFIX";
const IFX_TAIL = "SITE";

function CreditWord() {
  return (
    <span className="ifx-word">
      <span className="ifx-mark" aria-hidden="true" />
      <span aria-hidden="true">
        {IFX_WORD.split("").map((ch, i) => (
          <span
            key={`w${i}`}
            className="ifx-ch"
            style={{ animationDelay: `${(i * 0.22).toFixed(2)}s` }}
          >
            {ch}
          </span>
        ))}
        <span className="ifx-ch dot">.</span>
        {IFX_TAIL.split("").map((ch, i) => (
          <span
            key={`t${i}`}
            className="ifx-ch"
            style={{ animationDelay: `${((IFX_WORD.length + 1 + i) * 0.22).toFixed(2)}s` }}
          >
            {ch}
          </span>
        ))}
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Footer                                                              */
/* ------------------------------------------------------------------ */

export default function Footer() {
  const { reduced } = useKc();
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || reduced) return;

    const ctx = gsap.context(() => {
      /* the giant wordmark. letter-spacing and text-indent are tweened
         in lockstep as runtime px numbers (em strings do not interpolate
         on this gsap build) so the word stays optically centered through
         the whole tracking-in; clearProps hands it back to the CSS
         resting state, which carries the same .09em pair. */
      const mark = el.querySelector("#foot-mark");
      if (mark) {
        const fs = parseFloat(getComputedStyle(mark).fontSize) || 160;
        const from = fs * 0.22;
        const to = fs * 0.09;
        gsap.fromTo(
          mark,
          { opacity: 0, y: 70, letterSpacing: from, textIndent: from },
          {
            opacity: 1,
            y: 0,
            letterSpacing: to,
            textIndent: to,
            duration: 1.8,
            ease: "power4.out",
            clearProps: "letterSpacing,textIndent",
            scrollTrigger: { trigger: el, start: "top 78%" },
          },
        );
      }
      gsap.from(".foot-reveal", {
        opacity: 0,
        y: 24,
        duration: 1.2,
        ease: "power3.out",
        stagger: 0.12,
        scrollTrigger: { trigger: el, start: "top 70%" },
      });

      /* honors — seals stagger up, then gold light passes through the
         engraving itself. there is no overlay and no band above the
         paper: every medallion's lines are stroked with a gradient
         whose gold band rests off-canvas, and the sweep translates
         the band across each seal in row order, staggered so the
         six crossings read as one continuous pass through the row.
         the caption text carries the same band as a clipped
         background, and the sweep repeats on a long delay. */
      gsap.from(".hn-seal", {
        opacity: 0,
        y: 30,
        rotation: -4,
        duration: 1.1,
        ease: "power3.out",
        stagger: 0.09,
        scrollTrigger: { trigger: "#honors", start: "top 82%" },
      });
      const seals = Array.from(el.querySelectorAll<HTMLElement>(".hn-seal"));
      if (seals.length) {
        const TT = 2.6;
        const per = (TT / seals.length) * 1.5;
        const sweep = gsap.timeline({
          repeat: -1,
          repeatDelay: 6.5,
          scrollTrigger: { trigger: "#honors", start: "top 82%" },
        });
        seals.forEach((seal, i) => {
          const at = Math.max(0, ((i + 0.5) / seals.length) * TT - per / 2);
          const grad = seal.querySelector("linearGradient");
          if (grad) {
            sweep.fromTo(
              grad,
              { attr: { x1: -130, x2: -46 } },
              { attr: { x1: 130, x2: 214 }, duration: per, ease: "power1.inOut" },
              at,
            );
          }
          seal
            .querySelectorAll<HTMLElement>(".hn-name, .hn-sub")
            .forEach((cap) => {
              sweep.fromTo(
                cap,
                { backgroundPosition: "130% 0" },
                {
                  backgroundPosition: "-130% 0",
                  duration: per,
                  ease: "power1.inOut",
                },
                at,
              );
            });
        });
      }

      /* credit — characters rise with tracking, then the CSS sheen loops */
      gsap.from(".ifx-ch", {
        yPercent: 120,
        opacity: 0,
        duration: 1.05,
        ease: "power4.out",
        stagger: 0.045,
        scrollTrigger: { trigger: "#foot-bottom", start: "top 88%" },
      });
      gsap.from(".ifx-line", {
        opacity: 0,
        duration: 1,
        delay: 0.3,
        scrollTrigger: { trigger: "#foot-bottom", start: "top 88%" },
      });
      gsap.from(".soc", {
        opacity: 0,
        y: 18,
        scale: 0.6,
        duration: 0.9,
        ease: "back.out(2.2)",
        stagger: 0.08,
        scrollTrigger: { trigger: "#foot-bottom", start: "top 88%" },
      });
    }, el);

    return () => {
      ctx.revert();
    };
  }, [reduced]);

  return (
    <footer
      ref={rootRef}
      id="footer"
      data-name="THE DESCENT"
      data-index="10"
      data-accent="#8C7853"
      data-theme="light"
    >
      <div className="wrap">
        <div id="foot-mark">KEYSTONE</div>
        <div className="foot-tag">THE STONE THAT HOLDS EVERYTHING TOGETHER</div>
        <div className="foot-cols">
          <div className="foot-col foot-reveal">
            <h4>STUDIO</h4>
            <a className="u-draw" data-target="#sec-about" href="#sec-about">
              About the Collective
            </a>
            <a className="u-draw" data-target="#sec-team" href="#sec-team">
              Our people
            </a>
            <a className="u-draw" data-target="#sec-insights" href="#sec-insights">
              Thinking
            </a>
          </div>
          <div className="foot-col foot-reveal">
            <h4>JOURNEYS</h4>
            <a className="u-draw" data-target="#sec-services" href="#sec-services">
              Custom homes
            </a>
            <a className="u-draw" data-target="#sec-services" href="#sec-services">
              Renovations &amp; additions
            </a>
            <a className="u-draw" data-target="#sec-services" href="#sec-services">
              Interiors &amp; landscape
            </a>
          </div>
          <div className="foot-col foot-reveal">
            <h4>ELSEWHERE</h4>
            <a
              className="u-draw"
              href="https://www.facebook.com"
              data-cursor="VISIT"
            >
              Facebook
            </a>
            <a
              className="u-draw"
              href="https://www.youtube.com"
              data-cursor="VISIT"
            >
              YouTube
            </a>
            <a
              className="u-draw"
              href="https://www.instagram.com"
              data-cursor="VISIT"
            >
              Instagram
            </a>
            <a className="u-draw" href="https://x.com" data-cursor="VISIT">
              X
            </a>
          </div>
        </div>
        <div id="minimap" className="foot-reveal">
          <div className="mm-title">THE JOURNEY · TEN STOPS</div>
          <div className="mm-track">
            <button className="mm-node" data-target="#sec-hero">
              <i />
              <span>AWAKENING</span>
            </button>
            <button className="mm-node" data-target="#sec-about">
              <i />
              <span>STUDIO</span>
            </button>
            <button className="mm-node" data-target="#sec-ledger">
              <i />
              <span>LEDGER</span>
            </button>
            <button className="mm-node" data-target="#sec-services">
              <i />
              <span>JOURNEYS</span>
            </button>
            <button className="mm-node" data-target="#sec-process">
              <i />
              <span>METHOD</span>
            </button>
            <button className="mm-node" data-target="#sec-cases">
              <i />
              <span>WORK</span>
            </button>
            <button className="mm-node" data-target="#sec-insights">
              <i />
              <span>THINKING</span>
            </button>
            <button className="mm-node" data-target="#sec-tools">
              <i />
              <span>INSTRUMENTS</span>
            </button>
            <button className="mm-node" data-target="#sec-team">
              <i />
              <span>PEOPLE</span>
            </button>
            <button className="mm-node" data-target="#sec-contact">
              <i />
              <span>BEGINNING</span>
            </button>
          </div>
        </div>
        <div id="honors" className="foot-reveal">
          <div className="hn-title">AFFILIATIONS &amp; HONORS</div>
          <div className="hn-row">
            {HONORS.map((h) => (
              <Seal key={h.mono + h.sub} def={h} />
            ))}
          </div>
        </div>
        <div className="foot-meta foot-reveal">
          <span>© 2026 KEYSTONE COLLECTIVE · ARCHITECTS &amp; BUILDERS</span>
          <span>BOULDER, COLORADO · EST. 2004</span>
          <span>CONCEPT PROTOTYPE · CINEMATIC SCROLL STUDY</span>
        </div>
        <div id="foot-bottom" className="foot-reveal">
          <div className="fb-social" aria-label="Follow the studio">
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                className="soc"
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${s.label}, opens in a new tab`}
                data-cursor="VISIT"
              >
                {s.icon}
              </a>
            ))}
          </div>
          <a
            id="ifx-credit"
            href="https://infografix.site"
            target="_blank"
            rel="noopener noreferrer"
            data-cursor="VISIT"
            aria-label="Site design and motion by infografix.site, opens in a new tab"
          >
            <span className="ifx-line">SITE DESIGN &amp; MOTION</span>
            <CreditWord />
          </a>
        </div>
      </div>
    </footer>
  );
}
