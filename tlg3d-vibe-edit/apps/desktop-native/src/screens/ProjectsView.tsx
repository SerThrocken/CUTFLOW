// ============================================================
//  CutFlow Desktop — Projects View
// ============================================================

import React, { useState, useEffect } from 'react';
import { invoke }   from '@tauri-apps/api/core';
import { open }     from '@tauri-apps/plugin-dialog';
import axios        from 'axios';
import { C }        from '../App';

const API = 'http://localhost:3000';

interface Project {
  projectId:   string;
  userId:      string;
  projectName: string;
  status:      string;
  progress:    number;
  resolution:  string;
  fps:         number;
  updatedAt:   string;
  createdAt:   string;
}

const STATUS_COLOR: Record<string, string> = {
  draft:       C.muted,
  in_progress: C.accent,
  processing:  C.primary,
  completed:   C.success,
  archived:    C.muted,
};

export default function ProjectsView() {
  const [projects,    setProjects]    = useState<Project[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [creating,    setCreating]    = useState(false);
  const [newName,     setNewName]     = useState('');
  const [showCreate,  setShowCreate]  = useState(false);
  const [search,      setSearch]      = useState('');
  const [filter,      setFilter]      = useState('all');

  const username = localStorage.getItem('username') || 'user';
  const userId   = localStorage.getItem('user_id')  || 'unknown';

  useEffect(() => { fetchProjects(); }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/projects/${userId}`, {
        params: { username },
      });
      setProjects(res.data.projects || []);
    } catch { setProjects([]); }
    setLoading(false);
  };

  const createProject = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await axios.post(`${API}/api/projects/create`, {
        userId, username, projectName: newName.trim(),
      });
      setNewName(''); setShowCreate(false);
      fetchProjects();
    } catch (err: any) {
      alert(`Create failed: ${err.message}`);
    }
    setCreating(false);
  };

  const importVideo = async () => {
    const selected = await open({
      multiple: false,
      filters:  [{ name: 'Video Files', extensions: ['mp4', 'mov', 'mkv', 'avi', 'webm'] }],
    });
    if (selected) {
      // Create project from file
      const name = (selected as string).split(/[\\/]/).pop()?.replace(/\.[^.]+$/, '') || 'Imported';
      setNewName(name);
      setShowCreate(true);
    }
  };

  const filtered = projects.filter(p => {
    const matchSearch = !search || p.projectName.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || p.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20, gap: 12 }}>
        <h1 style={{ color: C.text, fontSize: 22, fontWeight: 800, flex: 1 }}>📁 Projects</h1>
        <button onClick={importVideo} style={btn(C.accent)}>📂 Import Video</button>
        <button onClick={() => setShowCreate(true)} style={btn(C.primary)}>+ New Project</button>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search projects..."
          style={inputStyle}
        />
        {['all', 'draft', 'in_progress', 'completed', 'archived'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            ...btn(filter === f ? C.primary : C.muted, filter === f ? C.primary + '20' : 'transparent'),
            fontSize: 12, padding: '6px 12px',
          }}>
            {f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div style={modal}>
          <div style={modalBox}>
            <h3 style={{ color: C.text, marginBottom: 14 }}>New Project</h3>
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Project name"
              style={{ ...inputStyle, width: '100%', marginBottom: 14 }}
              onKeyDown={e => e.key === 'Enter' && createProject()}
              autoFocus
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowCreate(false); setNewName(''); }} style={btn(C.muted, 'transparent')}>Cancel</button>
              <button onClick={createProject} disabled={creating || !newName.trim()} style={btn(C.primary)}>
                {creating ? '...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Projects Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', color: C.muted, paddingTop: 60 }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', color: C.muted, paddingTop: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎬</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>No projects yet</div>
          <div style={{ fontSize: 13, marginTop: 6 }}>Create your first project to get started</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {filtered.map(p => (
            <div key={p.projectId} style={{
              background: C.card, border: `1px solid ${C.border}`,
              borderRadius: 12, padding: 16, cursor: 'pointer',
              transition: 'border-color 0.15s',
            }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = C.primary + '80')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: C.text, fontWeight: 700, fontSize: 14, flex: 1, marginRight: 8 }}
                  title={p.projectName}>
                  {p.projectName.length > 24 ? p.projectName.slice(0, 24) + '…' : p.projectName}
                </span>
                <span style={{ color: STATUS_COLOR[p.status], fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
                  {p.status}
                </span>
              </div>
              {/* Progress bar */}
              <div style={{ height: 3, background: C.border, borderRadius: 2, marginBottom: 10 }}>
                <div style={{ height: '100%', width: `${p.progress}%`, background: C.primary, borderRadius: 2 }} />
              </div>
              <div style={{ display: 'flex', gap: 12, fontSize: 11, color: C.muted, marginBottom: 12 }}>
                <span>{p.resolution}</span>
                <span>{p.fps}fps</span>
                <span>{new Date(p.updatedAt).toLocaleDateString()}</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={{ ...btn(C.primary), flex: 1, fontSize: 12, padding: '6px 0' }}>Open</button>
                <button style={{ ...btn(C.muted, 'transparent'), fontSize: 12, padding: '6px 10px' }}>⋯</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Style helpers ─────────────────────────────────────────────

const btn = (color: string, bg?: string) => ({
  background:   bg !== undefined ? bg : color + '20',
  border:       `1px solid ${color}40`,
  borderRadius: 8,
  color,
  fontWeight:   700 as const,
  fontSize:     13,
  padding:      '8px 14px',
  cursor:       'pointer' as const,
  transition:   'opacity 0.15s',
} as React.CSSProperties);

const inputStyle: React.CSSProperties = {
  background:   '#222',
  border:       `1px solid #2A2A2A`,
  borderRadius: 8,
  color:        '#E0E0E0',
  fontSize:     13,
  padding:      '8px 12px',
  outline:      'none',
  flex:         1,
};

const modal: React.CSSProperties = {
  position:       'fixed', inset: 0,
  background:     'rgba(0,0,0,0.7)',
  display:        'flex',
  alignItems:     'center',
  justifyContent: 'center',
  zIndex:         100,
};

const modalBox: React.CSSProperties = {
  background:   '#1A1A1A',
  border:       '1px solid #2A2A2A',
  borderRadius: 14,
  padding:      24,
  width:        380,
};
