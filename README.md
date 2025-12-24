<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Impostor Cordobés - PWA

Aplicación web progresiva (PWA) del juego Impostor Cordobés. Ahora puedes instalarla en tu dispositivo y jugar offline!

View your app in AI Studio: https://ai.studio/apps/drive/1Qb2G-s48bsY-z0jpVtwDMiNU6rIxJIaG

## Características PWA

- **Instalable**: Descarga la app en tu dispositivo como una aplicación nativa
- **Funciona offline**: Juega sin conexión a internet gracias al service worker
- **Icono personalizado**: Incluye un icono de impostor cordobés con sombrero
- **Actualizaciones automáticas**: La app se actualiza automáticamente cuando hay nuevas versiones

## Cómo instalar la PWA

### En Chrome/Edge (Desktop):
1. Abre la aplicación en tu navegador
2. Busca el icono de instalación (+) en la barra de direcciones
3. Haz clic en "Instalar"

### En móvil (Android/iOS):
1. Abre la aplicación en Chrome/Safari
2. Toca el menú (⋮ o compartir)
3. Selecciona "Agregar a pantalla de inicio"

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
4. Build for production:
   `npm run build`
5. Preview production build:
   `npm run preview`
