// ============================================================
//  CutFlow Mobile — Settings Screen
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Switch, Alert, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../App';

interface Settings {
  username:     string;
  apiBaseUrl:   string;
  desktopHost:  string;
  desktopPort:  string;
  defaultResolution: string;
  defaultFps:   string;
  theme:        string;
  notifications: boolean;
  autoSaveGallery: boolean;
}

const RESOLUTIONS = ['720p', '1080p', '1440p', '4K'];
const FRAMERATES  = ['24', '30', '60'];
const THEMES      = ['tlg3d-default', 'tlg3d-light', 'tlg3d-neon'];

export default function SettingsScreen({ navigation }: any) {
  const [settings, setSettings] = useState<Settings>({
    username:          '',
    apiBaseUrl:        'http://localhost:3000',
    desktopHost:       '',
    desktopPort:       '7373',
    defaultResolution: '1080p',
    defaultFps:        '30',
    theme:             'tlg3d-default',
    notifications:     true,
    autoSaveGallery:   false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const [username, apiBaseUrl, desktopHost, desktopPort, defaultResolution,
           defaultFps, theme, notifications, autoSaveGallery] =
      await Promise.all([
        AsyncStorage.getItem('username'),
        AsyncStorage.getItem('api_base_url'),
        AsyncStorage.getItem('desktop_host'),
        AsyncStorage.getItem('desktop_port'),
        AsyncStorage.getItem('default_resolution'),
        AsyncStorage.getItem('default_fps'),
        AsyncStorage.getItem('theme'),
        AsyncStorage.getItem('notifications'),
        AsyncStorage.getItem('auto_save_gallery'),
      ]);

    setSettings({
      username:          username       || '',
      apiBaseUrl:        apiBaseUrl     || 'http://localhost:3000',
      desktopHost:       desktopHost    || '',
      desktopPort:       desktopPort    || '7373',
      defaultResolution: defaultResolution || '1080p',
      defaultFps:        defaultFps     || '30',
      theme:             theme          || 'tlg3d-default',
      notifications:     notifications  !== 'false',
      autoSaveGallery:   autoSaveGallery === 'true',
    });
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await AsyncStorage.multiSet([
        ['username',            settings.username],
        ['api_base_url',        settings.apiBaseUrl],
        ['desktop_host',        settings.desktopHost],
        ['desktop_port',        settings.desktopPort],
        ['default_resolution',  settings.defaultResolution],
        ['default_fps',         settings.defaultFps],
        ['theme',               settings.theme],
        ['notifications',       String(settings.notifications)],
        ['auto_save_gallery',   String(settings.autoSaveGallery)],
      ]);
      Alert.alert('Saved', 'Settings saved successfully.');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const resetSetup = async () => {
    Alert.alert(
      'Reset Setup?',
      'This will clear all settings and restart the setup wizard.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset', style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            navigation.replace('SetupWizard');
          },
        },
      ]
    );
  };

  const update = (key: keyof Settings, value: any) =>
    setSettings(prev => ({ ...prev, [key]: value }));

  return (
    <SafeAreaView style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()}>
          <Text style={s.backBtn}>←</Text>
        </TouchableOpacity>
        <Text style={s.title}>⚙️ Settings</Text>
        <TouchableOpacity style={s.saveBtn} onPress={saveSettings} disabled={saving}>
          <Text style={s.saveBtnText}>{saving ? '...' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Account */}
        <Text style={s.sectionTitle}>Account</Text>
        <View style={s.card}>
          <Text style={s.fieldLabel}>Username</Text>
          <TextInput
            style={s.input}
            value={settings.username}
            onChangeText={v => update('username', v)}
            autoCapitalize="none"
          />
        </View>

        {/* Connection */}
        <Text style={s.sectionTitle}>Server & Desktop</Text>
        <View style={s.card}>
          <Text style={s.fieldLabel}>API Base URL</Text>
          <TextInput
            style={s.input}
            value={settings.apiBaseUrl}
            onChangeText={v => update('apiBaseUrl', v)}
            keyboardType="url"
            autoCapitalize="none"
          />
          <Text style={[s.fieldLabel, { marginTop: 12 }]}>Desktop Host (IP)</Text>
          <TextInput
            style={s.input}
            value={settings.desktopHost}
            onChangeText={v => update('desktopHost', v)}
            keyboardType="numbers-and-punctuation"
            placeholder="192.168.1.100"
            placeholderTextColor={COLORS.textMuted}
          />
          <Text style={[s.fieldLabel, { marginTop: 12 }]}>Desktop Sync Port</Text>
          <TextInput
            style={s.input}
            value={settings.desktopPort}
            onChangeText={v => update('desktopPort', v)}
            keyboardType="number-pad"
          />
        </View>

        {/* Video Defaults */}
        <Text style={s.sectionTitle}>Video Defaults</Text>
        <View style={s.card}>
          <Text style={s.fieldLabel}>Default Resolution</Text>
          <View style={s.optionRow}>
            {RESOLUTIONS.map(r => (
              <TouchableOpacity
                key={r}
                style={[s.optionBtn, settings.defaultResolution === r && s.optionBtnActive]}
                onPress={() => update('defaultResolution', r)}>
                <Text style={[s.optionText, settings.defaultResolution === r && s.optionTextActive]}>
                  {r}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[s.fieldLabel, { marginTop: 12 }]}>Default Frame Rate</Text>
          <View style={s.optionRow}>
            {FRAMERATES.map(f => (
              <TouchableOpacity
                key={f}
                style={[s.optionBtn, settings.defaultFps === f && s.optionBtnActive]}
                onPress={() => update('defaultFps', f)}>
                <Text style={[s.optionText, settings.defaultFps === f && s.optionTextActive]}>
                  {f} FPS
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Theme */}
        <Text style={s.sectionTitle}>Theme</Text>
        <View style={s.card}>
          {THEMES.map(t => (
            <TouchableOpacity
              key={t}
              style={[s.themeRow, settings.theme === t && s.themeRowActive]}
              onPress={() => update('theme', t)}>
              <Text style={s.themeLabel}>{t.replace('tlg3d-', '').replace('-', ' ').toUpperCase()}</Text>
              {settings.theme === t && <Text style={s.themeCheck}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>

        {/* App Settings */}
        <Text style={s.sectionTitle}>App</Text>
        <View style={s.card}>
          <View style={s.toggleRow}>
            <View>
              <Text style={s.toggleLabel}>Push Notifications</Text>
              <Text style={s.toggleSub}>Get notified when renders complete</Text>
            </View>
            <Switch
              value={settings.notifications}
              onValueChange={v => update('notifications', v)}
              trackColor={{ true: COLORS.primary, false: COLORS.border }}
              thumbColor={COLORS.text}
            />
          </View>
          <View style={[s.toggleRow, { marginTop: 8 }]}>
            <View>
              <Text style={s.toggleLabel}>Auto-Save to Gallery</Text>
              <Text style={s.toggleSub}>Automatically save finished exports</Text>
            </View>
            <Switch
              value={settings.autoSaveGallery}
              onValueChange={v => update('autoSaveGallery', v)}
              trackColor={{ true: COLORS.primary, false: COLORS.border }}
              thumbColor={COLORS.text}
            />
          </View>
        </View>

        {/* Links */}
        <Text style={s.sectionTitle}>Links</Text>
        <View style={s.card}>
          {[
            { label: '💬 Messaging Platforms', onPress: () => navigation.navigate('Messaging') },
            { label: '🛒 Skill Marketplace',   onPress: () => navigation.navigate('Marketplace') },
            { label: '📖 GitHub Repository',   onPress: () => Linking.openURL('https://github.com/serthrocken/cutflow') },
            { label: '🐛 Report an Issue',      onPress: () => Linking.openURL('https://github.com/serthrocken/cutflow/issues') },
          ].map(link => (
            <TouchableOpacity key={link.label} style={s.linkRow} onPress={link.onPress}>
              <Text style={s.linkText}>{link.label}</Text>
              <Text style={s.linkChevron}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Danger Zone */}
        <Text style={[s.sectionTitle, { color: COLORS.error }]}>Danger Zone</Text>
        <TouchableOpacity style={s.resetBtn} onPress={resetSetup}>
          <Text style={s.resetBtnText}>🔄 Reset Setup & Clear Data</Text>
        </TouchableOpacity>

        {/* Version */}
        <Text style={s.version}>CutFlow v0.1.0 — The Looking Glass 3D</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:           { flex: 1, backgroundColor: COLORS.background },
  header:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, gap: 10 },
  backBtn:        { color: COLORS.textMuted, fontSize: 22, width: 32 },
  title:          { flex: 1, color: COLORS.text, fontSize: 20, fontWeight: '700' },
  saveBtn:        { backgroundColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  saveBtnText:    { color: '#0F0F0F', fontWeight: '700', fontSize: 13 },
  sectionTitle:   { color: COLORS.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginHorizontal: 16, marginTop: 20, marginBottom: 8 },
  card:           { marginHorizontal: 16, backgroundColor: COLORS.card, borderRadius: 12, borderColor: COLORS.border, borderWidth: 1, padding: 14 },
  fieldLabel:     { color: COLORS.text, fontSize: 13, fontWeight: '600', marginBottom: 6 },
  input:          { backgroundColor: COLORS.surface, color: COLORS.text, borderColor: COLORS.border, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  optionRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionBtn:      { borderColor: COLORS.border, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: COLORS.surface },
  optionBtnActive:{ borderColor: COLORS.primary, backgroundColor: COLORS.primary + '20' },
  optionText:     { color: COLORS.textMuted, fontSize: 12, fontWeight: '600' },
  optionTextActive:{ color: COLORS.primary },
  themeRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomColor: COLORS.border, borderBottomWidth: 1 },
  themeRowActive: { borderBottomColor: COLORS.primary },
  themeLabel:     { color: COLORS.text, fontSize: 13, fontWeight: '600' },
  themeCheck:     { color: COLORS.primary, fontSize: 16 },
  toggleRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  toggleLabel:    { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  toggleSub:      { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  linkRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomColor: COLORS.border, borderBottomWidth: 1 },
  linkText:       { color: COLORS.text, fontSize: 14 },
  linkChevron:    { color: COLORS.textMuted, fontSize: 20 },
  resetBtn:       { marginHorizontal: 16, backgroundColor: COLORS.error + '15', borderColor: COLORS.error, borderWidth: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  resetBtnText:   { color: COLORS.error, fontWeight: '700', fontSize: 14 },
  version:        { color: COLORS.textMuted, fontSize: 11, textAlign: 'center', marginTop: 24, marginBottom: 8 },
});
