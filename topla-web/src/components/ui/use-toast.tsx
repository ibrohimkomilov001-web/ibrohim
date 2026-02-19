"use client";

import * as React from "react";

const TOAST_LIMIT = 5;
const TOAST_REMOVE_DELAY = 5000;

export type ToastVariant = "default" | "destructive" | "success";

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
}

interface ToastState {
  toasts: Toast[];
}

type ToastAction =
  | { type: "ADD_TOAST"; toast: Toast }
  | { type: "REMOVE_TOAST"; toastId: string }
  | { type: "DISMISS_ALL" };

const toastReducer = (state: ToastState, action: ToastAction): ToastState => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };
    case "REMOVE_TOAST":
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
    case "DISMISS_ALL":
      return {
        ...state,
        toasts: [],
      };
    default:
      return state;
  }
};

const listeners: ((state: ToastState) => void)[] = [];
let memoryState: ToastState = { toasts: [] };

function dispatch(action: ToastAction) {
  memoryState = toastReducer(memoryState, action);
  listeners.forEach((listener) => listener(memoryState));
}

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

type ToastOptions = {
  title?: string;
  description?: string;
  variant?: ToastVariant;
};

function toast({ title, description, variant = "default" }: ToastOptions) {
  const id = genId();

  dispatch({
    type: "ADD_TOAST",
    toast: {
      id,
      title,
      description,
      variant,
    },
  });

  // Auto remove after delay
  setTimeout(() => {
    dispatch({ type: "REMOVE_TOAST", toastId: id });
  }, TOAST_REMOVE_DELAY);

  return {
    id,
    dismiss: () => dispatch({ type: "REMOVE_TOAST", toastId: id }),
  };
}

export function useToast() {
  const [state, setState] = React.useState<ToastState>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, []);

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => {
      if (toastId) {
        dispatch({ type: "REMOVE_TOAST", toastId });
      } else {
        dispatch({ type: "DISMISS_ALL" });
      }
    },
  };
}

// Toast UI Component
export function Toaster() {
  const { toasts } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`rounded-lg border p-4 shadow-lg animate-in slide-in-from-right-full transition-all ${
            t.variant === "destructive"
              ? "bg-destructive text-destructive-foreground border-destructive"
              : t.variant === "success"
              ? "bg-green-500 text-white border-green-500"
              : "bg-background text-foreground border-border"
          }`}
        >
          {t.title && <div className="font-semibold">{t.title}</div>}
          {t.description && (
            <div className={`text-sm ${t.variant !== "default" ? "opacity-90" : "text-muted-foreground"}`}>
              {t.description}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
