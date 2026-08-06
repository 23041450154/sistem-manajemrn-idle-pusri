"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccordionContextType {
  value?: string;
  onValueChange: (val: string) => void;
}

const AccordionContext = React.createContext<AccordionContextType>({
  onValueChange: () => {},
});

export interface AccordionProps {
  type?: "single";
  collapsible?: boolean;
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function Accordion({
  defaultValue,
  value: valueProp,
  onValueChange,
  collapsible = true,
  children,
  className,
}: AccordionProps) {
  const [internalValue, setInternalValue] = React.useState<string | undefined>(defaultValue);

  const activeValue = valueProp !== undefined ? valueProp : internalValue;

  const handleValueChange = React.useCallback(
    (val: string) => {
      let newValue: string | undefined;
      if (activeValue === val) {
        if (collapsible) {
          newValue = "";
        } else {
          newValue = val;
        }
      } else {
        newValue = val;
      }

      if (valueProp === undefined) {
        setInternalValue(newValue);
      }
      onValueChange?.(newValue || "");
    },
    [activeValue, collapsible, onValueChange, valueProp]
  );

  return (
    <AccordionContext.Provider value={{ value: activeValue, onValueChange: handleValueChange }}>
      <div className={cn("space-y-4", className)}>{children}</div>
    </AccordionContext.Provider>
  );
}

const ItemContext = React.createContext<{ value: string; isOpen: boolean }>({ value: "", isOpen: false });

export function AccordionItem({
  value,
  className,
  children,
}: {
  value: string;
  className?: string;
  children: React.ReactNode;
}) {
  const context = React.useContext(AccordionContext);
  const isOpen = context.value === value;

  return (
    <ItemContext.Provider value={{ value, isOpen }}>
      <div className={cn("border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden transition-all duration-200", className)}>
        {children}
      </div>
    </ItemContext.Provider>
  );
}

export function AccordionTrigger({
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { onValueChange } = React.useContext(AccordionContext);
  const { value, isOpen } = React.useContext(ItemContext);

  return (
    <button
      type="button"
      onClick={() => onValueChange(value)}
      className={cn(
        "flex w-full items-center justify-between px-6 py-4.5 text-sm font-bold transition-all hover:bg-slate-50/80 cursor-pointer",
        isOpen ? "text-[#0A356A] bg-slate-50/60 border-b border-slate-100" : "text-slate-800",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown
        className={cn("h-4 w-4 shrink-0 text-slate-400 transition-transform duration-300 ease-in-out", isOpen && "rotate-180 text-[#0A356A]")}
      />
    </button>
  );
}

export function AccordionContent({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const { isOpen } = React.useContext(ItemContext);

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "p-6 animate-in fade-in-50 slide-in-from-top-2 duration-200 bg-white",
        className
      )}
    >
      {children}
    </div>
  );
}
