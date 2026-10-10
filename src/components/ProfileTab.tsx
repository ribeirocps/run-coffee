import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { INITIAL_CAFES } from '../data/initialData';
import { Cafe, Circuit, CommunityPost } from '../types';
import { calculateUserLevel } from '../utils/levels';

interface ProfileTabProps {
  userName?: string;
  userAvatar?: string;
  userBio?: string;
  isPrivateProfile?: boolean;
  userKm?: number;
  userVisits?: number;
  userCrowns?: number;
  userMedals?: any;
  circuits?: Circuit[] | any;
  cafes?: Cafe[];
  userCheckIns?: string[];
  userPosts?: CommunityPost[];
  onOpenEditProfile?: () => void;
  onSelectCafe?: (cafe: Cafe) => void;
  onOpenStory?: (story: any) => void;
  [key: string]: any;
}

const TOP_SAFE_PADDING =
  Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 16 : 52;

export const ProfileTab: React.FC<ProfileTabProps> = ({
  userName = 'Você',
  userAvatar,
  userBio = 'Explorando os melhores cafés especiais e rolês urbanos de Campinas ☕✨',
  isPrivateProfile = false,
  userKm = 12.4,
  userVisits = 18,
  userCrowns = 1,
  userMedals,
  circuits = [],
  cafes = INITIAL_CAFES,
  userCheckIns = ['d-origem', 'container-cafe', 'abigail-coffee'],
  userPosts = [],
  onOpenEditProfile,
  onSelectCafe,
  onOpenStory,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'cafes' | 'conquistas'>('cafes');

  const levelData = calculateUserLevel(userVisits);
  const levelTitle = typeof levelData === 'string' ? levelData : levelData?.title || 'Coffee Hunter';

  const hasActiveStory = true;

  const visitedCafesList = [
    {
      ...cafes.find((c) => c.id === 'd-origem') || cafes[0],
      personalVisits: Math.max(14, userVisits > 5 ? Math.round(userVisits * 0.5) : 3),
      lastVisitLabel: 'Hoje, às 08:30',
      isVisited: true,
      isUserKing: true,
    },
    {
      ...cafes.find((c) => c.id === 'container-cafe') || cafes[1],
      personalVisits: Math.max(4, Math.round(userVisits * 0.3)),
      lastVisitLabel: 'Ontem',
      isVisited: true,
      isUserKing: false,
    },
    {
      ...cafes.find((c) => c.id === 'abigail-coffee') || cafes[2],
      personalVisits: 2,
      lastVisitLabel: 'há 3 dias',
      isVisited: true,
      isUserKing: false,
    },
  ];

  const defaultMedals = [
    { id: '1', title: 'Primeiro Gole', icon: '☕', desc: '1º check-in confirmado em Campinas', unlocked: userVisits >= 1 },
    { id: '2', title: 'Rei da Colina', icon: '👑', desc: 'Conquistou o Reinado de um café', unlocked: userCrowns >= 1 },
    { id: '3', title: 'Explorador Cambuí', icon: '📍', desc: 'Visitou 3 cafés no Cambuí', unlocked: userVisits >= 3 },
    { id: '4', title: 'Taquaral Lover', icon: '⚡', desc: 'Rolê urbano com parada no Lago', unlocked: userKm >= 10 },
    { id: '5', title: 'Mestre Cafeeiro', icon: '🏆', desc: 'Mais de 15 check-ins no Clube', unlocked: userVisits >= 15 },
  ];

  return (
    <View style={styles.container}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Text style={styles.headerTitle}>Meu Perfil</Text>
          {onOpenEditProfile && (
            <TouchableOpacity style={styles.editBtn} onPress={onOpenEditProfile}>
              <Feather name="edit-3" size={15} color="#FFF" />
              <Text style={styles.editBtnText}>Editar</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Card do Usuário */}
        <View style={styles.userCard}>
          <TouchableOpacity
            style={styles.avatarContainer}
            activeOpacity={0.8}
            onPress={() => onOpenStory && onOpenStory({ userName, avatar: userAvatar })}
          >
            <View
              style={[
                styles.avatarRing,
                hasActiveStory && !isPrivateProfile && styles.avatarRingActive,
                isPrivateProfile && styles.avatarRingGhost,
              ]}
            >
              <Image
                source={{
                  uri:
                    userAvatar ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
                }}
                style={[styles.avatar, isPrivateProfile && styles.avatarGhostOpacity]}
              />
            </View>

            {/* Tag do Avatar: Apenas 👻 se privado, ou STORY */}
            {isPrivateProfile ? (
              <View style={styles.ghostTagBadge}>
                <Text style={styles.ghostTagBadgeEmoji}>👻</Text>
              </View>
            ) : hasActiveStory ? (
              <View style={styles.storyTagBadge}>
                <Text style={styles.storyTagBadgeText}>STORY</Text>
              </View>
            ) : null}
          </TouchableOpacity>

          {/* Dados do Usuário com Opacidade se Fantasma */}
          <View style={[styles.userInfo, isPrivateProfile && styles.userInfoGhost]}>
            <View style={styles.nameRow}>
              <Text style={styles.userName}>{userName}</Text>
            </View>

            {/* Badges: Nível e apenas o 👻 */}
            <View style={styles.badgesRow}>
              <View style={[styles.levelBadge, isPrivateProfile && styles.levelBadgeGhost]}>
                <Feather name="shield" size={12} color={isPrivateProfile ? '#AAA' : '#FF6B00'} />
                <Text style={[styles.levelBadgeText, isPrivateProfile && { color: '#AAA' }]}>
                  {levelTitle.toUpperCase()}
                </Text>
              </View>

              {isPrivateProfile && (
                <View style={styles.ghostPill}>
                  <Text style={styles.ghostEmoji}>👻</Text>
                </View>
              )}
            </View>

            <Text style={[styles.userBioText, isPrivateProfile && styles.userBioGhost]} numberOfLines={3}>
              {userBio}
            </Text>
          </View>
        </View>

        {/* Métricas Principais */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{userVisits}</Text>
            <Text style={styles.statLabel}>Visitas</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{userKm}</Text>
            <Text style={styles.statLabel}>Km Rodados</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: '#FFD700' }]}>{userCrowns}</Text>
            <Text style={styles.statLabel}>Reinados 👑</Text>
          </View>
        </View>

        {/* Sub-Abas do Perfil */}
        <View style={styles.subTabBar}>
          <TouchableOpacity
            style={[styles.subTabButton, activeSubTab === 'cafes' && styles.subTabButtonActive]}
            onPress={() => setActiveSubTab('cafes')}
          >
            <Feather
              name="coffee"
              size={15}
              color={activeSubTab === 'cafes' ? '#FF6B00' : '#888'}
            />
            <Text
              style={[
                styles.subTabText,
                activeSubTab === 'cafes' && styles.subTabTextActive,
              ]}
            >
              Meus Cafés ({visitedCafesList.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.subTabButton, activeSubTab === 'conquistas' && styles.subTabButtonActive]}
            onPress={() => setActiveSubTab('conquistas')}
          >
            <Feather
              name="award"
              size={15}
              color={activeSubTab === 'conquistas' ? '#FF6B00' : '#888'}
            />
            <Text
              style={[
                styles.subTabText,
                activeSubTab === 'conquistas' && styles.subTabTextActive,
              ]}
            >
              Conquistas
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Conteúdo Rolável */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {activeSubTab === 'cafes' ? (
          <View style={styles.cafesSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Histórico de Frequência</Text>
              <Text style={styles.sectionSubtitle}>
                Toque em uma cafeteria para ver no mapa e traçar rota
              </Text>
            </View>

            {visitedCafesList.map((cafe) => {
              const perkMin = cafe.perkEligibleMinVisits || 5;
              const perkProgress = Math.min(100, (cafe.personalVisits / perkMin) * 100);
              const hasPerkReady = cafe.personalVisits >= perkMin;

              return (
                <TouchableOpacity
                  key={cafe.id}
                  style={styles.visitedCafeCard}
                  activeOpacity={0.7}
                  onPress={() => onSelectCafe && onSelectCafe(cafe)}
                >
                  <Image
                    source={{
                      uri:
                        cafe.photoUrl ||
                        'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=400&q=80',
                    }}
                    style={styles.cafeImage}
                  />

                  <View style={styles.cafeInfoCol}>
                    <View style={styles.cafeTitleRow}>
                      <Text style={styles.cafeName} numberOfLines={1}>
                        {cafe.name}
                      </Text>
                      {cafe.isUserKing && (
                        <View style={styles.crownTag}>
                          <Text style={styles.crownTagText}>👑 REI</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.cafeSubInfoRow}>
                      <Text style={styles.cafeAddress} numberOfLines={1}>
                        {cafe.address?.split('-')[1]?.trim() || 'Cambuí'}
                      </Text>
                      <Text style={styles.cafeDot}>•</Text>
                      <Text style={styles.lastVisitDateText}>{cafe.lastVisitLabel}</Text>
                    </View>

                    <View style={styles.visitsBadgeRow}>
                      <View style={styles.visitsBadge}>
                        <Feather name="check-circle" size={13} color="#FF6B00" />
                        <Text style={styles.visitsBadgeText}>
                          {cafe.personalVisits} {cafe.personalVisits === 1 ? 'visita' : 'visitas'}
                        </Text>
                      </View>

                      {hasPerkReady ? (
                        <View style={styles.perkReadyBadge}>
                          <Feather name="gift" size={12} color="#4CAF50" />
                          <Text style={styles.perkReadyText}>Cortesia liberada! ☕</Text>
                        </View>
                      ) : (
                        <Text style={styles.perkPendingText}>
                          Faltam {perkMin - (cafe.personalVisits % perkMin)} para cortesia
                        </Text>
                      )}
                    </View>

                    <View style={styles.perkBarBg}>
                      <View
                        style={[
                          styles.perkBarFill,
                          { width: `${perkProgress}%` },
                          hasPerkReady && { backgroundColor: '#4CAF50' },
                        ]}
                      />
                    </View>
                  </View>

                  <Feather name="chevron-right" size={18} color="#555" style={{ marginLeft: 6 }} />
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.medalsSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Medalhas do Clube</Text>
              <Text style={styles.sectionSubtitle}>Desbloqueie explorando novos pontos da cidade</Text>
            </View>

            <View style={styles.medalsGrid}>
              {defaultMedals.map((medal) => (
                <View
                  key={medal.id}
                  style={[styles.medalCard, !medal.unlocked && styles.medalCardLocked]}
                >
                  <View style={[styles.medalIconWrap, !medal.unlocked && styles.medalIconLocked]}>
                    <Text style={styles.medalEmoji}>{medal.icon}</Text>
                  </View>
                  <Text style={[styles.medalTitle, !medal.unlocked && styles.medalTitleLocked]}>
                    {medal.title}
                  </Text>
                  <Text style={styles.medalDesc}>{medal.desc}</Text>
                  <View style={styles.medalStatusBadge}>
                    <Text style={[styles.medalStatusText, medal.unlocked && styles.medalStatusUnlocked]}>
                      {medal.unlocked ? '✓ Conquistada' : 'Bloqueada'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
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
    paddingBottom: 4,
    backgroundColor: '#141414',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -0.5,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#262626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#383838',
  },
  editBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 14,
  },
  avatarRing: {
    width: 66,
    height: 66,
    borderRadius: 33,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarRingActive: {
    borderWidth: 2,
    borderColor: '#FF6B00',
  },
  avatarRingGhost: {
    borderWidth: 2,
    borderColor: '#7E57C2',
    borderStyle: 'dashed',
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#222',
  },
  avatarGhostOpacity: {
    opacity: 0.45,
  },
  storyTagBadge: {
    position: 'absolute',
    bottom: -4,
    alignSelf: 'center',
    backgroundColor: '#FF6B00',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#141414',
  },
  storyTagBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  /* TAG APENAS COM 👻 (SEM TEXTO) */
  ghostTagBadge: {
    position: 'absolute',
    bottom: -4,
    alignSelf: 'center',
    backgroundColor: 'rgba(20, 15, 30, 0.95)',
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#7E57C2',
  },
  ghostTagBadgeEmoji: {
    fontSize: 12,
  },
  userInfo: {
    flex: 1,
  },
  userInfoGhost: {
    opacity: 0.65,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    marginBottom: 6,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,107,0,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  levelBadgeGhost: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  levelBadgeText: {
    color: '#FF6B00',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  /* PÍLULA APENAS COM 👻 (SEM TEXTO) */
  ghostPill: {
    backgroundColor: 'rgba(126, 87, 194, 0.2)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(126, 87, 194, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ghostEmoji: {
    fontSize: 12,
  },
  userBioText: {
    color: '#AAA',
    fontSize: 12,
    lineHeight: 17,
  },
  userBioGhost: {
    color: '#888',
    fontStyle: 'italic',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#262626',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    color: '#888',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#303030',
  },
  subTabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#202020',
    marginTop: 2,
  },
  subTabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  subTabButtonActive: {
    borderBottomColor: '#FF6B00',
  },
  subTabText: {
    color: '#888',
    fontSize: 13,
    fontWeight: '600',
  },
  subTabTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 110,
  },
  sectionHeaderRow: {
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  sectionSubtitle: {
    color: '#777',
    fontSize: 12,
    marginTop: 2,
  },
  cafesSection: {},
  visitedCafeCard: {
    flexDirection: 'row',
    backgroundColor: '#181818',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#262626',
    alignItems: 'center',
  },
  cafeImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#262626',
  },
  cafeInfoCol: {
    marginLeft: 12,
    flex: 1,
  },
  cafeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cafeName: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  crownTag: {
    backgroundColor: 'rgba(255,215,0,0.18)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.4)',
  },
  crownTagText: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: '800',
  },
  cafeSubInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 1,
  },
  cafeAddress: {
    color: '#888',
    fontSize: 12,
  },
  cafeDot: {
    color: '#555',
    fontSize: 12,
  },
  lastVisitDateText: {
    color: '#FF6B00',
    fontSize: 11,
    fontWeight: '600',
  },
  visitsBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  visitsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,107,0,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  visitsBadgeText: {
    color: '#FF6B00',
    fontSize: 12,
    fontWeight: '700',
  },
  perkReadyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(76,175,80,0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  perkReadyText: {
    color: '#4CAF50',
    fontSize: 11,
    fontWeight: '700',
  },
  perkPendingText: {
    color: '#666',
    fontSize: 11,
  },
  perkBarBg: {
    height: 4,
    backgroundColor: '#262626',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 6,
  },
  perkBarFill: {
    height: '100%',
    backgroundColor: '#FF6B00',
    borderRadius: 2,
  },
  medalsSection: {},
  medalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  medalCard: {
    width: '48%',
    backgroundColor: '#181818',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#262626',
    alignItems: 'center',
  },
  medalCardLocked: {
    opacity: 0.45,
    borderColor: '#202020',
  },
  medalIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#242424',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  medalIconLocked: {
    backgroundColor: '#1A1A1A',
  },
  medalEmoji: {
    fontSize: 22,
  },
  medalTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  medalTitleLocked: {
    color: '#888',
  },
  medalDesc: {
    color: '#777',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 15,
  },
  medalStatusBadge: {
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#222',
  },
  medalStatusText: {
    color: '#666',
    fontSize: 10,
    fontWeight: '600',
  },
  medalStatusUnlocked: {
    color: '#4CAF50',
  },
});