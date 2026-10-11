import { useState } from "react";
import { toast } from "sonner";

/** copy(text) puts text on the clipboard; copied stays true for a moment after. */
export function useCopy(failure = "Não foi possível copiar. Selecione o texto e copie manualmente.") {
  const [copied, setCopied] = useState(false);
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error(failure);
    }
  };
  return { copied, copy };
}
