// ============================================================
//  CutFlow — iMessage Adapter
//  macOS only. Uses osascript (AppleScript) to send and
//  receive iMessages natively through Messages.app.
//  Polls chat.db for new inbound messages.
//  Supports sending text, images, video files, and audio.
// ============================================================

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';
import type { MessagingAdapter, AdapterConfig, InboundMessage, MediaAttachment } from '../hub';
import messagingHub from '../hub';

const execAsync = promisify(exec);

export class IMessageAdapter implements MessagingAdapter {
  platform      = 'imessage' as const;
  name          = 'iMessage';
  description   = 'Native macOS iMessage via AppleScript — no Apple API key needed';
  icon          = '🍎';
  supportsVideo = true;  // Can send video files via Messages.app
  supportsAudio = true;
  maxFileSizeMB = 100;   // Messages.app handles large files

  private connected   = false;
  private pollTimer:  NodeJS.Timeout | null = null;
  private lastPollRow = 0;
  private dbPath      = path.join(os.homedir(), 'Library', 'Messages', 'chat.db');
  private attachDir   = path.join(os.homedir(), 'Library', 'Messages', 'Attachments');

  async init(config: AdapterConfig): Promise<void> {
    if (os.platform() !== 'darwin') {
      throw new Error('iMessage adapter requires macOS');
    }
    // Verify Messages.app db exists (user must grant Full Disk Access)
    if (!fs.existsSync(this.dbPath)) {
      throw new Error(
        'iMessage db not found. Grant Full Disk Access to CutFlow in ' +
        'System Settings → Privacy & Security → Full Disk Access'
      );
    }
  }

  async start(): Promise<void> {
    this.connected  = true;
    // Seed lastPollRow so we don't re-process old messages on start
    await this.seedLastRow();
    this.startPolling();
    console.log('[iMessage] Adapter started — polling every 10s');
  }

  async stop(): Promise<void> {
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.pollTimer  = null;
    this.connected  = false;
  }

  isConnected(): boolean { return this.connected; }

  // ── Send methods ──────────────────────────────────────────

  async sendText(to: string, text: string): Promise<boolean> {
    const safe = text
      .replace(/\\/g, '\\\\')
      .replace(/"/g,  '\\"')
      .replace(/\n/g, '\\n');

    const script = `
      tell application "Messages"
        set targetService to 1st service whose service type = iMessage
        set targetBuddy to buddy "${to}" of targetService
        send "${safe}" to targetBuddy
      end tell
    `;

    try {
      await this.runAppleScript(script);
      return true;
    } catch (err) {
      console.error('[iMessage] sendText failed:', err);
      return false;
    }
  }

  async sendVideo(to: string, videoPath: string, caption?: string): Promise<boolean> {
    if (caption) await this.sendText(to, caption);
    return this.sendFile(to, videoPath);
  }

  async sendAudio(to: string, audioPath: string, caption?: string): Promise<boolean> {
    if (caption) await this.sendText(to, caption);
    return this.sendFile(to, audioPath);
  }

  async sendImage(to: string, imagePath: string, caption?: string): Promise<boolean> {
    if (caption) await this.sendText(to, caption);
    return this.sendFile(to, imagePath);
  }

  private async sendFile(to: string, filePath: string): Promise<boolean> {
    const absPath = path.resolve(filePath);
    const script  = `
      tell application "Messages"
        set targetService to 1st service whose service type = iMessage
        set targetBuddy to buddy "${to}" of targetService
        send POSIX file "${absPath}" to targetBuddy
      end tell
    `;
    try {
      await this.runAppleScript(script);
      return true;
    } catch (err) {
      console.error('[iMessage] sendFile failed:', err);
      return false;
    }
  }

  // iMessage attachments are local — just return destPath
  async downloadMedia(att: MediaAttachment, destPath: string): Promise<string> {
    if (fs.existsSync(att.url)) {
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.copyFileSync(att.url, destPath);
      return destPath;
    }
    return att.url;
  }

  // ── Poll chat.db for new incoming messages ────────────────

  private async seedLastRow(): Promise<void> {
    try {
      const { stdout } = await execAsync(
        `sqlite3 "${this.dbPath}" "SELECT MAX(rowid) FROM message;"`
      );
      this.lastPollRow = parseInt(stdout.trim(), 10) || 0;
    } catch {}
  }

  private startPolling(): void {
    this.pollTimer = setInterval(async () => {
      try {
        await this.checkNewMessages();
      } catch (err) {
        console.error('[iMessage] Poll error:', err);
      }
    }, 10_000); // Every 10 seconds
  }

  private async checkNewMessages(): Promise<void> {
    const query = `
      SELECT
        m.rowid,
        m.text,
        m.date / 1000000000 + 978307200 AS unix_ts,
        m.is_from_me,
        m.cache_has_attachments,
        h.id AS sender
      FROM message m
      JOIN handle h ON m.handle_id = h.rowid
      WHERE m.is_from_me = 0
        AND m.service    = 'iMessage'
        AND m.rowid      > ${this.lastPollRow}
      ORDER BY m.rowid ASC
      LIMIT 50;
    `.replace(/\n/g, ' ').trim();

    let rows = '';
    try {
      const { stdout } = await execAsync(
        `sqlite3 -separator '||' "${this.dbPath}" "${query}"`
      );
      rows = stdout.trim();
    } catch {
      return; // DB may be locked
    }

    for (const line of rows.split('\n').filter(Boolean)) {
      const parts    = line.split('||');
      const rowid    = parseInt(parts[0] || '0', 10);
      const text     = parts[1] || '';
      const unixTs   = parseInt(parts[2] || '0', 10);
      const hasAtt   = parts[4] === '1';
      const sender   = parts[5] || '';

      if (!sender) continue;
      this.lastPollRow = Math.max(this.lastPollRow, rowid);

      const attachments: MediaAttachment[] = [];

      if (hasAtt) {
        const attList = await this.getAttachments(rowid);
        attachments.push(...attList);
      }

      const inbound: InboundMessage = {
        platform:    'imessage',
        platformId:  sender,
        messageId:   `imessage_${rowid}`,
        text:        text.trim(),
        attachments,
        timestamp:   new Date(unixTs * 1000),
        raw:         { rowid, text, sender, hasAtt },
      };

      await messagingHub.processInbound(inbound);
    }
  }

  private async getAttachments(messageRowId: number): Promise<MediaAttachment[]> {
    const query = `
      SELECT a.filename, a.mime_type, a.total_bytes
      FROM message_attachment_join maj
      JOIN attachment a ON maj.attachment_id = a.rowid
      WHERE maj.message_id = ${messageRowId};
    `.replace(/\n/g, ' ').trim();

    const attachments: MediaAttachment[] = [];
    try {
      const { stdout } = await execAsync(
        `sqlite3 -separator '||' "${this.dbPath}" "${query}"`
      );
      for (const line of stdout.trim().split('\n').filter(Boolean)) {
        const [filename, mimeType, sizeStr] = line.split('||');
        if (!filename) continue;

        // Expand ~ in path
        const fullPath  = filename.replace('~', os.homedir());
        const type: 'video' | 'audio' | 'image' | 'document' =
          mimeType?.startsWith('video') ? 'video'
          : mimeType?.startsWith('audio') ? 'audio'
          : mimeType?.startsWith('image') ? 'image'
          : 'document';

        attachments.push({
          type,
          url:      fullPath,      // local FS path
          filename: path.basename(fullPath),
          mimeType: mimeType || 'application/octet-stream',
          size:     parseInt(sizeStr || '0', 10),
        });
      }
    } catch {}
    return attachments;
  }

  // ── Helpers ───────────────────────────────────────────────

  private async runAppleScript(script: string): Promise<string> {
    const tmpFile = path.join(os.tmpdir(), `imessage_${Date.now()}.applescript`);
    fs.writeFileSync(tmpFile, script);
    try {
      const { stdout } = await execAsync(`osascript "${tmpFile}"`);
      return stdout.trim();
    } finally {
      fs.unlinkSync(tmpFile);
    }
  }
}
