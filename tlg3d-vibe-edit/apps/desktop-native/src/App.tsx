// ============================================================
//  CutFlow Desktop — Main App (React + Tauri)
//  Uses Tauri invoke() for ALL system operations — no Electron
//  Each invoke() call reaches into the Rust backend directly.
// ============================================================

import React, { useState, useEffect } from 'react';
import { invoke }           from '@tauri-apps/api/core';
import { listen }           from '@tauri-apps/api/event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ── Screens ───────────────────────────────────────────────────
import Dashboard       from './screens/Dashboard';
import ProjectsView    from './screens/ProjectsView';
import EditorView      from './screens/EditorView';
import MarketplaceView from './screens/MarketplaceView';
import MessagingView   from './screens/MessagingView';
import SettingsView    from './screens/SettingsView';
import SetupWizardView from './screens/SetupWizardView';

// ── CutFlow brand colors ──────────────────────────────────────
export const C = {
  bg:      '#0F0F0F',
  surface: '#1A1A1A',
  card:    '#222222',
  border:  '#2A2A2A',
  primary: '#4FD97D',
  accent:  '#D4A574',
  text:    '#E0E0E0',
  muted:   '#888888',
  error:   '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
};

const queryClient = new QueryClient();

type View = 'dashboard' | 'projects' | 'editor' | 'marketplace' | 'messaging' | 'settings' | 'setup';

// ── Sidebar Nav ───────────────────────────────────────────────

const NAV_ITEMS: { id: View; icon: string; label: string }[] = [
  { id: 'dashboard',    icon: '🏠', label: 'Home' },
  { id: 'projects',     icon: '📁', label: 'Projects' },
  { id: 'editor',       icon: '✂️', label: 'Editor' },
  { id: 'marketplace',  icon: '🛒', label: 'Marketplace' },
  { id: 'messaging',    icon: '💬', label: 'Messaging' },
  { id: 'settings',     icon: '⚙️', label: 'Settings' },
];

// ── App Root ──────────────────────────────────────────────────

export default function App() {
  const [view,           setView]           = useState<View>('dashboard');
  const [isSetupDone,    setIsSetupDone]    = useState<boolean | null>(null);
  const [systemInfo,     setSystemInfo]     = useState<any>(null);
  const [notifications,  setNotifications]  = useState<string[]>([]);
  const [updateAvailable,setUpdateAvailable]= useState(false);
  const [syncConnected,  setSyncConnected]  = useState(false);

  // ── Init ───────────────────────────────────────────────────

  useEffect(() => {
    // Check setup status
    const setupDone = localStorage.getItem('setup_complete');
    setIsSetupDone(!!setupDone);

    // Detect system
    invoke<any>('get_system_info')
      .then(info => setSystemInfo(info))
      .catch(() => {});

    // Check for updates
    invoke<boolean>('check_for_updates')
      .then(avail => setUpdateAvailable(avail))
      .catch(() => {});

    // Listen for sync events from mobile
    const unlisten1 = listen('mobile-paired', (e: any) => {
      setNotifications(prev => [`📱 ${e.payload.device_name} connected`, ...prev.slice(0, 4)]);
      setSyncConnected(true);
    });

    const unlisten2 = listen('remote-job-received', (e: any) => {
      setNotifications(prev => [`📥 Remote job received: ${e.payload.job_id}`, ...prev.slice(0, 4)]);
    });

    const unlisten3 = listen('render-complete', (e: any) => {
      setNotifications(prev => [`✅ Render complete: ${e.payload.output}`, ...prev.slice(0, 4)]);
    });

    const unlisten4 = listen('navigate', (e: any) => {
      const route = (e.payload as string).replace('/', '') as View;
      if (NAV_ITEMS.find(n => n.id === route)) setView(route);
    });

    return () => {
      Promise.all([unlisten1, unlisten2, unlisten3, unlisten4]).then(fns => fns.forEach(f => f()));
    };
  }, []);

  // ── Setup Wizard ───────────────────────────────────────────

  if (isSetupDone === null) {
    return (
      <div style={{ background: C.bg, height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: C.primary, fontSize: 32 }}>⏳</div>
      </div>
    );
  }

  if (!isSetupDone) {
    return (
      <QueryClientProvider client={queryClient}>
        <div style={{ background: C.bg, height: '100vh' }}>
          <SetupWizardView onComplete={() => {
            localStorage.setItem('setup_complete', 'true');
            setIsSetupDone(true);
          }} />
        </div>
      </QueryClientProvider>
    );
  }

  const renderView = () => {
    switch (view) {
      case 'dashboard':   return <Dashboard systemInfo={systemInfo} notifications={notifications} />;
      case 'projects':    return <ProjectsView />;
      case 'editor':      return <EditorView />;
      case 'marketplace': return <MarketplaceView />;
      case 'messaging':   return <MessagingView />;
      case 'settings':    return <SettingsView systemInfo={systemInfo} />;
      default:            return <Dashboard systemInfo={systemInfo} notifications={notifications} />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div style={{ display: 'flex', height: '100vh', background: C.bg, color: C.text, fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' }}>

        {/* Sidebar */}
        <aside style={{
          width: 200, minWidth: 200,
          background:   C.surface,
          borderRight:  `1px solid ${C.border}`,
          display:      'flex',
          flexDirection:'column',
          padding:      '16px 0',
        }}>
          {/* Logo */}
          <div style={{ padding: '0 16px 20px', borderBottom: `1px solid ${C.border}`, marginBottom: 12 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.primary, letterSpacing: -0.5 }}>CutFlow</div>
            <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>by The Looking Glass 3D</div>
          </div>

          {/* Nav Items */}
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              style={{
                display:        'flex',
                alignItems:     'center',
                gap:            10,
                padding:        '10px 16px',
                background:     view === item.id ? C.primary + '20' : 'transparent',
                border:         'none',
                borderLeft:     view === item.id ? `3px solid ${C.primary}` : '3px solid transparent',
                color:          view === item.id ? C.primary : C.muted,
                fontWeight:     view === item.id ? 700 : 400,
                fontSize:       14,
                cursor:         'pointer',
                width:          '100%',
                textAlign:      'left',
                transition:     'all 0.15s',
              }}
            >
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}

          {/* Bottom: status */}
          <div style={{ marginTop: 'auto', padding: '12px 16px', borderTop: `1px solid ${C.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: 4, background: syncConnected ? C.success : C.border }} />
              <span style={{ fontSize: 11, color: C.muted }}>
                {syncConnected ? 'Mobile connected' : 'No mobile'}
              </span>
            </div>
            {updateAvailable && (
              <div
                style={{ fontSize: 11, color: C.warning, cursor: 'pointer' }}
                onClick={() => invoke('install_update')}>
                ↑ Update available
              </div>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
          {/* Notification bar */}
          {notifications.length > 0 && (
            <div style={{
              position:   'sticky', top: 0, zIndex: 50,
              background: C.surface,
              borderBottom: `1px solid ${C.border}`,
              padding:    '8px 20px',
              display:    'flex',
              alignItems: 'center',
              gap:        8,
              fontSize:   12,
              color:      C.muted,
            }}>
              <span>{notifications[0]}</span>
              <button
                onClick={() => setNotifications(prev => prev.slice(1))}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 14 }}>
                ✕
              </button>
            </div>
          )}

          {renderView()}
        </main>
      </div>
    </QueryClientProvider>
  );
}
