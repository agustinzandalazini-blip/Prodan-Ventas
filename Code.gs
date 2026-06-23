// ==========================================
// PRODAN · Google Apps Script Backend
// Pegar este código en script.google.com
// ==========================================

const SHEET_ID = ''; // ← COMPLETAR con tu ID de Google Sheets

// ── ENTRY POINT ──
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    let result;

    switch (data.action) {
      case 'appendSale':      result = appendSale(data.sale);           break;
      case 'syncProducts':   result = syncProducts(data.products);     break;
      case 'closeCaja':      result = closeCaja(data.summary);         break;
      case 'appendApertura': result = appendApertura(data.apertura);   break;
      case 'appendCierreStock': result = appendCierreStock(data.cierre); break;
      default:               result = { error: 'Acción desconocida' };
    }

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, result }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, msg: 'Prodan API activa' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── SHEETS ──
function getOrCreateSheet(name, headers) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setBackground('#2D6A4F').setFontColor('#FFFFFF').setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// ── VENTAS ──
function appendSale(sale) {
  const sheet = getOrCreateSheet('Ventas', [
    'ID', 'Fecha', 'Hora', 'Producto', 'Categoría',
    'Cantidad', 'Precio Unit.', 'Importe', 'Medio de Pago', 'Observaciones'
  ]);

  sale.items.forEach(item => {
    sheet.appendRow([
      sale.id,
      sale.fecha,
      sale.hora,
      item.nombre,
      item.categoria,
      item.cantidad,
      item.precio,
      item.importe,
      sale.medioPago,
      sale.obs || ''
    ]);
  });

  updateDashboard();
  return { rows: sale.items.length };
}

// ── PRODUCTOS ──
function syncProducts(products) {
  const sheet = getOrCreateSheet('Productos', ['ID', 'Nombre', 'Categoría', 'Precio', 'Estado']);
  // Clear existing data (keep header)
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) sheet.deleteRows(2, lastRow - 1);

  products.forEach(p => {
    sheet.appendRow([p.id, p.nombre, p.categoria, p.precio, p.activo ? 'Activo' : 'Inactivo']);
  });

  return { count: products.length };
}

// ── CIERRE DE CAJA ──
function closeCaja(summary) {
  const sheet = getOrCreateSheet('Cierres de Caja', ['Fecha', 'Hora', 'Operaciones', 'Total', 'Detalles por Medio']);
  const detalle = Object.entries(summary.byMedio || {}).map(([k,v]) => `${k}: $${v}`).join(' | ');
  sheet.appendRow([summary.fecha, summary.hora, summary.totalOps, summary.total, detalle]);
  return { ok: true };
}

// ── DASHBOARD (hoja resumen) ──
function updateDashboard() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let dash = ss.getSheetByName('Dashboard');
  if (!dash) dash = ss.insertSheet('Dashboard');

  const ventas = ss.getSheetByName('Ventas');
  if (!ventas) return;

  const data = ventas.getDataRange().getValues();
  const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');

  let totalHoy = 0, opsHoy = 0;
  let totalMes = 0, opsMes = 0;
  const mes = today.substring(0, 7);

  // Map de IDs procesados para no doblar por items
  const idsHoy = new Set(), idsMes = new Set();

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const fecha  = row[1];
    const importe = parseFloat(row[7]) || 0;
    const id = row[0];
    const fechaStr = typeof fecha === 'string' ? fecha : Utilities.formatDate(fecha, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    const mesStr   = fechaStr.substring(0, 7);

    if (fechaStr === today && !idsHoy.has(id)) { totalHoy += importe; opsHoy++; idsHoy.add(id); }
    if (mesStr   === mes   && !idsMes.has(id)) { totalMes += importe; opsMes++; idsMes.add(id); }
  }

  dash.clearContents();
  dash.getRange('A1').setValue('DASHBOARD PRODAN').setFontSize(16).setFontWeight('bold').setFontColor('#2D6A4F');
  dash.getRange('A2').setValue('Actualizado: ' + new Date().toLocaleString());
  dash.getRange('A4').setValue('VENTAS HOY');   dash.getRange('B4').setValue(totalHoy);
  dash.getRange('A5').setValue('OPS HOY');       dash.getRange('B5').setValue(opsHoy);
  dash.getRange('A6').setValue('VENTAS MES');    dash.getRange('B6').setValue(totalMes);
  dash.getRange('A7').setValue('OPS MES');       dash.getRange('B7').setValue(opsMes);
}

// ── APERTURA DEL DÍA ──
function appendApertura(ap) {
  const sheet = getOrCreateSheet('Aperturas', [
    'Fecha','Hora','Helado (kg)','Potes 1kg','Potes 1/2kg','Potes 1/4kg','Cucuruchos','Vasitos'
  ]);
  // Reemplazar apertura existente del día si ya existe
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === ap.fecha) { sheet.deleteRow(i + 1); break; }
  }
  sheet.appendRow([ap.fecha, ap.hora, ap.helado, ap.pote1kg, ap.pote05kg, ap.pote025kg, ap.cucurucho, ap.vasito]);
  return { ok: true };
}

// ── CIERRE CON INVENTARIO FÍSICO ──
function appendCierreStock(cierre) {
  const sheet = getOrCreateSheet('Cierres Stock', [
    'Fecha','Hora','Ventas','Total $','Insumo','Inicial','Consumido','Esperado','Real','Diferencia'
  ]);
  // Eliminar cierres previos del mismo día
  const data = sheet.getDataRange().getValues();
  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][0] === cierre.fecha) sheet.deleteRow(i + 1);
  }
  const insumos = ['helado','pote1kg','pote05kg','pote025kg','cucurucho','vasito'];
  const labels  = ['Helado (kg)','Potes 1kg','Potes 1/2kg','Potes 1/4kg','Cucuruchos','Vasitos'];
  insumos.forEach((key, idx) => {
    const d = cierre.insumos[key] || {};
    sheet.appendRow([
      cierre.fecha, cierre.hora, cierre.ventas, cierre.totalVentas,
      labels[idx], d.inicial||0, d.consumido||0, d.esperado||0,
      d.real !== null ? d.real : '—', d.diferencia !== null ? d.diferencia : '—'
    ]);
  });
  return { ok: true };
}

// ── SETUP INICIAL (correr una vez) ──
function setupSheets() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  getOrCreateSheet('Ventas',          ['ID','Fecha','Hora','Producto','Categoría','Cantidad','Precio Unit.','Importe','Medio de Pago','Observaciones']);
  getOrCreateSheet('Productos',       ['ID','Nombre','Categoría','Precio','Estado']);
  getOrCreateSheet('Medios de Pago',  ['Nombre']);
  getOrCreateSheet('Cierres de Caja', ['Fecha','Hora','Operaciones','Total','Detalles por Medio']);
  getOrCreateSheet('Aperturas',       ['Fecha','Hora','Helado (kg)','Potes 1kg','Potes 1/2kg','Potes 1/4kg','Cucuruchos','Vasitos']);
  getOrCreateSheet('Cierres Stock',   ['Fecha','Hora','Ventas','Total $','Insumo','Inicial','Consumido','Esperado','Real','Diferencia']);
  getOrCreateSheet('Dashboard',       []);

  SpreadsheetApp.getUi().alert('✅ Hojas creadas correctamente en Prodan Ventas');
}
