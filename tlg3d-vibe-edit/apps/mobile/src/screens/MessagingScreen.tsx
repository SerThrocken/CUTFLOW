// ============================================================
//  CutFlow Mobile — Messaging Screen
//  Shows all connected messaging platforms and their status.
//  Lets user configure each platform, test connections,
//  and view recent message activity per platform.
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, TextInput, Alert, Linking, Platform as RNPlatform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../App';

// ── Platform registry ─────────────────────────────────────────

const PLATFORM_REGISTRY = [
  {
    id: 'discord', name: 'Discord', icon: '💬', color: '#5865F2',
    description: 'Bot commands + file sharing',
    configFields: [
      { key: 'DISCORD_TOKEN',  label: 'Bot Token',  type: 'password' },
      { key: 'DISCORD_APP_ID', label: 'Application ID', type: 'text' },
    ],
    setupUrl: 'https://discord.com/developers/applications',
    native:   false,
  },
  {
    id: 'telegram', name: 'Telegram', icon: '✈️', color: '#2AABEE',
    description: 'Bot API — send/receive video',
    configFields: [
      { key: 'TELEGRAM_TOKEN', label: 'Bot Token', type: 'password' },
    ],
    setupUrl: 'https://t.me/botfather',
    native:   false,
  },
  {
    id: 'whatsapp', name: 'WhatsApp', icon: '💚', color: '#25D366',
    description: 'Meta Cloud API — no third-party service',
    configFields: [
      { key: 'WHATSAPP_PHONE_NUMBER_ID', label: 'Phone Number ID', type: 'text' },
      { key: 'WHATSAPP_ACCESS_TOKEN',    label: 'Access Token',    type: 'password' },
    ],
    setupUrl: 'https://developers.facebook.com/apps',
    native:   false,
  },
  {
    id: 'sms', name: 'SMS / RCS', icon: '📱', color: COLORS.primary,
    description: 'Native OS SMS — no Twilio needed',
    configFields: [],
    setupUrl:   '',
    native:     true,
    nativeNote: 'Uses your device\'s SIM card via native OS API',
  },
  {
    id: 'imessage', name: 'iMessage', icon: '🍎', color: '#34AADC',
    description: 'Native macOS iMessage — desktop only',
    configFields: [],
    setupUrl:   '',
    native:     true,
    nativeNote: 'Requires macOS + Full Disk Access permission',
    desktopOnly: true,
  },
  {
    id: 'slack', name: 'Slack', icon: '🔗', color: '#4A154B',
    description: 'Workspace bot — slash commands',
    configFields: [
      { key: 'SLACK_BOT_TOKEN',      label: 'Bot Token',      type: 'password' },
      { key: 'SLACK_SIGNING_SECRET', label: 'Signing Secret', type: 'password' },
    ],
    setupUrl: 'https://api.slack.com/apps',
    native:   false,
  },
  {
    id: 'signal', name: 'Signal', icon: '🔐', color: '#3A76F0',
    description: 'signal-cli — encrypted, no API key',
    configFields: [
      { key: 'SIGNAL_PHONE_NUMBER', label: 'Registered Phone Number', type: 'text' },
    ],
    setupUrl: 'https://github.com/AsamK/signal-cli',
    native:   false,
  },
  {
    id: 'email', name: 'Email', icon: '📧', color: COLORS.accent,
    description: 'Gmail, Outlook, iCloud, any SMTP/IMAP',
    configFields: [
      { key: 'EMAIL_USER', label: 'Email Address', type: 'email' },
      { key: 'EMAIL_PASS', label: 'Password / App Password', type: 'password' },
    ],
    setupUrl: '',
    native:   false,
  },
  {
    id: 'instagram', name: 'Instagram DM', icon: '📸', color: '#C13584',
    description: 'Meta Messaging API',
    configFields: [
      { key: 'INSTAGRAM_ACCESS_TOKEN', label: 'Page Access Token', type: 'password' },
      { key: 'INSTAGRAM_PAGE_ID',      label: 'Page ID',           type: 'text' },
    ],
    setupUrl: 'https://developers.facebook.com/apps',
    native:   false,
  },
  {
    id: 'messenger', name: 'Messenger', icon: '👤', color: '#0084FF',
    description: 'Facebook Messenger Platform',
    configFields: [
      { key: 'MESSENGER_PAGE_TOKEN', label: 'Page Token', type: 'password' },
      { key: 'MESSENGER_PAGE_ID',    label: 'Page ID',    type: 'text' },
    ],
    setupUrl: 'https://developers.facebook.com/apps',
    native:   false,
  },
  {
    id: 'twitter', name: 'X / Twitter', icon: '✖️', color: '#000000',
    description: 'X API v2 Direct Messages',
    configFields: [
      { key: 'TWITTER_BEARER_TOKEN', label: 'Bearer Token', type: 'password' },
      { key: 'TWITTER_BOT_USER_ID',  label: 'Bot User ID',  type: 'text' },
    ],
    setupUrl: 'https://developer.twitter.com/en/portal/dashboard',
    native:   false,
  },
  {
    id: 'line', name: 'LINE', icon: '💚', color: '#06C755',
    description: 'LINE Messaging API',
    configFields: [
      { key: 'LINE_ACCESS_TOKEN',   label: 'Channel Access Token', type: 'password' },
      { key: 'LINE_CHANNEL_SECRET', label: 'Channel Secret',       type: 'password' },
    ],
    setupUrl: 'https://developers.line.biz/console',
    native:   false,
  },
  {
    id: 'viber', name: 'Viber', icon: '💜', color: '#7360F2',
    description: 'Viber Bot API',
    configFields: [
      { key: 'VIBER_AUTH_TOKEN', label: 'Auth Token', type: 'password' },
    ],
    setupUrl: 'https://partners.viber.com',
    native:   false,
  },
  {
    id: 'wechat', name: 'WeChat', icon: '🟢', color: '#09B83E',
    description: 'WeChat Official Account API',
    configFields: [
      { key: 'WECHAT_APP_ID',     label: 'App ID',     type: 'text' },
      { key: 'WECHAT_APP_SECRET', label: 'App Secret', type: 'password' },
    ],
    setupUrl: 'https://mp.weixin.qq.com',
    native:   false,
  },
];

interface PlatformStatus {
  id:        string;
  connected: boolean;
}

export default function MessagingScreen() {
  const [statuses,  setStatuses]  = useState<PlatformStatus[]>([]);
  const [expanded,  setExpanded]  = useState<string | null>(null);
  const [configs,   setConfigs]   = useState<Record<string, Record<string, string>>>({});
  const [saving,    setSaving]    = useState<string | null>(null);
  const [apiBase,   setApiBase]   = useState('http://localhost:3003');
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('api_base_url').then(url => {
      const base = url ? url.replace('3000', '3003') : 'http://localhost:3003';
      setApiBase(base);
      fetchStatuses(base);
      loadSavedConfigs();
    });
  }, []);

  const fetchStatuses = async (base: string) => {
    setLoading(true);
    try {
      const res = await axios.get(`${base}/api/messaging/status`, { timeout: 5000 });
      const platforms = res.data.platforms || [];
      setStatuses(platforms.map((p: any) => ({ id: p.platform, connected: p.connected })));
    } catch {
      setStatuses(PLATFORM_REGISTRY.map(p => ({ id: p.id, connected: false })));
    } finally {
      setLoading(false);
    }
  };

  const loadSavedConfigs = async () => {
    const saved = await AsyncStorage.getItem('messaging_configs');
    if (saved) setConfigs(JSON.parse(saved));
  };

  const saveConfig = async (platformId: string) => {
    setSaving(platformId);
    try {
      const config = configs[platformId] || {};
      // Send to desktop API
      await axios.post(`${apiBase}/api/messaging/configure`, {
        platform: platformId,
        credentials: config,
      }, { timeout: 5000 });
      // Save locally too
      const updated = { ...configs, [platformId]: config };
      await AsyncStorage.setItem('messaging_configs', JSON.stringify(updated));
      Alert.alert('Saved', `${platformId} configuration saved.`);
      fetchStatuses(apiBase);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(null);
    }
  };

  const updateField = (platformId: string, key: string, value: string) => {
    setConfigs(prev => ({
      ...prev,
      [platformId]: { ...(prev[platformId] || {}), [key]: value },
    }));
  };

  const testConnection = async (platformId: string) => {
    try {
      await axios.post(`${apiBase}/api/messaging/test`, { platform: platformId }, { timeout: 8000 });
      Alert.alert('Connected!', `${platformId} is working correctly.`);
    } catch {
      Alert.alert('Test Failed', `Could not connect to ${platformId}. Check your credentials.`);
    }
  };

  const getStatus = (id: string) =>
    statuses.find(s => s.id === id)?.connected ?? false;

  return (
    <SafeAreaView style={s.root}>
      <View style={s.header}>
        <Text style={s.title}>💬 Messaging Platforms</Text>
        <TouchableOpacity onPress={() => fetchStatuses(apiBase)}>
          <Text style={s.refresh}>🔄</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={s.loader}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Connected count */}
          <View style={s.summary}>
            <Text style={s.summaryText}>
              {statuses.filter(s => s.connected).length} / {PLATFORM_REGISTRY.length} platforms connected
            </Text>
          </View>

          {PLATFORM_REGISTRY.map(platform => {
            const isConnected = getStatus(platform.id);
            const isExpanded  = expanded === platform.id;
            const cfg         = configs[platform.id] || {};

            return (
              <View key={platform.id} style={s.platformCard}>
                {/* Platform header */}
                <TouchableOpacity
                  style={s.platformHeader}
                  onPress={() => setExpanded(isExpanded ? null : platform.id)}>
                  <Text style={s.platformIcon}>{platform.icon}</Text>
                  <View style={s.platformInfo}>
                    <View style={s.platformTitleRow}>
                      <Text style={s.platformName}>{platform.name}</Text>
                      {platform.native && (
                        <View style={s.nativeBadge}>
                          <Text style={s.nativeBadgeText}>Native</Text>
                        </View>
                      )}
                      {(platform as any).desktopOnly && (
                        <View style={[s.nativeBadge, { backgroundColor: COLORS.accent + '30' }]}>
                          <Text style={[s.nativeBadgeText, { color: COLORS.accent }]}>Desktop</Text>
                        </View>
                      )}
                    </View>
                    <Text style={s.platformDesc}>{platform.description}</Text>
                  </View>
                  <View style={[s.statusDot, { backgroundColor: isConnected ? COLORS.success : COLORS.border }]} />
                  <Text style={s.expandChevron}>{isExpanded ? '▲' : '▼'}</Text>
                </TouchableOpacity>

                {/* Expanded config */}
                {isExpanded && (
                  <View style={s.platformConfig}>
                    {platform.native && (platform as any).nativeNote && (
                      <View style={s.nativeNote}>
                        <Text style={s.nativeNoteText}>ℹ️ {(platform as any).nativeNote}</Text>
                      </View>
                    )}

                    {/* Config fields */}
                    {platform.configFields.map(field => (
                      <View key={field.key} style={s.fieldRow}>
                        <Text style={s.fieldLabel}>{field.label}</Text>
                        <TextInput
                          style={s.fieldInput}
                          placeholder={`Enter ${field.label}`}
                          placeholderTextColor={COLORS.textMuted}
                          value={cfg[field.key] || ''}
                          onChangeText={v => updateField(platform.id, field.key, v)}
                          secureTextEntry={field.type === 'password'}
                          keyboardType={field.type === 'email' ? 'email-address' : 'default'}
                          autoCapitalize="none"
                        />
                      </View>
                    ))}

                    {/* Actions */}
                    <View style={s.configActions}>
                      {platform.setupUrl ? (
                        <TouchableOpacity
                          style={s.docsBtn}
                          onPress={() => Linking.openURL(platform.setupUrl)}>
                          <Text style={s.docsBtnText}>📖 Setup Docs</Text>
                        </TouchableOpacity>
                      ) : null}

                      {platform.configFields.length > 0 && (
                        <TouchableOpacity
                          style={s.saveBtn}
                          onPress={() => saveConfig(platform.id)}
                          disabled={saving === platform.id}>
                          {saving === platform.id
                            ? <ActivityIndicator size="small" color="#0F0F0F" />
                            : <Text style={s.saveBtnText}>💾 Save</Text>
                          }
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity
                        style={s.testBtn}
                        onPress={() => testConnection(platform.id)}>
                        <Text style={s.testBtnText}>🔌 Test</Text>
                      </TouchableOpacity>
                    </View>

                    {isConnected && (
                      <Text style={s.connectedText}>✓ Connected and receiving messages</Text>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────

const s = StyleSheet.create({
  root:             { flex: 1, backgroundColor: COLORS.background },
  header:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  title:            { color: COLORS.text, fontSize: 20, fontWeight: '700' },
  refresh:          { fontSize: 20, color: COLORS.textMuted },
  loader:           { flex: 1, alignItems: 'center', justifyContent: 'center' },
  summary:          { marginHorizontal: 16, marginBottom: 8, paddingVertical: 10, paddingHorizontal: 14, backgroundColor: COLORS.card, borderRadius: 8, borderColor: COLORS.border, borderWidth: 1 },
  summaryText:      { color: COLORS.textMuted, fontSize: 13 },
  platformCard:     { marginHorizontal: 16, marginBottom: 8, backgroundColor: COLORS.card, borderRadius: 12, borderColor: COLORS.border, borderWidth: 1, overflow: 'hidden' },
  platformHeader:   { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  platformIcon:     { fontSize: 26, width: 32 },
  platformInfo:     { flex: 1 },
  platformTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  platformName:     { color: COLORS.text, fontSize: 15, fontWeight: '700' },
  platformDesc:     { color: COLORS.textMuted, fontSize: 11 },
  nativeBadge:      { backgroundColor: COLORS.primary + '20', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  nativeBadgeText:  { color: COLORS.primary, fontSize: 9, fontWeight: '700' },
  statusDot:        { width: 10, height: 10, borderRadius: 5 },
  expandChevron:    { color: COLORS.textMuted, fontSize: 12, marginLeft: 4 },
  platformConfig:   { borderTopColor: COLORS.border, borderTopWidth: 1, padding: 14, gap: 10 },
  nativeNote:       { backgroundColor: COLORS.primary + '15', borderRadius: 8, padding: 10, borderColor: COLORS.primary + '30', borderWidth: 1 },
  nativeNoteText:   { color: COLORS.primary, fontSize: 12 },
  fieldRow:         { gap: 4 },
  fieldLabel:       { color: COLORS.text, fontSize: 12, fontWeight: '600' },
  fieldInput:       { backgroundColor: COLORS.surface, color: COLORS.text, borderColor: COLORS.border, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13 },
  configActions:    { flexDirection: 'row', gap: 8, marginTop: 4 },
  docsBtn:          { flex: 1, borderColor: COLORS.border, borderWidth: 1, borderRadius: 8, paddingVertical: 9, alignItems: 'center' },
  docsBtnText:      { color: COLORS.textMuted, fontSize: 12, fontWeight: '600' },
  saveBtn:          { flex: 1, backgroundColor: COLORS.primary, borderRadius: 8, paddingVertical: 9, alignItems: 'center' },
  saveBtnText:      { color: '#0F0F0F', fontSize: 12, fontWeight: '700' },
  testBtn:          { flex: 1, backgroundColor: COLORS.surface, borderColor: COLORS.border, borderWidth: 1, borderRadius: 8, paddingVertical: 9, alignItems: 'center' },
  testBtnText:      { color: COLORS.text, fontSize: 12, fontWeight: '600' },
  connectedText:    { color: COLORS.success, fontSize: 12, fontWeight: '600', textAlign: 'center', marginTop: 4 },
});
