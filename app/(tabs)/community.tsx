import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Image, Alert } from 'react-native';
import { useThemeStore } from '../../stores/themeStore';
import { useAuthStore } from '../../stores/authStore';
import { fetchUserPods, createPod, joinPodByCode, fetchPodMembers, Pod, PodMember } from '../../lib/pods';
import { fetchCommunityTemplates, getTemplateLikes, toggleTemplateLike, CommunityTemplate } from '../../lib/community';
import { ThemeSwitcher } from '../../components/ThemeSwitcher';
import { Users, Search, Plus, Compass, Heart, Share2, Flame, Heart as HeartIcon } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function CommunityScreen() {
  const { theme } = useThemeStore();
  const { user } = useAuthStore();
  const userId = user?.id || 'demo-user';
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'pods' | 'explore'>('explore');
  const [loading, setLoading] = useState(true);

  // Pods State
  const [myPods, setMyPods] = useState<Pod[]>([]);
  const [podMembersMap, setPodMembersMap] = useState<Record<string, PodMember[]>>({});
  const [joinCode, setJoinCode] = useState('');
  const [newPodName, setNewPodName] = useState('');

  // Explore State
  const [templates, setTemplates] = useState<CommunityTemplate[]>([]);
  const [likedTemplateIds, setLikedTemplateIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadPods(), loadTemplates()]);
    setLoading(false);
  };

  const loadPods = async () => {
    const { pods } = await fetchUserPods(userId);
    setMyPods(pods);
    
    // Load members for each pod
    const membersMap: Record<string, PodMember[]> = {};
    for (const pod of pods) {
      const { members } = await fetchPodMembers(pod.id);
      membersMap[pod.id] = members;
    }
    setPodMembersMap(membersMap);
  };

  const loadTemplates = async () => {
    const [{ templates: tpls }, { likedIds }] = await Promise.all([
      fetchCommunityTemplates(),
      getTemplateLikes(userId)
    ]);
    setTemplates(tpls);
    setLikedTemplateIds(likedIds);
  };

  const handleCreatePod = async () => {
    if (!newPodName.trim()) return;
    const { pod, error } = await createPod(newPodName, userId);
    if (error) {
      Alert.alert('Error', error);
    } else {
      setNewPodName('');
      loadPods();
    }
  };

  const handleJoinPod = async () => {
    if (!joinCode.trim()) return;
    const { error } = await joinPodByCode(joinCode, userId);
    if (error) {
      Alert.alert('Error', error);
    } else {
      setJoinCode('');
      loadPods();
    }
  };

  const handleToggleLike = async (templateId: string) => {
    const currentlyLiked = likedTemplateIds.includes(templateId);
    
    // Optimistic UI update
    if (currentlyLiked) {
      setLikedTemplateIds(prev => prev.filter(id => id !== templateId));
      setTemplates(prev => prev.map(t => t.id === templateId ? { ...t, like_count: t.like_count - 1 } : t));
    } else {
      setLikedTemplateIds(prev => [...prev, templateId]);
      setTemplates(prev => prev.map(t => t.id === templateId ? { ...t, like_count: t.like_count + 1 } : t));
    }

    await toggleTemplateLike(templateId, userId, currentlyLiked);
  };

  const handleStartTemplate = (template: CommunityTemplate) => {
    // In a full implementation, this would navigate to the challenge creation screen
    // passing the template tasks.
    Alert.alert('Start Challenge', `Ready to start "${template.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Let\'s Go', onPress: () => router.push('/(tabs)') }
    ]);
  };

  const renderPods = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      <View style={styles.actionRow}>
        <View style={styles.inputGroup}>
          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textPrimary }]}
            placeholder="Pod Name"
            placeholderTextColor={theme.textMuted}
            value={newPodName}
            onChangeText={setNewPodName}
          />
          <TouchableOpacity style={[styles.btn, { backgroundColor: theme.primary }]} onPress={handleCreatePod}>
            <Plus size={18} color="#FFF" />
            <Text style={styles.btnText}>Create</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textPrimary }]}
            placeholder="Invite Code"
            placeholderTextColor={theme.textMuted}
            value={joinCode}
            onChangeText={setJoinCode}
            autoCapitalize="characters"
          />
          <TouchableOpacity style={[styles.btn, { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }]} onPress={handleJoinPod}>
            <Text style={[styles.btnText, { color: theme.textPrimary }]}>Join</Text>
          </TouchableOpacity>
        </View>
      </View>

      {myPods.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Users color={theme.textMuted} size={44} />
          <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No Pods Yet</Text>
          <Text style={[styles.emptySub, { color: theme.textSecondary }]}>Join or create an accountability pod to stay motivated with friends.</Text>
        </View>
      ) : (
        myPods.map(pod => (
          <View key={pod.id} style={[styles.podCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={styles.podHeader}>
              <Text style={[styles.podName, { color: theme.textPrimary }]}>{pod.name}</Text>
              <View style={[styles.inviteBadge, { backgroundColor: theme.surface }]}>
                <Text style={[styles.inviteText, { color: theme.textSecondary }]}>Code: {pod.invite_code}</Text>
              </View>
            </View>
            
            <View style={styles.membersList}>
              {(podMembersMap[pod.id] || []).map(member => (
                <View key={member.id} style={styles.memberRow}>
                  <View style={styles.memberInfo}>
                    <Image source={{ uri: member.avatarUrl }} style={styles.avatar} />
                    <Text style={[styles.memberName, { color: theme.textPrimary }]}>{member.displayName}</Text>
                  </View>
                  <View style={styles.memberStats}>
                    <View style={styles.statPill}>
                      <Flame size={14} color="#f97316" />
                      <Text style={[styles.statValue, { color: theme.textPrimary }]}>{member.currentStreak}</Text>
                    </View>
                    <View style={styles.statPill}>
                      <HeartIcon size={14} color={theme.danger} fill={member.penaltiesUsed === 0 ? theme.danger : 'transparent'} />
                      <Text style={[styles.statValue, { color: theme.textPrimary }]}>{3 - (member.penaltiesUsed || 0)} lives</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );

  const renderExplore = () => {
    const filtered = templates.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.category.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.searchContainer}>
          <Search size={20} color={theme.textMuted} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textPrimary }]}
            placeholder="Search templates..."
            placeholderTextColor={theme.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {filtered.map(template => {
          const isLiked = likedTemplateIds.includes(template.id);
          return (
            <View key={template.id} style={[styles.templateCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View style={styles.templateHeader}>
                <View style={[styles.categoryBadge, { backgroundColor: theme.surface }]}>
                  <Text style={[styles.categoryText, { color: theme.primary }]}>{template.category.toUpperCase()}</Text>
                </View>
                <TouchableOpacity onPress={() => handleToggleLike(template.id)} style={styles.likeBtn}>
                  <Heart size={22} color={isLiked ? theme.danger : theme.textMuted} fill={isLiked ? theme.danger : 'transparent'} />
                  <Text style={[styles.likeCount, { color: theme.textSecondary }]}>{template.like_count}</Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.templateTitle, { color: theme.textPrimary }]}>{template.title}</Text>
              <Text style={[styles.templateDesc, { color: theme.textSecondary }]}>{template.description}</Text>

              <View style={styles.templateFooter}>
                <View style={styles.forkInfo}>
                  <Share2 size={14} color={theme.textMuted} />
                  <Text style={[styles.forkText, { color: theme.textMuted }]}>{template.fork_count} started this</Text>
                </View>
                <TouchableOpacity 
                  style={[styles.startBtn, { backgroundColor: theme.accent }]}
                  onPress={() => handleStartTemplate(template)}
                >
                  <Text style={styles.startBtnText}>Start Challenge</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={[styles.topBar, { borderBottomColor: theme.cardBorder }]}>
        <View style={styles.titleGroup}>
          <Users color={theme.accent} size={22} />
          <Text style={[styles.screenTitle, { color: theme.textPrimary }]}>Community</Text>
        </View>
        <ThemeSwitcher />
      </View>

      <View style={[styles.tabBar, { backgroundColor: theme.bg, borderBottomColor: theme.border }]}>
        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'explore' && { borderBottomColor: theme.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('explore')}
        >
          <Compass size={18} color={activeTab === 'explore' ? theme.primary : theme.textMuted} />
          <Text style={[styles.tabText, { color: activeTab === 'explore' ? theme.textPrimary : theme.textSecondary }]}>Explore</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'pods' && { borderBottomColor: theme.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('pods')}
        >
          <Users size={18} color={activeTab === 'pods' ? theme.primary : theme.textMuted} />
          <Text style={[styles.tabText, { color: activeTab === 'pods' ? theme.textPrimary : theme.textSecondary }]}>My Pods</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      ) : (
        activeTab === 'pods' ? renderPods() : renderExplore()
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  titleGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  screenTitle: { fontSize: 20, fontWeight: '800' },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Pods
  actionRow: {
    gap: 12,
    marginBottom: 20,
  },
  inputGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  btn: {
    height: 48,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  btnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 15,
  },
  emptyCard: { borderRadius: 20, padding: 32, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderStyle: 'dashed' },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  podCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  podHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  podName: {
    fontSize: 18,
    fontWeight: '800',
  },
  inviteBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  inviteText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  membersList: {
    gap: 12,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#CCC',
  },
  memberName: {
    fontSize: 15,
    fontWeight: '600',
  },
  memberStats: {
    flexDirection: 'row',
    gap: 12,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  // Explore
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  searchIcon: {
    position: 'absolute',
    left: 16,
    zIndex: 2,
  },
  searchInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingLeft: 44,
    paddingRight: 16,
    fontSize: 15,
  },
  templateCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  likeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  likeCount: {
    fontSize: 13,
    fontWeight: '600',
  },
  templateTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  templateDesc: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  templateFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(150,150,150,0.2)',
    paddingTop: 16,
  },
  forkInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  forkText: {
    fontSize: 13,
  },
  startBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  startBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
