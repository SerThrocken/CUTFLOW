// ============================================================
//  CutFlow — Slack Adapter
//  Uses @slack/bolt (official Slack SDK).
//  Bidirectional: slash commands, file uploads, video sharing.
// ============================================================

import { App as SlackApp, GenericMessageEvent } from '@slack/bolt';
import { WebClient } from '@slack/web-api';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import type { MessagingAdapter, AdapterConfig, InboundMessage, MediaAttachment } from '../hub';
import messagingHub from '../hub';

export class SlackAdapter implements MessagingAdapter {
  platform      = 'slack' as const;
  name          = 'Slack';
  description   = 'Slack workspace bot — slash commands, DMs, file sharing';
  icon          = '🔗';
  supportsVideo = true;
  supportsAudio = true;
  maxFileSizeMB = 1000; // Slack allows up to 1 GB

  private app!:    SlackApp;
  private web!:    WebClient;
  private connected = false;

  async init(config: AdapterConfig): Promise<void> {
    const token         = config.credentials.SLACK_BOT_TOKEN;
    const signingSecret = config.credentials.SLACK_SIGNING_SECRET;
    const appToken      = config.credentials.SLACK_APP_TOKEN; // Socket Mode

    if (!token || !signingSecret) {
      throw new Error('SLACK_BOT_TOKEN and SLACK_SIGNING_SECRET are required');
    }

    this.app = new SlackApp({
      token,
      signingSecret,
      socketMode:  !!appToken,
      appToken:    appToken || undefined,
      port:        parseInt(process.env.SLACK_PORT || '3002', 10),
    });

    this.web = new WebClient(token);
    this.registerHandlers();
  }

  async start(): Promise<void> {
    await this.app.start();
    this.connected = true;
    console.log('[Slack] Bolt app started');
  }

  async stop(): Promise<void> {
    await this.app.stop();
    this.connected = false;
  }

  isConnected(): boolean { return this.connected; }

  // ── Handlers ──────────────────────────────────────────────

  private registerHandlers(): void {
    // Slash commands
    this.app.command('/cutflow',        this.handleSlashCutflow.bind(this));
    this.app.command('/cutflow-script', this.handleSlashScript.bind(this));
    this.app.command('/cutflow-vo',     this.handleSlashVoiceover.bind(this));
    this.app.command('/cutflow-status', this.handleSlashStatus.bind(this));
    this.app.command('/cutflow-help',   this.handleSlashHelp.bind(this));

    // DMs and mentions
    this.app.message(async ({ message, say }) => {
      const msg    = message as GenericMessageEvent;
      const userId = msg.user || '';
      if (!userId) return;

      const attachments: MediaAttachment[] = [];

      // Handle file uploads
      if (msg.files && msg.files.length > 0) {
        for (const file of msg.files as any[]) {
          const type: 'video' | 'audio' | 'image' | 'document' =
            file.mimetype?.startsWith('video') ? 'video'
            : file.mimetype?.startsWith('audio') ? 'audio'
            : file.mimetype?.startsWith('image') ? 'image'
            : 'document';

          attachments.push({
            type,
            url:      file.url_private_download || file.url_private,
            filename: file.name || `slack_file_${Date.now()}`,
            mimeType: file.mimetype || 'application/octet-stream',
            size:     file.size,
          });
        }
      }

      const inbound: InboundMessage = {
        platform:    'slack',
        platformId:  userId,
        messageId:   msg.ts,
        text:        (msg.text || '').replace(/<@[A-Z0-9]+>/g, '').trim(),
        attachments,
        timestamp:   new Date(parseFloat(msg.ts) * 1000),
        raw:         msg,
      };

      // React immediately
      try {
        await this.app.client.reactions.add({
          channel: msg.channel,
          timestamp: msg.ts,
          name: 'hourglass_flowing_sand',
        });
      } catch {}

      await messagingHub.processInbound(inbound);

      try {
        await this.app.client.reactions.remove({
          channel: msg.channel,
          timestamp: msg.ts,
          name: 'hourglass_flowing_sand',
        });
        await this.app.client.reactions.add({
          channel: msg.channel,
          timestamp: msg.ts,
          name: 'white_check_mark',
        });
      } catch {}
    });
  }

  // ── Slash command handlers ────────────────────────────────

  private async handleSlashCutflow({ command, ack, say }: any): Promise<void> {
    await ack();
    const userId = command.user_id;
    const text   = command.text?.trim();

    if (!text || text === 'help') {
      await say({ blocks: this.helpBlocks() });
      return;
    }

    const inbound: InboundMessage = {
      platform:    'slack',
      platformId:  userId,
      messageId:   `slack_cmd_${Date.now()}`,
      text,
      attachments: [],
      timestamp:   new Date(),
      raw:         command,
    };
    await messagingHub.processInbound(inbound);
  }

  private async handleSlashScript({ command, ack, say }: any): Promise<void> {
    await ack();
    const prompt = command.text;
    if (!prompt) { await say('Usage: `/cutflow-script <your prompt>`'); return; }
    await say(`✍️ Generating script for: *${prompt}*`);
    messagingHub.emit('script-requested', {
      platform: 'slack', platformId: command.user_id, prompt,
    });
  }

  private async handleSlashVoiceover({ command, ack, say }: any): Promise<void> {
    await ack();
    const text = command.text;
    if (!text) { await say('Usage: `/cutflow-vo <text to speak>`'); return; }
    await say('🎙️ Generating voiceover...');
    messagingHub.emit('voiceover-requested', {
      platform: 'slack', platformId: command.user_id, text,
    });
  }

  private async handleSlashStatus({ command, ack, say }: any): Promise<void> {
    await ack();
    messagingHub.emit('status-requested', {
      platform: 'slack', platformId: command.user_id, say,
    });
  }

  private async handleSlashHelp({ command, ack, say }: any): Promise<void> {
    await ack();
    await say({ blocks: this.helpBlocks() });
  }

  // ── Send methods ──────────────────────────────────────────

  async sendText(platformId: string, text: string): Promise<boolean> {
    try {
      await this.web.chat.postMessage({ channel: platformId, text });
      return true;
    } catch (err) {
      console.error('[Slack] sendText failed:', err);
      return false;
    }
  }

  async sendVideo(platformId: string, videoPath: string, caption?: string): Promise<boolean> {
    try {
      const sizeMB = fs.statSync(videoPath).size / (1024 * 1024);

      if (sizeMB > this.maxFileSizeMB) {
        const link = `https://files.cutflow.dev/${path.basename(videoPath)}`;
        return this.sendText(platformId, `${caption || '🎬 Render ready!'}\n<${link}|Download (${sizeMB.toFixed(1)} MB)>`);
      }

      await this.web.filesUploadV2({
        channel_id:      platformId,
        file:            fs.createReadStream(videoPath),
        filename:        path.basename(videoPath),
        initial_comment: caption || '🎬 Your CutFlow render is ready!',
      });
      return true;
    } catch (err) {
      console.error('[Slack] sendVideo failed:', err);
      return false;
    }
  }

  async sendAudio(platformId: string, audioPath: string, caption?: string): Promise<boolean> {
    try {
      await this.web.filesUploadV2({
        channel_id:      platformId,
        file:            fs.createReadStream(audioPath),
        filename:        path.basename(audioPath),
        initial_comment: caption || '🎙️ Your voiceover is ready!',
      });
      return true;
    } catch (err) {
      console.error('[Slack] sendAudio failed:', err);
      return false;
    }
  }

  async sendImage(platformId: string, imagePath: string, caption?: string): Promise<boolean> {
    try {
      await this.web.filesUploadV2({
        channel_id:      platformId,
        file:            fs.createReadStream(imagePath),
        filename:        path.basename(imagePath),
        initial_comment: caption,
      });
      return true;
    } catch (err) {
      console.error('[Slack] sendImage failed:', err);
      return false;
    }
  }

  async downloadMedia(att: MediaAttachment, destPath: string): Promise<string> {
    const res = await axios.get(att.url, {
      responseType: 'arraybuffer',
      headers: { Authorization: `Bearer ${(this.web as any).token}` },
    });
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.writeFileSync(destPath, Buffer.from(res.data));
    return destPath;
  }

  // ── Block Kit UI ──────────────────────────────────────────

  private helpBlocks(): any[] {
    return [
      {
        type: 'header',
        text: { type: 'plain_text', text: '🎬 CutFlow by TLG3D' },
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: '*Slash Commands:*' },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: '`/cutflow <text>` — General command' },
          { type: 'mrkdwn', text: '`/cutflow-script <prompt>` — Generate script' },
          { type: 'mrkdwn', text: '`/cutflow-vo <text>` — Generate voiceover' },
          { type: 'mrkdwn', text: '`/cutflow-status` — Check project status' },
          { type: 'mrkdwn', text: '`/cutflow-help` — Show this menu' },
        ],
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: '*Upload a video file* to this channel and I\'ll add it to your editing queue.' },
      },
    ];
  }
}
