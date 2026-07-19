// ============================================================
//  CutFlow Mobile — Setup Wizard Screen (First Launch)
// ============================================================

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Switch, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../App';

const TOTAL_STEPS = 4;

export default function SetupWizardScreen({ navigation }: any) {
  const [step,         setStep]         = useState(1);
  const [username,     setUsername]     = useState('');
  const [apiBaseUrl,   setApiBaseUrl]   = useState('http://localhost:3000');
  const [desktopHost,  setDesktopHost]  = useState('');
  const [enableDiscord, setEnableDiscord] = useState(false);
  const [enableTelegram, setEnableTelegram] = useState(false);
  const [saving,       setSaving]       = useState(false);

  const completeSetup = async () => {
    if (!username.trim()) {
      Alert.alert('Required', 'Please enter your username.');
      return;
    }
    setSaving(true);
    try {
      await AsyncStorage.setItem('username',      username.trim());
      await AsyncStorage.setItem('user_id',       `mobile_${Date.now()}`);
      await AsyncStorage.setItem('api_base_url',  apiBaseUrl.trim());
      await AsyncStorage.setItem('desktop_host',  desktopHost.trim());
      await AsyncStorage.setItem('setup_complete','true');

      Alert.alert('Welcome to CutFlow! 🎬', 'Setup complete.', [
        { text: 'Start Editing', onPress: () => navigation.replace('Main') },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <View style={s.stepContent}>
            <Text style={s.stepIcon}>👋</Text>
            <Text style={s.stepTitle}>Welcome to CutFlow</Text>
            <Text style={s.stepDesc}>AI-powered video editing by The Looking Glass 3D. Let's set you up quickly.</Text>
            <TextInput
              style={s.input}
              placeholder="Your username (e.g. serthrocken)"
              placeholderTextColor={COLORS.textMuted}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>
        );

      case 2:
        return (
          <View style={s.stepContent}>
            <Text style={s.stepIcon}>🖥️</Text>
            <Text style={s.stepTitle}>Connect to Desktop</Text>
            <Text style={s.stepDesc}>Enter your desktop's local IP to enable remote editing and file transfer.</Text>
            <TextInput
              style={s.input}
              placeholder="Desktop IP (e.g. 192.168.1.100)"
              placeholderTextColor={COLORS.textMuted}
              value={desktopHost}
              onChangeText={setDesktopHost}
              keyboardType="numbers-and-punctuation"
            />
            <TextInput
              style={[s.input, { marginTop: 8 }]}
              placeholder="API URL (e.g. http://192.168.1.100:3000)"
              placeholderTextColor={COLORS.textMuted}
              value={apiBaseUrl}
              onChangeText={setApiBaseUrl}
              keyboardType="url"
              autoCapitalize="none"
            />
            <Text style={s.hint}>💡 Find your desktop IP: run `ipconfig` (Windows) or `ifconfig` (Mac/Linux)</Text>
          </View>
        );

      case 3:
        return (
          <View style={s.stepContent}>
            <Text style={s.stepIcon}>💬</Text>
            <Text style={s.stepTitle}>Messaging Platforms</Text>
            <Text style={s.stepDesc}>Enable messaging to control CutFlow from any app. Configure more in Settings.</Text>
            {[
              { label: 'Discord',  state: enableDiscord,  setState: setEnableDiscord },
              { label: 'Telegram', state: enableTelegram, setState: setEnableTelegram },
            ].map(p => (
              <View key={p.label} style={s.toggleRow}>
                <Text style={s.toggleLabel}>{p.label}</Text>
                <Switch
                  value={p.state}
                  onValueChange={p.setState}
                  trackColor={{ true: COLORS.primary, false: COLORS.border }}
                  thumbColor={COLORS.text}
                />
              </View>
            ))}
            <Text style={s.hint}>You can add WhatsApp, iMessage, Email and more from Settings → Messaging</Text>
          </View>
        );

      case 4:
        return (
          <View style={s.stepContent}>
            <Text style={s.stepIcon}>✅</Text>
            <Text style={s.stepTitle}>You're Ready!</Text>
            <Text style={s.stepDesc}>Here's what CutFlow can do for you:</Text>
            {[
              '🎬 Edit videos with AI assistance',
              '🎵 200+ royalty-free music tracks',
              '📤 Post to TikTok, Instagram, YouTube',
              '🖥️ Remote edit on your desktop',
              '💬 Control from Discord/Telegram',
              '🛒 Install extra skills from the Marketplace',
            ].map(f => (
              <View key={f} style={s.featureRow}>
                <Text style={s.featureText}>{f}</Text>
              </View>
            ))}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={s.root}>
      {/* Progress bar */}
      <View style={s.progressBar}>
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <View
            key={i}
            style={[s.progressSegment, { backgroundColor: i < step ? COLORS.primary : COLORS.border }]}
          />
        ))}
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
        {renderStep()}
      </ScrollView>

      {/* Navigation */}
      <View style={s.navRow}>
        {step > 1 && (
          <TouchableOpacity style={s.backBtn} onPress={() => setStep(s => s - 1)}>
            <Text style={s.backBtnText}>← Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[s.nextBtn, step === 1 && !username.trim() && { opacity: 0.5 }]}
          onPress={step === TOTAL_STEPS ? completeSetup : () => setStep(s => s + 1)}
          disabled={step === 1 && !username.trim() || saving}>
          {saving
            ? <ActivityIndicator size="small" color="#0F0F0F" />
            : <Text style={s.nextBtnText}>{step === TOTAL_STEPS ? "Let's Go! 🚀" : 'Next →'}</Text>
          }
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:            { flex: 1, backgroundColor: COLORS.background },
  progressBar:     { flexDirection: 'row', paddingHorizontal: 20, paddingTop: 12, gap: 6 },
  progressSegment: { flex: 1, height: 3, borderRadius: 2 },
  stepContent:     { alignItems: 'center', gap: 12 },
  stepIcon:        { fontSize: 64, marginBottom: 8 },
  stepTitle:       { color: COLORS.text, fontSize: 26, fontWeight: '800', textAlign: 'center' },
  stepDesc:        { color: COLORS.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 20, paddingHorizontal: 8 },
  input:           { width: '100%', backgroundColor: COLORS.card, color: COLORS.text, borderColor: COLORS.border, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, marginTop: 8 },
  hint:            { color: COLORS.textMuted, fontSize: 11, textAlign: 'center', paddingHorizontal: 12, marginTop: 4 },
  toggleRow:       { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 12, borderColor: COLORS.border, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14 },
  toggleLabel:     { color: COLORS.text, fontSize: 15, fontWeight: '600' },
  featureRow:      { width: '100%', backgroundColor: COLORS.card, borderRadius: 10, borderColor: COLORS.border, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10 },
  featureText:     { color: COLORS.text, fontSize: 14 },
  navRow:          { flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 24, gap: 10 },
  backBtn:         { flex: 1, borderColor: COLORS.border, borderWidth: 1, borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  backBtnText:     { color: COLORS.textMuted, fontWeight: '600', fontSize: 15 },
  nextBtn:         { flex: 2, backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  nextBtnText:     { color: '#0F0F0F', fontWeight: '800', fontSize: 16 },
});
