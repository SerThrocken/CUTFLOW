// ============================================================
//  CutFlow Desktop — Settings View
// ============================================================

import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import axios      from 'axios';
import { C }      from '../App';

const API = 'http://localhost:3000';

export default function SettingsView({ systemInfo }: { systemInfo: any }) {
  const [username,    setUsername]    = useState('');
  const [apiUrl,      setApiUrl]      = useState('http://localhost:3000');
  const [llmProvider, setLlmProvider] = useState('openrouter');
  const [ollamaUrl,   setOllamaUrl]   = useState('http://localhost:11434');
  const [gpuVram,     setGpuVram]     = useState('12');
  const [saving,      setSaving]      = useState(false);
  const [testResult,  setTestResult]  = useState<Record<string, string>>({});

  useEffect(() => {
    setUsername(   localStorage.getItem('username')      || '');
    setApiUrl(     localStorage.getItem('api_url')       || 'http://localhost:3000');
    setLlmProvider(localStorage.getItem('llm_provider') || 'openrouter');
    setOllamaUrl(  localStorage.getItem('ollama_url')   || 'http://localhost:11434');
    setGpuVram(    systemInfo?.gpu_vram_gb?.toString()  || '12');
  }, [systemInfo]);

  const save = async () => {
    setSaving(true);
    localStorage.setItem('username',     username);
    localStorage.setItem('api_url',      apiUrl);
    localStorage.setItem('llm_provider', llmProvider);
    localStorage.setItem('ollama_url',   ollamaUrl);
    setTimeout(() => setSaving(false), 600);
  };

  const testConnection = async (service: string) => {
    setTestResult(prev => ({ ...prev, [service]: '...' }));
    try {
      switch (service) {
        case 'api':
          await axios.get(`${apiUrl}/health`, { timeout: 5000 });
          setTestResult(prev => ({ ...prev, api: '✓ Connected' }));
          break;
        case 'ollama':
          await axios.get(`${ollamaUrl}/api/tags`, { timeout: 5000 });
          setTestResult(prev => ({ ...prev, ollama: '✓ Running' }));
          break;
        case 'ffmpeg': {
          const info = await invoke<any>('get_system_info').catch(() => ({}));
          setTestResult(prev => ({ ...prev, ffmpeg: info.ffmpeg_path ? '✓ Found' : '✗ Not found' }));
          break;
        }
        case 'ytdlp': {
          const info = await invoke<any>('get_system_info').catch(() => ({}));
          setTestResult(prev => ({ ...prev, ytdlp: info.ytdlp_installed ? '✓ Found' : '✗ Not found — pip install yt-dlp' }));
          break;
        }
      }
    } catch {
      setTestResult(prev => ({ ...prev, [service]: '✗ Failed' }));
    }
  };

  const resultColor = (r: string) =>
    r.startsWith('✓') ? C.success : r.startsWith('✗') ? C.error : C.muted;

  return (
    <div style={{ padding: 24, maxWidth: 720 }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24, gap: 12 }}>
        <h1 style={{ color: C.text, fontSize: 22, fontWeight: 800, flex: 1 }}>⚙️ Settings</h1>
        <button onClick={save} disabled={saving} style={btn(C.primary)}>
          {saving ? 'Saved ✓' : '💾 Save'}
        </button>
      </div>

      {/* Account */}
      <section style={section}>
        <h3 style={sectionTitle}>Account</h3>
        <Field label="Username">
          <input value={username} onChange={e => setUsername(e.target.value)} style={inputSt} />
        </Field>
      </section>

      {/* API */}
      <section style={section}>
        <h3 style={sectionTitle}>Server Connection</h3>
        <Field label="API Base URL">
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={apiUrl} onChange={e => setApiUrl(e.target.value)} style={{ ...inputSt, flex: 1 }} />
            <button onClick={() => testConnection('api')} style={btn(C.accent, 'transparent')}>Test</button>
          </div>
          {testResult.api && <span style={{ fontSize: 11, color: resultColor(testResult.api) }}>{testResult.api}</span>}
        </Field>
      </section>

      {/* LLM */}
      <section style={section}>
        <h3 style={sectionTitle}>AI / LLM Provider</h3>
        <Field label="Primary Provider">
          <select value={llmProvider} onChange={e => setLlmProvider(e.target.value)} style={{ ...inputSt, cursor: 'pointer' }}>
            {['local', 'openrouter', 'openai', 'groq', 'mistral', 'deepseek', 'cohere'].map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </Field>
        <Field label="Ollama Base URL">
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={ollamaUrl} onChange={e => setOllamaUrl(e.target.value)} style={{ ...inputSt, flex: 1 }} />
            <button onClick={() => testConnection('ollama')} style={btn(C.accent, 'transparent')}>Test</button>
          </div>
          {testResult.ollama && <span style={{ fontSize: 11, color: resultColor(testResult.ollama) }}>{testResult.ollama}</span>}
        </Field>
      </section>

      {/* System */}
      <section style={section}>
        <h3 style={sectionTitle}>System & Tools</h3>
        {[
          { key: 'ffmpeg', label: 'FFmpeg', note: 'Required for video processing. Install: brew install ffmpeg' },
          { key: 'ytdlp',  label: 'yt-dlp', note: 'Required for YouTube audio download. Install: pip install yt-dlp' },
        ].map(tool => (
          <Field key={tool.key} label={tool.label}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: C.muted, flex: 1 }}>{tool.note}</span>
              <button onClick={() => testConnection(tool.key)} style={btn(C.accent, 'transparent')}>Check</button>
              {testResult[tool.key] && (
                <span style={{ fontSize: 11, color: resultColor(testResult[tool.key]) }}>{testResult[tool.key]}</span>
              )}
            </div>
          </Field>
        ))}
      </section>

      {/* System Info */}
      {systemInfo && (
        <section style={section}>
          <h3 style={sectionTitle}>System Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              ['OS',           `${systemInfo.os} ${systemInfo.os_version}`],
              ['CPU',          `${systemInfo.cpu_brand} (${systemInfo.cpu_cores} cores)`],
              ['GPU',          `${systemInfo.gpu_name} (${systemInfo.gpu_vram_gb}GB VRAM)`],
              ['RAM',          `${systemInfo.total_ram_gb}GB total / ${systemInfo.free_ram_gb}GB free`],
              ['Disk Free',    `${systemInfo.disk_free_gb}GB`],
              ['Support Level',systemInfo.support_level],
            ].map(([label, value]) => (
              <div key={label as string} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 12px' }}>
                <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 12, color: C.text, fontWeight: 600 }}>{value}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* About */}
      <section style={{ ...section, borderBottom: 'none' }}>
        <h3 style={sectionTitle}>About</h3>
        <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.8 }}>
          <div>CutFlow v0.1.0</div>
          <div>The Looking Glass 3D LLC</div>
          <div>GitHub: <a href="https://github.com/serthrocken/cutflow" style={{ color: C.primary }} onClick={e => { e.preventDefault(); window.open('https://github.com/serthrocken/cutflow', '_blank'); }}>serthrocken/cutflow</a></div>
        </div>
      </section>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ color: C.text, fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────

const section: React.CSSProperties = {
  marginBottom:  20,
  paddingBottom: 20,
  borderBottom:  `1px solid #2A2A2A`,
};

const sectionTitle: React.CSSProperties = {
  color:         '#E0E0E0',
  fontSize:      14,
  fontWeight:    700,
  marginBottom:  14,
};

const inputSt: React.CSSProperties = {
  background:   '#222',
  border:       '1px solid #2A2A2A',
  borderRadius: 8,
  color:        '#E0E0E0',
  fontSize:     13,
  padding:      '8px 12px',
  outline:      'none',
  width:        '100%',
};

const btn = (color: string, bg?: string): React.CSSProperties => ({
  background:   bg !== undefined ? bg : color + '20',
  border:       `1px solid ${color}50`,
  borderRadius: 8, color, fontWeight: 700, fontSize: 13,
  padding:      '8px 14px', cursor: 'pointer', flexShrink: 0,
});
