// ============================================================
//  CutFlow Mobile — Audio Library Screen
//  Browse royalty-free music + SFX library
//  Search YouTube, Spotify, Apple Music, Amazon Music,
//  SoundCloud, and Tidal
//  Add tracks to active video project
// ============================================================

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ScrollView, Linking, Alert, ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../App';

// ── Types ─────────────────────────────────────────────────────

interface LocalTrack {
  id:          string;
  title:       string;
  artist:      string;
  category:    string;
  durationSec: number;
  bpm?:        number;
  mood:        string[];
  tags:        string[];
  license:     string;
  source:      string;
  streamUrl:   string;
  downloadUrl: string;
  featured:    boolean;
}

interface ExternalTrack {
  id:          string;
  title:       string;
  artist:      string;
  album?:      string;
  durationSec: number;
  thumbnailUrl?: string;
  previewUrl?:  string;
  deepLink:    string;
  externalUrl: string;
  platform:    string;
  explicit:    boolean;
}

type AudioTab = 'free-library' | 'search' | 'added';

const PLATFORM_ICONS: Record<string, string> = {
  youtube:       '▶️',
  spotify:       '🎵',
  'apple-music': '🍎',
  'amazon-music':'📦',
  soundcloud:    '☁️',
  tidal:         '🌊',
};

const PLATFORM_COLORS: Record<string, string> = {
  youtube:       '#FF0000',
  spotify:       '#1DB954',
  'apple-music': '#FC3C44',
  'amazon-music':'#FF9900',
  soundcloud:    '#FF5500',
  tidal:         '#00FFFF',
};

const CATEGORY_META: Record<string, { label: string; icon: string }> = {
  'all':            { label: 'All',          icon: '🎵' },
  'cinematic':      { label: 'Cinematic',    icon: '🎬' },
  'upbeat':         { label: 'Upbeat',       icon: '⚡' },
  'chill':          { label: 'Chill',        icon: '😌' },
  'electronic':     { label: 'Electronic',   icon: '🎛️' },
  'hip-hop':        { label: 'Hip-Hop',      icon: '🎤' },
  'acoustic':       { label: 'Acoustic',     icon: '🎸' },
  'ambient':        { label: 'Ambient',      icon: '🌫️' },
  'dramatic':       { label: 'Dramatic',     icon: '🎭' },
  'corporate':      { label: 'Corporate',    icon: '💼' },
  'inspirational':  { label: 'Inspiring',    icon: '🚀' },
  'travel':         { label: 'Travel',       icon: '✈️' },
  'sports':         { label: 'Sports',       icon: '🏆' },
  'horror':         { label: 'Horror',       icon: '😱' },
  'sfx-transitions':{ label: 'Transitions',  icon: '↔️' },
  'sfx-impact':     { label: 'Impact',       icon: '💥' },
  'sfx-whoosh':     { label: 'Whoosh',       icon: '💨' },
  'sfx-ui':         { label: 'UI Sounds',    icon: '🔔' },
  'sfx-nature':     { label: 'Nature',       icon: '🌿' },
};

// ── Component ─────────────────────────────────────────────────

export default function AudioLibraryScreen({ route, navigation }: any) {
  const projectId  = route?.params?.projectId || '';

  const [activeTab,     setActiveTab]     = useState<AudioTab>('free-library');
  const [category,      setCategory]      = useState('all');
  const [libraryTracks, setLibraryTracks] = useState<LocalTrack[]>([]);
  const [searchQuery,   setSearchQuery]   = useState('');
  const [searchResults, setSearchResults] = useState<Record<string, ExternalTrack[]>>({});
  const [searching,     setSearching]     = useState(false);
  const [addedTracks,   setAddedTracks]   = useState<LocalTrack[]>([]);
  const [playingId,     setPlayingId]     = useState<string | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [apiBase,       setApiBase]       = useState('http://localhost:3000');

  useEffect(() => {
    AsyncStorage.getItem('api_base_url').then(url => {
      const base = url || 'http://localhost:3000';
      setApiBase(base);
      fetchLibrary(base, category);
    });
  }, [category]);

  const fetchLibrary = async (base: string, cat: string) => {
    setLoading(true);
    try {
      const res = await axios.get(`${base}/api/audio/library`, {
        params: { category: cat === 'all' ? undefined : cat },
      });
      setLibraryTracks(res.data.tracks || []);
    } catch {
      setLibraryTracks([]);
    } finally {
      setLoading(false);
    }
  };

  const searchAllPlatforms = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await axios.get(`${apiBase}/api/audio/search`, {
        params: { q: searchQuery, limit: 5 },
      });
      setSearchResults(res.data.results || {});
    } catch {
      setSearchResults({});
    } finally {
      setSearching(false);
    }
  };

  const addToProject = async (track: LocalTrack) => {
    if (!projectId) {
      Alert.alert('No Project', 'Open a project first to add music.');
      return;
    }
    try {
      await axios.post(`${apiBase}/api/audio/add-to-project`, {
        projectId,
        trackId:     track.id,
        trackUrl:    track.downloadUrl,
        trackTitle:  track.title,
        trackArtist: track.artist,
      });
      setAddedTracks(prev => [...prev, track]);
      Alert.alert('Added!', `"${track.title}" added to your project.`);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const openExternal = (track: ExternalTrack) => {
    Alert.alert(
      `Open in ${track.platform}?`,
      `"${track.title}" by ${track.artist}\n\nOpen in the ${track.platform} app to license and use this track.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: `Open ${PLATFORM_ICONS[track.platform]} App`,
          onPress: async () => {
            const opened = await Linking.canOpenURL(track.deepLink);
            if (opened) {
              await Linking.openURL(track.deepLink);
            } else {
              await Linking.openURL(track.externalUrl);
            }
          },
        },
      ]
    );
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const renderLocalTrack = ({ item }: { item: LocalTrack }) => {
    const isPlaying = playingId === item.id;
    const isAdded   = addedTracks.some(t => t.id === item.id);

    return (
      <View style={s.trackCard}>
        <View style={s.trackInfo}>
          <View style={s.trackTitleRow}>
            <Text style={s.trackTitle} numberOfLines={1}>{item.title}</Text>
            <View style={s.licenseBadge}>
              <Text style={s.licenseText}>{item.license}</Text>
            </View>
          </View>
          <Text style={s.trackArtist} numberOfLines={1}>{item.artist}</Text>
          <View style={s.trackMeta}>
            {item.durationSec > 0 && (
              <Text style={s.trackDuration}>{formatDuration(item.durationSec)}</Text>
            )}
            {item.bpm && <Text style={s.trackBpm}>{item.bpm} BPM</Text>}
            {item.mood.slice(0, 2).map(m => (
              <View key={m} style={s.moodChip}>
                <Text style={s.moodText}>{m}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={s.trackActions}>
          <TouchableOpacity
            style={[s.playBtn, isPlaying && { backgroundColor: COLORS.primary + '40' }]}
            onPress={() => setPlayingId(isPlaying ? null : item.id)}>
            <Text style={s.playBtnText}>{isPlaying ? '⏸' : '▶'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.addBtn, isAdded && { backgroundColor: COLORS.success + '20', borderColor: COLORS.success }]}
            onPress={() => isAdded ? null : addToProject(item)}>
            <Text style={[s.addBtnText, isAdded && { color: COLORS.success }]}>
              {isAdded ? '✓' : '+'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderExternalTrack = (track: ExternalTrack) => (
    <TouchableOpacity key={track.id} style={s.externalCard} onPress={() => openExternal(track)}>
      <View style={s.trackInfo}>
        <Text style={s.trackTitle} numberOfLines={1}>{track.title}</Text>
        <Text style={s.trackArtist} numberOfLines={1}>{track.artist}</Text>
        {track.album && <Text style={s.trackAlbum} numberOfLines={1}>{track.album}</Text>}
        <View style={s.trackMeta}>
          {track.durationSec > 0 && (
            <Text style={s.trackDuration}>{formatDuration(track.durationSec)}</Text>
          )}
          {track.explicit && <Text style={s.explicitBadge}>E</Text>}
        </View>
      </View>
      <View style={s.externalAction}>
        <Text style={[s.platformIcon, { color: PLATFORM_COLORS[track.platform] }]}>
          {PLATFORM_ICONS[track.platform]}
        </Text>
        <Text style={s.openText}>Open</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()}>
          <Text style={s.backBtn}>←</Text>
        </TouchableOpacity>
        <Text style={s.title}>🎵 Audio Library</Text>
      </View>

      {/* Tabs */}
      <View style={s.tabs}>
        {([
          { id: 'free-library', label: '🆓 Free Library' },
          { id: 'search',       label: '🔍 Search Music' },
          { id: 'added',        label: `✓ Added (${addedTracks.length})` },
        ] as const).map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[s.tab, activeTab === tab.id && s.tabActive]}
            onPress={() => setActiveTab(tab.id)}>
            <Text style={[s.tabText, activeTab === tab.id && s.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* FREE LIBRARY TAB */}
      {activeTab === 'free-library' && (
        <View style={{ flex: 1 }}>
          {/* Category Filter */}
          <ScrollView
            horizontal showsHorizontalScrollIndicator={false}
            style={s.categoryRow} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
            {Object.entries(CATEGORY_META).map(([id, meta]) => (
              <TouchableOpacity
                key={id}
                style={[s.categoryPill, category === id && s.categoryPillActive]}
                onPress={() => setCategory(id)}>
                <Text style={s.categoryPillText}>{meta.icon} {meta.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {loading ? (
            <View style={s.loader}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={s.loaderText}>Loading tracks...</Text>
            </View>
          ) : (
            <FlatList
              data={libraryTracks}
              renderItem={renderLocalTrack}
              keyExtractor={t => t.id}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <Text style={s.emptyText}>No tracks in this category.</Text>
              }
              ListHeaderComponent={
                <View style={s.libraryHeader}>
                  <Text style={s.libraryCount}>{libraryTracks.length} tracks • All CC0 / Royalty-Free</Text>
                </View>
              }
            />
          )}
        </View>
      )}

      {/* SEARCH TAB */}
      {activeTab === 'search' && (
        <View style={{ flex: 1 }}>
          {/* Search Bar */}
          <View style={s.searchBar}>
            <TextInput
              style={s.searchInput}
              placeholder="Search any song, artist, or album..."
              placeholderTextColor={COLORS.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              onSubmitEditing={searchAllPlatforms}
            />
            <TouchableOpacity style={s.searchBtn} onPress={searchAllPlatforms} disabled={searching}>
              {searching
                ? <ActivityIndicator size="small" color="#0F0F0F" />
                : <Text style={s.searchBtnText}>Search</Text>
              }
            </TouchableOpacity>
          </View>

          {/* Platform Disclaimer */}
          <View style={s.disclaimer}>
            <Text style={s.disclaimerText}>
              ⚠️ External tracks require a subscription to the music service. Tap to open in native app.
              For free, use the Free Library tab.
            </Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            {Object.entries(searchResults).map(([platform, tracks]) => {
              if (!tracks || tracks.length === 0) return null;
              return (
                <View key={platform} style={s.platformSection}>
                  <Text style={[s.platformSectionTitle, { color: PLATFORM_COLORS[platform] }]}>
                    {PLATFORM_ICONS[platform]} {platform.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Text>
                  {tracks.map(renderExternalTrack)}
                </View>
              );
            })}
            {Object.keys(searchResults).length === 0 && !searching && searchQuery && (
              <Text style={s.emptyText}>No results. Try a different search.</Text>
            )}
          </ScrollView>
        </View>
      )}

      {/* ADDED TAB */}
      {activeTab === 'added' && (
        <FlatList
          data={addedTracks}
          renderItem={renderLocalTrack}
          keyExtractor={t => t.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyIcon}>🎵</Text>
              <Text style={s.emptyText}>No tracks added yet.</Text>
              <Text style={s.emptySub}>Browse the Free Library and tap + to add tracks.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────

const s = StyleSheet.create({
  root:               { flex: 1, backgroundColor: COLORS.background },
  header:             { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, gap: 12 },
  backBtn:            { color: COLORS.textMuted, fontSize: 22 },
  title:              { color: COLORS.text, fontSize: 20, fontWeight: '700' },
  tabs:               { flexDirection: 'row', borderBottomColor: COLORS.border, borderBottomWidth: 1, marginHorizontal: 0 },
  tab:                { flex: 1, paddingVertical: 10, alignItems: 'center' },
  tabActive:          { borderBottomColor: COLORS.primary, borderBottomWidth: 2 },
  tabText:            { color: COLORS.textMuted, fontSize: 11, fontWeight: '600' },
  tabTextActive:      { color: COLORS.primary },
  categoryRow:        { maxHeight: 46, marginVertical: 8 },
  categoryPill:       { backgroundColor: COLORS.card, borderColor: COLORS.border, borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7, alignItems: 'center', justifyContent: 'center' },
  categoryPillActive: { backgroundColor: COLORS.primary + '20', borderColor: COLORS.primary },
  categoryPillText:   { color: COLORS.text, fontSize: 12, fontWeight: '600' },
  libraryHeader:      { paddingVertical: 8 },
  libraryCount:       { color: COLORS.textMuted, fontSize: 12 },
  trackCard:          { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 10, borderColor: COLORS.border, borderWidth: 1, padding: 12, marginBottom: 8, gap: 10 },
  trackInfo:          { flex: 1 },
  trackTitleRow:      { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  trackTitle:         { color: COLORS.text, fontSize: 14, fontWeight: '600', flex: 1 },
  licenseBadge:       { backgroundColor: COLORS.success + '20', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  licenseText:        { color: COLORS.success, fontSize: 9, fontWeight: '700' },
  trackArtist:        { color: COLORS.textMuted, fontSize: 11, marginBottom: 4 },
  trackAlbum:         { color: COLORS.textMuted, fontSize: 11 },
  trackMeta:          { flexDirection: 'row', alignItems: 'center', gap: 8 },
  trackDuration:      { color: COLORS.textMuted, fontSize: 11 },
  trackBpm:           { color: COLORS.accent, fontSize: 11, fontWeight: '600' },
  moodChip:           { backgroundColor: COLORS.surface, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  moodText:           { color: COLORS.textMuted, fontSize: 9 },
  trackActions:       { flexDirection: 'row', gap: 8 },
  playBtn:            { backgroundColor: COLORS.surface, borderColor: COLORS.border, borderWidth: 1, borderRadius: 8, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  playBtnText:        { color: COLORS.text, fontSize: 14 },
  addBtn:             { backgroundColor: COLORS.primary + '20', borderColor: COLORS.primary, borderWidth: 1, borderRadius: 8, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  addBtnText:         { color: COLORS.primary, fontSize: 18, fontWeight: '700' },
  externalCard:       { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 10, borderColor: COLORS.border, borderWidth: 1, padding: 12, marginBottom: 6, gap: 10 },
  externalAction:     { alignItems: 'center', gap: 2 },
  platformIcon:       { fontSize: 22 },
  openText:           { color: COLORS.textMuted, fontSize: 9 },
  explicitBadge:      { backgroundColor: COLORS.textMuted, borderRadius: 3, paddingHorizontal: 4, paddingVertical: 1, color: '#000', fontSize: 9, fontWeight: '700' },
  searchBar:          { flexDirection: 'row', marginHorizontal: 16, marginVertical: 10, gap: 8 },
  searchInput:        { flex: 1, backgroundColor: COLORS.card, color: COLORS.text, borderColor: COLORS.border, borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14 },
  searchBtn:          { backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  searchBtnText:      { color: '#0F0F0F', fontWeight: '700', fontSize: 13 },
  disclaimer:         { marginHorizontal: 16, marginBottom: 8, backgroundColor: COLORS.warning + '15', borderRadius: 8, padding: 10, borderColor: COLORS.warning + '40', borderWidth: 1 },
  disclaimerText:     { color: COLORS.warning, fontSize: 11 },
  platformSection:    { marginBottom: 16, paddingHorizontal: 16 },
  platformSectionTitle:{ fontSize: 14, fontWeight: '700', marginBottom: 8, textTransform: 'capitalize' },
  loader:             { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 12 },
  loaderText:         { color: COLORS.textMuted, fontSize: 14 },
  empty:              { paddingTop: 60, alignItems: 'center', gap: 8 },
  emptyIcon:          { fontSize: 48 },
  emptyText:          { color: COLORS.textMuted, fontSize: 14, textAlign: 'center', paddingTop: 40 },
  emptySub:           { color: COLORS.textMuted, fontSize: 12, textAlign: 'center' },
});
