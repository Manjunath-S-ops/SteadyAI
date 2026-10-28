import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Linking,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';

interface Exercise {
  name: string;
  durationMin: number;
  reps: string;
  thumbnailLabel?: string;
  mediaUrl?: string;
  mediaType?: 'GIF' | 'MP4' | 'IMAGE' | 'YOUTUBE' | 'NONE';
  gifUrl?: string;
  videoUrl?: string;
  demoUrl?: string;
  embedUrl?: string;
  videoId?: string;
  note: string;
}

interface WorkoutPlan {
  planId: string;
  title: string;
  focus: string;
  estimatedTotalMin: number;
  exercises: Exercise[];
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  workoutPlan?: WorkoutPlan;
}

function getYoutubeVideoId(exercise: Exercise): string {
  if (exercise.videoId) return exercise.videoId;
  const urls = [exercise.embedUrl, exercise.videoUrl, exercise.demoUrl, exercise.mediaUrl].filter(Boolean) as string[];
  for (const url of urls) {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (match) return match[1];
  }
  const name = exercise.name.toLowerCase();
  if (name.includes('jack')) return 'iSSAk4XCsRA';
  if (name.includes('push')) return 'IODxDxX7oi4';
  if (name.includes('squat') && name.includes('box')) return 'u5n_aE2GgX4';
  if (name.includes('squat')) return 'aclHkVaku9U';
  if (name.includes('march')) return '4m24k8o2d4k';
  if (name.includes('bridge')) return '8BBbpHrPqQA';
  if (name.includes('lunge')) return 'QOVaHwm-Q6U';
  if (name.includes('plank')) return 'pSHjTRCQxIw';
  if (name.includes('mountain') || name.includes('climber')) return 'nmwgirgXLYM';
  if (name.includes('bench')) return 'rT7DgCr-3pg';
  if (name.includes('row')) return 'roCP6wCXPqo';
  if (name.includes('curl')) return 'ykJmrZ5v0Oo';
  if (name.includes('press')) return 'qEwKCR5JCog';
  if (name.includes('deadlift')) return 'JCXUYuzwNrM';
  if (name.includes('calf')) return 'gwLzBJYoWlI';
  if (name.includes('burpee')) return 'auBLPXO8Fww';
  if (name.includes('high knee')) return '8opcQdC-V-U';
  if (name.includes('cat') || name.includes('cow')) return 'w_UK8OV2L8A';
  if (name.includes('dog')) return 'YQOpeWn_uHQ';
  if (name.includes('bug')) return 'g_BYB0R-4Ws';
  if (name.includes('crunch') || name.includes('twist')) return '9FGilxCbdz8';
  return 'IODxDxX7oi4';
}

export default function ChatScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      text: "Hi! I'm your SteadyAI Coach. How can I help you reach your health and fitness goals today? Ask me for any workout or exercise and I will share real video demonstrations and routines!"
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loggedPlans, setLoggedPlans] = useState<Record<string, string>>({});
  const scrollViewRef = useRef<ScrollView>(null);

  const quickPrompts = [
    'Quick core workout with video',
    'Full body exercise routine',
    'Push-up exercise video & form',
    'Lower body leg workout'
  ];

  const handleOpenDemo = async (url?: string, name?: string) => {
    const targetUrl = url || `https://www.youtube.com/results?search_query=${encodeURIComponent((name || 'exercise') + ' proper form tutorial')}`;
    try {
      await Linking.openURL(targetUrl);
    } catch {
      if (typeof window !== 'undefined' && window.open) {
        window.open(targetUrl, '_blank');
      } else {
        Alert.alert('Video Tutorial', `Opening demonstration for ${name}`);
      }
    }
  };

  const handleMarkComplete = (planId: string, feedback: string) => {
    setLoggedPlans(prev => ({ ...prev, [planId]: feedback }));
    Alert.alert('Workout Logged! 🎉', `Great job! Your session was recorded (${feedback.toLowerCase().replace('_', ' ')}).`);
  };

  const sendMessage = async (overridePrompt?: string) => {
    const messageToSend = (overridePrompt || input).trim();
    if (!messageToSend) return;

    const newUserMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: messageToSend };
    setMessages(prev => [...prev, newUserMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const response = await fetch('http://localhost:3000/api/assistant/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageToSend })
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();

      const newAiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: data.reply || "Here is what I put together for you:",
        workoutPlan: data.workoutPlan
      };
      setMessages(prev => [...prev, newAiMsg]);
    } catch (error) {
      console.warn("Backend unavailable or returned error, using verified video fallback:", error);

      const normalized = messageToSend.toLowerCase();
      const isCore = /core|ab|plank/i.test(normalized);
      const isPushup = /push-?up/i.test(normalized);
      const isLegs = /leg|squat|lunge/i.test(normalized);

      let fallbackExercises: Exercise[] = [
        {
          name: 'Jumping Jacks',
          durationMin: 3,
          reps: '3 sets of 45 seconds',
          videoId: 'iSSAk4XCsRA',
          embedUrl: 'https://www.youtube-nocookie.com/embed/iSSAk4XCsRA?rel=0',
          mediaUrl: 'https://img.youtube.com/vi/iSSAk4XCsRA/hqdefault.jpg',
          mediaType: 'YOUTUBE',
          videoUrl: 'https://www.youtube.com/watch?v=iSSAk4XCsRA',
          demoUrl: 'https://www.youtube.com/watch?v=iSSAk4XCsRA',
          note: 'Warm up at a controlled pace. Keep breathing steady and land softly on the balls of your feet.'
        },
        {
          name: 'Bodyweight Squat',
          durationMin: 4,
          reps: '3 sets of 12 reps',
          videoId: 'aclHkVaku9U',
          embedUrl: 'https://www.youtube-nocookie.com/embed/aclHkVaku9U?rel=0',
          mediaUrl: 'https://img.youtube.com/vi/aclHkVaku9U/hqdefault.jpg',
          mediaType: 'YOUTUBE',
          videoUrl: 'https://www.youtube.com/watch?v=aclHkVaku9U',
          demoUrl: 'https://www.youtube.com/watch?v=aclHkVaku9U',
          note: 'Keep chest upright, push knees outwards slightly, and press through mid-foot.'
        },
        {
          name: 'Push-Up + Shoulder Tap',
          durationMin: 4,
          reps: '3 sets of 10 reps',
          videoId: '1kE1Kx5zJ6o',
          embedUrl: 'https://www.youtube-nocookie.com/embed/1kE1Kx5zJ6o?rel=0',
          mediaUrl: 'https://img.youtube.com/vi/1kE1Kx5zJ6o/hqdefault.jpg',
          mediaType: 'YOUTUBE',
          videoUrl: 'https://www.youtube.com/watch?v=1kE1Kx5zJ6o',
          demoUrl: 'https://www.youtube.com/watch?v=1kE1Kx5zJ6o',
          note: 'Brace your core and minimize hip sway when tapping each shoulder.'
        },
        {
          name: 'Forearm Plank',
          durationMin: 3,
          reps: '3 sets of 30 seconds',
          videoId: 'pSHjTRCQxIw',
          embedUrl: 'https://www.youtube-nocookie.com/embed/pSHjTRCQxIw?rel=0',
          mediaUrl: 'https://img.youtube.com/vi/pSHjTRCQxIw/hqdefault.jpg',
          mediaType: 'YOUTUBE',
          videoUrl: 'https://www.youtube.com/watch?v=pSHjTRCQxIw',
          demoUrl: 'https://www.youtube.com/watch?v=pSHjTRCQxIw',
          note: 'Keep spine neutral from head to heels. Squeeze glutes and engage the abdominal wall.'
        }
      ];

      if (isCore) {
        fallbackExercises = [
          {
            name: 'Forearm Plank',
            durationMin: 3,
            reps: '3 sets of 35 seconds',
            videoId: 'pSHjTRCQxIw',
            embedUrl: 'https://www.youtube-nocookie.com/embed/pSHjTRCQxIw?rel=0',
            mediaUrl: 'https://img.youtube.com/vi/pSHjTRCQxIw/hqdefault.jpg',
            mediaType: 'YOUTUBE',
            videoUrl: 'https://www.youtube.com/watch?v=pSHjTRCQxIw',
            demoUrl: 'https://www.youtube.com/watch?v=pSHjTRCQxIw',
            note: 'Lock in your core, don’t let lower back sag.'
          },
          {
            name: 'Mountain Climbers',
            durationMin: 3,
            reps: '3 sets of 30 seconds',
            videoId: 'nmwgirgXLYM',
            embedUrl: 'https://www.youtube-nocookie.com/embed/nmwgirgXLYM?rel=0',
            mediaUrl: 'https://img.youtube.com/vi/nmwgirgXLYM/hqdefault.jpg',
            mediaType: 'YOUTUBE',
            videoUrl: 'https://www.youtube.com/watch?v=nmwgirgXLYM',
            demoUrl: 'https://www.youtube.com/watch?v=nmwgirgXLYM',
            note: 'Drive knees toward chest with controlled rhythm.'
          }
        ];
      } else if (isPushup) {
        fallbackExercises = [
          {
            name: 'Push-Up',
            durationMin: 4,
            reps: '4 sets of 10 reps',
            videoId: 'IODxDxX7oi4',
            embedUrl: 'https://www.youtube-nocookie.com/embed/IODxDxX7oi4?rel=0',
            mediaUrl: 'https://img.youtube.com/vi/IODxDxX7oi4/hqdefault.jpg',
            mediaType: 'YOUTUBE',
            videoUrl: 'https://www.youtube.com/watch?v=IODxDxX7oi4',
            demoUrl: 'https://www.youtube.com/watch?v=IODxDxX7oi4',
            note: 'Maintain rigid plank posture and lower chest until elbows reach 90 degrees.'
          },
          {
            name: 'Push-Up + Shoulder Tap',
            durationMin: 4,
            reps: '3 sets of 8 reps per side',
            videoId: '1kE1Kx5zJ6o',
            embedUrl: 'https://www.youtube-nocookie.com/embed/1kE1Kx5zJ6o?rel=0',
            mediaUrl: 'https://img.youtube.com/vi/1kE1Kx5zJ6o/hqdefault.jpg',
            mediaType: 'YOUTUBE',
            videoUrl: 'https://www.youtube.com/watch?v=1kE1Kx5zJ6o',
            demoUrl: 'https://www.youtube.com/watch?v=1kE1Kx5zJ6o',
            note: 'Keep your hips stable and avoid rocking side to side.'
          }
        ];
      } else if (isLegs) {
        fallbackExercises = [
          {
            name: 'Bodyweight Squat',
            durationMin: 4,
            reps: '4 sets of 12 reps',
            videoId: 'aclHkVaku9U',
            embedUrl: 'https://www.youtube-nocookie.com/embed/aclHkVaku9U?rel=0',
            mediaUrl: 'https://img.youtube.com/vi/aclHkVaku9U/hqdefault.jpg',
            mediaType: 'YOUTUBE',
            videoUrl: 'https://www.youtube.com/watch?v=aclHkVaku9U',
            demoUrl: 'https://www.youtube.com/watch?v=aclHkVaku9U',
            note: 'Descend to parallel, keep your chest high, and drive through heels.'
          },
          {
            name: 'Reverse Lunge',
            durationMin: 4,
            reps: '3 sets of 10 reps per side',
            videoId: 'QOVaHwm-Q6U',
            embedUrl: 'https://www.youtube-nocookie.com/embed/QOVaHwm-Q6U?rel=0',
            mediaUrl: 'https://img.youtube.com/vi/QOVaHwm-Q6U/hqdefault.jpg',
            mediaType: 'YOUTUBE',
            videoUrl: 'https://www.youtube.com/watch?v=QOVaHwm-Q6U',
            demoUrl: 'https://www.youtube.com/watch?v=QOVaHwm-Q6U',
            note: 'Take a long step back, lowering your back knee towards the floor.'
          },
          {
            name: 'Glute Bridge',
            durationMin: 3,
            reps: '3 sets of 15 reps',
            videoId: '8BBbpHrPqQA',
            embedUrl: 'https://www.youtube-nocookie.com/embed/8BBbpHrPqQA?rel=0',
            mediaUrl: 'https://img.youtube.com/vi/8BBbpHrPqQA/hqdefault.jpg',
            mediaType: 'YOUTUBE',
            videoUrl: 'https://www.youtube.com/watch?v=8BBbpHrPqQA',
            demoUrl: 'https://www.youtube.com/watch?v=8BBbpHrPqQA',
            note: 'Squeeze glutes at top of lift and pause for 1 second.'
          }
        ];
      }

      const fallbackPlan: WorkoutPlan = {
        planId: `plan-${Date.now()}`,
        title: isCore ? 'Core Power Session' : isPushup ? 'Push-Up & Upper Body Routine' : isLegs ? 'Lower Body Power Routine' : "Today's Workout Plan",
        focus: 'Form focus with video demonstrations',
        estimatedTotalMin: fallbackExercises.reduce((sum, e) => sum + e.durationMin, 0),
        exercises: fallbackExercises
      };

      const newAiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: `Here is your custom workout routine! You can watch each exercise video demonstration below:`,
        workoutPlan: fallbackPlan
      };
      setMessages(prev => [...prev, newAiMsg]);
    } finally {
      setIsTyping(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const renderExerciseMedia = (exercise: Exercise, index: number) => {
    const ytId = getYoutubeVideoId(exercise);
    const thumbnailUrl = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
    const embedUrl = `https://www.youtube-nocookie.com/embed/${ytId}?rel=0&modestbranding=1`;

    if (Platform.OS === 'web') {
      return (
        <View style={styles.videoContainer}>
          {React.createElement('iframe', {
            src: embedUrl,
            title: `${exercise.name} video tutorial`,
            width: '100%',
            height: '100%',
            style: {
              width: '100%',
              height: 200,
              border: 'none',
              borderRadius: 14,
              backgroundColor: '#0F172A'
            },
            allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
            allowFullScreen: true
          })}
          <View style={styles.exerciseIndexBadge}>
            <Text style={styles.exerciseIndexText}>{index + 1}</Text>
          </View>
        </View>
      );
    }

    // Native mobile view: thumbnail preview with play action
    return (
      <TouchableOpacity
        style={styles.videoContainer}
        onPress={() => handleOpenDemo(exercise.demoUrl || exercise.videoUrl || `https://www.youtube.com/watch?v=${ytId}`, exercise.name)}
        activeOpacity={0.85}
      >
        <Image
          source={{ uri: thumbnailUrl }}
          style={styles.exerciseImage}
          resizeMode="cover"
        />
        <View style={styles.playOverlay}>
          <View style={styles.playIconCircle}>
            <Text style={styles.playIconText}>▶</Text>
          </View>
          <Text style={styles.playOverlayText}>Tap to Watch Video Tutorial</Text>
        </View>
        <View style={styles.exerciseIndexBadge}>
          <Text style={styles.exerciseIndexText}>{index + 1}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>AI Health Coach</Text>
          <Text style={styles.headerStatus}>● Online • HD Videos</Text>
        </View>
        <View style={{ width: 60 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.chatContainer}
          showsVerticalScrollIndicator={false}
        >
          {messages.map(msg => (
            <View
              key={msg.id}
              style={[
                styles.messageWrapper,
                msg.role === 'user' ? styles.messageWrapperUser : styles.messageWrapperAi
              ]}
            >
              {msg.role === 'assistant' && (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>🤖</Text>
                </View>
              )}
              <View
                style={[
                  styles.messageBubble,
                  msg.role === 'user' ? styles.messageUser : styles.messageAi
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    msg.role === 'user' ? styles.messageTextUser : styles.messageTextAi
                  ]}
                >
                  {msg.text}
                </Text>

                {/* Render Workout Plan Card with Exercise Videos */}
                {msg.workoutPlan && (
                  <View style={styles.workoutPlanCard}>
                    {/* Header */}
                    <View style={styles.planHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.planBadge}>🏋️ WORKOUT PLAN</Text>
                        <Text style={styles.planTitle}>{msg.workoutPlan.title}</Text>
                        <Text style={styles.planFocus}>{msg.workoutPlan.focus}</Text>
                      </View>
                      <View style={styles.planDurationBadge}>
                        <Text style={styles.planDurationNum}>{msg.workoutPlan.estimatedTotalMin}</Text>
                        <Text style={styles.planDurationUnit}>MIN</Text>
                      </View>
                    </View>

                    {/* Exercises List */}
                    <View style={styles.exercisesList}>
                      {msg.workoutPlan.exercises.map((exercise, index) => {
                        const ytId = getYoutubeVideoId(exercise);
                        const videoLink = exercise.demoUrl || exercise.videoUrl || `https://www.youtube.com/watch?v=${ytId}`;

                        return (
                          <View key={`${msg.workoutPlan?.planId}-${exercise.name}-${index}`} style={styles.exerciseCard}>
                            {/* Video Player */}
                            {renderExerciseMedia(exercise, index)}

                            {/* Exercise Meta */}
                            <View style={styles.exerciseBody}>
                              <View style={styles.exerciseRow}>
                                <Text style={styles.exerciseName}>{exercise.name}</Text>
                                <View style={styles.durationPill}>
                                  <Text style={styles.durationPillText}>{exercise.durationMin} min</Text>
                                </View>
                              </View>

                              <Text style={styles.exercisePrescription}>Do {exercise.reps}</Text>
                              <Text style={styles.exerciseNote}>{exercise.note}</Text>

                              {/* Watch Video Demo Button */}
                              <TouchableOpacity
                                style={styles.watchVideoButton}
                                onPress={() => handleOpenDemo(videoLink, exercise.name)}
                              >
                                <Text style={styles.watchVideoText}>▶ Open Full Video Tutorial</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        );
                      })}
                    </View>

                    {/* Finished Workout Section */}
                    <View style={styles.logWorkoutSection}>
                      <Text style={styles.logWorkoutTitle}>Finished this workout?</Text>
                      <Text style={styles.logWorkoutSubtitle}>Rate how it felt to log it to your history:</Text>

                      <View style={styles.feedbackRow}>
                        {[
                          { key: 'TOO_EASY', label: 'Too Easy' },
                          { key: 'JUST_RIGHT', label: 'Just Right' },
                          { key: 'TOO_HARD', label: 'Too Hard' }
                        ].map(opt => (
                          <TouchableOpacity
                            key={opt.key}
                            style={[
                              styles.feedbackBtn,
                              loggedPlans[msg.workoutPlan!.planId] === opt.key && styles.feedbackBtnActive
                            ]}
                            onPress={() => handleMarkComplete(msg.workoutPlan!.planId, opt.key)}
                          >
                            <Text
                              style={[
                                styles.feedbackBtnText,
                                loggedPlans[msg.workoutPlan!.planId] === opt.key && styles.feedbackBtnTextActive
                              ]}
                            >
                              {opt.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>
                )}
              </View>
            </View>
          ))}

          {isTyping && (
            <View style={[styles.messageWrapper, styles.messageWrapperAi]}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>🤖</Text>
              </View>
              <View style={[styles.messageBubble, styles.messageAi, styles.typingBubble]}>
                <ActivityIndicator size="small" color="#4F46E5" />
                <Text style={styles.typingText}>Coach is loading video demonstration...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Quick Suggestion Pills */}
        <View style={styles.suggestionsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionsScroll}>
            {quickPrompts.map((prompt, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.suggestionPill}
                onPress={() => sendMessage(prompt)}
              >
                <Text style={styles.suggestionPillText}>{prompt}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Chat Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Ask for an exercise, video, or routine..."
            placeholderTextColor="#94A3B8"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => sendMessage()}
          />
          <TouchableOpacity style={styles.sendButton} onPress={() => sendMessage()}>
            <Text style={styles.sendButtonText}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  backButton: {
    padding: 8
  },
  backButtonText: {
    fontSize: 16,
    color: '#4F46E5',
    fontWeight: '600'
  },
  headerTitleContainer: {
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A'
  },
  headerStatus: {
    fontSize: 12,
    color: '#10B981',
    marginTop: 2,
    fontWeight: '600'
  },
  keyboardView: {
    flex: 1
  },
  chatContainer: {
    padding: 16,
    paddingBottom: 24
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-start'
  },
  messageWrapperUser: {
    justifyContent: 'flex-end'
  },
  messageWrapperAi: {
    justifyContent: 'flex-start'
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 4
  },
  avatarText: {
    fontSize: 18
  },
  messageBubble: {
    maxWidth: '94%',
    padding: 16,
    borderRadius: 20
  },
  messageUser: {
    backgroundColor: '#4F46E5',
    borderBottomRightRadius: 4,
    alignSelf: 'flex-end'
  },
  messageAi: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22
  },
  messageTextUser: {
    color: '#FFFFFF'
  },
  messageTextAi: {
    color: '#1E293B'
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 10
  },
  typingText: {
    fontSize: 13,
    color: '#64748B',
    fontStyle: 'italic'
  },

  // Workout Plan Card
  workoutPlanCard: {
    marginTop: 16,
    borderRadius: 20,
    backgroundColor: '#FFFBF7',
    borderWidth: 1,
    borderColor: '#EAD9CA',
    overflow: 'hidden',
    shadowColor: '#503018',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1D140D',
    padding: 16
  },
  planBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F5C99E',
    letterSpacing: 1.5,
    marginBottom: 4
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  planFocus: {
    fontSize: 13,
    color: '#E2E8F0',
    marginTop: 2
  },
  planDurationBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center'
  },
  planDurationNum: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF'
  },
  planDurationUnit: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F5C99E',
    letterSpacing: 1
  },
  exercisesList: {
    padding: 12,
    gap: 14
  },
  exerciseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1
  },
  videoContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#0F172A',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center'
  },
  exerciseImage: {
    width: '100%',
    height: '100%'
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  playIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4
  },
  playIconText: {
    fontSize: 18,
    color: '#0F172A',
    marginLeft: 3
  },
  playOverlayText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3
  },
  exerciseIndexBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    zIndex: 10
  },
  exerciseIndexText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700'
  },
  exerciseBody: {
    padding: 14
  },
  exerciseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1
  },
  durationPill: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  durationPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5'
  },
  exercisePrescription: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 6
  },
  exerciseNote: {
    fontSize: 13,
    lineHeight: 18,
    color: '#475569',
    marginBottom: 12
  },
  watchVideoButton: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center'
  },
  watchVideoText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700'
  },

  // Log Workout Section
  logWorkoutSection: {
    backgroundColor: '#FFF7ED',
    borderTopWidth: 1,
    borderTopColor: '#EAD9CA',
    padding: 16
  },
  logWorkoutTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1D140D',
    marginBottom: 2
  },
  logWorkoutSubtitle: {
    fontSize: 12,
    color: '#5F5145',
    marginBottom: 10
  },
  feedbackRow: {
    flexDirection: 'row',
    gap: 8
  },
  feedbackBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCCBBB',
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: 'center'
  },
  feedbackBtnActive: {
    backgroundColor: '#1D140D',
    borderColor: '#1D140D'
  },
  feedbackBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4E4035'
  },
  feedbackBtnTextActive: {
    color: '#FFFFFF'
  },

  // Suggestions
  suggestionsContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingVertical: 8
  },
  suggestionsScroll: {
    paddingHorizontal: 12,
    gap: 8
  },
  suggestionPill: {
    backgroundColor: '#EEF2FF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#C7D2FE'
  },
  suggestionPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4338CA'
  },

  // Input
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    alignItems: 'center'
  },
  input: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    marginRight: 10
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center'
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold'
  }
});
