"use client";

import { useState } from "react";

/** Same clipboard strategy as the original builders: HTML + plain text, with legacy fallbacks. */
export function CopyButton({ targetId, label, doneLabel }: { targetId: string; label: string; doneLabel: string }) {
  const [done, setDone] = useState(false);

  async function copy() {
    const wrapper = document.getElementById(targetId);
    if (!wrapper) return;
    const html = wrapper.innerHTML;
    const text = wrapper.innerText || wrapper.textContent || "";

    const flash = () => {
      setDone(true);
      setTimeout(() => setDone(false), 2500);
    };

    if (navigator.clipboard && typeof ClipboardItem !== "undefined") {
      try {
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html": new Blob([html], { type: "text/html" }),
            "text/plain": new Blob([text], { type: "text/plain" }),
          }),
        ]);
        flash();
        return;
      } catch {
        // fall through
      }
    }
    const listener = (event: ClipboardEvent) => {
      event.clipboardData?.setData("text/html", html);
      event.clipboardData?.setData("text/plain", text);
      event.preventDefault();
    };
    document.addEventListener("copy", listener);
    const range = document.createRange();
    range.selectNodeContents(wrapper);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
    document.execCommand("copy");
    sel?.removeAllRanges();
    document.removeEventListener("copy", listener);
    flash();
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex items-center rounded-md bg-[#1E4140] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#2a5856]"
    >
      {done ? doneLabel : label}
    </button>
  );
}
