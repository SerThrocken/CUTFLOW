// ============================================================
//  CutFlow Desktop — Editor View
//  Full-featured timeline editor using Tauri native APIs
//  for FFmpeg processing, file access, and GPU acceleration
// ============================================================

import React, { useState, useRef, useEffect } from 'react';
import { invoke }         from '@tauri-apps/api/core';
import { open, save }     from '@tauri-apps/plugin-dialog';
import { listen }         from '@tauri-apps/api/event';
import axios              from 'axios';
import { C }              from '../App';

const API          = 'http://localhost:3000';
const VIDEO_ENGINE = 'http://localhost:5000';

interface Clip {
  id:          string;
  path:        string;
  name:        string;
  durationSec: number;
  startSec:    number;
  track:       number;
  volume:      number;
  muted:       boolean;
  type:        'video' | 'audio';
  hasAudio:    boolean;
  codec:       string;
  audioCodec:  string;
}

type Panel = null | 'color' | 'audio' | 'transitions' | 'text' | 'ai' | 'export';

const COLOR_PRESETS = [
  { id: 'neutral',   label: 'Neutral',   thumb: 'linear-gradient(to right, #888, #aaa)' },
  { id: 'cinematic', label: 'Cinematic', thumb: 'linear-gradient(to right, #d4a57a, #2a3a4a)' },
  { id: 'warm',      label: 'Warm',      thumb: 'linear-gradient(to right, #ff9a44, #fc6076)' },
  { id: 'cool',      label: 'Cool',      thumb: 'linear-gradient(to right, #4facfe, #00f2fe)' },
  { id: 'vintage',   label: 'Vintage',   thumb: 'linear-gradient(to right, #c8965b, #7a5a3a)' },
  { id: 'matte',     label: 'Matte',     thumb: 'linear-gradient(to right, #9a9a9a, #5a5a6a)' },
  { id: 'vivid',     label: 'Vivid',     thumb: 'linear-gradient(to right, #ff6fd8, #3813c2)' },
  { id: 'bw',        label: 'B&W',       thumb: 'linear-gradient(to right, #000, #fff)' },
];

const TRANSITION_TYPES = [
  { id: 'fade',     label: 'Fade',     icon: '👻' },
  { id: 'slide',    label: 'Slide',    icon: '↗️' },
  { id: 'wipe',     label: 'Wipe',     icon: '🧹' },
  { id: 'dissolve', label: 'Dissolve', icon: '💧' },
  { id: 'zoom',     label: 'Zoom',     icon: '🔍' },
];

export default function EditorView() {
  const [clips,          setClips]          = useState<Clip[]>([]);
  const [selected,       setSelected]       = useState<Clip | null>(null);
  const [panel,          setPanel]          = useState<Panel>(null);
  const [rendering,      setRendering]      = useState(false);
  const [renderPct,      setRenderPct]      = useState(0);
  const [colorPreset,    setColorPreset]    = useState('neutral');
  const [transType,      setTransType]      = useState('fade');
  const [transDuration,  setTransDuration]  = useState(1.0);
  const [bgMusicPath,    setBgMusicPath]    = useState('');
  const [bgMusicVol,     setBgMusicVol]     = useState(0.3);
  const [duckEnabled,    setDuckEnabled]    = useState(true);
  const [aiLoading,      setAiLoading]      = useState(false);
  const [scriptText,     setScriptText]     = useState('');

  const userId   = localStorage.getItem('user_id')  || 'unknown';
  const username = localStorage.getItem('username') || 'user';

  useEffect(() => {
    const unlisten = listen<any>('render-progress', e => {
      setRenderPct(e.payload.progress || 0);
    });
    return () => { unlisten.then(f => f()); };
  }, []);

  // ── Import Files ─────────────────────────────────────────

  const importFiles = async () => {
    const paths = await open({
      multiple: true,
      filters: [
        { name: 'Video & Audio', extensions: ['mp4', 'mov', 'mkv', 'avi', 'webm', 'mp3', 'wav', 'aac', 'm4a'] },
      ],
    }) as string[] | null;

    if (!paths?.length) return;

    for (const filePath of paths) {
      try {
        // Use Tauri to probe video info
        const info = await invoke<any>('get_video_info', { path: filePath });
        const name = filePath.split(/[\\/]/).pop() || 'clip';
        const isAudio = info.codec === '' || filePath.match(/\.(mp3|wav|aac|m4a|ogg|flac)$/i);

        const clip: Clip = {
          id:          `clip_${Date.now()}_${Math.random()}`,
          path:        filePath,
          name,
          durationSec: info.duration_secs || 30,
          startSec:    isAudio ? 0 : clips.filter(c => c.track === 0)
                         .reduce((s, c) => Math.max(s, c.startSec + c.durationSec), 0),
          track:       isAudio ? 1 : 0,
          volume:      isAudio ? 0.3 : 1.0,
          muted:       false,
          type:        isAudio ? 'audio' : 'video',
          hasAudio:    info.has_audio,
          codec:       info.codec,
          audioCodec:  info.audio_codec,
        };

        setClips(prev => [...prev, clip]);
      } catch (err) {
        console.error('Import error:', err);
      }
    }
  };

  const importBgMusic = async () => {
    const path = await open({
      multiple: false,
      filters: [{ name: 'Audio', extensions: ['mp3', 'wav', 'aac', 'm4a', 'flac', 'ogg'] }],
    }) as string | null;
    if (path) setBgMusicPath(path);
  };

  // ── Render Pipeline ───────────────────────────────────────

  const exportVideo = async () => {
    const outputPath = await save({
      defaultPath: `cutflow_export_${Date.now()}.mp4`,
      filters: [{ name: 'Video', extensions: ['mp4'] }],
    });

    if (!outputPath) return;

    setRendering(true);
    setRenderPct(0);

    try {
      const videoClips = clips.filter(c => c.track === 0);
      if (videoClips.length === 0) { alert('Add at least one video clip.'); setRendering(false); return; }

      // Step 1: Concatenate video clips
      setRenderPct(20);
      const concatRes = await axios.post(`${VIDEO_ENGINE}/api/video/concatenate`, {
        user_id:    userId,
        video_list: videoClips.map(c => c.path),
      });
      let workingFile = concatRes.data.output_video;

      // Step 2: Color grading
      if (colorPreset !== 'neutral') {
        setRenderPct(40);
        const colorRes = await axios.post(`${VIDEO_ENGINE}/api/video/color-grade`, {
          user_id:    userId,
          input_video: workingFile,
          preset:     colorPreset,
        });
        workingFile = colorRes.data.output_video;
      }

      // Step 3: Mix background music
      if (bgMusicPath) {
        setRenderPct(60);
        const mixRes = await axios.post(`${API}/api/audio/mix`, {
          userId,
          videoPath:        workingFile,
          musicPath:        bgMusicPath,
          outputPath:       workingFile.replace('.mp4', '_mixed.mp4'),
          backgroundVolume: bgMusicVol,
          duckingEnabled:   duckEnabled,
        });
        workingFile = mixRes.data.outputPath;
      }

      // Step 4: Move to final output path
      setRenderPct(80);
      await invoke('run_ffmpeg', {
        input:  workingFile,
        output: outputPath,
        args:   ['-c', 'copy'],
      });

      setRenderPct(100);
      setTimeout(() => { setRendering(false); setRenderPct(0); }, 1500);
      alert(`✅ Export complete!\n${outputPath}`);
    } catch (err: any) {
      setRendering(false);
      alert(`Export failed: ${err.message}`);
    }
  };

  // ── AI Features ───────────────────────────────────────────

  const generateScript = async () => {
    const prompt = window.prompt('Describe your video:');
    if (!prompt) return;
    setAiLoading(true);
    try {
      const res = await axios.post(`${API}/api/scripts/generate`, { userId, prompt });
      setScriptText(res.data.script);
      setPanel('ai');
    } catch (err: any) { alert(`Script failed: ${err.message}`); }
    setAiLoading(false);
  };

  const detectScenes = async () => {
    const videoClips = clips.filter(c => c.type === 'video');
    if (!videoClips.length) { alert('Add a video clip first.'); return; }
    try {
      const res = await axios.post(`${VIDEO_ENGINE}/api/video/detect-scenes`, {
        user_id:    userId,
        input_video: videoClips[0].path,
      });
      alert(`Detected ${res.data.scenes?.length || 0} scenes.`);
    } catch (err: any) { alert(`Scene detection failed: ${err.message}`); }
  };

  // ── Timeline helpers ──────────────────────────────────────

  const totalDuration = clips
    .filter(c => c.track === 0)
    .reduce((max, c) => Math.max(max, c.startSec + c.durationSec), 0);

  const TRACK_LABELS  = ['🎥 Video', '🎵 BG Music', '🔊 SFX', '🎙️ Voiceover'];
  const TRACK_COLORS  = [C.primary, C.accent, '#A855F7', '#3B82F6'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 8, padding: '10px 16px', borderBottom: `1px solid ${C.border}`, alignItems: 'center', flexShrink: 0 }}>
        <button onClick={importFiles}     style={tb(C.primary)}>📂 Import</button>
        <button onClick={generateScript}  style={tb(C.accent)}  disabled={aiLoading}>{aiLoading ? '...' : '📝 Script'}</button>
        <button onClick={detectScenes}    style={tb('#A855F7')}>🎬 Scenes</button>
        <button onClick={() => setPanel(p => p === 'color'       ? null : 'color')}       style={tb(panel === 'color'       ? C.primary : C.muted)}>🎨 Color</button>
        <button onClick={() => setPanel(p => p === 'transitions' ? null : 'transitions')} style={tb(panel === 'transitions' ? C.primary : C.muted)}>↔️ Transitions</button>
        <button onClick={() => setPanel(p => p === 'audio'       ? null : 'audio')}       style={tb(panel === 'audio'       ? C.primary : C.muted)}>🎵 Audio</button>
        <div style={{ flex: 1 }} />
        <span style={{ color: C.muted, fontSize: 12 }}>{totalDuration.toFixed(1)}s</span>
        {rendering ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.primary, fontSize: 13 }}>
            <div style={{ width: 80, height: 4, background: C.border, borderRadius: 2 }}>
              <div style={{ width: `${renderPct}%`, height: '100%', background: C.primary, borderRadius: 2, transition: 'width 0.3s' }} />
            </div>
            {renderPct}%
          </div>
        ) : (
          <button onClick={exportVideo} style={{ ...tb(C.primary), padding: '8px 18px', fontWeight: 800 }}>
            ▶ Export
          </button>
        )}
      </div>

      {/* Panel + Timeline layout */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Side panel */}
        {panel && (
          <div style={{ width: 280, borderRight: `1px solid ${C.border}`, padding: 16, overflow: 'auto', flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ color: C.text, fontSize: 14, fontWeight: 700 }}>
                {panel === 'color' ? '🎨 Color Grade' : panel === 'transitions' ? '↔️ Transitions' : panel === 'audio' ? '🎵 Audio Mix' : '📝 AI Script'}
              </h3>
              <button onClick={() => setPanel(null)} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 18 }}>✕</button>
            </div>

            {panel === 'color' && (
              <div>
                <p style={{ color: C.muted, fontSize: 12, marginBottom: 12 }}>Select a color grading preset:</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {COLOR_PRESETS.map(preset => (
                    <div
                      key={preset.id}
                      onClick={() => setColorPreset(preset.id)}
                      style={{
                        borderRadius: 8,
                        border: `2px solid ${colorPreset === preset.id ? C.primary : C.border}`,
                        overflow: 'hidden',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ height: 48, background: preset.thumb }} />
                      <div style={{ padding: '6px 8px', background: C.card, fontSize: 11, color: colorPreset === preset.id ? C.primary : C.text, fontWeight: 600 }}>
                        {preset.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {panel === 'transitions' && (
              <div>
                <p style={{ color: C.muted, fontSize: 12, marginBottom: 12 }}>Default transition between clips:</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                  {TRANSITION_TYPES.map(t => (
                    <div
                      key={t.id}
                      onClick={() => setTransType(t.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                        background: transType === t.id ? C.primary + '15' : C.card,
                        border: `1px solid ${transType === t.id ? C.primary : C.border}`,
                        color: transType === t.id ? C.primary : C.text, fontWeight: 600, fontSize: 13,
                      }}
                    >
                      <span style={{ fontSize: 18 }}>{t.icon}</span> {t.label}
                    </div>
                  ))}
                </div>
                <label style={{ color: C.text, fontSize: 12, display: 'block', marginBottom: 6 }}>
                  Duration: {transDuration.toFixed(1)}s
                </label>
                <input type="range" min={0.2} max={3} step={0.1} value={transDuration}
                  onChange={e => setTransDuration(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: C.primary }} />
              </div>
            )}

            {panel === 'audio' && (
              <div>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ color: C.text, fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>Background Music</label>
                  <button onClick={importBgMusic} style={{ ...tb(C.accent), width: '100%', justifyContent: 'center', marginBottom: 8 }}>
                    {bgMusicPath ? '🎵 ' + bgMusicPath.split(/[\\/]/).pop() : '📂 Choose Audio File'}
                  </button>
                  {bgMusicPath && (
                    <>
                      <label style={{ color: C.muted, fontSize: 11, display: 'block', marginBottom: 4 }}>
                        Background Volume: {Math.round(bgMusicVol * 100)}%
                      </label>
                      <input type="range" min={0} max={1} step={0.05} value={bgMusicVol}
                        onChange={e => setBgMusicVol(parseFloat(e.target.value))}
                        style={{ width: '100%', accentColor: C.primary, marginBottom: 10 }} />
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ color: C.text, fontSize: 12 }}>Auto-Duck During Speech</span>
                        <input type="checkbox" checked={duckEnabled} onChange={e => setDuckEnabled(e.target.checked)}
                          style={{ accentColor: C.primary }} />
                      </div>
                    </>
                  )}
                </div>
                <button onClick={() => window.open('http://localhost:3000/#audio-library', '_blank')}
                  style={{ ...tb(C.primary), width: '100%', justifyContent: 'center' }}>
                  🎵 Browse Royalty-Free Library
                </button>
              </div>
            )}

            {panel === 'ai' && scriptText && (
              <div>
                <p style={{ color: C.muted, fontSize: 11, marginBottom: 8 }}>Generated Script:</p>
                <textarea
                  value={scriptText}
                  onChange={e => setScriptText(e.target.value)}
                  style={{ width: '100%', height: 300, background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 12, padding: 10, resize: 'vertical', outline: 'none' }}
                />
                <button
                  onClick={() => invoke<any>('run_ffmpeg', {}).catch(() => {})}
                  style={{ ...tb(C.primary), width: '100%', marginTop: 8, justifyContent: 'center' }}>
                  🎙️ Generate Voiceover from Script
                </button>
              </div>
            )}
          </div>
        )}

        {/* Timeline */}
        <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
          {clips.length === 0 ? (
            <div onClick={importFiles} style={{
              border: `2px dashed ${C.border}`, borderRadius: 14,
              padding: 60, textAlign: 'center', cursor: 'pointer',
              color: C.muted, transition: 'border-color 0.15s',
            }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = C.primary)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}
            >
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎬</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 6 }}>Drop or Import Files</div>
              <div style={{ fontSize: 12 }}>MP4, MOV, MKV, AVI, MP3, WAV, AAC and more</div>
            </div>
          ) : (
            <div>
              {[0, 1, 2, 3].map(trackNum => {
                const trackClips = clips.filter(c => c.track === trackNum);
                return (
                  <div key={trackNum} style={{ display: 'flex', alignItems: 'center', marginBottom: 8, gap: 10 }}>
                    <div style={{ width: 90, fontSize: 11, color: TRACK_COLORS[trackNum], fontWeight: 700, flexShrink: 0 }}>
                      {TRACK_LABELS[trackNum]}
                    </div>
                    <div style={{ flex: 1, background: C.card, borderRadius: 8, border: `1px solid ${C.border}`, minHeight: 52, display: 'flex', alignItems: 'center', padding: '4px 8px', gap: 6, overflowX: 'auto' }}>
                      {trackClips.length === 0 ? (
                        <span style={{ color: C.border, fontSize: 12 }}>Empty — drag clips here</span>
                      ) : (
                        trackClips.map(clip => (
                          <div
                            key={clip.id}
                            onClick={() => setSelected(selected?.id === clip.id ? null : clip)}
                            style={{
                              background:   TRACK_COLORS[trackNum] + '25',
                              border:       `1px solid ${selected?.id === clip.id ? TRACK_COLORS[trackNum] : TRACK_COLORS[trackNum] + '60'}`,
                              borderRadius: 6,
                              padding:      '6px 10px',
                              cursor:       'pointer',
                              minWidth:     Math.max(80, clip.durationSec * 12),
                              maxWidth:     300,
                              flexShrink:   0,
                            }}
                          >
                            <div style={{ fontSize: 11, color: C.text, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {clip.muted ? '🔇 ' : ''}{clip.name}
                            </div>
                            <div style={{ fontSize: 10, color: C.muted, display: 'flex', gap: 6, marginTop: 2 }}>
                              <span>{clip.durationSec.toFixed(1)}s</span>
                              {clip.type === 'video' && clip.hasAudio && <span style={{ color: C.success }}>🔊</span>}
                              {clip.type === 'video' && !clip.hasAudio && <span style={{ color: C.muted }}>🔇</span>}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Selected clip controls */}
              {selected && (
                <div style={{ marginTop: 16, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <span style={{ color: C.text, fontWeight: 700, fontSize: 13 }}>{selected.name}</span>
                    {selected.hasAudio && <span style={{ color: C.success, fontSize: 11 }}>✓ Has audio ({selected.audioCodec})</span>}
                    {!selected.hasAudio && selected.type === 'video' && <span style={{ color: C.warning, fontSize: 11 }}>⚠️ No audio track</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setClips(prev => prev.map(c => c.id === selected.id ? { ...c, muted: !c.muted } : c))}
                      style={tb(C.muted, 'transparent')}>
                      {selected.muted ? '🔊 Unmute' : '🔇 Mute'}
                    </button>
                    <button onClick={() => { setClips(prev => prev.filter(c => c.id !== selected.id)); setSelected(null); }}
                      style={tb(C.error, 'transparent')}>
                      🗑 Delete
                    </button>
                    {selected.type === 'video' && (
                      <button
                        onClick={async () => {
                          try {
                            const res = await invoke<any>('get_video_info', { path: selected.path });
                            alert(`Codec: ${res.codec}\nAudio: ${res.has_audio ? res.audio_codec + ', ' + res.sample_rate + 'Hz' : 'None'}\nDuration: ${res.duration_secs?.toFixed(2)}s`);
                          } catch (e: any) { alert(e.message); }
                        }}
                        style={tb(C.accent, 'transparent')}>
                        ℹ️ Info
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const tb = (color: string, bg?: string): React.CSSProperties => ({
  background:   bg !== undefined ? bg : color + '20',
  border:       `1px solid ${color}50`,
  borderRadius: 7,
  color,
  fontWeight:   600,
  fontSize:     12,
  padding:      '7px 12px',
  cursor:       'pointer',
  display:      'flex',
  alignItems:   'center',
  gap:          5,
  flexShrink:   0,
});
