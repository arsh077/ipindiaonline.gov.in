'use client';

import React from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import PaymentTable from '@/components/PaymentTable';
import TermsSection from '@/components/TermsSection';
import FooterButtons from '@/components/FooterButtons';
import { FullPortalData } from '@/lib/types';

interface PublicPageProps {
  data: FullPortalData['portalSettings'] & {
    payments: FullPortalData['payments'];
    tableColumns?: FullPortalData['tableColumns'];
    terms: FullPortalData['terms'];
    redirectURL: string;
  };
  onAdminClick?: () => void;
  isAdminLoggedIn?: boolean;
}

export default function PublicPage({ data, onAdminClick, isAdminLoggedIn }: PublicPageProps) {
  return (
    <div className="w-full min-h-screen bg-white flex flex-col items-center font-sans text-gray-900">
      {/* 1080px Container - Fixed Centered Container with White Background */}
      <div 
        className="bg-white border border-gray-300 min-h-[900px] flex flex-col"
        style={{ width: '1080px' }}
      >
        {/* Header */}
        <Header 
          portalSettings={data} 
          redirectURL={data.redirectURL} 
          onAdminClick={onAdminClick}
          isAdminLoggedIn={isAdminLoggedIn}
        />

        {/* Two Column Layout: Left Sidebar + Right Content */}
        <div className="w-full flex flex-1">
          {/* LEFT SIDEBAR - Width 175px */}
          <div className="w-[175px] shrink-0 border-r-2 border-[#004F7A] bg-white">
            <Sidebar redirectURL={data.redirectURL} onAdminClick={onAdminClick} />
          </div>

          {/* RIGHT CONTENT */}
          <main className="flex-1 p-3 flex flex-col items-center bg-white overflow-x-auto">
            {/* Payment Table Section with Heading */}
            <PaymentTable payments={data.payments || []} tableColumns={data.tableColumns} />

            {/* Terms & Conditions Section */}
            <TermsSection terms={data.terms || []} />

            {/* Bottom Buttons & Checkbox */}
            <FooterButtons redirectURL={data.redirectURL} />
          </main>
        </div>

        {/* Govt Footer Disclaimer */}
        <div className="w-full bg-[#00485F] text-white py-2 text-center text-xs font-sans border-t border-gray-400">
          © {new Date().getFullYear()} Controller General of Patents, Designs & Trade Marks | All Rights Reserved.
        </div>
      </div>
    </div>
  );
}
