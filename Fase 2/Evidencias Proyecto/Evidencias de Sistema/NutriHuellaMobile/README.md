# NutriHuella Mobile (Expo + React Native)

App móvil para Android e iOS que replica las funcionalidades de la app web NutriHuella.

## ⚙️ Requisitos
- Node.js 18+ y npm o yarn
- Expo CLI (`npm i -g expo-cli`) — opcional; también puedes usar `npx expo`
- Backend NutriHuella **corriendo localmente** (puerto por defecto: `4000`)

## 🚀 Arranque rápido
1) Descomprime este proyecto o clónalo.
2) Instala dependencias:
```bash
yarn  # o: npm install
```
3) Configura la URL del backend (LAN) mediante variable pública de Expo, por ejemplo:
```bash
# En Linux/Mac
export EXPO_PUBLIC_API_URL=http://192.168.0.10:4000
# En Windows PowerShell
setx EXPO_PUBLIC_API_URL "http://192.168.0.10:4000"
```
> **Importante:** usa tu IP local (no `localhost`) para que tu teléfono pueda alcanzar el backend en la misma red.

4) Inicia la app:
```bash
yarn start
```
Escanea el QR con Expo Go en tu teléfono o usa un emulador.

## 🔐 Autenticación
- Email + contraseña: `POST /api/auth/login`
- Registro: `POST /api/auth/register`
- Yo (usuario actual): `GET /api/auth/me`
- Google: `POST /api/auth/google` (requiere obtener un `id_token` con `expo-auth-session` y un **Client ID** de Google).

> En `LoginScreen.tsx` reemplaza `GOOGLE_CLIENT_ID` por tus credenciales para producción.

## 🐾 Endpoints usados
Base: `{{EXPO_PUBLIC_API_URL}}/api`
- **/auth**: `/register`, `/login`, `/google`, `/me`
- **/pets**:
  - `GET /` (listar), `POST /` (crear)
  - `GET /:petId`, `PATCH /:petId`, `DELETE /:petId`
  - **Clínica**: `GET/POST /:petId/clinical/weights`, `DELETE /:petId/clinical/weights/:weightId`  
    `GET/POST /:petId/clinical/vaccinations`, `PATCH/DELETE /:petId/clinical/vaccinations/:vaccinationId`  
    `GET/POST /:petId/clinical/diseases`, `PATCH/DELETE /:petId/clinical/diseases/:diseaseId`  
    `POST /:petId/diseases/no-diseases-ack`
  - **Nutrición**: `GET /:petId/nutrition`, `GET /:petId/nutrition/defaults`, `PUT /:petId/nutrition`
  - **Foto**: `POST /:petId/photo` (multipart/form-data, campo `file`)
- **/pantry**: `GET /usable/:petId` (o `GET /:petId/usable`), `GET /summary`, `GET /expiring`

## 🧭 Navegación
- Tabs: **Inicio**, **Mis Mascotas**, **Recetas**, **Perfil**
- Mis Mascotas → Detalle → { Peso, Vacunas, Enfermedades, Nutrición, Despensa, Editar }

## 🎨 Estilos
Colores de marca (extraídos del `tailwind.config.ts` del frontend web):
- `teal #10776F`, `tealDark #0C5B56`, `orange #F39C12`, `cream #FFF8EB`, `ink #111827`, `gray #6B7280`

## 📁 Estructura
```
src/
  components/         # (opcional) componentes compartidos
  navigation/         # AuthStack, MainTabs, PetsStack
  screens/            # Auth, Home, Pets, Recipes, Profile
  services/           # api.ts, auth.ts, pets.ts, pantry.ts
  context/            # AuthContext
  theme/              # colors.ts
  config.ts           # API urls (usa EXPO_PUBLIC_API_URL)
```
## 🧪 Pruebas rápidas
1. Registrar usuario → Iniciar sesión
2. Agregar mascota → Ver detalle → Agregar peso/vacunas/enfermedades
3. Editar ficha nutricional → Guardar
4. Ver despensa (Aptos/Prohibidos)

## 📦 Builds (futuro)
- Android: `expo run:android`
- iOS: `expo run:ios` (requiere macOS)

---
¡Lista la base! Personaliza estilos y agrega gráficos/avatares cuando desees.
