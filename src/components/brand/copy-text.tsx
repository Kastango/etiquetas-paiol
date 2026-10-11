"use client";

import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCopy } from "@/lib/clipboard";

export function CopyText({ text, label }: { text: string; label: string }) {
  const { copied, copy } = useCopy();
  return (
    <Button onClick={() => copy(text)}>
      {copied ? <Check /> : <Copy />} {copied ? "Copiado" : label}
    </Button>
  );
}
