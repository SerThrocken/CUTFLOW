// ============================================================
//  CutFlow Mobile — Social Share Screen
//  Lets users post completed videos to TikTok, Instagram,
//  YouTube, X, Facebook, Snapchat, Discord, and Telegram
//  using native share intents / deep links per platform.
// ============================================================

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Switch, Alert, Linking, Platform, NativeModules,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { COLORS } from '../App';

const { TLG3DModule } = NativeModules;

const PLATFORMS = [
  { id: 'tiktok',     name: 'TikTok',     icon: '🎵', color: '#010101', scheme: 'tiktok://',    deepLink: 'https://www.tiktok.com/upload' },
  { id: 'instagram',  name: 'Instagram',  icon: '📸', color: '#C13584', scheme: 'instagram://', deepLink: 'https://www.instagram.com/create/story' },
  { id: 'youtube',    name: 'YouTube',    icon: '▶️',  color: '#FF0000', scheme: 'youtube://',   deepLink: 'https://www.youtube.com/upload' },
  { id: 'twitter',    name: 'X (Twitter)', icon: '✖️', color: '#000000', scheme: 'twitter://',   deepLink: 'https://twitter.com/compose/tweet' },
  { id: 'facebook',   name: 'Facebook',   icon: '👤', color: '#1877F2', scheme: 'fb://',         deepLink: 'https://www.facebook.com' },
  { id: 'snapchat',   name: 'Snapchat',   icon: '👻', color: '#FFFC00', scheme: 'snapchat://',   deepLink: 'https://www.snapchat.com' },
  { id: 'discord',    name: 'Discord',    icon: '💬', color: '#5865F2', scheme: 'discord://',    deepLink: 'https://discord.com' },
  { id: 'telegram',   name: 'Telegram',   icon: '✈️',  color: '#2AABEE', scheme: 'tg://',         deepLink: 'https://t.me' },
];

interface ShareState {
  selectedPlatforms: Set<string>;
  caption:           string;
  hashtags:          string;
  schedulePost:      boolean;
  scheduledTime:     string;
  autoCaption:       boolean;
}

export default function SocialShareScreen({ route }: any) {
  const videoPath  = route?.params?.videoPath  || '';
  const videoTitle = route?.params?.videoTitle || 'My CutFlow Edit';

  const [state, setState] = useState<ShareState>({
    selectedPlatforms: new Set(['tiktok', 'instagram']),
    caption:           '',
    hashtags:          '#CutFlow #VideoEditing #AI',
    schedulePost:      false,
    scheduledTime:     '',
    autoCaption:       true,
  });

  const [sharing, setSharing] = useState(false);

  const togglePlatform = (id: string) => {
    setState(prev => {
      const next = new Set(prev.selectedPlatforms);
      next.has(id) ? next.delete(id) : next.add(id);
      return { ...prev, selectedPlatforms: next };
    });
  };

  // ── Try native app first, fall back to system share sheet ──

  const shareToNativeApp = async (platform: typeof PLATFORMS[0]) => {
    const canOpen = await Linking.canOpenURL(platform.scheme);

    if (canOpen) {
      // Native app is installed — open it
      await Linking.openURL(platform.scheme);
      // Then use system share to pass the file
    }

    // Fall through to system share sheet (works on all platforms)
    return false;
  };

  const handleShare = async () => {
    if (state.selectedPlatforms.size === 0) {
      Alert.alert('No Platforms', 'Select at least one platform to share to.');
      return;
    }

    if (!videoPath) {
      Alert.alert('No Video', 'No video selected for sharing.');
      return;
    }

    setSharing(true);

    try {
      const caption = state.autoCaption
        ? `${videoTitle}\n\n${state.caption}\n\n${state.hashtags}`
        : `${state.caption}\n\n${state.hashtags}`;

      if (Platform.OS === 'ios') {
        // iOS: native share sheet with all platforms
        await TLG3DModule?.shareFile?.(videoPath, 'CutFlow Export', {});
      } else {
        // Android: native Intent.ACTION_SEND
        await TLG3DModule?.shareFile?.(
          videoPath,
          'video/mp4',
          videoTitle
        );
      }

      Alert.alert('Shared!', `Your video is ready to share to ${state.selectedPlatforms.size} platform(s).`);
    } catch (err: any) {
      // Fallback: expo-sharing
      try {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(videoPath, {
            mimeType:        'video/mp4',
            dialogTitle:     `Share ${videoTitle}`,
            UTI:             'com.apple.quicktime-movie',
          });
        }
      } catch (fallbackErr: any) {
        Alert.alert('Share Failed', fallbackErr.message);
      }
    } finally {
      setSharing(false);
    }
  };

  const saveToGallery = async () => {
    if (!videoPath) return;

    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Camera roll permission is required.');
      return;
    }

    try {
      await MediaLibrary.saveToLibraryAsync(videoPath);
      Alert.alert('Saved!', 'Video saved to your camera roll.');
    } catch (err: any) {
      Alert.alert('Save Failed', err.message);
    }
  };

  return (
    <SafeAreaView style={s.root}>
      <Text style={s.title}>📤 Share Your Edit</Text>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Platform Grid */}
        <Text style={s.sectionTitle}>Share To</Text>
        <View style={s.platformGrid}>
          {PLATFORMS.map(p => {
            const selected = state.selectedPlatforms.has(p.id);
            return (
              <TouchableOpacity
                key={p.id}
                style={[s.platformBtn, selected && s.platformBtnSelected]}
                onPress={() => togglePlatform(p.id)}>
                <Text style={s.platformIcon}>{p.icon}</Text>
                <Text style={[s.platformName, selected && { color: COLORS.primary }]}>
                  {p.name}
                </Text>
                {selected && <Text style={s.checkmark}>✓</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Caption */}
        <Text style={s.sectionTitle}>Caption</Text>
        <View style={s.row}>
          <Text style={s.label}>Auto-generate from script</Text>
          <Switch
            value={state.autoCaption}
            onValueChange={v => setState(prev => ({ ...prev, autoCaption: v }))}
            trackColor={{ true: COLORS.primary, false: COLORS.border }}
            thumbColor={COLORS.text}
          />
        </View>

        {!state.autoCaption && (
          <TextInput
            style={s.textArea}
            placeholder="Write your caption..."
            placeholderTextColor={COLORS.textMuted}
            value={state.caption}
            onChangeText={v => setState(prev => ({ ...prev, caption: v }))}
            multiline
            numberOfLines={4}
          />
        )}

        {/* Hashtags */}
        <Text style={s.sectionTitle}>Hashtags</Text>
        <TextInput
          style={s.input}
          placeholder="#CutFlow #VideoEditing"
          placeholderTextColor={COLORS.textMuted}
          value={state.hashtags}
          onChangeText={v => setState(prev => ({ ...prev, hashtags: v }))}
        />

        {/* Schedule */}
        <View style={s.row}>
          <Text style={s.label}>Schedule Post</Text>
          <Switch
            value={state.schedulePost}
            onValueChange={v => setState(prev => ({ ...prev, schedulePost: v }))}
            trackColor={{ true: COLORS.primary, false: COLORS.border }}
            thumbColor={COLORS.text}
          />
        </View>

        {state.schedulePost && (
          <TextInput
            style={s.input}
            placeholder="Date & time (e.g. 2024-12-01 18:00)"
            placeholderTextColor={COLORS.textMuted}
            value={state.scheduledTime}
            onChangeText={v => setState(prev => ({ ...prev, scheduledTime: v }))}
          />
        )}

        {/* Actions */}
        <TouchableOpacity
          style={[s.shareBtn, sharing && { opacity: 0.6 }]}
          onPress={handleShare}
          disabled={sharing}>
          <Text style={s.shareBtnText}>
            {sharing ? 'Sharing...' : `Share to ${state.selectedPlatforms.size} Platform(s)`}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.saveBtn} onPress={saveToGallery}>
          <Text style={s.saveBtnText}>💾 Save to Camera Roll</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:                { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: 16 },
  title:               { color: COLORS.text, fontSize: 20, fontWeight: '700', paddingVertical: 16 },
  sectionTitle:        { color: COLORS.text, fontSize: 13, fontWeight: '700', marginBottom: 10, marginTop: 16, textTransform: 'uppercase', letterSpacing: 0.5 },
  platformGrid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  platformBtn:         { backgroundColor: COLORS.card, borderColor: COLORS.border, borderWidth: 1, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 14, alignItems: 'center', minWidth: '22%' },
  platformBtnSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.surface },
  platformIcon:        { fontSize: 22, marginBottom: 4 },
  platformName:        { color: COLORS.textMuted, fontSize: 11, fontWeight: '600', textAlign: 'center' },
  checkmark:           { color: COLORS.primary, fontSize: 12, marginTop: 2 },
  row:                 { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 8, borderColor: COLORS.border, borderWidth: 1 },
  label:               { color: COLORS.text, fontSize: 14, fontWeight: '500' },
  input:               { backgroundColor: COLORS.card, color: COLORS.text, borderColor: COLORS.border, borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 8 },
  textArea:            { backgroundColor: COLORS.card, color: COLORS.text, borderColor: COLORS.border, borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 8, minHeight: 90, textAlignVertical: 'top' },
  shareBtn:            { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  shareBtnText:        { color: '#0F0F0F', fontWeight: '800', fontSize: 15 },
  saveBtn:             { backgroundColor: COLORS.surface, borderColor: COLORS.border, borderWidth: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 10, marginBottom: 32 },
  saveBtnText:         { color: COLORS.text, fontWeight: '600', fontSize: 14 },
});
