import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Alert, ScrollView, Platform, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

let OpenWearables: any = null;
try {
  OpenWearables = require('@thebluebox/open-wearables').OpenWearables;
} catch (e) {
  console.warn("OpenWearables SDK not available. Using mock mode.");
}

export default function DashboardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [healthData, setHealthData] = useState<any>(null);

  const connectWearable = async () => {
    setLoading(true);
    try {
      if (OpenWearables) {
        const auth = await OpenWearables.authenticate({ provider: 'apple_health' });
        if (auth) setConnected(true);
      } else {
        setTimeout(() => setConnected(true), 1000);
      }
    } finally {
      setLoading(false);
    }
  };

  const syncData = async () => {
    setLoading(true);
    try {
      if (OpenWearables) {
        setHealthData(await OpenWearables.getDailySummary());
      } else {
        setTimeout(() => {
          setHealthData({ steps: 8432, heartRate: 72, sleepHours: 7.5, calories: 2150 });
        }, 1000);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Good Morning,</Text>
          <Text style={styles.name}>Alex!</Text>
          <Text style={styles.date}>Today is {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</Text>
        </View>

        {/* AI Coaching Focus Card */}
        <View style={[styles.card, styles.aiCard]}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitleWhite}>✨ AI Coach Focus</Text>
          </View>
          <Text style={styles.aiText}>"You had a great sleep last night. Today is a perfect day for a high-intensity workout. Let's focus on legs!"</Text>
          <TouchableOpacity style={styles.actionButtonLight} onPress={() => router.push('/chat')}>
            <Text style={styles.actionButtonTextDark}>Chat with Coach</Text>
          </TouchableOpacity>
        </View>

        {/* Wearables Integration */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Device Sync</Text>
          {!connected ? (
            <TouchableOpacity style={styles.actionButton} onPress={connectWearable} disabled={loading}>
              <Text style={styles.actionButtonText}>{loading ? 'Connecting...' : 'Connect Apple Watch'}</Text>
            </TouchableOpacity>
          ) : (
            <View>
              <Text style={styles.statusText}>✅ Device Connected</Text>
              <TouchableOpacity style={[styles.actionButton, styles.syncBtn]} onPress={syncData} disabled={loading}>
                <Text style={styles.actionButtonText}>{loading ? 'Syncing...' : 'Sync Latest Data'}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Dynamic Health Stats (Populated by Wearables) */}
        {healthData && (
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statEmoji}>👟</Text>
              <Text style={styles.statValue}>{healthData.steps.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Steps</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statEmoji}>❤️</Text>
              <Text style={styles.statValue}>{healthData.heartRate}</Text>
              <Text style={styles.statLabel}>BPM</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statEmoji}>😴</Text>
              <Text style={styles.statValue}>{healthData.sleepHours}h</Text>
              <Text style={styles.statLabel}>Sleep</Text>
            </View>
          </View>
        )}

        {/* Workout Status */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Today's Workout</Text>
          <Text style={styles.cardSubtitle}>Lower Body Power (45 min)</Text>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: '0%' }]} />
          </View>
          <Text style={styles.progressText}>0 of 6 exercises completed</Text>
          <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/workouts')}>
            <Text style={styles.actionButtonText}>Start Workout</Text>
          </TouchableOpacity>
        </View>

        {/* Nutrition Status */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Nutrition Goal</Text>
          <Text style={styles.cardSubtitle}>{healthData ? healthData.calories : 0} / 2500 kcal eaten</Text>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: healthData ? '85%' : '0%', backgroundColor: '#4caf50' }]} />
          </View>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#4caf50' }]}>
            <Text style={styles.actionButtonText}>Log Meal</Text>
          </TouchableOpacity>
        </View>

        <View style={{height: 100}} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    marginBottom: 24,
    marginTop: 20,
  },
  greeting: {
    fontSize: 18,
    color: '#64748B',
    fontWeight: '500',
  },
  name: {
    fontSize: 36,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: '#94A3B8',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
  },
  aiCard: {
    backgroundColor: '#4F46E5', // Indigo primary
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  cardTitleWhite: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardSubtitle: {
    fontSize: 15,
    color: '#475569',
    marginBottom: 16,
  },
  aiText: {
    fontSize: 15,
    color: '#E0E7FF',
    lineHeight: 22,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  statusText: {
    fontSize: 15,
    color: '#10B981',
    fontWeight: '600',
    marginBottom: 16,
  },
  actionButton: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  syncBtn: {
    backgroundColor: '#3B82F6',
  },
  actionButtonLight: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  actionButtonTextDark: {
    color: '#4F46E5',
    fontSize: 16,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statBox: {
    width: (width - 48 - 24) / 3, // 3 columns with padding
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '500',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 20,
  }
});
