import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, Dimensions, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

let OpenWearables: any = null;
try {
  OpenWearables = require('@thebluebox/open-wearables').OpenWearables;
} catch (e) {
  console.warn("OpenWearables SDK not available. Using mock mode.");
}

export default function MainAppScreen() {
  const router = useRouter();
  
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Dashboard State
  const [dashLoading, setDashLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [healthData, setHealthData] = useState<any>(null);

  const handleAuth = () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter your email and password.');
      return;
    }

    if (isLoginMode) {
      if (email.toLowerCase() !== 'demo@steady.ai' || password !== 'password123') {
        Alert.alert('Invalid Credentials', 'Please use demo@steady.ai and password123 for this preview.');
        return;
      }
    } else {
      // In Create Account mode, accept any valid input to simulate registration
      if (password.length < 6) {
        Alert.alert('Weak Password', 'Password must be at least 6 characters long.');
        return;
      }
    }

    setAuthLoading(true);
    // Mock Auth delay for realistic UX
    setTimeout(() => {
      setAuthLoading(false);
      setIsAuthenticated(true);
    }, 1200);
  };

  const connectWearable = async () => {
    setDashLoading(true);
    try {
      if (OpenWearables) {
        const auth = await OpenWearables.authenticate({ provider: 'apple_health' });
        if (auth) setConnected(true);
      } else {
        setTimeout(() => setConnected(true), 1000);
      }
    } finally {
      setDashLoading(false);
    }
  };

  const syncData = async () => {
    setDashLoading(true);
    try {
      if (OpenWearables) {
        setHealthData(await OpenWearables.getDailySummary());
      } else {
        setTimeout(() => {
          setHealthData({ steps: 8432, heartRate: 72, sleepHours: 7.5, calories: 2150 });
        }, 1000);
      }
    } finally {
      setDashLoading(false);
    }
  };

  // --- RENDER AUTH SCREEN ---
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={authStyles.container}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={authStyles.content}>
          <View style={authStyles.headerContainer}>
            <Text style={authStyles.title}>SteadyAI</Text>
            <Text style={authStyles.subtitle}>{isLoginMode ? 'Sign in to continue' : 'Create your account'}</Text>
          </View>

          <View style={authStyles.formContainer}>
            <Text style={authStyles.label}>Email Address</Text>
            <TextInput
              style={authStyles.input}
              placeholder="you@example.com"
              placeholderTextColor="#94A3B8"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <Text style={authStyles.label}>Password</Text>
            <TextInput
              style={authStyles.input}
              placeholder="••••••••"
              placeholderTextColor="#94A3B8"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <TouchableOpacity style={[authStyles.button, authLoading && authStyles.buttonDisabled]} onPress={handleAuth} disabled={authLoading}>
              <Text style={authStyles.buttonText}>{authLoading ? 'Please wait...' : (isLoginMode ? 'Sign In' : 'Create Account')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={authStyles.switchModeBtn} onPress={() => setIsLoginMode(!isLoginMode)}>
              <Text style={authStyles.switchModeText}>
                {isLoginMode ? "Don't have an account? Create one" : "Already have an account? Sign in"}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // --- RENDER DASHBOARD SCREEN ---
  return (
    <SafeAreaView style={dashStyles.container}>
      <ScrollView contentContainerStyle={dashStyles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={dashStyles.header}>
          <Text style={dashStyles.greeting}>Welcome to</Text>
          <Text style={dashStyles.name}>Steady.AI</Text>
          <Text style={dashStyles.date}>Today is {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</Text>
        </View>

        {/* AI Coaching Focus Card */}
        <View style={[dashStyles.card, dashStyles.aiCard]}>
          <View style={dashStyles.cardHeaderRow}>
            <Text style={dashStyles.cardTitleWhite}>✨ AI Coach Focus</Text>
          </View>
          <Text style={dashStyles.aiText}>"You had a great sleep last night. Today is a perfect day for a high-intensity workout. Let's focus on legs!"</Text>
          <TouchableOpacity style={dashStyles.actionButtonLight} onPress={() => router.push('/chat')}>
            <Text style={dashStyles.actionButtonTextDark}>Chat with Coach</Text>
          </TouchableOpacity>
        </View>

        {/* Wearables Integration */}
        <View style={dashStyles.card}>
          <Text style={dashStyles.cardTitle}>Device Sync</Text>
          {!connected ? (
            <TouchableOpacity style={dashStyles.actionButton} onPress={connectWearable} disabled={dashLoading}>
              <Text style={dashStyles.actionButtonText}>{dashLoading ? 'Connecting...' : 'Connect Apple Watch'}</Text>
            </TouchableOpacity>
          ) : (
            <View>
              <Text style={dashStyles.statusText}>✅ Device Connected</Text>
              <TouchableOpacity style={[dashStyles.actionButton, dashStyles.syncBtn]} onPress={syncData} disabled={dashLoading}>
                <Text style={dashStyles.actionButtonText}>{dashLoading ? 'Syncing...' : 'Sync Latest Data'}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Dynamic Health Stats */}
        {healthData && (
          <View style={dashStyles.statsRow}>
            <View style={dashStyles.statBox}>
              <Text style={dashStyles.statEmoji}>👟</Text>
              <Text style={dashStyles.statValue}>{healthData.steps.toLocaleString()}</Text>
              <Text style={dashStyles.statLabel}>Steps</Text>
            </View>
            <View style={dashStyles.statBox}>
              <Text style={dashStyles.statEmoji}>❤️</Text>
              <Text style={dashStyles.statValue}>{healthData.heartRate}</Text>
              <Text style={dashStyles.statLabel}>BPM</Text>
            </View>
            <View style={dashStyles.statBox}>
              <Text style={dashStyles.statEmoji}>😴</Text>
              <Text style={dashStyles.statValue}>{healthData.sleepHours}h</Text>
              <Text style={dashStyles.statLabel}>Sleep</Text>
            </View>
          </View>
        )}

        {/* Workout Status */}
        <View style={dashStyles.card}>
          <Text style={dashStyles.cardTitle}>Today's Workout</Text>
          <Text style={dashStyles.cardSubtitle}>Lower Body Power (45 min)</Text>
          <View style={dashStyles.progressBarBg}>
            <View style={[dashStyles.progressBarFill, { width: '0%' }]} />
          </View>
          <Text style={dashStyles.progressText}>0 of 6 exercises completed</Text>
          <TouchableOpacity style={dashStyles.actionButton} onPress={() => router.push('/workouts')}>
            <Text style={dashStyles.actionButtonText}>Start Workout</Text>
          </TouchableOpacity>
        </View>

        {/* Nutrition Status */}
        <View style={dashStyles.card}>
          <Text style={dashStyles.cardTitle}>Nutrition Goal</Text>
          <Text style={dashStyles.cardSubtitle}>{healthData ? healthData.calories : 0} / 2500 kcal eaten</Text>
          <View style={dashStyles.progressBarBg}>
            <View style={[dashStyles.progressBarFill, { width: healthData ? '85%' : '0%', backgroundColor: '#4caf50' }]} />
          </View>
          <TouchableOpacity style={[dashStyles.actionButton, { backgroundColor: '#4caf50' }]} onPress={() => router.push('/nutrition')}>
            <Text style={dashStyles.actionButtonText}>Log Meal</Text>
          </TouchableOpacity>
        </View>

        <View style={{height: 100}} />
      </ScrollView>
    </SafeAreaView>
  );
}

const authStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { flex: 1, justifyContent: 'center', padding: 24 },
  headerContainer: { marginBottom: 40, alignItems: 'center' },
  title: { fontSize: 40, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#64748B' },
  formContainer: { backgroundColor: '#FFFFFF', padding: 24, borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 3 },
  label: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', color: '#64748B', marginBottom: 8, letterSpacing: 1 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 16, fontSize: 16, color: '#0F172A', marginBottom: 20 },
  button: { backgroundColor: '#4F46E5', padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 10 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  switchModeBtn: { marginTop: 20, alignItems: 'center' },
  switchModeText: { color: '#4F46E5', fontSize: 14, fontWeight: '600' }
});

const dashStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F9FC' },
  scrollContent: { padding: 24 },
  header: { marginBottom: 24, marginTop: 20 },
  greeting: { fontSize: 18, color: '#64748B', fontWeight: '500' },
  name: { fontSize: 36, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  date: { fontSize: 14, color: '#94A3B8' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.04, shadowRadius: 16, elevation: 2 },
  aiCard: { backgroundColor: '#4F46E5' },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B', marginBottom: 8 },
  cardTitleWhite: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  cardSubtitle: { fontSize: 15, color: '#475569', marginBottom: 16 },
  aiText: { fontSize: 15, color: '#E0E7FF', lineHeight: 22, marginBottom: 20, fontStyle: 'italic' },
  statusText: { fontSize: 15, color: '#10B981', fontWeight: '600', marginBottom: 16 },
  actionButton: { backgroundColor: '#0F172A', borderRadius: 16, padding: 16, alignItems: 'center' },
  syncBtn: { backgroundColor: '#3B82F6' },
  actionButtonLight: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, alignItems: 'center' },
  actionButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  actionButtonTextDark: { color: '#4F46E5', fontSize: 16, fontWeight: '700' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  statBox: { width: (width - 48 - 24) / 3, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  statEmoji: { fontSize: 24, marginBottom: 8 },
  statValue: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  statLabel: { fontSize: 12, color: '#64748B', marginTop: 4, fontWeight: '500' },
  progressBarBg: { height: 8, backgroundColor: '#F1F5F9', borderRadius: 4, marginBottom: 8, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#3B82F6', borderRadius: 4 },
  progressText: { fontSize: 13, color: '#64748B', marginBottom: 20 }
});
