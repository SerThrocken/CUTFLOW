// ============================================================
//  CutFlow — Messaging Service Bootstrap
//  Loads env, registers every adapter, starts the hub,
//  and mounts webhook routes onto the shared Express server.
// ============================================================

import express from 'express';
import dotenv  from 'dotenv';
dotenv.config();

import messagingHub, { type AdapterConfig } from './hub';

// ── Adapters ──────────────────────────────────────────────────
import { DiscordAdapter }                                from './adapters/discord.adapter';
import { TelegramAdapter }                               from './adapters/telegram.adapter';
import { WhatsAppAdapter }                               from './adapters/whatsapp.adapter';
import { NativeSmsAdapter }                              from './adapters/sms-native.adapter';
import { IMessageAdapter }                               from './adapters/imessage.adapter';
import { SlackAdapter }                                  from './adapters/slack.adapter';
import { SignalAdapter }                                  from './adapters/signal.adapter';
import { EmailAdapter }                                  from './adapters/email.adapter';
import { InstagramAdapter, MessengerAdapter, TwitterAdapter }
                                                         from './adapters/social-dm.adapters';
import { LineAdapter, ViberAdapter, WeChatAdapter }      from './adapters/line-viber-wechat.adapters';

// ── Express App ───────────────────────────────────────────────

const app  = express();
const PORT = parseInt(process.env.MESSAGING_PORT || '3003', 10);

app.use(express.json());

// ── Build adapter configs from environment ─────────────────

function buildConfigs(): AdapterConfig[] {
  return [
    {
      platform: 'discord',
      enabled:  !!process.env.DISCORD_TOKEN,
      credentials: {
        DISCORD_TOKEN:  process.env.DISCORD_TOKEN  || '',
        DISCORD_APP_ID: process.env.DISCORD_APP_ID || '',
      },
    },
    {
      platform: 'telegram',
      enabled:  !!process.env.TELEGRAM_TOKEN,
      credentials: {
        TELEGRAM_TOKEN: process.env.TELEGRAM_TOKEN || '',
      },
    },
    {
      platform: 'whatsapp',
      enabled:  !!process.env.WHATSAPP_ACCESS_TOKEN,
      credentials: {
        WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
        WHATSAPP_ACCESS_TOKEN:    process.env.WHATSAPP_ACCESS_TOKEN    || '',
        WHATSAPP_VERIFY_TOKEN:    process.env.WHATSAPP_VERIFY_TOKEN    || 'cutflow_whatsapp_verify',
      },
    },
    {
      platform: 'sms',
      enabled:  process.env.SMS_ENABLED === 'true',
      credentials: {}, // No credentials — uses native OS
    },
    {
      platform: 'imessage',
      enabled:  process.env.IMESSAGE_ENABLED === 'true',
      credentials: {}, // No credentials — uses macOS Messages.app
    },
    {
      platform: 'slack',
      enabled:  !!process.env.SLACK_BOT_TOKEN,
      credentials: {
        SLACK_BOT_TOKEN:      process.env.SLACK_BOT_TOKEN      || '',
        SLACK_SIGNING_SECRET: process.env.SLACK_SIGNING_SECRET || '',
        SLACK_APP_TOKEN:      process.env.SLACK_APP_TOKEN      || '',
      },
    },
    {
      platform: 'signal',
      enabled:  !!process.env.SIGNAL_PHONE_NUMBER,
      credentials: {
        SIGNAL_PHONE_NUMBER: process.env.SIGNAL_PHONE_NUMBER || '',
      },
    },
    {
      platform: 'email',
      enabled:  !!process.env.EMAIL_USER,
      credentials: {
        EMAIL_USER:  process.env.EMAIL_USER  || '',
        EMAIL_PASS:  process.env.EMAIL_PASS  || '',
        SMTP_HOST:   process.env.SMTP_HOST   || '',
        SMTP_PORT:   process.env.SMTP_PORT   || '587',
        IMAP_HOST:   process.env.IMAP_HOST   || '',
        IMAP_PORT:   process.env.IMAP_PORT   || '993',
      },
    },
    {
      platform: 'instagram',
      enabled:  !!process.env.INSTAGRAM_ACCESS_TOKEN,
      credentials: {
        INSTAGRAM_ACCESS_TOKEN: process.env.INSTAGRAM_ACCESS_TOKEN || '',
        INSTAGRAM_VERIFY_TOKEN: process.env.INSTAGRAM_VERIFY_TOKEN || 'cutflow_ig_verify',
        INSTAGRAM_PAGE_ID:      process.env.INSTAGRAM_PAGE_ID      || '',
      },
    },
    {
      platform: 'messenger',
      enabled:  !!process.env.MESSENGER_PAGE_TOKEN,
      credentials: {
        MESSENGER_PAGE_TOKEN:   process.env.MESSENGER_PAGE_TOKEN   || '',
        MESSENGER_VERIFY_TOKEN: process.env.MESSENGER_VERIFY_TOKEN || 'cutflow_messenger_verify',
        MESSENGER_PAGE_ID:      process.env.MESSENGER_PAGE_ID      || '',
      },
    },
    {
      platform: 'twitter',
      enabled:  !!process.env.TWITTER_BEARER_TOKEN,
      credentials: {
        TWITTER_BEARER_TOKEN: process.env.TWITTER_BEARER_TOKEN  || '',
        TWITTER_API_KEY:      process.env.TWITTER_API_KEY       || '',
        TWITTER_API_SECRET:   process.env.TWITTER_API_SECRET    || '',
        TWITTER_ACCESS_TOKEN: process.env.TWITTER_ACCESS_TOKEN  || '',
        TWITTER_ACCESS_SECRET:process.env.TWITTER_ACCESS_SECRET || '',
        TWITTER_BOT_USER_ID:  process.env.TWITTER_BOT_USER_ID   || '',
      },
    },
    {
      platform: 'line',
      enabled:  !!process.env.LINE_ACCESS_TOKEN,
      credentials: {
        LINE_ACCESS_TOKEN:   process.env.LINE_ACCESS_TOKEN   || '',
        LINE_CHANNEL_SECRET: process.env.LINE_CHANNEL_SECRET || '',
      },
    },
    {
      platform: 'viber',
      enabled:  !!process.env.VIBER_AUTH_TOKEN,
      credentials: {
        VIBER_AUTH_TOKEN: process.env.VIBER_AUTH_TOKEN || '',
      },
    },
    {
      platform: 'wechat',
      enabled:  !!process.env.WECHAT_APP_ID,
      credentials: {
        WECHAT_APP_ID:     process.env.WECHAT_APP_ID     || '',
        WECHAT_APP_SECRET: process.env.WECHAT_APP_SECRET || '',
        WECHAT_TOKEN:      process.env.WECHAT_TOKEN      || 'cutflow_wechat',
      },
    },
  ];
}

// ── Register job delivery handlers ───────────────────────────
// When a render completes, deliver the video back to the user

messagingHub.on('render-complete', async ({ platform, platformId, videoPath, projectName }) => {
  const caption = `🎬 "${projectName}" is ready!`;
  const ok      = await messagingHub.deliverVideo(platform, platformId, videoPath, caption);
  if (!ok) {
    await messagingHub.deliverText(
      platform, platformId,
      `✅ "${projectName}" finished!\n\nDownload: https://files.cutflow.dev/${require('path').basename(videoPath)}`
    );
  }
});

messagingHub.on('voiceover-complete', async ({ platform, platformId, audioPath }) => {
  await messagingHub.deliverText(platform, platformId,
    `🎙️ Voiceover ready!\n\nDownload: https://files.cutflow.dev/${require('path').basename(audioPath)}`
  );
});

messagingHub.on('script-complete', async ({ platform, platformId, script }) => {
  await messagingHub.deliverText(platform, platformId, `📝 Your script:\n\n${script}`);
});

// ── Main boot ─────────────────────────────────────────────────

async function main() {
  console.log('🚀 CutFlow Messaging Service starting...');

  const adapters = [
    new DiscordAdapter(),
    new TelegramAdapter(),
    new WhatsAppAdapter(),
    new NativeSmsAdapter(),
    new IMessageAdapter(),
    new SlackAdapter(),
    new SignalAdapter(),
    new EmailAdapter(),
    new InstagramAdapter(),
    new MessengerAdapter(),
    new TwitterAdapter(),
    new LineAdapter(),
    new ViberAdapter(),
    new WeChatAdapter(),
  ];

  // Register all adapters
  for (const adapter of adapters) {
    messagingHub.register(adapter);
  }

  // Mount webhook routes for HTTP-based platforms
  const webhookAdapters = [
    new WhatsAppAdapter(),
    new InstagramAdapter(),
    new MessengerAdapter(),
    new LineAdapter(),
    new ViberAdapter(),
    new WeChatAdapter(),
  ] as any[];

  for (const adapter of webhookAdapters) {
    if (adapter.router) {
      app.use(adapter.router);
    }
  }

  // Health check
  app.get('/health', (_, res) =>
    res.json({
      service:    'CutFlow Messaging',
      status:     'ok',
      platforms:  messagingHub.getConnectedPlatforms(),
    })
  );

  // Platform status API
  app.get('/api/messaging/status', (_, res) => {
    res.json({ platforms: messagingHub.getConnectedPlatforms() });
  });

  // Manual send endpoint (used by the main API after a render completes)
  app.post('/api/messaging/send', async (req, res) => {
    const { platform, platformId, type, content, caption } = req.body;
    let ok = false;

    if (type === 'video') {
      ok = await messagingHub.deliverVideo(platform, platformId, content, caption);
    } else if (type === 'text') {
      ok = await messagingHub.deliverText(platform, platformId, content);
    }

    res.json({ success: ok });
  });

  // Start HTTP server
  app.listen(PORT, () => {
    console.log(`📡 Messaging service listening on port ${PORT}`);
  });

  // Start all enabled adapters
  await messagingHub.startAll(buildConfigs());

  // Summary
  const platforms = messagingHub.getConnectedPlatforms();
  const active    = platforms.filter(p => p.connected);
  console.log(`\n✅ CutFlow Messaging ready`);
  console.log(`   Active platforms (${active.length}/${platforms.length}):`);
  for (const p of platforms) {
    console.log(`   ${p.connected ? '✓' : '✗'} ${p.icon} ${p.name}`);
  }
}

main().catch(err => {
  console.error('Messaging service failed to start:', err);
  process.exit(1);
});
