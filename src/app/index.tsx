import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { WebView } from 'react-native-webview';

const STORAGE_CAFES_KEY = '@runcoffee_cafes';
const STORAGE_PROFILE_KEY = '@runcoffee_profile';
const STORAGE_ONBOARDING_KEY = '@runcoffee_onboarding_done';

const INITIAL_CAFES = [
  {
    id: '1',
    name: 'D.Origem Cafés Especiais',
    address: 'R. Antônio Cesarino, 324 - Centro',
    lat: -22.9056,
    lng: -47.0583,
    kingName: 'Lucas',
    kingVisits: 10,
    myVisits: 9,
    perk: '10% off em cafés filtrados',
    instagram: '@dorigemcafe',
  },
  {
    id: '2',
    name: 'Wood Especiais',
    address: 'R. Dr. Quirino, 1156 - Centro',
    lat: -22.9028,
    lng: -47.0552,
    kingName: 'Henrique',
    kingVisits: 8,
    myVisits: 8,
    perk: 'Espresso cortesia no 5º check-in',
    instagram: '@woodespeciais',
  },
  {
    id: '3',
    name: 'Divino Verde Botânica',
    address: 'Av. Dr. Moraes Salles, 1288 - Bosque',
    lat: -22.9088,
    lng: -47.0519,
    kingName: 'Sem Rei',
    kingVisits: 0,
    myVisits: 0,
    perk: '15% off no combo café + fatia',
    instagram: '@divinoverdecafe',
  },
  {
    id: '4',
    name: 'Café Container',
    address: 'R. Antônio Lapa, 1080 - Cambuí',
    lat: -22.8953,
    lng: -47.0494,
    kingName: 'Mariana',
    kingVisits: 14,
    myVisits: 4,
    perk: 'Upgrade de tamanho grátis',
    instagram: '@cafecontainer',
  },
  {
    id: '5',
    name: 'Abigail Coffee Co.',
    address: 'R. Dr. Guilherme da Silva, 300 - Cambuí',
    lat: -22.8981,
    lng: -47.0489,
    kingName: 'Pedro',
    kingVisits: 12,
    myVisits: 2,
    perk: '10% off para corredores',
    instagram: '@abigailcoffeeco',
  },
];

const CIRCUITS = [
  {
    id: 'c1',
    title: 'Circuito Centro-Bosque',
    distance: '3.2 km',
    badge: '🏅 Medalha Centro-Bosque',
    desc: 'Conecte o polo histórico do Centro ao charme botânico do Bosque.',
    cafeIds: ['1', '2', '3'],
  },
  {
    id: 'c2',
    title: 'Circuito Cambuí Loop',
    distance: '2.8 km',
    badge: '🏅 Medalha Cambuí',
    desc: 'O circuito mais nobre e movimentado de cafeterias especiais.',
    cafeIds: ['4', '5'],
  },
];

const INITIAL_PROFILE = {
  name: 'Henrique',
  avatar: '🏃‍♂️',
  photoUri: null as string | null,
  totalKm: 14.2,
  crownsCount: 1,
  medals: ['🏅 Pioneiro RunCoffee'],
};

// POSTS INICIAIS DO FEED DA COMUNIDADE EM CAMPINAS
const INITIAL_POSTS = [
  {
    id: 'p1',
    authorName: 'Henrique Ribeiro',
    authorAvatar: '🏃‍♂️',
    timeAgo: 'Há 18 min',
    action: 'Completou o Circuito Centro-Bosque',
    stats: '📍 3.2 km • ⏱️ 21 min • ⚡ 6\'33"/km',
    comment: 'Treino matinal fechado com chave de ouro e espresso no balcão! ☕🔥',
    badge: '🏅 Medalha Centro-Bosque',
    cheersCount: 14,
    userHasCheered: false,
  },
  {
    id: 'p2',
    authorName: 'Mariana Silva',
    authorAvatar: '🏃‍♀️',
    timeAgo: 'Há 45 min',
    action: 'Assumiu o Trono do Café Container! 👑',
    stats: '📍 2.8 km • ☕ Check-in de Corrida (+2 visitas)',
    comment: 'Passei o Pedro e agora sou a nova Rainha do Cambuí! Quem vai encarar?',
    badge: null,
    cheersCount: 22,
    userHasCheered: false,
  },
  {
    id: 'p3',
    authorName: 'Lucas Mendes',
    authorAvatar: '⚡',
    timeAgo: 'Há 2 horas',
    action: 'Defendeu o Reinado na D.Origem',
    stats: '📍 4.5 km a pé pelo Centro',
    comment: 'Café filtrado na V60 depois de subir a Cesarino no trote.',
    badge: null,
    cheersCount: 9,
    userHasCheered: false,
  },
];

const ONBOARDING_SLIDES = [
  {
    id: '1',
    icon: '☕🗺️',
    title: 'Descubra Cafés Especiais',
    subtitle: 'As melhores cafeterias artesanais de Campinas mapeadas em um circuito urbano feito para quem valoriza café de verdade.',
  },
  {
    id: '2',
    icon: '🏃‍♂️⚡',
    title: 'Corra ou Caminhe até Eles',
    subtitle: 'Trace trajetos a pé com GPS em tempo real. O velocímetro anti-fraude garante que apenas quem foi a pé ganhe o bônus esportivo (+2 visitas)!',
  },
  {
    id: '3',
    icon: '👑🎁',
    title: 'Conquiste o Trono & Benefícios',
    subtitle: 'Frequente com constância para destronar o Rei da cafeteria, colecionar medalhas e resgatar descontos exclusivos no balcão.',
  },
];

export default function App() {
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [signupName, setSignupName] = useState('Henrique');
  const [signupAvatar, setSignupAvatar] = useState('🏃‍♂️');
  const [signupPhotoUri, setSignupPhotoUri] = useState<string | null>(null);

  // 4 ABAS: 'map' | 'circuits' | 'community' | 'profile'
  const [activeTab, setActiveTab] = useState<'map' | 'circuits' | 'community' | 'profile'>('map');

  const [cafes, setCafes] = useState(INITIAL_CAFES);
  const [userProfile, setUserProfile] = useState(INITIAL_PROFILE);
  const [selectedCafe, setSelectedCafe] = useState<any>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Estados da Comunidade
  const [posts, setPosts] = useState(INITIAL_POSTS);
  const [isEventAttending, setIsEventAttending] = useState(false);
  const [eventAttendeesCount, setEventAttendeesCount] = useState(24);

  // Rotas e Circuitos
  const [activeRoute, setActiveRoute] = useState<{
    cafe: any;
    distance: string;
    duration: string;
  } | null>(null);

  const [activeCircuit, setActiveCircuit] = useState<any>(null);
  const [circuitCompletedCafeIds, setCircuitCompletedCafeIds] = useState<string[]>([]);
  const [unlockedMedal, setUnlockedMedal] = useState<string | null>(null);

  const targetCafeRef = useRef<any>(null);

  // Anti-fraude
  const [currentSpeedKmh, setCurrentSpeedKmh] = useState<number>(0);
  const [isVehicleDetected, setIsVehicleDetected] = useState(false);

  // Chegada e Cupom
  const [isArrived, setIsArrived] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [countdown, setCountdown] = useState(90);
  const [redeemingCafe, setRedeemingCafe] = useState<any>(null);
  const [redeemPointsToAdd, setRedeemPointsToAdd] = useState<number>(1);

  // Coroa
  const [crownVictoryData, setCrownVictoryData] = useState<{
    cafeName: string;
    oldKing: string;
    newVisits: number;
  } | null>(null);

  // Formulário de Indicação
  const [showAddCafeModal, setShowAddCafeModal] = useState(false);
  const [formName, setFormName] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formInstagram, setFormInstagram] = useState('');
  const [formPerk, setFormPerk] = useState('');
  const [formLat, setFormLat] = useState('-22.8990');
  const [formLng, setFormLng] = useState('-47.0510');

  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    const loadStoredData = async () => {
      try {
        const hasDoneOnboarding = await AsyncStorage.getItem(STORAGE_ONBOARDING_KEY);
        setOnboardingDone(hasDoneOnboarding === 'true');

        const savedCafes = await AsyncStorage.getItem(STORAGE_CAFES_KEY);
        const savedProfile = await AsyncStorage.getItem(STORAGE_PROFILE_KEY);

        if (savedCafes) setCafes(JSON.parse(savedCafes));
        if (savedProfile) {
          const parsed = JSON.parse(savedProfile);
          setUserProfile({
            ...parsed,
            medals: Array.isArray(parsed.medals) ? parsed.medals : ['🏅 Pioneiro RunCoffee'],
          });
          if (parsed.name) setSignupName(parsed.name);
          if (parsed.avatar) setSignupAvatar(parsed.avatar);
          if (parsed.photoUri) setSignupPhotoUri(parsed.photoUri);
        }
      } catch (e) {
        console.error('Erro ao carregar dados:', e);
      }
    };
    loadStoredData();
  }, []);

  const persistData = async (newCafes: any[], newProfile: any) => {
    try {
      await AsyncStorage.setItem(STORAGE_CAFES_KEY, JSON.stringify(newCafes));
      await AsyncStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(newProfile));
    } catch (e) {
      console.error('Erro ao salvar dados:', e);
    }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão Necessária', 'Permita o acesso à galeria para escolher sua foto.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      setSignupPhotoUri(uri);
      const updated = { ...userProfile, photoUri: uri };
      setUserProfile(updated);
      persistData(cafes, updated);
    }
  };

  const handleFinishOnboarding = async () => {
    const updatedProfile = {
      ...userProfile,
      name: signupName.trim() || 'Corredor',
      avatar: signupAvatar,
      photoUri: signupPhotoUri,
    };
    setUserProfile(updatedProfile);
    await AsyncStorage.setItem(STORAGE_ONBOARDING_KEY, 'true');
    await AsyncStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(updatedProfile));
    setOnboardingDone(true);
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showCouponModal && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [showCouponModal, countdown]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const mapHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body, html, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: #f8f9fa; }
        .coffee-pin {
          background: #ffffff;
          border: 2px solid #7f4f24;
          border-radius: 50%;
          text-align: center;
          font-size: 16px;
          line-height: 28px;
          width: 32px !important;
          height: 32px !important;
          box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        }
        .user-cup-pin {
          background: #2b1b17;
          border: 3px solid #d4a373;
          border-radius: 50%;
          text-align: center;
          font-size: 18px;
          line-height: 32px;
          width: 38px !important;
          height: 38px !important;
          box-shadow: 0 0 15px rgba(212, 163, 115, 0.8), 0 3px 6px rgba(0,0,0,0.35);
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(212, 163, 115, 0.7); }
          70% { box-shadow: 0 0 0 12px rgba(212, 163, 115, 0); }
          100% { box-shadow: 0 0 0 0 rgba(212, 163, 115, 0); }
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map', { zoomControl: false }).setView([-22.9025, -47.0535], 15);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map);

        var cafes = ${JSON.stringify(cafes)};
        cafes.forEach(function(cafe) {
          var icon = L.divIcon({ className: 'coffee-pin', html: '☕', iconSize: [32, 32], iconAnchor: [16, 16] });
          var marker = L.marker([cafe.lat, cafe.lng], { icon: icon }).addTo(map);
          marker.on('click', function() {
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SELECT_CAFE', cafeId: cafe.id }));
            }
          });
        });

        var userMarker = null;
        var currentRouteLayer = null;

        window.updateUserPosition = function(lat, lng, recenter) {
          var userIcon = L.divIcon({ className: 'user-cup-pin', html: '☕', iconSize: [38, 38], iconAnchor: [19, 19] });
          if (!userMarker) {
            userMarker = L.marker([lat, lng], { icon: userIcon, zIndexOffset: 1000 }).addTo(map);
          } else {
            userMarker.setLatLng([lat, lng]);
          }
          if (recenter) map.setView([lat, lng], 16);
        };

        window.centerOnUser = function() {
          if (userMarker) map.setView(userMarker.getLatLng(), 16);
        };

        window.tracePedestrianRoute = function(startLat, startLng, endLat, endLng) {
          if (currentRouteLayer) { map.removeLayer(currentRouteLayer); currentRouteLayer = null; }
          var url = 'https://router.project-osrm.org/route/v1/foot/' + startLng + ',' + startLat + ';' + endLng + ',' + endLat + '?overview=full&geometries=geojson';
          fetch(url).then(function(res) { return res.json(); }).then(function(data) {
            if (data.routes && data.routes.length > 0) {
              var route = data.routes[0];
              var coordinates = route.geometry.coordinates.map(function(c) { return [c[1], c[0]]; });
              currentRouteLayer = L.polyline(coordinates, { color: '#7f4f24', weight: 5, opacity: 0.85, dashArray: '8, 8' }).addTo(map);
              map.fitBounds(currentRouteLayer.getBounds(), { padding: [50, 50] });
              var distKm = (route.distance / 1000).toFixed(1);
              var durationMin = Math.max(1, Math.round(route.duration / 60));
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ROUTE_READY', distance: distKm + ' km', duration: '~' + durationMin + ' min' }));
              }
            }
          }).catch(function() {
            var coords = [[startLat, startLng], [endLat, endLng]];
            currentRouteLayer = L.polyline(coords, { color: '#7f4f24', weight: 4, dashArray: '5, 5' }).addTo(map);
            map.fitBounds(currentRouteLayer.getBounds(), { padding: [50, 50] });
          });
        };

        window.traceCircuitRoute = function(waypoints) {
          if (currentRouteLayer) { map.removeLayer(currentRouteLayer); currentRouteLayer = null; }
          var coordString = waypoints.map(function(w) { return w.lng + ',' + w.lat; }).join(';');
          var url = 'https://router.project-osrm.org/route/v1/foot/' + coordString + '?overview=full&geometries=geojson';
          fetch(url).then(function(res) { return res.json(); }).then(function(data) {
            if (data.routes && data.routes.length > 0) {
              var route = data.routes[0];
              var coordinates = route.geometry.coordinates.map(function(c) { return [c[1], c[0]]; });
              currentRouteLayer = L.polyline(coordinates, { color: '#d4a373', weight: 6, opacity: 0.9, lineJoin: 'round' }).addTo(map);
              map.fitBounds(currentRouteLayer.getBounds(), { padding: [60, 60] });
            }
          }).catch(function() {
            var coords = waypoints.map(function(w) { return [w.lat, w.lng]; });
            currentRouteLayer = L.polyline(coords, { color: '#d4a373', weight: 5 }).addTo(map);
            map.fitBounds(currentRouteLayer.getBounds(), { padding: [60, 60] });
          });
        };

        window.removeRoute = function() {
          if (currentRouteLayer) { map.removeLayer(currentRouteLayer); currentRouteLayer = null; }
        };
      </script>
    </body>
    </html>
  `;

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const initialPos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = initialPos.coords;
      setUserCoords({ lat: latitude, lng: longitude });
      injectUserCoords(latitude, longitude, true);

      locationSubscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 2000, distanceInterval: 3 },
        (newLocation) => {
          const { latitude: newLat, longitude: newLng, speed } = newLocation.coords;
          setUserCoords({ lat: newLat, lng: newLng });
          injectUserCoords(newLat, newLng, false);
          const speedKmh = Math.max(0, Math.round((speed || 0) * 3.6));
          setCurrentSpeedKmh(speedKmh);
          if (speedKmh > 20) setIsVehicleDetected(true);
        }
      );
    })();
    return () => { locationSubscription?.remove(); };
  }, [onboardingDone]);

  const injectUserCoords = (lat: number, lng: number, recenter: boolean) => {
    const script = `if (window.updateUserPosition) { window.updateUserPosition(${lat}, ${lng}, ${recenter}); } true;`;
    webViewRef.current?.injectJavaScript(script);
  };

  const handleRecenter = () => {
    webViewRef.current?.injectJavaScript('window.centerOnUser(); true;');
  };

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'SELECT_CAFE') {
        const found = cafes.find((c) => c.id === data.cafeId);
        if (found) setSelectedCafe(found);
      } else if (data.type === 'ROUTE_READY') {
        if (targetCafeRef.current) {
          setActiveRoute({ cafe: targetCafeRef.current, distance: data.distance, duration: data.duration });
          setIsArrived(false);
          setIsVehicleDetected(false);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectCircuit = (circuit: any) => {
    setActiveTab('map');
    setActiveRoute(null);
    setSelectedCafe(null);
    setActiveCircuit(circuit);
    setCircuitCompletedCafeIds([]);
    const circuitCafes = cafes.filter((c) => circuit.cafeIds.includes(c.id));
    const script = `if (window.traceCircuitRoute) { window.traceCircuitRoute(${JSON.stringify(circuitCafes)}); } true;`;
    webViewRef.current?.injectJavaScript(script);
  };

  const handleCancelCircuit = () => {
    setActiveCircuit(null);
    setCircuitCompletedCafeIds([]);
    webViewRef.current?.injectJavaScript('window.removeRoute(); true;');
    handleRecenter();
  };

  const handleAdvanceCircuitStop = () => {
    if (!activeCircuit) return;
    const nextCafeId = activeCircuit.cafeIds.find((id: string) => !circuitCompletedCafeIds.includes(id));
    if (nextCafeId) {
      const newCompleted = [...circuitCompletedCafeIds, nextCafeId];
      setCircuitCompletedCafeIds(newCompleted);

      if (newCompleted.length === activeCircuit.cafeIds.length) {
        const medalWon = activeCircuit.badge;
        setUnlockedMedal(medalWon);
        const currentMedals = Array.isArray(userProfile.medals) ? userProfile.medals : ['🏅 Pioneiro RunCoffee'];
        const updatedMedals = currentMedals.includes(medalWon) ? currentMedals : [...currentMedals, medalWon];
        const addedKm = parseFloat(activeCircuit.distance) || 3.0;

        const updatedProfile = {
          ...userProfile,
          totalKm: parseFloat(((userProfile.totalKm || 0) + addedKm).toFixed(1)),
          medals: updatedMedals,
        };
        setUserProfile(updatedProfile);
        persistData(cafes, updatedProfile);

        // Adiciona post automático na comunidade
        const newPost = {
          id: String(Date.now()),
          authorName: userProfile.name,
          authorAvatar: userProfile.avatar || '🏃‍♂️',
          timeAgo: 'Agora mesmo',
          action: `Completou o ${activeCircuit.title}! 🏆`,
          stats: `📍 ${activeCircuit.distance} • Desafio Oficial`,
          comment: `Faturei a ${medalWon}! Rota incrível pelas cafeterias de Campinas.`,
          badge: medalWon,
          cheersCount: 1,
          userHasCheered: true,
        };
        setPosts((prev) => [newPost, ...prev]);
      }
    }
  };

  const handleStartRoute = (cafe: any) => {
    if (!userCoords) { Alert.alert('Aguardando GPS', 'Obtendo sinal...'); return; }
    setActiveCircuit(null);
    targetCafeRef.current = cafe;
    const script = `if (window.tracePedestrianRoute) { window.tracePedestrianRoute(${userCoords.lat}, ${userCoords.lng}, ${cafe.lat}, ${cafe.lng}); } true;`;
    webViewRef.current?.injectJavaScript(script);
    setSelectedCafe(null);
  };

  const handleDirectCheckin = (cafe: any) => {
    setRedeemingCafe(cafe);
    setRedeemPointsToAdd(1);
    setCountdown(90);
    setShowCouponModal(true);
    setSelectedCafe(null);
  };

  const handleCancelRoute = () => {
    targetCafeRef.current = null;
    setActiveRoute(null);
    setIsArrived(false);
    setIsVehicleDetected(false);
    webViewRef.current?.injectJavaScript('window.removeRoute(); true;');
    handleRecenter();
  };

  const handleOpenCouponFromRoute = () => {
    if (activeRoute?.cafe) {
      setRedeemingCafe(activeRoute.cafe);
      if (isVehicleDetected) {
        setRedeemPointsToAdd(1);
        Alert.alert('🚗 Deslocamento Rápido!', 'Velocidade > 20 km/h. Validado como Check-in Avulso (+1 Visita).');
      } else {
        setRedeemPointsToAdd(2);
      }
      setCountdown(90);
      setShowCouponModal(true);
    }
  };

  const handleCompleteRedemption = () => {
    setShowCouponModal(false);
    if (redeemingCafe) {
      const targetCafe = redeemingCafe;
      const isAlreadyKing = targetCafe.kingName === userProfile.name;
      const newMyVisits = targetCafe.myVisits + redeemPointsToAdd;
      let newKingName = targetCafe.kingName;
      let newKingVisits = targetCafe.kingVisits;
      const kmToAdd = redeemPointsToAdd === 2 ? 1.8 : 0;

      let updatedProfile = {
        ...userProfile,
        totalKm: parseFloat(((userProfile.totalKm || 0) + kmToAdd).toFixed(1)),
      };

      if (!isAlreadyKing && newMyVisits > targetCafe.kingVisits) {
        newKingName = userProfile.name;
        newKingVisits = newMyVisits;
        updatedProfile.crownsCount += 1;
        setCrownVictoryData({ cafeName: targetCafe.name, oldKing: targetCafe.kingName, newVisits: newMyVisits });
      }

      const updatedCafes = cafes.map((c) =>
        c.id === targetCafe.id ? { ...c, myVisits: newMyVisits, kingName: newKingName, kingVisits: newKingVisits } : c
      );

      setUserProfile(updatedProfile);
      setCafes(updatedCafes);
      persistData(updatedCafes, updatedProfile);

      // Post automático na comunidade
      const newPost = {
        id: String(Date.now()),
        authorName: userProfile.name,
        authorAvatar: userProfile.avatar || '🏃‍♂️',
        timeAgo: 'Agora mesmo',
        action: `Fez check-in em ${targetCafe.name} ☕`,
        stats: redeemPointsToAdd === 2 ? '🏃 1.8 km a pé • Bônus Corrida (+2 visitas)' : '📍 Check-in Avulso (+1 visita)',
        comment: `Aproveitando meu desconto de ${targetCafe.perk}!`,
        badge: null,
        cheersCount: 1,
        userHasCheered: true,
      };
      setPosts((prev) => [newPost, ...prev]);
    }
    if (activeRoute) handleCancelRoute();
    setRedeemingCafe(null);
  };

  // Interação de "Brinde" ☕ no Feed
  const handleToggleCheers = (postId: string) => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          const hasCheered = post.userHasCheered;
          return {
            ...post,
            userHasCheered: !hasCheered,
            cheersCount: hasCheered ? post.cheersCount - 1 : post.cheersCount + 1,
          };
        }
        return post;
      })
    );
  };

  // Confirmar presença no Run Club de Sábado
  const handleToggleEventAttendance = () => {
    if (isEventAttending) {
      setIsEventAttending(false);
      setEventAttendeesCount((prev) => prev - 1);
    } else {
      setIsEventAttending(true);
      setEventAttendeesCount((prev) => prev + 1);
      Alert.alert('Presença Confirmada! 🏃‍♂️☕', 'Te esperamos sábado às 08h na Praça Arautos da Paz (Taquaral). Leve sua garrafinha!');
    }
  };

  const handleUseCurrentLocationForCafe = () => {
    if (userCoords) {
      setFormLat(userCoords.lat.toFixed(4));
      setFormLng(userCoords.lng.toFixed(4));
      Alert.alert('GPS Capturado 📍', 'Coordenadas preenchidas com sucesso!');
    }
  };

  const handleSaveNewCafe = () => {
    if (!formName.trim() || !formAddress.trim()) {
      Alert.alert('Atenção', 'Informe nome e endereço.');
      return;
    }
    const newCafe = {
      id: String(Date.now()),
      name: formName.trim(),
      address: formAddress.trim(),
      lat: parseFloat(formLat) || -22.8990,
      lng: parseFloat(formLng) || -47.0510,
      kingName: 'Sem Rei',
      kingVisits: 0,
      myVisits: 0,
      perk: formPerk.trim() || '10% de boas-vindas RunCoffee',
      instagram: formInstagram.trim() || '@cafeteria',
    };
    const updatedCafes = [...cafes, newCafe];
    setCafes(updatedCafes);
    persistData(updatedCafes, userProfile);
    setFormName(''); setFormAddress(''); setFormInstagram(''); setFormPerk('');
    setShowAddCafeModal(false);
    Alert.alert('Sucesso!', `${newCafe.name} adicionado ao mapa.`);
  };

  const handleResetData = () => {
    Alert.alert('Resetar Placar', 'Deseja resetar os dados de teste?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Resetar',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.clear();
          setCafes(INITIAL_CAFES);
          setUserProfile(INITIAL_PROFILE);
          setOnboardingDone(false);
          setOnboardingStep(0);
          Alert.alert('Pronto', 'Dados reiniciados e Onboarding liberado.');
        },
      },
    ]);
  };

  // =========================================================================
  // TELA DE ONBOARDING
  // =========================================================================
  if (onboardingDone === false) {
    const isSignupStep = onboardingStep === 3;
    const currentSlide = ONBOARDING_SLIDES[onboardingStep] || ONBOARDING_SLIDES[0];

    return (
      <View style={styles.onboardingContainer}>
        <StatusBar style="light" />

        <View style={styles.onboardingTopBar}>
          <Text style={styles.onboardingBrand}>RunCoffee ☕🏃</Text>
          {!isSignupStep && (
            <TouchableOpacity onPress={() => setOnboardingStep(3)}>
              <Text style={styles.onboardingSkipText}>Pular</Text>
            </TouchableOpacity>
          )}
        </View>

        {!isSignupStep ? (
          <View style={styles.onboardingSlideContent}>
            <View style={styles.onboardingIconCircle}>
              <Text style={styles.onboardingBigIcon}>{currentSlide.icon}</Text>
            </View>
            <Text style={styles.onboardingSlideTitle}>{currentSlide.title}</Text>
            <Text style={styles.onboardingSlideSubtitle}>{currentSlide.subtitle}</Text>
          </View>
        ) : (
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            style={styles.onboardingSignupContent}
          >
            <Text style={styles.signupBadge}>SEU PERFIL DE ATLETA</Text>
            <Text style={styles.signupTitle}>Como você quer aparecer no mapa?</Text>
            <Text style={styles.signupSubtitle}>Sua foto ou ícone aparecerá no topo do Reinado quando assumir o trono.</Text>

            <TouchableOpacity style={styles.photoPickerContainer} onPress={handlePickImage}>
              {signupPhotoUri ? (
                <Image source={{ uri: signupPhotoUri }} style={styles.avatarUploadedImg} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Text style={styles.photoPlaceholderIcon}>📷</Text>
                  <Text style={styles.photoPlaceholderText}>Subir Foto</Text>
                </View>
              )}
            </TouchableOpacity>

            <TextInput
              style={styles.signupInput}
              value={signupName}
              onChangeText={setSignupName}
              placeholder="Seu nome ou apelido"
              placeholderTextColor="#999"
            />

            {!signupPhotoUri && (
              <>
                <Text style={styles.avatarPickerLabel}>Ou escolha um ícone rápido:</Text>
                <View style={styles.avatarRow}>
                  {['🏃‍♂️', '🏃‍♀️', '☕', '⚡', '🕶️'].map((av) => (
                    <TouchableOpacity
                      key={av}
                      style={[styles.avatarChoiceBtn, signupAvatar === av ? styles.avatarChoiceSelected : null]}
                      onPress={() => setSignupAvatar(av)}
                    >
                      <Text style={styles.avatarChoiceText}>{av}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </KeyboardAvoidingView>
        )}

        <View style={styles.onboardingFooter}>
          <View style={styles.dotsRow}>
            {[0, 1, 2, 3].map((dot) => (
              <View 
                key={dot} 
                style={[styles.dotPill, onboardingStep === dot ? styles.dotPillActive : null]} 
              />
            ))}
          </View>

          <TouchableOpacity
            style={styles.onboardingNextBtn}
            onPress={() => {
              if (onboardingStep < 3) {
                setOnboardingStep(prev => prev + 1);
              } else {
                handleFinishOnboarding();
              }
            }}
          >
            <Text style={styles.onboardingNextBtnText}>
              {onboardingStep < 3 ? 'Avançar ➔' : 'Entrar no RunCoffee 🚀'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // =========================================================================
  // APP PRINCIPAL
  // =========================================================================
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" />

      {/* CABEÇALHO */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View>
            <Text style={styles.headerTitle}>RunCoffee ☕🏃</Text>
            <Text style={styles.headerSubtitle}>Campinas / SP • Club Urbano</Text>
          </View>
          <TouchableOpacity style={styles.headerAddBtn} onPress={() => setShowAddCafeModal(true)}>
            <Text style={styles.headerAddBtnText}>➕ Indicar Café</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabContentArea}>

        {/* ==================== ABA 1: MAPA ==================== */}
        {activeTab === 'map' && (
          <View style={{ flex: 1 }}>
            <WebView
              ref={webViewRef}
              originWhitelist={['*']}
              source={{ html: mapHtml }}
              style={styles.webview}
              onMessage={handleMessage}
            />

            <TouchableOpacity style={styles.gpsButton} onPress={handleRecenter}>
              <Text style={styles.gpsButtonText}>🎯</Text>
            </TouchableOpacity>

            {activeCircuit && (
              <View style={styles.circuitSheet}>
                <View style={styles.routeHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.circuitBadgeLabel}>{activeCircuit.badge}</Text>
                    <Text style={styles.routeDest}>{activeCircuit.title}</Text>
                  </View>
                  <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelCircuit}>
                    <Text style={styles.cancelBtnText}>✕ Sair</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.circuitProgressText}>
                  🏁 Progresso: {circuitCompletedCafeIds.length} de {activeCircuit.cafeIds.length} paradas
                </Text>

                <View style={styles.stopsList}>
                  {activeCircuit.cafeIds.map((cId: string, index: number) => {
                    const cafeObj = cafes.find((c) => c.id === cId);
                    const isChecked = circuitCompletedCafeIds.includes(cId);
                    return (
                      <View key={cId} style={styles.stopItem}>
                        <Text style={styles.stopIcon}>{isChecked ? '✅' : '📍'}</Text>
                        <Text style={[styles.stopName, isChecked ? styles.stopNameChecked : null]}>
                          {index + 1}. {cafeObj?.name}
                        </Text>
                      </View>
                    );
                  })}
                </View>

                {circuitCompletedCafeIds.length < activeCircuit.cafeIds.length ? (
                  <TouchableOpacity 
                    style={styles.simulateStopBtn}
                    onPress={handleAdvanceCircuitStop}
                  >
                    <Text style={styles.simulateStopBtnText}>🧪 Carimbar Próxima Parada</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity 
                    style={styles.circuitDoneBox}
                    onPress={() => setUnlockedMedal(activeCircuit.badge)}
                  >
                    <Text style={styles.circuitDoneText}>🎉 Circuito 100% Concluído!</Text>
                    <Text style={styles.circuitDoneSubText}>Toque aqui para ver sua Medalha 🏅</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {!activeCircuit && activeRoute && (
              <View style={styles.activeRouteSheet}>
                <View style={styles.routeHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.routeTitle}>
                      {isArrived ? '🎉 Você chegou!' : '🏃 Rota em Andamento'}
                    </Text>
                    <Text style={styles.routeDest}>{activeRoute.cafe?.name}</Text>
                  </View>
                  <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelRoute}>
                    <Text style={styles.cancelBtnText}>✕ Sair</Text>
                  </TouchableOpacity>
                </View>

                {isVehicleDetected && (
                  <View style={styles.vehicleAlertBox}>
                    <Text style={styles.vehicleAlertText}>
                      ⚠️ Velocidade &gt; 20 km/h! Convertido em visita normal (+1).
                    </Text>
                  </View>
                )}

                {!isArrived ? (
                  <>
                    <View style={styles.statsRow}>
                      <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Distância</Text>
                        <Text style={styles.statValue}>📍 {activeRoute.distance}</Text>
                      </View>
                      <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Tempo a pé</Text>
                        <Text style={styles.statValue}>⏱️ {activeRoute.duration}</Text>
                      </View>
                      <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Velocidade</Text>
                        <Text style={[styles.statValue, currentSpeedKmh > 20 ? { color: '#dc3545' } : null]}>
                          ⚡ {currentSpeedKmh} km/h
                        </Text>
                      </View>
                    </View>

                    <View style={styles.simulationRow}>
                      <TouchableOpacity 
                        style={styles.simulateWalkBtn} 
                        onPress={() => {
                          setIsVehicleDetected(false);
                          setIsArrived(true);
                        }}
                      >
                        <Text style={styles.simulateWalkText}>🏃 Simular Chegada a Pé</Text>
                      </TouchableOpacity>

                      <TouchableOpacity 
                        style={styles.simulateCarBtn} 
                        onPress={() => {
                          setIsVehicleDetected(true);
                          setIsArrived(true);
                        }}
                      >
                        <Text style={styles.simulateCarText}>🚗 Simular Carro</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <TouchableOpacity style={styles.checkinButton} onPress={handleOpenCouponFromRoute}>
                    <Text style={styles.checkinButtonText}>
                      {isVehicleDetected ? '📍 Check-in Automóvel (+1 Visita)' : '🎁 Check-in Corrida (+2 Visitas)'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {!activeCircuit && !activeRoute && selectedCafe && (
              <View style={styles.bottomSheet}>
                <View style={styles.sheetHeader}>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={styles.cafeTitle}>{selectedCafe.name}</Text>
                    <Text style={styles.cafeAddress}>{selectedCafe.address}</Text>
                    {selectedCafe.instagram ? (
                      <Text style={styles.cafeInstagram}>{selectedCafe.instagram}</Text>
                    ) : null}
                  </View>
                  <TouchableOpacity onPress={() => setSelectedCafe(null)}>
                    <Text style={styles.closeBtn}>✕</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.badgesContainer}>
                  <View style={[
                    styles.kingBadge,
                    selectedCafe.kingName === userProfile.name ? styles.myKingBadge : null
                  ]}>
                    <Text style={styles.kingText}>
                      {selectedCafe.kingName === userProfile.name
                        ? `👑 VOCÊ É O REI! (${selectedCafe.kingVisits} visitas)`
                        : `👑 Rei: ${selectedCafe.kingName} (${selectedCafe.kingVisits} visitas) • Suas: ${selectedCafe.myVisits}`}
                    </Text>
                  </View>

                  <View style={styles.perkBadge}>
                    <Text style={styles.perkText}>🎁 Benefício: {selectedCafe.perk}</Text>
                  </View>
                </View>

                <View style={styles.modalitiesContainer}>
                  <TouchableOpacity
                    style={styles.btnRoute}
                    onPress={() => handleStartRoute(selectedCafe)}
                  >
                    <Text style={styles.btnText}>🏃 Ir a Pé (+2 Visitas)</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.btnPitStop}
                    onPress={() => handleDirectCheckin(selectedCafe)}
                  >
                    <Text style={styles.btnPitStopText}>📍 Check-in Avulso (+1 Visita)</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}

        {/* ==================== ABA 2: CIRCUITOS ==================== */}
        {activeTab === 'circuits' && (
          <ScrollView style={styles.tabScreenScroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.tabSectionTitle}>Desafios Urbanos de Campinas 🏃‍♂️☕</Text>
            <Text style={styles.tabSectionSubtitle}>
              Percorra todas as cafeterias do circuito para faturar medalhas exclusivas e defender seu reinado.
            </Text>

            {CIRCUITS.map((circ) => {
              const circuitCafes = cafes.filter((c) => circ.cafeIds.includes(c.id));
              const hasMedal = userProfile.medals?.includes(circ.badge);

              return (
                <View key={circ.id} style={styles.circuitCard}>
                  <View style={styles.circuitCardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.circuitCardBadge}>{circ.badge}</Text>
                      <Text style={styles.circuitCardTitle}>{circ.title}</Text>
                    </View>
                    <View style={styles.distanceBadge}>
                      <Text style={styles.distanceBadgeText}>{circ.distance}</Text>
                    </View>
                  </View>

                  <Text style={styles.circuitCardDesc}>{circ.desc}</Text>

                  <View style={styles.circuitCardStopsBox}>
                    <Text style={styles.circuitCardStopsTitle}>Paradas Obrigatórias:</Text>
                    {circuitCafes.map((c) => (
                      <Text key={c.id} style={styles.circuitCardStopText}>
                        • {c.name} ({c.address.split('-')[1]?.trim() || 'Campinas'})
                      </Text>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={styles.startCircuitBtn}
                    onPress={() => handleSelectCircuit(circ)}
                  >
                    <Text style={styles.startCircuitBtnText}>
                      {hasMedal ? 'Correr Novamente 🏃' : 'Iniciar Desafio no Mapa 🚀'}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </ScrollView>
        )}

        {/* ==================== ABA 3: NOVO! COMUNIDADE (FEED SOCIAL) ==================== */}
        {activeTab === 'community' && (
          <ScrollView style={styles.tabScreenScroll} showsVerticalScrollIndicator={false}>
            {/* CARROSSEL DOS REIS ATUAIS */}
            <Text style={styles.communitySectionTitle}>👑 Reis de Campinas nesta Semana</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.kingsCarousel}>
              {cafes.map((cafe) => (
                <View key={cafe.id} style={styles.kingCarouselCard}>
                  <View style={styles.kingCrownBadge}>
                    <Text style={{ fontSize: 13 }}>👑</Text>
                  </View>
                  <View style={styles.kingAvatarCircle}>
                    <Text style={{ fontSize: 20 }}>
                      {cafe.kingName === userProfile.name ? (userProfile.avatar || '🏃‍♂️') : '☕'}
                    </Text>
                  </View>
                  <Text style={styles.kingCardName} numberOfLines={1}>
                    {cafe.kingName === userProfile.name ? 'Você!' : cafe.kingName}
                  </Text>
                  <Text style={styles.kingCardCafe} numberOfLines={1}>{cafe.name.split(' ')[0]}</Text>
                  <Text style={styles.kingCardVisits}>{cafe.kingVisits} visitas</Text>
                </View>
              ))}
            </ScrollView>

            {/* EVENTO RUN CLUB DE SÁBADO */}
            <View style={styles.eventCard}>
              <View style={styles.eventHeaderRow}>
                <Text style={styles.eventTag}>🏃‍♂️ TREINO COLETIVO</Text>
                <Text style={styles.eventDate}>Sábado • 08h00</Text>
              </View>
              <Text style={styles.eventTitle}>Coffee Run Taquaral ➔ Cambuí (5k)</Text>
              <Text style={styles.eventDesc}>
                Saída na Praça Arautos da Paz, volta pela lagoa e chegada com café especial e hidratação na Abigail Coffee Co.
              </Text>
              <TouchableOpacity 
                style={[styles.eventAttendBtn, isEventAttending ? styles.eventAttendingActive : null]}
                onPress={handleToggleEventAttendance}
              >
                <Text style={[styles.eventAttendBtnText, isEventAttending ? styles.eventAttendingActiveText : null]}>
                  {isEventAttending ? '✓ Presença Confirmada!' : `Bora Correr Junto! (${eventAttendeesCount} atletas)`}
                </Text>
              </TouchableOpacity>
            </View>

            {/* FEED DE ATIVIDADES RECENTES */}
            <Text style={styles.communitySectionTitle}>☕ Atividades Recentes na Cidade</Text>
            {posts.map((post) => (
              <View key={post.id} style={styles.feedCard}>
                <View style={styles.feedCardHeader}>
                  <View style={styles.feedAvatarCircle}>
                    <Text style={{ fontSize: 20 }}>{post.authorAvatar}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.feedAuthorName}>{post.authorName}</Text>
                    <Text style={styles.feedActionText}>{post.action}</Text>
                  </View>
                  <Text style={styles.feedTimeAgo}>{post.timeAgo}</Text>
                </View>

                {post.stats ? (
                  <View style={styles.feedStatsBox}>
                    <Text style={styles.feedStatsText}>{post.stats}</Text>
                  </View>
                ) : null}

                {post.comment ? (
                  <Text style={styles.feedCommentText}>"{post.comment}"</Text>
                ) : null}

                {post.badge ? (
                  <View style={styles.feedBadgePill}>
                    <Text style={styles.feedBadgeText}>{post.badge}</Text>
                  </View>
                ) : null}

                {/* BOTÃO INTERATIVO DE BRINDE ☕ */}
                <View style={styles.feedFooterRow}>
                  <TouchableOpacity 
                    style={[styles.cheersButton, post.userHasCheered ? styles.cheersButtonActive : null]}
                    onPress={() => handleToggleCheers(post.id)}
                  >
                    <Text style={styles.cheersIcon}>☕</Text>
                    <Text style={[styles.cheersText, post.userHasCheered ? styles.cheersTextActive : null]}>
                      {post.userHasCheered ? 'Brindado!' : 'Brinde!'} ({post.cheersCount})
                    </Text>
                  </TouchableOpacity>
                  <Text style={styles.feedCityTag}>📍 Campinas, SP</Text>
                </View>
              </View>
            ))}
            <View style={{ height: 30 }} />
          </ScrollView>
        )}

        {/* ==================== ABA 4: PERFIL ==================== */}
        {activeTab === 'profile' && (
          <ScrollView style={styles.tabScreenScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.profileHeaderCard}>
              <TouchableOpacity style={styles.avatarCircle} onPress={handlePickImage}>
                {userProfile.photoUri ? (
                  <Image source={{ uri: userProfile.photoUri }} style={styles.avatarProfileImg} />
                ) : (
                  <Text style={styles.avatarText}>{userProfile.avatar || '🏃‍♂️'}</Text>
                )}
                <View style={styles.editPhotoBadge}>
                  <Text style={{ fontSize: 10 }}>📷</Text>
                </View>
              </TouchableOpacity>
              <Text style={styles.profileBigName}>{userProfile.name}</Text>
              <Text style={styles.profileRoleText}>Coffee Explorer • Campinas</Text>

              <View style={styles.profileStatsGrid}>
                <View style={styles.profileGridItem}>
                  <Text style={styles.profileGridVal}>🏃 {userProfile.totalKm}</Text>
                  <Text style={styles.profileGridLabel}>km a pé</Text>
                </View>
                <View style={styles.profileGridItem}>
                  <Text style={styles.profileGridVal}>👑 {userProfile.crownsCount}</Text>
                  <Text style={styles.profileGridLabel}>Reinados</Text>
                </View>
                <View style={styles.profileGridItem}>
                  <Text style={styles.profileGridVal}>🏅 {userProfile.medals?.length || 0}</Text>
                  <Text style={styles.profileGridLabel}>Medalhas</Text>
                </View>
              </View>
            </View>

            {/* Sala de Troféus */}
            <View style={styles.profileSection}>
              <Text style={styles.profileSectionTitle}>🏆 Suas Medalhas Conquistadas</Text>
              <View style={styles.medalsWrap}>
                {userProfile.medals?.map((med, idx) => (
                  <View key={idx} style={styles.medalPill}>
                    <Text style={styles.medalPillText}>{med}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Cafeterias do Rei */}
            <View style={styles.profileSection}>
              <Text style={styles.profileSectionTitle}>👑 Seus Reinados em Campinas</Text>
              {cafes.filter((c) => c.kingName === userProfile.name).length > 0 ? (
                cafes
                  .filter((c) => c.kingName === userProfile.name)
                  .map((c) => (
                    <View key={c.id} style={styles.kingCafeCard}>
                      <Text style={styles.kingCafeTitle}>☕ {c.name}</Text>
                      <Text style={styles.kingCafeDesc}>
                        Você é o Rei com {c.kingVisits} visitas registradas.
                      </Text>
                    </View>
                  ))
              ) : (
                <Text style={styles.noKingsText}>Você ainda não possui reinados. Corra até uma cafeteria para conquistar a coroa!</Text>
              )}
            </View>

            <TouchableOpacity 
              style={styles.seeOnboardingBtn}
              onPress={() => {
                setOnboardingStep(0);
                setOnboardingDone(false);
              }}
            >
              <Text style={styles.seeOnboardingBtnText}>✨ Rever Apresentação do App</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.resetBtn} onLongPress={handleResetData}>
              <Text style={styles.resetBtnText}>Segure para Resetar Dados de Teste</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

      </View>

      {/* ==================== BARRA DE NAVEGAÇÃO INFERIOR COM 4 ABAS ==================== */}
      <View style={styles.bottomTabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('map')}>
          <Text style={styles.tabIcon}>🗺️</Text>
          <Text style={[styles.tabLabel, activeTab === 'map' ? styles.tabLabelActive : null]}>Mapa</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('circuits')}>
          <Text style={styles.tabIcon}>🏃</Text>
          <Text style={[styles.tabLabel, activeTab === 'circuits' ? styles.tabLabelActive : null]}>Circuitos</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('community')}>
          <Text style={styles.tabIcon}>👥</Text>
          <Text style={[styles.tabLabel, activeTab === 'community' ? styles.tabLabelActive : null]}>Comunidade</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('profile')}>
          <Text style={styles.tabIcon}>👤</Text>
          <Text style={[styles.tabLabel, activeTab === 'profile' ? styles.tabLabelActive : null]}>Perfil</Text>
        </TouchableOpacity>
      </View>

      {/* MODAL 1: CUPOM */}
      <Modal visible={showCouponModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.couponCard}>
            <Text style={styles.couponBadge}>
              {redeemPointsToAdd === 2 ? '🏃 BÔNUS CORRIDA: +2 VISITAS' : '☕ CHECK-IN: +1 VISITA'}
            </Text>
            <Text style={styles.couponCafeName}>{redeemingCafe?.name}</Text>
            
            <View style={styles.perkHighlightBox}>
              <Text style={styles.perkHighlightLabel}>Seu Desconto do Dia:</Text>
              <Text style={styles.perkHighlightValue}>{redeemingCafe?.perk}</Text>
            </View>

            <View style={styles.timerContainer}>
              <Text style={styles.timerLabel}>Apresente ao barista no balcão:</Text>
              <Text style={styles.timerValue}>⏱️ {formatTimer(countdown)}</Text>
              <Text style={styles.timerSub}>Válido apenas enquanto o relógio estiver ativo</Text>
            </View>

            <TouchableOpacity style={styles.confirmRedeemBtn} onPress={handleCompleteRedemption}>
              <Text style={styles.confirmRedeemText}>Benefício Aplicado no Caixa ✓</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: COROA */}
      <Modal visible={!!crownVictoryData} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.victoryCard}>
            <Text style={styles.victoryIcon}>👑</Text>
            <Text style={styles.victoryTitle}>NOVO REI COROADO!</Text>
            <Text style={styles.victoryDesc}>
              Parabéns, <Text style={{ fontWeight: 'bold' }}>{userProfile.name}</Text>! Você atingiu{' '}
              <Text style={{ fontWeight: 'bold' }}>{crownVictoryData?.newVisits} visitas</Text>, superou{' '}
              <Text style={{ fontWeight: 'bold' }}>{crownVictoryData?.oldKing}</Text> e assumiu o reinado do{' '}
              <Text style={{ fontWeight: 'bold' }}>{crownVictoryData?.cafeName}</Text>!
            </Text>
            <TouchableOpacity style={styles.victoryBtn} onPress={() => setCrownVictoryData(null)}>
              <Text style={styles.victoryBtnText}>Defender Meu Trono 🏆</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL 3: MEDALHA */}
      <Modal visible={Boolean(unlockedMedal)} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.medalCard}>
            <Text style={styles.medalIcon}>🏅</Text>
            <Text style={styles.medalTitle}>DESAFIO CONCLUÍDO!</Text>
            <Text style={styles.medalSubtitle}>{unlockedMedal}</Text>
            <Text style={styles.medalDesc}>
              Incrível, {userProfile.name}! Você percorreu todas as paradas do circuito, acumulou os quilômetros no seu perfil e faturou esta medalha exclusiva!
            </Text>
            <TouchableOpacity style={styles.medalBtn} onPress={() => setUnlockedMedal(null)}>
              <Text style={styles.medalBtnText}>Colecionar Medalha 🌟</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL 4: FORMULÁRIO DE INDICAÇÃO */}
      <Modal visible={showAddCafeModal} animationType="slide" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.formCard}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>☕ Indicar Nova Cafeteria</Text>
              <TouchableOpacity onPress={() => setShowAddCafeModal(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ width: '100%' }}>
              <Text style={styles.formLabel}>Nome da Cafeteria *</Text>
              <TextInput style={styles.formInput} placeholder="Ex: Kazu Café" placeholderTextColor="#999" value={formName} onChangeText={setFormName} />

              <Text style={styles.formLabel}>Endereço ou Bairro *</Text>
              <TextInput style={styles.formInput} placeholder="Ex: R. Dr. Emílio Ribas - Cambuí" placeholderTextColor="#999" value={formAddress} onChangeText={setFormAddress} />

              <Text style={styles.formLabel}>Instagram da Cafeteria</Text>
              <TextInput style={styles.formInput} placeholder="Ex: @kazucafe" placeholderTextColor="#999" value={formInstagram} onChangeText={setFormInstagram} />

              <Text style={styles.formLabel}>Mimo ou Sugestão de Parceria</Text>
              <TextInput style={styles.formInput} placeholder="Ex: 10% off ou água gelada para corredores" placeholderTextColor="#999" value={formPerk} onChangeText={setFormPerk} />

              <TouchableOpacity style={styles.useGpsBtn} onPress={handleUseCurrentLocationForCafe}>
                <Text style={styles.useGpsBtnText}>📍 Estou no local (Preencher meu GPS)</Text>
              </TouchableOpacity>

              <View style={styles.coordsRow}>
                <View style={{ flex: 1, marginRight: 6 }}>
                  <Text style={styles.formSmallLabel}>Latitude:</Text>
                  <TextInput style={styles.formInputSmall} value={formLat} onChangeText={setFormLat} keyboardType="numeric" />
                </View>
                <View style={{ flex: 1, marginLeft: 6 }}>
                  <Text style={styles.formSmallLabel}>Longitude:</Text>
                  <TextInput style={styles.formInputSmall} value={formLng} onChangeText={setFormLng} keyboardType="numeric" />
                </View>
              </View>

              <TouchableOpacity style={styles.submitFormBtn} onPress={handleSaveNewCafe}>
                <Text style={styles.submitFormBtnText}>Salvar Indicação no Mapa ✓</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2b1b17',
  },
  onboardingContainer: {
    flex: 1,
    backgroundColor: '#2b1b17',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 45,
    paddingBottom: Platform.OS === 'ios' ? 40 : 25,
    justifyContent: 'space-between',
  },
  onboardingTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  onboardingBrand: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#d4a373',
    letterSpacing: 1,
  },
  onboardingSkipText: {
    color: '#a89f91',
    fontSize: 14,
    fontWeight: '600',
  },
  onboardingSlideContent: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  onboardingIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(212, 163, 115, 0.15)',
    borderWidth: 2,
    borderColor: '#d4a373',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 35,
    shadowColor: '#d4a373',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 15,
  },
  onboardingBigIcon: {
    fontSize: 50,
  },
  onboardingSlideTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  onboardingSlideSubtitle: {
    fontSize: 15,
    color: '#d4a373',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 15,
  },
  onboardingSignupContent: {
    alignItems: 'center',
    width: '100%',
  },
  signupBadge: {
    backgroundColor: 'rgba(212, 163, 115, 0.2)',
    color: '#d4a373',
    fontSize: 11,
    fontWeight: 'bold',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 12,
    letterSpacing: 1,
  },
  signupTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  signupSubtitle: {
    fontSize: 13,
    color: '#adb5bd',
    textAlign: 'center',
    marginBottom: 20,
  },
  photoPickerContainer: {
    marginBottom: 18,
  },
  photoPlaceholder: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(212, 163, 115, 0.15)',
    borderWidth: 2,
    borderColor: '#d4a373',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderIcon: {
    fontSize: 26,
  },
  photoPlaceholderText: {
    fontSize: 10,
    color: '#d4a373',
    fontWeight: 'bold',
    marginTop: 2,
  },
  avatarUploadedImg: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2,
    borderColor: '#ffd700',
  },
  signupInput: {
    width: '100%',
    backgroundColor: '#3d2721',
    borderWidth: 1.5,
    borderColor: '#d4a373',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  avatarPickerLabel: {
    fontSize: 12,
    color: '#d4a373',
    fontWeight: '600',
    marginBottom: 10,
  },
  avatarRow: {
    flexDirection: 'row',
    gap: 12,
  },
  avatarChoiceBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3d2721',
    borderWidth: 1.5,
    borderColor: 'rgba(212, 163, 115, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarChoiceSelected: {
    borderColor: '#ffd700',
    backgroundColor: 'rgba(255, 215, 0, 0.25)',
    transform: [{ scale: 1.15 }],
  },
  avatarChoiceText: {
    fontSize: 22,
  },
  onboardingFooter: {
    width: '100%',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  dotPill: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  dotPillActive: {
    width: 24,
    backgroundColor: '#d4a373',
  },
  onboardingNextBtn: {
    backgroundColor: '#d4a373',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#d4a373',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  onboardingNextBtnText: {
    color: '#2b1b17',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'ios' ? 55 : 40,
    paddingBottom: 14,
    backgroundColor: '#2b1b17',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#d4a373',
    marginTop: 2,
    fontWeight: '500',
  },
  headerAddBtn: {
    backgroundColor: '#7f4f24',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d4a373',
  },
  headerAddBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tabContentArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  webview: {
    flex: 1,
  },
  gpsButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: '#fff',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#7f4f24',
  },
  gpsButtonText: {
    fontSize: 22,
  },
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: '#2b1b17',
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 163, 115, 0.25)',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 11,
    color: '#a89f91',
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#d4a373',
    fontWeight: 'bold',
  },
  tabScreenScroll: {
    flex: 1,
    padding: 18,
    backgroundColor: '#f8f9fa',
  },
  tabSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2b1b17',
    marginBottom: 4,
  },
  tabSectionSubtitle: {
    fontSize: 13,
    color: '#6c757d',
    lineHeight: 18,
    marginBottom: 16,
  },
  // ESTILOS DA ABA COMUNIDADE
  communitySectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2b1b17',
    marginBottom: 12,
    marginTop: 4,
  },
  kingsCarousel: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  kingCarouselCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    marginRight: 10,
    width: 105,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  kingCrownBadge: {
    position: 'absolute',
    top: 6,
    right: 8,
  },
  kingAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fdf7f2',
    borderWidth: 1.5,
    borderColor: '#d4a373',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    marginTop: 4,
  },
  kingCardName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2b1b17',
    textAlign: 'center',
  },
  kingCardCafe: {
    fontSize: 10,
    color: '#7f4f24',
    fontWeight: '600',
    marginTop: 1,
    textAlign: 'center',
  },
  kingCardVisits: {
    fontSize: 10,
    color: '#adb5bd',
    marginTop: 2,
  },
  // Card de Evento
  eventCard: {
    backgroundColor: '#2b1b17',
    borderRadius: 18,
    padding: 18,
    marginBottom: 22,
    borderWidth: 1.5,
    borderColor: '#d4a373',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  eventHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventTag: {
    backgroundColor: '#d4a373',
    color: '#2b1b17',
    fontSize: 10,
    fontWeight: 'bold',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    letterSpacing: 0.5,
  },
  eventDate: {
    color: '#d4a373',
    fontSize: 12,
    fontWeight: 'bold',
  },
  eventTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  eventDesc: {
    fontSize: 12,
    color: '#d4a373',
    lineHeight: 18,
    marginBottom: 14,
  },
  eventAttendBtn: {
    backgroundColor: '#d4a373',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  eventAttendingActive: {
    backgroundColor: '#28a745',
  },
  eventAttendBtnText: {
    color: '#2b1b17',
    fontWeight: 'bold',
    fontSize: 13,
  },
  eventAttendingActiveText: {
    color: '#fff',
  },
  // Feed Cards
  feedCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 2,
  },
  feedCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  feedAvatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ced4da',
  },
  feedAuthorName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2b1b17',
  },
  feedActionText: {
    fontSize: 12,
    color: '#7f4f24',
    fontWeight: '600',
    marginTop: 1,
  },
  feedTimeAgo: {
    fontSize: 11,
    color: '#adb5bd',
  },
  feedStatsBox: {
    backgroundColor: '#fdf7f2',
    padding: 8,
    borderRadius: 8,
    marginVertical: 8,
  },
  feedStatsText: {
    fontSize: 12,
    color: '#7f4f24',
    fontWeight: 'bold',
  },
  feedCommentText: {
    fontSize: 13,
    color: '#495057',
    fontStyle: 'italic',
    lineHeight: 18,
    marginBottom: 8,
  },
  feedBadgePill: {
    backgroundColor: '#e8f5e9',
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginBottom: 10,
  },
  feedBadgeText: {
    fontSize: 11,
    color: '#2e7d32',
    fontWeight: 'bold',
  },
  feedFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f3f5',
    paddingTop: 10,
    marginTop: 4,
  },
  cheersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  cheersButtonActive: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffeeba',
  },
  cheersIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  cheersText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#495057',
  },
  cheersTextActive: {
    color: '#856404',
  },
  feedCityTag: {
    fontSize: 11,
    color: '#adb5bd',
  },
  // CIRCUITOS
  circuitCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  circuitCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  circuitCardBadge: {
    fontSize: 11,
    color: '#7f4f24',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  circuitCardTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#2b1b17',
    marginTop: 2,
  },
  distanceBadge: {
    backgroundColor: '#fdf7f2',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d4a373',
  },
  distanceBadgeText: {
    fontSize: 12,
    color: '#7f4f24',
    fontWeight: 'bold',
  },
  circuitCardDesc: {
    fontSize: 13,
    color: '#6c757d',
    marginVertical: 10,
    lineHeight: 18,
  },
  circuitCardStopsBox: {
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 10,
    marginBottom: 14,
  },
  circuitCardStopsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#495057',
    marginBottom: 4,
  },
  circuitCardStopText: {
    fontSize: 12,
    color: '#6c757d',
    lineHeight: 18,
  },
  startCircuitBtn: {
    backgroundColor: '#7f4f24',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  startCircuitBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  // PERFIL
  profileHeaderCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 20,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#2b1b17',
    borderWidth: 3,
    borderColor: '#d4a373',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    position: 'relative',
  },
  avatarProfileImg: {
    width: 66,
    height: 66,
    borderRadius: 33,
  },
  editPhotoBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#fff',
    padding: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d4a373',
  },
  avatarText: {
    fontSize: 32,
  },
  profileBigName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2b1b17',
  },
  profileRoleText: {
    fontSize: 13,
    color: '#7f4f24',
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 16,
  },
  profileStatsGrid: {
    flexDirection: 'row',
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#f1f3f5',
    paddingTop: 14,
  },
  profileGridItem: {
    flex: 1,
    alignItems: 'center',
  },
  profileGridVal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2b1b17',
  },
  profileGridLabel: {
    fontSize: 11,
    color: '#6c757d',
    marginTop: 2,
  },
  profileSection: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 2,
  },
  profileSectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#2b1b17',
    marginBottom: 12,
  },
  medalsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  medalPill: {
    backgroundColor: '#fdf7f2',
    borderWidth: 1,
    borderColor: '#d4a373',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  medalPillText: {
    fontSize: 12,
    color: '#7f4f24',
    fontWeight: 'bold',
  },
  kingCafeCard: {
    backgroundColor: '#fff9db',
    borderWidth: 1,
    borderColor: '#ffe066',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  kingCafeTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#856404',
  },
  kingCafeDesc: {
    fontSize: 12,
    color: '#664d03',
    marginTop: 2,
  },
  noKingsText: {
    fontSize: 12,
    color: '#6c757d',
    fontStyle: 'italic',
  },
  seeOnboardingBtn: {
    backgroundColor: '#fdf7f2',
    borderWidth: 1.5,
    borderColor: '#d4a373',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 14,
  },
  seeOnboardingBtnText: {
    color: '#7f4f24',
    fontSize: 13,
    fontWeight: 'bold',
  },
  resetBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 40,
  },
  resetBtnText: {
    fontSize: 12,
    color: '#adb5bd',
    textDecorationLine: 'underline',
  },
  circuitSheet: {
    position: 'absolute',
    bottom: 25,
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 7,
    elevation: 10,
    borderWidth: 2,
    borderColor: '#d4a373',
  },
  circuitBadgeLabel: {
    fontSize: 11,
    color: '#b07d4b',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  circuitProgressText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#2b1b17',
    marginTop: 8,
    marginBottom: 6,
  },
  stopsList: {
    gap: 4,
    marginVertical: 6,
  },
  stopItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
  },
  stopIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  stopName: {
    fontSize: 13,
    color: '#495057',
    fontWeight: '500',
  },
  stopNameChecked: {
    textDecorationLine: 'line-through',
    color: '#28a745',
    fontWeight: 'bold',
  },
  simulateStopBtn: {
    marginTop: 10,
    backgroundColor: '#2b1b17',
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
  },
  simulateStopBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  circuitDoneBox: {
    marginTop: 10,
    backgroundColor: '#d4edda',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#c3e6cb',
  },
  circuitDoneText: {
    color: '#155724',
    fontWeight: 'bold',
    fontSize: 14,
  },
  circuitDoneSubText: {
    color: '#28a745',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  activeRouteSheet: {
    position: 'absolute',
    bottom: 25,
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 7,
    elevation: 10,
    borderWidth: 2,
    borderColor: '#7f4f24',
  },
  routeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  routeTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#7f4f24',
    textTransform: 'uppercase',
  },
  routeDest: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2b1b17',
    marginTop: 2,
  },
  cancelBtn: {
    backgroundColor: '#f8d7da',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  cancelBtnText: {
    color: '#721c24',
    fontSize: 12,
    fontWeight: 'bold',
  },
  vehicleAlertBox: {
    backgroundColor: '#fff3cd',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#ffeeba',
  },
  vehicleAlertText: {
    color: '#856404',
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 16,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: '#6c757d',
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2b1b17',
    marginTop: 2,
  },
  simulationRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  simulateWalkBtn: {
    flex: 1,
    paddingVertical: 9,
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#c8e6c9',
  },
  simulateWalkText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  simulateCarBtn: {
    flex: 1,
    paddingVertical: 9,
    backgroundColor: '#ffebee',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffcdd2',
  },
  simulateCarText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#c62828',
  },
  checkinButton: {
    marginTop: 14,
    backgroundColor: '#28a745',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#28a745',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 6,
  },
  checkinButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 25,
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 10,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cafeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2b1b17',
  },
  cafeAddress: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 3,
  },
  cafeInstagram: {
    fontSize: 11,
    color: '#b07d4b',
    fontWeight: '600',
    marginTop: 2,
  },
  closeBtn: {
    fontSize: 18,
    color: '#888',
    fontWeight: 'bold',
    padding: 4,
  },
  badgesContainer: {
    marginVertical: 10,
    gap: 6,
  },
  kingBadge: {
    backgroundColor: '#fff3cd',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  myKingBadge: {
    backgroundColor: '#d4edda',
  },
  kingText: {
    color: '#856404',
    fontWeight: '600',
    fontSize: 12,
  },
  perkBadge: {
    backgroundColor: '#e8f5e9',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  perkText: {
    color: '#2e7d32',
    fontWeight: '600',
    fontSize: 12,
  },
  modalitiesContainer: {
    marginTop: 10,
    gap: 8,
  },
  btnRoute: {
    backgroundColor: '#7f4f24',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  btnPitStop: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1.5,
    borderColor: '#7f4f24',
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnPitStopText: {
    color: '#7f4f24',
    fontWeight: 'bold',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  couponCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  couponBadge: {
    backgroundColor: '#d4a373',
    color: '#2b1b17',
    fontWeight: 'bold',
    fontSize: 11,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    letterSpacing: 1,
  },
  couponCafeName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2b1b17',
    marginTop: 12,
    textAlign: 'center',
  },
  perkHighlightBox: {
    backgroundColor: '#fdf7f2',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#7f4f24',
    padding: 16,
    borderRadius: 14,
    width: '100%',
    marginVertical: 18,
    alignItems: 'center',
  },
  perkHighlightLabel: {
    fontSize: 12,
    color: '#7f4f24',
    fontWeight: '600',
  },
  perkHighlightValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2b1b17',
    marginTop: 4,
    textAlign: 'center',
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  timerLabel: {
    fontSize: 12,
    color: '#6c757d',
  },
  timerValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#dc3545',
    letterSpacing: 2,
    marginVertical: 4,
  },
  timerSub: {
    fontSize: 11,
    color: '#adb5bd',
  },
  confirmRedeemBtn: {
    backgroundColor: '#2b1b17',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmRedeemText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  victoryCard: {
    width: '100%',
    backgroundColor: '#2b1b17',
    borderRadius: 24,
    padding: 26,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffd700',
    shadowColor: '#ffd700',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 12,
  },
  victoryIcon: {
    fontSize: 55,
    marginBottom: 10,
  },
  victoryTitle: {
    color: '#ffd700',
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 1,
    textAlign: 'center',
  },
  victoryDesc: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginVertical: 18,
  },
  victoryBtn: {
    backgroundColor: '#ffd700',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  victoryBtnText: {
    color: '#2b1b17',
    fontWeight: 'bold',
    fontSize: 15,
  },
  medalCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 26,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#d4a373',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  medalIcon: {
    fontSize: 60,
    marginBottom: 8,
  },
  medalTitle: {
    color: '#7f4f24',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 1,
    textAlign: 'center',
  },
  medalSubtitle: {
    color: '#2b1b17',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
    marginBottom: 12,
  },
  medalDesc: {
    color: '#6c757d',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  medalBtn: {
    backgroundColor: '#7f4f24',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  medalBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  formCard: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 12,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2b1b17',
  },
  formLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#495057',
    marginTop: 10,
    marginBottom: 4,
  },
  formSmallLabel: {
    fontSize: 11,
    color: '#6c757d',
    marginBottom: 2,
  },
  formInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#212529',
  },
  coordsRow: {
    flexDirection: 'row',
    marginTop: 8,
    marginBottom: 16,
  },
  formInputSmall: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 12,
    color: '#495057',
  },
  useGpsBtn: {
    backgroundColor: '#e9ecef',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#ced4da',
  },
  useGpsBtnText: {
    color: '#495057',
    fontSize: 12,
    fontWeight: '600',
  },
  submitFormBtn: {
    backgroundColor: '#2b1b17',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  submitFormBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});