import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, StatusBar, Animated, Easing,
  Dimensions, TextInput, Alert, Platform,
} from 'react-native';
import NfcManager, { NfcTech, Ndef } from 'react-native-nfc-manager';
import {
  Wifi, Send, Download, CheckCircle2,
  X, ChevronRight, Zap, AlertCircle,
} from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

// ─── My wallet address (replace with real auth context value) ─────────────────
const MY_WALLET = '0xAbCd...1234'; // pull from your AuthContext in real app

// ─── Ripple ring component ────────────────────────────────────────────────────
const RippleRing = ({ delay, size, color }) => {
  const scale   = useRef(new Animated.Value(0.6)).current;
  const opacity = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 2.2,
          duration: 2200,
          delay,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 2200,
          delay,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.ripple,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: color,
          opacity,
          transform: [{ scale }],
        },
      ]}
    />
  );
};

// ─── Orbit dot ───────────────────────────────────────────────────────────────
const OrbitDot = ({ angle, radius, active }) => {
  const rad = (angle * Math.PI) / 180;
  const x   = Math.cos(rad) * radius;
  const y   = Math.sin(rad) * radius;
  const pulseOp = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (active) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseOp, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseOp, { toValue: 0.3, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [active]);

  return (
    <Animated.View
      style={[
        styles.orbitDot,
        {
          transform: [{ translateX: x }, { translateY: y }],
          opacity: active ? pulseOp : 0.15,
          backgroundColor: active ? '#2D6FF0' : '#1E2D4A',
        },
      ]}
    />
  );
};

// ─── Status stages ────────────────────────────────────────────────────────────
const STAGE = {
  IDLE:        'idle',        // choose role
  SCANNING:    'scanning',    // NFC active, waiting for peer
  ROLE_CHOSEN: 'role_chosen', // role set, waiting for other phone
  CONNECTED:   'connected',   // NFC handshake done
  AMOUNT:      'amount',      // sender enters amount
  CONFIRMING:  'confirming',  // awaiting blockchain tx
  SUCCESS:     'success',     // tx confirmed
  ERROR:       'error',
};

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function NFCPayScreen({ goTo }) {
  const [stage,        setStage]        = useState(STAGE.IDLE);
  const [role,         setRole]         = useState(null);  
  const [peerWallet,   setPeerWallet]   = useState('');
  const [amount,       setAmount]       = useState('');
  const [txHash,       setTxHash]       = useState('');
  const [errorMsg,     setErrorMsg]     = useState('');
  const [nfcSupported, setNfcSupported] = useState(true);

  // Animations
  const ringRotate  = useRef(new Animated.Value(0)).current;
  const iconScale   = useRef(new Animated.Value(1)).current;
  const cardOp      = useRef(new Animated.Value(1)).current;
  const cardY       = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(0)).current;

  // ── Init NFC ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const checkNfc = async () => {
      const supported = await NfcManager.isSupported();
      setNfcSupported(supported);
      if (supported) await NfcManager.start();
    };
    checkNfc();
    return () => { NfcManager.cancelTechnologyRequest().catch(() => {}); };
  }, []);

  // ── Rotating orbit ring ───────────────────────────────────────────────────
  useEffect(() => {
    Animated.loop(
      Animated.timing(ringRotate, {
        toValue: 1,
        duration: 10000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  // ── Icon breathe when scanning ────────────────────────────────────────────
  useEffect(() => {
    if (stage === STAGE.SCANNING || stage === STAGE.ROLE_CHOSEN) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(iconScale, { toValue: 1.12, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(iconScale, { toValue: 1,    duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      ).start();
    } else {
      iconScale.stopAnimation();
      iconScale.setValue(1);
    }
  }, [stage]);

  // ── Card entrance ─────────────────────────────────────────────────────────
  const showCard = () => {
    cardOp.setValue(0);
    cardY.setValue(40);
    Animated.parallel([
      Animated.timing(cardOp, { toValue: 1, duration: 400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(cardY,  { toValue: 0, duration: 400, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }),
    ]).start();
  };

  // ── Success pop ───────────────────────────────────────────────────────────
  const popSuccess = () => {
    Animated.spring(successScale, {
      toValue: 1,
      tension: 60,
      friction: 6,
      useNativeDriver: true,
    }).start();
  };

  const ringRotateDeg = ringRotate.interpolate({
    inputRange: [0, 1], outputRange: ['0deg', '360deg'],
  });

  // ── Choose role ───────────────────────────────────────────────────────────
  const chooseRole = async (chosen) => {
    setRole(chosen);
    setStage(STAGE.SCANNING);
    showCard();

    try {
      if (chosen === 'receiver') {
        await writeNfcTag(MY_WALLET);
      } else {
        await readNfcTag();
      }
    } catch (e) {
      setErrorMsg(e.message || 'NFC failed. Try again.');
      setStage(STAGE.ERROR);
    }
  };

  // ── RECEIVER: write wallet address to NFC ─────────────────────────────────
  const writeNfcTag = async (walletAddress) => {
    await NfcManager.requestTechnology(NfcTech.Ndef);
    const bytes = Ndef.encodeMessage([
      Ndef.textRecord(JSON.stringify({ type: 'chainpay_v1', wallet: walletAddress })),
    ]);
    await NfcManager.ndefHandler.writeNdefMessage(bytes);
    await NfcManager.cancelTechnologyRequest();
    // After writing, wait for sender's confirmation ping via your SSE/backend
    setStage(STAGE.ROLE_CHOSEN);
    showCard();
  };

  // ── SENDER: read receiver's wallet from NFC ───────────────────────────────
  const readNfcTag = async () => {
    await NfcManager.requestTechnology(NfcTech.Ndef);
    const tag = await NfcManager.getTag();
    await NfcManager.cancelTechnologyRequest();

    const record  = tag?.ndefMessage?.[0];
    const payload = Ndef.text.decodePayload(new Uint8Array(record.payload));
    const data    = JSON.parse(payload);

    if (data.type !== 'chainpay_v1' || !data.wallet) {
      throw new Error('Invalid ChainPay NFC tag');
    }

    setPeerWallet(data.wallet);
    setStage(STAGE.AMOUNT);
    showCard();
  };

  // ── SENDER: confirm and send ──────────────────────────────────────────────
  const sendPayment = async () => {
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      Alert.alert('Invalid amount', 'Enter a valid amount to send.');
      return;
    }
    setStage(STAGE.CONFIRMING);
    showCard();

    try {
      // ── Replace this block with your real Web3/MetaMask call ──────────────
      // const provider = new ethers.BrowserProvider(window.ethereum);
      // const signer   = await provider.getSigner();
      // const contract = new ethers.Contract(PAYMENT_PROCESSOR_ADDR, ABI, signer);
      // const tx       = await contract.sendPayment(peerWallet, { value: ethers.parseEther(amount) });
      // const receipt  = await tx.wait();
      // setTxHash(receipt.hash);
      // ── Simulated 3-second confirmation ───────────────────────────────────
      await new Promise((r) => setTimeout(r, 3000));
      setTxHash('0xSim...TxHash');
      // ─────────────────────────────────────────────────────────────────────

      setStage(STAGE.SUCCESS);
      popSuccess();
    } catch (e) {
      setErrorMsg(e.message || 'Transaction failed.');
      setStage(STAGE.ERROR);
    }
  };

  const reset = () => {
    setStage(STAGE.IDLE);
    setRole(null);
    setPeerWallet('');
    setAmount('');
    setTxHash('');
    setErrorMsg('');
    successScale.setValue(0);
    NfcManager.cancelTechnologyRequest().catch(() => {});
    showCard();
  };

  // ── Colours per stage ─────────────────────────────────────────────────────
  const stageColor = {
    [STAGE.IDLE]:        '#2D6FF0',
    [STAGE.SCANNING]:    '#2D6FF0',
    [STAGE.ROLE_CHOSEN]: '#8B5CF6',
    [STAGE.CONNECTED]:   '#10B981',
    [STAGE.AMOUNT]:      '#F59E0B',
    [STAGE.CONFIRMING]:  '#2D6FF0',
    [STAGE.SUCCESS]:     '#10B981',
    [STAGE.ERROR]:       '#EF4444',
  }[stage] || '#2D6FF0';

  // ── Labels ────────────────────────────────────────────────────────────────
  const stageLabel = {
    [STAGE.IDLE]:        'Ready to connect',
    [STAGE.SCANNING]:    role === 'receiver' ? 'Waiting for sender…' : 'Hold near their phone…',
    [STAGE.ROLE_CHOSEN]: 'Waiting for sender to tap…',
    [STAGE.AMOUNT]:      'Enter amount',
    [STAGE.CONFIRMING]:  'Processing on blockchain…',
    [STAGE.SUCCESS]:     'Payment sent!',
    [STAGE.ERROR]:       'Something went wrong',
  }[stage];

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#060D1A" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => { reset(); goTo('Pay'); }} activeOpacity={0.7}>
          <X color="#FFFFFF" size={18} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tap to Pay</Text>
        <View style={[styles.headerBadge, { borderColor: stageColor + '40', backgroundColor: stageColor + '15' }]}>
          <View style={[styles.badgeDot, { backgroundColor: stageColor }]} />
          <Text style={[styles.badgeText, { color: stageColor }]}>
            {stage === STAGE.CONFIRMING ? 'On-chain' : 'NFC'}
          </Text>
        </View>
      </View>

      {/* ── NFC visual field ───────────────────────────────────────────────── */}
      <View style={styles.nfcField}>
        {/* Ripple rings — only when scanning */}
        {(stage === STAGE.SCANNING || stage === STAGE.ROLE_CHOSEN) && (
          <>
            <RippleRing delay={0}    size={160} color={stageColor} />
            <RippleRing delay={700}  size={160} color={stageColor} />
            <RippleRing delay={1400} size={160} color={stageColor} />
          </>
        )}

        {/* Rotating orbit ring */}
        <Animated.View style={[styles.orbitRing, { transform: [{ rotate: ringRotateDeg }] }]}>
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
            <OrbitDot
              key={i}
              angle={angle}
              radius={88}
              active={stage !== STAGE.IDLE && stage !== STAGE.SUCCESS}
            />
          ))}
        </Animated.View>

        {/* Centre icon */}
        <Animated.View
          style={[
            styles.nfcIconBox,
            {
              borderColor: stageColor + '60',
              shadowColor: stageColor,
              transform: [{ scale: iconScale }],
            },
          ]}
        >
          {stage === STAGE.SUCCESS ? (
            <Animated.View style={{ transform: [{ scale: successScale }] }}>
              <CheckCircle2 color="#10B981" size={44} strokeWidth={1.5} />
            </Animated.View>
          ) : stage === STAGE.ERROR ? (
            <AlertCircle color="#EF4444" size={44} strokeWidth={1.5} />
          ) : stage === STAGE.CONFIRMING ? (
            <Zap color="#2D6FF0" size={44} strokeWidth={1.5} fill="rgba(45,111,240,0.15)" />
          ) : role === 'receiver' ? (
            <Download color={stageColor} size={44} strokeWidth={1.5} />
          ) : role === 'sender' ? (
            <Send color={stageColor} size={44} strokeWidth={1.5} />
          ) : (
            <Wifi color="#2D6FF0" size={44} strokeWidth={1.5} />
          )}
        </Animated.View>

        {/* Stage label */}
        <Text style={[styles.stageLabel, { color: stageColor }]}>{stageLabel}</Text>

        {/* Peer wallet pill (shown for sender after connect) */}
        {peerWallet !== '' && stage === STAGE.AMOUNT && (
          <View style={styles.walletPill}>
            <Text style={styles.walletPillLabel}>To</Text>
            <Text style={styles.walletPillAddr} numberOfLines={1}>
              {peerWallet.slice(0, 8)}…{peerWallet.slice(-6)}
            </Text>
          </View>
        )}
      </View>

      {/* ── Bottom card — changes per stage ────────────────────────────────── */}
      <Animated.View style={[styles.card, { opacity: cardOp, transform: [{ translateY: cardY }] }]}>

        {/* IDLE — choose role */}
        {stage === STAGE.IDLE && (
          <View style={styles.roleRow}>
            <Text style={styles.cardTitle}>Who are you?</Text>
            <Text style={styles.cardSub}>Both phones open this screen, then choose your role</Text>
            <View style={styles.roleButtons}>
              <TouchableOpacity
                style={[styles.roleBtn, styles.roleBtnSend]}
                activeOpacity={0.85}
                onPress={() => chooseRole('sender')}
              >
                <Send color="#FFFFFF" size={22} strokeWidth={1.8} />
                <Text style={styles.roleBtnLabel}>I'm Sending</Text>
                <Text style={styles.roleBtnSub}>Tap their phone</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.roleBtn, styles.roleBtnReceive]}
                activeOpacity={0.85}
                onPress={() => chooseRole('receiver')}
              >
                <Download color="#FFFFFF" size={22} strokeWidth={1.8} />
                <Text style={styles.roleBtnLabel}>I'm Receiving</Text>
                <Text style={styles.roleBtnSub}>Let them tap you</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* SCANNING / ROLE_CHOSEN — waiting */}
        {(stage === STAGE.SCANNING || stage === STAGE.ROLE_CHOSEN) && (
          <View style={styles.waitingContainer}>
            <Text style={styles.cardTitle}>
              {role === 'receiver' ? 'Ready to receive' : 'Looking for receiver'}
            </Text>
            <Text style={styles.cardSub}>
              {role === 'receiver'
                ? 'Show this screen to the sender and hold phones back-to-back'
                : 'Hold the back of your phone to the back of the receiver\'s phone'}
            </Text>
            <View style={styles.nfcHint}>
              <View style={[styles.nfcHintDot, { backgroundColor: stageColor }]} />
              <Text style={styles.nfcHintText}>NFC is active</Text>
            </View>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => { reset(); goTo('Pay'); }} activeOpacity={0.7}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* AMOUNT — sender enters value */}
        {stage === STAGE.AMOUNT && (
          <View style={styles.amountContainer}>
            <Text style={styles.cardTitle}>How much?</Text>
            <View style={styles.amountInputRow}>
              <Text style={styles.currencySymbol}>Ξ</Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor="#1E2D4A"
                keyboardType="decimal-pad"
                autoFocus
                selectionColor="#F59E0B"
              />
            </View>
            <View style={styles.quickAmounts}>
              {['0.01', '0.05', '0.1', '0.5'].map((q) => (
                <TouchableOpacity
                  key={q}
                  style={[styles.quickBtn, amount === q && styles.quickBtnActive]}
                  onPress={() => setAmount(q)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.quickBtnText, amount === q && styles.quickBtnTextActive]}>Ξ{q}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.sendBtn} onPress={sendPayment} activeOpacity={0.85}>
              <Text style={styles.sendBtnText}>Send Payment</Text>
              <ChevronRight color="#FFFFFF" size={20} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        )}

        {/* CONFIRMING */}
        {stage === STAGE.CONFIRMING && (
          <View style={styles.confirmingContainer}>
            <Text style={styles.cardTitle}>Broadcasting…</Text>
            <Text style={styles.cardSub}>
              Your transaction is being recorded on the Ethereum blockchain. This usually takes 10–20 seconds.
            </Text>
            <View style={styles.txRow}>
              <Text style={styles.txLabel}>Network fee</Text>
              <Text style={styles.txValue}>~Ξ0.0008</Text>
            </View>
            <View style={styles.txRow}>
              <Text style={styles.txLabel}>Amount</Text>
              <Text style={[styles.txValue, { color: '#F59E0B' }]}>Ξ{amount}</Text>
            </View>
          </View>
        )}

        {/* SUCCESS */}
        {stage === STAGE.SUCCESS && (
          <View style={styles.successContainer}>
            <Text style={[styles.cardTitle, { color: '#10B981' }]}>Sent!</Text>
            <Text style={styles.cardSub}>
              Ξ{amount} has been sent and recorded on-chain. Both phones will receive a notification shortly.
            </Text>
            <View style={styles.txHashRow}>
              <Text style={styles.txLabel}>Transaction</Text>
              <Text style={styles.txHashText} numberOfLines={1}>
                {txHash.slice(0, 12)}…{txHash.slice(-8)}
              </Text>
            </View>
            <TouchableOpacity style={styles.doneBtn} onPress={() => { reset(); goTo('Home'); }} activeOpacity={0.85}>
              <Text style={styles.doneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ERROR */}
        {stage === STAGE.ERROR && (
          <View style={styles.errorContainer}>
            <Text style={[styles.cardTitle, { color: '#EF4444' }]}>Failed</Text>
            <Text style={styles.cardSub}>{errorMsg}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={reset} activeOpacity={0.85}>
              <Text style={styles.retryBtnText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

      </Animated.View>

      {/* NFC not supported fallback */}
      {!nfcSupported && (
        <View style={styles.nfcUnsupported}>
          <AlertCircle color="#F59E0B" size={18} />
          <Text style={styles.nfcUnsupportedText}>
            NFC not available on this device. Use QR code instead.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#060D1A' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
    justifyContent: 'space-between',
  },
  closeBtn: {
    width: 38, height: 38, borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.2 },
  headerBadge: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: 100,
    paddingHorizontal: 10, paddingVertical: 4, columnGap: 5,
  },
  badgeDot:  { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },

  // NFC field
  nfcField: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  ripple: {
    position: 'absolute', borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  orbitRing: {
    width: 176, height: 176,
    position: 'absolute',
    alignItems: 'center', justifyContent: 'center',
  },
  orbitDot: { position: 'absolute', width: 7, height: 7, borderRadius: 3.5 },
  nfcIconBox: {
    width: 112, height: 112, borderRadius: 32,
    backgroundColor: '#0A1628',
    borderWidth: 1.5,
    justifyContent: 'center', alignItems: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6, shadowRadius: 24, elevation: 12,
  },
  stageLabel: {
    marginTop: 28, fontSize: 15,
    fontWeight: '600', letterSpacing: 0.3, textAlign: 'center',
  },
  walletPill: {
    marginTop: 12, flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(245,158,11,0.1)',
    borderWidth: 1, borderColor: 'rgba(245,158,11,0.25)',
    borderRadius: 100, paddingHorizontal: 14, paddingVertical: 6,
    columnGap: 8, maxWidth: width * 0.7,
  },
  walletPillLabel: { color: '#F59E0B', fontSize: 11, fontWeight: '700' },
  walletPillAddr:  { color: '#FFFFFF', fontSize: 12, fontWeight: '500', flex: 1 },

  // Card
  card: {
    backgroundColor: '#0A1628',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1,
    borderColor: 'rgba(45,111,240,0.12)',
    paddingHorizontal: 24, paddingTop: 28, paddingBottom: 40,
    minHeight: 280,
  },
  cardTitle: {
    color: '#FFFFFF', fontSize: 22,
    fontWeight: '800', letterSpacing: -0.3, marginBottom: 8,
  },
  cardSub: {
    color: '#3D5070', fontSize: 14,
    lineHeight: 21, marginBottom: 24,
  },

  // Role selection
  roleRow: {},
  roleButtons: { flexDirection: 'row', columnGap: 12 },
  roleBtn: {
    flex: 1, borderRadius: 18, paddingVertical: 18,
    alignItems: 'center', rowGap: 6,
    borderWidth: 1,
  },
  roleBtnSend: {
    backgroundColor: 'rgba(45,111,240,0.12)',
    borderColor: 'rgba(45,111,240,0.3)',
  },
  roleBtnReceive: {
    backgroundColor: 'rgba(16,185,129,0.1)',
    borderColor: 'rgba(16,185,129,0.3)',
  },
  roleBtnLabel: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  roleBtnSub:   { color: '#3D5070', fontSize: 12, fontWeight: '500' },

  // Waiting
  waitingContainer: {},
  nfcHint: {
    flexDirection: 'row', alignItems: 'center',
    columnGap: 8, marginBottom: 20,
  },
  nfcHintDot:  { width: 8, height: 8, borderRadius: 4 },
  nfcHintText: { color: '#3D5070', fontSize: 13, fontWeight: '600' },
  cancelBtn: {
    height: 48, borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center', alignItems: 'center',
  },
  cancelBtnText: { color: '#3D5070', fontSize: 15, fontWeight: '600' },

  // Amount
  amountContainer: {},
  amountInputRow: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 20, columnGap: 4,
  },
  currencySymbol: {
    color: '#F59E0B', fontSize: 36,
    fontWeight: '300', marginRight: 4,
  },
  amountInput: {
    color: '#FFFFFF', fontSize: 48,
    fontWeight: '700', flex: 1, letterSpacing: -1,
  },
  quickAmounts: {
    flexDirection: 'row', columnGap: 8, marginBottom: 24,
  },
  quickBtn: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 100, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  quickBtnActive: {
    backgroundColor: 'rgba(245,158,11,0.15)',
    borderColor: 'rgba(245,158,11,0.4)',
  },
  quickBtnText:       { color: '#3D5070', fontSize: 13, fontWeight: '600' },
  quickBtnTextActive: { color: '#F59E0B' },
  sendBtn: {
    backgroundColor: '#2D6FF0', height: 56, borderRadius: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    columnGap: 8,
    shadowColor: '#2D6FF0', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 16, elevation: 8,
  },
  sendBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },

  // Confirming
  confirmingContainer: {},
  txRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  txLabel: { color: '#3D5070', fontSize: 14 },
  txValue: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },

  // Success
  successContainer: {},
  txHashRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: 'rgba(16,185,129,0.07)',
    borderWidth: 1, borderColor: 'rgba(16,185,129,0.2)',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    marginBottom: 24,
  },
  txHashText: { color: '#10B981', fontSize: 13, fontWeight: '600', flex: 1, textAlign: 'right' },
  doneBtn: {
    backgroundColor: '#10B981', height: 56, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  doneBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },

  // Error
  errorContainer: {},
  retryBtn: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
    height: 56, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  retryBtnText: { color: '#EF4444', fontSize: 16, fontWeight: '700' },

  // NFC unsupported banner
  nfcUnsupported: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', columnGap: 8,
    backgroundColor: 'rgba(245,158,11,0.1)',
    borderTopWidth: 1, borderTopColor: 'rgba(245,158,11,0.2)',
    paddingHorizontal: 20, paddingVertical: 14,
  },
  nfcUnsupportedText: {
    color: '#F59E0B', fontSize: 13, fontWeight: '500', flex: 1,
  },
});