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
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

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

  const [activeTab, setActiveTab] = useState<'mapa' | 'circuitos' | 'comunidade' | 'perfil'>('mapa');

  const [cafes, setCafes] = useState<Cafe[]>(INITIAL_CAFES);
  const [circuits, setCircuits] = useState<Circuit[]>(INITIAL_CIRCUITS);
  const [posts, setPosts] = useState<CommunityPost[]>(INITIAL_POSTS);

  // Perfil do Usuário com Modo Privado
  const [userName, setUserName] = useState('Você');
  const [userAvatar, setUserAvatar] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80');
  const [userBio, setUserBio] = useState('Explorando cafés especiais e rolês urbanos em Campinas ☕✨');
  const [isPrivateProfile, setIsPrivateProfile] = useState(false); // NOVO
  const [userKm, setUserKm] = useState(12.4);
  const [userVisits, setUserVisits] = useState(18);
  const [userCrowns, setUserCrowns] = useState(1);
  const [userMedals, setUserMedals] = useState(5);
  const [userCheckIns, setUserCheckIns] = useState<string[]>(['d-origem', 'container-cafe', 'abigail-coffee']);

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedCafe, setSelectedCafe] = useState<Cafe | null>(null);

  const [isPerkModalVisible, setIsPerkModalVisible] = useState(false);
  const [perkTimer, setPerkTimer] = useState(90);

  const [isTakeoverModalVisible, setIsTakeoverModalVisible] = useState(false);
  const [newReinadoInfo, setNewReinadoInfo] = useState<{ cafeName: string; visits: number } | null>(null);

  const [isNominateCafeVisible, setIsNominateCafeVisible] = useState(false);
  const [nominateName, setNominateName] = useState('');
  const [nominateAddress, setNominateAddress] = useState('');

  // Modal Editar Perfil com Switch de Privacidade
  const [isEditProfileVisible, setIsEditProfileVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editIsPrivateProfile, setEditIsPrivateProfile] = useState(false); // NOVO

  useEffect(() => {
    const loadData = async () => {
      try {
        const savedProfile = await AsyncStorage.getItem(STORAGE_PROFILE_KEY);
        if (savedProfile) {
          const p = JSON.parse(savedProfile);
          if (p.name) setUserName(p.name);
          if (p.avatar) setUserAvatar(p.avatar);
          if (p.bio) setUserBio(p.bio);
          if (p.isPrivate !== undefined) setIsPrivateProfile(p.isPrivate);
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

  const handleOpenEditProfile = () => {
    setEditName(userName);
    setEditAvatar(userAvatar);
    setEditBio(userBio);
    setEditIsPrivateProfile(isPrivateProfile);
    setIsEditProfileVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Aviso', 'O nome não pode ficar vazio.');
      return;
    }
    setUserName(editName.trim());
    setUserAvatar(editAvatar);
    setUserBio(editBio.trim());
    setIsPrivateProfile(editIsPrivateProfile);
    setIsEditProfileVisible(false);

    try {
      await AsyncStorage.setItem(
        STORAGE_PROFILE_KEY,
        JSON.stringify({
          name: editName.trim(),
          avatar: editAvatar,
          bio: editBio.trim(),
          isPrivate: editIsPrivateProfile,
          visits: userVisits,
          km: userKm,
          crowns: userCrowns,
        })
      );
    } catch (e) {
      console.log('Erro ao salvar perfil:', e);
    }
  };

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

  // CHECK-IN CALIBRADO PARA 50 METROS (COM SUPORTE A MODO PRIVADO)
  const handleCheckInAttempt = async (cafe: Cafe) => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão necessária', 'Ative o GPS para confirmar seu check-in na cafeteria.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      const distance = getDistanceInMeters(loc.coords.latitude, loc.coords.longitude, cafe.lat, cafe.lng);

      // RAIO RIGOROSO DE 50 METROS
      if (distance > 50) {
        Alert.alert(
          'Fora do Raio',
          `Você está a ${Math.round(distance)}m do ${cafe.name}. Aproxime-se a menos de 50m para confirmar presença no balcão!`
        );
        return;
      }

      processCheckIn(cafe);
    } catch (e) {
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

    const currentKingVisits = cafe.kingVisits || cafe.kingCheckins || 10;

    // Se estiver em Modo Privado, salva para si mas não expõe publicamente como Rei
    if (isPrivateProfile) {
      Alert.alert(
        '☕ Check-in Discreto Confirmado!',
        `Sua visita no ${cafe.name} foi salva com sucesso no seu passaporte pessoal e não foi exposta no Clube.`
      );
      return;
    }

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

  const handleActivatePerk = () => {
    setPerkTimer(selectedCafe?.perkDurationSeconds || 90);
    setIsPerkModalVisible(true);
  };

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

  const mapHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          html, body, #map { width: 100%; height: 100%; margin: 0; padding: 0; background: #121212; }
          .custom-cafe-wrapper {
            display: flex;
            flex-direction: column;
            align-items: center;
            cursor: pointer;
          }
          .cafe-pin {
            background-color: #FF6B00;
            color: #FFF;
            border-radius: 50%;
            width: 38px;
            height: 38px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2.5px solid #FFFFFF;
            box-shadow: 0 4px 10px rgba(0,0,0,0.5);
            font-size: 17px;
          }
          .cafe-label {
            background: rgba(18, 18, 18, 0.94);
            color: #FFFFFF;
            font-size: 11px;
            font-weight: 700;
            padding: 3px 8px;
            border-radius: 8px;
            border: 1px solid rgba(255, 107, 0, 0.6);
            margin-top: 4px;
            white-space: nowrap;
            box-shadow: 0 3px 8px rgba(0,0,0,0.6);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          }
          .user-pin {
            background-color: #2196F3;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            border: 3px solid #FFF;
            box-shadow: 0 0 14px rgba(33,150,243,0.9);
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var map = L.map('map', { zoomControl: false }).setView([-22.8985, -47.0535], 14);
          
          L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
            maxZoom: 19,
            attribution: 'Google Maps'
          }).addTo(map);

          var cafesData = ${JSON.stringify(cafes)};

          cafesData.forEach(function(cafe) {
            var shortName = cafe.name.split(' ')[0];
            if (shortName === 'D.Origem') shortName = 'D.Origem';
            else if (shortName === 'Container') shortName = 'Container';
            else if (shortName === 'Abigail') shortName = 'Abigail';
            else if (shortName === 'Café') shortName = 'Taquaral';
            else if (shortName === 'Estação') shortName = 'Estação Barão';
            else if (shortName === 'Nicho') shortName = 'Nicho';

            var cafeIcon = L.divIcon({
              className: 'custom-cafe-div-icon',
              html: '<div class="custom-cafe-wrapper"><div class="cafe-pin">☕</div><div class="cafe-label">' + shortName + '</div></div>',
              iconSize: [90, 60],
              iconAnchor: [45, 19]
            });

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
                iconSize: [20, 20],
                iconAnchor: [10, 10]
              });
              L.marker([${userLocation.lat},${userLocation.lng}], { icon: userIcon }).addTo(map);
            `
              : ''
          }

          function centerOn(lat, lng, zoom) {
            var targetZoom = zoom || 17;
            map.flyTo([lat, lng], targetZoom, { animate: true, duration: 1.2 });
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

          <TouchableOpacity
            style={styles.gpsLocateBtn}
            activeOpacity={0.8}
            onPress={async () => {
              if (userLocation && webViewRef.current) {
                webViewRef.current.injectJavaScript(`centerOn(${userLocation.lat}, ${userLocation.lng}, 16); true;`);
              }
            }}
          >
            <Feather name="crosshair" size={20} color="#FF6B00" />
          </TouchableOpacity>

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

              <View style={styles.sheetPerkBox}>
                <Feather name="gift" size={16} color="#FF6B00" />
                <Text style={styles.sheetPerkText}>{selectedCafe.activePerk}</Text>
              </View>

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

      {/* ABA 2: CIRCUITOS */}
      {activeTab === 'circuitos' && (
        <CircuitsTab
          circuits={circuits}
          userCheckIns={userCheckIns}
          onSelectCafeFromCircuit={(cafeId) => {
            const found = cafes.find((c) => c.id === cafeId);
            if (found) {
              setSelectedCafe(found);
              setActiveTab('mapa');
              setTimeout(() => {
                if (webViewRef.current) {
                  webViewRef.current.injectJavaScript(`centerOn(${found.lat}, ${found.lng}, 17); true;`);
                }
              }, 350);
            }
          }}
        />
      )}

      {/* ABA 3: CLUBE */}
      {activeTab === 'comunidade' && (
        <CommunityTab
          posts={posts}
          userAvatar={userAvatar}
          userName={userName}
          cafes={cafes}
          onAddPost={(newP) => setPosts([newP, ...posts])}
        />
      )}

      {/* ABA 4: PERFIL */}
      {activeTab === 'perfil' && (
        <ProfileTab
          userName={userName}
          userAvatar={userAvatar}
          userBio={userBio}
          isPrivateProfile={isPrivateProfile}
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
            setTimeout(() => {
              if (webViewRef.current) {
                webViewRef.current.injectJavaScript(`centerOn(${cafe.lat}, ${cafe.lng}, 17); true;`);
              }
            }, 350);
          }}
        />
      )}

      {/* DOCK INFERIOR (5 ITENS) */}
      <View style={[styles.bottomTabBar, { bottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity style={styles.tabButton} onPress={() => setIsNominateCafeVisible(true)}>
          <Feather name="plus-circle" size={19} color="#888" />
          <Text style={styles.tabLabel}>+ Cafeteria</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabButton} onPress={() => setActiveTab('circuitos')}>
          <Feather
            name="compass"
            size={19}
            color={activeTab === 'circuitos' ? '#FF6B00' : '#888'}
          />
          <Text style={[styles.tabLabel, activeTab === 'circuitos' && styles.tabLabelActive]}>
            Circuitos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.mapCenterTabButton, activeTab === 'mapa' && styles.mapCenterActive]}
          onPress={() => setActiveTab('mapa')}
          activeOpacity={0.85}
        >
          <Feather name="map-pin" size={24} color="#FFF" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabButton} onPress={() => setActiveTab('comunidade')}>
          <Feather
            name="users"
            size={19}
            color={activeTab === 'comunidade' ? '#FF6B00' : '#888'}
          />
          <Text style={[styles.tabLabel, activeTab === 'comunidade' && styles.tabLabelActive]}>
            Clube
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabButton} onPress={() => setActiveTab('perfil')}>
          <Feather
            name="user"
            size={19}
            color={activeTab === 'perfil' ? '#FF6B00' : '#888'}
          />
          <Text style={[styles.tabLabel, activeTab === 'perfil' && styles.tabLabelActive]}>
            Perfil
          </Text>
        </TouchableOpacity>
      </View>

      {/* MODAIS NO NÍVEL RAIZ */}

      {/* 1. CORTESIA */}
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

      {/* 2. REINADO */}
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

      {/* 3. INDICAR CAFETERIA */}
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

      {/* 4. EDITAR PERFIL COM SWITCH DE PRIVACIDADE */}
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

            <View style={styles.avatarEditRow}>
              <Image source={{ uri: editAvatar || userAvatar }} style={styles.editAvatarImage} />
              <TouchableOpacity style={styles.changePhotoBtn} onPress={handlePickAvatar}>
                <Feather name="camera" size={15} color="#FFF" />
                <Text style={styles.changePhotoText}>Alterar foto</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Seu Nome ou Apelido</Text>
            <TextInput
              style={styles.modalInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="Como quer ser chamado"
              placeholderTextColor="#666"
            />

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

            {/* INTERRUPTOR DO MODO DISCRETO / PRIVADO */}
            <View style={styles.privacyBox}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <Feather name="shield" size={14} color="#FF6B00" />
                  <Text style={styles.privacyTitle}>Modo Discreto (Privado)</Text>
                </View>
                <Text style={styles.privacyDesc}>
                  Seus check-ins ficam salvos apenas para você e não aparecem no feed público do Clube.
                </Text>
              </View>
              <Switch
                trackColor={{ false: '#333', true: '#FF6B00' }}
                thumbColor={editIsPrivateProfile ? '#FFF' : '#888'}
                value={editIsPrivateProfile}
                onValueChange={setEditIsPrivateProfile}
              />
            </View>

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
  gpsLocateBtn: {
    position: 'absolute',
    right: 16,
    bottom: 110,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(20,20,20,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
    zIndex: 10,
    elevation: 4,
  },
  cafeBottomSheet: {
    position: 'absolute',
    bottom: 96,
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
    position: 'absolute',
    left: 14,
    right: 14,
    height: 64,
    backgroundColor: 'rgba(18, 18, 18, 0.94)',
    borderRadius: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#262626',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 20,
    paddingHorizontal: 8,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    height: '100%',
  },
  tabLabel: {
    color: '#888',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 3,
  },
  tabLabelActive: {
    color: '#FF6B00',
    fontWeight: '800',
  },
  mapCenterTabButton: {
    top: -14,
    backgroundColor: '#FF6B00',
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 3,
    borderColor: '#121212',
  },
  mapCenterActive: {
    backgroundColor: '#E05500',
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
  privacyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#222',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    marginVertical: 14,
  },
  privacyTitle: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  privacyDesc: {
    color: '#888',
    fontSize: 11,
    lineHeight: 15,
  },
  saveProfileBtn: {
    backgroundColor: '#FF6B00',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveProfileText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
});