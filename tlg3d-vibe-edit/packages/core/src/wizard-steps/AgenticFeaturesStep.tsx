// ===== WIZARD STEP 7: AGENTIC FEATURES =====

import React from 'react';
import { Card, Badge, Alert } from '@tlg3d/core/ui-components';
import type { SetupWizardState } from '@tlg3d/core/setup-wizard-types';

export const AgenticFeaturesStep: React.FC<{
  state: SetupWizardState;
  setState: (fn: (s: SetupWizardState) => SetupWizardState) => void;
}> = ({ state, setState }) => {
  const agentSkills = [
    {
      key: 'scriptGeneration',
      icon: '📝',
      name: 'Script Generation',
      description: 'Generate video scripts from prompts',
      examples: 'Product demos, promos, tutorials',
      advanced: false,
    },
    {
      key: 'voiceoverSynthesis',
      icon: '🎙️',
      name: 'Voiceover Synthesis',
      description: 'Synthesize natural-sounding voiceovers',
      examples: 'Narration, ambient dialogue',
      advanced: false,
    },
    {
      key: 'sceneDetection',
      icon: '🎬',
      name: 'Scene Detection',
      description: 'Auto-detect scene boundaries in videos',
      examples: 'Timeline splitting, clip extraction',
      advanced: false,
    },
    {
      key: 'autoColorCorrection',
      icon: '🎨',
      name: 'Auto Color Correction',
      description: 'Automatically correct color and exposure',
      examples: 'White balance, contrast adjustment',
      advanced: false,
    },
    {
      key: 'motionSmoothing',
      icon: '🌊',
      name: 'Motion Smoothing',
      description: 'Stabilize and smooth video movement',
      examples: 'Camera shake removal, keyframe interpolation',
      advanced: true,
    },
    {
      key: 'styleTransfer',
      icon: '🎭',
      name: 'Style Transfer',
      description: 'Apply artistic styles to videos',
      examples: 'Retro, cinematic, animation styles',
      advanced: true,
    },
    {
      key: 'subtitleGeneration',
      icon: '📺',
      name: 'Subtitle Generation',
      description: 'Auto-generate subtitles with timestamps',
      examples: 'Multi-language support',
      advanced: false,
    },
    {
      key: 'autoEditing',
      icon: '✂️',
      name: 'Auto Editing',
      description: 'AI-powered automated editing workflow',
      examples: 'Cuts, transitions, effects',
      advanced: true,
    },
  ];

  const handleToggle = (key: string) => {
    setState(prev => ({
      ...prev,
      agenticFeatures: {
        ...prev.agenticFeatures,
        [key]: !prev.agenticFeatures[key as keyof typeof prev.agenticFeatures],
      },
    }));
  };

  const basicFeatures = agentSkills.filter(s => !s.advanced);
  const advancedFeatures = agentSkills.filter(s => s.advanced);
  const enabledCount = Object.values(state.agenticFeatures).filter(Boolean).length;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-100 mb-2">Enable AI-Powered Skills</h3>
        <p className="text-gray-400 mb-4">
          Select which agents will run automatically. You can enable/disable these anytime in Settings.
        </p>
      </div>

      {/* Enabled Counter */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-gray-300">Features Enabled</span>
          <Badge variant="primary" size="md">
            {enabledCount} / {agentSkills.length}
          </Badge>
        </div>
      </div>

      {/* Basic Features */}
      <div>
        <h4 className="text-md font-semibold text-gray-100 mb-3 flex items-center gap-2">
          <span>⭐ Essential Features</span>
          <Badge variant="success" size="sm">Recommended</Badge>
        </h4>
        <div className="space-y-2">
          {basicFeatures.map(feature => (
            <label
              key={feature.key}
              className="flex items-start p-4 rounded-lg bg-gray-800 cursor-pointer hover:bg-gray-700 transition-colors"
            >
              <input
                type="checkbox"
                checked={state.agenticFeatures[feature.key as keyof typeof state.agenticFeatures]}
                onChange={() => handleToggle(feature.key)}
                className="w-5 h-5 mt-1"
              />
              <div className="ml-4 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{feature.icon}</span>
                  <p className="font-semibold text-gray-100">{feature.name}</p>
                </div>
                <p className="text-sm text-gray-400 mt-1">{feature.description}</p>
                <p className="text-xs text-gray-500 mt-1">💡 {feature.examples}</p>
              </div>
              {state.agenticFeatures[feature.key as keyof typeof state.agenticFeatures] && (
                <Badge variant="success" size="sm">
                  Enabled
                </Badge>
              )}
            </label>
          ))}
        </div>
      </div>

      {/* Advanced Features */}
      <div>
        <h4 className="text-md font-semibold text-gray-100 mb-3 flex items-center gap-2">
          <span>🚀 Advanced Features</span>
          <Badge variant="accent" size="sm">Experimental</Badge>
        </h4>
        <Alert type="warning" icon="⚡" dismissible={false}>
          <p className="text-sm">Advanced features require more GPU power and may be slower on RTX 3060. Enable only if needed.</p>
        </Alert>
        <div className="space-y-2 mt-3">
          {advancedFeatures.map(feature => (
            <label
              key={feature.key}
              className="flex items-start p-4 rounded-lg bg-gray-800 cursor-pointer hover:bg-gray-700 transition-colors opacity-75"
            >
              <input
                type="checkbox"
                checked={state.agenticFeatures[feature.key as keyof typeof state.agenticFeatures]}
                onChange={() => handleToggle(feature.key)}
                className="w-5 h-5 mt-1"
              />
              <div className="ml-4 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{feature.icon}</span>
                  <p className="font-semibold text-gray-100">{feature.name}</p>
                </div>
                <p className="text-sm text-gray-400 mt-1">{feature.description}</p>
                <p className="text-xs text-gray-500 mt-1">💡 {feature.examples}</p>
              </div>
              {state.agenticFeatures[feature.key as keyof typeof state.agenticFeatures] && (
                <Badge variant="success" size="sm">
                  Enabled
                </Badge>
              )}
            </label>
          ))}
        </div>
      </div>

      {/* Quick Presets */}
      <div>
        <h4 className="text-md font-semibold text-gray-100 mb-3">Quick Presets</h4>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() =>
              setState(prev => ({
                ...prev,
                agenticFeatures: {
                  scriptGeneration: true,
                  voiceoverSynthesis: true,
                  sceneDetection: true,
                  autoColorCorrection: true,
                  motionSmoothing: false,
                  styleTransfer: false,
                  subtitleGeneration: true,
                  autoEditing: false,
                },
              }))
            }
            className="p-3 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors text-center"
          >
            <p className="font-semibold text-gray-100 text-sm">Standard</p>
            <p className="text-xs text-gray-500 mt-1">Balanced setup</p>
          </button>

          <button
            onClick={() =>
              setState(prev => ({
                ...prev,
                agenticFeatures: {
                  scriptGeneration: true,
                  voiceoverSynthesis: true,
                  sceneDetection: true,
                  autoColorCorrection: true,
                  motionSmoothing: true,
                  styleTransfer: true,
                  subtitleGeneration: true,
                  autoEditing: true,
                },
              }))
            }
            className="p-3 rounded-lg bg-green-900 hover:bg-green-800 transition-colors text-center"
          >
            <p className="font-semibold text-green-100 text-sm">Full Power</p>
            <p className="text-xs text-green-400 mt-1">All features on</p>
          </button>

          <button
            onClick={() =>
              setState(prev => ({
                ...prev,
                agenticFeatures: {
                  scriptGeneration: true,
                  voiceoverSynthesis: false,
                  sceneDetection: false,
                  autoColorCorrection: false,
                  motionSmoothing: false,
                  styleTransfer: false,
                  subtitleGeneration: false,
                  autoEditing: false,
                },
              }))
            }
            className="p-3 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors text-center"
          >
            <p className="font-semibold text-gray-100 text-sm">Minimal</p>
            <p className="text-xs text-gray-500 mt-1">Lightweight</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgenticFeaturesStep;
