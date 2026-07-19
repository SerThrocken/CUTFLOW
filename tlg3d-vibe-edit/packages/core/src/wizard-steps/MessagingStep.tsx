// ===== WIZARD STEP 3: MESSAGING PLATFORMS =====

import React, { useState } from 'react';
import { Card, Input, Button, Alert, Badge } from '@tlg3d/core/ui-components';
import type { SetupWizardState } from '@tlg3d/core/setup-wizard-types';

export const MessagingStep: React.FC<{
  state: SetupWizardState;
  setState: (fn: (s: SetupWizardState) => SetupWizardState) => void;
}> = ({ state, setState }) => {
  const [expandedPlatform, setExpandedPlatform] = useState<string | null>(null);

  const handleTogglePlatform = (platform: string) => {
    setState(prev => ({
      ...prev,
      messagingPlatforms: {
        ...prev.messagingPlatforms,
        [platform]: {
          ...prev.messagingPlatforms[platform as keyof typeof prev.messagingPlatforms],
          enabled: !prev.messagingPlatforms[platform as keyof typeof prev.messagingPlatforms].enabled,
        },
      },
    }));
  };

  const handleTokenChange = (platform: string, token: string) => {
    setState(prev => ({
      ...prev,
      messagingPlatforms: {
        ...prev.messagingPlatforms,
        [platform]: {
          ...prev.messagingPlatforms[platform as keyof typeof prev.messagingPlatforms],
          botToken: token,
        },
      },
    }));
  };

  const platforms = [
    {
      id: 'discord',
      name: 'Discord',
      icon: '💬',
      description: 'Control TLG3D via Discord bot commands',
      docsUrl: 'https://discord.dev',
      getTokenHint: 'Go to Discord Developer Portal → Applications → Bot → Copy Token',
      color: 'from-indigo-600 to-indigo-700',
    },
    {
      id: 'telegram',
      name: 'Telegram',
      icon: '✈️',
      description: 'Send editing requests via Telegram DMs',
      docsUrl: 'https://t.me/botfather',
      getTokenHint: 'Message @BotFather → /newbot → Copy the API token',
      color: 'from-blue-600 to-blue-700',
    },
    {
      id: 'slack',
      name: 'Slack',
      icon: '🔗',
      description: 'Integrate with your Slack workspace',
      docsUrl: 'https://api.slack.com',
      getTokenHint: 'Go to Slack API → Create New App → Copy Bot Token',
      color: 'from-purple-600 to-purple-700',
    },
    {
      id: 'sms',
      name: 'SMS / RCS',
      icon: '📱',
      description: 'Text-based editing via SMS or RCS (requires Twilio)',
      docsUrl: 'https://twilio.com',
      getTokenHint: 'Create Twilio account → Copy Account SID and Auth Token',
      color: 'from-green-600 to-green-700',
    },
  ];

  return (
    <div className="space-y-4">
      <p className="text-gray-300 mb-6">
        Connect at least one messaging platform to control TLG3D. You can add more later!
      </p>

      <div className="space-y-3">
        {platforms.map(platform => {
          const isEnabled = state.messagingPlatforms[platform.id as keyof typeof state.messagingPlatforms].enabled;
          const isExpanded = expandedPlatform === platform.id;

          return (
            <div key={platform.id} className="bg-gray-800 rounded-lg overflow-hidden">
              {/* Platform Header */}
              <div
                onClick={() => setExpandedPlatform(isExpanded ? null : platform.id)}
                className="p-4 cursor-pointer hover:bg-gray-700 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className={`text-2xl`}>{platform.icon}</div>
                  <div>
                    <h3 className="font-semibold text-gray-100">{platform.name}</h3>
                    <p className="text-sm text-gray-400">{platform.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {isEnabled && <Badge variant="success" size="sm">✓ Enabled</Badge>}
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      handleTogglePlatform(platform.id);
                    }}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      isEnabled
                        ? 'bg-green-600 hover:bg-green-500 text-white'
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    }`}
                  >
                    {isEnabled ? 'Enabled' : 'Enable'}
                  </button>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="border-t border-gray-700 p-4 bg-gray-900 space-y-4">
                  <div className="space-y-3">
                    <p className="text-sm text-gray-400">{platform.getTokenHint}</p>

                    <Input
                      label={`${platform.name} Token/API Key`}
                      type="password"
                      placeholder="Paste your token here"
                      value={state.messagingPlatforms[platform.id as keyof typeof state.messagingPlatforms].botToken || ''}
                      onChange={e => handleTokenChange(platform.id, e.target.value)}
                    />

                    <Button variant="outline" size="md" onClick={() => window.open(platform.docsUrl, '_blank')}>
                      📖 View Documentation
                    </Button>
                  </div>

                  <Alert type="info" icon="ℹ️" dismissible={false}>
                    <p className="text-sm">
                      Your tokens are encrypted and stored securely. Never share them publicly.
                    </p>
                  </Alert>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Alert type="warning" icon="⚠️" dismissible={false}>
        <p className="text-sm">
          <strong>Note:</strong> You can skip this now and configure messaging platforms later in Settings.
        </p>
      </Alert>
    </div>
  );
};

export default MessagingStep;
