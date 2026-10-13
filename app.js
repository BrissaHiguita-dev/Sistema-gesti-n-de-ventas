// ==========================================
// ESTADO GLOBAL Y CONFIGURACIÓN INICIAL
// ==========================================
let insumos = [];
let recetaActual = [];
let catalogo = [];
let ventas = [];
let gastos = [];
let fidelidad = []; // Módulo de Tarjeta de Fidelidad Digital
let categorias = ['MINI DONAS', 'DESAYUNOS', 'ARTE Y VELAS', 'OTROS'];
let categoriaFiltroActual = 'TODOS';

let chartBalanceInstance = null;
let chartPopularesInstance = null;
let tarjetaDataUrlActual = null;
let mensajeGeneradoActual = '';
let estiloTarjetaSeleccionado = 'infantil';

let fechaCalendarioActual = new Date();
let fechaSeleccionadaStr = new Date().toISOString().split('T')[0];

const insumosDemo = [
  { id: '1', nombre: 'Caja Regalo Decorada', categoria: 'EMPAQUES', cantidad: 4, minimo: 5, unidad: 'unidades', costo: 20000, costoUnitario: 5000 },
  { id: '2', nombre: 'Nutella 350g', categoria: 'MATERIA PRIMA', cantidad: 30, minimo: 100, unidad: 'gramos', costo: 24500, costoUnitario: 70 },
  { id: '3', nombre: 'Mini Donas Glaseadas', categoria: 'MATERIA PRIMA', cantidad: 100, minimo: 20, unidad: 'unidades', costo: 40000, costoUnitario: 400 }
];

const fidelidadDemo = [
  { id: '1', nombre: 'Valeria Gomez', telefono: '3051234567', sellos: 4 },
  { id: '2', nombre: 'Camilo Rengifo', telefono: '3109876543', sellos: 5 }
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

  const formFidelidad = document.getElementById('form-fidelidad');
  if (formFidelidad) formFidelidad.addEventListener('submit', (e) => { e.preventDefault(); registrarSelloFidelidad(); });

  autoGenerarPrompt();
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
  if (tabId === 'tab-calendario') renderCalendario();
  if (tabId === 'tab-fidelidad') renderFidelidad();
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
  fidelidad = JSON.parse(localStorage.getItem('des_fidelidad')) || fidelidadDemo;
  
  const catGuardadas = JSON.parse(localStorage.getItem('des_categorias'));
  if (catGuardadas && catGuardadas.length > 0) categorias = catGuardadas;

  guardarEnStorage();
  renderInsumos();
  verificarStockBajo();
  renderGastos();
  renderSelectorCategorias();
  actualizarSelectores();
  renderFiltrosCatalogo();
  renderCatalogo();
  renderVentas();
  renderFidelidad();
}

function guardarEnStorage() {
  localStorage.setItem('des_insumos', JSON.stringify(insumos));
  localStorage.setItem('des_catalogo', JSON.stringify(catalogo));
  localStorage.setItem('des_ventas', JSON.stringify(ventas));
  localStorage.setItem('des_gastos', JSON.stringify(gastos));
  localStorage.setItem('des_fidelidad', JSON.stringify(fidelidad));
  localStorage.setItem('des_categorias', JSON.stringify(categorias));
}

// ==========================================
// MÓDULO: TARJETA DE FIDELIDAD DIGITAL
// ==========================================
function registrarSelloFidelidad() {
  const nombre = document.getElementById('fidelidad-nombre').value.trim();
  const telefono = document.getElementById('fidelidad-telefono').value.trim();
  const sellosNuevos = parseInt(document.getElementById('fidelidad-sellos').value) || 1;

  if (!nombre || !telefono) return;

  let cliente = fidelidad.find(f => f.telefono === telefono);
  if (cliente) {
    cliente.sellos += sellosNuevos;
    cliente.nombre = nombre; // Actualizar nombre por si acaso
  } else {
    fidelidad.push({
      id: Date.now().toString(),
      nombre,
      telefono,
      sellos: sellosNuevos
    });
  }

  guardarEnStorage();
  renderFidelidad();

  document.getElementById('fidelidad-nombre').value = '';
  document.getElementById('fidelidad-telefono').value = '';
  document.getElementById('fidelidad-sellos').value = '1';
}

function renderFidelidad() {
  const container = document.getElementById('fidelidad-lista-clientes');
  if (!container) return;
  container.innerHTML = '';

  if (fidelidad.length === 0) {
    container.innerHTML = '<p class="text-xs text-slate-400 italic text-center py-6">No hay clientes registrados en la tarjeta de fidelidad.</p>';
    return;
  }

  fidelidad.forEach(c => {
    const meta = 5;
    const sellosActuales = c.sellos % meta;
    const ciclosCompletos = Math.floor(c.sellos / meta);
    const esPremioListo = c.sellos >= meta;

    let burbujasHTML = '';
    for (let i = 1; i <= meta; i++) {
      const activo = i <= (esPremioListo ? meta : sellosActuales);
      burbujasHTML += `
        <div class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border ${activo ? 'bg-pink-600 text-white border-pink-600 shadow-sm' : 'bg-pink-50 text-pink-300 border-pink-200'}">
          ${activo ? '🍩' : i}
        </div>
      `;
    }

    const card = document.createElement('div');
    card.className = 'p-4 bg-white border border-pink-200 rounded-2xl shadow-sm space-y-3';
    card.innerHTML = `
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h4 class="font-bold text-slate-900 text-sm">👤 ${c.nombre}</h4>
          <p class="text-xs text-pink-600 font-medium">📞 ${c.telefono} • Total Compras: ${c.sellos} ${ciclosCompletos > 0 ? `(🎁 ${ciclosCompletos} Premios ganados)` : ''}</p>
        </div>
        ${esPremioListo ? '<span class="px-3 py-1 bg-emerald-500 text-white font-bold rounded-xl text-xs animate-pulse">✨ ¡PREMIO DISPONIBLE!</span>' : ''}
      </div>
      <div class="flex items-center justify-between gap-1 py-1">
        ${burbujasHTML}
      </div>
      <div class="flex gap-2 pt-1">
        <button onclick="canjearPremioFidelidad('${c.id}')" class="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition">Canjear Premio</button>
        <button onclick="eliminarClienteFidelidad('${c.id}')" class="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-xl text-xs transition">Eliminar</button>
      </div>
    `;
    container.appendChild(card);
  });
}

function canjearPremioFidelidad(id) {
  let cliente = fidelidad.find(f => f.id === id);
  if (!cliente) return;

  if (cliente.sellos < 5) {
    alert('El cliente aún no completa los 5 sellos para reclamar su premio.');
    return;
  }

  cliente.sellos -= 5; // Resta los 5 sellos del premio canjeado
  guardarEnStorage();
  renderFidelidad();
  alert(`¡Premio canjeado con éxito para ${cliente.nombre}! Se han descontado 5 sellos de su tarjeta.`);
}

function eliminarClienteFidelidad(id) {
  fidelidad = fidelidad.filter(f => f.id !== id);
  guardarEnStorage();
  renderFidelidad();
}

// ==========================================
// MÓDULO: INVENTARIO & ALERTAS DE STOCK BAJO
// ==========================================
function guardarInsumo() {
  const nombre = document.getElementById('insumo-nombre').value;
  const categoria = document.getElementById('insumo-categoria').value;
  const cantidad = parseFloat(document.getElementById('insumo-cantidad').value);
  const minimo = parseFloat(document.getElementById('insumo-minimo').value) || 10;
  const unidad = document.getElementById('insumo-unidad').value;
  const costo = parseFloat(document.getElementById('insumo-costo').value);

  insumos.push({
    id: Date.now().toString(),
    nombre,
    categoria,
    cantidad,
    minimo,
    unidad,
    costo,
    costoUnitario: costo / cantidad
  });

  guardarEnStorage();
  renderInsumos();
  verificarStockBajo();
  actualizarSelectores();

  document.getElementById('insumo-nombre').value = '';
  document.getElementById('insumo-cantidad').value = '';
  document.getElementById('insumo-minimo').value = '';
  document.getElementById('insumo-costo').value = '';
}

function renderInsumos() {
  const tbody = document.getElementById('tabla-insumos-body');
  if (!tbody) return;
  tbody.innerHTML = '';

  insumos.forEach(item => {
    const esStockBajo = item.cantidad <= (item.minimo || 10);
    const badgeStock = esStockBajo 
      ? `<span class="px-2 py-0.5 bg-amber-100 text-amber-800 font-bold text-[10px] rounded-md flex items-center gap-1 w-max">⚠️ ${item.cantidad} ${item.unidad} (Bajo)</span>`
      : `<span class="text-slate-800 font-semibold">${item.cantidad} ${item.unidad}</span>`;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="p-4 font-semibold text-slate-800">${item.nombre}</td>
      <td class="p-4"><span class="px-2 py-0.5 bg-pink-100 text-pink-700 font-bold text-[10px] rounded-md">${item.categoria || 'MATERIA PRIMA'}</span></td>
      <td class="p-4">${badgeStock}</td>
      <td class="p-4">$${item.costo.toLocaleString()}</td>
      <td class="p-4 text-pink-600 font-bold">$${item.costoUnitario.toFixed(2)} / ${item.unidad.slice(0, -1)}</td>
      <td class="p-4 text-right">
        <button onclick="eliminarInsumo('${item.id}')" class="text-rose-500 hover:text-rose-700 text-xs font-semibold">Eliminar</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function verificarStockBajo() {
  const bajos = insumos.filter(i => i.cantidad <= (i.minimo || 10));
  const container = document.getElementById('alerta-stock-container');
  const texto = document.getElementById('alerta-stock-texto');
  if (!container || !texto) return;

  if (bajos.length > 0) {
    const nombres = bajos.map(b => `• ${b.nombre} (${b.cantidad} ${b.unidad} restantes)`).join('<br>');
    texto.innerHTML = `Los siguientes insumos están por debajo del mínimo recomendado:<br>${nombres}`;
    container.classList.remove('hidden');
  } else {
    container.classList.add('hidden');
  }
}

function eliminarInsumo(id) {
  insumos = insumos.filter(i => i.id !== id);
  guardarEnStorage();
  renderInsumos();
  verificarStockBajo();
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
// MÓDULO: CALENDARIO VISUAL DE PEDIDOS
// ==========================================
function cambiarMesCalendario(delta) {
  fechaCalendarioActual.setMonth(fechaCalendarioActual.getMonth() + delta);
  renderCalendario();
}

function renderCalendario() {
  const grid = document.getElementById('calendario-grid');
  const tituloMes = document.getElementById('cal-mes-anio-titulo');
  if (!grid || !tituloMes) return;

  const anio = fechaCalendarioActual.getFullYear();
  const mes = fechaCalendarioActual.getMonth();

  const nombresMeses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  tituloMes.innerText = `${nombresMeses[mes]} ${anio}`;

  grid.innerHTML = '';

  const primerDiaSemana = new Date(anio, mes, 1).getDay();
  const totalDiasMes = new Date(anio, mes + 1, 0).getDate();

  for (let i = 0; i < primerDiaSemana; i++) {
    const div = document.createElement('div');
    div.className = 'h-24 bg-pink-50/20 rounded-2xl border border-pink-100/40 opacity-40';
    grid.appendChild(div);
  }

  for (let dia = 1; dia <= totalDiasMes; dia++) {
    const mesStr = String(mes + 1).padStart(2, '0');
    const diaStr = String(dia).padStart(2, '0');
    const fechaYMD = `${anio}-${mesStr}-${diaStr}`;

    const pedidosDelDia = ventas.filter(v => {
      if (!v.fechaObj) return false;
      return v.fechaObj.startsWith(fechaYMD);
    });

    const esSeleccionado = fechaSeleccionadaStr === fechaYMD;
    const div = document.createElement('div');
    div.className = `h-24 p-2 rounded-2xl border transition flex flex-col justify-between cursor-pointer overflow-hidden ${esSeleccionado ? 'bg-pink-100 border-pink-500 shadow-sm' : 'bg-white/80 border-pink-200 hover:bg-pink-50'}`;
    div.onclick = () => seleccionarFechaCalendario(fechaYMD);

    let htmlPedidos = pedidosDelDia.slice(0, 2).map(p => `
      <div class="text-[9px] bg-pink-500 text-white font-bold px-1.5 py-0.5 rounded truncate">
        ${p.destinatario}
      </div>
    `).join('');

    if (pedidosDelDia.length > 2) {
      htmlPedidos += `<div class="text-[9px] text-pink-700 font-bold px-1">+${pedidosDelDia.length - 2} más</div>`;
    }

    div.innerHTML = `
      <div class="flex justify-between items-center text-xs font-bold text-slate-800">
        <span>${dia}</span>
        ${pedidosDelDia.length > 0 ? `<span class="w-5 h-5 rounded-full bg-pink-600 text-white text-[10px] flex items-center justify-center font-black">${pedidosDelDia.length}</span>` : ''}
      </div>
      <div class="space-y-1 overflow-y-auto">${htmlPedidos}</div>
    `;
    grid.appendChild(div);
  }

  renderDetalleCalendarioSeleccionado();
}

function seleccionarFechaCalendario(fechaYMD) {
  fechaSeleccionadaStr = fechaYMD;
  renderCalendario();
}

function renderDetalleCalendarioSeleccionado() {
  const titulo = document.getElementById('cal-detalle-titulo');
  const lista = document.getElementById('cal-detalle-lista');
  if (!titulo || !lista) return;

  const [anio, mes, dia] = fechaSeleccionadaStr.split('-');
  titulo.innerText = `Entregas programadas para el ${dia}/${mes}/${anio}:`;
  lista.innerHTML = '';

  const pedidosDelDia = ventas.filter(v => v.fechaObj && v.fechaObj.startsWith(fechaSeleccionadaStr));

  if (pedidosDelDia.length === 0) {
    lista.innerHTML = '<p class="text-xs text-slate-400 italic">No hay desayunos ni sorpresas agendadas para esta fecha.</p>';
    return;
  }

  pedidosDelDia.forEach(p => {
    const card = document.createElement('div');
    card.className = 'p-3 bg-pink-50/60 border border-pink-200 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs';
    card.innerHTML = `
      <div>
        <div class="font-bold text-slate-900">👤 ${p.destinatario} (${p.cantidad}x ${p.producto})</div>
        <div class="text-slate-600">📍 ${p.direccion} | 📞 ${p.telefono}</div>
        <div class="text-pink-600 font-medium">⏰ ${p.horario}</div>
      </div>
      <span class="px-2.5 py-1 bg-pink-600 text-white font-bold rounded-lg text-[10px]">${p.estado}</span>
    `;
    lista.appendChild(card);
  });
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
// MÓDULO: CATEGORÍAS Y RECETAS
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
// MÓDULO: LOGÍSTICA DE PEDIDOS Y WHATSAPP
// ==========================================
function registrarVenta() {
  const prodId = document.getElementById('venta-producto-select').value;
  const cant = parseInt(document.getElementById('venta-cantidad').value);
  const fechaInput = document.getElementById('venta-fecha-input').value;
  const horario = document.getElementById('venta-horario').value;
  const destinatario = document.getElementById('venta-destinatario').value.trim() || 'No especificado';
  const direccion = document.getElementById('venta-direccion').value.trim() || 'No especificada';
  const telefono = document.getElementById('venta-telefono').value.trim() || 'Sin teléfono';
  const dedicatoria = document.getElementById('venta-dedicatoria').value.trim() || '';

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
    dedicatoria,
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
  document.getElementById('venta-dedicatoria').value = '';
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
        ${v.dedicatoria ? `<div class="text-[10px] text-pink-500 italic mt-0.5 truncate max-w-xs">💌 "${v.dedicatoria}"</div>` : ''}
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

  let mensaje = `🎁 *NUEVO PEDIDO - EL MUNDO DE LAS MINI DONAS* 🍩\n\n` +
    `🗓 *Fecha de Entrega:* ${v.fecha}\n` +
    `⏰ *Franja Horaria:* ${v.horario}\n\n` +
    `👤 *Homenajeado(a):* ${v.destinatario}\n` +
    `📍 *Dirección:* ${v.direccion}\n` +
    `📞 *Teléfono:* ${v.telefono}\n\n`;

  if (v.dedicatoria) {
    mensaje += `💌 *Dedicatoria / Tarjeta:*\n"${v.dedicatoria}"\n\n`;
  }

  mensaje += `📦 *Detalle del Pedido:*\n` +
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

  const dedicatoriaWrapper = document.getElementById('rec-dedicatoria-wrapper');
  const dedicatoriaSpan = document.getElementById('rec-dedicatoria');
  if (v.dedicatoria) {
    dedicatoriaSpan.innerText = `"${v.dedicatoria}"`;
    dedicatoriaWrapper.classList.remove('hidden');
  } else {
    dedicatoriaWrapper.classList.add('hidden');
  }

  document.getElementById('modal-recibo').classList.remove('hidden');
}

function cerrarModalRecibo() {
  document.getElementById('modal-recibo').classList.add('hidden');
}

// ==========================================
// MÓDULO: TARJETAS & DEDICATORIAS IA Y CANVAS
// ==========================================
function seleccionarEstiloTarjeta(estilo) {
  estiloTarjetaSeleccionado = estilo;
  ['infantil', 'elegante', 'fiesta', 'amor'].forEach(e => {
    const btn = document.getElementById(`btn-estilo-${e}`);
    if (btn) {
      if (e === estilo) {
        btn.className = "p-2.5 bg-pink-100 border-2 border-pink-500 rounded-xl text-left text-xs font-bold text-pink-700 transition flex items-center gap-2 shadow-sm";
      } else {
        btn.className = "p-2.5 bg-pink-50 border border-pink-200 rounded-xl text-left text-xs font-semibold text-slate-700 transition flex items-center gap-2";
      }
    }
  });
  autoGenerarPrompt();
}

function autoGenerarPrompt() {
  const promptInput = document.getElementById('ia-prompt-imagen');
  if (!promptInput) return;

  const destinatario = document.getElementById('ia-destinatario-nombre')?.value.trim() || 'Nené';
  const edad = document.getElementById('ia-edad')?.value.trim() || '12 añitos';

  const promptsPorEstilo = {
    'infantil': `Una hermosa tarjeta de cumpleaños ilustrada en acuarela pastel, para "${destinatario}" celebrando "${edad}". Fondo rosa suave con coronita dorada, corazoncitos rosados y morados, un tierno osito de peluche abrazando un corazón, globos pastel y estrellitas decorativas alrededor.`,
    'elegante': `Una elegante tarjeta de regalo con marco dorado sobre fondo rosa pastel, flores delicadas en acuarela, tipografía estilizada y sutiles destellos dorados.`,
    'fiesta': `Diseño festivo alegre de cumpleaños con globos coloridos, serpentinas, confeti, banderas pastel y pastel de cumpleaños decorativo con velas encendidas.`,
    'amor': `Tarjeta romántica con corazones rojos y rosa pastel, marco de flores de cerezo, lazo elegante y detalles dorados sobre un fondo crema suave.`
  };

  promptInput.value = promptsPorEstilo[estiloTarjetaSeleccionado] || promptsPorEstilo['infantil'];
}

function generarDedicatoriaYTarjetaIA() {
  const ocasion = document.getElementById('ia-ocasion').value;
  const tono = document.getElementById('ia-tono').value;
  const destinatario = document.getElementById('ia-destinatario-nombre').value.trim() || 'Nené';
  const edad = document.getElementById('ia-edad').value.trim() || '12 añitos';
  const remitente = document.getElementById('ia-remitente-nombre').value.trim() || 'Papá y Mamá';

  const bancoMensajes = {
    'Cumpleaños': {
      'Cariñoso y Emotivo': `Cada vez estás más grande y aquí seguimos celebrando este día tan especial, el más especial para nosotros porque llegaste para cambiarnos la vida y darle sentido a nuestra existencia. Estamos muy orgullosos de ti, de ese ser lleno de amor, luz y empatía. ¡Eres grande y vas a ser gigante!`,
      'Romántico y Profundo': `Amor de mi vida, ¡feliz cumpleaños! Cada latido mío celebra tu existencia. Que este día esté lleno de dulzura y que nuestros caminos sigan unidos eternamente. Te amo ❤️`,
      'Divertido y Alegre': `¡Hoy cumples ${edad}, ${destinatario}! 🎉 Oficialmente un año más sabio y genial. ¡Que pases un día increíble lleno de risas y sorpresas!`,
      'Formal y Elegante': `Le deseo un muy feliz cumpleaños a ${destinatario}. Que este día esté colmado de éxitos, bienestar y hermosos momentos en compañía de sus seres queridos.`
    },
    'Aniversario': {
      'Cariñoso y Emotivo': `Feliz aniversario, ${destinatario}. Cada día a tu lado es un regalo maravilloso. Gracias por construir tantos recuerdos hermosos juntos.`,
      'Romántico y Profundo': `Mi amor, celebrar un año más a tu lado es confirmar que eres el amor de mi vida. Gracias por cada sonrisa y por endulzar mis días. Te amo hoy y siempre ❤️`,
      'Divertido y Alegre': `¡Feliz aniversario! 🥂 Sobrevivimos a otro año aguantándonos y amándonos con locura. ¡Brindemos por muchos años más llenos de risas!`,
      'Formal y Elegante': `Felicitaciones en nuestro aniversario. Reitero mi compromiso de seguir caminando juntos con respeto, afecto y admiración mutua.`
    },
    'Amor y Amistad': {
      'Cariñoso y Emotivo': `Para ${destinatario}: Tenerte en mi vida es una bendición enorme. Este detalle es solo una pequeña muestra de lo mucho que te quiero y valoro.`,
      'Romántico y Profundo': `Eres el latido más bonito de mis días, ${destinatario}. No hay distancia ni momento en que no piense en ti. Con todo mi corazón.`,
      'Divertido y Alegre': `¡Hola, ${destinatario}! 🍩 Un detalle dulce para alguien igual de dulce. ¡Que tengas un día genial!`,
      'Formal y Elegante': `Un cordial saludo en esta fecha especial. Agradezco sinceramente su valiosa amistad y confianza.`
    },
    'Agradecimiento': {
      'Cariñoso y Emotivo': `Querido/a ${destinatario}, no tengo palabras para agradecer todo lo que haces por mí. Este detalle va con todo mi corazón y gratitud.`,
      'Romántico y Profundo': `Gracias por estar siempre, por tu complicidad y tu amor incondicional, ${destinatario}. Eres mi refugio favorito.`,
      'Divertido y Alegre': `¡Gracias totales, ${destinatario}! Te mereces este detalle y mucho más.`,
      'Formal y Elegante': `Le expreso mi más sincero agradecimiento por su valiosa colaboración y apoyo incondicional.`
    },
    'Perdón / Reconciliación': {
      'Cariñoso y Emotivo': `Sé que las cosas no han estado fáciles, ${destinatario}, pero te quiero con el alma. Espero que este dulce detalle endulce tu corazón y nos acerque más.`,
      'Romántico y Profundo': `Mi amor, lamento los errores. Mi único deseo es verte sonreír y seguir construyendo nuestra historia juntos. Te amo con el alma.`,
      'Divertido y Alegre': `Un pequeño desliz merece un gran dulce. 🍩 ¿Hacemos las paces, ${destinatario}? ¡Te quiero muchísimo!`,
      'Formal y Elegante': `Le ofrezco mis sinceras disculpas. Confío en que podamos superar este malentendido con cordialidad.`
    },
    'Feliz Día General': {
      'Cariñoso y Emotivo': `¡Sorpresa, ${destinatario}! ☀️ Que este día te sorprenda con momentos hermosos y mucha felicidad. Te quiero un montón.`,
      'Romántico y Profundo': `Pensar en ti hace que cualquier día sea perfecto. Que este detalle te recuerde lo mucho que te amo, ${destinatario}.`,
      'Divertido y Alegre': `¡Despierta con una sonrisa! 🍩 Este desayuno sorpresa viene cargado de buena energía para ti. ¡A comernos el mundo!`,
      'Formal y Elegante': `Que tenga una excelente jornada. Un detalle especial para alegrar su día.`
    }
  };

  mensajeGeneradoActual = bancoMensajes[ocasion]?.[tono] || `¡Feliz día, ${destinatario}! Que disfrutes al máximo este detalle preparado con todo el cariño.`;

  const inputVentaDedicatoria = document.getElementById('venta-dedicatoria');
  if (inputVentaDedicatoria) {
    inputVentaDedicatoria.value = mensajeGeneradoActual;
  }

  renderizarCanvasTarjetaIlustrada(destinatario, edad, mensajeGeneradoActual, remitente);
}

function renderizarCanvasTarjetaIlustrada(destinatario, edad, cuerpoMensaje, remitente) {
  const canvas = document.getElementById('canvas-tarjeta');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, '#fff5f7');
  grad.addColorStop(0.5, '#fce7f3');
  grad.addColorStop(1, '#ffe4e6');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = 'rgba(219, 39, 119, 0.2)';
  ctx.lineWidth = 12;
  ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);

  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2 - 40, 100);
  ctx.lineTo(canvas.width / 2 - 20, 130);
  ctx.lineTo(canvas.width / 2, 95);
  ctx.lineTo(canvas.width / 2 + 20, 130);
  ctx.lineTo(canvas.width / 2 + 40, 100);
  ctx.lineTo(canvas.width / 2 + 30, 140);
  ctx.lineTo(canvas.width / 2 - 30, 140);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#6b21a8';
  ctx.font = 'bold 85px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${destinatario}!`, canvas.width / 2, 220);

  if (edad) {
    ctx.fillStyle = '#9d174d';
    ctx.font = 'bold 38px sans-serif';
    ctx.fillText(`✨ hoy cumples ${edad} ✨`, canvas.width / 2, 280);
  }

  ctx.fillStyle = '#1e293b';
  ctx.font = '30px sans-serif';
  ctx.textAlign = 'center';

  const palabras = cuerpoMensaje.split(' ');
  let linea = '';
  let y = 370;
  const maxWidth = canvas.width - 180;
  const lineHeight = 46;

  for (let i = 0; i < palabras.length; i++) {
    const testLinea = linea + palabras[i] + ' ';
    const metrics = ctx.measureText(testLinea);
    if (metrics.width > maxWidth && i > 0) {
      ctx.fillText(linea, canvas.width / 2, y);
      linea = palabras[i] + ' ';
      y += lineHeight;
    } else {
      linea = testLinea;
    }
  }
  ctx.fillText(linea, canvas.width / 2, y);

  const yBottom = Math.max(y + 80, 920);

  ctx.fillStyle = '#db2777';
  ctx.font = 'bold 42px sans-serif';
  ctx.fillText(`Te amamos con el alma ❤️`, canvas.width / 2, yBottom);

  ctx.fillStyle = '#7e22ce';
  ctx.font = 'bold 50px sans-serif';
  ctx.fillText(`¡Feliz Cumpleaños! 🎉`, canvas.width / 2, yBottom + 80);

  ctx.fillStyle = '#64748b';
  ctx.font = '24px sans-serif';
  ctx.fillText(`De: ${remitente} • El Mundo de las Mini Donas`, canvas.width / 2, yBottom + 140);

  tarjetaDataUrlActual = canvas.toDataURL('image/png');

  document.getElementById('tarjeta-empty-state').classList.add('hidden');
  const imgResultado = document.getElementById('tarjeta-imagen-resultado');
  imgResultado.src = tarjetaDataUrlActual;
  imgResultado.classList.remove('hidden');

  const acciones = document.getElementById('tarjeta-acciones');
  acciones.classList.remove('hidden');
  acciones.classList.add('flex');
}

function descargarTarjetaImagen() {
  if (!tarjetaDataUrlActual) return;
  const a = document.createElement('a');
  a.href = tarjetaDataUrlActual;
  a.download = `tarjeta-ilustrada-${Date.now()}.png`;
  a.click();
}

function copiarTextoTarjeta() {
  if (!mensajeGeneradoActual) return;
  navigator.clipboard.writeText(mensajeGeneradoActual).then(() => {
    alert('¡Mensaje copiado al portapapeles!');
  });
}

// ==========================================
// MÓDULO: DASHBOARD & GRÁFICOS
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