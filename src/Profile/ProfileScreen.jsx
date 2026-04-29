import React, { useRef, useEffect } from "react";
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
  Shield,
  Settings,
  Bell,
  HelpCircle,
  Info,
  LogOut,
  ChevronRight,
  Camera,
} from "lucide-react-native";

const { width } = Dimensions.get("window");

// ─── Menu Item ───────────────────────────────────────────────────────────────
const MenuItem = ({ icon: Icon, title, iconBg, delay, isDestructive, onPress }) => {
  const entranceOp = useRef(new Animated.Value(0)).current;
  const entranceX = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(entranceOp, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(entranceX, {
        toValue: 0,
        duration: 400,
        delay,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: entranceOp,
        transform: [{ translateX: entranceX }],
      }}
    >
      <TouchableOpacity
        style={styles.menuItem}
        activeOpacity={0.7}
        onPress={onPress}
      >
        <View style={[styles.menuIconWrap, { backgroundColor: iconBg }]}>
          <Icon color={isDestructive ? "#EF4444" : "#FFFFFF"} size={20} strokeWidth={2.5} />
        </View>
        <Text style={[styles.menuTitle, isDestructive && styles.menuTitleDestructive]}>
          {title}
        </Text>
        {!isDestructive && (
          <ChevronRight color="rgba(255,255,255,0.3)" size={20} strokeWidth={2} />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Main ProfileScreen ───────────────────────────────────────────────────────
const ProfileScreen = ({ goTo }) => {
  // Entrance animations
  const headerOp = useRef(new Animated.Value(0)).current;
  const headerY = useRef(new Animated.Value(-20)).current;
  const profileOp = useRef(new Animated.Value(0)).current;
  const profileScale = useRef(new Animated.Value(0.9)).current;

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
      Animated.parallel([
        Animated.timing(profileOp, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(profileScale, {
          toValue: 1,
          friction: 6,
          tension: 50,
          useNativeDriver: true,
        }),
      ]),
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
          <Text style={styles.headerTitle}>Profile</Text>
        </Animated.View>

        {/* Profile Info */}
        <Animated.View
          style={[
            styles.profileSection,
            { opacity: profileOp, transform: [{ scale: profileScale }] },
          ]}
        >
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>A</Text>
            </View>
            <TouchableOpacity style={styles.editAvatarBtn} activeOpacity={0.8}>
              <Camera color="#FFFFFF" size={14} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>Alex Johnson</Text>
          <Text style={styles.userEmail}>alex.johnson@example.com</Text>

          <View style={styles.statusBadge}>
            <Shield color="#10B981" size={14} strokeWidth={3} />
            <Text style={styles.statusText}>Verified Account</Text>
          </View>
        </Animated.View>

        {/* Menu List */}
        <View style={styles.menuSection}>
          <MenuItem
            icon={User}
            iconBg="rgba(45,111,240,0.15)"
            title="Personal Details"
            delay={100}
          />
          <MenuItem
            icon={Settings}
            iconBg="rgba(155,81,224,0.15)"
            title="Preferences"
            delay={200}
          />
          <MenuItem
            icon={Bell}
            iconBg="rgba(245,158,11,0.15)"
            title="Notifications"
            delay={300}
          />
          <MenuItem
            icon={Shield}
            iconBg="rgba(16,185,129,0.15)"
            title="Security"
            delay={400}
          />
          
          <View style={styles.menuDivider} />

          <MenuItem
            icon={HelpCircle}
            iconBg="rgba(255,255,255,0.05)"
            title="Help & Support"
            delay={500}
          />
          <MenuItem
            icon={Info}
            iconBg="rgba(255,255,255,0.05)"
            title="About ChainPay"
            delay={600}
          />
          
          <View style={styles.menuDivider} />

          <MenuItem
            icon={LogOut}
            iconBg="rgba(239,68,68,0.1)"
            title="Log Out"
            isDestructive
            delay={700}
            onPress={() => goTo("Login")}
          />
        </View>
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
                goTo("Activity");
              } else if (tab.name === "Home") {
                goTo("Home");
              } else if (tab.name === "Profile") {
                // Already here
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
                    "Profile" === tab.name
                      ? "#2D6FF0"
                      : "rgba(255,255,255,0.35)"
                  }
                  size={22}
                  strokeWidth={"Profile" === tab.name ? 2.5 : 1.8}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    "Profile" === tab.name && styles.tabLabelActive,
                  ]}
                >
                  {tab.name}
                </Text>
                {"Profile" === tab.name && <View style={styles.tabDot} />}
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
    paddingTop: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
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
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },

  // Profile Info
  profileSection: {
    alignItems: "center",
    marginBottom: 36,
  },
  avatarContainer: {
    marginBottom: 16,
    position: "relative",
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#2D6FF0",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "rgba(45,111,240,0.2)",
  },
  avatarText: {
    fontSize: 36,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  editAvatarBtn: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#0A1628",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#060D1A",
  },
  userName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "#8E9EBA",
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16,185,129,0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusText: {
    color: "#10B981",
    fontSize: 12,
    fontWeight: "600",
  },

  // Menu List
  menuSection: {
    paddingHorizontal: 24,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.02)",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.03)",
  },
  menuIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  menuTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  menuTitleDestructive: {
    color: "#EF4444",
  },
  menuDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    marginVertical: 12,
    marginHorizontal: 10,
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

export default ProfileScreen;