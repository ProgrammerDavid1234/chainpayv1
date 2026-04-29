import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';
import { ArrowLeft, ArrowDownLeft, ArrowUpRight, Zap, Gift } from 'lucide-react-native';

const NotificationScreen = ({ goTo }) => {
  const notifications = [
    {
      id: 1,
      title: 'Payment Received',
      message: 'You have received $150.00 from Michael Scott.',
      time: '10m ago',
      icon: ArrowDownLeft,
      type: 'receive',
      isNew: true,
    },
    {
      id: 2,
      title: 'Payment Sent',
      message: 'Your payment of $45.00 to Starbucks was successful.',
      time: '2h ago',
      icon: ArrowUpRight,
      type: 'send',
      isNew: false,
    },
    {
      id: 3,
      title: 'Cashback Earned',
      message: 'You earned $2.50 cashback from your recent grocery purchase.',
      time: '1d ago',
      icon: Gift,
      type: 'reward',
      isNew: false,
    },
    {
      id: 4,
      title: 'System Update',
      message: 'ChainPay has been updated to version 2.1 for better performance.',
      time: '2d ago',
      icon: Zap,
      type: 'system',
      isNew: false,
    },
  ];

  const getIconColor = (type) => {
    switch (type) {
      case 'receive': return '#10B981';
      case 'send': return '#EF4444';
      case 'reward': return '#F59E0B';
      default: return '#2D6FF0';
    }
  };

  const getIconBg = (type) => {
    switch (type) {
      case 'receive': return 'rgba(16, 185, 129, 0.15)';
      case 'send': return 'rgba(239, 68, 68, 0.15)';
      case 'reward': return 'rgba(245, 158, 11, 0.15)';
      default: return 'rgba(45, 111, 240, 0.15)';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => goTo('Home')} style={styles.backButton}>
          <ArrowLeft color="#FFFFFF" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.markReadContainer}>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.markReadText}>Mark all as read</Text>
          </TouchableOpacity>
        </View>

        {notifications.map((notif) => (
          <TouchableOpacity key={notif.id} style={[styles.notificationCard, notif.isNew && styles.newNotificationCard]} activeOpacity={0.7}>
            <View style={[styles.iconContainer, { backgroundColor: getIconBg(notif.type) }]}>
              <notif.icon color={getIconColor(notif.type)} size={22} />
            </View>
            <View style={styles.textContainer}>
              <View style={styles.titleRow}>
                <Text style={[styles.title, notif.isNew && styles.newTitle]}>{notif.title}</Text>
                <Text style={styles.time}>{notif.time}</Text>
              </View>
              <Text style={styles.message} numberOfLines={2}>{notif.message}</Text>
            </View>
            {notif.isNew && <View style={styles.newIndicator} />}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060D1A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  markReadContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 16,
    marginTop: 10,
  },
  markReadText: {
    color: '#2D6FF0',
    fontSize: 14,
    fontWeight: '600',
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  newNotificationCard: {
    backgroundColor: 'rgba(45, 111, 240, 0.05)',
    borderColor: 'rgba(45, 111, 240, 0.2)',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  newTitle: {
    fontWeight: '700',
  },
  time: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
  },
  message: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    lineHeight: 20,
  },
  newIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2D6FF0',
    position: 'absolute',
    top: 16,
    right: 16,
  },
});

export default NotificationScreen;