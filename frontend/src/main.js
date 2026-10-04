import './style.css'

const API_BASE = 'http://localhost:8080/api';

const optionsContainer = document.getElementById('options-container');
const optionsList = document.getElementById('options-list')

//Elementos DOM (Data Object Model)
const searchForm = document.getElementById('search-form');
const queryInput = document.getElementById('query-input');
const submitBtn = document.getElementById('submit-btn');
const btnText = document.getElementById('btn-text');
const btnSpinner = document.getElementById('btn-spinner');
const errorCard = document.getElementById('error-card');
const errorText = document.getElementById('error-text');
const loadingState = document.getElementById('loading-state');
const resultContainer = document.getElementById('result-container');

//Elementos de la tarjeta de resultados
const resTicker = document.getElementById('res-ticker');
const resRisk = document.getElementById('res-risk');
const resRecommendation = document.getElementById('res-recommendation');
const resThesis = document.getElementById('res-thesis');
const resRiskList = document.getElementById('res-risks-list');
const resFairValue = document.getElementById('res-fairvalue');
const resFairValueBox = document.getElementById('res-fairvalue-box');
const resPrice = document.getElementById('res-price');

//Elementos de noticias
const resNews = document.getElementById('res-noticias');
const newsGrid = document.getElementById('news-grid');

//Elementos de market sentiment
const resTrends = document.getElementById('res-sentiment');
const trenContainer = document.getElementById('sentiment-list');

//Bandera 
let isViewingAnalysis = false;

//Chips de sugerencia
document.querySelectorAll('.quick-chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    queryInput.value = chip.textContent.trim();
    searchForm.dispatchEvent(new Event('submit'));
  });
});

async function showTrends(){
  let trends = [];
  try{
    const res = await fetch(`${API_BASE}/sentiment`);
    if(!res.ok) return;
    const data = await res.json();
    trends = data.trend_stocks;
  } catch{
    return;
  }

  if (!Array.isArray(trends) || trends.length === 0) return;

  trenContainer.innerHTML = ''

  trends.forEach((item) => {
    const lcard = document.createElement('div');
    lcard.className = 'grid grid-cols-12 gap-3 items-center px-5 py-3 hover:bg-slate-800/50 transition-colors cursor-pointer group';

    // Distintivo especial para el top 3
    let rankDisplay = `<span class="text-xs font-mono font-bold text-slate-500">#${item.rank}</span>`;
    if (item.rank === 1) {
      rankDisplay = `<span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold font-mono">1</span>`;
    } else if (item.rank === 2) {
      rankDisplay = `<span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-400/20 text-slate-200 border border-slate-400/40 text-xs font-bold font-mono">2</span>`;
    } else if (item.rank === 3) {
      rankDisplay = `<span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-700/20 text-amber-500 border border-amber-700/40 text-xs font-bold font-mono">3</span>`;
    }

    lcard.innerHTML = `
      <div class="col-span-2 sm:col-span-1 text-center">
        ${rankDisplay}
      </div>
      <div class="col-span-3 sm:col-span-2">
        <span class="inline-block px-2.5 py-1 text-xs font-bold font-mono rounded-lg bg-amber-950/60 text-amber-400 border border-amber-800/40 group-hover:border-amber-500/80 transition-colors">
          ${item.ticker}
        </span>
      </div>
      <div class="col-span-4 sm:col-span-6 min-w-0">
        <div class="text-sm font-semibold text-slate-200 truncate group-hover:text-amber-300 transition-colors" title="${item.name}">
          ${item.name}
        </div>
      </div>
      <div class="col-span-3 text-right">
        <span class="text-xs font-mono font-bold text-slate-200">${Number(item.mentions).toLocaleString()}</span>
        <span class="hidden sm:inline text-[11px] text-slate-500 ml-1">menciones</span>
      </div>
    `;

    // Al hacer clic en la fila, llena el buscador y analiza el ticker directamente
    lcard.addEventListener('click', () => {
      queryInput.value = item.ticker;
      searchForm.dispatchEvent(new Event('submit'));
    });

    trenContainer.appendChild(lcard);
  });

  if(!isViewingAnalysis){
    resTrends.classList.remove('hidden');
  }
}

async function showNews(){
  let noticias = [];
  try{
    const res = await fetch(`${API_BASE}/news`);
    if(!res.ok) return;
    const data = await res.json();
    noticias = data.recent_news;
  }
  catch{
    return;
  }

  if (!Array.isArray(noticias) || noticias.length === 0) return;

  newsGrid.innerHTML = '';

  noticias.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800/80 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between transition-all group';

    card.innerHTML = `
      <div class="space-y-2">
        <div class="flex items-center justify-between gap-2">
          <span class="text-xs font-bold px-2.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/40">
            ${item.ticker}
          </span>
        </div>
        <h4 class="text-sm font-bold text-slate-100 group-hover:text-emerald-400 transition-colors line-clamp-2">
          ${item.titulo}
        </h4>
        <p class="text-sm text-slate-400 leading-relaxed line-clamp-3">
          ${item.resumen}
        </p>
      </div>
      ${item.link ? `
        <div class="pt-3 mt-3 border-t border-slate-800/60">
          <a href="${item.link}" target="_blank" rel="noopener noreferrer" class="text-xs font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
            Leer noticia completa
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      ` : ''}
    `;

    newsGrid.appendChild(card);
  });

  if(!isViewingAnalysis){
    resNews.classList.remove('hidden');
  }
}
function setLoading(isLoading){
  submitBtn.disabled = isLoading;
  if (isLoading) {
    btnText.textContent = 'Procesando';
    btnSpinner.classList.remove('hidden');
    loadingState.classList.remove('hidden');
    resultContainer.classList.add('hidden');
    errorCard.classList.add('hidden');
  } else {
    btnText.textContent = 'Analizar';
    btnSpinner.classList.add('hidden');
    loadingState.classList.add('hidden');
  }
}

function showError(message){
  errorText.textContent = message;
  errorCard.classList.remove('hidden');
  resultContainer.classList.add('hidden');
}

function renderBadges(recommendation, risk){
  resRecommendation.className = 'inline-block text-xs font-black px-4 py-1.5 rounded-lg border tracking-wider shadow-sm mt-0.5';
  resRisk.className = 'inline-block text-xs font-bold px-3 py-1 rounded-md border mt-0.5';

  const recom = (recommendation || '').toUpperCase();
  if(recom.includes('COMPRA')){
    resRecommendation.classList.add('bg-emerald-950/80', 'text-emerald-400', 'border-emerald-500/40');
  }
  else if(recom.includes('VENTA')){
    resRecommendation.classList.add('bg-rose-950/80', 'text-rose-400', 'border-rose-500/40');
  } 
  else{
    resRecommendation.classList.add('bg-amber-950/80', 'text-amber-400', 'border-amber-500/40');
  }
  resRecommendation.textContent = recom || 'NEUTRAL';

  const rsk = (risk || '').toUpperCase();
  if(rsk.includes('BAJO')){
    resRisk.classList.add('bg-blue-950/60', 'text-blue-400', 'border-blue-500/30');
  }
  else if(rsk.includes('MEDIO')){
    resRisk.classList.add('bg-amber-950/60', 'text-amber-400', 'border-amber-500/30');
  }
  else{
    resRisk.classList.add('bg-rose-950/60', 'text-rose-400', 'border-rose-500/30')
  }
  resRisk.textContent = rsk || 'NO EVALUADO';
}

// Renderiza los resultados recibidos de Gemini
function mostrarResultado(payload) {
  const data = payload.data;

  console.log(payload);
  resPrice.textContent = payload.precio_actual;
  resTicker.textContent = payload.ticker;
  resThesis.textContent = data.tesis_inversion || 'No se generó tesis detallada.';
  renderBadges(data.recomendacion, data.nivel_riesgo);

  if (data.precio_razonable_estimado) {
    resFairValue.textContent = data.precio_razonable_estimado;
    resFairValueBox.classList.remove('hidden');
  } else {
    resFairValueBox.classList.add('hidden');
  }

  resRiskList.innerHTML = '';
  const riesgos = Array.isArray(data.principales_riesgos) ? data.principales_riesgos : [];

  if (riesgos.length === 0) {
    resRiskList.innerHTML = '<li class="text-slate-500">No se listaron riesgos específicos.</li>';
  } else {
    riesgos.forEach((riesgo) => {
      const li = document.createElement('li');
      li.className = 'flex items-start gap-2';
      li.innerHTML = `
        <span class="text-rose-500/80 mt-0.5">•</span>
        <span class="flex-1 leading-relaxed">${riesgo}</span>
      `;
      resRiskList.appendChild(li);
    });
  }

  resultContainer.classList.remove('hidden');
}

// Función para pintar los botones de opciones
function mostrarOpciones(opciones) {
  optionsList.innerHTML = '';
  opciones.forEach((item) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'w-full text-left p-3.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 rounded-xl flex items-center justify-between transition-all cursor-pointer group';
    btn.innerHTML = `
      <div>
        <div class="font-bold text-slate-200 group-hover:text-emerald-400 transition-colors">${item.name}</div>
        <div class="text-xs text-slate-500">Bolsa: ${item.exchange}</div>
      </div>
      <span class="text-sm px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-emerald-400 font-bold">
        ${item.symbol}
      </span>
    `;
    btn.onclick = () => {
      optionsContainer.classList.add('hidden');
      analizarTicker(item.symbol);
    };
    optionsList.appendChild(btn);
  });
  optionsContainer.classList.remove('hidden');
}

// Función que manda a analizar el ticker con Gemini
async function analizarTicker(ticker) {
  setLoading(true);
  errorCard.classList.add('hidden');

  try {
    const response = await fetch(`${API_BASE}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticker }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.detail || 'Error al analizar el activo');
    }

    const payload = await response.json();
    mostrarResultado(payload);
  } catch (err) {
    showError(err.message);
  } finally {
    setLoading(false);
  }
}

// Envío del formulario
searchForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  isViewingAnalysis = true;
  const query = queryInput.value.trim();

  if (!query) return;

  optionsContainer.classList.add('hidden');
  resultContainer.classList.add('hidden');
  errorCard.classList.add('hidden');
  resNews.classList.add('hidden');
  resTrends.classList.add('hidden');
  setLoading(true);

  try {
    const response = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.detail || 'No se encontraron empresas con ese nombre');
    }

    const { results } = await response.json();

    if (!results || results.length === 0) {
      throw new Error('No se encontraron empresas con ese nombre');
    }

    if (results.length === 1) {
      analizarTicker(results[0].symbol);
      return;
    }

    mostrarOpciones(results);
  } catch (err) {
    showError(err.message);
  } finally {
    setLoading(false);
  }
});

showNews();
setInterval(showNews, 3600000);
showTrends();
setInterval(showTrends, 300000);