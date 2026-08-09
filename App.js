import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Platform, SafeAreaView } from 'react-native';

import AuthProvider from './src/providers/AuthProvider';
import ApiProvider from './src/providers/ApiProvider';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import WalletConnectScreen from './src/Transactions/WalletConnectScreen';
import SplashScreen from './src/SplashScreen/SplashScreen';
import LoginScreen from './src/Auth/LoginScreen';
import SignupScreen from './src/Auth/SignupScreen';
import WalletSetupScreen from './src/WalletSetup/WalletSetupScreen';
import HomeScreen from './src/Home/HomeScreen';
import ActivityScreen from './src/Activity/ActivityScreen';
import ProfileScreen from './src/Profile/ProfileScreen';
import ScanScreen from './src/Scan/ScanScreen';
import SendScreen from './src/Transactions/SendScreen';
import ReceiveScreen from './src/Transactions/ReceiveScreen';
import PayScreen from './src/Transactions/PayScreen';
import NfcTransferScreen from './src/Transactions/NfcTransferScreen';
import NotificationScreen from './src/Notifications/NotificationScreen';

// Navigator lives INSIDE AuthProvider so useAuth works everywhere
const Navigator = () => {
  const [screen, setScreen] = useState('Splash');
  const { theme, mode } = useTheme();
  const goTo = (name) => setScreen(name);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background, paddingTop: Platform.OS === 'android' ? 40 : 50 }}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      {screen === 'Splash' && <SplashScreen goTo={goTo} />}
      {screen === 'Login' && <LoginScreen goTo={goTo} />}
      {screen === 'Signup' && <SignupScreen goTo={goTo} />}
      {screen === 'WalletSetup' && <WalletSetupScreen goTo={goTo} />}
      {screen === 'Home' && <HomeScreen goTo={goTo} />}
      {screen === 'Activity' && <ActivityScreen goTo={goTo} />}
      {screen === 'Profile' && <ProfileScreen goTo={goTo} />}
      {screen === 'Scan' && <ScanScreen goTo={goTo} />}
      {screen === 'Send' && <SendScreen goTo={goTo} />}
      {screen === 'Receive' && <ReceiveScreen goTo={goTo} />}
      {screen === 'Pay' && <PayScreen goTo={goTo} />}
      {screen === 'NfcTransfer' && <NfcTransferScreen goTo={goTo} />}
      {screen === 'Notification' && <NotificationScreen goTo={goTo} />}
      {screen === 'WalletConnect' && <WalletConnectScreen goTo={goTo} />}
    </SafeAreaView>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <ApiProvider>
        <AuthProvider>
          <Navigator />
        </AuthProvider>
      </ApiProvider>
    </ThemeProvider>
  );
}