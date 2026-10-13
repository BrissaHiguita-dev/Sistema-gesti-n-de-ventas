// ==========================================
// ESTADO GLOBAL Y CONFIGURACIÓN INICIAL
// ==========================================
let insumos = [];
let recetaActual = [];
let catalogo = [];
let ventas = [];
let gastos = [];
let categorias = ['MINI DONAS', 'DESAYUNOS', 'ARTE Y VELAS', 'OTROS'];
let categoriaFiltroActual = 'TODOS';

let chartBalanceInstance = null;
let chartPopularesInstance = null;

const insumosDemo = [
  { id: '1', nombre: 'Caja Regalo Decorada', categoria: 'EMPAQUES', cantidad: 10, unidad: 'unidades', costo: 20000, costoUnitario: 2000 },
  { id: '2', nombre: 'Nutella 350g', categoria: 'MATERIA PRIMA', cantidad: 350, unidad: 'gramos', costo: 24500, costoUnitario: 70 },
  { id: '3', nombre: 'Mini Donas Glaseadas', categoria: 'MATERIA PRIMA', cantidad: 100, unidad: 'unidades', costo: 40000, costoUnitario: 400 }
];

// ==========================================
// INICIALIZACIÓN Y EVENTOS DOM
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  if (typeof lucide !== 'undefined') lucide.createIcons();
  cargarDatosDesdeStorage();
  inicializarEventos();

  if (localStorage.getItem('des_sesion_activa') === 'true') {
    iniciarApp();
  }
});

function inicializarEventos() {
  const loginForm = document.getElementById('login-form');
  if (loginForm) loginForm.addEventListener('submit', (e) => { e.preventDefault(); handleLogin(); });

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.getAttribute('data-tab')));
  });

  const formInsumo = document.getElementById('form-insumo');
  if (formInsumo) formInsumo.addEventListener('submit', (e) => { e.preventDefault(); guardarInsumo(); });

  const formGasto = document.getElementById('form-gasto');
  if (formGasto) formGasto.addEventListener('submit', (e) => { e.preventDefault(); guardarGasto(); });

  const addRecipeBtn = document.getElementById('add-to-recipe-btn');
  if (addRecipeBtn) addRecipeBtn.addEventListener('click', agregarInsumoAReceta);

  const costosFijosInput = document.getElementById('receta-costos-fijos');
  if (costosFijosInput) costosFijosInput.addEventListener('input', calcularTotalesReceta);

  const margenInput = document.getElementById('receta-margen');
  if (margenInput) margenInput.addEventListener('input', calcularTotalesReceta);

  const saveRecipeBtn = document.getElementById('save-recipe-btn');
  if (saveRecipeBtn) saveRecipeBtn.addEventListener('click', guardarProductoEnCatalogo);

  const formVenta = document.getElementById('form-venta');
  if (formVenta) formVenta.addEventListener('submit', (e) => { e.preventDefault(); registrarVenta(); });
}

function handleLogin() {
  localStorage.setItem('des_sesion_activa', 'true');
  iniciarApp();
}

function handleLogout() {
  localStorage.removeItem('des_sesion_activa');
  document.getElementById('app-container').classList.add('hidden');
  document.getElementById('login-screen').classList.remove('hidden');
}

function iniciarApp() {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('app-container').classList.remove('hidden');
  establecerFechasPorDefecto();
  switchTab('tab-dashboard');
}

function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('bg-pink-100', 'text-pink-700', 'font-bold'));

  const currentTab = document.getElementById(tabId);
  if (currentTab) currentTab.classList.remove('hidden');

  const activeBtn = document.getElementById('nav-' + tabId);
  if (activeBtn) activeBtn.classList.add('bg-pink-100', 'text-pink-700', 'font-bold');

  if (tabId === 'tab-dashboard') renderDashboard();
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function establecerFechasPorDefecto() {
  const hoy = new Date().toISOString().split('T')[0];
  const inputVenta = document.getElementById('venta-fecha-input');
  const inputGasto = document.getElementById('gasto-fecha');
  
  if (inputVenta && !inputVenta.value) inputVenta.value = hoy;
  if (inputGasto && !inputGasto.value) inputGasto.value = hoy;
}

// ==========================================
// PERSISTENCIA (LOCALSTORAGE)
// ==========================================
function cargarDatosDesdeStorage() {
  insumos = JSON.parse(localStorage.getItem('des_insumos')) || insumosDemo;
  catalogo = JSON.parse(localStorage.getItem('des_catalogo')) || [];
  ventas = JSON.parse(localStorage.getItem('des_ventas')) || [];
  gastos = JSON.parse(localStorage.getItem('des_gastos')) || [];
  
  const catGuardadas = JSON.parse(localStorage.getItem('des_categorias'));
  if (catGuardadas && catGuardadas.length > 0) categorias = catGuardadas;

  guardarEnStorage();
  renderInsumos();
  renderGastos();
  renderSelectorCategorias();
  actualizarSelectores();
  renderFiltrosCatalogo();
  renderCatalogo();
  renderVentas();
}

function guardarEnStorage() {
  localStorage.setItem('des_insumos', JSON.stringify(insumos));
  localStorage.setItem('des_catalogo', JSON.stringify(catalogo));
  localStorage.setItem('des_ventas', JSON.stringify(ventas));
  localStorage.setItem('des_gastos', JSON.stringify(gastos));
  localStorage.setItem('des_categorias', JSON.stringify(categorias));
}

// ==========================================
// MÓDULO: GASTOS OPERATIVOS
// ==========================================
function guardarGasto() {
  const nombre = document.getElementById('gasto-nombre').value.trim();
  const valor = parseFloat(document.getElementById('gasto-valor').value);
  const fechaInput = document.getElementById('gasto-fecha').value;

  if (!nombre || !valor || !fechaInput) return;

  const [year, month, day] = fechaInput.split('-');
  const fechaSeleccionada = new Date(year, month - 1, day, 12, 0, 0);

  const nuevoGasto = {
    id: Date.now().toString(),
    fecha: `${day}/${month}/${year}`,
    fechaObj: fechaSeleccionada.toISOString(),
    nombre,
    valor
  };

  gastos.push(nuevoGasto);
  guardarEnStorage();
  renderGastos();
  renderDashboard();

  document.getElementById('gasto-nombre').value = '';
  document.getElementById('gasto-valor').value = '';
  establecerFechasPorDefecto();
}

function renderGastos() {
  const tbody = document.getElementById('tabla-gastos-body');
  if (!tbody) return;
  tbody.innerHTML = '';

  gastos.forEach(g => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="p-4 text-xs text-slate-500">${g.fecha}</td>
      <td class="p-4 font-semibold text-slate-800">${g.nombre}</td>
      <td class="p-4 font-bold text-rose-500">$${g.valor.toLocaleString()}</td>
      <td class="p-4 text-right">
        <button onclick="eliminarGasto('${g.id}')" class="text-rose-500 hover:text-rose-700 text-xs font-semibold">Eliminar</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function eliminarGasto(id) {
  gastos = gastos.filter(g => g.id !== id);
  guardarEnStorage();
  renderGastos();
  renderDashboard();
}

// ==========================================
// MÓDULO: CATEGORÍAS
// ==========================================
function renderSelectorCategorias() {
  const select = document.getElementById('receta-categoria');
  if (!select) return;

  select.innerHTML = categorias.map(c => `<option value="${c}">${c}</option>`).join('') +
    `<option value="__NUEVA__" class="text-pink-600 font-bold">+ Nueva categoría...</option>`;

  select.onchange = () => {
    const inputNueva = document.getElementById('receta-nueva-categoria');
    if (select.value === '__NUEVA__') {
      inputNueva.classList.remove('hidden');
      inputNueva.focus();
    } else {
      inputNueva.classList.add('hidden');
    }
  };
}

function obtenerCategoriaSeleccionada() {
  const select = document.getElementById('receta-categoria');
  const inputNueva = document.getElementById('receta-nueva-categoria');

  if (select.value === '__NUEVA__') {
    const nueva = inputNueva.value.trim().toUpperCase();
    if (!nueva) return 'OTROS';

    if (!categorias.includes(nueva)) {
      categorias.push(nueva);
      guardarEnStorage();
      renderSelectorCategorias();
      renderFiltrosCatalogo();
    }
    inputNueva.value = '';
    inputNueva.classList.add('hidden');
    return nueva;
  }
  return select.value;
}

// ==========================================
// MÓDULO: INVENTARIO DE INSUMOS (CON CATEGORÍA)
// ==========================================
function guardarInsumo() {
  const nombre = document.getElementById('insumo-nombre').value;
  const categoria = document.getElementById('insumo-categoria').value;
  const cantidad = parseFloat(document.getElementById('insumo-cantidad').value);
  const unidad = document.getElementById('insumo-unidad').value;
  const costo = parseFloat(document.getElementById('insumo-costo').value);

  insumos.push({
    id: Date.now().toString(),
    nombre,
    categoria,
    cantidad,
    unidad,
    costo,
    costoUnitario: costo / cantidad
  });

  guardarEnStorage();
  renderInsumos();
  actualizarSelectores();

  document.getElementById('insumo-nombre').value = '';
  document.getElementById('insumo-cantidad').value = '';
  document.getElementById('insumo-costo').value = '';
}

function renderInsumos() {
  const tbody = document.getElementById('tabla-insumos-body');
  if (!tbody) return;
  tbody.innerHTML = '';

  insumos.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="p-4 font-semibold text-slate-800">${item.nombre}</td>
      <td class="p-4"><span class="px-2 py-0.5 bg-pink-100 text-pink-700 font-bold text-[10px] rounded-md">${item.categoria || 'MATERIA PRIMA'}</span></td>
      <td class="p-4">${item.cantidad} ${item.unidad}</td>
      <td class="p-4">$${item.costo.toLocaleString()}</td>
      <td class="p-4 text-pink-600 font-bold">$${item.costoUnitario.toFixed(2)} / ${item.unidad.slice(0, -1)}</td>
      <td class="p-4 text-right">
        <button onclick="eliminarInsumo('${item.id}')" class="text-rose-500 hover:text-rose-700 text-xs font-semibold">Eliminar</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function eliminarInsumo(id) {
  insumos = insumos.filter(i => i.id !== id);
  guardarEnStorage();
  renderInsumos();
  actualizarSelectores();
}

function actualizarSelectores() {
  const selectReceta = document.getElementById('receta-insumo-select');
  const selectVenta = document.getElementById('venta-producto-select');

  if (selectReceta) {
    selectReceta.innerHTML = insumos.map(i => `<option value="${i.id}">[${i.categoria || 'MATERIA'}] ${i.nombre} ($${i.costoUnitario.toFixed(2)}/${i.unidad.slice(0, -1)})</option>`).join('');
  }
  if (selectVenta) {
    selectVenta.innerHTML = catalogo.map(c => `<option value="${c.id}">${c.nombre} ($${c.precioVenta.toLocaleString()})</option>`).join('');
  }
}

// ==========================================
// MÓDULO: CALCULADORA & COTIZADOR
// ==========================================
function agregarInsumoAReceta() {
  const insumoId = document.getElementById('receta-insumo-select').value;
  const cant = parseFloat(document.getElementById('receta-insumo-cant').value);

  if (!cant || cant <= 0) return;

  const insumoObj = insumos.find(i => i.id === insumoId);
  if (!insumoObj) return;

  recetaActual.push({
    id: insumoObj.id,
    nombre: insumoObj.nombre,
    cantidad: cant,
    unidad: insumoObj.unidad,
    costoDirecto: insumoObj.costoUnitario * cant
  });

  document.getElementById('receta-insumo-cant').value = '';
  renderRecetaActual();
}

function renderRecetaActual() {
  const tbody = document.getElementById('receta-items-body');
  if (!tbody) return;
  tbody.innerHTML = '';

  recetaActual.forEach((item, index) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="p-3 font-semibold">${item.nombre}</td>
      <td class="p-3">${item.cantidad} ${item.unidad}</td>
      <td class="p-3 text-slate-800 font-bold">$${item.costoDirecto.toLocaleString()}</td>
      <td class="p-3 text-right"><button onclick="quitarItemReceta(${index})" class="text-rose-500 font-bold">✕</button></td>
    `;
    tbody.appendChild(tr);
  });
  calcularTotalesReceta();
}

function quitarItemReceta(index) {
  recetaActual.splice(index, 1);
  renderRecetaActual();
}

function calcularTotalesReceta() {
  const costoInsumos = recetaActual.reduce((acc, i) => acc + i.costoDirecto, 0);
  const costosFijos = parseFloat(document.getElementById('receta-costos-fijos').value) || 0;
  const margen = parseFloat(document.getElementById('receta-margen').value) || 0;
  const costoTotal = costoInsumos + costosFijos;
  
  let precioVenta = margen < 100 ? costoTotal / (1 - (margen / 100)) : 0;
  precioVenta = Math.ceil(precioVenta / 100) * 100;
  
  document.getElementById('resumen-costo-total').innerText = '$' + costoTotal.toLocaleString();
  document.getElementById('resumen-precio-venta').innerText = '$' + precioVenta.toLocaleString();
  document.getElementById('resumen-ganancia-limpia').innerText = '$' + (precioVenta - costoTotal).toLocaleString();

  return { costoTotal, precioVenta };
}

function guardarProductoEnCatalogo() {
  const nombre = document.getElementById('receta-nombre').value;
  const categoria = obtenerCategoriaSeleccionada();

  if (!nombre || recetaActual.length === 0) {
    alert('Ingresa el nombre del combo y al menos un insumo.');
    return;
  }

  const { costoTotal, precioVenta } = calcularTotalesReceta();

  catalogo.push({
    id: Date.now().toString(),
    nombre,
    categoria: categoria || 'OTROS',
    costoTotal,
    precioVenta,
    ganancia: precioVenta - costoTotal,
    items: [...recetaActual]
  });

  guardarEnStorage();
  renderFiltrosCatalogo();
  renderCatalogo();
  actualizarSelectores();

  recetaActual = [];
  document.getElementById('receta-nombre').value = '';
  renderRecetaActual();
  switchTab('tab-catalogo');
}

function generarCotizacionRapida() {
  const nombre = document.getElementById('receta-nombre').value.trim() || 'Cotización Especial';
  const { costoTotal, precioVenta } = calcularTotalesReceta();

  if (recetaActual.length === 0) {
    alert('Agrega insumos a la calculadora para cotizar.');
    return;
  }

  let detalleItems = recetaActual.map(i => `- ${i.cantidad} ${i.unidad} de ${i.nombre}`).join('\n');

  const mensaje = `📋 *COTIZACIÓN - EL MUNDO DE LAS MINI DONAS* 🍩\n\n` +
    `✨ *Producto:* ${nombre}\n\n` +
    `📦 *Detalle / Ingredientes:*\n${detalleItems}\n\n` +
    `💰 *Valor Total Sugerido:* $${precioVenta.toLocaleString()}\n\n` +
    `¡Cotización válida por 3 días! Manizales, Caldas. ❤️`;

  const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(mensaje)}`;
  window.open(url, '_blank');
}

// ==========================================
// MÓDULO: CATÁLOGO DE COMBOS
// ==========================================
function renderFiltrosCatalogo() {
  const container = document.getElementById('catalogo-filtros-container');
  if (!container) return;

  container.innerHTML = ['TODOS', ...categorias].map(cat => {
    const esActivo = categoriaFiltroActual === cat;
    return `<button onclick="filtrarCatalogo('${cat}')" class="px-4 py-2 ${esActivo ? 'bg-pink-600 text-white font-bold' : 'bg-pink-100 text-slate-600 hover:text-slate-900'} rounded-xl text-xs transition shadow-sm">${cat}</button>`;
  }).join('');
}

function filtrarCatalogo(cat) {
  categoriaFiltroActual = cat;
  renderFiltrosCatalogo();
  renderCatalogo();
}

function renderCatalogo() {
  const grid = document.getElementById('catalogo-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const productos = categoriaFiltroActual === 'TODOS' ? catalogo : catalogo.filter(p => (p.categoria || 'OTROS') === categoriaFiltroActual);

  if (productos.length === 0) {
    grid.innerHTML = '<div class="col-span-full py-12 text-center text-slate-400 text-sm">No hay productos guardados en esta categoría.</div>';
    return;
  }

  productos.forEach(p => {
    const card = document.createElement('div');
    card.className = 'p-6 bg-white/90 border border-pink-200/80 rounded-3xl shadow-sm space-y-4';
    card.innerHTML = `
      <div class="flex items-start justify-between gap-2">
        <div>
          <span class="inline-block px-2 py-0.5 bg-pink-100 text-pink-700 font-bold text-[10px] rounded-md mb-1 uppercase tracking-wider">${p.categoria || 'OTROS'}</span>
          <h3 class="font-bold text-slate-900 text-lg">${p.nombre}</h3>
        </div>
        <span class="px-2.5 py-1 bg-pink-500/10 text-pink-600 font-bold text-xs rounded-full shrink-0">$${p.precioVenta.toLocaleString()}</span>
      </div>
      <div class="text-xs text-slate-600 space-y-1">
        <div class="flex justify-between"><span>Costo Producción:</span><span class="text-slate-800 font-semibold">$${p.costoTotal.toLocaleString()}</span></div>
        <div class="flex justify-between"><span>Ganancia Limpia:</span><span class="text-emerald-600 font-semibold">$${p.ganancia.toLocaleString()}</span></div>
      </div>
      <button onclick="eliminarProductoCatalogo('${p.id}')" class="w-full py-2 bg-pink-50 hover:bg-rose-50 hover:text-rose-600 text-slate-500 text-xs rounded-xl font-medium transition">Eliminar del Catálogo</button>
    `;
    grid.appendChild(card);
  });
}

function eliminarProductoCatalogo(id) {
  catalogo = catalogo.filter(c => c.id !== id);
  guardarEnStorage();
  renderCatalogo();
  actualizarSelectores();
}

// ==========================================
// MÓDULO: LOGÍSTICA DE PEDIDOS, RECIBOS Y WHATSAPP
// ==========================================
function registrarVenta() {
  const prodId = document.getElementById('venta-producto-select').value;
  const cant = parseInt(document.getElementById('venta-cantidad').value);
  const fechaInput = document.getElementById('venta-fecha-input').value;
  const horario = document.getElementById('venta-horario').value;
  const destinatario = document.getElementById('venta-destinatario').value.trim() || 'No especificado';
  const direccion = document.getElementById('venta-direccion').value.trim() || 'No especificada';
  const telefono = document.getElementById('venta-telefono').value.trim() || 'Sin teléfono';

  const prodObj = catalogo.find(c => c.id === prodId);
  if (!prodObj) {
    alert('Selecciona un producto del catálogo.');
    return;
  }

  const [year, month, day] = fechaInput.split('-');
  const fechaSeleccionada = new Date(year, month - 1, day, 12, 0, 0);

  const nuevaVenta = {
    id: Date.now().toString(),
    fecha: `${day}/${month}/${year}`,
    fechaObj: fechaSeleccionada.toISOString(),
    horario,
    destinatario,
    direccion,
    telefono,
    producto: prodObj.nombre,
    cantidad: cant,
    totalCobrado: prodObj.precioVenta * cant,
    gananciaNeta: prodObj.ganancia * cant,
    estado: 'Pendiente'
  };

  ventas.push(nuevaVenta);
  guardarEnStorage();
  renderVentas();
  renderDashboard();

  document.getElementById('venta-destinatario').value = '';
  document.getElementById('venta-direccion').value = '';
  document.getElementById('venta-telefono').value = '';
}

function renderVentas() {
  const tbody = document.getElementById('tabla-ventas-body');
  if (!tbody) return;
  tbody.innerHTML = '';

  ventas.forEach(v => {
    const badgeColor = v.estado === 'Entregado' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-amber-50 text-amber-600 border-amber-200';
    
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="p-4 text-xs">
        <div class="font-bold text-slate-900">${v.fecha}</div>
        <div class="text-slate-500">${v.horario}</div>
      </td>
      <td class="p-4 text-xs">
        <div class="font-semibold text-slate-900">${v.destinatario}</div>
        <div class="text-slate-500">${v.direccion}</div>
        <div class="text-pink-600 font-medium">${v.telefono}</div>
      </td>
      <td class="p-4 text-sm font-semibold text-slate-800">${v.cantidad}x ${v.producto}</td>
      <td class="p-4 text-xs">
        <div class="font-bold text-emerald-600">Cobro: $${v.totalCobrado.toLocaleString()}</div>
        <div class="font-bold text-pink-600">Ganancia: $${v.gananciaNeta.toLocaleString()}</div>
      </td>
      <td class="p-4">
        <select onchange="cambiarEstadoPedido('${v.id}', this.value)" class="px-2.5 py-1 text-xs font-semibold rounded-lg border ${badgeColor} bg-white focus:outline-none">
          <option value="Pendiente" ${v.estado === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
          <option value="En Preparación" ${v.estado === 'En Preparación' ? 'selected' : ''}>En Preparación</option>
          <option value="En Camino" ${v.estado === 'En Camino' ? 'selected' : ''}>En Camino</option>
          <option value="Entregado" ${v.estado === 'Entregado' ? 'selected' : ''}>Entregado</option>
        </select>
      </td>
      <td class="p-4 text-right space-y-1 sm:space-y-0 sm:space-x-1.5 flex flex-wrap justify-end items-center">
        <button onclick="enviarPedidoWhatsApp('${v.id}')" class="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow-sm">WhatsApp</button>
        <button onclick="abrirModalRecibo('${v.id}')" class="px-2.5 py-1.5 bg-pink-100 hover:bg-pink-200 text-pink-700 text-xs font-bold rounded-xl transition">Recibo</button>
        <button onclick="eliminarVenta('${v.id}')" class="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-xl transition">Anular</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function cambiarEstadoPedido(id, nuevoEstado) {
  const venta = ventas.find(v => v.id === id);
  if (venta) {
    venta.estado = nuevoEstado;
    guardarEnStorage();
    renderVentas();
  }
}

function eliminarVenta(id) {
  ventas = ventas.filter(v => v.id !== id);
  guardarEnStorage();
  renderVentas();
  renderDashboard();
}

function enviarPedidoWhatsApp(id) {
  const v = ventas.find(v => v.id === id);
  if (!v) return;

  const mensaje = `🎁 *NUEVO PEDIDO - EL MUNDO DE LAS MINI DONAS* 🍩\n\n` +
    `🗓 *Fecha de Entrega:* ${v.fecha}\n` +
    `⏰ *Franja Horaria:* ${v.horario}\n\n` +
    `👤 *Homenajeado(a):* ${v.destinatario}\n` +
    `📍 *Dirección:* ${v.direccion}\n` +
    `📞 *Teléfono:* ${v.telefono}\n\n` +
    `📦 *Detalle del Pedido:*\n` +
    `- ${v.cantidad}x ${v.producto}\n\n` +
    `💰 *Total a Cancelar:* $${v.totalCobrado.toLocaleString()}\n\n` +
    `¡Gracias por elegirnos! ❤️`;

  let telLimpio = v.telefono.replace(/\D/g, '');
  if (telLimpio.length === 10) telLimpio = '57' + telLimpio;

  const url = `https://api.whatsapp.com/send?phone=${telLimpio}&text=${encodeURIComponent(mensaje)}`;
  window.open(url, '_blank');
}

function abrirModalRecibo(id) {
  const v = ventas.find(v => v.id === id);
  if (!v) return;

  document.getElementById('rec-fecha').innerText = new Date().toLocaleDateString();
  document.getElementById('rec-entrega').innerText = v.fecha;
  document.getElementById('rec-horario').innerText = v.horario;
  document.getElementById('rec-destinatario').innerText = v.destinatario;
  document.getElementById('rec-direccion').innerText = v.direccion;
  document.getElementById('rec-telefono').innerText = v.telefono;
  document.getElementById('rec-producto').innerText = `${v.cantidad}x ${v.producto}`;
  document.getElementById('rec-total').innerText = `$${v.totalCobrado.toLocaleString()}`;

  document.getElementById('modal-recibo').classList.remove('hidden');
}

function cerrarModalRecibo() {
  document.getElementById('modal-recibo').classList.add('hidden');
}

// ==========================================
// MÓDULO: DASHBOARD & GRÁFICOS (CHART.JS)
// ==========================================
function limpiarFiltroFechas() {
  document.getElementById('dash-fecha-inicio').value = '';
  document.getElementById('dash-fecha-fin').value = '';
  renderDashboard();
}

function renderDashboard() {
  const fInicioVal = document.getElementById('dash-fecha-inicio')?.value;
  const fFinVal = document.getElementById('dash-fecha-fin')?.value;

  const ventasFiltradas = ventas.filter(v => {
    if (!v.fechaObj) return true;
    const fechaVenta = new Date(v.fechaObj);
    if (fInicioVal && fechaVenta < new Date(fInicioVal + 'T00:00:00')) return false;
    if (fFinVal && fechaVenta > new Date(fFinVal + 'T23:59:59')) return false;
    return true;
  });

  const gastosFiltrados = gastos.filter(g => {
    if (!g.fechaObj) return true;
    const fechaGasto = new Date(g.fechaObj);
    if (fInicioVal && fechaGasto < new Date(fInicioVal + 'T00:00:00')) return false;
    if (fFinVal && fechaGasto > new Date(fFinVal + 'T23:59:59')) return false;
    return true;
  });

  const totalVentas = ventasFiltradas.reduce((acc, v) => acc + v.totalCobrado, 0);
  const totalGananciaBruta = ventasFiltradas.reduce((acc, v) => acc + v.gananciaNeta, 0);
  const totalGastos = gastosFiltrados.reduce((acc, g) => acc + g.valor, 0);
  
  const utilidadNetaReal = totalGananciaBruta - totalGastos;

  document.getElementById('kpi-ventas-totales').innerText = '$' + totalVentas.toLocaleString();
  document.getElementById('kpi-ganancia-total').innerText = '$' + totalGananciaBruta.toLocaleString();
  document.getElementById('kpi-gastos-totales').innerText = '$' + totalGastos.toLocaleString();
  
  const kpiUtilidad = document.getElementById('kpi-utilidad-neta');
  if (kpiUtilidad) {
    kpiUtilidad.innerText = '$' + utilidadNetaReal.toLocaleString();
  }

  document.getElementById('kpi-pedidos-count').innerText = ventasFiltradas.length;

  // Gráfico Balance
  const canvasBalance = document.getElementById('chart-balance');
  if (canvasBalance) {
    if (chartBalanceInstance) chartBalanceInstance.destroy();
    chartBalanceInstance = new Chart(canvasBalance.getContext('2d'), {
      type: 'bar',
      data: {
        labels: ['Ventas Brutas', 'Utilidad Neta Real'],
        datasets: [{ data: [totalVentas, utilidadNetaReal], backgroundColor: ['#ec4899', '#f43f5e'], borderRadius: 10 }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { ticks: { color: '#64748b' }, grid: { color: '#f1f5f9' } },
          x: { ticks: { color: '#64748b' }, grid: { display: false } }
        }
      }
    });
  }

  // Gráfico Populares
  const canvasPopulares = document.getElementById('chart-populares');
  if (canvasPopulares) {
    const conteo = {};
    ventasFiltradas.forEach(v => { conteo[v.producto] = (conteo[v.producto] || 0) + v.cantidad; });
    if (chartPopularesInstance) chartPopularesInstance.destroy();
    chartPopularesInstance = new Chart(canvasPopulares.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: Object.keys(conteo).length > 0 ? Object.keys(conteo) : ['Sin ventas'],
        datasets: [{ data: Object.values(conteo).length > 0 ? Object.values(conteo) : [1], backgroundColor: ['#db2777', '#f43f5e', '#fb7185', '#f472b6', '#e879f9'] }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#64748b' } } } }
    });
  }
}

