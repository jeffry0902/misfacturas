# Mis Facturas

Aplicación web progresiva (PWA) para escanear facturas de compras y llevar un control de gastos por producto. Construida con HTML, CSS (Tailwind) y JavaScript vanilla, sin frameworks.

---

## Hitos planeados

| Hito | Descripción | Estado |
|------|-------------|--------|
| 1 | Esqueleto inicial con captura de foto | ✅ Listo |
| 2 | PWA: manifest + service worker (funciona offline) | ⬜ Pendiente |
| 3 | OCR: extracción de texto de la foto (Tesseract.js) | ⬜ Pendiente |
| 4 | Base de datos local (IndexedDB) para guardar facturas | ⬜ Pendiente |
| 5 | Listado y búsqueda de gastos por producto | ⬜ Pendiente |
| 6 | Reportes y gráficas de gastos | ⬜ Pendiente |

---

## Estructura del proyecto

```
misfacturas/
├── index.html       # Interfaz principal
├── js/
│   └── camera.js    # Lógica de captura de foto
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
