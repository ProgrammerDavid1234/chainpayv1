import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  Share,
  Animated,
  Easing,
  Vibration,
  Alert,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import QRCode from "react-native-qrcode-svg";
import {
  ArrowLeft,
  Share2,
  Copy,
  CheckCheck,
  Download,
  Shield,
} from "lucide-react-native";

// ─── install these if you haven't ───────────────────────────────────────────
// npx expo install expo-clipboard
// npm install react-native-qrcode-svg react-native-svg

const WALLET_ADDRESS = "0x7a5bC3dF2e91A4b8C0d6E3F9a2B5c8D1e4F7a0B";
const SHORT_ADDRESS = `${WALLET_ADDRESS.slice(0, 6)}...${WALLET_ADDRESS.slice(-4)}`;

// ─── Animated corner bracket ──────────────────────────────────────────────────
const Corner = ({ style }) => (
  <Animated.View style={[styles.corner, style]} />
);

// ─── Stat chip ────────────────────────────────────────────────────────────────
const StatChip = ({ label, value }) => (
  <View style={styles.statChip}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

// ─── Main screen ──────────────────────────────────────────────────────────────
const ReceiveScreen = ({ goTo }) => {
  const [copied, setCopied] = useState(false);

  // entrance anims
  const headerOp = useRef(new Animated.Value(0)).current;
  const headerY = useRef(new Animated.Value(-20)).current;
  const qrScale = useRef(new Animated.Value(0.8)).current;
  const qrOp = useRef(new Animated.Value(0)).current;
  const contentOp = useRef(new Animated.Value(0)).current;
  const contentY = useRef(new Animated.Value(24)).current;

  // QR pulse glow
  const glowAnim = useRef(new Animated.Value(0)).current;

  // copy feedback
  const copyScale = useRef(new Animated.Value(1)).current;
  const copyBounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // entrance sequence
    Animated.sequence([
      Animated.parallel([
        Animated.timing(headerOp, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(headerY, { toValue: 0, duration: 350, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.spring(qrScale, { toValue: 1, friction: 6, tension: 55, useNativeDriver: true }),
        Animated.timing(qrOp, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(contentOp, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(contentY, { toValue: 0, duration: 400, easing: Easing.out(Easing.back(1.1)), useNativeDriver: true }),
      ]),
    ]).start();

    // subtle QR glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handleCopy = useCallback(async () => {
    await Clipboard.setStringAsync(WALLET_ADDRESS);
    Vibration.vibrate(60);
    setCopied(true);

    // bounce animation
    Animated.sequence([
      Animated.spring(copyBounce, { toValue: -6, friction: 4, useNativeDriver: true }),
      Animated.spring(copyBounce, { toValue: 0, friction: 5, useNativeDriver: true }),
    ]).start();

    setTimeout(() => setCopied(false), 2500);
  }, []);

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: `Send ETH to my wallet:\n${WALLET_ADDRESS}`,
        title: "My ChainPay Wallet Address",
      });
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  }, []);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.15, 0.4],
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#080B14" />

      {/* ── Header ── */}
      <Animated.View
        style={[styles.header, { opacity: headerOp, transform: [{ translateY: headerY }] }]}
      >
        <TouchableOpacity
          style={styles.backBtn}
          activeOpacity={0.7}
          onPress={() => goTo("Home")}
        >
          <ArrowLeft color="#FFFFFF" size={20} strokeWidth={2.5} />
        </TouchableOpacity>

        <View>
          <Text style={styles.headerTitle}>Receive</Text>
          <Text style={styles.headerSub}>Share your address</Text>
        </View>

        <View style={styles.headerRight}>
          <Shield color="#1D9E75" size={16} strokeWidth={2} />
          <Text style={styles.secureText}>Secure</Text>
        </View>
      </Animated.View>

      <View style={styles.content}>

        {/* ── QR card ── */}
        <Animated.View
          style={[
            styles.qrCard,
            { opacity: qrOp, transform: [{ scale: qrScale }] },
          ]}
        >
          {/* glow halo behind card */}
          <Animated.View style={[styles.qrGlow, { opacity: glowOpacity }]} />

          {/* corner brackets */}
          <Corner style={styles.tlCorner} />
          <Corner style={styles.trCorner} />
          <Corner style={styles.blCorner} />
          <Corner style={styles.brCorner} />

          {/* QR code */}
          <View style={styles.qrInner}>
            <QRCode
              value={WALLET_ADDRESS}
              size={188}
              color="#080B14"
              backgroundColor="#FFFFFF"
              logo={undefined}
            />
          </View>

          {/* ChainPay label under QR */}
          <View style={styles.qrBrand}>
            <Shield color="#2D6FF0" size={12} strokeWidth={2} />
            <Text style={styles.qrBrandText}>ChainPay · Ethereum</Text>
          </View>
        </Animated.View>

        {/* ── Info text ── */}
        <Animated.View
          style={[styles.infoArea, { opacity: contentOp, transform: [{ translateY: contentY }] }]}
        >
          <Text style={styles.infoText}>
            Scan to send ETH directly to this wallet
          </Text>

          {/* ── Stats row ── */}
          <View style={styles.statsRow}>
            <StatChip label="Network" value="Ethereum" />
            <View style={styles.statDivider} />
            <StatChip label="Token" value="ETH" />
            <View style={styles.statDivider} />
            <StatChip label="Chain" value="Sepolia" />
          </View>

          {/* ── Address box ── */}
          <Animated.View
            style={[styles.addressBox, { transform: [{ translateY: copyBounce }] }]}
          >
            <Text style={styles.addressLabel}>Wallet address</Text>
            <View style={styles.addressRow}>
              <Text style={styles.addressText} numberOfLines={1} ellipsizeMode="middle">
                {WALLET_ADDRESS}
              </Text>
              <TouchableOpacity
                style={[styles.copyBtn, copied && styles.copyBtnDone]}
                activeOpacity={0.8}
                onPress={handleCopy}
              >
                {copied ? (
                  <CheckCheck color="#1D9E75" size={16} strokeWidth={2.5} />
                ) : (
                  <Copy color="#2D6FF0" size={16} strokeWidth={2} />
                )}
              </TouchableOpacity>
            </View>
            {copied && (
              <Text style={styles.copiedText}>✓ Copied to clipboard</Text>
            )}
          </Animated.View>

          {/* ── Action buttons ── */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.shareBtn}
              activeOpacity={0.85}
              onPress={handleShare}
            >
              <Share2 color="#FFFFFF" size={18} strokeWidth={2} />
              <Text style={styles.shareBtnText}>Share</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.copyFullBtn}
              activeOpacity={0.85}
              onPress={handleCopy}
            >
              {copied ? (
                <CheckCheck color="#1D9E75" size={18} strokeWidth={2.5} />
              ) : (
                <Copy color="#FFFFFF" size={18} strokeWidth={2} />
              )}
              <Text style={[styles.copyFullBtnText, copied && { color: "#1D9E75" }]}>
                {copied ? "Copied!" : "Copy address"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── Warning ── */}
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              Only send ETH or ERC-20 tokens to this address. Sending other assets may result in permanent loss.
            </Text>
          </View>

        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#080B14",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight + 8 : 0,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.07)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: -0.3,
  },
  headerSub: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 11,
    textAlign: "center",
    marginTop: 1,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(29,158,117,0.1)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(29,158,117,0.2)",
  },
  secureText: {
    color: "#1D9E75",
    fontSize: 11,
    fontWeight: "600",
  },

  // Content
  content: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 24,
  },

  // QR card
  qrCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 24,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 24,
    position: "relative",
    shadowColor: "#2D6FF0",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 32,
    elevation: 16,
  },
  qrGlow: {
    position: "absolute",
    width: "120%",
    height: "120%",
    borderRadius: 40,
    backgroundColor: "#2D6FF0",
    top: "-10%",
    left: "-10%",
    zIndex: -1,
  },

  // Corner brackets on QR card
  corner: {
    position: "absolute",
    width: 20,
    height: 20,
    borderColor: "#2D6FF0",
    zIndex: 2,
  },
  tlCorner: { top: 12, left: 12, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 6 },
  trCorner: { top: 12, right: 12, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 6 },
  blCorner: { bottom: 44, left: 12, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 6 },
  brCorner: { bottom: 44, right: 12, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 6 },

  qrInner: {
    borderRadius: 12,
    overflow: "hidden",
  },
  qrBrand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 14,
  },
  qrBrandText: {
    color: "rgba(8,11,20,0.5)",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.3,
  },

  // Info area
  infoArea: {
    width: "100%",
    alignItems: "center",
    gap: 14,
  },
  infoText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 14,
    textAlign: "center",
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: "100%",
    justifyContent: "space-around",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  statChip: { alignItems: "center", gap: 2 },
  statValue: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  statLabel: { color: "rgba(255,255,255,0.35)", fontSize: 10, fontWeight: "500" },
  statDivider: { width: 1, height: 28, backgroundColor: "rgba(255,255,255,0.07)" },

  // Address
  addressBox: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  addressLabel: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  addressText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
    letterSpacing: 0.3,
  },
  copyBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(45,111,240,0.12)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(45,111,240,0.2)",
  },
  copyBtnDone: {
    backgroundColor: "rgba(29,158,117,0.12)",
    borderColor: "rgba(29,158,117,0.25)",
  },
  copiedText: {
    color: "#1D9E75",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 8,
  },

  // Action buttons
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  shareBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.07)",
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  shareBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  copyFullBtn: {
    flex: 1.4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#2D6FF0",
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: "#2D6FF0",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  copyFullBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  // Warning
  warningBox: {
    width: "100%",
    backgroundColor: "rgba(186,117,23,0.08)",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(186,117,23,0.18)",
  },
  warningText: {
    color: "rgba(186,117,23,0.9)",
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
  },
});

export default ReceiveScreen;