// ============================================================
//  CutFlow Desktop — Setup Wizard View (first launch)
// ============================================================

import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { C }      from '../App';

const STEPS = [
  { id: 1, icon: '👋', title: 'Welcome to CutFlow',      desc: 'AI-powered video editing by The Looking Glass 3D' },
  { id: 2, icon: '🖥️', title: 'System Check',             desc: 'Verifying your hardware and installed tools' },
  { id: 3, icon: '🤖', title: 'AI Model Provider',        desc: 'Choose where to run your AI models' },
  { id: 4, icon: '🎵', title: 'Audio Library',             desc: 'Browse free music or connect streaming services' },
  { id: 5, icon: '💬', title: 'Messaging Platforms',      desc: 'Connect Discord, Telegram, WhatsApp, and more' },
  { id: 6, icon: '✅', title: 'Ready!',                   desc: 'Your CutFlow setup is complete' },
];

export default function SetupWizardView({ onComplete }: { onComplete: () => void }) {
  const [step,       setStep]       = useState(1);
  const [username,   setUsername]   = useState('');
  const [provider,   setProvider]   = useState('openrouter');
  const [sysInfo,    setSysInfo]    = useState<any>(null);
  const [loading,    setLoading]    = useState(false);

  const runSystemCheck = async () => {
    setLoading(true);
    try {
      const info = await invoke<any>('get_system_info');
      setSysInfo(info);
    } catch { setSysInfo({ error: true }); }
    setLoading(false);
  };

  const handleNext = async () => {
    if (step === 1 && !username.trim()) return;
    if (step === 2) await runSystemCheck();
    if (step < STEPS.length) {
      setStep(s => s + 1);
    } else {
      // Save setup
      localStorage.setItem('username', username.trim());
      localStorage.setItem('user_id',  `desktop_${Date.now()}`);
      localStorage.setItem('llm_provider', provider);
      onComplete();
    }
  };

  const current = STEPS[step - 1];

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40 }}>

      {/* Progress */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 40, width: 360 }}>
        {STEPS.map(s => (
          <div key={s.id} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: s.id <= step ? C.primary : C.border,
            transition: 'background 0.3s',
          }} />
        ))}
      </div>

      {/* Step card */}
      <div style={{
        background:   C.surface, border: `1px solid ${C.border}`,
        borderRadius: 20, padding: 40, width: 480, textAlign: 'center',
      }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>{current.icon}</div>
        <h2 style={{ color: C.text, fontSize: 24, fontWeight: 800, marginBottom: 8 }}>{current.title}</h2>
        <p style={{ color: C.muted, fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>{current.desc}</p>

        {/* Step 1: username */}
        {step === 1 && (
          <input
            value={username} onChange={e => setUsername(e.target.value)}
            placeholder="Enter your username"
            style={{ width: '100%', background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 16, padding: '12px 16px', outline: 'none', marginBottom: 8, textAlign: 'center' }}
            onKeyDown={e => e.key === 'Enter' && handleNext()}
            autoFocus
          />
        )}

        {/* Step 2: system check */}
        {step === 2 && (
          <div>
            {loading ? (
              <p style={{ color: C.muted }}>Scanning system...</p>
            ) : sysInfo && !sysInfo.error ? (
              <div style={{ textAlign: 'left', marginBottom: 8 }}>
                {[
                  ['GPU',    `${sysInfo.gpu_name} (${sysInfo.gpu_vram_gb}GB)`, sysInfo.gpu_vram_gb >= 12],
                  ['CPU',    sysInfo.cpu_brand, true],
                  ['RAM',    `${sysInfo.total_ram_gb}GB`, sysInfo.total_ram_gb >= 16],
                  ['FFmpeg', sysInfo.ffmpeg_installed ? 'Found' : 'Not found — install ffmpeg', sysInfo.ffmpeg_installed],
                  ['Ollama', sysInfo.ollama_installed ? 'Found' : 'Not found — install ollama', true],
                  ['yt-dlp', sysInfo.ytdlp_installed  ? 'Found' : 'Not found — pip install yt-dlp', true],
                ].map(([label, value, ok]) => (
                  <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${C.border}` }}>
                    <span style={{ color: C.muted, fontSize: 13 }}>{label}</span>
                    <span style={{ color: (ok as boolean) ? C.success : C.warning, fontSize: 13, fontWeight: 600 }}>{value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: C.muted }}>Click Next to scan your system.</p>
            )}
          </div>
        )}

        {/* Step 3: LLM provider */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'left' }}>
            {[
              { id: 'local',       label: 'Local (Ollama)',  desc: 'Run models offline. Needs RTX 3060+', icon: '🖥️' },
              { id: 'openrouter',  label: 'OpenRouter',      desc: '100+ models, cheapest cloud option',  icon: '🚀' },
              { id: 'openai',      label: 'OpenAI',          desc: 'GPT-4, reliable, higher cost',        icon: '🤖' },
              { id: 'groq',        label: 'Groq',            desc: 'Ultra-fast, free tier available',     icon: '⚡' },
            ].map(p => (
              <div key={p.id} onClick={() => setProvider(p.id)} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                background:   provider === p.id ? C.primary + '15' : C.card,
                border:       `1px solid ${provider === p.id ? C.primary : C.border}`,
                borderRadius: 10, cursor: 'pointer',
              }}>
                <span style={{ fontSize: 20 }}>{p.icon}</span>
                <div>
                  <div style={{ color: provider === p.id ? C.primary : C.text, fontWeight: 700, fontSize: 14 }}>{p.label}</div>
                  <div style={{ color: C.muted, fontSize: 12 }}>{p.desc}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Step 4: Audio library info */}
        {step === 4 && (
          <div style={{ textAlign: 'left' }}>
            <p style={{ color: C.muted, fontSize: 13, marginBottom: 12 }}>CutFlow includes a built-in royalty-free library. You can also search:</p>
            {['🎵 YouTube Music', '🟢 Spotify', '🍎 Apple Music', '📦 Amazon Music', '☁️ SoundCloud', '🌊 Tidal'].map(s => (
              <div key={s} style={{ padding: '6px 0', borderBottom: `1px solid ${C.border}`, color: C.text, fontSize: 13 }}>{s}</div>
            ))}
            <p style={{ color: C.muted, fontSize: 11, marginTop: 10 }}>
              External music requires your subscription. CutFlow provides deep-links to open in native apps.
              Royalty-free library is completely free (CC0 license).
            </p>
          </div>
        )}

        {/* Step 5: Messaging */}
        {step === 5 && (
          <div style={{ textAlign: 'left' }}>
            <p style={{ color: C.muted, fontSize: 13, marginBottom: 12 }}>CutFlow supports 14 messaging platforms. Configure them in Settings → Messaging after setup.</p>
            {[
              '💬 Discord', '✈️ Telegram', '💚 WhatsApp', '📱 SMS/RCS (Native — no Twilio)',
              '🍎 iMessage (macOS)', '🔗 Slack', '🔐 Signal', '📧 Email',
              '📸 Instagram DM', '👤 Messenger', '✖️ X / Twitter', '💚 LINE', '💜 Viber', '🟢 WeChat',
            ].map(s => (
              <div key={s} style={{ padding: '5px 0', fontSize: 13, color: C.text, borderBottom: `1px solid ${C.border}` }}>{s}</div>
            ))}
          </div>
        )}

        {/* Step 6: Done */}
        {step === 6 && (
          <div>
            <p style={{ color: C.text, fontSize: 15, marginBottom: 12 }}>Welcome, <strong style={{ color: C.primary }}>{username}</strong>!</p>
            <p style={{ color: C.muted, fontSize: 13 }}>CutFlow is ready. Start editing, install skills from the Marketplace, or connect your messaging platforms.</p>
          </div>
        )}
      </div>

      {/* Nav buttons */}
      <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
        {step > 1 && (
          <button onClick={() => setStep(s => s - 1)} style={{
            background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 10,
            color: C.muted, fontWeight: 600, fontSize: 14, padding: '12px 24px', cursor: 'pointer',
          }}>
            ← Back
          </button>
        )}
        <button
          onClick={handleNext}
          disabled={step === 1 && !username.trim() || loading}
          style={{
            background:   C.primary + (step === 1 && !username.trim() ? '40' : ''),
            border:       'none',
            borderRadius: 10,
            color:        '#0F0F0F',
            fontWeight:   800,
            fontSize:     15,
            padding:      '12px 36px',
            cursor:       step === 1 && !username.trim() ? 'not-allowed' : 'pointer',
          }}
        >
          {step === STEPS.length ? "🚀 Start CutFlow!" : loading ? '...' : 'Next →'}
        </button>
      </div>

      <p style={{ color: C.border, fontSize: 11, marginTop: 20 }}>
        Step {step} of {STEPS.length}
      </p>
    </div>
  );
}
