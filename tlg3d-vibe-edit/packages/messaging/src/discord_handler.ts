// ===== DISCORD MESSAGE HANDLER =====

import { Client, GatewayIntentBits, Message, ChannelType } from 'discord.js';
import axios from 'axios';
import path from 'path';
import fs from 'fs';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const API_BASE = process.env.API_URL || 'http://localhost:3000';
const DATA_DIR = process.env.DATA_DIR || './data/users';

// Ensure user directory exists
function ensureUserDir(discordId: string): string {
  const userDir = path.join(DATA_DIR, `discord_${discordId}`);
  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true });
  }
  return userDir;
}

client.on('ready', () => {
  console.log(`[Discord] Logged in as ${client.user?.tag}`);
});

client.on('messageCreate', async (message: Message) => {
  try {
    // Ignore bot messages
    if (message.author.bot) return;

    const userId = message.author.id;
    const userDir = ensureUserDir(userId);

    // Handle commands
    if (message.content.startsWith('!')) {
      await handleCommand(message, userDir);
    } else {
      // Handle conversational messages
      await handleConversation(message, userDir);
    }
  } catch (error) {
    console.error('[Discord] Error:', error);
    message.reply('Sorry, something went wrong processing your message.');
  }
});

async function handleCommand(message: Message, userDir: string): Promise<void> {
  const args = message.content.slice(1).split(/ +/);
  const command = args.shift()?.toLowerCase();

  switch (command) {
    case 'edit':
      await message.reply('🎬 Starting video editing project...');
      await createProject(message.author.id, userDir);
      break;

    case 'script':
      const scriptPrompt = args.join(' ');
      await message.reply('✍️ Generating script...');
      await generateScript(scriptPrompt, message.author.id, userDir, message);
      break;

    case 'voiceover':
      const text = args.join(' ');
      await message.reply('🎙️ Generating voiceover...');
      await generateVoiceover(text, message.author.id, userDir, message);
      break;

    case 'projects':
      await listProjects(message.author.id, userDir, message);
      break;

    case 'help':
      await sendHelpMessage(message);
      break;

    default:
      await message.reply(`Unknown command: \`!${command}\`. Type \`!help\` for available commands.`);
  }
}

async function handleConversation(message: Message, userDir: string): Promise<void> {
  // Save conversation to user directory
  const conversationPath = path.join(userDir, 'conversations.json');
  let conversations = [];

  if (fs.existsSync(conversationPath)) {
    conversations = JSON.parse(fs.readFileSync(conversationPath, 'utf-8'));
  }

  conversations.push({
    timestamp: new Date().toISOString(),
    author: message.author.username,
    content: message.content,
    platform: 'discord',
  });

  fs.writeFileSync(conversationPath, JSON.stringify(conversations, null, 2));
  await message.react('✅');
}

async function createProject(userId: string, userDir: string): Promise<void> {
  const projectId = `project_${Date.now()}`;
  const projectDir = path.join(userDir, projectId);
  fs.mkdirSync(projectDir, { recursive: true });

  fs.writeFileSync(
    path.join(projectDir, 'metadata.json'),
    JSON.stringify({
      id: projectId,
      createdAt: new Date().toISOString(),
      status: 'draft',
    }, null, 2)
  );
}

async function generateScript(prompt: string, userId: string, userDir: string, message: Message): Promise<void> {
  try {
    const response = await axios.post(`${API_BASE}/api/scripts/generate`, {
      userId,
      prompt,
    });

    const scriptPath = path.join(userDir, 'generated_script.txt');
    fs.writeFileSync(scriptPath, response.data.script);

    await message.reply(`📝 Script generated:\n\`\`\`\n${response.data.script.slice(0, 500)}...\n\`\`\``);
  } catch (error) {
    console.error('Script generation error:', error);
    await message.reply('Failed to generate script.');
  }
}

async function generateVoiceover(text: string, userId: string, userDir: string, message: Message): Promise<void> {
  try {
    const response = await axios.post(`${API_BASE}/api/audio/voiceover`, {
      userId,
      text,
    });

    const voiceoverPath = path.join(userDir, `voiceover_${Date.now()}.mp3`);
    const audioBuffer = Buffer.from(response.data.audio, 'base64');
    fs.writeFileSync(voiceoverPath, audioBuffer);

    await message.reply('🎙️ Voiceover generated! Saved to your project.');
  } catch (error) {
    console.error('Voiceover generation error:', error);
    await message.reply('Failed to generate voiceover.');
  }
}

async function listProjects(userId: string, userDir: string, message: Message): Promise<void> {
  try {
    const items = fs.readdirSync(userDir);
    const projects = items.filter(item => item.startsWith('project_'));
    await message.reply(`📁 Your projects:\n${projects.join('\n') || 'No projects yet.'}`);
  } catch (error) {
    await message.reply('Failed to list projects.');
  }
}

async function sendHelpMessage(message: Message): Promise<void> {
  const helpText = `
**CutFlow — Commands**
\`!edit\` - Start a new video editing project
\`!script <prompt>\` - Generate a video script
\`!voiceover <text>\` - Generate voiceover audio
\`!projects\` - List your projects
\`!help\` - Show this help menu
  `;
  await message.reply(helpText);
}

client.login(process.env.DISCORD_TOKEN);
