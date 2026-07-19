// ============================================================
//  CutFlow Mobile — Main App Entry Point (React Native)
//  index.js — registered with AppRegistry, read by Metro bundler
// ============================================================

import { AppRegistry } from 'react-native';
import App from './src/App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
