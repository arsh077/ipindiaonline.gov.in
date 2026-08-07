'use client';

import React, { useState, useRef } from 'react';
import { FullPortalData, PaymentItem, TermSection, PortalSettings, TableColumn, PortalSession } from '@/lib/types';
import { 
  Building2, CreditCard, FileText, Globe, Key, 
  Plus, Trash2, Save, LogOut, ArrowLeft, RefreshCw, CheckCircle, Upload, LayoutGrid, Eye, EyeOff,
  Share2, Copy, ExternalLink, Check, Link as LinkIcon
} from 'lucide-react';

import { doc, setDoc } from 'firebase/firestore';
import { clientDb } from '@/lib/firebase-client';

const DEFAULT_COLS: TableColumn[] = [
  { id: 'col-sno', key: 'sNo', label: 'S. No.', visible: true },
  { id: 'col-formNumber', key: 'formNumber', label: 'Form Number', visible: true },
  { id: 'col-applicationNumber', key: 'applicationNumber', label: 'Application Number', visible: true },
  { id: 'col-referenceNumber', key: 'referenceNumber', label: 'App. Ref. No.', visible: true },
  { id: 'col-classes', key: 'classes', label: 'Classes', visible: true },
  { id: 'col-branch', key: 'branch', label: 'Branch', visible: true },
  { id: 'col-price', key: 'price', label: 'Price', visible: true }
];

interface AdminDashboardProps {
  initialData: FullPortalData;
  onLogout: () => void;
  onBackToPublic: () => void;
  onRefreshData: () => void;
}

export default function AdminDashboard({ initialData, onLogout, onBackToPublic, onRefreshData }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'header' | 'payments' | 'columns' | 'terms' | 'redirect' | 'credentials' | 'links'>('payments');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Shareable Link Generator states
  const [sessionsList, setSessionsList] = useState<PortalSession[]>(
    initialData.sessions ? Object.values(initialData.sessions) : []
  );
  const [clientTag, setClientTag] = useState<string>('');
  const [copiedSessionId, setCopiedSessionId] = useState<string | null>(null);
  const [generatingLink, setGeneratingLink] = useState(false);

  const loadSessions = async () => {
    try {
      const res = await fetch('/api/v1/admin/sessions');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setSessionsList(data.data);
      }
    } catch (e) {}
  };

  const handleGenerateLink = async () => {
    setGeneratingLink(true);
    try {
      const res = await fetch('/api/v1/admin/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: clientTag.trim() || undefined,
          payments: paymentsList,
          portalSettings: headerForm
        })
      });
      const data = await res.json();
      if (data.success && data.data) {
        showNotice("Unique Client Link generated & saved permanently!");
        setClientTag('');
        loadSessions();
        onRefreshData();
      } else {
        showNotice(data.message || "Failed to generate link", "error");
      }
    } catch (err: any) {
      showNotice(err.message || "Error generating link", "error");
    } finally {
      setGeneratingLink(false);
    }
  };

  const handleDeleteSession = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/admin/sessions?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showNotice("Client Link deleted!");
        loadSessions();
        onRefreshData();
      }
    } catch (e) {}
  };

  const handleCopyLink = (sessionId: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://ipindiaonline-gov-in.vercel.app';
    const fullUrl = `${origin}/?session=${sessionId}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedSessionId(sessionId);
    showNotice("Client Link copied to clipboard!", "success");
    setTimeout(() => setCopiedSessionId(null), 3000);
  };

  // Form states
  const [headerForm, setHeaderForm] = useState<PortalSettings>({ ...initialData.portalSettings });
  const [paymentsList, setPaymentsList] = useState<PaymentItem[]>([...initialData.payments]);
  const [columnsList, setColumnsList] = useState<TableColumn[]>(
    initialData.tableColumns && initialData.tableColumns.length > 0 ? initialData.tableColumns : DEFAULT_COLS
  );
  const [newColLabel, setNewColLabel] = useState<string>('');
  const [termsList, setTermsList] = useState<TermSection[]>([...initialData.terms]);
  const [redirectURL, setRedirectURL] = useState<string>(initialData.settings.redirectURL);

  const getFullDataSnapshot = (overridePayments?: PaymentItem[], overrideHeader?: PortalSettings): FullPortalData => {
    const sessionsObj: Record<string, PortalSession> = {};
    if (Array.isArray(sessionsList)) {
      sessionsList.forEach(s => {
        sessionsObj[s.id] = s;
      });
    } else if (initialData.sessions) {
      Object.assign(sessionsObj, initialData.sessions);
    }

    return {
      ...initialData,
      portalSettings: overrideHeader || headerForm,
      payments: overridePayments || paymentsList,
      tableColumns: columnsList,
      terms: termsList,
      settings: { redirectURL },
      sessions: sessionsObj
    };
  };

  // Helper for 0ms instant broadcast to all clients & open tabs
  const triggerInstantBroadcast = (fullData: FullPortalData) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('portal_live_data', JSON.stringify(fullData));
        window.dispatchEvent(new CustomEvent('portal_live_update', { detail: fullData }));
      } catch (e) {}

      if ('BroadcastChannel' in window) {
        try {
          const bc = new BroadcastChannel('portal_instant_sync');
          bc.postMessage(fullData);
          bc.close();
        } catch (e) {}
      }
    }
    try {
      setDoc(doc(clientDb, 'cms_portal', 'portal_data'), fullData).catch(() => {});
    } catch (e) {}
  };
  
  // Credentials
  const [newUsername, setNewUsername] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [deletingRowId, setDeletingRowId] = useState<string | null>(null);
  const [deletingColId, setDeletingColId] = useState<string | null>(null);

  const showNotice = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  // Handler for Header Save
  const handleSaveHeader = async () => {
    setSaving(true);
    const fullData = getFullDataSnapshot(paymentsList, headerForm);
    triggerInstantBroadcast(fullData);

    try {
      const res = await fetch('/api/v1/admin/settings/header', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(headerForm)
      });
      const data = await res.json();
      if (data.success) {
        showNotice("Header & Portal identity updated successfully!");
        onRefreshData();
      } else {
        showNotice(data.message || "Failed to update header", "error");
      }
    } catch (err: any) {
      showNotice(err.message || "Error saving header settings", "error");
    } finally {
      setSaving(false);
    }
  };

  // Helper function to upload files permanently to public/uploads folder
  const uploadFilePermanently = async (file: File, type: 'logo' | 'emblem' | 'banner'): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const res = await fetch('/api/v1/admin/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success && data.data?.url) {
        return data.data.url;
      } else {
        showNotice(data.message || 'Upload failed', 'error');
        return null;
      }
    } catch (err: any) {
      showNotice(err.message || 'Error uploading file', 'error');
      return null;
    }
  };

  // Logo file upload handler
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showNotice("Image file size should be less than 5MB", "error");
        return;
      }
      showNotice("Uploading image permanently to folder...", "success");
      const url = await uploadFilePermanently(file, 'logo');
      if (url) {
        setHeaderForm(prev => ({ ...prev, logo: url }));
        showNotice("Logo uploaded and saved to public/uploads permanently!", "success");
      }
    }
  };

  const handleEmblemUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showNotice("Emblem image file size should be less than 5MB", "error");
        return;
      }
      showNotice("Uploading emblem permanently to folder...", "success");
      const url = await uploadFilePermanently(file, 'emblem');
      if (url) {
        setHeaderForm(prev => ({ ...prev, emblemImage: url }));
        showNotice("Emblem uploaded and saved to public/uploads permanently!", "success");
      }
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        showNotice("Banner image file size should be less than 10MB", "error");
        return;
      }
      showNotice("Uploading banner permanently to folder...", "success");
      const url = await uploadFilePermanently(file, 'banner');
      if (url) {
        setHeaderForm(prev => ({ ...prev, headerBanner: url }));
        showNotice("Header Banner uploaded and saved to public/uploads permanently!", "success");
      }
    }
  };


  // Handlers for Payments CRUD
  const handleAddPaymentRow = () => {
    const newRow: PaymentItem = {
      id: `pay-${Date.now()}`,
      sNo: paymentsList.length + 1,
      formNumber: 'TM-A',
      applicationNumber: `594830${paymentsList.length + 1}`,
      referenceNumber: `TM/2026/${Math.floor(10000 + Math.random() * 90000)}`,
      classes: '35',
      branch: 'DELHI',
      price: 4500
    };
    const updated = [...paymentsList, newRow];
    setPaymentsList(updated);

    const fullData = getFullDataSnapshot(updated);
    triggerInstantBroadcast(fullData);
  };

  const handleUpdatePayment = (index: number, field: keyof PaymentItem, value: any) => {
    setPaymentsList(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };

      const fullData = getFullDataSnapshot(copy);
      triggerInstantBroadcast(fullData);

      return copy;
    });
  };

  const handleDeletePayment = (id: string) => {
    setDeletingRowId(id);
    const updated = paymentsList.filter(p => p.id !== id).map((item, idx) => ({ ...item, sNo: idx + 1 }));
    setPaymentsList(updated);
    setDeletingRowId(null);

    const fullData = getFullDataSnapshot(updated);
    triggerInstantBroadcast(fullData);

    // Auto-save to backend
    fetch('/api/v1/admin/payments', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    }).then(res => res.json()).then(data => {
      if (data.success) {
        showNotice("Row deleted & saved!");
        onRefreshData();
      }
    }).catch(() => {});
  };

  const handleSavePayments = async () => {
    setSaving(true);
    const fullData = getFullDataSnapshot(paymentsList);
    triggerInstantBroadcast(fullData);

    try {
      const res = await fetch('/api/v1/admin/payments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentsList)
      });
      const data = await res.json();
      if (data.success) {
        showNotice("Payment table updated successfully!");
        onRefreshData();
      } else {
        showNotice(data.message || "Failed to save payments", "error");
      }
    } catch (err: any) {
      showNotice(err.message || "Error saving payment table", "error");
    } finally {
      setSaving(false);
    }
  };

  // Handlers for Columns Manager
  const handleToggleColumn = (index: number) => {
    setColumnsList(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], visible: !copy[index].visible };
      return copy;
    });
  };

  const handleUpdateColumnLabel = (index: number, label: string) => {
    setColumnsList(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], label };
      return copy;
    });
  };

  const handleAddColumn = () => {
    if (!newColLabel.trim()) {
      showNotice("Please enter a column title", "error");
      return;
    }
    const sanitizedKey = `custom_${Date.now()}_${newColLabel.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    const newCol: TableColumn = {
      id: `col-${Date.now()}`,
      key: sanitizedKey,
      label: newColLabel.trim(),
      visible: true
    };
    setColumnsList(prev => [...prev, newCol]);
    setNewColLabel('');
    showNotice(`Column "${newCol.label}" added! Remember to save changes.`);
  };

  const handleDeleteColumn = (id: string) => {
    setDeletingColId(id);
    setTimeout(async () => {
      const updated = columnsList.filter(c => c.id !== id);
      setColumnsList(updated);
      setDeletingColId(null);
      // Auto-save to backend
      try {
        const res = await fetch('/api/v1/admin/columns', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated)
        });
        const data = await res.json();
        if (data.success) {
          showNotice("Column deleted & saved!");
          onRefreshData();
        }
      } catch {}
    }, 600);
  };

  const handleSaveColumns = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/v1/admin/columns', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(columnsList)
      });
      const data = await res.json();
      if (data.success) {
        showNotice("Table column layout saved! The black wrapper automatically resized.");
        onRefreshData();
      } else {
        showNotice(data.message || "Failed to save column layout", "error");
      }
    } catch (err: any) {
      showNotice(err.message || "Error saving column layout", "error");
    } finally {
      setSaving(false);
    }
  };

  // Handlers for Terms Editor
  const handleUpdateTerm = (index: number, field: 'title' | 'description', value: string) => {
    setTermsList(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleAddTerm = () => {
    const newTerm: TermSection = {
      id: `term-${Date.now()}`,
      order: termsList.length + 1,
      title: `${termsList.length + 1}. New Legal Section`,
      description: 'Enter term policy description here...'
    };
    setTermsList(prev => [...prev, newTerm]);
  };

  const handleDeleteTerm = (id: string) => {
    setTermsList(prev => prev.filter(t => t.id !== id).map((item, idx) => ({ ...item, order: idx + 1 })));
  };

  const handleSaveTerms = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/v1/admin/terms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(termsList)
      });
      const data = await res.json();
      if (data.success) {
        showNotice("Terms & conditions updated successfully!");
        onRefreshData();
      } else {
        showNotice(data.message || "Failed to save terms", "error");
      }
    } catch (err: any) {
      showNotice(err.message || "Error saving terms", "error");
    } finally {
      setSaving(false);
    }
  };

  // Handler for Redirect Settings
  const handleSaveRedirect = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/v1/admin/settings/redirect', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ redirectURL })
      });
      const data = await res.json();
      if (data.success) {
        showNotice("Redirect URL updated successfully!");
        onRefreshData();
      } else {
        showNotice(data.message || "Failed to update redirect URL", "error");
      }
    } catch (err: any) {
      showNotice(err.message || "Error updating redirect URL", "error");
    } finally {
      setSaving(false);
    }
  };

  // Handler for Credentials Update
  const handleSaveCredentials = async () => {
    if (!newUsername && !newPassword) {
      showNotice("Please enter a new username or password", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/v1/admin/credentials', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newUsername, newPassword })
      });
      const data = await res.json();
      if (data.success) {
        showNotice("Admin credentials updated successfully!");
        setNewUsername('');
        setNewPassword('');
      } else {
        showNotice(data.message || "Failed to update credentials", "error");
      }
    } catch (err: any) {
      showNotice(err.message || "Error updating credentials", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Top Admin Header Bar */}
      <header className="bg-slate-950 border-b border-slate-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#006078] flex items-center justify-center font-bold text-white text-lg shadow-inner">
            CMS
          </div>
          <div>
            <h1 className="text-base font-bold text-white leading-tight">
              Portal Admin Management
            </h1>
            <p className="text-xs text-slate-400">
              Trademarkapply CRM Control Dashboard
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onBackToPublic}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer border border-slate-700"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            View Live Public Page
          </button>

          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 text-red-200 text-xs font-semibold transition-colors cursor-pointer border border-red-800/50"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </header>

      {/* Global Toast Message */}
      {message && (
        <div className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-lg shadow-2xl flex items-center gap-2 text-sm font-semibold border ${
          message.type === 'success' 
            ? 'bg-emerald-900/90 text-emerald-100 border-emerald-700' 
            : 'bg-red-900/90 text-red-100 border-red-700'
        }`}>
          <CheckCircle className="w-4 h-4" />
          {message.text}
        </div>
      )}

      {/* Main Admin Area */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto p-6 gap-6">
        {/* Navigation Sidebar Tabs */}
        <aside className="w-64 shrink-0 flex flex-col gap-2">
          <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 space-y-1">
            <button
              onClick={() => setActiveTab('payments')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'payments'
                  ? 'bg-[#006078] text-white shadow-md'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              Payment Table Rows
            </button>

            <button
              onClick={() => setActiveTab('columns')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'columns'
                  ? 'bg-[#006078] text-white shadow-md'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              Table Columns & Layout
            </button>

            <button
              onClick={() => setActiveTab('header')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'header'
                  ? 'bg-[#006078] text-white shadow-md'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <Building2 className="w-4 h-4" />
              Header & Identity
            </button>

            <button
              onClick={() => setActiveTab('terms')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'terms'
                  ? 'bg-[#006078] text-white shadow-md'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              Terms & Conditions Editor
            </button>

            <button
              onClick={() => setActiveTab('redirect')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'redirect'
                  ? 'bg-[#006078] text-white shadow-md'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <Globe className="w-4 h-4" />
              Redirect URL Settings
            </button>

            <button
              onClick={() => setActiveTab('credentials')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'credentials'
                  ? 'bg-[#006078] text-white shadow-md'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <Key className="w-4 h-4" />
              Admin Credentials
            </button>

            <button
              onClick={() => { setActiveTab('links'); loadSessions(); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'links'
                  ? 'bg-amber-600 text-white shadow-md font-bold'
                  : 'text-amber-400 hover:bg-slate-900 hover:text-amber-200'
              }`}
            >
              <Share2 className="w-4 h-4" />
              Client Link Generator 🔗
            </button>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-2">
            <span className="font-semibold text-slate-300 block">⚡ Quick Tip</span>
            <p className="leading-relaxed">
              Changes saved in this dashboard update the live replica page instantly.
            </p>
          </div>
        </aside>

        {/* Tab Content Panel */}
        <main className="flex-1 bg-slate-950 rounded-xl border border-slate-800 p-6 shadow-xl flex flex-col">
          {/* 1. PAYMENT TABLE MANAGEMENT */}
          {activeTab === 'payments' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-cyan-400" />
                    Payment Table Management
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Add, edit, or remove form items displayed in the dark payment table container on the public portal.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAddPaymentRow}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Add New Row
                  </button>

                  <button
                    onClick={handleSavePayments}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-[#006078] hover:bg-[#00485F] text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save All Changes
                  </button>
                </div>
              </div>

              {/* Table List */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-200">
                  <thead className="bg-slate-900 text-slate-400 uppercase font-semibold border-b border-slate-800">
                    <tr>
                      <th className="p-2.5 w-12 text-center">S.No</th>
                      <th className="p-2.5">Form Number</th>
                      <th className="p-2.5">Application No.</th>
                      <th className="p-2.5">App Ref No.</th>
                      <th className="p-2.5">Classes</th>
                      <th className="p-2.5">Branch</th>
                      <th className="p-2.5">Price (₹)</th>
                      <th className="p-2.5 text-center w-16">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {paymentsList.map((row, index) => (
                      <tr 
                        key={row.id || index} 
                        className={`transition-all duration-500 ease-in-out ${
                          deletingRowId === row.id 
                            ? 'bg-red-900/60 opacity-0 scale-y-0 translate-x-[100%] h-0 overflow-hidden' 
                            : 'hover:bg-slate-900/50 opacity-100 scale-y-100 translate-x-0'
                        }`}
                        style={{
                          transformOrigin: 'top center',
                          ...(deletingRowId === row.id ? { maxHeight: '0px', padding: 0 } : {})
                        }}
                      >
                        <td className="p-2 text-center font-mono text-slate-400">{index + 1}</td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={row.formNumber}
                            onChange={(e) => handleUpdatePayment(index, 'formNumber', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100 focus:outline-none focus:border-cyan-500"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={row.applicationNumber}
                            onChange={(e) => handleUpdatePayment(index, 'applicationNumber', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={row.referenceNumber}
                            onChange={(e) => handleUpdatePayment(index, 'referenceNumber', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={row.classes}
                            onChange={(e) => handleUpdatePayment(index, 'classes', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100 focus:outline-none focus:border-cyan-500"
                          />
                        </td>
                        <td className="p-2">
                          <select
                            value={row.branch}
                            onChange={(e) => handleUpdatePayment(index, 'branch', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100 focus:outline-none focus:border-cyan-500"
                          >
                            <option value="DELHI">DELHI</option>
                            <option value="MUMBAI">MUMBAI</option>
                            <option value="CHENNAI">CHENNAI</option>
                            <option value="KOLKATA">KOLKATA</option>
                            <option value="AHMEDABAD">AHMEDABAD</option>
                          </select>
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            value={row.price}
                            onChange={(e) => handleUpdatePayment(index, 'price', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 font-mono text-emerald-400 font-bold focus:outline-none focus:border-cyan-500"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <button
                            onClick={() => handleDeletePayment(row.id)}
                            className="p-1 text-red-400 hover:text-red-300 hover:bg-red-950/50 rounded cursor-pointer transition-colors"
                            title="Delete Row"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 2. TABLE COLUMNS & LAYOUT MANAGER */}
          {activeTab === 'columns' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <LayoutGrid className="w-5 h-5 text-cyan-400" />
                    Table Columns & Auto-Resizing Layout
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Add new custom columns, hide/show columns, or edit header labels. The black table background layout automatically resizes width & height on the public page to fit your column setup.
                  </p>
                </div>

                <button
                  onClick={handleSaveColumns}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#006078] hover:bg-[#00485F] text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Column Layout
                </button>
              </div>

              {/* Add New Custom Column Form */}
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row items-center gap-3">
                <div className="flex-1 w-full">
                  <label className="block text-xs font-medium text-slate-400 mb-1">Add New Column Title</label>
                  <input
                    type="text"
                    value={newColLabel}
                    onChange={(e) => setNewColLabel(e.target.value)}
                    placeholder="e.g. Filing Date, Applicant Name, Status"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <button
                  onClick={handleAddColumn}
                  className="w-full sm:w-auto mt-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Add Column
                </button>
              </div>

              {/* Columns Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-200">
                  <thead className="bg-slate-900 text-slate-400 uppercase font-semibold border-b border-slate-800">
                    <tr>
                      <th className="p-3 w-12 text-center">#</th>
                      <th className="p-3">Column Header Title</th>
                      <th className="p-3">Field Key</th>
                      <th className="p-3 text-center">Visibility</th>
                      <th className="p-3 text-center w-28">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {columnsList.map((col, index) => (
                      <tr 
                        key={col.id || index} 
                        className={`transition-all duration-500 ease-in-out ${
                          deletingColId === col.id 
                            ? 'bg-red-900/60 opacity-0 scale-y-0 translate-x-[100%] h-0 overflow-hidden' 
                            : 'hover:bg-slate-900/50 opacity-100 scale-y-100 translate-x-0'
                        }`}
                        style={{
                          transformOrigin: 'top center',
                          ...(deletingColId === col.id ? { maxHeight: '0px', padding: 0 } : {})
                        }}
                      >
                        <td className="p-3 text-center font-mono text-slate-400">{index + 1}</td>
                        <td className="p-3">
                          <input
                            type="text"
                            value={col.label}
                            onChange={(e) => handleUpdateColumnLabel(index, e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-500 font-medium"
                          />
                        </td>
                        <td className="p-3 font-mono text-slate-400 text-[11px]">{col.key}</td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleColumn(index)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold cursor-pointer transition-colors ${
                              col.visible !== false
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                          >
                            {col.visible !== false ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                            {col.visible !== false ? 'Visible' : 'Hidden'}
                          </button>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteColumn(col.id)}
                            className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-950/50 rounded cursor-pointer transition-colors"
                            title="Remove Column"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-cyan-950/30 border border-cyan-800/50 rounded-xl p-4 text-xs text-cyan-200 flex items-start gap-3">
                <LayoutGrid className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-cyan-100 mb-1">Layout Auto-Resize Mechanism</h4>
                  <p className="text-cyan-200/80 leading-relaxed">
                    When columns are hidden or added, the dark grey container (<span className="font-mono text-amber-300">#424242</span>) on the public payment portal automatically contracts or expands its width and height to maintain exact optical balance and alignment.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 3. HEADER & PORTAL IDENTITY */}
          {activeTab === 'header' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-cyan-400" />
                    Header & Portal Identity Settings
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Customize government logo, organization name, department details, and attorney credentials.
                  </p>
                </div>

                <button
                  onClick={handleSaveHeader}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-[#006078] hover:bg-[#00485F] text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Header Settings
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Left Ashoka Emblem Upload */}
                <div className="space-y-3 bg-slate-900 p-4 rounded-xl border border-slate-800">
                  <label className="block text-xs font-semibold text-slate-300">
                    Left Emblem Image (Ashoka Emblem)
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-center p-1 overflow-hidden shrink-0">
                      {headerForm.emblemImage === 'none' ? (
                        <span className="text-[10px] text-red-400 font-semibold italic text-center">No Emblem (Deleted)</span>
                      ) : (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={headerForm.emblemImage || '/images/ashoka-emblem.svg'} alt="Preview Emblem" className="max-w-full max-h-full object-contain" />
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <label className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium cursor-pointer transition-colors border border-slate-700">
                        <Upload className="w-3.5 h-3.5" />
                        Upload Emblem Image
                        <input type="file" accept="image/*" onChange={handleEmblemUpload} className="hidden" />
                      </label>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setHeaderForm(prev => ({ ...prev, emblemImage: 'none' }))}
                          className="flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300 font-medium hover:underline"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete Emblem
                        </button>
                        {headerForm.emblemImage !== '' && (
                          <button
                            type="button"
                            onClick={() => setHeaderForm(prev => ({ ...prev, emblemImage: '' }))}
                            className="text-[11px] text-slate-400 hover:text-slate-200 hover:underline"
                          >
                            Reset to default
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">Supported formats: PNG, JPG, SVG (&lt; 3MB)</p>
                    </div>
                  </div>
                </div>

                {/* 2. Right IP India Logo Upload */}
                <div className="space-y-3 bg-slate-900 p-4 rounded-xl border border-slate-800">
                  <label className="block text-xs font-semibold text-slate-300">
                    Right Logo Image (Intellectual Property India)
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-center p-1 overflow-hidden shrink-0">
                      {headerForm.logo === 'none' ? (
                        <span className="text-[10px] text-red-400 font-semibold italic text-center">No Logo (Deleted)</span>
                      ) : (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={headerForm.logo && !headerForm.logo.includes('svg+xml') ? headerForm.logo : '/images/ip-india-logo.svg'} alt="Preview Logo" className="max-w-full max-h-full object-contain" />
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <label className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium cursor-pointer transition-colors border border-slate-700">
                        <Upload className="w-3.5 h-3.5" />
                        Upload Logo Image
                        <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                      </label>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setHeaderForm(prev => ({ ...prev, logo: 'none' }))}
                          className="flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300 font-medium hover:underline"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete Logo
                        </button>
                        {headerForm.logo !== '' && (
                          <button
                            type="button"
                            onClick={() => setHeaderForm(prev => ({ ...prev, logo: '' }))}
                            className="text-[11px] text-slate-400 hover:text-slate-200 hover:underline"
                          >
                            Reset to default
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">Supported formats: PNG, JPG, SVG (&lt; 2MB)</p>
                    </div>
                  </div>
                </div>

                {/* 3. Complete Single Header Banner Upload (Optional) */}
                <div className="md:col-span-2 space-y-3 bg-slate-900 p-4 rounded-xl border border-slate-800">
                  <label className="block text-xs font-semibold text-slate-300">
                    Full Header Banner Image (Optional - Overrides main header with 1 single image)
                  </label>
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    {headerForm.headerBanner && (
                      <div className="h-16 w-full sm:w-64 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-center p-1 overflow-hidden shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={headerForm.headerBanner} alt="Preview Banner" className="max-w-full max-h-full object-contain" />
                      </div>
                    )}
                    <div className="flex-1 w-full space-y-2">
                      <label className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium cursor-pointer transition-colors border border-slate-700">
                        <Upload className="w-3.5 h-3.5" />
                        {headerForm.headerBanner ? 'Replace Header Banner Image' : 'Upload Full Header Banner Image'}
                        <input type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" />
                      </label>
                      {headerForm.headerBanner && (
                        <button
                          type="button"
                          onClick={() => setHeaderForm(prev => ({ ...prev, headerBanner: '' }))}
                          className="text-[11px] text-red-400 hover:underline block"
                        >
                          Remove custom banner image (use standard emblem & text layout)
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Organization Name */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-300">
                    Organization Name
                  </label>
                  <input
                    type="text"
                    value={headerForm.organizationName}
                    onChange={(e) => setHeaderForm({ ...headerForm, organizationName: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Department Name */}
                <div className="space-y-2 md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300">
                    Department Name / Subtitle
                  </label>
                  <input
                    type="text"
                    value={headerForm.departmentName}
                    onChange={(e) => setHeaderForm({ ...headerForm, departmentName: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Attorney Name */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-300">
                    Welcome Attorney Name (Top Strip)
                  </label>
                  <input
                    type="text"
                    value={headerForm.attorneyName}
                    onChange={(e) => setHeaderForm({ ...headerForm, attorneyName: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Attorney Number */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-300">
                    Attorney Code / Registration Number
                  </label>
                  <input
                    type="text"
                    value={headerForm.attorneyNumber}
                    onChange={(e) => setHeaderForm({ ...headerForm, attorneyNumber: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 3. TERMS & CONDITIONS EDITOR */}
          {activeTab === 'terms' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-cyan-400" />
                    Terms & Conditions Editor
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Edit legal policy disclaimer sections displayed at the bottom of the payment portal.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAddTerm}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Add Section
                  </button>

                  <button
                    onClick={handleSaveTerms}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-[#006078] hover:bg-[#00485F] text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Terms
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {termsList.map((term, index) => (
                  <div key={term.id || index} className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-bold text-cyan-400 uppercase">
                        Section #{index + 1}
                      </span>
                      <button
                        onClick={() => handleDeleteTerm(term.id)}
                        className="text-red-400 hover:text-red-300 p-1 text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove Section
                      </button>
                    </div>

                    <input
                      type="text"
                      value={term.title}
                      onChange={(e) => handleUpdateTerm(index, 'title', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-semibold text-slate-100 focus:outline-none focus:border-cyan-500"
                      placeholder="Section Title..."
                    />

                    <textarea
                      rows={3}
                      value={term.description}
                      onChange={(e) => handleUpdateTerm(index, 'description', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 font-serif leading-relaxed"
                      placeholder="Section description text..."
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. REDIRECT URL SETTINGS */}
          {activeTab === 'redirect' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Globe className="w-5 h-5 text-cyan-400" />
                    Redirect URL Settings
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Specify the target URL where users are redirected when clicking sidebar buttons or Payment actions.
                  </p>
                </div>

                <button
                  onClick={handleSaveRedirect}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-[#006078] hover:bg-[#00485F] text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Redirect URL
                </button>
              </div>

              <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-4 max-w-2xl">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Target Government Redirect URL
                  </label>
                  <input
                    type="url"
                    value={redirectURL}
                    onChange={(e) => setRedirectURL(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 font-mono text-sm text-cyan-300 focus:outline-none focus:border-cyan-500"
                    placeholder="https://ipindiaonline.gov.in/..."
                  />
                </div>

                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-400 space-y-1">
                  <span className="font-semibold text-amber-400">📌 Note on Auto-Redirect:</span>
                  <p className="leading-relaxed">
                    When any user clicks on a sidebar navigation button, &quot;Make Payment&quot;, or &quot;Back&quot;, the system automatically calls <code className="text-cyan-300">window.location.replace(redirectURL)</code> to navigate to this specified portal page.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 5. ADMIN CREDENTIALS */}
          {activeTab === 'credentials' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Key className="w-5 h-5 text-cyan-400" />
                    Admin Credentials & Security
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Update admin login username and password hash.
                  </p>
                </div>

                <button
                  onClick={handleSaveCredentials}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-[#006078] hover:bg-[#00485F] text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Update Credentials
                </button>
              </div>

              <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-4 max-w-md">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    New Username (Optional)
                  </label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="Leave blank to keep current"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    New Password (Optional)
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Leave blank to keep current"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 6. CLIENT LINK GENERATOR */}
          {activeTab === 'links' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Share2 className="w-5 h-5 text-amber-400" />
                    Shareable Client Link Generator
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Generate unique, permanent shareable links for specific clients. Even if the client refreshes 100 times, their link will NEVER reset!
                  </p>
                </div>
              </div>

              {/* Section 1: Generate New Link Card */}
              <div className="bg-gradient-to-r from-slate-900 to-slate-950 p-6 rounded-xl border border-amber-500/30 shadow-xl space-y-4">
                <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Generate New Unique Link for Current Payment Table Setup
                </h3>
                
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <input
                    type="text"
                    value={clientTag}
                    onChange={(e) => setClientTag(e.target.value)}
                    placeholder="Client Name or Reference (e.g. M/s Apex Traders)"
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    onClick={handleGenerateLink}
                    disabled={generatingLink}
                    className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-bold text-xs rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {generatingLink ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
                    Generate &amp; Save Unique Link
                  </button>
                </div>

                <p className="text-xs text-slate-400">
                  💡 <span className="font-semibold text-slate-300">How it works:</span> Clicking generate takes the current payment rows ({paymentsList.length} rows, Total ₹{paymentsList.reduce((acc, item) => acc + (Number(item.price) || 0), 0)}), header, and attorney info and locks it permanently into a dedicated link.
                </p>
              </div>

              {/* Section 2: List of Generated Client Links */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-200">
                  All Active Shareable Client Links ({sessionsList.length})
                </h3>

                {sessionsList.length === 0 ? (
                  <div className="bg-slate-900/60 p-8 rounded-xl border border-slate-800 text-center text-slate-400 text-sm">
                    No custom client links generated yet. Enter a client name above and click &quot;Generate &amp; Save Unique Link&quot; to create your first client link!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {sessionsList.map((session) => {
                      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://ipindiaonline-gov-in.vercel.app';
                      const fullUrl = `${origin}/?session=${session.id}`;
                      const totalAmount = session.payments?.reduce((acc, p) => acc + (Number(p.price) || 0), 0) || 0;
                      const isCopied = copiedSessionId === session.id;

                      return (
                        <div key={session.id} className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-amber-300">
                                {session.clientName}
                              </span>
                              <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                                {session.payments?.length || 0} Forms • Total ₹{totalAmount}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <code className="text-xs text-cyan-300 bg-slate-950 px-2 py-1 rounded border border-slate-800 select-all break-all">
                                {fullUrl}
                              </code>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleCopyLink(session.id)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                                isCopied 
                                  ? 'bg-emerald-600 text-white' 
                                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                              }`}
                            >
                              {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
                              {isCopied ? 'Copied!' : 'Copy Link'}
                            </button>

                            <a
                              href={fullUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                              Test Link
                            </a>

                            <button
                              onClick={() => handleDeleteSession(session.id)}
                              className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-800/50 transition-colors cursor-pointer"
                              title="Delete Link"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
