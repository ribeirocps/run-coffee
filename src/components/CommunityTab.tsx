import React from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CommunityPost } from '../types';

interface CommunityTabProps {
  posts: CommunityPost[];
  onToggleCheer: (postId: string) => void;
  onOpenPostModal: () => void;
  isRunClubJoined: boolean;
  onToggleRunClub: () => void;
}

export const CommunityTab: React.FC<CommunityTabProps> = ({
  posts,
  onToggleCheer,
  onOpenPostModal,
  isRunClubJoined,
  onToggleRunClub,
}) => {
  return (
    <ScrollView style={styles.tabContainer} contentContainerStyle={{ padding: 16 }}>
      {/* Card do Encontro do Club */}
      <View style={styles.clubEventCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <Text style={{ fontSize: 26 }}>⚡</Text>
          <View>
            <Text style={styles.clubEventTitle}>Treino Coletivo de Sábado</Text>
            <Text style={styles.clubEventSubtitle}>08:00 • Lagoa do Taquaral ➡️ Cambuí</Text>
          </View>
        </View>
        <Text style={styles.clubEventDesc}>
          Ritmo leve de 6km finalizando com confraternização e café no Abigail Coffee Co.
        </Text>
        <TouchableOpacity
          style={[
            styles.clubEventButton,
            isRunClubJoined && { backgroundColor: '#10B981' },
          ]}
          onPress={() => {
            onToggleRunClub();
            Alert.alert(
              !isRunClubJoined ? 'Presença Confirmada! 🏃‍♂️' : 'Presença Cancelada',
              !isRunClubJoined
                ? 'Te esperamos sábado às 08h no portão 1 da Lagoa!'
                : 'Você removeu sua confirmação.'
            );
          }}
        >
          <Text style={styles.clubEventButtonText}>
            {isRunClubJoined ? '✓ Presença Confirmada' : 'Eu Vou! 🙋‍♂️'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Botão de Somar / Postar no Feed */}
      <TouchableOpacity style={styles.postActionButton} onPress={onOpenPostModal}>
        <Text style={{ fontSize: 18 }}>✍️</Text>
        <Text style={styles.postActionButtonText}>
          Compartilhar Treino ou Café
        </Text>
      </TouchableOpacity>

      <Text style={[styles.sectionHeading, { marginTop: 12 }]}>
        ☕ Feed da Comunidade
      </Text>

      {posts.map((post) => (
        <View key={post.id} style={styles.postCard}>
          <View style={styles.postHeader}>
            <Text style={{ fontSize: 24, marginRight: 10 }}>{post.avatar}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.postAuthor}>{post.userName}</Text>
              <Text style={styles.postTime}>
                {post.timeAgo} • <Text style={{ color: '#D97706' }}>{post.cafeName}</Text>
              </Text>
            </View>
          </View>

          <Text style={styles.postText}>{post.text}</Text>

          {post.photo && (
            <Image source={{ uri: post.photo }} style={styles.postImage} />
          )}

          <View style={styles.postFooter}>
            <TouchableOpacity
              style={[
                styles.cheerButton,
                post.hasCheered && styles.cheerButtonActive,
              ]}
              onPress={() => onToggleCheer(post.id)}
            >
              <Text style={{ fontSize: 16 }}>☕</Text>
              <Text
                style={[
                  styles.cheerButtonText,
                  post.hasCheered && { color: '#D97706', fontWeight: 'bold' },
                ]}
              >
                {post.hasCheered ? 'Brindado!' : 'Brinde!'} ({post.cheers})
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    flex: 1,
    backgroundColor: '#1C1917',
  },
  sectionHeading: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 6,
  },
  clubEventCard: {
    backgroundColor: '#292524',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#44403C',
  },
  clubEventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  clubEventSubtitle: {
    fontSize: 12,
    color: '#F59E0B',
    marginTop: 2,
  },
  clubEventDesc: {
    fontSize: 13,
    color: '#A8A29E',
    marginBottom: 12,
    lineHeight: 18,
  },
  clubEventButton: {
    backgroundColor: '#D97706',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  clubEventButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  postActionButton: {
    backgroundColor: '#D97706',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 25,
    marginBottom: 16,
    gap: 8,
    elevation: 4,
  },
  postActionButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  postCard: {
    backgroundColor: '#292524',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  postAuthor: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFF',
  },
  postTime: {
    fontSize: 12,
    color: '#78716C',
  },
  postText: {
    fontSize: 14,
    color: '#E7E5E4',
    lineHeight: 20,
    marginBottom: 10,
  },
  postImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: 12,
  },
  postFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#3C3836',
    paddingTop: 10,
  },
  cheerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#1C1917',
  },
  cheerButtonActive: {
    backgroundColor: 'rgba(217, 119, 6, 0.2)',
  },
  cheerButtonText: {
    color: '#A8A29E',
    fontSize: 13,
  },
});