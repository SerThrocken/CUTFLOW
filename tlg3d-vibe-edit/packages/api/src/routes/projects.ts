// ===== PROJECT & QUEUE MANAGEMENT API ENDPOINTS =====

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import FolderStructureManager from '@tlg3d/core/folder-structure';
import ProjectQueueManager from '@tlg3d/core/project-queue';
import type { VideoProject, UserProfile } from '@tlg3d/core/folder-structure';

const router = express.Router();
const folderManager = new FolderStructureManager(process.env.DATA_DIR || './data/users');
const queueManager = new ProjectQueueManager();

// ===== PROJECT ENDPOINTS =====

/**
 * POST /api/projects/create
 * Create a new project
 */
router.post('/create', (req, res) => {
  try {
    const { userId, username, projectName, description } = req.body;

    if (!userId || !username || !projectName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const projectId = `project_${Date.now()}`;
    const project: VideoProject = {
      projectId,
      userId,
      projectName,
      description: description || '',
      status: 'draft',
      resolution: '1080p',
      fps: 30,
      createdAt: new Date(),
      updatedAt: new Date(),
      priority: 'normal',
      assets: [],
      progress: 0,
    };

    // Create user profile if needed
    const user: UserProfile = {
      userId,
      platform: userId.split('_')[0] as any,
      username,
      displayName: username,
      createdAt: new Date(),
      totalProjects: 0,
      activeProjects: 0,
      storageUsed: 0,
    };

    // Create directory structure
    folderManager.createProjectDirectory(user, project);

    // Save to database (would save to MongoDB)
    res.json({
      success: true,
      project,
      projectPath: folderManager.getProjectDirectory(userId, username, projectId, projectName),
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * GET /api/projects/:userId
 * List all projects for a user
 */
router.get('/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const username = req.query.username as string;

    if (!userId || !username) {
      return res.status(400).json({ error: 'Missing userId or username' });
    }

    const projects = folderManager.listUserProjects(userId, username);
    const queueStats = queueManager.getQueueStatus(userId);
    const storageUsed = folderManager.getUserStorageUsed(userId, username);

    // Attach queue info to projects
    const projectsWithQueue = projects.map(p => ({
      ...p,
      queueInfo: {
        status: 'pending', // Would fetch from queue
        position: 0,
      },
    }));

    res.json({
      projects: projectsWithQueue,
      queueStats,
      storageUsed,
      storageUsedGB: (storageUsed / (1024 * 1024 * 1024)).toFixed(2),
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * GET /api/projects/:userId/:projectId
 * Get specific project details
 */
router.get('/:userId/:projectId', (req, res) => {
  try {
    const { userId, projectId } = req.params;
    const username = req.query.username as string;

    // In real app, fetch from MongoDB
    res.json({
      projectId,
      userId,
      projectName: 'Project Name',
      status: 'draft',
      progress: 45,
      assets: [],
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * PUT /api/projects/:userId/:projectId
 * Update project
 */
router.put('/:userId/:projectId', (req, res) => {
  try {
    const { userId, projectId } = req.params;
    const updates = req.body;

    // Update in MongoDB
    res.json({
      success: true,
      message: 'Project updated',
      projectId,
      updates,
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * DELETE /api/projects/:userId/:projectId
 * Archive or delete project
 */
router.delete('/:userId/:projectId', (req, res) => {
  try {
    const { userId, projectId } = req.params;
    const username = req.query.username as string;
    const projectName = req.query.projectName as string;
    const action = req.query.action || 'archive'; // archive or delete

    if (action === 'archive') {
      folderManager.archiveProject(userId, username, projectId, projectName);
    } else {
      folderManager.deleteProject(userId, username, projectId, projectName);
    }

    res.json({
      success: true,
      message: `Project ${action}d`,
      projectId,
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// ===== QUEUE ENDPOINTS =====

/**
 * POST /api/projects/queue/add
 * Add project to processing queue
 */
router.post('/queue/add', async (req, res) => {
  try {
    const { userId, projectId, priority } = req.body;

    if (!userId || !projectId) {
      return res.status(400).json({ error: 'Missing userId or projectId' });
    }

    const queueItem = await queueManager.addToQueue(userId, projectId, priority || 'normal');

    res.json({
      success: true,
      queueItem,
      message: `Project added to queue at position ${queueItem.position}`,
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * GET /api/projects/queue/:userId
 * Get queue status for user
 */
router.get('/queue/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const queueStatus = queueManager.getQueueStatus(userId);

    res.json(queueStatus);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * GET /api/projects/queue/:userId/:queueId
 * Get specific queue item
 */
router.get('/queue/:userId/:queueId', (req, res) => {
  try {
    const { userId, queueId } = req.params;
    const queueItem = queueManager.getQueueItem(userId, queueId);

    if (!queueItem) {
      return res.status(404).json({ error: 'Queue item not found' });
    }

    res.json(queueItem);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * POST /api/projects/queue/:userId/:queueId/cancel
 * Cancel queue item
 */
router.post('/queue/:userId/:queueId/cancel', (req, res) => {
  try {
    const { userId, queueId } = req.params;
    const success = queueManager.cancelQueueItem(userId, queueId);

    if (!success) {
      return res.status(400).json({ error: 'Cannot cancel processing project' });
    }

    res.json({ success: true, message: 'Queue item cancelled' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * POST /api/projects/queue/:userId/:queueId/prioritize
 * Move queue item to front
 */
router.post('/queue/:userId/:queueId/prioritize', (req, res) => {
  try {
    const { userId, queueId } = req.params;
    const success = queueManager.prioritizeQueueItem(userId, queueId);

    if (!success) {
      return res.status(400).json({ error: 'Cannot prioritize this item' });
    }

    res.json({ success: true, message: 'Queue item prioritized' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * POST /api/projects/queue/:userId/clear-completed
 * Clear all completed projects from queue
 */
router.post('/queue/:userId/clear-completed', (req, res) => {
  try {
    const { userId } = req.params;
    const cleared = queueManager.clearCompletedProjects(userId);

    res.json({
      success: true,
      message: `Cleared ${cleared} completed projects`,
      clearedCount: cleared,
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * GET /api/projects/queue/:userId/next
 * Get next project to process
 */
router.get('/queue/:userId/next', (req, res) => {
  try {
    const { userId } = req.params;
    const nextProject = queueManager.getNextProject(userId);

    res.json({
      nextProject: nextProject || null,
      message: nextProject ? 'Ready to process' : 'No pending projects',
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * GET /api/projects/queue/:userId/processing
 * Get currently processing projects
 */
router.get('/queue/:userId/processing', (req, res) => {
  try {
    const { userId } = req.params;
    const processing = queueManager.getProcessingProjects(userId);

    res.json({
      count: processing.length,
      maxConcurrent: 3,
      projects: processing,
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
