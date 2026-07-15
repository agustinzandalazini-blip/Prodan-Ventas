// ==========================================
// PRODAN · Data Layer (localStorage)
// ==========================================

const DB = {
  // Keys
  KEY_PRODUCTS: 'prodan_productos',
  KEY_SALES:    'prodan_ventas',
  KEY_MEDIOS:   'prodan_medios',
  KEY_CATS:     'prodan_categorias',
  KEY_CONFIG:   'prodan_config',
  KEY_USERS:    'prodan_users',
  KEY_APERTURAS:     'prodan_aperturas',
  KEY_CIERRES_STOCK: 'prodan_cierres_stock',

  // ── INIT ──
  init() {
    if (!this.get(this.KEY_USERS)) {
      this.set(this.KEY_USERS, [
        { user: 'admin', pass: btoa('prodan2024'), role: 'admin' },
        { user: 'caja',  pass: btoa('caja123'),   role: 'empleado' }
      ]);
    }
    if (!this.get(this.KEY_MEDIOS)) {
      this.set(this.KEY_MEDIOS, ['Efectivo', 'Transferencia', 'Mercado Pago', 'Débito', 'Crédito']);
    }
    if (!this.get(this.KEY_CATS)) {
      this.set(this.KEY_CATS, ['Helados', 'Palitos', 'Bombones', 'Tortas heladas']);
    }
    if (!this.get(this.KEY_PRODUCTS)) {
      this.set(this.KEY_PRODUCTS, [
        { id: '1',  nombre: 'Helado 1/4 kg',      categoria: 'Helados',        precio: 1200, activo: true,  consumos: { helado: 0.25, pote025kg: 1 } },
        { id: '2',  nombre: 'Helado 1/2 kg',      categoria: 'Helados',        precio: 2200, activo: true,  consumos: { helado: 0.5,  pote05kg: 1  } },
        { id: '3',  nombre: 'Helado 3/4 kg',      categoria: 'Helados',        precio: 3100, activo: true,  consumos: { helado: 0.75, pote05kg: 1  } },
        { id: '4',  nombre: 'Helado 1 kg',        categoria: 'Helados',        precio: 3900, activo: true,  consumos: { helado: 1,    pote1kg: 1   } },
        { id: '5',  nombre: 'Palito de agua',     categoria: 'Palitos',        precio: 400,  activo: true,  consumos: {} },
        { id: '6',  nombre: 'Palito de crema',    categoria: 'Palitos',        precio: 600,  activo: true,  consumos: { helado: 0.08 } },
        { id: '7',  nombre: 'Bombón individual',  categoria: 'Bombones',       precio: 350,  activo: true,  consumos: { helado: 0.05 } },
        { id: '8',  nombre: 'Caja de bombones',   categoria: 'Bombones',       precio: 2800, activo: true,  consumos: { helado: 0.4  } },
        { id: '9',  nombre: 'Torta helada chica', categoria: 'Tortas heladas', precio: 4500, activo: true,  consumos: { helado: 1    } },
        { id: '10', nombre: 'Torta helada grande',categoria: 'Tortas heladas', precio: 7200, activo: true,  consumos: { helado: 2    } },
      ]);
    }
    if (!this.get(this.KEY_APERTURAS))     this.set(this.KEY_APERTURAS, []);
    if (!this.get(this.KEY_CIERRES_STOCK)) this.set(this.KEY_CIERRES_STOCK, []);
    if (!this.get(this.KEY_SALES)) {
      this.set(this.KEY_SALES, []);
    }
    if (!this.get(this.KEY_CONFIG)) {
      this.set(this.KEY_CONFIG, { scriptUrl: '', sheetId: '' });
    }
  },

  // ── CRUD ──
  get(key) {
    try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
  },
  set(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
  },

  // ── USERS ──
  login(user, pass) {
    const users = this.get(this.KEY_USERS) || [];
    return users.find(u => u.user === user && u.pass === btoa(pass)) || null;
  },
  changePassword(newPass) {
    const users = this.get(this.KEY_USERS) || [];
    const admin = users.find(u => u.role === 'admin');
    if (admin) admin.pass = btoa(newPass);
    this.set(this.KEY_USERS, users);
  },

  // ── PRODUCTS ──
  getProducts(onlyActive = false) {
    const p = this.get(this.KEY_PRODUCTS) || [];
    return onlyActive ? p.filter(x => x.activo) : p;
  },
  saveProduct(prod) {
    const products = this.getProducts();
    if (prod.id) {
      const i = products.findIndex(p => p.id === prod.id);
      if (i >= 0) products[i] = prod;
      else products.push(prod);
    } else {
      prod.id = Date.now().toString();
      products.push(prod);
    }
    this.set(this.KEY_PRODUCTS, products);
    return prod;
  },
  deleteProduct(id) {
    const products = this.getProducts().filter(p => p.id !== id);
    this.set(this.KEY_PRODUCTS, products);
  },

  // ── SALES ──
  getSales() { return this.get(this.KEY_SALES) || []; },
  addSale(sale) {
    const sales = this.getSales();
    sale.id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
    sales.push(sale);
    this.set(this.KEY_SALES, sales);
    return sale;
  },
  getSalesForDate(dateStr) {
    return this.getSales().filter(s => s.fecha === dateStr);
  },
  getSalesForMonth(year, month) {
    return this.getSales().filter(s => {
      const d = new Date(s.fecha);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  },
  getSalesForRange(desde, hasta) {
    const d0 = new Date(desde), d1 = new Date(hasta);
    return this.getSales().filter(s => {
      const d = new Date(s.fecha);
      return d >= d0 && d <= d1;
    });
  },

  // ── MEDIOS ──
  getMedios() { return this.get(this.KEY_MEDIOS) || []; },
  setMedios(list) { this.set(this.KEY_MEDIOS, list); },

  // ── CATEGORIAS ──
  getCategorias() { return this.get(this.KEY_CATS) || []; },
  setCategorias(list) { this.set(this.KEY_CATS, list); },

  // ── CONFIG ──
  getConfig() {
    const cfg = this.get(this.KEY_CONFIG) || {};
    // URL hardcodeada por defecto si no hay configuración guardada
    if (!cfg.scriptUrl) cfg.scriptUrl = 'https://script.google.com/macros/s/AKfycbw33D8d8xnnLxAE5sGy9CATEEmsTggdYp6ELTimPDykP6b0T-jYFdsLzfVP2lKo74qIMw/exec';
    return cfg;
  },
  setConfig(cfg) { this.set(this.KEY_CONFIG, cfg); },

  // ── APERTURAS ──
  getAperturas() { return this.get(this.KEY_APERTURAS) || []; },
  getAperturaForDate(dateStr) {
    return this.getAperturas().find(a => a.fecha === dateStr) || null;
  },
  saveApertura(apertura) {
    const list = this.getAperturas().filter(a => a.fecha !== apertura.fecha);
    list.push(apertura);
    this.set(this.KEY_APERTURAS, list);
  },

  // ── CIERRES STOCK ──
  getCierresStock() { return this.get(this.KEY_CIERRES_STOCK) || []; },
  saveCierreStock(cierre) {
    const list = this.getCierresStock().filter(c => c.fecha !== cierre.fecha);
    list.push(cierre);
    this.set(this.KEY_CIERRES_STOCK, list);
  },
};

// ── GOOGLE SHEETS SYNC ──
const Sheets = {
  async send(payload) {
    const cfg = DB.getConfig();
    if (!cfg.scriptUrl) return { ok: false, error: 'Sin URL de Apps Script configurada.' };
    try {
      const resp = await fetch(cfg.scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload),
      });
      const json = await resp.json();
      return { ok: true, data: json };
    } catch (e) {
      console.warn('Sheets sync error:', e.message);
      return { ok: false, error: e.message };
    }
  },

  async appendSale(sale) {
    return this.send({ action: 'appendSale', sale });
  },

  async syncProducts(products) {
    return this.send({ action: 'syncProducts', products });
  },

  async closeCaja(summary) {
    return this.send({ action: 'closeCaja', summary });
  },
  async appendApertura(apertura) {
    return this.send({ action: 'appendApertura', apertura });
  },
  async appendCierreStock(cierre) {
    return this.send({ action: 'appendCierreStock', cierre });
  },

  async test(url) {
    try {
      const resp = await fetch(url + '?test=1', { mode: 'no-cors' });
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }
};

// ── ANALYTICS HELPERS ──
const Analytics = {
  totalByField(sales, field) {
    const map = {};
    sales.forEach(s => {
      s.items.forEach(item => {
        const key = item[field] || 'Sin datos';
        map[key] = (map[key] || 0) + item.importe;
      });
    });
    return map;
  },

  totalByMedio(sales) {
    const map = {};
    sales.forEach(s => {
      map[s.medioPago] = (map[s.medioPago] || 0) + s.total;
    });
    return map;
  },

  ticketPromedio(sales) {
    if (!sales.length) return 0;
    return sales.reduce((acc, s) => acc + s.total, 0) / sales.length;
  },

  topProduct(sales) {
    const map = {};
    sales.forEach(s => {
      s.items.forEach(item => {
        map[item.nombre] = (map[item.nombre] || 0) + item.cantidad;
      });
    });
    const sorted = Object.entries(map).sort((a,b) => b[1]-a[1]);
    return sorted.length ? sorted[0][0] : '—';
  },

  topCategoria(sales) {
    const map = {};
    sales.forEach(s => {
      s.items.forEach(item => {
        map[item.categoria] = (map[item.categoria] || 0) + item.importe;
      });
    });
    const sorted = Object.entries(map).sort((a,b) => b[1]-a[1]);
    return sorted.length ? sorted[0][0] : '—';
  },

  topMedio(sales) {
    const m = this.totalByMedio(sales);
    const sorted = Object.entries(m).sort((a,b) => b[1]-a[1]);
    return sorted.length ? sorted[0][0] : '—';
  },

  // Calcula el consumo total de insumos dado un array de ventas
  calcularConsumo(sales) {
    const totales = { helado: 0, pote1kg: 0, pote05kg: 0, pote025kg: 0, cucurucho: 0, vasito: 0 };
    const productos = DB.getProducts();
    sales.forEach(s => {
      s.items.forEach(item => {
        const prod = productos.find(p => p.id === item.id);
        if (!prod || !prod.consumos) return;
        const c = prod.consumos;
        totales.helado     += (c.helado     || 0) * item.cantidad;
        totales.pote1kg    += (c.pote1kg    || 0) * item.cantidad;
        totales.pote05kg   += (c.pote05kg   || 0) * item.cantidad;
        totales.pote025kg  += (c.pote025kg  || 0) * item.cantidad;
        totales.cucurucho  += (c.cucurucho  || 0) * item.cantidad;
        totales.vasito     += (c.vasito     || 0) * item.cantidad;
      });
    });
    return totales;
  },

  salesByDay(sales, days = 30) {
    const map = {};
    const today = new Date();
    for (let i = days-1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      map[d.toISOString().split('T')[0]] = 0;
    }
    sales.forEach(s => {
      if (map.hasOwnProperty(s.fecha)) {
        map[s.fecha] += s.total;
      }
    });
    return map;
  }
};

// ── FORMAT ──
function fmt(n) {
  return '$' + Number(n).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function today() {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Argentina/Buenos_Aires' });
}

function nowTime() {
  return new Date().toLocaleTimeString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', hour: '2-digit', minute: '2-digit' });
}

function fmtDate(str) {
  if (!str) return '';
  const [y,m,d] = str.split('-');
  return `${d}/${m}/${y}`;
}
