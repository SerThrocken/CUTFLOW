// ===== WIZARD STEP 1: WELCOME =====

import React from 'react';
import { Button, Card, Input } from '@tlg3d/core/ui-components';
import type { SetupWizardState, SystemInfo } from '@tlg3d/core/setup-wizard-types';

export const WelcomeStep: React.FC<{
  state: SetupWizardState;
  setState: (fn: (s: SetupWizardState) => SetupWizardState) => void;
  systemInfo: SystemInfo | null;
}> = ({ state, setState }) => {
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState(prev => ({
      ...prev,
      userInfo: { ...prev.userInfo, username: e.target.value },
    }));
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState(prev => ({
      ...prev,
      userInfo: { ...prev.userInfo, email: e.target.value },
    }));
  };

  const handleDisplayNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState(prev => ({
      ...prev,
      userInfo: { ...prev.userInfo, displayName: e.target.value },
    }));
  };

  return (
    <div className="space-y-6">
      <p className="text-lg text-gray-300 leading-relaxed">
        Welcome to <span className="font-bold text-green-400">CutFlow</span> — The next generation of AI-powered
        video editing. This setup wizard will help you configure everything in just a few minutes.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-8">
        <Card>
          <div className="text-2xl mb-2">🎬</div>
          <p className="font-semibold text-gray-100 mb-1">AI Video Editing</p>
          <p className="text-sm text-gray-400">Generate scripts, effects, and edits automatically</p>
        </Card>

        <Card>
          <div className="text-2xl mb-2">💬</div>
          <p className="font-semibold text-gray-100 mb-1">Multi-Platform</p>
          <p className="text-sm text-gray-400">Control via Discord, Telegram, Slack, or SMS</p>
        </Card>

        <Card>
          <div className="text-2xl mb-2">🖥️</div>
          <p className="font-semibold text-gray-100 mb-1">Offline Ready</p>
          <p className="text-sm text-gray-400">Run models locally or use cloud AI providers</p>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-100">Let's get to know you</h3>

        <Input
          label="Username"
          type="text"
          placeholder="serthrocken"
          value={state.userInfo.username}
          onChange={handleUsernameChange}
          icon="👤"
        />

        <Input
          label="Display Name (Optional)"
          type="text"
          placeholder="Your full name"
          value={state.userInfo.displayName || ''}
          onChange={handleDisplayNameChange}
          icon="✏️"
        />

        <Input
          label="Email (Optional)"
          type="email"
          placeholder="contact@cutflow.dev"
          value={state.userInfo.email || ''}
          onChange={handleEmailChange}
          icon="📧"
        />
      </div>

      <div className="bg-green-900 bg-opacity-30 border border-green-700 rounded-lg p-4">
        <p className="text-sm text-green-300">
          ✨ <strong>Tip:</strong> You can customize everything in Settings after setup is complete.
        </p>
      </div>
    </div>
  );
};

export default WelcomeStep;
