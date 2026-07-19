// ============================================================
//  CutFlow — Email Adapter
//  SMTP outbound (nodemailer) + IMAP inbound (imapflow).
//  No third-party service — works with Gmail, Outlook,
//  ProtonMail, iCloud Mail, or any IMAP/SMTP server.
//  Receives video attachments from email, sends renders back.
// ============================================================

import nodemailer, { Transporter } from 'nodemailer';
import { ImapFlow, FetchMessageObject } from 'imapflow';
import fs from 'fs';
import path from 'path';
import os from 'os';
import type { MessagingAdapter, AdapterConfig, InboundMessage, MediaAttachment } from '../hub';
import messagingHub from '../hub';

export class EmailAdapter implements MessagingAdapter {
  platform      = 'email' as const;
  name          = 'Email';
  description   = 'SMTP outbound + IMAP polling — Gmail, Outlook, iCloud, any mail server';
  icon          = '📧';
  supportsVideo = true;
  supportsAudio = true;
  maxFileSizeMB = 25; // Most mail servers cap at 25 MB

  private transporter!:  Transporter;
  private imapClient!:   ImapFlow;
  private pollTimer:     NodeJS.Timeout | null = null;
  private fromAddress    = '';
  private connected      = false;
  private lastUid        = 0;
  private downloadDir    = path.join(os.tmpdir(), 'cutflow_email');

  async init(config: AdapterConfig): Promise<void> {
    const {
      EMAIL_USER, EMAIL_PASS,
      SMTP_HOST, SMTP_PORT,
      IMAP_HOST, IMAP_PORT,
    } = config.credentials;

    if (!EMAIL_USER || !EMAIL_PASS) {
      throw new Error('EMAIL_USER and EMAIL_PASS are required');
    }

    this.fromAddress = EMAIL_USER;
    fs.mkdirSync(this.downloadDir, { recursive: true });

    // ── SMTP (outbound) ───────────────────────────────────────
    this.transporter = nodemailer.createTransport({
      host:   SMTP_HOST || this.inferSmtpHost(EMAIL_USER),
      port:   parseInt(SMTP_PORT || '587', 10),
      secure: parseInt(SMTP_PORT || '587', 10) === 465,
      auth:   { user: EMAIL_USER, pass: EMAIL_PASS },
      tls:    { rejectUnauthorized: false },
    });

    // ── IMAP (inbound) ────────────────────────────────────────
    this.imapClient = new ImapFlow({
      host:   IMAP_HOST || this.inferImapHost(EMAIL_USER),
      port:   parseInt(IMAP_PORT || '993', 10),
      secure: true,
      auth:   { user: EMAIL_USER, pass: EMAIL_PASS },
      logger: false,
    });
  }

  async start(): Promise<void> {
    // Verify SMTP
    await this.transporter.verify();
    console.log('[Email] SMTP ready');

    // Connect IMAP
    await this.imapClient.connect();
    this.connected = true;
    console.log('[Email] IMAP connected');

    // Seed last UID
    await this.seedLastUid();
    // Poll every 60 seconds
    this.pollTimer = setInterval(() => this.pollInbox(), 60_000);
    // First poll immediately
    await this.pollInbox();
  }

  async stop(): Promise<void> {
    if (this.pollTimer) clearInterval(this.pollTimer);
    await this.imapClient.logout();
    this.connected = false;
  }

  isConnected(): boolean { return this.connected; }

  // ── Send methods ──────────────────────────────────────────

  async sendText(to: string, text: string): Promise<boolean> {
    try {
      await this.transporter.sendMail({
        from:    `"CutFlow" <${this.fromAddress}>`,
        to,
        subject: 'CutFlow Update',
        text,
        html:    `<p>${text.replace(/\n/g, '<br>')}</p>
                  <hr><small>CutFlow by The Looking Glass 3D</small>`,
      });
      return true;
    } catch (err) {
      console.error('[Email] sendText failed:', err);
      return false;
    }
  }

  async sendVideo(to: string, videoPath: string, caption?: string): Promise<boolean> {
    const sizeMB = fs.existsSync(videoPath) ? fs.statSync(videoPath).size / (1024 * 1024) : 999;

    if (sizeMB > this.maxFileSizeMB) {
      // Send link instead of attachment
      const link = `https://files.cutflow.dev/${path.basename(videoPath)}`;
      return this.sendText(to,
        `${caption || '🎬 Your CutFlow render is ready!'}\n\nDownload: ${link}\n\nFile size: ${sizeMB.toFixed(1)} MB`
      );
    }

    try {
      await this.transporter.sendMail({
        from:        `"CutFlow" <${this.fromAddress}>`,
        to,
        subject:     `CutFlow Render — ${path.basename(videoPath)}`,
        text:        caption || 'Your CutFlow render is attached.',
        html:        `<p>${caption || '🎬 Your CutFlow render is ready!'}</p>
                      <hr><small>CutFlow by The Looking Glass 3D</small>`,
        attachments: [{ filename: path.basename(videoPath), path: videoPath }],
      });
      return true;
    } catch (err) {
      console.error('[Email] sendVideo failed:', err);
      return false;
    }
  }

  async sendAudio(to: string, audioPath: string, caption?: string): Promise<boolean> {
    try {
      await this.transporter.sendMail({
        from:        `"CutFlow" <${this.fromAddress}>`,
        to,
        subject:     `CutFlow Audio — ${path.basename(audioPath)}`,
        text:        caption || 'Your voiceover is attached.',
        attachments: [{ filename: path.basename(audioPath), path: audioPath }],
      });
      return true;
    } catch (err) {
      console.error('[Email] sendAudio failed:', err);
      return false;
    }
  }

  async sendImage(to: string, imagePath: string, caption?: string): Promise<boolean> {
    try {
      await this.transporter.sendMail({
        from:        `"CutFlow" <${this.fromAddress}>`,
        to,
        subject:     `CutFlow Image — ${path.basename(imagePath)}`,
        text:        caption || 'Your image is attached.',
        html:        `<img src="cid:main_image" style="max-width:100%"><br>
                      <p>${caption || ''}</p>`,
        attachments: [{ filename: path.basename(imagePath), path: imagePath, cid: 'main_image' }],
      });
      return true;
    } catch (err) {
      console.error('[Email] sendImage failed:', err);
      return false;
    }
  }

  async downloadMedia(att: MediaAttachment, destPath: string): Promise<string> {
    if (fs.existsSync(att.url)) {
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.copyFileSync(att.url, destPath);
      return destPath;
    }
    return att.url;
  }

  // ── IMAP inbound polling ──────────────────────────────────

  private async seedLastUid(): Promise<void> {
    await this.imapClient.mailboxOpen('INBOX');
    const status = await this.imapClient.status('INBOX', { messages: true, uidNext: true });
    this.lastUid  = (status.uidNext || 1) - 1;
  }

  private async pollInbox(): Promise<void> {
    try {
      await this.imapClient.mailboxOpen('INBOX');

      for await (const msg of this.imapClient.fetch(
        `${this.lastUid + 1}:*`,
        { uid: true, envelope: true, bodyStructure: true, source: true }
      )) {
        this.lastUid = Math.max(this.lastUid, msg.uid);
        await this.processEmail(msg);
      }
    } catch (err: any) {
      // IMAP may disconnect — attempt reconnect
      if (err.code === 'ECONNRESET' || err.message?.includes('connection')) {
        try {
          await this.imapClient.connect();
        } catch {}
      }
    }
  }

  private async processEmail(msg: FetchMessageObject): Promise<void> {
    const envelope  = msg.envelope;
    const fromEmail = envelope?.from?.[0]?.address || '';
    if (!fromEmail) return;

    // Skip our own outbound emails
    if (fromEmail.toLowerCase() === this.fromAddress.toLowerCase()) return;

    const text        = '';
    const attachments: MediaAttachment[] = [];

    // Parse raw source for attachments
    const source = msg.source?.toString('utf-8') || '';

    // Simple MIME attachment extraction
    const extracted = this.extractAttachments(source, msg.uid);
    for (const ext of extracted) {
      attachments.push(ext);
    }

    const inbound: InboundMessage = {
      platform:    'email',
      platformId:  fromEmail,
      messageId:   `email_${msg.uid}`,
      text:        envelope?.subject || '',
      attachments,
      timestamp:   envelope?.date   || new Date(),
      raw:         msg,
    };

    await messagingHub.processInbound(inbound);
  }

  private extractAttachments(rawEmail: string, uid: number): MediaAttachment[] {
    const attachments: MediaAttachment[] = [];
    // Regex-based MIME boundary extraction (simplified)
    const contentDisp = rawEmail.matchAll(/Content-Disposition:\s*attachment.*?filename="([^"]+)"/gis);

    for (const match of contentDisp) {
      const filename = match[1];
      const mime     = this.mimeFromFilename(filename);
      const type: 'video' | 'audio' | 'image' | 'document' =
        mime.startsWith('video') ? 'video'
        : mime.startsWith('audio') ? 'audio'
        : mime.startsWith('image') ? 'image'
        : 'document';

      const localPath = path.join(this.downloadDir, `email_${uid}_${filename}`);

      // Extract base64 body after the headers
      const bodyMatch = rawEmail.match(
        new RegExp(`filename="${filename}"[\\s\\S]*?\\r?\\n\\r?\\n([A-Za-z0-9+/=\\r\\n]+)`)
      );
      if (bodyMatch) {
        try {
          const decoded = Buffer.from(bodyMatch[1].replace(/[\r\n]/g, ''), 'base64');
          fs.writeFileSync(localPath, decoded);
          attachments.push({ type, url: localPath, filename, mimeType: mime });
        } catch {}
      }
    }

    return attachments;
  }

  // ── Host inference ────────────────────────────────────────

  private inferSmtpHost(email: string): string {
    const domain = email.split('@')[1]?.toLowerCase() || '';
    if (domain.includes('gmail'))   return 'smtp.gmail.com';
    if (domain.includes('outlook') || domain.includes('hotmail') || domain.includes('live'))
                                    return 'smtp.office365.com';
    if (domain.includes('yahoo'))   return 'smtp.mail.yahoo.com';
    if (domain.includes('icloud') || domain.includes('me.com') || domain.includes('mac.com'))
                                    return 'smtp.mail.me.com';
    if (domain.includes('protonmail') || domain.includes('proton'))
                                    return '127.0.0.1'; // Proton Mail Bridge
    return `smtp.${domain}`;
  }

  private inferImapHost(email: string): string {
    const domain = email.split('@')[1]?.toLowerCase() || '';
    if (domain.includes('gmail'))   return 'imap.gmail.com';
    if (domain.includes('outlook') || domain.includes('hotmail') || domain.includes('live'))
                                    return 'outlook.office365.com';
    if (domain.includes('yahoo'))   return 'imap.mail.yahoo.com';
    if (domain.includes('icloud') || domain.includes('me.com') || domain.includes('mac.com'))
                                    return 'imap.mail.me.com';
    if (domain.includes('protonmail') || domain.includes('proton'))
                                    return '127.0.0.1'; // Proton Mail Bridge
    return `imap.${domain}`;
  }

  private mimeFromFilename(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const map: Record<string, string> = {
      mp4: 'video/mp4', mov: 'video/quicktime', mkv: 'video/x-matroska',
      avi: 'video/x-msvideo', webm: 'video/webm',
      mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', aac: 'audio/aac',
      jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif',
    };
    return map[ext] || 'application/octet-stream';
  }
}
