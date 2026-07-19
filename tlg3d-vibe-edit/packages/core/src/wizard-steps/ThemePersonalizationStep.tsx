// ===== WIZARD STEP 8: THEME & FINALIZATION =====

import React from 'react';
import { Card, Badge, Button, Alert } from '@tlg3d/core/ui-components';
import type { SetupWizardState } from '@tlg3d/core/setup-wizard-types';

export const ThemePersonalizationStep: React.FC<{
  state: SetupWizardState;
  setState: (fn: (s: SetupWizardState) => SetupWizardState) => void;
}> = ({ state, setState }) => {
  const themes = [
    {
      id: 'tlg3d-default',
      name: 'TLG3D Dark (Default)',
      description: 'Professional dark theme with muted green/gold accents',
      preview: 'bg-gradient-to-br from-gray-900 to-gray-950',
      colors: ['#4FD97D', '#D4A574', '#1A1A1A'],
    },
    {
      id: 'tlg3d-light',
      name: 'Light Mode',
      description: 'Bright theme for daytime use',
      preview: 'bg-gradient-to-br from-gray-100 to-gray-200',
      colors: ['#4FD97D', '#D4A574', '#FFFFFF'],
    },
    {
      id: 'tlg3d-neon',
      name: 'Neon Vibrant',
      description: 'Dark with punchy neon green/gold',
      preview: 'bg-gradient-to-br from-gray-950 via-black to-gray-900',
      colors: ['#00FF00', '#FFD700', '#000000'],
    },
  ];

  const handleThemeChange = (themeId: string) => {
    setState(prev => ({
      ...prev,
      themePreferences: { ...prev.themePreferences, theme: themeId as any },
    }));
  };

  const configSummary = [
    { label: 'Username', value: state.userInfo.username },
    { label: 'Primary Provider', value: state.llmConfig.primaryProvider },
    {
      label: 'Enabled Agents',
      value: `${Object.values(state.agenticFeatures).filter(Boolean).length} / 8`,
    },
    { label: 'Theme', value: state.themePreferences.theme },
    { label: 'Resolution', value: state.editingPreferences.defaultResolution },
  ];

  return (
    <div className="space-y-8">
      {/* Theme Selection */}
      <div>
        <h3 className="text-lg font-semibold text-gray-100 mb-4">Choose Your Theme</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {themes.map(theme => (
            <button
              key={theme.id}
              onClick={() => handleThemeChange(theme.id)}
              className={`rounded-lg overflow-hidden border-2 transition-all ${
                state.themePreferences.theme === theme.id
                  ? 'border-green-600 ring-2 ring-green-600 ring-offset-2 ring-offset-gray-900'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              {/* Theme Preview */}
              <div className={`h-32 ${theme.preview} flex items-end justify-around px-3 pb-3`}>
                {theme.colors.map((color, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border border-white border-opacity-30"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>

              {/* Theme Info */}
              <div className="p-4 bg-gray-800">
                <h4 className="font-semibold text-gray-100 text-sm">{theme.name}</h4>
                <p className="text-xs text-gray-400 mt-1">{theme.description}</p>
                {state.themePreferences.theme === theme.id && (
                  <Badge variant="success" size="sm" className="mt-2">
                    ✓ Selected
                  </Badge>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Configuration Summary */}
      <div>
        <h3 className="text-lg font-semibold text-gray-100 mb-4">Configuration Summary</h3>
        <Card>
          <div className="space-y-3">
            {configSummary.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-800 rounded">
                <span className="text-gray-400">{item.label}</span>
                <span className="text-green-400 font-semibold">{item.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* What's Next */}
      <div>
        <h3 className="text-lg font-semibold text-gray-100 mb-4">🚀 What's Next?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <div className="text-2xl mb-2">💬</div>
            <p className="font-semibold text-gray-100 mb-1">Connect Messaging</p>
            <p className="text-sm text-gray-400">Start sending commands via Discord, Telegram, or Slack</p>
          </Card>

          <Card>
            <div className="text-2xl mb-2">📥</div>
            <p className="font-semibold text-gray-100 mb-1">Download Models</p>
            <p className="text-sm text-gray-400">Go to Settings → Local Models to download your first AI model</p>
          </Card>

          <Card>
            <div className="text-2xl mb-2">📹</div>
            <p className="font-semibold text-gray-100 mb-1">Upload Your First Video</p>
            <p className="text-sm text-gray-400">Try editing a video with TLG3D's AI tools</p>
          </Card>

          <Card>
            <div className="text-2xl mb-2">📖</div>
            <p className="font-semibold text-gray-100 mb-1">Read the Docs</p>
            <p className="text-sm text-gray-400">Check out tutorials and advanced features in the Help section</p>
          </Card>
        </div>
      </div>

      {/* Final Notes */}
      <Alert type="success" icon="✓" dismissible={false}>
        <p className="font-medium mb-1">All set! 🎉</p>
        <p className="text-sm">
          Your TLG3D setup is complete. Click "Complete Setup" to start using the application. You can customize
          everything later in Settings.
        </p>
      </Alert>

      {/* Terms & Privacy */}
      <div className="text-center text-sm text-gray-500">
        <p>
          By completing setup, you agree to our{' '}
          <button className="text-green-400 hover:underline">Terms of Service</button> and{' '}
          <button className="text-green-400 hover:underline">Privacy Policy</button>
        </p>
      </div>
    </div>
  );
};

export default ThemePersonalizationStep;
