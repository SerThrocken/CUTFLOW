// ============================================================
//  CutFlow Mobile — Remote Desktop Screen
//  Connects to a desktop running CutFlow via WebSocket.
//  Shows connected user's projects, lets mobile user:
//    • browse & open projects
//    • send mobile footage to desktop for deep editing
//    • receive rendered output back to phone
//    • stream live job progress
// ============================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Platform, NativeModules,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { COLORS } from '../App';

const { TLG3DModule } = NativeModules;

// ── Types ─────────────────────────────────────────────────────

interface DesktopDevice {
  name:   string;
  host:   string;
  port:   number;
  userId: string;
}

interface RemoteProject {
  projectId:   string;
  projectName: string;
  status:      string;
  progress:    number;
  updatedAt:   string;
}

interface TransferJob {
  jobId:    string;
  filename: string;
  status:   'uploading' | 'queued' | 'processing' | 'done' | 'error';
  progress: number;
  direction: 'to-desktop' | 'from-desktop';
}

// ── Screen Component ──────────────────────────────────────────

export default function RemoteScreen() {
  const [desktopHost, setDesktopHost] = useState('');
  const [desktopPort, setDesktopPort] = useState('7373');
  const [connected,   setConnected]   = useState(false);
  const [connecting,  setConnecting]  = useState(false);
  const [projects,    setProjects]    = useState<RemoteProject[]>([]);
  const [transfers,   setTransfers]   = useState<TransferJob[]>([]);
  const [discovered,  setDiscovered]  = useState<DesktopDevice[]>([]);
  const [activeTab,   setActiveTab]   = useState<'projects' | 'transfer' | 'discover'>('discover');
  const [userId,      setUserId]      = useState('');
  const [log,         setLog]         = useState<string[]>([]);

  const ws = useRef<WebSocket | null>(null);

  // ── Auto-discover CutFlow desktops on local network ────────

  useEffect(() => {
    if (Platform.OS === 'ios') {
      TLG3DModule?.startDesktopDiscovery?.()
        .then(() => addLog('Scanning for CutFlow desktops...'))
        .catch((e: any) => addLog(`Discovery failed: ${e.message}`));
    } else if (Platform.OS === 'android') {
      TLG3DModule?.startDesktopDiscovery?.({ resolve: () => {}, reject: () => {} });
    }

    // Listen for discovered desktops
    const { DeviceEventEmitter, NativeEventEmitter } = require('react-native');
    const emitter = Platform.OS === 'ios'
      ? new NativeEventEmitter(TLG3DModule)
      : DeviceEventEmitter;

    const sub = emitter.addListener('onDesktopDiscovered', (info: any) => {
      setDiscovered(prev => {
        if (prev.find(d => d.name === info.name)) return prev;
        return [...prev, {
          name:   info.name,
          host:   info.host   || '',
          port:   info.port   || 7373,
          userId: info.userId || '',
        }];
      });
      addLog(`Found desktop: ${info.name}`);
    });

    return () => sub.remove();
  }, []);

  // ── Connect to desktop via WebSocket ───────────────────────

  const connect = useCallback(async (host?: string, port?: number) => {
    const h = host || desktopHost;
    const p = port || parseInt(desktopPort, 10);

    if (!h) {
      Alert.alert('Missing Host', 'Enter the desktop IP address or select a discovered device.');
      return;
    }

    setConnecting(true);
    addLog(`Connecting to ${h}:${p}...`);

    const socket = new WebSocket(`ws://${h}:${p}`);
    ws.current   = socket;

    socket.onopen = () => {
      setConnected(true);
      setConnecting(false);
      addLog('✓ Connected to CutFlow desktop');

      // Identify ourselves
      socket.send(JSON.stringify({
        msg_type: 'pair_request',
        payload: {
          device_id:   `mobile_${Platform.OS}_${Date.now()}`,
          device_name: `CutFlow ${Platform.OS}`,
          platform:    Platform.OS,
          user_id:     userId,
        },
      }));

      // Request project list
      socket.send(JSON.stringify({
        msg_type: 'list_projects',
        payload:  { user_id: userId },
      }));
    };

    socket.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        handleServerMessage(msg);
      } catch {}
    };

    socket.onclose  = () => {
      setConnected(false);
      setConnecting(false);
      addLog('Disconnected from desktop');
    };

    socket.onerror  = (e: any) => {
      setConnected(false);
      setConnecting(false);
      addLog(`Connection error: ${e.message || 'Unknown error'}`);
    };
  }, [desktopHost, desktopPort, userId]);

  const disconnect = () => {
    ws.current?.close();
    ws.current = null;
    setConnected(false);
    setProjects([]);
    addLog('Disconnected');
  };

  // ── Handle messages from desktop ───────────────────────────

  const handleServerMessage = (msg: { msg_type: string; payload: any }) => {
    switch (msg.msg_type) {
      case 'pair_response':
        addLog(`✓ Paired with desktop (token: ${msg.payload.token?.slice(0, 8)}...)`);
        break;

      case 'project_list':
        setProjects(msg.payload.projects || []);
        addLog(`Loaded ${msg.payload.projects?.length || 0} projects`);
        break;

      case 'job_accepted':
        addLog(`Job queued at position ${msg.payload.position}`);
        setTransfers(prev => prev.map(t =>
          t.jobId === msg.payload.job_id ? { ...t, status: 'queued' } : t
        ));
        break;

      case 'job_progress':
        setTransfers(prev => prev.map(t =>
          t.jobId === msg.payload.job_id
            ? { ...t, progress: msg.payload.progress, status: 'processing' }
            : t
        ));
        break;

      case 'job_complete':
        addLog(`✓ Job ${msg.payload.job_id} complete`);
        setTransfers(prev => prev.map(t =>
          t.jobId === msg.payload.job_id ? { ...t, status: 'done', progress: 100 } : t
        ));
        break;

      case 'download_ready':
        addLog(`Download ready: ${msg.payload.path}`);
        downloadFileFromDesktop(msg.payload.path);
        break;

      case 'pong':
        break;

      case 'error':
        addLog(`Desktop error: ${msg.payload.message}`);
        break;
    }
  };

  // ── Send file to desktop ────────────────────────────────────

  const sendFileToDesktop = async () => {
    if (!connected) {
      Alert.alert('Not Connected', 'Connect to a desktop first.');
      return;
    }

    const result = await DocumentPicker.getDocumentAsync({
      type: ['video/*', 'audio/*', 'image/*'],
    });

    if (result.canceled || !result.assets?.[0]) return;

    const asset   = result.assets[0];
    const jobId   = `job_${Date.now()}`;
    const h       = desktopHost;
    const p       = parseInt(desktopPort, 10);

    setTransfers(prev => [...prev, {
      jobId,
      filename: asset.name,
      status:   'uploading',
      progress: 0,
      direction: 'to-desktop',
    }]);

    addLog(`Uploading ${asset.name}...`);

    try {
      const metadata = JSON.stringify({
        dest_path: `/data/users/${userId}/incoming/${asset.name}`,
        filename:  asset.name,
        job_id:    jobId,
        user_id:   userId,
      });

      await TLG3DModule.sendFileToDesktop(
        asset.uri.replace('file://', ''),
        h,
        p,
        metadata
      );

      // Also send a job request over WebSocket
      ws.current?.send(JSON.stringify({
        msg_type: 'submit_job',
        payload: {
          job_id:     jobId,
          job_type:   'file_transfer',
          project_id: 'incoming',
          user_id:    userId,
          device_id:  `mobile_${Platform.OS}`,
          submitted_at: new Date().toISOString(),
          payload: { filename: asset.name, size: asset.size },
        },
      }));

      setTransfers(prev => prev.map(t =>
        t.jobId === jobId ? { ...t, status: 'queued', progress: 50 } : t
      ));
      addLog(`✓ ${asset.name} uploaded — queued for processing`);
    } catch (err: any) {
      addLog(`Upload failed: ${err.message}`);
      setTransfers(prev => prev.map(t =>
        t.jobId === jobId ? { ...t, status: 'error' } : t
      ));
    }
  };

  // ── Request render from desktop ─────────────────────────────

  const requestRender = (projectId: string, projectName: string) => {
    if (!connected || !ws.current) return;

    const jobId = `render_${Date.now()}`;

    ws.current.send(JSON.stringify({
      msg_type: 'submit_job',
      payload: {
        job_id:      jobId,
        job_type:    'render',
        project_id:  projectId,
        user_id:     userId,
        device_id:   `mobile_${Platform.OS}`,
        submitted_at: new Date().toISOString(),
        payload: { output_format: 'mp4', resolution: '1080p' },
      },
    }));

    setTransfers(prev => [...prev, {
      jobId,
      filename: `${projectName}_render.mp4`,
      status:   'queued',
      progress: 0,
      direction: 'from-desktop',
    }]);

    addLog(`Render job submitted for "${projectName}"`);
  };

  // ── Download finished file from desktop ─────────────────────

  const downloadFileFromDesktop = async (remotePath: string) => {
    if (!connected) return;

    const filename = remotePath.split('/').pop() || 'output.mp4';
    const localUri = `${FileSystem.documentDirectory}${filename}`;

    addLog(`Downloading ${filename}...`);

    try {
      const { uri } = await FileSystem.downloadAsync(
        `http://${desktopHost}:3000/api/files/download?path=${encodeURIComponent(remotePath)}`,
        localUri
      );

      // Save to camera roll / gallery
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        await MediaLibrary.saveToLibraryAsync(uri);
        addLog(`✓ ${filename} saved to Gallery`);
      }
    } catch (err: any) {
      addLog(`Download failed: ${err.message}`);
    }
  };

  // ── Helpers ───────────────────────────────────────────────

  const addLog = (msg: string) =>
    setLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 49)]);

  const statusColor = (s: string) => {
    switch (s) {
      case 'done':       return COLORS.success;
      case 'processing': return COLORS.primary;
      case 'queued':     return COLORS.accent;
      case 'error':      return COLORS.error;
      default:           return COLORS.textMuted;
    }
  };

  // ── Render ─────────────────────────────────────────────────

  return (
    <SafeAreaView style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>🖥️ Remote Desktop</Text>
        <View style={[s.dot, { backgroundColor: connected ? COLORS.success : COLORS.error }]} />
      </View>

      {/* Connection Bar */}
      <View style={s.connectionBar}>
        <TextInput
          style={[s.input, { flex: 2 }]}
          placeholder="Desktop IP (e.g. 192.168.1.100)"
          placeholderTextColor={COLORS.textMuted}
          value={desktopHost}
          onChangeText={setDesktopHost}
          keyboardType="numbers-and-punctuation"
          editable={!connected}
        />
        <TextInput
          style={[s.input, { flex: 1, marginLeft: 8 }]}
          placeholder="Port"
          placeholderTextColor={COLORS.textMuted}
          value={desktopPort}
          onChangeText={setDesktopPort}
          keyboardType="number-pad"
          editable={!connected}
        />
        <TouchableOpacity
          style={[s.btn, { backgroundColor: connected ? COLORS.error : COLORS.primary, marginLeft: 8 }]}
          onPress={connected ? disconnect : () => connect()}
          disabled={connecting}>
          {connecting
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={s.btnText}>{connected ? 'Disconnect' : 'Connect'}</Text>
          }
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={s.tabs}>
        {(['discover', 'projects', 'transfer'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[s.tab, activeTab === tab && s.tabActive]}
            onPress={() => setActiveTab(tab)}>
            <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>
              {tab === 'discover' ? '🔍 Discover' : tab === 'projects' ? '📁 Projects' : '📤 Transfer'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      <ScrollView style={s.content} contentContainerStyle={{ paddingBottom: 20 }}>

        {/* Discover Tab */}
        {activeTab === 'discover' && (
          <View>
            <Text style={s.sectionTitle}>Nearby CutFlow Desktops</Text>
            {discovered.length === 0 ? (
              <View style={s.empty}>
                <Text style={s.emptyText}>🔍 Scanning local network...</Text>
                <Text style={s.emptySubText}>
                  Make sure your desktop has CutFlow running and is on the same Wi-Fi.
                </Text>
              </View>
            ) : (
              discovered.map((d, i) => (
                <TouchableOpacity
                  key={i}
                  style={s.card}
                  onPress={() => {
                    setDesktopHost(d.host);
                    setDesktopPort(String(d.port));
                    connect(d.host, d.port);
                  }}>
                  <Text style={s.cardTitle}>🖥️ {d.name}</Text>
                  <Text style={s.cardSub}>{d.host}:{d.port}</Text>
                  <Text style={[s.cardBadge, { color: COLORS.primary }]}>Tap to Connect</Text>
                </TouchableOpacity>
              ))
            )}
            <TextInput
              style={[s.input, { marginTop: 16 }]}
              placeholder="Or enter User ID (Discord/Telegram ID)"
              placeholderTextColor={COLORS.textMuted}
              value={userId}
              onChangeText={setUserId}
            />
          </View>
        )}

        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <View>
            <Text style={s.sectionTitle}>Desktop Projects</Text>
            {!connected && (
              <Text style={s.emptyText}>Connect to a desktop to see projects.</Text>
            )}
            {projects.length === 0 && connected && (
              <Text style={s.emptyText}>No projects found on desktop.</Text>
            )}
            {projects.map(p => (
              <View key={p.projectId} style={s.card}>
                <View style={s.cardRow}>
                  <Text style={s.cardTitle}>{p.projectName}</Text>
                  <Text style={[s.cardBadge, { color: statusColor(p.status) }]}>
                    {p.status}
                  </Text>
                </View>
                <View style={s.progressBar}>
                  <View style={[s.progressFill, { width: `${p.progress}%` as any }]} />
                </View>
                <View style={s.cardActions}>
                  <TouchableOpacity
                    style={s.actionBtn}
                    onPress={() => requestRender(p.projectId, p.projectName)}>
                    <Text style={s.actionBtnText}>▶ Render on Desktop</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.actionBtn, { backgroundColor: COLORS.surface }]}
                    onPress={() => {
                      ws.current?.send(JSON.stringify({
                        msg_type: 'download_file',
                        payload:  { path: `/data/users/${userId}/projects/${p.projectName}_${p.projectId}/output/final.mp4` },
                      }));
                    }}>
                    <Text style={s.actionBtnText}>⬇ Download to Phone</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Transfer Tab */}
        {activeTab === 'transfer' && (
          <View>
            <Text style={s.sectionTitle}>File Transfers</Text>
            <TouchableOpacity
              style={[s.btn, { marginBottom: 16, alignSelf: 'stretch' }]}
              onPress={sendFileToDesktop}
              disabled={!connected}>
              <Text style={s.btnText}>📤 Send File to Desktop</Text>
            </TouchableOpacity>

            {transfers.length === 0 && (
              <Text style={s.emptyText}>No transfers yet.</Text>
            )}
            {transfers.map(t => (
              <View key={t.jobId} style={s.card}>
                <View style={s.cardRow}>
                  <Text style={s.cardTitle} numberOfLines={1}>
                    {t.direction === 'to-desktop' ? '📤' : '📥'} {t.filename}
                  </Text>
                  <Text style={[s.cardBadge, { color: statusColor(t.status) }]}>
                    {t.status}
                  </Text>
                </View>
                <View style={s.progressBar}>
                  <View style={[s.progressFill, { width: `${t.progress}%` as any }]} />
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Activity Log */}
        <View style={{ marginTop: 24 }}>
          <Text style={s.sectionTitle}>Activity Log</Text>
          {log.map((line, i) => (
            <Text key={i} style={s.logLine}>{line}</Text>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: COLORS.background },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  title:         { color: COLORS.text, fontSize: 18, fontWeight: '700' },
  dot:           { width: 10, height: 10, borderRadius: 5 },
  connectionBar: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 12, alignItems: 'center' },
  input:         { backgroundColor: COLORS.surface, color: COLORS.text, borderColor: COLORS.border, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13 },
  btn:           { backgroundColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' },
  btnText:       { color: '#0F0F0F', fontWeight: '700', fontSize: 13 },
  tabs:          { flexDirection: 'row', borderBottomColor: COLORS.border, borderBottomWidth: 1 },
  tab:           { flex: 1, paddingVertical: 10, alignItems: 'center' },
  tabActive:     { borderBottomColor: COLORS.primary, borderBottomWidth: 2 },
  tabText:       { color: COLORS.textMuted, fontSize: 12, fontWeight: '600' },
  tabTextActive: { color: COLORS.primary },
  content:       { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  sectionTitle:  { color: COLORS.text, fontSize: 14, fontWeight: '700', marginBottom: 10 },
  card:          { backgroundColor: COLORS.card, borderRadius: 10, borderColor: COLORS.border, borderWidth: 1, padding: 14, marginBottom: 10 },
  cardRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle:     { color: COLORS.text, fontSize: 14, fontWeight: '600', flex: 1 },
  cardSub:       { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  cardBadge:     { fontSize: 12, fontWeight: '700' },
  progressBar:   { height: 4, backgroundColor: COLORS.border, borderRadius: 2, overflow: 'hidden', marginBottom: 10 },
  progressFill:  { height: '100%', backgroundColor: COLORS.primary, borderRadius: 2 },
  cardActions:   { flexDirection: 'row', gap: 8, marginTop: 4 },
  actionBtn:     { flex: 1, backgroundColor: COLORS.primary, borderRadius: 7, padding: 8, alignItems: 'center' },
  actionBtnText: { color: '#0F0F0F', fontSize: 12, fontWeight: '700' },
  empty:         { alignItems: 'center', paddingVertical: 32 },
  emptyText:     { color: COLORS.textMuted, fontSize: 14, textAlign: 'center' },
  emptySubText:  { color: COLORS.textMuted, fontSize: 12, textAlign: 'center', marginTop: 8, paddingHorizontal: 20 },
  logLine:       { color: COLORS.textMuted, fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', marginBottom: 2 },
});
