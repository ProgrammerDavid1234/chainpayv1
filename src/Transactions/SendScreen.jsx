import React, { useRef, useEffect, useState, useCallback } from "react";
import useApi from "../hooks/useApi";
import { getAuthToken } from "../services/api";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  ScrollView,
  Animated,
  Easing,
  Keyboard,
  TouchableWithoutFeedback,
  Vibration,
  Linking,
  Alert,
} from "react-native";
import {
  ArrowLeft,
  Send,
  QrCode,
  ChevronDown,
  Wallet,
  AlertCircle,
  CheckCircle2,
  Clock,
  RefreshCw,
} from "lucide-react-native";

const ETH_TO_USD = 3480;

const SEND_PAGE_BASE = "https://chainpaybackend.onrender.com";

const RECENT_CONTACTS = [
  { id: "1", name: "Alex K.", address: "0x1A2b...9F3d", avatar: "AK" },
  { id: "2", name: "Mide O.", address: "0x4C5e...2B1a", avatar: "MO" },
  { id: "3", name: "Sola T.", address: "0x7F8g...5E4c", avatar: "ST" },
  { id: "4", name: "Kemi A.", address: "0x9D0h...8G7f", avatar: "KA" },
];

const QUICK_AMOUNTS = ["0.01", "0.05", "0.1", "0.5"];

// Returns true for full or truncated 0x addresses (e.g. "0x1A2b...9F3d" or "0xABC123...")
const isEthAddress = (val) => /^0x[0-9a-fA-F.]{6,}/.test(val.trim());

// ─── Avatar pill ──────────────────────────────────────────────────────────────
const ContactPill = ({ contact, onPress, selected }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const selectAnim = useRef(new Animated.Value(selected ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(selectAnim, {
      toValue: selected ? 1 : 0,
      friction: 6,
      tension: 80,
      useNativeDriver: false,
    }).start();
  }, [selected]);

  const bgColor = selectAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(0,0,0,0.06)", "rgba(45,111,240,0.2)"],
  });
  const borderColor = selectAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(0,0,0,0.08)", "#2D6FF0"],
  });

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      onPressIn={() =>
        Animated.spring(scaleAnim, {
          toValue: 0.93,
          useNativeDriver: true,
        }).start()
      }
      onPressOut={() =>
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          useNativeDriver: true,
        }).start()
      }
    >
      <Animated.View
        style={[
          styles.contactPill,
          {
            transform: [{ scale: scaleAnim }],
            backgroundColor: bgColor,
            borderColor,
          },
        ]}
      >
        <View style={[styles.avatar, selected && styles.avatarSelected]}>
          <Text style={styles.avatarText}>{contact.avatar}</Text>
        </View>
        <View>
          <Text style={[styles.contactName, selected && { color: "#000000" }]}>
            {contact.name}
          </Text>
          <Text style={styles.contactAddress}>{contact.address}</Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

// ─── Quick amount chip ────────────────────────────────────────────────────────
const AmountChip = ({ value, onPress, selected }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      onPressIn={() =>
        Animated.spring(scaleAnim, {
          toValue: 0.9,
          useNativeDriver: true,
        }).start()
      }
      onPressOut={() =>
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          useNativeDriver: true,
        }).start()
      }
    >
      <Animated.View
        style={[
          styles.amountChip,
          selected && styles.amountChipSelected,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <Text
          style={[
            styles.amountChipText,
            selected && styles.amountChipTextSelected,
          ]}
        >
          {value} ETH
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

// ─── Fee row ──────────────────────────────────────────────────────────────────
const FeeRow = ({ label, value, muted }) => (
  <View style={styles.feeRow}>
    <Text style={styles.feeLabel}>{label}</Text>
    <Text
      style={[styles.feeValue, muted && { color: "rgba(0,0,0,0.35)" }]}
    >
      {value}
    </Text>
  </View>
);

// ─── Main screen ──────────────────────────────────────────────────────────────
const SendScreen = ({ goTo, prefillAddress = "" }) => {
  const api = useApi();

  // ── Balance state ──────────────────────────────────────────────────────────
  const [balanceETH, setBalanceETH] = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [balanceError, setBalanceError] = useState("");

  // ── Form state ─────────────────────────────────────────────────────────────
  const [recipient, setRecipient] = useState(prefillAddress);
  const [amount, setAmount] = useState("");
  const [selectedContact, setSelectedContact] = useState(null);
  const [selectedQuick, setSelectedQuick] = useState(null);
  const [addressFocused, setAddressFocused] = useState(false);
  const [amountFocused, setAmountFocused] = useState(false);

  // ── Gas state ──────────────────────────────────────────────────────────────
  const [gasEstimate, setGasEstimate] = useState(null);
  const [loadingGas, setLoadingGas] = useState(false);
  const [gasError, setGasError] = useState("");

  // ── Send state ─────────────────────────────────────────────────────────────
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");

  // ── Derived values ─────────────────────────────────────────────────────────
  const amountNum = parseFloat(amount) || 0;
  const amountUSD = (amountNum * ETH_TO_USD).toFixed(2);
  const gasFee = gasEstimate?.gasFeeEth ?? 0.0008;
  const total = amountNum + gasFee;
  const hasEnough = balanceETH !== null ? total <= balanceETH : true;
  // True when field looks like a 0x wallet address; false means treat as a name
  const recipientIsAddress = isEthAddress(recipient);
  // A name needs ≥2 chars, an address needs more — both satisfied by trim().length > 1
  const isValid =
    recipient.trim().length > 1 && amountNum > 0 && hasEnough && !loadingGas;
  const insufficientFunds = amountNum > 0 && balanceETH !== null && !hasEnough;

  // ── Animations ─────────────────────────────────────────────────────────────
  const headerOp = useRef(new Animated.Value(0)).current;
  const headerY = useRef(new Animated.Value(-20)).current;
  const cardOp = useRef(new Animated.Value(0)).current;
  const cardY = useRef(new Animated.Value(32)).current;
  const btnScale = useRef(new Animated.Value(1)).current;
  const errorShake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(headerOp, {
          toValue: 1,
          duration: 380,
          useNativeDriver: true,
        }),
        Animated.timing(headerY, {
          toValue: 0,
          duration: 380,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(cardOp, {
          toValue: 1,
          duration: 450,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(cardY, {
          toValue: 0,
          duration: 450,
          easing: Easing.out(Easing.back(1.1)),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  // ── API 1: Fetch wallet balance ────────────────────────────────────────────
  // GET /wallet/balance
  const fetchBalance = useCallback(async () => {
    setBalanceLoading(true);
    setBalanceError("");
    try {
      const res = await api.getWalletBalance();
      // Expected shape: { data: { balanceEth: number, balanceUsd?: number } }
      const eth =
        res?.data?.balanceEth ?? res?.data?.balance ?? res?.data?.eth ?? null;
      setBalanceETH(eth);
    } catch (err) {
      setBalanceError("Could not load balance");
      setBalanceETH(null);
    } finally {
      setBalanceLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  // ── API 2: Fetch gas estimate ──────────────────────────────────────────────
  // GET /wallet/gas-estimate?to=<address>&amount=<eth>
  useEffect(() => {
    if (recipient.trim().length > 5 && amountNum > 0) {
      let cancelled = false;
      setLoadingGas(true);
      setGasError("");

      const run = async () => {
        try {
          // For name-based recipients the backend resolves the address internally.
          // Pass `to` for addresses and `toName` for names so gas estimation works either way.
          const res = await api.getGasEstimate(
            recipientIsAddress ? recipient.trim() : null,
            amountNum,
            recipientIsAddress ? undefined : recipient.trim(),
          );
          // Expected shape: { data: { gasFeeEth: number, gasFeeUsd?: number, gasLimit?: number, gasPrice?: string } }
          if (!cancelled) setGasEstimate(res?.data ?? null);
        } catch (err) {
          if (!cancelled) {
            setGasError("Failed to estimate gas");
            setGasEstimate(null);
          }
        } finally {
          if (!cancelled) setLoadingGas(false);
        }
      };

      run();
      return () => {
        cancelled = true;
      };
    } else {
      setGasEstimate(null);
      setGasError("");
      setLoadingGas(false);
    }
  }, [recipient, amountNum, recipientIsAddress]);

  // ── Shake helper ───────────────────────────────────────────────────────────
  const shake = useCallback(() => {
    Vibration.vibrate(80);
    Animated.sequence([
      Animated.timing(errorShake, {
        toValue: 10,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(errorShake, {
        toValue: -10,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(errorShake, {
        toValue: 6,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(errorShake, {
        toValue: -6,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(errorShake, {
        toValue: 0,
        duration: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // ── Contact / amount helpers ───────────────────────────────────────────────
  const handleContactSelect = (contact) => {
    if (selectedContact?.id === contact.id) {
      setSelectedContact(null);
      setRecipient("");
    } else {
      setSelectedContact(contact);
      // Backend resolves recipient by name — pass the name, not the truncated address
      setRecipient(contact.name);
      Keyboard.dismiss();
    }
  };

  const handleQuickAmount = (val) => {
    if (selectedQuick === val) {
      setSelectedQuick(null);
      setAmount("");
    } else {
      setSelectedQuick(val);
      setAmount(val);
    }
  };

  const handleAmountChange = (text) => {
    setAmount(text);
    setSelectedQuick(null);
  };

  // ── API 3: Send transaction ─────────────────────────────────────────────
  const handleSend = async () => {
    if (!isValid || !amountNum || sending) return;

    const recipientTrimmed = recipient.trim();

    Alert.alert(
      "Confirm Send",
      `Send ${amountNum} ETH to ${recipientTrimmed}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Open MetaMask",
          onPress: async () => {
            setSending(true);
            setSendError(null);

            try {
              const res = await api.sendTransaction({
                ...(recipientIsAddress
                  ? { to: recipientTrimmed }
                  : { toName: recipientTrimmed }),
                amount: String(amountNum),
              });

              const txData = res?.data?.txData;
              if (!txData) {
                throw new Error("No transaction data returned");
              }

              // MetaMask mobile can't sign contract calls via the ethereum:
              // deep-link scheme (it drops the data parameter), so signing
              // happens on the /send web page running inside the MetaMask
              // browser, where ethers builds the calldata and MetaMask
              // estimates gas itself.
              // The app.link dapp URL must carry the query string RAW (never
              // encodeURIComponent'd) — Branch's resolver produces a blank/
              // "null" page on %-encoded URLs.
              const usesContract = !!res?.data?.usesContract;

              const dappUrl =
                `${SEND_PAGE_BASE}/send?` +
                `to=${recipientTrimmed}&` +
                `amount=${String(amountNum)}&` +
                `token=${getAuthToken() || ""}&` +
                `redirect=chainpay://` +
                (usesContract ? `&contract=${txData.to}` : "");

              const metamaskUrl =
                `https://metamask.app.link/dapp/${dappUrl.replace(/^https?:\/\//, "")}`;

              const canOpen = await Linking.canOpenURL(metamaskUrl);

              if (!canOpen) {
                Alert.alert(
                  "MetaMask Required",
                  "Please install MetaMask to complete this transaction.",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Install MetaMask",
                      onPress: () =>
                        Linking.openURL("https://metamask.io/download/"),
                    },
                  ],
                );
                setSending(false);
                return;
              }

              await Linking.openURL(metamaskUrl);
              setSending(false);

              Alert.alert(
                "Complete in MetaMask 🦊",
                "Review and confirm the transaction in the MetaMask browser " +
                  "(make sure you're on the Sepolia network). " +
                  (usesContract
                    ? "The payment goes through the ChainPay processor contract to your recipient."
                    : "The ETH is sent directly to your recipient."),
                [
                  {
                    text: "OK",
                    onPress: () => {
                      fetchBalance();
                      goTo("Home");
                    },
                  },
                ],
              );
            } catch (err) {
              console.error("Send error:", err);
              setSendError(err.message || "Failed to prepare transaction");
              setSending(false);
            }
          },
        },
      ],
    );
  };

  // ── Balance display helpers ────────────────────────────────────────────────
  const balanceDisplay = balanceLoading
    ? "Loading…"
    : balanceError
      ? "—"
      : `${Number(balanceETH).toFixed(4)} ETH`;

  const balanceUSDDisplay =
    !balanceLoading && !balanceError && balanceETH !== null
      ? `≈ $${(balanceETH * ETH_TO_USD).toLocaleString()}`
      : "";

  const gasDisplay = loadingGas
    ? "Estimating…"
    : gasError
      ? gasError
      : `${gasFee} ETH`;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

        {/* ── Header ── */}
        <Animated.View
          style={[
            styles.header,
            { opacity: headerOp, transform: [{ translateY: headerY }] },
          ]}
        >
          <TouchableOpacity
            style={styles.backBtn}
            activeOpacity={0.7}
            onPress={() => goTo("Home")}
          >
            <ArrowLeft color="#000000" size={20} strokeWidth={2.5} />
          </TouchableOpacity>

          <View>
            <Text style={styles.headerTitle}>Send Money</Text>
            <Text style={styles.headerSub}>Blockchain transfer</Text>
          </View>

          <TouchableOpacity
            style={styles.scanBtn}
            activeOpacity={0.7}
            onPress={() => goTo("Scan")}
          >
            <QrCode color="#2D6FF0" size={20} strokeWidth={2} />
          </TouchableOpacity>
        </Animated.View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={{ opacity: cardOp, transform: [{ translateY: cardY }] }}
          >
            {/* ── Balance card ── */}
            <View style={styles.balanceCard}>
              <View style={styles.balanceLeft}>
                <Text style={styles.balanceLabel}>Available balance</Text>
                <Text
                  style={[
                    styles.balanceETH,
                    balanceError && { color: "#E24B4A" },
                  ]}
                >
                  {balanceDisplay}
                </Text>
                {!!balanceUSDDisplay && (
                  <Text style={styles.balanceUSD}>{balanceUSDDisplay}</Text>
                )}
                {!!balanceError && (
                  <Text style={styles.balanceRetry} onPress={fetchBalance}>
                    Tap to retry
                  </Text>
                )}
              </View>
              <View style={styles.balanceIconWrap}>
                {balanceLoading ? (
                  <RefreshCw color="#2D6FF0" size={20} strokeWidth={2} />
                ) : (
                  <TouchableOpacity onPress={fetchBalance} activeOpacity={0.7}>
                    <Wallet color="#2D6FF0" size={22} strokeWidth={2} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* ── Recent contacts ── */}
            <Text style={styles.sectionLabel}>Recent</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.contactsRow}
            >
              {RECENT_CONTACTS.map((c) => (
                <ContactPill
                  key={c.id}
                  contact={c}
                  selected={selectedContact?.id === c.id}
                  onPress={() => handleContactSelect(c)}
                />
              ))}
            </ScrollView>

            {/* ── Recipient input ── */}
            <Text style={styles.sectionLabel}>To</Text>
            <Animated.View
              style={[
                styles.inputWrap,
                addressFocused && styles.inputWrapFocused,
                { transform: [{ translateX: errorShake }] },
              ]}
            >
              <TextInput
                style={styles.input}
                placeholder="Name, 0x address, or @username"
                placeholderTextColor="rgba(0,0,0,0.25)"
                value={recipient}
                onChangeText={(t) => {
                  setRecipient(t);
                  setSelectedContact(null);
                }}
                onFocus={() => setAddressFocused(true)}
                onBlur={() => setAddressFocused(false)}
                autoCapitalize="words"
                autoCorrect={false}
              />
              {recipient.trim().length > 1 && (
                <CheckCircle2 color="#1D9E75" size={18} strokeWidth={2} />
              )}
            </Animated.View>

            {/* ── Amount input ── */}
            <Text style={styles.sectionLabel}>Amount</Text>
            <View
              style={[
                styles.amountCard,
                amountFocused && styles.amountCardFocused,
                insufficientFunds && styles.amountCardError,
              ]}
            >
              <View style={styles.amountRow}>
                <TextInput
                  style={styles.amountInput}
                  placeholder="0.00"
                  placeholderTextColor="rgba(0,0,0,0.2)"
                  value={amount}
                  onChangeText={handleAmountChange}
                  onFocus={() => setAmountFocused(true)}
                  onBlur={() => setAmountFocused(false)}
                  keyboardType="decimal-pad"
                />
                <View style={styles.currencyBadge}>
                  <Text style={styles.currencyText}>ETH</Text>
                  <ChevronDown
                    color="rgba(0,0,0,0.4)"
                    size={14}
                    strokeWidth={2}
                  />
                </View>
              </View>
              {amountNum > 0 && (
                <Text style={styles.usdEquiv}>≈ ${amountUSD} USD</Text>
              )}
            </View>

            {insufficientFunds && (
              <View style={styles.errorRow}>
                <AlertCircle color="#E24B4A" size={14} strokeWidth={2} />
                <Text style={styles.errorText}>Insufficient balance</Text>
              </View>
            )}

            {/* ── Quick amounts ── */}
            <View style={styles.quickRow}>
              {QUICK_AMOUNTS.map((v) => (
                <AmountChip
                  key={v}
                  value={v}
                  selected={selectedQuick === v}
                  onPress={() => handleQuickAmount(v)}
                />
              ))}
            </View>

            {/* ── Fee breakdown ── */}
            {amountNum > 0 && (
              <View style={styles.feeCard}>
                <FeeRow label="Amount" value={`${amountNum.toFixed(4)} ETH`} />
                <FeeRow label="Estimated Gas Fee" value={gasDisplay} muted />
                <View style={styles.feeDivider} />
                <FeeRow label="Total" value={`${total.toFixed(6)} ETH`} />
                <View style={styles.feeNote}>
                  <Clock
                    color="rgba(0,0,0,0.3)"
                    size={12}
                    strokeWidth={2}
                  />
                  <Text style={styles.feeNoteText}>
                    Est. confirmation ~15s on Sepolia
                  </Text>
                </View>
              </View>
            )}

            {/* ── Send button ── */}
            <TouchableOpacity
              activeOpacity={isValid ? 0.85 : 1}
              onPress={handleSend}
              onPressIn={() =>
                isValid &&
                Animated.spring(btnScale, {
                  toValue: 0.96,
                  useNativeDriver: true,
                }).start()
              }
              onPressOut={() =>
                Animated.spring(btnScale, {
                  toValue: 1,
                  friction: 4,
                  useNativeDriver: true,
                }).start()
              }
            >
              <Animated.View
                style={[
                  styles.sendBtn,
                  !isValid && styles.sendBtnDisabled,
                  { transform: [{ scale: btnScale }] },
                ]}
              >
                {sending ? (
                  <Text style={styles.sendBtnText}>
                    Submitting to blockchain…
                  </Text>
                ) : (
                  <>
                    <Send
                      color="#FFFFFF"
                      size={18}
                      strokeWidth={2.5}
                      style={{ marginRight: 10 }}
                    />
                    <Text style={styles.sendBtnText}>
                      {isValid
                        ? `Send ${amountNum.toFixed(4)} ETH`
                        : "Send Now"}
                    </Text>
                  </>
                )}
              </Animated.View>
            </TouchableOpacity>

            {!!sendError && (
              <View
                style={[
                  styles.errorRow,
                  { justifyContent: "center", marginTop: 4 },
                ]}
              >
                <AlertCircle color="#E24B4A" size={14} strokeWidth={2} />
                <Text style={[styles.errorText, { marginLeft: 6 }]}>
                  {sendError}
                </Text>
              </View>
            )}

            <Text style={styles.disclaimer}>
              Transactions are irreversible once confirmed on-chain.
            </Text>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },

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
    backgroundColor: "rgba(0,0,0,0.07)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  headerTitle: {
    color: "#000000",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: -0.3,
  },
  headerSub: {
    color: "rgba(0,0,0,0.35)",
    fontSize: 11,
    textAlign: "center",
    marginTop: 1,
  },
  scanBtn: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "rgba(45,111,240,0.12)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(45,111,240,0.2)",
  },

  scroll: { paddingHorizontal: 20, paddingBottom: 48 },

  // Balance card
  balanceCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(45,111,240,0.1)",
    borderRadius: 18,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(45,111,240,0.18)",
  },
  balanceLeft: { gap: 2 },
  balanceLabel: {
    color: "rgba(0,0,0,0.45)",
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  balanceETH: {
    color: "#000000",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginTop: 2,
  },
  balanceUSD: { color: "rgba(0,0,0,0.4)", fontSize: 13 },
  balanceRetry: {
    color: "#2D6FF0",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
  balanceIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "rgba(45,111,240,0.15)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(45,111,240,0.25)",
  },

  sectionLabel: {
    color: "rgba(0,0,0,0.4)",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 10,
  },

  // Contacts
  contactsRow: { paddingBottom: 20, gap: 10 },
  contactPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarSelected: { backgroundColor: "#2D6FF0" },
  avatarText: { color: "#000000", fontSize: 11, fontWeight: "700" },
  contactName: {
    color: "rgba(0,0,0,0.7)",
    fontSize: 13,
    fontWeight: "600",
  },
  contactAddress: {
    color: "rgba(0,0,0,0.3)",
    fontSize: 10,
    marginTop: 1,
  },

  // Address input
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.04)",
    borderRadius: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.07)",
    marginBottom: 20,
  },
  inputWrapFocused: {
    borderColor: "rgba(45,111,240,0.5)",
    backgroundColor: "rgba(45,111,240,0.04)",
  },
  input: {
    flex: 1,
    color: "#000000",
    fontSize: 15,
    paddingVertical: 15,
    fontWeight: "500",
  },

  // Amount
  amountCard: {
    backgroundColor: "rgba(0,0,0,0.04)",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.07)",
    marginBottom: 10,
  },
  amountCardFocused: {
    borderColor: "rgba(45,111,240,0.45)",
    backgroundColor: "rgba(45,111,240,0.04)",
  },
  amountCardError: {
    borderColor: "rgba(226,75,74,0.5)",
    backgroundColor: "rgba(226,75,74,0.04)",
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  amountInput: {
    flex: 1,
    color: "#000000",
    fontSize: 38,
    fontWeight: "800",
    letterSpacing: -1,
    paddingVertical: 0,
  },
  currencyBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.07)",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 4,
  },
  currencyText: {
    color: "rgba(0,0,0,0.7)",
    fontSize: 13,
    fontWeight: "700",
  },
  usdEquiv: { color: "rgba(0,0,0,0.3)", fontSize: 13, marginTop: 6 },

  // Error
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  errorText: { color: "#E24B4A", fontSize: 13, fontWeight: "500" },

  // Quick amounts
  quickRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
    flexWrap: "wrap",
  },
  amountChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.05)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
  },
  amountChipSelected: {
    backgroundColor: "rgba(45,111,240,0.2)",
    borderColor: "#2D6FF0",
  },
  amountChipText: {
    color: "rgba(0,0,0,0.5)",
    fontSize: 13,
    fontWeight: "600",
  },
  amountChipTextSelected: { color: "#000000" },

  // Fee card
  feeCard: {
    backgroundColor: "rgba(0,0,0,0.03)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    gap: 10,
  },
  feeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  feeLabel: { color: "rgba(0,0,0,0.45)", fontSize: 13 },
  feeValue: { color: "#000000", fontSize: 13, fontWeight: "600" },
  feeDivider: { height: 1, backgroundColor: "rgba(0,0,0,0.06)" },
  feeNote: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  feeNoteText: { color: "rgba(0,0,0,0.25)", fontSize: 11 },

  // Send button
  sendBtn: {
    backgroundColor: "#2D6FF0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 18,
    marginBottom: 16,
    shadowColor: "#2D6FF0",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  sendBtnDisabled: {
    backgroundColor: "rgba(45,111,240,0.3)",
    shadowOpacity: 0,
    elevation: 0,
  },
  sendBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
  },

  disclaimer: {
    color: "rgba(0,0,0,0.2)",
    fontSize: 11,
    textAlign: "center",
    lineHeight: 16,
  },
});

export default SendScreen;
