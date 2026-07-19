// ============================================================
//  CutFlow Mobile — Projects Screen
//  Shows all projects for the identified user, grouped by
//  platform/user folder, with queue status and quick actions
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Alert, Modal, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../App';

interface Project {
  projectId:   string;
  projectName: string;
  status:      'draft' | 'in_progress' | 'processing' | 'completed' | 'archived';
  progress:    number;
  resolution:  string;
  fps:         number;
  updatedAt:   string;
  createdAt:   string;
  queueInfo?:  { status: string; position: number };
}

const STATUS_COLOR: Record<string, string> = {
  draft:       COLORS.textMuted,
  in_progress: COLORS.accent,
  processing:  COLORS.primary,
  completed:   COLORS.success,
  archived:    COLORS.textMuted,
};

const STATUS_ICON: Record<string, string> = {
  draft:       '📝',
  in_progress: '✏️',
  processing:  '⏳',
  completed:   '✅',
  archived:    '📦',
};

export default function ProjectsScreen({ navigation }: any) {
  const [projects,   setProjects]   = useState<Project[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [userId,     setUserId]     = useState('');
  const [username,   setUsername]   = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newName,    setNewName]    = useState('');
  const [creating,   setCreating]   = useState(false);
  const [apiBase,    setApiBase]    = useState('http://localhost:3000');
  const [queueStats, setQueueStats] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem('user_id'),
      AsyncStorage.getItem('username'),
      AsyncStorage.getItem('api_base_url'),
    ]).then(([uid, uname, url]) => {
      const id   = uid   || 'mobile_user';
      const name = uname || 'user';
      const base = url   || 'http://localhost:3000';
      setUserId(id);
      setUsername(name);
      setApiBase(base);
      fetchProjects(id, name, base);
    });
  }, []);

  const fetchProjects = async (uid: string, uname: string, base: string) => {
    setLoading(true);
    try {
      const res = await axios.get(`${base}/api/projects/${uid}`, {
        params: { username: uname },
      });
      setProjects(res.data.projects || []);
      setQueueStats(res.data.queueStats);
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const createProject = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await axios.post(`${apiBase}/api/projects/create`, {
        userId:      userId,
        username:    username,
        projectName: newName.trim(),
      });
      setNewName('');
      setShowCreate(false);
      fetchProjects(userId, username, apiBase);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setCreating(false);
    }
  };

  const archiveProject = async (project: Project) => {
    Alert.alert(
      'Archive Project?',
      `"${project.projectName}" will be moved to archive.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive', style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(
                `${apiBase}/api/projects/${userId}/${project.projectId}`,
                { params: { username, projectName: project.projectName, action: 'archive' } }
              );
              fetchProjects(userId, username, apiBase);
            } catch (err: any) {
              Alert.alert('Error', err.message);
            }
          },
        },
      ]
    );
  };

  const renderProject = ({ item }: { item: Project }) => (
    <TouchableOpacity
      style={s.card}
      onPress={() => navigation.navigate('Editor', { project: item })}
      onLongPress={() => archiveProject(item)}>

      <View style={s.cardHeader}>
        <Text style={s.cardIcon}>{STATUS_ICON[item.status]}</Text>
        <View style={s.cardInfo}>
          <Text style={s.cardTitle} numberOfLines={1}>{item.projectName}</Text>
          <Text style={s.cardSub}>
            {item.resolution} · {item.fps}fps · {new Date(item.updatedAt).toLocaleDateString()}
          </Text>
        </View>
        <Text style={[s.statusBadge, { color: STATUS_COLOR[item.status] }]}>
          {item.status}
        </Text>
      </View>

      {/* Progress bar */}
      <View style={s.progressBar}>
        <View style={[s.progressFill, { width: `${item.progress}%` as any }]} />
      </View>

      {/* Queue info */}
      {item.queueInfo?.status === 'pending' && (
        <Text style={s.queueText}>
          📍 Queue position #{item.queueInfo.position}
        </Text>
      )}
      {item.queueInfo?.status === 'processing' && (
        <Text style={s.processingText}>⏳ Processing on desktop...</Text>
      )}

      {/* Quick actions */}
      <View style={s.cardActions}>
        <TouchableOpacity
          style={s.actionBtn}
          onPress={() => navigation.navigate('Remote', { project: item })}>
          <Text style={s.actionText}>🖥️ Send to Desktop</Text>
        </TouchableOpacity>
        {item.status === 'completed' && (
          <TouchableOpacity
            style={[s.actionBtn, { backgroundColor: COLORS.success + '20', borderColor: COLORS.success }]}
            onPress={() => navigation.navigate('SocialShare', {
              videoPath:  item.projectId,
              videoTitle: item.projectName,
            })}>
            <Text style={[s.actionText, { color: COLORS.success }]}>📤 Share</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.title}>📁 Projects</Text>
          <Text style={s.userLine}>@{username}</Text>
        </View>
        <TouchableOpacity style={s.createBtn} onPress={() => setShowCreate(true)}>
          <Text style={s.createBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {/* Queue Stats */}
      {queueStats && (
        <View style={s.queueBar}>
          <Text style={s.queueBarText}>
            Queue: {queueStats.processing}/3 processing · {queueStats.pending} pending
          </Text>
          {queueStats.processing >= 3 && (
            <Text style={s.queueFull}>⚠️ Queue full</Text>
          )}
        </View>
      )}

      {/* Projects List */}
      {loading ? (
        <View style={s.loader}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={projects}
          renderItem={renderProject}
          keyExtractor={item => item.projectId}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyIcon}>🎬</Text>
              <Text style={s.emptyText}>No projects yet</Text>
              <Text style={s.emptySub}>Tap "+ New" to create your first project</Text>
            </View>
          }
        />
      )}

      {/* Create Project Modal */}
      <Modal visible={showCreate} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>New Project</Text>
            <TextInput
              style={s.modalInput}
              placeholder="Project name"
              placeholderTextColor={COLORS.textMuted}
              value={newName}
              onChangeText={setNewName}
              autoFocus
            />
            <View style={s.modalActions}>
              <TouchableOpacity
                style={s.cancelBtn}
                onPress={() => { setShowCreate(false); setNewName(''); }}>
                <Text style={s.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.createProjectBtn, (!newName.trim() || creating) && { opacity: 0.5 }]}
                onPress={createProject}
                disabled={!newName.trim() || creating}>
                {creating
                  ? <ActivityIndicator size="small" color="#0F0F0F" />
                  : <Text style={s.createProjectText}>Create</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:             { flex: 1, backgroundColor: COLORS.background },
  header:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  title:            { color: COLORS.text, fontSize: 20, fontWeight: '700' },
  userLine:         { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  createBtn:        { backgroundColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  createBtnText:    { color: '#0F0F0F', fontWeight: '700', fontSize: 14 },
  queueBar:         { marginHorizontal: 16, marginBottom: 8, backgroundColor: COLORS.card, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderColor: COLORS.border, borderWidth: 1 },
  queueBarText:     { color: COLORS.textMuted, fontSize: 12 },
  queueFull:        { color: COLORS.warning, fontSize: 12, fontWeight: '600' },
  card:             { backgroundColor: COLORS.card, borderColor: COLORS.border, borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 10 },
  cardHeader:       { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  cardIcon:         { fontSize: 22 },
  cardInfo:         { flex: 1 },
  cardTitle:        { color: COLORS.text, fontSize: 15, fontWeight: '700' },
  cardSub:          { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  statusBadge:      { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  progressBar:      { height: 3, backgroundColor: COLORS.border, borderRadius: 2, overflow: 'hidden', marginBottom: 8 },
  progressFill:     { height: '100%', backgroundColor: COLORS.primary, borderRadius: 2 },
  queueText:        { color: COLORS.accent, fontSize: 11, marginBottom: 6 },
  processingText:   { color: COLORS.primary, fontSize: 11, marginBottom: 6 },
  cardActions:      { flexDirection: 'row', gap: 8 },
  actionBtn:        { backgroundColor: COLORS.primary + '20', borderColor: COLORS.primary, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  actionText:       { color: COLORS.primary, fontSize: 12, fontWeight: '600' },
  loader:           { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  empty:            { paddingTop: 80, alignItems: 'center', gap: 8 },
  emptyIcon:        { fontSize: 48 },
  emptyText:        { color: COLORS.text, fontSize: 18, fontWeight: '700' },
  emptySub:         { color: COLORS.textMuted, fontSize: 13 },
  modalOverlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalCard:        { backgroundColor: COLORS.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle:       { color: COLORS.text, fontSize: 18, fontWeight: '700', marginBottom: 16 },
  modalInput:       { backgroundColor: COLORS.card, color: COLORS.text, borderColor: COLORS.border, borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 16, fontSize: 16 },
  modalActions:     { flexDirection: 'row', gap: 10 },
  cancelBtn:        { flex: 1, borderColor: COLORS.border, borderWidth: 1, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  cancelText:       { color: COLORS.textMuted, fontWeight: '600' },
  createProjectBtn: { flex: 1, backgroundColor: COLORS.primary, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  createProjectText:{ color: '#0F0F0F', fontWeight: '800', fontSize: 15 },
});
