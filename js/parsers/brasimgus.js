// parsers/brasimgus.js — Parser específico para facturas de Brasimgus

const MESES_BRASIMGUS = {
  ene: '01', feb: '02', mar: '03', abr: '04',
  may: '05', jun: '06', jul: '07', ago: '08',
  sep: '09', oct: '10', nov: '11', dic: '12'
};

function _precioAEntero(str) {
  return parseInt(String(str).replace(/[.,]/g, ''), 10);
}

/**
 * Parsea el texto crudo de una factura de Brasimgus (DOCUMENT_TEXT_DETECTION).
 *
 * El OCR puede romper "Kilos 0 34,500 38,123" en múltiples líneas y, en casos
 * donde dos productos quedan físicamente en columnas adyacentes, intercala el
 * código/nombre del siguiente ítem antes de completar los datos del actual.
 * Se usa una máquina de estados para manejar ambas situaciones.
 *
 * @param {string} textoCrudo
 * @returns {{ tienda, fecha, items, total }}
 */
function parsearBrasimgus(textoCrudo) {
  const resultado = { tienda: 'Brasimgus', fecha: null, items: [], total: null };

  const lineas = textoCrudo.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  const textoNorm = lineas.join(' ');

  // ── Fecha ──────────────────────────────────────────────────────────────────
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
  // "Total:" y el número pueden estar en líneas distintas; se usa texto normalizado.
  const mTotal = textoNorm.match(/Total[^0-9]*([\d,.]+)/i);
  if (mTotal) resultado.total = _precioAEntero(mTotal[1]);

  // ── Items: máquina de estados ───────────────────────────────────────────────
  //
  // Estados:   IDLE → GOT_NAME → GOT_CANT → GOT_KILOS → GOT_PU → (emit) → IDLE
  //
  // Caso intercalado (ej. PECHUGA / PIERNA RES):
  //   El OCR inserta el código+nombre del siguiente ítem entre el "Cant." del
  //   actual y su "Kilos". Se guarda en `pendiente` y se restaura al emitir.
  //
  const reCodigoNombre = /^(\d+)\s+([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s]+)$/;
  const reCant         = /^Cant\.\s+(\d+[.,]\d+)$/i;
  const reKilosConPU   = /^Kilos\s+\d+\s+([\d.,]+)/i;   // "Kilos 0 34,500"
  const reKilosSinPU   = /^Kilos(?:\s+\d+)?\s*$/i;       // "Kilos 0"  o  "Kilos"
  const reImpPU        = /^(\d+)\s+([\d.,]+)$/;           // "0 19,000"
  const rePrecio       = /^[\d.,]+$/;                     // "38,123"

  let estado   = 'IDLE';
  let actual   = null;
  let pendiente = null; // código/nombre del ítem intercalado

  for (const linea of lineas) {
    switch (estado) {

      case 'IDLE': {
        const m = linea.match(reCodigoNombre);
        if (m) {
          actual = { codigo: m[1], nombre: m[2].trim(), cantidad: null, precioUnitario: null, precioTotal: null };
          estado = 'GOT_NAME';
        }
        break;
      }

      case 'GOT_NAME': {
        const m = linea.match(reCant);
        if (m) {
          actual.cantidad = parseFloat(m[1].replace(',', '.'));
          estado = 'GOT_CANT';
        } else if (linea.match(reCodigoNombre)) {
          const mm = linea.match(reCodigoNombre);
          actual = { codigo: mm[1], nombre: mm[2].trim(), cantidad: null, precioUnitario: null, precioTotal: null };
        }
        break;
      }

      case 'GOT_CANT': {
        const mCod = linea.match(reCodigoNombre);
        if (mCod) {
          // Caso intercalado: guardar código/nombre del siguiente ítem
          pendiente = { codigo: mCod[1], nombre: mCod[2].trim() };
        } else if (linea.match(reKilosConPU)) {
          const m = linea.match(reKilosConPU);
          actual.precioUnitario = _precioAEntero(m[1]);
          estado = 'GOT_PU';
        } else if (linea.match(reKilosSinPU)) {
          estado = 'GOT_KILOS';
        }
        break;
      }

      case 'GOT_KILOS': {
        const mImpPU = linea.match(reImpPU);
        if (mImpPU) {
          actual.precioUnitario = _precioAEntero(mImpPU[2]);
          estado = 'GOT_PU';
        } else if (linea.match(rePrecio)) {
          actual.precioUnitario = _precioAEntero(linea);
          estado = 'GOT_PU';
        }
        break;
      }

      case 'GOT_PU': {
        if (linea.match(rePrecio)) {
          actual.precioTotal = _precioAEntero(linea);
          resultado.items.push({ ...actual, unidad: 'Kilos' });
          if (pendiente) {
            actual  = { ...pendiente, cantidad: null, precioUnitario: null, precioTotal: null };
            pendiente = null;
            estado  = 'GOT_NAME';
          } else {
            actual = null;
            estado = 'IDLE';
          }
        }
        break;
      }
    }
  }

  console.log('[Brasimgus] Items detectados:', resultado.items.length);
  console.log('[Brasimgus] Items:', resultado.items);
  console.log('[Brasimgus] Total:', resultado.total);

  return resultado;
}
