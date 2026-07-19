// ===== USER & PROJECT FOLDER STRUCTURE SYSTEM =====

import path from 'path';
import fs from 'fs';
import os from 'os';

export interface UserProfile {
  userId: string;           // discord_123456 or telegram_987654
  platform: 'discord' | 'telegram' | 'slack' | 'sms' | 'imessage';
  username: string;         // serthrocken, megan, etc.
  displayName: string;      // Full name or nickname
  email?: string;
  createdAt: Date;
  totalProjects: number;
  activeProjects: number;
  storageUsed: number;      // in MB
}

export interface VideoProject {
  projectId: string;        // project_1234567890
  userId: string;
  projectName: string;      // "Summer Campaign 2024"
  description?: string;
  status: 'draft' | 'in_progress' | 'processing' | 'completed' | 'archived';
  duration?: number;        // in seconds
  resolution: string;       // 1080p, 4k, etc.
  fps: number;              // 24, 30, 60
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  estimatedCompletion?: Date;
  priority: 'low' | 'normal' | 'high';
  assets: ProjectAsset[];
  progress: number;         // 0-100
}

export interface ProjectAsset {
  assetId: string;
  type: 'video' | 'audio' | 'image' | 'script' | 'subtitle';
  filename: string;
  path: string;
  size: number;            // in bytes
  uploadedAt: Date;
  processed: boolean;
}

export interface QueueItem {
  queueId: string;
  projectId: string;
  userId: string;
  position: number;        // 1, 2, or 3 (max concurrent)
  status: 'pending' | 'processing' | 'completed' | 'failed';
  estimatedStartTime?: Date;
  startedAt?: Date;
  completedAt?: Date;
  errorMessage?: string;
  retryCount: number;
}

// ===== FOLDER STRUCTURE HIERARCHY =====

export class FolderStructureManager {
  private dataDir: string;

  constructor(baseDataDir: string = './data') {
    this.dataDir = baseDataDir;
    this.ensureBaseDirExists();
  }

  private ensureBaseDirExists() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  /**
   * Folder structure:
   * ./data/
   *   ├── users/
   *   │   ├── {username}_{userId}/
   *   │   │   ├── profile.json
   *   │   │   ├── projects/
   *   │   │   │   ├── {projectName}_{projectId}/
   *   │   │   │   │   ├── project.json
   *   │   │   │   │   ├── assets/
   *   │   │   │   │   │   ├── videos/
   *   │   │   │   │   │   ├── audio/
   *   │   │   │   │   │   ├── images/
   *   │   │   │   │   │   └── scripts/
   *   │   │   │   │   ├── processing/
   *   │   │   │   │   ├── output/
   *   │   │   │   │   └── cache/
   *   │   │   │   └── ...more projects
   *   │   │   └── queue.json
   */

  /**
   * Create user directory structure
   */
  createUserDirectory(user: UserProfile): string {
    const userFolderName = `${user.username}_${user.userId}`;
    const userPath = path.join(this.dataDir, 'users', userFolderName);

    // Create directory if not exists
    if (!fs.existsSync(userPath)) {
      fs.mkdirSync(userPath, { recursive: true });

      // Create subdirectories
      fs.mkdirSync(path.join(userPath, 'projects'), { recursive: true });
      fs.mkdirSync(path.join(userPath, 'conversations'), { recursive: true });
      fs.mkdirSync(path.join(userPath, 'settings'), { recursive: true });

      // Save profile metadata
      fs.writeFileSync(
        path.join(userPath, 'profile.json'),
        JSON.stringify(user, null, 2)
      );
    }

    return userPath;
  }

  /**
   * Create project directory structure
   */
  createProjectDirectory(user: UserProfile, project: VideoProject): string {
    const userPath = this.createUserDirectory(user);
    const projectFolderName = `${project.projectName.replace(/\s+/g, '_')}_${project.projectId}`;
    const projectPath = path.join(userPath, 'projects', projectFolderName);

    if (!fs.existsSync(projectPath)) {
      fs.mkdirSync(projectPath, { recursive: true });

      // Create subdirectories
      fs.mkdirSync(path.join(projectPath, 'assets', 'videos'), { recursive: true });
      fs.mkdirSync(path.join(projectPath, 'assets', 'audio'), { recursive: true });
      fs.mkdirSync(path.join(projectPath, 'assets', 'images'), { recursive: true });
      fs.mkdirSync(path.join(projectPath, 'assets', 'scripts'), { recursive: true });
      fs.mkdirSync(path.join(projectPath, 'processing'), { recursive: true });
      fs.mkdirSync(path.join(projectPath, 'output'), { recursive: true });
      fs.mkdirSync(path.join(projectPath, 'cache'), { recursive: true });

      // Save project metadata
      fs.writeFileSync(
        path.join(projectPath, 'project.json'),
        JSON.stringify(project, null, 2)
      );
    }

    return projectPath;
  }

  /**
   * Get user directory
   */
  getUserDirectory(userId: string, username: string): string {
    const userFolderName = `${username}_${userId}`;
    return path.join(this.dataDir, 'users', userFolderName);
  }

  /**
   * Get project directory
   */
  getProjectDirectory(userId: string, username: string, projectId: string, projectName: string): string {
    const userDir = this.getUserDirectory(userId, username);
    const projectFolderName = `${projectName.replace(/\s+/g, '_')}_${projectId}`;
    return path.join(userDir, 'projects', projectFolderName);
  }

  /**
   * List all users
   */
  listAllUsers(): UserProfile[] {
    const usersPath = path.join(this.dataDir, 'users');
    if (!fs.existsSync(usersPath)) return [];

    const userFolders = fs.readdirSync(usersPath);
    const users: UserProfile[] = [];

    for (const folder of userFolders) {
      const profilePath = path.join(usersPath, folder, 'profile.json');
      if (fs.existsSync(profilePath)) {
        const profile = JSON.parse(fs.readFileSync(profilePath, 'utf-8'));
        users.push(profile);
      }
    }

    return users;
  }

  /**
   * List all projects for a user
   */
  listUserProjects(userId: string, username: string): VideoProject[] {
    const userDir = this.getUserDirectory(userId, username);
    const projectsPath = path.join(userDir, 'projects');

    if (!fs.existsSync(projectsPath)) return [];

    const projectFolders = fs.readdirSync(projectsPath);
    const projects: VideoProject[] = [];

    for (const folder of projectFolders) {
      const projectPath = path.join(projectsPath, folder, 'project.json');
      if (fs.existsSync(projectPath)) {
        const project = JSON.parse(fs.readFileSync(projectPath, 'utf-8'));
        projects.push(project);
      }
    }

    return projects.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  /**
   * Get total storage used by user
   */
  getUserStorageUsed(userId: string, username: string): number {
    const userDir = this.getUserDirectory(userId, username);
    return this.calculateDirSize(userDir);
  }

  /**
   * Calculate directory size recursively
   */
  private calculateDirSize(dirPath: string): number {
    if (!fs.existsSync(dirPath)) return 0;

    let size = 0;
    const files = fs.readdirSync(dirPath);

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        size += this.calculateDirSize(filePath);
      } else {
        size += stat.size;
      }
    }

    return size;
  }

  /**
   * Archive project (move to archive folder)
   */
  archiveProject(userId: string, username: string, projectId: string, projectName: string): boolean {
    try {
      const userDir = this.getUserDirectory(userId, username);
      const projectPath = path.join(userDir, 'projects', `${projectName.replace(/\s+/g, '_')}_${projectId}`);
      const archiveDir = path.join(userDir, 'archive');

      if (!fs.existsSync(archiveDir)) {
        fs.mkdirSync(archiveDir, { recursive: true });
      }

      const archivePath = path.join(archiveDir, `${projectName.replace(/\s+/g, '_')}_${projectId}`);
      fs.renameSync(projectPath, archivePath);

      return true;
    } catch (error) {
      console.error('Archive failed:', error);
      return false;
    }
  }

  /**
   * Delete project
   */
  deleteProject(userId: string, username: string, projectId: string, projectName: string): boolean {
    try {
      const projectPath = this.getProjectDirectory(userId, username, projectId, projectName);
      if (fs.existsSync(projectPath)) {
        fs.rmSync(projectPath, { recursive: true, force: true });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Delete failed:', error);
      return false;
    }
  }
}

export default FolderStructureManager;
