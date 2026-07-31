'use client';

import React from 'react';
import { PaymentItem, TableColumn } from '@/lib/types';

interface PaymentTableProps {
  payments: PaymentItem[];
  tableColumns?: TableColumn[];
}

const DEFAULT_TABLE_COLUMNS: TableColumn[] = [
  { id: 'col-sno', key: 'sNo', label: 'S. No.', visible: true },
  { id: 'col-formNumber', key: 'formNumber', label: 'Form Number', visible: true },
  { id: 'col-applicationNumber', key: 'applicationNumber', label: 'Application Number', visible: true },
  { id: 'col-referenceNumber', key: 'referenceNumber', label: 'App. Ref. No.', visible: true },
  { id: 'col-classes', key: 'classes', label: 'Classes', visible: true },
  { id: 'col-branch', key: 'branch', label: 'Branch', visible: true },
  { id: 'col-price', key: 'price', label: 'Price', visible: true }
];

export default function PaymentTable({ payments, tableColumns }: PaymentTableProps) {
  const totalPrice = payments.reduce((sum, item) => sum + (Number(item.price) || 0), 0);

  const activeCols = (tableColumns && tableColumns.length > 0 ? tableColumns : DEFAULT_TABLE_COLUMNS).filter(c => c.visible !== false);

  const getCellValue = (item: PaymentItem, key: string, index: number) => {
    switch (key) {
      case 'sNo':
        return item.sNo || index + 1;
      case 'formNumber':
        return item.formNumber || '';
      case 'applicationNumber':
        return item.applicationNumber || '';
      case 'referenceNumber':
        return item.referenceNumber || '';
      case 'classes':
        return item.classes || '';
      case 'branch':
        return (item.branch || '').toUpperCase();
      case 'price':
        return item.price !== undefined ? `${item.price}` : '4500';
      default:
        return item.customFields?.[key] || '';
    }
  };

  return (
    <section 
      id="ctl00_ctl00_ContentPlaceHolder1_ContentPlaceHolder2_formsGridPanel"
      className="w-full flex flex-col items-center my-2"
      style={{ 
        fontFamily: '"Times New Roman", Times, serif',
        fontSize: '16px',
        color: '#000000'
      }}
    >
      {/* Heading */}
      <h2 
        className="text-[18px] font-bold text-center mb-3 tracking-normal"
        style={{ 
          fontFamily: 'Arial, sans-serif', 
          color: '#003366', 
          textDecoration: 'underline' 
        }}
      >
        Forms Selected for Payment
      </h2>

      {/* Dark Grey Rounded Container - Auto Width & Height, Background #424242 */}
      <div 
        className="shadow-md border border-gray-700 flex justify-center items-center transition-all duration-300"
        style={{ 
          backgroundColor: '#424242', 
          borderRadius: '14px',
          width: 'fit-content',
          minWidth: '320px',
          maxWidth: '100%',
          padding: '10px 36px',
          fontFamily: '"Times New Roman", Times, serif',
          fontSize: '16px',
          color: '#000000'
        }}
      >
        <div 
          className="w-full overflow-x-auto"
          style={{ 
            fontFamily: '"Times New Roman", Times, serif',
            fontSize: '16px',
            color: '#000000'
          }}
        >
          <table 
            className="border-collapse bg-white transition-all duration-300"
            style={{ 
              border: '1px solid #888',
              width: 'max-content',
              minWidth: '100%'
            }}
          >
          <thead>
            <tr className="bg-[#E5F4FE] text-black font-bold border-b border-[#888]">
              {activeCols.map((col, idx) => (
                <th 
                  key={col.id || col.key}
                  className={`border-[#888] text-center whitespace-nowrap ${idx < activeCols.length - 1 ? 'border-r' : ''}`}
                  style={{ fontFamily: '"Times New Roman", Times, serif', fontSize: '13px', padding: '2px 8px', color: '#000000' }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td 
                  colSpan={activeCols.length || 1} 
                  className="text-center text-gray-500 italic"
                  style={{ fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '13px', padding: '6px' }}
                >
                  No forms selected for payment.
                </td>
              </tr>
            ) : (
              payments.map((item, index) => (
                <tr 
                  key={item.id || index}
                  className={index % 2 === 0 ? 'bg-white' : 'bg-[#f9f9f9]'}
                >
                  {activeCols.map((col, idx) => (
                    <td 
                      key={col.id || col.key}
                      className={`border-[#888] border-t text-center ${idx < activeCols.length - 1 ? 'border-r' : ''} ${
                        col.key === 'price' ? 'text-right font-bold pr-2 whitespace-nowrap' : ''
                      } ${col.key === 'branch' ? 'uppercase' : ''} ${
                        col.key === 'sNo' || col.key === 'applicationNumber' ? 'font-medium' : ''
                      }`}
                      style={{ fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '13px', padding: '2px 6px', color: '#000000' }}
                    >
                      {getCellValue(item, col.key, index)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
          {payments.length > 0 && activeCols.length > 0 && (
            <tfoot>
              <tr className="bg-white font-bold border-t border-[#888] text-black">
                <td 
                  colSpan={activeCols.length > 1 ? activeCols.length - 1 : 1} 
                  className="border-r border-[#888] text-right font-normal"
                  style={{ fontFamily: '"Times New Roman", Times, serif', fontSize: '13px', padding: '2px 6px', color: '#000000' }}
                >
                  Total
                </td>
                <td 
                  className="text-right font-bold text-[#003366] text-[14px] pr-2 whitespace-nowrap"
                  style={{ fontFamily: 'Arial, sans-serif', padding: '2px 6px' }}
                >
                  ₹ {totalPrice > 0 ? totalPrice : 4500}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
        </div>
      </div>
    </section>
  );
}

