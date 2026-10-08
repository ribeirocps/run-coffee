import { Feather, Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Circuit } from '../types';

interface CircuitsTabProps {
  circuits: Circuit[];
  onNavigateToMap: () => void;
}

export const CircuitsTab: React.FC<CircuitsTabProps> = ({ circuits, onNavigateToMap }) => {
  return (
    <ScrollView style={styles.tabContainer} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {/* CABEÇALHO DA ABA */}
      <View style={styles.headerSection}>
        <Text style={styles.sectionCategory}>CIRCUITOS URBANOS</Text>
        <Text style={styles.sectionMainTitle}>Desafios de Campinas</Text>
        <Text style={styles.sectionSubtitle}>
          Complete os trajetos a pé, faça check-in nos cafés credenciados e conquiste medalhas exclusivas para o seu perfil.
        </Text>
      </View>

      {/* CARDS DE CADA CIRCUITO */}
      {circuits.map((c) => {
        const completedCount = c.visitedCafes.length;
        const totalCount = c.cafes.length;
        const progressPercent = Math.round((completedCount / totalCount) * 100);

        return (
          <View key={c.id} style={styles.circuitCard}>
            {/* Topo do Card com Badge e Distância */}
            <View style={styles.circuitTopRow}>
              <View style={styles.challengeBadge}>
                <Ionicons name="flame" size={12} color="#FC4C02" style={{ marginRight: 4 }} />
                <Text style={styles.challengeBadgeText}>DESAFIO OFICIAL</Text>
              </View>

              <View style={styles.distanceBadge}>
                <Feather name="navigation" size={11} color="#A1A1AA" style={{ marginRight: 4 }} />
                <Text style={styles.distanceBadgeText}>{c.distance}</Text>
              </View>
            </View>

            {/* Título e Descrição */}
            <Text style={styles.circuitTitle}>{c.title}</Text>
            <Text style={styles.circuitDesc}>{c.description}</Text>

            {/* BARRA DE PROGRESSO DO CIRCUITO */}
            <View style={styles.progressBarWrapper}>
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${progressPercent}%`,
                      backgroundColor: c.completed ? '#10B981' : '#FC4C02',
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressStatusText}>
                {c.completed ? 'COMPLETO 🏆' : `${completedCount} de ${totalCount} cafeterias`}
              </Text>
            </View>

            {/* TIMELINE DE CHECKPOINTS (LINHA VERTICAL ESTILO STRAVA) */}
            <View style={styles.stepperContainer}>
              {c.cafes.map((cafeName, i) => {
                const isVisited = c.visitedCafes.some(
                  (v) => v.toLowerCase() === cafeName.toLowerCase() || v.includes(cafeName)
                );
                const isLast = i === c.cafes.length - 1;

                return (
                  <View key={i} style={styles.stepperItem}>
                    {/* Linha e Ponto da Timeline */}
                    <View style={styles.stepperTrackCol}>
                      <View
                        style={[
                          styles.stepperDot,
                          isVisited && styles.stepperDotCompleted,
                        ]}
                      >
                        {isVisited ? (
                          <Feather name="check" size={10} color="#FFF" />
                        ) : (
                          <View style={styles.stepperDotInner} />
                        )}
                      </View>
                      {!isLast && (
                        <View
                          style={[
                            styles.stepperConnectingLine,
                            isVisited && styles.stepperConnectingLineCompleted,
                          ]}
                        />
                      )}
                    </View>

                    {/* Informações da Etapa */}
                    <View style={styles.stepperContent}>
                      <Text
                        style={[
                          styles.stepperCafeName,
                          isVisited && styles.stepperCafeNameCompleted,
                        ]}
                      >
                        {cafeName}
                      </Text>
                      <Text style={styles.stepperStepSubtitle}>
                        {isVisited ? 'Check-in confirmado ✓' : `Etapa ${i + 1} do percurso`}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* CAIXA DE RECOMPENSA (MEDALHA) */}
            <View style={styles.rewardBox}>
              <View style={styles.rewardIconBox}>
                <Ionicons name="trophy" size={16} color="#F59E0B" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rewardLabel}>RECOMPENSA DE ATLETA</Text>
                <Text style={styles.rewardTitle}>{c.badgeAwarded}</Text>
              </View>
            </View>

            {/* BOTÃO DE AÇÃO */}
            <TouchableOpacity
              style={[
                styles.actionButton,
                c.completed && styles.actionButtonCompleted,
              ]}
              onPress={() => {
                if (c.completed) {
                  Alert.alert('Circuito Concluído! 🏆', 'Você já finalizou todas as paradas e ganhou a medalha!');
                } else {
                  Alert.alert('Circuito Selecionado! 🏃‍♂️', 'Abrindo o mapa para você iniciar a rota pelo primeiro checkpoint.');
                  onNavigateToMap();
                }
              }}
            >
              <Feather
                name={c.completed ? 'award' : 'map'}
                size={16}
                color="#FFF"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.actionButtonText}>
                {c.completed ? 'Medalha Conquistada' : 'Explorar Rota no Mapa'}
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
    backgroundColor: '#0D0D0D',
  },
  headerSection: {
    marginBottom: 20,
    marginTop: 6,
  },
  sectionCategory: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FC4C02',
    letterSpacing: 1.2,
  },
  sectionMainTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFF',
    marginTop: 4,
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#A1A1AA',
    lineHeight: 18,
  },

  // CARD DO CIRCUITO
  circuitCard: {
    backgroundColor: '#18181B',
    borderRadius: 22,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  circuitTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  challengeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(252, 76, 2, 0.12)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(252, 76, 2, 0.25)',
  },
  challengeBadgeText: {
    color: '#FC4C02',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#27272A',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  distanceBadgeText: {
    color: '#E4E4E7',
    fontSize: 11,
    fontWeight: '700',
  },
  circuitTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 6,
  },
  circuitDesc: {
    fontSize: 13,
    color: '#A1A1AA',
    lineHeight: 18,
    marginBottom: 14,
  },

  // BARRA DE PROGRESSO
  progressBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#27272A',
  },
  progressBarTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#27272A',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#71717A',
  },

  // STEPPER TIMELINE
  stepperContainer: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  stepperItem: {
    flexDirection: 'row',
    minHeight: 46,
  },
  stepperTrackCol: {
    width: 24,
    alignItems: 'center',
  },
  stepperDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#27272A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3F3F46',
    zIndex: 2,
  },
  stepperDotCompleted: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  stepperDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#71717A',
  },
  stepperConnectingLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#27272A',
    marginVertical: 2,
  },
  stepperConnectingLineCompleted: {
    backgroundColor: '#10B981',
  },
  stepperContent: {
    flex: 1,
    marginLeft: 12,
    paddingBottom: 10,
  },
  stepperCafeName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#E4E4E7',
  },
  stepperCafeNameCompleted: {
    color: '#10B981',
  },
  stepperStepSubtitle: {
    fontSize: 11,
    color: '#71717A',
    marginTop: 2,
  },

  // RECOMPENSA
  rewardBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderRadius: 14,
    padding: 12,
    gap: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  rewardIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rewardLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: '#F59E0B',
    letterSpacing: 0.8,
  },
  rewardTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 2,
  },

  // BOTÃO DO CIRCUITO
  actionButton: {
    backgroundColor: '#FC4C02',
    paddingVertical: 12,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonCompleted: {
    backgroundColor: '#10B981',
  },
  actionButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});