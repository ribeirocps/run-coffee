import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Circuit } from '../types';

interface CircuitsTabProps {
  circuits: Circuit[];
  onNavigateToMap: () => void;
}

export const CircuitsTab: React.FC<CircuitsTabProps> = ({ circuits, onNavigateToMap }) => {
  return (
    <ScrollView style={styles.tabContainer} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.sectionHeading}>🏃 Circuitos de Cafeterias</Text>
      <Text style={styles.sectionSubheading}>
        Complete as rotas a pé, visite os checkpoints e desbloqueie medalhas exclusivas para o seu perfil.
      </Text>

      {circuits.map((c) => {
        const completedCount = c.visitedCafes.length;
        return (
          <View key={c.id} style={styles.circuitCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.circuitTitle}>{c.title}</Text>
              <Text style={styles.circuitPill}>
                {c.completed ? 'COMPLETO 🏆' : `${completedCount}/${c.cafes.length}`}
              </Text>
            </View>
            <Text style={styles.circuitDesc}>{c.description}</Text>

            {/* Checkpoints com Status Real */}
            <View style={styles.checkpointContainer}>
              {c.cafes.map((cafeName, i) => {
                const isVisited = c.visitedCafes.some(
                  (v) => v.toLowerCase() === cafeName.toLowerCase() || v.includes(cafeName)
                );
                return (
                  <View key={i} style={styles.checkpointItem}>
                    <Text style={{ color: isVisited ? '#10B981' : '#78716C', fontSize: 14 }}>
                      {isVisited ? '✅' : '⚪'} {cafeName}
                    </Text>
                  </View>
                );
              })}
            </View>

            <View style={styles.circuitRewardBox}>
              <Text style={{ color: '#D97706', fontWeight: 'bold' }}>
                Recompensa: {c.badgeAwarded}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.startCircuitBtn,
                c.completed && { backgroundColor: '#10B981' },
              ]}
              onPress={() => {
                if (c.completed) {
                  Alert.alert('Circuito Concluído! 🏆', 'Você já finalizou todas as paradas e ganhou a medalha!');
                } else {
                  Alert.alert('Circuito Ativo! 🏃‍♂️', 'Visite os checkpoints restantes pelo mapa para completar.');
                  onNavigateToMap();
                }
              }}
            >
              <Text style={styles.startCircuitBtnText}>
                {c.completed ? '✓ Concluído com Sucesso' : 'Explorar Rota no Mapa'}
              </Text>
            </TouchableOpacity>
          </View>
        );
      })}
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
  sectionSubheading: {
    fontSize: 13,
    color: '#A8A29E',
    marginBottom: 16,
    lineHeight: 18,
  },
  circuitCard: {
    backgroundColor: '#292524',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  circuitTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  circuitPill: {
    backgroundColor: 'rgba(234, 88, 12, 0.2)',
    color: '#EA580C',
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  circuitDesc: {
    fontSize: 13,
    color: '#A8A29E',
    marginVertical: 8,
  },
  checkpointContainer: {
    marginVertical: 6,
    gap: 6,
  },
  checkpointItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  circuitRewardBox: {
    backgroundColor: 'rgba(217, 119, 6, 0.15)',
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 12,
  },
  startCircuitBtn: {
    backgroundColor: '#D97706',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  startCircuitBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});