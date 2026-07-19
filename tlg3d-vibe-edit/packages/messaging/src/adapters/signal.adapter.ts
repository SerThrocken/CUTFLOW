// ============================================================
//  CutFlow — Signal Adapter
//  Uses signal-cli (Java CLI tool) to send and receive
//  encrypted Signal messages — no Signal API key needed,
//  just a registered phone number on the device.
//  https://github.com/AsamK/signal-cli
// ============================================================

import { exec, spawn, ChildProcess } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';
import type { MessagingAdapter, AdapterConfig, InboundMessage, MediaAttachment } from '../hub';
import messagingHub from '../hub';

const execAsync = promisify(exec);

export class SignalAdapter implements MessagingAdapter {
  platform      = 'signal' as const;
  name          = 'Signal';
  description   = 'Encrypted Signal messages via signal-cli — no API key needed';
  icon          = '🔐';
  supportsVideo = true;
  supportsAudio = true;
  maxFileSizeMB = 100;

  private phoneNumber = '';
  private connected   = false;
  private daemonProc: ChildProcess | null = null;
  private dataDir     = path.join(os.homedir(), '.local', 'share', 'signal-cli');

  async init(config: AdapterConfig): Promise<void> {
    this.phoneNumber = config.credentials.SIGNAL_PHONE_NUMBER || '';
    if (!this.phoneNumber) throw new Error('SIGNAL_PHONE_NUMBER required (e.g. +12025551234)');

    // Check signal-cli is installed
    try {
      await execAsync('signal-cli --version');
    } catch {
      throw new Error(
        'signal-cli not found. Install from https://github.com/AsamK/signal-cli/releases\n' +
        'Then register: signal-cli -u +1XXXXXXXXXX register'
      );
    }
  }

  async start(): Promise<void> {
    // Start signal-cli in daemon mode (JSON-RPC over stdio)
    this.daemonProc = spawn('signal-cli', [
      '--config', this.dataDir,
      '-u', this.phoneNumber,
      'daemon',
      '--json',
    ]);

    this.daemonProc.stdout?.on('data', (chunk: Buffer) => {
      const lines = chunk.toString().split('\n').filter(Boolean);
      for (const line of lines) {
        try {
          const event = JSON.parse(line);
          this.handleDaemonEvent(event);
        } catch {}
      }
    });

    this.daemonProc.stderr?.on('data', (d: Buffer) => {
      const msg = d.toString().trim();
      if (msg) console.error('[Signal]', msg);
    });

    this.daemonProc.on('exit', (code) => {
      this.connected = false;
      console.warn(`[Signal] daemon exited with code ${code}`);
    });

    this.connected = true;
    console.log('[Signal] Daemon started for', this.phoneNumber);
  }

  async stop(): Promise<void> {
    this.daemonProc?.kill('SIGTERM');
    this.daemonProc = null;
    this.connected  = false;
  }

  isConnected(): boolean { return this.connected; }

  // ── Daemon event handler ──────────────────────────────────

  private async handleDaemonEvent(event: any): Promise<void> {
    // signal-cli JSON envelope
    if (!event?.envelope?.dataMessage) return;

    const envelope = event.envelope;
    const dm       = envelope.dataMessage;
    const sender   = envelope.sourceNumber || envelope.source;
    if (!sender)   return;

    const attachments: MediaAttachment[] = [];

    for (const att of (dm.attachments || []) as any[]) {
      const localPath = att.storedFilename || att.filename || '';
      const mime      = att.contentType   || '';
      const type: 'video' | 'audio' | 'image' | 'document' =
        mime.startsWith('video') ? 'video'
        : mime.startsWith('audio') ? 'audio'
        : mime.startsWith('image') ? 'image'
        : 'document';

      if (localPath) {
        attachments.push({
          type,
          url:      localPath,
          filename: path.basename(localPath),
          mimeType: mime,
          size:     att.size || 0,
        });
      }
    }

    const inbound: InboundMessage = {
      platform:    'signal',
      platformId:  sender,
      messageId:   `signal_${envelope.serverReceiveTimestamp || Date.now()}`,
      text:        dm.message || '',
      attachments,
      timestamp:   new Date(dm.timestamp || Date.now()),
      raw:         event,
    };

    await messagingHub.processInbound(inbound);
  }

  // ── Send methods ──────────────────────────────────────────

  async sendText(to: string, text: string): Promise<boolean> {
    try {
      await execAsync(
        `signal-cli --config "${this.dataDir}" -u "${this.phoneNumber}" send -m "${text.replace(/"/g, '\\"')}" "${to}"`
      );
      return true;
    } catch (err) {
      console.error('[Signal] sendText failed:', err);
      return false;
    }
  }

  async sendVideo(to: string, videoPath: string, caption?: string): Promise<boolean> {
    return this.sendFileWithCaption(to, videoPath, caption || '🎬 CutFlow render ready!');
  }

  async sendAudio(to: string, audioPath: string, caption?: string): Promise<boolean> {
    return this.sendFileWithCaption(to, audioPath, caption || '🎙️ Voiceover ready!');
  }

  async sendImage(to: string, imagePath: string, caption?: string): Promise<boolean> {
    return this.sendFileWithCaption(to, imagePath, caption || '');
  }

  private async sendFileWithCaption(to: string, filePath: string, caption: string): Promise<boolean> {
    try {
      const safe = caption.replace(/"/g, '\\"');
      await execAsync(
        `signal-cli --config "${this.dataDir}" -u "${this.phoneNumber}" send ` +
        `-m "${safe}" -a "${filePath}" "${to}"`
      );
      return true;
    } catch (err) {
      console.error('[Signal] sendFile failed:', err);
      // Fall back to text with link
      const link = `https://files.cutflow.dev/${path.basename(filePath)}`;
      return this.sendText(to, `${caption}\n\nDownload: ${link}`);
    }
  }

  // Signal attachments are already local files from the daemon
  async downloadMedia(att: MediaAttachment, destPath: string): Promise<string> {
    if (fs.existsSync(att.url)) {
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.copyFileSync(att.url, destPath);
      return destPath;
    }
    return att.url;
  }
}
