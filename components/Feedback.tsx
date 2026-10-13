"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";


type ConfirmOptions = { title: string; message?: string; confirmLabel?: string; danger?: boolean };
type Toast = { id: number; text: string; kind: "ok" | "error" };
type FeedbackApi = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  notify: (text: string, kind?: "ok" | "error") => void;
};

const FeedbackContext = createContext<FeedbackApi | null>(null);

export function useFeedback() {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error("useFeedback must be used inside <FeedbackProvider>");
  return ctx;
}

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [dialog, setDialog] = useState<ConfirmOptions | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const okRef = useRef<HTMLButtonElement>(null);
  const nextId = useRef(0);

  const confirm = useCallback((options: ConfirmOptions) => new Promise<boolean>((resolve) => {
    resolveRef.current?.(false); // a second dialog cancels the first
    resolveRef.current = resolve;
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    setDialog(options);
  }), []);

  const close = (result: boolean) => {
    resolveRef.current?.(result);
    resolveRef.current = null;
    setDialog(null);
    returnFocusRef.current?.focus();
  };

  const notify = useCallback((text: string, kind: "ok" | "error" = "ok") => {
    const id = nextId.current++;
    setToasts((t) => [...t, { id, text, kind }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === "error" ? 8000 : 5000);
  }, []);

  // Open dialog: start on the safe button, close on Esc, keep Tab inside, stop the page scrolling behind it.
  useEffect(() => {
    if (!dialog) return;
    cancelRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { close(false); return; }
      if (e.key !== "Tab") return;
      const first = cancelRef.current;
      const last = okRef.current;
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prevOverflow; };
  }, [dialog]);

  return (
    <FeedbackContext.Provider value={{ confirm, notify }}>
      {children}

      {dialog && (
        <div className="fixed inset-0 z-[80] grid place-items-center overscroll-contain bg-black/40 px-4" onClick={() => close(false)}>
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="feedback-title"
            aria-describedby={dialog.message ? "feedback-message" : undefined}
            onClick={(e) => e.stopPropagation()}
            className="card w-full max-w-sm bg-white p-6 dark:bg-[#0a0f1e]"
          >
            <h2 id="feedback-title" className="text-sm font-black uppercase text-blue-900 dark:text-blue-100">{dialog.title}</h2>
            {dialog.message && <p id="feedback-message" className="mt-2 text-sm text-blue-700 dark:text-blue-300">{dialog.message}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button ref={cancelRef} type="button" onClick={() => close(false)} className="rounded-lg border px-4 py-2 text-xs font-bold text-blue-900 dark:text-blue-100">Cancel</button>
              <button ref={okRef} type="button" onClick={() => close(true)} className={`rounded-lg px-4 py-2 text-xs font-bold text-white ${dialog.danger ? "bg-bad" : "bg-blue-900"}`}>
                {dialog.confirmLabel ?? "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="pointer-events-none fixed bottom-4 left-1/2 z-[90] flex w-[min(92vw,26rem)] -translate-x-1/2 flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.kind === "error" ? "alert" : "status"}
            className={`pointer-events-auto flex items-start justify-between gap-3 rounded-xl border bg-white px-4 py-3 text-sm font-bold shadow-lg dark:bg-[#0a0f1e] ${t.kind === "error" ? "border-bad text-bad" : "border-ok text-ok"}`}
          >
            <span>{t.text}</span>
            <button type="button" aria-label="Dismiss" onClick={() => setToasts((all) => all.filter((x) => x.id !== t.id))} className="leading-none">×</button>
          </div>
        ))}
      </div>
    </FeedbackContext.Provider>
  );
}