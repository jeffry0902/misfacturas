// camera.js — Maneja la captura de foto desde la cámara del dispositivo

// Referencias a los elementos del DOM
const btnEscanear     = document.getElementById('btnEscanear');
const inputCamara     = document.getElementById('inputCamara');
const areaPreview     = document.getElementById('areaPreview');
const areaPlaceholder = document.getElementById('areaPlaceholder');
const imgPreview      = document.getElementById('imgPreview');

// Al hacer clic en el botón, activamos el input de archivo (que abre la cámara)
btnEscanear.addEventListener('click', () => {
  inputCamara.click();
});

// Cuando el usuario toma o selecciona una foto
inputCamara.addEventListener('change', (evento) => {
  const archivo = evento.target.files[0];

  // Si no se seleccionó ningún archivo, no hacemos nada
  if (!archivo) return;

  // Verificamos que el archivo sea una imagen
  if (!archivo.type.startsWith('image/')) {
    alert('Por favor selecciona una imagen válida.');
    return;
  }

  // Creamos una URL temporal en memoria para mostrar la imagen sin subirla a ningún servidor
  const urlTemporal = URL.createObjectURL(archivo);

  // Asignamos la URL al elemento <img> para mostrar la foto
  imgPreview.src = urlTemporal;

  // Mostramos el área de previsualización y ocultamos el placeholder
  areaPlaceholder.classList.add('hidden');
  areaPreview.classList.remove('hidden');

  // Liberamos la URL temporal de memoria cuando la imagen termine de cargar
  imgPreview.addEventListener('load', () => {
    URL.revokeObjectURL(urlTemporal);
  }, { once: true });

  // Limpiamos el input para permitir volver a tomar la misma foto si se desea
  inputCamara.value = '';
});
