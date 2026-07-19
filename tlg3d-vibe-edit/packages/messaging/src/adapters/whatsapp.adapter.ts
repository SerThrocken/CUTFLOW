// ============================================================
//  CutFlow — WhatsApp Adapter
//  Uses Meta's official WhatsApp Cloud API (no Twilio).
//  Requires a Meta Business account + WhatsApp Business App.
//  Webhook receives messages; API sends replies.
// ============================================================

import express, { Router } from 'express';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import type { MessagingAdapter, AdapterConfig, InboundMessage, MediaAttachment } from '../hub';
import messagingHub from '../hub';

export class WhatsAppAdapter implements MessagingAdapter {
  platform      = 'whatsapp' as const;
  name          = 'WhatsApp';
  description   = 'Meta WhatsApp Cloud API — no Twilio required';
  icon          = '💚';
  supportsVideo = true;
  supportsAudio = true;
  maxFileSizeMB = 64; // WhatsApp Cloud API media limit

  private phoneNumberId = '';
  private accessToken   = '';
  private verifyToken   = '';
  private connected     = false;
  router: Router        = express.Router();

  async init(config: AdapterConfig): Promise<void> {
    this.phoneNumberId = config.credentials.WHATSAPP_PHONE_NUMBER_ID || '';
    this.accessToken   = config.credentials.WHATSAPP_ACCESS_TOKEN    || '';
    this.verifyToken   = config.credentials.WHATSAPP_VERIFY_TOKEN    || 'cutflow_whatsapp_verify';

    if (!this.phoneNumberId || !this.accessToken) {
      throw new Error('WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN are required');
    }

    this.setupWebhook();
  }

  async start(): Promise<void> {
    this.connected = true;
    console.log('[WhatsApp] Adapter ready — webhook at /webhooks/whatsapp');
  }

  async stop(): Promise<void> {
    this.connected = false;
  }

  isConnected(): boolean { return this.connected; }

  // ── Webhook Setup ──────────────────────────────────────────

  private setupWebhook(): void {
    // Verification (GET) — Meta calls this to verify webhook
    this.router.get('/webhooks/whatsapp', (req, res) => {
      const mode      = req.query['hub.mode'];
      const token     = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];

      if (mode === 'subscribe' && token === this.verifyToken) {
        res.status(200).send(challenge);
      } else {
        res.sendStatus(403);
      }
    });

    // Inbound messages (POST)
    this.router.post('/webhooks/whatsapp', express.json(), async (req, res) => {
      res.sendStatus(200); // Acknowledge immediately

      const body = req.body;
      if (body.object !== 'whatsapp_business_account') return;

      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          const value = change.value;
          if (!value?.messages) continue;

          for (const msg of value.messages) {
            await this.handleIncomingMessage(msg, value.metadata);
          }
        }
      }
    });
  }

  private async handleIncomingMessage(msg: any, metadata: any): Promise<void> {
    const platformId = msg.from; // Sender's WhatsApp phone number
    const messageId  = msg.id;
    const timestamp  = new Date(parseInt(msg.timestamp) * 1000);

    const attachments: MediaAttachment[] = [];
    let   text = '';

    switch (msg.type) {
      case 'text':
        text = msg.text?.body || '';
        break;

      case 'video': {
        const mediaId = msg.video.id;
        const url     = await this.getMediaUrl(mediaId);
        attachments.push({
          type:     'video',
          url,
          filename: `whatsapp_video_${Date.now()}.mp4`,
          mimeType: msg.video.mime_type || 'video/mp4',
        });
        text = msg.video.caption || '';
        break;
      }

      case 'audio':
      case 'voice': {
        const mediaId = msg[msg.type].id;
        const url     = await this.getMediaUrl(mediaId);
        attachments.push({
          type:     'audio',
          url,
          filename: `whatsapp_audio_${Date.now()}.ogg`,
          mimeType: msg[msg.type].mime_type || 'audio/ogg',
        });
        break;
      }

      case 'document': {
        const mediaId = msg.document.id;
        const mime    = msg.document.mime_type || '';
        const url     = await this.getMediaUrl(mediaId);
        attachments.push({
          type:     mime.startsWith('video') ? 'video' : 'document',
          url,
          filename: msg.document.filename || `doc_${Date.now()}`,
          mimeType: mime,
        });
        text = msg.document.caption || '';
        break;
      }

      case 'image': {
        const mediaId = msg.image.id;
        const url     = await this.getMediaUrl(mediaId);
        attachments.push({
          type:     'image',
          url,
          filename: `whatsapp_image_${Date.now()}.jpg`,
          mimeType: msg.image.mime_type || 'image/jpeg',
        });
        text = msg.image.caption || '';
        break;
      }
    }

    // Mark message as read
    await this.markRead(messageId);

    const inbound: InboundMessage = {
      platform:    'whatsapp',
      platformId,
      messageId,
      text,
      attachments,
      timestamp,
      raw: msg,
    };

    await messagingHub.processInbound(inbound);
  }

  // ── Send methods ──────────────────────────────────────────

  async sendText(platformId: string, text: string): Promise<boolean> {
    return this.callApi({
      messaging_product: 'whatsapp',
      recipient_type:    'individual',
      to:                platformId,
      type:              'text',
      text:              { preview_url: false, body: text },
    });
  }

  async sendVideo(platformId: string, videoPath: string, caption?: string): Promise<boolean> {
    try {
      const sizeMB = fs.statSync(videoPath).size / (1024 * 1024);

      if (sizeMB > this.maxFileSizeMB) {
        return this.sendText(
          platformId,
          `✅ Your render is ready!\n\n📥 Download here: https://files.cutflow.dev/${path.basename(videoPath)}\n\nFile: ${sizeMB.toFixed(1)} MB`
        );
      }

      // Upload media to WhatsApp first
      const mediaId = await this.uploadMedia(videoPath, 'video/mp4');
      return this.callApi({
        messaging_product: 'whatsapp',
        recipient_type:    'individual',
        to:                platformId,
        type:              'video',
        video:             { id: mediaId, caption: caption || '🎬 Your CutFlow render is ready!' },
      });
    } catch (err) {
      console.error('[WhatsApp] sendVideo failed:', err);
      return false;
    }
  }

  async sendAudio(platformId: string, audioPath: string, caption?: string): Promise<boolean> {
    try {
      const mediaId = await this.uploadMedia(audioPath, 'audio/mpeg');
      return this.callApi({
        messaging_product: 'whatsapp',
        recipient_type:    'individual',
        to:                platformId,
        type:              'audio',
        audio:             { id: mediaId },
      });
    } catch (err) {
      console.error('[WhatsApp] sendAudio failed:', err);
      return false;
    }
  }

  async sendImage(platformId: string, imagePath: string, caption?: string): Promise<boolean> {
    try {
      const mediaId = await this.uploadMedia(imagePath, 'image/jpeg');
      return this.callApi({
        messaging_product: 'whatsapp',
        recipient_type:    'individual',
        to:                platformId,
        type:              'image',
        image:             { id: mediaId, caption },
      });
    } catch (err) {
      console.error('[WhatsApp] sendImage failed:', err);
      return false;
    }
  }

  async downloadMedia(att: MediaAttachment, destPath: string): Promise<string> {
    // WhatsApp media URLs require auth header
    const response = await axios.get(att.url, {
      responseType: 'arraybuffer',
      headers:      { Authorization: `Bearer ${this.accessToken}` },
    });
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.writeFileSync(destPath, Buffer.from(response.data));
    return destPath;
  }

  // ── Meta API helpers ──────────────────────────────────────

  private apiBase(): string {
    return `https://graph.facebook.com/v19.0/${this.phoneNumberId}`;
  }

  private async callApi(data: any): Promise<boolean> {
    try {
      await axios.post(`${this.apiBase()}/messages`, data, {
        headers: {
          Authorization:  `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      return true;
    } catch (err: any) {
      console.error('[WhatsApp] API call failed:', err.response?.data || err.message);
      return false;
    }
  }

  private async getMediaUrl(mediaId: string): Promise<string> {
    const res = await axios.get(
      `https://graph.facebook.com/v19.0/${mediaId}`,
      { headers: { Authorization: `Bearer ${this.accessToken}` } }
    );
    return res.data.url;
  }

  private async uploadMedia(filePath: string, mimeType: string): Promise<string> {
    const FormData = (await import('form-data')).default;
    const form     = new FormData();
    form.append('messaging_product', 'whatsapp');
    form.append('type', mimeType);
    form.append('file', fs.createReadStream(filePath), {
      filename:    path.basename(filePath),
      contentType: mimeType,
    });

    const res = await axios.post(
      `${this.apiBase()}/media`,
      form,
      { headers: { ...form.getHeaders(), Authorization: `Bearer ${this.accessToken}` } }
    );
    return res.data.id;
  }

  private async markRead(messageId: string): Promise<void> {
    await this.callApi({ messaging_product: 'whatsapp', status: 'read', message_id: messageId });
  }
}
