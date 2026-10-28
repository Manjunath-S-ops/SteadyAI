import React, { useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';

export default function NutritionScreen() {
  const router = useRouter();
  
  const [mealInput, setMealInput] = useState('');
  const [meals, setMeals] = useState([
    { id: '1', title: 'Grilled Chicken Salad', calories: 350 },
    { id: '2', title: 'Protein Shake', calories: 180 }
  ]);

  const handleSaveMeal = () => {
    if (!mealInput.trim()) return;
    
    // Simulate a random calorie calculation for the demo
    const estimatedCalories = Math.floor(Math.random() * 400) + 150;
    
    setMeals([
      { id: Date.now().toString(), title: mealInput, calories: estimatedCalories },
      ...meals
    ]);
    
    setMealInput('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nutrition Log</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Daily Macros */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Today's Macros</Text>
          <View style={styles.macroRow}>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>120g</Text>
              <Text style={styles.macroLabel}>Protein</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>180g</Text>
              <Text style={styles.macroLabel}>Carbs</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>60g</Text>
              <Text style={styles.macroLabel}>Fats</Text>
            </View>
          </View>
        </View>

        {/* Log Meal */}
        <Text style={styles.sectionTitle}>Log a Meal</Text>
        <View style={styles.card}>
          <TextInput 
            style={styles.input} 
            placeholder="What did you eat?" 
            placeholderTextColor="#94A3B8"
            value={mealInput}
            onChangeText={setMealInput}
            onSubmitEditing={handleSaveMeal}
          />
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Scan Barcode</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.primaryButton]} onPress={handleSaveMeal}>
            <Text style={styles.actionButtonTextPrimary}>Save Meal</Text>
          </TouchableOpacity>
        </View>

        {/* Meal History */}
        <Text style={styles.sectionTitle}>Recent Meals</Text>
        {meals.map((meal) => (
          <View key={meal.id} style={styles.mealCard}>
            <Text style={styles.mealTitle}>{meal.title}</Text>
            <Text style={styles.mealCalories}>{meal.calories} kcal</Text>
          </View>
        ))}

        <View style={{height: 100}} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F9FC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  backButton: { padding: 8 },
  backButtonText: { fontSize: 16, color: '#4F46E5', fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  scrollContent: { padding: 20 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginBottom: 16 },
  macroRow: { flexDirection: 'row', justifyContent: 'space-around' },
  macroItem: { alignItems: 'center' },
  macroValue: { fontSize: 24, fontWeight: '800', color: '#4F46E5' },
  macroLabel: { fontSize: 12, color: '#64748B', marginTop: 4 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 16 },
  input: { backgroundColor: '#F1F5F9', borderRadius: 12, padding: 16, fontSize: 16, color: '#0F172A', marginBottom: 16 },
  actionButton: { backgroundColor: '#E2E8F0', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 12 },
  actionButtonText: { color: '#475569', fontSize: 16, fontWeight: '700' },
  primaryButton: { backgroundColor: '#10B981', marginBottom: 0 },
  actionButtonTextPrimary: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  mealCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  mealTitle: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
  mealCalories: { fontSize: 16, color: '#64748B', fontWeight: '500' }
});
