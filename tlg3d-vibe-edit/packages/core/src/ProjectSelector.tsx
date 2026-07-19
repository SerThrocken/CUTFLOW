// ===== PROJECT SELECTOR & MANAGEMENT COMPONENT =====

import React, { useState, useEffect } from 'react';
import { Button, Card, Badge, Alert, Modal, Input, Progress } from '@tlg3d/core/ui-components';
import type { VideoProject, UserProfile } from '@tlg3d/core/folder-structure';

interface ProjectSelectorProps {
  user: UserProfile;
  onProjectSelect?: (project: VideoProject) => void;
  onCreateProject?: () => void;
}

interface ProjectWithQueue {
  project: VideoProject;
  queuePosition?: number;
  queueStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  estimatedTime?: number;
}

export const ProjectSelector: React.FC<ProjectSelectorProps> = ({
  user,
  onProjectSelect,
  onCreateProject,
}) => {
  const [projects, setProjects] = useState<ProjectWithQueue[]>([]);
  const [selectedProject, setSelectedProject] = useState<VideoProject | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [loading, setLoading] = useState(true);
  const [queueStats, setQueueStats] = useState<any>(null);

  useEffect(() => {
    fetchProjects();
    const interval = setInterval(fetchProjects, 3000); // Refresh every 3 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch(`/api/projects/${user.userId}`);
      const data = await response.json();
      setProjects(data.projects || []);
      setQueueStats(data.queueStats);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;

    try {
      const response = await fetch('/api/projects/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.userId,
          username: user.username,
          projectName: newProjectName,
        }),
      });

      if (response.ok) {
        setNewProjectName('');
        setShowCreateModal(false);
        await fetchProjects();
        onCreateProject?.();
      }
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  const handleSelectProject = (project: VideoProject) => {
    setSelectedProject(project);
    onProjectSelect?.(project);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'processing':
        return 'primary';
      case 'failed':
        return 'error';
      case 'draft':
        return 'accent';
      default:
        return 'primary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return '✓';
      case 'processing':
        return '⏳';
      case 'failed':
        return '✗';
      case 'draft':
        return '📝';
      default:
        return '•';
    }
  };

  return (
    <div className="space-y-6">
      {/* User Info & Queue Stats */}
      <div className="bg-gradient-to-r from-green-900 to-green-800 rounded-lg p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1">{user.displayName || user.username}</h2>
            <p className="text-green-100">@{user.username}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-green-100">Total Projects</p>
            <p className="text-2xl font-bold">{projects.length}</p>
          </div>
        </div>

        {/* Queue Stats */}
        {queueStats && (
          <div className="mt-4 grid grid-cols-4 gap-2 text-sm">
            <div>
              <p className="text-green-100">Processing</p>
              <p className="text-lg font-bold">{queueStats.processing} / 3</p>
            </div>
            <div>
              <p className="text-green-100">Pending</p>
              <p className="text-lg font-bold">{queueStats.pending}</p>
            </div>
            <div>
              <p className="text-green-100">Completed</p>
              <p className="text-lg font-bold">{queueStats.completed}</p>
            </div>
            <div>
              <p className="text-green-100">Failed</p>
              <p className="text-lg font-bold">{queueStats.failed}</p>
            </div>
          </div>
        )}
      </div>

      {/* Create Project Button */}
      <div className="flex gap-3">
        <Button
          onClick={() => setShowCreateModal(true)}
          variant="primary"
          size="lg"
          icon="✨"
          className="flex-1"
        >
          Create New Project
        </Button>
        <Button
          onClick={fetchProjects}
          variant="secondary"
          size="lg"
          icon="🔄"
        >
          Refresh
        </Button>
      </div>

      {/* Processing Limit Alert */}
      {queueStats?.processing === 3 && (
        <Alert type="warning" icon="⚠️" dismissible>
          <p className="font-medium">Max Projects Processing</p>
          <p className="text-sm">
            You're currently processing 3 projects (the maximum). Wait for one to complete before starting another.
          </p>
        </Alert>
      )}

      {/* Projects Grid */}
      <div>
        <h3 className="text-lg font-semibold text-gray-100 mb-4">Your Projects</h3>

        {loading ? (
          <div className="text-center text-gray-400">Loading projects...</div>
        ) : projects.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <p className="text-2xl mb-2">🎬</p>
              <p className="text-gray-300 font-medium">No projects yet</p>
              <p className="text-sm text-gray-500 mt-1">Create your first project to get started</p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map(pw => (
              <div
                key={wp.project.projectId}
                onClick={() => handleSelectProject(wp.project)}
                className={`cursor-pointer transition-all ${
                  selectedProject?.projectId === wp.project.projectId ? 'ring-2 ring-green-600' : ''
                }`}
              >
                <Card>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-100 line-clamp-2">
                        {wp.project.projectName}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(wp.project.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge
                      variant={getStatusColor(wp.project.status) as any}
                      size="sm"
                    >
                      {getStatusIcon(wp.project.status)} {wp.project.status}
                    </Badge>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <Progress value={wp.project.progress} max={100} showLabel={false} />
                  </div>

                  {/* Queue Position */}
                  {wp.queueStatus === 'pending' && (
                    <div className="bg-amber-900 bg-opacity-30 rounded p-2 mb-3 text-xs text-amber-300">
                      📍 Position #{wp.queuePosition} in queue
                    </div>
                  )}

                  {wp.queueStatus === 'processing' && (
                    <div className="bg-green-900 bg-opacity-30 rounded p-2 mb-3 text-xs text-green-300">
                      ⏳ Now processing... Est. {wp.estimatedTime || '5-10'} min
                    </div>
                  )}

                  {/* Project Info */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-400 mb-3">
                    <div>
                      <span className="text-gray-500">Resolution:</span>
                      <p className="text-gray-300 font-medium">{wp.project.resolution}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">FPS:</span>
                      <p className="text-gray-300 font-medium">{wp.project.fps}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      className="flex-1"
                      onClick={e => {
                        e.stopPropagation();
                        handleSelectProject(wp.project);
                      }}
                    >
                      Open
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={e => {
                        e.stopPropagation();
                        // Archive/delete logic
                      }}
                    >
                      ⋯
                    </Button>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New Project">
        <div className="space-y-4">
          <Input
            label="Project Name"
            type="text"
            placeholder="e.g., Summer Campaign 2024"
            value={newProjectName}
            onChange={e => setNewProjectName(e.target.value)}
            icon="🎬"
          />

          <div className="flex gap-3 justify-end">
            <Button onClick={() => setShowCreateModal(false)} variant="secondary">
              Cancel
            </Button>
            <Button
              onClick={handleCreateProject}
              variant="primary"
              disabled={!newProjectName.trim()}
            >
              Create Project
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProjectSelector;
