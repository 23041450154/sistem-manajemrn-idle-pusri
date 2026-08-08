"use client";

import { useState } from "react";
import { EquipmentThumb } from "../shared";

export default function Gallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);

  return (
    <section className="border border-[#E6E8EA] bg-white p-5">
      <h2 className="sr-only">Foto equipment</h2>
      <EquipmentThumb
        src={images[active]}
        alt={name}
        className="aspect-[4/3] w-full rounded-[4px] border border-[#E6E8EA]"
      />
      {images.length > 1 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {images.map((src, i) => (
            <li key={src}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Lihat foto ${i + 1}`}
                aria-current={i === active}
                className={`block h-16 w-16 overflow-hidden rounded-[4px] border transition-colors duration-140 focus-visible:ring-2 focus-visible:ring-[#334155] focus-visible:ring-offset-1 focus-visible:outline-none ${
                  i === active ? "border-[#0A356A]" : "border-[#E6E8EA] hover:border-[#334155]"
                }`}
              >
                <EquipmentThumb src={src} alt="" className="h-full w-full" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {images.length === 0 && (
        <p className="mt-3 text-[12px] text-[#64748B]">
          Belum ada foto yang diunggah untuk aset ini.
        </p>
      )}
    </section>
  );
}
