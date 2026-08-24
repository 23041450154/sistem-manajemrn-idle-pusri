import React, { useState, useEffect, useRef } from "react";
import { Clock, ChevronUp, ChevronDown } from "lucide-react";

interface AnalogTimePickerProps {
  value: string; // "HH:MM" 24h format
  onChange: (value: string) => void;
  label?: string;
  disabled?: boolean;
}

export default function AnalogTimePicker({
  value,
  onChange,
  label,
  disabled = false,
}: AnalogTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Internal values in 24h format directly
  const [tempHour, setTempHour] = useState(8); // 0-23
  const [tempMinute, setTempMinute] = useState(0); // 0-59
  const [hourRange, setHourRange] = useState<"AM_RANGE" | "PM_RANGE">(
    "AM_RANGE",
  ); // "AM_RANGE" (00-11) vs "PM_RANGE" (12-23)
  const [mode, setMode] = useState<"HOUR" | "MINUTE">("HOUR");

  const popoverRef = useRef<HTMLDivElement>(null);

  // Parse 24h format on open / saat value berubah — adjust during render
  // (pola resmi React pengganti setState-in-effect). Key termasuk isOpen agar
  // pembukaan ulang popover selalu re-sinkron dari value.
  const syncKey = `${isOpen}|${value}`;
  const [prevSyncKey, setPrevSyncKey] = useState<string | null>(null);
  if (syncKey !== prevSyncKey) {
    setPrevSyncKey(syncKey);
    if (value && value.includes(":")) {
      const [h24, m] = value.split(":").map(Number);
      setTempHour(h24);
      setTempMinute(m || 0);
      setHourRange(h24 >= 12 ? "PM_RANGE" : "AM_RANGE");
    }
  }

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSave = () => {
    const formattedHour = tempHour.toString().padStart(2, "0");
    const formattedMinute = tempMinute.toString().padStart(2, "0");
    onChange(`${formattedHour}:${formattedMinute}`);
    setIsOpen(false);
  };

  // Convert current selected hour/minute to hand angle
  const getHandAngle = () => {
    if (mode === "HOUR") {
      // 12 positions on dial. Each is 30 degrees.
      // e.g. 14 % 12 = 2. 2 * 30 = 60 degrees.
      // 12 and 00 are at 0 degrees.
      return (tempHour % 12) * 30;
    } else {
      // 60 minutes = 360 degrees, so 6 deg per minute
      return tempMinute * 6;
    }
  };

  // Handle click on clock face (trigonometry from center)
  const handleClockClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    // Calculate angle in radians where 12 o'clock is 0 / 2pi
    let angleRad = Math.atan2(y, x) + Math.PI / 2;
    if (angleRad < 0) {
      angleRad += 2 * Math.PI;
    }
    const angleDeg = angleRad * (180 / Math.PI);

    if (mode === "HOUR") {
      let dialPosition = Math.round(angleDeg / 30);
      if (dialPosition === 12 || dialPosition === 0) {
        dialPosition = 0; // 12 o'clock position maps to 0 / 12
      }

      // Convert dial position (0-11) to actual 24-hour value based on active range
      let hr = dialPosition;
      if (hourRange === "PM_RANGE") {
        hr = dialPosition + 12;
      }

      setTempHour(hr);
      // Auto switch to minute selection after selecting hour
      setMode("MINUTE");
    } else {
      let min = Math.round(angleDeg / 6);
      if (min === 60) min = 0;
      // Round to nearest 5 minutes for clean select
      min = Math.round(min / 5) * 5;
      if (min === 60) min = 0;
      setTempMinute(min);
    }
  };

  // Increment / decrement helpers for fine-tuning
  const adjustMinute = (amount: number) => {
    setTempMinute((prev) => {
      let next = prev + amount;
      if (next >= 60) next = 0;
      if (next < 0) next = 59;
      return next;
    });
  };

  const adjustHour = (amount: number) => {
    setTempHour((prev) => {
      let next = prev + amount;
      if (next > 23) next = 0;
      if (next < 0) next = 23;
      // Keep range selector in sync
      setHourRange(next >= 12 ? "PM_RANGE" : "AM_RANGE");
      return next;
    });
  };

  // Format value for UI display (Indonesian 24h format: HH:MM WIB)
  const displayValue = () => {
    if (!value) return "--:-- WIB";
    const [h24, m] = value.split(":").map(Number);
    return `${h24.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} WIB`;
  };

  return (
    <div className="relative w-full">
      {label && (
        <label className="block text-[11px] font-semibold text-gray-700 mb-1">
          {label}
        </label>
      )}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(true)}
        className="w-full bg-white border border-gray-300 rounded-md px-3 py-1.5 text-[13px] font-mono text-center flex items-center justify-between outline-none disabled:bg-gray-50 cursor-pointer disabled:cursor-not-allowed hover:border-[#0A356A] transition-colors"
      >
        <span className="flex-1">{displayValue()}</span>
        <Clock className="w-4 h-4 text-gray-400 shrink-0 ml-1.5" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xs">
          <div
            ref={popoverRef}
            className="w-72 bg-white rounded-2xl shadow-xl border border-gray-200 p-4 flex flex-col items-center animate-in zoom-in-95 duration-200"
          >
            {/* Header Display */}
            <div className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center justify-between mb-4">
              <div className="flex items-center gap-1">
                {/* Hour display button */}
                <button
                  type="button"
                  onClick={() => setMode("HOUR")}
                  className={`text-2xl font-bold font-mono px-2 py-0.5 rounded transition-all ${
                    mode === "HOUR"
                      ? "bg-[#0A356A] text-white"
                      : "text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {tempHour.toString().padStart(2, "0")}
                </button>
                <span className="text-xl font-bold text-gray-400">:</span>
                {/* Minute display button */}
                <button
                  type="button"
                  onClick={() => setMode("MINUTE")}
                  className={`text-2xl font-bold font-mono px-2 py-0.5 rounded transition-all ${
                    mode === "MINUTE"
                      ? "bg-[#0A356A] text-white"
                      : "text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {tempMinute.toString().padStart(2, "0")}
                </button>
                <span className="text-xs font-bold text-gray-400 ml-1.5">
                  WIB
                </span>
              </div>

              {/* 24-Hour Range Switcher */}
              <div className="flex border border-gray-300 rounded-md overflow-hidden bg-white shrink-0 shadow-xs">
                <button
                  type="button"
                  onClick={() => {
                    setHourRange("AM_RANGE");
                    if (tempHour >= 12) setTempHour(tempHour - 12);
                  }}
                  className={`px-2 py-1 text-[10px] font-bold transition-all ${
                    hourRange === "AM_RANGE"
                      ? "bg-[#0A356A] text-white"
                      : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  00-11
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setHourRange("PM_RANGE");
                    if (tempHour < 12) setTempHour(tempHour + 12);
                  }}
                  className={`px-2 py-1 text-[10px] font-bold transition-all ${
                    hourRange === "PM_RANGE"
                      ? "bg-[#0A356A] text-white"
                      : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  12-23
                </button>
              </div>
            </div>

            {/* Mode title */}
            <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              {mode === "HOUR"
                ? `Pilih Jam (${hourRange === "AM_RANGE" ? "Pagi 00-11" : "Siang/Malam 12-23"})`
                : "Pilih Menit"}
            </h4>

            {/* Analog Clock Face */}
            <div
              onClick={handleClockClick}
              className="relative w-48 h-48 rounded-full bg-gray-50 border-2 border-gray-200 flex items-center justify-center cursor-pointer select-none transition-shadow hover:shadow-md"
            >
              {/* Central Pivot Dot */}
              <div className="w-2.5 h-2.5 rounded-full bg-[#0A356A] z-20" />

              {/* Clock Hand (Analog Needle) */}
              <div
                className="absolute bg-[#0A356A]/80 z-10 origin-bottom"
                style={{
                  width: "2px",
                  height: "72px",
                  bottom: "96px", // Center y
                  transform: `rotate(${getHandAngle()}deg)`,
                  transformOrigin: "bottom center",
                  transition: "transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              >
                {/* Circle tip on the analog hand */}
                <div className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 rounded-full bg-[#0A356A]" />
              </div>

              {/* Render Numbers */}
              {mode === "HOUR"
                ? Array.from({ length: 12 }).map((_, i) => {
                    // Position calculations
                    // i = 0 maps to 12 o'clock position
                    const dialVal = i;
                    const angle = (dialVal * 30 - 90) * (Math.PI / 180);
                    const R = 72; // radius
                    const x = 96 + R * Math.cos(angle);
                    const y = 96 + R * Math.sin(angle);

                    // Determine the actual 24-hour number to display
                    const actualHour =
                      hourRange === "AM_RANGE" ? dialVal : dialVal + 12;
                    const isSelected = tempHour === actualHour;

                    return (
                      <div
                        key={actualHour}
                        style={{
                          left: `${x - 12}px`,
                          top: `${y - 12}px`,
                        }}
                        className={`absolute w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold z-20 transition-all ${
                          isSelected
                            ? "bg-[#0A356A] text-white scale-110 shadow-sm"
                            : "text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {actualHour.toString().padStart(2, "0")}
                      </div>
                    );
                  })
                : Array.from({ length: 12 }).map((_, i) => {
                    const min = i * 5;
                    const angle = (i * 30 - 90) * (Math.PI / 180);
                    const R = 72; // radius
                    const x = 96 + R * Math.cos(angle);
                    const y = 96 + R * Math.sin(angle);
                    const isSelected = tempMinute === min;

                    return (
                      <div
                        key={min}
                        style={{
                          left: `${x - 12}px`,
                          top: `${y - 12}px`,
                        }}
                        className={`absolute w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold z-20 transition-all ${
                          isSelected
                            ? "bg-[#0A356A] text-white scale-110 shadow-sm"
                            : "text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {min.toString().padStart(2, "0")}
                      </div>
                    );
                  })}
            </div>

            {/* Fine Tuning controls below the clock */}
            <div className="flex gap-4 items-center justify-center mt-4 w-full">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-gray-500 uppercase">
                  Jam:
                </span>
                <button
                  type="button"
                  onClick={() => adjustHour(-1)}
                  className="p-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => adjustHour(1)}
                  className="p-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-gray-500 uppercase">
                  Menit:
                </span>
                <button
                  type="button"
                  onClick={() => adjustMinute(-1)}
                  className="p-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => adjustMinute(1)}
                  className="p-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 w-full mt-4 border-t border-gray-100 pt-3">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 py-1.5 text-[12px] font-semibold text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex-1 py-1.5 text-[12px] font-bold text-white bg-[#0A356A] rounded-md hover:bg-[#062854] shadow-sm transition-colors"
              >
                Pilih
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
