// ===== THEME CUSTOMIZER DASHBOARD COMPONENT (REFINED) =====

import React, { useState, useEffect } from 'react';
import { ThemeConfig, DEFAULT_TLG3D_THEME, THEME_PRESETS, generateThemeCSS } from '../theme';

interface ThemeCustomizerProps {
  onThemeChange?: (theme: ThemeConfig) => void;
  onSave?: (theme: ThemeConfig) => void;
}

export const ThemeCustomizer: React.FC<ThemeCustomizerProps> = ({ onThemeChange, onSave }) => {
  const [currentTheme, setCurrentTheme] = useState<ThemeConfig>(DEFAULT_TLG3D_THEME);
  const [selectedPreset, setSelectedPreset] = useState('tlg3d-default');
  const [customName, setCustomName] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Apply theme to DOM
  useEffect(() => {
    const themeCSS = generateThemeCSS(currentTheme);
    const styleId = 'tlg3d-theme-style';
    let style = document.getElementById(styleId) as HTMLStyleElement;

    if (!style) {
      style = document.createElement('style');
      style.id = styleId;
      document.head.appendChild(style);
    }

    style.textContent = themeCSS;
    onThemeChange?.(currentTheme);
  }, [currentTheme, onThemeChange]);

  const handlePresetChange = (presetId: string) => {
    setSelectedPreset(presetId);
    const preset = THEME_PRESETS[presetId];
    if (preset) {
      setCurrentTheme(preset);
    }
  };

  const handleColorChange = (colorKey: keyof ThemeConfig['colors'], value: string) => {
    setCurrentTheme(prev => ({
      ...prev,
      colors: {
        ...prev.colors,
        [colorKey]: value,
      },
    }));
  };

  const handleTypographyChange = (key: string, value: number | string) => {
    setCurrentTheme(prev => ({
      ...prev,
      typography: {
        ...prev.typography,
        [key]: value,
      },
    }));
  };

  const handleSaveTheme = () => {
    const newTheme = {
      ...currentTheme,
      id: `custom-${Date.now()}`,
      name: customName || `Custom Theme ${new Date().toLocaleDateString()}`,
      isDefault: false,
    };
    onSave?.(newTheme);
    setCustomName('');
  };

  return (
    <div className="w-full bg-gray-900 text-gray-100 p-6 rounded-lg border border-gray-800">
      <h2 className="text-2xl font-bold mb-6 text-green-400">🎨 Theme Customizer</h2>

      {/* Preset Selector */}
      <div className="mb-8">
        <label className="block text-sm font-medium mb-3 text-gray-300">
          Preset Themes
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {Object.entries(THEME_PRESETS).map(([id, preset]) => (
            <button
              key={id}
              onClick={() => handlePresetChange(id)}
              className={`p-4 rounded-lg border transition-all ${
                selectedPreset === id
                  ? 'border-green-600 bg-gray-800'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              <div className="text-sm font-medium mb-2 text-gray-300">{preset.name}</div>
              <div className="flex gap-2">
                <div
                  className="w-6 h-6 rounded"
                  style={{ backgroundColor: preset.colors.primary }}
                />
                <div
                  className="w-6 h-6 rounded"
                  style={{ backgroundColor: preset.colors.accent }}
                />
                <div
                  className="w-6 h-6 rounded border border-gray-600"
                  style={{ backgroundColor: preset.colors.background }}
                />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Color Customization */}
      <div className="mb-8">
        <label className="block text-sm font-medium mb-4 text-gray-300">
          Custom Colors
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(currentTheme.colors).map(([key, color]) => (
            <div key={key} className="flex flex-col gap-2">
              <label className="text-xs font-medium text-gray-400 capitalize">
                {key.replace(/([A-Z])/g, ' $1')}
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={e =>
                    handleColorChange(key as keyof ThemeConfig['colors'], e.target.value)
                  }
                  className="w-12 h-10 cursor-pointer rounded border border-gray-700"
                />
                <input
                  type="text"
                  value={color}
                  onChange={e =>
                    handleColorChange(key as keyof ThemeConfig['colors'], e.target.value)
                  }
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-xs text-gray-100"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Typography Settings */}
      <div className={`mb-8 ${showAdvanced ? '' : 'hidden'}`}>
        <label className="block text-sm font-medium mb-4 text-gray-300">
          Typography
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-400 block mb-2">
              Font Family
            </label>
            <select
              value={currentTheme.typography.fontFamily}
              onChange={e =>
                handleTypographyChange('fontFamily', e.target.value)
              }
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-xs text-gray-100"
            >
              <option>Inter, system-ui, sans-serif</option>
              <option>Helvetica, Arial, sans-serif</option>
              <option>Georgia, serif</option>
              <option>JetBrains Mono, monospace</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-400 block mb-2">
              Heading Size (px)
            </label>
            <input
              type="number"
              value={currentTheme.typography.headingSize}
              onChange={e =>
                handleTypographyChange('headingSize', parseInt(e.target.value))
              }
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-xs text-gray-100"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-400 block mb-2">
              Body Size (px)
            </label>
            <input
              type="number"
              value={currentTheme.typography.bodySize}
              onChange={e =>
                handleTypographyChange('bodySize', parseInt(e.target.value))
              }
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-xs text-gray-100"
            />
          </div>
        </div>
      </div>

      {/* Advanced Toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="text-sm text-green-400 hover:text-green-300 mb-4 flex items-center gap-2"
      >
        {showAdvanced ? '▼' : '▶'} Advanced Settings
      </button>

      {/* Preview */}
      <div className="mb-8 p-4 rounded-lg border border-gray-800 bg-gray-800">
        <h3 className="text-sm font-medium mb-3 text-gray-300">Preview</h3>
        <div className="space-y-3">
          <div
            className="p-4 rounded-lg"
            style={{ backgroundColor: currentTheme.colors.primary, color: '#0F0F0F' }}
          >
            <p className="font-semibold">Primary Button</p>
          </div>
          <div
            className="p-4 rounded-lg border"
            style={{
              backgroundColor: currentTheme.colors.surface,
              borderColor: currentTheme.colors.border,
              color: currentTheme.colors.text,
            }}
          >
            <p className="text-sm">Surface Card Content</p>
          </div>
        </div>
      </div>

      {/* Save Custom Theme */}
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Theme name (optional)"
          value={customName}
          onChange={e => setCustomName(e.target.value)}
          className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded text-gray-100 placeholder-gray-600"
        />
        <button
          onClick={handleSaveTheme}
          className="px-6 py-2 bg-green-600 text-gray-100 font-medium rounded hover:bg-green-500 transition-colors"
        >
          💾 Save Theme
        </button>
      </div>
    </div>
  );
};

export default ThemeCustomizer;
