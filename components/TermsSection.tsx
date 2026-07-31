'use client';

import React from 'react';
import { TermSection } from '@/lib/types';

interface TermsSectionProps {
  terms: TermSection[];
}

function renderTextWithLinks(text: string) {
  const parts = text.split(/(https?:\/\/[^\s]+)/g);
  return parts.map((part, index) => {
    if (/^https?:\/\//.test(part)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          style={{ 
            color: '#0000EE', 
            textDecoration: 'underline', 
            cursor: 'pointer',
            fontFamily: '"Times New Roman", Times, serif',
            fontSize: '13.3333px'
          }}
        >
          {part}
        </a>
      );
    }
    return part;
  });
}

export default function TermsSection({ terms }: TermsSectionProps) {
  const sortedTerms = [...terms].sort((a, b) => a.order - b.order);

  return (
    <section 
      id="ctl00_ctl00_ContentPlaceHolder1_ContentPlaceHolder2_PanelPaymentMode"
      className="w-full my-2 px-1 max-w-[880px]"
      style={{ 
        fontFamily: '"Times New Roman", Times, serif',
        fontSize: '16px',
        color: '#000000'
      }}
    >
      {/* Terms Heading - Green #008000, 15.6px, Bold, Center, Margin 15.6px 0px */}
      <h3 
        className="text-center"
        style={{ 
          color: '#008000', 
          fontSize: '15.6px', 
          fontFamily: '"Times New Roman", Times, serif',
          fontWeight: 'bold',
          margin: '15.6px 0px' 
        }}
      >
        Terms & Condition for Non-Tax Receipt Portal (NTRP) Users
      </h3>

      {/* Scrollable Terms Box with Scroll Wheel */}
      <div 
        className="w-full bg-white border border-gray-300 p-3 overflow-y-scroll rounded-sm shadow-inner"
        style={{ 
          height: '350px',
          maxHeight: '350px',
          fontFamily: '"Times New Roman", Times, serif',
          color: '#000000',
          fontSize: '13.3333px',
          lineHeight: '1.4'
        }}
      >
        <div className="space-y-1">
          {sortedTerms.map((term) => (
            <div key={term.id || term.order}>
              <strong className="block text-black font-bold" style={{ fontSize: '13.3333px', fontFamily: '"Times New Roman", Times, serif', color: '#000000' }}>
                {term.title}
              </strong>
              <p className="text-black font-normal text-justify whitespace-pre-line" style={{ fontSize: '13.3333px', fontFamily: '"Times New Roman", Times, serif', padding: '7px 0px', color: '#000000' }}>
                {renderTextWithLinks(term.description)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


