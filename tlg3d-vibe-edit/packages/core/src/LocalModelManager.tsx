// ===== LOCAL MODEL MANAGER DASHBOARD COMPONENT =====

import React, { useState, useEffect } from 'react';
import { Button, Card, Progress, Badge, Alert, Modal, Input } from '@tlg3d/core/ui-components';
import {
  RECOMMENDED_MODELS,
  ModelCompatibilityChecker,
  OllamaManager,
  type LocalModel,
  type SystemSpecs,
  type OllamaModel,
} from '@tlg3d/core/local-models';

interface LocalModelManagerProps {
  systemSpecs: SystemSpecs;
}

export const LocalModelManager: React.FC<LocalModelManagerProps> = ({ systemSpecs }) => {
  const [models, setModels] = useState<LocalModel[]>(Object.values(RECOMMENDED_MODELS));
  const [installedModels, setInstalledModels] = useState<OllamaModel[]>([]);
  const [isOllamaRunning, setIsOllamaRunning] = useState(false);
  const [downloadingModel, setDownloadingModel] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<string>('');
  const [selectedTab, setSelectedTab] = useState<'recommended' | 'installed' | 'settings'>('recommended');
  const [showOllamaSetup, setShowOllamaSetup] = useState(false);

  const ollamaManager = new OllamaManager();
  const compatibilityChecker = new ModelCompatibilityChecker(systemSpecs);

  useEffect(() => {
    checkOllamaStatus();
  }, []);

  const checkOllamaStatus = async () => {
    const running = await ollamaManager.isOllamaRunning();
    setIsOllamaRunning(running);

    if (running) {
      const modelList = await ollamaManager.listModels();
      setInstalledModels(modelList);

      // Update installed status
      setModels(prev =>
        prev.map(m => ({
          ...m,
          installed: modelList.some(om => om.name.includes(m.id)),
        }))
      );
    }
  };

  const handleDownloadModel = async (model: LocalModel) => {
    setDownloadingModel(model.id);
    setDownloadProgress('Starting download...');

    try {
      const modelName = `${model.id}:latest`;
      const success = await ollamaManager.pullModel(modelName, status => {
        setDownloadProgress(status);
      });

      if (success) {
        setDownloadProgress('Installation complete!');
        setTimeout(() => {
          setDownloadingModel(null);
          checkOllamaStatus();
        }, 2000);
      } else {
        setDownloadProgress('Installation failed');
      }
    } catch (error) {
      setDownloadProgress(`Error: ${(error as Error).message}`);
    }
  };

  const handleDeleteModel = async (modelName: string) => {
    try {
      await ollamaManager.deleteModel(modelName);
      checkOllamaStatus();
    } catch (error) {
      console.error('Failed to delete model:', error);
    }
  };

  const compatibleModels = compatibilityChecker.getCompatibleModels();
  const recommendedModel = compatibilityChecker.getRecommendedModel();

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-100 mb-2">🤖 Local Model Manager</h2>
        <p className="text-gray-400">Download and manage AI models locally for offline video editing</p>
      </div>

      {/* System Specs & Ollama Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="text-sm text-gray-400 mb-1">GPU VRAM</div>
          <div className="text-2xl font-bold text-green-400">{systemSpecs.gpuVram} GB</div>
          <div className="text-xs text-gray-500 mt-1">RTX 3060+</div>
        </Card>

        <Card>
          <div className="text-sm text-gray-400 mb-1">CPU Generation</div>
          <div className="text-2xl font-bold text-green-400">{systemSpecs.cpuGeneration}</div>
          <div className="text-xs text-gray-500 mt-1">i7+</div>
        </Card>

        <Card>
          <div className="text-sm text-gray-400 mb-1">System RAM</div>
          <div className="text-2xl font-bold text-green-400">{systemSpecs.ramAvailable} GB</div>
          <div className="text-xs text-gray-500 mt-1">Available</div>
        </Card>

        <Card>
          <div className="text-sm text-gray-400 mb-1">Ollama Status</div>
          <div className={`text-2xl font-bold ${isOllamaRunning ? 'text-green-400' : 'text-red-400'}`}>
            {isOllamaRunning ? '✓ Running' : '✗ Offline'}
          </div>
          <button
            onClick={() => checkOllamaStatus()}
            className="text-xs text-green-400 hover:text-green-300 mt-1"
          >
            Refresh
          </button>
        </Card>
      </div>

      {/* Ollama Not Running Alert */}
      {!isOllamaRunning && (
        <Alert type="warning" icon="⚠️" dismissible={false}>
          <p className="font-medium">Ollama is not running</p>
          <p className="text-sm mb-3">You need Ollama to download and run local models.</p>
          <Button
            onClick={() => setShowOllamaSetup(true)}
            variant="primary"
            size="sm"
          >
            Setup Ollama
          </Button>
        </Alert>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-4 border-b border-gray-800">
        {(['recommended', 'installed', 'settings'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab)}
            className={`px-4 py-3 font-medium transition-colors capitalize ${
              selectedTab === tab
                ? 'text-green-400 border-b-2 border-green-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            {tab === 'recommended' && `📦 Recommended (${compatibleModels.length})`}
            {tab === 'installed' && `✓ Installed (${installedModels.length})`}
            {tab === 'settings' && '⚙️ Settings'}
          </button>
        ))}
      </div>

      {/* Recommended Models Tab */}
      {selectedTab === 'recommended' && (
        <div className="space-y-4">
          {recommendedModel && (
            <Alert type="info" icon="⭐">
              <p className="font-medium">Recommended for Your System: {recommendedModel.name}</p>
              <p className="text-sm">
                {recommendedModel.description} • {recommendedModel.performance.tokensPerSecond} tokens/sec
              </p>
            </Alert>
          )}

          <div className="space-y-3">
            {compatibleModels.map(model => (
              <Card key={model.id}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-100">{model.name}</h3>
                    <p className="text-sm text-gray-400">{model.description}</p>
                  </div>
                  <Badge
                    variant={model.modelType === 'text-generation' ? 'primary' : 'accent'}
                    size="sm"
                  >
                    {model.modelType}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4 text-sm">
                  <div>
                    <div className="text-gray-500">Size</div>
                    <div className="font-semibold text-gray-300">
                      {compatibilityChecker.getModelSize(model)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">VRAM</div>
                    <div className="font-semibold text-gray-300">{model.vramRequired} GB</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Speed</div>
                    <div className="font-semibold text-green-400">{model.performance.tokensPerSecond} tok/s</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Quantization</div>
                    <div className="font-semibold text-gray-300">{model.quantization.toUpperCase()}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">CPU Min</div>
                    <div className="font-semibold text-gray-300">{model.cpuMinGen}</div>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="text-sm text-gray-400 mb-2">Capabilities:</div>
                  <div className="flex flex-wrap gap-2">
                    {model.capabilities.map(cap => (
                      <Badge key={cap} variant="success" size="sm">
                        {cap}
                      </Badge>
                    ))}
                  </div>
                </div>

                {downloadingModel === model.id ? (
                  <div className="space-y-2">
                    <Progress value={50} max={100} showLabel={false} />
                    <p className="text-sm text-gray-400">{downloadProgress}</p>
                  </div>
                ) : (
                  <Button
                    onClick={() => handleDownloadModel(model)}
                    variant="primary"
                    size="md"
                    disabled={!isOllamaRunning || model.installed}
                  >
                    {model.installed ? '✓ Installed' : '⬇️ Download & Install'}
                  </Button>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Installed Models Tab */}
      {selectedTab === 'installed' && (
        <div className="space-y-3">
          {installedModels.length === 0 ? (
            <Alert type="info" icon="ℹ️">
              <p>No models installed yet. Download one from the Recommended tab to get started.</p>
            </Alert>
          ) : (
            installedModels.map(model => (
              <Card key={model.name}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-100">{model.name}</h3>
                    <p className="text-sm text-gray-400">
                      Size: {(model.size / (1024 * 1024 * 1024)).toFixed(2)} GB
                    </p>
                  </div>
                  <Button
                    onClick={() => handleDeleteModel(model.name)}
                    variant="outline"
                    size="md"
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Settings Tab */}
      {selectedTab === 'settings' && (
        <div className="space-y-4 max-w-2xl">
          <Card>
            <h3 className="text-lg font-semibold mb-4 text-gray-100">Ollama Configuration</h3>
            <div className="space-y-4">
              <Input label="Ollama Base URL" type="text" defaultValue="http://localhost:11434" />
              <Input label="GPU Device" type="text" placeholder="cuda:0 or mps" />
              <Input label="Context Window" type="number" defaultValue="2048" />
              <Button variant="secondary" size="md">
                Save Settings
              </Button>
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold mb-4 text-gray-100">System Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">GPU VRAM:</span>
                <span className="text-gray-100 font-medium">{systemSpecs.gpuVram} GB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">CPU:</span>
                <span className="text-gray-100 font-medium">{systemSpecs.cpuGeneration}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">RAM:</span>
                <span className="text-gray-100 font-medium">{systemSpecs.ramAvailable} GB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">OS:</span>
                <span className="text-gray-100 font-medium">{systemSpecs.osType}</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Ollama Setup Modal */}
      <Modal isOpen={showOllamaSetup} onClose={() => setShowOllamaSetup(false)} title="Setup Ollama" size="lg">
        <div className="space-y-4">
          <p className="text-gray-300">
            Ollama enables you to run large language models locally on your GPU. Follow these steps:
          </p>

          <div className="space-y-3">
            <div className="bg-gray-800 p-4 rounded-lg">
              <p className="font-semibold text-green-400 mb-2">1. Download Ollama</p>
              <p className="text-sm text-gray-400 mb-2">
                Visit <a href="https://ollama.ai" className="text-green-400 hover:underline">ollama.ai</a> and download for your OS
              </p>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg">
              <p className="font-semibold text-green-400 mb-2">2. Install & Start Ollama</p>
              <p className="text-sm text-gray-400 mb-2">Follow the installer, then start Ollama from your applications</p>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg">
              <p className="font-semibold text-green-400 mb-2">3. Verify Installation</p>
              <p className="text-sm text-gray-400 mb-2">Open terminal and run:</p>
              <code className="text-xs bg-gray-900 p-2 rounded block text-amber-400">
                ollama --version
              </code>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg">
              <p className="font-semibold text-green-400 mb-2">4. Start Ollama Service</p>
              <code className="text-xs bg-gray-900 p-2 rounded block text-amber-400">
                ollama serve
              </code>
            </div>
          </div>

          <Alert type="success" icon="✓">
            <p className="text-sm">Once Ollama is running, refresh this page and start downloading models!</p>
          </Alert>

          <div className="flex gap-2">
            <Button variant="primary" onClick={() => checkOllamaStatus()}>
              Check Status
            </Button>
            <Button variant="secondary" onClick={() => setShowOllamaSetup(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default LocalModelManager;
