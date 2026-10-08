import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

interface ProfileTabProps {
  userName: string;
  userAvatar: string;
  userKm: number;
  userVisits: number;
  userCrowns: number;
  userMedals: string[];
}

export const ProfileTab: React.FC<ProfileTabProps> = ({
  userName,
  userAvatar,
  userKm,
  userVisits,
  userCrowns,
  userMedals,
}) => {
  return (
    <ScrollView style={styles.tabContainer} contentContainerStyle={{ padding: 16 }}>
      <View style={styles.profileHeaderCard}>
        <View style={styles.profileAvatarBox}>
          <Text style={{ fontSize: 44 }}>{userAvatar}</Text>
        </View>
        <Text style={styles.profileName}>{userName}</Text>
        <Text style={styles.profileLocation}>Campinas / SP • Nível 1 Club</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{userKm} km</Text>
          <Text style={styles.statLabel}>Distância</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{userVisits}</Text>
          <Text style={styles.statLabel}>Visitas</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{userCrowns}</Text>
          <Text style={styles.statLabel}>Reinados 👑</Text>
        </View>
      </View>

      {/* Conquistas e Medalhas */}
      <Text style={styles.sectionHeading}>🏅 Medalhas & Conquistas</Text>
      <View style={styles.medalsContainer}>
        {userMedals.map((m, idx) => (
          <View key={idx} style={[styles.medalPill, { borderColor: '#D97706' }]}>
            <Text style={[styles.medalPillText, { color: '#F59E0B', fontWeight: 'bold' }]}>
              {m}
            </Text>
          </View>
        ))}
        {!userMedals.includes('🏅 Medalha Centro Histórico') && (
          <View style={[styles.medalPill, { opacity: 0.4 }]}>
            <Text style={styles.medalPillText}>🔒 Circuito Centro</Text>
          </View>
        )}
        {!userMedals.includes('👑 Coroa do Cambuí') && (
          <View style={[styles.medalPill, { opacity: 0.4 }]}>
            <Text style={styles.medalPillText}>🔒 Circuito Cambuí</Text>
          </View>
        )}
      </View>
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
  profileHeaderCard: {
    alignItems: 'center',
    backgroundColor: '#292524',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
  },
  profileAvatarBox: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#1C1917',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#D97706',
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  profileLocation: {
    fontSize: 13,
    color: '#A8A29E',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#292524',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F59E0B',
  },
  statLabel: {
    fontSize: 11,
    color: '#A8A29E',
    marginTop: 4,
  },
  medalsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  medalPill: {
    backgroundColor: '#292524',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#44403C',
  },
  medalPillText: {
    color: '#FFF',
    fontSize: 13,
  },
});