"use client";

/**
 * KcProvider — React port of the original page's CORE script (script-04).
 * Owns global runtime state, settings persistence, nav/progress/velocity
 * effects, section theming, custom cursor, grain, and navigation wiring.
 */

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
  type ReactNode,
  type RefObject,
} from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  clamp,
  createState,
  goTo,
  getServerSettings,
  getSettings,
  subscribeSettings,
  updateSettings,
  RAD,
  type KcContextValue,
  type KcSettings,
  type KcState,
  type KcmPayload,
} from "@/lib/keystone/kc-core";

gsap.registerPlugin(ScrollTrigger);

const KcContext = createContext<KcContextValue | null>(null);

export function useKc(): KcContextValue {
  const ctx = useContext(KcContext);
  if (!ctx) throw new Error("useKc must be used within KcProvider");
  return ctx;
}

interface KcProviderProps {
  children: ReactNode;
  openCase: (key: string, trigger?: HTMLElement | null) => void;
  openKcm: (payload: KcmPayload) => void;
}

export function KcProvider({ children, openCase, openKcm }: KcProviderProps) {
  const stateRef = useRef<KcState>(createState());
  const settings = useSyncExternalStore(
    subscribeSettings,
    getSettings,
    getServerSettings,
  );

  const setTheme = (theme: KcSettings["theme"]) => updateSettings({ theme });
  const setMotion = (motion: KcSettings["motion"]) =>
    updateSettings({ motion });
  const setType = (type: KcSettings["type"]) => updateSettings({ type });
  const setCursor = (cursor: KcSettings["cursor"]) =>
    updateSettings({ cursor });

  const reduced = settings.motion === "reduced";

  /* Global engine — port of script-04 core effects. */
  useEffect(() => {
    const html = document.documentElement;
    const state = stateRef.current;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isFine = window.matchMedia("(hover:hover) and (pointer:fine)").matches;
    const s = getSettings();
    const isReduced = prefersReduced || s.motion === "reduced";

    const ctx = gsap.context(() => {});

    /* Responsive layout mode: narrow or reduced → simple. */
    const mqNarrow = window.matchMedia("(max-width:760px)");
    const layoutMode = () =>
      html.classList.toggle("simple", mqNarrow.matches || isReduced);
    layoutMode();
    const onMqChange = () => {
      layoutMode();
      ScrollTrigger.refresh();
    };
    mqNarrow.addEventListener("change", onMqChange);

    /* Grain texture. */
    const grain = document.getElementById("grain") as HTMLCanvasElement | null;
    if (grain) {
      const c = document.createElement("canvas");
      c.width = c.height = 128;
      const x = c.getContext("2d")!;
      const d = x.createImageData(128, 128);
      for (let i = 0; i < d.data.length; i += 4) {
        const v = (Math.random() * 255) | 0;
        d.data[i] = v;
        d.data[i + 1] = v;
        d.data[i + 2] = v;
        d.data[i + 3] = 26;
      }
      x.putImageData(d, 0, 0);
      grain.style.backgroundImage = `url(${c.toDataURL()})`;
    }

    /* Nav condensing. */
    const nav = document.getElementById("nav");
    const onScroll = () => {
      nav?.classList.toggle("condensed", window.scrollY > 70);
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    /* Smooth-scroll navigation via [data-target] delegation. */
    const onNavClick = (e: MouseEvent) => {
      const el = (e.target as Element).closest("[data-target]");
      if (el) {
        e.preventDefault();
        goTo(el.getAttribute("data-target")!);
      }
    };
    document.addEventListener("click", onNavClick);

    /* Mobile menu button. */
    const menuBtn = document.getElementById("menu-btn");
    const onMenu = () => document.body.classList.toggle("nav-open");
    menuBtn?.addEventListener("click", onMenu);

    /* Section theming — active section drives chrome + progress label. */
    const progFill = document.getElementById("prog-fill");
    const progLabel = document.getElementById("prog-label");
    function applySection(sec: HTMLElement) {
      state.activeSection = sec;
      const dark =
        sec.getAttribute("data-theme") === "dark" ||
        html.classList.contains("theme-dark") ||
        (sec.id === "sec-hero" &&
          (state.heroP > 0.55 ||
            document.body.classList.contains("hero-video-on")));
      document.body.classList.toggle("sec-dark", dark);
      nav?.classList.toggle("on-dark", dark);
      const accent = sec.getAttribute("data-accent") ?? "";
      if (progFill) progFill.style.background = accent;
      if (progLabel) {
        progLabel.style.color = accent;
        progLabel.textContent =
          sec.getAttribute("data-index") + " · " + sec.getAttribute("data-name");
      }
      document.querySelectorAll(".nav-link").forEach((a) => {
        a.classList.toggle(
          "active",
          a.getAttribute("data-target") === "#" + sec.id,
        );
      });
      document.querySelectorAll(".mm-node").forEach((n) => {
        n.classList.toggle(
          "active",
          n.getAttribute("data-target") === "#" + sec.id,
        );
      });
      document.querySelectorAll(".dk-nav").forEach((n) => {
        n.classList.toggle(
          "active",
          n.getAttribute("data-target") === "#" + sec.id,
        );
      });
    }
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>("[data-name]"),
    );
    const triggers = sections.map((sec) =>
      ScrollTrigger.create({
        trigger: sec,
        start: "top 45%",
        end: "bottom 45%",
        onToggle: (self) => {
          if (self.isActive) applySection(sec);
        },
      }),
    );

    /* Progress rail fill. */
    const onTickProgress = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      if (progFill) {
        progFill.style.height = (h > 0 ? clamp(window.scrollY / h, 0, 1) * 100 : 0) + "%";
      }
    };
    gsap.ticker.add(onTickProgress);

    /* Scroll velocity → CSS vars + hero tilt. */
    const heroTilt = document.getElementById("hero-tilt");
    let lastY = window.scrollY;
    const onTickVelocity = () => {
      const y = window.scrollY;
      const v = y - lastY;
      lastY = y;
      state.vel += (v - state.vel) * 0.12;
      const nv = clamp(Math.abs(state.vel) / 26, 0, 1);
      state.nvel += (nv - state.nvel) * 0.16;
      const root = html.style;
      root.setProperty("--vel", state.nvel.toFixed(3));
      root.setProperty("--ca", (state.nvel * 3).toFixed(2));
      root.setProperty("--mb", (state.nvel * 3.4).toFixed(2));
      root.setProperty("--lb", (state.nvel * 1.3).toFixed(2));
      if (!isReduced && state.vis.hero && !state.modalOpen && heroTilt) {
        gsap.set(heroTilt, { rotation: clamp(state.vel * 0.05, -2.1, 2.1) });
      }
    };
    gsap.ticker.add(onTickVelocity);

    /* Blueprint cursor + ink ripples (fine pointers, full motion only). */
    let cleanupCursor: (() => void) | null = null;
    if (isFine && !isReduced && s.cursor !== "system") {
      html.classList.add("has-cursor");
      const cur = document.getElementById("cursor");
      const lab = document.getElementById("c-label");
      const qx = cur ? gsap.quickTo(cur, "x", { duration: 0.16, ease: "power3" }) : null;
      const qy = cur ? gsap.quickTo(cur, "y", { duration: 0.16, ease: "power3" }) : null;
      let shown = false;
      const onMove = (e: MouseEvent) => {
        if (!shown && cur) {
          shown = true;
          gsap.to(cur, { opacity: 1, duration: 0.3 });
        }
        qx?.(e.clientX);
        qy?.(e.clientY);
      };
      const onOver = (e: MouseEvent) => {
        if (!cur) return;
        const t = (e.target as Element | null)?.closest?.(
          "a,button,input,textarea,[data-hover]",
        );
        cur.classList.remove("is-hover", "is-text");
        if (!t) return;
        if (t.matches("input,textarea")) cur.classList.add("is-text");
        else {
          cur.classList.add("is-hover");
          if (lab) lab.textContent = t.getAttribute("data-cursor") || "";
        }
      };
      const onDown = (e: PointerEvent) => {
        for (let k = 0; k < 2; k++) {
          const r = document.createElement("div");
          r.className = "ink-ripple";
          r.style.left = e.clientX + "px";
          r.style.top = e.clientY + "px";
          document.body.appendChild(r);
          gsap.fromTo(
            r,
            { scale: 0.2, opacity: 0.8 },
            {
              scale: k ? 7 : 4.4,
              opacity: 0,
              duration: 0.9 + k * 0.3,
              ease: "power2.out",
              onComplete: () => r.remove(),
            },
          );
        }
      };
      window.addEventListener("mousemove", onMove);
      document.addEventListener("mouseover", onOver);
      window.addEventListener("pointerdown", onDown);
      cleanupCursor = () => {
        window.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseover", onOver);
        window.removeEventListener("pointerdown", onDown);
        html.classList.remove("has-cursor");
      };
    }

    /* Tilt + perspective hover effects — global delegation (script-15 port). */
    const tiltEls = Array.from(document.querySelectorAll<HTMLElement>("[data-tilt]"));
    const perspEls = Array.from(document.querySelectorAll<HTMLElement>("[data-perspective]"));
    const tiltCleanup: (() => void)[] = [];
    if (!isReduced) {
      tiltEls.forEach((el) => {
        const onMove = (e: MouseEvent) => {
          const r = el.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width - 0.5;
          const py = (e.clientY - r.top) / r.height - 0.5;
          gsap.to(el, {
            rotationY: px * 10,
            rotationX: -py * 8,
            transformPerspective: 520,
            duration: 0.5,
            ease: "power2.out",
          });
        };
        const onLeave = () =>
          gsap.to(el, { rotationX: 0, rotationY: 0, duration: 0.9, ease: "elastic.out(1,.5)" });
        el.addEventListener("mousemove", onMove);
        el.addEventListener("mouseleave", onLeave);
        tiltCleanup.push(() => {
          el.removeEventListener("mousemove", onMove);
          el.removeEventListener("mouseleave", onLeave);
        });
      });
      perspEls.forEach((w) => {
        const img = w.querySelector("img");
        if (!img) return;
        const onMove = (e: MouseEvent) => {
          const r = w.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width - 0.5;
          const py = (e.clientY - r.top) / r.height - 0.5;
          gsap.to(w, {
            rotationY: px * 6,
            rotationX: -py * 5,
            transformPerspective: 900,
            duration: 0.6,
            ease: "power2.out",
          });
          gsap.to(img, { x: px * -12, y: py * -9, duration: 0.6, ease: "power2.out" });
        };
        const onLeave = () =>
          gsap.to([w, img], {
            rotationX: 0,
            rotationY: 0,
            x: 0,
            y: 0,
            duration: 0.9,
            ease: "power3.out",
          });
        w.addEventListener("mousemove", onMove);
        w.addEventListener("mouseleave", onLeave);
        tiltCleanup.push(() => {
          w.removeEventListener("mousemove", onMove);
          w.removeEventListener("mouseleave", onLeave);
        });
      });
    }

    return () => {
      mqNarrow.removeEventListener("change", onMqChange);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("click", onNavClick);
      menuBtn?.removeEventListener("click", onMenu);
      gsap.ticker.remove(onTickProgress);
      gsap.ticker.remove(onTickVelocity);
      triggers.forEach((t) => t.kill());
      tiltCleanup.forEach((fn) => fn());
      ctx.revert();
      cleanupCursor?.();
    };
  }, []);

  const value = useMemo<KcContextValue>(
    () => ({
      state: stateRef as RefObject<KcState>,
      settings,
      setTheme,
      setMotion,
      setType,
      setCursor,
      reduced,
      openCase,
      openKcm,
      goTo,
    }),
    [settings, reduced, openCase, openKcm],
  );

  return <KcContext.Provider value={value}>{children}</KcContext.Provider>;
}

export { RAD };
