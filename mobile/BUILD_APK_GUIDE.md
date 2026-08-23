# 📱 Guía de Compilación de APK para Android: Smart Investor

Esta guía describe el procedimiento paso a paso para compilar y generar el archivo **APK instalable (`.apk`)** para cualquier dispositivo Android.

---

## 🚀 Requisitos Previos

1. **Node.js** v18 o superior y **npm** instalados.
2. Servidor Backend en FastAPI corriendo (para la extracción en vivo de datos bursátiles):
   ```bash
   cd /Users/fernandoflorez/APPv2
   ./venv/bin/uvicorn app:app --host 0.0.0.0 --port 8000
   ```

---

## 📦 Método 1: Compilar APK con EAS Build (Recomendado - 100% Automatizado)

**EAS Build (Expo Application Services)** compila el APK en la nube o localmente generando directamente el archivo descargable `.apk` sin requerir configurar el SDK completo de Android en tu máquina.

### Paso 1: Instalar EAS CLI
```bash
npm install -g eas-cli
```

### Paso 2: Iniciar sesión en Expo (gratis)
```bash
eas login
```
*(Si no tienes cuenta, regístrate en [expo.dev](https://expo.dev/signup) en 1 minuto).*

### Paso 3: Configurar el proyecto
```bash
cd /Users/fernandoflorez/APPv2/mobile
eas build:configure
```

### Paso 4: Generar el APK Instalable
Ejecuta el siguiente comando configurado en `eas.json`:
```bash
eas build -p android --profile preview
```

> **Resultado:** Al finalizar la compilación, EAS te proporcionará un enlace directo de descarga y un código QR para instalar el archivo **`.apk`** directamente en tu celular Android.

---

## 🛠️ Método 2: Compilación Local de APK con Gradle y Android Studio

Si prefieres compilar el APK completamente en tu computadora local:

### Paso 1: Instalar dependencias
```bash
cd /Users/fernandoflorez/APPv2/mobile
npm install
```

### Paso 2: Generar la carpeta nativa `android/`
```bash
npx expo prebuild --platform android
```

### Paso 3: Compilar el APK con Gradle
```bash
cd android
./gradlew assembleRelease
```

### Paso 4: Ubicación del archivo APK generado
El APK instalable quedará listo en la siguiente ruta:
```
mobile/android/app/build/outputs/apk/release/app-release.apk
```
Puedes transferirlo por USB, Google Drive, WhatsApp o Telegram e instalarlo en cualquier teléfono Android habilitando *"Instalar aplicaciones de fuentes desconocidas"*.

---

## 📲 Método 3: Probar en Tiempo Real con Expo Go (Desarrollo Rápido)

Para probar la app inmediatamente en tu dispositivo Android mientras programas:

1. Instala la app **Expo Go** desde Google Play Store en tu celular.
2. Inicia el servidor de desarrollo en tu computadora:
   ```bash
   cd /Users/fernandoflorez/APPv2/mobile
   npm start
   ```
3. Escanea el código QR que aparece en la terminal con la app **Expo Go**.

---

## 🌐 Configuración de IP del Backend para Celulares Físicos

Cuando pruebes la app en un dispositivo físico conectado a la misma red Wi-Fi que tu computadora:
1. Averigua la IP local de tu computadora (ej. `192.168.1.15`).
2. Abre [apiService.ts](file:///Users/fernandoflorez/APPv2/mobile/src/services/apiService.ts) y ajusta:
   ```typescript
   const API_BASE_URL = 'http://192.168.1.15:8000';
   ```
3. La aplicación cuenta además con un **fallback offline inteligente** (`DEMO`), por lo que nunca se congelará ni mostrará pantallas en blanco si no hay red.
