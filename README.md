# ☕🏃 RunCoffee — O Clube Urbano de Café & Corrida

> **Conectando corredores, caminhantes e amantes de café especial pelas ruas de Campinas/SP.**

O **RunCoffee** é um aplicativo mobile que transforma a ida à cafeteria em uma experiência esportiva e gamificada. Os usuários exploram circuitosurbanos a pé, acumulam quilômetros, disputam o "Reinado" da sua cafeteria favorita e resgatam benefícios exclusivos direto no balcão.

---

## 🌟 Principais Funcionalidades

- **🗺️ Mapa Urbano Interativo:** Mapeamento de cafeterias especiais de Campinas (Cambuí, Centro, Bosque, Nova Campinas).
- **📍 GPS & Rotas a Pé em Tempo Real:** Traçado inteligente de trajetos pelas calçadas via motor OSRM (Open Source Routing Machine), com cálculo de distância real e tempo estimado de caminhada.
- **🛡️ Velocímetro Anti-Fraude:** Algoritmo que monitora a velocidade de deslocamento (> 20 km/h) para garantir que apenas quem foi a pé receba o bônus esportivo (+2 visitas), convertendo deslocamentos motorizados em check-in avulso (+1 visita).
- **👑 Disputa do Reinado (Gamificação):** O cliente mais assíduo do mês assume a coroa da cafeteria, ganha destaque público no mapa e benefícios exclusivos enquanto mantiver o trono.
- **⏱️ Cupom com Validação para o Barista:** Tela de resgate com cronômetro regressivo de 90 segundos para aplicação rápida e sem atrito no caixa.
- **🏃 Desafios & Circuitos Multiparadas:** Rotas oficiais com passaporte de carimbos e medalhas colecionáveis (ex: *Circuito Centro-Bosque 3.2k*, *Cambuí Loop 2.8k*).
- **👥 Comunidade & Run Club:** Feed social com atividades dos corredores da cidade, botão de "Brinde! ☕" e agenda de treinos coletivos aos sábados.
- **📝 Curadoria Colaborativa:** Formulário para os usuários indicarem novas cafeterias com preenchimento automático via GPS.
- **💾 Persistência Local:** Dados de perfil, estatísticas, coroas e medalhas salvos localmente com `AsyncStorage`.

---

## 🛠️ Tecnologias Utilizadas

- **Front-end:** [React Native](https://reactnative.dev/) com [Expo](https://expo.dev/) (TypeScript)
- **Mapas & Geolocalização:** [Leaflet](https://leafletjs.com/) + [OpenStreetMap](https://www.openstreetmap.org/) via `react-native-webview` e `expo-location`
- **Roteamento Pedestre:** OSRM (Open Source Routing Machine - Foot Routing API)
- **Mídia & Galeria:** `expo-image-picker`
- **Armazenamento:** `@react-native-async-storage/async-storage`

---

## 🚀 Como Executar o Projeto

1. Clone o repositório:
```bash
git clone [https://github.com/ribeirocps/run-coffee.git](https://github.com/ribeirocps/run-coffee.git)
cd run-coffee