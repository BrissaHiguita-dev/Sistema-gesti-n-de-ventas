// ==========================================
// ESTADO GLOBAL Y CONFIGURACIÓN INICIAL
// ==========================================
let insumos = [];
let recetaActual = [];
let catalogo = [];
let ventas = [];
let categorias = ['MINI DONAS', 'DESAYUNOS', 'ARTE Y VELAS', 'OTROS'];
let categoriaFiltroActual = 'TODOS';

let chartBalanceInstance = null;
let chartPopularesInstance = null;

// Insumos de prueba predeterminados
const insumosDemo = [
  { id: '1', nombre: 'Caja Regalo Decorada', cantidad: 10, unidad: 'unidades', costo: 20000, costoUnitario: 2000 },
  { id: '2', nombre: 'Nutella 350g', cantidad: 350, unidad: 'gramos', costo: 24500, costoUnitario: 70 },
  { id: '3', nombre: 'Mini Donas Glaseadas', cantidad: 100, unidad: 'unidades', costo: 40000, costoUnitario: 400 }
];

// ==========================================
// INICIALIZACIÓN Y ASIGNACIÓN DE EVENTOS
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
  
  cargarDatosDesdeStorage();
  inicializarEventos();

  if (localStorage.getItem('des_sesion_activa') === 'true') {
    iniciarApp();
  }
});

function inicializarEventos() {
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleLogin();
    });
  }

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }

  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      switchTab(targetTab);
    });
  });

  const formInsumo = document.getElementById('form-insumo');
  if (formInsumo) {
    formInsumo.addEventListener('submit', (e) => {
      e.preventDefault();
      guardarInsumo();
    });
  }

  const addRecipeBtn = document.getElementById('add-to-recipe-btn');
  if (addRecipeBtn) addRecipeBtn.addEventListener('click', agregarInsumoAReceta);

  const costosFijosInput = document.getElementById('receta-costos-fijos');
  if (costosFijosInput) costosFijosInput.addEventListener('input', calcularTotalesReceta);

  const margenInput = document.getElementById('receta-margen');
  if (margenInput) margenInput.addEventListener('input', calcularTotalesReceta);

  const saveRecipeBtn = document.getElementById('save-recipe-btn');
  if (saveRecipeBtn) saveRecipeBtn.addEventListener('click', guardarProductoEnCatalogo);

  const formVenta = document.getElementById('form-venta');
  if (formVenta) {
    formVenta.addEventListener('submit', (e) => {
      e.preventDefault();
      registrarVenta();
    });
  }
}

// ==========================================
// AUTENTICACIÓN Y SESIÓN
// ==========================================
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
  switchTab('tab-dashboard');
}

// ==========================================
// NAVEGACIÓN ENTRE PESTAÑAS (TABS)
// ==========================================
function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('bg-slate-800', 'text-white'));

  const currentTab = document.getElementById(tabId);
  if (currentTab) currentTab.classList.remove('hidden');

  const activeBtn = document.getElementById('nav-' + tabId);
  if (activeBtn) activeBtn.classList.add('bg-slate-800', 'text-white');

  if (tabId === 'tab-dashboard') {
    renderDashboard();
  }
}

// ==========================================
// PERSISTENCIA EN LOCALSTORAGE
// ==========================================
function cargarDatosDesdeStorage() {
  insumos = JSON.parse(localStorage.getItem('des_insumos')) || insumosDemo;
  catalogo = JSON.parse(localStorage.getItem('des_catalogo')) || [];
  ventas = JSON.parse(localStorage.getItem('des_ventas')) || [];
  
  const catGuardadas = JSON.parse(localStorage.getItem('des_categorias'));
  if (catGuardadas && catGuardadas.length > 0) {
    categorias = catGuardadas;
  }

  guardarEnStorage();
  renderInsumos();
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
  localStorage.setItem('des_categorias', JSON.stringify(categorias));
}

// ==========================================
// GESTIÓN DE CATEGORÍAS PERSONALIZADAS
// ==========================================
function renderSelectorCategorias() {
  const select = document.getElementById('receta-categoria');
  if (!select) return;

  select.innerHTML = categorias.map(c => `<option value="${c}">${c}</option>`).join('') +
    `<option value="__NUEVA__" class="text-teal-400 font-bold">+ Nueva categoría...</option>`;

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
// GESTIÓN DE INSUMOS E INVENTARIO
// ==========================================
function guardarInsumo() {
  const nombre = document.getElementById('insumo-nombre').value;
  const cantidad = parseFloat(document.getElementById('insumo-cantidad').value);
  const unidad = document.getElementById('insumo-unidad').value;
  const costo = parseFloat(document.getElementById('insumo-costo').value);

  const costoUnitario = costo / cantidad;

  const nuevoInsumo = {
    id: Date.now().toString(),
    nombre,
    cantidad,
    unidad,
    costo,
    costoUnitario
  };

  insumos.push(nuevoInsumo);
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
      <td class="p-4 font-semibold text-white">${item.nombre}</td>
      <td class="p-4">${item.cantidad} ${item.unidad}</td>
      <td class="p-4">$${item.costo.toLocaleString()}</td>
      <td class="p-4 text-teal-400 font-bold">$${item.costoUnitario.toFixed(2)} / ${item.unidad.slice(0, -1)}</td>
      <td class="p-4 text-right">
        <button onclick="eliminarInsumo('${item.id}')" class="text-rose-400 hover:text-rose-300">Eliminar</button>
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
    selectReceta.innerHTML = insumos.map(i => `<option value="${i.id}">${i.nombre} ($${i.costoUnitario.toFixed(2)}/${i.unidad.slice(0, -1)})</option>`).join('');
  }
  if (selectVenta) {
    selectVenta.innerHTML = catalogo.map(c => `<option value="${c.id}">${c.nombre} ($${c.precioVenta.toLocaleString()})</option>`).join('');
  }
}

// ==========================================
// CALCULADORA DE RECETAS Y PRECIOS
// ==========================================
function agregarInsumoAReceta() {
  const insumoId = document.getElementById('receta-insumo-select').value;
  const cant = parseFloat(document.getElementById('receta-insumo-cant').value);

  if (!cant || cant <= 0) return;

  const insumoObj = insumos.find(i => i.id === insumoId);
  if (!insumoObj) return;

  const costoDirecto = insumoObj.costoUnitario * cant;

  recetaActual.push({
    id: insumoObj.id,
    nombre: insumoObj.nombre,
    cantidad: cant,
    unidad: insumoObj.unidad,
    costoDirecto
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
      <td class="p-3 text-slate-200 font-bold">$${item.costoDirecto.toLocaleString()}</td>
      <td class="p-3 text-right">
        <button onclick="quitarItemReceta(${index})" class="text-rose-400">✕</button>
      </td>
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
  
  let precioVenta = 0;
  if (margen < 100) {
    precioVenta = costoTotal / (1 - (margen / 100));
  }

  precioVenta = Math.ceil(precioVenta / 100) * 100;
  const gananciaLimpia = precioVenta - costoTotal;

  document.getElementById('resumen-costo-total').innerText = '$' + costoTotal.toLocaleString();
  document.getElementById('resumen-precio-venta').innerText = '$' + precioVenta.toLocaleString();
  document.getElementById('resumen-ganancia-limpia').innerText = '$' + gananciaLimpia.toLocaleString();
}

function guardarProductoEnCatalogo() {
  const nombre = document.getElementById('receta-nombre').value;
  const categoria = obtenerCategoriaSeleccionada();

  if (!nombre || recetaActual.length === 0) {
    alert('Ingresa el nombre del combo y al menos un insumo.');
    return;
  }

  const costoInsumos = recetaActual.reduce((acc, i) => acc + i.costoDirecto, 0);
  const costosFijos = parseFloat(document.getElementById('receta-costos-fijos').value) || 0;
  const margen = parseFloat(document.getElementById('receta-margen').value) || 0;
  const costoTotal = costoInsumos + costosFijos;
  const precioVenta = Math.ceil((costoTotal / (1 - (margen / 100))) / 100) * 100;
  const ganancia = precioVenta - costoTotal;

  const nuevoProducto = {
    id: Date.now().toString(),
    nombre,
    categoria: categoria || 'OTROS',
    costoTotal,
    precioVenta,
    ganancia,
    items: [...recetaActual]
  };

  catalogo.push(nuevoProducto);
  guardarEnStorage();
  renderFiltrosCatalogo();
  renderCatalogo();
  actualizarSelectores();

  recetaActual = [];
  document.getElementById('receta-nombre').value = '';
  renderRecetaActual();
  switchTab('tab-catalogo');
}

// ==========================================
// CATÁLOGO DE PRODUCTOS Y FILTROS
// ==========================================
function renderFiltrosCatalogo() {
  const container = document.getElementById('catalogo-filtros-container');
  if (!container) return;

  const todasLasCategorias = ['TODOS', ...categorias];
  container.innerHTML = todasLasCategorias.map(cat => {
    const esActivo = categoriaFiltroActual === cat;
    const bgClass = esActivo ? 'bg-teal-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200';
    return `<button onclick="filtrarCatalogo('${cat}')" class="cat-filter-btn px-4 py-2 ${bgClass} rounded-xl text-xs font-semibold transition">${cat}</button>`;
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

  const productosFiltrados = categoriaFiltroActual === 'TODOS' 
    ? catalogo 
    : catalogo.filter(p => (p.categoria || 'OTROS') === categoriaFiltroActual);

  if (productosFiltrados.length === 0) {
    grid.innerHTML = '<div class="col-span-full py-12 text-center text-slate-500 text-sm">No hay productos guardados en esta categoría.</div>';
    return;
  }

  productosFiltrados.forEach(p => {
    const card = document.createElement('div');
    card.className = 'p-6 bg-slate-900 border border-slate-800/80 rounded-2xl space-y-4';
    card.innerHTML = `
      <div class="flex items-start justify-between gap-2">
        <div>
          <span class="inline-block px-2 py-0.5 bg-slate-800 text-teal-400 font-semibold text-[10px] rounded-md mb-1 uppercase tracking-wider border border-slate-700/50">${p.categoria || 'OTROS'}</span>
          <h3 class="font-bold text-white text-lg">${p.nombre}</h3>
        </div>
        <span class="px-2.5 py-1 bg-teal-500/10 text-teal-400 font-bold text-xs rounded-full shrink-0">$${p.precioVenta.toLocaleString()}</span>
      </div>
      <div class="text-xs text-slate-400 space-y-1">
        <div class="flex justify-between"><span>Costo Producción:</span><span class="text-slate-200 font-semibold">$${p.costoTotal.toLocaleString()}</span></div>
        <div class="flex justify-between"><span>Ganancia Limpia:</span><span class="text-emerald-400 font-semibold">$${p.ganancia.toLocaleString()}</span></div>
      </div>
      <button onclick="eliminarProductoCatalogo('${p.id}')" class="w-full py-2 bg-slate-800 hover:bg-rose-500/10 hover:text-rose-400 text-slate-400 text-xs rounded-xl font-medium transition">
        Eliminar del Catálogo
      </button>
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
// REGISTRO DE VENTAS (POS)
// ==========================================
function registrarVenta() {
  const prodId = document.getElementById('venta-producto-select').value;
  const cant = parseInt(document.getElementById('venta-cantidad').value);

  const prodObj = catalogo.find(c => c.id === prodId);
  if (!prodObj) return;

  const ahora = new Date();

  const nuevaVenta = {
    id: Date.now().toString(),
    fecha: ahora.toLocaleString(),
    fechaObj: ahora.toISOString(), // Almacenamiento ISO para filtrado de fechas
    producto: prodObj.nombre,
    cantidad: cant,
    totalCobrado: prodObj.precioVenta * cant,
    gananciaNeta: prodObj.ganancia * cant
  };

  ventas.push(nuevaVenta);
  guardarEnStorage();
  renderVentas();
}

function renderVentas() {
  const tbody = document.getElementById('tabla-ventas-body');
  if (!tbody) return;
  tbody.innerHTML = '';

  ventas.forEach(v => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="p-4 text-xs text-slate-400">${v.fecha}</td>
      <td class="p-4 font-semibold text-white">${v.producto}</td>
      <td class="p-4">${v.cantidad}</td>
      <td class="p-4 font-bold text-emerald-400">$${v.totalCobrado.toLocaleString()}</td>
      <td class="p-4 font-bold text-teal-400">$${v.gananciaNeta.toLocaleString()}</td>
      <td class="p-4 text-right">
        <button onclick="eliminarVenta('${v.id}')" class="text-rose-400">Anular</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function eliminarVenta(id) {
  ventas = ventas.filter(v => v.id !== id);
  guardarEnStorage();
  renderVentas();
}

// ==========================================
// DASHBOARD DE INFORMES CON FILTRO DE FECHAS
// ==========================================
function limpiarFiltroFechas() {
  const fInicio = document.getElementById('dash-fecha-inicio');
  const fFin = document.getElementById('dash-fecha-fin');
  if (fInicio) fInicio.value = '';
  if (fFin) fFin.value = '';
  renderDashboard();
}

function renderDashboard() {
  const fInicioVal = document.getElementById('dash-fecha-inicio')?.value;
  const fFinVal = document.getElementById('dash-fecha-fin')?.value;

  // Filtrado de ventas según el rango de fechas
  const ventasFiltradas = ventas.filter(v => {
    if (!v.fechaObj) return true; // Para registros previos
    const fechaVenta = new Date(v.fechaObj);
    
    if (fInicioVal) {
      const fechaInicio = new Date(fInicioVal + 'T00:00:00');
      if (fechaVenta < fechaInicio) return false;
    }
    if (fFinVal) {
      const fechaFin = new Date(fFinVal + 'T23:59:59');
      if (fechaVenta > fechaFin) return false;
    }
    return true;
  });

  const totalVentas = ventasFiltradas.reduce((acc, v) => acc + v.totalCobrado, 0);
  const totalGanancia = ventasFiltradas.reduce((acc, v) => acc + v.gananciaNeta, 0);
  const margenProm = totalVentas > 0 ? ((totalGanancia / totalVentas) * 100).toFixed(1) : 0;

  const kpiVentas = document.getElementById('kpi-ventas-totales');
  if (kpiVentas) kpiVentas.innerText = '$' + totalVentas.toLocaleString();

  const kpiGanancia = document.getElementById('kpi-ganancia-total');
  if (kpiGanancia) kpiGanancia.innerText = '$' + totalGanancia.toLocaleString();

  const kpiPedidos = document.getElementById('kpi-pedidos-count');
  if (kpiPedidos) kpiPedidos.innerText = ventasFiltradas.length;

  const kpiMargen = document.getElementById('kpi-margen-promedio');
  if (kpiMargen) kpiMargen.innerText = margenProm + '%';

  // Renderizar Gráfico de Balance
  const canvasBalance = document.getElementById('chart-balance');
  if (canvasBalance) {
    const ctxBalance = canvasBalance.getContext('2d');
    if (chartBalanceInstance) chartBalanceInstance.destroy();

    chartBalanceInstance = new Chart(ctxBalance, {
      type: 'bar',
      data: {
        labels: ['Ingresos Brutos', 'Ganancia Limpia'],
        datasets: [{
          data: [totalVentas, totalGanancia],
          backgroundColor: ['#10b981', '#14b8a6'],
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { ticks: { color: '#94a3b8' }, grid: { color: '#1e293b' } },
          x: { ticks: { color: '#94a3b8' }, grid: { display: false } }
        }
      }
    });
  }

  // Renderizar Gráfico de Productos Populares
  const canvasPopulares = document.getElementById('chart-populares');
  if (canvasPopulares) {
    const conteoProductos = {};
    ventasFiltradas.forEach(v => {
      conteoProductos[v.producto] = (conteoProductos[v.producto] || 0) + v.cantidad;
    });

    const ctxPopulares = canvasPopulares.getContext('2d');
    if (chartPopularesInstance) chartPopularesInstance.destroy();

    const etiquetas = Object.keys(conteoProductos).length > 0 ? Object.keys(conteoProductos) : ['Sin ventas'];
    const valores = Object.values(conteoProductos).length > 0 ? Object.values(conteoProductos) : [1];

    chartPopularesInstance = new Chart(ctxPopulares, {
      type: 'doughnut',
      data: {
        labels: etiquetas,
        datasets: [{
          data: valores,
          backgroundColor: ['#14b8a6', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#94a3b8' } } }
      }
    });
  }
}