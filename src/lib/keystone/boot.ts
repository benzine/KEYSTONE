/**
 * Boot gate — the preloader's handshake with the page.
 *
 * markBooted() is called by the Preloader as its curtain begins to lift.
 * whenBooted(fn) defers a callback until that moment, or runs it at once
 * if the gate has already opened. The Hero uses it so its letter-rise
 * entrance plays into the reveal instead of burning off unseen behind
 * the boot sheet. Callbacks are isolated: a gated callback that throws
 * can never break the boot itself.
 */

type BootFn = () => void;

let booted = false;
const waiting: BootFn[] = [];

export function markBooted(): void {
  if (booted) return;
  booted = true;
  const fns = waiting.splice(0);
  fns.forEach((fn) => {
    try {
      fn();
    } catch {
      /* a gated callback must never break the boot */
    }
  });
}

export function whenBooted(fn: BootFn): () => void {
  if (booted) {
    try {
      fn();
    } catch {
      /* ignore */
    }
    return () => {};
  }
  waiting.push(fn);
  return () => {
    const i = waiting.indexOf(fn);
    if (i > -1) waiting.splice(i, 1);
  };
}
