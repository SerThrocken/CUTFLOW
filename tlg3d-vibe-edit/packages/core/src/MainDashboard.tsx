// ===== MAIN DASHBOARD LAYOUT COMPONENT =====

import React, { useState, useEffect } from 'react';
import { Button, Card, Input, Alert, Modal, Badge, Progress } from '@tlg3d/core/ui-components';
import ThemeCustomizer from '@tlg3d/core/ThemeCustomizer';

interface DashboardMetrics {
  totalProjects: number;
  totalUsers: number;
  videosProcessed: number;
  storageUsed: number;
}

export const MainDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalProjects: 0,
    totalUsers: 0,
    videosProcessed: 0,
    storageUsed: 0,
  });

  const [selectedTab, setSelectedTab] = useState<'overview' | 'projects' | 'settings' | 'theme'>('overview');
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch metrics
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/dashboard/metrics');
      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Navigation Bar */}
      <nav className="bg-gray-800 border-b border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center font-bold">
                TLG
              </div>
              <h1 className="text-2xl font-bold text-green-400">CutFlow</h1>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm">
                📚 Docs
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowThemeModal(true)}>
                🎨 Theme
              </Button>
              <Button variant="ghost" size="sm">
                👤 Profile
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="mb-8 flex gap-4 border-b border-gray-800">
          {(['overview', 'projects', 'settings', 'theme'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`px-4 py-3 font-medium transition-colors capitalize ${
                selectedTab === tab
                  ? 'text-green-400 border-b-2 border-green-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {selectedTab === 'overview' && (
          <div className="space-y-6">
            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <div className="text-sm text-gray-400 mb-2">Projects</div>
                <div className="text-3xl font-bold text-green-400">{metrics.totalProjects}</div>
                <Progress value={75} max={100} showLabel={false} />
              </Card>

              <Card>
                <div className="text-sm text-gray-400 mb-2">Active Users</div>
                <div className="text-3xl font-bold text-green-400">{metrics.totalUsers}</div>
                <Badge variant="success" size="sm" className="mt-2">
                  +12% this month
                </Badge>
              </Card>

              <Card>
                <div className="text-sm text-gray-400 mb-2">Videos Processed</div>
                <div className="text-3xl font-bold text-amber-400">{metrics.videosProcessed}</div>
                <p className="text-xs text-gray-500 mt-2">Last 30 days</p>
              </Card>

              <Card>
                <div className="text-sm text-gray-400 mb-2">Storage Used</div>
                <div className="text-3xl font-bold text-green-400">{metrics.storageUsed}%</div>
                <Progress value={metrics.storageUsed} max={100} showLabel={false} />
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <h2 className="text-xl font-semibold mb-4 text-gray-100">Recent Activity</h2>
              <div className="space-y-3">
                {[
                  { action: 'Project Created', project: 'Summer Promo Video', time: '2 hours ago' },
                  { action: 'Script Generated', project: 'Product Demo', time: '4 hours ago' },
                  { action: 'Video Exported', project: 'Brand Intro', time: '1 day ago' },
                ].map((activity, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-100">{activity.action}</p>
                      <p className="text-sm text-gray-400">{activity.project}</p>
                    </div>
                    <span className="text-sm text-gray-500">{activity.time}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Projects Tab */}
        {selectedTab === 'projects' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-100">Your Projects</h2>
              <Button variant="primary" size="md">
                ✨ New Project
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {['Summer Campaign', 'Product Demo', 'Brand Story'].map((project, i) => (
                <Card key={i}>
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-100">{project}</h3>
                    <p className="text-sm text-gray-400">Last edited 2 days ago</p>
                  </div>
                  <div className="mb-4">
                    <div className="text-xs text-gray-400 mb-2">Progress</div>
                    <Progress value={65} max={100} showLabel={false} />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" className="flex-1">
                      Export
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {selectedTab === 'settings' && (
          <div className="space-y-6 max-w-2xl">
            <Card>
              <h2 className="text-xl font-semibold mb-6 text-gray-100">Account Settings</h2>

              <div className="space-y-4">
                <Input
                  label="Username"
                  type="text"
                  defaultValue="serthrocken"
                  disabled
                />

                <Input
                  label="Email"
                  type="email"
                  defaultValue="contact@cutflow.dev"
                  disabled
                />

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">
                    Connected Platforms
                  </label>
                  <div className="space-y-2">
                    {['Discord', 'Telegram', 'Slack'].map(platform => (
                      <div key={platform} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                        <span className="text-gray-300">{platform}</span>
                        <Badge variant="success" size="sm">
                          Connected
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <Input
                  label="API Keys"
                  type="password"
                  placeholder="••••••••••"
                  disabled
                />

                <Button variant="secondary" size="md">
                  Rotate API Keys
                </Button>
              </div>
            </Card>

            <Alert type="warning" icon="⚠️" dismissible>
              <p className="font-medium">Sensitive Operation</p>
              <p className="text-sm">Changing these settings may affect connected services.</p>
            </Alert>
          </div>
        )}

        {/* Theme Customizer Modal */}
        <Modal isOpen={showThemeModal} onClose={() => setShowThemeModal(false)} title="Customize Theme" size="lg">
          <ThemeCustomizer />
        </Modal>
      </div>
    </div>
  );
};

export default MainDashboard;
