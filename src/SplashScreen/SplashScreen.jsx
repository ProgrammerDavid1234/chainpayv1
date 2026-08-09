import React, { useEffect, useRef, useState } from 'react';
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
} from 'react-native';
import {
  Shield,
  Link,
  Zap,
  ArrowRight,
  Lock,
  Network,
  CheckCircle2,
} from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

// ─── Boot sequence timings ────────────────────────────────────────────────────
const BOOT_START = 550; // when the progress bar begins filling
const BOOT_DURATION = 2300;
const STEP_DURATION = 750; // per boot status step
const EXIT_DELAY = BOOT_START + BOOT_DURATION + 200;
const EXIT_FADE = 420;

const BOOT_STEPS = [
  { label: 'Establishing secure connection', Icon: Lock },
  { label: 'Loading Ethereum network', Icon: Network },
  { label: 'Almost ready…', Icon: CheckCircle2 },
];

const FEATURES = [
  { label: 'Trustless', color: '#2D6FF0' },
  { label: 'Instant', color: '#10B981' },
  { label: 'Secure', color: '#F59E0B' },
];

// ─── Floating orb component ───────────────────────────────────────────────────
const FloatingOrb = ({ size, color, initialX, initialY, delay, duration }) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in
    Animated.timing(opacity, {
      toValue: 1,
      duration: 1400,
      delay,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();

    // Float vertically
    Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: -18,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 18,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Float horizontally (offset phase)
    Animated.loop(
      Animated.sequence([
        Animated.timing(translateX, {
          toValue: 12,
          duration: duration * 1.3,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: -12,
          duration: duration * 1.3,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.orb,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          left: initialX,
          top: initialY,
          opacity,
          transform: [{ translateY }, { translateX }],
        },
      ]}
    />
  );
};

// ─── Animated grid line ───────────────────────────────────────────────────────
const GridLine = ({ isVertical, position, delay }) => {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 900,
      delay,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={[
        isVertical ? styles.gridLineV : styles.gridLineH,
        isVertical ? { left: position } : { top: position },
        { opacity },
      ]}
    />
  );
};

// ─── Pulse ring ───────────────────────────────────────────────────────────────
const PulseRing = ({ delay, size }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 2.4,
          duration: 2600,
          delay,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 2600,
          delay,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.pulseRing,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          opacity,
          transform: [{ scale }],
        },
      ]}
    />
  );
};

// ─── Logo hex mark ────────────────────────────────────────────────────────────
const LogoMark = ({ animValue }) => {
  const rotate = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const innerRotate = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['360deg', '0deg'],
  });

  return (
    <View style={styles.logoWrapper}>
      {/* Pulse rings behind logo */}
      <View style={styles.pulseContainer}>
        <PulseRing delay={0} size={88} />
        <PulseRing delay={900} size={88} />
      </View>

      {/* Outer rotating ring */}
      <Animated.View style={[styles.outerRing, { transform: [{ rotate }] }]}>
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <View
            key={i}
            style={[
              styles.ringDot,
              {
                transform: [
                  { rotate: `${i * 45}deg` },
                  { translateX: 54 },
                ],
                opacity: i % 2 === 0 ? 1 : 0.35,
              },
            ]}
          />
        ))}
      </Animated.View>

      {/* Main logo box */}
      <View style={styles.logoBox}>
        {/* Glass sheen */}
        <View style={styles.logoSheen} />
        <Shield color="#FFFFFF" size={34} strokeWidth={2} />
      </View>

      {/* Chain badge — counter-rotates */}
      <Animated.View style={[styles.badge, { transform: [{ rotate: innerRotate }] }]}>
        <View style={styles.badgeInner}>
          <Link color="#0A1628" size={13} strokeWidth={3} />
        </View>
      </Animated.View>

      {/* Zap accent */}
      <View style={styles.zapBadge}>
        <Zap color="#2D6FF0" size={11} strokeWidth={3} />
      </View>
    </View>
  );
};

// ─── Boot status row (icon + text) ────────────────────────────────────────────
const BootStatus = ({ stepIndex, opacity }) => {
  const { label, Icon } = BOOT_STEPS[stepIndex];

  return (
    <Animated.View style={[styles.statusRow, { opacity }]}>
      <Icon size={12} color="#63B3FF" strokeWidth={2.5} />
      <Text style={styles.statusText}>{label}</Text>
    </Animated.View>
  );
};

// ─── Main screen ──────────────────────────────────────────────────────────────
const SplashScreen = ({ goTo }) => {
  // Master animation driver
  const spinAnim = useRef(new Animated.Value(0)).current;

  // Entrance animations
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(30)).current;
  const headerScale = useRef(new Animated.Value(0.85)).current;

  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(24)).current;

  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;

  const bootOpacity = useRef(new Animated.Value(0)).current;
  const footerOpacity = useRef(new Animated.Value(0)).current;
  const footerTranslateY = useRef(new Animated.Value(30)).current;

  // Exit fade
  const containerOpacity = useRef(new Animated.Value(1)).current;

  // Boot progress
  const progress = useRef(new Animated.Value(0)).current;
  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });
  const statusOpacity = useRef(new Animated.Value(0)).current;
  const [stepIndex, setStepIndex] = useState(0);

  const navigatedRef = useRef(false);

  // Fade status text in on each step change
  useEffect(() => {
    statusOpacity.setValue(0);
    Animated.timing(statusOpacity, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [stepIndex]);

  useEffect(() => {
    // Continuous slow spin
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 14000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Staggered entrance sequence
    Animated.sequence([
      // Logo pops in
      Animated.parallel([
        Animated.timing(headerOpacity, {
          toValue: 1,
          duration: 650,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(headerTranslateY, {
          toValue: 0,
          duration: 650,
          easing: Easing.out(Easing.back(1.4)),
          useNativeDriver: true,
        }),
        Animated.timing(headerScale, {
          toValue: 1,
          duration: 650,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
      ]),
      // Title slides up
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 420,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(titleTranslateY, {
          toValue: 0,
          duration: 420,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      // Tagline fades
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      // Subtitle
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      // Boot status + footer
      Animated.parallel([
        Animated.timing(bootOpacity, {
          toValue: 1,
          duration: 450,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(footerOpacity, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(footerTranslateY, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.back(1.1)),
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Boot progress bar (0 → 100%)
    Animated.timing(progress, {
      toValue: 1,
      duration: BOOT_DURATION,
      delay: BOOT_START,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    }).start();

    // Cycle boot status text
    const stepTimers = BOOT_STEPS.map((_, i) =>
      setTimeout(() => setStepIndex(i), BOOT_START + i * STEP_DURATION)
    );

    // Auto-advance to Login after boot completes
    const exitTimer = setTimeout(() => {
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: EXIT_FADE,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }).start(() => {
        if (navigatedRef.current) return;
        navigatedRef.current = true;
        goTo('Login');
      });
    }, EXIT_DELAY);

    return () => {
      stepTimers.forEach(clearTimeout);
      clearTimeout(exitTimer);
    };
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: containerOpacity }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── Background layer ── */}
      <View style={styles.bgLayer}>
        {/* Ambient orbs */}
        <FloatingOrb size={260} color="rgba(45,111,240,0.09)"  initialX={-60}        initialY={-40}          delay={0}    duration={4200} />
        <FloatingOrb size={200} color="rgba(99,178,255,0.07)"  initialX={width-120}   initialY={height*0.15}  delay={300}  duration={3800} />
        <FloatingOrb size={180} color="rgba(45,111,240,0.06)"  initialX={width*0.1}  initialY={height*0.55}  delay={600}  duration={5000} />
        <FloatingOrb size={140} color="rgba(124,58,237,0.07)"  initialX={width*0.65} initialY={height*0.72}  delay={400}  duration={4600} />

        {/* Grid lines — horizontal */}
        {[0.18, 0.34, 0.52, 0.68, 0.84].map((ratio, i) => (
          <GridLine key={`h${i}`} isVertical={false} position={height * ratio} delay={i * 80} />
        ))}
        {/* Grid lines — vertical */}
        {[0.15, 0.35, 0.55, 0.75, 0.92].map((ratio, i) => (
          <GridLine key={`v${i}`} isVertical={true} position={width * ratio} delay={i * 80 + 200} />
        ))}
      </View>

      {/* ── Content ── */}
      <View style={styles.content}>
        {/* Logo */}
        <Animated.View
          style={[
            styles.logoArea,
            {
              opacity: headerOpacity,
              transform: [{ translateY: headerTranslateY }, { scale: headerScale }],
            },
          ]}
        >
          <LogoMark animValue={spinAnim} />
        </Animated.View>

        {/* Title */}
        <Animated.View
          style={{ opacity: titleOpacity, transform: [{ translateY: titleTranslateY }] }}
        >
          <Text style={styles.title}>ChainPay</Text>
        </Animated.View>

        {/* Tagline pill */}
        <Animated.View style={[styles.taglinePill, { opacity: taglineOpacity }]}>
          <View style={styles.taglineDot} />
          <Text style={styles.taglineText}>Powered by Ethereum</Text>
        </Animated.View>

        {/* Subtitle */}
        <Animated.View style={{ opacity: subtitleOpacity, alignItems: 'center' }}>
          <Text style={styles.subtitle}>Your money.</Text>
          <Text style={[styles.subtitle, styles.subtitleAccent]}>Your control.</Text>
        </Animated.View>

        {/* Feature pills */}
        <Animated.View style={[styles.pillRow, { opacity: subtitleOpacity }]}>
          {FEATURES.map(({ label, color }) => (
            <View key={label} style={styles.featurePill}>
              <View style={[styles.featureDot, { backgroundColor: color }]} />
              <Text style={styles.featurePillText}>{label}</Text>
            </View>
          ))}
        </Animated.View>
      </View>

      {/* ── Footer ── */}
      <Animated.View
        style={[
          styles.footer,
          { opacity: footerOpacity, transform: [{ translateY: footerTranslateY }] },
        ]}
      >
        {/* Boot status + progress */}
        <Animated.View style={[styles.bootContainer, { opacity: bootOpacity }]}>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
          </View>
          <BootStatus stepIndex={stepIndex} opacity={statusOpacity} />
        </Animated.View>

        {/* Divider line */}
        <View style={styles.footerDivider} />

        <TouchableOpacity
          style={styles.primaryButton}
          activeOpacity={0.85}
          onPress={() => goTo('Signup')}
        >
          <View style={styles.primaryButtonInner}>
            <Text style={styles.primaryButtonText}>Create Account</Text>
            <View style={styles.arrowBox}>
              <ArrowRight color="#FFFFFF" size={14} strokeWidth={3} />
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          activeOpacity={0.6}
          onPress={() => goTo('Login')}
        >
          <Text style={styles.secondaryButtonText}>I already have an account</Text>
        </TouchableOpacity>

        <Text style={styles.legalText}>
          By continuing you agree to our{' '}
          <Text style={styles.legalLink}>Terms</Text> &{' '}
          <Text style={styles.legalLink}>Privacy Policy</Text>
        </Text>
      </Animated.View>
    </Animated.View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 0,
  },

  // Background
  bgLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  orb: {
    position: 'absolute',
  },
  gridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(45,111,240,0.07)',
  },
  gridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(45,111,240,0.07)',
  },

  // Content
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  // Logo
  logoArea: {
    marginBottom: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrapper: {
    width: 130,
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pulseContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: 'rgba(45,111,240,0.45)',
    backgroundColor: 'transparent',
  },
  outerRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringDot: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#2D6FF0',
  },
  logoBox: {
    width: 84,
    height: 84,
    backgroundColor: '#1A3A7A',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(99,156,255,0.3)',
    shadowColor: '#2D6FF0',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.55,
    shadowRadius: 26,
    elevation: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  logoSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '45%',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  badge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 30,
    height: 30,
  },
  badgeInner: {
    width: 30,
    height: 30,
    backgroundColor: '#63B3FF',
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    shadowColor: '#63B3FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 6,
  },
  zapBadge: {
    position: 'absolute',
    top: 10,
    right: 6,
    width: 22,
    height: 22,
    backgroundColor: '#0F1E3A',
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(45,111,240,0.4)',
  },

  // Typography
  title: {
    fontSize: 40,
    fontWeight: '800',
    color: '#000000',
    marginBottom: 12,
    letterSpacing: -0.5,
    textShadowColor: 'rgba(45,111,240,0.35)',
    textShadowRadius: 24,
  },
  taglinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(45,111,240,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(45,111,240,0.25)',
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginBottom: 20,
    gap: 7,
  },
  taglineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#63B3FF',
  },
  taglineText: {
    color: '#63B3FF',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 23,
    color: '#8A94A6',
    fontWeight: '300',
    letterSpacing: 0.3,
    lineHeight: 31,
  },
  subtitleAccent: {
    color: '#000000',
    fontWeight: '700',
  },

  // Feature pills
  pillRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 22,
    marginBottom: 26,
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    borderRadius: 100,
    paddingHorizontal: 13,
    paddingVertical: 6,
  },
  featureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  featurePillText: {
    color: 'rgba(0,0,0,0.6)',
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.4,
  },

  // Footer
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    width: '100%',
    alignItems: 'center',
  },
  bootContainer: {
    width: '78%',
    alignItems: 'center',
    marginBottom: 22,
  },
  progressTrack: {
    width: '100%',
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.1)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#2D6FF0',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 10,
  },
  statusText: {
    color: 'rgba(0,0,0,0.55)',
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.2,
    minWidth: 210,
    textAlign: 'left',
  },
  footerDivider: {
    width: '100%',
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(0,0,0,0.08)',
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: '#2D6FF0',
    height: 54,
    width: '100%',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#2D6FF0',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 8,
    overflow: 'hidden',
  },
  primaryButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  arrowBox: {
    width: 24,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButton: {
    height: 54,
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.03)',
    marginBottom: 20,
  },
  secondaryButtonText: {
    color: 'rgba(0,0,0,0.7)',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  legalText: {
    color: 'rgba(0,0,0,0.4)',
    fontSize: 12,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  legalLink: {
    color: 'rgba(99,156,255,0.6)',
    fontWeight: '600',
  },
});

export default SplashScreen;
