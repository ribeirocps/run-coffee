import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';

// Importações dos novos módulos criados
import {
  INITIAL_CAFES,
  INITIAL_CIRCUITS,
  INITIAL_POSTS,
  NEIGHBORHOOD_CENTERS,
  STORAGE_CIRCUITS_KEY,
  STORAGE_POSTS_KEY,
  STORAGE_PROFILE_KEY,
} from '../data/initialData';
import { Cafe, Circuit, CommunityPost } from '../types';
import { getDistanceInMeters } from '../utils/geo';

import { CircuitsTab } from '../components/CircuitsTab';
import { CommunityTab } from '../components/CommunityTab';
import { ProfileTab } from '../components/ProfileTab';

export default function RunCoffeeApp() {
  const [activeTab, setActiveTab] = useState<'mapa' | 'circuitos' | 'comunidade' | 'perfil'>('mapa');

  // Perfil e Estatísticas
  const [userName, setUserName] = useState('Corredor Urbano');
  const [userAvatar, setUserAvatar] = useState('🏃');
  const [userVisits, setUserVisits] = useState(4);
  const [userKm, setUserKm] = useState(24.5);
  const [userCrowns, setUserCrowns] = useState(1);
  const [userMedals, setUserMedals] = useState<string[]>(['🏅 Primeiro 5k']);

  // Cafés e Localização
  const [cafes, setCafes] = useState<Cafe[]>(INITIAL_CAFES);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('Todos');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedCafe, setSelectedCafe] = useState<Cafe | null>(null);
  const [activeRoute, setActiveRoute] = useState<{ cafe: Cafe; distanceKm: number; durationMin: number } | null>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const targetCafeRef = useRef<Cafe | null>(null);

  // Modais de Gamificação
  const [isTakeoverModalVisible, setIsTakeoverModalVisible] = useState(false);
  const [newReinadoInfo, setNewReinadoInfo] = useState<{ cafeName: string; visits: number } | null>(null);
  const [isPerkModalVisible, setIsPerkModalVisible] = useState(false);
  const [perkTimer, setPerkTimer] = useState(90);

  // Modal de Indicação
  const [isNominateModalVisible, setIsNominateModalVisible] = useState(false);
  const [nominateName, setNominateName] = useState('');
  const [nominateAddress, setNominateAddress] = useState('');
  const [nominateInstagram, setNominateInstagram] = useState('');
  const [nominatePerk, setNominatePerk] = useState('');

  // Circuitos e Comunidade
  const [circuits, setCircuits] = useState<Circuit[]>(INITIAL_CIRCUITS);
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>(INITIAL_POSTS);
  const [isRunClubJoined, setIsRunClubJoined] = useState(false);

  // Postar no Feed
  const [isPostModalVisible, setIsPostModalVisible] = useState(false);
  const [postText, setPostText] = useState('');
  const [postCafe, setPostCafe] = useState('');
  const [postPhoto, setPostPhoto] = useState<string | null>(null);

  const webViewRef = useRef<WebView>(null);

  // 1. Carregar Dados Persistidos
  useEffect(() => {
    (async () => {
      try {
        const storedPosts = await AsyncStorage.getItem(STORAGE_POSTS_KEY);
        if (storedPosts) {
          const parsed = JSON.parse(storedPosts);
          if (Array.isArray(parsed) && parsed.length > 0) setCommunityPosts(parsed);
        }

        const storedCircuits = await AsyncStorage.getItem(STORAGE_CIRCUITS_KEY);
        if (storedCircuits) {
          setCircuits(JSON.parse(storedCircuits));
        }

        const storedProfile = await AsyncStorage.getItem(STORAGE_PROFILE_KEY);
        if (storedProfile) {
          const prof = JSON.parse(storedProfile);
          if (prof.visits !== undefined) setUserVisits(prof.visits);
          if (prof.km !== undefined) setUserKm(prof.km);
          if (prof.crowns !== undefined) setUserCrowns(prof.crowns);
          if (prof.medals) setUserMedals(prof.medals);
        }
      } catch (e) {
        console.log('Erro ao carregar dados locais:', e);
      }
    })();
  }, []);

  // Salvar Dados
  const saveProfileData = async (visits: number, km: number, crowns: number, medals: string[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify({ visits, km, crowns, medals }));
    } catch (e) {}
  };

  const savePostsToStorage = async (newPostsList: CommunityPost[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_POSTS_KEY, JSON.stringify(newPostsList));
    } catch (e) {}
  };

  const saveCircuitsToStorage = async (newCircuitsList: Circuit[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_CIRCUITS_KEY, JSON.stringify(newCircuitsList));
    } catch (e) {}
  };

  // 2. GPS do Usuário
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          setUserLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
        } else {
          setUserLocation({ lat: -22.9020, lng: -47.0540 });
        }
      } catch {
        setUserLocation({ lat: -22.9020, lng: -47.0540 });
      }
    })();
  }, []);

  // 3. Timer do Cupom de 90s
  useEffect(() => {
    let interval: any = null;
    if (isPerkModalVisible && perkTimer > 0) {
      interval = setInterval(() => setPerkTimer((prev) => prev - 1), 1000);
    } else if (perkTimer === 0) {
      setIsPerkModalVisible(false);
      Alert.alert('Tempo esgotado', 'O cupom de 90 segundos expirou!');
    }
    return () => clearInterval(interval);
  }, [isPerkModalVisible, perkTimer]);

  // Filtragem de Cafeterias por Bairro
  const filteredCafes =
    selectedNeighborhood === 'Todos'
      ? cafes
      : cafes.filter(
          (c) =>
            (c.neighborhood && c.neighborhood.toLowerCase() === selectedNeighborhood.toLowerCase()) ||
            c.address.toLowerCase().includes(selectedNeighborhood.toLowerCase())
        );

  const handleSelectNeighborhood = (bairro: string) => {
    setSelectedNeighborhood(bairro);
    setSelectedCafe(null);
    const target = NEIGHBORHOOD_CENTERS[bairro] || NEIGHBORHOOD_CENTERS.Todos;
    webViewRef.current?.injectJavaScript(`
      if (window.centerMapWithZoom) {
        window.centerMapWithZoom(${target.lat}, ${target.lng}, ${target.zoom});
      }
      true;
    `);
  };

  // Check-in com Geofence e Anti-trapaça
  const handleCheckInAttempt = async (cafe: Cafe) => {
    let distanceMeters = 0;
    if (userLocation) {
      distanceMeters = getDistanceInMeters(userLocation.lat, userLocation.lng, cafe.lat, cafe.lng);
    }

    if (distanceMeters > 150) {
      Alert.alert(
        'Validação de Distância 📍',
        `Você está a ${distanceMeters}m de ${cafe.name}.\n\nO raio oficial de presença é de até 150m. Deseja realizar o check-in no Modo de Teste?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Validar Check-in', onPress: () => processCheckIn(cafe) },
        ]
      );
    } else {
      processCheckIn(cafe);
    }
  };

  const processCheckIn = async (cafe: Cafe) => {
    let isSpeeding = false;
    try {
      const curLoc = await Location.getCurrentPositionAsync({});
      if (curLoc.coords.speed !== null && curLoc.coords.speed !== undefined) {
        const speedKmH = curLoc.coords.speed * 3.6;
        if (speedKmH > 20) isSpeeding = true;
      }
    } catch {}

    const visitsEarned = isSpeeding ? 1 : 2;
    const nextVisits = userVisits + visitsEarned;
    const nextKm = Number((userKm + (cafe.distanceKm || 1.2)).toFixed(1));
    let nextCrowns = userCrowns;

    setUserVisits(nextVisits);
    setUserKm(nextKm);

    if (nextVisits > cafe.kingVisits) {
      nextCrowns += 1;
      setUserCrowns(nextCrowns);
      setCafes((prev) =>
        prev.map((c) =>
          c.id === cafe.id ? { ...c, currentKing: userName, kingVisits: nextVisits } : c
        )
      );
      setNewReinadoInfo({ cafeName: cafe.name, visits: nextVisits });
      setIsTakeoverModalVisible(true);
    }

    saveProfileData(nextVisits, nextKm, nextCrowns, userMedals);
    updateCircuitsProgress(cafe);
    promptPostPhotoForCheckIn(cafe, isSpeeding, visitsEarned);
  };

  const promptPostPhotoForCheckIn = (cafe: Cafe, isSpeeding: boolean, visitsEarned: number) => {
    Alert.alert(
      isSpeeding ? 'Check-in Motorizado! 🚗' : 'Check-in a Pé! 🏃‍♂️',
      `Você ganhou +${visitsEarned} visita(s) em ${cafe.name}!\n\nQuer registrar uma foto do café/treino para publicar no Feed do Club?`,
      [
        { text: 'Publicar sem foto', onPress: () => autoPublishCheckIn(cafe, null) },
        {
          text: '📸 Tirar/Escolher Foto',
          onPress: async () => {
            try {
              const res = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                quality: 0.8,
              });
              if (!res.canceled && res.assets && res.assets.length > 0) {
                autoPublishCheckIn(cafe, res.assets[0].uri);
              } else {
                autoPublishCheckIn(cafe, null);
              }
            } catch {
              autoPublishCheckIn(cafe, null);
            }
          },
        },
      ]
    );
  };

  const autoPublishCheckIn = (cafe: Cafe, photoUri: string | null) => {
    const newPost: CommunityPost = {
      id: String(Date.now()),
      userName,
      avatar: userAvatar,
      timeAgo: 'Agora mesmo',
      cafeName: cafe.name,
      text: `Check-in confirmado em ${cafe.name}! Mais um café especial conquistado no treino. 🏃‍♂️☕`,
      photo: photoUri,
      cheers: 0,
      hasCheered: false,
    };
    const updated = [newPost, ...communityPosts];
    setCommunityPosts(updated);
    savePostsToStorage(updated);
    Alert.alert('Sucesso! 🎉', 'Seu check-in foi publicado no Feed da Comunidade!');
  };

  const updateCircuitsProgress = (cafe: Cafe) => {
    let unlockedMedal: string | null = null;

    const updatedCircuits = circuits.map((circ) => {
      const isCafeInCircuit = circ.cafes.some(
        (cName) => cName.toLowerCase() === cafe.name.toLowerCase() || cafe.name.includes(cName)
      );

      if (isCafeInCircuit && !circ.visitedCafes.includes(cafe.name)) {
        const nextVisited = [...circ.visitedCafes, cafe.name];
        const isNowCompleted = nextVisited.length >= circ.cafes.length;

        if (isNowCompleted && !circ.completed) {
          unlockedMedal = circ.badgeAwarded;
        }

        return {
          ...circ,
          visitedCafes: nextVisited,
          completed: isNowCompleted || circ.completed,
        };
      }
      return circ;
    });

    setCircuits(updatedCircuits);
    saveCircuitsToStorage(updatedCircuits);

    if (unlockedMedal) {
      const nextMedals = userMedals.includes(unlockedMedal) ? userMedals : [...userMedals, unlockedMedal];
      setUserMedals(nextMedals);
      saveProfileData(userVisits, userKm, userCrowns, nextMedals);

      setTimeout(() => {
        Alert.alert(
          '🏆 Circuito Concluído!',
          `Incrível! Você visitou todas as cafeterias do circuito e conquistou: ${unlockedMedal}! A medalha já está brilhando no seu Perfil!`
        );
      }, 800);
    }
  };

  // Rota Pedestre via OSRM Foot API
  const handleStartRoute = async (cafe: Cafe) => {
    if (!userLocation) {
      Alert.alert('GPS não disponível', 'Aguardando sinal de satélite.');
      return;
    }
    setIsCalculatingRoute(true);
    targetCafeRef.current = cafe;

    try {
      const url = `https://router.project-osrm.org/route/v1/foot/${userLocation.lng},${userLocation.lat};${cafe.lng},${cafe.lat}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const coords = route.geometry.coordinates.map((pt: [number, number]) => [pt[1], pt[0]]);
        const distanceKm = Number((route.distance / 1000).toFixed(1));
        const durationMin = Math.round(route.duration / 60);

        setActiveRoute({ cafe, distanceKm, durationMin });
        setSelectedCafe(null);

        webViewRef.current?.injectJavaScript(`
          if (window.drawRoute) {
            window.drawRoute(${JSON.stringify(coords)});
          }
          true;
        `);
      } else {
        Alert.alert('Aviso', 'Não foi possível encontrar uma rota a pé para este café.');
      }
    } catch {
      Alert.alert('Erro', 'Falha ao conectar com o serviço de rotas.');
    } finally {
      setIsCalculatingRoute(false);
    }
  };

  const handleCancelRoute = () => {
    setActiveRoute(null);
    webViewRef.current?.injectJavaScript(`
      if (window.clearRoute) {
        window.clearRoute();
      }
      true;
    `);
  };

  const handlePickPostPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPostPhoto(result.assets[0].uri);
      }
    } catch (e) {}
  };

  const handleCreatePost = () => {
    if (!postText.trim()) {
      Alert.alert('Atenção', 'Escreva uma mensagem sobre seu treino ou café!');
      return;
    }
    const newPost: CommunityPost = {
      id: String(Date.now()),
      userName,
      avatar: userAvatar,
      timeAgo: 'Agora mesmo',
      cafeName: postCafe.trim() || 'Treino Livre',
      text: postText.trim(),
      photo: postPhoto,
      cheers: 0,
      hasCheered: false,
    };
    const updated = [newPost, ...communityPosts];
    setCommunityPosts(updated);
    savePostsToStorage(updated);

    setPostText('');
    setPostCafe('');
    setPostPhoto(null);
    setIsPostModalVisible(false);
    Alert.alert('Publicado! 🎉', 'Seu relato está salvo e visível no feed da comunidade!');
  };

  const handleToggleCheer = (postId: string) => {
    const updated = communityPosts.map((post) => {
      if (post.id === postId) {
        const nextCheered = !post.hasCheered;
        return {
          ...post,
          hasCheered: nextCheered,
          cheers: nextCheered ? post.cheers + 1 : post.cheers - 1,
        };
      }
      return post;
    });
    setCommunityPosts(updated);
    savePostsToStorage(updated);
  };

  const handleSaveNomination = () => {
    if (!nominateName.trim() || !nominateAddress.trim()) {
      Alert.alert('Atenção', 'Informe pelo menos o nome e endereço da cafeteria.');
      return;
    }
    const newCafe: Cafe = {
      id: String(Date.now()),
      name: nominateName.trim(),
      lat: userLocation ? userLocation.lat + 0.003 : -22.9000,
      lng: userLocation ? userLocation.lng + 0.003 : -47.0500,
      address: nominateAddress.trim(),
      neighborhood: 'Cambuí',
      currentKing: 'Disputa Aberta',
      kingVisits: 3,
      perk: nominatePerk.trim() || 'Benefício em análise com o barista',
      distanceKm: 1.2,
      isPartner: false,
    };
    setCafes([newCafe, ...cafes]);
    setIsNominateModalVisible(false);
    setNominateName('');
    setNominateAddress('');
    setNominateInstagram('');
    setNominatePerk('');
    Alert.alert('Café Indicado! ☕', 'Sua indicação foi adicionada ao mapa para validação do Club.');
  };

  // Leaflet HTML com Google Maps Oficial e Marcadores
  const leafletHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          html, body, #map { width: 100%; height: 100%; margin: 0; padding: 0; background: #E5E7EB; }
          .cafe-pill {
            background: #FFFFFF;
            border-radius: 20px;
            padding: 5px 11px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-size: 13px;
            font-weight: 700;
            color: #1C1917;
            box-shadow: 0 4px 14px rgba(0,0,0,0.22);
            border: 2px solid #EA580C;
            display: flex;
            align-items: center;
            gap: 4px;
            white-space: nowrap;
          }
          .cafe-pill.king {
            border-color: #D97706;
            background: #FFFBEB;
          }
          .cafe-pill-tip {
            position: absolute;
            bottom: -6px;
            left: 50%;
            transform: translateX(-50%);
            width: 0; height: 0;
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            border-top: 6px solid #EA580C;
          }
          .cafe-pill.king .cafe-pill-tip {
            border-top-color: #D97706;
          }
          .pulse-marker {
            width: 18px;
            height: 18px;
            background: #EA580C;
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 0 12px rgba(234, 88, 12, 0.7);
            position: relative;
          }
          .pulse-marker::after {
            content: '';
            position: absolute;
            top: -9px;
            left: -9px;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            background: rgba(234, 88, 12, 0.35);
            animation: radar 2s infinite ease-out;
          }
          @keyframes radar {
            0% { transform: scale(0.6); opacity: 1; }
            100% { transform: scale(2.2); opacity: 0; }
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var center = [${userLocation?.lat || -22.9020}, ${userLocation?.lng || -47.0540}];
          var map = L.map('map', { zoomControl: false }).setView(center, 14);

          L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
            maxZoom: 20,
            subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
            attribution: '&copy; Google Maps'
          }).addTo(map);

          var userIcon = L.divIcon({
            className: 'custom-user-icon',
            html: '<div class="pulse-marker"></div>',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          });
          L.marker(center, { icon: userIcon }).addTo(map);

          var cafesData = ${JSON.stringify(filteredCafes)};
          cafesData.forEach(function(cafe) {
            var isKing = cafe.currentKing && cafe.currentKing !== 'Disputa Aberta';
            var crownBadge = isKing ? ' 👑' : '';
            var html = '<div class="cafe-pill ' + (isKing ? 'king' : '') + '">' +
                       '<span>☕ ' + cafe.name.split(' ')[0] + crownBadge + '</span>' +
                       '<div class="cafe-pill-tip"></div>' +
                       '</div>';

            var icon = L.divIcon({
              className: 'custom-cafe-icon',
              html: html,
              iconSize: [110, 32],
              iconAnchor: [55, 36]
            });

            var m = L.marker([cafe.lat, cafe.lng], { icon: icon }).addTo(map);
            m.on('click', function() {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SELECT_CAFE', cafeId: cafe.id }));
            });
          });

          var currentRouteLine = null;
          window.drawRoute = function(latLngArray) {
            if (currentRouteLine) { map.removeLayer(currentRouteLine); }
            currentRouteLine = L.polyline(latLngArray, { color: '#EA580C', weight: 6, opacity: 0.85, lineJoin: 'round' }).addTo(map);
            map.fitBounds(currentRouteLine.getBounds(), { padding: [50, 50] });
          };
          window.clearRoute = function() {
            if (currentRouteLine) { map.removeLayer(currentRouteLine); currentRouteLine = null; }
          };
          window.centerMap = function(lat, lng) {
            map.setView([lat, lng], 16, { animate: true });
          };
          window.centerMapWithZoom = function(lat, lng, zoom) {
            map.setView([lat, lng], zoom, { animate: true });
          };
        </script>
      </body>
    </html>
  `;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1C1917" />

      {/* Cabeçalho */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>RunCoffee</Text>
          <Text style={styles.headerSubtitle}>Campinas / SP • Club Urbano ☕</Text>
        </View>
        <TouchableOpacity
          style={styles.nominateHeaderButton}
          onPress={() => setIsNominateModalVisible(true)}
        >
          <Text style={styles.nominateHeaderButtonText}>+ Indicar Café</Text>
        </TouchableOpacity>
      </View>

      {/* Conteúdo Principal por Abas */}
      <View style={styles.mainContent}>
        {/* ABA 1: MAPA */}
        {activeTab === 'mapa' && (
          <View style={styles.tabContainer}>
            <View style={styles.filterPillsWrapper}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterPillsContainer}
              >
                {['Todos', 'Cambuí', 'Centro', 'Bosque', 'Barão Geraldo'].map((bairro) => (
                  <TouchableOpacity
                    key={bairro}
                    style={[
                      styles.filterPill,
                      selectedNeighborhood === bairro && styles.filterPillActive,
                    ]}
                    onPress={() => handleSelectNeighborhood(bairro)}
                  >
                    <Text
                      style={[
                        styles.filterPillText,
                        selectedNeighborhood === bairro && styles.filterPillTextActive,
                      ]}
                    >
                      {bairro}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <WebView
              key={selectedNeighborhood}
              ref={webViewRef}
              originWhitelist={['*']}
              source={{ html: leafletHTML }}
              style={styles.mapWebView}
              onMessage={(event) => {
                try {
                  const data = JSON.parse(event.nativeEvent.data);
                  if (data.type === 'SELECT_CAFE') {
                    const found = cafes.find((c) => c.id === data.cafeId);
                    if (found) setSelectedCafe(found);
                  }
                } catch (e) {}
              }}
            />

            <TouchableOpacity
              style={styles.centerLocationButton}
              onPress={() => {
                if (userLocation) {
                  webViewRef.current?.injectJavaScript(`
                    if (window.centerMap) {
                      window.centerMap(${userLocation.lat}, ${userLocation.lng});
                    }
                    true;
                  `);
                }
              }}
            >
              <Text style={{ fontSize: 20 }}>🎯</Text>
            </TouchableOpacity>

            {activeRoute && (
              <View style={styles.activeRouteCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.activeRouteTitle}>🚶 Rumo a {activeRoute.cafe.name}</Text>
                  <Text style={styles.activeRouteStats}>
                    {activeRoute.distanceKm} km • ~{activeRoute.durationMin} min a pé
                  </Text>
                </View>
                <TouchableOpacity style={styles.cancelRouteButton} onPress={handleCancelRoute}>
                  <Text style={styles.cancelRouteButtonText}>Finalizar</Text>
                </TouchableOpacity>
              </View>
            )}

            {selectedCafe && !activeRoute && (
              <View style={styles.cafeBottomSheet}>
                <View style={styles.bottomSheetHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.bottomSheetTitle}>{selectedCafe.name}</Text>
                    <Text style={styles.bottomSheetAddress}>{selectedCafe.address}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedCafe(null)}>
                    <Text style={{ color: '#A8A29E', fontSize: 18 }}>✕</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.reinadoBox}>
                  <Text style={{ fontSize: 18 }}>👑</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reinadoKingName}>
                      Rei do Mês: <Text style={{ color: '#F59E0B' }}>{selectedCafe.currentKing}</Text>
                    </Text>
                    <Text style={styles.reinadoVisits}>
                      {selectedCafe.kingVisits} visitas acumuladas este mês
                    </Text>
                  </View>
                </View>

                <View style={styles.perkBox}>
                  <Text style={{ fontSize: 18 }}>🎁</Text>
                  <Text style={styles.perkText}>{selectedCafe.perk}</Text>
                </View>

                <View style={styles.bottomSheetActions}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.routeBtn]}
                    onPress={() => handleStartRoute(selectedCafe)}
                    disabled={isCalculatingRoute}
                  >
                    {isCalculatingRoute ? (
                      <ActivityIndicator color="#FFF" size="small" />
                    ) : (
                      <Text style={styles.actionBtnText}>🚶 Traçar Rota</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.checkInBtn]}
                    onPress={() => handleCheckInAttempt(selectedCafe)}
                  >
                    <Text style={styles.actionBtnText}>📍 Check-in</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.perkBtn]}
                    onPress={() => {
                      setPerkTimer(90);
                      setIsPerkModalVisible(true);
                    }}
                  >
                    <Text style={styles.actionBtnText}>☕ Resgatar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}

        {/* ABA 2: CIRCUITOS (Componente Modular) */}
        {activeTab === 'circuitos' && (
          <CircuitsTab
            circuits={circuits}
            onNavigateToMap={() => setActiveTab('mapa')}
          />
        )}

        {/* ABA 3: COMUNIDADE (Componente Modular) */}
        {activeTab === 'comunidade' && (
          <CommunityTab
            posts={communityPosts}
            onToggleCheer={handleToggleCheer}
            onOpenPostModal={() => setIsPostModalVisible(true)}
            isRunClubJoined={isRunClubJoined}
            onToggleRunClub={() => setIsRunClubJoined(!isRunClubJoined)}
          />
        )}

        {/* ABA 4: PERFIL (Componente Modular) */}
        {activeTab === 'perfil' && (
          <ProfileTab
            userName={userName}
            userAvatar={userAvatar}
            userKm={userKm}
            userVisits={userVisits}
            userCrowns={userCrowns}
            userMedals={userMedals}
          />
        )}
      </View>

      {/* BARRA INFERIOR (BOTTOM TABS) */}
      <View style={styles.bottomTabBar}>
        <TouchableOpacity style={styles.tabButton} onPress={() => setActiveTab('mapa')}>
          <Text style={{ fontSize: 20 }}>🗺️</Text>
          <Text style={[styles.tabLabel, activeTab === 'mapa' && styles.tabLabelActive]}>Mapa</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabButton} onPress={() => setActiveTab('circuitos')}>
          <Text style={{ fontSize: 20 }}>🏃</Text>
          <Text style={[styles.tabLabel, activeTab === 'circuitos' && styles.tabLabelActive]}>Circuitos</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabButton} onPress={() => setActiveTab('comunidade')}>
          <Text style={{ fontSize: 20 }}>👥</Text>
          <Text style={[styles.tabLabel, activeTab === 'comunidade' && styles.tabLabelActive]}>Comunidade</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabButton} onPress={() => setActiveTab('perfil')}>
          <Text style={{ fontSize: 20 }}>👤</Text>
          <Text style={[styles.tabLabel, activeTab === 'perfil' && styles.tabLabelActive]}>Perfil</Text>
        </TouchableOpacity>
      </View>

      {/* MODAL 1: BENEFÍCIO DO BARISTA */}
      <Modal visible={isPerkModalVisible} transparent={true} animationType="fade" onRequestClose={() => setIsPerkModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.perkModalCard}>
            <Text style={{ fontSize: 36 }}>☕</Text>
            <Text style={styles.perkModalTitle}>Benefício de Atleta</Text>
            <Text style={styles.perkModalSubtitle}>Mostre esta tela para o barista no caixa para resgatar.</Text>
            <View style={styles.timerBox}>
              <Text style={styles.timerValue}>{perkTimer}s</Text>
              <Text style={styles.timerLabel}>Tempo restante para validar</Text>
            </View>
            <TouchableOpacity style={styles.closePerkBtn} onPress={() => setIsPerkModalVisible(false)}>
              <Text style={styles.closePerkBtnText}>Fechar Cupom</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: NOVO REINADO */}
      <Modal visible={isTakeoverModalVisible} transparent={true} animationType="slide" onRequestClose={() => setIsTakeoverModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.takeoverModalCard}>
            <Text style={{ fontSize: 50 }}>👑</Text>
            <Text style={styles.takeoverTitle}>Você é o Novo Rei!</Text>
            <Text style={styles.takeoverSubtitle}>
              Parabéns! Você alcançou {newReinadoInfo?.visits} visitas e assumiu o Reinado em{' '}
              <Text style={{ fontWeight: 'bold', color: '#F59E0B' }}>{newReinadoInfo?.cafeName}</Text>!
            </Text>
            <TouchableOpacity style={styles.takeoverBtn} onPress={() => setIsTakeoverModalVisible(false)}>
              <Text style={styles.takeoverBtnText}>Defender o Título! 🏃‍♂️</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL 3: INDICAR CAFETERIA */}
      <Modal visible={isNominateModalVisible} transparent={true} animationType="slide" onRequestClose={() => setIsNominateModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalBackdrop}>
          <View style={styles.nominateCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <Text style={styles.nominateTitle}>➕ Indicar Cafeteria</Text>
              <TouchableOpacity onPress={() => setIsNominateModalVisible(false)}>
                <Text style={{ color: '#A8A29E', fontSize: 18 }}>✕</Text>
              </TouchableOpacity>
            </View>
            <TextInput style={styles.modalInput} placeholder="Nome da Cafeteria (Ex: Grão Santo)" placeholderTextColor="#78716C" value={nominateName} onChangeText={setNominateName} />
            <TextInput style={styles.modalInput} placeholder="Endereço ou Bairro (Ex: Rua Barreto Leme, Cambuí)" placeholderTextColor="#78716C" value={nominateAddress} onChangeText={setNominateAddress} />
            <TextInput style={styles.modalInput} placeholder="Instagram (Ex: @graosantocafe)" placeholderTextColor="#78716C" value={nominateInstagram} onChangeText={setNominateInstagram} />
            <TextInput style={styles.modalInput} placeholder="Sugestão de Benefício (Ex: 10% no espresso)" placeholderTextColor="#78716C" value={nominatePerk} onChangeText={setNominatePerk} />
            <TouchableOpacity style={styles.saveNominationBtn} onPress={handleSaveNomination}>
              <Text style={styles.saveNominationBtnText}>Cadastrar Indicação</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL 4: NOVA PUBLICAÇÃO */}
      <Modal visible={isPostModalVisible} animationType="slide" transparent={true} onRequestClose={() => setIsPostModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#1C1917', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22, maxHeight: '90%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#FFF' }}>✍️ Compartilhar com o Club</Text>
              <TouchableOpacity onPress={() => setIsPostModalVisible(false)}>
                <Text style={{ color: '#A8A29E', fontSize: 20 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={{ backgroundColor: '#292524', color: '#FFF', borderRadius: 12, padding: 14, fontSize: 15, marginBottom: 12 }}
              placeholder="Qual cafeteria você visitou? (Ex: Café Container)"
              placeholderTextColor="#78716C"
              value={postCafe}
              onChangeText={setPostCafe}
            />

            <TextInput
              style={{ backgroundColor: '#292524', color: '#FFF', borderRadius: 12, padding: 14, fontSize: 15, height: 100, textAlignVertical: 'top', marginBottom: 14 }}
              placeholder="Como foi seu treino ou café hoje? (Ex: 5k matinal com espresso no Cambuí 🏃‍♂️☕)"
              placeholderTextColor="#78716C"
              multiline
              value={postText}
              onChangeText={setPostText}
            />

            {postPhoto ? (
              <View style={{ marginBottom: 16, alignItems: 'center' }}>
                <Image source={{ uri: postPhoto }} style={{ width: '100%', height: 160, borderRadius: 12 }} />
                <TouchableOpacity onPress={() => setPostPhoto(null)} style={{ marginTop: 8 }}>
                  <Text style={{ color: '#EF4444', fontSize: 13 }}>Remover foto</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={handlePickPostPhoto}
                style={{
                  borderWidth: 1,
                  borderColor: '#44403C',
                  borderStyle: 'dashed',
                  borderRadius: 12,
                  padding: 14,
                  alignItems: 'center',
                  marginBottom: 16,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <Text style={{ fontSize: 18 }}>📸</Text>
                <Text style={{ color: '#D6D3D1', fontSize: 14 }}>Adicionar foto do treino / café</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={handleCreatePost} style={{ backgroundColor: '#D97706', paddingVertical: 14, borderRadius: 14, alignItems: 'center' }}>
              <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>Publicar no Feed</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1917',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#292524',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#A8A29E',
    marginTop: 2,
  },
  nominateHeaderButton: {
    backgroundColor: 'rgba(217, 119, 6, 0.15)',
    borderWidth: 1,
    borderColor: '#D97706',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  nominateHeaderButtonText: {
    color: '#F59E0B',
    fontWeight: 'bold',
    fontSize: 12,
  },
  mainContent: {
    flex: 1,
  },
  tabContainer: {
    flex: 1,
    backgroundColor: '#1C1917',
  },
  filterPillsWrapper: {
    position: 'absolute',
    top: 12,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  filterPillsContainer: {
    paddingHorizontal: 14,
    gap: 8,
  },
  filterPill: {
    backgroundColor: '#1C1917',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#44403C',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  filterPillActive: {
    backgroundColor: '#EA580C',
    borderColor: '#EA580C',
  },
  filterPillText: {
    color: '#D6D3D1',
    fontSize: 13,
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  mapWebView: {
    flex: 1,
  },
  centerLocationButton: {
    position: 'absolute',
    top: 60,
    right: 16,
    backgroundColor: '#FFF',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  activeRouteCard: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 70,
    backgroundColor: '#1C1917',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D97706',
    elevation: 6,
  },
  activeRouteTitle: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  activeRouteStats: {
    color: '#D97706',
    fontSize: 12,
    marginTop: 2,
  },
  cancelRouteButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  cancelRouteButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cafeBottomSheet: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: '#1C1917',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#292524',
    elevation: 8,
  },
  bottomSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  bottomSheetAddress: {
    fontSize: 12,
    color: '#A8A29E',
    marginTop: 2,
  },
  reinadoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(217, 119, 6, 0.1)',
    borderRadius: 12,
    padding: 10,
    gap: 10,
    marginBottom: 8,
  },
  reinadoKingName: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  reinadoVisits: {
    color: '#A8A29E',
    fontSize: 11,
  },
  perkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#292524',
    borderRadius: 12,
    padding: 10,
    gap: 10,
    marginBottom: 14,
  },
  perkText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  bottomSheetActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  routeBtn: {
    backgroundColor: '#EA580C',
  },
  checkInBtn: {
    backgroundColor: '#059669',
  },
  perkBtn: {
    backgroundColor: '#D97706',
  },
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: '#1C1917',
    borderTopWidth: 1,
    borderTopColor: '#292524',
    paddingVertical: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 11,
    color: '#78716C',
    marginTop: 3,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '#F59E0B',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  perkModalCard: {
    backgroundColor: '#1C1917',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D97706',
  },
  perkModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 10,
  },
  perkModalSubtitle: {
    fontSize: 13,
    color: '#A8A29E',
    textAlign: 'center',
    marginVertical: 10,
  },
  timerBox: {
    backgroundColor: '#292524',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 28,
    alignItems: 'center',
    marginVertical: 16,
  },
  timerValue: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#EF4444',
  },
  timerLabel: {
    fontSize: 12,
    color: '#78716C',
    marginTop: 4,
  },
  closePerkBtn: {
    backgroundColor: '#292524',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
  },
  closePerkBtnText: {
    color: '#A8A29E',
    fontWeight: 'bold',
  },
  takeoverModalCard: {
    backgroundColor: '#1C1917',
    borderRadius: 24,
    padding: 26,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  takeoverTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#F59E0B',
    marginTop: 10,
  },
  takeoverSubtitle: {
    fontSize: 14,
    color: '#E7E5E4',
    textAlign: 'center',
    marginVertical: 14,
    lineHeight: 22,
  },
  takeoverBtn: {
    backgroundColor: '#F59E0B',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    marginTop: 8,
  },
  takeoverBtnText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 15,
  },
  nominateCard: {
    backgroundColor: '#1C1917',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#44403C',
  },
  nominateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  modalInput: {
    backgroundColor: '#292524',
    color: '#FFF',
    borderRadius: 12,
    padding: 13,
    fontSize: 14,
    marginBottom: 10,
  },
  saveNominationBtn: {
    backgroundColor: '#D97706',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  saveNominationBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
});