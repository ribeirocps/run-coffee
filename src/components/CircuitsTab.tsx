import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Circuit } from '../types';

interface CircuitsTabProps {
  circuits?: Circuit[] | any;
  userCheckIns?: string[] | any;
  onSelectCafeFromCircuit?: (cafeId: string) => void;
  [key: string]: any;
}

const TOP_SAFE_PADDING =
  Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 16 : 52;

export const CircuitsTab: React.FC<CircuitsTabProps> = ({
  circuits = [],
  userCheckIns = [],
  onSelectCafeFromCircuit,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'todos' | 'cambui' | 'barao' | 'taquaral'>('todos');

  const circuitsList: Circuit[] = Array.isArray(circuits) ? circuits : [];
  const checkInsList: string[] = Array.isArray(userCheckIns) ? userCheckIns : [];

  const filteredCircuits = circuitsList.filter((circuit) => {
    const title = (circuit.title || circuit.name || '').toLowerCase();
    const region = (circuit.region || '').toLowerCase();
    if (selectedFilter === 'todos') return true;
    if (selectedFilter === 'cambui') return region.includes('cambu') || title.includes('cambu');
    if (selectedFilter === 'barao') return region.includes('bar') || title.includes('bar');
    if (selectedFilter === 'taquaral') return region.includes('taquaral') || title.includes('taquaral');
    return true;
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.badgeRow}>
          <View style={styles.clubBadge}>
            <Feather name="award" size={13} color="#FF6B00" />
            <Text style={styles.clubBadgeText}>CLUBE RUNCOFFEE</Text>
          </View>
        </View>
        <Text style={styles.title}>Circuitos Urbanos</Text>
        <Text style={styles.subtitle}>Desafios e rotas de café em Campinas</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
          <TouchableOpacity
            style={[styles.filterChip, selectedFilter === 'todos' && styles.filterChipActive]}
            onPress={() => setSelectedFilter('todos')}
          >
            <Text style={[styles.filterChipText, selectedFilter === 'todos' && styles.filterChipTextActive]}>
              Todos ({circuitsList.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, selectedFilter === 'cambui' && styles.filterChipActive]}
            onPress={() => setSelectedFilter('cambui')}
          >
            <Text style={[styles.filterChipText, selectedFilter === 'cambui' && styles.filterChipTextActive]}>
              Cambuí
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, selectedFilter === 'taquaral' && styles.filterChipActive]}
            onPress={() => setSelectedFilter('taquaral')}
          >
            <Text style={[styles.filterChipText, selectedFilter === 'taquaral' && styles.filterChipTextActive]}>
              Taquaral
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, selectedFilter === 'barao' && styles.filterChipActive]}
            onPress={() => setSelectedFilter('barao')}
          >
            <Text style={[styles.filterChipText, selectedFilter === 'barao' && styles.filterChipTextActive]}>
              Barão Geraldo
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {filteredCircuits.map((circuit) => {
          const rawCafes = Array.isArray(circuit.cafes) ? circuit.cafes : [];
          const visitedCount = rawCafes.filter((cafeItem: any) => {
            const cId = typeof cafeItem === 'string' ? cafeItem : cafeItem?.id;
            return checkInsList.includes(cId);
          }).length;

          const totalCount = rawCafes.length;
          const progressPercent = totalCount > 0 ? (visitedCount / totalCount) * 100 : 0;
          const isCompleted = visitedCount === totalCount && totalCount > 0;
          const distanceLabel = circuit.totalDistanceKm || circuit.distanceKm || circuit.distance || '4.0';
          const pointsLabel = circuit.rewardPoints || circuit.points || '150';

          return (
            <View key={circuit.id} style={styles.circuitCard}>
              <View style={styles.circuitHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.circuitTitle}>{circuit.title || circuit.name}</Text>
                  <Text style={styles.circuitDesc}>{circuit.description}</Text>
                </View>
                <View style={styles.badgeContainer}>
                  <Text style={styles.badgeIcon}>{circuit.badgeIcon || circuit.badge || '☕'}</Text>
                </View>
              </View>

              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Feather name="navigation" size={14} color="#FF6B00" />
                  <Text style={styles.metaText}>{distanceLabel} km</Text>
                </View>
                <View style={styles.metaItem}>
                  <Feather name="map-pin" size={14} color="#888" />
                  <Text style={styles.metaText}>{totalCount} paradas</Text>
                </View>
                <View style={styles.metaItem}>
                  <Feather name="zap" size={14} color="#FFD700" />
                  <Text style={styles.metaText}>+{pointsLabel} pts</Text>
                </View>
              </View>

              <View style={styles.progressContainer}>
                <View style={styles.progressLabelRow}>
                  <Text style={styles.progressLabel}>
                    {isCompleted ? '🎉 Circuito Concluído!' : `${visitedCount} de ${totalCount} cafeterias`}
                  </Text>
                  <Text style={styles.progressPercent}>{Math.round(progressPercent)}%</Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${progressPercent}%` },
                      isCompleted && { backgroundColor: '#4CAF50' },
                    ]}
                  />
                </View>
              </View>

              <View style={styles.stepperContainer}>
                {rawCafes.map((cafeItem: any, index: number) => {
                  const cafeId = typeof cafeItem === 'string' ? cafeItem : cafeItem?.id;
                  const cafeName = typeof cafeItem === 'string' ? cafeItem : cafeItem?.name || 'Cafeteria';
                  const cafeAddress = typeof cafeItem === 'string' ? 'Campinas/SP' : cafeItem?.address || 'Campinas/SP';
                  const isVisited = checkInsList.includes(cafeId);
                  const isLast = index === rawCafes.length - 1;

                  return (
                    <TouchableOpacity
                      key={`cafe-step-${index}`}
                      style={styles.stepRow}
                      activeOpacity={0.7}
                      onPress={() => onSelectCafeFromCircuit && cafeId && onSelectCafeFromCircuit(cafeId)}
                    >
                      <View style={styles.stepIndicatorCol}>
                        <View style={[styles.stepCircle, isVisited && styles.stepCircleVisited]}>
                          {isVisited ? (
                            <Feather name="check" size={12} color="#FFF" />
                          ) : (
                            <Text style={styles.stepNumber}>{index + 1}</Text>
                          )}
                        </View>
                        {!isLast && <View style={[styles.stepLine, isVisited && styles.stepLineVisited]} />}
                      </View>

                      <View style={styles.stepInfo}>
                        <Text style={[styles.stepCafeName, isVisited && styles.stepCafeVisited]}>
                          {cafeName}
                        </Text>
                        <Text style={styles.stepCafeAddress} numberOfLines={1}>
                          {cafeAddress}
                        </Text>
                      </View>

                      <Feather name="chevron-right" size={16} color="#444" />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })}
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
    paddingBottom: 14,
    backgroundColor: '#141414',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 6,
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
    fontSize: 14,
    color: '#999',
    marginTop: 2,
    marginBottom: 12,
  },
  filterBar: {
    flexDirection: 'row',
    marginTop: 4,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#202020',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#303030',
  },
  filterChipActive: {
    backgroundColor: '#FF6B00',
    borderColor: '#FF6B00',
  },
  filterChipText: {
    color: '#AAA',
    fontSize: 13,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 110,
  },
  circuitCard: {
    backgroundColor: '#181818',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#262626',
  },
  circuitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  circuitTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  circuitDesc: {
    fontSize: 13,
    color: '#8E8E8E',
    lineHeight: 18,
  },
  badgeContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#262626',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  badgeIcon: {
    fontSize: 22,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#242424',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: '#CCC',
    fontWeight: '500',
  },
  progressContainer: {
    marginTop: 12,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 12,
    color: '#AAA',
    fontWeight: '600',
  },
  progressPercent: {
    fontSize: 12,
    color: '#FF6B00',
    fontWeight: '700',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#2A2A2A',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FF6B00',
    borderRadius: 3,
  },
  stepperContainer: {
    marginTop: 16,
    paddingTop: 8,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  stepIndicatorCol: {
    alignItems: 'center',
    width: 28,
    marginRight: 10,
  },
  stepCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#262626',
    borderWidth: 1.5,
    borderColor: '#555',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleVisited: {
    backgroundColor: '#FF6B00',
    borderColor: '#FF6B00',
  },
  stepNumber: {
    fontSize: 10,
    color: '#AAA',
    fontWeight: '700',
  },
  stepLine: {
    width: 2,
    height: 24,
    backgroundColor: '#2D2D2D',
    marginTop: 2,
  },
  stepLineVisited: {
    backgroundColor: '#FF6B00',
  },
  stepInfo: {
    flex: 1,
  },
  stepCafeName: {
    fontSize: 14,
    color: '#EEE',
    fontWeight: '600',
  },
  stepCafeVisited: {
    color: '#FFF',
    fontWeight: '700',
  },
  stepCafeAddress: {
    fontSize: 12,
    color: '#666',
    marginTop: 1,
  },
});