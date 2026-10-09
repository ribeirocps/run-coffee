import { Feather, Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Image,
  Modal,
  Platform,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CommunityPost } from '../types';

interface CommunityTabProps {
  posts?: CommunityPost[] | any;
  onAddPost?: (post: any) => void;
  onLikePost?: (postId: string) => void;
  onOpenCreatePost?: () => void;
  userAvatar?: string;
  userName?: string;
  [key: string]: any;
}

const TOP_SAFE_PADDING =
  Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 16 : 52;

export const CommunityTab: React.FC<CommunityTabProps> = ({
  posts = [],
  onAddPost,
  userAvatar,
  userName = 'Você',
}) => {
  const initialList: CommunityPost[] = Array.isArray(posts) ? posts : [];
  const [feedPosts, setFeedPosts] = useState<CommunityPost[]>(initialList);
  const [activeStory, setActiveStory] = useState<CommunityPost | null>(null);
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);

  const handleToggleLike = (postId: string) => {
    setFeedPosts((prev) =>
      prev.map((item) => {
        if (item.id === postId) {
          const nextLiked = !item.hasLiked;
          return {
            ...item,
            hasLiked: nextLiked,
            likes: nextLiked ? item.likes + 1 : Math.max(0, item.likes - 1),
          };
        }
        return item;
      })
    );
  };

  const handleSharePost = async (post: CommunityPost) => {
    try {
      const activityInfo = post.distance ? `📍 ${post.distance} (${post.pace || 'Atividade'})` : '';
      const shareMessage = `☕ RunCoffee Clube Campinas\n\n${post.userName} marcou presença no café ${post.cafeName}!\n\n"${post.text}"\n${activityInfo}\n\nJunte-se ao nosso clube de cafés e atividades urbanas!`;

      await Share.share({
        title: 'RunCoffee Clube',
        message: shareMessage,
      });
    } catch (error) {
      console.log('Erro ao compartilhar:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View>
            <View style={styles.clubBadge}>
              <Feather name="coffee" size={13} color="#FF6B00" />
              <Text style={styles.clubBadgeText}>CLUBE RUNCOFFEE</Text>
            </View>
            <Text style={styles.title}>Feed do Clube</Text>
            <Text style={styles.subtitle}>Check-ins, treinos e rolês de café em Campinas</Text>
          </View>
        </View>

        <View style={styles.storiesSection}>
          <Text style={styles.storiesSectionTitle}>Check-ins Recentes</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.storiesScroll}>
            {/* Seu Story */}
            <TouchableOpacity
              style={styles.storyItem}
              activeOpacity={0.8}
              onPress={() => {
                const myPost = feedPosts.find((p) => p.userName === userName || p.userHandle === '@voce');
                if (myPost) {
                  setActiveStory(myPost);
                } else if (feedPosts[0]) {
                  setActiveStory(feedPosts[0]);
                }
              }}
            >
              <View style={[styles.storyRing, styles.myStoryRing]}>
                <Image
                  source={{
                    uri:
                      userAvatar ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
                  }}
                  style={styles.storyAvatar}
                />
                <View style={styles.myStoryPlusBadge}>
                  <Feather name="plus" size={11} color="#FFF" />
                </View>
              </View>
              <Text style={styles.storyName} numberOfLines={1}>
                Seu Story
              </Text>
            </TouchableOpacity>

            {/* Demais membros */}
            {feedPosts.map((post) => (
              <TouchableOpacity
                key={`story-${post.id}`}
                style={styles.storyItem}
                activeOpacity={0.8}
                onPress={() => setActiveStory(post)}
              >
                <View style={[styles.storyRing, styles.activeStoryRing]}>
                  <Image source={{ uri: post.avatar }} style={styles.storyAvatar} />
                </View>
                <Text style={styles.storyName} numberOfLines={1}>
                  {(post.userName || 'Membro').split(' ')[0]}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.feedContent} showsVerticalScrollIndicator={false}>
        {feedPosts.map((item) => (
          <View key={item.id} style={styles.postCard}>
            <View style={styles.postHeader}>
              <Image source={{ uri: item.avatar }} style={styles.postAvatar} />
              <View style={styles.postAuthorInfo}>
                <Text style={styles.postAuthorName}>{item.userName}</Text>
                <View style={styles.postSubRow}>
                  <Feather name="map-pin" size={12} color="#FF6B00" />
                  <Text style={styles.postCafeName}>{item.cafeName}</Text>
                  <Text style={styles.postDot}>•</Text>
                  <Text style={styles.postTime}>{item.timeAgo}</Text>
                </View>
              </View>
            </View>

            <Text style={styles.postText}>{item.text}</Text>

            {(item.distance || item.pace) && (
              <View style={styles.activityBadgeRow}>
                {item.distance && (
                  <View style={styles.activityBadge}>
                    <Feather name="navigation" size={12} color="#FF6B00" />
                    <Text style={styles.activityBadgeText}>{item.distance}</Text>
                  </View>
                )}
                {item.pace && (
                  <View style={styles.activityBadge}>
                    <Feather name="activity" size={12} color="#FFD700" />
                    <Text style={styles.activityBadgeText}>{item.pace}</Text>
                  </View>
                )}
              </View>
            )}

            {item.image ? (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => setEnlargedImage(item.image || null)}
                style={styles.postImageContainer}
              >
                <Image source={{ uri: item.image }} style={styles.postImage} resizeMode="cover" />
                <View style={styles.expandHint}>
                  <Feather name="maximize-2" size={14} color="#FFF" />
                </View>
              </TouchableOpacity>
            ) : null}

            <View style={styles.postActionsRow}>
              <TouchableOpacity
                style={[styles.actionBtn, item.hasLiked && styles.actionBtnActive]}
                onPress={() => handleToggleLike(item.id)}
              >
                <Ionicons
                  name={item.hasLiked ? 'flame' : 'flame-outline'}
                  size={20}
                  color={item.hasLiked ? '#FF6B00' : '#888'}
                />
                <Text style={[styles.actionBtnText, item.hasLiked && styles.actionBtnTextActive]}>
                  {item.likes}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
                <Feather name="message-circle" size={18} color="#888" />
                <Text style={styles.actionBtnText}>Comentar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtn}
                activeOpacity={0.7}
                onPress={() => handleSharePost(item)}
              >
                <Feather name="share-2" size={18} color="#888" />
                <Text style={styles.actionBtnText}>Compartilhar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* MODAL DE STORIES BLINDADO */}
      <Modal
        visible={!!activeStory}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveStory(null)}
      >
        <View style={styles.storyModalOverlay}>
          <View style={styles.storyTopBar}>
            <View style={styles.storyProgressIndicator} />
          </View>

          <View style={styles.storyModalHeader}>
            <Image
              source={{
                uri:
                  activeStory?.avatar ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
              }}
              style={styles.storyModalAvatar}
            />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.storyModalUserName}>{activeStory?.userName}</Text>
              <Text style={styles.storyModalSubtitle}>
                {activeStory?.cafeName} • {activeStory?.timeAgo}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.storyCloseBtn}
              onPress={() => setActiveStory(null)}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
              <Feather name="x" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.storyMainArea}>
            {activeStory?.image ? (
              <Image
                source={{ uri: activeStory.image }}
                style={styles.storyFullImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.storyFallbackContainer}>
                <Feather name="coffee" size={54} color="#FF6B00" />
                <Text style={styles.storyFallbackTitle}>{activeStory?.cafeName}</Text>
                <Text style={styles.storyFallbackText}>"{activeStory?.text}"</Text>
              </View>
            )}

            <View style={styles.storyBottomCard}>
              <View style={styles.storyBottomCafeRow}>
                <Feather name="map-pin" size={14} color="#FF6B00" />
                <Text style={styles.storyBottomCafeName}>{activeStory?.cafeName}</Text>
              </View>

              {activeStory?.text ? (
                <Text style={styles.storyBottomText}>{activeStory.text}</Text>
              ) : null}

              {(activeStory?.distance || activeStory?.pace) && (
                <View style={styles.storyMetricsRow}>
                  {activeStory.distance && (
                    <View style={styles.storyMetricPill}>
                      <Feather name="navigation" size={12} color="#FFF" />
                      <Text style={styles.storyMetricPillText}>{activeStory.distance}</Text>
                    </View>
                  )}
                  {activeStory.pace && (
                    <View style={styles.storyMetricPill}>
                      <Feather name="activity" size={12} color="#FFD700" />
                      <Text style={styles.storyMetricPillText}>{activeStory.pace}</Text>
                    </View>
                  )}
                </View>
              )}

              <TouchableOpacity
                style={styles.storyFireQuickBtn}
                activeOpacity={0.8}
                onPress={() => {
                  if (activeStory) {
                    handleToggleLike(activeStory.id);
                  }
                }}
              >
                <Ionicons name="flame" size={20} color="#FF6B00" />
                <Text style={styles.storyFireQuickText}>Mandar Fogo 🔥</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL DE FOTO EM TELA CHEIA */}
      <Modal
        visible={!!enlargedImage}
        transparent
        animationType="fade"
        onRequestClose={() => setEnlargedImage(null)}
      >
        <View style={styles.imageViewerBackdrop}>
          <TouchableOpacity
            style={styles.imageViewerCloseBtn}
            onPress={() => setEnlargedImage(null)}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <Feather name="x" size={28} color="#FFF" />
          </TouchableOpacity>
          {enlargedImage ? (
            <Image
              source={{ uri: enlargedImage }}
              style={styles.imageViewerContent}
              resizeMode="contain"
            />
          ) : null}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  header: {
    paddingTop: TOP_SAFE_PADDING,
    paddingHorizontal: 20,
    paddingBottom: 14,
    backgroundColor: '#141414',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  headerTitleRow: {
    marginBottom: 10,
  },
  clubBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,107,0,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,107,0,0.3)',
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  clubBadgeText: {
    color: '#FF6B00',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#8E8E8E',
    marginTop: 2,
  },
  storiesSection: {
    marginTop: 8,
  },
  storiesSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#777',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  storiesScroll: {
    flexDirection: 'row',
  },
  storyItem: {
    alignItems: 'center',
    marginRight: 14,
    width: 64,
  },
  storyRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    padding: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeStoryRing: {
    borderWidth: 2,
    borderColor: '#FF6B00',
  },
  myStoryRing: {
    borderWidth: 1.5,
    borderColor: '#444',
  },
  storyAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#222',
  },
  myStoryPlusBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FF6B00',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#141414',
  },
  storyName: {
    color: '#AAA',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
  feedContent: {
    padding: 16,
    paddingBottom: 110,
  },
  postCard: {
    backgroundColor: '#181818',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#262626',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  postAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#262626',
  },
  postAuthorInfo: {
    marginLeft: 12,
    flex: 1,
  },
  postAuthorName: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  postSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  postCafeName: {
    color: '#FF6B00',
    fontSize: 12,
    fontWeight: '600',
  },
  postDot: {
    color: '#555',
    fontSize: 12,
  },
  postTime: {
    color: '#777',
    fontSize: 12,
  },
  postText: {
    color: '#E0E0E0',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  activityBadgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  activityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#242424',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  activityBadgeText: {
    color: '#DDD',
    fontSize: 12,
    fontWeight: '600',
  },
  postImageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    position: 'relative',
  },
  postImage: {
    width: '100%',
    height: 220,
    backgroundColor: '#222',
  },
  expandHint: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.65)',
    padding: 6,
    borderRadius: 14,
  },
  postActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#242424',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  actionBtnActive: {
    backgroundColor: 'rgba(255,107,0,0.1)',
    borderRadius: 8,
  },
  actionBtnText: {
    color: '#888',
    fontSize: 13,
    fontWeight: '600',
  },
  actionBtnTextActive: {
    color: '#FF6B00',
    fontWeight: '700',
  },
  storyModalOverlay: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 10 : 44,
  },
  storyTopBar: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  storyProgressIndicator: {
    height: 2.5,
    backgroundColor: '#FF6B00',
    borderRadius: 2,
    width: '100%',
  },
  storyModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    zIndex: 10,
  },
  storyModalAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: '#FF6B00',
  },
  storyModalUserName: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  storyModalSubtitle: {
    color: '#BBB',
    fontSize: 11,
    marginTop: 1,
  },
  storyCloseBtn: {
    padding: 6,
  },
  storyMainArea: {
    flex: 1,
    position: 'relative',
    justifyContent: 'flex-end',
  },
  storyFullImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  storyFallbackContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#181818',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  storyFallbackTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 16,
    textAlign: 'center',
  },
  storyFallbackText: {
    color: '#CCC',
    fontSize: 15,
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 22,
  },
  storyBottomCard: {
    backgroundColor: 'rgba(15,15,15,0.85)',
    padding: 18,
    margin: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  storyBottomCafeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  storyBottomCafeName: {
    color: '#FF6B00',
    fontSize: 14,
    fontWeight: '700',
  },
  storyBottomText: {
    color: '#FFF',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  storyMetricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  storyMetricPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#262626',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  storyMetricPillText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  storyFireQuickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,107,0,0.2)',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FF6B00',
  },
  storyFireQuickText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  imageViewerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerCloseBtn: {
    position: 'absolute',
    top: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 16 : 52,
    right: 20,
    zIndex: 20,
    backgroundColor: 'rgba(40,40,40,0.8)',
    padding: 8,
    borderRadius: 22,
  },
  imageViewerContent: {
    width: '100%',
    height: '80%',
  },
});