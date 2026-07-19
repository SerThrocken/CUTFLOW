// ===== LOCAL MODEL MANAGEMENT API ENDPOINTS =====

import express from 'express';
import { OllamaManager, ModelCompatibilityChecker, RECOMMENDED_MODELS } from '@tlg3d/core/local-models';
import type { SystemSpecs } from '@tlg3d/core/local-models';

const router = express.Router();

const systemSpecs: SystemSpecs = {
  gpuVram: parseInt(process.env.SYSTEM_GPU_VRAM || '12'),
  cpuGeneration: process.env.SYSTEM_CPU_GENERATION || 'i7-9700K',
  ramAvailable: parseInt(process.env.SYSTEM_RAM_AVAILABLE || '32'),
  osType: (process.platform === 'darwin' ? 'macos' : process.platform === 'win32' ? 'windows' : 'linux') as any,
};

const ollamaManager = new OllamaManager();
const compatibilityChecker = new ModelCompatibilityChecker(systemSpecs);

/**
 * GET /api/models/status
 * Check Ollama status and system specs
 */
router.get('/status', async (req, res) => {
  try {
    const isRunning = await ollamaManager.isOllamaRunning();
    const models = isRunning ? await ollamaManager.listModels() : [];

    res.json({
      ollama: {
        running: isRunning,
        url: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
      },
      system: systemSpecs,
      installedModels: models.length,
      totalDownloaded: models.reduce((sum, m) => sum + m.size, 0),
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * GET /api/models/recommended
 * Get recommended models for this system
 */
router.get('/recommended', (req, res) => {
  try {
    const allModels = Object.values(RECOMMENDED_MODELS);
    const compatible = compatibilityChecker.getCompatibleModels();
    const recommended = compatibilityChecker.getRecommendedModel();

    res.json({
      total: allModels.length,
      compatible: compatible.length,
      models: compatible,
      recommended: recommended,
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * GET /api/models/installed
 * List all installed models
 */
router.get('/installed', async (req, res) => {
  try {
    const models = await ollamaManager.listModels();
    res.json({ models });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * POST /api/models/download/:modelId
 * Download and install a model
 */
router.post('/download/:modelId', async (req, res) => {
  try {
    const { modelId } = req.params;
    const model = RECOMMENDED_MODELS[modelId];

    if (!model) {
      return res.status(404).json({ error: `Model ${modelId} not found` });
    }

    if (!compatibilityChecker.isModelCompatible(model)) {
      return res.status(400).json({
        error: 'Model not compatible with system specs',
        required: {
          vram: model.vramRequired,
          ram: model.ramRequired,
        },
        available: {
          vram: systemSpecs.gpuVram,
          ram: systemSpecs.ramAvailable,
        },
      });
    }

    const modelName = `${model.id}:latest`;

    // Start download in background
    res.json({ message: `Downloading ${model.name}...`, model: model.id });

    ollamaManager
      .pullModel(modelName, status => {
        console.log(`[${modelId}] ${status}`);
      })
      .then(success => {
        if (success) {
          console.log(`[${modelId}] Installation complete`);
        } else {
          console.error(`[${modelId}] Installation failed`);
        }
      });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * DELETE /api/models/:modelName
 * Delete an installed model
 */
router.delete('/:modelName', async (req, res) => {
  try {
    const { modelName } = req.params;
    const success = await ollamaManager.deleteModel(modelName);

    if (success) {
      res.json({ message: `Model ${modelName} deleted` });
    } else {
      res.status(500).json({ error: `Failed to delete model ${modelName}` });
    }
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * POST /api/models/test/:modelId
 * Test a model with a sample prompt
 */
router.post('/test/:modelId', async (req, res) => {
  try {
    const { modelId } = req.params;
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const modelName = `${modelId}:latest`;
    const startTime = Date.now();

    const response = await ollamaManager.generateCompletion(modelName, prompt, {
      num_predict: 100, // Keep short for testing
    });

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    res.json({
      model: modelId,
      prompt,
      response,
      duration: `${duration.toFixed(2)}s`,
      tokensPerSecond: (100 / duration).toFixed(1),
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * POST /api/models/system-specs
 * Update system specifications
 */
router.post('/system-specs', (req, res) => {
  try {
    const { gpuVram, cpuGeneration, ramAvailable } = req.body;

    if (gpuVram) systemSpecs.gpuVram = gpuVram;
    if (cpuGeneration) systemSpecs.cpuGeneration = cpuGeneration;
    if (ramAvailable) systemSpecs.ramAvailable = ramAvailable;

    res.json({ system: systemSpecs });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
