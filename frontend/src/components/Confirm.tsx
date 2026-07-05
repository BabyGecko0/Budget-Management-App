import { createContext, ReactNode, useCallback, useContext, useRef, useState } from "react";

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<(v: boolean) => void>();

  const confirm = useCallback<ConfirmFn>((opts) => {
    setOptions(opts);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const close = (result: boolean) => {
    setOptions(null);
    resolver.current?.(result);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {options && (
        <div className="modal-backdrop" onClick={() => close(false)}>
          <div
            className="card modal confirm-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="confirm-icon">{options.danger === false ? "❓" : "🗑️"}</div>
            <h3 style={{ textAlign: "center" }}>{options.title ?? "Are you sure?"}</h3>
            <p className="muted" style={{ textAlign: "center", marginTop: 0 }}>
              {options.message}
            </p>
            <div className="confirm-actions">
              <button className="btn secondary" autoFocus onClick={() => close(false)}>
                {options.cancelLabel ?? "Cancel"}
              </button>
              <button
                className={`btn ${options.danger === false ? "" : "danger-solid"}`}
                onClick={() => close(true)}
              >
                {options.confirmLabel ?? "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used inside ConfirmProvider");
  return ctx;
}
