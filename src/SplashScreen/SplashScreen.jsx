import React, { useEffect, useRef } from 'react';
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
import { Shield, Link, Zap, ArrowRight } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

// ─── Floating orb component ───────────────────────────────────────────────────
const FloatingOrb = ({ size, color, initialX, initialY, delay, duration }) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in
    Animated.timing(opacity, {
      toValue: 1,
      duration: 1200,
      delay,
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
      duration: 800,
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
          duration: 2400,
          delay,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 2400,
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
        <PulseRing delay={800} size={88} />
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

// ─── Main screen ──────────────────────────────────────────────────────────────
const SplashScreen = ({ goTo }) => {
  // Master animation driver
  const spinAnim = useRef(new Animated.Value(0)).current;

  // Entrance animations
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(40)).current;

  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(30)).current;

  const subtitleOpacity = useRef(new Animated.Value(0)).current;

  const dotsOpacity = useRef(new Animated.Value(0)).current;

  const footerOpacity = useRef(new Animated.Value(0)).current;
  const footerTranslateY = useRef(new Animated.Value(40)).current;

  const taglineOpacity = useRef(new Animated.Value(0)).current;

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
      // Logo appears
      Animated.parallel([
        Animated.timing(headerOpacity, {
          toValue: 1,
          duration: 700,
          delay: 200,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
        Animated.timing(headerTranslateY, {
          toValue: 0,
          duration: 700,
          delay: 200,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
      ]),
      // Title slides up
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(titleTranslateY, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.back(1.4)),
          useNativeDriver: true,
        }),
      ]),
      // Tagline fades
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      // Subtitle
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      // Dots
      Animated.timing(dotsOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      // Footer
      Animated.parallel([
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
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#060D1A" />

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
            { opacity: headerOpacity, transform: [{ translateY: headerTranslateY }] },
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
          {['Trustless', 'Instant', 'Secure'].map((label, i) => (
            <View key={i} style={styles.featurePill}>
              <Text style={styles.featurePillText}>{label}</Text>
            </View>
          ))}
        </Animated.View>

        {/* Pagination dots */}
        <Animated.View style={[styles.paginationContainer, { opacity: dotsOpacity }]}>
          <View style={[styles.dot, styles.activeDot]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </Animated.View>
      </View>

      {/* ── Footer ── */}
      <Animated.View
        style={[
          styles.footer,
          { opacity: footerOpacity, transform: [{ translateY: footerTranslateY }] },
        ]}
      >
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
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060D1A',
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
    backgroundColor: 'rgba(45,111,240,0.08)',
  },
  gridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(45,111,240,0.08)',
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
    marginBottom: 36,
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
    borderColor: 'rgba(45,111,240,0.5)',
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
    borderColor: 'rgba(99,156,255,0.25)',
    shadowColor: '#2D6FF0',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
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
    borderColor: '#060D1A',
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
    fontSize: 42,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 10,
    letterSpacing: -0.5,
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
    fontSize: 24,
    color: '#8A94A6',
    fontWeight: '300',
    letterSpacing: 0.3,
    lineHeight: 32,
  },
  subtitleAccent: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Feature pills
  pillRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 24,
    marginBottom: 32,
  },
  featurePill: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  featurePillText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.4,
  },

  // Pagination
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  activeDot: {
    width: 22,
    borderRadius: 3,
    backgroundColor: '#2D6FF0',
  },

  // Footer
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 44,
    width: '100%',
    alignItems: 'center',
  },
  footerDivider: {
    width: '100%',
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginBottom: 28,
  },
  primaryButton: {
    backgroundColor: '#2D6FF0',
    height: 56,
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
  arrowText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryButton: {
    height: 56,
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    marginBottom: 20,
  },
  secondaryButtonText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  legalText: {
    color: 'rgba(255,255,255,0.25)',
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