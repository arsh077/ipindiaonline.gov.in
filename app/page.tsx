'use client';

import React, { useEffect, useState, useCallback } from 'react';
import PublicPage from '@/components/PublicPage';
import AdminDashboard from '@/components/AdminDashboard';
import AdminLogin from '@/components/AdminLogin';
import { INITIAL_DATA } from '@/lib/initial-data';
import { FullPortalData } from '@/lib/types';
import { doc, onSnapshot } from 'firebase/firestore';
import { clientDb } from '@/lib/firebase-client';

export default function Home() {
  const [data, setData] = useState<FullPortalData>(INITIAL_DATA);
  const [loading, setLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [viewMode, setViewMode] = useState<'public' | 'admin'>('public');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  // Fetch Public / Session Data
  const loadData = useCallback(async () => {
    try {
      // Check query params for session id (e.g. ?session=xxx or ?id=xxx)
      let sessionParam = '';
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        sessionParam = urlParams.get('session') || urlParams.get('id') || '';
      }

      // First verify session if token exists
      const verifyRes = await fetch(`/api/v1/admin/verify?t=${Date.now()}`, { cache: 'no-store' });
      if (verifyRes.ok) {
        const verifyJson = await verifyRes.json();
        if (verifyJson.success) {
          setIsAdminLoggedIn(true);
        }
      }

      // Fetch public portal data with cache-busting timestamp and session parameter
      const fetchUrl = sessionParam 
        ? `/api/v1/public-data?session=${encodeURIComponent(sessionParam)}&t=${Date.now()}` 
        : `/api/v1/public-data?t=${Date.now()}`;

      const res = await fetch(fetchUrl, { cache: 'no-store' });
      const json = await res.json();
      if (json.success) {
        setData({
          portalSettings: json.data.portalSettings,
          payments: json.data.payments,
          tableColumns: json.data.tableColumns,
          terms: json.data.terms,
          settings: { redirectURL: json.data.redirectURL },
          admin: { username: 'admin', passwordHash: '' }
        });
      }
    } catch (err) {
      console.error('Error fetching portal data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    // Check if client is viewing a specific session link
    let sessionParam = '';
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      sessionParam = urlParams.get('session') || urlParams.get('id') || '';
    }

    // Helper to apply instant update
    const applyUpdate = (syncData: any) => {
      if (!isMounted || !syncData) return;

      // 🔒 IF USER IS ON A SPECIFIC CLIENT LINK (?session=xxx), LOCK IT TO THAT SESSION ONLY!
      if (sessionParam) {
        if (syncData.sessions && syncData.sessions[sessionParam]) {
          const sessData = syncData.sessions[sessionParam];
          if (sessData && Array.isArray(sessData.payments)) {
            setData({
              portalSettings: sessData.portalSettings || INITIAL_DATA.portalSettings,
              payments: sessData.payments,
              tableColumns: sessData.tableColumns || INITIAL_DATA.tableColumns,
              terms: sessData.terms || INITIAL_DATA.terms,
              settings: sessData.settings || INITIAL_DATA.settings,
              admin: { username: 'admin', passwordHash: '' }
            });
            setLoading(false);
          }
        }
        // NEVER overwrite a session link with global main payments table!
        return;
      }

      // Main default page (no session param)
      if (Array.isArray(syncData.payments)) {
        setData({
          portalSettings: syncData.portalSettings || INITIAL_DATA.portalSettings,
          payments: syncData.payments,
          tableColumns: syncData.tableColumns || INITIAL_DATA.tableColumns,
          terms: syncData.terms || INITIAL_DATA.terms,
          settings: syncData.settings || INITIAL_DATA.settings,
          admin: { username: 'admin', passwordHash: '' }
        });
        setLoading(false);
      }
    };

    // 1. Initial verify session
    fetch(`/api/v1/admin/verify?t=${Date.now()}`, { cache: 'no-store' })
      .then(res => res.ok ? res.json() : null)
      .then(verifyJson => {
        if (verifyJson?.success && isMounted) {
          setIsAdminLoggedIn(true);
        }
      })
      .catch(() => {});

    // 2. Initial fetch & local storage check
    loadData();
    try {
      const stored = localStorage.getItem('portal_live_data');
      if (stored) {
        applyUpdate(JSON.parse(stored));
      }
    } catch (e) {}

    // 3. LocalStorage & Custom Event Listeners (Instant 0ms Same-Browser Sync)
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'portal_live_data' && e.newValue) {
        try { applyUpdate(JSON.parse(e.newValue)); } catch (err) {}
      }
    };
    const handleCustomEvent = (e: any) => {
      if (e.detail) {
        applyUpdate(e.detail);
      }
    };

    window.addEventListener('storage', handleStorageEvent);
    window.addEventListener('portal_live_update', handleCustomEvent);

    // 4. Instant 0ms BroadcastChannel Listener
    let broadcastChannel: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        broadcastChannel = new BroadcastChannel('portal_instant_sync');
        broadcastChannel.onmessage = (event) => {
          if (event.data) applyUpdate(event.data);
        };
      } catch (err) {}
    }

    // 5. Direct Firestore Realtime WebSocket Listener (Instant Cross-Device Sync)
    const unsub = onSnapshot(doc(clientDb, 'cms_portal', 'portal_data'), (snapshot) => {
      if (snapshot.exists()) {
        applyUpdate(snapshot.data());
      }
    });

    // 6. Fast 1.2-Second Sync Fallback with Timestamp Busting
    const intervalId = setInterval(() => {
      if (isMounted) {
        loadData();
      }
    }, 1200);

    return () => {
      isMounted = false;
      window.removeEventListener('storage', handleStorageEvent);
      window.removeEventListener('portal_live_update', handleCustomEvent);
      if (unsub) unsub();
      if (broadcastChannel) broadcastChannel.close();
      clearInterval(intervalId);
    };
  }, [loadData]);

  const handleAdminToggle = () => {
    if (isAdminLoggedIn) {
      setViewMode(prev => prev === 'admin' ? 'public' : 'admin');
    } else {
      setShowLoginModal(true);
    }
  };

  const handleLoginSuccess = () => {
    setIsAdminLoggedIn(true);
    setShowLoginModal(false);
    setViewMode('admin');
    loadData();
  };

  const handleLogout = () => {
    document.cookie = 'admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    setIsAdminLoggedIn(false);
    setViewMode('public');
  };

  // Render Admin Dashboard View
  if (viewMode === 'admin' && isAdminLoggedIn) {
    return (
      <AdminDashboard
        initialData={data}
        onLogout={handleLogout}
        onBackToPublic={() => setViewMode('public')}
        onRefreshData={loadData}
      />
    );
  }

  // Render Public Page Replica View
  return (
    <>
      <PublicPage
        data={{
          ...data.portalSettings,
          payments: data.payments,
          tableColumns: data.tableColumns,
          terms: data.terms,
          redirectURL: data.settings.redirectURL
        }}
        onAdminClick={handleAdminToggle}
        isAdminLoggedIn={isAdminLoggedIn}
      />

      {/* Admin Login Overlay */}
      {showLoginModal && (
        <AdminLogin
          onSuccess={handleLoginSuccess}
          onCancel={() => setShowLoginModal(false)}
        />
      )}
    </>
  );
}
