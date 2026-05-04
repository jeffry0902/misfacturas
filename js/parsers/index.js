// parsers/index.js — Detecta la tienda y delega al parser correcto

/**
 * Examina el texto OCR, identifica la tienda y devuelve la factura parseada.
 * Si la tienda no se reconoce, devuelve una estructura vacía para llenado manual.
 *
 * @param {string} textoCrudo - Texto extraído por OCR
 * @returns {{ tienda: string, fecha: string|null, items: Array, total: number|null }}
 */
function detectarYParsearFactura(textoCrudo) {
  // Revisamos solo los primeros 200 caracteres para identificar la tienda
  const inicio = textoCrudo.substring(0, 200).toUpperCase();

  if (inicio.includes('BRASIMGUS')) {
    return parsearBrasimgus(textoCrudo);
  }

  // Tienda no reconocida: el usuario completará todo manualmente
  return { tienda: 'Desconocida', fecha: null, items: [], total: null };
}
