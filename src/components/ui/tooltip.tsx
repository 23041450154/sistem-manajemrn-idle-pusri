"use client";

import React, { useState } from "react";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

export function Tooltip({ content, children }: TooltipProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div
      className="relative inline-flex items-center justify-center"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div className="absolute bottom-full mb-1.5 z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
          <div className="bg-gray-900 text-white text-[11px] font-medium px-2 py-1 rounded shadow-md whitespace-nowrap">
            {content}
          </div>
          <div className="w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-900 mx-auto -mt-[1px]" />
        </div>
      )}
    </div>
  );
}
