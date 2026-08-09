import React, { useState, useRef, useEffect } from "react";
import useAuth from "../hooks/useAuth";
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
  ScrollView,
  Animated,
  Easing,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  ArrowLeft,
  CheckCircle2,
  Circle,
  ArrowRight,
  Shield,
  Link,
} from "lucide-react-native";

const { width } = Dimensions.get("window");

// ─── Brand mark (matches splash logo) ─────────────────────────────────────────
const BrandMark = () => (
  <View style={styles.brandMark}>
    <View style={styles.brandSheen} />
    <Shield color="#FFFFFF" size={20} strokeWidth={2.2} />
    <View style={styles.brandBadge}>
      <Link color="#0A1628" size={9} strokeWidth={3} />
    </View>
  </View>
);
// ─── Password strength meter ──────────────────────────────────────────────────
const StrengthMeter = ({ password, visible }) => {
  const animWidths = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];
  const containerOp = useRef(new Animated.Value(0)).current;

  const getStrength = (p) => {
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score;
  };

  const strength = getStrength(password);
  const labels = ["Weak", "Fair", "Good", "Strong"];
  const colors = ["#EF4444", "#F59E0B", "#3B82F6", "#10B981"];
  const label = password.length > 0 ? labels[Math.max(0, strength - 1)] : "";
  const color =
    password.length > 0 ? colors[Math.max(0, strength - 1)] : "#9CA3AF";

  useEffect(() => {
    Animated.timing(containerOp, {
      toValue: visible && password.length > 0 ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();

    animWidths.forEach((anim, i) => {
      Animated.timing(anim, {
        toValue: i < strength ? 1 : 0,
        duration: 300,
        delay: i * 60,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }).start();
    });
  }, [strength, visible, password.length]);

  return (
    <Animated.View style={[styles.strengthContainer, { opacity: containerOp }]}>
      <View style={styles.strengthBars}>
        {animWidths.map((anim, i) => (
          <View key={i} style={styles.strengthTrack}>
            <Animated.View
              style={[
                styles.strengthBar,
                {
                  flex: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 1],
                  }),
                  backgroundColor: i < strength ? color : "#E5E7EB",
                },
              ]}
            />
          </View>
        ))}
      </View>
      <Text style={[styles.strengthLabel, { color }]}>{label}</Text>
    </Animated.View>
  );
};

// ─── Password requirement row ─────────────────────────────────────────────────
const Requirement = ({ met, text }) => (
  <View style={styles.reqRow}>
    {met ? (
      <CheckCircle2 color="#10B981" size={13} strokeWidth={2.5} />
    ) : (
      <Circle color="#2A3D5C" size={13} strokeWidth={2} />
    )}
    <Text style={[styles.reqText, met && styles.reqTextMet]}>{text}</Text>
  </View>
);

// ─── Animated input ───────────────────────────────────────────────────────────
const AnimatedInput = ({
  label,
  icon: Icon,
  value,
  onChangeText,
  placeholder,
  placeholderTextColor,
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
    outputRange: [error ? "#DC2626" : "#E5E7EB", "#2D6FF0"],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const bgColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["#FFFFFF", "#F0F4FF"],
  });
  const iconColor = focused ? "#2D6FF0" : error ? "#F87171" : "#9CA3AF";

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
          placeholderTextColor={placeholderTextColor || "#9CA3AF"}
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
      {error && <Text style={styles.errorText}>{error}</Text>}
    </Animated.View>
  );
};

// ─── Step progress ────────────────────────────────────────────────────────────
const StepBar = ({ step }) => (
  <View style={styles.stepBar}>
    {[1, 2, 3].map((s) => (
      <View
        key={s}
        style={[
          styles.stepSegment,
          { backgroundColor: s <= step ? "#2D6FF0" : "rgba(45,111,240,0.12)" },
        ]}
      />
    ))}
  </View>
);

const SignupScreen = ({ goTo }) => {
  const { register } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passError, setPassError] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const headerOp = useRef(new Animated.Value(0)).current;
  const headerY = useRef(new Animated.Value(-16)).current;
  const titleOp = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(20)).current;
  const footerOp = useRef(new Animated.Value(0)).current;
  const footerY = useRef(new Animated.Value(30)).current;

  const orbAnim = useRef(new Animated.Value(0)).current;

  // Primary button press feedback
  const btnScale = useRef(new Animated.Value(1)).current;
  const animateBtn = (to) => {
    Animated.spring(btnScale, {
      toValue: to,
      friction: 7,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const hasLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  // Step tracking (visual only — 1 form page)
  const step = fullName.length > 0 ? (email.includes("@") ? 3 : 2) : 1;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(orbAnim, {
          toValue: 1,
          duration: 6000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(orbAnim, {
          toValue: 0,
          duration: 6000,
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
          delay: 300,
          useNativeDriver: true,
        }),
        Animated.timing(footerY, {
          toValue: 0,
          duration: 500,
          delay: 300,
          easing: Easing.out(Easing.back(1.1)),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const orbTranslate = orbAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -24],
  });

  const validate = () => {
    let valid = true;
    if (fullName.trim().length < 2) {
      setNameError("Enter your full name");
      valid = false;
    } else setNameError("");
    if (!email.includes("@")) {
      setEmailError("Enter a valid email");
      valid = false;
    } else setEmailError("");
    if (password.length < 8) {
      setPassError("Password must be at least 8 characters");
      valid = false;
    } else setPassError("");
    return valid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setApiError("");
    try {
      await register({ name: fullName, email, password });
      goTo("WalletSetup");
    } catch (err) {
      const code = err?.response?.data?.code;
      if (code === "EMAIL_EXISTS") {
        setEmailError("This email is already registered");
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
        <EyeOff color="#9CA3AF" size={18} strokeWidth={2} />
      ) : (
        <Eye color="#9CA3AF" size={18} strokeWidth={2} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Background orbs */}
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
            <ArrowLeft color="#000000" size={20} strokeWidth={2.5} />
          </TouchableOpacity>
          <StepBar step={step} />
          <View style={styles.stepLabel}>
            <Text style={styles.stepLabelText}>Step {step} of 3</Text>
          </View>
        </Animated.View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title */}
          <Animated.View
            style={[
              styles.titleContainer,
              { opacity: titleOp, transform: [{ translateY: titleY }] },
            ]}
          >
            <BrandMark />
            <Text style={styles.eyebrow}>NEW ACCOUNT</Text>
            <Text style={styles.title}>Create{"\n"}Account</Text>
            <Text style={styles.subtitle}>Join thousands using ChainPay</Text>
          </Animated.View>

          {/* Form */}
          <View style={styles.formContainer}>
            <AnimatedInput
              label="Full Name"
              icon={User}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Alex Johnson"
              autoCapitalize="words"
              delay={80}
              error={nameError}
            />
            <AnimatedInput
              label="Email Address"
              icon={Mail}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              delay={160}
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
              delay={240}
              error={passError}
            />

            {/* Strength meter */}
            <StrengthMeter password={password} visible={password.length > 0} />

            {/* Requirements */}
            {password.length > 0 && (
              <Animated.View style={styles.reqContainer}>
                <View style={styles.reqGrid}>
                  <Requirement met={hasLength} text="8+ characters" />
                  <Requirement met={hasUpper} text="Uppercase letter" />
                  <Requirement met={hasNumber} text="Number" />
                  <Requirement met={hasSpecial} text="Special character" />
                </View>
              </Animated.View>
            )}

            {/* Terms */}
            <Animated.View style={[styles.termsRow, { opacity: titleOp }]}>
              <Text style={styles.termsText}>
                By signing up you agree to our{" "}
                <Text style={styles.termsLink}>Terms of Service</Text> and{" "}
                <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>
            </Animated.View>
          </View>
        </ScrollView>

        {/* Footer */}
        <Animated.View
          style={[
            styles.footer,
            { opacity: footerOp, transform: [{ translateY: footerY }] },
          ]}
        >
          <View style={styles.footerDivider} />

          <Animated.View style={{ transform: [{ scale: btnScale }] }}>
            <TouchableOpacity
              style={[styles.primaryButton, loading && { opacity: 0.8 }]}
              activeOpacity={0.85}
              onPress={handleSubmit}
              onPressIn={() => animateBtn(0.97)}
              onPressOut={() => animateBtn(1)}
              disabled={loading}
            >
              <View style={styles.primaryInner}>
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Text style={styles.primaryText}>Create Account</Text>
                    <View style={styles.arrowBox}>
                      <ArrowRight color="#FFFFFF" size={16} strokeWidth={3} />
                    </View>
                  </>
                )}
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Show API error below button */}
          {apiError !== "" && (
            <Text
              style={{
                color: "#F87171",
                textAlign: "center",
                marginTop: 8,
                fontSize: 13,
              }}
            >
              {apiError}
            </Text>
          )}

          <View style={styles.loginRow}>
            <Text style={styles.promptText}>Already have an account? </Text>
            <TouchableOpacity activeOpacity={0.6} onPress={() => goTo("Login")}>
              <Text style={styles.promptLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF", paddingTop: 0 },

  bgOrb: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: "rgba(45,111,240,0.06)",
    top: -60,
    left: -80,
  },
  bgOrb2: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "rgba(16,185,129,0.04)",
    bottom: 100,
    right: -80,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 14,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.04)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
  },

  // Step bar
  stepBar: { flex: 1, flexDirection: "row", gap: 5 },
  stepSegment: { flex: 1, height: 3, borderRadius: 2 },
  stepLabel: {
    backgroundColor: "rgba(45,111,240,0.1)",
    borderWidth: 1,
    borderColor: "rgba(45,111,240,0.2)",
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  stepLabelText: { color: "#63B3FF", fontSize: 11, fontWeight: "600" },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
  },

  titleContainer: { marginBottom: 32 },

  // Brand mark
  brandMark: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#1A3A7A",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(99,156,255,0.3)",
    shadowColor: "#2D6FF0",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 8,
    overflow: "hidden",
    position: "relative",
    marginBottom: 20,
  },
  brandSheen: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "45%",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  brandBadge: {
    position: "absolute",
    bottom: 3,
    right: 3,
    width: 16,
    height: 16,
    borderRadius: 5,
    backgroundColor: "#63B3FF",
    justifyContent: "center",
    alignItems: "center",
  },

  eyebrow: {
    color: "#10B981",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
    marginBottom: 10,
  },
  title: {
    fontSize: 40,
    fontWeight: "800",
    color: "#000000",
    letterSpacing: -1,
    lineHeight: 46,
    marginBottom: 10,
    textShadowColor: "rgba(16,185,129,0.3)",
    textShadowRadius: 24,
  },
  subtitle: { fontSize: 15, color: "#6B7280", fontWeight: "400" },

  formContainer: { gap: 18 },

  // Animated input
  inputGroup: { position: "relative" },
  inputLabel: {
    color: "#6B7280",
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
    color: "#000000",
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

  // Strength meter
  strengthContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: -6,
  },
  strengthBars: { flex: 1, flexDirection: "row", gap: 5 },
  strengthTrack: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#E5E7EB",
    overflow: "hidden",
    flexDirection: "row",
  },
  strengthBar: { height: 3, borderRadius: 2 },
  strengthLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    width: 48,
    textAlign: "right",
  },

  // Requirements
  reqContainer: { marginTop: -4 },
  reqGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  reqRow: { flexDirection: "row", alignItems: "center", gap: 5, width: "46%" },
  reqText: { color: "#6B7280", fontSize: 12, fontWeight: "500" },
  reqTextMet: { color: "#10B981" },

  // Terms
  termsRow: { marginTop: 4 },
  termsText: {
    color: "#6B7280",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  termsLink: { color: "#2D6FF0", fontWeight: "600" },

  // Footer
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 8,
    backgroundColor: "#FFFFFF",
  },
  footerDivider: {
    width: "100%",
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(0,0,0,0.08)",
    marginBottom: 20,
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

  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  promptText: { color: "#6B7280", fontSize: 14 },
  promptLink: { color: "#2D6FF0", fontSize: 14, fontWeight: "700" },
});

export default SignupScreen;
