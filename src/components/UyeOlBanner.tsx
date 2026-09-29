"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const UyeOlModal = dynamic(() => import("./UyeOlModal"), { ssr: false });

export default function UyeOlBanner() {
  const [acik, setAcik] = useState(false);

  return (
    <>
      <div className="bg-[#0f2548] border-b border-[#1a3a6b]">
        <div className="max-w-7xl mx-auto px-4 py-2 flex justify-end">
          <button
            onClick={() => setAcik(true)}
            className="text-sm text-[#e8a020] hover:text-white font-semibold transition-colors"
          >
            Üye Ol
          </button>
        </div>
      </div>

      {acik && <UyeOlModal onClose={() => setAcik(false)} />}
    </>
  );
}
