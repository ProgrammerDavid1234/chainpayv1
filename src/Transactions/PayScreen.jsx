/**
 * PayScreen.jsx  (updated)
 *
 * Changes from original:
 *   • "Scan to Pay" action is now "Scan" (routes to ScanScreen)
 *   • "NFC Contactless" action is still "NfcTransfer"
 *   • No other logic changes
 */

import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  ScrollView,
  Animated,
  Easing,
  Vibration,
} from "react-native";
import {
  ArrowLeft,
  Wifi,
  ScanLine,
  FileText,
  Smartphone,
  ChevronRight,
  Zap,
  Clock,
  TrendingUp,
} from "lucide-react-native";

// ─── Payment methods ──────────────────────────────────────────────────────────
const METHODS = [
  {
    id: "1",
    title: "Scan to Pay",
    subtitle: "Pay merchants instantly via QR",
    icon: ScanLine,
    iconBg: "#2D6FF0",
    action: "Scan",            // ← routes to ScanScreen
    badge: "Fast",
    badgeColor: "#1D9E75",
    available: true,
  },
  {
    id: "2",
    title: "NFC Contactless",
    subtitle: "Tap to pay at supported terminals",
    icon: Wifi,
    iconBg: "#534AB7",
    action: "NfcTransfer",
    badge: null,
    badgeColor: null,
    available: true,
  },
  {
    id: "3",
    title: "Pay Bills",
    subtitle: "Electricity, water, internet & more",
    icon: FileText,
    iconBg: "#0F6E56",
    action: null,
    badge: "Soon",
    badgeColor: "#BA7517",
    available: false,
  },
  {
    id: "4",
    title: "Mobile Top-up",
    subtitle: "Recharge airtime & data instantly",
    icon: Smartphone,
    iconBg: "#993C1D",
    action: null,
    badge: "Soon",
    badgeColor: "#BA7517",
    available: false,
  },
];

// ─── Recent activity (static placeholder) ────────────────────────────────────
const RECENT = [
  { id: "r1", name: "Shoprite QR",  amount: "-0.012 ETH", time: "2 min ago",  icon: "🛒" },
  { id: "r2", name: "Fuel Station", amount: "-0.045 ETH", time: "1 hr ago",   icon: "⛽" },
  { id: "r3", name: "Cafe Latte",   amount: "-0.003 ETH", time: "Yesterday",  icon: "☕" },
];

// ─── Animated method card ─────────────────────────────────────────────────────
const MethodCard = ({ method, onPress, index }) => {
  const entranceOp  = useRef(new Animated.Value(0)).current;
  const entranceY   = useRef(new Animated.Value(28)).current;
  const scaleAnim   = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(entranceOp, {
        toValue: 1, duration: 420, delay: 200 + index * 90,
        easing: Easing.out(Easing.quad), useNativeDriver: true,
      }),
      Animated.timing(entranceY, {
        toValue: 0, duration: 420, delay: 200 + index * 90,
        easing: Easing.out(Easing.back(1.1)), useNativeDriver: true,
      }),
    ]).start();

    if (method.available) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
          Animated.timing(shimmerAnim, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
        ])
      ).start();
    }
  }, []);

  const borderColor = method.available
    ? shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ["rgba(45,111,240,0.15)", "rgba(45,111,240,0.45)"],
      })
    : "rgba(255,255,255,0.05)";

  return (
    <Animated.View style={{ opacity: entranceOp, transform: [{ translateY: entranceY }, { scale: scaleAnim }], marginBottom: 12 }}>
      <TouchableOpacity
        activeOpacity={method.available ? 0.8 : 0.6}
        onPress={() => {
          if (!method.available) return;
          Vibration.vibrate(40);
          onPress();
        }}
        onPressIn={() => method.available && Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }).start()}
      >
        <Animated.View style={[styles.methodCard, !method.available && styles.methodCardDisabled, { borderColor }]}>
          <View style={[styles.iconWrap, { backgroundColor: method.iconBg + "22" }]}>
            <method.icon
              color={method.available ? method.iconBg : "rgba(255,255,255,0.25)"}
              size={22} strokeWidth={2}
            />
          </View>

          <View style={styles.methodText}>
            <View style={styles.methodTitleRow}>
              <Text style={[styles.methodTitle, !method.available && styles.textMuted]}>
                {method.title}
              </Text>
              {method.badge && (
                <View style={[styles.badge, { backgroundColor: method.badgeColor + "22" }]}>
                  <Text style={[styles.badgeText, { color: method.badgeColor }]}>
                    {method.badge}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.methodSubtitle}>{method.subtitle}</Text>
          </View>

          <ChevronRight
            color={method.available ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.12)"}
            size={18} strokeWidth={2}
          />
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Recent row ───────────────────────────────────────────────────────────────
const RecentRow = ({ item, index }) => {
  const op = useRef(new Animated.Value(0)).current;
  const x  = useRef(new Animated.Value(-16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(op, { toValue: 1, duration: 360, delay: 600 + index * 80, useNativeDriver: true }),
      Animated.timing(x,  { toValue: 0, duration: 360, delay: 600 + index * 80, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.recentRow, { opacity: op, transform: [{ translateX: x }] }]}>
      <View style={styles.recentIcon}><Text style={{ fontSize: 18 }}>{item.icon}</Text></View>
      <View style={styles.recentInfo}>
        <Text style={styles.recentName}>{item.name}</Text>
        <Text style={styles.recentTime}>{item.time}</Text>
      </View>
      <Text style={styles.recentAmount}>{item.amount}</Text>
    </Animated.View>
  );
};

// ─── Main screen ──────────────────────────────────────────────────────────────
const PayScreen = ({ goTo }) => {
  const headerOp = useRef(new Animated.Value(0)).current;
  const headerY  = useRef(new Animated.Value(-20)).current;
  const statsOp  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(headerOp, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(headerY,  { toValue: 0, duration: 350, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]),
      Animated.timing(statsOp, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#080B14" />

      {/* ── Header ── */}
      <Animated.View style={[styles.header, { opacity: headerOp, transform: [{ translateY: headerY }] }]}>
        <TouchableOpacity style={styles.backBtn} activeOpacity={0.7} onPress={() => goTo("Home")}>
          <ArrowLeft color="#FFFFFF" size={20} strokeWidth={2.5} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Pay</Text>
          <Text style={styles.headerSub}>Choose payment method</Text>
        </View>
        <View style={styles.headerRight}>
          <Zap color="#EF9F27" size={14} strokeWidth={2.5} />
          <Text style={styles.headerRightText}>Instant</Text>
        </View>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Quick stats ── */}
        <Animated.View style={[styles.statsCard, { opacity: statsOp }]}>
          <View style={styles.statItem}>
            <TrendingUp color="#1D9E75" size={16} strokeWidth={2} />
            <Text style={styles.statVal}>₦0.00</Text>
            <Text style={styles.statLbl}>Spent today</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Clock color="#2D6FF0" size={16} strokeWidth={2} />
            <Text style={styles.statVal}>3</Text>
            <Text style={styles.statLbl}>Transactions</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Zap color="#EF9F27" size={16} strokeWidth={2} />
            <Text style={styles.statVal}>~15s</Text>
            <Text style={styles.statLbl}>Avg confirm</Text>
          </View>
        </Animated.View>

        {/* ── Methods ── */}
        <Text style={styles.sectionLabel}>Payment methods</Text>
        {METHODS.map((m, i) => (
          <MethodCard
            key={m.id}
            method={m}
            index={i}
            onPress={() => m.action && goTo(m.action)}
          />
        ))}

        {/* ── Recent payments ── */}
        <Text style={[styles.sectionLabel, { marginTop: 8 }]}>Recent payments</Text>
        <View style={styles.recentCard}>
          {RECENT.map((r, i) => (
            <React.Fragment key={r.id}>
              <RecentRow item={r} index={i} />
              {i < RECENT.length - 1 && <View style={styles.recentDivider} />}
            </React.Fragment>
          ))}
        </View>

        <Text style={styles.footNote}>
          All payments are processed on the Ethereum blockchain · Sepolia testnet
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#080B14",
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) + 8 : 0,
  },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 16,
  },
  backBtn: {
    width: 42, height: 42, borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.07)",
    justifyContent: "center", alignItems: "center",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.06)",
  },
  headerTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "700", textAlign: "center", letterSpacing: -0.3 },
  headerSub:   { color: "rgba(255,255,255,0.35)", fontSize: 11, textAlign: "center", marginTop: 1 },
  headerRight: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(239,159,39,0.1)",
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
    borderWidth: 1, borderColor: "rgba(239,159,39,0.2)",
  },
  headerRightText: { color: "#EF9F27", fontSize: 11, fontWeight: "600" },

  scroll: { paddingHorizontal: 20, paddingBottom: 48 },

  statsCard: {
    flexDirection: "row", backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 18, padding: 16, marginBottom: 24,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.06)",
    justifyContent: "space-around", alignItems: "center",
  },
  statItem: { alignItems: "center", gap: 4 },
  statVal:  { color: "#FFFFFF", fontSize: 15, fontWeight: "700", marginTop: 4 },
  statLbl:  { color: "rgba(255,255,255,0.35)", fontSize: 10, fontWeight: "500" },
  statDivider: { width: 1, height: 36, backgroundColor: "rgba(255,255,255,0.07)" },

  sectionLabel: {
    color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: "600",
    letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 12,
  },

  methodCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 18, padding: 16, borderWidth: 1,
  },
  methodCardDisabled: { opacity: 0.55 },
  iconWrap: {
    width: 48, height: 48, borderRadius: 14,
    justifyContent: "center", alignItems: "center", marginRight: 14,
  },
  methodText:     { flex: 1 },
  methodTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 3 },
  methodTitle:    { color: "#FFFFFF", fontSize: 15, fontWeight: "700", letterSpacing: -0.2 },
  textMuted:      { color: "rgba(255,255,255,0.45)" },
  methodSubtitle: { color: "rgba(255,255,255,0.38)", fontSize: 12 },
  badge:          { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  badgeText:      { fontSize: 10, fontWeight: "700", letterSpacing: 0.3 },

  recentCard: {
    backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 18,
    overflow: "hidden", borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)", marginBottom: 20,
  },
  recentRow:    { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  recentIcon:   {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    justifyContent: "center", alignItems: "center",
  },
  recentInfo:   { flex: 1 },
  recentName:   { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
  recentTime:   { color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 2 },
  recentAmount: { color: "#E24B4A", fontSize: 14, fontWeight: "700" },
  recentDivider:{ height: 1, backgroundColor: "rgba(255,255,255,0.05)", marginHorizontal: 14 },

  footNote: { color: "rgba(255,255,255,0.18)", fontSize: 11, textAlign: "center", lineHeight: 16 },
});

export default PayScreen;