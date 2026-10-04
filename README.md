# 🛡️ PROJECT SENTINEL

**SENTINEL** es una plataforma de análisis bursátil asistida por inteligencia artificial. Combina datos de mercado en tiempo real con el modelo **Gemini** de Google para generar análisis de acciones, sentimiento de mercado, noticias relevantes y auditorías de portafolio.

> ⚠️ SENTINEL es un proyecto educativo. Nada de lo que genera constituye asesoría financiera.

## ✨ Características

- 🔎 **Búsqueda de empresas** por nombre o ticker.
- 📈 **Análisis de acciones** con IA a partir de datos de mercado (precio actual, fundamentales, etc.).
- 📰 **Noticias recientes** de una lista de seguimiento (watchlist), con caché de 1 hora.
- 🌡️ **Sentimiento de mercado** y acciones en tendencia, con caché de 5 minutos.
- 💼 **Auditoría de portafolio**: evalúa la composición de tus inversiones.
- 🖥️ **Interfaz web** con gráficas interactivas (Chart.js).

## 🧱 Stack tecnológico

| Capa | Tecnologías |
|------|-------------|
| Backend | Python, FastAPI, Uvicorn, Pydantic |
| Datos | yfinance |
| IA | Google Gemini (`google-genai`) |
| Frontend | Vite, JavaScript, Tailwind CSS, Chart.js |

## 📁 Estructura

```
SENTINEL/
├── api.py          # API REST (FastAPI)
├── analyzer.py     # Lógica de análisis, noticias, sentimiento y portafolio
├── frontend/       # Interfaz web (Vite)
├── .env.example    # Plantilla de variables de entorno
└── .gitignore
```

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/AlexVR0/PROJECT-SENTINEL.git
cd PROJECT-SENTINEL
```

### 2. Configurar la clave de API

Copia `.env.example` a `.env` y coloca tu clave de [Google AI Studio](https://aistudio.google.com/):

```
GEMINI_API_KEY=tu_clave_de_gemini_aqui
```

El archivo `.env` está en `.gitignore` y nunca se sube al repositorio.

### 3. Backend

```bash
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux / macOS
pip install fastapi uvicorn yfinance google-genai python-dotenv requests
uvicorn api:app --reload --port 8080
```

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
```

La interfaz queda disponible en `http://localhost:5173` y la API en `http://localhost:8080`.

## 🔌 Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/search?q=` | Busca empresas |
| POST | `/api/analyze` | Analiza una acción (`{"ticker": "AAPL"}`) |
| GET | `/api/news` | Noticias recientes de la watchlist |
| GET | `/api/sentiment` | Sentimiento de mercado |
| POST | `/api/audit` | Audita un portafolio (`{"holdings": {"AAPL": 10}}`) |

## 👤 Autor

Desarrollado por [AlexVR0](https://github.com/AlexVR0).
