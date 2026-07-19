// ============================================================
//  CutFlow Mobile — Editor Screen
//  Full mobile video editing UI:
//    - Timeline with clips, audio tracks, SFX
//    - Quick edit tools: trim, transitions, color, text
//    - AI tools: script, voiceover, captions, reframe
//    - Audio library integration
//    - Export and send to desktop
// ============================================================

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, Dimensions, Platform,
  NativeModules,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../App';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── Types ─────────────────────────────────────────────────────

interface TimelineClip {
  id:        string;
  type:      'video' | 'audio' | 'image';
  filename:  string;
  uri:       string;
  startSec:  number;
  durationSec: number;
  track:     number; // 0 = video, 1 = bg music, 2 = SFX, 3 = voiceover
  volume:    number;
  muted:     boolean;
  color:     string;
}

interface EditTool {
  id:    string;
  label: string;
  icon:  string;
  color: string;
  action: () => void;
}

type ActivePanel = null | 'trim' | 'transition' | 'color' | 'text' | 'ai' | 'audio' | 'export';

// ── Component ─────────────────────────────────────────────────

export default function EditorScreen({ route, navigation }: any) {
  const project = route?.params?.project;

  const [clips,         setClips]        = useState<TimelineClip[]>([]);
  const [selectedClip,  setSelectedClip] = useState<TimelineClip | null>(null);
  const [activePanel,   setActivePanel]  = useState<ActivePanel>(null);
  const [loading,       setLoading]      = useState(false);
  const [rendering,     setRendering]    = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [apiBase,       setApiBase]      = useState('http://localhost:3000');
  const [playheadSec,   setPlayheadSec]  = useState(0);

  const totalDuration = clips.reduce((max, c) =>
    c.track === 0 ? Math.max(max, c.startSec + c.durationSec) : max, 0
  );

  useEffect(() => {
    AsyncStorage.getItem('api_base_url').then(url => {
      setApiBase(url || 'http://localhost:3000');
    });
  }, []);

  // ── Import video from camera roll ─────────────────────────

  const importFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera roll access is required.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (result.canceled || !result.assets?.length) return;

    const newClips: TimelineClip[] = result.assets.map((asset, i) => ({
      id:          `clip_${Date.now()}_${i}`,
      type:        'video',
      filename:    asset.fileName || `video_${i}.mp4`,
      uri:         asset.uri,
      startSec:    totalDuration + i,
      durationSec: asset.duration || 10,
      track:       0,
      volume:      1.0,
      muted:       false,
      color:       COLORS.primary,
    }));

    setClips(prev => [...prev, ...newClips]);
  };

  const importFromFiles = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['video/*', 'audio/*'],
      multiple: true,
    });

    if (result.canceled || !result.assets?.length) return;

    const newClips: TimelineClip[] = result.assets.map((asset, i) => {
      const isAudio = asset.mimeType?.startsWith('audio');
      return {
        id:          `clip_${Date.now()}_${i}`,
        type:        isAudio ? 'audio' : 'video',
        filename:    asset.name,
        uri:         asset.uri,
        startSec:    isAudio ? 0 : totalDuration + i,
        durationSec: 30,
        track:       isAudio ? 1 : 0,
        volume:      isAudio ? 0.3 : 1.0,
        muted:       false,
        color:       isAudio ? COLORS.accent : COLORS.primary,
      };
    });

    setClips(prev => [...prev, ...newClips]);
  };

  // ── Timeline operations ───────────────────────────────────

  const deleteClip = (clipId: string) => {
    setClips(prev => prev.filter(c => c.id !== clipId));
    if (selectedClip?.id === clipId) setSelectedClip(null);
  };

  const toggleMute = (clipId: string) => {
    setClips(prev => prev.map(c =>
      c.id === clipId ? { ...c, muted: !c.muted } : c
    ));
  };

  // ── AI Features ───────────────────────────────────────────

  const generateScript = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${apiBase}/api/scripts/generate`, {
        userId:  await AsyncStorage.getItem('user_id'),
        prompt:  `Generate a script for a video with ${clips.length} clip(s) totaling ${totalDuration.toFixed(0)} seconds`,
      });
      Alert.alert('Script Ready', res.data.script?.slice(0, 300) + '...');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateVoiceover = async () => {
    navigation.navigate('AudioLibrary', { projectId: project?.projectId });
  };

  const generateCaptions = async () => {
    if (clips.length === 0) {
      Alert.alert('No Clips', 'Add a video first.');
      return;
    }
    Alert.alert('Generating Captions', 'Auto-captions will be generated when you export or send to desktop.');
  };

  const reframeVideo = async () => {
    Alert.alert(
      'Auto Reframe',
      'Choose target aspect ratio:',
      [
        { text: '9:16 (TikTok/Reels)', onPress: () => runSkill('auto-reframe', { aspectRatio: '9:16' }) },
        { text: '1:1 (Instagram)', onPress: () => runSkill('auto-reframe', { aspectRatio: '1:1' }) },
        { text: '16:9 (YouTube)', onPress: () => runSkill('auto-reframe', { aspectRatio: '16:9' }) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const runSkill = async (skillId: string, config: any) => {
    if (clips.length === 0) return;
    setLoading(true);
    try {
      const userId = await AsyncStorage.getItem('user_id') || 'unknown';
      await axios.post(`${apiBase}/api/marketplace/skills/${skillId}/run`, {
        userId,
        projectId: project?.projectId,
        config,
      });
      Alert.alert('Skill Running', `${skillId} is processing...`);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Export & Send ─────────────────────────────────────────

  const sendToDesktop = () => {
    navigation.navigate('Remote', {
      project:   project,
      autoSend:  true,
      clips,
    });
  };

  const exportVideo = async () => {
    if (clips.length === 0) {
      Alert.alert('No Content', 'Add at least one video clip first.');
      return;
    }

    Alert.alert(
      'Export Video',
      'Choose quality:',
      [
        { text: '1080p (Recommended)', onPress: () => startRender('1080p') },
        { text: '720p (Faster)',        onPress: () => startRender('720p') },
        { text: '4K (Desktop)',         onPress: () => sendToDesktop() },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const startRender = async (resolution: string) => {
    if (!project) {
      Alert.alert('No Project', 'Save a project first.');
      return;
    }

    setRendering(true);
    setRenderProgress(0);

    try {
      const userId = await AsyncStorage.getItem('user_id') || 'unknown';

      // Poll render progress
      const pollInterval = setInterval(async () => {
        try {
          const res = await axios.get(`${apiBase}/api/projects/${userId}/${project.projectId}/render-status`);
          setRenderProgress(res.data.progress || 0);
          if (res.data.status === 'complete') {
            clearInterval(pollInterval);
            setRendering(false);
            Alert.alert(
              '✅ Export Complete!',
              'Your video is ready.',
              [
                { text: 'Share', onPress: () => navigation.navigate('SocialShare', {
                  videoPath:  res.data.outputPath,
                  videoTitle: project.projectName,
                }) },
                { text: 'Save to Gallery', onPress: () => saveToGallery(res.data.outputPath) },
                { text: 'Done', style: 'cancel' },
              ]
            );
          }
        } catch {}
      }, 2000);

      // Start render
      await axios.post(`${apiBase}/api/projects/${userId}/${project.projectId}/render`, {
        resolution,
        clips,
      });
    } catch (err: any) {
      setRendering(false);
      Alert.alert('Render Failed', err.message);
    }
  };

  const saveToGallery = async (videoPath: string) => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status === 'granted') {
      await MediaLibrary.saveToLibraryAsync(videoPath);
      Alert.alert('Saved!', 'Video saved to your camera roll.');
    }
  };

  // ── Tool Definitions ──────────────────────────────────────

  const quickTools: EditTool[] = [
    { id: 'trim',       label: 'Trim',       icon: '✂️',  color: COLORS.primary, action: () => setActivePanel('trim') },
    { id: 'transition', label: 'Transition', icon: '↔️',  color: COLORS.accent,  action: () => setActivePanel('transition') },
    { id: 'color',      label: 'Color',      icon: '🎨',  color: '#A855F7',      action: () => setActivePanel('color') },
    { id: 'text',       label: 'Text',       icon: '💬',  color: '#3B82F6',      action: () => setActivePanel('text') },
    { id: 'audio',      label: 'Music',      icon: '🎵',  color: '#EC4899',      action: () => navigation.navigate('AudioLibrary', { projectId: project?.projectId }) },
  ];

  const aiTools: EditTool[] = [
    { id: 'script',     label: 'Script',     icon: '📝',  color: COLORS.primary, action: generateScript },
    { id: 'voiceover',  label: 'Voiceover',  icon: '🎙️', color: COLORS.accent,  action: generateVoiceover },
    { id: 'captions',   label: 'Captions',   icon: '📺',  color: '#3B82F6',      action: generateCaptions },
    { id: 'reframe',    label: 'Reframe',    icon: '🎯',  color: '#A855F7',      action: reframeVideo },
    { id: 'marketplace',label: 'More Skills', icon: '🛒', color: '#F59E0B',      action: () => navigation.navigate('Marketplace') },
  ];

  const TRACK_COLORS = [COLORS.primary, COLORS.accent, '#A855F7', '#3B82F6'];
  const TRACK_LABELS = ['Video', 'BG Music', 'SFX', 'Voiceover'];

  // ── Render ────────────────────────────────────────────────

  return (
    <SafeAreaView style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()}>
          <Text style={s.backBtn}>←</Text>
        </TouchableOpacity>
        <Text style={s.title} numberOfLines={1}>{project?.projectName || 'New Edit'}</Text>
        <TouchableOpacity style={s.exportBtn} onPress={exportVideo} disabled={rendering}>
          <Text style={s.exportBtnText}>{rendering ? `${renderProgress}%` : 'Export'}</Text>
        </TouchableOpacity>
      </View>

      {/* Video Preview Placeholder */}
      <View style={s.preview}>
        {clips.length === 0 ? (
          <View style={s.previewEmpty}>
            <Text style={s.previewEmptyIcon}>🎬</Text>
            <Text style={s.previewEmptyText}>Add clips to start editing</Text>
          </View>
        ) : (
          <View style={s.previewActive}>
            <Text style={s.previewClipCount}>{clips.filter(c => c.track === 0).length} clip(s)</Text>
            <Text style={s.previewDuration}>{totalDuration.toFixed(1)}s</Text>
          </View>
        )}
      </View>

      {/* Timeline */}
      <View style={s.timeline}>
        <Text style={s.timelineLabel}>Timeline</Text>
        {[0, 1, 2, 3].map(trackNum => {
          const trackClips = clips.filter(c => c.track === trackNum);
          return (
            <View key={trackNum} style={s.track}>
              <Text style={[s.trackLabel, { color: TRACK_COLORS[trackNum] }]}>
                {TRACK_LABELS[trackNum]}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.trackClips}>
                {trackClips.length === 0 ? (
                  <View style={s.trackEmpty}>
                    <Text style={s.trackEmptyText}>+</Text>
                  </View>
                ) : (
                  trackClips.map(clip => (
                    <TouchableOpacity
                      key={clip.id}
                      style={[
                        s.clip,
                        { backgroundColor: clip.color + '40', borderColor: clip.color },
                        selectedClip?.id === clip.id && s.clipSelected,
                        { width: Math.max(60, clip.durationSec * 20) },
                      ]}
                      onPress={() => setSelectedClip(clip === selectedClip ? null : clip)}>
                      <Text style={s.clipName} numberOfLines={1}>{clip.filename}</Text>
                      <Text style={s.clipDuration}>{clip.durationSec.toFixed(1)}s</Text>
                      {clip.muted && <Text style={s.mutedBadge}>🔇</Text>}
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </View>
          );
        })}
      </View>

      {/* Selected Clip Controls */}
      {selectedClip && (
        <View style={s.clipControls}>
          <Text style={s.clipControlTitle}>{selectedClip.filename}</Text>
          <View style={s.clipControlRow}>
            <TouchableOpacity style={s.clipControlBtn} onPress={() => toggleMute(selectedClip.id)}>
              <Text style={s.clipControlBtnText}>{selectedClip.muted ? '🔇 Unmute' : '🔊 Mute'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.clipControlBtn, { borderColor: COLORS.error }]}
              onPress={() => deleteClip(selectedClip.id)}>
              <Text style={[s.clipControlBtnText, { color: COLORS.error }]}>🗑 Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Quick Tools */}
      <View style={s.toolRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10, paddingHorizontal: 16 }}>
          {quickTools.map(tool => (
            <TouchableOpacity key={tool.id} style={[s.toolBtn, { borderColor: tool.color }]} onPress={tool.action}>
              <Text style={s.toolIcon}>{tool.icon}</Text>
              <Text style={[s.toolLabel, { color: tool.color }]}>{tool.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* AI Tools */}
      <View style={s.aiSection}>
        <Text style={s.aiSectionTitle}>🤖 AI Tools</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10, paddingHorizontal: 16 }}>
          {aiTools.map(tool => (
            <TouchableOpacity
              key={tool.id}
              style={[s.aiBtn, { borderColor: tool.color }]}
              onPress={tool.action}
              disabled={loading}>
              {loading && tool.id !== 'marketplace' ? (
                <ActivityIndicator size="small" color={tool.color} />
              ) : (
                <Text style={s.toolIcon}>{tool.icon}</Text>
              )}
              <Text style={[s.toolLabel, { color: tool.color }]}>{tool.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Import buttons */}
      <View style={s.importRow}>
        <TouchableOpacity style={s.importBtn} onPress={importFromGallery}>
          <Text style={s.importBtnText}>📷 Import Video</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.importBtn} onPress={importFromFiles}>
          <Text style={s.importBtnText}>📂 Import File</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.importBtn, { borderColor: COLORS.accent }]} onPress={sendToDesktop}>
          <Text style={[s.importBtnText, { color: COLORS.accent }]}>🖥️ Desktop</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────

const s = StyleSheet.create({
  root:              { flex: 1, backgroundColor: COLORS.background },
  header:            { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 6, gap: 10 },
  backBtn:           { color: COLORS.textMuted, fontSize: 22, width: 32 },
  title:             { flex: 1, color: COLORS.text, fontSize: 16, fontWeight: '700' },
  exportBtn:         { backgroundColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7 },
  exportBtnText:     { color: '#0F0F0F', fontWeight: '700', fontSize: 13 },
  preview:           { height: 180, backgroundColor: COLORS.card, margin: 12, borderRadius: 12, borderColor: COLORS.border, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  previewEmpty:      { alignItems: 'center', gap: 8 },
  previewEmptyIcon:  { fontSize: 40 },
  previewEmptyText:  { color: COLORS.textMuted, fontSize: 13 },
  previewActive:     { alignItems: 'center', gap: 4 },
  previewClipCount:  { color: COLORS.primary, fontSize: 20, fontWeight: '700' },
  previewDuration:   { color: COLORS.textMuted, fontSize: 14 },
  timeline:          { paddingHorizontal: 12, marginBottom: 6 },
  timelineLabel:     { color: COLORS.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  track:             { flexDirection: 'row', alignItems: 'center', marginBottom: 6, height: 44 },
  trackLabel:        { width: 56, fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },
  trackClips:        { flex: 1 },
  trackEmpty:        { width: 44, height: 36, backgroundColor: COLORS.card, borderRadius: 6, borderColor: COLORS.border, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  trackEmptyText:    { color: COLORS.border, fontSize: 18 },
  clip:              { height: 36, borderRadius: 6, borderWidth: 1, paddingHorizontal: 8, justifyContent: 'center', marginRight: 4 },
  clipSelected:      { borderWidth: 2 },
  clipName:          { color: COLORS.text, fontSize: 9, fontWeight: '600' },
  clipDuration:      { color: COLORS.textMuted, fontSize: 8 },
  mutedBadge:        { fontSize: 8, position: 'absolute', top: 2, right: 4 },
  clipControls:      { marginHorizontal: 12, backgroundColor: COLORS.card, borderRadius: 10, padding: 10, marginBottom: 6, borderColor: COLORS.border, borderWidth: 1 },
  clipControlTitle:  { color: COLORS.text, fontSize: 12, fontWeight: '600', marginBottom: 6 },
  clipControlRow:    { flexDirection: 'row', gap: 8 },
  clipControlBtn:    { flex: 1, borderColor: COLORS.border, borderWidth: 1, borderRadius: 8, paddingVertical: 7, alignItems: 'center' },
  clipControlBtnText:{ color: COLORS.text, fontSize: 12, fontWeight: '600' },
  toolRow:           { paddingVertical: 8 },
  aiSection:         { paddingBottom: 6 },
  aiSectionTitle:    { color: COLORS.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', paddingHorizontal: 16, marginBottom: 6 },
  toolBtn:           { backgroundColor: COLORS.card, borderRadius: 10, borderWidth: 1, paddingVertical: 10, paddingHorizontal: 14, alignItems: 'center', gap: 4, minWidth: 64 },
  aiBtn:             { backgroundColor: COLORS.card, borderRadius: 10, borderWidth: 1, paddingVertical: 10, paddingHorizontal: 14, alignItems: 'center', gap: 4, minWidth: 72 },
  toolIcon:          { fontSize: 20 },
  toolLabel:         { fontSize: 10, fontWeight: '600' },
  importRow:         { flexDirection: 'row', paddingHorizontal: 12, gap: 8, paddingBottom: 8 },
  importBtn:         { flex: 1, backgroundColor: COLORS.card, borderColor: COLORS.border, borderWidth: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  importBtnText:     { color: COLORS.text, fontSize: 11, fontWeight: '600' },
});
