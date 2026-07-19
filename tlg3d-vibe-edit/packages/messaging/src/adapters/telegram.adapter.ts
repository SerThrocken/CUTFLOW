// ============================================================
//  CutFlow — Telegram Adapter
//  Uses grammy (modern Telegram Bot API framework).
//  Bidirectional: receive videos/audio from users,
//  send back renders directly in chat.
// ============================================================

import { Bot, Context, InputFile, InlineKeyboard } from 'grammy';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import type { MessagingAdapter, AdapterConfig, InboundMessage, MediaAttachment } from '../hub';
import messagingHub from '../hub';

export class TelegramAdapter implements MessagingAdapter {
  platform      = 'telegram' as const;
  name          = 'Telegram';
  description   = 'Bot API — send/receive videos, audio, documents in any chat or DM';
  icon          = '✈️';
  supportsVideo = true;
  supportsAudio = true;
  maxFileSizeMB = 2000; // Telegram supports up to 2 GB via Bot API

  private bot!: Bot;
  private connected = false;

  async init(config: AdapterConfig): Promise<void> {
    const token = config.credentials.TELEGRAM_TOKEN;
    if (!token) throw new Error('TELEGRAM_TOKEN not configured');
    this.bot = new Bot(token);
    this.setupHandlers();
  }

  async start(): Promise<void> {
    await this.bot.start({
      onStart: () => {
        this.connected = true;
        console.log('[Telegram] Bot started');
      },
    });
  }

  async stop(): Promise<void> {
    await this.bot.stop();
    this.connected = false;
  }

  isConnected(): boolean { return this.connected; }

  // ── Handlers ──────────────────────────────────────────────

  private setupHandlers(): void {
    // /start
    this.bot.command('start', async (ctx) => {
      await ctx.reply(
        `👋 Welcome to *CutFlow* by TLG3D!\n\nSend me a video or audio file to edit, or use a command below.`,
        { parse_mode: 'Markdown', reply_markup: this.mainKeyboard() }
      );
    });

    // /help
    this.bot.command('help', async (ctx) => {
      await ctx.reply(this.helpText(), { parse_mode: 'Markdown' });
    });

    // /status
    this.bot.command('status', async (ctx) => {
      const userId = String(ctx.from!.id);
      messagingHub.emit('status-requested', { platform: 'telegram', platformId: userId, ctx });
    });

    // /projects
    this.bot.command('projects', async (ctx) => {
      const userId = String(ctx.from!.id);
      messagingHub.emit('projects-requested', { platform: 'telegram', platformId: userId, ctx });
    });

    // /script <prompt>
    this.bot.command('script', async (ctx) => {
      const prompt = ctx.match;
      if (!prompt) { await ctx.reply('Usage: /script <your prompt>'); return; }
      const userId = String(ctx.from!.id);
      await ctx.reply('✍️ Generating your script...');
      messagingHub.emit('script-requested', { platform: 'telegram', platformId: userId, prompt });
    });

    // /voiceover <text>
    this.bot.command('voiceover', async (ctx) => {
      const text = ctx.match;
      if (!text) { await ctx.reply('Usage: /voiceover <text to speak>'); return; }
      const userId = String(ctx.from!.id);
      await ctx.reply('🎙️ Generating voiceover...');
      messagingHub.emit('voiceover-requested', { platform: 'telegram', platformId: userId, text });
    });

    // /edit [name]
    this.bot.command('edit', async (ctx) => {
      const name   = ctx.match || `edit_${Date.now()}`;
      const userId = String(ctx.from!.id);
      await ctx.reply(`🎬 Starting project: *${name}*`, { parse_mode: 'Markdown' });
      messagingHub.emit('edit-requested', { platform: 'telegram', platformId: userId, projectName: name });
    });

    // /queue
    this.bot.command('queue', async (ctx) => {
      const userId = String(ctx.from!.id);
      messagingHub.emit('queue-requested', { platform: 'telegram', platformId: userId, ctx });
    });

    // Incoming video file
    this.bot.on('message:video', async (ctx) => {
      await this.handleMediaMessage(ctx, 'video');
    });

    // Incoming audio / voice
    this.bot.on('message:audio', async (ctx) => {
      await this.handleMediaMessage(ctx, 'audio');
    });
    this.bot.on('message:voice', async (ctx) => {
      await this.handleMediaMessage(ctx, 'audio');
    });

    // Incoming document (could be a video file sent as document)
    this.bot.on('message:document', async (ctx) => {
      const mime = ctx.message.document.mime_type || '';
      const type = mime.startsWith('video') ? 'video'
        : mime.startsWith('audio') ? 'audio'
        : 'document';
      await this.handleMediaMessage(ctx, type as any);
    });

    // Plain text messages
    this.bot.on('message:text', async (ctx) => {
      const userId = String(ctx.from!.id);
      const inbound: InboundMessage = {
        platform:    'telegram',
        platformId:  userId,
        messageId:   String(ctx.message.message_id),
        text:        ctx.message.text,
        attachments: [],
        timestamp:   new Date(ctx.message.date * 1000),
        raw:         ctx.message,
      };
      await messagingHub.processInbound(inbound);
    });

    // Callback queries from inline keyboards
    this.bot.on('callback_query:data', async (ctx) => {
      const [action, projectId] = ctx.callbackQuery.data.split(':');
      const userId = String(ctx.from.id);
      switch (action) {
        case 'render':
          messagingHub.emit('render-requested', { platform: 'telegram', platformId: userId, projectId });
          await ctx.answerCallbackQuery('🎬 Render queued!');
          break;
        case 'status':
          messagingHub.emit('status-requested', { platform: 'telegram', platformId: userId });
          await ctx.answerCallbackQuery('📋 Fetching status...');
          break;
      }
    });
  }

  private async handleMediaMessage(ctx: Context, type: 'video' | 'audio' | 'document'): Promise<void> {
    const userId = String(ctx.from!.id);
    const msg    = ctx.message!;

    let fileId   = '';
    let filename = 'media';
    let mimeType = 'application/octet-stream';
    let size     = 0;

    if (type === 'video' && msg.video) {
      fileId   = msg.video.file_id;
      filename = `video_${Date.now()}.mp4`;
      mimeType = 'video/mp4';
      size     = msg.video.file_size || 0;
    } else if (type === 'audio' && msg.audio) {
      fileId   = msg.audio.file_id;
      filename = msg.audio.file_name || `audio_${Date.now()}.mp3`;
      mimeType = msg.audio.mime_type || 'audio/mpeg';
      size     = msg.audio.file_size || 0;
    } else if (msg.voice) {
      fileId   = msg.voice.file_id;
      filename = `voice_${Date.now()}.ogg`;
      mimeType = 'audio/ogg';
      size     = msg.voice.file_size || 0;
    } else if (msg.document) {
      fileId   = msg.document.file_id;
      filename = msg.document.file_name || `doc_${Date.now()}`;
      mimeType = msg.document.mime_type || 'application/octet-stream';
      size     = msg.document.file_size || 0;
      type     = mimeType.startsWith('video') ? 'video' : 'audio';
    }

    // Get download URL from Telegram
    const file    = await ctx.api.getFile(fileId);
    const fileUrl = `https://api.telegram.org/file/bot${(this.bot as any).token}/${file.file_path}`;

    const attachment: MediaAttachment = {
      type,
      url:      fileUrl,
      filename,
      mimeType,
      size,
    };

    await ctx.reply('📥 Received! Adding to your project queue...', {
      reply_markup: new InlineKeyboard().text('📋 Check Status', 'status:all'),
    });

    const inbound: InboundMessage = {
      platform:    'telegram',
      platformId:  userId,
      messageId:   String(msg.message_id),
      text:        msg.caption || '',
      attachments: [attachment],
      timestamp:   new Date(msg.date * 1000),
      raw:         msg,
    };

    await messagingHub.processInbound(inbound);
  }

  // ── Send methods ──────────────────────────────────────────

  async sendText(platformId: string, text: string): Promise<boolean> {
    try {
      await this.bot.api.sendMessage(platformId, text, { parse_mode: 'Markdown' });
      return true;
    } catch (err) {
      console.error('[Telegram] sendText failed:', err);
      return false;
    }
  }

  async sendVideo(platformId: string, videoPath: string, caption?: string): Promise<boolean> {
    try {
      const sizeMB = fs.statSync(videoPath).size / (1024 * 1024);
      if (sizeMB > this.maxFileSizeMB) {
        return this.sendText(platformId,
          `✅ Render ready — too large for direct send (${sizeMB.toFixed(1)} MB).\n📥 Download: https://files.cutflow.dev/${path.basename(videoPath)}`
        );
      }
      await this.bot.api.sendVideo(platformId, new InputFile(videoPath), {
        caption:    caption || '🎬 Your CutFlow render is ready!',
        parse_mode: 'Markdown',
      });
      return true;
    } catch (err) {
      console.error('[Telegram] sendVideo failed:', err);
      return false;
    }
  }

  async sendAudio(platformId: string, audioPath: string, caption?: string): Promise<boolean> {
    try {
      await this.bot.api.sendAudio(platformId, new InputFile(audioPath), {
        caption: caption || '🎙️ Your voiceover is ready!',
      });
      return true;
    } catch (err) {
      console.error('[Telegram] sendAudio failed:', err);
      return false;
    }
  }

  async sendImage(platformId: string, imagePath: string, caption?: string): Promise<boolean> {
    try {
      await this.bot.api.sendPhoto(platformId, new InputFile(imagePath), { caption });
      return true;
    } catch (err) {
      console.error('[Telegram] sendImage failed:', err);
      return false;
    }
  }

  async downloadMedia(att: MediaAttachment, destPath: string): Promise<string> {
    const response = await axios.get(att.url, { responseType: 'arraybuffer' });
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.writeFileSync(destPath, Buffer.from(response.data));
    return destPath;
  }

  // ── UI helpers ────────────────────────────────────────────

  private mainKeyboard(): any {
    return new InlineKeyboard()
      .text('📋 Status',   'status:all')
      .text('📁 Projects', 'projects:all')
      .row()
      .text('🛒 Marketplace', 'marketplace:all')
      .text('❓ Help',        'help:all');
  }

  private helpText(): string {
    return [
      '🎬 *CutFlow Commands*',
      '',
      '/start — Welcome message',
      '/help — Show this menu',
      '/status — Your project status',
      '/projects — List your projects',
      '/queue — View processing queue',
      '/script <prompt> — Generate a script',
      '/voiceover <text> — Generate voiceover',
      '/edit [name] — Start an edit project',
      '',
      '📎 *Send a video or audio file* to add it to your queue.',
      '',
      '_CutFlow by The Looking Glass 3D_',
    ].join('\n');
  }
}
