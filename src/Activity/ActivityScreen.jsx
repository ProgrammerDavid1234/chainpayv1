import React, { useRef, useEffect, useState, useCallback } from "react";
import useAuth from "../hooks/useAuth";
import useApi from "../hooks/useApi";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  Dimensions,
  Animated,
  Easing,
  ScrollView,
} from "react-native";
import {
  Home,
  Wallet,
  QrCode,
  Activity,
  User,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Filter,
} from "lucide-react-native";

const { width } = Dimensions.get("window");

// ─── Transaction item ─────────────────────────────────────────────────────────
const TransactionItem = ({ name, date, amount, category, isIncome, status, delay }) => {
  const entranceOp = useRef(new Animated.Value(0)).current;
  const entranceX = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(entranceOp, {
        toValue: 1,
        duration: 450,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(entranceX, {
        toValue: 0,
        duration: 450,
        delay,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.txItem,
        { opacity: entranceOp, transform: [{ translateX: entranceX }] },
      ]}
    >
      {/* Icon */}
      <View
        style={[
          styles.txIcon,
          {
            backgroundColor: isIncome
              ? "rgba(16,185,129,0.1)"
              : "rgba(239,68,68,0.1)",
          },
        ]}
      >
        {isIncome ? (
          <ArrowDownLeft color="#10B981" size={18} strokeWidth={2.5} />
        ) : (
          <ArrowUpRight color="#EF4444" size={18} strokeWidth={2.5} />
        )}
      </View>

      {/* Details */}
      <View style={styles.txDetails}>
        <Text style={styles.txName}>{name}</Text>
        <Text style={styles.txDate}>{date}</Text>
      </View>

      {/* Amount & Status */}
      <View style={styles.txAmountArea}>
        <Text
          style={[
            styles.txAmount,
            { color: isIncome ? "#10B981" : "#EF4444" },
          ]}
        >
          {isIncome ? "+" : "-"}₦{amount}
        </Text>
        {status ? (
          <Text style={[styles.txCategory, styles.txStatus]}>{status}</Text>
        ) : (
          <Text style={styles.txCategory}>{category}</Text>
        )}
      </View>
    </Animated.View>
  );
};

// ─── Filter Chip ─────────────────────────────────────────────────────────────
const FilterChip = ({ label, active, onPress }) => (
  <TouchableOpacity
    style={[styles.filterChip, active && styles.filterChipActive]}
    activeOpacity={0.7}
    onPress={onPress}
  >
    <Text style={[styles.filterText, active && styles.filterTextActive]}>
      {label}
    </Text>
  </TouchableOpacity>
);

// ─── Main ActivityScreen ──────────────────────────────────────────────────────
const ActivityScreen = ({ goTo }) => {
  const { user } = useAuth();
  const api = useApi();
  const [activeFilter, setActiveFilter] = useState("All");
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedTx, setSelectedTx] = useState(null);
  const [txDetails, setTxDetails] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);
  // Load transactions by filter
  const loadTransactions = useCallback(async () => {
    setLoading(true);
    setError("");
    let filter = "all";
    if (activeFilter === "Income") filter = "received";
    else if (activeFilter === "Expense") filter = "sent";
    else if (activeFilter === "Pending") filter = "pending";
    try {
      const res = await api.getTransactions(filter, 1);
      setTransactions(res.data.transactions || []);
    } catch (err) {
      setError("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, [activeFilter, api]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // Load transaction details
  const handleTxPress = async (txHash) => {
    setSelectedTx(txHash);
    setTxDetails(null);
    setVerifying(false);
    setVerifyResult(null);
    try {
      const res = await api.getTransaction(txHash);
      setTxDetails(res.data);
    } catch {
      setTxDetails({ error: "Failed to load details" });
    }
  };

  // Verify transaction
  const handleVerify = async (txHash) => {
    setVerifying(true);
    setVerifyResult(null);
    try {
      const res = await api.verifyTransaction(txHash);
      setVerifyResult(res.data);
    } catch {
      setVerifyResult({ error: "Verification failed" });
    } finally {
      setVerifying(false);
    }
  };

  // Entrance animations
  const headerOp = useRef(new Animated.Value(0)).current;
  const headerY = useRef(new Animated.Value(-20)).current;
  const listOp = useRef(new Animated.Value(0)).current;

  // Background orb
  const orbAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(orbAnim, {
          toValue: 1,
          duration: 5000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(orbAnim, {
          toValue: 0,
          duration: 5000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.sequence([
      Animated.parallel([
        Animated.timing(headerOp, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(headerY, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(listOp, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const orbTranslate = orbAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20],
  });

  const tabs = [
    { name: "Home", icon: Home },
    { name: "Wallet", icon: Wallet },
    { name: "Scan", icon: QrCode, isCenter: true },
    { name: "Activity", icon: Activity },
    { name: "Profile", icon: User },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#060D1A" />

      {/* Background orbs */}
      <Animated.View
        style={[styles.bgOrb, { transform: [{ translateY: orbTranslate }] }]}
      />
      <View style={styles.bgOrb2} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View
          style={[
            styles.header,
            { opacity: headerOp, transform: [{ translateY: headerY }] },
          ]}
        >
          <Text style={styles.headerTitle}>Activity</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
              <Search color="#FFFFFF" size={20} strokeWidth={2} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
              <Filter color="#FFFFFF" size={20} strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Animated.View style={{ opacity: listOp }}>
          {/* Filters */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersContainer}
          >
            {["All", "Income", "Expense", "Pending"].map((filter) => (
              <FilterChip
                key={filter}
                label={filter}
                active={activeFilter === filter}
                onPress={() => setActiveFilter(filter)}
              />
            ))}
          </ScrollView>

          {/* Transactions List */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Transactions</Text>
            <View style={styles.txCard}>
              {loading ? (
                <Text style={{ color: '#888', textAlign: 'center', marginVertical: 20 }}>Loading...</Text>
              ) : error ? (
                <Text style={{ color: 'red', textAlign: 'center', marginVertical: 20 }}>{error}</Text>
              ) : transactions.length === 0 ? (
                <Text style={{ color: '#888', textAlign: 'center', marginVertical: 20 }}>No transactions found</Text>
              ) : (
                transactions.map((tx, i) => (
                  <View key={tx.txHash}>
                    <TouchableOpacity onPress={() => handleTxPress(tx.txHash)}>
                      <TransactionItem
                        name={tx.to}
                        date={tx.timestamp}
                        amount={tx.amountEth}
                        category={tx.direction}
                        isIncome={tx.direction === 'received'}
                        status={tx.status}
                        delay={100 + i * 100}
                      />
                    </TouchableOpacity>
                    {i < transactions.length - 1 && <View style={styles.txDivider} />}
                  </View>
                ))
              )}
            </View>
          </View>

          {/* Transaction Details Modal */}
          {selectedTx && txDetails && (
            <View style={{ backgroundColor: '#fff', padding: 16, margin: 16, borderRadius: 8 }}>
              <Text style={{ fontWeight: 'bold' }}>Transaction Details</Text>
              <Text>Hash: {selectedTx}</Text>
              <Text>Status: {txDetails.status}</Text>
              <Text>From: {txDetails.from}</Text>
              <Text>To: {txDetails.to}</Text>
              <Text>Amount: {txDetails.amountEth}</Text>
              <TouchableOpacity onPress={() => handleVerify(selectedTx)} style={{ marginTop: 8, backgroundColor: '#2D6FF0', padding: 8, borderRadius: 4 }}>
                <Text style={{ color: '#fff', textAlign: 'center' }}>{verifying ? 'Verifying...' : 'Verify Transaction'}</Text>
              </TouchableOpacity>
              {verifyResult && (
                <Text style={{ color: verifyResult.error ? 'red' : 'green', marginTop: 8 }}>
                  {verifyResult.error ? verifyResult.error : 'Verified!'}
                </Text>
              )}
              <TouchableOpacity onPress={() => { setSelectedTx(null); setTxDetails(null); setVerifyResult(null); }} style={{ marginTop: 8 }}>
                <Text style={{ color: '#2D6FF0', textAlign: 'center' }}>Close</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Bottom tab bar */}
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.name}
            style={[styles.tabItem, tab.isCenter && styles.tabCenter]}
            activeOpacity={0.7}
            onPress={() => {
              if (tab.name === "Wallet") {
                goTo("WalletSetup");
              } else if (tab.name === "Activity") {
                // Already here
              } else if (tab.name === "Home") {
                goTo("Home");
              } else if (tab.name === "Profile") {
                goTo("Profile");
              } else if (tab.name === "Scan") {
                goTo("Scan");
              } else {
                // Implement other tabs
              }
            }}
          >
            {tab.isCenter ? (
              <View style={styles.scanButton}>
                <tab.icon color="#FFFFFF" size={22} strokeWidth={2.5} />
              </View>
            ) : (
              <>
                <tab.icon
                  color={
                    "Activity" === tab.name
                      ? "#2D6FF0"
                      : "rgba(255,255,255,0.35)"
                  }
                  size={22}
                  strokeWidth={"Activity" === tab.name ? 2.5 : 1.8}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    "Activity" === tab.name && styles.tabLabelActive,
                  ]}
                >
                  {tab.name}
                </Text>
                {"Activity" === tab.name && <View style={styles.tabDot} />}
              </>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#060D1A",
    paddingTop: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // Background
  bgOrb: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(45,111,240,0.08)",
    top: -80,
    right: -60,
  },
  bgOrb2: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(99,178,255,0.04)",
    bottom: 150,
    left: -80,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: "row",
    gap: 12,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.06)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },

  // Filters
  filtersContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  filterChipActive: {
    backgroundColor: "#2D6FF0",
    borderColor: "#2D6FF0",
  },
  filterText: {
    color: "#8E9EBA",
    fontSize: 14,
    fontWeight: "500",
  },
  filterTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  // Transactions Section
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#8E9EBA",
    marginBottom: 12,
    paddingHorizontal: 24,
  },
  txCard: {
    backgroundColor: "rgba(255,255,255,0.02)",
    borderRadius: 20,
    marginHorizontal: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.03)",
  },
  txItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  txIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  txDetails: {
    flex: 1,
  },
  txName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  txDate: {
    fontSize: 13,
    color: "#8E9EBA",
    fontWeight: "400",
  },
  txAmountArea: {
    alignItems: "flex-end",
  },
  txAmount: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  txCategory: {
    fontSize: 12,
    color: "#8E9EBA",
    fontWeight: "500",
  },
  txStatus: {
    color: "#10B981",
  },
  txDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    marginVertical: 14,
  },

  // Tab bar
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#0A1222",
    paddingVertical: 12,
    paddingBottom: 28,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    width: 60,
    height: 50,
  },
  tabCenter: {
    transform: [{ translateY: -20 }],
  },
  scanButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#2D6FF0",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#2D6FF0",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: "rgba(255,255,255,0.5)",
    marginTop: 6,
  },
  tabLabelActive: {
    color: "#2D6FF0",
    fontWeight: "700",
  },
  tabDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#2D6FF0",
    position: "absolute",
    bottom: -10,
  },
});

export default ActivityScreen;
