# Mis Facturas

Aplicación web progresiva (PWA) para escanear facturas de compras y llevar un control de gastos por producto. Construida con HTML, CSS (Tailwind) y JavaScript vanilla, sin frameworks.

---

## Hitos planeados

| Hito | Descripción | Estado |
|------|-------------|--------|
| 1 | Esqueleto inicial con captura de foto | ✅ Listo |
| 2 | OCR con Google Cloud Vision API | ✅ Listo |
| 3a | DOCUMENT_TEXT_DETECTION, parser Brasimgus, pantalla de revisión | ✅ Listo |
| 3b | Parsers para otras tiendas (Paraíso, Alkosto…) | ⬜ Pendiente |
| 4 | PWA: manifest + service worker (funciona offline) | ⬜ Pendiente |
| 4 | Base de datos local (IndexedDB) para guardar facturas | ⬜ Pendiente |
| 5 | Listado y búsqueda de gastos por producto | ⬜ Pendiente |
| 6 | Reportes y gráficas de gastos | ⬜ Pendiente |

---

## Estructura del proyecto

```
misfacturas/
├── index.html              # Interfaz principal
├── config.js               # API key (en .gitignore, no se sube)
├── js/
│   ├── camera.js           # Captura, coordinación OCR y pantalla de revisión
│   ├── ocr.js              # Llamada a Google Cloud Vision API
│   └── parsers/
│       ├── brasimgus.js    # Parser específico para Brasimgus
│       └── index.js        # Detector de tienda y despachador de parsers
└── README.md
```

## Cómo ejecutar localmente

Abre `index.html` directamente en el navegador, o sirve el directorio con cualquier servidor HTTP simple:

```bash
# Con Python
python -m http.server 8080

# Con Node.js (npx)
npx serve .
```
