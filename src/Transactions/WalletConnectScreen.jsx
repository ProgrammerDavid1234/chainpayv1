import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  StatusBar, Platform, ActivityIndicator, Alert, Animated, Easing, Linking,
} from 'react-native';
import * as ExpoLinking from 'expo-linking';
import { ArrowLeft, Shield, Wallet, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react-native';
import useAuth from '../hooks/useAuth';
import * as api from '../services/api';
import { getAuthToken } from '../services/api';

const BACKEND_URL = 'http://192.168.255.34:4000';

const WalletConnectScreen = ({ goTo }) => {
  const { updateWallet } = useAuth();
  const [phase, setPhase]       = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const fadeAnim    = useRef(new Animated.Value(0)).current;
  const slideAnim   = useRef(new Animated.Value(30)).current;
  const pulseAnim   = useRef(new Animated.Value(1)).current;
  const deepLinkSub = useRef(null);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, easing: Easing.out(Easing.back(1.1)), useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (phase !== 'idle' && phase !== 'error') return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.04, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1,    duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [phase]);

  useEffect(() => {
    const handleUrl = ({ url }) => {
      if (!url) return;
      const parsed = ExpoLinking.parse(url);
      const path   = parsed.path || '';
      if (path.includes('wallet-connect')) {
        const { address, success, cancelled } = parsed.queryParams || {};
        if (cancelled === '1') { setPhase('idle'); return; }
        if (success === '1' && address) handleSuccess(address);
      }
    };
    deepLinkSub.current = Linking.addEventListener('url', handleUrl);
    Linking.getInitialURL().then((url) => { if (url) handleUrl({ url }); });
    return () => deepLinkSub.current?.remove();
  }, []);

  const startConnect = async () => {
    setPhase('fetching-nonce');
    setErrorMsg('');
    try {
      const token = getAuthToken();
      const { data } = await api.getWalletNonce();
      const redirectUrl = ExpoLinking.createURL('wallet-connect');
      const signingUrl =
        `${BACKEND_URL}/connect/?nonce=${encodeURIComponent(data.nonce)}` +
        `&token=${encodeURIComponent(token)}` +
        `&redirect=${encodeURIComponent(redirectUrl)}`;
      setPhase('waiting-browser');
      // Open in MetaMask's built-in dapp browser
      const mmUrl = 'https://metamask.app.link/dapp/' + signingUrl.replace('http://', '').replace('https://', '');
      await Linking.openURL(mmUrl);
    } catch (err) {
      const msg = err?.response?.data?.error || err?.response?.data || err.message || 'Unknown error';
      console.log('CONNECT ERROR:', JSON.stringify(err?.response?.data));
      console.log('CONNECT ERROR MSG:', err.message);
      console.log('CONNECT STATUS:', err?.response?.status);
      setPhase('error');
      setErrorMsg(String(msg));
    }
  };

  const handleSuccess = useCallback((address) => {
    updateWallet(address);
    setPhase('success');
    setTimeout(() => goTo('Home'), 1600);
  }, [updateWallet, goTo]);

  const isLoading = ['fetching-nonce', 'waiting-browser'].includes(phase);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#080B14" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} activeOpacity={0.7} onPress={() => goTo('WalletSetup')} disabled={isLoading}>
          <ArrowLeft color={isLoading ? 'rgba(255,255,255,0.3)' : '#FFFFFF'} size={20} strokeWidth={2.5} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Shield color="#2D6FF0" size={16} strokeWidth={2} />
          <Text style={styles.headerTitle}>Connect Wallet</Text>
        </View>
        <View style={{ width: 42 }} />
      </View>

      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.iconArea}>
          <View style={styles.iconOuter}>
            <View style={styles.iconInner}>
              {phase === 'success' ? <CheckCircle2 color="#10B981" size={36} strokeWidth={2} /> :
               phase === 'error'   ? <AlertCircle color="#EF4444" size={36} strokeWidth={2} /> :
               isLoading           ? <ActivityIndicator color="#2D6FF0" size="large" /> :
               <Wallet color="#2D6FF0" size={36} strokeWidth={2} />}
            </View>
          </View>
        </View>

        <Text style={styles.title}>
          {phase === 'success'         ? 'Wallet Connected!' :
           phase === 'error'           ? 'Connection Failed' :
           phase === 'waiting-browser' ? 'Complete in Browser' :
           phase === 'fetching-nonce'  ? 'Preparing…' :
           'Link Your Wallet'}
        </Text>
        <Text style={styles.subtitle}>
          {phase === 'success'         ? 'Redirecting to your dashboard…' :
           phase === 'error'           ? errorMsg :
           phase === 'waiting-browser' ? 'Finish connecting in the browser that just opened, then come back here.' :
           phase === 'fetching-nonce'  ? 'Generating secure nonce…' :
           'Your browser will open with a secure signing page. No ETH is spent.'}
        </Text>

        {phase === 'idle' && (
          <View style={styles.stepsBox}>
            <StepRow n="1" text="App opens a secure signing page in your browser" />
            <StepRow n="2" text="Connect MetaMask and sign the ownership message" />
            <StepRow n="3" text="Browser links wallet to your account, returns you here" />
          </View>
        )}

        {phase === 'waiting-browser' && (
          <View style={styles.waitingBox}>
            <ActivityIndicator color="#2D6FF0" size="small" />
            <Text style={styles.waitingText}>Waiting for browser to complete…</Text>
          </View>
        )}

        {phase === 'success' && (
          <View style={styles.successBox}>
            <Text style={styles.successText}>✓ Signature verified cryptographically</Text>
          </View>
        )}

        {(phase === 'idle' || phase === 'error') && (
          <Animated.View style={{ transform: [{ scale: pulseAnim }], width: '100%' }}>
            <TouchableOpacity style={styles.connectBtn} activeOpacity={0.85} onPress={startConnect}>
              <ExternalLink color="#FFFFFF" size={18} strokeWidth={2.5} style={{ marginRight: 8 }} />
              <Text style={styles.connectBtnText}>
                {phase === 'error' ? 'Try Again' : 'Open MetaMask Signing Page'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {phase === 'waiting-browser' && (
          <TouchableOpacity style={styles.cancelBtn} onPress={() => setPhase('idle')}>
            <Text style={styles.cancelBtnText}>← Start over</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </SafeAreaView>
  );
};

const StepRow = ({ n, text }) => (
  <View style={styles.stepRow}>
    <View style={styles.stepNum}><Text style={styles.stepNumText}>{n}</Text></View>
    <Text style={styles.stepText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080B14', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 8 : 0 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  backBtn: { width: 42, height: 42, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.07)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: -0.3 },
  content: { flex: 1, paddingHorizontal: 28, paddingTop: 48, alignItems: 'center' },
  iconArea: { marginBottom: 28 },
  iconOuter: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(45,111,240,0.08)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(45,111,240,0.15)' },
  iconInner: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(45,111,240,0.12)', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 26, fontWeight: '800', color: '#FFFFFF', textAlign: 'center', letterSpacing: -0.5, marginBottom: 10 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 21, marginBottom: 32, paddingHorizontal: 8 },
  stepsBox: { width: '100%', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', marginBottom: 32, gap: 16 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  stepNum: { width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(45,111,240,0.15)', borderWidth: 1, borderColor: 'rgba(45,111,240,0.3)', justifyContent: 'center', alignItems: 'center', marginTop: 1 },
  stepNumText: { color: '#2D6FF0', fontSize: 12, fontWeight: '700' },
  stepText: { flex: 1, color: 'rgba(255,255,255,0.55)', fontSize: 13, lineHeight: 19 },
  waitingBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(45,111,240,0.08)', borderWidth: 1, borderColor: 'rgba(45,111,240,0.2)', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 20, marginBottom: 28, width: '100%' },
  waitingText: { color: '#63B3FF', fontSize: 13, fontWeight: '600' },
  successBox: { backgroundColor: 'rgba(16,185,129,0.08)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.2)', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 20, marginBottom: 32, width: '100%', alignItems: 'center' },
  successText: { color: '#10B981', fontSize: 14, fontWeight: '600' },
  connectBtn: { backgroundColor: '#2D6FF0', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: 18, shadowColor: '#2D6FF0', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8, marginBottom: 16, width: '100%' },
  connectBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  cancelBtn: { paddingVertical: 12 },
  cancelBtnText: { color: 'rgba(255,255,255,0.3)', fontSize: 14 },
});

export default WalletConnectScreen;