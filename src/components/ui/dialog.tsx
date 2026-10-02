"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogTitle = DialogPrimitive.Title;
export const DialogDescription = DialogPrimitive.Description;

export function DialogContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
      {/* Centrato con flex sul contenitore fisso: nessun translate negativo,
          e max-h + overflow lo tengono dentro lo schermo anche su laptop bassi. */}
      <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
        <DialogPrimitive.Content
          className={cn(
            "pointer-events-auto relative max-h-full w-full max-w-4xl overflow-y-auto rounded-2xl border border-white/10 bg-zinc-950 p-4 shadow-2xl shadow-black/60 sm:p-6",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
            className
          )}
          {...props}
        >
          {children}
          <DialogPrimitive.Close
            className="absolute top-3 right-3 flex size-8 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-50/10 hover:text-zinc-100 focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:outline-none"
            aria-label="Chiudi"
          >
            <X className="size-4" />
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </div>
    </DialogPrimitive.Portal>
  );
}
