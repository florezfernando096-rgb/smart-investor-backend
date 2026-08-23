# 📊 TheSmartInvestorTool Financial Dashboard & Scraper

Una aplicación web completa y modular construida con **FastAPI**, **BeautifulSoup4**, **Tailwind CSS** y **JavaScript Vanilla** para extraer estados financieros, balances, flujos de caja y métricas clave desde `https://thesmartinvestortool.com/metrics?symbol=<TICKER>` autenticándose mediante cookies de sesión de DevTools.

---

## 🚀 Características Principales

- **Gestor de Extracción y Scraping:**
  - `requests.Session` con headers completos de navegador real (`User-Agent`, `Referer`, `Sec-Ch-Ua`, etc.).
  - Inyección de cookies de sesión configurables desde `.env` o en tiempo de ejecución desde la propia UI.
  - Parser dual: compatible tanto con payload JSON (`__NEXT_DATA__`) como con extracción del DOM HTML mediante `BeautifulSoup4`.
  - Clasificación automática de:
    * 📊 **Estado de Resultados (Income Statement)**
    * ⚖️ **Balance General (Balance Sheet)**
    * 💰 **Flujo de Caja (Cash Flow)**
    * 📈 **Ratios Financieros y Rentabilidad**
    * 🏷️ **Tarjetas KPI y Métricas de Valuación (P/E, ROE, Margins, Market Cap)**
- **API REST Backend (FastAPI):**
  - `GET /api/financials?symbol={symbol}`: Devuelve los datos scrapeados y estructurados.
  - `GET /api/status`: Estado de las cookies y la sesión.
  - `POST /api/settings/cookies`: Actualiza las cookies en memoria y en `.env` sin reiniciar el servidor.
  - Manejo de excepciones: código `401 Unauthorized` cuando la cookie expira con mensaje claro.
- **Frontend Dashboard Interactivo:**
  - Tema oscuro profesional estilo terminal financiera (Bloomberg / TradingView).
  - Buscador con autocompletado y botones rápidos (`MSFT`, `AAPL`, `NVDA`, `GOOGL`, `AMZN`, `TSLA`, `DEMO`).
  - Tablas financieras dinámicas con primera columna fija (*sticky metric column*) y cabecera de períodos fija.
  - Filtro instantáneo de filas por texto (ej. "Revenue", "Debt", "EBITDA").
  - Exportación de datos a **Excel/CSV** y copia rápida del **JSON**.
  - Modal integrado para actualizar cookies con tutorial paso a paso.
  - Modo DEMO interactivo para pruebas instantáneas.

---

## 📁 Estructura del Proyecto

```
APPv2/
├── .env.example            # Plantilla de configuración de entorno
├── .env                    # Archivo de configuración local
├── requirements.txt        # Dependencias de Python
├── config.py               # Gestión de variables de entorno y cookies
├── scraper.py              # Motor de extracción con Session y parser de tablas
├── app.py                  # API FastAPI y servidor de la aplicación
├── test_app.py             # Suite de pruebas unitarias y de integración
├── static/
│   ├── css/
│   │   └── style.css       # Estilos personalizados y tablas fijas
│   └── js/
│       └── app.js          # Lógica frontend interactiva
└── templates/
    └── index.html          # Vista HTML con Tailwind CSS
```

---

## 🛠️ Instalación y Puesta en Marcha

### 1. Clonar o acceder a la carpeta del proyecto
```bash
cd APPv2
```

### 2. Crear y activar entorno virtual
```bash
python3 -m venv venv
source venv/bin/activate   # En Linux / macOS
# venv\Scripts\activate    # En Windows
```

### 3. Instalar dependencias
```bash
pip install -r requirements.txt
```

### 4. Configurar el archivo `.env`
Crea tu archivo `.env` a partir de `.env.example`:
```bash
cp .env.example .env
```

---

## 🔑 Cómo Extraer la Cookie de Sesión desde DevTools

1. Abre tu navegador y accede a [https://thesmartinvestortool.com](https://thesmartinvestortool.com).
2. Inicia sesión con tus credenciales de usuario.
3. Presiona <kbd>F12</kbd> o click derecho &rarr; **Inspeccionar**.
4. Ve a la pestaña **Network** (Red) y recarga la página (<kbd>Cmd + R</kbd> o <kbd>F5</kbd>).
5. Selecciona la primera petición a `thesmartinvestortool.com`.
6. En la pestaña lateral **Headers**, desplázate hasta **Request Headers** y busca la cabecera **Cookie:**.
7. Copia todo el valor de la cookie y pégalo en tu archivo `.env`:

```env
COOKIE_STRING="next-auth.session-token=eyJhbGciOi...; __Host-authjs.csrf-token=..."
```

*(También puedes pegarla directamente en la aplicación web haciendo click en el botón **"Configurar Cookies"** del encabezado).*

---

## ▶️ Ejecutar la Aplicación

Inicia el servidor local con `uvicorn`:

```bash
uvicorn app:app --reload --host 127.0.0.1 --port 8000
```

Abre tu navegador en:
👉 **[http://127.0.0.1:8000](http://127.0.0.1:8000)**

---

## 🧪 Ejecución de Pruebas

Para validar los endpoints, parser y manejadores de error:

```bash
pytest test_app.py -v
```
