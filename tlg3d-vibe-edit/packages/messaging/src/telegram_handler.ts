// ===== TELEGRAM MESSAGE HANDLER =====

import { Telegraf, Context } from 'telegraf';
import axios from 'axios';
import path from 'path';
import fs from 'fs';

const bot = new Telegraf(process.env.TELEGRAM_TOKEN || '');
const API_BASE = process.env.API_URL || 'http://localhost:3000';
const DATA_DIR = process.env.DATA_DIR || './data/users';

function ensureUserDir(telegramId: string): string {
  const userDir = path.join(DATA_DIR, `telegram_${telegramId}`);
  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true });
  }
  return userDir;
}

// Start command
bot.start((ctx: Context) => {
  const userDir = ensureUserDir(ctx.from?.id.toString() || '');
  ctx.reply('🎬 Welcome to CutFlow!\n\nCommands:\n/edit - Start editing\n/script <text> - Generate script\n/voiceover <text> - Generate voiceover\n/help - Show help');
});

// Script generation
bot.command('script', async (ctx: Context) => {
  const userId = ctx.from?.id.toString() || '';
  const userDir = ensureUserDir(userId);
  const prompt = ctx.message?.text?.replace('/script ', '') || '';

  if (!prompt) {
    return ctx.reply('Usage: /script <prompt>');
  }

  try {
    ctx.reply('✍️ Generating script...');
    const response = await axios.post(`${API_BASE}/api/scripts/generate`, {
      userId,
      prompt,
    });

    const scriptPath = path.join(userDir, 'generated_script.txt');
    fs.writeFileSync(scriptPath, response.data.script);

    ctx.reply(`📝 Script:\n\n${response.data.script.slice(0, 1000)}`);
  } catch (error) {
    ctx.reply('❌ Failed to generate script.');
  }
});

// Voiceover generation
bot.command('voiceover', async (ctx: Context) => {
  const userId = ctx.from?.id.toString() || '';
  const userDir = ensureUserDir(userId);
  const text = ctx.message?.text?.replace('/voiceover ', '') || '';

  if (!text) {
    return ctx.reply('Usage: /voiceover <text>');
  }

  try {
    ctx.reply('🎙️ Generating voiceover...');
    const response = await axios.post(`${API_BASE}/api/audio/voiceover`, {
      userId,
      text,
    });

    const voiceoverPath = path.join(userDir, `voiceover_${Date.now()}.mp3`);
    const audioBuffer = Buffer.from(response.data.audio, 'base64');
    fs.writeFileSync(voiceoverPath, audioBuffer);

    ctx.replyWithAudio({ source: voiceoverPath });
  } catch (error) {
    ctx.reply('❌ Failed to generate voiceover.');
  }
});

// Help command
bot.help((ctx: Context) => {
  ctx.reply(`
**CutFlow**

/script <prompt> - Generate video script
/voiceover <text> - Generate voiceover
/edit - Start editing project
/projects - List your projects
  `);
});

// Generic message handler
bot.on('message', async (ctx: Context) => {
  const userId = ctx.from?.id.toString() || '';
  const userDir = ensureUserDir(userId);

  // Save conversation
  const conversationPath = path.join(userDir, 'conversations.json');
  let conversations = [];

  if (fs.existsSync(conversationPath)) {
    conversations = JSON.parse(fs.readFileSync(conversationPath, 'utf-8'));
  }

  conversations.push({
    timestamp: new Date().toISOString(),
    author: ctx.from?.username || 'Unknown',
    content: (ctx.message as any)?.text || '[media]',
    platform: 'telegram',
  });

  fs.writeFileSync(conversationPath, JSON.stringify(conversations, null, 2));
  ctx.react('👍');
});

bot.launch();
console.log('[Telegram] Bot started');

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
