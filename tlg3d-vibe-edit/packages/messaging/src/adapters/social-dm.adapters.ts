// ============================================================
//  CutFlow — Instagram DM / Messenger / Twitter(X) DM Adapters
//  All use official APIs — no third-party services.
//
//  Instagram DM  → Meta Messenger API (same as WhatsApp webhook)
//  Facebook Messenger → Meta Messenger Platform API
//  Twitter/X DM  → X API v2 Direct Messages
// ============================================================

import express, { Router } from 'express';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import type { MessagingAdapter, AdapterConfig, InboundMessage, MediaAttachment } from '../hub';
import messagingHub from '../hub';

// ── INSTAGRAM DM ─────────────────────────────────────────────

export class InstagramAdapter implements MessagingAdapter {
  platform      = 'instagram' as const;
  name          = 'Instagram DM';
  description   = 'Meta Messenger API for Instagram Direct Messages';
  icon          = '📸';
  supportsVideo = true;
  supportsAudio = false;
  maxFileSizeMB = 25;

  private accessToken = '';
  private verifyToken = '';
  private pageId      = '';
  private connected   = false;
  router: Router      = express.Router();

  async init(config: AdapterConfig): Promise<void> {
    this.accessToken = config.credentials.INSTAGRAM_ACCESS_TOKEN || '';
    this.verifyToken = config.credentials.INSTAGRAM_VERIFY_TOKEN || 'cutflow_ig_verify';
    this.pageId      = config.credentials.INSTAGRAM_PAGE_ID      || '';
    this.setupWebhook();
  }

  async start(): Promise<void> { this.connected = true; }
  async stop():  Promise<void> { this.connected = false; }
  isConnected(): boolean       { return this.connected; }

  private setupWebhook(): void {
    this.router.get('/webhooks/instagram', (req, res) => {
      if (req.query['hub.verify_token'] === this.verifyToken) {
        res.send(req.query['hub.challenge']);
      } else {
        res.sendStatus(403);
      }
    });

    this.router.post('/webhooks/instagram', express.json(), async (req, res) => {
      res.sendStatus(200);
      for (const entry of req.body.entry || []) {
        for (const msgEvent of entry.messaging || []) {
          if (!msgEvent.message) continue;

          const senderId = msgEvent.sender.id;
          const msg      = msgEvent.message;
          const attList: MediaAttachment[] = [];

          if (msg.attachments) {
            for (const att of msg.attachments) {
              const type = att.type === 'video' ? 'video'
                : att.type === 'audio'  ? 'audio'
                : att.type === 'image'  ? 'image'
                : 'document';
              attList.push({
                type, url: att.payload?.url || '', filename: `ig_${Date.now()}`, mimeType: '',
              });
            }
          }

          await messagingHub.processInbound({
            platform: 'instagram', platformId: senderId,
            messageId: msg.mid, text: msg.text || '',
            attachments: attList, timestamp: new Date(), raw: msgEvent,
          });
        }
      }
    });
  }

  async sendText(to: string, text: string): Promise<boolean> {
    return this.sendMessageApi(to, { text });
  }

  async sendVideo(to: string, videoPath: string, caption?: string): Promise<boolean> {
    const url = `https://files.cutflow.dev/${path.basename(videoPath)}`;
    return this.sendMessageApi(to, {
      attachment: { type: 'video', payload: { url, is_reusable: false } },
    });
  }

  async sendAudio(to: string, audioPath: string, caption?: string): Promise<boolean> {
    return this.sendText(to, `🎙️ Audio ready: https://files.cutflow.dev/${path.basename(audioPath)}`);
  }

  async sendImage(to: string, imagePath: string, caption?: string): Promise<boolean> {
    const url = `https://files.cutflow.dev/${path.basename(imagePath)}`;
    return this.sendMessageApi(to, {
      attachment: { type: 'image', payload: { url, is_reusable: false } },
    });
  }

  async downloadMedia(att: MediaAttachment, destPath: string): Promise<string> {
    const res = await axios.get(att.url, { responseType: 'arraybuffer' });
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.writeFileSync(destPath, Buffer.from(res.data));
    return destPath;
  }

  private async sendMessageApi(to: string, message: any): Promise<boolean> {
    try {
      await axios.post(
        `https://graph.facebook.com/v19.0/${this.pageId}/messages`,
        { recipient: { id: to }, message },
        { params: { access_token: this.accessToken } }
      );
      return true;
    } catch (err: any) {
      console.error('[Instagram] sendMessage failed:', err.response?.data || err.message);
      return false;
    }
  }
}

// ── FACEBOOK MESSENGER ────────────────────────────────────────

export class MessengerAdapter implements MessagingAdapter {
  platform      = 'messenger' as const;
  name          = 'Facebook Messenger';
  description   = 'Meta Messenger Platform API';
  icon          = '👤';
  supportsVideo = true;
  supportsAudio = true;
  maxFileSizeMB = 25;

  private accessToken = '';
  private verifyToken = '';
  private pageId      = '';
  private connected   = false;
  router: Router      = express.Router();

  async init(config: AdapterConfig): Promise<void> {
    this.accessToken = config.credentials.MESSENGER_PAGE_TOKEN  || '';
    this.verifyToken = config.credentials.MESSENGER_VERIFY_TOKEN || 'cutflow_messenger_verify';
    this.pageId      = config.credentials.MESSENGER_PAGE_ID     || '';
    this.setupWebhook();
  }

  async start(): Promise<void> { this.connected = true; }
  async stop():  Promise<void> { this.connected = false; }
  isConnected(): boolean       { return this.connected; }

  private setupWebhook(): void {
    this.router.get('/webhooks/messenger', (req, res) => {
      if (req.query['hub.verify_token'] === this.verifyToken) {
        res.send(req.query['hub.challenge']);
      } else { res.sendStatus(403); }
    });

    this.router.post('/webhooks/messenger', express.json(), async (req, res) => {
      res.sendStatus(200);
      for (const entry of req.body.entry || []) {
        for (const event of entry.messaging || []) {
          if (!event.message) continue;
          const senderId = event.sender.id;
          const msg = event.message;
          const attList: MediaAttachment[] = [];

          for (const att of (msg.attachments || []) as any[]) {
            const type = att.type === 'video' ? 'video'
              : att.type === 'audio' ? 'audio'
              : att.type === 'image' ? 'image'
              : 'document';
            attList.push({
              type, url: att.payload?.url || '', filename: `fbm_${Date.now()}`, mimeType: '',
            });
          }

          await messagingHub.processInbound({
            platform: 'messenger', platformId: senderId,
            messageId: msg.mid, text: msg.text || '',
            attachments: attList, timestamp: new Date(), raw: event,
          });
        }
      }
    });
  }

  async sendText(to: string, text: string): Promise<boolean> {
    return this.callSendApi(to, { text });
  }

  async sendVideo(to: string, videoPath: string, caption?: string): Promise<boolean> {
    const url = `https://files.cutflow.dev/${path.basename(videoPath)}`;
    return this.callSendApi(to, {
      attachment: { type: 'video', payload: { url, is_reusable: false } },
    });
  }

  async sendAudio(to: string, audioPath: string, caption?: string): Promise<boolean> {
    const url = `https://files.cutflow.dev/${path.basename(audioPath)}`;
    return this.callSendApi(to, {
      attachment: { type: 'audio', payload: { url, is_reusable: false } },
    });
  }

  async sendImage(to: string, imagePath: string, caption?: string): Promise<boolean> {
    const url = `https://files.cutflow.dev/${path.basename(imagePath)}`;
    return this.callSendApi(to, {
      attachment: { type: 'image', payload: { url, is_reusable: false } },
    });
  }

  async downloadMedia(att: MediaAttachment, destPath: string): Promise<string> {
    const res = await axios.get(att.url, { responseType: 'arraybuffer' });
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.writeFileSync(destPath, Buffer.from(res.data));
    return destPath;
  }

  private async callSendApi(to: string, message: any): Promise<boolean> {
    try {
      await axios.post(
        'https://graph.facebook.com/v19.0/me/messages',
        { recipient: { id: to }, message },
        { params: { access_token: this.accessToken } }
      );
      return true;
    } catch (err: any) {
      console.error('[Messenger] send failed:', err.response?.data || err.message);
      return false;
    }
  }
}

// ── TWITTER / X DM ────────────────────────────────────────────

export class TwitterAdapter implements MessagingAdapter {
  platform      = 'twitter' as const;
  name          = 'X / Twitter DM';
  description   = 'X (Twitter) Direct Messages via API v2';
  icon          = '✖️';
  supportsVideo = false; // X DM API does not support direct video attachment
  supportsAudio = false;
  maxFileSizeMB = 15;

  private bearerToken     = '';
  private apiKey          = '';
  private apiSecret       = '';
  private accessToken     = '';
  private accessSecret    = '';
  private botUserId       = '';
  private connected       = false;
  private pollTimer:      NodeJS.Timeout | null = null;
  private lastEventId     = '';

  async init(config: AdapterConfig): Promise<void> {
    this.bearerToken   = config.credentials.TWITTER_BEARER_TOKEN  || '';
    this.apiKey        = config.credentials.TWITTER_API_KEY       || '';
    this.apiSecret     = config.credentials.TWITTER_API_SECRET    || '';
    this.accessToken   = config.credentials.TWITTER_ACCESS_TOKEN  || '';
    this.accessSecret  = config.credentials.TWITTER_ACCESS_SECRET || '';
    this.botUserId     = config.credentials.TWITTER_BOT_USER_ID   || '';

    if (!this.bearerToken) throw new Error('TWITTER_BEARER_TOKEN required');
  }

  async start(): Promise<void> {
    this.connected  = true;
    // Poll DMs every 60 seconds (Twitter API rate limits are strict)
    this.pollTimer  = setInterval(() => this.pollDMs(), 60_000);
    await this.pollDMs();
    console.log('[Twitter/X] DM polling started');
  }

  async stop(): Promise<void> {
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.connected = false;
  }

  isConnected(): boolean { return this.connected; }

  private async pollDMs(): Promise<void> {
    try {
      const params: any = { max_results: 50, expansions: 'sender_id', 'media.fields': 'url,type' };
      if (this.lastEventId) params.since_id = this.lastEventId;

      const res = await axios.get('https://api.twitter.com/2/dm_events', {
        params,
        headers: { Authorization: `Bearer ${this.bearerToken}` },
      });

      const events = (res.data.data || []) as any[];
      for (const event of events.reverse()) {
        if (event.sender_id === this.botUserId) continue; // Skip own messages
        if (event.id > (this.lastEventId || '')) this.lastEventId = event.id;

        const attList: MediaAttachment[] = [];
        for (const mediaKey of (event.attachments?.media_keys || [])) {
          const media = res.data.includes?.media?.find((m: any) => m.media_key === mediaKey);
          if (media?.url) {
            attList.push({
              type:     media.type === 'video' ? 'video' : 'image',
              url:      media.url,
              filename: `twitter_${media.media_key}`,
              mimeType: media.type === 'video' ? 'video/mp4' : 'image/jpeg',
            });
          }
        }

        await messagingHub.processInbound({
          platform:    'twitter',
          platformId:  event.sender_id,
          messageId:   event.id,
          text:        event.text || '',
          attachments: attList,
          timestamp:   new Date(event.created_at),
          raw:         event,
        });
      }
    } catch (err: any) {
      console.error('[Twitter/X] pollDMs error:', err.response?.data || err.message);
    }
  }

  async sendText(to: string, text: string): Promise<boolean> {
    try {
      await axios.post(
        'https://api.twitter.com/2/dm_conversations/with/:participant_id/messages',
        { text },
        { headers: this.oauthHeaders() }
      );
      return true;
    } catch (err: any) {
      console.error('[Twitter/X] sendText failed:', err.response?.data || err.message);
      return false;
    }
  }

  async sendVideo(to: string, videoPath: string, caption?: string): Promise<boolean> {
    // X DM does not support direct video — send a link
    const link = `https://files.cutflow.dev/${path.basename(videoPath)}`;
    return this.sendText(to, `${caption || '🎬 CutFlow render ready!'}\n\nDownload: ${link}`);
  }

  async sendAudio(to: string, audioPath: string, caption?: string): Promise<boolean> {
    const link = `https://files.cutflow.dev/${path.basename(audioPath)}`;
    return this.sendText(to, `🎙️ Voiceover ready!\n\nDownload: ${link}`);
  }

  async sendImage(to: string, imagePath: string, caption?: string): Promise<boolean> {
    const link = `https://files.cutflow.dev/${path.basename(imagePath)}`;
    return this.sendText(to, `${caption || ''}\n\nView: ${link}`);
  }

  async downloadMedia(att: MediaAttachment, destPath: string): Promise<string> {
    const res = await axios.get(att.url, {
      responseType: 'arraybuffer',
      headers:      { Authorization: `Bearer ${this.bearerToken}` },
    });
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.writeFileSync(destPath, Buffer.from(res.data));
    return destPath;
  }

  private oauthHeaders(): Record<string, string> {
    // In production use oauth-1.0a to sign requests
    return { Authorization: `Bearer ${this.bearerToken}` };
  }
}
