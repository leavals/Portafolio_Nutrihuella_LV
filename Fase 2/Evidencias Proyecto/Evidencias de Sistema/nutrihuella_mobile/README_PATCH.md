# NutriHuella Mobile (patch)

## Uso
1. Crea el proyecto base:
   ```powershell
   flutter create --platforms=android,web nutrihuella_mobile
   ```
2. Copia el contenido de este ZIP en la raíz del proyecto y **sobrescribe**.
3. Instala dependencias:
   ```powershell
   flutter pub get
   ```
4. Crea `.env` en la raíz (o usa `--dart-define`):
   ```env
   BACKEND_URL=http://10.0.2.2:4000
   ```
5. Ejecuta (Android emulador):
   ```powershell
   flutter run -d emulator-5554 --dart-define=API_BASE_URL=http://10.0.2.2:4000
   ```

> Si usas Web, recuerda configurar CORS y **Authorized JavaScript origins** para Google Sign-In.
