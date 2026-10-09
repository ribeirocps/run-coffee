import { Feather, Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { INITIAL_CAFES } from '../data/initialData';
import { Cafe, CommunityPost } from '../types';

interface CommunityTabProps {
  cafes?: Cafe[];
  posts: CommunityPost[];
  onToggleCheer: (postId: string) => void;
  onOpenPostModal: () => void;
  isRunClubJoined?: boolean;
  onToggleRunClub?: () => void;
}

export const CommunityTab: React.FC<CommunityTabProps> = ({
  cafes = INITIAL_CAFES,
  posts,
  onToggleCheer,
  onOpenPostModal,
}) => {
  const [selectedStory, setSelectedStory] = useState<CommunityPost | null>(null);

  // Retorna a cor e o ícone do nível do atleta
  const getLevelBadgeInfo = (level?: string) => {
    if (level === 'Master Coffee Lover') {
      return { color: '#FC4C02', bg: 'rgba(252, 76, 2, 0.12)', icon: 'ribbon' };
    }
    if (level === 'Rei da Casa') {
      return { color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)', icon: 'trophy' };
    }
    if (level === 'Coffee Hunter') {
      return { color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)', icon: 'compass' };
    }
    return { color: '#A1A1AA', bg: 'rgba(161, 161, 170, 0.12)', icon: 'coffee' };
  };

  return (
    <ScrollView style={styles.tabContainer} contentContainerStyle={{ paddingBottom: 30 }}>
      {/* 1. CARROSSEL DE STORIES: ÚLTIMOS CHECK-INS */}
      <View style={styles.storiesSection}>
        <View style={styles.storiesHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={styles.liveDot} />
            <Text style={styles.storiesSectionTitle}>CHECK-INS RECENTES</Text>
          </View>
          <Text style={styles.storiesSectionBadge}>CAMPINAS AO VIVO</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.storiesScroll}
        >
          {/* Círculo 1: Seu Próprio Check-in / Postar */}
          <TouchableOpacity
            style={styles.storyItem}
            activeOpacity={0.8}
            onPress={onOpenPostModal}
          >
            <View style={styles.yourStoryRing}>
              <View style={styles.yourStoryInner}>
                <Feather name="plus" size={22} color="#FC4C02" />
              </View>
            </View>
            <Text style={styles.yourStoryLabel} numberOfLines={1}>
              Seu Check-in
            </Text>
            <Text style={styles.storySubLabel}>Postar</Text>
          </TouchableOpacity>

          {/* Círculos 2+: Os últimos check-ins da comunidade */}
          {posts.map((post) => (
            <TouchableOpacity
              key={post.id}
              style={styles.storyItem}
              activeOpacity={0.8}
              onPress={() => setSelectedStory(post)}
            >
              <View style={styles.storyRing}>
                {post.avatarUrl ? (
                  <Image source={{ uri: post.avatarUrl }} style={styles.storyAvatarImage} />
                ) : (
                  <View style={styles.storyAvatarFallback}>
                    <Text style={styles.storyAvatarText}>
                      {post.userName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}

                <View style={styles.storyCoffeeBadge}>
                  <Feather name="coffee" size={9} color="#FFF" />
                </View>
              </View>

              <Text style={styles.storyUserName} numberOfLines={1}>
                {post.userName.split(' ')[0]}
              </Text>
              <Text style={styles.storyCafeShort} numberOfLines={1}>
                {post.cafeName.split(' ')[0]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={{ paddingHorizontal: 16 }}>
        {/* 2. BOTÃO DE POSTAR */}
        <TouchableOpacity style={styles.postActionButton} onPress={onOpenPostModal}>
          <Feather name="edit-3" size={17} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={styles.postActionButtonText}>
            Compartilhar Treino ou Café
          </Text>
        </TouchableOpacity>

        {/* 3. FEED SOCIAL COM MÉTRICAS E NÍVEIS */}
        <Text style={styles.sectionHeading}>FEED DE ATIVIDADES</Text>

        {posts.map((post) => {
          const badge = getLevelBadgeInfo(post.userLevel);

          return (
            <View key={post.id} style={styles.postCard}>
              {/* Topo do Post: Foto, Nome e Selo de Nível */}
              <View style={styles.postHeader}>
                {post.avatarUrl ? (
                  <Image source={{ uri: post.avatarUrl }} style={styles.postAvatarImage} />
                ) : (
                  <View style={styles.postAvatarBox}>
                    <Text style={{ fontSize: 16 }}>{post.avatar}</Text>
                  </View>
                )}
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <Text style={styles.postAuthor}>{post.userName}</Text>
                    {post.userLevel && (
                      <View style={[styles.userLevelTag, { backgroundColor: badge.bg, borderColor: badge.color }]}>
                        <Ionicons name={badge.icon as any} size={10} color={badge.color} style={{ marginRight: 3 }} />
                        <Text style={[styles.userLevelTagText, { color: badge.color }]}>
                          {post.userLevel}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.postSubRow}>
                    <Text style={styles.postTime}>{post.timeAgo}</Text>
                    <Text style={styles.postDot}>•</Text>
                    <View style={styles.cafeTagPill}>
                      <Feather name="coffee" size={11} color="#FC4C02" style={{ marginRight: 3 }} />
                      <Text style={styles.cafeTagText}>{post.cafeName}</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Pílulas de Métricas de Treino (Distância & Duração) */}
              {(post.distanceKm || post.durationMin) && (
                <View style={styles.metricsRow}>
                  {post.distanceKm && (
                    <View style={styles.metricPill}>
                      <Feather name="trending-up" size={11} color="#FC4C02" style={{ marginRight: 4 }} />
                      <Text style={styles.metricPillText}>{post.distanceKm}</Text>
                    </View>
                  )}
                  {post.durationMin && (
                    <View style={styles.metricPill}>
                      <Feather name="clock" size={11} color="#A1A1AA" style={{ marginRight: 4 }} />
                      <Text style={styles.metricPillText}>{post.durationMin}</Text>
                    </View>
                  )}
                </View>
              )}

              {/* Texto do Post */}
              <Text style={styles.postText}>{post.text}</Text>

              {/* Foto anexada */}
              {post.photo && (
                <Image source={{ uri: post.photo }} style={styles.postImage} />
              )}

              {/* Rodapé com Brinde */}
              <View style={styles.postFooter}>
                <TouchableOpacity
                  style={[
                    styles.cheerButton,
                    post.hasCheered && styles.cheerButtonActive,
                  ]}
                  onPress={() => onToggleCheer(post.id)}
                >
                  <Ionicons
                    name={post.hasCheered ? 'flame' : 'flame-outline'}
                    size={16}
                    color={post.hasCheered ? '#FC4C02' : '#A3A3A3'}
                  />
                  <Text
                    style={[
                      styles.cheerButtonText,
                      post.hasCheered && styles.cheerButtonTextActive,
                    ]}
                  >
                    {post.hasCheered ? 'Brindado!' : 'Brinde!'} ({post.cheers})
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>

      {/* MODAL STORY */}
      <Modal
        visible={!!selectedStory}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedStory(null)}
      >
        <View style={styles.storyModalOverlay}>
          <View style={styles.storyModalCard}>
            <View style={styles.storyModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                {selectedStory?.avatarUrl ? (
                  <Image source={{ uri: selectedStory.avatarUrl }} style={{ width: 36, height: 36, borderRadius: 18 }} />
                ) : (
                  <View style={styles.storyAvatarFallback}>
                    <Text style={{ color: '#FFF', fontWeight: 'bold' }}>
                      {selectedStory?.userName.charAt(0)}
                    </Text>
                  </View>
                )}
                <View>
                  <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 14 }}>
                    {selectedStory?.userName}
                  </Text>
                  <Text style={{ color: '#FC4C02', fontSize: 11, fontWeight: '600' }}>
                    {selectedStory?.cafeName} • {selectedStory?.timeAgo}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setSelectedStory(null)} style={{ padding: 4 }}>
                <Feather name="x" size={22} color="#FFF" />
              </TouchableOpacity>
            </View>

            {selectedStory?.photo ? (
              <Image source={{ uri: selectedStory.photo }} style={styles.storyModalPhoto} />
            ) : (
              <View style={styles.storyModalPhotoPlaceholder}>
                <Feather name="coffee" size={48} color="#52525B" />
                <Text style={{ color: '#71717A', fontSize: 13, marginTop: 8 }}>Check-in sem foto anexada</Text>
              </View>
            )}

            <View style={{ padding: 16 }}>
              {/* Métricas no Story */}
              {(selectedStory?.distanceKm || selectedStory?.durationMin) && (
                <View style={[styles.metricsRow, { marginBottom: 10 }]}>
                  {selectedStory.distanceKm && (
                    <View style={styles.metricPill}>
                      <Feather name="trending-up" size={11} color="#FC4C02" style={{ marginRight: 4 }} />
                      <Text style={styles.metricPillText}>{selectedStory.distanceKm}</Text>
                    </View>
                  )}
                  {selectedStory.durationMin && (
                    <View style={styles.metricPill}>
                      <Feather name="clock" size={11} color="#A1A1AA" style={{ marginRight: 4 }} />
                      <Text style={styles.metricPillText}>{selectedStory.durationMin}</Text>
                    </View>
                  )}
                </View>
              )}

              <Text style={{ color: '#E4E4E7', fontSize: 14, lineHeight: 20 }}>
                {selectedStory?.text}
              </Text>

              <TouchableOpacity
                style={[
                  styles.storyCheerBtn,
                  selectedStory?.hasCheered && { backgroundColor: '#FC4C02' },
                ]}
                onPress={() => {
                  if (selectedStory) {
                    onToggleCheer(selectedStory.id);
                    setSelectedStory((prev) =>
                      prev
                        ? {
                            ...prev,
                            hasCheered: !prev.hasCheered,
                            cheers: !prev.hasCheered ? prev.cheers + 1 : prev.cheers - 1,
                          }
                        : null
                    );
                  }
                }}
              >
                <Ionicons name="flame" size={18} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 14 }}>
                  {selectedStory?.hasCheered ? 'Brindado!' : 'Brinde! ☕'} ({selectedStory?.cheers})
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  storiesSection: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
    marginBottom: 16,
  },
  storiesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  storiesSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#E5E5E5',
    letterSpacing: 1,
  },
  storiesSectionBadge: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FC4C02',
    letterSpacing: 0.8,
  },
  storiesScroll: {
    paddingHorizontal: 14,
    gap: 14,
  },
  storyItem: {
    alignItems: 'center',
    width: 64,
  },
  yourStoryRing: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 2,
    borderColor: '#3F3F46',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#18181B',
  },
  yourStoryInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  yourStoryLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FC4C02',
    marginTop: 6,
    textAlign: 'center',
  },
  storyRing: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 2.5,
    borderColor: '#FC4C02',
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: '#0D0D0D',
  },
  storyAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
  },
  storyAvatarFallback: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    backgroundColor: '#27272A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyAvatarText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  storyCoffeeBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FC4C02',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#0D0D0D',
  },
  storyUserName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E5E5E5',
    marginTop: 6,
    textAlign: 'center',
  },
  storyCafeShort: {
    fontSize: 10,
    color: '#71717A',
    textAlign: 'center',
  },
  storySubLabel: {
    fontSize: 10,
    color: '#71717A',
  },
  postActionButton: {
    backgroundColor: '#27272A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#3F3F46',
  },
  postActionButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#71717A',
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  postCard: {
    backgroundColor: '#18181B',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  postAvatarImage: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  postAvatarBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#27272A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  postAuthor: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
  userLevelTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 1.5,
    paddingHorizontal: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  userLevelTagText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  postSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 6,
  },
  postTime: {
    fontSize: 11,
    color: '#71717A',
  },
  postDot: {
    color: '#3F3F46',
    fontSize: 10,
  },
  cafeTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(252, 76, 2, 0.1)',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  cafeTagText: {
    color: '#FC4C02',
    fontSize: 11,
    fontWeight: '600',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  metricPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#27272A',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  metricPillText: {
    color: '#E4E4E7',
    fontSize: 11,
    fontWeight: '700',
  },
  postText: {
    fontSize: 14,
    color: '#E4E4E7',
    lineHeight: 20,
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 190,
    borderRadius: 14,
    marginBottom: 12,
  },
  postFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#27272A',
    paddingTop: 10,
  },
  cheerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#27272A',
  },
  cheerButtonActive: {
    backgroundColor: 'rgba(252, 76, 2, 0.15)',
  },
  cheerButtonText: {
    color: '#A1A1AA',
    fontSize: 12,
    fontWeight: '600',
  },
  cheerButtonTextActive: {
    color: '#FC4C02',
    fontWeight: 'bold',
  },
  storyModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    padding: 16,
  },
  storyModalCard: {
    backgroundColor: '#18181B',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#3F3F46',
    maxHeight: '85%',
  },
  storyModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#27272A',
  },
  storyModalPhoto: {
    width: '100%',
    height: 280,
    backgroundColor: '#0D0D0D',
  },
  storyModalPhotoPlaceholder: {
    width: '100%',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  storyCheerBtn: {
    backgroundColor: '#27272A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#3F3F46',
  },
});