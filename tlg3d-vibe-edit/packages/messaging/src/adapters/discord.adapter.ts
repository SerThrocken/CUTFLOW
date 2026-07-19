// ============================================================
//  CutFlow — Discord Adapter
//  Bidirectional: receive videos + slash commands from users,
//  send back rendered output directly in DMs or channel.
//  Uses discord.js v14 with full slash command registration.
// ============================================================

import {
  Client, GatewayIntentBits, Partials, Events,
  REST, Routes, SlashCommandBuilder,
  AttachmentBuilder, EmbedBuilder,
  Collection, ChatInputCommandInteraction,
  Message, MessagePayload,
} from 'discord.js';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import type { MessagingAdapter, AdapterConfig, InboundMessage, MediaAttachment } from '../hub';
import messagingHub from '../hub';

export class DiscordAdapter implements MessagingAdapter {
  platform      = 'discord' as const;
  name          = 'Discord';
  description   = 'Bot commands and DMs — slash commands, file attachments, direct messages';
  icon          = '💬';
  supportsVideo = true;
  supportsAudio = true;
  maxFileSizeMB = 25;           // Discord Nitro raises this; free = 25 MB

  private client!: Client;
  private token   = '';
  private appId   = '';
  private connected = false;

  async init(config: AdapterConfig): Promise<void> {
    this.token = config.credentials.DISCORD_TOKEN || '';
    this.appId = config.credentials.DISCORD_APP_ID || '';

    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
      ],
      partials: [Partials.Channel, Partials.Message],
    });

    await this.registerSlashCommands();
  }

  async start(): Promise<void> {
    this.client.on(Events.ClientReady, () => {
      this.connected = true;
      console.log(`[Discord] Logged in as ${this.client.user?.tag}`);
    });

    // ── Handle slash commands ──────────────────────────────────
    this.client.on(Events.InteractionCreate, async (interaction) => {
      if (!interaction.isChatInputCommand()) return;
      await this.handleSlashCommand(interaction);
    });

    // ── Handle regular messages (DMs + mentions) ───────────────
    this.client.on(Events.MessageCreate, async (message: Message) => {
      if (message.author.bot) return;

      const isDM       = message.channel.type === 1; // DM channel
      const isMentioned = message.mentions.has(this.client.user!);
      if (!isDM && !isMentioned) return;

      const attachments: MediaAttachment[] = [];

      for (const [, att] of message.attachments) {
        const type = att.contentType?.startsWith('video') ? 'video'
          : att.contentType?.startsWith('audio') ? 'audio'
          : att.contentType?.startsWith('image') ? 'image'
          : 'document';
        attachments.push({
          type,
          url:      att.url,
          filename: att.name ?? 'attachment',
          mimeType: att.contentType ?? 'application/octet-stream',
          size:     att.size,
        });
      }

      const inbound: InboundMessage = {
        platform:    'discord',
        platformId:  message.author.id,
        messageId:   message.id,
        text:        message.content.replace(`<@${this.client.user!.id}>`, '').trim(),
        attachments,
        timestamp:   message.createdAt,
        raw:         message,
      };

      // React to acknowledge
      await message.react('⏳').catch(() => {});
      await messagingHub.processInbound(inbound);
      await message.reactions.cache.get('⏳')?.users.remove(this.client.user!.id).catch(() => {});
      await message.react('✅').catch(() => {});
    });

    await this.client.login(this.token);
  }

  async stop(): Promise<void> {
    await this.client.destroy();
    this.connected = false;
  }

  isConnected(): boolean { return this.connected; }

  // ── Slash command handler ──────────────────────────────────

  private async handleSlashCommand(i: ChatInputCommandInteraction): Promise<void> {
    const userId = i.user.id;
    await i.deferReply();

    switch (i.commandName) {
      case 'help':
        await i.editReply({ embeds: [this.helpEmbed()] });
        break;

      case 'status':
        messagingHub.emit('status-requested', { platform: 'discord', platformId: userId });
        await i.editReply('📋 Fetching your project status...');
        break;

      case 'projects':
        messagingHub.emit('projects-requested', { platform: 'discord', platformId: userId });
        await i.editReply('📁 Fetching your projects...');
        break;

      case 'script': {
        const prompt = i.options.getString('prompt', true);
        messagingHub.emit('script-requested', { platform: 'discord', platformId: userId, prompt });
        await i.editReply(`✍️ Generating script for: *${prompt}*`);
        break;
      }

      case 'voiceover': {
        const text = i.options.getString('text', true);
        messagingHub.emit('voiceover-requested', { platform: 'discord', platformId: userId, text });
        await i.editReply('🎙️ Generating voiceover...');
        break;
      }

      case 'edit': {
        const name = i.options.getString('name') || `edit_${Date.now()}`;
        messagingHub.emit('edit-requested', { platform: 'discord', platformId: userId, projectName: name });
        await i.editReply(`🎬 Starting edit project: *${name}*`);
        break;
      }

      case 'queue':
        messagingHub.emit('queue-requested', { platform: 'discord', platformId: userId });
        await i.editReply('📋 Fetching queue...');
        break;

      default:
        await i.editReply('❓ Unknown command. Try `/help`');
    }
  }

  // ── Send methods ──────────────────────────────────────────

  async sendText(platformId: string, text: string): Promise<boolean> {
    try {
      const user    = await this.client.users.fetch(platformId);
      const channel = await user.createDM();
      await channel.send(text);
      return true;
    } catch (err) {
      console.error('[Discord] sendText failed:', err);
      return false;
    }
  }

  async sendVideo(platformId: string, videoPath: string, caption?: string): Promise<boolean> {
    try {
      const user    = await this.client.users.fetch(platformId);
      const channel = await user.createDM();
      const sizeMB  = fs.statSync(videoPath).size / (1024 * 1024);

      if (sizeMB <= this.maxFileSizeMB) {
        const att = new AttachmentBuilder(videoPath, {
          name:        path.basename(videoPath),
          description: caption || 'CutFlow render',
        });
        await channel.send({ content: caption || '🎬 Your CutFlow render is ready!', files: [att] });
      } else {
        // Large file — send embed with download link
        const link = `https://files.cutflow.dev/${path.basename(videoPath)}`;
        const embed = new EmbedBuilder()
          .setTitle('🎬 CutFlow Render Ready')
          .setDescription(caption || 'Your video is ready to download.')
          .addFields({ name: 'Download', value: link })
          .addFields({ name: 'File Size', value: `${sizeMB.toFixed(1)} MB` })
          .setColor(0x4FD97D)
          .setFooter({ text: 'CutFlow by TLG3D' });
        await channel.send({ embeds: [embed] });
      }
      return true;
    } catch (err) {
      console.error('[Discord] sendVideo failed:', err);
      return false;
    }
  }

  async sendAudio(platformId: string, audioPath: string, caption?: string): Promise<boolean> {
    try {
      const user    = await this.client.users.fetch(platformId);
      const channel = await user.createDM();
      const att = new AttachmentBuilder(audioPath, { name: path.basename(audioPath) });
      await channel.send({ content: caption || '🎙️ Your voiceover is ready!', files: [att] });
      return true;
    } catch (err) {
      console.error('[Discord] sendAudio failed:', err);
      return false;
    }
  }

  async sendImage(platformId: string, imagePath: string, caption?: string): Promise<boolean> {
    try {
      const user    = await this.client.users.fetch(platformId);
      const channel = await user.createDM();
      const att = new AttachmentBuilder(imagePath, { name: path.basename(imagePath) });
      await channel.send({ content: caption, files: [att] });
      return true;
    } catch (err) {
      console.error('[Discord] sendImage failed:', err);
      return false;
    }
  }

  async downloadMedia(att: MediaAttachment, destPath: string): Promise<string> {
    const response = await axios.get(att.url, { responseType: 'arraybuffer' });
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.writeFileSync(destPath, Buffer.from(response.data));
    return destPath;
  }

  // ── Slash command registration ─────────────────────────────

  private async registerSlashCommands(): Promise<void> {
    const commands = [
      new SlashCommandBuilder().setName('help').setDescription('Show CutFlow commands'),
      new SlashCommandBuilder().setName('status').setDescription('Check your project status'),
      new SlashCommandBuilder().setName('projects').setDescription('List your projects'),
      new SlashCommandBuilder().setName('queue').setDescription('View processing queue'),
      new SlashCommandBuilder()
        .setName('script')
        .setDescription('Generate a video script')
        .addStringOption(o => o.setName('prompt').setDescription('Script prompt').setRequired(true)),
      new SlashCommandBuilder()
        .setName('voiceover')
        .setDescription('Generate voiceover audio')
        .addStringOption(o => o.setName('text').setDescription('Text to speak').setRequired(true)),
      new SlashCommandBuilder()
        .setName('edit')
        .setDescription('Start a video editing project')
        .addStringOption(o => o.setName('name').setDescription('Project name').setRequired(false)),
    ].map(cmd => cmd.toJSON());

    if (!this.appId || !this.token) return;
    const rest = new REST({ version: '10' }).setToken(this.token);
    await rest.put(Routes.applicationCommands(this.appId), { body: commands });
    console.log('[Discord] Slash commands registered');
  }

  private helpEmbed(): EmbedBuilder {
    return new EmbedBuilder()
      .setTitle('🎬 CutFlow — Command Reference')
      .setColor(0x4FD97D)
      .setDescription('AI-powered video editing by TLG3D')
      .addFields(
        { name: '/help',              value: 'Show this menu', inline: true },
        { name: '/status',            value: 'Check project status', inline: true },
        { name: '/projects',          value: 'List your projects', inline: true },
        { name: '/queue',             value: 'View processing queue', inline: true },
        { name: '/script <prompt>',   value: 'Generate a video script', inline: false },
        { name: '/voiceover <text>',  value: 'Generate voiceover audio', inline: false },
        { name: '/edit [name]',       value: 'Start an edit project', inline: false },
        { name: 'Send a video file',  value: 'Drop a video in chat — it will be queued automatically', inline: false },
      )
      .setFooter({ text: 'CutFlow by The Looking Glass 3D' });
  }
}
