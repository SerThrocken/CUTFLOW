// ============================================================
//  CutFlow — Native SMS / RCS Adapter
//  NO Twilio. Uses the device's native OS SMS capability:
//
//  macOS  → osascript (AppleScript) via Messages.app
//  Linux  → gammu (modem) OR ModemManager + mmcli
//  Windows→ Windows.Devices.Sms PowerShell API
//  Android→ SmsManager (via React Native TLG3DModule)
//
//  For receiving SMS we poll via gammu/mmcli on Linux,
//  listen to the macOS Messages app database on macOS,
//  or use the Android SmsReceiver broadcast.
// ============================================================

import { exec, execFile, spawn } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';
import type { MessagingAdapter, AdapterConfig, InboundMessage, MediaAttachment } from '../hub';
import messagingHub from '../hub';

const execAsync = promisify(exec);

export class NativeSmsAdapter implements MessagingAdapter {
  platform      = 'sms' as const;
  name          = 'SMS / RCS';
  description   = 'Native SMS via OS — no Twilio. macOS Messages, Linux gammu, Windows Sms API';
  icon          = '📱';
  supportsVideo = false; // Plain SMS is text only; MMS/RCS supported on some OS
  supportsAudio = false;
  maxFileSizeMB = 3;     // MMS limit

  private connected  = false;
  private pollTimer: NodeJS.Timeout | null = null;
  private osType     = os.platform(); // 'darwin' | 'linux' | 'win32'
  private lastPollId = '';

  async init(config: AdapterConfig): Promise<void> {
    // No credentials needed for native SMS — uses device's SIM
    console.log(`[SMS] Initializing native SMS on ${this.osType}`);

    if (this.osType === 'linux') {
      await this.checkGammu();
    }
  }

  async start(): Promise<void> {
    this.connected = true;
    this.startPolling();
    console.log(`[SMS] Native SMS started on ${this.osType}`);
  }

  async stop(): Promise<void> {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    this.connected = false;
  }

  isConnected(): boolean { return this.connected; }

  // ── Send ──────────────────────────────────────────────────

  async sendText(to: string, text: string): Promise<boolean> {
    try {
      switch (this.osType) {
        case 'darwin':  return this.sendViaMacOS(to, text);
        case 'linux':   return this.sendViaGammu(to, text);
        case 'win32':   return this.sendViaWindows(to, text);
        default:
          console.warn('[SMS] Unsupported OS for native SMS');
          return false;
      }
    } catch (err) {
      console.error('[SMS] sendText failed:', err);
      return false;
    }
  }

  async sendVideo(to: string, videoPath: string, caption?: string): Promise<boolean> {
    // SMS cannot carry video — send a download link
    const link = `https://files.cutflow.dev/${path.basename(videoPath)}`;
    return this.sendText(to, `${caption || 'CutFlow render ready!'}\n\nDownload: ${link}`);
  }

  async sendAudio(to: string, audioPath: string, caption?: string): Promise<boolean> {
    const link = `https://files.cutflow.dev/${path.basename(audioPath)}`;
    return this.sendText(to, `${caption || 'Your audio is ready!'}\n\nDownload: ${link}`);
  }

  async sendImage(to: string, imagePath: string, caption?: string): Promise<boolean> {
    // On macOS we can send MMS with an image via Messages
    if (this.osType === 'darwin') {
      return this.sendMacOSMMS(to, imagePath, caption || '');
    }
    const link = `https://files.cutflow.dev/${path.basename(imagePath)}`;
    return this.sendText(to, `${caption || 'Image ready!'}\n\nView: ${link}`);
  }

  // No URL-based downloads for SMS
  async downloadMedia(att: MediaAttachment, destPath: string): Promise<string> {
    return destPath;
  }

  // ── macOS: AppleScript via Messages.app ──────────────────

  private async sendViaMacOS(to: string, text: string): Promise<boolean> {
    // Escape single quotes in text
    const safe = text.replace(/'/g, "\\'");
    const script = `
      tell application "Messages"
        set targetBuddy to a reference to buddy "${to}" of (service 1 whose service type is SMS)
        send "${safe}" to targetBuddy
      end tell
    `;
    try {
      await execAsync(`osascript -e '${script}'`);
      return true;
    } catch {
      // Fallback: use iMessage service
      const scriptFallback = `
        tell application "Messages"
          send "${safe}" to buddy "${to}" of service "SMS"
        end tell
      `;
      await execAsync(`osascript -e '${scriptFallback}'`);
      return true;
    }
  }

  private async sendMacOSMMS(to: string, filePath: string, caption: string): Promise<boolean> {
    const safe    = caption.replace(/'/g, "\\'");
    const safePath = filePath.replace(/'/g, "\\'");
    const script  = `
      tell application "Messages"
        set theFile to POSIX file "${safePath}"
        set targetBuddy to buddy "${to}" of service "SMS"
        send theFile to targetBuddy
        if "${safe}" is not "" then
          send "${safe}" to targetBuddy
        end if
      end tell
    `;
    try {
      await execAsync(`osascript -e '${script}'`);
      return true;
    } catch (err) {
      console.error('[SMS macOS] MMS send failed:', err);
      return false;
    }
  }

  // ── Linux: gammu (requires USB/Bluetooth modem or SIM card) ──

  private async checkGammu(): Promise<void> {
    try {
      await execAsync('which gammu');
      console.log('[SMS Linux] gammu found');
    } catch {
      console.warn('[SMS Linux] gammu not found. Install: sudo apt install gammu');
      console.warn('[SMS Linux] Falling back to mmcli (ModemManager) if available');
    }
  }

  private async sendViaGammu(to: string, text: string): Promise<boolean> {
    try {
      // Write text to temp file to avoid shell escaping issues
      const tmpFile = path.join(os.tmpdir(), `sms_${Date.now()}.txt`);
      fs.writeFileSync(tmpFile, text);
      await execAsync(`gammu sendsms TEXT "${to}" -text "$(cat ${tmpFile})"`)
        .finally(() => fs.unlinkSync(tmpFile));
      return true;
    } catch {
      // Try mmcli (ModemManager)
      return this.sendViaMmcli(to, text);
    }
  }

  private async sendViaMmcli(to: string, text: string): Promise<boolean> {
    try {
      // Get modem index
      const { stdout } = await execAsync('mmcli -L');
      const match = stdout.match(/\/org\/freedesktop\/ModemManager1\/Modem\/(\d+)/);
      if (!match) throw new Error('No modem found');

      const modemIdx = match[1];
      await execAsync(`mmcli -m ${modemIdx} --messaging-create-sms="number='${to}',text='${text.replace(/'/g, '')}'"`);

      // Find created SMS index and send
      const { stdout: smsOut } = await execAsync(`mmcli -m ${modemIdx} --messaging-list-sms`);
      const smsMatch = smsOut.match(/\/SMS\/(\d+)/g);
      if (smsMatch?.length) {
        const smsIdx = smsMatch[smsMatch.length - 1].match(/\d+/)![0];
        await execAsync(`mmcli -s ${smsIdx} --send`);
      }
      return true;
    } catch (err) {
      console.error('[SMS Linux] mmcli send failed:', err);
      return false;
    }
  }

  // ── Windows: Windows.Devices.Sms via PowerShell ──────────

  private async sendViaWindows(to: string, text: string): Promise<boolean> {
    // Windows 10/11 only — requires a phone link / cellular adapter
    const psScript = `
      Add-Type -AssemblyName Windows.Devices.Sms
      $smsDevice = [Windows.Devices.Sms.SmsDevice]::GetDefault()
      $message = $smsDevice.CreateBinaryMessage()
      $smsManager = [Windows.Devices.Sms.SmsSendMessageResult]
      $msg = New-Object Windows.Devices.Sms.SmsTextMessage
      $msg.To = "${to}"
      $msg.Body = "${text.replace(/"/g, '`"')}"
      $smsDevice.SendMessageAsync($msg).AsTask().Wait()
    `.trim();

    try {
      const tmpPs = path.join(os.tmpdir(), `sms_${Date.now()}.ps1`);
      fs.writeFileSync(tmpPs, psScript);
      await execAsync(`powershell -ExecutionPolicy Bypass -File "${tmpPs}"`)
        .finally(() => fs.unlinkSync(tmpPs));
      return true;
    } catch (err) {
      console.error('[SMS Windows] PowerShell SMS failed:', err);
      return false;
    }
  }

  // ── Polling for incoming SMS ──────────────────────────────

  private startPolling(): void {
    const interval = 15_000; // Poll every 15 seconds

    this.pollTimer = setInterval(async () => {
      try {
        switch (this.osType) {
          case 'darwin':  await this.pollMacOSMessages(); break;
          case 'linux':   await this.pollGammuInbox();    break;
          // Windows polling requires event subscription — not implemented here
        }
      } catch (err) {
        console.error('[SMS] Poll error:', err);
      }
    }, interval);
  }

  // macOS: Read from Messages.app chat.db
  private async pollMacOSMessages(): Promise<void> {
    const dbPath = path.join(
      os.homedir(),
      'Library', 'Messages', 'chat.db'
    );
    if (!fs.existsSync(dbPath)) return;

    // Query unread SMS messages using sqlite3
    try {
      const query = `
        SELECT m.rowid, m.text, h.id AS sender, m.date
        FROM message m
        JOIN handle h ON m.handle_id = h.rowid
        WHERE m.is_from_me = 0
          AND m.service = 'SMS'
          AND m.rowid > '${this.lastPollId || 0}'
        ORDER BY m.rowid ASC
        LIMIT 20;
      `.replace(/\n/g, ' ');

      const { stdout } = await execAsync(
        `sqlite3 -separator '|' "${dbPath}" "${query}"`
      );

      for (const line of stdout.trim().split('\n').filter(Boolean)) {
        const [rowid, text, sender] = line.split('|');
        if (!rowid || !text || !sender) continue;
        this.lastPollId = rowid;

        const inbound: InboundMessage = {
          platform:   'sms',
          platformId: sender,
          messageId:  `sms_${rowid}`,
          text:       text.trim(),
          attachments: [],
          timestamp:  new Date(),
          raw:        { rowid, text, sender },
        };

        await messagingHub.processInbound(inbound);
      }
    } catch {
      // sqlite3 may not be installed or db may be locked
    }
  }

  // Linux: gammu inbox
  private async pollGammuInbox(): Promise<void> {
    try {
      const { stdout } = await execAsync('gammu getallsms');
      // Parse gammu SMS format
      const messages = this.parseGammuOutput(stdout);
      for (const msg of messages) {
        const inbound: InboundMessage = {
          platform:    'sms',
          platformId:  msg.from,
          messageId:   msg.id,
          text:        msg.text,
          attachments: [],
          timestamp:   new Date(msg.date),
          raw:         msg,
        };
        await messagingHub.processInbound(inbound);
      }
    } catch {}
  }

  private parseGammuOutput(raw: string): any[] {
    const messages: any[] = [];
    const blocks = raw.split('\n\n').filter(b => b.includes('Number'));
    for (const block of blocks) {
      const from  = block.match(/Number\s*:\s*(.+)/)?.[1]?.trim() || '';
      const text  = block.match(/Text\s*:\s*(.+)/)?.[1]?.trim()   || '';
      const date  = block.match(/Date\s*:\s*(.+)/)?.[1]?.trim()   || '';
      const id    = `gammu_${Date.now()}_${Math.random()}`;
      if (from && text) messages.push({ from, text, date, id });
    }
    return messages;
  }
}
