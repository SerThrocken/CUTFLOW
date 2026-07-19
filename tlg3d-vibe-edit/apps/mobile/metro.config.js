const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration for CutFlow
 * Produces the JS bundle consumed by both the iOS IPA and Android APK builds.
 */
const config = {
  resolver: {
    assetExts: [
      'bin', 'txt', 'jpg', 'png', 'gif', 'webp', 'svg',
      'mp4', 'mov', 'mp3', 'wav', 'aac', 'ttf', 'otf',
      'lottie', 'json', 'db',
    ],
    sourceExts: ['js', 'jsx', 'ts', 'tsx', 'json', 'cjs', 'mjs'],
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
