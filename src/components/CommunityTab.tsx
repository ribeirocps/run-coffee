import { Feather, Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import React, { useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { INITIAL_CAFES } from '../data/initialData';
import { Cafe, CommunityPost, PostComment } from '../types';

const { width } = Dimensions.get('window');

interface CommunityTabProps {
  posts?: CommunityPost[] | any;
  onAddPost?: (post: any) => void;
  userAvatar?: string;
  userName?: string;
  isPrivateProfile?: boolean; // Modo Fantasma 👻
  cafes?: Cafe[];
  [key: string]: any;
}

const TOP_SAFE_PADDING =
  Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 16 : 52;

const DEFAULT_COMMENTS: PostComment[] = [
  {
    id: 'c1',
    userName: 'Mariana S.',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
    text: 'A torra dessa semana está sensacional!',
    timeAgo: 'há 10 min',
  },
  {
    id: 'c2',
    userName: 'Lucas "4bens"',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    text: 'Pós-treino no Cambuí é de lei! ☕🔥',
    timeAgo: 'há 25 min',
  },
];

export const CommunityTab: React.FC<CommunityTabProps> = ({
  posts = [],
  onAddPost,
  userAvatar,
  userName = 'Você',
  isPrivateProfile = false,
  cafes = INITIAL_CAFES,
}) => {
  const initialList: CommunityPost[] = (Array.isArray(posts) ? posts : []).map((p) => ({
    ...p,
    comments: p.comments && p.comments.length > 0 ? p.comments : DEFAULT_COMMENTS,
  }));

  const [feedPosts, setFeedPosts] = useState<CommunityPost[]>(initialList);

  // Navegação Contínua de Stories
  const [activeUserIndex, setActiveUserIndex] = useState<number | null>(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);

  // Modal de Comentários
  const [isCommentsModalVisible, setIsCommentsModalVisible] = useState(false);
  const [currentPostForComments, setCurrentPostForComments] = useState<CommunityPost | null>(null);
  const [newCommentText, setNewCommentText] = useState('');

  // Modal de Foto em Tela Cheia do Feed
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);

  // Estados para Criar Novo Post / Story
  const [isCreateStoryVisible, setIsCreateStoryVisible] = useState(false);
  const [storyImageUri, setStoryImageUri] = useState<string | null>(null);
  const [storyText, setStoryText] = useState('');
  const [selectedCafeName, setSelectedCafeName] = useState(cafes[0]?.name || 'D.Origem Cafés Especiais');
  const [isCustomCafe, setIsCustomCafe] = useState(false);
  const [customCafeName, setCustomCafeName] = useState('');

  // Destino da Publicação (Story, Feed ou Ambos)
  const [publishDestination, setPublishDestination] = useState<'story' | 'feed' | 'both'>('story');

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

  const handleOpenComments = (post: CommunityPost) => {
    setCurrentPostForComments(post);
    setIsCommentsModalVisible(true);
  };

  const handleSendComment = () => {
    if (!newCommentText.trim() || !currentPostForComments) return;

    const newComment: PostComment = {
      id: `comm-${Date.now()}`,
      userName,
      avatar:
        userAvatar ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      text: newCommentText.trim(),
      timeAgo: 'agora mesmo',
    };

    const updatedComments = [newComment, ...(currentPostForComments.comments || [])];

    setFeedPosts((prev) =>
      prev.map((p) =>
        p.id === currentPostForComments.id ? { ...p, comments: updatedComments } : p
      )
    );

    setCurrentPostForComments((prev) => (prev ? { ...prev, comments: updatedComments } : null));
    setNewCommentText('');
  };

  const handleSmartShare = (post: CommunityPost) => {
    const activityInfo = post.distance ? `📍 ${post.distance} (${post.pace || 'Rolê Urbano'})\n` : '';
    const shareMessage = `☕ *RunCoffee Clube Campinas*\n\n*${post.userName}* marcou presença no *${post.cafeName}*!\n\n"${post.text}"\n\n${activityInfo}📲 Baixe o app RunCoffee e venha explorar os cafés especiais de Campinas!`;

    if (post.image) {
      Alert.alert(
        'Compartilhar',
        'Como deseja compartilhar este momento?',
        [
          {
            text: '💬 WhatsApp (Mensagem Formatada)',
            onPress: async () => {
              try {
                const isWebUrl = post.image && post.image.startsWith('http');
                const textToSend = isWebUrl ? `${shareMessage}\n\n📸 ${post.image}` : shareMessage;
                await Share.share({ title: 'RunCoffee Clube', message: textToSend });
              } catch (e) {
                console.log(e);
              }
            },
          },
          {
            text: '📸 Foto Direta (WhatsApp / Stories)',
            onPress: async () => {
              try {
                let localUri = post.image!;
                if (post.image!.startsWith('http')) {
                  const filename = post.image!.split('/').pop()?.split('?')[0] || 'runcoffee.jpg';
                  const fileUri = `${FileSystem.cacheDirectory}${Date.now()}-${filename}`;
                  const dl = await FileSystem.downloadAsync(post.image!, fileUri);
                  localUri = dl.uri;
                }
                await Sharing.shareAsync(localUri, {
                  mimeType: 'image/jpeg',
                  dialogTitle: 'Enviar Foto para WhatsApp / Stories',
                });
              } catch (e) {
                Share.share({ message: shareMessage });
              }
            },
          },
          { text: 'Cancelar', style: 'cancel' },
        ]
      );
    } else {
      Share.share({ title: 'RunCoffee Clube', message: shareMessage });
    }
  };

  const handlePickStoryImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [9, 16],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets[0].uri) {
        setStoryImageUri(result.assets[0].uri);
      }
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível acessar a galeria de fotos.');
    }
  };

  const handlePublishStory = () => {
    if (!storyText.trim() && !storyImageUri) {
      Alert.alert('Aviso', 'Adicione uma foto ou uma mensagem!');
      return;
    }

    const finalCafe = isCustomCafe
      ? customCafeName.trim() || 'Local não cadastrado'
      : selectedCafeName;

    const newPost: CommunityPost = {
      id: `my-story-${Date.now()}`,
      userName,
      userHandle: '@voce',
      avatar:
        userAvatar ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      timeAgo: 'agora mesmo',
      cafeName: finalCafe,
      text: storyText.trim() || 'Momento especial com café!',
      likes: 1,
      hasLiked: false,
      distance: 'Check-in',
      pace: 'Rolê Urbano',
      image: storyImageUri || undefined,
      destination: publishDestination,
      isStoryOnly: publishDestination === 'story',
      isFeedOnly: publishDestination === 'feed',
      comments: [
        {
          id: `c-init-${Date.now()}`,
          userName: 'Clube RunCoffee',
          avatar: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=200&q=80',
          text: 'Boa escolha! Bom café! ☕✨',
          timeAgo: 'agora mesmo',
        },
      ],
    };
// 1. Apenas os SEUS stories reais
  const myStories = feedPosts.filter(
    (p) =>
      !p.isFeedOnly &&
      (p.userName === userName || p.userHandle === '@voce' || p.id.startsWith('my-story-'))
  );

  // 2. Stories dos outros membros (Lucas, Mariana, Thiago, etc.)
  const otherUsersMap = new Map<string, CommunityPost[]>();
  feedPosts.forEach((post) => {
    const isMe =
      post.userName === userName ||
      post.userHandle === '@voce' ||
      post.id.startsWith('my-story-');
    if (!isMe && !post.isFeedOnly) {
      const existing = otherUsersMap.get(post.userName) || [];
      existing.push(post);
      otherUsersMap.set(post.userName, existing);
    }
  });
  
    setFeedPosts([newPost, ...feedPosts]);
    if (onAddPost) onAddPost(newPost);

    setStoryImageUri(null);
    setStoryText('');
    setCustomCafeName('');
    setIsCustomCafe(false);
    setIsCreateStoryVisible(false);

    const feedbackMsg =
      publishDestination === 'story'
        ? 'Publicado apenas no seu Story (duração de 24h)!'
        : publishDestination === 'feed'
        ? 'Publicado no Feed permanente do Clube!'
        : 'Publicado no seu Story e no Feed do Clube!';

    Alert.alert('Sucesso! 🎉', feedbackMsg);
  };

  // Stories do usuário logado
  const myStories = feedPosts.filter(
    (p) =>
      !p.isFeedOnly &&
      (p.userName === userName || p.userHandle === '@voce' || p.id.startsWith('post-') || p.id.startsWith('story-'))
  );

  // Stories dos outros membros
  const otherUsersMap = new Map<string, CommunityPost[]>();
  feedPosts.forEach((post) => {
    const isMe = post.userName === userName || post.userHandle === '@voce' || post.id.startsWith('post-') || post.id.startsWith('story-');
    if (!isMe && !post.isFeedOnly) {
      const existing = otherUsersMap.get(post.userName) || [];
      existing.push(post);
      otherUsersMap.set(post.userName, existing);
    }
  });

  const otherUsersList = Array.from(otherUsersMap.entries()).map(([name, userPosts]) => ({
    userName: name,
    avatar: userPosts[0].avatar,
    stories: userPosts,
  }));

  const allStoryGroups = [
    ...(myStories.length > 0
      ? [{ userName, avatar: userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80', stories: myStories }]
      : []),
    ...otherUsersList,
  ];

  const currentGroup = activeUserIndex !== null ? allStoryGroups[activeUserIndex] : null;
  const currentStory = currentGroup ? currentGroup.stories[activeStoryIndex] : null;

  const handleNextStory = () => {
    if (activeUserIndex === null || !currentGroup) return;

    if (activeStoryIndex < currentGroup.stories.length - 1) {
      setActiveStoryIndex(activeStoryIndex + 1);
    } else if (activeUserIndex < allStoryGroups.length - 1) {
      setActiveUserIndex(activeUserIndex + 1);
      setActiveStoryIndex(0);
    } else {
      setActiveUserIndex(null);
      setActiveStoryIndex(0);
    }
  };

  const handlePrevStory = () => {
    if (activeUserIndex === null || !currentGroup) return;

    if (activeStoryIndex > 0) {
      setActiveStoryIndex(activeStoryIndex - 1);
    } else if (activeUserIndex > 0) {
      const prevGroup = allStoryGroups[activeUserIndex - 1];
      setActiveUserIndex(activeUserIndex - 1);
      setActiveStoryIndex(prevGroup.stories.length - 1);
    }
  };

  const visibleFeedPosts = feedPosts.filter((p) => !p.isStoryOnly);

  return (
    <View style={styles.container}>
      {/* Header Fixo */}
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

        {/* Stories Agrupados com Suporte a Modo Fantasma */}
        <View style={styles.storiesSection}>
          <Text style={styles.storiesSectionTitle}>Check-ins Recentes</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.storiesScroll}>
            {/* Caixinha: Seu Story com Estilo 👻 */}
            <View style={styles.storyItem}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  if (myStories.length > 0) {
                    setActiveUserIndex(0);
                    setActiveStoryIndex(0);
                  } else {
                    setIsCreateStoryVisible(true);
                  }
                }}
              >
                <View
                  style={[
                    styles.storyRing,
                    myStories.length > 0 ? styles.activeStoryRing : styles.myStoryRing,
                    isPrivateProfile && styles.ghostStoryRing,
                  ]}
                >
                  <Image
                    source={{
                      uri:
                        userAvatar ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
                    }}
                    style={[styles.storyAvatar, isPrivateProfile && styles.ghostAvatarOpacity]}
                  />

                  {/* Badge de Adicionar ou Apenas o 👻 */}
                  <TouchableOpacity
                    style={[styles.myStoryPlusBadge, isPrivateProfile && styles.ghostBadgeBg]}
                    activeOpacity={0.8}
                    onPress={() => setIsCreateStoryVisible(true)}
                  >
                    {isPrivateProfile ? (
                      <Text style={{ fontSize: 11 }}>👻</Text>
                    ) : (
                      <Feather name="plus" size={12} color="#FFF" />
                    )}
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
              <Text style={styles.storyName} numberOfLines={1}>
                {isPrivateProfile ? 'Você 👻' : myStories.length > 0 ? `Você (${myStories.length})` : 'Seu Story'}
              </Text>
            </View>

            {/* Demais membros */}
            {otherUsersList.map((user, idx) => {
              const targetIndex = myStories.length > 0 ? idx + 1 : idx;
              return (
                <TouchableOpacity
                  key={`user-story-${user.userName}`}
                  style={styles.storyItem}
                  activeOpacity={0.8}
                  onPress={() => {
                    setActiveUserIndex(targetIndex);
                    setActiveStoryIndex(0);
                  }}
                >
                  <View style={[styles.storyRing, styles.activeStoryRing]}>
                    <Image source={{ uri: user.avatar }} style={styles.storyAvatar} />
                    {user.stories.length > 1 && (
                      <View style={styles.countBadge}>
                        <Text style={styles.countBadgeText}>{user.stories.length}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.storyName} numberOfLines={1}>
                    {user.userName.split(' ')[0]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>

      {/* Feed de Posts */}
      <ScrollView contentContainerStyle={styles.feedContent} showsVerticalScrollIndicator={false}>
        {visibleFeedPosts.map((item) => (
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
                  name={item.hasLiked ? 'cafe' : 'cafe-outline'}
                  size={20}
                  color={item.hasLiked ? '#FF6B00' : '#888'}
                />
                <Text style={[styles.actionBtnText, item.hasLiked && styles.actionBtnTextActive]}>
                  {item.likes} {item.likes === 1 ? 'café' : 'cafés'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtn}
                activeOpacity={0.7}
                onPress={() => handleOpenComments(item)}
              >
                <Feather name="message-circle" size={18} color="#888" />
                <Text style={styles.actionBtnText}>
                  {item.comments && item.comments.length > 0 ? item.comments.length : 'Comentar'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtn}
                activeOpacity={0.7}
                onPress={() => handleSmartShare(item)}
              >
                <Feather name="share-2" size={18} color="#888" />
                <Text style={styles.actionBtnText}>Compartilhar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* MODAL PUBLICAR */}
      <Modal
        visible={isCreateStoryVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsCreateStoryVisible(false)}
      >
        <View style={styles.createStoryModalBackdrop}>
          <View style={styles.createStoryModalCard}>
            <View style={styles.createStoryHeader}>
              <Text style={styles.createStoryTitle}>Compartilhar Momento</Text>
              <TouchableOpacity onPress={() => setIsCreateStoryVisible(false)}>
                <Feather name="x" size={22} color="#FFF" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Onde quer compartilhar?</Text>
              <View style={styles.destinationToggleRow}>
                <TouchableOpacity
                  style={[
                    styles.destinationOption,
                    publishDestination === 'story' && styles.destinationOptionActive,
                  ]}
                  onPress={() => setPublishDestination('story')}
                >
                  <Feather
                    name="clock"
                    size={14}
                    color={publishDestination === 'story' ? '#FF6B00' : '#888'}
                  />
                  <Text
                    style={[
                      styles.destinationText,
                      publishDestination === 'story' && styles.destinationTextActive,
                    ]}
                  >
                    Apenas Story (24h)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.destinationOption,
                    publishDestination === 'feed' && styles.destinationOptionActive,
                  ]}
                  onPress={() => setPublishDestination('feed')}
                >
                  <Feather
                    name="grid"
                    size={14}
                    color={publishDestination === 'feed' ? '#FF6B00' : '#888'}
                  />
                  <Text
                    style={[
                      styles.destinationText,
                      publishDestination === 'feed' && styles.destinationTextActive,
                    ]}
                  >
                    Apenas Feed
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.destinationOption,
                    publishDestination === 'both' && styles.destinationOptionActive,
                  ]}
                  onPress={() => setPublishDestination('both')}
                >
                  <Feather
                    name="layers"
                    size={14}
                    color={publishDestination === 'both' ? '#FF6B00' : '#888'}
                  />
                  <Text
                    style={[
                      styles.destinationText,
                      publishDestination === 'both' && styles.destinationTextActive,
                    ]}
                  >
                    Story + Feed
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.photoPickerBox}
                activeOpacity={0.8}
                onPress={handlePickStoryImage}
              >
                {storyImageUri ? (
                  <Image source={{ uri: storyImageUri }} style={styles.pickedImagePreview} resizeMode="cover" />
                ) : (
                  <View style={styles.photoPickerPlaceholder}>
                    <Feather name="camera" size={32} color="#FF6B00" />
                    <Text style={styles.photoPickerText}>Toque para foto (9:16)</Text>
                    <Text style={styles.photoPickerSub}>1080 x 1920 pixels</Text>
                  </View>
                )}
              </TouchableOpacity>

              <Text style={styles.inputLabel}>Onde você está tomando esse café?</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cafeChipScroll}>
                {cafes.map((cafe) => (
                  <TouchableOpacity
                    key={cafe.id}
                    style={[
                      styles.cafeChip,
                      !isCustomCafe && selectedCafeName === cafe.name && styles.cafeChipActive,
                    ]}
                    onPress={() => {
                      setSelectedCafeName(cafe.name);
                      setIsCustomCafe(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.cafeChipText,
                        !isCustomCafe && selectedCafeName === cafe.name && styles.cafeChipTextActive,
                      ]}
                    >
                      {cafe.name.split(' ')[0]}
                    </Text>
                  </TouchableOpacity>
                ))}

                <TouchableOpacity
                  style={[styles.cafeChip, isCustomCafe && styles.cafeChipActive]}
                  onPress={() => setIsCustomCafe(true)}
                >
                  <Text style={[styles.cafeChipText, isCustomCafe && styles.cafeChipTextActive]}>
                    + Outro local
                  </Text>
                </TouchableOpacity>
              </ScrollView>

              {isCustomCafe && (
                <View style={{ marginBottom: 14 }}>
                  <Text style={styles.inputLabel}>Nome do local ou padaria:</Text>
                  <TextInput
                    style={styles.customCafeInput}
                    placeholder="Ex: Padaria Romana, Café em casa..."
                    placeholderTextColor="#666"
                    value={customCafeName}
                    onChangeText={setCustomCafeName}
                  />
                </View>
              )}

              <Text style={styles.inputLabel}>Legenda do momento</Text>
              <TextInput
                style={styles.storyTextInput}
                placeholder="Qual café você está provando hoje?..."
                placeholderTextColor="#666"
                value={storyText}
                onChangeText={setStoryText}
                multiline
                numberOfLines={2}
              />

              <TouchableOpacity style={styles.publishBtn} onPress={handlePublishStory}>
                <Text style={styles.publishBtnText}>Publicar</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL DE STORIES EM SEQUÊNCIA CONTÍNUA */}
      <Modal
        visible={activeUserIndex !== null && !!currentStory}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveUserIndex(null)}
      >
        <View style={styles.storyModalOverlay}>
          <View style={styles.storyTopBar}>
            {currentGroup?.stories.map((_, idx) => (
              <View
                key={`progress-${idx}`}
                style={[
                  styles.storyProgressSegment,
                  idx <= activeStoryIndex && styles.storyProgressSegmentActive,
                ]}
              />
            ))}
          </View>

          <View style={styles.storyModalHeader}>
  <Image
    source={{ uri: currentStory?.avatar || currentGroup?.avatar }}
    style={styles.storyModalAvatar}
            />
            <View style={{ flex: 1, marginLeft: 10 }}>
    <Text style={styles.storyModalUserName}>{currentStory?.userName}</Text>
              <Text style={styles.storyModalSubtitle}>
                {currentStory?.cafeName} • {currentStory?.timeAgo}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.storyCloseBtn}
              onPress={() => setActiveUserIndex(null)}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
              <Feather name="x" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.storyMainArea}>
            {currentStory?.image ? (
              <Image
                source={{ uri: currentStory.image }}
                style={styles.storyFullImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.storyFallbackContainer}>
                <Ionicons name="cafe" size={54} color="#FF6B00" />
                <Text style={styles.storyFallbackTitle}>{currentStory?.cafeName}</Text>
                <Text style={styles.storyFallbackText}>"{currentStory?.text}"</Text>
              </View>
            )}

            <TouchableOpacity style={styles.touchLeftZone} onPress={handlePrevStory} activeOpacity={1} />
            <TouchableOpacity style={styles.touchRightZone} onPress={handleNextStory} activeOpacity={1} />

            <View style={styles.storyBottomCard}>
              <View style={styles.storyBottomCafeRow}>
                <Feather name="map-pin" size={14} color="#FF6B00" />
                <Text style={styles.storyBottomCafeName}>{currentStory?.cafeName}</Text>
              </View>

              {currentStory?.text ? (
                <Text style={styles.storyBottomText}>{currentStory.text}</Text>
              ) : null}

              <View style={styles.storyActionsRow}>
                <TouchableOpacity
                  style={[styles.storyActionBtn, currentStory?.hasLiked && styles.storyActionBtnActive]}
                  onPress={() => currentStory && handleToggleLike(currentStory.id)}
                >
                  <Ionicons
                    name={currentStory?.hasLiked ? 'cafe' : 'cafe-outline'}
                    size={22}
                    color={currentStory?.hasLiked ? '#FF6B00' : '#FFF'}
                  />
                  <Text style={[styles.storyActionText, currentStory?.hasLiked && styles.storyActionTextActive]}>
                    {currentStory?.likes || 0}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.storyActionBtn}
                  onPress={() => currentStory && handleOpenComments(currentStory)}
                >
                  <Feather name="message-circle" size={20} color="#FFF" />
                  <Text style={styles.storyActionText}>
                    {currentStory?.comments?.length || 'Comentar'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.storyActionBtn}
                  onPress={() => currentStory && handleSmartShare(currentStory)}
                >
                  <Feather name="share-2" size={20} color="#FFF" />
                  <Text style={styles.storyActionText}>Compartilhar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* GAVETA DE COMENTÁRIOS */}
      <Modal
        visible={isCommentsModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsCommentsModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.commentsBackdrop}
        >
          <View style={styles.commentsCard}>
            <View style={styles.commentsHeader}>
              <View style={styles.commentsHeaderLeft}>
                <Feather name="message-circle" size={18} color="#FF6B00" />
                <Text style={styles.commentsTitle}>
                  Comentários ({currentPostForComments?.comments?.length || 0})
                </Text>
              </View>
              <TouchableOpacity onPress={() => setIsCommentsModalVisible(false)}>
                <Feather name="x" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.commentsList} showsVerticalScrollIndicator={false}>
              {currentPostForComments?.comments && currentPostForComments.comments.length > 0 ? (
                currentPostForComments.comments.map((c) => (
                  <View key={c.id} style={styles.commentItem}>
                    <Image source={{ uri: c.avatar }} style={styles.commentAvatar} />
                    <View style={styles.commentContent}>
                      <View style={styles.commentMetaRow}>
                        <Text style={styles.commentUserName}>{c.userName}</Text>
                        <Text style={styles.commentTime}>{c.timeAgo}</Text>
                      </View>
                      <Text style={styles.commentText}>{c.text}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyCommentsBox}>
                  <Text style={styles.emptyCommentsText}>
                    Seja o primeiro a mandar um comentário sobre esse café! ☕
                  </Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.commentInputRow}>
              <TextInput
                style={styles.commentTextInput}
                placeholder="Escreva um comentário para o membro..."
                placeholderTextColor="#666"
                value={newCommentText}
                onChangeText={setNewCommentText}
              />
              <TouchableOpacity
                style={[styles.sendCommentBtn, !newCommentText.trim() && { opacity: 0.5 }]}
                disabled={!newCommentText.trim()}
                onPress={handleSendComment}
              >
                <Feather name="send" size={16} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* VIEWER FOTO CHEIA */}
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
    borderWidth: 2,
    borderColor: '#444',
  },
  ghostStoryRing: {
    borderWidth: 2,
    borderColor: '#7E57C2',
    borderStyle: 'dashed',
  },
  storyAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#222',
  },
  ghostAvatarOpacity: {
    opacity: 0.45,
  },
  myStoryPlusBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    backgroundColor: '#FF6B00',
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#141414',
  },
  ghostBadgeBg: {
    backgroundColor: '#7E57C2',
  },
  countBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FF6B00',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#141414',
  },
  countBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
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
  createStoryModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  createStoryModalCard: {
    backgroundColor: '#181818',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: '#303030',
  },
  createStoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  createStoryTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  },
  destinationToggleRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
  },
  destinationOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#222',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  destinationOptionActive: {
    backgroundColor: 'rgba(255,107,0,0.15)',
    borderColor: '#FF6B00',
  },
  destinationText: {
    color: '#888',
    fontSize: 11,
    fontWeight: '600',
  },
  destinationTextActive: {
    color: '#FF6B00',
    fontWeight: '700',
  },
  photoPickerBox: {
    height: 200,
    width: 120,
    backgroundColor: '#222',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#FF6B00',
    borderStyle: 'dashed',
  },
  photoPickerPlaceholder: {
    alignItems: 'center',
    gap: 6,
    padding: 8,
  },
  photoPickerText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  photoPickerSub: {
    color: '#888',
    fontSize: 9,
  },
  pickedImagePreview: {
    width: '100%',
    height: '100%',
  },
  inputLabel: {
    color: '#AAA',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  cafeChipScroll: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  cafeChip: {
    backgroundColor: '#242424',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  cafeChipActive: {
    backgroundColor: '#FF6B00',
    borderColor: '#FF6B00',
  },
  cafeChipText: {
    color: '#AAA',
    fontSize: 12,
    fontWeight: '600',
  },
  cafeChipTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  customCafeInput: {
    backgroundColor: '#222',
    color: '#FFF',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#444',
  },
  storyTextInput: {
    backgroundColor: '#222',
    color: '#FFF',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  publishBtn: {
    backgroundColor: '#FF6B00',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  publishBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  storyModalOverlay: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 10 : 44,
  },
  storyTopBar: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  storyProgressSegment: {
    flex: 1,
    height: 2.5,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
  },
  storyProgressSegmentActive: {
    backgroundColor: '#FF6B00',
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
  touchLeftZone: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width * 0.4,
    height: '70%',
    zIndex: 5,
  },
  touchRightZone: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: width * 0.6,
    height: '70%',
    zIndex: 5,
  },
  storyBottomCard: {
    backgroundColor: 'rgba(15,15,15,0.88)',
    padding: 16,
    margin: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    zIndex: 10,
  },
  storyBottomCafeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
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
    marginBottom: 12,
  },
  storyActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
  },
  storyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  storyActionBtnActive: {
    backgroundColor: 'rgba(255,107,0,0.15)',
    borderRadius: 10,
  },
  storyActionText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  storyActionTextActive: {
    color: '#FF6B00',
    fontWeight: '700',
  },
  commentsBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  commentsCard: {
    backgroundColor: '#181818',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    paddingHorizontal: 18,
    paddingBottom: Platform.OS === 'android' ? 20 : 36,
    maxHeight: '75%',
    borderWidth: 1,
    borderColor: '#303030',
  },
  commentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#262626',
    marginBottom: 12,
  },
  commentsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  commentsTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  commentsList: {
    maxHeight: 320,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  commentAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#262626',
  },
  commentContent: {
    marginLeft: 10,
    flex: 1,
    backgroundColor: '#222',
    padding: 10,
    borderRadius: 12,
  },
  commentMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  commentUserName: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  commentTime: {
    color: '#777',
    fontSize: 11,
  },
  commentText: {
    color: '#DDD',
    fontSize: 13,
    lineHeight: 18,
  },
  emptyCommentsBox: {
    padding: 24,
    alignItems: 'center',
  },
  emptyCommentsText: {
    color: '#777',
    fontSize: 13,
    textAlign: 'center',
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#262626',
  },
  commentTextInput: {
    flex: 1,
    backgroundColor: '#222',
    color: '#FFF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#333',
  },
  sendCommentBtn: {
    backgroundColor: '#FF6B00',
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
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