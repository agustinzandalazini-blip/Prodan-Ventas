// ==========================================
// PRODAN · Gráficos (Chart.js)
// ==========================================

let chartCat   = null;
let chartPagos = null;
let chartLinea = null;

const COLORES = [
  '#2D6A4F', '#40916C', '#74C69D', '#B7E4C7',
  '#1B4332', '#52B788', '#95D5B2', '#D8F3DC',
];

function renderCharts(salesMes) {
  // Categorías (doughnut)
  const byCat = Analytics.totalByField(salesMes, 'categoria');
  const catLabels = Object.keys(byCat);
  const catData   = Object.values(byCat);

  if (chartCat) chartCat.destroy();
  const ctxCat = document.getElementById('chart-categorias');
  if (ctxCat) {
    chartCat = new Chart(ctxCat, {
      type: 'doughnut',
      data: {
        labels: catLabels,
        datasets: [{ data: catData, backgroundColor: COLORES, borderWidth: 2, borderColor: '#fff' }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'right', labels: { font: { family: 'Inter', size: 12 } } },
          tooltip: {
            callbacks: {
              label: ctx => ` ${ctx.label}: ${fmt(ctx.raw)}`
            }
          }
        }
      }
    });
  }

  // Medios de pago (bar)
  const byMedio = Analytics.totalByMedio(salesMes);
  const medLabels = Object.keys(byMedio);
  const medData   = Object.values(byMedio);

  if (chartPagos) chartPagos.destroy();
  const ctxPagos = document.getElementById('chart-pagos');
  if (ctxPagos) {
    chartPagos = new Chart(ctxPagos, {
      type: 'bar',
      data: {
        labels: medLabels,
        datasets: [{
          data: medData,
          backgroundColor: COLORES,
          borderRadius: 8,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: ctx => ` ${fmt(ctx.raw)}` } }
        },
        scales: {
          y: {
            grid: { color: '#f0f0f0' },
            ticks: {
              callback: v => '$' + (v/1000).toFixed(0) + 'k',
              font: { family: 'Inter', size: 11 }
            }
          },
          x: {
            grid: { display: false },
            ticks: { font: { family: 'Inter', size: 11 } }
          }
        }
      }
    });
  }

  // Línea: últimos 30 días
  const byDay = Analytics.salesByDay(DB.getSales(), 30);
  const dayLabels = Object.keys(byDay).map(d => {
    const [y,m,day] = d.split('-');
    return `${day}/${m}`;
  });
  const dayData = Object.values(byDay);

  if (chartLinea) chartLinea.destroy();
  const ctxLinea = document.getElementById('chart-linea');
  if (ctxLinea) {
    chartLinea = new Chart(ctxLinea, {
      type: 'line',
      data: {
        labels: dayLabels,
        datasets: [{
          data: dayData,
          borderColor: '#2D6A4F',
          backgroundColor: 'rgba(45,106,79,0.08)',
          borderWidth: 2.5,
          pointBackgroundColor: '#2D6A4F',
          pointRadius: 3,
          tension: 0.4,
          fill: true,
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: ctx => ` ${fmt(ctx.raw)}` } }
        },
        scales: {
          y: {
            grid: { color: '#f0f0f0' },
            ticks: { callback: v => '$' + (v/1000).toFixed(0) + 'k', font: { family: 'Inter', size: 11 } }
          },
          x: {
            grid: { display: false },
            ticks: { maxTicksLimit: 10, font: { family: 'Inter', size: 11 } }
          }
        }
      }
    });
  }
}
