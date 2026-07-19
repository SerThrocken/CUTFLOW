// ============================================================
//  CutFlow Desktop — Marketplace View
// ============================================================

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { C }  from '../App';

const API = 'http://localhost:3001'; // marketplace service

interface Skill {
  id: string; name: string; description: string; category: string;
  pricing: { type: string; price?: number; pricePerMonth?: number };
  icon: string; rating: number; ratingCount: number; downloads: number;
  verified: boolean; featured: boolean; installed: boolean; enabled?: boolean;
  tags: string[];
}

const CATEGORY_META: Record<string, { label: string; icon: string }> = {
  'all':            { label: 'All',          icon: '🌐' },
  'ai-video':       { label: 'AI Video',     icon: '🤖' },
  'ai-audio':       { label: 'AI Audio',     icon: '🎵' },
  'effects':        { label: 'Effects',      icon: '✨' },
  'color':          { label: 'Color',        icon: '🎨' },
  'text-captions':  { label: 'Captions',     icon: '💬' },
  'social':         { label: 'Social',       icon: '📤' },
  'analytics':      { label: 'Analytics',    icon: '📊' },
  'utility':        { label: 'Utility',      icon: '🔧' },
  'transitions':    { label: 'Transitions',  icon: '↔️' },
  'export':         { label: 'Export',       icon: '📦' },
};

export default function MarketplaceView() {
  const [skills,    setSkills]    = useState<Skill[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [category,  setCategory]  = useState('all');
  const [search,    setSearch]    = useState('');
  const [tab,       setTab]       = useState<'browse' | 'installed'>('browse');
  const [installing,setInstalling]= useState<Set<string>>(new Set());

  useEffect(() => { fetchSkills(); }, [category, search]);

  const fetchSkills = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/marketplace/skills`, {
        params: { category: category === 'all' ? undefined : category, search: search || undefined, limit: 50 },
      });
      setSkills(res.data.skills || []);
    } catch { setSkills([]); }
    setLoading(false);
  };

  const install = async (skill: Skill) => {
    setInstalling(prev => new Set(prev).add(skill.id));
    try {
      await axios.post(`${API}/api/marketplace/skills/${skill.id}/install`, { userId: 'desktop' });
      setSkills(prev => prev.map(s => s.id === skill.id ? { ...s, installed: true, enabled: true } : s));
    } catch (err: any) { alert(`Install failed: ${err.response?.data?.error || err.message}`); }
    setInstalling(prev => { const n = new Set(prev); n.delete(skill.id); return n; });
  };

  const uninstall = async (skill: Skill) => {
    if (!confirm(`Uninstall "${skill.name}"?`)) return;
    try {
      await axios.post(`${API}/api/marketplace/skills/${skill.id}/uninstall`, {});
      setSkills(prev => prev.map(s => s.id === skill.id ? { ...s, installed: false } : s));
    } catch (err: any) { alert(err.message); }
  };

  const toggleEnabled = async (skill: Skill, enabled: boolean) => {
    try {
      await axios.post(`${API}/api/marketplace/skills/${skill.id}/toggle`, { enabled });
      setSkills(prev => prev.map(s => s.id === skill.id ? { ...s, enabled } : s));
    } catch {}
  };

  const priceLabel = (s: Skill) => {
    switch (s.pricing.type) {
      case 'free':         return { label: 'Free',                      color: C.success };
      case 'paid':         return { label: `$${s.pricing.price}`,       color: C.accent };
      case 'one-time':     return { label: `$${s.pricing.price} once`,  color: C.accent };
      case 'subscription': return { label: `$${s.pricing.pricePerMonth}/mo`, color: C.accent };
      default:             return { label: 'Free',                      color: C.success };
    }
  };

  const displayed = tab === 'installed'
    ? skills.filter(s => s.installed)
    : skills;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20, gap: 12 }}>
        <h1 style={{ color: C.text, fontSize: 22, fontWeight: 800, flex: 1 }}>🛒 Skill Marketplace</h1>
        <button onClick={() => axios.post(`${API}/api/marketplace/seed`).then(() => fetchSkills())}
          style={btn(C.muted, 'transparent')}>
          🔄 Seed Default Skills
        </button>
      </div>

      {/* Tabs + Search */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
        {(['browse', 'installed'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            ...btn(tab === t ? C.primary : C.muted, tab === t ? C.primary + '20' : 'transparent'),
            fontSize: 13, padding: '8px 16px', textTransform: 'capitalize',
          }}>
            {t === 'browse' ? `Browse (${skills.length})` : `Installed (${skills.filter(s => s.installed).length})`}
          </button>
        ))}
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search skills..."
          style={{ flex: 1, background: '#222', border: `1px solid #2A2A2A`, borderRadius: 8, color: '#E0E0E0', fontSize: 13, padding: '8px 12px', outline: 'none' }}
        />
      </div>

      {/* Category pills */}
      {tab === 'browse' && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {Object.entries(CATEGORY_META).map(([id, meta]) => (
            <button key={id} onClick={() => setCategory(id)} style={{
              ...btn(category === id ? C.primary : C.muted, category === id ? C.primary + '15' : 'transparent'),
              fontSize: 12, padding: '5px 12px',
            }}>
              {meta.icon} {meta.label}
            </button>
          ))}
        </div>
      )}

      {/* Skills grid */}
      {loading ? (
        <div style={{ textAlign: 'center', color: C.muted, paddingTop: 60 }}>Loading skills...</div>
      ) : displayed.length === 0 ? (
        <div style={{ textAlign: 'center', color: C.muted, paddingTop: 60 }}>
          {tab === 'installed' ? 'No skills installed yet.' : 'No skills found.'}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
          {displayed.map(skill => {
            const price = priceLabel(skill);
            const busy  = installing.has(skill.id);
            return (
              <div key={skill.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
                <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                  <span style={{ fontSize: 28 }}>{skill.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <span style={{ color: C.text, fontWeight: 700, fontSize: 14 }}>{skill.name}</span>
                      {skill.verified && <span style={{ color: C.primary, fontSize: 11 }}>✓</span>}
                      {skill.featured && <span style={{ fontSize: 11 }}>⭐</span>}
                    </div>
                    <p style={{ color: C.muted, fontSize: 12, lineHeight: 1.4 }}>{skill.description}</p>
                    <div style={{ display: 'flex', gap: 10, marginTop: 6, fontSize: 11 }}>
                      <span style={{ color: price.color, fontWeight: 700 }}>{price.label}</span>
                      <span style={{ color: C.muted }}>★ {skill.rating?.toFixed(1) || '—'}</span>
                      <span style={{ color: C.muted }}>↓ {skill.downloads || 0}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {skill.installed ? (
                    <>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.muted, fontSize: 12, cursor: 'pointer' }}>
                        <input type="checkbox" checked={skill.enabled !== false}
                          onChange={e => toggleEnabled(skill, e.target.checked)}
                          style={{ accentColor: C.primary }} />
                        Enabled
                      </label>
                      <div style={{ flex: 1 }} />
                      <button onClick={() => uninstall(skill)} style={btn(C.error, 'transparent')}>Remove</button>
                    </>
                  ) : (
                    <button onClick={() => install(skill)} disabled={busy}
                      style={{ ...btn(C.primary), flex: 1, justifyContent: 'center', opacity: busy ? 0.6 : 1 }}>
                      {busy ? 'Installing...' : skill.pricing.type === 'free' ? '⬇ Install' : `Buy & Install`}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const btn = (color: string, bg?: string): React.CSSProperties => ({
  background:   bg !== undefined ? bg : color + '20',
  border:       `1px solid ${color}50`,
  borderRadius: 8, color, fontWeight: 700, fontSize: 13,
  padding:      '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
});
