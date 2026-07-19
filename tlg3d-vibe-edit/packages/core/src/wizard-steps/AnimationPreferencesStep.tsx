// ===== WIZARD STEP 5: ANIMATION PREFERENCES =====

import React from 'react';
import { Card, Badge, Button } from '@tlg3d/core/ui-components';
import type { SetupWizardState } from '@tlg3d/core/setup-wizard-types';

export const AnimationPreferencesStep: React.FC<{
  state: SetupWizardState;
  setState: (fn: (s: SetupWizardState) => SetupWizardState) => void;
}> = ({ state, setState }) => {
  const handleTransitionSpeed = (speed: 'slow' | 'normal' | 'fast') => {
    setState(prev => ({
      ...prev,
      animationPreferences: { ...prev.animationPreferences, transitionSpeed: speed },
    }));
  };

  const handleTransitionType = (type: 'fade' | 'slide' | 'wipe' | 'dissolve' | 'zoom') => {
    setState(prev => ({
      ...prev,
      animationPreferences: { ...prev.animationPreferences, defaultTransitionType: type },
    }));
  };

  const handleColorGrading = (preset: 'neutral' | 'warm' | 'cool' | 'cinematic') => {
    setState(prev => ({
      ...prev,
      animationPreferences: { ...prev.animationPreferences, colorGradingPreset: preset },
    }));
  };

  const transitions = [
    { id: 'fade', name: 'Fade', icon: '👻', preview: '(Smooth fade)' },
    { id: 'slide', name: 'Slide', icon: '↗️', preview: '(Directional)' },
    { id: 'wipe', name: 'Wipe', icon: '🧹', preview: '(Brush effect)' },
    { id: 'dissolve', name: 'Dissolve', icon: '💧', preview: '(Liquid)' },
    { id: 'zoom', name: 'Zoom', icon: '🔍', preview: '(Magnify)' },
  ];

  const speeds = [
    { id: 'slow', label: 'Slow', duration: '1.5s' },
    { id: 'normal', label: 'Normal', duration: '1.0s' },
    { id: 'fast', label: 'Fast', duration: '0.5s' },
  ];

  const colorPresets = [
    { id: 'neutral', name: 'Neutral', colors: 'bg-gradient-to-r from-gray-400 to-gray-600' },
    { id: 'warm', name: 'Warm', colors: 'bg-gradient-to-r from-orange-400 to-red-600' },
    { id: 'cool', name: 'Cool', colors: 'bg-gradient-to-r from-blue-400 to-cyan-600' },
    { id: 'cinematic', name: 'Cinematic', colors: 'bg-gradient-to-r from-amber-600 to-slate-800' },
  ];

  return (
    <div className="space-y-8">
      {/* Transition Type */}
      <div>
        <h3 className="text-lg font-semibold text-gray-100 mb-4">Default Transition Effect</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {transitions.map(t => (
            <button
              key={t.id}
              onClick={() => handleTransitionType(t.id as any)}
              className={`p-4 rounded-lg border-2 transition-all text-center ${
                state.animationPreferences.defaultTransitionType === t.id
                  ? 'border-green-600 bg-gray-800'
                  : 'border-gray-700 bg-gray-900 hover:border-gray-600'
              }`}
            >
              <div className="text-2xl mb-2">{t.icon}</div>
              <p className="font-semibold text-gray-100 text-sm">{t.name}</p>
              <p className="text-xs text-gray-500 mt-1">{t.preview}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Transition Speed */}
      <div>
        <h3 className="text-lg font-semibold text-gray-100 mb-4">Transition Speed</h3>
        <div className="grid grid-cols-3 gap-3">
          {speeds.map(s => (
            <button
              key={s.id}
              onClick={() => handleTransitionSpeed(s.id as any)}
              className={`p-4 rounded-lg border-2 transition-all text-center ${
                state.animationPreferences.transitionSpeed === s.id
                  ? 'border-green-600 bg-gray-800'
                  : 'border-gray-700 bg-gray-900 hover:border-gray-600'
              }`}
            >
              <p className="font-semibold text-gray-100">{s.label}</p>
              <p className="text-sm text-gray-500 mt-1">{s.duration}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Color Grading */}
      <div>
        <h3 className="text-lg font-semibold text-gray-100 mb-4">Color Grading Preset</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {colorPresets.map(preset => (
            <button
              key={preset.id}
              onClick={() => handleColorGrading(preset.id as any)}
              className={`p-4 rounded-lg border-2 transition-all ${
                state.animationPreferences.colorGradingPreset === preset.id
                  ? 'border-green-600'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              <div className={`w-full h-12 rounded ${preset.colors} mb-2`} />
              <p className="font-semibold text-gray-100 text-sm">{preset.name}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Effects Toggles */}
      <div>
        <h3 className="text-lg font-semibold text-gray-100 mb-4">Visual Effects</h3>
        <div className="space-y-3">
          <label className="flex items-center p-4 rounded-lg bg-gray-800 cursor-pointer hover:bg-gray-700 transition-colors">
            <input
              type="checkbox"
              checked={state.animationPreferences.enableColorGrading}
              onChange={e =>
                setState(prev => ({
                  ...prev,
                  animationPreferences: {
                    ...prev.animationPreferences,
                    enableColorGrading: e.target.checked,
                  },
                }))
              }
              className="w-5 h-5"
            />
            <div className="ml-3">
              <p className="font-semibold text-gray-100">Auto Color Grading</p>
              <p className="text-sm text-gray-400">Automatically apply color grading to videos</p>
            </div>
            {state.animationPreferences.enableColorGrading && (
              <Badge variant="success" size="sm" className="ml-auto">
                Enabled
              </Badge>
            )}
          </label>

          <label className="flex items-center p-4 rounded-lg bg-gray-800 cursor-pointer hover:bg-gray-700 transition-colors">
            <input
              type="checkbox"
              checked={state.animationPreferences.enableParticleEffects}
              onChange={e =>
                setState(prev => ({
                  ...prev,
                  animationPreferences: {
                    ...prev.animationPreferences,
                    enableParticleEffects: e.target.checked,
                  },
                }))
              }
              className="w-5 h-5"
            />
            <div className="ml-3">
              <p className="font-semibold text-gray-100">Particle Effects</p>
              <p className="text-sm text-gray-400">Add particles, sparkles, and overlays</p>
            </div>
            {state.animationPreferences.enableParticleEffects && (
              <Badge variant="success" size="sm" className="ml-auto">
                Enabled
              </Badge>
            )}
          </label>
        </div>
      </div>

      {/* Preview */}
      <Card>
        <h4 className="font-semibold text-gray-100 mb-3">🎬 Preview</h4>
        <div className="bg-gray-800 h-32 rounded flex items-center justify-center">
          <p className="text-gray-500">
            Transition: <span className="text-green-400">{state.animationPreferences.defaultTransitionType}</span> (
            {state.animationPreferences.transitionSpeed})
          </p>
        </div>
      </Card>
    </div>
  );
};

export default AnimationPreferencesStep;
