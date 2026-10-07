"use client";

/**
 * KcmModal — knowledge-center sheet modal (phases / articles / members).
 * React port of the sheet-modal half of the original script-16:
 * buildShell / openSheet / closeSheet / sec / phaseHTML / articleHTML /
 * memberHTML / swapArticle.
 *
 * The page owns the payload (non-null = open). The shell stays mounted like
 * the original's buildShell node; content is derived from payload (+ an
 * article-swap state bound to the payload object it was opened with).
 * Closing runs the original gsap timeline and then calls onClose().
 */

import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useKc } from "./KcProvider";
import { kcImg } from "@/lib/keystone/images";
import { PHASES } from "@/lib/keystone/phases";
import { ARTICLES } from "@/lib/keystone/articles";
import { MEMBERS } from "@/lib/keystone/members";
import type { KcmPayload } from "@/lib/keystone/kc-core";

gsap.registerPlugin(ScrollTrigger);

export interface KcmModalProps {
  payload: KcmPayload | null; // {type, index, trigger} — null = closed
  onClose: () => void;
}

interface KcmView {
  type: "phase" | "article" | "member";
  index: number;
  title: string;
  sub: string;
  no: string;
}

const PHASE_IMGS = [
  "keystone-discovery",
  "keystone-design",
  "keystone-docs",
  "keystone-build",
  "keystone-deliver",
];

/* The shared runtime state lives on a ref exposed through context; touch it
   via module helpers so hook-derived values stay unmodified in place. */
function setModalOpen(state: { current: { modalOpen: boolean } }, v: boolean): void {
  state.current.modalOpen = v;
}

/* ---------- header data per payload (mirrors the original triggers) ---------- */

function viewFromPayload(p: KcmPayload, swapped: boolean): KcmView {
  const i = p.index;
  if (p.type === "phase") {
    return {
      type: "phase",
      index: i,
      title: `Phase 0${i + 1} · ${PHASES[i].name}`,
      sub: PHASES[i].quote,
      no: `SHT A-3${i + 1}1 · PHASE DETAIL`,
    };
  }
  if (p.type === "article") {
    const a = ARTICLES[i];
    return {
      type: "article",
      index: i,
      title: a.title,
      sub: `${a.cat} · ${a.author}`,
      no: swapped ? `SHT A-3${i + 1}1` : `SHT A-3${i + 1}1 · ESSAY`,
    };
  }
  return {
    type: "member",
    index: i,
    title: MEMBERS[i].name,
    sub: MEMBERS[i].role,
    no: `SHT A-6${i < 9 ? "0" + (i + 1) : i + 1} · PERSONNEL`,
  };
}

/* ---------- content sections (JSX port of phaseHTML/articleHTML/memberHTML) ---------- */

function PhaseContent({ index }: { index: number }) {
  const p = PHASES[index];
  return (
    <>
      <section className="kcm-sec kcm-hero">
        <div className="photo photo-frame" style={{ height: "min(36vh,360px)" }}>
          <img src={kcImg(PHASE_IMGS[index], 1400, 800)} alt={`${p.name}, phase photograph`} />
        </div>
      </section>
      <section className="kcm-sec">
        <div className="kcm-kick">DURATION</div>
        <p className="kcm-big">{p.dur}</p>
      </section>
      <section className="kcm-sec">
        <div className="kcm-kick">WHAT HAPPENS</div>
        <p>{p.what}</p>
      </section>
      <section className="kcm-sec">
        <div className="kcm-kick">DELIVERABLES</div>
        <ul className="kcm-list">
          {p.del.map((d, di) => (
            <li key={di}>
              <b>{d[0]}</b>
              <span>{d[1]}</span>
            </li>
          ))}
        </ul>
      </section>
      <section className="kcm-sec">
        <div className="kcm-kick">YOUR ROLE</div>
        <p>{p.role}</p>
      </section>
      <section className="kcm-sec">
        <div className="kcm-kick">KEY DECISIONS</div>
        <ul className="kcm-plain">
          {p.dec.map((d, di) => (
            <li key={di}>{d}</li>
          ))}
        </ul>
      </section>
      <section className="kcm-sec">
        <div className="kcm-kick">ARCHITECT’S NOTE</div>
        <blockquote className="kcm-quote">{p.note}</blockquote>
      </section>
      <section className="kcm-sec">
        <div className="kcm-kick">AND THEN</div>
        <p className="kcm-next">{p.next}</p>
      </section>
    </>
  );
}

function ArticleContent({
  index,
  onSwap,
}: {
  index: number;
  onSwap: (i: number) => void;
}) {
  const a = ARTICLES[index];
  const shareEmail = () => {
    const subject = encodeURIComponent(a.title);
    const body = encodeURIComponent(
      `${a.title} · ${a.cat} · ${a.author}\n${window.location.href}`,
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };
  const shareLink = () => {
    navigator.clipboard?.writeText(window.location.href).catch(() => {
      /* clipboard unavailable — same no-op as the original share buttons */
    });
  };
  return (
    <>
      <section className="kcm-sec kcm-hero">
        <img src={kcImg(a.img + "-art", 1400, 800)} alt={a.title} />
      </section>
      <section className="kcm-sec">
        <div className="kcm-kick">CATEGORY</div>
        <p className="kcm-next" style={{ color: "var(--oak)" }}>
          {a.cat}
        </p>
        <div className="kcm-meta">
          <span>{a.author}</span>
          <span>{a.date}</span>
          <span>{a.time} READ</span>
        </div>
      </section>
      <section className="kcm-sec">
        <div className="kcm-kick">THE ARGUMENT</div>
        <p>{a.paras[0]}</p>
        <p>{a.paras[1]}</p>
      </section>
      <section className="kcm-sec">
        <div className="kcm-kick">PULL QUOTE</div>
        <blockquote className="kcm-quote">{a.pull}</blockquote>
      </section>
      {a.paras[2] ? (
        <section className="kcm-sec">
          <div className="kcm-kick">THE CLOSE</div>
          <p>{a.paras[2]}</p>
        </section>
      ) : null}
      <section className="kcm-sec">
        <div className="kcm-kick">RELATED THINKING</div>
        <div className="kcm-rel">
          {a.rel.map((r) => (
            <button key={r} type="button" onClick={() => onSwap(r)}>
              <span className="kr-cat">RELATED · {ARTICLES[r].cat}</span>
              <span className="kr-t">{ARTICLES[r].title}</span>
            </button>
          ))}
        </div>
      </section>
      <section className="kcm-sec">
        <div className="kcm-kick">SHARE</div>
        <div className="kcm-share">
          <button type="button" onClick={shareEmail}>EMAIL</button>
          <button type="button" onClick={shareLink}>LINK</button>
          <button type="button" onClick={() => window.print()}>PRINT</button>
        </div>
      </section>
    </>
  );
}

function MemberContent({ index }: { index: number }) {
  const m = MEMBERS[index];
  return (
    <>
      <section className="kcm-sec kcm-member-hero">
        <img
          className="kcm-portrait"
          src={kcImg(m.img + "-prof", 900, 1080)}
          alt={`${m.name}, portrait`}
        />
      </section>
      <section className="kcm-sec">
        <div className="kcm-kick">BIOGRAPHY</div>
        <p>{m.bio[0]}</p>
        {m.bio[1] ? <p>{m.bio[1]}</p> : null}
      </section>
      <section className="kcm-sec">
        <div className="kcm-kick">CREDENTIALS</div>
        <p className="kcm-next" style={{ color: "var(--oak)", fontSize: "9.5px" }}>
          {m.cred}
        </p>
      </section>
      <section className="kcm-sec">
        <div className="kcm-kick">SIGNATURE PROJECTS</div>
        {m.proj.map((p, pi) => (
          <div className="kcm-proj" key={pi}>
            <img src={kcImg(p[1], 300, 220)} alt={p[0]} />
            <div>
              <b>{p[0]}</b>
              <span>SIGNATURE PROJECT</span>
            </div>
          </div>
        ))}
      </section>
      <section className="kcm-sec">
        <div className="kcm-kick">SKETCHBOOK NOTE</div>
        <blockquote className="kcm-quote">{m.sketch}</blockquote>
      </section>
      <section className="kcm-sec">
        <div className="kcm-kick">OFF THE DRAFTING TABLE</div>
        <p className="kcm-personal">{m.personal}</p>
      </section>
      <section className="kcm-sec">
        <div className="kcm-kick">ELSEWHERE</div>
        <div className="kcm-share">
          <button type="button">LINKEDIN ↗</button>
          <button type="button">INSTAGRAM ↗</button>
          <button type="button">EMAIL ↗</button>
        </div>
      </section>
    </>
  );
}

/* ---------- the modal ---------- */

export default function KcmModal({ payload, onClose }: KcmModalProps) {
  const { state, reduced } = useKc();

  /* article swap (swapArticle) — bound to the payload object it belongs to */
  const [swap, setSwap] = useState<{ src: KcmPayload; idx: number } | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const ovRef = useRef<HTMLDivElement>(null);
  const flareRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const openRef = useRef(false);
  const triggerRef = useRef<HTMLElement | null>(null);
  const payloadRef = useRef<KcmPayload | null>(null);
  const modeRef = useRef<"done" | "open" | "swap">("done");
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const keyBoundRef = useRef(false);
  const closingRef = useRef(false);
  const requestCloseRef = useRef<(e?: unknown) => void>(() => {});

  /* derived content — pure render-time computation from payload + swap */
  let view: KcmView | null = null;
  if (payload) {
    if (swap && swap.src === payload && payload.type === "article") {
      view = viewFromPayload({ type: "article", index: swap.idx }, true);
    } else {
      view = viewFromPayload(payload, false);
    }
  }
  const viewKey = view ? `${view.type}-${view.index}` : "";

  /* ----- keyboard: ESC / focus trap (port of onKey + bind) ----- */

  const focusables = (): HTMLElement[] => {
    const root = rootRef.current;
    if (!root) return [];
    const sel = 'button, a[href], input, textarea, select, [tabindex]:not([tabindex="-1"])';
    return Array.from(root.querySelectorAll<HTMLElement>(sel)).filter(
      (el) => el.offsetParent !== null,
    );
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      requestCloseRef.current();
      return;
    }
    if (e.key === "/") {
      e.stopPropagation();
      e.preventDefault();
      return;
    }
    if (e.key === "Tab") {
      const f = focusables();
      if (!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  const keyProxyRef = useRef<(e: KeyboardEvent) => void>(onKey);

  const bindKeys = () => {
    if (!keyBoundRef.current) {
      keyBoundRef.current = true;
      document.addEventListener("keydown", keyProxyRef.current, true);
    }
  };
  const unbindKeys = () => {
    if (keyBoundRef.current) {
      keyBoundRef.current = false;
      document.removeEventListener("keydown", keyProxyRef.current, true);
    }
  };

  /* ----- teardown (closeSheet onComplete cleanup, imperative) ----- */

  const teardown = useCallback(() => {
    tlRef.current?.kill();
    tlRef.current = null;
    closingRef.current = false;
    unbindKeys();
    rootRef.current?.classList.remove("on");
    if (ovRef.current && sheetRef.current && flareRef.current)
      gsap.set([ovRef.current, sheetRef.current, flareRef.current], { clearProps: "all" });
    if (scrollRef.current) {
      const secs = scrollRef.current.querySelectorAll(".kcm-sec");
      if (secs.length) gsap.set(secs, { clearProps: "all" });
    }
    if (triggerRef.current)
      gsap.set(triggerRef.current, { clearProps: "opacity,scale" });
    openRef.current = false;
    setModalOpen(state, false);
    document.documentElement.classList.remove("modal-locked");
  }, [state]);

  const finishClose = useCallback(() => {
    const tr = triggerRef.current;
    teardown();
    if (tr && typeof tr.focus === "function") tr.focus();
    onClose(); // page flips payload → null → content unmounts
  }, [teardown, onClose]);

  const requestClose = useCallback(() => {
    if (!openRef.current) return;
    unbindKeys();
    closingRef.current = true; // new openSheet calls are ignored until settled
    if (reduced) {
      teardown();
      const tr = triggerRef.current;
      if (tr && typeof tr.focus === "function") tr.focus();
      onClose();
      return;
    }
    const secs = scrollRef.current
      ? Array.from(scrollRef.current.querySelectorAll(".kcm-sec"))
      : [];
    const tl = gsap.timeline({ onComplete: finishClose });
    tlRef.current = tl;
    tl.to(secs, { y: -16, opacity: 0, stagger: 0.03, duration: 0.26, ease: "power2.in" }, 0)
      .to(sheetRef.current, { opacity: 0, scale: 0.97, y: 12, duration: 0.3, ease: "power2.in" }, 0.12)
      .to(ovRef.current, { opacity: 0, duration: 0.35, ease: "power1.in" }, 0.2)
      .add(() => {
        const tr = triggerRef.current;
        if (tr) gsap.set(tr, { clearProps: "opacity,scale" });
      }, 0.4);
  }, [reduced, teardown, finishClose, onClose]);

  /* keep the latest handlers on the refs (never written during render) */
  useEffect(() => {
    keyProxyRef.current = onKey;
    requestCloseRef.current = requestClose;
  });

  /* ----- payload transitions: open / swap / external drop ----- */

  useEffect(() => {
    if (payload && payload !== payloadRef.current) {
      if (closingRef.current) return; // close in flight — original ignores new opens
      const wasOpen = openRef.current;
      payloadRef.current = payload;
      if (!wasOpen) {
        openRef.current = true;
        triggerRef.current = payload.trigger ?? null;
        setModalOpen(state, true);
        document.documentElement.classList.add("modal-locked");
        modeRef.current = "open";
      } else {
        // new payload while open → swap-style transition
        modeRef.current = "swap";
      }
    }
    if (!payload && payloadRef.current) {
      payloadRef.current = null;
      teardown(); // external force-close → instant
    }
  }, [payload, state, teardown]);

  /* ----- open / swap animations once the content is in the DOM ----- */

  useEffect(() => {
    if (!view) return;
    const mode = modeRef.current;
    modeRef.current = "done";
    const root = rootRef.current;
    const ov = ovRef.current;
    const flare = flareRef.current;
    const sh = sheetRef.current;
    const sc = scrollRef.current;
    if (!root || !ov || !flare || !sh || !sc) return;
    sc.scrollTop = 0;
    const secs = Array.from(sc.querySelectorAll(".kcm-sec"));

    if (mode === "open") {
      root.classList.add("on");
      if (reduced) {
        if (triggerRef.current) gsap.set(triggerRef.current, { opacity: 0 });
        gsap.set([ov, sh], { opacity: 1 });
        closeRef.current?.focus();
        bindKeys();
        return;
      }
      const tr = triggerRef.current;
      tlRef.current?.kill();
      const tl = gsap.timeline({
        onComplete: () => {
          closeRef.current?.focus();
          bindKeys();
        },
      });
      tlRef.current = tl;
      tl.fromTo(ov, { opacity: 0 }, { opacity: 0.85, duration: 0.3, ease: "power1.out" }, 0);
      if (tr) tl.to(tr, { scale: 1.05, opacity: 0, duration: 0.3, ease: "power2.inOut" }, 0);
      tl.fromTo(flare, { opacity: 0, xPercent: -120 }, { opacity: 1, xPercent: -40, duration: 0.26, ease: "power2.out" }, 0.1)
        .to(flare, { xPercent: 120, opacity: 0, duration: 0.3, ease: "power2.in" }, 0.3)
        .fromTo(sh, { opacity: 0, scale: 0.94, y: 26 }, { opacity: 1, scale: 1, y: 0, duration: 0.55, ease: "power3.out" }, 0.16)
        .fromTo(
          secs,
          { x: (i: number) => (i % 2 ? 42 : -42), opacity: 0 },
          { x: 0, opacity: 1, stagger: 0.05, duration: 0.5, ease: "power3.out" },
          0.28,
        );
    } else if (mode === "swap") {
      if (!reduced) {
        gsap.fromTo(
          secs,
          { x: (i: number) => (i % 2 ? 40 : -40), opacity: 0 },
          { x: 0, opacity: 1, stagger: 0.05, duration: 0.5, ease: "power3.out" },
        );
      }
    }
  }, [viewKey, reduced]);

  /* ----- related-article swap (swapArticle) ----- */

  const handleSwap = (i: number) => {
    if (!payload) return;
    const a = ARTICLES[i];
    if (!a) return;
    modeRef.current = "swap";
    setSwap({ src: payload, idx: i });
  };

  /* ----- unmount safety ----- */

  useEffect(
    () => () => {
      if (openRef.current) teardown();
    },
    [teardown],
  );

  return (
    <div id="kc-modal" ref={rootRef} role="dialog" aria-modal="true">
      <div id="kcm-overlay" ref={ovRef} onClick={requestClose} />
      <div id="kcm-flare" ref={flareRef} aria-hidden="true" />
      <div id="kcm-sheet" ref={sheetRef}>
        <span className="cm-reg tl" aria-hidden="true" />
        <span className="cm-reg tr" aria-hidden="true" />
        <span className="cm-reg bl" aria-hidden="true" />
        <span className="cm-reg br" aria-hidden="true" />
        <div className="kcm-topbar">
          <div>
            <h2 id="kcm-title">{view ? view.title : ""}</h2>
            <div id="kcm-sub">{view ? view.sub : ""}</div>
          </div>
          <div className="kcm-topbar-right">
            <span id="kcm-no">{view ? view.no : ""}</span>
            <button
              className="x-close"
              id="kcm-close"
              ref={closeRef}
              aria-label="Close"
              onClick={requestClose}
            >
              <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M1 1 L11 11 M11 1 L1 11" />
                <path d="M1 1 L1 3 M1 1 L3 1 M11 11 L11 9 M11 11 L9 11" opacity=".6" />
              </svg>
            </button>
          </div>
        </div>
        <div id="kcm-scroll" ref={scrollRef}>
          {view ? (
            <div key={viewKey}>
              {view.type === "phase" && <PhaseContent index={view.index} />}
              {view.type === "article" && (
                <ArticleContent index={view.index} onSwap={handleSwap} />
              )}
              {view.type === "member" && <MemberContent index={view.index} />}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
