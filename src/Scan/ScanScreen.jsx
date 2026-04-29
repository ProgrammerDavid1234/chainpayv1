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
} from "react-native";
import { X, Zap, Image as ImageIcon, QrCode } from "lucide-react-native";

const { width } = Dimensions.get("window");

const ScanScreen = ({ goTo }) => {
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const contentOp = useRef(new Animated.Value(0)).current;

  // Frame size
  const frameSize = width * 0.7;

  useEffect(() => {
    // Entrance
    Animated.timing(contentOp, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    // Scanning line animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: frameSize - 4, // moves to bottom of frame
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      <Animated.View style={[styles.content, { opacity: contentOp }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7} onPress={() => goTo("Home")}>
            <X color="#FFFFFF" size={24} strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan QR Code</Text>
          <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
            <Zap color="#FFFFFF" size={24} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* Scanner Area */}
        <View style={styles.scannerWrapper}>
          <View style={[styles.scannerFrame, { width: frameSize, height: frameSize }]}>
            {/* Corners */}
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />

            {/* Placeholder for Camera View */}
            <View style={styles.cameraPlaceholder}>
              <QrCode color="rgba(255,255,255,0.15)" size={80} strokeWidth={1.5} />
            </View>

            {/* Simulated Scanning Line */}
            <Animated.View
              style={[
                styles.scanLine,
                { transform: [{ translateY: scanLineAnim }] },
              ]}
            />
          </View>
          <Text style={styles.instructionText}>
            Align QR code within the frame to scan
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.galleryBtn} activeOpacity={0.8}>
            <ImageIcon color="#FFFFFF" size={20} strokeWidth={2} />
            <Text style={styles.galleryText}>Upload from Gallery</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    paddingTop: 0,
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  scannerWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  scannerFrame: {
    position: "relative",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  corner: {
    position: "absolute",
    width: 40,
    height: 40,
    borderColor: "#2D6FF0",
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 16,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 16,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 16,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 16,
  },
  scanLine: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 3,
    backgroundColor: "#2D6FF0",
    shadowColor: "#2D6FF0",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 10,
  },
  cameraPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  instructionText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 15,
    marginTop: 32,
    textAlign: "center",
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  galleryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingVertical: 16,
    borderRadius: 16,
    gap: 10,
  },
  galleryText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default ScanScreen;