// ==========================================
// PRODAN · Módulo de Gastos y Balance
// ==========================================

// ── CATEGORÍAS DE GASTOS (default) ──
const CATS_GASTOS_DEFAULT = [
  'Alquiler', 'Luz / Agua / Gas', 'Materia Prima', 'Impuestos',
  'Envases', 'Combustible', 'Sueldos', 'Otros'
];

// Extender DB con métodos de gastos
Object.assign(DB, {
  KEY_GASTOS:     'prodan_gastos',
  KEY_CATS_GASTOS:'prodan_cats_gastos',

  initGastos() {
    if (!this.get(this.KEY_CATS_GASTOS)) {
      this.set(this.KEY_CATS_GASTOS, [...CATS_GASTOS_DEFAULT]);
    }
    if (!this.get(this.KEY_GASTOS)) {
      this.set(this.KEY_GASTOS, []);
    }
  },

  getGastos() { return this.get(this.KEY_GASTOS) || []; },

  getGastosForMonth(yearMonth) {
    // yearMonth: "2026-07"
    return this.getGastos().filter(g => g.fecha && g.fecha.startsWith(yearMonth));
  },

  saveGasto(gasto) {
    const list = this.getGastos();
    if (gasto.id) {
      const i = list.findIndex(g => g.id === gasto.id);
      if (i >= 0) list[i] = gasto;
      else list.push(gasto);
    } else {
      gasto.id = Date.now().toString() + Math.random().toString(36).substr(2,4);
      list.push(gasto);
    }
    this.set(this.KEY_GASTOS, list);
    return gasto;
  },

  deleteGasto(id) {
    const list = this.getGastos().filter(g => g.id !== id);
    this.set(this.KEY_GASTOS, list);
  },

  getCatsGastos() { return this.get(this.KEY_CATS_GASTOS) || CATS_GASTOS_DEFAULT; },
  setCatsGastos(list) { this.set(this.KEY_CATS_GASTOS, list); },
});

// Init on load
document.addEventListener('DOMContentLoaded', () => {
  DB.initGastos();
  // Set default month to current
  const mesInput = document.getElementById('gastos-mes');
  const balMesInput = document.getElementById('balance-mes');
  const mesActual = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Argentina/Buenos_Aires' }).substring(0, 7);
  if (mesInput) mesInput.value = mesActual;
  if (balMesInput) balMesInput.value = mesActual;
});

// ── NAVEGACIÓN ──
const _navToOrig = navTo;
// Extender navTo para gastos y balance
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
  if (page === 'gastos')    cargarGastos();
  if (page === 'balance')   cargarBalance();
}

// ── GASTOS ──
function cargarGastos() {
  const mes = document.getElementById('gastos-mes').value;
  const filtCat = document.getElementById('gastos-filtro-cat').value;
  const filtEst = document.getElementById('gastos-filtro-estado').value;

  // Populate cat filter
  const cats = DB.getCatsGastos();
  const selCat = document.getElementById('gastos-filtro-cat');
  const valActual = selCat.value;
  selCat.innerHTML = '<option value="">Todas</option>' + cats.map(c => `<option value="${c}">${c}</option>`).join('');
  selCat.value = valActual;

  let gastos = mes ? DB.getGastosForMonth(mes) : DB.getGastos();
  if (filtCat) gastos = gastos.filter(g => g.categoria === filtCat);
  if (filtEst) gastos = gastos.filter(g => g.estado === filtEst);

  const totalGastos  = gastos.reduce((a,g) => a + g.monto, 0);
  const totalPagado  = gastos.filter(g => g.estado === 'pagado').reduce((a,g) => a + g.monto, 0);
  const totalPend    = gastos.filter(g => g.estado === 'pendiente').reduce((a,g) => a + g.monto, 0);
  const cantPend     = gastos.filter(g => g.estado === 'pendiente').length;

  document.getElementById('gastos-stats').innerHTML = `
    <div class="stat-card"><div class="stat-label">Total egresos</div><div class="stat-value">${fmt(totalGastos)}</div></div>
    <div class="stat-card" style="border-left-color:var(--green)"><div class="stat-label">Pagado</div><div class="stat-value">${fmt(totalPagado)}</div></div>
    <div class="stat-card" style="border-left-color:#e67e22"><div class="stat-label">Pendiente</div><div class="stat-value" style="color:${totalPend>0?'#e67e22':'inherit'}">${fmt(totalPend)}</div></div>
    <div class="stat-card" style="border-left-color:#e67e22"><div class="stat-label">Items pendientes</div><div class="stat-value">${cantPend}</div></div>
  `;

  const alerta = document.getElementById('gastos-alerta-pendientes');
  alerta.classList.toggle('hidden', cantPend === 0);

  const body = document.getElementById('body-gastos');
  if (!gastos.length) {
    body.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--text-light);padding:24px">Sin gastos registrados</td></tr>';
    return;
  }

  body.innerHTML = gastos.slice().sort((a,b) => b.fecha.localeCompare(a.fecha)).map(g => `
    <tr>
      <td>${fmtDate(g.fecha)}</td>
      <td style="font-weight:600">${g.desc}</td>
      <td><span class="cat-gasto-badge">${g.categoria}</span></td>
      <td style="color:var(--text-light);font-size:12px">${g.comprobante || '—'}</td>
      <td style="font-weight:700;color:var(--red)">${fmt(g.monto)}</td>
      <td>
        <span class="badge ${g.estado === 'pagado' ? 'badge-active' : 'badge-warn'}">
          ${g.estado === 'pagado' ? '✓ Pagado' : '⏳ Pendiente'}
        </span>
      </td>
      <td>
        ${g.estado === 'pendiente' ? `<button class="action-btn" onclick="marcarPagado('${g.id}')" title="Marcar como pagado">✓</button>` : ''}
        <button class="action-btn" onclick="abrirModalGasto('${g.id}')" title="Editar">✏️</button>
        <button class="action-btn delete" onclick="eliminarGasto('${g.id}')" title="Eliminar">🗑️</button>
      </td>
    </tr>
  `).join('');
}

function abrirModalGasto(id = null) {
  const cats = DB.getCatsGastos();
  document.getElementById('gasto-categoria').innerHTML = cats.map(c => `<option value="${c}">${c}</option>`).join('');
  document.getElementById('modal-gasto-title').textContent = id ? 'Editar Gasto' : 'Nuevo Gasto';
  document.getElementById('gasto-id').value = id || '';

  if (id) {
    const g = DB.getGastos().find(x => x.id === id);
    if (g) {
      document.getElementById('gasto-fecha').value       = g.fecha;
      document.getElementById('gasto-desc').value        = g.desc;
      document.getElementById('gasto-categoria').value   = g.categoria;
      document.getElementById('gasto-comprobante').value = g.comprobante || '';
      document.getElementById('gasto-monto').value       = g.monto;
      document.getElementById('gasto-estado').value      = g.estado;
      document.getElementById('gasto-obs').value         = g.obs || '';
    }
  } else {
    document.getElementById('gasto-fecha').value       = today();
    document.getElementById('gasto-desc').value        = '';
    document.getElementById('gasto-comprobante').value = '';
    document.getElementById('gasto-monto').value       = '';
    document.getElementById('gasto-estado').value      = 'pagado';
    document.getElementById('gasto-obs').value         = '';
  }
  document.getElementById('modal-gasto').classList.remove('hidden');
}

function cerrarModalGasto() {
  document.getElementById('modal-gasto').classList.add('hidden');
}

function guardarGasto() {
  const fecha  = document.getElementById('gasto-fecha').value;
  const desc   = document.getElementById('gasto-desc').value.trim();
  const cat    = document.getElementById('gasto-categoria').value;
  const comp   = document.getElementById('gasto-comprobante').value.trim();
  const monto  = parseFloat(document.getElementById('gasto-monto').value);
  const estado = document.getElementById('gasto-estado').value;
  const obs    = document.getElementById('gasto-obs').value.trim();
  const id     = document.getElementById('gasto-id').value;

  if (!fecha || !desc || !cat || isNaN(monto) || monto <= 0) {
    showToast('Completá todos los campos obligatorios', 'error'); return;
  }

  const gasto = { id, fecha, desc, categoria: cat, comprobante: comp, monto, estado, obs };
  DB.saveGasto(gasto);

  // Sync Sheets
  const cfg = DB.getConfig();
  if (cfg.scriptUrl) Sheets.send({ action: 'appendGasto', gasto });

  cerrarModalGasto();
  cargarGastos();
  showToast(id ? 'Gasto actualizado' : 'Gasto registrado');
}

function marcarPagado(id) {
  const gastos = DB.getGastos();
  const g = gastos.find(x => x.id === id);
  if (!g) return;
  g.estado = 'pagado';
  DB.saveGasto(g);
  cargarGastos();
  showToast('Marcado como pagado ✓');
}

function eliminarGasto(id) {
  if (!confirm('¿Eliminar este gasto?')) return;
  DB.deleteGasto(id);
  cargarGastos();
  showToast('Gasto eliminado');
}

// ── CONFIG: CATEGORÍAS DE GASTOS ──
function cargarCatsGastosConfig() {
  const cats = DB.getCatsGastos();
  document.getElementById('lista-cats-gastos').innerHTML = cats.map((c,i) => `
    <div class="tag-item">${c}<button class="tag-remove" onclick="eliminarCatGasto(${i})">✕</button></div>
  `).join('');
}

function agregarCatGasto() {
  const val = document.getElementById('nueva-cat-gasto').value.trim();
  if (!val) return;
  const cats = DB.getCatsGastos();
  if (!cats.includes(val)) { cats.push(val); DB.setCatsGastos(cats); }
  document.getElementById('nueva-cat-gasto').value = '';
  cargarCatsGastosConfig();
  showToast('Categoría de gasto agregada');
}

function eliminarCatGasto(i) {
  const cats = DB.getCatsGastos();
  cats.splice(i, 1);
  DB.setCatsGastos(cats);
  cargarCatsGastosConfig();
}

// Extender cargarConfig original
const _cargarConfigOrig = cargarConfig;
function cargarConfig() {
  _cargarConfigOrig();
  cargarCatsGastosConfig();
}

// ── BALANCE ──
let chartBalance = null;
let chartGastosCat = null;

function cargarBalance() {
  const mes = document.getElementById('balance-mes').value;
  if (!mes) { showToast('Seleccioná un mes', 'error'); return; }

  const [year, month] = mes.split('-').map(Number);

  // Ingresos: ventas del mes
  const ventas = DB.getSalesForMonth(year, month - 1);
  const totalVentas = ventas.reduce((a,s) => a + s.total, 0);
  const ventasPorMedio = Analytics.totalByMedio(ventas);

  // Egresos: gastos del mes
  const gastos = DB.getGastosForMonth(mes);
  const totalGastos   = gastos.reduce((a,g) => a + g.monto, 0);
  const totalPagado   = gastos.filter(g => g.estado === 'pagado').reduce((a,g) => a + g.monto, 0);
  const totalPendiente= gastos.filter(g => g.estado === 'pendiente').reduce((a,g) => a + g.monto, 0);
  const gastosPendientes = gastos.filter(g => g.estado === 'pendiente');

  // Resultado
  const resultado = totalVentas - totalGastos;
  const resultadoReal = totalVentas - totalPagado;

  // Stats
  document.getElementById('balance-stats').innerHTML = `
    <div class="stat-card" style="border-left-color:var(--green)">
      <div class="stat-label">Ingresos (ventas)</div>
      <div class="stat-value" style="color:var(--green)">${fmt(totalVentas)}</div>
      <div class="stat-sub">${ventas.length} ventas</div>
    </div>
    <div class="stat-card" style="border-left-color:var(--red)">
      <div class="stat-label">Egresos (gastos)</div>
      <div class="stat-value" style="color:var(--red)">${fmt(totalGastos)}</div>
      <div class="stat-sub">${fmt(totalPendiente)} pendiente</div>
    </div>
    <div class="stat-card" style="border-left-color:${resultado>=0?'var(--green)':'var(--red)'}">
      <div class="stat-label">Resultado bruto</div>
      <div class="stat-value" style="color:${resultado>=0?'var(--green)':'var(--red)'}">${fmt(resultado)}</div>
      <div class="stat-sub">${resultado >= 0 ? '✓ Ganancia' : '⚠ Pérdida'}</div>
    </div>
    <div class="stat-card" style="border-left-color:${resultadoReal>=0?'var(--green)':'#e67e22'}">
      <div class="stat-label">Resultado real (sin pendientes)</div>
      <div class="stat-value" style="color:${resultadoReal>=0?'var(--green)':'#e67e22'}">${fmt(resultadoReal)}</div>
      <div class="stat-sub">Gastos pagados: ${fmt(totalPagado)}</div>
    </div>
  `;

  // Banner resultado
  const banner = document.getElementById('balance-resultado');
  banner.className = `balance-resultado ${resultado >= 0 ? 'balance-ganancia' : 'balance-perdida'}`;
  banner.innerHTML = resultado >= 0
    ? `✓ Ganancia del mes: <strong>${fmt(resultado)}</strong>`
    : `⚠ Pérdida del mes: <strong>${fmt(Math.abs(resultado))}</strong>`;
  banner.classList.remove('hidden');

  // Detalle ingresos
  document.getElementById('body-balance-ingresos').innerHTML = `
    <tr><td style="font-weight:600">Total ventas</td><td style="font-weight:700;color:var(--green)">${fmt(totalVentas)}</td></tr>
    ${Object.entries(ventasPorMedio).map(([k,v]) => `
      <tr><td style="padding-left:20px;color:var(--text-mid)">${k}</td><td>${fmt(v)}</td></tr>
    `).join('')}
  `;

  // Detalle egresos por categoría
  const porCat = {};
  const porCatPend = {};
  gastos.forEach(g => {
    porCat[g.categoria] = (porCat[g.categoria] || 0) + g.monto;
    if (g.estado === 'pendiente') porCatPend[g.categoria] = (porCatPend[g.categoria] || 0) + g.monto;
  });

  document.getElementById('body-balance-egresos').innerHTML = Object.entries(porCat)
    .sort((a,b) => b[1]-a[1])
    .map(([cat, total]) => `
      <tr>
        <td style="font-weight:600">${cat}</td>
        <td style="font-weight:700;color:var(--red)">${fmt(total)}</td>
        <td style="color:#e67e22">${porCatPend[cat] ? fmt(porCatPend[cat]) : '—'}</td>
      </tr>
    `).join('') || '<tr><td colspan="3" style="color:var(--text-light);padding:16px;text-align:center">Sin gastos registrados</td></tr>';

  // Pendientes
  document.getElementById('body-balance-pendientes').innerHTML = gastosPendientes.length
    ? gastosPendientes.map(g => `
        <tr>
          <td>${fmtDate(g.fecha)}</td>
          <td>${g.desc}</td>
          <td>${g.categoria}</td>
          <td style="font-weight:700;color:#e67e22">${fmt(g.monto)}</td>
        </tr>
      `).join('')
    : '<tr><td colspan="4" style="color:var(--green);text-align:center;padding:16px">✓ Sin pagos pendientes</td></tr>';

  // Mostrar secciones
  document.getElementById('balance-charts').style.display = 'grid';
  document.getElementById('balance-detalle').style.display = 'block';

  // Gráfico ingresos vs egresos
  if (chartBalance) chartBalance.destroy();
  chartBalance = new Chart(document.getElementById('chart-balance'), {
    type: 'bar',
    data: {
      labels: ['Ingresos', 'Egresos pagados', 'Egresos pendientes'],
      datasets: [{
        data: [totalVentas, totalPagado, totalPendiente],
        backgroundColor: ['#2D6A4F', '#C0392B', '#e67e22'],
        borderRadius: 8,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${fmt(ctx.raw)}` } } },
      scales: {
        y: { ticks: { callback: v => '$' + (v/1000).toFixed(0) + 'k', font: { family: 'Inter', size: 11 } }, grid: { color: '#f0f0f0' } },
        x: { grid: { display: false }, ticks: { font: { family: 'Inter', size: 11 } } }
      }
    }
  });

  // Gráfico gastos por categoría
  if (chartGastosCat) chartGastosCat.destroy();
  const catLabels = Object.keys(porCat);
  const catData   = Object.values(porCat);
  const COLORES = ['#2D6A4F','#40916C','#74C69D','#C0392B','#e67e22','#3498db','#9b59b6','#1B4332'];
  chartGastosCat = new Chart(document.getElementById('chart-gastos-cat'), {
    type: 'doughnut',
    data: {
      labels: catLabels,
      datasets: [{ data: catData, backgroundColor: COLORES, borderWidth: 2, borderColor: '#fff' }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'right', labels: { font: { family: 'Inter', size: 11 } } },
        tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${fmt(ctx.raw)}` } }
      }
    }
  });
}
