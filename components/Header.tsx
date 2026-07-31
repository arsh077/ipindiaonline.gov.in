'use client';

import React from 'react';
import { PortalSettings } from '@/lib/types';

interface HeaderProps {
  portalSettings: PortalSettings;
  redirectURL: string;
  onAdminClick?: () => void;
  isAdminLoggedIn?: boolean;
}

// Authentic Ashoka Lion Emblem Component
function AshokaEmblemSVG() {
  return (
    <svg viewBox="0 0 160 210" className="h-[84px] w-auto shrink-0 select-none" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g fill="#2B3E4A">
        {/* Central Lion Head */}
        <path d="M72 14 C70 8 75 2 80 2 C85 2 90 8 88 14 C95 12 100 16 100 22 C100 28 94 34 88 36 C94 40 96 48 94 56 C92 62 86 66 80 68 C74 66 68 62 66 56 C64 48 66 40 72 36 C66 34 60 28 60 22 C60 16 65 12 72 14 Z" />
        <ellipse cx="80" cy="44" rx="8" ry="6" fill="#2B3E4A" />
        <path d="M74 44 Q80 41 86 44 Q80 50 74 44 Z" fill="#FFFFFF" />
        <circle cx="80" cy="43" r="2" fill="#2B3E4A" />
        <circle cx="73" cy="28" r="2" fill="#FFFFFF" />
        <circle cx="87" cy="28" r="2" fill="#FFFFFF" />

        {/* Side Lions */}
        <path d="M56 20 C46 16 38 22 38 30 C38 38 44 44 48 48 C42 52 40 60 44 68 C48 74 56 76 62 72 C58 64 58 54 62 46 C56 42 54 34 56 26 Z" />
        <path d="M106 20 C114 16 122 22 122 30 C122 38 116 44 112 48 C118 52 120 60 116 68 C112 74 104 76 98 72 C102 64 102 54 98 46 C104 42 106 34 104 26 Z" />

        {/* Lion Mane Body */}
        <path d="M62 72 C56 82 52 94 52 106 L108 106 C108 94 104 82 98 72 C92 80 68 80 62 72 Z" />
        <path d="M58 83 C64 88 72 90 80 90 C88 90 96 88 102 83" stroke="#FFFFFF" strokeWidth="2" fill="none" />
        <path d="M62 95 C68 99 74 101 80 101 C86 101 92 99 98 95" stroke="#FFFFFF" strokeWidth="2" fill="none" />

        {/* Platform Abacus */}
        <rect x="32" y="106" width="96" height="14" rx="2" fill="#2B3E4A" />
        <circle cx="80" cy="113" r="6" fill="#FFFFFF" />
        <circle cx="80" cy="113" r="4.5" fill="#2B3E4A" />
        <circle cx="80" cy="113" r="1" fill="#FFFFFF" />
        <line x1="80" y1="107" x2="80" y2="119" stroke="#FFFFFF" strokeWidth="0.8" />
        <line x1="74" y1="113" x2="86" y2="113" stroke="#FFFFFF" strokeWidth="0.8" />

        {/* Lotus Bell Base */}
        <path d="M40 120 C40 120 48 138 80 138 C112 138 120 120 120 120 Z" fill="#2B3E4A" />
        <rect x="24" y="142" width="112" height="6" rx="2" fill="#2B3E4A" />

        {/* Satyameva Jayate text */}
        <text x="80" y="168" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#2B3E4A" fontFamily="'Noto Sans Devanagari', 'Mangal', 'Arial Unicode MS', serif" letterSpacing="0.5">
          सत्यमेव जयते
        </text>
      </g>
    </svg>
  );
}

// Intellectual Property India Official Logo Component
function IpIndiaLogoSVG() {
  return (
    <div className="flex items-center gap-2 shrink-0 select-none">
      <svg viewBox="0 0 120 120" className="w-16 h-16" xmlns="http://www.w3.org/2000/svg">
        <circle cx="35" cy="35" r="22" stroke="#00485F" strokeWidth="3" fill="none" />
        <ellipse cx="35" cy="35" rx="12" ry="22" stroke="#00485F" strokeWidth="2" fill="none" />
        <line x1="13" y1="35" x2="57" y2="35" stroke="#00485F" strokeWidth="2" />
        <line x1="18" y1="24" x2="52" y2="24" stroke="#00485F" strokeWidth="1.5" />
        <line x1="18" y1="46" x2="52" y2="46" stroke="#00485F" strokeWidth="1.5" />

        <rect x="65" y="13" width="44" height="44" fill="#00485F" rx="2" />
        <path d="M72 20 C72 20 85 20 85 30 C85 40 72 40 72 40 L72 50" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M92 20 L92 50" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" fill="none" />

        <rect x="13" y="62" width="44" height="44" fill="#00485F" rx="2" />

        <path d="M65 62 L109 62 L109 106 L65 106 Z" fill="none" stroke="#00485F" strokeWidth="3" />
        <path d="M65 84 Q87 62 109 84 Q87 106 65 84 Z" fill="none" stroke="#00485F" strokeWidth="2" />
        <line x1="87" y1="62" x2="87" y2="106" stroke="#00485F" strokeWidth="2" />
      </svg>

      <div className="flex flex-col font-sans" style={{ color: '#00485F' }}>
        <span className="text-[15px] font-extrabold tracking-tight leading-none uppercase">
          INTELLECTUAL
        </span>
        <span className="text-[15px] font-extrabold tracking-tight leading-none uppercase mt-0.5">
          PROPERTY <span className="text-[#003366]">INDIA</span>
        </span>
        <span className="text-[8.5px] font-bold tracking-tighter leading-tight mt-1 uppercase text-gray-700">
          PATENTS | DESIGNS | TRADE MARKS
        </span>
        <span className="text-[8.5px] font-bold tracking-tighter leading-tight uppercase text-gray-700">
          GEOGRAPHICAL INDICATIONS
        </span>
      </div>
    </div>
  );
}

export default function Header({ portalSettings, redirectURL }: HeaderProps) {
  const handleSignOut = () => {
    if (typeof window !== 'undefined') {
      window.location.replace(redirectURL);
    }
  };

  const headerTitle = portalSettings.organizationName && portalSettings.organizationName !== "INTELLECTUAL PROPERTY INDIA"
    ? portalSettings.organizationName
    : "Office of the Controller General of Patents, Designs & Trade Marks";

  return (
    <header className="w-full bg-white relative select-none">
      {/* Top Header Bar - White tab on left, smooth S-curve, dark bar on right */}
      <div className="w-full h-[38px] relative overflow-hidden">
        {/* Full-width dark background */}
        <div className="absolute inset-0 bg-[#333333]" />
        
        {/* White tab section on left - approximately 45% width */}
        <div className="absolute left-0 top-0 bottom-0" style={{ width: 'calc(45% - 40px)' }}>
          <div className="w-full h-full bg-white" />
        </div>
        
        {/* Smooth concave S-curve SVG transition */}
        <svg 
          className="absolute top-0 bottom-0 h-full select-none"
          style={{ left: 'calc(45% - 40px)', width: '80px' }}
          viewBox="0 0 80 38" 
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* White concave curve - matching reference smooth S shape */}
          <path
            d="M0 0 L0 38 L25 38 C 40 38, 50 32, 55 24 C 60 16, 68 4, 80 0 L0 0 Z"
            fill="#FFFFFF"
          />
        </svg>

        {/* Top thin dark border line across entire width */}
        <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-[#1a1a1a] z-10" />

        {/* Right Side: Attorney Welcome Badge & Sign Out Button */}
        <div className="absolute right-0 top-0 bottom-0 flex items-center gap-2 px-3 z-10">
          <div 
            className="text-white text-xs sm:text-[13px] font-bold px-3 py-1 shadow-sm whitespace-nowrap flex items-center justify-center"
            style={{
              backgroundColor: '#00587A',
              color: '#FFFFFF',
              fontFamily: 'Arial, Helvetica, sans-serif',
              border: '1.5px solid #0b5226',
              borderRadius: '10px 10px 0px 10px'
            }}
          >
            Welcome {portalSettings.attorneyName || 'FARHEEN MUSHIR'}[Attorney : {portalSettings.attorneyNumber || '50565'}]
          </div>

          <button
            onClick={handleSignOut}
            className="text-white text-xs sm:text-[13px] font-bold px-3 py-1 cursor-pointer hover:brightness-110 active:scale-[0.98] transition-all whitespace-nowrap"
            style={{
              backgroundColor: '#00587A',
              color: '#FFFFFF',
              fontFamily: 'Arial, Helvetica, sans-serif',
              border: '1.5px solid #0b5226',
              borderRadius: '10px 10px 0px 10px'
            }}
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Main Header Content Area */}
      {portalSettings.headerBanner ? (
        <div className="w-full flex items-center justify-center bg-white px-4" style={{ height: '110px' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={portalSettings.headerBanner} 
            alt="Custom Header Banner" 
            className="max-h-full max-w-full object-contain"
          />
        </div>
      ) : (
        <div 
          className="w-full flex items-center px-4 justify-between bg-white border-b border-gray-200"
          style={{ height: '110px' }}
        >
          {/* Left Side: Authentic Ashoka Lion Emblem + Official Department Title */}
          <div className="flex items-center gap-3">
            {portalSettings.emblemImage === 'none' ? null : (
              portalSettings.emblemImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={portalSettings.emblemImage}
                  alt="State Emblem of India"
                  className="h-[85px] w-auto object-contain shrink-0"
                />
              ) : (
                <AshokaEmblemSVG />
              )
            )}

            <div style={{ fontFamily: 'Arial, sans-serif', color: '#333333' }}>
              <h1 className="text-[14.5px] font-semibold leading-tight text-[#222222]">
                {headerTitle}
              </h1>
              <p className="text-[13px] leading-snug text-gray-700 font-normal">
                Department of Industrial Policy & Promotion,
              </p>
              <p className="text-[13px] leading-snug text-gray-700 font-normal">
                Ministry of Commerce & Industry,
              </p>
              <p className="text-[13px] leading-snug text-gray-700 font-normal">
                Government of India
              </p>
              <p className="text-[14.5px] font-bold text-[#4A86E8] mt-0.5 tracking-wide">
                Online Filing of Trade Marks
              </p>
            </div>
          </div>

          {/* Right Side: IP India Official Logo */}
          <div className="flex items-center shrink-0">
            {portalSettings.logo === 'none' ? null : (
              portalSettings.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={portalSettings.logo}
                  alt="Intellectual Property India Logo"
                  className="h-20 max-w-[280px] object-contain"
                />
              ) : (
                <IpIndiaLogoSVG />
              )
            )}
          </div>
        </div>
      )}

      {/* Bottom Grayscale Gradient Line */}
      <div 
        className="w-full h-[8px]"
        style={{ 
          background: 'linear-gradient(to right, #111111 0%, #333333 20%, #666666 45%, #aaaaaa 70%, #e0e0e0 90%, #ffffff 100%)' 
        }} 
      />
    </header>
  );
}
