// ============================================================
//  CutFlow — LINE / Viber / WeChat Adapters
// ============================================================

import express, { Router } from 'express';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { MessagingAdapter, AdapterConfig, InboundMessage, MediaAttachment } from '../hub';
import messagingHub from '../hub';

// ══════════════════════════════════════════════════════════════
//  LINE Adapter — LINE Messaging API
// ══════════════════════════════════════════════════════════════

export class LineAdapter implements MessagingAdapter {
  platform      = 'line' as const;
  name          = 'LINE';
  description   = 'LINE Messaging API — popular in Japan, Thailand, Taiwan';
  icon          = '💚';
  supportsVideo = true;
  supportsAudio = true;
  maxFileSizeMB = 200; // LINE supports large files via rich messages

  private accessToken  = '';
  private channelSecret = '';
  private connected    = false;
  router: Router       = express.Router();

  async init(config: AdapterConfig): Promise<void> {
    this.accessToken   = config.credentials.LINE_ACCESS_TOKEN   || '';
    this.channelSecret = config.credentials.LINE_CHANNEL_SECRET || '';
    if (!this.accessToken || !this.channelSecret) {
      throw new Error('LINE_ACCESS_TOKEN and LINE_CHANNEL_SECRET required');
    }
    this.setupWebhook();
  }

  async start(): Promise<void> { this.connected = true; }
  async stop():  Promise<void> { this.connected = false; }
  isConnected(): boolean       { return this.connected; }

  private setupWebhook(): void {
    this.router.post('/webhooks/line', express.json(), async (req, res) => {
      // Verify LINE signature
      const sig  = req.headers['x-line-signature'] as string;
      const body = JSON.stringify(req.body);
      const hmac = crypto.createHmac('SHA256', this.channelSecret)
        .update(body).digest('base64');
      if (sig !== hmac) { res.sendStatus(403); return; }

      res.sendStatus(200);

      for (const event of req.body.events || []) {
        if (event.type !== 'message') continue;
        const userId = event.source.userId;
        const msg    = event.message;
        const attList: MediaAttachment[] = [];

        if (msg.type === 'video' || msg.type === 'audio' || msg.type === 'image') {
          const contentUrl = await this.getContentUrl(msg.id);
          const type: 'video' | 'audio' | 'image' = msg.type;
          const ext  = type === 'video' ? 'mp4' : type === 'audio' ? 'mp3' : 'jpg';
          attList.push({
            type, url: contentUrl,
            filename: `line_${msg.id}.${ext}`,
            mimeType: type === 'video' ? 'video/mp4' : type === 'audio' ? 'audio/mpeg' : 'image/jpeg',
          });
        }

        await messagingHub.processInbound({
          platform: 'line', platformId: userId,
          messageId: msg.id, text: msg.type === 'text' ? msg.text : '',
          attachments: attList, timestamp: new Date(event.timestamp), raw: event,
        });
      }
    });
  }

  private async getContentUrl(messageId: string): Promise<string> {
    // LINE stores content temporarily — download and cache immediately
    return `https://api-data.line.me/v2/bot/message/${messageId}/content`;
  }

  async sendText(to: string, text: string): Promise<boolean> {
    return this.pushMessage(to, [{ type: 'text', text }]);
  }

  async sendVideo(to: string, videoPath: string, caption?: string): Promise<boolean> {
    const url = `https://files.cutflow.dev/${path.basename(videoPath)}`;
    // LINE video message needs a hosted URL
    return this.pushMessage(to, [
      { type: 'video', originalContentUrl: url, previewImageUrl: url },
      ...(caption ? [{ type: 'text', text: caption }] : []),
    ]);
  }

  async sendAudio(to: string, audioPath: string, caption?: string): Promise<boolean> {
    const url = `https://files.cutflow.dev/${path.basename(audioPath)}`;
    return this.pushMessage(to, [
      { type: 'audio', originalContentUrl: url, duration: 60000 },
      ...(caption ? [{ type: 'text', text: caption }] : []),
    ]);
  }

  async sendImage(to: string, imagePath: string, caption?: string): Promise<boolean> {
    const url = `https://files.cutflow.dev/${path.basename(imagePath)}`;
    return this.pushMessage(to, [
      { type: 'image', originalContentUrl: url, previewImageUrl: url },
      ...(caption ? [{ type: 'text', text: caption }] : []),
    ]);
  }

  async downloadMedia(att: MediaAttachment, destPath: string): Promise<string> {
    const res = await axios.get(att.url, {
      responseType: 'arraybuffer',
      headers:      { Authorization: `Bearer ${this.accessToken}` },
    });
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.writeFileSync(destPath, Buffer.from(res.data));
    return destPath;
  }

  private async pushMessage(to: string, messages: any[]): Promise<boolean> {
    try {
      await axios.post(
        'https://api.line.me/v2/bot/message/push',
        { to, messages: messages.slice(0, 5) }, // LINE max 5 per call
        { headers: { Authorization: `Bearer ${this.accessToken}` } }
      );
      return true;
    } catch (err: any) {
      console.error('[LINE] push failed:', err.response?.data || err.message);
      return false;
    }
  }
}

// ══════════════════════════════════════════════════════════════
//  Viber Adapter — Viber Bot API
// ══════════════════════════════════════════════════════════════

export class ViberAdapter implements MessagingAdapter {
  platform      = 'viber' as const;
  name          = 'Viber';
  description   = 'Viber Bot API — popular in Eastern Europe and Middle East';
  icon          = '💜';
  supportsVideo = true;
  supportsAudio = true;
  maxFileSizeMB = 200;

  private authToken = '';
  private botName   = 'CutFlow';
  private connected = false;
  router: Router    = express.Router();

  async init(config: AdapterConfig): Promise<void> {
    this.authToken = config.credentials.VIBER_AUTH_TOKEN || '';
    if (!this.authToken) throw new Error('VIBER_AUTH_TOKEN required');
    this.setupWebhook();
  }

  async start(): Promise<void> {
    // Register webhook with Viber
    try {
      await axios.post(
        'https://chatapi.viber.com/pa/set_webhook',
        { url: process.env.WEBHOOK_BASE_URL + '/webhooks/viber', event_types: ['message'] },
        { headers: { 'X-Viber-Auth-Token': this.authToken } }
      );
      this.connected = true;
      console.log('[Viber] Webhook registered');
    } catch (err: any) {
      console.error('[Viber] Webhook registration failed:', err.message);
      this.connected = false;
    }
  }

  async stop():  Promise<void> { this.connected = false; }
  isConnected(): boolean       { return this.connected; }

  private setupWebhook(): void {
    this.router.post('/webhooks/viber', express.json(), async (req, res) => {
      res.sendStatus(200);
      const event = req.body;
      if (event.event !== 'message') return;

      const sender  = event.sender;
      const msg     = event.message;
      const attList: MediaAttachment[] = [];

      if (msg.type === 'video' && msg.media) {
        attList.push({ type: 'video', url: msg.media, filename: `viber_video_${Date.now()}.mp4`, mimeType: 'video/mp4' });
      } else if (msg.type === 'picture' && msg.media) {
        attList.push({ type: 'image', url: msg.media, filename: `viber_image_${Date.now()}.jpg`, mimeType: 'image/jpeg' });
      } else if (msg.type === 'file' && msg.media) {
        attList.push({ type: 'document', url: msg.media, filename: msg.file_name || 'file', mimeType: '' });
      }

      await messagingHub.processInbound({
        platform: 'viber', platformId: sender.id,
        messageId: event.message_token?.toString() || `viber_${Date.now()}`,
        text: msg.type === 'text' ? (msg.text || '') : '',
        attachments: attList, timestamp: new Date(event.timestamp), raw: event,
      });
    });
  }

  async sendText(to: string, text: string): Promise<boolean> {
    return this.callSend({ receiver: to, type: 'text', text });
  }

  async sendVideo(to: string, videoPath: string, caption?: string): Promise<boolean> {
    const url = `https://files.cutflow.dev/${path.basename(videoPath)}`;
    const ok  = await this.callSend({ receiver: to, type: 'video', media: url });
    if (caption) await this.sendText(to, caption);
    return ok;
  }

  async sendAudio(to: string, audioPath: string, caption?: string): Promise<boolean> {
    const url = `https://files.cutflow.dev/${path.basename(audioPath)}`;
    return this.callSend({ receiver: to, type: 'file', media: url, file_name: path.basename(audioPath), size: 0 });
  }

  async sendImage(to: string, imagePath: string, caption?: string): Promise<boolean> {
    const url = `https://files.cutflow.dev/${path.basename(imagePath)}`;
    return this.callSend({ receiver: to, type: 'picture', media: url, text: caption || '' });
  }

  async downloadMedia(att: MediaAttachment, destPath: string): Promise<string> {
    const res = await axios.get(att.url, { responseType: 'arraybuffer' });
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.writeFileSync(destPath, Buffer.from(res.data));
    return destPath;
  }

  private async callSend(body: any): Promise<boolean> {
    try {
      await axios.post('https://chatapi.viber.com/pa/send_message', body, {
        headers: { 'X-Viber-Auth-Token': this.authToken },
      });
      return true;
    } catch (err: any) {
      console.error('[Viber] send failed:', err.response?.data || err.message);
      return false;
    }
  }
}

// ══════════════════════════════════════════════════════════════
//  WeChat Adapter — WeChat Official Account API
// ══════════════════════════════════════════════════════════════

export class WeChatAdapter implements MessagingAdapter {
  platform      = 'wechat' as const;
  name          = 'WeChat';
  description   = 'WeChat Official Account API — requires Tencent Developer Account';
  icon          = '🟢';
  supportsVideo = true;
  supportsAudio = true;
  maxFileSizeMB = 20;

  private appId      = '';
  private appSecret  = '';
  private token      = '';
  private accessToken = '';
  private tokenExpiry = 0;
  private connected   = false;
  router: Router      = express.Router();

  async init(config: AdapterConfig): Promise<void> {
    this.appId     = config.credentials.WECHAT_APP_ID     || '';
    this.appSecret = config.credentials.WECHAT_APP_SECRET || '';
    this.token     = config.credentials.WECHAT_TOKEN      || 'cutflow_wechat';
    if (!this.appId || !this.appSecret) throw new Error('WECHAT_APP_ID and WECHAT_APP_SECRET required');
    this.setupWebhook();
  }

  async start(): Promise<void> {
    await this.refreshAccessToken();
    this.connected = true;
  }

  async stop():  Promise<void> { this.connected = false; }
  isConnected(): boolean       { return this.connected; }

  private setupWebhook(): void {
    this.router.get('/webhooks/wechat', (req, res) => {
      const { signature, timestamp, nonce, echostr } = req.query as any;
      const arr = [this.token, timestamp, nonce].sort().join('');
      const hash = crypto.createHash('sha1').update(arr).digest('hex');
      if (hash === signature) { res.send(echostr); } else { res.sendStatus(403); }
    });

    this.router.post('/webhooks/wechat', express.text({ type: 'application/xml' }), async (req, res) => {
      res.send('success');
      // Parse XML message (use xml2js in production)
      const body     = req.body as string;
      const fromUser = body.match(/<FromUserName><!\[CDATA\[(.+?)\]\]><\/FromUserName>/)?.[1] || '';
      const msgType  = body.match(/<MsgType><!\[CDATA\[(.+?)\]\]><\/MsgType>/)?.[1] || '';
      const text     = body.match(/<Content><!\[CDATA\[(.+?)\]\]><\/Content>/)?.[1] || '';
      const mediaId  = body.match(/<MediaId><!\[CDATA\[(.+?)\]\]><\/MediaId>/)?.[1] || '';

      if (!fromUser) return;

      const attList: MediaAttachment[] = [];
      if (mediaId && (msgType === 'video' || msgType === 'voice' || msgType === 'image')) {
        const type: 'video' | 'audio' | 'image' =
          msgType === 'video' ? 'video' : msgType === 'voice' ? 'audio' : 'image';
        const ext = type === 'video' ? 'mp4' : type === 'audio' ? 'amr' : 'jpg';
        attList.push({
          type, url: mediaId, // WeChat uses mediaId, not URL
          filename: `wechat_${mediaId}.${ext}`,
          mimeType: type === 'video' ? 'video/mp4' : type === 'audio' ? 'audio/amr' : 'image/jpeg',
        });
      }

      await messagingHub.processInbound({
        platform: 'wechat', platformId: fromUser,
        messageId: `wechat_${Date.now()}`, text,
        attachments: attList, timestamp: new Date(), raw: body,
      });
    });
  }

  private async refreshAccessToken(): Promise<void> {
    if (Date.now() < this.tokenExpiry) return;
    const res = await axios.get('https://api.weixin.qq.com/cgi-bin/token', {
      params: { grant_type: 'client_credential', appid: this.appId, secret: this.appSecret },
    });
    this.accessToken = res.data.access_token;
    this.tokenExpiry = Date.now() + (res.data.expires_in - 60) * 1000;
  }

  async sendText(to: string, text: string): Promise<boolean> {
    await this.refreshAccessToken();
    try {
      await axios.post(
        `https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token=${this.accessToken}`,
        { touser: to, msgtype: 'text', text: { content: text } }
      );
      return true;
    } catch (err: any) {
      console.error('[WeChat] sendText failed:', err.response?.data || err.message);
      return false;
    }
  }

  async sendVideo(to: string, videoPath: string, caption?: string): Promise<boolean> {
    const link = `https://files.cutflow.dev/${path.basename(videoPath)}`;
    return this.sendText(to, `${caption || '🎬 Render ready!'}\n\nDownload: ${link}`);
  }

  async sendAudio(to: string, audioPath: string, caption?: string): Promise<boolean> {
    const link = `https://files.cutflow.dev/${path.basename(audioPath)}`;
    return this.sendText(to, `🎙️ Audio ready!\n\nDownload: ${link}`);
  }

  async sendImage(to: string, imagePath: string, caption?: string): Promise<boolean> {
    const link = `https://files.cutflow.dev/${path.basename(imagePath)}`;
    return this.sendText(to, `${caption || ''}\n\nView: ${link}`);
  }

  async downloadMedia(att: MediaAttachment, destPath: string): Promise<string> {
    await this.refreshAccessToken();
    const res = await axios.get(
      `https://api.weixin.qq.com/cgi-bin/media/get?access_token=${this.accessToken}&media_id=${att.url}`,
      { responseType: 'arraybuffer' }
    );
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.writeFileSync(destPath, Buffer.from(res.data));
    return destPath;
  }
}
