import React, { useRef, useEffect, useState, useCallback } from "react";
import useApi from "../hooks/useApi";
import axiosApi from "../services/api"; // raw axios instance — Bearer token already set
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
  Image,
  ActivityIndicator,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import {
  ArrowLeft,
  Share2,
  Copy,
  CheckCheck,
  Shield,
  Wifi,
  Layers,
} from "lucide-react-native";

// ─── Sub-components ───────────────────────────────────────────────────────────

const PulsingRing = ({ anim }) => {
  const scale   = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] });
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] });
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.pulseRing, { opacity, transform: [{ scale }] }]}
    />
  );
};

const Badge = ({ icon: Icon, label, accent }) => (
  <View style={[styles.badge, { borderColor: accent + "33", backgroundColor: accent + "11" }]}>
    <Icon color={accent} size={11} strokeWidth={2.2} />
    <Text style={[styles.badgeText, { color: accent }]}>{label}</Text>
  </View>
);

const Stat = ({ label, value }) => (
  <View style={styles.stat}>
    <Text style={styles.statVal}>{value}</Text>
    <Text style={styles.statLbl}>{label}</Text>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────

const ReceiveScreen = ({ goTo }) => {
  const api = useApi(); // hook-wrapped helpers (getWalletStatus, etc.)

  const [walletAddress, setWalletAddress] = useState("");
  const [qrB64, setQrB64]         = useState(null);  // base64 data URI
  const [loading, setLoading]     = useState(true);
  const [qrLoading, setQrLoading] = useState(true);
  const [error, setError]         = useState("");
  const [copied, setCopied]       = useState(false);

  // ── Animated values ────────────────────────────────────────────────────────
  const headerAnim = useRef(new Animated.Value(0)).current;
  const cardAnim   = useRef(new Animated.Value(0)).current;
  const infoAnim   = useRef(new Animated.Value(0)).current;
  const pulseAnim  = useRef(new Animated.Value(0)).current;
  const copyBounce = useRef(new Animated.Value(1)).current;

  // ── Data fetching ──────────────────────────────────────────────────────────
  //
  // WHY WE DO THIS:
  //   React Native's <Image> component silently drops custom headers, so passing
  //   { uri, headers: { Authorization: ... } } never actually sends the token.
  //   The server returns 401 → the image fails to load.
  //
  //   Fix: use the axios instance (which already has the Bearer token attached
  //   via api.defaults.headers.common) with responseType:"arraybuffer", then
  //   convert the raw bytes to a base64 data URI that <Image> can render
  //   without any network request or auth header.
  //
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        // 1. Wallet address
        const statusRes = await api.getWalletStatus();
        const address = statusRes?.data?.walletAddress || "";
        if (mounted) setWalletAddress(address);

        // 2. QR code PNG via axios (auth header is automatic)
        const qrRes = await axiosApi.get("/auth/me/qrcode", {
          responseType: "arraybuffer",
        });

        // Convert ArrayBuffer → base64 in chunks to avoid stack overflow
        const bytes = new Uint8Array(qrRes.data);
        let binary = "";
        const CHUNK = 8192;
        for (let i = 0; i < bytes.byteLength; i += CHUNK) {
          binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
        }
        const dataUri = `data:image/png;base64,${btoa(binary)}`;

        if (mounted) {
          setQrB64(dataUri);
          setQrLoading(false);
        }
      } catch (err) {
        console.error("[ReceiveScreen]", err?.response?.status, err?.message);
        if (mounted) {
          setError("Failed to load wallet data");
          setQrLoading(false);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, []);

  // ── Entrance animations ────────────────────────────────────────────────────
  useEffect(() => {
    Animated.stagger(120, [
      Animated.spring(headerAnim, { toValue: 1, friction: 7, tension: 60, useNativeDriver: true }),
      Animated.spring(cardAnim,   { toValue: 1, friction: 6, tension: 50, useNativeDriver: true }),
      Animated.spring(infoAnim,   { toValue: 1, friction: 7, tension: 55, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1800, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.delay(600),
        Animated.timing(pulseAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleCopy = useCallback(async () => {
    if (!walletAddress) return;
    await Clipboard.setStringAsync(walletAddress);
    Vibration.vibrate(55);
    setCopied(true);
    Animated.sequence([
      Animated.spring(copyBounce, { toValue: 0.93, friction: 4, useNativeDriver: true }),
      Animated.spring(copyBounce, { toValue: 1,    friction: 5, useNativeDriver: true }),
    ]).start();
    setTimeout(() => setCopied(false), 2500);
  }, [walletAddress]);

  const handleShare = useCallback(async () => {
    if (!walletAddress) return;
    try {
      await Share.share({
        message: `Send ETH to my ChainPay wallet:\n${walletAddress}`,
        title: "My ChainPay Wallet Address",
      });
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  }, [walletAddress]);

  // ── Derived animated styles ────────────────────────────────────────────────
  const headerStyle = {
    opacity: headerAnim,
    transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) }],
  };
  const cardStyle = {
    opacity: cardAnim,
    transform: [{ scale: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1] }) }],
  };
  const infoStyle = {
    opacity: infoAnim,
    transform: [{ translateY: infoAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
  };

  // ── Loading / Error guards ─────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#060910" />
        <View style={styles.centred}>
          <ActivityIndicator size="large" color="#2D6FF0" />
          <Text style={styles.loadingText}>Loading wallet…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#060910" />
        <View style={styles.centred}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => goTo("Home")}>
            <Text style={styles.retryBtnText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#060910" />

      {/* ── Header ── */}
      <Animated.View style={[styles.header, headerStyle]}>
        <TouchableOpacity style={styles.backBtn} activeOpacity={0.7} onPress={() => goTo("Home")}>
          <ArrowLeft color="#FFFFFF" size={19} strokeWidth={2.5} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Receive</Text>
          <Text style={styles.headerSub}>Share your address</Text>
        </View>
        <Badge icon={Shield} label="Secure" accent="#1D9E75" />
      </Animated.View>

      {/* ── QR Card ── */}
      <Animated.View style={[styles.cardWrap, cardStyle]}>
        <PulsingRing anim={pulseAnim} />
        <View style={styles.card}>
          {/* Top strip */}
          <View style={styles.cardTop}>
            <View style={styles.cardTopLeft}>
              <View style={styles.dot} />
              <Text style={styles.cardTopLabel}>CHAINPAY · ETHEREUM</Text>
            </View>
            <Badge icon={Layers} label="Sepolia" accent="#2D6FF0" />
          </View>

          {/* QR image */}
          <View style={styles.qrWrap}>
            {qrLoading && (
              <View style={styles.qrSkeleton}>
                <ActivityIndicator size="small" color="#2D6FF0" />
              </View>
            )}
            {qrB64 && (
              <Image
                source={{ uri: qrB64 }}   // data URI — no auth header needed
                style={[styles.qrImage, qrLoading && styles.hidden]}
                resizeMode="contain"
                onLoad={() => setQrLoading(false)}
                onError={() => {
                  setQrLoading(false);
                  setError("Failed to render QR code");
                }}
              />
            )}
          </View>

          {/* Address pill */}
          <View style={styles.addrPill}>
            <Wifi color="#2D6FF0" size={11} strokeWidth={2} />
            <Text style={styles.addrPillText} numberOfLines={1} ellipsizeMode="middle">
              {walletAddress}
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* ── Info area ── */}
      <Animated.View style={[styles.info, infoStyle]}>
        {/* Stats */}
        <View style={styles.statsRow}>
          <Stat label="Network" value="Ethereum" />
          <View style={styles.statDivider} />
          <Stat label="Token"   value="ETH" />
          <View style={styles.statDivider} />
          <Stat label="Chain"   value="Sepolia" />
        </View>

        {/* Address box */}
        <Animated.View style={[styles.addrBox, { transform: [{ scale: copyBounce }] }]}>
          <Text style={styles.addrLabel}>WALLET ADDRESS</Text>
          <View style={styles.addrRow}>
            <Text style={styles.addrText} numberOfLines={1} ellipsizeMode="middle">
              {walletAddress}
            </Text>
            <TouchableOpacity
              style={[styles.copyIconBtn, copied && styles.copyIconBtnDone]}
              activeOpacity={0.75}
              onPress={handleCopy}
            >
              {copied
                ? <CheckCheck color="#1D9E75" size={15} strokeWidth={2.5} />
                : <Copy       color="#2D6FF0" size={15} strokeWidth={2}   />}
            </TouchableOpacity>
          </View>
          {copied && <Text style={styles.copiedHint}>✓ Copied to clipboard</Text>}
        </Animated.View>

        {/* Action buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.shareBtn} activeOpacity={0.82} onPress={handleShare}>
            <Share2 color="#FFFFFF" size={17} strokeWidth={2.2} />
            <Text style={styles.shareBtnText}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.copyBtn} activeOpacity={0.82} onPress={handleCopy}>
            {copied
              ? <CheckCheck color="#1D9E75" size={17} strokeWidth={2.5} />
              : <Copy       color="#FFFFFF" size={17} strokeWidth={2}   />}
            <Text style={[styles.copyBtnText, copied && { color: "#1D9E75" }]}>
              {copied ? "Copied!" : "Copy address"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Warning */}
        <View style={styles.warning}>
          <Text style={styles.warningText}>
            ⚠️{"  "}Only send ETH or ERC-20 tokens to this address. Sending other assets may result in permanent loss.
          </Text>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const C = {
  bg:      "#060910",
  surface: "#0D1220",
  border:  "rgba(255,255,255,0.07)",
  blue:    "#2D6FF0",
  green:   "#1D9E75",
  text:    "#FFFFFF",
  sub:     "rgba(255,255,255,0.38)",
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) + 4 : 0,
  },
  centred:      { flex: 1, justifyContent: "center", alignItems: "center", gap: 14 },
  loadingText:  { color: C.sub, fontSize: 14, marginTop: 4 },
  errorText:    { color: "#e05555", fontSize: 15, textAlign: "center", paddingHorizontal: 32 },
  retryBtn:     { backgroundColor: C.blue, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 4 },
  retryBtnText: { color: C.text, fontWeight: "700" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.border,
  },
  headerCenter: { alignItems: "center" },
  headerTitle:  { color: C.text, fontSize: 17, fontWeight: "700", letterSpacing: -0.4 },
  headerSub:    { color: C.sub, fontSize: 11, marginTop: 1 },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeText: { fontSize: 11, fontWeight: "600" },

  cardWrap: {
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  pulseRing: {
    position: "absolute",
    width: 270,
    height: 270,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: C.blue,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 16,
    alignItems: "center",
    width: 248,
    shadowColor: C.blue,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.22,
    shadowRadius: 30,
    elevation: 18,
  },
  cardTop: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  cardTopLeft:  { flexDirection: "row", alignItems: "center", gap: 6 },
  dot:          { width: 7, height: 7, borderRadius: 4, backgroundColor: C.blue },
  cardTopLabel: { fontSize: 9, fontWeight: "700", color: "rgba(8,11,20,0.4)", letterSpacing: 0.8 },

  qrWrap: {
    width: 190,
    height: 190,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  qrSkeleton: { position: "absolute", inset: 0, justifyContent: "center", alignItems: "center" },
  qrImage:    { width: 190, height: 190 },
  hidden:     { opacity: 0 },

  addrPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(8,11,20,0.06)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 14,
    maxWidth: "100%",
  },
  addrPillText: { color: "rgba(8,11,20,0.55)", fontSize: 11, fontWeight: "600", flex: 1 },

  info: { flex: 1, paddingHorizontal: 18, gap: 12 },

  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.surface,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    justifyContent: "space-around",
    borderWidth: 1,
    borderColor: C.border,
  },
  stat:        { alignItems: "center", gap: 3 },
  statVal:     { color: C.text, fontSize: 13, fontWeight: "700" },
  statLbl:     { color: C.sub, fontSize: 10, fontWeight: "500" },
  statDivider: { width: 1, height: 26, backgroundColor: C.border },

  addrBox: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  addrLabel: {
    color: C.sub,
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.7,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  addrRow:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  addrText: { color: C.text, fontSize: 14, fontWeight: "600", flex: 1, letterSpacing: 0.2 },
  copyIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(45,111,240,0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(45,111,240,0.2)",
  },
  copyIconBtnDone: {
    backgroundColor: "rgba(29,158,117,0.1)",
    borderColor: "rgba(29,158,117,0.25)",
  },
  copiedHint: { color: C.green, fontSize: 11, fontWeight: "600", marginTop: 8 },

  actions: { flexDirection: "row", gap: 10 },
  shareBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingVertical: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  shareBtnText: { color: C.text, fontSize: 14, fontWeight: "600" },
  copyBtn: {
    flex: 1.5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: C.blue,
    paddingVertical: 15,
    borderRadius: 16,
    shadowColor: C.blue,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 8,
  },
  copyBtnText: { color: C.text, fontSize: 14, fontWeight: "700" },

  warning: {
    backgroundColor: "rgba(192,138,42,0.07)",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(192,138,42,0.18)",
  },
  warningText: { color: "rgba(192,138,42,0.85)", fontSize: 11, lineHeight: 17, textAlign: "center" },
});

export default ReceiveScreen;