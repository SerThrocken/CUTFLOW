// ============================================================
//  CutFlow Mobile — Home Screen
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../App';

export default function HomeScreen({ navigation }: any) {
  const [username, setUsername] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('username').then(n => setUsername(n || 'User'));
    AsyncStorage.getItem('desktop_connected').then(c => setIsConnected(c === 'true'));
  }, []);

  const quickActions = [
    { icon: '✂️',  label: 'New Edit',     screen: 'Editor',      color: COLORS.primary },
    { icon: '🖥️', label: 'Remote',        screen: 'Remote',      color: COLORS.accent  },
    { icon: '📤',  label: 'Share',         screen: 'SocialShare', color: '#5865F2'      },
    { icon: '🛒',  label: 'Marketplace',  screen: 'Marketplace', color: '#FF6B6B'      },
  ];

  return (
    <SafeAreaView style={s.root}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Greeting */}
        <View style={s.greeting}>
          <Text style={s.greetText}>👋 Hey, {username}</Text>
          <View style={[s.statusDot, { backgroundColor: isConnected ? COLORS.success : COLORS.border }]} />
        </View>

        <Text style={s.appName}>CutFlow</Text>
        <Text style={s.appTagline}>AI-Powered Video Editing by TLG3D</Text>

        {/* Quick Actions Grid */}
        <Text style={s.sectionTitle}>Quick Actions</Text>
        <View style={s.quickGrid}>
          {quickActions.map(a => (
            <TouchableOpacity
              key={a.screen}
              style={[s.quickBtn, { borderColor: a.color + '60' }]}
              onPress={() => navigation.navigate(a.screen)}>
              <Text style={s.quickIcon}>{a.icon}</Text>
              <Text style={[s.quickLabel, { color: a.color }]}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Desktop Status Card */}
        <Text style={s.sectionTitle}>Desktop Connection</Text>
        <TouchableOpacity
          style={s.desktopCard}
          onPress={() => navigation.navigate('Remote')}>
          <Text style={s.desktopIcon}>🖥️</Text>
          <View style={s.desktopInfo}>
            <Text style={s.desktopTitle}>
              {isConnected ? 'Desktop Connected' : 'Connect to Desktop'}
            </Text>
            <Text style={s.desktopSub}>
              {isConnected
                ? 'Tap to manage remote projects'
                : 'Link your desktop to transfer and process videos'}
            </Text>
          </View>
          <Text style={s.chevron}>›</Text>
        </TouchableOpacity>

        {/* Platform info */}
        <Text style={s.sectionTitle}>Platform</Text>
        <View style={s.infoCard}>
          <Text style={s.infoRow}>📱 Running on {Platform.OS === 'ios' ? 'iOS' : 'Android'}</Text>
          <Text style={s.infoRow}>🔗 Version 0.1.0</Text>
          <Text style={s.infoRow}>🏢 The Looking Glass 3D</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: COLORS.background },
  greeting:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
  greetText:    { color: COLORS.textMuted, fontSize: 15 },
  statusDot:    { width: 9, height: 9, borderRadius: 5 },
  appName:      { color: COLORS.text, fontSize: 36, fontWeight: '900', paddingHorizontal: 20, letterSpacing: -1 },
  appTagline:   { color: COLORS.textMuted, fontSize: 13, paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { color: COLORS.text, fontSize: 13, fontWeight: '700', paddingHorizontal: 20, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  quickGrid:    { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 14, gap: 10, marginBottom: 28 },
  quickBtn:     { width: '47%', backgroundColor: COLORS.card, borderRadius: 14, borderWidth: 1, paddingVertical: 20, alignItems: 'center', gap: 8 },
  quickIcon:    { fontSize: 28 },
  quickLabel:   { fontSize: 14, fontWeight: '700' },
  desktopCard:  { marginHorizontal: 16, backgroundColor: COLORS.card, borderRadius: 14, borderColor: COLORS.border, borderWidth: 1, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 28 },
  desktopIcon:  { fontSize: 32 },
  desktopInfo:  { flex: 1 },
  desktopTitle: { color: COLORS.text, fontSize: 15, fontWeight: '700' },
  desktopSub:   { color: COLORS.textMuted, fontSize: 12, marginTop: 3 },
  chevron:      { color: COLORS.textMuted, fontSize: 22 },
  infoCard:     { marginHorizontal: 16, backgroundColor: COLORS.card, borderRadius: 14, borderColor: COLORS.border, borderWidth: 1, padding: 16, marginBottom: 40, gap: 8 },
  infoRow:      { color: COLORS.textMuted, fontSize: 13 },
});
