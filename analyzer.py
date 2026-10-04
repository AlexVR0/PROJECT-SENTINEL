import os
import json
#pyrefly: ignore [missing-import]
import yfinance as yf
from google import genai 
from google.genai import types
from dotenv import load_dotenv
import requests 
import time

load_dotenv()

def show_market_sentiment():
    list_trend_stocks = []

    ape_wisdom_url = "https://apewisdom.io/api/v1.0/filter/all-stocks"

    response = requests.get(ape_wisdom_url, timeout= 10)
    response.raise_for_status()

    result = response.json()

    trending_stocks = result.get("results")
    for item in trending_stocks[:50]:
        list_trend_stocks.append({
            "rank": item.get("rank"),
            "name": item.get("name"),
            "ticker": item.get("ticker"),
            "mentions": item.get("mentions")
        })

    return list_trend_stocks


def search_companies(query: str) -> list[dict]:
    search = yf.Search(query, max_results = 5)
    res = search.quotes

    listStocks = []
    for item in res:
        listStocks.append({
            "name": item.get("shortname") or item.get("longname", "Sin nombre"),
            "symbol": item.get("symbol"),
            "exchange": item.get("exchange", "N/A")
        })
    return listStocks

#Creacion de watchlist de tickers de los que se obtienen noticias
WATCHLIST = ("GOOGL", "VOO", "SMH", "V", "VST")
_cache = {}

def cached(key, ttl, fn):
    entry = _cache.get(key)
    if entry and time.time() - entry["time"] < ttl:
        return entry["data"]
    try:
        data = fn()
    except Exception:
        if entry:
            return entry["data"]
        raise
    _cache[key] = {"time": time.time(), "data": data}
    return data

def get_news(tickers: tuple[str, ...] | None = None):
    tickers = tickers or WATCHLIST
    lst_news = []

    for ticker in tickers:
        try:
            search = yf.Search(ticker, news_count=8)
            news_items = search.news
        except Exception:
            news_items = []
            
        noticia_encontrada = None
        for item in news_items:
            if ticker in item.get("title", ""):
                noticia_encontrada = item
                break
        if not noticia_encontrada:
            for item in news_items:
                rel = item.get("relatedTickers", [])
                if ticker in rel or (ticker == "GOOGL" and "GOOG" in rel):
                    noticia_encontrada = item
                    break

        if noticia_encontrada:
            lst_news.append({
                "ticker": ticker,
                "titulo": noticia_encontrada.get("title", "N/A"),
                "resumen": noticia_encontrada.get("summary") or noticia_encontrada.get("publisher", "Yahoo Finance"),
                "link": noticia_encontrada.get("link")
            })
        else:
            lst_news.append({
                "ticker": ticker,
                "titulo": "N/A",
                "resumen": "No hay noticia reciente que mostrar",
                "link": None
            })

    return {"noticia_reciente": lst_news}

def get_stock_data(ticker: str) -> dict:
    stock = yf.Ticker(ticker)
    info = stock.info

    if(info.get("quoteType") == "ETF"):
        return {
            "empresa": info.get("shortName"),
            "ticker": ticker,
            "precio_actual": (
                info.get("regularMarketPrice")
                or info.get("previousClose")
                or info.get("navPrice")
            ),
            "trailing_pe": info.get("trailingPE"),
            "dividendo": info.get("trailingAnnualDividendYield") or info.get("dividendYield"),
            "comision_anual_expense_ratio": info.get("annualReportExpenseRatio") or info.get("expenseRatio"),
            "activos_totales": info.get("totalAssets"),
            "beta_volatilidad": info.get("beta"),
            "maximo_52_semanas": info.get("fiftyTwoWeekHigh"),
            "resumen_negocio": info.get("longBusinessSummary", "") [:300]
        }

    return{
        "empresa": info.get("shortName"),
        "ticker": ticker,
        "precio_actual": info.get("currentPrice"),
        "trailing_pe": info.get("trailingPE"),
        "forward_pe": info.get("forwardPE"),
        "margen_operativo": info.get("operatingMargins"),
        "crecimiento_ingresos": info.get("revenueGrowth"),
        "deuda_equity": info.get("debtToEquity"),
        "precio_objetivo_consenso": info.get("targetMeanPrice"),
        "flujo_caja_libre": info.get('freeCashFlow'),
        "relacion_peg": info.get('pegRatio'),
        "retorno_capital": info.get('returnOnEquity'),
        "multiplo_operativo": info.get('enterpriseToEbitda'),
        "dividendo": info.get("dividendYield"),
        "cobertura": info.get('payoutRatio'),
        "tendencia": info.get('fiftyTwoWeekHigh'),
        "resumen_negocio": info.get("longBusinessSummary", "") [:300]
    }

def analyze_stock(ticker: str):

    data = get_stock_data(ticker)
    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

    prompt = f""" 
    Actúa como un Analista Senior de Renta Variable y Estratega de Inversión especializado en estrategias "Growth at a Reasonable Price" (GARP) y crecimiento compuesto patrimonial a largo plazo (horizonte secular de 10 a 20 años).

    El enfoque de riesgo es Agresivo orientado a Calidad (Quality Growth): descarta sesgos ultraconservadores de dividendo puro o renta fija, pero rechaza categóricamente la especulación sin flujos de caja. Buscamos crecimiento superior al mercado respaldado por ventajas competitivas duraderas, alto retorno sobre capital reinvertido (ROIC) y catalizadores a mediano plazo (3 a 5 años).

    Tu objetivo es elaborar una tesis de inversión exhaustiva, crítica e imparcial sobre {data.get('empresa', ticker)} ({ticker}).

    Estructura la tesis en las siguientes secciones obligatorias:

    **1. Resumen Ejecutivo y Tesis Central**
    * **Pitch en una frase:** Qué hace a este activo un ganador asimétrico en el horizonte de 10 a 20 años.
    * **Vector de crecimiento:** Cuál es la tendencia secular que capitaliza (ej. digitalización, semiconductores, monetización de infraestructura, cambio demográfico).
    * **Perfil de riesgo/retorno:** Calificación cualitativa (Moderado-Agresivo) y tasa de retorno esperada anualizada (CAGR objetivo vs. S&P 500).

    **2. Foso Económico y Modelo de Negocio (Moat Analysis)**
    * **Fuentes del Foso (Moat):** Identifica y califica su ventaja competitiva: efecto red, switching costs, ventajas de costo o activos intangibles.
    * **Poder de fijación de precios (Pricing Power):** ¿Puede trasladar inflación a clientes sin perder cuota de mercado? Justifica con ejemplos operativos.
    * **Monetización y escalabilidad:** Calidad de los ingresos (recurrentes vs. cíclicos) y apalancamiento operativo.

    **3. Calidad Financiera y Eficiencia de Capital**
    * **Retorno sobre el Capital (ROIC / ROCE):** Evalúa si genera retornos por encima de su costo de capital (WACC).
    * **Generación de Caja:** Conversión de EBITDA a Flujo de Caja Libre (FCF) y márgenes operativos.
    * **Salud del Balance:** Ratio Deuda Neta/EBITDA, estructura de vencimientos y cobertura de intereses.
    * **Asignación de Capital:** Historial del equipo directivo en recompras de acciones inteligentes, reinversión en I+D y adquisiciones.

    **4. Valoración Cuantitativa y Modelado de Escenarios**
    Evalúa múltiplos actuales (P/E, PEG, EV/FCF o EV/Sales) frente a su promedio histórico de 5 años y frente a sus competidores directos:
    * **Escenario Alcista (Bull Case):** Métricas operativas extraordinarias + expansión de múltiplos. Rendimiento esperado.
    * **Escenario Base (Base Case):** Crecimiento alineado a consensos realistas de analistas. Margen de seguridad implícito.
    * **Escenario Bajista (Bear Case):** Contracción de múltiplos y desaceleración. Precio piso de soporte fundamental.

    **5. Antítesis: ¿Qué rompería esta tesis? (Kill Criteria)**
    * Enumera los 3 riesgos fundamentales no mitigables (disrupción tecnológica, concentración de clientes, riesgo regulatorio o compresión de márgenes).
    * Define 2 "Kill Criteria" concretos: métricas exactas o eventos que, de ocurrir, obligarían a liquidar la posición de inmediato.

    **6. Plan Táctico de Construcción de Posición**
    * Distribución de compras (estrategia Dollar-Cost Averaging adaptativa).
    * Zonas de sobreextensión (dónde pausar compras) y zonas de descuento fundamental (dónde incrementar asignación).

    ---
    **Instrucciones de formato y tono:**
    - Sintetiza de forma directa, analítica y sin rodeos los puntos evaluados dentro del campo 'tesis_inversion'
    - Los 'principales_riesgos' deben incluir los factores más críticos y los 'Kill Criteria' definidos.
    - Prioriza datos duros, márgenes y ratios concretos sobre descripciones genéricas.
    - Elimina introducciones de cortesía o conclusiones vacías.
    - Si faltan datos numéricos recientes, aclara el supuesto base utilizado.
    {json.dumps(data, indent=2)}
    """

    schema = {
        "type": "OBJECT",
        "properties": {
            "recomendacion": {"type": "STRING", "enum": ["COMPRA", "MANTENER", "VENTA"]},
            "nivel_riesgo": {"type": "STRING", "enum": ["BAJO", "MEDIO", "ALTO", "ESPECULATIVO"]},
            "tesis_inversion": {"type": "STRING"},
            "principales_riesgos": {"type": "ARRAY", "items": {"type": "STRING"}},
            "precio_razonable_estimado": {"type": "STRING"},
        },
        "required": ["recomendacion", "nivel_riesgo", "tesis_inversion", "principales_riesgos"]
    }

    answer = client.models.generate_content(
        model = "gemini-3.5-flash-lite",
        contents = prompt,
        config = types.GenerateContentConfig(
            temperature = 0.1,
            response_mime_type = "application/json",
            response_schema = schema,
            automatic_function_calling = types.AutomaticFunctionCallingConfig(disable=True)
        )
    )

    if not answer.text:
        raise ValueError("No se encontro respuesta del modelo.")
    return {"analysis": json.loads(answer.text), "stock_data": data}

def analyze_portfolio(holdings: dict[str, float]):
    total_portfolio = sum(holdings.values())
    if not holdings or total_portfolio == 0:
        raise ValueError("No se pudo analizar el portafolio ya que no hay activos cargados")

    percentages = {}
    for asset in holdings:
        individual_prcntg = (holdings[asset] / total_portfolio) * 100
        percentages[asset] = round(individual_prcntg, 2)
    
    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

    prompt = f"""
    Actúa como un Director Senior de Asignación de Activos (Asset Allocation Strategist) y Gestor Patrimonial de Wall Street.

    Tu misión es realizar una auditoría implacable, cuantitativa y estratégica del siguiente portafolio de inversión, cuyos activos y ponderaciones porcentuales son:

    {json.dumps(percentages, indent=2)}

    PAUTAS DE ANÁLISIS:
    1. Perfil de Riesgo:
       - Clasifica la cartera de manera rigurosa en CONSERVADOR, MODERADO, AGRESIVO o ESPECULATIVO según su volatilidad esperada, peso de acciones individuales vs ETFs indexados y grado de concentración.

    2. Resumen Ejecutivo:
       - Sintetiza en un párrafo conciso y directo la estructura global de la cartera: su sesgo temático (ej. hipercentrada en megacaps tecnológicas, balanceada de mercado amplio, etc.), horizonte de inversión óptimo y tolerancia requerida a la volatilidad.

    3. Fortalezas (Lo Bueno):
       - Entrega de 2 a 4 fortalezas estructurales concretas: ventajas de los activos elegidos, eficiencia de costos, exposición a motores de crecimiento secular o resiliencia de flujos de caja.

    4. Riesgos y Vulnerabilidades (Lo Malo):
       - Entrega de 2 a 4 riesgos críticos sin rodeos: sobreconcentración (si un activo o sector excede el 25-30%), redundancia/solapamiento (ej. solapar ETFs como VOO con sus principales componentes individuales), falta de cobertura o vulnerabilidad macroeconómica.

    5. Estrategia de Asignación y Rebalanceo Inteligente:
        - Principio de Rebalanceo Pasivo: El portafolio opera bajo acumulación patrimonial orientada a crecimiento y calidad (Quality Growth). Prohíbe terminantemente sugerir ventas de posiciones con fundamentales intactos o la inclusión forzada de renta fija/bonos para reducir volatilidad a corto plazo. La optimización del portafolio se ejecuta exclusivamente mediante el flujo de nuevas aportaciones de capital.

        - Taxonomía Dinámica de Activos en Cartera:
        Clasifica los activos presentes en el portafolio en sus categorías funcionales sin depender de nombres fijos:
            * [Categoría 1 - Núcleo Indexado]: ETFs indexados de mercado amplio o globales.
            * [Categoría 2 - Calidad y Crecimiento]: Megacaps individuales con foso duradero, márgenes operativos elevados (>25%), alta rentabilidad sobre capital (ROIC) y balances sólidos con caja neta o deuda controlada.
            * [Categoría 3 - Satélites Seculares]: ETFs sectoriales o temáticos de alta beta apalancados a tendencias estructurales.
            * [Categoría 4 - Micro-Satélites Tácticos o Cíclicos]: Acciones individuales cíclicas (energía desregulada, materias primas, industriales) o negocios de alta sensibilidad regulatoria. Prohibido clasificarlas como "defensivas".

        - Plan Táctico de Despliegue de Capital (Distribución del 100% de la nueva aportación):
            * Estado del Portafolio: Si las posiciones mantienen sus catalizadores vigentes y no hay rupturas de reglas, declara explícitamente que NO se requiere rebalanceo correctivo ni ventas, y entrega la distribución recomendada para la siguiente aportación:
            1. Base del Núcleo [Cat. 1]: Asigna entre el 40% y el 50% de la aportación para consolidar la base patrimonial.
            2. Calidad / Crecimiento [Cat. 2]: Asigna entre el 30% y el 40%, priorizando los activos presentes que coticen a múltiplos más atractivos o presenten mayor descuento fundamental relativo.
            3. Satélites [Cat. 3 y Cat. 4]: Asigna el remanente (10% a 20% combinado) entre los satélites en cartera.
            * Reglas de Control de Riesgo y Techos:
            - Límite Táctico: Ningún activo clasificado en [Cat. 4] debe recibir más del 10% al 15% de la aportación entrante, ni proyectar un peso mayor al 7% del total de la cartera.
            - Regla de Pausa por Sobreponderación: Si un activo satélite individual o un sector específico supera el 25% del valor total actual del portafolio, asigna 0% de la nueva aportación a dicho activo y redirige ese porcentaje directamente al Núcleo [Cat. 1].
    """
    schema = {
        "type": "OBJECT",
        "properties": {
            "perfil_riesgo": {"type": "STRING", "enum":["CONSERVADOR", "MODERADO", "AGRESIVO", "ESPECULATIVO"]},
            "resumen": {"type": "STRING"},
            "fortalezas": {"type": "ARRAY", "items": {"type": "STRING"}},
            "riesgos": {"type": "ARRAY", "items": {"type": "STRING"}},
            "rebalance": {"type": "STRING"}
        },
        "required": ["perfil_riesgo", "resumen", "fortalezas", "riesgos", "rebalance"]
    }

    answer = client.models.generate_content(
        model="gemini-3.5-flash-lite",
        contents=prompt,
        config=types.GenerateContentConfig(
            temperature=0.1,
            response_mime_type="application/json",
            response_schema=schema,
            automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True)
        )
    )

    if not answer.text:
        raise ValueError("No se obtuvo respuesta del modelo al auditar el portafolio.")

    return {"audit": json.loads(answer.text)}