# pyrefly: ignore [missing-import]
from fastapi import FastAPI, HTTPException
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from analyzer import analyze_stock, search_companies, get_news, show_market_sentiment, analyze_portfolio, WATCHLIST, cached

#uvicorn api:app --reload --port 8080
app = FastAPI(title = "SENTINEL STOCK API")

app.add_middleware(
    CORSMiddleware,
    allow_origins = ["http://localhost:5173"],
    allow_credentials = True,
    allow_methods = ["*"],
    allow_headers = ["*"]
)

class AnalyzeRequest(BaseModel):
    ticker: str

class PortfolioAuditRequest(BaseModel):
    holdings: dict[str, float]

@app.get("/api/search")
def search_endpoint(q: str):
    results = search_companies(q)
    if not results:
        raise HTTPException(status_code = 404, detail = "No se encontraron coincidencias")
    return {"results": results}

@app.post("/api/analyze")
def handle_analyze(req: AnalyzeRequest):
    try:
        resultado = analyze_stock(req.ticker)
        return {"ticker": req.ticker, "precio_actual": resultado["stock_data"].get("precio_actual") ,"data": resultado["analysis"]}
    except Exception as e:
        raise HTTPException(status_code = 500, detail = str(e))
    
@app.get("/api/news")
def news_endpoint():
    try:
        resultado = cached("news", 3600, get_news)
    except Exception:
        raise HTTPException(status_code=502, detail="No se pudieron obtener las noticias")
    return {"tickers": list(WATCHLIST), "recent_news": resultado["noticia_reciente"]}
    
@app.get("/api/sentiment")
def trending_stocks():
    try:
        result = cached("sentiment", 300, show_market_sentiment)
    except Exception:
        raise HTTPException(status_code=502, detail="No se pudo obtener el sentimiento de mercado")
    return {"trend_stocks": result}

@app.post("/api/audit")
def handle_audit(req: PortfolioAuditRequest):
    try:
        resultado = analyze_portfolio(req.holdings)
        return resultado
    except Exception as e:
        raise HTTPException(status_code = 500, detail = str(e))
