"use client";

/* MatModal — material detail sheet; behavior wired by task agents. */

export default function MatModal() {
  return (
    <>
<div id="mat-modal" role="dialog" aria-modal="true" aria-label="Material detail">
  <div className="mm-card reg-corners">
    <button className="x-close" id="mat-modal-close" aria-label="Close material detail"><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M1 1 L11 11 M11 1 L1 11" /><path d="M1 1 L1 3 M1 1 L3 1 M11 11 L11 9 M11 11 L9 11" opacity=".6" /></svg></button>
    <div className="mm-swatchbar" id="mm-swatch"></div><h3 id="mm-name"></h3><div className="mm-loc" id="mm-loc"></div><p id="mm-long"></p>
  </div>
</div>
    </>
  );
}
