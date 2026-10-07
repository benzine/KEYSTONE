"use client";

/**
 * Nav — site header, primary links, search trigger, mobile menu.
 * Navigation clicks are delegated globally via [data-target] in KcProvider.
 * The search (open/close animation, index, filtering, keyboard navigation,
 * the "/" shortcut) is the React port of the search block in the original
 * script-17.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useKc } from "./KcProvider";
import { CONTACT_FORM_FRAC } from "@/lib/keystone/kc-core";

gsap.registerPlugin(ScrollTrigger);

/* ---------- search index (verbatim port of the original IDX) ---------- */

interface SrItem {
  t: string;
  s: string;
  g: string;
  target: string;
  kw: string;
}

const IDX: SrItem[] = [
  { t: "Meridian House", s: "Boulder, Colorado", g: "PROJECT", target: "#sec-cases", kw: "aspen passive house family slope concrete" },
  { t: "Travertine Court", s: "Scottsdale, Arizona", g: "PROJECT", target: "#sec-cases", kw: "courtyard shade desert sun rammed earth" },
  { t: "Longfield Barn", s: "Hudson Valley, New York", g: "PROJECT", target: "#sec-cases", kw: "1907 barn adaptive reuse timber chestnut" },
  { t: "Cascadia Ridge", s: "Portland, Oregon", g: "PROJECT", target: "#sec-cases", kw: "net zero energy ridge solar roof battery" },
  { t: "Fenwick Hollow", s: "Charleston, South Carolina", g: "PROJECT", target: "#sec-cases", kw: "low country piers raised flood river porch" },
  { t: "Solstice Yard", s: "Santa Fe, New Mexico", g: "PROJECT", target: "#sec-cases", kw: "adobe thermal mass desert passive walls" },
  { t: "The Custom Home Journey", s: "From empty lot to move-in day", g: "JOURNEY", target: "#sec-services", kw: "custom new build architecture" },
  { t: "The Renovation Journey", s: "Honoring the past", g: "JOURNEY", target: "#sec-services", kw: "renovation restore update old" },
  { t: "The Addition Journey", s: "Growing thoughtfully", g: "JOURNEY", target: "#sec-services", kw: "addition extend grow wing" },
  { t: "The Interior Architecture Journey", s: "Where materials meet light", g: "JOURNEY", target: "#sec-services", kw: "interior millwork daylight" },
  { t: "The Landscape Journey", s: "Extending into the land", g: "JOURNEY", target: "#sec-services", kw: "landscape terrace courtyard native" },
  { t: "The Investment Journey", s: "Building lasting value", g: "JOURNEY", target: "#sec-services", kw: "investment resale value lifecycle" },
  { t: "Marcus Hale", s: "Principal Architect", g: "PERSON", target: "#sec-team", kw: "principal architect founder design" },
  { t: "Elena Vásquez", s: "Senior Designer", g: "PERSON", target: "#sec-team", kw: "senior designer window seat light" },
  { t: "James Okafor", s: "Director of Construction", g: "PERSON", target: "#sec-team", kw: "construction director build site" },
  { t: "Sofia Lindqvist", s: "Interior Architecture", g: "PERSON", target: "#sec-team", kw: "interior materials" },
  { t: "Daniel Reyes", s: "Structural Engineer", g: "PERSON", target: "#sec-team", kw: "structural engineer beams loads" },
  { t: "Amara Chen", s: "Landscape Architect", g: "PERSON", target: "#sec-team", kw: "landscape grove native" },
  { t: "Theo Brandt", s: "Project Manager", g: "PERSON", target: "#sec-team", kw: "project manager schedule" },
  { t: "Nina Petrova", s: "Materials Researcher", g: "PERSON", target: "#sec-team", kw: "materials research patina aging" },
  { t: "Owen Fitzgerald", s: "Master Carpenter", g: "PERSON", target: "#sec-team", kw: "carpenter wood craft joinery" },
  { t: "The Case for Slower Houses", s: "Essay · Nov 2026", g: "INSIGHT", target: "#sec-insights", kw: "patience speed change orders essay" },
  { t: "Travertine: A Stone That Remembers", s: "Materials · Sep 2026", g: "INSIGHT", target: "#sec-insights", kw: "stone weather decades rome" },
  { t: "Passive Design Before Panels", s: "Sustainability", g: "INSIGHT", target: "#sec-insights", kw: "passive orientation overhang mass solar" },
  { t: "Board-Formed Concrete", s: "Material plate", g: "MATERIAL", target: "#sec-about", kw: "concrete pour formwork grain" },
  { t: "Quartersawn White Oak", s: "Material plate", g: "MATERIAL", target: "#sec-about", kw: "oak wood grain amber hardwax" },
  { t: "Unsealed Bronze", s: "Material plate", g: "MATERIAL", target: "#sec-about", kw: "bronze patina metal handles" },
  { t: "Italian Travertine", s: "Material plate", g: "MATERIAL", target: "#sec-about", kw: "travertine tivoli stone honed" },
  { t: "Belgian Linen", s: "Material plate", g: "MATERIAL", target: "#sec-about", kw: "linen flax curtains fabric" },
  { t: "The Budget Compass", s: "Cost instrument", g: "INSTRUMENT", target: "#sec-tools", kw: "cost calculator budget estimate financing donut" },
  { t: "The Palette Curator", s: "Material explorer", g: "INSTRUMENT", target: "#sec-tools", kw: "materials palette kitchen finishes cost impact" },
  { t: "The Sun Path Compass", s: "Solar analyzer", g: "INSTRUMENT", target: "#sec-tools", kw: "sun solar orientation glazing passive overheating" },
  { t: "The Construction Chronicle", s: "Timeline planner", g: "INSTRUMENT", target: "#sec-tools", kw: "timeline gantt phases weeks schedule decisions" },
];

const LABEL: Record<string, string> = {
  PROJECT: "PROJECTS",
  JOURNEY: "JOURNEYS",
  PERSON: "PEOPLE",
  INSIGHT: "INSIGHTS",
  MATERIAL: "MATERIALS",
  INSTRUMENT: "INSTRUMENTS",
};

/* ---------- matching logic (verbatim port of runSearch) ---------- */

function runSearch(q: string): SrItem[] | null {
  const qq = q.trim().toLowerCase();
  if (qq.length < 2) return null;
  return IDX.filter(
    (it) => (it.t + " " + it.s + " " + it.kw).toLowerCase().indexOf(qq) > -1,
  ).slice(0, 10);
}

export default function Nav() {
  const { goTo } = useKc();

  const navRef = useRef<HTMLElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("");
  const searchOpenRef = useRef(false);
  const hits = runSearch(query);

  /* ----- open / close (port of openSearch / closeSearch) ----- */

  const openSearch = useCallback(() => {
    if (searchOpenRef.current) return;
    searchOpenRef.current = true;
    const ns = searchRef.current;
    navRef.current?.classList.add("search-open");
    if (ns) {
      ns.classList.add("open");
      gsap.set(ns, { visibility: "visible" });
      gsap.to(ns, {
        width: Math.min(360, window.innerWidth * 0.4),
        opacity: 1,
        duration: 0.55,
        ease: "power3.out",
        onComplete: () => inputRef.current?.focus(),
      });
    }
  }, []);

  const closeSearch = useCallback(() => {
    if (!searchOpenRef.current) return;
    searchOpenRef.current = false;
    navRef.current?.classList.remove("search-open");
    setQuery("");
    const ns = searchRef.current;
    if (ns) {
      ns.classList.remove("open");
      gsap.to(ns, {
        width: 0,
        opacity: 0,
        duration: 0.4,
        ease: "power3.in",
        onComplete: () => gsap.set(ns, { visibility: "hidden" }),
      });
    }
  }, []);

  const toggleSearch = useCallback(() => {
    if (searchOpenRef.current) closeSearch();
    else openSearch();
  }, [openSearch, closeSearch]);

  /* ----- global keys: "/" opens search (or mobile menu), ESC closes ----- */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        document.body.classList.remove("nav-open");
        closeSearch();
        return;
      }
      if (e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const t = e.target as Element | null;
        if (
          t &&
          (t.matches("input,textarea") || (t as HTMLElement).isContentEditable)
        )
          return;
        e.preventDefault();
        if (window.innerWidth > 900) openSearch();
        else document.body.classList.add("nav-open");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openSearch, closeSearch]);

  /* ----- results picking ----- */

  const pick = (h: SrItem) => {
    goTo(h.target);
    closeSearch();
  };

  /* ----- keyboard navigation inside the search ----- */

  const onInputKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      closeSearch();
      return;
    }
    if (e.key === "Enter") {
      const first = resultsRef.current?.querySelector<HTMLButtonElement>(".sr-item");
      if (first) first.click();
    }
    if (e.key === "ArrowDown") {
      const f = resultsRef.current?.querySelector<HTMLButtonElement>(".sr-item");
      if (f) {
        e.preventDefault();
        f.focus();
      }
    }
  };

  const onResultsKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const rs = resultsRef.current;
    if (!rs) return;
    const items = Array.from(rs.querySelectorAll<HTMLButtonElement>(".sr-item"));
    const idx = items.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === "Escape") {
      e.stopPropagation();
      closeSearch();
    }
    if (e.key === "ArrowDown" && idx > -1 && idx < items.length - 1) {
      e.preventDefault();
      items[idx + 1].focus();
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (idx > 0) items[idx - 1].focus();
      else inputRef.current?.focus();
    }
  };

  /* render results with group headers (port of renderResults) */
  const nodes: React.ReactNode[] = [];
  if (hits) {
    let lastGroup = "";
    hits.forEach((h, i) => {
      if (h.g !== lastGroup) {
        lastGroup = h.g;
        nodes.push(
          <div key={"g" + i} className="sr-group">
            {LABEL[h.g] || h.g}
          </div>,
        );
      }
      nodes.push(
        <button key={i} type="button" className="sr-item" onClick={() => pick(h)}>
          <span className="sr-t">{h.t}</span>
          <span className="sr-s">{h.s}</span>
          <span className="sr-g">{LABEL[h.g] || h.g}</span>
        </button>,
      );
    });
  }

  return (
    <>
      <header id="nav" ref={navRef}>
        <a
          id="brand"
          href="#sec-hero"
          data-target="#sec-hero"
          onClick={(e) => {
            e.preventDefault();
            goTo("#sec-hero");
          }}
        >
          <span className="bw">KEYSTONE</span>
          <span className="bc">COLLECTIVE</span>
        </a>
        <nav id="nav-links" aria-label="Primary">
          <a className="nav-link u-draw" data-target="#sec-about" href="#sec-about">
            STUDIO
          </a>
          <a className="nav-link u-draw" data-target="#sec-ledger" href="#sec-ledger">
            LEDGER
          </a>
          <a className="nav-link u-draw" data-target="#sec-services" href="#sec-services">
            JOURNEYS
          </a>
          <a className="nav-link u-draw" data-target="#sec-process" href="#sec-process">
            METHOD
          </a>
          <a className="nav-link u-draw" data-target="#sec-cases" href="#sec-cases">
            WORK
          </a>
          <a className="nav-link u-draw" data-target="#sec-insights" href="#sec-insights">
            THINKING
          </a>
          <a className="nav-link u-draw" data-target="#sec-tools" href="#sec-tools">
            TOOLS
          </a>
          <a className="nav-link u-draw" data-target="#sec-team" href="#sec-team">
            PEOPLE
          </a>
        </nav>
        <div id="nav-right">
          <button
            id="nav-search-btn"
            aria-label="Open search"
            data-cursor="SEARCH"
            onClick={toggleSearch}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
              aria-hidden="true"
            >
              <circle cx="7.5" cy="7.5" r="5.5" />
              <line x1="11.8" y1="11.8" x2="16" y2="16" />
              <line x1="7.5" y1="5.5" x2="7.5" y2="9.5" opacity=".45" />
              <line x1="5.5" y1="7.5" x2="9.5" y2="7.5" opacity=".45" />
            </svg>
          </button>
          {/* BEGIN lands at the opened form (past the convergence bang), not
              at the dormant section head — data-target is dropped so the global
              section-top delegation doesn't double-fire the jump. */}
          <button
            className="btn-arch"
            onClick={() => goTo("#sec-contact", { frac: CONTACT_FORM_FRAC })}
            data-tilt
            data-cursor="BEGIN"
          >
            BEGIN
          </button>
          <button id="menu-btn" aria-label="Toggle menu">
            <span />
            <span />
          </button>
          <div id="nav-search" ref={searchRef} role="search">
            <div className="si-wrap">
              <span className="si-icon" aria-hidden="true">
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 18 18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.2"
                >
                  <circle cx="7.5" cy="7.5" r="5.5" />
                  <line x1="11.8" y1="11.8" x2="16" y2="16" />
                </svg>
              </span>
              <input
                id="search-input"
                ref={inputRef}
                type="text"
                placeholder="Search projects, materials, people…"
                aria-label="Search the index"
                autoComplete="off"
                spellCheck={false}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onInputKey}
              />
              <span id="search-underline" aria-hidden="true" />
              <div
                id="search-results"
                ref={resultsRef}
                role="listbox"
                aria-label="Search results"
                className={hits ? "on" : undefined}
                onKeyDown={onResultsKey}
              >
                {hits
                  ? hits.length
                    ? nodes
                    : <div className="sr-empty">NOTHING IN THE INDEX · TRY ANOTHER TERM</div>
                  : null}
              </div>
            </div>
          </div>
        </div>
      </header>
      <div id="mobile-menu">
        <a data-target="#sec-about" href="#sec-about">
          <span className="n">01</span>
          <span className="t">The Studio</span>
        </a>
        <a data-target="#sec-ledger" href="#sec-ledger">
          <span className="n">02</span>
          <span className="t">The Ledger</span>
        </a>
        <a data-target="#sec-services" href="#sec-services">
          <span className="n">03</span>
          <span className="t">The Journeys</span>
        </a>
        <a data-target="#sec-process" href="#sec-process">
          <span className="n">04</span>
          <span className="t">The Method</span>
        </a>
        <a data-target="#sec-cases" href="#sec-cases">
          <span className="n">05</span>
          <span className="t">The Work</span>
        </a>
        <a data-target="#sec-insights" href="#sec-insights">
          <span className="n">06</span>
          <span className="t">The Thinking</span>
        </a>
        <a data-target="#sec-tools" href="#sec-tools">
          <span className="n">07</span>
          <span className="t">The Instruments</span>
        </a>
        <a data-target="#sec-team" href="#sec-team">
          <span className="n">08</span>
          <span className="t">The People</span>
        </a>
        <a
          href="#sec-contact"
          onClick={(e) => {
            e.preventDefault();
            goTo("#sec-contact", { frac: CONTACT_FORM_FRAC });
          }}
        >
          <span className="n">09</span>
          <span className="t">The Beginning</span>
        </a>
        <div className="mm-note">KEYSTONE COLLECTIVE · EST. 2004</div>
      </div>
    </>
  );
}
