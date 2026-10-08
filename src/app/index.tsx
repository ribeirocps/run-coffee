import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
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

const { width } = Dimensions.get('window');

// Chave do AsyncStorage para postagens da comunidade
const STORAGE_POSTS_KEY = '@runcoffee_community_posts';

// 10 Cafeterias Especiais Reais de Campinas/SP
const INITIAL_CAFES = [
  {
    id: '1',
    name: 'D.Origem Cafés Especiais',
    lat: -22.9038,
    lng: -47.0583,
    address: 'R. Regente Feijó, 1070 - Centro',
    neighborhood: 'Centro',
    currentKing: 'Rafa Runner',
    kingVisits: 14,
    perk: 'Espresso Cortesia ou 15% OFF no grão',
    distanceKm: 0.8,
    isPartner: true,
  },
  {
    id: '2',
    name: 'Wood Cafés Especiais I',
    lat: -22.9056,
    lng: -47.0605,
    address: 'R. Dr. Quirino, 1185 - Centro',
    neighborhood: 'Centro',
    currentKing: 'Bia Marathon',
    kingVisits: 11,
    perk: '10% de desconto no Cold Brew gelado',
    distanceKm: 1.1,
    isPartner: true,
  },
  {
    id: '3',
    name: 'Wood Cafés Especiais II',
    lat: -22.8987,
    lng: -47.0468,
    address: 'Av. Cel. Silva Telles, 715 - Nova Campinas',
    neighborhood: 'Cambuí',
    currentKing: 'Leo Pace 4:30',
    kingVisits: 8,
    perk: 'Double espresso após o treino',
    distanceKm: 1.6,
    isPartner: true,
  },
  {
    id: '4',
    name: 'Divino Verde Botânica & Café',
    lat: -22.9125,
    lng: -47.0531,
    address: 'R. Aquidaban, 440 - Bosque',
    neighborhood: 'Bosque',
    currentKing: 'Mariana Trail',
    kingVisits: 9,
    perk: '15% de desconto no Pão de Queijo artesanal',
    distanceKm: 1.9,
    isPartner: true,
  },
  {
    id: '5',
    name: 'Café Container',
    lat: -22.8942,
    lng: -47.0515,
    address: 'R. Cel. Quirino, 1072 - Cambuí',
    neighborhood: 'Cambuí',
    currentKing: 'Carlos Iron',
    kingVisits: 16,
    perk: 'Espresso duplo com borda de doce de leite',
    distanceKm: 2.2,
    isPartner: true,
  },
  {
    id: '6',
    name: 'Abigail Coffee Co.',
    lat: -22.8967,
    lng: -47.0492,
    address: 'R. Maria Monteiro, 1426 - Cambuí',
    neighborhood: 'Cambuí',
    currentKing: 'Camila Sprint',
    kingVisits: 13,
    perk: 'Free shot de Vanilla Cold Brew',
    distanceKm: 2.4,
    isPartner: true,
  },
  {
    id: '7',
    name: 'Cafeteria Cambuí',
    lat: -22.8995,
    lng: -47.0541,
    address: 'R. Dr. Emílio Ribas, 485 - Cambuí',
    neighborhood: 'Cambuí',
    currentKing: 'Pedro 10k',
    kingVisits: 7,
    perk: '10% OFF em qualquer método filtrado V60',
    distanceKm: 2.1,
    isPartner: true,
  },
  {
    id: '8',
    name: 'Como Assim?! Café',
    lat: -22.8931,
    lng: -47.0502,
    address: 'R. Américo Brasiliense, 320 - Cambuí',
    neighborhood: 'Cambuí',
    currentKing: 'Julia Café',
    kingVisits: 10,
    perk: 'Upgrade grátis de tamanho no Latte',
    distanceKm: 2.5,
    isPartner: true,
  },
  {
    id: '9',
    name: 'Amo Café',
    lat: -22.8918,
    lng: -47.0528,
    address: 'R. Júlio de Mesquita, 725 - Cambuí',
    neighborhood: 'Cambuí',
    currentKing: 'Fernanda Run',
    kingVisits: 6,
    perk: '15% de desconto no combo Café + Cookie',
    distanceKm: 2.6,
    isPartner: true,
  },
  {
    id: '10',
    name: '1727 Coffee Roasters',
    lat: -22.8285,
    lng: -47.0862,
    address: 'R. Maria Tereza Dias da Silva, 664 - Barão Geraldo',
    neighborhood: 'Barão Geraldo',
    currentKing: 'Lucas Unicamp',
    kingVisits: 12,
    perk: 'Degustação guiada de microlote especial',
    distanceKm: 9.8,
    isPartner: true,
  },
];

// Coordenadas Centrais por Bairro para a Câmera
const NEIGHBORHOOD_CENTERS: Record<string, { lat: number; lng: number; zoom: number }> = {
  Todos: { lat: -22.9020, lng: -47.0540, zoom: 14 },
  Cambuí: { lat: -22.8950, lng: -47.0510, zoom: 15 },
  Centro: { lat: -22.9045, lng: -47.0595, zoom: 16 },
  Bosque: { lat: -22.9125, lng: -47.0531, zoom: 16 },
  'Barão Geraldo': { lat: -22.8285, lng: -47.0862, zoom: 15 },
};

// Circuitos Oficiais
const INITIAL_CIRCUITS = [
  {
    id: 'c1',
    title: 'Circuito Centro & Bosque',
    distance: '3.2 km',
    pace: 'Tranquilo / Urbano',
    description: 'Comece pelo D.Origem, passe pela Wood Centro e finalize no verde do Divino Verde.',
    cafes: ['D.Origem', 'Wood Centro', 'Divino Verde'],
    progress: 1,
    totalSteps: 3,
    badgeAwarded: '🏅 Medalha Centro Histórico',
    completed: false,
  },
  {
    id: 'c2',
    title: 'Circuito Cambuí Nobre',
    distance: '2.8 km',
    pace: 'Rápido / Calçadas Largas',
    description: 'Exploração pelos cafés mais concorridos do Cambuí: Container, Abigail e Como Assim?!',
    cafes: ['Café Container', 'Abigail Coffee', 'Como Assim?!'],
    progress: 0,
    totalSteps: 3,
    badgeAwarded: '👑 Coroa do Cambuí',
    completed: false,
  },
];

// Postagens Iniciais
const INITIAL_POSTS = [
  {
    id: 'p1',
    userName: 'Rafa Runner',
    avatar: '🏃‍♂️',
    timeAgo: 'Há 25 min',
    cafeName: 'D.Origem Cafés Especiais',
    text: 'Treino de 7km pelo Centro finalizado com um filtrado Bourbon Amarelo sensacional! Bati o recorde do Reinado.',
    photo: null,
    cheers: 8,
    hasCheered: false,
  },
  {
    id: 'p2',
    userName: 'Bia Marathon',
    avatar: '🏃‍♀️',
    timeAgo: 'Há 2 horas',
    cafeName: 'Café Container',
    text: 'Longão de sábado fechando no Container. O Cold Brew deles geladinho salva qualquer perna cansada! ☕🧊',
    photo: null,
    cheers: 14,
    hasCheered: true,
  },
  {
    id: 'p3',
    userName: 'Thiago Pace',
    avatar: '⚡',
    timeAgo: 'Há 5 horas',
    cafeName: 'Abigail Coffee Co.',
    text: 'Circuito Cambuí completado! 3 paradas, 3 espressos e muito ritmo nas pernas.',
    photo: null,
    cheers: 11,
    hasCheered: false,
  },
];

export default function RunCoffeeApp() {
  const [activeTab, setActiveTab] = useState<'mapa' | 'circuitos' | 'comunidade' | 'perfil'>('mapa');

  // Perfil
  const [userName, setUserName] = useState('Corredor Urbano');
  const [userAvatar, setUserAvatar] = useState('🏃');
  const [userVisits, setUserVisits] = useState(4);
  const [userKm, setUserKm] = useState(24.5);
  const [userCrowns, setUserCrowns] = useState(1);
  const [userMedals, setUserMedals] = useState<string[]>(['🏅 Primeiro 5k']);

  // Cafés e Filtro por Bairro
  const [cafes, setCafes] = useState(INITIAL_CAFES);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('Todos');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedCafe, setSelectedCafe] = useState<any | null>(null);
  const [activeRoute, setActiveRoute] = useState<{ cafe: any; distanceKm: number; durationMin: number } | null>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const targetCafeRef = useRef<any>(null);

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
  const [circuits, setCircuits] = useState(INITIAL_CIRCUITS);
  const [communityPosts, setCommunityPosts] = useState(INITIAL_POSTS);
  const [isRunClubJoined, setIsRunClubJoined] = useState(false);

  // Postar no Feed
  const [isPostModalVisible, setIsPostModalVisible] = useState(false);
  const [postText, setPostText] = useState('');
  const [postCafe, setPostCafe] = useState('');
  const [postPhoto, setPostPhoto] = useState<string | null>(null);

  const webViewRef = useRef<WebView>(null);

  // 1. Carregar Postagens do AsyncStorage na Inicialização
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_POSTS_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCommunityPosts(parsed);
          }
        }
      } catch (e) {
        console.log('Erro ao carregar posts do storage:', e);
      }
    })();
  }, []);

  // 2. Salvar Postagens no AsyncStorage
  const savePostsToStorage = async (newPostsList: typeof communityPosts) => {
    try {
      await AsyncStorage.setItem(STORAGE_POSTS_KEY, JSON.stringify(newPostsList));
    } catch (e) {
      console.log('Erro ao salvar posts no storage:', e);
    }
  };

  // 3. Localização do Usuário
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

  // 4. Timer do Cupom de Benefício (90 segundos)
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

  // Filtragem de Cafeterias
  const filteredCafes =
    selectedNeighborhood === 'Todos'
      ? cafes
      : cafes.filter(
          (c) =>
            (c.neighborhood && c.neighborhood.toLowerCase() === selectedNeighborhood.toLowerCase()) ||
            c.address.toLowerCase().includes(selectedNeighborhood.toLowerCase())
        );

  // Mudar de Bairro e Reposicionar Mapa
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

  // Selecionar Foto
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
    } catch (e) {
      console.log('Erro ao selecionar foto:', e);
    }
  };

  // Criar Post e Persistir
  const handleCreatePost = () => {
    if (!postText.trim()) {
      Alert.alert('Atenção', 'Escreva uma mensagem sobre seu treino ou café!');
      return;
    }
    const newPost = {
      id: String(Date.now()),
      userName: userName || 'Corredor Urbano',
      avatar: userAvatar || '☕',
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

  // Dar Brinde e Salvar Estado
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

  // Traçar Rota Pedestre via OSRM Foot API
  const handleStartRoute = async (cafe: any) => {
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

  // Cancelar Rota
  const handleCancelRoute = () => {
    setActiveRoute(null);
    webViewRef.current?.injectJavaScript(`
      if (window.clearRoute) {
        window.clearRoute();
      }
      true;
    `);
  };

  // Check-in com Anti-Cheat de Velocidade
  const handleCheckIn = async (cafe: any) => {
    let isSpeeding = false;
    try {
      const curLoc = await Location.getCurrentPositionAsync({});
      if (curLoc.coords.speed !== null && curLoc.coords.speed !== undefined) {
        const speedKmH = curLoc.coords.speed * 3.6;
        if (speedKmH > 20) {
          isSpeeding = true;
        }
      }
    } catch {}

    const visitsEarned = isSpeeding ? 1 : 2;
    setUserVisits((v) => v + visitsEarned);
    setUserKm((k) => Number((k + (cafe.distanceKm || 1.5)).toFixed(1)));

    if (userVisits + visitsEarned > cafe.kingVisits) {
      setCafes((prev) =>
        prev.map((c) =>
          c.id === cafe.id
            ? { ...c, currentKing: userName, kingVisits: userVisits + visitsEarned }
            : c
        )
      );
      setUserCrowns((c) => c + 1);
      setNewReinadoInfo({ cafeName: cafe.name, visits: userVisits + visitsEarned });
      setIsTakeoverModalVisible(true);
    } else {
      Alert.alert(
        isSpeeding ? 'Check-in Motorizado! 🚗' : 'Check-in Esportivo! 🏃‍♂️',
        isSpeeding
          ? `Velocidade alta detectada. Você ganhou +1 visita em ${cafe.name}. Corra ou caminhe para ganhar o dobro!`
          : `Sensacional! Você ganhou +2 visitas em ${cafe.name} pelo esforço a pé!`
      );
    }
  };

  // Salvar Indicação de Café
  const handleSaveNomination = () => {
    if (!nominateName.trim() || !nominateAddress.trim()) {
      Alert.alert('Atenção', 'Informe pelo menos o nome e endereço da cafeteria.');
      return;
    }
    const newCafe = {
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

  // Leaflet HTML com Google Maps e Marcadores Filtrados
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

          // Google Maps Oficial
          L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
            maxZoom: 20,
            subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
            attribution: '&copy; Google Maps'
          }).addTo(map);

          // GPS do Usuário
          var userIcon = L.divIcon({
            className: 'custom-user-icon',
            html: '<div class="pulse-marker"></div>',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          });
          L.marker(center, { icon: userIcon }).addTo(map);

          // Adicionar Cafeterias Filtradas
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

          // Rota Pedestre
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

      {/* Conteúdo Principal */}
      <View style={styles.mainContent}>
        {/* ABA 1: MAPA */}
        {activeTab === 'mapa' && (
          <View style={styles.tabContainer}>
            {/* Pílulas de Filtro por Bairro */}
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

            {/* Centralizar no GPS */}
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

            {/* Card de Rota Pedestre Ativa */}
            {activeRoute && (
              <View style={styles.activeRouteCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.activeRouteTitle}>
                    🚶 Rumo a {activeRoute.cafe.name}
                  </Text>
                  <Text style={styles.activeRouteStats}>
                    {activeRoute.distanceKm} km • ~{activeRoute.durationMin} min a pé
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.cancelRouteButton}
                  onPress={handleCancelRoute}
                >
                  <Text style={styles.cancelRouteButtonText}>Finalizar</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Card BottomSheet da Cafeteria Selecionada */}
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

                {/* Badge do Rei Atual */}
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

                {/* Benefício / Perk */}
                <View style={styles.perkBox}>
                  <Text style={{ fontSize: 18 }}>🎁</Text>
                  <Text style={styles.perkText}>{selectedCafe.perk}</Text>
                </View>

                {/* Ações */}
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
                    onPress={() => handleCheckIn(selectedCafe)}
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

        {/* ABA 2: CIRCUITOS */}
        {activeTab === 'circuitos' && (
          <ScrollView style={styles.tabContainer} contentContainerStyle={{ padding: 16 }}>
            <Text style={styles.sectionHeading}>🏃 Circuitos de Cafeterias</Text>
            <Text style={styles.sectionSubheading}>
              Complete as rotas a pé, visite os checkpoints e desbloqueie medalhas exclusivas para o seu perfil.
            </Text>

            {circuits.map((c) => (
              <View key={c.id} style={styles.circuitCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.circuitTitle}>{c.title}</Text>
                  <Text style={styles.circuitPill}>{c.distance}</Text>
                </View>
                <Text style={styles.circuitDesc}>{c.description}</Text>

                <View style={styles.checkpointContainer}>
                  {c.cafes.map((cafe, i) => (
                    <View key={i} style={styles.checkpointItem}>
                      <Text style={{ color: i < c.progress ? '#10B981' : '#78716C', fontSize: 14 }}>
                        {i < c.progress ? '✅' : '⚪'} {cafe}
                      </Text>
                    </View>
                  ))}
                </View>

                <View style={styles.circuitRewardBox}>
                  <Text style={{ color: '#D97706', fontWeight: 'bold' }}>
                    Recompensa: {c.badgeAwarded}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.startCircuitBtn}
                  onPress={() => {
                    Alert.alert('Circuito Iniciado!', `Primeira parada definida para ${c.cafes[0]}. Bom treino!`);
                    setActiveTab('mapa');
                  }}
                >
                  <Text style={styles.startCircuitBtnText}>Iniciar Circuito</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}

        {/* ABA 3: COMUNIDADE */}
        {activeTab === 'comunidade' && (
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
                  setIsRunClubJoined(!isRunClubJoined);
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
            <TouchableOpacity
              style={styles.postActionButton}
              onPress={() => setIsPostModalVisible(true)}
            >
              <Text style={{ fontSize: 18 }}>✍️</Text>
              <Text style={styles.postActionButtonText}>
                Compartilhar Treino ou Café
              </Text>
            </TouchableOpacity>

            <Text style={[styles.sectionHeading, { marginTop: 12 }]}>
              ☕ Feed da Comunidade
            </Text>

            {communityPosts.map((post) => (
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
                    onPress={() => handleToggleCheer(post.id)}
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
        )}

        {/* ABA 4: PERFIL */}
        {activeTab === 'perfil' && (
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

            <Text style={styles.sectionHeading}>🏅 Medalhas & Conquistas</Text>
            <View style={styles.medalsContainer}>
              {userMedals.map((m, idx) => (
                <View key={idx} style={styles.medalPill}>
                  <Text style={styles.medalPillText}>{m}</Text>
                </View>
              ))}
              <View style={[styles.medalPill, { opacity: 0.4 }]}>
                <Text style={styles.medalPillText}>🔒 Circuito Cambuí</Text>
              </View>
              <View style={[styles.medalPill, { opacity: 0.4 }]}>
                <Text style={styles.medalPillText}>🔒 10 Cafés Diferentes</Text>
              </View>
            </View>
          </ScrollView>
        )}
      </View>

      {/* BARRA INFERIOR (BOTTOM TABS) */}
      <View style={styles.bottomTabBar}>
        <TouchableOpacity style={styles.tabButton} onPress={() => setActiveTab('mapa')}>
          <Text style={{ fontSize: 20 }}>🗺️</Text>
          <Text style={[styles.tabLabel, activeTab === 'mapa' && styles.tabLabelActive]}>
            Mapa
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabButton} onPress={() => setActiveTab('circuitos')}>
          <Text style={{ fontSize: 20 }}>🏃</Text>
          <Text style={[styles.tabLabel, activeTab === 'circuitos' && styles.tabLabelActive]}>
            Circuitos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabButton} onPress={() => setActiveTab('comunidade')}>
          <Text style={{ fontSize: 20 }}>👥</Text>
          <Text style={[styles.tabLabel, activeTab === 'comunidade' && styles.tabLabelActive]}>
            Comunidade
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabButton} onPress={() => setActiveTab('perfil')}>
          <Text style={{ fontSize: 20 }}>👤</Text>
          <Text style={[styles.tabLabel, activeTab === 'perfil' && styles.tabLabelActive]}>
            Perfil
          </Text>
        </TouchableOpacity>
      </View>

      {/* MODAL 1: CUPOM DE BENEFÍCIO */}
      <Modal
        visible={isPerkModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsPerkModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.perkModalCard}>
            <Text style={{ fontSize: 36 }}>☕</Text>
            <Text style={styles.perkModalTitle}>Benefício de Atleta</Text>
            <Text style={styles.perkModalSubtitle}>
              Mostre esta tela para o barista no caixa para resgatar.
            </Text>

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

      {/* MODAL 2: NOVO REINADO (TAKEOVER) */}
      <Modal
        visible={isTakeoverModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsTakeoverModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.takeoverModalCard}>
            <Text style={{ fontSize: 50 }}>👑</Text>
            <Text style={styles.takeoverTitle}>Você é o Novo Rei!</Text>
            <Text style={styles.takeoverSubtitle}>
              Parabéns! Você alcançou {newReinadoInfo?.visits} visitas e assumiu o Reinado em{' '}
              <Text style={{ fontWeight: 'bold', color: '#F59E0B' }}>
                {newReinadoInfo?.cafeName}
              </Text>
              !
            </Text>
            <TouchableOpacity style={styles.takeoverBtn} onPress={() => setIsTakeoverModalVisible(false)}>
              <Text style={styles.takeoverBtnText}>Defender o Título! 🏃‍♂️</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL 3: INDICAR CAFETERIA */}
      <Modal
        visible={isNominateModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsNominateModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <View style={styles.nominateCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <Text style={styles.nominateTitle}>➕ Indicar Cafeteria</Text>
              <TouchableOpacity onPress={() => setIsNominateModalVisible(false)}>
                <Text style={{ color: '#A8A29E', fontSize: 18 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Nome da Cafeteria (Ex: Grão Santo)"
              placeholderTextColor="#78716C"
              value={nominateName}
              onChangeText={setNominateName}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Endereço ou Bairro (Ex: Rua Barreto Leme, Cambuí)"
              placeholderTextColor="#78716C"
              value={nominateAddress}
              onChangeText={setNominateAddress}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Instagram (Ex: @graosantocafe)"
              placeholderTextColor="#78716C"
              value={nominateInstagram}
              onChangeText={setNominateInstagram}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Sugestão de Benefício (Ex: 10% no espresso)"
              placeholderTextColor="#78716C"
              value={nominatePerk}
              onChangeText={setNominatePerk}
            />

            <TouchableOpacity style={styles.saveNominationBtn} onPress={handleSaveNomination}>
              <Text style={styles.saveNominationBtnText}>Cadastrar Indicação</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL 4: NOVA PUBLICAÇÃO NA COMUNIDADE */}
      <Modal
        visible={isPostModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsPostModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.6)',
            justifyContent: 'flex-end',
          }}
        >
          <View
            style={{
              backgroundColor: '#1C1917',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 22,
              maxHeight: '90%',
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#FFF' }}>
                ✍️ Compartilhar com o Club
              </Text>
              <TouchableOpacity onPress={() => setIsPostModalVisible(false)}>
                <Text style={{ color: '#A8A29E', fontSize: 20 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={{
                backgroundColor: '#292524',
                color: '#FFF',
                borderRadius: 12,
                padding: 14,
                fontSize: 15,
                marginBottom: 12,
              }}
              placeholder="Qual cafeteria você visitou? (Ex: Café Container)"
              placeholderTextColor="#78716C"
              value={postCafe}
              onChangeText={setPostCafe}
            />

            <TextInput
              style={{
                backgroundColor: '#292524',
                color: '#FFF',
                borderRadius: 12,
                padding: 14,
                fontSize: 15,
                height: 100,
                textAlignVertical: 'top',
                marginBottom: 14,
              }}
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
                <Text style={{ color: '#D6D3D1', fontSize: 14 }}>
                  Adicionar foto do treino / café
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={handleCreatePost}
              style={{
                backgroundColor: '#D97706',
                paddingVertical: 14,
                borderRadius: 14,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>
                Publicar no Feed
              </Text>
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
    gap: 4,
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