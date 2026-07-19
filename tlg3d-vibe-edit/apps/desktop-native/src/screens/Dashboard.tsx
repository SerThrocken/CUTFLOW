// ============================================================
//  CutFlow Desktop — Dashboard Screen
// ============================================================

import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { C }      from '../App';
import axios      from 'axios';

const API = 'http://localhost:3000';

export default function Dashboard({ systemInfo, notifications }: {
  systemInfo:    any;
  notifications: string[];
}) {
  const [metrics,  setMetrics]  = useState<any>({});
  const [queues,   setQueues]   = useState<any>({});
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    fetchMetrics();
    const t = setInterval(fetchMetrics, 10_000);
    return () => clearInterval(t);
  }, []);

  const fetchMetrics = async () => {
    try {
      const res = await axios.get(`${API}/api/dashboard/metrics`);
      setMetrics(res.data);
    } catch {}
    setLoading(false);
  };

  const cards = [
    { label: 'Total Projects', value: metrics.totalProjects      || 0, icon: '📁', color: C.primary },
    { label: 'Total Users',    value: metrics.totalUsers          || 0, icon: '👤', color: C.accent  },
    { label: 'Renders Done',   value: metrics.completedProjects   || 0, icon: '✅', color: C.success },
    { label: 'Storage Used',   value: `${metrics.storageUsed || 0}%`,  icon: '💾', color: C.warning },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ color: C.text, fontSize: 24, fontWeight: 800, marginBottom: 4 }}>🎬 CutFlow Dashboard</h1>
      <p style={{ color: C.muted, fontSize: 13, marginBottom: 24 }}>The Looking Glass 3D</p>

      {/* System Status */}
      {systemInfo && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          {[
            { label: 'GPU',   value: `${systemInfo.gpu_vram_gb}GB ${systemInfo.gpu_name}` },
            { label: 'CPU',   value: systemInfo.cpu_brand },
            { label: 'RAM',   value: `${systemInfo.available_ram_gb}GB free` },
            { label: 'FFmpeg',value: systemInfo.ffmpeg_installed ? '✓ Installed' : '✗ Missing', color: systemInfo.ffmpeg_installed ? C.success : C.error },
            { label: 'Ollama',value: systemInfo.ollama_installed ? '✓ Installed' : '✗ Not found', color: systemInfo.ollama_installed ? C.success : C.muted },
            { label: 'yt-dlp',value: systemInfo.ytdlp_installed  ? '✓ Installed' : '✗ Not found', color: systemInfo.ytdlp_installed  ? C.success : C.muted },
          ].map(s => (
            <div key={s.label} style={{
              background: C.card, border: `1px solid ${C.border}`,
              borderRadius: 8, padding: '8px 14px',
            }}>
              <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', marginBottom: 2 }}>{s.label}</div>
              <div style={{ fontSize: 12, color: s.color || C.text, fontWeight: 600 }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {cards.map(card => (
          <div key={card.label} style={{
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 12, padding: 16,
          }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{card.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: card.color }}>{card.value}</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* Recent notifications */}
      {notifications.length > 0 && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
          <h3 style={{ color: C.text, fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Recent Activity</h3>
          {notifications.map((n, i) => (
            <div key={i} style={{
              padding: '8px 0', borderBottom: i < notifications.length - 1 ? `1px solid ${C.border}` : 'none',
              fontSize: 13, color: C.muted,
            }}>
              {n}
            </div>
          ))}
        </div>
      )}

      {/* Quick action buttons */}
      <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
        {[
          { label: '+ New Project', color: C.primary },
          { label: '⬇️ Download Models', color: C.accent },
          { label: '🛒 Browse Marketplace', color: '#A855F7' },
          { label: '💬 Configure Messaging', color: '#3B82F6' },
        ].map(btn => (
          <button key={btn.label} style={{
            background: btn.color + '20', border: `1px solid ${btn.color}40`,
            borderRadius: 8, padding: '10px 16px',
            color: btn.color, fontWeight: 700, fontSize: 13,
            cursor: 'pointer',
          }}>
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
}
