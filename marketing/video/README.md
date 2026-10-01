# Vidéo de présentation Rebond

Montage vertical 9:16 (1080×1920, 30 i/s, ~32 s) généré à partir de vraies captures de l'application, sans logiciel de montage.

## Regénérer la vidéo

```bash
npm run build && npm start &              # l'app en production sur http://localhost:3000
cd marketing/video
cp ../../.next/static/media/<bricolage>.woff2 bricolage.woff2   # polices du site (voir le CSS généré)
cp ../../.next/static/media/<figtree>.woff2 figtree.woff2
cp ../../public/icons/icon-512.png icon.png
npx playwright install chromium            # si Chromium n'est pas déjà présent
node capture.mjs                           # captures des écrans dans shots/
node measure.mjs positions.json            # positions des sections (défilements)
python3 -m http.server 8123 &              # sert scene.html et les captures
node render.mjs 32                         # 960 images dans frames/
ffmpeg -framerate 30 -i frames/f%04d.jpg -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -movflags +faststart Rebond-presentation.mp4
```

`scene.html` contient tout le montage : textes, minutage (fonction `render(t)`), maquette de téléphone, défilements. Modifier un texte ou un instant se fait directement dans ce fichier, puis relancer `render.mjs` et `ffmpeg`.
