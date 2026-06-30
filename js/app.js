// ==========================================
// PRODAN · App Logic
// ==========================================

let currentUser = null;
let carrito = [];
let catActiva = 'Todos';
let reporteData = [];

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
  DB.init();
  updateFechaHora();
  setInterval(updateFechaHora, 30000);
  document.getElementById('login-user').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
  document.getElementById('login-pass').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
  document.getElementById('reporte-tipo').addEventListener('change', onReporteTipoChange);

  // Nav
  document.querySelectorAll('.nav-item').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      navTo(el.dataset.page);
    });
  });
});

function updateFechaHora() {
  const now = new Date();
  const str = now.toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const el = document.getElementById('fecha-hora-display');
  if (el) el.textContent = str.charAt(0).toUpperCase() + str.slice(1);
  const ce = document.getElementById('caja-fecha');
  if (ce) ce.textContent = str.charAt(0).toUpperCase() + str.slice(1);
}

// ── AUTH ──
function doLogin() {
  const user = document.getElementById('login-user').value.trim();
  const pass = document.getElementById('login-pass').value;
  const found = DB.login(user, pass);
  if (!found) {
    document.getElementById('login-error').classList.remove('hidden');
    return;
  }
  currentUser = found;
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  document.getElementById('user-name-display').textContent = user.charAt(0).toUpperCase() + user.slice(1);
  document.getElementById('user-avatar').textContent = user.charAt(0).toUpperCase();
  document.getElementById('user-role-display').textContent = found.role === 'admin' ? 'Administrador' : 'Empleado';

  // Admin-only items
  document.querySelectorAll('.admin-only').forEach(el => {
    el.style.display = found.role === 'admin' ? 'flex' : 'none';
  });

  navTo('ventas');
  cargarProductosGrid();
  cargarMediosPago();
}

function doLogout() {
  currentUser = null;
  document.getElementById('app').classList.add('hidden');
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('login-user').value = '';
  document.getElementById('login-pass').value = '';
  document.getElementById('login-error').classList.add('hidden');
}

// ── NAVIGATION ──
function navTo(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const pageEl = document.getElementById('page-' + page);
  if (pageEl) pageEl.classList.add('active');
  const navEl = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (navEl) navEl.classList.add('active');

  if (page === 'caja')      cargarCaja();
  if (page === 'dashboard') cargarDashboard();
  if (page === 'productos') cargarTablaProductos();
  if (page === 'config')    cargarConfig();
  if (page === 'stock')     cargarStock();
}

// ── TOAST ──
function showToast(msg, type = 'ok') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast ' + (type === 'error' ? 'error' : type === 'warn' ? 'warning' : '');
  t.classList.remove('hidden');
  setTimeout(() => t.classList.add('hidden'), 3200);
}

// ── PRODUCTOS GRID ──
function cargarProductosGrid() {
  const productos = DB.getProducts(true);
  const cats = ['Todos', ...new Set(productos.map(p => p.categoria))];
  const tabsEl = document.getElementById('filtros-categoria');
  tabsEl.innerHTML = '';
  cats.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'cat-tab' + (cat === catActiva ? ' active' : '');
    btn.textContent = cat;
    btn.onclick = () => {
      catActiva = cat;
      document.querySelectorAll('.cat-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderProductosGrid(productos);
    };
    tabsEl.appendChild(btn);
  });
  renderProductosGrid(productos);
}

function renderProductosGrid(productos) {
  const filtered = catActiva === 'Todos' ? productos : productos.filter(p => p.categoria === catActiva);
  const grid = document.getElementById('grilla-productos');
  grid.innerHTML = '';
  if (!filtered.length) {
    grid.innerHTML = '<p style="color:var(--text-light);grid-column:1/-1;padding:20px;">No hay productos en esta categoría.</p>';
    return;
  }
  filtered.forEach(prod => {
    const card = document.createElement('div');
    card.className = 'prod-card';
    card.innerHTML = `<div class="prod-card-name">${prod.nombre}</div><div class="prod-card-price">${fmt(prod.precio)}</div>`;
    card.onclick = () => agregarAlCarrito(prod);
    grid.appendChild(card);
  });
}

// ── CARRITO ──
function agregarAlCarrito(prod) {
  const existing = carrito.find(i => i.id === prod.id);
  if (existing) {
    existing.cantidad++;
    existing.importe = existing.cantidad * existing.precio;
  } else {
    carrito.push({ ...prod, cantidad: 1, importe: prod.precio });
  }
  renderCarrito();
}

function cambiarCantidad(id, delta) {
  const item = carrito.find(i => i.id === id);
  if (!item) return;
  item.cantidad += delta;
  if (item.cantidad <= 0) {
    carrito = carrito.filter(i => i.id !== id);
  } else {
    item.importe = item.cantidad * item.precio;
  }
  renderCarrito();
}

function quitarDelCarrito(id) {
  carrito = carrito.filter(i => i.id !== id);
  renderCarrito();
}

function limpiarCarrito() {
  carrito = [];
  renderCarrito();
}

function renderCarrito() {
  const el = document.getElementById('carrito-items');
  if (!carrito.length) {
    el.innerHTML = '<div class="carrito-empty">Seleccioná productos para agregar</div>';
    document.getElementById('carrito-total').textContent = '$0';
    return;
  }
  el.innerHTML = carrito.map(item => `
    <div class="carrito-item">
      <div class="ci-name">${item.nombre}</div>
      <div class="ci-controls">
        <button class="ci-btn" onclick="cambiarCantidad('${item.id}', -1)">−</button>
        <span class="ci-qty">${item.cantidad}</span>
        <button class="ci-btn" onclick="cambiarCantidad('${item.id}', 1)">+</button>
      </div>
      <div class="ci-total">${fmt(item.importe)}</div>
      <button class="ci-remove" onclick="quitarDelCarrito('${item.id}')">✕</button>
    </div>
  `).join('');
  const total = carrito.reduce((acc, i) => acc + i.importe, 0);
  document.getElementById('carrito-total').textContent = fmt(total);
}

function cargarMediosPago() {
  const medios = DB.getMedios();
  const sel = document.getElementById('medio-pago');
  sel.innerHTML = medios.map(m => `<option value="${m}">${m}</option>`).join('');
}

// ── REGISTRAR VENTA ──
async function registrarVenta() {
  if (!carrito.length) {
    showToast('Agregá al menos un producto', 'error'); return;
  }
  const medioPago = document.getElementById('medio-pago').value;
  const obs = document.getElementById('obs-venta').value.trim();
  const total = carrito.reduce((acc, i) => acc + i.importe, 0);

  const sale = {
    fecha:     today(),
    hora:      nowTime(),
    medioPago,
    obs,
    total,
    items:     carrito.map(i => ({
      id: i.id, nombre: i.nombre, categoria: i.categoria,
      cantidad: i.cantidad, precio: i.precio, importe: i.importe
    }))
  };

  DB.addSale(sale);

  // Sync to Sheets
  const cfg = DB.getConfig();
  if (cfg.scriptUrl) {
    Sheets.appendSale(sale); // fire and forget
  }

  // Animate button
  const btn = document.getElementById('btn-registrar');
  btn.textContent = '✓ ¡Registrado!';
  btn.style.background = 'var(--green-mid)';
  setTimeout(() => {
    btn.textContent = '✓ Registrar Venta';
    btn.style.background = '';
  }, 1500);

  showToast(`Venta registrada: ${fmt(total)} · ${medioPago}`);
  document.getElementById('obs-venta').value = '';
  limpiarCarrito();
}

// ── CAJA ──
function cargarCaja() {
  const sales = DB.getSalesForDate(today());
  const total = sales.reduce((acc, s) => acc + s.total, 0);
  const byMedio = Analytics.totalByMedio(sales);
  const medios = DB.getMedios();
  const ticket = Analytics.ticketPromedio(sales);

  const statsEl = document.getElementById('caja-stats');
  statsEl.innerHTML = `
    <div class="stat-card"><div class="stat-label">Operaciones</div><div class="stat-value">${sales.length}</div></div>
    <div class="stat-card"><div class="stat-label">Facturación total</div><div class="stat-value">${fmt(total)}</div></div>
    <div class="stat-card"><div class="stat-label">Ticket promedio</div><div class="stat-value">${fmt(ticket)}</div></div>
    ${medios.map(m => `<div class="stat-card" style="border-left-color:var(--green-light)"><div class="stat-label">${m}</div><div class="stat-value">${fmt(byMedio[m]||0)}</div></div>`).join('')}
  `;

  const body = document.getElementById('body-caja');
  if (!sales.length) {
    body.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-light);padding:24px">Sin ventas registradas hoy</td></tr>';
    return;
  }
  body.innerHTML = sales.slice().reverse().map(s => {
    const detalle = s.items.map(i => `${i.nombre} ×${i.cantidad}`).join(', ');
    const cantTotal = s.items.reduce((a,i)=>a+i.cantidad,0);
    return `<tr>
      <td>${s.hora}</td>
      <td style="max-width:280px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${detalle}</td>
      <td>${cantTotal}</td>
      <td style="font-weight:700;color:var(--green)">${fmt(s.total)}</td>
      <td>${s.medioPago}</td>
    </tr>`;
  }).join('');
}

function cerrarCaja() {
  document.getElementById('modal-caja').classList.remove('hidden');
}

function cerrarModalCaja() {
  document.getElementById('modal-caja').classList.add('hidden');
}

async function confirmarCierreCaja() {
  const sales = DB.getSalesForDate(today());
  const summary = {
    fecha: today(),
    hora:  nowTime(),
    totalOps: sales.length,
    total: sales.reduce((a,s)=>a+s.total,0),
    byMedio: Analytics.totalByMedio(sales),
  };
  const cfg = DB.getConfig();
  if (cfg.scriptUrl) Sheets.closeCaja(summary);
  cerrarModalCaja();
  showToast('Caja cerrada correctamente');
}

// ── DASHBOARD ──
function cargarDashboard() {
  const now = new Date();
  const salesHoy  = DB.getSalesForDate(today());
  const salesMes  = DB.getSalesForMonth(now.getFullYear(), now.getMonth());

  const totalHoy   = salesHoy.reduce((a,s)=>a+s.total,0);
  const totalMes   = salesMes.reduce((a,s)=>a+s.total,0);
  const ticket     = Analytics.ticketPromedio(salesHoy);
  const topProd    = Analytics.topProduct(salesMes);
  const topCat     = Analytics.topCategoria(salesMes);
  const topMedio   = Analytics.topMedio(salesMes);

  document.getElementById('dashboard-stats').innerHTML = `
    <div class="stat-card"><div class="stat-label">Ventas hoy</div><div class="stat-value">${fmt(totalHoy)}</div><div class="stat-sub">${salesHoy.length} operaciones</div></div>
    <div class="stat-card"><div class="stat-label">Ventas del mes</div><div class="stat-value">${fmt(totalMes)}</div><div class="stat-sub">${salesMes.length} operaciones</div></div>
    <div class="stat-card"><div class="stat-label">Ticket promedio hoy</div><div class="stat-value">${fmt(ticket)}</div></div>
    <div class="stat-card"><div class="stat-label">Producto top (mes)</div><div class="stat-value" style="font-size:18px">${topProd}</div></div>
    <div class="stat-card"><div class="stat-label">Categoría top (mes)</div><div class="stat-value" style="font-size:18px">${topCat}</div></div>
    <div class="stat-card"><div class="stat-label">Pago más usado (mes)</div><div class="stat-value" style="font-size:18px">${topMedio}</div></div>
  `;

  renderCharts(salesMes);
}

// ── PRODUCTOS ADMIN ──
function cargarTablaProductos() {
  const productos = DB.getProducts();
  const body = document.getElementById('body-productos');
  if (!productos.length) {
    body.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-light);padding:24px">Sin productos</td></tr>';
    return;
  }
  body.innerHTML = productos.map(p => `
    <tr>
      <td style="font-weight:600">${p.nombre}</td>
      <td>${p.categoria}</td>
      <td style="font-weight:700;color:var(--green)">${fmt(p.precio)}</td>
      <td><span class="badge ${p.activo ? 'badge-active' : 'badge-inactive'}">${p.activo ? 'Activo' : 'Inactivo'}</span></td>
      <td>
        <button class="action-btn" onclick="abrirModalProducto('${p.id}')" title="Editar">✏️</button>
        <button class="action-btn" onclick="toggleProducto('${p.id}')" title="${p.activo ? 'Desactivar' : 'Activar'}">${p.activo ? '⏸' : '▶️'}</button>
        <button class="action-btn delete" onclick="eliminarProducto('${p.id}')" title="Eliminar">🗑️</button>
      </td>
    </tr>
  `).join('');
}

function abrirModalProducto(id = null) {
  const modal = document.getElementById('modal-producto');
  const cats = DB.getCategorias();
  const catSel = document.getElementById('prod-categoria');
  catSel.innerHTML = cats.map(c => `<option value="${c}">${c}</option>`).join('');

  document.getElementById('modal-prod-title').textContent = id ? 'Editar Producto' : 'Nuevo Producto';
  document.getElementById('prod-id').value = id || '';

  const resetConsumos = (c = {}) => {
    document.getElementById('cons-helado').value    = c.helado    || '';
    document.getElementById('cons-pote1kg').value   = c.pote1kg   || '';
    document.getElementById('cons-pote05kg').value  = c.pote05kg  || '';
    document.getElementById('cons-pote025kg').value = c.pote025kg || '';
    document.getElementById('cons-cucurucho').value = c.cucurucho || '';
    document.getElementById('cons-vasito').value    = c.vasito    || '';
  };

  if (id) {
    const p = DB.getProducts().find(x => x.id === id);
    if (p) {
      document.getElementById('prod-nombre').value    = p.nombre;
      document.getElementById('prod-categoria').value = p.categoria;
      document.getElementById('prod-precio').value    = p.precio;
      document.getElementById('prod-estado').value    = p.activo ? 'activo' : 'inactivo';
      resetConsumos(p.consumos || {});
    }
  } else {
    document.getElementById('prod-nombre').value = '';
    document.getElementById('prod-precio').value = '';
    document.getElementById('prod-estado').value = 'activo';
    resetConsumos();
  }
  modal.classList.remove('hidden');
}

function cerrarModalProducto() {
  document.getElementById('modal-producto').classList.add('hidden');
}

function guardarProducto() {
  const nombre = document.getElementById('prod-nombre').value.trim();
  const categoria = document.getElementById('prod-categoria').value;
  const precio = parseFloat(document.getElementById('prod-precio').value);
  const activo = document.getElementById('prod-estado').value === 'activo';
  const id = document.getElementById('prod-id').value;

  if (!nombre || isNaN(precio) || precio < 0) {
    showToast('Completá todos los campos correctamente', 'error'); return;
  }

  const consumos = {
    helado:    parseFloat(document.getElementById('cons-helado').value)    || 0,
    pote1kg:   parseFloat(document.getElementById('cons-pote1kg').value)   || 0,
    pote05kg:  parseFloat(document.getElementById('cons-pote05kg').value)  || 0,
    pote025kg: parseFloat(document.getElementById('cons-pote025kg').value) || 0,
    cucurucho: parseFloat(document.getElementById('cons-cucurucho').value) || 0,
    vasito:    parseFloat(document.getElementById('cons-vasito').value)    || 0,
  };

  DB.saveProduct({ id, nombre, categoria, precio, activo, consumos });
  const cfg = DB.getConfig();
  if (cfg.scriptUrl) Sheets.syncProducts(DB.getProducts());

  cerrarModalProducto();
  cargarTablaProductos();
  cargarProductosGrid();
  showToast(id ? 'Producto actualizado' : 'Producto creado');
}

function toggleProducto(id) {
  const p = DB.getProducts().find(x => x.id === id);
  if (!p) return;
  p.activo = !p.activo;
  DB.saveProduct(p);
  cargarTablaProductos();
  cargarProductosGrid();
}

function eliminarProducto(id) {
  if (!confirm('¿Eliminar este producto?')) return;
  DB.deleteProduct(id);
  cargarTablaProductos();
  cargarProductosGrid();
  showToast('Producto eliminado');
}

// ── REPORTES ──
function onReporteTipoChange() {
  const tipo = document.getElementById('reporte-tipo').value;
  document.getElementById('rango-fechas').style.display  = tipo === 'rango' ? '' : 'none';
  document.getElementById('rango-fechas2').style.display = tipo === 'rango' ? '' : 'none';
}

function generarReporte() {
  const tipo = document.getElementById('reporte-tipo').value;
  const now = new Date();
  let sales = [];

  if (tipo === 'diario') {
    sales = DB.getSalesForDate(today());
  } else if (tipo === 'mensual') {
    sales = DB.getSalesForMonth(now.getFullYear(), now.getMonth());
  } else {
    const desde = document.getElementById('reporte-desde').value;
    const hasta = document.getElementById('reporte-hasta').value;
    if (!desde || !hasta) { showToast('Seleccioná el rango de fechas', 'error'); return; }
    sales = DB.getSalesForRange(desde, hasta);
  }

  reporteData = sales;
  const total = sales.reduce((a,s)=>a+s.total,0);
  const ticket = Analytics.ticketPromedio(sales);

  document.getElementById('reporte-stats').innerHTML = `
    <div class="stat-card"><div class="stat-label">Operaciones</div><div class="stat-value">${sales.length}</div></div>
    <div class="stat-card"><div class="stat-label">Facturación</div><div class="stat-value">${fmt(total)}</div></div>
    <div class="stat-card"><div class="stat-label">Ticket promedio</div><div class="stat-value">${fmt(ticket)}</div></div>
  `;

  // Expand sales to rows
  const rows = [];
  sales.forEach(s => {
    s.items.forEach(item => {
      rows.push({ fecha: s.fecha, hora: s.hora, nombre: item.nombre, categoria: item.categoria,
        cantidad: item.cantidad, precio: item.precio, importe: item.importe, medioPago: s.medioPago, obs: s.obs });
    });
  });

  const body = document.getElementById('body-reporte');
  if (!rows.length) {
    body.innerHTML = '<tr><td colspan="9" style="text-align:center;color:var(--text-light);padding:24px">Sin datos para el período seleccionado</td></tr>';
  } else {
    body.innerHTML = rows.map(r => `<tr>
      <td>${fmtDate(r.fecha)}</td>
      <td>${r.hora}</td>
      <td>${r.nombre}</td>
      <td>${r.categoria}</td>
      <td>${r.cantidad}</td>
      <td>${fmt(r.precio)}</td>
      <td style="font-weight:700;color:var(--green)">${fmt(r.importe)}</td>
      <td>${r.medioPago}</td>
      <td>${r.obs||''}</td>
    </tr>`).join('');
  }

  document.getElementById('reporte-resultado').classList.remove('hidden');
}

function exportarCSV() {
  if (!reporteData.length) { showToast('Generá un reporte primero', 'error'); return; }
  const rows = [['Fecha','Hora','Producto','Categoría','Cantidad','Precio Unit.','Importe','Medio de Pago','Observaciones']];
  reporteData.forEach(s => {
    s.items.forEach(item => {
      rows.push([s.fecha, s.hora, item.nombre, item.categoria, item.cantidad, item.precio, item.importe, s.medioPago, s.obs||'']);
    });
  });
  const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
  const blob = new Blob(['\ufeff'+csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `prodan_ventas_${today()}.csv`; a.click();
  showToast('CSV exportado');
}

function exportarExcel() {
  if (!reporteData.length) { showToast('Generá un reporte primero', 'error'); return; }
  const rows = [['Fecha','Hora','Producto','Categoría','Cantidad','Precio Unit.','Importe','Medio de Pago','Observaciones']];
  reporteData.forEach(s => {
    s.items.forEach(item => {
      rows.push([s.fecha, s.hora, item.nombre, item.categoria, item.cantidad, item.precio, item.importe, s.medioPago, s.obs||'']);
    });
  });
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = rows[0].map(() => ({ wch: 18 }));
  XLSX.utils.book_append_sheet(wb, ws, 'Ventas');
  XLSX.writeFile(wb, `prodan_ventas_${today()}.xlsx`);
  showToast('Excel exportado');
}

// ── CONFIG ──
function cargarConfig() {
  const cfg = DB.getConfig();
  document.getElementById('cfg-script-url').value = cfg.scriptUrl || '';
  document.getElementById('cfg-sheet-id').value   = cfg.sheetId  || '';

  // Medios de pago
  renderMediosPagoConfig();
  // Categorías
  renderCategoriasConfig();
}

function renderMediosPagoConfig() {
  const medios = DB.getMedios();
  document.getElementById('lista-medios-pago').innerHTML = medios.map((m,i) => `
    <div class="tag-item">${m}<button class="tag-remove" onclick="eliminarMedio(${i})">✕</button></div>
  `).join('');
}

function agregarMedioPago() {
  const val = document.getElementById('nuevo-medio').value.trim();
  if (!val) return;
  const medios = DB.getMedios();
  if (!medios.includes(val)) { medios.push(val); DB.setMedios(medios); }
  document.getElementById('nuevo-medio').value = '';
  renderMediosPagoConfig();
  cargarMediosPago();
  showToast('Medio de pago agregado');
}

function eliminarMedio(i) {
  const medios = DB.getMedios();
  medios.splice(i, 1);
  DB.setMedios(medios);
  renderMediosPagoConfig();
  cargarMediosPago();
}

function renderCategoriasConfig() {
  const cats = DB.getCategorias();
  document.getElementById('lista-categorias').innerHTML = cats.map((c,i) => `
    <div class="tag-item">${c}<button class="tag-remove" onclick="eliminarCategoria(${i})">✕</button></div>
  `).join('');
}

function agregarCategoria() {
  const val = document.getElementById('nueva-categoria').value.trim();
  if (!val) return;
  const cats = DB.getCategorias();
  if (!cats.includes(val)) { cats.push(val); DB.setCategorias(cats); }
  document.getElementById('nueva-categoria').value = '';
  renderCategoriasConfig();
  showToast('Categoría agregada');
}

function eliminarCategoria(i) {
  const cats = DB.getCategorias();
  cats.splice(i, 1);
  DB.setCategorias(cats);
  renderCategoriasConfig();
}

function guardarConfigSheets() {
  const url = document.getElementById('cfg-script-url').value.trim();
  const id  = document.getElementById('cfg-sheet-id').value.trim();
  DB.setConfig({ scriptUrl: url, sheetId: id });
  showToast('Configuración guardada');

  const status = document.getElementById('sheets-status');
  status.classList.remove('hidden', 'status-ok', 'status-err');

  if (url) {
    status.textContent = '🔄 Probando conexión...';
    status.classList.add('status-ok');
    Sheets.test(url).then(res => {
      status.textContent = res.ok
        ? '✅ Conexión establecida correctamente'
        : '⚠️ No se pudo verificar la conexión (puede ser normal con modo no-cors)';
      status.classList.toggle('status-ok', res.ok);
      status.classList.toggle('status-err', !res.ok);
    });
  }
}

function cambiarPassword() {
  const p1 = document.getElementById('cfg-admin-pass').value;
  const p2 = document.getElementById('cfg-admin-pass2').value;
  if (!p1 || p1 !== p2) { showToast('Las contraseñas no coinciden', 'error'); return; }
  if (p1.length < 6)     { showToast('La contraseña debe tener al menos 6 caracteres', 'error'); return; }
  DB.changePassword(p1);
  document.getElementById('cfg-admin-pass').value  = '';
  document.getElementById('cfg-admin-pass2').value = '';
  showToast('Contraseña actualizada');
}

// ══════════════════════════════════════════
// STOCK DEL DÍA
// ══════════════════════════════════════════

const INSUMOS = [
  { key: 'helado',    label: 'Kg de helado',  icon: '🍦', unit: 'kg',  decimales: 2 },
  { key: 'pote1kg',   label: 'Potes 1 kg',    icon: '🪣', unit: 'u',   decimales: 0 },
  { key: 'pote05kg',  label: 'Potes 1/2 kg',  icon: '🪣', unit: 'u',   decimales: 0 },
  { key: 'pote025kg', label: 'Potes 1/4 kg',  icon: '🥡', unit: 'u',   decimales: 0 },
  { key: 'cucurucho', label: 'Cucuruchos',     icon: '🍧', unit: 'u',   decimales: 0 },
  { key: 'vasito',    label: 'Vasitos',        icon: '🥤', unit: 'u',   decimales: 0 },
];

function fmtInsumo(val, decimales) {
  return decimales > 0 ? Number(val).toFixed(decimales) : Math.round(val);
}

function cargarStock() {
  const now = new Date();
  const str = now.toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const sub = document.getElementById('stock-fecha-sub');
  if (sub) sub.textContent = str.charAt(0).toUpperCase() + str.slice(1);

  const apertura = DB.getAperturaForDate(today());
  const sales    = DB.getSalesForDate(today());
  const consumo  = Analytics.calcularConsumo(sales);

  const sinAp = document.getElementById('stock-sin-apertura');
  if (!apertura) {
    sinAp.classList.remove('hidden');
  } else {
    sinAp.classList.add('hidden');
  }

  // Tarjetas de stock en tiempo real
  const grid = document.getElementById('stock-grid');
  grid.innerHTML = INSUMOS.map(ins => {
    const inicial   = apertura ? (apertura[ins.key] || 0) : null;
    const consumido = consumo[ins.key] || 0;
    const restante  = inicial !== null ? Math.max(0, inicial - consumido) : null;
    const pct       = (inicial && inicial > 0) ? (restante / inicial) * 100 : 100;
    const color     = pct > 50 ? 'var(--green)' : pct > 20 ? '#e67e22' : 'var(--red)';

    return `
      <div class="stock-card">
        <div class="stock-icon">${ins.icon}</div>
        <div class="stock-info">
          <div class="stock-label">${ins.label}</div>
          <div class="stock-value" style="color:${color}">
            ${restante !== null ? fmtInsumo(restante, ins.decimales) + ' ' + ins.unit : '—'}
          </div>
          ${inicial !== null ? `
          <div class="stock-bar-wrap">
            <div class="stock-bar" style="width:${Math.min(100,pct).toFixed(0)}%;background:${color}"></div>
          </div>
          <div class="stock-meta">Inicial: ${fmtInsumo(inicial, ins.decimales)} · Consumido: ${fmtInsumo(consumido, ins.decimales)}</div>
          ` : '<div class="stock-meta" style="color:var(--red)">Sin apertura registrada</div>'}
        </div>
      </div>
    `;
  }).join('');

  // Tabla de consumo teórico
  const body = document.getElementById('body-consumo');
  if (!apertura) {
    body.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-light);padding:20px">Registrá la apertura del día para ver el consumo teórico.</td></tr>';
    return;
  }
  body.innerHTML = INSUMOS.map(ins => {
    const inicial   = apertura[ins.key] || 0;
    const consumido = consumo[ins.key] || 0;
    const esperado  = Math.max(0, inicial - consumido);
    const pct       = inicial > 0 ? (esperado / inicial) * 100 : 100;
    const estadoCol = pct > 50 ? 'badge-active' : pct > 20 ? 'badge-warn' : 'badge-danger';
    const estadoTxt = pct > 50 ? 'Bien' : pct > 20 ? 'Bajo' : 'Crítico';
    return `<tr>
      <td>${ins.icon} ${ins.label}</td>
      <td>${fmtInsumo(inicial, ins.decimales)} ${ins.unit}</td>
      <td>${fmtInsumo(consumido, ins.decimales)} ${ins.unit}</td>
      <td style="font-weight:700">${fmtInsumo(esperado, ins.decimales)} ${ins.unit}</td>
      <td><span class="badge ${estadoCol}">${estadoTxt}</span></td>
    </tr>`;
  }).join('');
}

// ── MODAL APERTURA ──
function abrirModalApertura() {
  const ap = DB.getAperturaForDate(today());
  INSUMOS.forEach(ins => {
    const el = document.getElementById('ap-' + ins.key);
    if (el) el.value = ap ? (ap[ins.key] || '') : '';
  });
  document.getElementById('modal-apertura').classList.remove('hidden');
}

function cerrarModalApertura() {
  document.getElementById('modal-apertura').classList.add('hidden');
}

function guardarApertura() {
  const apertura = { fecha: today(), hora: nowTime() };
  let valid = false;
  INSUMOS.forEach(ins => {
    const val = parseFloat(document.getElementById('ap-' + ins.key).value) || 0;
    apertura[ins.key] = val;
    if (val > 0) valid = true;
  });
  if (!valid) { showToast('Ingresá al menos un valor de stock', 'error'); return; }

  DB.saveApertura(apertura);
  const cfg = DB.getConfig();
  if (cfg.scriptUrl) Sheets.appendApertura(apertura);

  cerrarModalApertura();
  cargarStock();
  showToast('Apertura del día registrada ✓');
}

// ── MODAL CIERRE CON INVENTARIO FÍSICO ──
function abrirModalCierreStock() {
  const apertura = DB.getAperturaForDate(today());
  const sales    = DB.getSalesForDate(today());
  const consumo  = Analytics.calcularConsumo(sales);

  const tabla = document.getElementById('cierre-stock-tabla');
  tabla.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th>Insumo</th>
          <th>Stock inicial</th>
          <th>Consumo teórico</th>
          <th>Stock esperado</th>
          <th>Stock real contado</th>
          <th>Diferencia</th>
        </tr>
      </thead>
      <tbody>
        ${INSUMOS.map(ins => {
          const inicial   = apertura ? (apertura[ins.key] || 0) : 0;
          const cons      = consumo[ins.key] || 0;
          const esperado  = Math.max(0, inicial - cons);
          return `<tr>
            <td>${ins.icon} ${ins.label}</td>
            <td>${fmtInsumo(inicial, ins.decimales)} ${ins.unit}</td>
            <td>${fmtInsumo(cons, ins.decimales)} ${ins.unit}</td>
            <td style="font-weight:700">${fmtInsumo(esperado, ins.decimales)} ${ins.unit}</td>
            <td>
              <input type="number" class="cierre-real-input" data-key="${ins.key}" data-esperado="${esperado}" data-dec="${ins.decimales}" data-unit="${ins.unit}"
                placeholder="${fmtInsumo(esperado, ins.decimales)}" min="0" step="${ins.decimales > 0 ? '0.01' : '1'}"
                style="width:100px;padding:6px 10px;border:2px solid var(--border);border-radius:6px;font-size:14px"
                oninput="actualizarDiferencia(this)" />
            </td>
            <td id="dif-${ins.key}" style="font-weight:700">—</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  `;

  document.getElementById('modal-cierre-stock').classList.remove('hidden');
}

function actualizarDiferencia(input) {
  const key      = input.dataset.key;
  const esperado = parseFloat(input.dataset.esperado) || 0;
  const dec      = parseInt(input.dataset.dec);
  const unit     = input.dataset.unit;
  const real     = parseFloat(input.value);
  const difEl    = document.getElementById('dif-' + key);
  if (isNaN(real)) { difEl.textContent = '—'; difEl.style.color = ''; return; }
  const dif = real - esperado;
  difEl.textContent = (dif >= 0 ? '+' : '') + fmtInsumo(dif, dec) + ' ' + unit;
  difEl.style.color = dif >= 0 ? 'var(--green)' : 'var(--red)';
}

function cerrarModalCierreStock() {
  document.getElementById('modal-cierre-stock').classList.add('hidden');
}

function confirmarCierreStock() {
  const apertura = DB.getAperturaForDate(today());
  const sales    = DB.getSalesForDate(today());
  const consumo  = Analytics.calcularConsumo(sales);

  const cierre = {
    fecha: today(),
    hora:  nowTime(),
    ventas: sales.length,
    totalVentas: sales.reduce((a,s) => a+s.total, 0),
    insumos: {}
  };

  document.querySelectorAll('.cierre-real-input').forEach(input => {
    const key      = input.dataset.key;
    const esperado = parseFloat(input.dataset.esperado) || 0;
    const real     = parseFloat(input.value);
    cierre.insumos[key] = {
      inicial:  apertura ? (apertura[key] || 0) : 0,
      consumido: consumo[key] || 0,
      esperado,
      real:      isNaN(real) ? null : real,
      diferencia: isNaN(real) ? null : real - esperado,
    };
  });

  DB.saveCierreStock(cierre);
  const cfg = DB.getConfig();
  if (cfg.scriptUrl) Sheets.appendCierreStock(cierre);

  cerrarModalCierreStock();
  cargarStock();
  showToast('Cierre con inventario registrado ✓');
}
