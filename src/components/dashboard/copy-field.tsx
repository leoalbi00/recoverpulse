"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";

export function CopyField({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        readOnly
        value={value}
        onFocus={(event) => event.currentTarget.select()}
        className="h-10 flex-1 rounded-lg border border-zinc-200/80 bg-zinc-100 px-3 font-mono text-xs text-zinc-700 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
      />
      <Button
        type="button"
        variant="outline"
        size="default"
        onClick={handleCopy}
        className="shrink-0 border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
      >
        {copied ? (
          <Check className="size-3.5 text-emerald-500" />
        ) : (
          <Copy className="size-3.5" />
        )}
        {copied ? "Copiato" : "Copia"}
      </Button>
    </div>
  );
}
