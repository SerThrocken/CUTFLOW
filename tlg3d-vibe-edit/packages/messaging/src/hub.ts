// ============================================================
//  CutFlow — Unified Messaging Hub
//  Every platform (Discord, Telegram, WhatsApp, SMS/RCS,
//  iMessage, Slack, Signal, Email, Instagram, Messenger,
//  Twitter/X, Line, Viber, WeChat) registers here.
//
//  Pattern:
//    1.  Platform adapter implements MessagingAdapter
//    2.  Hub routes inbound messages to processInbound()
//    3.  processInbound() saves video → user folder → queue
//    4.  After render completes, hub calls adapter.sendVideo()
// ============================================================

import path from 'path';
import fs from 'fs';
import { EventEmitter } from 'events';
import type { VideoProject } from '../../../core/src/folder-structure';

// ── Core types ────────────────────────────────────────────────

export type Platform =
  | 'discord'
  | 'telegram'
  | 'whatsapp'
  | 'sms'
  | 'rcs'
  | 'imessage'
  | 'slack'
  | 'signal'
  | 'email'
  | 'instagram'
  | 'messenger'
  | 'twitter'
  | 'line'
  | 'viber'
  | 'wechat';

export interface PlatformUser {
  platform:    Platform;
  platformId:  string;            // user's ID on that platform
  username:    string;
  displayName?: string;
  phone?:      string;
  email?:      string;
}

export interface InboundMessage {
  platform:    Platform;
  platformId:  string;            // sender's platform ID
  messageId:   string;
  text:        string;
  attachments: MediaAttachment[];
  timestamp:   Date;
  raw:         any;               // original platform event
}

export interface MediaAttachment {
  type:     'video' | 'audio' | 'image' | 'document';
  url:      string;               // download URL or local path
  filename: string;
  mimeType: string;
  size?:    number;
}

export interface OutboundMessage {
  platform:    Platform;
  platformId:  string;
  text?:       string;
  videoPath?:  string;            // local path to video file to send
  audioPath?:  string;
  imagePath?:  string;
  caption?:    string;
  replyToId?:  string;
}

export interface AdapterConfig {
  platform:    Platform;
  enabled:     boolean;
  credentials: Record<string, string>;
}

// ── Adapter interface every platform must implement ───────────

export interface MessagingAdapter {
  platform:       Platform;
  name:           string;
  description:    string;
  icon:           string;
  supportsVideo:  boolean;
  supportsAudio:  boolean;
  maxFileSizeMB:  number;

  init(config: AdapterConfig): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
  isConnected(): boolean;

  // Send outbound message / file
  sendText(platformId: string, text: string): Promise<boolean>;
  sendVideo(platformId: string, videoPath: string, caption?: string): Promise<boolean>;
  sendAudio(platformId: string, audioPath: string, caption?: string): Promise<boolean>;
  sendImage(platformId: string, imagePath: string, caption?: string): Promise<boolean>;

  // Download inbound file to local path
  downloadMedia(attachment: MediaAttachment, destPath: string): Promise<string>;
}

// ── Platform Registry ─────────────────────────────────────────

const PLATFORM_META: Record<Platform, { name: string; icon: string; description: string }> = {
  discord:   { name: 'Discord',        icon: '💬', description: 'Bot commands and DMs' },
  telegram:  { name: 'Telegram',       icon: '✈️',  description: 'Bot API with file support' },
  whatsapp:  { name: 'WhatsApp',       icon: '💚', description: 'Via Twilio or Meta Business API' },
  sms:       { name: 'SMS',            icon: '📱', description: 'Standard SMS via Twilio' },
  rcs:       { name: 'RCS',            icon: '📲', description: 'Rich Communication Services (Twilio)' },
  imessage:  { name: 'iMessage',       icon: '🍎', description: 'macOS AppleScript bridge' },
  slack:     { name: 'Slack',          icon: '🔗', description: 'Workspace bot with file sharing' },
  signal:    { name: 'Signal',         icon: '🔐', description: 'Encrypted via signal-cli' },
  email:     { name: 'Email',          icon: '📧', description: 'SMTP outbound / IMAP inbound' },
  instagram: { name: 'Instagram DM',  icon: '📸', description: 'Meta Messaging API' },
  messenger: { name: 'Messenger',     icon: '👤', description: 'Meta Messenger API' },
  twitter:   { name: 'X / Twitter DM',icon: '✖️',  description: 'X (Twitter) Direct Messages API' },
  line:      { name: 'LINE',           icon: '💚', description: 'LINE Messaging API' },
  viber:     { name: 'Viber',          icon: '💜', description: 'Viber Bot API' },
  wechat:    { name: 'WeChat',         icon: '🟢', description: 'WeChat Official Account API' },
};

// ── Messaging Hub ─────────────────────────────────────────────

export class MessagingHub extends EventEmitter {
  private adapters = new Map<Platform, MessagingAdapter>();
  private dataDir:  string;

  constructor(dataDir: string = './data/users') {
    super();
    this.dataDir = dataDir;
  }

  // Register adapter
  register(adapter: MessagingAdapter): void {
    this.adapters.set(adapter.platform, adapter);
    console.log(`[MessagingHub] Registered adapter: ${adapter.name}`);
  }

  // Start all enabled adapters
  async startAll(configs: AdapterConfig[]): Promise<void> {
    for (const config of configs) {
      if (!config.enabled) continue;
      const adapter = this.adapters.get(config.platform);
      if (!adapter) {
        console.warn(`[MessagingHub] No adapter for platform: ${config.platform}`);
        continue;
      }
      try {
        await adapter.init(config);
        await adapter.start();
        console.log(`[MessagingHub] ✓ Started ${adapter.name}`);
      } catch (err) {
        console.error(`[MessagingHub] ✗ Failed to start ${adapter.name}:`, err);
      }
    }
  }

  // Stop all adapters
  async stopAll(): Promise<void> {
    for (const adapter of this.adapters.values()) {
      try { await adapter.stop(); } catch {}
    }
  }

  // ── Inbound processing ───────────────────────────────────────

  async processInbound(msg: InboundMessage): Promise<void> {
    const userFolder = this.ensureUserFolder(msg.platform, msg.platformId);

    // Save conversation log
    this.logConversation(userFolder, msg);

    // Parse intent from text
    const intent = this.parseIntent(msg.text);

    // Handle video attachments — download and queue
    for (const att of msg.attachments.filter(a => a.type === 'video' || a.type === 'audio')) {
      await this.handleInboundMedia(msg, att, userFolder, intent);
    }

    // Handle text-only commands
    if (msg.attachments.length === 0) {
      await this.handleTextCommand(msg, userFolder, intent);
    }

    this.emit('inbound', msg);
  }

  // ── Outbound delivery ────────────────────────────────────────

  async deliverVideo(
    platform: Platform,
    platformId: string,
    videoPath: string,
    caption?: string
  ): Promise<boolean> {
    const adapter = this.adapters.get(platform);
    if (!adapter) {
      console.warn(`[MessagingHub] No adapter for ${platform}`);
      return false;
    }
    if (!adapter.isConnected()) {
      console.warn(`[MessagingHub] ${platform} adapter not connected`);
      return false;
    }

    // Check file size vs platform limit
    const sizeBytes = fs.existsSync(videoPath) ? fs.statSync(videoPath).size : 0;
    const sizeMB    = sizeBytes / (1024 * 1024);

    if (sizeMB > adapter.maxFileSizeMB) {
      // Too large — send a download link instead
      const link = await this.generateDownloadLink(videoPath);
      return adapter.sendText(
        platformId,
        `✅ Your CutFlow render is ready!\n\n📥 Download: ${link}\n\nFile size: ${sizeMB.toFixed(1)} MB (too large for direct ${adapter.name} upload)`
      );
    }

    return adapter.sendVideo(platformId, videoPath, caption);
  }

  async deliverText(platform: Platform, platformId: string, text: string): Promise<boolean> {
    const adapter = this.adapters.get(platform);
    if (!adapter?.isConnected()) return false;
    return adapter.sendText(platformId, text);
  }

  // ── User folder management ────────────────────────────────────

  ensureUserFolder(platform: Platform, platformId: string): string {
    // Structure: data/users/{platform}_{platformId}/
    const folderName = `${platform}_${platformId}`;
    const userPath   = path.join(this.dataDir, folderName);
    if (!fs.existsSync(userPath)) {
      fs.mkdirSync(userPath, { recursive: true });
      fs.mkdirSync(path.join(userPath, 'projects'),      { recursive: true });
      fs.mkdirSync(path.join(userPath, 'conversations'), { recursive: true });
      fs.mkdirSync(path.join(userPath, 'incoming'),      { recursive: true });
      fs.mkdirSync(path.join(userPath, 'outgoing'),      { recursive: true });
      console.log(`[MessagingHub] Created user folder: ${folderName}`);
    }
    return userPath;
  }

  getUserFolder(platform: Platform, platformId: string): string {
    return path.join(this.dataDir, `${platform}_${platformId}`);
  }

  getConnectedPlatforms(): { platform: Platform; name: string; icon: string; connected: boolean }[] {
    return Array.from(this.adapters.entries()).map(([p, a]) => ({
      platform:  p,
      name:      a.name,
      icon:      a.icon,
      connected: a.isConnected(),
    }));
  }

  listPlatforms(): typeof PLATFORM_META {
    return PLATFORM_META;
  }

  // ── Private helpers ───────────────────────────────────────────

  private async handleInboundMedia(
    msg: InboundMessage,
    att: MediaAttachment,
    userFolder: string,
    intent: ParsedIntent
  ): Promise<void> {
    const adapter  = this.adapters.get(msg.platform)!;
    const ext      = att.filename.split('.').pop() || 'mp4';
    const destName = `incoming_${Date.now()}.${ext}`;
    const destPath = path.join(userFolder, 'incoming', destName);

    // Acknowledge immediately
    await adapter.sendText(msg.platformId,
      `📥 Received "${att.filename}" — downloading and queuing for processing...`
    );

    try {
      await adapter.downloadMedia(att, destPath);

      // Create a project for this video
      const projectId   = `project_${Date.now()}`;
      const projectName = intent.projectName || `${msg.platform}_${Date.now()}`;
      const projectDir  = path.join(userFolder, 'projects', `${projectName}_${projectId}`);

      fs.mkdirSync(path.join(projectDir, 'assets', 'videos'), { recursive: true });
      fs.mkdirSync(path.join(projectDir, 'output'),           { recursive: true });

      // Move file into project
      const projectVideoPath = path.join(projectDir, 'assets', 'videos', destName);
      fs.renameSync(destPath, projectVideoPath);

      // Write project metadata
      const metadata = {
        projectId,
        projectName,
        userId:     `${msg.platform}_${msg.platformId}`,
        platform:   msg.platform,
        platformId: msg.platformId,
        status:     'queued',
        progress:   0,
        sourceFile: destName,
        intent:     intent.action,
        createdAt:  new Date().toISOString(),
      };
      fs.writeFileSync(path.join(projectDir, 'project.json'), JSON.stringify(metadata, null, 2));

      await adapter.sendText(msg.platformId,
        `✅ Project "${projectName}" created!\n\n` +
        `📂 File saved securely to your personal folder.\n` +
        `⏳ Processing will begin shortly.\n\n` +
        `Use \`!status\` to check progress.`
      );

      this.emit('video-received', {
        platform:    msg.platform,
        platformId:  msg.platformId,
        projectId,
        projectName,
        videoPath:   projectVideoPath,
        intent:      intent.action,
      });
    } catch (err) {
      await adapter.sendText(msg.platformId,
        `❌ Failed to download file: ${(err as Error).message}`
      );
    }
  }

  private async handleTextCommand(
    msg: InboundMessage,
    userFolder: string,
    intent: ParsedIntent
  ): Promise<void> {
    const adapter = this.adapters.get(msg.platform)!;
    const text    = msg.text.toLowerCase().trim();

    switch (intent.action) {
      case 'help':
        await adapter.sendText(msg.platformId, this.buildHelpText(msg.platform));
        break;

      case 'status':
        await adapter.sendText(msg.platformId, await this.getStatusText(userFolder));
        break;

      case 'projects':
        await adapter.sendText(msg.platformId, await this.listProjectsText(userFolder));
        break;

      case 'script':
        this.emit('script-requested', {
          platform:   msg.platform,
          platformId: msg.platformId,
          prompt:     intent.args.join(' '),
          userFolder,
        });
        await adapter.sendText(msg.platformId, `✍️ Generating script for: "${intent.args.join(' ')}"...`);
        break;

      case 'voiceover':
        this.emit('voiceover-requested', {
          platform:   msg.platform,
          platformId: msg.platformId,
          text:       intent.args.join(' '),
          userFolder,
        });
        await adapter.sendText(msg.platformId, `🎙️ Generating voiceover...`);
        break;

      case 'queue':
        await adapter.sendText(msg.platformId, await this.getQueueText(userFolder));
        break;

      default:
        // Unknown — treat as a natural language request
        this.emit('natural-language', {
          platform:   msg.platform,
          platformId: msg.platformId,
          text:       msg.text,
          userFolder,
        });
    }
  }

  private parseIntent(text: string): ParsedIntent {
    const lower = text.toLowerCase().trim();

    if (!lower || lower === '!help' || lower === '/help' || lower === 'help')
      return { action: 'help', projectName: '', args: [] };
    if (lower.startsWith('!status') || lower.startsWith('/status') || lower === 'status')
      return { action: 'status', projectName: '', args: [] };
    if (lower.startsWith('!projects') || lower.startsWith('/projects'))
      return { action: 'projects', projectName: '', args: [] };
    if (lower.startsWith('!queue') || lower.startsWith('/queue'))
      return { action: 'queue', projectName: '', args: [] };

    const scriptMatch = lower.match(/^[!/]?script\s+(.+)/);
    if (scriptMatch)
      return { action: 'script', projectName: '', args: [scriptMatch[1]] };

    const voiceMatch = lower.match(/^[!/]?voiceover\s+(.+)/);
    if (voiceMatch)
      return { action: 'voiceover', projectName: '', args: [voiceMatch[1]] };

    const editMatch = lower.match(/^[!/]?edit(?:\s+(.+))?/);
    if (editMatch)
      return { action: 'edit', projectName: editMatch[1] || '', args: [] };

    return { action: 'unknown', projectName: '', args: [text] };
  }

  private buildHelpText(platform: Platform): string {
    const prefix = ['telegram', 'discord'].includes(platform) ? '/' : '!';
    return [
      `🎬 *CutFlow by TLG3D*`,
      ``,
      `*Commands:*`,
      `${prefix}help — Show this menu`,
      `${prefix}status — Check your project status`,
      `${prefix}projects — List your projects`,
      `${prefix}queue — View processing queue`,
      `${prefix}script <prompt> — Generate a video script`,
      `${prefix}voiceover <text> — Generate voiceover audio`,
      `${prefix}edit <project name> — Start an edit project`,
      ``,
      `*Send a video* — I'll add it to your project queue`,
      `*Send audio* — I'll use it as a voiceover`,
      ``,
      `📁 Your files are stored in your personal folder.`,
    ].join('\n');
  }

  private async getStatusText(userFolder: string): Promise<string> {
    const projectsDir = path.join(userFolder, 'projects');
    if (!fs.existsSync(projectsDir)) return '📂 No projects yet.';

    const dirs = fs.readdirSync(projectsDir);
    const active = dirs.filter(d => {
      const meta = path.join(projectsDir, d, 'project.json');
      if (!fs.existsSync(meta)) return false;
      const m = JSON.parse(fs.readFileSync(meta, 'utf-8'));
      return m.status !== 'completed' && m.status !== 'archived';
    });

    return active.length === 0
      ? '✅ All projects complete.'
      : `⏳ ${active.length} project(s) in progress.`;
  }

  private async listProjectsText(userFolder: string): Promise<string> {
    const projectsDir = path.join(userFolder, 'projects');
    if (!fs.existsSync(projectsDir)) return '📂 No projects yet.';

    const dirs = fs.readdirSync(projectsDir);
    if (dirs.length === 0) return '📂 No projects yet.';

    const lines = ['📁 *Your Projects:*', ''];
    for (const d of dirs.slice(0, 10)) {
      const meta = path.join(projectsDir, d, 'project.json');
      if (fs.existsSync(meta)) {
        const m = JSON.parse(fs.readFileSync(meta, 'utf-8'));
        const icon = { draft: '📝', queued: '⏰', processing: '⏳', completed: '✅' }[m.status as string] || '📝';
        lines.push(`${icon} ${m.projectName} — ${m.status} (${m.progress || 0}%)`);
      }
    }
    if (dirs.length > 10) lines.push(`...and ${dirs.length - 10} more`);
    return lines.join('\n');
  }

  private async getQueueText(userFolder: string): Promise<string> {
    const queueFile = path.join(userFolder, 'queue.json');
    if (!fs.existsSync(queueFile)) return '📭 Queue is empty.';
    const q = JSON.parse(fs.readFileSync(queueFile, 'utf-8'));
    const items = q.items || [];
    if (items.length === 0) return '📭 Queue is empty.';

    const lines = ['📋 *Queue Status:*', ''];
    items.forEach((item: any, i: number) => {
      lines.push(`${i + 1}. ${item.projectId} — ${item.status}`);
    });
    return lines.join('\n');
  }

  private logConversation(userFolder: string, msg: InboundMessage): void {
    const logFile = path.join(userFolder, 'conversations', `${msg.platform}.jsonl`);
    const entry   = JSON.stringify({
      messageId:  msg.messageId,
      text:       msg.text,
      attachments: msg.attachments.map(a => ({ type: a.type, filename: a.filename })),
      timestamp:  msg.timestamp.toISOString(),
    });
    fs.appendFileSync(logFile, entry + '\n');
  }

  private async generateDownloadLink(videoPath: string): Promise<string> {
    // In production: upload to Cloudflare R2 and return signed URL
    const filename = path.basename(videoPath);
    return `https://files.cutflow.dev/download/${filename}`;
  }
}

interface ParsedIntent {
  action:      string;
  projectName: string;
  args:        string[];
}

// ── Singleton export ──────────────────────────────────────────

export const messagingHub = new MessagingHub(
  process.env.DATA_DIR || './data/users'
);

export { PLATFORM_META };
export default messagingHub;
