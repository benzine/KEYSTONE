"use client";

/**
 * Dock — specification sheet / settings dock. React port of the dock block of
 * the original script-17: panel slide (left on wide, bottom on narrow), scrim
 * fade, drag-to-open on the tab, settings switches (theme / motion / cursor),
 * type-scale buttons, quick navigation, Ctrl/Cmd+\ shortcut, ESC to close, and
 * the boot-time settings classes (type-s / type-l / theme-dark / cursor-system).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useKc } from "./KcProvider";
import { getSettings, type KcSettings } from "@/lib/keystone/kc-core";

gsap.registerPlugin(ScrollTrigger);

const DK_NAV: { n: string; label: string; target: string }[] = [
  { n: "00", label: "AWAKENING", target: "#sec-hero" },
  { n: "01", label: "THE STUDIO", target: "#sec-about" },
  { n: "02", label: "THE LEDGER", target: "#sec-ledger" },
  { n: "03", label: "THE JOURNEYS", target: "#sec-services" },
  { n: "04", label: "THE METHOD", target: "#sec-process" },
  { n: "05", label: "THE WORK", target: "#sec-cases" },
  { n: "06", label: "THE THINKING", target: "#sec-insights" },
  { n: "07", label: "THE INSTRUMENTS", target: "#sec-tools" },
  { n: "08", label: "THE PEOPLE", target: "#sec-team" },
  { n: "09", label: "THE BEGINNING", target: "#sec-contact" },
];

/* The shared runtime state lives on a ref exposed through context; touch it
   via module helpers so hook-derived values stay unmodified in place. */
function isModalOpen(state: { current: { modalOpen: boolean } }): boolean {
  return state.current.modalOpen;
}

function setModalOpen(state: { current: { modalOpen: boolean } }, v: boolean): void {
  state.current.modalOpen = v;
}

export default function Dock() {
  const { state, settings, setTheme, setMotion, setType, setCursor, goTo, reduced } =
    useKc();
  const [open, setOpen] = useState(false);
  const openRef = useRef(false);

  const tabRef = useRef<HTMLButtonElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const mqNarrowRef = useRef<MediaQueryList | null>(null);

  const narrow = () => mqNarrowRef.current?.matches ?? false;

  /* ----- open / close (port of openDock / closeDock) ----- */

  const openDock = useCallback(() => {
    if (openRef.current || isModalOpen(state)) return;
    openRef.current = true;
    setOpen(true);
    document.body.classList.add("dock-open");
    setModalOpen(state, true); // canvases pause while the dock is open
    document.documentElement.classList.add("modal-locked");
    tabRef.current?.setAttribute("aria-expanded", "true");
    const panel = panelRef.current;
    if (panel) {
      gsap.set(panel, { visibility: "visible" });
      gsap.to(
        panel,
        narrow()
          ? { yPercent: 0, duration: 0.75, ease: "expo.out" }
          : { xPercent: 0, duration: 0.75, ease: "expo.out" },
      );
    }
    const scrim = scrimRef.current;
    if (scrim) {
      gsap.to(scrim, { opacity: 1, duration: 0.5 });
      scrim.style.pointerEvents = "auto";
    }
    closeRef.current?.focus();
  }, [state]);

  const closeDock = useCallback(() => {
    if (!openRef.current) return;
    openRef.current = false;
    setOpen(false);
    document.body.classList.remove("dock-open");
    setModalOpen(state, false);
    document.documentElement.classList.remove("modal-locked");
    tabRef.current?.setAttribute("aria-expanded", "false");
    const scrim = scrimRef.current;
    if (scrim) {
      gsap.to(scrim, { opacity: 0, duration: 0.4 });
      scrim.style.pointerEvents = "none";
    }
    const panel = panelRef.current;
    if (panel) {
      gsap.to(
        panel,
        Object.assign(
          narrow()
            ? { yPercent: 104, duration: 0.55, ease: "power3.in" }
            : { xPercent: -104, duration: 0.55, ease: "power3.in" },
          { onComplete: () => gsap.set(panel, { visibility: "hidden" }) },
        ),
      );
      if (panel.contains(document.activeElement)) tabRef.current?.focus();
    }
  }, [state]);

  const toggleDock = useCallback(() => {
    if (openRef.current) closeDock();
    else openDock();
  }, [openDock, closeDock]);

  /* ----- mount: initial off-canvas position, drag-to-open, shortcuts ----- */

  useEffect(() => {
    const panel = panelRef.current;
    const tab = tabRef.current;
    const scrim = scrimRef.current;
    if (!panel || !tab || !scrim) return;

    mqNarrowRef.current = window.matchMedia("(max-width:760px)");
    const applyHidden = () => {
      if (!openRef.current)
        gsap.set(panel, narrow() ? { yPercent: 104 } : { xPercent: -104 });
    };
    applyHidden();
    const onMq = () => applyHidden();
    mqNarrowRef.current.addEventListener("change", onMq);

    /* boot classes from stored settings (script-17 boot section). Read via
       getSettings() so this effect only depends on stable values and never
       re-runs (and thus never tears down an open dock) when settings change. */
    const html = document.documentElement;
    const s = getSettings();
    if (s.type === "s") html.classList.add("type-s");
    if (s.type === "l") html.classList.add("type-l");
    if (s.theme === "dark") html.classList.add("theme-dark");
    if (s.cursor === "system") html.classList.add("cursor-system");

    /* drag-to-open on the tab */
    let drag: { x: number; y: number } | null = null;
    const onDown = (e: PointerEvent) => {
      drag = { x: e.clientX, y: e.clientY };
    };
    const onMove = (e: PointerEvent) => {
      if (!drag || openRef.current) return;
      if (e.clientX - drag.x > 55 || e.clientY - drag.y < -55) {
        drag = null;
        openDock();
      }
    };
    const onUp = () => {
      drag = null;
    };
    tab.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);

    /* keyboard: Ctrl/Cmd+\ toggles (guarded like the original), ESC closes */
    const onKey = (e: KeyboardEvent) => {
      if (openRef.current) {
        if ((e.ctrlKey || e.metaKey) && (e.key === "\\" || e.code === "Backslash")) {
          e.preventDefault();
          closeDock();
        } else if (e.key === "Escape") {
          document.body.classList.remove("nav-open");
          closeDock();
        }
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "\\" || e.code === "Backslash")) {
        e.preventDefault();
        if (isModalOpen(state)) return; // a modal owns the keyboard
        openDock();
      }
    };
    window.addEventListener("keydown", onKey);

    /* fonts settle → refresh scroll triggers (script-17 boot) */
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => ScrollTrigger.refresh()).catch(() => {});
    }

    return () => {
      mqNarrowRef.current?.removeEventListener("change", onMq);
      tab.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("keydown", onKey);
      if (openRef.current) {
        document.body.classList.remove("dock-open");
        setModalOpen(state, false);
        document.documentElement.classList.remove("modal-locked");
      }
      gsap.killTweensOf([panel, scrim]);
    };
  }, [state, openDock, closeDock]);

  /* ----- settings handlers ----- */

  const onTheme = () => {
    setTheme(settings.theme === "dark" ? "light" : "dark");
  };

  const onMotion = () => {
    const next: KcSettings["motion"] = settings.motion === "reduced" ? "full" : "reduced";
    if (next === settings.motion) return;
    setMotion(next); // persists; html classes flip via updateSettings
    const veil = document.getElementById("veil");
    if (veil) {
      veil.style.pointerEvents = "auto";
      gsap.to(veil, {
        opacity: 1,
        duration: 0.7,
        ease: "power2.in",
        onComplete: () => window.location.reload(),
      });
    } else {
      window.location.reload();
    }
  };

  const onCursor = () => {
    const next: KcSettings["cursor"] =
      settings.cursor === "system" ? "blueprint" : "system";
    setCursor(next);
    const html = document.documentElement;
    const isFine = window.matchMedia("(hover:hover) and (pointer:fine)").matches;
    if (next === "system") {
      html.classList.remove("has-cursor");
      html.classList.add("cursor-system");
    } else {
      html.classList.remove("cursor-system");
      if (isFine && !reduced) html.classList.add("has-cursor");
    }
  };

  const onType = (t: KcSettings["type"]) => {
    setType(t);
    ScrollTrigger.refresh();
  };

  /* ----- quick navigation ----- */

  const onNavListClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const b = (e.target as Element).closest(".dk-nav") as HTMLElement | null;
    if (!b) return;
    goTo(b.getAttribute("data-target") || "");
    closeDock();
  };

  const activeType = (t: string) => (settings.type === t ? " active" : "");

  return (
    <>
      <button
        id="dock-tab"
        ref={tabRef}
        aria-label="Open specification sheet"
        aria-expanded={open}
        data-cursor="SPEC"
        onClick={toggleDock}
      >
        <svg
          className="dt-icon"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.1"
          aria-hidden="true"
        >
          <circle cx="8" cy="8" r="4.5" />
          <path d="M8 1.2 V3.5 M8 12.5 V14.8 M1.2 8 H3.5 M12.5 8 H14.8" />
          <circle cx="8" cy="8" r="1" fill="currentColor" stroke="none" />
        </svg>
        <span className="dt-text" aria-hidden="true">SPEC</span>
      </button>
      <div id="dock-scrim" ref={scrimRef} aria-hidden="true" onClick={closeDock}></div>
      <aside id="dock-panel" ref={panelRef} aria-label="Specification sheet">
        <button
          className="x-close"
          id="dock-close"
          ref={closeRef}
          aria-label="Close specification sheet"
          onClick={closeDock}
        >
          <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2">
            <path d="M1 1 L11 11 M11 1 L1 11" />
            <path d="M1 1 L1 3 M1 1 L3 1 M11 11 L11 9 M11 11 L9 11" opacity=".6" />
          </svg>
        </button>
        <div className="dk-section">
          <div className="dk-head">SECTION A · APPEARANCE</div>
          <div className="dk-row">
            <span>SURFACE</span>
            <button
              className="dk-switch"
              id="sw-theme"
              role="switch"
              aria-checked={settings.theme === "dark"}
              aria-label="Night theme"
              onClick={onTheme}
            >
              <span className="ds-knob" aria-hidden="true"></span>
              <span className="ds-opt">LIGHT</span>
              <span className="ds-opt">DARK</span>
            </button>
          </div>
        </div>
        <div className="dk-section">
          <div className="dk-head">SECTION B · ACCESSIBILITY</div>
          <div className="dk-row">
            <span>MOTION</span>
            <button
              className="dk-switch"
              id="sw-motion"
              role="switch"
              aria-checked={settings.motion === "reduced"}
              aria-label="Reduced motion"
              onClick={onMotion}
            >
              <span className="ds-knob" aria-hidden="true"></span>
              <span className="ds-opt">FULL</span>
              <span className="ds-opt">REDUCED</span>
            </button>
          </div>
          <div className="dk-row">
            <span>TYPE SCALE</span>
            <div className="dk-types">
              <button
                className={"dk-type-btn" + activeType("s")}
                data-type="s"
                aria-label="Smaller type"
                onClick={() => onType("s")}
              >
                A−
              </button>
              <button
                className={"dk-type-btn" + activeType("a")}
                data-type="a"
                aria-label="Default type"
                onClick={() => onType("a")}
              >
                A
              </button>
              <button
                className={"dk-type-btn" + activeType("l")}
                data-type="l"
                aria-label="Larger type"
                onClick={() => onType("l")}
              >
                A+
              </button>
            </div>
          </div>
          <div className="dk-row">
            <span>CURSOR</span>
            <button
              className="dk-switch"
              id="sw-cursor"
              role="switch"
              aria-checked={settings.cursor === "system"}
              aria-label="System cursor"
              onClick={onCursor}
            >
              <span className="ds-knob" aria-hidden="true"></span>
              <span className="ds-opt">BLUEPRINT</span>
              <span className="ds-opt">SYSTEM</span>
            </button>
          </div>
        </div>
        <div className="dk-section">
          <div className="dk-head">SECTION C · QUICK NAVIGATION</div>
          <div id="dk-nav-list" onClick={onNavListClick}>
            {DK_NAV.map((it) => (
              <button
                key={it.target}
                className="dk-nav"
                data-target={it.target}
                type="button"
              >
                <span>{it.n}</span>
                <span>{it.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="dk-note">
          SETTINGS PERSIST LOCALLY · THIS SHEET IS YOURS
          <br />
          CTRL / ⌘ + \ TOGGLE · PRESS ESC TO CLOSE
        </div>
      </aside>
    </>
  );
}
