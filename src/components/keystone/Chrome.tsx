"use client";

/**
 * Chrome — fixed overlay chrome from the original body:
 * skip link, film grain, letterbox bars, blueprint cursor, progress rail.
 */

export default function Chrome() {
  return (
    <>
      <a className="skip-link" href="#sec-about">
        Skip to content
      </a>
      <div id="grain" aria-hidden="true" />
      <div className="lb lb-top" aria-hidden="true" />
      <div className="lb lb-bot" aria-hidden="true" />
      <div id="cursor" aria-hidden="true">
        <span className="c-v" />
        <span className="c-h" />
        <span className="c-dot" />
        <span className="c-brk tl" />
        <span className="c-brk tr" />
        <span className="c-brk bl" />
        <span className="c-brk br" />
        <span id="c-label" />
      </div>
      <div id="progress" aria-hidden="true">
        <div id="prog-track">
          <div id="prog-fill" />
        </div>
        <div id="prog-label">00 · AWAKENING</div>
      </div>
    </>
  );
}
