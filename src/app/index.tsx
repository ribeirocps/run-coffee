import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Modal,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

// Módulos organizados
import {
  INITIAL_CAFES,
  INITIAL_CIRCUITS,
  INITIAL_POSTS,
  STORAGE_PROFILE_KEY
} from '../data/initialData';
import { Cafe, Circuit, CommunityPost } from '../types';
import { getDistanceInMeters } from '../utils/geo';

import { CircuitsTab } from '../components/CircuitsTab';
import { CommunityTab } from '../components/CommunityTab';
import { ProfileTab } from '../components/ProfileTab';

const { width, height } = Dimensions.get('window');

export default function RunCoffeeApp() {
  const insets = useSafeAreaInsets();
  const webViewRef = useRef<WebView>(null);

  // Navegação por Abas
  const [activeTab, setActiveTab] = useState<'mapa' | 'circuitos' | 'comunidade' | 'perfil'>('mapa');

  // Dados do App
  const [cafes, setCafes] = useState<Cafe[]>(INITIAL_CAFES);
  const [circuits, setCircuits] = useState<Circuit[]>(INITIAL_CIRCUITS);
  const [posts, setPosts] = useState<CommunityPost[]>(INITIAL_POSTS);

  // Perfil do Usuário
  const [userName, setUserName] = useState('Você');
  const [userAvatar, setUserAvatar] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80');
  const [userBio, setUserBio] = useState('Explorando cafés especiais e rolês urbanos em Campinas ☕✨');
  const [userKm, setUserKm] = useState(12.4);
  const [userVisits, setUserVisits] = useState(18);
  const [userCrowns, setUserCrowns] = useState(1);
  const [userMedals, setUserMedals] = useState(5);
  const [userCheckIns, setUserCheckIns] = useState<string[]>(['d-origem', 'container-cafe', 'abigail-coffee']);

  // Localização
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Seleção e Modais
  const [selectedCafe, setSelectedCafe] = useState<Cafe | null>(null);

  // Modal Cortesia (Timer de 90s)
  const [isPerkModalVisible, setIsPerkModalVisible] = useState(false);
  const [perkTimer, setPerkTimer] = useState(90);

  // Modal Tomada de Reinado
  const [isTakeoverModalVisible, setIsTakeoverModalVisible] = useState(false);
  const [newReinadoInfo, setNewReinadoInfo] = useState<{ cafeName: string; visits: number } | null>(null);

  // Modal Indicar Cafeteria
  const [isNominateCafeVisible, setIsNominateCafeVisible] = useState(false);
  const [nominateName, setNominateName] = useState('');
  const [nominateAddress, setNominateAddress] = useState('');

  // Modal Editar Perfil
  const [isEditProfileVisible, setIsEditProfileVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editBio, setEditBio] = useState('');

  // Carregar dados salvos do AsyncStorage
  useEffect(() => {
    const loadData = async () => {
      try {
        const savedProfile = await AsyncStorage.getItem(STORAGE_PROFILE_KEY);
        if (savedProfile) {
          const p = JSON.parse(savedProfile);
          if (p.name) setUserName(p.name);
          if (p.avatar) setUserAvatar(p.avatar);
          if (p.bio) setUserBio(p.bio);
          if (p.visits !== undefined) setUserVisits(p.visits);
          if (p.km !== undefined) setUserKm(p.km);
          if (p.crowns !== undefined) setUserCrowns(p.crowns);
        }
      } catch (e) {
        console.log('Erro ao carregar dados do perfil:', e);
      }
    };
    loadData();
  }, []);

  // Obter GPS do Usuário
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          setUserLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
        }
      } catch (e) {
        console.log('Erro ao buscar localização inicial:', e);
      }
    })();
  }, []);

  // Timer regressivo da Cortesia (90s)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPerkModalVisible && perkTimer > 0) {
      interval = setInterval(() => {
        setPerkTimer((prev) => prev - 1);
      }, 1000);
    } else if (perkTimer === 0 && isPerkModalVisible) {
      setIsPerkModalVisible(false);
      Alert.alert('Tempo esgotado', 'O tempo para validação da cortesia expirou.');
    }
    return () => clearInterval(interval);
  }, [isPerkModalVisible, perkTimer]);

  // Abertura do Modal de Edição de Perfil
  const handleOpenEditProfile = () => {
    setEditName(userName);
    setEditAvatar(userAvatar);
    setEditBio(userBio);
    setIsEditProfileVisible(true);
  };

  // Salvar Perfil
  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Aviso', 'O nome não pode ficar vazio.');
      return;
    }
    setUserName(editName.trim());
    setUserAvatar(editAvatar);
    setUserBio(editBio.trim());
    setIsEditProfileVisible(false);

    try {
      await AsyncStorage.setItem(
        STORAGE_PROFILE_KEY,
        JSON.stringify({
          name: editName.trim(),
          avatar: editAvatar,
          bio: editBio.trim(),
          visits: userVisits,
          km: userKm,
          crowns: userCrowns,
        })
      );
    } catch (e) {
      console.log('Erro ao salvar perfil:', e);
    }
  };

  // Escolher Foto do Perfil
  const handlePickAvatar = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!res.canceled && res.assets[0].uri) {
        setEditAvatar(res.assets[0].uri);
      }
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível carregar a imagem.');
    }
  };

  // Check-in com Geofence de 150m e Anti-cheat
  const handleCheckInAttempt = async (cafe: Cafe) => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão necessária', 'Ative o GPS para confirmar seu check-in na cafeteria.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      const distance = getDistanceInMeters(loc.coords.latitude, loc.coords.longitude, cafe.lat, cafe.lng);

      // Verificação de proximidade (150m)
      if (distance > 150) {
        Alert.alert(
          'Fora do Raio',
          `Você está a cerca de ${Math.round(distance)}m do ${cafe.name}. Aproxime-se a menos de 150m para fazer check-in!`
        );
        return;
      }

      processCheckIn(cafe);
    } catch (e) {
      // Fallback em caso de simulador
      processCheckIn(cafe);
    }
  };

  const processCheckIn = (cafe: Cafe) => {
    const nextVisits = userVisits + 1;
    const nextKm = Number((userKm + (cafe.distanceKm || 1.2)).toFixed(1));
    let nextCrowns = userCrowns;

    setUserVisits(nextVisits);
    setUserKm(nextKm);

    if (!userCheckIns.includes(cafe.id)) {
      setUserCheckIns([...userCheckIns, cafe.id]);
    }

    // Lógica do Reinado
    const currentKingVisits = cafe.kingVisits || cafe.kingCheckins || 10;
    if (nextVisits > currentKingVisits) {
      nextCrowns += 1;
      setUserCrowns(nextCrowns);
      setCafes((prev) =>
        prev.map((c) =>
          c.id === cafe.id
            ? { ...c, currentKing: userName, king: userName, rei: userName, kingVisits: nextVisits }
            : c
        )
      );
      setNewReinadoInfo({ cafeName: cafe.name, visits: nextVisits });
      setIsTakeoverModalVisible(true);
    } else {
      Alert.alert('☕ Check-in Confirmado!', `Parabéns! Sua visita no ${cafe.name} foi registrada com sucesso.`);
    }
  };

  // Ativar Cortesia no Balcão
  const handleActivatePerk = () => {
    setPerkTimer(selectedCafe?.perkDurationSeconds || 90);
    setIsPerkModalVisible(true);
  };

  // Enviar Indicação de Cafeteria
  const handleSendNomination = () => {
    if (!nominateName.trim()) {
      Alert.alert('Aviso', 'Por favor, informe o nome da cafeteria.');
      return;
    }
    Alert.alert('Indicação Enviada! ☕', 'Nossa equipe de curadoria do Clube vai visitar o local.');
    setNominateName('');
    setNominateAddress('');
    setIsNominateCafeVisible(false);
  };

  // HTML do Mapa Leaflet com tiles do Google Maps e Marcadores de Café
  const mapHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          html, body, #map { width: 100%; height: 100%; margin: 0; padding: 0; background: #121212; }
          .cafe-pin {
            background-color: #FF6B00;
            color: #FFF;
            border-radius: 50%;
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2.5px solid #FFFFFF;
            box-shadow: 0 4px 10px rgba(0,0,0,0.5);
            font-size: 16px;
            font-weight: bold;
          }
          .user-pin {
            background-color: #2196F3;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            border: 3px solid #FFF;
            box-shadow: 0 0 12px rgba(33,150,243,0.8);
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var map = L.map('map', { zoomControl: false }).setView([-22.8985, -47.0535], 14);
          
          // Google Maps Raster Tiles
          L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
            maxZoom: 19,
            attribution: 'Google Maps'
          }).addTo(map);

          var cafeIcon = L.divIcon({
            className: 'custom-cafe-icon',
            html: '<div class="cafe-pin">☕</div>',
            iconSize: [36, 36],
            iconAnchor: [18, 18]
          });

          var cafesData = ${JSON.stringify(cafes)};

          cafesData.forEach(function(cafe) {
            var marker = L.marker([cafe.lat, cafe.lng], { icon: cafeIcon }).addTo(map);
            marker.on('click', function() {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SELECT_CAFE', cafeId: cafe.id }));
            });
          });

          ${
            userLocation
              ? `
              var userIcon = L.divIcon({
                className: 'custom-user-icon',
                html: '<div class="user-pin"></div>',
                iconSize: [18, 18],
                iconAnchor: [9, 9]
              });
              L.marker([${userLocation.lat},${userLocation.lng}], { icon: userIcon }).addTo(map);
            `
              : ''
          }

          function centerOn(lat, lng) {
            map.flyTo([lat, lng], 16, { animate: true, duration: 1.2 });
          }
        </script>
      </body>
    </html>
  `;

  const handleMapMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'SELECT_CAFE') {
        const found = cafes.find((c) => c.id === data.cafeId);
        if (found) setSelectedCafe(found);
      }
    } catch (e) {}
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D0D" />

      {/* ABA 1: MAPA PRINCIPAL */}
      {activeTab === 'mapa' && (
        <View style={styles.mapContainer}>
          <WebView
            ref={webViewRef}
            originWhitelist={['*']}
            source={{ html: mapHtml }}
            style={styles.webView}
            onMessage={handleMapMessage}
          />

          {/* Botão Superior Flutuante: Indicar Cafeteria */}
          <TouchableOpacity
            style={[styles.floatingNominateBtn, { top: (StatusBar.currentHeight || 24) + 14 }]}
            activeOpacity={0.8}
            onPress={() => setIsNominateCafeVisible(true)}
          >
            <Feather name="plus-circle" size={16} color="#FF6B00" />
            <Text style={styles.floatingNominateText}>Indicar Cafeteria</Text>
          </TouchableOpacity>

          {/* Botão de Localização GPS */}
          <TouchableOpacity
            style={styles.gpsLocateBtn}
            activeOpacity={0.8}
            onPress={async () => {
              if (userLocation && webViewRef.current) {
                webViewRef.current.injectJavaScript(`centerOn(${userLocation.lat}, ${userLocation.lng}); true;`);
              }
            }}
          >
            <Feather name="crosshair" size={20} color="#FF6B00" />
          </TouchableOpacity>

          {/* Card Flutuante da Cafeteria Selecionada */}
          {selectedCafe && (
            <View style={styles.cafeBottomSheet}>
              <View style={styles.sheetHandle} />
              <View style={styles.sheetHeader}>
                <Image source={{ uri: selectedCafe.photoUrl }} style={styles.sheetCafePhoto} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.sheetCafeName} numberOfLines={1}>
                    {selectedCafe.name}
                  </Text>
                  <Text style={styles.sheetCafeAddress} numberOfLines={1}>
                    {selectedCafe.address}
                  </Text>
                  <View style={styles.sheetKingRow}>
                    <Text style={styles.sheetKingBadge}>👑 {selectedCafe.currentKing || selectedCafe.king}</Text>
                    <Text style={styles.sheetRating}>⭐ {selectedCafe.rating || '4.9'}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setSelectedCafe(null)} style={{ padding: 4 }}>
                  <Feather name="x" size={20} color="#888" />
                </TouchableOpacity>
              </View>

              {/* Cortesia / Benefício */}
              <View style={styles.sheetPerkBox}>
                <Feather name="gift" size={16} color="#FF6B00" />
                <Text style={styles.sheetPerkText}>{selectedCafe.activePerk}</Text>
              </View>

              {/* Botões de Ação */}
              <View style={styles.sheetActionsRow}>
                <TouchableOpacity
                  style={styles.checkInActionBtn}
                  onPress={() => handleCheckInAttempt(selectedCafe)}
                >
                  <Feather name="check-circle" size={18} color="#FFF" />
                  <Text style={styles.checkInActionText}>Fazer Check-in</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.perkActionBtn} onPress={handleActivatePerk}>
                  <Feather name="coffee" size={18} color="#FF6B00" />
                  <Text style={styles.perkActionText}>Cortesia</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}

      {/* ABA 2: CIRCUITOS URBANOS */}
      {activeTab === 'circuitos' && (
        <CircuitsTab
          circuits={circuits}
          userCheckIns={userCheckIns}
          onSelectCafeFromCircuit={(cafeId) => {
            const found = cafes.find((c) => c.id === cafeId);
            if (found) {
              setSelectedCafe(found);
              setActiveTab('mapa');
              if (webViewRef.current) {
                webViewRef.current.injectJavaScript(`centerOn(${found.lat}, ${found.lng}); true;`);
              }
            }
          }}
        />
      )}

      {/* ABA 3: CLUBE RUNCOFFEE */}
      {activeTab === 'comunidade' && (
        <CommunityTab
          posts={posts}
          userAvatar={userAvatar}
          userName={userName}
          cafes={cafes}
          onAddPost={(newP) => setPosts([newP, ...posts])}
        />
      )}

      {/* ABA 4: PERFIL COM HISTÓRICO DE CAFÉS E SOBRE */}
      {activeTab === 'perfil' && (
        <ProfileTab
          userName={userName}
          userAvatar={userAvatar}
          userBio={userBio}
          userKm={userKm}
          userVisits={userVisits}
          userCrowns={userCrowns}
          userMedals={userMedals}
          circuits={circuits}
          cafes={cafes}
          userCheckIns={userCheckIns}
          onOpenEditProfile={handleOpenEditProfile}
          onSelectCafe={(cafe) => {
            setSelectedCafe(cafe);
            setActiveTab('mapa');
            if (webViewRef.current) {
              webViewRef.current.injectJavaScript(`centerOn(${cafe.lat}, ${cafe.lng}); true;`);
            }
          }}
        />
      )}

      {/* BARRA INFERIOR MODERNA (DOCK) */}
      <View style={[styles.bottomTabBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <TouchableOpacity style={styles.tabButton} onPress={() => setActiveTab('circuitos')}>
          <Feather
            name="compass"
            size={20}
            color={activeTab === 'circuitos' ? '#FF6B00' : '#737373'}
          />
          <Text style={[styles.tabLabel, activeTab === 'circuitos' && styles.tabLabelActive]}>
            Circuitos
          </Text>
        </TouchableOpacity>

        {/* Botão Central Elevado: Mapa */}
        <TouchableOpacity
          style={[styles.tabButton, styles.mapCenterTabButton, activeTab === 'mapa' && styles.mapCenterActive]}
          onPress={() => setActiveTab('mapa')}
        >
          <Feather name="map-pin" size={22} color="#FFF" />
          <Text style={styles.mapCenterLabel}>Mapa</Text>
        </TouchableOpacity>

        {/* Botão do Clube */}
        <TouchableOpacity style={styles.tabButton} onPress={() => setActiveTab('comunidade')}>
          <Feather
            name="users"
            size={20}
            color={activeTab === 'comunidade' ? '#FF6B00' : '#737373'}
          />
          <Text style={[styles.tabLabel, activeTab === 'comunidade' && styles.tabLabelActive]}>
            Clube
          </Text>
        </TouchableOpacity>

        {/* Botão do Perfil */}
        <TouchableOpacity style={styles.tabButton} onPress={() => setActiveTab('perfil')}>
          <Feather
            name="user"
            size={20}
            color={activeTab === 'perfil' ? '#FF6B00' : '#737373'}
          />
          <Text style={[styles.tabLabel, activeTab === 'perfil' && styles.tabLabelActive]}>
            Perfil
          </Text>
        </TouchableOpacity>
      </View>

      {/* ======================================================== */}
      {/* MODAIS NO NÍVEL RAIZ (GARANTIA CONTRA BUGS NO ANDROID)    */}
      {/* ======================================================== */}

      {/* 1. MODAL CORTESIA (TIMER 90S) */}
      <Modal
        visible={isPerkModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsPerkModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.perkModalCard}>
            <View style={styles.perkModalHeader}>
              <Feather name="clock" size={32} color="#FF6B00" />
              <Text style={styles.perkTimerNumber}>{perkTimer}s</Text>
              <Text style={styles.perkModalSub}>Apresente esta tela ao barista no balcão</Text>
            </View>

            <View style={styles.perkDetailBox}>
              <Text style={styles.perkDetailCafe}>{selectedCafe?.name}</Text>
              <Text style={styles.perkDetailText}>{selectedCafe?.activePerk}</Text>
            </View>

            <TouchableOpacity
              style={styles.perkDoneBtn}
              onPress={() => {
                setIsPerkModalVisible(false);
                Alert.alert('Cortesia Confirmada!', 'Aproveite seu café especial!');
              }}
            >
              <Text style={styles.perkDoneText}>Validado com o Barista</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 2. MODAL NOVO REI DA CASA */}
      <Modal
        visible={isTakeoverModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsTakeoverModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.reinadoModalCard}>
            <Text style={styles.reinadoEmoji}>👑</Text>
            <Text style={styles.reinadoTitle}>NOVO REI DA CASA!</Text>
            <Text style={styles.reinadoSub}>
              Você ultrapassou o recorde e assumiu o reinado no café:
            </Text>
            <Text style={styles.reinadoCafeName}>{newReinadoInfo?.cafeName}</Text>
            <Text style={styles.reinadoScore}>Total de Visitas: {newReinadoInfo?.visits}</Text>

            <TouchableOpacity
              style={styles.reinadoBtn}
              onPress={() => setIsTakeoverModalVisible(false)}
            >
              <Text style={styles.reinadoBtnText}>Comemorar no Clube ☕🔥</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 3. MODAL INDICAR CAFETERIA */}
      <Modal
        visible={isNominateCafeVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsNominateCafeVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.nominateCard}>
            <View style={styles.nominateHeader}>
              <Text style={styles.nominateTitle}>Indicar Cafeteria</Text>
              <TouchableOpacity onPress={() => setIsNominateCafeVisible(false)}>
                <Feather name="x" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Nome do Estabelecimento</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ex: Abigail Coffee..."
              placeholderTextColor="#666"
              value={nominateName}
              onChangeText={setNominateName}
            />

            <Text style={styles.inputLabel}>Endereço ou Bairro em Campinas</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ex: R. Cel. Quirino, Cambuí"
              placeholderTextColor="#666"
              value={nominateAddress}
              onChangeText={setNominateAddress}
            />

            <TouchableOpacity style={styles.submitNominateBtn} onPress={handleSendNomination}>
              <Text style={styles.submitNominateText}>Enviar Indicação</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 4. MODAL EDITAR PERFIL (COM SOBRE DE 124 CARACTERES) */}
      <Modal
        visible={isEditProfileVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsEditProfileVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.editProfileCard}>
            <View style={styles.nominateHeader}>
              <Text style={styles.nominateTitle}>Editar Perfil</Text>
              <TouchableOpacity onPress={() => setIsEditProfileVisible(false)}>
                <Feather name="x" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>

            {/* Avatar */}
            <View style={styles.avatarEditRow}>
              <Image source={{ uri: editAvatar || userAvatar }} style={styles.editAvatarImage} />
              <TouchableOpacity style={styles.changePhotoBtn} onPress={handlePickAvatar}>
                <Feather name="camera" size={15} color="#FFF" />
                <Text style={styles.changePhotoText}>Alterar foto</Text>
              </TouchableOpacity>
            </View>

            {/* Nome */}
            <Text style={styles.inputLabel}>Seu Nome ou Apelido</Text>
            <TextInput
              style={styles.modalInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="Como quer ser chamado"
              placeholderTextColor="#666"
            />

            {/* Campo SOBRE (Bio até 124 caracteres) */}
            <View style={styles.bioHeaderRow}>
              <Text style={styles.inputLabel}>Sobre você</Text>
              <Text style={[styles.bioCounterText, editBio.length >= 124 && { color: '#FF4444' }]}>
                {editBio.length}/124
              </Text>
            </View>
            <TextInput
              style={[styles.modalInput, styles.bioInputArea]}
              value={editBio}
              onChangeText={(text) => setEditBio(text.slice(0, 124))}
              placeholder="Fale um pouco sobre você e seus cafés favoritos..."
              placeholderTextColor="#666"
              multiline
              maxLength={124}
            />

            {/* Salvar */}
            <TouchableOpacity style={styles.saveProfileBtn} onPress={handleSaveProfile}>
              <Text style={styles.saveProfileText}>Salvar Alterações</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  webView: {
    flex: 1,
    backgroundColor: '#121212',
  },
  floatingNominateBtn: {
    position: 'absolute',
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#181818',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
    zIndex: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  floatingNominateText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  gpsLocateBtn: {
    position: 'absolute',
    right: 16,
    bottom: 220,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#181818',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
    zIndex: 10,
    elevation: 4,
  },
  cafeBottomSheet: {
    position: 'absolute',
    bottom: 84,
    left: 14,
    right: 14,
    backgroundColor: '#181818',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    zIndex: 15,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 10,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sheetCafePhoto: {
    width: 54,
    height: 54,
    borderRadius: 12,
    backgroundColor: '#262626',
  },
  sheetCafeName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  sheetCafeAddress: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  sheetKingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  sheetKingBadge: {
    color: '#FFD700',
    fontSize: 11,
    fontWeight: '700',
  },
  sheetRating: {
    color: '#CCC',
    fontSize: 11,
    fontWeight: '600',
  },
  sheetPerkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,107,0,0.1)',
    padding: 10,
    borderRadius: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,107,0,0.25)',
  },
  sheetPerkText: {
    color: '#FF6B00',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  sheetActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  checkInActionBtn: {
    flex: 1.6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FF6B00',
    paddingVertical: 12,
    borderRadius: 12,
  },
  checkInActionText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  perkActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#242424',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#383838',
  },
  perkActionText: {
    color: '#FF6B00',
    fontSize: 14,
    fontWeight: '700',
  },
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: '#121212',
    borderTopWidth: 1,
    borderTopColor: '#202020',
    paddingTop: 8,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabButton: {
    alignItems: 'center',
    flex: 1,
  },
  tabLabel: {
    color: '#737373',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
  },
  tabLabelActive: {
    color: '#FF6B00',
    fontWeight: '700',
  },
  mapCenterTabButton: {
    top: -12,
    backgroundColor: '#FF6B00',
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  mapCenterActive: {
    backgroundColor: '#E05500',
  },
  mapCenterLabel: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  perkModalCard: {
    backgroundColor: '#181818',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#303030',
  },
  perkModalHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  perkTimerNumber: {
    color: '#FF6B00',
    fontSize: 36,
    fontWeight: '800',
    marginTop: 8,
  },
  perkModalSub: {
    color: '#AAA',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
  perkDetailBox: {
    backgroundColor: '#222',
    padding: 16,
    borderRadius: 14,
    width: '100%',
    marginBottom: 20,
  },
  perkDetailCafe: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  perkDetailText: {
    color: '#CCC',
    fontSize: 13,
    lineHeight: 18,
  },
  perkDoneBtn: {
    backgroundColor: '#FF6B00',
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  perkDoneText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  reinadoModalCard: {
    backgroundColor: '#181818',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  reinadoEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  reinadoTitle: {
    color: '#FFD700',
    fontSize: 22,
    fontWeight: '800',
  },
  reinadoSub: {
    color: '#BBB',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
  },
  reinadoCafeName: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
    textAlign: 'center',
  },
  reinadoScore: {
    color: '#FF6B00',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 20,
  },
  reinadoBtn: {
    backgroundColor: '#FF6B00',
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  reinadoBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  nominateCard: {
    backgroundColor: '#181818',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: '#303030',
  },
  nominateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  nominateTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  inputLabel: {
    color: '#AAA',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#222',
    color: '#FFF',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#333',
  },
  submitNominateBtn: {
    backgroundColor: '#FF6B00',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  submitNominateText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  editProfileCard: {
    backgroundColor: '#181818',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: '#303030',
  },
  avatarEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  editAvatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#FF6B00',
    backgroundColor: '#262626',
  },
  changePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#282828',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#404040',
  },
  changePhotoText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  bioHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bioCounterText: {
    color: '#777',
    fontSize: 11,
    fontWeight: '600',
  },
  bioInputArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  saveProfileBtn: {
    backgroundColor: '#FF6B00',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveProfileText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
});