'use client';

import React, { useEffect, useState, useCallback } from 'react';
import PublicPage from '@/components/PublicPage';
import AdminDashboard from '@/components/AdminDashboard';
import AdminLogin from '@/components/AdminLogin';
import { FullPortalData } from '@/lib/types';
import { RefreshCw } from 'lucide-react';

export default function Home() {
  const [data, setData] = useState<FullPortalData | null>(null);
  const [loading, setLoading] = useState(true);
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
    const fetchData = async () => {
      try {
        const verifyRes = await fetch('/api/v1/admin/verify', { cache: 'no-store' });
        if (verifyRes.ok && isMounted) {
          const verifyJson = await verifyRes.json();
          if (verifyJson.success) {
            setIsAdminLoggedIn(true);
          }
        }

        const res = await fetch('/api/v1/public-data', { cache: 'no-store' });
        const json = await res.json();
        if (json.success && isMounted) {
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
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, []);

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

  if (loading || !data) {
    return null;
  }

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
