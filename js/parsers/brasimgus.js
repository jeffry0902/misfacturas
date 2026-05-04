// parsers/brasimgus.js — Parser específico para facturas de Brasimgus

// Mapa de abreviaturas de mes en español a número de mes
const MESES_BRASIMGUS = {
  ene: '01', feb: '02', mar: '03', abr: '04',
  may: '05', jun: '06', jul: '07', ago: '08',
  sep: '09', oct: '10', nov: '11', dic: '12'
};

// Quita separadores de miles (coma o punto) y devuelve un entero.
// Ejemplo: "34,500" → 34500  /  "38.123" → 38123
function _precioAEntero(str) {
  return parseInt(str.replace(/[,.]/g, ''), 10);
}

/**
 * Parsea el texto crudo de una factura de Brasimgus.
 *
 * Formato esperado por producto (dos líneas consecutivas):
 *   Línea A: "52 MOLIDA ESPECIAL"
 *   Línea B: "Cant. 1.11 Kilos 0 34,500 38,123"
 *
 * @param {string} textoCrudo - Texto extraído por OCR
 * @returns {{ tienda, fecha, items, total }}
 */
function parsearBrasimgus(textoCrudo) {
  const resultado = { tienda: 'Brasimgus', fecha: null, items: [], total: null };

  // Separamos en líneas, recortamos espacios y descartamos vacías
  const lineas = textoCrudo.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  // ── Fecha ──────────────────────────────────────────────────────────────────
  // Patrón: "Fecha: 18-abr.-2026"
  const reFecha = /(\d{1,2})-(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)\.-(\d{4})/i;
  for (const linea of lineas) {
    const m = linea.match(reFecha);
    if (m) {
      const dia = m[1].padStart(2, '0');
      const mes = MESES_BRASIMGUS[m[2].toLowerCase()] ?? '01';
      resultado.fecha = `${m[3]}-${mes}-${dia}`;
      break;
    }
  }

  // ── Total ──────────────────────────────────────────────────────────────────
  // Busca la primera línea que contiene "Total" seguido de un número
  const reTotal = /Total[^0-9]*([\d,.]+)/i;
  for (const linea of lineas) {
    const m = linea.match(reTotal);
    if (m) {
      resultado.total = _precioAEntero(m[1]);
      break;
    }
  }

  // ── Items ──────────────────────────────────────────────────────────────────
  // Patrón de línea B: "Cant. 1.11 Kilos 0 34,500 38,123"
  const reCant = /^Cant\.\s+(\d+[.,]\d+)\s+Kilos\s+0\s+([\d,.]+)\s+([\d,.]+)/i;

  for (let i = 1; i < lineas.length; i++) {
    const m = lineas[i].match(reCant);
    if (!m) continue;

    // La línea inmediatamente anterior contiene el código y nombre
    const lineaAnterior = lineas[i - 1];
    const mCodigo = lineaAnterior.match(/^(\d+)\s+(.+)$/);

    const codigo  = mCodigo ? mCodigo[1] : '';
    const nombre  = mCodigo ? mCodigo[2] : lineaAnterior;

    // La cantidad usa punto como separador decimal; puede venir con coma
    const cantidad       = parseFloat(m[1].replace(',', '.'));
    const precioUnitario = _precioAEntero(m[2]);
    const precioTotal    = _precioAEntero(m[3]);

    resultado.items.push({ codigo, nombre, cantidad, unidad: 'Kilos', precioUnitario, precioTotal });
  }

  return resultado;
}
