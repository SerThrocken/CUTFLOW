// ===== PROJECT QUEUE MANAGEMENT SYSTEM =====

import { EventEmitter } from 'events';
import type { QueueItem, VideoProject } from './folder-structure';

export class ProjectQueueManager extends EventEmitter {
  private queue: Map<string, QueueItem[]> = new Map(); // userId -> QueueItems
  private processing: Map<string, Set<string>> = new Map(); // userId -> Set of processing projectIds
  private maxConcurrent = 3;

  constructor() {
    super();
  }

  /**
   * Add project to queue
   */
  async addToQueue(
    userId: string,
    projectId: string,
    priority: 'low' | 'normal' | 'high' = 'normal'
  ): Promise<QueueItem> {
    // Initialize queue for user if needed
    if (!this.queue.has(userId)) {
      this.queue.set(userId, []);
      this.processing.set(userId, new Set());
    }

    const userQueue = this.queue.get(userId)!;
    const queueId = `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const queueItem: QueueItem = {
      queueId,
      projectId,
      userId,
      position: userQueue.length + 1,
      status: 'pending',
      retryCount: 0,
    };

    // Insert based on priority
    if (priority === 'high') {
      userQueue.unshift(queueItem);
    } else if (priority === 'normal') {
      // Insert after high priority items
      const lastHighIndex = userQueue.findIndex(q => q.status === 'processing') || 0;
      userQueue.splice(lastHighIndex + 1, 0, queueItem);
    } else {
      userQueue.push(queueItem);
    }

    // Reindex positions
    this.reindexQueuePositions(userId);

    // Try to start processing
    await this.processQueue(userId);

    return queueItem;
  }

  /**
   * Process queue (start processing up to 3 projects)
   */
  async processQueue(userId: string): Promise<void> {
    const userQueue = this.queue.get(userId);
    const processing = this.processing.get(userId);

    if (!userQueue || !processing) return;

    // Get pending items
    const pending = userQueue.filter(q => q.status === 'pending');

    // Process up to maxConcurrent
    for (const item of pending) {
      if (processing.size >= this.maxConcurrent) break;

      item.status = 'processing';
      item.startedAt = new Date();
      item.estimatedStartTime = new Date();

      processing.add(item.projectId);

      // Emit processing event
      this.emit('project-start', {
        queueId: item.queueId,
        projectId: item.projectId,
        userId,
      });

      // Process project asynchronously
      this.processProject(userId, item).catch(error => {
        console.error('Project processing error:', error);
        item.status = 'failed';
        item.errorMessage = (error as Error).message;
      });
    }
  }

  /**
   * Process individual project
   */
  private async processProject(userId: string, queueItem: QueueItem): Promise<void> {
    try {
      // Simulate processing with delays
      await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second simulation

      // Mark as completed
      queueItem.status = 'completed';
      queueItem.completedAt = new Date();

      this.emit('project-complete', {
        queueId: queueItem.queueId,
        projectId: queueItem.projectId,
        userId,
      });

      // Remove from processing and continue queue
      const processing = this.processing.get(userId);
      if (processing) {
        processing.delete(queueItem.projectId);
      }

      // Process next item in queue
      await this.processQueue(userId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get queue status for user
   */
  getQueueStatus(userId: string) {
    const userQueue = this.queue.get(userId) || [];
    const processing = this.processing.get(userId) || new Set();

    const stats = {
      total: userQueue.length,
      processing: processing.size,
      pending: userQueue.filter(q => q.status === 'pending').length,
      completed: userQueue.filter(q => q.status === 'completed').length,
      failed: userQueue.filter(q => q.status === 'failed').length,
      items: userQueue,
    };

    return stats;
  }

  /**
   * Get specific queue item
   */
  getQueueItem(userId: string, queueId: string): QueueItem | undefined {
    const userQueue = this.queue.get(userId) || [];
    return userQueue.find(q => q.queueId === queueId);
  }

  /**
   * Cancel queue item
   */
  cancelQueueItem(userId: string, queueId: string): boolean {
    const userQueue = this.queue.get(userId);
    if (!userQueue) return false;

    const index = userQueue.findIndex(q => q.queueId === queueId);
    if (index === -1) return false;

    const item = userQueue[index];

    // Can only cancel if not already processing
    if (item.status === 'processing') {
      return false;
    }

    userQueue.splice(index, 1);
    this.reindexQueuePositions(userId);

    this.emit('queue-cancelled', {
      queueId,
      projectId: item.projectId,
      userId,
    });

    return true;
  }

  /**
   * Prioritize queue item
   */
  prioritizeQueueItem(userId: string, queueId: string): boolean {
    const userQueue = this.queue.get(userId);
    if (!userQueue) return false;

    const index = userQueue.findIndex(q => q.queueId === queueId);
    if (index <= 0) return false;

    const item = userQueue.splice(index, 1)[0];
    userQueue.unshift(item);

    this.reindexQueuePositions(userId);

    this.emit('queue-prioritized', {
      queueId,
      projectId: item.projectId,
      userId,
    });

    return true;
  }

  /**
   * Reindex queue positions
   */
  private reindexQueuePositions(userId: string): void {
    const userQueue = this.queue.get(userId);
    if (!userQueue) return;

    userQueue.forEach((item, index) => {
      item.position = index + 1;
    });
  }

  /**
   * Get next project to process for user
   */
  getNextProject(userId: string): QueueItem | undefined {
    const userQueue = this.queue.get(userId) || [];
    return userQueue.find(q => q.status === 'pending');
  }

  /**
   * Get processing projects for user
   */
  getProcessingProjects(userId: string): QueueItem[] {
    const userQueue = this.queue.get(userId) || [];
    return userQueue.filter(q => q.status === 'processing');
  }

  /**
   * Clear completed projects
   */
  clearCompletedProjects(userId: string): number {
    const userQueue = this.queue.get(userId);
    if (!userQueue) return 0;

    const initialLength = userQueue.length;
    const filtered = userQueue.filter(q => q.status !== 'completed' && q.status !== 'failed');

    this.queue.set(userId, filtered);
    this.reindexQueuePositions(userId);

    return initialLength - filtered.length;
  }
}

export default ProjectQueueManager;
