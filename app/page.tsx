'use client';

import React, { useEffect, useState, useCallback } from 'react';
import PublicPage from '@/components/PublicPage';
import AdminDashboard from '@/components/AdminDashboard';
import AdminLogin from '@/components/AdminLogin';
import { INITIAL_DATA } from '@/lib/initial-data';
import { FullPortalData } from '@/lib/types';
import { RefreshCw } from 'lucide-react';

export default function Home() {
  const [data, setData] = useState<FullPortalData>(INITIAL_DATA);
  const [loading, setLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [viewMode, setViewMode] = useState<'public' | 'admin'>('public');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  // Fetch Public / Session Data
  const loadData = useCallback(async () => {
    try {
      // First verify session if token exists
      const verifyRes = await fetch('/api/v1/admin/verify');
      if (verifyRes.ok) {
        const verifyJson = await verifyRes.json();
        if (verifyJson.success) {
          setIsAdminLoggedIn(true);
        }
      }

      // Fetch public portal data
      const res = await fetch('/api/v1/public-data', { cache: 'no-store' });
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

    // 1. Initial verify session
    fetch('/api/v1/admin/verify', { cache: 'no-store' })
      .then(res => res.ok ? res.json() : null)
      .then(verifyJson => {
        if (verifyJson?.success && isMounted) {
          setIsAdminLoggedIn(true);
        }
      })
      .catch(() => {});

    // 2. Fetch initial public data
    loadData();

    // 3. Real-Time Firebase Listener (Instant Sub-Second Auto Update)
    let unsub: (() => void) | null = null;
    try {
      import('@/lib/firebase').then(({ clientDb }) => {
        import('firebase/firestore').then(({ doc, onSnapshot }) => {
          if (!isMounted) return;
          unsub = onSnapshot(doc(clientDb, 'cms_portal', 'portal_data'), (snapshot) => {
            if (snapshot.exists() && isMounted) {
              const fbData = snapshot.data();
              if (fbData && Array.isArray(fbData.payments)) {
                setData({
                  portalSettings: fbData.portalSettings || INITIAL_DATA.portalSettings,
                  payments: fbData.payments,
                  tableColumns: fbData.tableColumns || INITIAL_DATA.tableColumns,
                  terms: fbData.terms || INITIAL_DATA.terms,
                  settings: fbData.settings || INITIAL_DATA.settings,
                  admin: { username: 'admin', passwordHash: '' }
                });
                setLoading(false);
              }
            }
          });
        }).catch(() => {});
      }).catch(() => {});
    } catch (err) {}

    // 4. Background Polling Fallback (Every 2.5 Seconds)
    const intervalId = setInterval(() => {
      if (isMounted) {
        loadData();
      }
    }, 2500);

    return () => {
      isMounted = false;
      if (unsub) unsub();
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
