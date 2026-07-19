// ===== WIZARD STEP 6: EDITING PREFERENCES =====

import React from 'react';
import { Card, Badge } from '@tlg3d/core/ui-components';
import type { SetupWizardState } from '@tlg3d/core/setup-wizard-types';

export const EditingPreferencesStep: React.FC<{
  state: SetupWizardState;
  setState: (fn: (s: SetupWizardState) => SetupWizardState) => void;
}> = ({ state, setState }) => {
  const resolutions = [
    { id: '720p', name: '720p', label: 'HD', aspect: '1280x720' },
    { id: '1080p', name: '1080p', label: 'Full HD', aspect: '1920x1080' },
    { id: '1440p', name: '1440p', label: '2K', aspect: '2560x1440' },
    { id: '4k', name: '4K', label: 'Ultra HD', aspect: '3840x2160' },
  ];

  const framerates = [24, 30, 60];

  return (
    <div className="space-y-8">
      {/* Resolution */}
      <div>
        <h3 className="text-lg font-semibold text-gray-100 mb-4">Default Video Resolution</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {resolutions.map(res => (
            <button
              key={res.id}
              onClick={() =>
                setState(prev => ({
                  ...prev,
                  editingPreferences: {
                    ...prev.editingPreferences,
                    defaultResolution: res.id as any,
                  },
                }))
              }
              className={`p-4 rounded-lg border-2 transition-all text-center ${
                state.editingPreferences.defaultResolution === res.id
                  ? 'border-green-600 bg-gray-800'
                  : 'border-gray-700 bg-gray-900 hover:border-gray-600'
              }`}
            >
              <p className="font-bold text-lg text-gray-100">{res.name}</p>
              <p className="text-xs text-gray-500 mt-1">{res.label}</p>
              <p className="text-xs text-gray-600 mt-1">{res.aspect}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Frame Rate */}
      <div>
        <h3 className="text-lg font-semibold text-gray-100 mb-4">Default Frame Rate</h3>
        <div className="grid grid-cols-3 gap-3">
          {framerates.map(fps => (
            <button
              key={fps}
              onClick={() =>
                setState(prev => ({
                  ...prev,
                  editingPreferences: { ...prev.editingPreferences, defaultFramerate: fps as any },
                }))
              }
              className={`p-4 rounded-lg border-2 transition-all text-center ${
                state.editingPreferences.defaultFramerate === fps
                  ? 'border-green-600 bg-gray-800'
                  : 'border-gray-700 bg-gray-900 hover:border-gray-600'
              }`}
            >
              <p className="font-bold text-xl text-gray-100">{fps}</p>
              <p className="text-sm text-gray-500 mt-1">FPS</p>
            </button>
          ))}
        </div>
      </div>

      {/* Auto Features */}
      <div>
        <h3 className="text-lg font-semibold text-gray-100 mb-4">Automatic Features</h3>
        <div className="space-y-3">
          {[
            {
              key: 'autoSceneDetection',
              name: 'Auto Scene Detection',
              description: 'Automatically detect scene changes in videos',
            },
            {
              key: 'autoColorGrade',
              name: 'Auto Color Correction',
              description: 'Apply color grading automatically',
            },
            {
              key: 'enableSubtitles',
              name: 'Auto Subtitles',
              description: 'Generate subtitles automatically',
            },
          ].map(feature => (
            <label
              key={feature.key}
              className="flex items-center p-4 rounded-lg bg-gray-800 cursor-pointer hover:bg-gray-700 transition-colors"
            >
              <input
                type="checkbox"
                checked={(state.editingPreferences[feature.key as keyof typeof state.editingPreferences] as boolean) || false}
                onChange={e =>
                  setState(prev => ({
                    ...prev,
                    editingPreferences: {
                      ...prev.editingPreferences,
                      [feature.key]: e.target.checked,
                    },
                  }))
                }
                className="w-5 h-5"
              />
              <div className="ml-3 flex-1">
                <p className="font-semibold text-gray-100">{feature.name}</p>
                <p className="text-sm text-gray-400">{feature.description}</p>
              </div>
              {(state.editingPreferences[feature.key as keyof typeof state.editingPreferences] as boolean) && (
                <Badge variant="success" size="sm">
                  Enabled
                </Badge>
              )}
            </label>
          ))}
        </div>
      </div>

      {/* Summary */}
      <Card>
        <h4 className="font-semibold text-gray-100 mb-3">📋 Summary</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Resolution:</span>
            <span className="text-green-400 font-medium">{state.editingPreferences.defaultResolution}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Frame Rate:</span>
            <span className="text-green-400 font-medium">{state.editingPreferences.defaultFramerate} FPS</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Auto Features:</span>
            <span className="text-green-400 font-medium">
              {[state.editingPreferences.autoSceneDetection, state.editingPreferences.autoColorGrade, state.editingPreferences.enableSubtitles].filter(Boolean).length} / 3
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default EditingPreferencesStep;
