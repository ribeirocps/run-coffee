import { Feather, Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Circuit } from '../types';
import { calculateUserLevel } from '../utils/levels';

interface ProfileTabProps {
  userName: string;
  userAvatar: string;
  userKm: number;
  userVisits: number;
  userCrowns: number;
  userMedals: string[];
  circuits?: Circuit[];
  onOpenEditProfile: () => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({
  userName,
  userAvatar,
  userKm,
  userVisits,
  userCrowns,
  userMedals,
  circuits = [],
  onOpenEditProfile,
}) => {
  const completedCircuitsCount = circuits.filter((c) => c.completed).length;
  const levelInfo = calculateUserLevel(userVisits, userCrowns, completedCircuitsCount);
  const isPhoto = userAvatar.startsWith('file://') || userAvatar.startsWith('http');

  return (
    <ScrollView style={styles.tabContainer} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {/* CARD DO PERFIL DO ATLETA */}
      <View style={styles.profileHeaderCard}>
        {/* Avatar com atalho de toque para trocar foto */}
        <TouchableOpacity
          style={styles.avatarWrapper}
          activeOpacity={0.8}
          onPress={onOpenEditProfile}
        >
          <View style={[styles.profileAvatarBox, { borderColor: levelInfo.badgeColor }]}>
            {isPhoto ? (
              <Image source={{ uri: userAvatar }} style={styles.profileAvatarImage} />
            ) : (
              <Text style={{ fontSize: 38 }}>{userAvatar}</Text>
            )}
          </View>
          <View style={styles.cameraBadge}>
            <Feather name="camera" size={12} color="#FFF" />
          </View>
        </TouchableOpacity>

        <Text style={styles.profileName}>{userName}</Text>
        <Text style={styles.profileLocation}>Campinas / SP • Club Urbano</Text>

        {/* BOTÃO EDITAR PERFIL */}
        <TouchableOpacity style={styles.editProfileBtn} onPress={onOpenEditProfile}>
          <Feather name="edit-2" size={13} color="#A1A1AA" style={{ marginRight: 6 }} />
          <Text style={styles.editProfileBtnText}>Editar Perfil</Text>
        </TouchableOpacity>

        {/* BADGE DE NÍVEL / STATUS (COFFEE LOVER) */}
        <View style={[styles.levelPill, { borderColor: levelInfo.badgeColor }]}>
          <Ionicons
            name={levelInfo.levelNumber === 4 ? 'ribbon' : levelInfo.levelNumber === 3 ? 'trophy' : 'compass'}
            size={14}
            color={levelInfo.badgeColor}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.levelPillText, { color: levelInfo.badgeColor }]}>
            {levelInfo.title}
          </Text>
        </View>

        {/* BARRA DE PROGRESSO DO NÍVEL */}
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressBar,
                { width: `${levelInfo.progressPercent}%`, backgroundColor: levelInfo.badgeColor },
              ]}
            />
          </View>
          <Text style={styles.progressMilestoneText}>{levelInfo.nextMilestone}</Text>
        </View>
      </View>

      {/* MÉTRICAS EM NÚMEROS DE IMPACTO */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{userKm}</Text>
          <Text style={styles.statUnit}>KM</Text>
          <Text style={styles.statLabel}>Distância</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{userVisits}</Text>
          <Text style={styles.statUnit}>CHECK-INS</Text>
          <Text style={styles.statLabel}>Cafeterias</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: '#F59E0B' }]}>{userCrowns}</Text>
          <Text style={styles.statUnit}>REINADOS</Text>
          <Text style={styles.statLabel}>Títulos</Text>
        </View>
      </View>

      {/* ESTANTE DE MEDALHAS & CONQUISTAS */}
      <Text style={styles.sectionHeading}>MEDALHAS E CONQUISTAS</Text>
      <View style={styles.medalsContainer}>
        {userMedals.map((m, idx) => (
          <View key={idx} style={styles.medalPillActive}>
            <Feather name="award" size={15} color="#F59E0B" style={{ marginRight: 6 }} />
            <Text style={styles.medalPillTextActive}>{m}</Text>
          </View>
        ))}
        {!userMedals.includes('🏅 Medalha Centro Histórico') && (
          <View style={styles.medalPillLocked}>
            <Feather name="lock" size={13} color="#52525B" style={{ marginRight: 6 }} />
            <Text style={styles.medalPillTextLocked}>Circuito Centro</Text>
          </View>
        )}
        {!userMedals.includes('👑 Coroa do Cambuí') && (
          <View style={styles.medalPillLocked}>
            <Feather name="lock" size={13} color="#52525B" style={{ marginRight: 6 }} />
            <Text style={styles.medalPillTextLocked}>Circuito Cambuí</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  profileHeaderCard: {
    alignItems: 'center',
    backgroundColor: '#18181B',
    borderRadius: 22,
    padding: 22,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  profileAvatarBox: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: '#27272A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    overflow: 'hidden',
  },
  profileAvatarImage: {
    width: '100%',
    height: '100%',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FC4C02',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#18181B',
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  profileLocation: {
    fontSize: 12,
    color: '#71717A',
    marginTop: 2,
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#27272A',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#3F3F46',
  },
  editProfileBtnText: {
    color: '#D4D4D8',
    fontSize: 12,
    fontWeight: '700',
  },
  levelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  levelPillText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  progressContainer: {
    width: '100%',
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#27272A',
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#27272A',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  progressMilestoneText: {
    fontSize: 11,
    color: '#A1A1AA',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#18181B',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#27272A',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFF',
  },
  statUnit: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FC4C02',
    letterSpacing: 0.5,
    marginTop: 1,
  },
  statLabel: {
    fontSize: 11,
    color: '#71717A',
    marginTop: 4,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#71717A',
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  medalsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  medalPillActive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181B',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D97706',
  },
  medalPillTextActive: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: 'bold',
  },
  medalPillLocked: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181B',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#27272A',
    opacity: 0.6,
  },
  medalPillTextLocked: {
    color: '#71717A',
    fontSize: 12,
  },
});