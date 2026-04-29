import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  Fingerprint,
  ArrowRight,
} from "lucide-react-native";

const { width, height } = Dimensions.get("window");

import useAuth from "../hooks/useAuth";
// ─── Animated input field ─────────────────────────────────────────────────────
const AnimatedInput = ({
  label,
  icon: Icon,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
  secureTextEntry,
  rightElement,
  delay = 0,
  error,
}) => {
  const [focused, setFocused] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const entranceY = useRef(new Animated.Value(24)).current;
  const entranceOp = useRef(new Animated.Value(0)).current;

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
        easing: Easing.out(Easing.back(1.3)),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (error) {
      // Shake animation
      Animated.sequence([
        Animated.timing(shakeAnim, {
          toValue: 8,
          duration: 60,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: -8,
          duration: 60,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 6,
          duration: 60,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: -6,
          duration: 60,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 0,
          duration: 60,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [error]);

  const handleFocus = () => {
    setFocused(true);
    Animated.parallel([
      Animated.timing(borderAnim, {
        toValue: 1,
        duration: 250,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handleBlur = () => {
    setFocused(false);
    Animated.parallel([
      Animated.timing(borderAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
    ]).start();
  };

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [error ? "#7F1D1D" : "#1E2D4A", "#2D6FF0"],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const bgColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["#0A1628", "#0D1E3C"],
  });

  const iconColor = focused ? "#2D6FF0" : error ? "#F87171" : "#3D5070";

  return (
    <Animated.View
      style={[
        styles.inputGroup,
        {
          opacity: entranceOp,
          transform: [{ translateY: entranceY }, { translateX: shakeAnim }],
        },
      ]}
    >
      <Text
        style={[
          styles.inputLabel,
          focused && styles.inputLabelFocused,
          error && styles.inputLabelError,
        ]}
      >
        {label}
      </Text>

      {/* Glow halo */}
      <Animated.View style={[styles.inputGlow, { opacity: glowOpacity }]} />

      <Animated.View
        style={[
          styles.inputContainer,
          { borderColor, backgroundColor: bgColor },
        ]}
      >
        <View style={styles.inputIconWrap}>
          <Icon color={iconColor} size={18} strokeWidth={2} />
        </View>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#2A3D5C"
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize || "none"}
          secureTextEntry={secureTextEntry}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          selectionColor="#2D6FF0"
        />
        {rightElement}
      </Animated.View>

      {error && <Animated.Text style={styles.errorText}>{error}</Animated.Text>}
    </Animated.View>
  );
};

const LoginScreen = ({ goTo }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passError, setPassError] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  // Entrance animations
  const headerOp = useRef(new Animated.Value(0)).current;
  const headerY = useRef(new Animated.Value(-20)).current;
  const titleOp = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(20)).current;
  const footerOp = useRef(new Animated.Value(0)).current;
  const footerY = useRef(new Animated.Value(30)).current;

  // Background orb
  const orbAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Floating background orb
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
      ]),
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
      Animated.parallel([
        Animated.timing(titleOp, {
          toValue: 1,
          duration: 450,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
        Animated.timing(titleY, {
          toValue: 0,
          duration: 450,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(footerOp, {
          toValue: 1,
          duration: 500,
          delay: 200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(footerY, {
          toValue: 0,
          duration: 500,
          delay: 200,
          easing: Easing.out(Easing.back(1.1)),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const orbTranslate = orbAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -30],
  });

  const validate = () => {
    let valid = true;
    if (!email.includes("@")) {
      setEmailError("Enter a valid email address");
      valid = false;
    } else setEmailError("");
    if (password.length < 6) {
      setPassError("Password must be at least 6 characters");
      valid = false;
    } else setPassError("");
    return valid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setApiError("");
    try {
      const user = await login({ email, password });
      if (user.walletAddress) {
        goTo("Home");
      } else {
        goTo("WalletSetup");
      }
    } catch (err) {
      const code = err?.response?.data?.code;
      if (code === "INVALID_CREDENTIALS") {
        setPassError("Email or password is incorrect");
      } else if (code === "TOKEN_EXPIRED") {
        setApiError("Session expired. Please log in again.");
      } else {
        setApiError("Could not connect. Check your connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  const eyeToggle = (
    <TouchableOpacity
      style={styles.eyeBtn}
      onPress={() => setShowPassword(!showPassword)}
      activeOpacity={0.6}
    >
      {showPassword ? (
        <EyeOff color="#3D5070" size={18} strokeWidth={2} />
      ) : (
        <Eye color="#3D5070" size={18} strokeWidth={2} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#060D1A" />

      {/* Background orb */}
      <Animated.View
        style={[styles.bgOrb, { transform: [{ translateY: orbTranslate }] }]}
      />
      <View style={styles.bgOrb2} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
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
            onPress={() => goTo("Splash")}
          >
            <ArrowLeft color="#FFFFFF" size={20} strokeWidth={2.5} />
          </TouchableOpacity>
          <View style={styles.headerBadge}>
            <View style={styles.headerBadgeDot} />
            <Text style={styles.headerBadgeText}>Secure Login</Text>
          </View>
        </Animated.View>

        <View style={styles.content}>
          {/* Title */}
          <Animated.View
            style={[
              styles.titleContainer,
              { opacity: titleOp, transform: [{ translateY: titleY }] },
            ]}
          >
            <Text style={styles.eyebrow}>GOOD TO SEE YOU</Text>
            <Text style={styles.title}>Welcome{"\n"}Back</Text>
            <Text style={styles.subtitle}>
              Sign in to your ChainPay account
            </Text>
          </Animated.View>

          {/* Form */}
          <View style={styles.formContainer}>
            <AnimatedInput
              label="Email Address"
              icon={Mail}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              delay={100}
              error={emailError}
            />
            <AnimatedInput
              label="Password"
              icon={Lock}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry={!showPassword}
              rightElement={eyeToggle}
              delay={200}
              error={passError}
            />

            <Animated.View style={{ opacity: titleOp }}>
              <TouchableOpacity style={styles.forgotBtn} activeOpacity={0.6}>
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>

        {/* Footer */}
        <Animated.View
          style={[
            styles.footer,
            { opacity: footerOp, transform: [{ translateY: footerY }] },
          ]}
        >
          {/* Biometric hint */}
          <View style={styles.biometricRow}>
            <View style={styles.biometricLine} />
            <TouchableOpacity style={styles.biometricBtn} activeOpacity={0.7}>
              <Fingerprint color="#2D6FF0" size={22} strokeWidth={1.5} />
            </TouchableOpacity>
            <View style={styles.biometricLine} />
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.85}
            onPress={handleSubmit}
            disabled={loading}
          >
            <View style={styles.primaryInner}>
              <Text style={styles.primaryText}>{loading ? "Signing In..." : "Sign In"}</Text>
              <View style={styles.arrowBox}>
                <ArrowRight color="#FFFFFF" size={16} strokeWidth={3} />
              </View>
            </View>
          </TouchableOpacity>

          <View style={styles.signupRow}>
            <Text style={styles.promptText}>Don't have an account? </Text>
            <TouchableOpacity
              activeOpacity={0.6}
              onPress={() => goTo("Signup")}
            >
              <Text style={styles.promptLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#060D1A", paddingTop: 0 },

  bgOrb: {
    position: "absolute",
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: "rgba(45,111,240,0.07)",
    top: -80,
    right: -100,
  },
  bgOrb2: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(99,178,255,0.04)",
    bottom: 80,
    left: -60,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  headerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(45,111,240,0.1)",
    borderWidth: 1,
    borderColor: "rgba(45,111,240,0.2)",
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  headerBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#63B3FF",
  },
  headerBadgeText: {
    color: "#63B3FF",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
  },

  content: { flex: 1, paddingHorizontal: 24, paddingTop: 24 },

  titleContainer: { marginBottom: 36 },
  eyebrow: {
    color: "#2D6FF0",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
    marginBottom: 10,
  },
  title: {
    fontSize: 40,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -1,
    lineHeight: 46,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: "#3D5070",
    fontWeight: "400",
    letterSpacing: 0.2,
  },

  formContainer: { gap: 20 },

  // Animated input
  inputGroup: { position: "relative" },
  inputLabel: {
    color: "#3D5070",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 8,
    marginLeft: 2,
  },
  inputLabelFocused: { color: "#2D6FF0" },
  inputLabelError: { color: "#F87171" },
  inputGlow: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 56,
    borderRadius: 14,
    backgroundColor: "rgba(45,111,240,0.06)",
    shadowColor: "#2D6FF0",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 0,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1.5,
    height: 56,
    paddingHorizontal: 14,
  },
  inputIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: "rgba(45,111,240,0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "500",
    height: "100%",
    letterSpacing: 0.2,
  },
  eyeBtn: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  errorText: {
    color: "#F87171",
    fontSize: 12,
    marginTop: 5,
    marginLeft: 4,
    fontWeight: "500",
  },

  forgotBtn: { alignSelf: "flex-end", marginTop: 2 },
  forgotText: {
    color: "#2D6FF0",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.2,
  },

  footer: { paddingHorizontal: 24, paddingBottom: 40, paddingTop: 16 },

  biometricRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 14,
  },
  biometricLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  biometricBtn: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: "rgba(45,111,240,0.08)",
    borderWidth: 1,
    borderColor: "rgba(45,111,240,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },

  primaryButton: {
    backgroundColor: "#2D6FF0",
    height: 56,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#2D6FF0",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 8,
  },
  primaryInner: { flexDirection: "row", alignItems: "center", columnGap: 10 },
  primaryText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  arrowBox: {
    width: 26,
    height: 26,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },

  signupRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  promptText: { color: "#3D5070", fontSize: 14 },
  promptLink: { color: "#63B3FF", fontSize: 14, fontWeight: "700" },
});

export default LoginScreen;
