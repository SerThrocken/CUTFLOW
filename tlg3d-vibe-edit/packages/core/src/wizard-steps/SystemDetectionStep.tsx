// ===== WIZARD STEP 2: SYSTEM DETECTION =====

import React from 'react';
import { Card, Badge, Alert } from '@tlg3d/core/ui-components';
import SystemDetector from '@tlg3d/core/system-detector';
import type { SetupWizardState, SystemInfo } from '@tlg3d/core/setup-wizard-types';

export const SystemDetectionStep: React.FC<{
  state: SetupWizardState;
  setState: (fn: (s: SetupWizardState) => SetupWizardState) => void;
  systemInfo: SystemInfo | null;
}> = ({ state, setState, systemInfo }) => {
  if (!systemInfo) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-400">Detecting your system...</p>
      </div>
    );
  }

  const getSupportBadge = (level: string) => {
    switch (level) {
      case 'optimal':
        return <Badge variant="success">✓ Optimal</Badge>;
      case 'recommended':
        return <Badge variant="primary">⚠️ Recommended</Badge>;
      default:
        return <Badge variant="warning">⚠️ Minimum</Badge>;
    }
  };

  const recommendations = SystemDetector.getRecommendedModels(systemInfo);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <div className="text-sm text-gray-400 mb-1">GPU</div>
          <div className="text-xl font-bold text-green-400">{systemInfo.gpuVram} GB</div>
          <div className="text-xs text-gray-500 mt-1">{systemInfo.gpuName}</div>
        </Card>

        <Card>
          <div className="text-sm text-gray-400 mb-1">CPU</div>
          <div className="text-xl font-bold text-green-400">{systemInfo.cpuCores} Cores</div>
          <div className="text-xs text-gray-500 mt-1">{systemInfo.cpuGeneration}</div>
        </Card>

        <Card>
          <div className="text-sm text-gray-400 mb-1">RAM</div>
          <div className="text-xl font-bold text-green-400">{systemInfo.ramAvailable} GB</div>
          <div className="text-xs text-gray-500 mt-1">Available</div>
        </Card>

        <Card>
          <div className="text-sm text-gray-400 mb-1">OS</div>
          <div className="text-xl font-bold text-green-400">{systemInfo.osType}</div>
          <div className="text-xs text-gray-500 mt-1">{systemInfo.osVersion}</div>
        </Card>
      </div>

      {/* Support Level */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-gray-100">Support Level</span>
          {getSupportBadge(systemInfo.supportLevel)}
        </div>
        <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full ${
              systemInfo.supportLevel === 'optimal'
                ? 'bg-green-600'
                : systemInfo.supportLevel === 'recommended'
                ? 'bg-amber-600'
                : 'bg-red-600'
            }`}
            style={{
              width:
                systemInfo.supportLevel === 'optimal'
                  ? '100%'
                  : systemInfo.supportLevel === 'recommended'
                  ? '66%'
                  : '33%',
            }}
          />
        </div>
      </div>

      {/* Warnings */}
      {SystemDetector.getWarnings(systemInfo).length > 0 && (
        <div className="space-y-2">
          {SystemDetector.getWarnings(systemInfo).map((warning, i) => (
            <Alert key={i} type="warning" icon="⚠️" dismissible={false}>
              {warning}
            </Alert>
          ))}
        </div>
      )}

      {/* Recommendations */}
      <div>
        <h3 className="font-semibold text-gray-100 mb-3">Recommended Models for Your System</h3>
        <div className="space-y-2">
          {recommendations.map((model, i) => (
            <div key={i} className="bg-gray-800 p-3 rounded-lg flex items-center justify-between">
              <span className="text-gray-300">{model}</span>
              <Badge variant="accent" size="sm">Optimized</Badge>
            </div>
          ))}
        </div>
      </div>

      {/* System Requirements Info */}
      <div className="bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg p-4">
        <p className="text-sm text-blue-300">
          ℹ️ <strong>System Requirements:</strong> Minimum 16GB RAM (Recommended: 32-64GB DDR4 or DDR5 RAM, preferably DDR5) and Minimum 8GB VRAM (Recommended: 12GB+ VRAM).
        </p>
      </div>
    </div>
  );
};

export default SystemDetectionStep;
