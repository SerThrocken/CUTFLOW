// ============================================================
//  CutFlow Desktop — Messaging View
//  Shows all platform connection statuses and lets the user
//  configure each adapter, view incoming messages per user,
//  and manually send a video or text to any platform user.
// ============================================================

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { C }  from '../App';

const MSG_API = 'http://localhost:3003';
const API     = 'http://localhost:3000';

interface PlatformStatus {
  platform:  string;
  name:      string;
  icon:      string;
  connected: boolean;
}

const PLATFORM_DOCS: Record<string, { setupUrl: string; noKey: boolean; nativeNote?: string }> = {
  discord:   { setupUrl: 'https://discord.com/developers/applications', noKey: false },
  telegram:  { setupUrl: 'https://t.me/botfather',                      noKey: false },
  whatsapp:  { setupUrl: 'https://developers.facebook.com/apps',        noKey: false },
  sms:       { setupUrl: '',  noKey: true,  nativeNote: 'Uses native OS SMS. No API key needed.' },
  imessage:  { setupUrl: '',  noKey: true,  nativeNote: 'macOS only. Grant Full Disk Access to CutFlow.' },
  slack:     { setupUrl: 'https://api.slack.com/apps',                   noKey: false },
  signal:    { setupUrl: 'https://github.com/AsamK/signal-cli',          noKey: true, nativeNote: 'Run: signal-cli -u +1XXX register' },
  email:     { setupUrl: '',  noKey: false },
  instagram: { setupUrl: 'https://developers.facebook.com/apps',        noKey: false },
  messenger: { setupUrl: 'https://developers.facebook.com/apps',        noKey: false },
  twitter:   { setupUrl: 'https://developer.twitter.com/en/portal',     noKey: false },
  line:      { setupUrl: 'https://developers.line.biz/console',          noKey: false },
  viber:     { setupUrl: 'https://partners.viber.com',                   noKey: false },
  wechat:    { setupUrl: 'https://mp.weixin.qq.com',                     noKey: false },
};

export default function MessagingView() {
  const [platforms,  setPlatforms]  = useState<PlatformStatus[]>([]);
  const [expanded,   setExpanded]   = useState<string | null>(null);
  const [configs,    setConfigs]    = useState<Record<string, Record<string, string>>>({});
  const [loading,    setLoading]    = useState(true);
  const [sendTo,     setSendTo]     = useState('');
  const [sendPlatform, setSendPlatform] = useState('discord');
  const [sendText,   setSendText]   = useState('');

  useEffect(() => { fetchStatus(); }, []);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${MSG_API}/api/messaging/status`, { timeout: 5000 });
      setPlatforms(res.data.platforms || []);
    } catch {
      setPlatforms([
        { platform: 'discord',   name: 'Discord',         icon: '💬', connected: false },
        { platform: 'telegram',  name: 'Telegram',        icon: '✈️',  connected: false },
        { platform: 'whatsapp',  name: 'WhatsApp',        icon: '💚', connected: false },
        { platform: 'sms',       name: 'SMS / RCS',       icon: '📱', connected: false },
        { platform: 'imessage',  name: 'iMessage',        icon: '🍎', connected: false },
        { platform: 'slack',     name: 'Slack',           icon: '🔗', connected: false },
        { platform: 'signal',    name: 'Signal',          icon: '🔐', connected: false },
        { platform: 'email',     name: 'Email',           icon: '📧', connected: false },
        { platform: 'instagram', name: 'Instagram DM',    icon: '📸', connected: false },
        { platform: 'messenger', name: 'Messenger',       icon: '👤', connected: false },
        { platform: 'twitter',   name: 'X / Twitter DM',  icon: '✖️',  connected: false },
        { platform: 'line',      name: 'LINE',            icon: '💚', connected: false },
        { platform: 'viber',     name: 'Viber',           icon: '💜', connected: false },
        { platform: 'wechat',    name: 'WeChat',          icon: '🟢', connected: false },
      ]);
    }
    setLoading(false);
  };

  const saveConfig = async (platformId: string) => {
    try {
      await axios.post(`${MSG_API}/api/messaging/configure`, {
        platform: platformId, credentials: configs[platformId] || {},
      });
      alert(`${platformId} configuration saved. Restart messaging service to apply.`);
      fetchStatus();
    } catch (err: any) { alert(`Error: ${err.message}`); }
  };

  const sendMessage = async () => {
    if (!sendTo || !sendText) return;
    try {
      await axios.post(`${API}/api/messaging/deliver`, {
        platform: sendPlatform, platformId: sendTo, type: 'text', content: sendText,
      });
      setSendText('');
      alert('Message sent!');
    } catch (err: any) { alert(`Send failed: ${err.message}`); }
  };

  const updateField = (platform: string, key: string, value: string) =>
    setConfigs(prev => ({ ...prev, [platform]: { ...(prev[platform] || {}), [key]: value } }));

  const connectedCount = platforms.filter(p => p.connected).length;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20, gap: 12 }}>
        <h1 style={{ color: C.text, fontSize: 22, fontWeight: 800, flex: 1 }}>💬 Messaging Platforms</h1>
        <button onClick={fetchStatus} style={btn(C.muted, 'transparent')}>🔄 Refresh</button>
      </div>

      {/* Summary */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 16px' }}>
          <div style={{ fontSize: 11, color: C.muted }}>Connected</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.primary }}>{connectedCount}</div>
        </div>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 16px' }}>
          <div style={{ fontSize: 11, color: C.muted }}>Available</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>{platforms.length}</div>
        </div>
      </div>

      {/* Manual Send */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, marginBottom: 24 }}>
        <h3 style={{ color: C.text, fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Send Message</h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select value={sendPlatform} onChange={e => setSendPlatform(e.target.value)}
            style={{ background: '#222', border: `1px solid #2A2A2A`, borderRadius: 7, color: C.text, fontSize: 13, padding: '7px 10px', outline: 'none' }}>
            {platforms.map(p => <option key={p.platform} value={p.platform}>{p.icon} {p.name}</option>)}
          </select>
          <input value={sendTo} onChange={e => setSendTo(e.target.value)}
            placeholder="User ID / Phone / Email"
            style={{ flex: 1, background: '#222', border: `1px solid #2A2A2A`, borderRadius: 7, color: C.text, fontSize: 13, padding: '7px 10px', outline: 'none', minWidth: 150 }}
          />
          <input value={sendText} onChange={e => setSendText(e.target.value)}
            placeholder="Message text"
            style={{ flex: 2, background: '#222', border: `1px solid #2A2A2A`, borderRadius: 7, color: C.text, fontSize: 13, padding: '7px 10px', outline: 'none', minWidth: 200 }}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
          />
          <button onClick={sendMessage} disabled={!sendTo || !sendText} style={btn(C.primary)}>Send</button>
        </div>
      </div>

      {/* Platform List */}
      {loading ? (
        <div style={{ color: C.muted, textAlign: 'center', paddingTop: 40 }}>Loading platforms...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {platforms.map(p => {
            const isExpanded = expanded === p.platform;
            const docs       = PLATFORM_DOCS[p.platform] || {};
            const cfg        = configs[p.platform] || {};

            return (
              <div key={p.platform} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
                {/* Header */}
                <div
                  onClick={() => setExpanded(isExpanded ? null : p.platform)}
                  style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', cursor: 'pointer', gap: 12 }}
                >
                  <span style={{ fontSize: 22 }}>{p.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: C.text, fontWeight: 700, fontSize: 14 }}>{p.name}</div>
                    {docs.nativeNote && (
                      <div style={{ color: C.primary, fontSize: 11, marginTop: 2 }}>{docs.nativeNote}</div>
                    )}
                  </div>
                  <div style={{ width: 8, height: 8, borderRadius: 4, background: p.connected ? C.success : C.border }} />
                  <span style={{ color: p.connected ? C.success : C.muted, fontSize: 12, fontWeight: 700 }}>
                    {p.connected ? 'Connected' : 'Not connected'}
                  </span>
                  <span style={{ color: C.muted, fontSize: 14 }}>{isExpanded ? '▲' : '▼'}</span>
                </div>

                {/* Config panel */}
                {isExpanded && (
                  <div style={{ borderTop: `1px solid ${C.border}`, padding: 16, background: '#151515' }}>
                    {docs.noKey ? (
                      <div style={{ background: C.primary + '15', border: `1px solid ${C.primary}30`, borderRadius: 8, padding: '10px 14px', marginBottom: 12 }}>
                        <span style={{ color: C.primary, fontSize: 13 }}>ℹ️ {docs.nativeNote}</span>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
                        {getCredentialFields(p.platform).map(field => (
                          <div key={field.key}>
                            <label style={{ color: C.text, fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{field.label}</label>
                            <input
                              type={field.secret ? 'password' : 'text'}
                              value={cfg[field.key] || ''}
                              onChange={e => updateField(p.platform, field.key, e.target.value)}
                              placeholder={`Enter ${field.label}`}
                              style={{ width: '100%', background: '#222', border: `1px solid #2A2A2A`, borderRadius: 7, color: C.text, fontSize: 13, padding: '7px 10px', outline: 'none' }}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 8 }}>
                      {docs.setupUrl && (
                        <button onClick={() => window.open(docs.setupUrl, '_blank')} style={btn(C.muted, 'transparent')}>
                          📖 Docs
                        </button>
                      )}
                      {!docs.noKey && (
                        <button onClick={() => saveConfig(p.platform)} style={btn(C.primary)}>
                          💾 Save & Apply
                        </button>
                      )}
                      <button
                        onClick={() => axios.post(`${MSG_API}/api/messaging/test`, { platform: p.platform }).then(() => alert('Connection OK!')).catch(() => alert('Test failed.'))}
                        style={btn(C.accent, 'transparent')}>
                        🔌 Test
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function getCredentialFields(platform: string): { key: string; label: string; secret: boolean }[] {
  const fields: Record<string, { key: string; label: string; secret: boolean }[]> = {
    discord:   [{ key: 'DISCORD_TOKEN',  label: 'Bot Token',  secret: true }, { key: 'DISCORD_APP_ID', label: 'App ID', secret: false }],
    telegram:  [{ key: 'TELEGRAM_TOKEN', label: 'Bot Token',  secret: true }],
    whatsapp:  [{ key: 'WHATSAPP_PHONE_NUMBER_ID', label: 'Phone Number ID', secret: false }, { key: 'WHATSAPP_ACCESS_TOKEN', label: 'Access Token', secret: true }],
    slack:     [{ key: 'SLACK_BOT_TOKEN', label: 'Bot Token', secret: true }, { key: 'SLACK_SIGNING_SECRET', label: 'Signing Secret', secret: true }],
    signal:    [{ key: 'SIGNAL_PHONE_NUMBER', label: 'Registered Phone', secret: false }],
    email:     [{ key: 'EMAIL_USER', label: 'Email Address', secret: false }, { key: 'EMAIL_PASS', label: 'Password / App Password', secret: true }],
    instagram: [{ key: 'INSTAGRAM_ACCESS_TOKEN', label: 'Access Token', secret: true }, { key: 'INSTAGRAM_PAGE_ID', label: 'Page ID', secret: false }],
    messenger: [{ key: 'MESSENGER_PAGE_TOKEN', label: 'Page Token', secret: true }, { key: 'MESSENGER_PAGE_ID', label: 'Page ID', secret: false }],
    twitter:   [{ key: 'TWITTER_BEARER_TOKEN', label: 'Bearer Token', secret: true }, { key: 'TWITTER_BOT_USER_ID', label: 'Bot User ID', secret: false }],
    line:      [{ key: 'LINE_ACCESS_TOKEN', label: 'Access Token', secret: true }, { key: 'LINE_CHANNEL_SECRET', label: 'Channel Secret', secret: true }],
    viber:     [{ key: 'VIBER_AUTH_TOKEN', label: 'Auth Token', secret: true }],
    wechat:    [{ key: 'WECHAT_APP_ID', label: 'App ID', secret: false }, { key: 'WECHAT_APP_SECRET', label: 'App Secret', secret: true }],
  };
  return fields[platform] || [];
}

const btn = (color: string, bg?: string): React.CSSProperties => ({
  background:   bg !== undefined ? bg : color + '20',
  border:       `1px solid ${color}50`,
  borderRadius: 8, color, fontWeight: 700, fontSize: 13,
  padding:      '8px 14px', cursor: 'pointer',
});
