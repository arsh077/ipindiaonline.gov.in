'use client';

import React, { useState } from 'react';

interface FooterButtonsProps {
  redirectURL: string;
}

export default function FooterButtons({ redirectURL }: FooterButtonsProps) {
  const [agreed, setAgreed] = useState(false);

  const handleRedirect = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      window.location.replace(redirectURL);
    }
  };

  return (
    <footer className="w-full max-w-[880px] flex flex-col items-center gap-3 my-4 select-none">
      {/* Checkbox */}
      <label className="flex items-center gap-2 cursor-pointer text-[13.33px] font-normal text-black">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="w-4 h-4 rounded text-[#005E88] focus:ring-0 cursor-pointer accent-[#005E88]"
        />
        <span style={{ fontFamily: '"Times New Roman", Times, serif', color: '#000000', fontSize: '13.33px' }}>
          I agree with the above Terms & Conditions
        </span>
      </label>

      {/* Action Buttons: Make Payment and Back */}
      <div className="flex items-center justify-center gap-3 mt-1">
        <button
          onClick={handleRedirect}
          className="font-bold text-[13px] text-white cursor-pointer shadow hover:brightness-110 active:scale-[0.98] transition-all"
          style={{
            backgroundColor: '#00587A',
            color: '#FFFFFF',
            fontFamily: 'Arial, Helvetica, sans-serif',
            padding: '3px 16px',
            minHeight: '26px',
            border: '1.5px solid #0b5226',
            borderRadius: '10px 10px 0px 10px'
          }}
        >
          Make Payment
        </button>

        <button
          onClick={handleRedirect}
          className="font-bold text-[13px] text-white cursor-pointer shadow hover:brightness-110 active:scale-[0.98] transition-all"
          style={{
            backgroundColor: '#00587A',
            color: '#FFFFFF',
            fontFamily: 'Arial, Helvetica, sans-serif',
            padding: '3px 16px',
            minHeight: '26px',
            border: '1.5px solid #0b5226',
            borderRadius: '10px 10px 0px 10px'
          }}
        >
          Back
        </button>
      </div>
    </footer>
  );
}
