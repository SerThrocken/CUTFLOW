// ============================================================
//  CutFlow Mobile — Root App Component
//  Sets up navigation, global state, and theme
// ============================================================

import React, { useEffect, useState } from 'react';
import { StatusBar, LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Screens
import HomeScreen          from './screens/HomeScreen';
import EditorScreen        from './screens/EditorScreen';
import RemoteScreen        from './screens/RemoteScreen';
import ProjectsScreen      from './screens/ProjectsScreen';
import MarketplaceScreen   from './screens/MarketplaceScreen';
import SocialShareScreen   from './screens/SocialShareScreen';
import MessagingScreen     from './screens/MessagingScreen';
import SetupWizardScreen   from './screens/SetupWizardScreen';
import AudioLibraryScreen  from './screens/AudioLibraryScreen';
import SettingsScreen      from './screens/SettingsScreen';

// Theme colors — TLG3D dark palette
export const COLORS = {
  background:  '#0F0F0F',
  surface:     '#1A1A1A',
  card:        '#222222',
  border:      '#2A2A2A',
  primary:     '#4FD97D',  // muted green
  accent:      '#D4A574',  // muted gold
  text:        '#E0E0E0',
  textMuted:   '#888888',
  error:       '#EF4444',
  warning:     '#F59E0B',
  success:     '#10B981',
  tabBar:      '#151515',
};

LogBox.ignoreLogs(['Non-serializable values were found in the navigation state']);

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

// ── Bottom Tab Navigator ──────────────────────────────────────

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown:     false,
        tabBarStyle: {
          backgroundColor: COLORS.tabBar,
          borderTopColor:  COLORS.border,
          borderTopWidth:  1,
          height:          60,
          paddingBottom:   8,
        },
        tabBarActiveTintColor:   COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      }}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: 'Home', tabBarIcon: ({ color }) => TabIcon('🏠', color) }}
      />
      <Tab.Screen
        name="Projects"
        component={ProjectsScreen}
        options={{ tabBarLabel: 'Projects', tabBarIcon: ({ color }) => TabIcon('📁', color) }}
      />
      <Tab.Screen
        name="Editor"
        component={EditorScreen}
        options={{ tabBarLabel: 'Editor', tabBarIcon: ({ color }) => TabIcon('✂️', color) }}
      />
      <Tab.Screen
        name="Remote"
        component={RemoteScreen}
        options={{ tabBarLabel: 'Remote', tabBarIcon: ({ color }) => TabIcon('🖥️', color) }}
      />
      <Tab.Screen
        name="Marketplace"
        component={MarketplaceScreen}
        options={{ tabBarLabel: 'Skills', tabBarIcon: ({ color }) => TabIcon('🛒', color) }}
      />
    </Tab.Navigator>
  );
}

// ── Root App ──────────────────────────────────────────────────

export default function App() {
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('setup_complete').then(val => {
      setIsFirstLaunch(val === null);
    });
  }, []);

  if (isFirstLaunch === null) return null; // Splash screen visible

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar
          barStyle="light-content"
          backgroundColor={COLORS.background}
        />
        <NavigationContainer
          theme={{
            dark: true,
            colors: {
              primary:       COLORS.primary,
              background:    COLORS.background,
              card:          COLORS.surface,
              text:          COLORS.text,
              border:        COLORS.border,
              notification:  COLORS.primary,
            },
          }}>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {isFirstLaunch ? (
              <Stack.Screen name="SetupWizard" component={SetupWizardScreen} />
            ) : (
              <>
                <Stack.Screen name="Main"        component={TabNavigator} />
                <Stack.Screen name="SocialShare" component={SocialShareScreen}
                  options={{ presentation: 'modal' }} />
                <Stack.Screen name="Messaging"   component={MessagingScreen}
                  options={{ presentation: 'modal' }} />
                <Stack.Screen name="AudioLibrary" component={AudioLibraryScreen}
                  options={{ presentation: 'modal' }} />
                <Stack.Screen name="Settings" component={SettingsScreen} />
              </>
            )}
          </Stack.Navigator>
        </NavigationContainer>
        <Toast />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

// ── Helpers ───────────────────────────────────────────────────

import { Text } from 'react-native';

function TabIcon(emoji: string, color: string) {
  return (
    <Text style={{ fontSize: 20, opacity: color === COLORS.primary ? 1 : 0.5 }}>
      {emoji}
    </Text>
  );
}
