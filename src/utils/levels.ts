export interface UserLevelInfo {
  levelNumber: number;
  title: string;
  badgeColor: string;
  nextMilestone: string;
  progressPercent: number; // 0 a 100
}

export function calculateUserLevel(
  visits: number,
  crowns: number,
  completedCircuitsCount: number = 0
): UserLevelInfo {
  // NÍVEL 4: MASTER COFFEE LOVER (O topo: 3+ coroas OU 20+ visitas)
  if (crowns >= 3 || visits >= 20) {
    return {
      levelNumber: 4,
      title: 'Master Coffee Lover',
      badgeColor: '#FC4C02', // Laranja Strava oficial
      nextMilestone: 'Status Máximo conquistado! Você zerou o Club de Campinas.',
      progressPercent: 100,
    };
  }

  // NÍVEL 3: REI DA CASA (1+ coroa ativa OU 12+ visitas)
  if (crowns >= 1 || visits >= 12) {
    const visitsNeeded = Math.max(1, 20 - visits);
    const crownsNeeded = Math.max(1, 3 - crowns);
    const progress = Math.min(100, Math.round(((visits - 12) / 8) * 100));
    return {
      levelNumber: 3,
      title: 'Rei da Casa',
      badgeColor: '#F59E0B', // Dourado Metálico
      nextMilestone: `Conquiste mais ${crownsNeeded} coroa(s) ou ${visitsNeeded} visita(s) para virar Master Coffee Lover`,
      progressPercent: Math.max(15, progress),
    };
  }

  // NÍVEL 2: COFFEE HUNTER (5+ visitas OU 1+ circuito completado)
  if (visits >= 5 || completedCircuitsCount >= 1) {
    const visitsNeeded = Math.max(1, 12 - visits);
    const progress = Math.min(100, Math.round(((visits - 5) / 7) * 100));
    return {
      levelNumber: 2,
      title: 'Coffee Hunter',
      badgeColor: '#10B981', // Verde Esmeralda
      nextMilestone: `Conquiste 1 Reinado no mapa ou mais ${visitsNeeded} visita(s) para virar Rei da Casa`,
      progressPercent: Math.max(20, progress),
    };
  }

  // NÍVEL 1: CAFEZEIRO DE PISTA (Iniciante)
  const visitsNeeded = Math.max(1, 5 - visits);
  const progress = Math.min(100, Math.round((visits / 5) * 100));
  return {
    levelNumber: 1,
    title: 'Cafezeiro de Pista',
    badgeColor: '#A1A1AA', // Cinza Claro
    nextMilestone: `Faltam ${visitsNeeded} visita(s) a cafés para subir para Coffee Hunter`,
    progressPercent: Math.max(10, progress),
  };
}