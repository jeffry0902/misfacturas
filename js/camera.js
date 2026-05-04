// camera.js — Maneja la captura de foto y dispara el OCR

// Referencias a los elementos del DOM
const btnEscanear     = document.getElementById('btnEscanear');
const inputCamara     = document.getElementById('inputCamara');
const areaPreview     = document.getElementById('areaPreview');
const areaPlaceholder = document.getElementById('areaPlaceholder');
const imgPreview      = document.getElementById('imgPreview');

// Elementos del área OCR
const areaOcr         = document.getElementById('areaOcr');
const ocrCargando     = document.getElementById('ocrCargando');
const ocrResultado    = document.getElementById('ocrResultado');
const ocrTexto        = document.getElementById('ocrTexto');
const ocrError        = document.getElementById('ocrError');
const ocrErrorMensaje = document.getElementById('ocrErrorMensaje');

// Al hacer clic en el botón, activamos el input de archivo (que abre la cámara)
btnEscanear.addEventListener('click', () => {
  inputCamara.click();
});

// Cuando el usuario toma o selecciona una foto
inputCamara.addEventListener('change', (evento) => {
  const archivo = evento.target.files[0];

  if (!archivo) return;

  if (!archivo.type.startsWith('image/')) {
    alert('Por favor selecciona una imagen válida.');
    return;
  }

  // Limpiamos el input para permitir volver a seleccionar la misma foto
  inputCamara.value = '';

  // Leemos el archivo como Data URL (base64) — nos sirve tanto para
  // mostrar la imagen como para enviarla a Vision API
  const lector = new FileReader();

  lector.addEventListener('load', async (e) => {
    const dataUrl = e.target.result; // "data:image/jpeg;base64,XXXX..."

    // Mostramos la imagen capturada
    imgPreview.src = dataUrl;
    areaPlaceholder.classList.add('hidden');
    areaPreview.classList.remove('hidden');

    // Preparamos el área OCR: mostramos spinner, ocultamos resultados anteriores
    mostrarEstadoOcr('cargando');

    // Extraemos solo la parte base64, sin el prefijo "data:image/...;base64,"
    const base64 = dataUrl.split(',')[1];

    try {
      const texto = await extraerTextoDeFactura(base64);
      mostrarEstadoOcr('resultado', texto);
    } catch (error) {
      mostrarEstadoOcr('error', error.message);
    }
  });

  lector.readAsDataURL(archivo);
});

/**
 * Controla qué sub-estado muestra el área OCR.
 * @param {'cargando'|'resultado'|'error'} estado
 * @param {string} [contenido] Texto extraído o mensaje de error
 */
function mostrarEstadoOcr(estado, contenido = '') {
  // Primero hacemos visible el contenedor padre
  areaOcr.classList.remove('hidden');
  areaOcr.classList.add('flex');

  // Ocultamos los tres sub-estados
  ocrCargando.classList.add('hidden');
  ocrCargando.classList.remove('flex');
  ocrResultado.classList.add('hidden');
  ocrError.classList.add('hidden');

  if (estado === 'cargando') {
    ocrCargando.classList.remove('hidden');
    ocrCargando.classList.add('flex');
  } else if (estado === 'resultado') {
    ocrTexto.textContent = contenido;
    ocrResultado.classList.remove('hidden');
  } else if (estado === 'error') {
    ocrErrorMensaje.textContent = contenido;
    ocrError.classList.remove('hidden');
  }
}
