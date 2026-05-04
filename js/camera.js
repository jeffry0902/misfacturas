// camera.js — Captura de foto, OCR y pantalla de revisión editable

// ─── Referencias al DOM ───────────────────────────────────────────────────────
const btnEscanear           = document.getElementById('btnEscanear');
const inputCamara           = document.getElementById('inputCamara');
const areaPreview           = document.getElementById('areaPreview');
const areaPlaceholder       = document.getElementById('areaPlaceholder');
const imgPreview            = document.getElementById('imgPreview');

const areaOcr               = document.getElementById('areaOcr');
const ocrCargando           = document.getElementById('ocrCargando');
const ocrResultado          = document.getElementById('ocrResultado');
const btnVerOcr             = document.getElementById('btnVerOcr');
const iconoVerOcr           = document.getElementById('iconoVerOcr');
const contenidoOcr          = document.getElementById('contenidoOcr');
const ocrTexto              = document.getElementById('ocrTexto');
const ocrError              = document.getElementById('ocrError');
const ocrErrorMensaje       = document.getElementById('ocrErrorMensaje');

const areaRevision           = document.getElementById('areaRevision');
const avisoTiendaDesconocida = document.getElementById('avisoTiendaDesconocida');
const revTienda              = document.getElementById('revTienda');
const revFecha               = document.getElementById('revFecha');
const revTotal               = document.getElementById('revTotal');
const listaItemsRevision     = document.getElementById('listaItemsRevision');
const btnAgregarItem         = document.getElementById('btnAgregarItem');
const btnGuardar             = document.getElementById('btnGuardar');

// ─── Captura y flujo principal ────────────────────────────────────────────────

btnEscanear.addEventListener('click', () => inputCamara.click());

inputCamara.addEventListener('change', (evento) => {
  const archivo = evento.target.files[0];
  if (!archivo) return;

  if (!archivo.type.startsWith('image/')) {
    alert('Por favor selecciona una imagen válida.');
    return;
  }
  // Limpiamos para poder volver a seleccionar el mismo archivo si se desea
  inputCamara.value = '';

  const lector = new FileReader();
  lector.addEventListener('load', async (e) => {
    const dataUrl = e.target.result; // "data:image/jpeg;base64,..."

    // Mostrar imagen y ocultar placeholder
    imgPreview.src = dataUrl;
    areaPlaceholder.classList.add('hidden');
    areaPreview.classList.remove('hidden');

    // Ocultar resultados de un escaneo anterior
    ocultarRevision();

    // Mostrar spinner de OCR
    mostrarEstadoOcr('cargando');

    // Enviamos solo la parte base64, sin el prefijo "data:..."
    const base64 = dataUrl.split(',')[1];

    try {
      const texto = await extraerTextoDeFactura(base64);
      mostrarEstadoOcr('resultado', texto);

      const factura = detectarYParsearFactura(texto);
      llenarPantallaRevision(factura);
    } catch (error) {
      mostrarEstadoOcr('error', error.message);
    }
  });

  lector.readAsDataURL(archivo);
});

// ─── Gestión del área OCR ─────────────────────────────────────────────────────

function mostrarEstadoOcr(estado, contenido = '') {
  areaOcr.classList.remove('hidden');
  areaOcr.classList.add('flex');

  // Reseteamos los tres sub-estados
  ocrCargando.classList.add('hidden');
  ocrCargando.classList.remove('flex');
  ocrResultado.classList.add('hidden');
  ocrError.classList.add('hidden');

  if (estado === 'cargando') {
    ocrCargando.classList.remove('hidden');
    ocrCargando.classList.add('flex');

  } else if (estado === 'resultado') {
    ocrTexto.textContent = contenido;
    // El texto crudo empieza colapsado; el usuario lo abre si necesita depurar
    contenidoOcr.classList.add('hidden');
    iconoVerOcr.textContent = '▶';
    ocrResultado.classList.remove('hidden');

  } else if (estado === 'error') {
    ocrErrorMensaje.textContent = contenido;
    ocrError.classList.remove('hidden');
  }
}

// Toggle colapsar / expandir el texto crudo
btnVerOcr.addEventListener('click', () => {
  const estaBaColapsado = contenidoOcr.classList.contains('hidden');
  contenidoOcr.classList.toggle('hidden', !estaBaColapsado);
  iconoVerOcr.textContent = estaBaColapsado ? '▼' : '▶';
});

// ─── Pantalla de revisión ─────────────────────────────────────────────────────

function ocultarRevision() {
  areaRevision.classList.add('hidden');
  areaRevision.classList.remove('flex');
}

function llenarPantallaRevision(factura) {
  // Campos de encabezado
  revTienda.value = factura.tienda ?? '';
  revFecha.value  = factura.fecha  ?? '';
  revTotal.value  = factura.total  != null ? factura.total : '';

  // Renderizar tarjetas de productos
  renderizarItems(factura.items ?? []);

  // Mostrar aviso si la tienda no fue reconocida
  avisoTiendaDesconocida.classList.toggle('hidden', factura.tienda !== 'Desconocida');

  // Mostrar sección y desplazar hacia ella
  areaRevision.classList.remove('hidden');
  areaRevision.classList.add('flex');
  areaRevision.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderizarItems(items) {
  listaItemsRevision.innerHTML = '';
  items.forEach((item, i) => {
    listaItemsRevision.insertAdjacentHTML('beforeend', crearHtmlItem(item, i));
  });
}

function crearHtmlItem(item, index) {
  const unidades = ['Kilos', 'Unidades', 'Litros', 'Otros'];
  const opcionesUnidad = unidades
    .map(u => `<option${item.unidad === u ? ' selected' : ''}>${u}</option>`)
    .join('');

  return `
    <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 relative"
         data-index="${index}">

      <button type="button"
        class="btn-eliminar-item absolute top-3 right-3 text-red-400
               hover:text-red-600 active:text-red-700 text-xl leading-none p-1"
        title="Eliminar producto">🗑️</button>

      <div class="flex flex-col gap-3 pr-10">

        <div>
          <label class="text-xs text-gray-500 mb-1 block">Nombre</label>
          <input type="text"
            class="item-nombre w-full border border-gray-300 rounded-xl px-3 py-3 text-sm
                   focus:outline-none focus:ring-2 focus:ring-indigo-300"
            value="${escapeAttr(item.nombre ?? '')}" />
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="text-xs text-gray-500 mb-1 block">Cantidad</label>
            <input type="number" step="0.001" min="0"
              class="item-cantidad w-full border border-gray-300 rounded-xl px-3 py-3 text-sm
                     focus:outline-none focus:ring-2 focus:ring-indigo-300"
              value="${item.cantidad ?? ''}" />
          </div>
          <div>
            <label class="text-xs text-gray-500 mb-1 block">Unidad</label>
            <select class="item-unidad w-full border border-gray-300 rounded-xl px-3 py-3
                           text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300">
              ${opcionesUnidad}
            </select>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="text-xs text-gray-500 mb-1 block">Precio unitario</label>
            <input type="number" min="0"
              class="item-precio-unitario w-full border border-gray-300 rounded-xl px-3 py-3
                     text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              value="${item.precioUnitario ?? ''}" />
          </div>
          <div>
            <label class="text-xs text-gray-500 mb-1 block">Precio total</label>
            <input type="number" min="0"
              class="item-precio-total w-full border border-gray-300 rounded-xl px-3 py-3
                     text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              value="${item.precioTotal ?? ''}" />
          </div>
        </div>

      </div>
    </div>`;
}

// Escapa caracteres especiales para usarlos dentro de value="..."
function escapeAttr(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ─── Eventos de la pantalla de revisión ──────────────────────────────────────

// Eliminar tarjeta (delegación al contenedor para manejar items dinámicos)
listaItemsRevision.addEventListener('click', (e) => {
  const btn = e.target.closest('.btn-eliminar-item');
  if (btn) btn.closest('[data-index]').remove();
});

// Agregar nueva tarjeta vacía
btnAgregarItem.addEventListener('click', () => {
  const nuevoIndex = listaItemsRevision.children.length;
  listaItemsRevision.insertAdjacentHTML('beforeend',
    crearHtmlItem(
      { nombre: '', cantidad: '', unidad: 'Unidades', precioUnitario: '', precioTotal: '' },
      nuevoIndex
    )
  );
  // Desplazar para que el nuevo item sea visible
  listaItemsRevision.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

// Guardar factura: por ahora muestra el JSON resultante
btnGuardar.addEventListener('click', () => {
  const factura = {
    tienda: revTienda.value.trim(),
    fecha:  revFecha.value,
    total:  parseFloat(revTotal.value) || 0,
    items:  leerItemsDelDom()
  };
  // Hito 4: aquí se guardará en IndexedDB en lugar de alert
  alert(JSON.stringify(factura, null, 2));
});

// Lee todos los campos de las tarjetas de productos desde el DOM
function leerItemsDelDom() {
  return Array.from(listaItemsRevision.querySelectorAll('[data-index]')).map(tarjeta => ({
    nombre:         tarjeta.querySelector('.item-nombre').value.trim(),
    cantidad:       parseFloat(tarjeta.querySelector('.item-cantidad').value)         || 0,
    unidad:         tarjeta.querySelector('.item-unidad').value,
    precioUnitario: parseInt(tarjeta.querySelector('.item-precio-unitario').value, 10) || 0,
    precioTotal:    parseInt(tarjeta.querySelector('.item-precio-total').value, 10)    || 0,
  }));
}
