// ocr.js — Extrae texto de una imagen usando Google Cloud Vision API

/**
 * Envía una imagen a Google Vision API y devuelve el texto detectado.
 * @param {string} imagenBase64 - Imagen en base64 SIN el prefijo "data:image/...;base64,"
 * @returns {Promise<string>} Texto extraído de la imagen
 * @throws {Error} Si la API falla o no detecta texto
 */
async function extraerTextoDeFactura(imagenBase64) {
  // Verificamos que config.js fue cargado y tiene la clave
  if (typeof CONFIG === 'undefined' || !CONFIG.GOOGLE_VISION_API_KEY) {
    throw new Error(
      'Falta la API key. Crea el archivo config.js con: ' +
      'const CONFIG = { GOOGLE_VISION_API_KEY: "tu-clave" };'
    );
  }

  const url = `https://vision.googleapis.com/v1/images:annotate?key=${CONFIG.GOOGLE_VISION_API_KEY}`;

  // Formato de petición que requiere Vision API
  const cuerpo = {
    requests: [
      {
        image: { content: imagenBase64 },
        features: [{ type: 'TEXT_DETECTION', maxResults: 1 }]
      }
    ]
  };

  let respuesta;
  try {
    respuesta = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cuerpo)
    });
  } catch (errorRed) {
    throw new Error('No se pudo conectar con Vision API. Verifica tu conexión a internet.');
  }

  if (!respuesta.ok) {
    throw new Error(`Error HTTP ${respuesta.status} al llamar Vision API.`);
  }

  const datos = await respuesta.json();

  // Vision API puede devolver errores dentro del cuerpo 200 OK
  const errorApi = datos.responses?.[0]?.error;
  if (errorApi) {
    throw new Error(`Vision API (${errorApi.code}): ${errorApi.message}`);
  }

  // fullTextAnnotation.text es el texto completo con saltos de línea preservados.
  // textAnnotations[0].description es el fallback equivalente.
  const texto =
    datos.responses?.[0]?.fullTextAnnotation?.text ||
    datos.responses?.[0]?.textAnnotations?.[0]?.description;

  if (!texto) {
    throw new Error('No se detectó texto en la imagen. Intenta con una foto más nítida y bien iluminada.');
  }

  return texto;
}
