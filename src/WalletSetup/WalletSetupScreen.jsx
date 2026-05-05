import React, { useRef, useEffect, useState } from "react";
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
  Alert,
  Linking,
  Modal,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
} from "react-native";
import {
  ArrowLeft,
  Plus,
  ChevronRight,
  Link2,
  Shield,
  Wallet,
  X,
  CheckCircle2,
  AlertCircle,
} from "lucide-react-native";
import { ethers } from "ethers";
import useAuth from "../hooks/useAuth";
import * as api from "../services/api";

const { width } = Dimensions.get("window");

// ─── Wallet illustration ──────────────────────────────────────────────────────
const WalletIllustration = () => {
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -8,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 8,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  return (
    <View style={styles.illustrationContainer}>
      <Animated.View
        style={[
          styles.cardShadow,
          {
            transform: [
              {
                scaleX: floatAnim.interpolate({
                  inputRange: [-8, 8],
                  outputRange: [0.92, 1.08],
                }),
              },
            ],
            opacity: floatAnim.interpolate({
              inputRange: [-8, 8],
              outputRange: [0.25, 0.12],
            }),
          },
        ]}
      />
      <Animated.View
        style={[
          styles.backCard,
          { transform: [{ translateY: floatAnim }, { rotate: "-6deg" }] },
        ]}
      >
        <View style={styles.backCardStripe} />
      </Animated.View>
      <Animated.View
        style={[
          styles.mainCard,
          { transform: [{ translateY: floatAnim }, { rotate: "3deg" }] },
        ]}
      >
        <View style={styles.cardSheen} />
        <View style={styles.cardLogo}>
          <Shield color="#FFFFFF" size={28} strokeWidth={2.5} />
        </View>
        <View style={styles.chipArea}>
          <View style={styles.chipLine} />
          <View style={[styles.chipLine, { width: 20 }]} />
          <View style={[styles.chipLine, { width: 14 }]} />
        </View>
      </Animated.View>
    </View>
  );
};

// ─── Option card ──────────────────────────────────────────────────────────────
const OptionCard = ({
  icon: Icon,
  iconBg,
  title,
  subtitle,
  onPress,
  delay,
}) => {
  const entranceOp = useRef(new Animated.Value(0)).current;
  const entranceY = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(entranceOp, {
        toValue: 1,
        duration: 500,
        delay,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(entranceY, {
        toValue: 0,
        duration: 500,
        delay,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: entranceOp,
        transform: [{ translateY: entranceY }, { scale: scaleAnim }],
      }}
    >
      <TouchableOpacity
        style={styles.optionCard}
        activeOpacity={0.7}
        onPress={onPress}
        onPressIn={() =>
          Animated.spring(scaleAnim, {
            toValue: 0.97,
            useNativeDriver: true,
          }).start()
        }
        onPressOut={() =>
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 3,
            useNativeDriver: true,
          }).start()
        }
      >
        <View style={[styles.optionIconWrap, { backgroundColor: iconBg }]}>
          <Icon
            color={iconBg === "#2D6FF0" ? "#FFFFFF" : "#2D6FF0"}
            size={20}
            strokeWidth={2}
          />
        </View>
        <View style={styles.optionTextArea}>
          <Text style={styles.optionTitle}>{title}</Text>
          <Text style={styles.optionSubtitle}>{subtitle}</Text>
        </View>
        <ChevronRight color="#B0B8C9" size={20} strokeWidth={2} />
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Address input modal ──────────────────────────────────────────────────────
const AddressModal = ({ visible, onClose, onSubmit, loading }) => {
  const [address, setAddress] = useState("");
  const slideAnim = useRef(new Animated.Value(300)).current;
  const opAnim = useRef(new Animated.Value(0)).current;

  const isValid = ethers.utils.isAddress(address.trim());

  useEffect(() => {
    if (visible) {
      setAddress("");
      Animated.parallel([
        Animated.timing(opAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 60,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 300,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <Animated.View style={[styles.modalOverlay, { opacity: opAnim }]}>
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={onClose}
          />

          <Animated.View
            style={[
              styles.modalSheet,
              { transform: [{ translateY: slideAnim }] },
            ]}
          >
            {/* Handle */}
            <View style={styles.modalHandle} />

            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalIconWrap}>
                <Wallet color="#2D6FF0" size={22} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Link MetaMask Wallet</Text>
                <Text style={styles.modalSub}>
                  Paste your Ethereum wallet address
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.modalClose}>
                <X color="#9BA5B7" size={20} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            {/* Input */}
            <View
              style={[
                styles.addressInputWrap,
                isValid && styles.addressInputValid,
                address.length > 5 && !isValid && styles.addressInputInvalid,
              ]}
            >
              <TextInput
                style={styles.addressInput}
                placeholder="0x742d35Cc6634C0532..."
                placeholderTextColor="rgba(26,36,64,0.3)"
                value={address}
                onChangeText={setAddress}
                autoCapitalize="none"
                autoCorrect={false}
                multiline={false}
              />
              {isValid && (
                <CheckCircle2 color="#10B981" size={18} strokeWidth={2} />
              )}
              {address.length > 5 && !isValid && (
                <AlertCircle color="#EF4444" size={18} strokeWidth={2} />
              )}
            </View>

            {/* Validation message */}
            {address.length > 5 && !isValid && (
              <Text style={styles.validationText}>
                Not a valid Ethereum address
              </Text>
            )}
            {isValid && (
              <Text style={styles.validationTextOk}>
                ✓ Valid Ethereum address
              </Text>
            )}

            {/* Info box */}
            <View style={styles.infoBox}>
              <Shield color="#2D6FF0" size={14} strokeWidth={2} />
              <Text style={styles.infoText}>
                Only your public address is stored. Your private keys always
                stay in MetaMask.
              </Text>
            </View>

            {/* Submit button */}
            <TouchableOpacity
              style={[styles.submitBtn, !isValid && styles.submitBtnDisabled]}
              activeOpacity={isValid ? 0.85 : 1}
              onPress={() => isValid && onSubmit(address.trim())}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>
                  {isValid ? "Link Wallet" : "Enter a valid address"}
                </Text>
              )}
            </TouchableOpacity>

            {/* MetaMask install hint */}
            <TouchableOpacity
              style={styles.installHint}
              onPress={() =>
                Linking.openURL("https://metamask.app.link/skAH3BaF99")
              }
            >
              <Text style={styles.installHintText}>
                Don't have MetaMask?{" "}
                <Text style={{ color: "#2D6FF0", fontWeight: "700" }}>
                  Install it →
                </Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ─── Main screen ──────────────────────────────────────────────────────────────

const WalletSetupScreen = ({ goTo }) => {
  const { updateWallet } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const [linking, setLinking] = useState(false);

  // Wallet API state
  const [nonce, setNonce] = useState(null);
  const [walletStatus, setWalletStatus] = useState(null);
  const [walletBalance, setWalletBalance] = useState(null);
  const [loadingNonce, setLoadingNonce] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [errorNonce, setErrorNonce] = useState('');
  const [errorStatus, setErrorStatus] = useState('');
  const [errorBalance, setErrorBalance] = useState('');

  const headerOp = useRef(new Animated.Value(0)).current;
  const headerY = useRef(new Animated.Value(-16)).current;
  const titleOp = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(24)).current;
  const illustrationOp = useRef(new Animated.Value(0)).current;
  const illustrationScale = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
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
      Animated.parallel([
        Animated.timing(illustrationOp, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(illustrationScale, {
          toValue: 1,
          friction: 6,
          tension: 50,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(titleOp, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(titleY, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  // Fetch wallet nonce on mount
  useEffect(() => {
    setLoadingNonce(true);
    setErrorNonce('');
    const fetch = async () => {
      try {
        const res = await api.getWalletNonce();
        setNonce(res.data.nonce || res.data);
      } catch (err) {
        setErrorNonce('Failed to load wallet nonce');
      } finally {
        setLoadingNonce(false);
      }
    };
    fetch();
  }, []);

  // ── Link wallet after user submits address ──────────────────────────────────
  const handleLinkWallet = async (walletAddress) => {
    setLinking(true);
    try {
      // Use nonce from state if available
      const message = nonce ? `Link wallet to ChainPay account: ${nonce}` : '';
      await api.registerWallet({
        walletAddress,
        message,
        signature: "0x00", // manual link — no MetaMask signature needed
      });
      updateWallet(walletAddress);
      setModalVisible(false);
      // Fetch wallet status and balance after registration
      setLoadingStatus(true);
      setLoadingBalance(true);
      setErrorStatus('');
      setErrorBalance('');
      try {
        const statusRes = await api.getWalletStatus();
        setWalletStatus(statusRes.data);
      } catch {
        setErrorStatus('Failed to load wallet status');
      } finally {
        setLoadingStatus(false);
      }
      try {
        const balanceRes = await api.getWalletBalance();
        setWalletBalance(balanceRes.data);
      } catch {
        setErrorBalance('Failed to load wallet balance');
      } finally {
        setLoadingBalance(false);
      }
      Alert.alert(
        "Wallet linked! 🎉",
        `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)} is now connected to your account.`,
        [{ text: "Go to Dashboard", onPress: () => goTo("Home") }],
      );
    } catch (err) {
      const msg =
        err?.response?.data?.error || err.message || "Something went wrong";
      if (err?.response?.data?.code === "WALLET_EXISTS") {
        updateWallet(walletAddress);
        setModalVisible(false);
        Alert.alert("Already linked", "This wallet is already connected.", [
          { text: "Go to Dashboard", onPress: () => goTo("Home") },
        ]);
        return;
      }
      Alert.alert("Failed to link wallet", msg);
    } finally {
      setLinking(false);
    }
  };

  // ── Open MetaMask or show modal ─────────────────────────────────────────────
  const linkExternalWallet = async () => {
    // Always show the address modal — works on emulator + real device
    setModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FC" />

      <View style={styles.bgBlob1} />
      <View style={styles.bgBlob2} />

      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          { opacity: headerOp, transform: [{ translateY: headerY }] },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.7}
          onPress={() => goTo("Home")}
        >
          <ArrowLeft color="#1A2440" size={20} strokeWidth={2.5} />
        </TouchableOpacity>
        <View style={styles.headerLogo}>
          <Shield color="#2D6FF0" size={18} strokeWidth={2.5} />
          <Text style={styles.headerLogoText}>ChainPay</Text>
        </View>
        <View style={{ width: 40 }} />
      </Animated.View>

      {/* Content */}
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.illustrationArea,
            {
              opacity: illustrationOp,
              transform: [{ scale: illustrationScale }],
            },
          ]}
        >
          <WalletIllustration />
        </Animated.View>

        <Animated.View
          style={[
            styles.titleArea,
            { opacity: titleOp, transform: [{ translateY: titleY }] },
          ]}
        >
          <Text style={styles.title}>Set up your wallet</Text>
          <Text style={styles.subtitle}>
            Your wallet stores your payment keys securely on your device. We
            never see them.
          </Text>
        </Animated.View>

        <View style={styles.optionsArea}>
          <OptionCard
            icon={Plus}
            iconBg="#2D6FF0"
            title="Create a new wallet"
            subtitle="Recommended for new users"
            onPress={() => goTo("Home")}
            delay={600}
          />
          <OptionCard
            icon={Link2}
            iconBg="#EEF2FF"
            title="Connect existing wallet"
            subtitle="Import using recovery phrase"
            onPress={() => goTo("Home")}
            delay={750}
          />
          <OptionCard
            icon={Wallet}
            iconBg="#10B981"
            title="Link external wallet"
            subtitle="Connect MetaMask or paste address"
            onPress={() => goTo("WalletConnect")}
            delay={900}
          />
        </View>
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={styles.tabItem}
          activeOpacity={0.6}
          onPress={() => goTo("Home")}
        >
          <Wallet color="#2D6FF0" size={22} strokeWidth={2} />
          <Text style={[styles.tabLabel, styles.tabLabelActive]}>Wallet</Text>
        </TouchableOpacity>
        <View style={styles.tabDivider} />
        <TouchableOpacity
          style={styles.tabItem}
          activeOpacity={0.6}
          onPress={() => goTo("Profile")}
        >
          <Shield color="#9BA5B7" size={22} strokeWidth={2} />
          <Text style={styles.tabLabel}>Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Address modal */}
      <AddressModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleLinkWallet}
        loading={linking}
      />
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FC", paddingTop: 0 },
  bgBlob1: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(45,111,240,0.04)",
    top: -60,
    right: -80,
  },
  bgBlob2: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(99,178,255,0.04)",
    bottom: 120,
    left: -60,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#1A2440",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  headerLogo: { flexDirection: "row", alignItems: "center", gap: 6 },
  headerLogoText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A2440",
    letterSpacing: -0.3,
  },

  content: { flex: 1, paddingHorizontal: 24, justifyContent: "center" },

  illustrationArea: { alignItems: "center", marginBottom: 32 },
  illustrationContainer: {
    width: 200,
    height: 160,
    alignItems: "center",
    justifyContent: "center",
  },
  cardShadow: {
    position: "absolute",
    bottom: 4,
    width: 120,
    height: 16,
    borderRadius: 60,
    backgroundColor: "#2D6FF0",
  },
  backCard: {
    position: "absolute",
    width: 140,
    height: 90,
    borderRadius: 16,
    backgroundColor: "#E8EDFA",
    overflow: "hidden",
  },
  backCardStripe: {
    position: "absolute",
    top: 20,
    left: 0,
    right: 0,
    height: 14,
    backgroundColor: "#D4DCF0",
  },
  mainCard: {
    width: 150,
    height: 95,
    borderRadius: 16,
    backgroundColor: "#2D6FF0",
    overflow: "hidden",
    justifyContent: "space-between",
    padding: 14,
    shadowColor: "#2D6FF0",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },
  cardSheen: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "50%",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  cardLogo: { alignSelf: "flex-end" },
  chipArea: { gap: 3 },
  chipLine: {
    width: 28,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.35)",
  },

  titleArea: { alignItems: "center", marginBottom: 36 },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1A2440",
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: "#6B7A99",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 20,
    fontWeight: "400",
  },

  optionsArea: { gap: 12 },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#1A2440",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
  },
  optionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  optionTextArea: { flex: 1 },
  optionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A2440",
    marginBottom: 2,
  },
  optionSubtitle: { fontSize: 12, color: "#8A94A6", fontWeight: "400" },

  tabBar: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
    paddingBottom: 28,
    paddingHorizontal: 40,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.04)",
    justifyContent: "space-around",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 8,
  },
  tabItem: { alignItems: "center", gap: 4, flex: 1 },
  tabDivider: { width: 1, height: 24, backgroundColor: "rgba(0,0,0,0.06)" },
  tabLabel: { fontSize: 11, fontWeight: "500", color: "#9BA5B7" },
  tabLabelActive: { color: "#2D6FF0", fontWeight: "700" },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === "ios" ? 48 : 32,
    paddingTop: 12,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(0,0,0,0.1)",
    alignSelf: "center",
    marginBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
  },
  modalIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: "rgba(45,111,240,0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalTitle: { fontSize: 17, fontWeight: "700", color: "#1A2440" },
  modalSub: { fontSize: 12, color: "#8A94A6", marginTop: 2 },
  modalClose: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#F5F6FA",
    justifyContent: "center",
    alignItems: "center",
  },

  addressInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.1)",
    borderRadius: 14,
    paddingHorizontal: 14,
    backgroundColor: "#F8F9FC",
    marginBottom: 8,
  },
  addressInputValid: {
    borderColor: "#10B981",
    backgroundColor: "rgba(16,185,129,0.04)",
  },
  addressInputInvalid: {
    borderColor: "#EF4444",
    backgroundColor: "rgba(239,68,68,0.04)",
  },
  addressInput: {
    flex: 1,
    fontSize: 14,
    color: "#1A2440",
    paddingVertical: 14,
    fontWeight: "500",
  },

  validationText: {
    color: "#EF4444",
    fontSize: 12,
    marginBottom: 16,
    marginLeft: 4,
  },
  validationTextOk: {
    color: "#10B981",
    fontSize: 12,
    marginBottom: 16,
    marginLeft: 4,
  },

  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "rgba(45,111,240,0.06)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(45,111,240,0.1)",
  },
  infoText: { flex: 1, fontSize: 12, color: "#6B7A99", lineHeight: 17 },

  submitBtn: {
    backgroundColor: "#2D6FF0",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 14,
    shadowColor: "#2D6FF0",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  submitBtnDisabled: {
    backgroundColor: "rgba(45,111,240,0.3)",
    shadowOpacity: 0,
    elevation: 0,
  },
  submitBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },

  installHint: { alignItems: "center", paddingVertical: 4 },
  installHintText: { color: "#9BA5B7", fontSize: 13 },
});

export default WalletSetupScreen;
