import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  TextInput,
  ScrollView,
  Animated,
  Easing,
  Keyboard,
  TouchableWithoutFeedback,
  Vibration,
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
} from "lucide-react-native";

// ─── Fake data ────────────────────────────────────────────────────────────────
const BALANCE_ETH = 1.432;
const ETH_TO_USD = 3480;

const RECENT_CONTACTS = [
  { id: "1", name: "Alex K.", address: "0x1A2b...9F3d", avatar: "AK" },
  { id: "2", name: "Mide O.", address: "0x4C5e...2B1a", avatar: "MO" },
  { id: "3", name: "Sola T.", address: "0x7F8g...5E4c", avatar: "ST" },
  { id: "4", name: "Kemi A.", address: "0x9D0h...8G7f", avatar: "KA" },
];

const QUICK_AMOUNTS = ["0.01", "0.05", "0.1", "0.5"];

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
    outputRange: ["rgba(255,255,255,0.06)", "rgba(45,111,240,0.2)"],
  });
  const borderColor = selectAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(255,255,255,0.08)", "#2D6FF0"],
  });

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      onPressIn={() =>
        Animated.spring(scaleAnim, { toValue: 0.93, useNativeDriver: true }).start()
      }
      onPressOut={() =>
        Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }).start()
      }
    >
      <Animated.View
        style={[
          styles.contactPill,
          { transform: [{ scale: scaleAnim }], backgroundColor: bgColor, borderColor },
        ]}
      >
        <View style={[styles.avatar, selected && styles.avatarSelected]}>
          <Text style={styles.avatarText}>{contact.avatar}</Text>
        </View>
        <View>
          <Text style={[styles.contactName, selected && { color: "#FFFFFF" }]}>
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
        Animated.spring(scaleAnim, { toValue: 0.9, useNativeDriver: true }).start()
      }
      onPressOut={() =>
        Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }).start()
      }
    >
      <Animated.View
        style={[
          styles.amountChip,
          selected && styles.amountChipSelected,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <Text style={[styles.amountChipText, selected && styles.amountChipTextSelected]}>
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
    <Text style={[styles.feeValue, muted && { color: "rgba(255,255,255,0.35)" }]}>
      {value}
    </Text>
  </View>
);

// ─── Main screen ──────────────────────────────────────────────────────────────
const SendScreen = ({ goTo, route }) => {
  const prefillAddress = route?.params?.address ?? "";

  const [recipient, setRecipient] = useState(prefillAddress);
  const [amount, setAmount] = useState("");
  const [selectedContact, setSelectedContact] = useState(null);
  const [selectedQuick, setSelectedQuick] = useState(null);
  const [addressFocused, setAddressFocused] = useState(false);
  const [amountFocused, setAmountFocused] = useState(false);
  const [sending, setSending] = useState(false);

  // derived
  const amountNum = parseFloat(amount) || 0;
  const amountUSD = (amountNum * ETH_TO_USD).toFixed(2);
  const gasFee = 0.0008;
  const total = amountNum + gasFee;
  const hasEnough = total <= BALANCE_ETH;
  const isValid = recipient.trim().length > 5 && amountNum > 0 && hasEnough;

  // animations
  const headerOp = useRef(new Animated.Value(0)).current;
  const headerY = useRef(new Animated.Value(-20)).current;
  const cardOp = useRef(new Animated.Value(0)).current;
  const cardY = useRef(new Animated.Value(32)).current;
  const btnScale = useRef(new Animated.Value(1)).current;
  const errorShake = useRef(new Animated.Value(0)).current;
  const sendingPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(headerOp, { toValue: 1, duration: 380, useNativeDriver: true }),
        Animated.timing(headerY, { toValue: 0, duration: 380, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(cardOp, { toValue: 1, duration: 450, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(cardY, { toValue: 0, duration: 450, easing: Easing.out(Easing.back(1.1)), useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const shake = useCallback(() => {
    Vibration.vibrate(80);
    Animated.sequence([
      Animated.timing(errorShake, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(errorShake, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(errorShake, { toValue: 6, duration: 50, useNativeDriver: true }),
      Animated.timing(errorShake, { toValue: -6, duration: 50, useNativeDriver: true }),
      Animated.timing(errorShake, { toValue: 0, duration: 40, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleContactSelect = (contact) => {
    if (selectedContact?.id === contact.id) {
      setSelectedContact(null);
      setRecipient("");
    } else {
      setSelectedContact(contact);
      setRecipient(contact.address);
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

  const handleSend = useCallback(() => {
    if (!isValid) {
      shake();
      return;
    }
    Keyboard.dismiss();
    setSending(true);

    // pulse animation while "sending"
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(sendingPulse, { toValue: 0.92, duration: 600, useNativeDriver: true }),
        Animated.timing(sendingPulse, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );
    pulse.start();

    // Simulate on-chain delay
    setTimeout(() => {
      pulse.stop();
      setSending(false);
      Alert.alert(
        "Transaction submitted",
        "Your transaction is being confirmed on the blockchain.",
        [{ text: "View status", onPress: () => goTo("Home") }]
      );
    }, 2500);
  }, [isValid, shake, goTo]);

  const insufficientFunds = amountNum > 0 && !hasEnough;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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
          <Animated.View style={{ opacity: cardOp, transform: [{ translateY: cardY }] }}>

            {/* ── Balance card ── */}
            <View style={styles.balanceCard}>
              <View style={styles.balanceLeft}>
                <Text style={styles.balanceLabel}>Available balance</Text>
                <Text style={styles.balanceETH}>{BALANCE_ETH} ETH</Text>
                <Text style={styles.balanceUSD}>
                  ≈ ${(BALANCE_ETH * ETH_TO_USD).toLocaleString()}
                </Text>
              </View>
              <View style={styles.balanceIcon}>
                <Wallet color="#2D6FF0" size={22} strokeWidth={2} />
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
                placeholder="0x address or @username"
                placeholderTextColor="rgba(255,255,255,0.25)"
                value={recipient}
                onChangeText={(t) => {
                  setRecipient(t);
                  setSelectedContact(null);
                }}
                onFocus={() => setAddressFocused(true)}
                onBlur={() => setAddressFocused(false)}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {recipient.length > 5 && (
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
                  placeholderTextColor="rgba(255,255,255,0.2)"
                  value={amount}
                  onChangeText={handleAmountChange}
                  onFocus={() => setAmountFocused(true)}
                  onBlur={() => setAmountFocused(false)}
                  keyboardType="decimal-pad"
                />
                <View style={styles.currencyBadge}>
                  <Text style={styles.currencyText}>ETH</Text>
                  <ChevronDown color="rgba(255,255,255,0.4)" size={14} strokeWidth={2} />
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
                <FeeRow label="Network fee (est.)" value={`${gasFee} ETH`} muted />
                <View style={styles.feeDivider} />
                <FeeRow
                  label="Total"
                  value={`${total.toFixed(4)} ETH`}
                />
                <View style={styles.feeNote}>
                  <Clock color="rgba(255,255,255,0.3)" size={12} strokeWidth={2} />
                  <Text style={styles.feeNoteText}>Est. confirmation ~15s on Sepolia</Text>
                </View>
              </View>
            )}

            {/* ── Send button ── */}
            <TouchableOpacity
              activeOpacity={isValid ? 0.85 : 1}
              onPress={handleSend}
              onPressIn={() =>
                isValid &&
                Animated.spring(btnScale, { toValue: 0.96, useNativeDriver: true }).start()
              }
              onPressOut={() =>
                Animated.spring(btnScale, { toValue: 1, friction: 4, useNativeDriver: true }).start()
              }
            >
              <Animated.View
                style={[
                  styles.sendBtn,
                  !isValid && styles.sendBtnDisabled,
                  { transform: [{ scale: sending ? sendingPulse : btnScale }] },
                ]}
              >
                {sending ? (
                  <Text style={styles.sendBtnText}>Submitting to blockchain…</Text>
                ) : (
                  <>
                    <Send color="#FFFFFF" size={18} strokeWidth={2.5} style={{ marginRight: 10 }} />
                    <Text style={styles.sendBtnText}>
                      {isValid ? `Send ${amountNum.toFixed(4)} ETH` : "Send Now"}
                    </Text>
                  </>
                )}
              </Animated.View>
            </TouchableOpacity>

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
  container: {
    flex: 1,
    backgroundColor: "#080B14",
    paddingTop: 0,
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

  // Scroll
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 48,
  },

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
    color: "rgba(255,255,255,0.45)",
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  balanceETH: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginTop: 2,
  },
  balanceUSD: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13,
  },
  balanceIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "rgba(45,111,240,0.15)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(45,111,240,0.25)",
  },

  // Section label
  sectionLabel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 10,
  },

  // Contacts
  contactsRow: {
    paddingBottom: 20,
    gap: 10,
  },
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
    backgroundColor: "rgba(255,255,255,0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarSelected: {
    backgroundColor: "#2D6FF0",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  contactName: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    fontWeight: "600",
  },
  contactAddress: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 10,
    marginTop: 1,
  },

  // Address input
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    marginBottom: 20,
  },
  inputWrapFocused: {
    borderColor: "rgba(45,111,240,0.5)",
    backgroundColor: "rgba(45,111,240,0.04)",
  },
  input: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 15,
    paddingVertical: 15,
    fontWeight: "500",
  },

  // Amount
  amountCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
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
    color: "#FFFFFF",
    fontSize: 38,
    fontWeight: "800",
    letterSpacing: -1,
    paddingVertical: 0,
  },
  currencyBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 4,
  },
  currencyText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    fontWeight: "700",
  },
  usdEquiv: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 13,
    marginTop: 6,
  },

  // Error
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  errorText: {
    color: "#E24B4A",
    fontSize: 13,
    fontWeight: "500",
  },

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
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  amountChipSelected: {
    backgroundColor: "rgba(45,111,240,0.2)",
    borderColor: "#2D6FF0",
  },
  amountChipText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
    fontWeight: "600",
  },
  amountChipTextSelected: {
    color: "#FFFFFF",
  },

  // Fee card
  feeCard: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    gap: 10,
  },
  feeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  feeLabel: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 13,
  },
  feeValue: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  feeDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  feeNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  feeNoteText: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 11,
  },

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

  // Disclaimer
  disclaimer: {
    color: "rgba(255,255,255,0.2)",
    fontSize: 11,
    textAlign: "center",
    lineHeight: 16,
  },
});

export default SendScreen;