import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Animated,
  Easing,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import {
  Send,
  Download,
  CreditCard,
  Clock,
  Bell,
  QrCode,
  Home,
  Wallet,
  Activity,
  User,
  ArrowUpRight,
  ArrowDownLeft,
  Sparkles,
  ChevronRight,
  AlertCircle,
  Link,
} from "lucide-react-native";
import useAuth from "../hooks/useAuth";
import useApi from "../hooks/useApi";
import { useTheme } from "../contexts/ThemeContext";

const { width } = Dimensions.get("window");

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning,";
  if (hour < 17) return "Good afternoon,";
  return "Good evening,";
};

const formatEth = (balanceEth) => {
  if (!balanceEth) return "0.000000";
  return parseFloat(balanceEth).toFixed(6);
};

const formatAddress = (address) => {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const formatDate = (timestamp) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getInitials = (name) => {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

// ─── Quick action button ──────────────────────────────────────────────────────
const QuickAction = ({ icon: Icon, label, delay, onPress }) => {
  const entranceOp = useRef(new Animated.Value(0)).current;
  const entranceScale = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(entranceOp, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(entranceScale, {
        toValue: 1,
        delay,
        friction: 5,
        tension: 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: entranceOp, transform: [{ scale: entranceScale }] }}>
      <TouchableOpacity style={styles.quickAction} activeOpacity={0.7} onPress={onPress}>
        <View style={styles.quickActionIcon}>
          <Icon color="#FFFFFF" size={20} strokeWidth={2} />
        </View>
        <Text style={styles.quickActionLabel}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Transaction item ─────────────────────────────────────────────────────────
const TransactionItem = ({ tx, walletAddress, delay, onPress }) => {
  const entranceOp = useRef(new Animated.Value(0)).current;
  const entranceX = useRef(new Animated.Value(20)).current;

  const isIncome = tx.direction === "received" ||
    (tx.to && walletAddress && tx.to.toLowerCase() === walletAddress.toLowerCase());

  useEffect(() => {
    Animated.parallel([
      Animated.timing(entranceOp, { toValue: 1, duration: 450, delay, useNativeDriver: true }),
      Animated.timing(entranceX, { toValue: 0, duration: 450, delay, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
  }, []);

  const statusColor = {
    confirmed: "#10B981",
    pending:   "#F59E0B",
    failed:    "#EF4444",
  }[tx.status] || "#6B7A99";

  return (
    <Animated.View style={[styles.txItem, { opacity: entranceOp, transform: [{ translateX: entranceX }] }]}>
      <TouchableOpacity style={styles.txItemInner} activeOpacity={0.7} onPress={onPress}>
        {/* Icon */}
        <View style={[styles.txIcon, { backgroundColor: isIncome ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)" }]}>
          {isIncome
            ? <ArrowDownLeft color="#10B981" size={18} strokeWidth={2.5} />
            : <ArrowUpRight  color="#EF4444" size={18} strokeWidth={2.5} />}
        </View>

        {/* Details */}
        <View style={styles.txDetails}>
          <Text style={styles.txName} numberOfLines={1}>
            {isIncome ? formatAddress(tx.from) : formatAddress(tx.to)}
          </Text>
          <Text style={styles.txDate}>{formatDate(tx.timestamp)}</Text>
        </View>

        {/* Amount */}
        <View style={styles.txAmountArea}>
          <Text style={[styles.txAmount, { color: isIncome ? "#10B981" : "#EF4444" }]}>
            {isIncome ? "+" : "-"}Ξ{parseFloat(tx.amountEth || 0).toFixed(4)}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + "20" }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {tx.status}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Connect Wallet Banner ────────────────────────────────────────────────────
const ConnectWalletBanner = ({ onPress }) => (
  <TouchableOpacity style={styles.connectBanner} onPress={onPress} activeOpacity={0.85}>
    <View style={styles.connectBannerLeft}>
      <View style={styles.connectBannerIcon}>
        <Link color="#F59E0B" size={20} strokeWidth={2} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.connectBannerTitle}>Connect your wallet</Text>
        <Text style={styles.connectBannerSub}>
          Link MetaMask to send and receive payments
        </Text>
      </View>
    </View>
    <ChevronRight color="#F59E0B" size={18} strokeWidth={2.5} />
  </TouchableOpacity>
);

// ─── Loading skeleton ─────────────────────────────────────────────────────────
const BalanceSkeleton = () => (
  <View style={styles.skeletonCard}>
    <View style={styles.skeletonLine} />
    <View style={[styles.skeletonLine, { width: "60%", height: 40, marginTop: 8 }]} />
  </View>
);

// ─── Main HomeScreen ──────────────────────────────────────────────────────────
const HomeScreen = ({ goTo }) => {
  const { user }  = useAuth();
  const api       = useApi();
  const { theme, mode, toggleTheme } = useTheme();
  const colors = theme.colors;

  const [activeTab,    setActiveTab]    = useState("Home");
  const [balance,      setBalance]      = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [pending,      setPending]      = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [refreshing,   setRefreshing]   = useState(false);
  const [error,        setError]        = useState("");

  // Entrance animations
  const headerOp    = useRef(new Animated.Value(0)).current;
  const headerY     = useRef(new Animated.Value(-20)).current;
  const balanceOp   = useRef(new Animated.Value(0)).current;
  const balanceScale = useRef(new Animated.Value(0.9)).current;
  const promoOp     = useRef(new Animated.Value(0)).current;
  const promoY      = useRef(new Animated.Value(20)).current;
  const txOp        = useRef(new Animated.Value(0)).current;
  const orbAnim     = useRef(new Animated.Value(0)).current;

  // ── Load data ────────────────────────────────────────────────────────────────
  // Load wallet balance, transactions, and pending transactions
  const sortTransactions = (txs) =>
    [...txs].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

  const loadData = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError("");
    try {
      if (user?.walletAddress) {
        // getWalletBalance
        let balanceRes = null;
        try {
          balanceRes = await api.getWalletBalance();
          setBalance(balanceRes.data);
        } catch (err) {
          setError("Failed to load wallet balance");
        }
        // getTransactions
        let txRes = null;
        try {
          txRes = await api.getTransactions("all", 1, 20);
          const txList = Array.isArray(txRes.data.transactions)
            ? sortTransactions(txRes.data.transactions)
            : [];
          setTransactions(txList.slice(0, 3));
        } catch (err) {
          setError("Failed to load transactions");
        }
        // getPendingTransactions
        let pendingRes = null;
        try {
          pendingRes = await api.getPendingTransactions();
          setPending(pendingRes.data.transactions || []);
        } catch (err) {
          setError("Failed to load pending transactions");
        }
      }
    } catch (err) {
      setError("Could not load data. Pull down to refresh.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.walletAddress]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Entrance animations ───────────────────────────────────────────────────
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(orbAnim, { toValue: 1, duration: 5000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(orbAnim, { toValue: 0, duration: 5000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    Animated.sequence([
      Animated.parallel([
        Animated.timing(headerOp,  { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(headerY,   { toValue: 0, duration: 400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(balanceOp, { toValue: 1, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.spring(balanceScale, { toValue: 1, friction: 6, tension: 50, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(promoOp, { toValue: 1, duration: 450, useNativeDriver: true }),
        Animated.timing(promoY,  { toValue: 0, duration: 450, easing: Easing.out(Easing.back(1.1)), useNativeDriver: true }),
      ]),
      Animated.timing(txOp, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData(true);
  };

  const orbTranslate = orbAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -20] });
  const hasWallet = !!user?.walletAddress;

  useEffect(() => {
    if (hasWallet && activeTab === "Wallet") {
      setActiveTab("Home");
    }
  }, [hasWallet, activeTab]);


  // Hide Wallet tab if wallet is connected
  const tabs = [
    { name: "Home",     icon: Home },
    ...(hasWallet ? [] : [{ name: "Wallet", icon: Wallet }]),
    { name: "Scan",     icon: QrCode, isCenter: true },
    { name: "Activity", icon: Activity },
    { name: "Profile",  icon: User },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
      <StatusBar barStyle={mode === "dark" ? "light-content" : "dark-content"} backgroundColor={colors.background} />

      {/* Background orbs */}
      <Animated.View style={[styles.bgOrb, { transform: [{ translateY: orbTranslate }] }]} />
      <View style={styles.bgOrb2} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#2D6FF0"
            colors={["#2D6FF0"]}
          />
        }
      >
        {/* ── Header ── */}
        <Animated.View style={[styles.header, { opacity: headerOp, transform: [{ translateY: headerY }] }]}>
          <View style={styles.headerLeft}>
            <View style={[styles.avatar, { backgroundColor: mode === "dark" ? "rgba(45,111,240,0.16)" : "rgba(45,111,240,0.08)", borderColor: mode === "dark" ? "rgba(45,111,240,0.35)" : "rgba(45,111,240,0.2)" }]}>
              <Text style={[styles.avatarText, { color: colors.primary }]}>{getInitials(user?.name)}</Text>
            </View>
            <View>
              <Text style={[styles.greeting, { color: colors.textSecondary }]}>{getGreeting()}</Text>
              <Text style={[styles.userName, { color: colors.textPrimary }]}>{user?.name?.split(" ")[0] || "User"}</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]} activeOpacity={0.7} onPress={toggleTheme}>
              <Text style={{ color: colors.textPrimary, fontSize: 16 }}>{mode === "dark" ? "☀" : "☾"}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.bellBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]} activeOpacity={0.7} onPress={() => goTo("Notification")}> 
              <Bell color={colors.textPrimary} size={20} strokeWidth={2} />
              {pending.length > 0 && <View style={styles.bellDot} />}
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* ── Connect Wallet Banner (shown when no wallet) ── */}
        {!hasWallet && <ConnectWalletBanner onPress={() => goTo("WalletSetup")} />}

        {/* ── Error banner ── */}
        {error && (
          <View style={styles.errorBanner}>
            <AlertCircle color="#EF4444" size={16} strokeWidth={2} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* ── Balance card ── */}
        <Animated.View style={[styles.balanceCard, { opacity: balanceOp, transform: [{ scale: balanceScale }], backgroundColor: mode === "dark" ? "#0D1E3C" : colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}> 
            {hasWallet ? "Wallet Balance" : "Connect wallet to see balance"}
          </Text>

          {loading && hasWallet ? (
            <ActivityIndicator color="#2D6FF0" style={{ marginVertical: 12 }} />
          ) : (
            <Text style={[styles.balanceAmount, { color: colors.textPrimary }]}> 
              {hasWallet ? `Ξ ${formatEth(balance?.balanceEth)}` : "— —"}
            </Text>
          )}

          {/* Wallet address pill */}
          {hasWallet && balance?.walletAddress && (
            <View style={styles.addressPill}>
              <View style={styles.addressDot} />
              <Text style={[styles.addressText, { color: mode === "dark" ? "#63B3FF" : colors.primary }]}> 
                {formatAddress(balance.walletAddress)}
              </Text>
            </View>
          )}

          <View style={[styles.balanceLine, { backgroundColor: colors.border }]} />

          {/* Quick actions */}
          <View style={styles.quickActionsRow}>
            <QuickAction icon={Send}       label="Send"    delay={200} onPress={() => hasWallet ? goTo("Send")     : goTo("WalletSetup")} />
            <QuickAction icon={Download}   label="Receive" delay={300} onPress={() => hasWallet ? goTo("Receive")  : goTo("WalletSetup")} />
            <QuickAction icon={CreditCard} label="Pay"     delay={400} onPress={() => hasWallet ? goTo("Pay")      : goTo("WalletSetup")} />
            <QuickAction icon={Clock}      label="History" delay={500} onPress={() => goTo("Activity")} />
          </View>
        </Animated.View>

        {/* ── Promo card ── */}
        <Animated.View style={[styles.promoCard, { opacity: promoOp, transform: [{ translateY: promoY }], backgroundColor: mode === "dark" ? "#1A3A7A" : colors.surface, borderColor: mode === "dark" ? "rgba(45,111,240,0.3)" : colors.border }]}>
          <View style={styles.promoContent}>
            <Text style={[styles.promoTitle, { color: colors.textPrimary }]}>Blockchain Secured</Text>
            <Text style={[styles.promoSubtitle, { color: mode === "dark" ? "rgba(255,255,255,0.6)" : colors.textSecondary }]}> 
              Every transaction recorded on Ethereum. Fully verifiable, tamper-proof.
            </Text>
          </View>
          <View style={styles.promoIconWrap}>
            <Sparkles color="#FFFFFF" size={24} strokeWidth={2} />
          </View>
          <View style={styles.promoCircle1} />
          <View style={styles.promoCircle2} />
        </Animated.View>

        {/* ── Recent transactions ── */}
        <Animated.View style={[styles.txSection, { opacity: txOp }]}>
          <View style={styles.txHeader}>
            <Text style={[styles.txHeaderTitle, { color: colors.textPrimary }]}>Recent Transactions</Text>
            <TouchableOpacity activeOpacity={0.6} onPress={() => goTo("Activity")}>
              <Text style={[styles.txSeeAll, { color: colors.primary }]}>See all</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.txList, { backgroundColor: mode === "dark" ? "#0D1E3C" : colors.surfaceElevated, borderColor: colors.border }]}> 
            {loading && hasWallet ? (
              <View style={styles.txLoadingContainer}>
                <ActivityIndicator color="#2D6FF0" />
                <Text style={styles.txLoadingText}>Loading transactions...</Text>
              </View>
            ) : !hasWallet ? (
              <View style={styles.txEmptyContainer}>
                <Wallet color="#1E2D4A" size={32} strokeWidth={1.5} />
                <Text style={styles.txEmptyText}>Connect your wallet to see transactions</Text>
                <TouchableOpacity style={styles.txEmptyBtn} onPress={() => goTo("WalletSetup")} activeOpacity={0.8}>
                  <Text style={styles.txEmptyBtnText}>Connect Wallet</Text>
                </TouchableOpacity>
              </View>
            ) : transactions.length === 0 ? (
              <View style={styles.txEmptyContainer}>
                <Clock color="#1E2D4A" size={32} strokeWidth={1.5} />
                <Text style={styles.txEmptyText}>No transactions yet</Text>
                <Text style={styles.txEmptySubText}>Send or receive ETH to get started</Text>
              </View>
            ) : (
              transactions.map((tx, i) => (
                <View key={tx.txHash}>
                  <TransactionItem
                    tx={tx}
                    walletAddress={user?.walletAddress}
                    delay={600 + i * 150}
                    onPress={() => goTo("Activity")}
                  />
                  {i < transactions.length - 1 && <View style={styles.txDivider} />}
                </View>
              ))
            )}
          </View>
        </Animated.View>
      </ScrollView>

      {/* ── Bottom tab bar ── */}
      <View style={[styles.tabBar, { backgroundColor: mode === "dark" ? "#0A1628" : colors.surface, borderTopColor: colors.border }]}> 
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.name}
            style={[styles.tabItem, tab.isCenter && styles.tabCenter]}
            activeOpacity={0.7}
            onPress={() => {
              if (tab.name === "Wallet")   goTo("WalletSetup");
              else if (tab.name === "Activity") goTo("Activity");
              else if (tab.name === "Profile")  goTo("Profile");
              else if (tab.name === "Scan")     goTo("Scan");
              else setActiveTab(tab.name);
            }}
          >
            {tab.isCenter ? (
              <View style={[styles.scanButton, { borderColor: mode === "dark" ? "#0A1628" : "#FFFFFF" }]}>
                <tab.icon color="#FFFFFF" size={22} strokeWidth={2.5} />
              </View>
            ) : (
              <>
                <tab.icon
                  color={activeTab === tab.name ? colors.primary : colors.textMuted}
                  size={22}
                  strokeWidth={activeTab === tab.name ? 2.5 : 1.8}
                />
                <Text style={[styles.tabLabel, activeTab === tab.name && styles.tabLabelActive, { color: activeTab === tab.name ? colors.primary : colors.textMuted }]}> 
                  {tab.name}
                </Text>
                {activeTab === tab.name && <View style={[styles.tabDot, { backgroundColor: colors.primary }]} />}
              </>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: "#060D1A" },
  scrollView:    { flex: 1 },
  scrollContent: { paddingBottom: 20 },

  bgOrb:  { position: "absolute", width: 300, height: 300, borderRadius: 150, backgroundColor: "rgba(45,111,240,0.08)", top: -80, right: -60 },
  bgOrb2: { position: "absolute", width: 200, height: 200, borderRadius: 100, backgroundColor: "rgba(99,178,255,0.04)", bottom: 150, left: -80 },

  // Header
  header:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24, paddingTop: 16, paddingBottom: 20 },
  headerActions: { flexDirection: "row", alignItems: "center", columnGap: 10 },
  iconBtn:     { width: 42, height: 42, borderRadius: 13, justifyContent: "center", alignItems: "center", borderWidth: 1 },
  headerLeft:  { flexDirection: "row", alignItems: "center", columnGap: 12 },
  avatar:      { width: 44, height: 44, borderRadius: 22, backgroundColor: "#1A3A7A", justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: "rgba(45,111,240,0.4)" },
  avatarText:  { color: "#63B3FF", fontSize: 16, fontWeight: "700" },
  greeting:    { color: "#6B7A99", fontSize: 13, fontWeight: "400" },
  userName:    { color: "#FFFFFF", fontSize: 18, fontWeight: "700", letterSpacing: -0.3 },
  bellBtn:     { width: 42, height: 42, borderRadius: 13, justifyContent: "center", alignItems: "center", borderWidth: 1 },
  bellDot:     { position: "absolute", top: 10, right: 12, width: 7, height: 7, borderRadius: 4, backgroundColor: "#EF4444", borderWidth: 1.5, borderColor: "#060D1A" },

  // Connect wallet banner
  connectBanner:     { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "rgba(245,158,11,0.08)", borderWidth: 1, borderColor: "rgba(245,158,11,0.25)", borderRadius: 16, padding: 16, marginHorizontal: 24, marginBottom: 16 },
  connectBannerLeft: { flexDirection: "row", alignItems: "center", columnGap: 12, flex: 1 },
  connectBannerIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(245,158,11,0.12)", justifyContent: "center", alignItems: "center" },
  connectBannerTitle:{ color: "#000000", fontSize: 14, fontWeight: "700", marginBottom: 2 },
  connectBannerSub:  { color: "#64748B", fontSize: 12 },

  // Error banner
  errorBanner: { flexDirection: "row", alignItems: "center", columnGap: 8, backgroundColor: "rgba(239,68,68,0.08)", borderWidth: 1, borderColor: "rgba(239,68,68,0.2)", borderRadius: 12, padding: 12, marginHorizontal: 24, marginBottom: 16 },
  errorText:   { color: "#F87171", fontSize: 13, flex: 1 },

  // Balance card
  balanceCard:   { marginHorizontal: 24, backgroundColor: "#0D1E3C", borderRadius: 24, padding: 24, borderWidth: 1, borderColor: "rgba(45,111,240,0.15)", marginBottom: 20 },
  balanceLabel:  { color: "#6B7A99", fontSize: 13, fontWeight: "500", marginBottom: 6 },
  balanceAmount: { color: "#FFFFFF", fontSize: 34, fontWeight: "800", letterSpacing: -1, marginBottom: 12 },
  addressPill:   { flexDirection: "row", alignItems: "center", columnGap: 6, backgroundColor: "rgba(45,111,240,0.08)", borderWidth: 1, borderColor: "rgba(45,111,240,0.15)", borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4, alignSelf: "flex-start", marginBottom: 20 },
  addressDot:    { width: 6, height: 6, borderRadius: 3, backgroundColor: "#10B981" },
  addressText:   { color: "#63B3FF", fontSize: 12, fontWeight: "500", fontFamily: "monospace" },
  balanceLine:   { height: 1, backgroundColor: "rgba(255,255,255,0.06)", marginBottom: 20 },
  quickActionsRow: { flexDirection: "row", justifyContent: "space-between" },

  // Quick actions
  quickAction:      { alignItems: "center", rowGap: 8 },
  quickActionIcon:  { width: 52, height: 52, borderRadius: 16, backgroundColor: "#2D6FF0", justifyContent: "center", alignItems: "center", shadowColor: "#2D6FF0", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6 },
  quickActionLabel: { color: "#8A94A6", fontSize: 12, fontWeight: "500" },

  // Skeleton
  skeletonCard: { marginHorizontal: 24, backgroundColor: "#F8FAFC", borderRadius: 24, padding: 24, marginBottom: 20 },
  skeletonLine: { height: 16, backgroundColor: "rgba(0,0,0,0.08)", borderRadius: 8, width: "40%" },

  // Promo card
  promoCard:      { marginHorizontal: 24, borderRadius: 20, padding: 20, flexDirection: "row", alignItems: "center", backgroundColor: "#1A3A7A", borderWidth: 1, borderColor: "rgba(45,111,240,0.3)", overflow: "hidden", marginBottom: 24 },
  promoContent:   { flex: 1 },
  promoTitle:     { color: "#FFFFFF", fontSize: 17, fontWeight: "700", marginBottom: 4 },
  promoSubtitle:  { color: "rgba(255,255,255,0.6)", fontSize: 13, lineHeight: 18 },
  promoIconWrap:  { width: 48, height: 48, borderRadius: 14, backgroundColor: "rgba(45,111,240,0.5)", justifyContent: "center", alignItems: "center", marginLeft: 12 },
  promoCircle1:   { position: "absolute", width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(45,111,240,0.12)", top: -20, right: -10 },
  promoCircle2:   { position: "absolute", width: 50, height: 50, borderRadius: 25, backgroundColor: "rgba(99,178,255,0.08)", bottom: -15, left: 50 },

  // Transactions
  txSection:    { paddingHorizontal: 24 },
  txHeader:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  txHeaderTitle:{ color: "#FFFFFF", fontSize: 18, fontWeight: "700", letterSpacing: -0.3 },
  txSeeAll:     { color: "#2D6FF0", fontSize: 13, fontWeight: "600" },
  txList:       { backgroundColor: "#0D1E3C", borderRadius: 20, padding: 4, borderWidth: 1, borderColor: "rgba(255,255,255,0.04)" },
  txItem:       {},
  txItemInner:  { flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 16 },
  txDivider:    { height: 1, backgroundColor: "rgba(0,0,0,0.05)", marginHorizontal: 16 },
  txIcon:       { width: 42, height: 42, borderRadius: 13, justifyContent: "center", alignItems: "center", marginRight: 12 },
  txDetails:    { flex: 1 },
  txName:       { color: "#FFFFFF", fontSize: 14, fontWeight: "600", marginBottom: 3 },
  txDate:       { color: "#6B7A99", fontSize: 12 },
  txAmountArea: { alignItems: "flex-end" },
  txAmount:     { fontSize: 14, fontWeight: "700", marginBottom: 4 },
  statusBadge:  { borderRadius: 100, paddingHorizontal: 8, paddingVertical: 2 },
  statusText:   { fontSize: 10, fontWeight: "600", textTransform: "capitalize" },

  // Empty / loading states
  txLoadingContainer: { paddingVertical: 32, alignItems: "center", rowGap: 12 },
  txLoadingText:      { color: "#3D5070", fontSize: 13 },
  txEmptyContainer:   { paddingVertical: 32, alignItems: "center", rowGap: 10 },
  txEmptyText:        { color: "#3D5070", fontSize: 14, fontWeight: "600", textAlign: "center" },
  txEmptySubText:     { color: "#1E2D4A", fontSize: 12, textAlign: "center" },
  txEmptyBtn:         { backgroundColor: "rgba(45,111,240,0.12)", borderWidth: 1, borderColor: "rgba(45,111,240,0.25)", borderRadius: 100, paddingHorizontal: 20, paddingVertical: 8, marginTop: 4 },
  txEmptyBtnText:     { color: "#2D6FF0", fontSize: 13, fontWeight: "600" },

  // Tab bar
  tabBar:       { flexDirection: "row", backgroundColor: "#0A1628", paddingTop: 8, paddingBottom: 28, paddingHorizontal: 8, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.04)", alignItems: "flex-end" },
  tabItem:      { flex: 1, alignItems: "center", rowGap: 4, paddingTop: 4 },
  tabCenter:    { marginTop: -20 },
  scanButton:   { width: 52, height: 52, borderRadius: 16, backgroundColor: "#2D6FF0", justifyContent: "center", alignItems: "center", shadowColor: "#2D6FF0", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 14, elevation: 8, borderWidth: 3, borderColor: "#0A1628" },
  tabLabel:     { fontSize: 10, fontWeight: "500", color: "rgba(255,255,255,0.35)" },
  tabLabelActive: { color: "#2D6FF0", fontWeight: "700" },
  tabDot:       { width: 4, height: 4, borderRadius: 2, backgroundColor: "#2D6FF0", marginTop: 2 },
});

export default HomeScreen;