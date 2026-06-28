import { useCallback, useEffect, useRef, useState } from "react";

const TOAST_MS = 2400;

/** A single auto-dismissing toast message. */
export function useToast(): {
  toast: string;
  showToast: (msg: string) => void;
} {
  const [toast, setToast] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(""), TOAST_MS);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  return { toast, showToast };
}
