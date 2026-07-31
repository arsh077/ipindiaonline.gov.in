'use client';

import React, { useEffect, useState, useCallback } from 'react';
import AdminDashboard from '@/components/AdminDashboard';
import AdminLogin from '@/components/AdminLogin';
import { FullPortalData } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';

export default function AdminPage() {
  const router = useRouter();
  const [data, setData] = useState<FullPortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  const checkAuthAndLoad = useCallback(async () => {
    try {
      const verifyRes = await fetch('/api/v1/admin/verify');
      if (verifyRes.ok) {
        const verifyJson = await verifyRes.json();
        if (verifyJson.success) {
          setIsAdminLoggedIn(true);
        }
      }

      const res = await fetch('/api/v1/public-data');
      const json = await res.json();
      if (json.success) {
        setData({
          portalSettings: json.data.portalSettings,
          payments: json.data.payments,
          terms: json.data.terms,
          settings: { redirectURL: json.data.redirectURL },
          admin: { username: 'admin', passwordHash: '' }
        });
      }
    } catch (err) {
      console.error('Error verifying admin:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const initAdmin = async () => {
      try {
        const verifyRes = await fetch('/api/v1/admin/verify');
        if (verifyRes.ok && isMounted) {
          const verifyJson = await verifyRes.json();
          if (verifyJson.success) {
            setIsAdminLoggedIn(true);
          }
        }

        const res = await fetch('/api/v1/public-data');
        const json = await res.json();
        if (json.success && isMounted) {
          setData({
            portalSettings: json.data.portalSettings,
            payments: json.data.payments,
            terms: json.data.terms,
            settings: { redirectURL: json.data.redirectURL },
            admin: { username: 'admin', passwordHash: '' }
          });
        }
      } catch (err) {
        console.error('Error verifying admin:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initAdmin();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = () => {
    document.cookie = 'admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    setIsAdminLoggedIn(false);
    router.push('/');
  };

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="flex items-center gap-3 bg-slate-950 px-6 py-4 rounded-xl shadow-2xl border border-slate-800 text-slate-200">
          <RefreshCw className="w-5 h-5 text-cyan-400 animate-spin" />
          <span className="font-semibold text-sm">Verifying Admin Session...</span>
        </div>
      </div>
    );
  }

  if (!isAdminLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-950">
        <AdminLogin
          onSuccess={() => {
            setIsAdminLoggedIn(true);
            checkAuthAndLoad();
          }}
          onCancel={() => router.push('/')}
        />
      </div>
    );
  }

  return (
    <AdminDashboard
      initialData={data}
      onLogout={handleLogout}
      onBackToPublic={() => router.push('/')}
      onRefreshData={checkAuthAndLoad}
    />
  );
}
