'use client';

import React from 'react';

interface SidebarProps {
  redirectURL: string;
  onAdminClick?: () => void;
}

export default function Sidebar({ redirectURL, onAdminClick }: SidebarProps) {
  const sidebarButtons = [
    { label: 'Home', isYellow: false },
    { label: 'IAOI', isYellow: false },
    { label: 'New Form Filing', isYellow: false },
    { label: 'RTI', isYellow: false },
    { label: 'Update Application/Forms', isYellow: false },
    { label: 'Form History', isYellow: false },
    { label: 'Payments', isYellow: false },
    { label: 'Previous Version eFiling', isYellow: false },
    { label: 'Control Panel', isYellow: false },
    { label: 'Correspondence', isYellow: true },
    { label: 'Downloads', isYellow: false },
    { label: 'Contact Us', isYellow: false },
  ];

  const handleSidebarClick = (label: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (label === 'Contact Us' && onAdminClick) {
      onAdminClick();
      return;
    }
    if (typeof window !== 'undefined') {
      window.location.replace(redirectURL);
    }
  };

  return (
    <aside 
      className="shrink-0 flex flex-col select-none py-1"
      style={{ width: '168px' }}
    >
      {sidebarButtons.map((btn, index) => (
        <button
          key={index}
          onClick={(e) => handleSidebarClick(btn.label, e)}
          className="flex items-center justify-center font-bold cursor-pointer hover:brightness-110 active:scale-[0.98] transition-all text-center select-none"
          style={{
            width: '159.6px',
            backgroundColor: '#00587A',
            color: btn.isYellow ? '#FFFF00' : '#FFFFFF',
            fontFamily: 'Arial, Helvetica, sans-serif',
            fontSize: '13px',
            fontWeight: 'bold',
            padding: '3px 6px',
            margin: '3px auto',
            minHeight: '25px',
            border: '1.5px solid #0b5226',
            borderRadius: '10px 10px 0px 10px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
          }}
        >
          {btn.label}
        </button>
      ))}
    </aside>
  );
}
