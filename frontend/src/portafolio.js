import Chart from 'chart.js/auto';
import './style.css'

const API_BASE = 'http://localhost:8080/api';

//Elementos DOM (Data Object Model)
const inputTicker = document.getElementById('asset-ticker');
const inputAmount = document.getElementById('asset-amount');
const assetCount = document.getElementById('portfolio-count');
const totalAmount = document.getElementById('portfolio-total');
const registerForm = document.getElementById('add-asset-form');
const chart = document.getElementById('portfolio-chart');
const emptyChartState = document.getElementById('chart-empty-state');
const assetList = document.getElementById('assets-list');
const emptyOutBtn = document.getElementById('clear-portfolio-btn');
const auditBtn = document.getElementById('btn-analyze-portfolio');
const auditBtnText = document.getElementById('btn-analyze-text');
const loadingAudit = document.getElementById('portfolio-spinner');
const portfolioAnalysisContainer = document.getElementById('portfolio-analysis-container');
const riskLvl = document.getElementById('analysis-risk-level');
const summaryText = document.getElementById('analysis-summary');
const strenghts = document.getElementById('analysis-strengths');
const risks = document.getElementById('analysis-weaknesses');
const rebalance = document.getElementById('analysis-rebalance');

// mapa para seccion de activos en cartera
let mapTickersAndPrices = new Map();

//
let myChart = null;
let savedAssets = [];
let cache = null;

function add_assets(){
  const ticker = inputTicker.value.trim().toUpperCase()
  if(mapTickersAndPrices.has(ticker)){
    const price = mapTickersAndPrices.get(ticker);
    mapTickersAndPrices.set(ticker, price + parseFloat(inputAmount.value));
  }
  else{
    mapTickersAndPrices.set(ticker, parseFloat(inputAmount.value));
  }

    renderAssetTable(mapTickersAndPrices);

    //guardar activos en el localStorage
    cache = Array.from(mapTickersAndPrices.entries())
    localStorage.setItem('user_myAssets', JSON.stringify(cache));
    //fin de guardado de activos
    
    displayChart();
}

function clear_portfolio(){
    assetCount.textContent = '0 activos';
    totalAmount.textContent = '$0.00';
    assetList.innerHTML = `
        <div id="assets-empty-state" class="text-center py-12 text-slate-600 text-xs">
              Sin activos registrados aún.
        </div>
    `
    mapTickersAndPrices.clear();
    if(myChart){myChart.destroy(); myChart = null;}
    emptyChartState.classList.remove('hidden');
    if (portfolioAnalysisContainer) portfolioAnalysisContainer.classList.add('hidden');
    localStorage.removeItem('user_myAssets');
}

async function displayChart(){
    if(myChart){
        myChart.destroy();
    }

  myChart = new Chart(
    chart,
    {
      type: 'doughnut',
      data: {
        labels: Array.from(mapTickersAndPrices.keys()),
        datasets: [
          {
            label: 'Inversión',
            data: Array.from(mapTickersAndPrices.values()),
            backgroundColor: [
              '#10b981', // Emerald
              '#06b6d4', // Cyan
              '#f59e0b', // Amber
              '#8b5cf6', // Violet
              '#14b8a6', // Teal
              '#38bdf8', // Sky
              '#6366f1', // Indigo
              '#f43f5e', // Rose
              '#d946ef', // Fuchsia
              '#84cc16'  // Lime
            ],
            borderColor: '#0f172a', // Borde oscuro que separa cada porción
            borderWidth: 3,
            hoverOffset: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%', // Dona moderna y delgada
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#94a3b8', // slate-400
              font: {
                family: 'Outfit, sans-serif',
                size: 11,
                weight: '600'
              },
              usePointStyle: true,
              pointStyle: 'circle',
              padding: 15
            }
          },
          tooltip: {
            backgroundColor: '#0f172a',
            titleColor: '#f8fafc',
            bodyColor: '#cbd5e1',
            borderColor: '#334155',
            borderWidth: 1,
            padding: 10,
            boxPadding: 4,
            usePointStyle: true,
            callbacks: {
              label: function(context){
                    const value = context.raw || 0;
                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                    const percentage = total > 0 ? ((value/total)*100).toFixed(1) : 0;
                    return `${percentage}%`;
                }
            }
          }
        }
      }
    }
  );
  emptyChartState.classList.add('hidden');
};

//Datos de assets guardados
savedAssets = JSON.parse(localStorage.getItem('user_myAssets'));
mapTickersAndPrices = new Map(savedAssets);

function displaySaved(saved){
  let cleanNumValue = parseFloat(inputAmount.value);
  if( cleanNumValue != null){
    
    renderAssetTable(saved);

    displayChart();
  }
}

function setLoading(isLoading) {
  if (auditBtn) auditBtn.disabled = isLoading;
  if (isLoading) {
    if (auditBtnText) auditBtnText.textContent = 'Auditando con Gemini...';
    if (loadingAudit) loadingAudit.classList.remove('hidden');
    if (portfolioAnalysisContainer) portfolioAnalysisContainer.classList.add('hidden');
  } else {
    if (auditBtnText) auditBtnText.textContent = 'Analizar Portafolio';
    if (loadingAudit) loadingAudit.classList.add('hidden');
  }
}

function mostrarResultados(audit) {
  if (!audit) return;

  // 1. Nivel de Riesgo con colores dinámicos
  const nivel = (audit.perfil_riesgo || 'MODERADO').toUpperCase();
  riskLvl.textContent = nivel;

  if (nivel.includes('CONSERVADOR')) {
    riskLvl.className = 'text-xl font-bold mt-0.5 text-emerald-400';
  } else if (nivel.includes('MODERADO')) {
    riskLvl.className = 'text-xl font-bold mt-0.5 text-cyan-400';
  } else if (nivel.includes('AGRESIVO')) {
    riskLvl.className = 'text-xl font-bold mt-0.5 text-amber-400';
  } else {
    riskLvl.className = 'text-xl font-bold mt-0.5 text-rose-400';
  }

  // 2. Resumen ejecutivo
  summaryText.textContent = audit.resumen || 'Sin resumen disponible.';

  // 3. Fortalezas (Lo Bueno)
  strenghts.innerHTML = '';
  (audit.fortalezas || []).forEach(item => {
    const li = document.createElement('li');
    li.textContent = item;
    strenghts.appendChild(li);
  });

  // 4. Riesgos & Vulnerabilidades (Lo Malo)
  risks.innerHTML = '';
  (audit.riesgos || []).forEach(item => {
    const li = document.createElement('li');
    li.textContent = item;
    risks.appendChild(li);
  });

  // 5. Recomendación de Rebalanceo
  rebalance.textContent = audit.rebalance || 'Sin sugerencias de rebalanceo.';

  // 6. Mostrar el panel de análisis
  portfolioAnalysisContainer.classList.remove('hidden');
  portfolioAnalysisContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

async function analyzePortfolio(map){
  if (!map || map.size === 0) {
      alert('Por favor agrega al menos un activo antes de auditar tu portafolio.');
      return;
  }

  setLoading(true);
  try{
      const res = await fetch(`${API_BASE}/audit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ holdings: Object.fromEntries(map) }),
      });

      if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || 'Error al analizar el portafolio');
      }

      const { audit } = await res.json();
      mostrarResultados(audit);
  } catch (err) {
      alert(err.message || 'Error al procesar la auditoría con Gemini.');
  } finally {
      setLoading(false);
  }
} 

function erase_asset(assetToErase){

  mapTickersAndPrices.delete(assetToErase);
  if(mapTickersAndPrices.size == 0){
    clear_portfolio();
    return;
  }

  renderAssetTable(mapTickersAndPrices);

  //guardar activos en el localStorage
  cache = Array.from(mapTickersAndPrices.entries());
  localStorage.setItem('user_myAssets', JSON.stringify(cache));
  //fin de guardado de activos

  displayChart();
}

function renderAssetTable(assetMap){
  let total = 0;
  let counter = 0;

  assetList.innerHTML = '';
  assetMap.forEach((price, ticker) => { //Invertimos price y for each ya que el callback en un map.foreach pasa primero el valor y luego la clave
    const card = document.createElement('div');
    card.className = 'flex items-center justify-between p-3 bg-slate-900/90 hover:bg-slate-800/80 border border-slate-800/90 hover:border-slate-700/80 rounded-xl transition-all group shadow-sm';
    card.innerHTML = `
      <div class="flex items-center gap-2.5">
        <span class="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 group-hover:border-emerald-500/60 transition-colors">
          ${ticker}
        </span>
      </div>
      <div class="flex items-center gap-3">
        <span class="text-sm font-bold text-slate-100">
          $${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
        <button
          type="button"
          class="delete-asset-btn text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-950/30 transition-colors cursor-pointer"
          title="Eliminar ${ticker}"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    `;

    const deleteBtn = card.querySelector('.delete-asset-btn');
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      erase_asset(ticker);
    });

    assetList.appendChild(card);
    total += price;
    counter += 1;
  });

  assetCount.textContent = `${counter} activos`
  totalAmount.textContent = `$${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    add_assets();
    registerForm.reset();
})

emptyOutBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    clear_portfolio();
})

auditBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    analyzePortfolio(mapTickersAndPrices);
})


if(savedAssets != null){
    displaySaved(mapTickersAndPrices);
}



