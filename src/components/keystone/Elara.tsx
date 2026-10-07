"use client";

/**
 * Elara — studio assistant. React port of the ELARA block of the original
 * script-17: launch button toggling the panel, delayed typewriter greeting
 * (once per session, full motion only), chips with canned replies + section
 * jumps, and the form's keyword-matching answers with typing indicator.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useKc } from "./KcProvider";

gsap.registerPlugin(ScrollTrigger);

const GREET_TEXT =
  "ELARA here. I can help you find a project or begin a conversation.";
const WELCOME =
  "ELARA here. I keep the studio’s index of projects, process, materials, people, and instruments. Where shall we begin?";

interface Chip {
  act: string;
  label: string;
  reply: string;
  action: string;
}

const CHIPS: Chip[] = [
  {
    act: "project",
    label: "Find a project",
    reply: "Six homes, each a small manifesto. Taking you to the work.",
    action: "#sec-cases",
  },
  {
    act: "process",
    label: "Our process",
    reply: "Five phases with no shortcuts, from Discovery to Delivery. Walking you there now.",
    action: "#sec-process",
  },
  {
    act: "budget",
    label: "Budget questions",
    reply:
      "Custom homes in our region typically begin around $650 to $900 per square foot, land aside. For a live estimate, the Budget Compass in section seven will model it. Taking you there.",
    action: "#sec-tools",
  },
  {
    act: "human",
    label: "Speak to someone",
    reply:
      "Of course. Marcus or Elena personally replies within two business days. Opening the conversation.",
    action: "#sec-contact",
  },
];

interface Answer {
  text: string;
  action?: string;
}

/** Keyword matching — verbatim port of the original answer(). */
function answer(q: string): Answer {
  const s = q.toLowerCase();
  if (/(instrument|calculator|compass|tool|timeline|sun path|palette curator)/.test(s))
    return {
      text: "The Instruments in section seven hold the Budget Compass, Palette Curator, Sun Path, and Chronicle. Taking you there.",
      action: "#sec-tools",
    };
  if (/(budget|cost|price|per square)/.test(s))
    return {
      text: "Custom homes in our region typically begin around $650 to $900 per square foot, land aside. The Budget Compass in section seven models it live. Shall I take you?",
    };
  if (/(process|method|phase|schedule)/.test(s))
    return {
      text: "The five phases, Discovery through Delivery, typically run fourteen to twenty-six months end to end. Tap “Our process” below and I’ll walk you there.",
    };
  if (/(project|portfolio|home|house|work|case)/.test(s))
    return {
      text: "The record set holds six featured homes, Meridian House through Solstice Yard. Tap “Find a project” and I’ll take you.",
    };
  if (/(team|people|who|architect|marcus|elena)/.test(s))
    return {
      text: "We are nine. Architects, an engineer, a master carpenter, even a materials researcher. The constellation is section eight.",
    };
  if (/(material|oak|stone|concrete|travertine|bronze|linen)/.test(s))
    return {
      text: "Concrete, oak, bronze, travertine, and linen are the five materials we trust to age beautifully. Their stories are surveyed on the studio photograph in section one.",
    };
  if (/(^hello|^hi\b|^hey|hola|bonjour)/.test(s))
    return {
      text: "Hello. I’m the studio’s drafting assistant. Try “budget” or “process”, or tap a chip below.",
    };
  return {
    text: "I’m a drafting assistant and not yet a mind reader. Try “budget” or “instruments”, or tap a chip below.",
  };
}

interface ElMsg {
  who: "user" | "elara";
  text: string;
}

export default function Elara() {
  const { goTo, reduced } = useKc();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<ElMsg[]>([]);
  const [typing, setTyping] = useState(false);
  const openRef = useRef(false);

  const launchRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const greetRef = useRef<HTMLDivElement>(null);
  const typedRef = useRef<HTMLSpanElement>(null);
  const msgsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timersRef = useRef<number[]>([]);

  /* keep the transcript pinned to the bottom (addMsg scrollTop behavior) */
  useEffect(() => {
    const m = msgsRef.current;
    if (m) m.scrollTop = m.scrollHeight;
  }, [msgs, typing]);

  /* ----- open / close panel (port of openPanel / closePanel) ----- */

  const openPanel = useCallback(() => {
    if (openRef.current) return;
    openRef.current = true;
    setOpen(true);
    document.body.classList.add("elara-open");
    const panel = panelRef.current;
    if (panel) {
      gsap.set(panel, { visibility: "visible" });
      gsap.fromTo(
        panel,
        { opacity: 0, scale: 0.86, y: 14 },
        { opacity: 1, scale: 1, y: 0, duration: 0.55, ease: "power3.out" },
      );
    }
    setMsgs((prev) => (prev.length ? prev : [{ who: "elara", text: WELCOME }]));
    const t = window.setTimeout(() => inputRef.current?.focus(), 350);
    timersRef.current.push(t);
  }, []);

  const closePanel = useCallback(() => {
    if (!openRef.current) return;
    openRef.current = false;
    setOpen(false);
    document.body.classList.remove("elara-open");
    const panel = panelRef.current;
    if (panel) {
      gsap.to(panel, {
        opacity: 0,
        scale: 0.9,
        y: 10,
        duration: 0.35,
        ease: "power2.in",
        onComplete: () => gsap.set(panel, { visibility: "hidden" }),
      });
    }
    inputRef.current?.blur();
  }, []);

  const togglePanel = useCallback(() => {
    if (openRef.current) closePanel();
    else openPanel();
  }, [openPanel, closePanel]);

  /* ----- bot replies (port of botReply's typing indicator) ----- */

  const botReply = useCallback(
    (text: string, action?: string) => {
      setTyping(true);
      const t = window.setTimeout(
        () => {
          setTyping(false);
          setMsgs((prev) => [...prev, { who: "elara", text }]);
          if (action) goTo(action);
        },
        700 + Math.random() * 400,
      );
      timersRef.current.push(t);
    },
    [goTo],
  );

  const onChip = (chip: Chip) => {
    setMsgs((prev) => [...prev, { who: "user", text: chip.label }]);
    botReply(chip.reply, chip.action);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const input = inputRef.current;
    if (!input) return;
    const q = input.value.trim();
    if (!q) return;
    input.value = "";
    setMsgs((prev) => [...prev, { who: "user", text: q }]);
    const a = answer(q);
    botReply(a.text, a.action);
  };

  /* ----- global ESC closes the panel (original global handler piece) ----- */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePanel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closePanel]);

  /* ----- delayed typed greeting (once per session, full motion only) ----- */

  useEffect(() => {
    let greeted = false;
    try {
      greeted = sessionStorage.getItem("kc-elara-greeted") === "1";
    } catch {
      /* private mode */
    }
    const markGreeted = () => {
      try {
        sessionStorage.setItem("kc-elara-greeted", "1");
      } catch {
        /* private mode */
      }
    };
    let iv: number | undefined;
    let t1: number | undefined;
    let t2: number | undefined;
    if (!greeted && !reduced) {
      t1 = window.setTimeout(() => {
        if (openRef.current || document.body.classList.contains("nav-open")) {
          markGreeted();
          return;
        }
        const greet = greetRef.current;
        const typed = typedRef.current;
        if (!greet || !typed) return;
        gsap.set(greet, { visibility: "visible" });
        gsap.fromTo(
          greet,
          { opacity: 0, y: 10, scale: 0.95 },
          { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: "power3.out" },
        );
        let i = 0;
        iv = window.setInterval(() => {
          typed.textContent = GREET_TEXT.slice(0, ++i);
          if (i >= GREET_TEXT.length) {
            window.clearInterval(iv);
            t2 = window.setTimeout(() => {
              gsap.to(greet, {
                opacity: 0,
                y: 8,
                scale: 0.96,
                duration: 0.5,
                ease: "power2.in",
                onComplete: () => gsap.set(greet, { visibility: "hidden" }),
              });
              markGreeted();
            }, 2000);
          }
        }, 24);
      }, 2500);
    }
    return () => {
      if (t1) window.clearTimeout(t1);
      if (t2) window.clearTimeout(t2);
      if (iv) window.clearInterval(iv);
    };
  }, [reduced]);

  /* clear pending bot replies on unmount */
  useEffect(
    () => () => {
      timersRef.current.forEach((t) => window.clearTimeout(t));
      document.body.classList.remove("elara-open");
    },
    [],
  );

  return (
    <div id="elara">
      <button
        id="elara-launch"
        ref={launchRef}
        aria-label="Open ELARA, the Keystone assistant"
        aria-expanded={open}
        data-cursor="ASK"
        onClick={togglePanel}
      >
        <span className="el-ring" aria-hidden="true"></span>
        <span className="el-mono" aria-hidden="true">E</span>
      </button>
      <div className="el-tip" aria-hidden="true">ELARA · YOUR ASSISTANT</div>
      <div id="elara-greet" ref={greetRef} role="status" aria-live="polite">
        <div className="eg-text">
          <span id="eg-typed" ref={typedRef}></span>
          <span className="eg-caret" aria-hidden="true"></span>
        </div>
      </div>
      <div id="elara-panel" ref={panelRef} role="dialog" aria-label="ELARA, Keystone assistant">
        <div className="el-head">
          <div>
            <div className="el-title">ELARA</div>
            <div className="el-sub">KEYSTONE ASSISTANT</div>
          </div>
          <button className="x-close" id="elara-close" aria-label="Close assistant" onClick={closePanel}>
            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2">
              <path d="M1 1 L11 11 M11 1 L1 11" />
              <path d="M1 1 L1 3 M1 1 L3 1 M11 11 L11 9 M11 11 L9 11" opacity=".6" />
            </svg>
          </button>
        </div>
        <div className="el-msgs" id="el-msgs" ref={msgsRef}>
          {msgs.map((m, i) => (
            <div key={i} className={"el-msg" + (m.who === "user" ? " user" : "")}>
              <span className="who">{m.who === "user" ? "YOU" : "ELARA"}</span>
              {m.text}
            </div>
          ))}
          {typing ? (
            <div className="el-typing" aria-label="ELARA is typing">
              <i></i>
              <i></i>
              <i></i>
            </div>
          ) : null}
        </div>
        <div className="el-chips">
          {CHIPS.map((chip) => (
            <button
              key={chip.act}
              className="el-chip"
              data-act={chip.act}
              data-cursor="ASK"
              type="button"
              onClick={() => onChip(chip)}
            >
              {chip.label}
            </button>
          ))}
        </div>
        <form id="elara-form" onSubmit={onSubmit}>
          <input id="elara-input" ref={inputRef} type="text" placeholder="Ask about anything…" aria-label="Ask ELARA" />
          <button type="submit" id="elara-send" aria-label="Send">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3">
              <path d="M1 7 H12 M8 2.5 L12.5 7 L8 11.5" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
