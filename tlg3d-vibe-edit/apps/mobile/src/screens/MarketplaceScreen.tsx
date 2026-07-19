// ============================================================
//  CutFlow Mobile — Marketplace Screen
//  Browse, install, configure, and manage skills on mobile
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, FlatList, ActivityIndicator, Switch, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../App';

interface Skill {
  id:          string;
  name:        string;
  description: string;
  category:    string;
  pricing:     { type: string; price?: number; pricePerMonth?: number };
  icon:        string;
  rating:      number;
  ratingCount: number;
  downloads:   number;
  verified:    boolean;
  featured:    boolean;
  installed:   boolean;
  enabled?:    boolean;
  tags:        string[];
}

const CATEGORIES = [
  { id: 'all',          label: 'All',        icon: '🌐' },
  { id: 'ai-video',     label: 'AI Video',   icon: '🤖' },
  { id: 'ai-audio',     label: 'AI Audio',   icon: '🎵' },
  { id: 'effects',      label: 'Effects',    icon: '✨' },
  { id: 'color',        label: 'Color',      icon: '🎨' },
  { id: 'text-captions',label: 'Captions',   icon: '💬' },
  { id: 'social',       label: 'Social',     icon: '📤' },
  { id: 'analytics',    label: 'Analytics',  icon: '📊' },
  { id: 'utility',      label: 'Utility',    icon: '🔧' },
  { id: 'export',       label: 'Export',     icon: '📦' },
];

export default function MarketplaceScreen() {
  const [skills,       setSkills]       = useState<Skill[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [category,     setCategory]     = useState('all');
  const [activeTab,    setActiveTab]    = useState<'browse' | 'installed'>('browse');
  const [installing,   setInstalling]   = useState<Set<string>>(new Set());
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [apiBase,      setApiBase]      = useState('');

  useEffect(() => {
    AsyncStorage.getItem('api_base_url').then(url => {
      const base = url || 'http://localhost:3001';
      setApiBase(base);
      fetchSkills(base);
    });
  }, [category, search]);

  const fetchSkills = async (base?: string) => {
    const url = base || apiBase;
    if (!url) return;
    setLoading(true);
    try {
      const res = await axios.get(`${url}/api/marketplace/skills`, {
        params: {
          category: category === 'all' ? undefined : category,
          search:   search || undefined,
          limit:    50,
        },
      });
      setSkills(res.data.skills || []);
    } catch {
      // Offline: show empty state
      setSkills([]);
    } finally {
      setLoading(false);
    }
  };

  const installedSkills = skills.filter(s => s.installed);

  const handleInstall = async (skill: Skill) => {
    if (skill.pricing.type === 'paid' || skill.pricing.type === 'one-time') {
      Alert.alert(
        `Purchase ${skill.name}`,
        `This skill costs $${skill.pricing.price}. Purchase to install?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: `Buy $${skill.pricing.price}`, onPress: () => doInstall(skill) },
        ]
      );
      return;
    }
    doInstall(skill);
  };

  const doInstall = async (skill: Skill) => {
    setInstalling(prev => new Set(prev).add(skill.id));
    try {
      await axios.post(`${apiBase}/api/marketplace/skills/${skill.id}/install`, {
        userId: 'mobile_user',
      });
      setSkills(prev => prev.map(s =>
        s.id === skill.id ? { ...s, installed: true, enabled: true } : s
      ));
    } catch (err: any) {
      Alert.alert('Install Failed', err.response?.data?.error || err.message);
    } finally {
      setInstalling(prev => { const n = new Set(prev); n.delete(skill.id); return n; });
    }
  };

  const handleUninstall = async (skill: Skill) => {
    Alert.alert(
      `Uninstall ${skill.name}?`,
      'This will remove the skill and its files.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Uninstall', style: 'destructive',
          onPress: async () => {
            try {
              await axios.post(`${apiBase}/api/marketplace/skills/${skill.id}/uninstall`, {});
              setSkills(prev => prev.map(s =>
                s.id === skill.id ? { ...s, installed: false } : s
              ));
            } catch (err: any) {
              Alert.alert('Error', err.message);
            }
          },
        },
      ]
    );
  };

  const handleToggle = async (skill: Skill, enabled: boolean) => {
    try {
      await axios.post(`${apiBase}/api/marketplace/skills/${skill.id}/toggle`, { enabled });
      setSkills(prev => prev.map(s =>
        s.id === skill.id ? { ...s, enabled } : s
      ));
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const pricingLabel = (skill: Skill) => {
    switch (skill.pricing.type) {
      case 'free':         return { label: 'Free',  color: COLORS.success };
      case 'paid':         return { label: `$${skill.pricing.price}`, color: COLORS.accent };
      case 'one-time':     return { label: `$${skill.pricing.price} once`, color: COLORS.accent };
      case 'subscription': return { label: `$${skill.pricing.pricePerMonth}/mo`, color: COLORS.accent };
      default:             return { label: 'Free',  color: COLORS.success };
    }
  };

  const renderSkillCard = ({ item }: { item: Skill }) => {
    const pricing = pricingLabel(item);
    const busy    = installing.has(item.id);

    return (
      <TouchableOpacity
        style={s.skillCard}
        onPress={() => setSelectedSkill(item)}
        activeOpacity={0.85}>
        <View style={s.skillHeader}>
          <Text style={s.skillIcon}>{item.icon}</Text>
          <View style={s.skillInfo}>
            <View style={s.skillTitleRow}>
              <Text style={s.skillName} numberOfLines={1}>{item.name}</Text>
              {item.verified && <Text style={s.verified}>✓</Text>}
              {item.featured && <Text style={s.featured}>⭐</Text>}
            </View>
            <Text style={s.skillDesc} numberOfLines={2}>{item.description}</Text>
            <View style={s.skillMeta}>
              <Text style={[s.priceTag, { color: pricing.color }]}>{pricing.label}</Text>
              <Text style={s.ratingText}>★ {item.rating?.toFixed(1) || '–'}</Text>
              <Text style={s.downloadText}>↓ {item.downloads || 0}</Text>
            </View>
          </View>
        </View>

        <View style={s.skillActions}>
          {item.installed ? (
            <>
              <View style={s.enabledRow}>
                <Text style={s.enabledLabel}>Enabled</Text>
                <Switch
                  value={item.enabled !== false}
                  onValueChange={v => handleToggle(item, v)}
                  trackColor={{ true: COLORS.primary, false: COLORS.border }}
                  thumbColor={COLORS.text}
                  style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                />
              </View>
              <TouchableOpacity
                style={s.uninstallBtn}
                onPress={() => handleUninstall(item)}>
                <Text style={s.uninstallText}>Remove</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[s.installBtn, busy && { opacity: 0.6 }]}
              onPress={() => handleInstall(item)}
              disabled={busy}>
              {busy
                ? <ActivityIndicator size="small" color="#0F0F0F" />
                : <Text style={s.installText}>
                    {item.pricing.type === 'free' ? 'Install' : `Buy & Install`}
                  </Text>
              }
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={s.root}>
      {/* Header */}
      <Text style={s.title}>🛒 Skill Marketplace</Text>

      {/* Search Bar */}
      <TextInput
        style={s.searchBar}
        placeholder="Search skills..."
        placeholderTextColor={COLORS.textMuted}
        value={search}
        onChangeText={v => { setSearch(v); fetchSkills(); }}
        returnKeyType="search"
      />

      {/* Tabs: Browse / Installed */}
      <View style={s.tabs}>
        <TouchableOpacity
          style={[s.tab, activeTab === 'browse' && s.tabActive]}
          onPress={() => setActiveTab('browse')}>
          <Text style={[s.tabText, activeTab === 'browse' && s.tabTextActive]}>
            Browse ({skills.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.tab, activeTab === 'installed' && s.tabActive]}
          onPress={() => setActiveTab('installed')}>
          <Text style={[s.tabText, activeTab === 'installed' && s.tabTextActive]}>
            Installed ({installedSkills.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Category Pills (browse tab only) */}
      {activeTab === 'browse' && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.categoryRow}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[s.categoryPill, category === cat.id && s.categoryPillActive]}
              onPress={() => setCategory(cat.id)}>
              <Text style={s.categoryPillText}>{cat.icon} {cat.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* List */}
      {loading ? (
        <View style={s.loader}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={s.loaderText}>Loading skills...</Text>
        </View>
      ) : (
        <FlatList
          data={activeTab === 'browse' ? skills : installedSkills}
          renderItem={renderSkillCard}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyText}>
                {activeTab === 'installed' ? 'No skills installed yet.' : 'No skills found.'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:               { flex: 1, backgroundColor: COLORS.background },
  title:              { color: COLORS.text, fontSize: 20, fontWeight: '700', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  searchBar:          { marginHorizontal: 16, marginBottom: 8, backgroundColor: COLORS.card, color: COLORS.text, borderColor: COLORS.border, borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  tabs:               { flexDirection: 'row', borderBottomColor: COLORS.border, borderBottomWidth: 1, marginHorizontal: 16 },
  tab:                { flex: 1, paddingVertical: 10, alignItems: 'center' },
  tabActive:          { borderBottomColor: COLORS.primary, borderBottomWidth: 2 },
  tabText:            { color: COLORS.textMuted, fontSize: 13, fontWeight: '600' },
  tabTextActive:      { color: COLORS.primary },
  categoryRow:        { maxHeight: 46, marginVertical: 8 },
  categoryPill:       { backgroundColor: COLORS.card, borderColor: COLORS.border, borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, alignItems: 'center', justifyContent: 'center' },
  categoryPillActive: { backgroundColor: COLORS.primary + '20', borderColor: COLORS.primary },
  categoryPillText:   { color: COLORS.text, fontSize: 12, fontWeight: '600' },
  skillCard:          { backgroundColor: COLORS.card, borderColor: COLORS.border, borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 10 },
  skillHeader:        { flexDirection: 'row', gap: 12, marginBottom: 10 },
  skillIcon:          { fontSize: 32, width: 40 },
  skillInfo:          { flex: 1 },
  skillTitleRow:      { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  skillName:          { color: COLORS.text, fontSize: 15, fontWeight: '700', flex: 1 },
  verified:           { color: COLORS.primary, fontSize: 13 },
  featured:           { fontSize: 13 },
  skillDesc:          { color: COLORS.textMuted, fontSize: 12, lineHeight: 17 },
  skillMeta:          { flexDirection: 'row', gap: 10, marginTop: 6 },
  priceTag:           { fontSize: 12, fontWeight: '700' },
  ratingText:         { color: COLORS.textMuted, fontSize: 12 },
  downloadText:       { color: COLORS.textMuted, fontSize: 12 },
  skillActions:       { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 10 },
  installBtn:         { backgroundColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 18, paddingVertical: 8 },
  installText:        { color: '#0F0F0F', fontWeight: '700', fontSize: 13 },
  enabledRow:         { flexDirection: 'row', alignItems: 'center', gap: 6 },
  enabledLabel:       { color: COLORS.textMuted, fontSize: 12 },
  uninstallBtn:       { borderColor: COLORS.border, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
  uninstallText:      { color: COLORS.textMuted, fontSize: 12 },
  loader:             { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 12 },
  loaderText:         { color: COLORS.textMuted, fontSize: 14 },
  empty:              { paddingTop: 60, alignItems: 'center' },
  emptyText:          { color: COLORS.textMuted, fontSize: 14 },
});
