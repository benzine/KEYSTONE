/**
 * Keystone core utilities — port of the original page's KC namespace helpers
 * (non-React parts). React-specific wiring lives in KcProvider.
 */

import type { RefObject } from "react";

export const RAD = Math.PI / 180;

export function clamp(v: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, v));
}

export function smoothstep(x: number, a: number, b: number): number {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
}

/* ---------- settings persistence ---------- */

export interface KcSettings {
  theme: "light" | "dark";
  motion: "full" | "reduced";
  type: "s" | "a" | "l";
  cursor: "blueprint" | "system";
}

export const kcStore = {
  get(k: string, d: string): string {
    try {
      const v = localStorage.getItem("kc-" + k);
      return v === null ? d : v;
    } catch {
      return d;
    }
  },
  set(k: string, v: string): void {
    try {
      localStorage.setItem("kc-" + k, v);
    } catch {
      /* private mode */
    }
  },
};

export function loadSettings(prefersReduced: boolean): KcSettings {
  return {
    /* dark is the house default; a stored choice (either way) still wins */
    theme: kcStore.get("theme", "dark") as KcSettings["theme"],
    motion: kcStore.get("motion", prefersReduced ? "reduced" : "full") as KcSettings["motion"],
    type: kcStore.get("type", "a") as KcSettings["type"],
    cursor: kcStore.get("cursor", "blueprint") as KcSettings["cursor"],
  };
}

/* ---------- settings as an external store (useSyncExternalStore) ---------- */

export const DEFAULT_SETTINGS: KcSettings = {
  theme: "dark",
  motion: "full",
  type: "a",
  cursor: "blueprint",
};

let settingsCache: KcSettings | null = null;
const settingsListeners = new Set<() => void>();

export function getSettings(): KcSettings {
  if (settingsCache === null) {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    settingsCache = loadSettings(prefersReduced);
  }
  return settingsCache;
}

export function getServerSettings(): KcSettings {
  return DEFAULT_SETTINGS;
}

export function subscribeSettings(cb: () => void): () => void {
  settingsListeners.add(cb);
  return () => {
    settingsListeners.delete(cb);
  };
}

/** Update settings: persist, apply html classes, notify subscribers. */
export function updateSettings(patch: Partial<KcSettings>): void {
  settingsCache = { ...getSettings(), ...patch };
  for (const [k, v] of Object.entries(patch)) kcStore.set(k, v);
  if (typeof document !== "undefined") {
    const html = document.documentElement;
    if (patch.theme !== undefined)
      html.classList.toggle("theme-dark", patch.theme === "dark");
    if (patch.motion !== undefined) {
      html.classList.toggle("reduced", patch.motion === "reduced");
      html.classList.toggle(
        "simple",
        patch.motion === "reduced" ||
          window.matchMedia("(max-width:760px)").matches,
      );
    }
    if (patch.type !== undefined) {
      html.classList.toggle("type-s", patch.type === "s");
      html.classList.toggle("type-l", patch.type === "l");
    }
    if (patch.cursor !== undefined)
      html.classList.toggle("has-cursor", patch.cursor === "blueprint");
  }
  settingsListeners.forEach((l) => l());
}

/* ---------- shared runtime state (mutable, mirrors KC.state) ---------- */

export interface KcState {
  vel: number;
  nvel: number;
  heroP: number;
  svcP: number;
  procP: number;
  caseP: number;
  insP: number;
  teamP: number;
  bang: boolean;
  modalOpen: boolean;
  activeSection: HTMLElement | null;
  vis: {
    hero: boolean;
    svc: boolean;
    cases: boolean;
    ins: boolean;
    team: boolean;
    tools: boolean;
  };
}

export function createState(): KcState {
  return {
    vel: 0,
    nvel: 0,
    heroP: 0,
    svcP: 0,
    procP: 0,
    caseP: 0,
    insP: 0,
    teamP: 0,
    bang: false,
    modalOpen: false,
    activeSection: null,
    vis: {
      hero: false,
      svc: false,
      cases: false,
      ins: false,
      team: false,
      tools: false,
    },
  };
}

/* ---------- DOM helpers ---------- */

/* Landing depth for the Contact section's BEGIN affordances: past the bang
   (0.32), the field settle (0.4) and the address column's full reveal (the
   last .cs-block lands by 0.62), before the closing line (0.74) and the form
   exit (0.92) — the whole dream-form and its address column on screen, with
   nothing left to scroll for. */
export const CONTACT_FORM_FRAC = 0.68;

export function goTo(selector: string, opts?: { frac?: number }): void {
  const el = document.querySelector(selector);
  if (!el) return;
  let top = el.getBoundingClientRect().top + window.scrollY;
  /* Land at a fraction of the section's own scroll length (its ScrollTrigger
     progress). Skipped in reduced mode, where sections collapse to auto height
     and the form already sits at the top of its stage. */
  if (
    opts &&
    opts.frac &&
    !document.documentElement.classList.contains("reduced")
  ) {
    top += opts.frac * Math.max(0, el.offsetHeight - window.innerHeight);
  }
  window.scrollTo({ top, behavior: "smooth" });
  document.body.classList.remove("nav-open");
}

/** Split an element's text into per-character spans for stagger animation. */
export function splitChars(el: HTMLElement, cls: string): HTMLElement[] {
  const text = el.textContent ?? "";
  el.textContent = "";
  const frag = document.createDocumentFragment();
  const chars: HTMLElement[] = [];
  text.split(" ").forEach((word, wi, arr) => {
    const w = document.createElement("span");
    w.className = "ch-word";
    for (let i = 0; i < word.length; i++) {
      const s = document.createElement("span");
      s.className = "ch " + cls;
      s.textContent = word[i];
      w.appendChild(s);
      chars.push(s);
    }
    frag.appendChild(w);
    if (wi < arr.length - 1) frag.appendChild(document.createTextNode(" "));
  });
  el.appendChild(frag);
  return chars;
}

/** Split an element's text into per-word spans. */
export function splitWords(el: HTMLElement): HTMLElement[] {
  const text = el.textContent ?? "";
  el.textContent = "";
  const frag = document.createDocumentFragment();
  const words: HTMLElement[] = [];
  text.split(" ").forEach((word, wi, arr) => {
    const w = document.createElement("span");
    w.style.display = "inline-block";
    w.textContent = word;
    frag.appendChild(w);
    words.push(w);
    if (wi < arr.length - 1) frag.appendChild(document.createTextNode(" "));
  });
  el.appendChild(frag);
  return words;
}

/** Fit a canvas to its parent box (DPR-aware). */
export function fitCanvas(cv: HTMLCanvasElement): {
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
} {
  const r = cv.parentElement!.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  cv.width = Math.max(1, Math.round(r.width * dpr));
  cv.height = Math.max(1, Math.round(r.height * dpr));
  const ctx = cv.getContext("2d")!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w: r.width, h: r.height };
}

/** Trigger a plain-text file download. */
export function downloadText(name: string, lines: string[]): void {
  const blob = new Blob([lines.join("\n")], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

/** Types for context values shared across Keystone components. */

export interface KcmPayload {
  type: "phase" | "article" | "member";
  index: number;
  trigger?: HTMLElement | null;
}

export interface KcContextValue {
  state: RefObject<KcState>;
  settings: KcSettings;
  setTheme: (t: KcSettings["theme"]) => void;
  setMotion: (m: KcSettings["motion"]) => void;
  setType: (t: KcSettings["type"]) => void;
  setCursor: (c: KcSettings["cursor"]) => void;
  reduced: boolean;
  openCase: (key: string, trigger?: HTMLElement | null) => void;
  openKcm: (payload: KcmPayload) => void;
  goTo: (selector: string, opts?: { frac?: number }) => void;
}
