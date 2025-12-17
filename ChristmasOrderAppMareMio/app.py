import streamlit as st
import pandas as pd
from collections import defaultdict
from io import BytesIO
from pathlib import Path
from streamlit_option_menu import option_menu

# ═══════════════════════════════════════════════════════════════════════════════
# CONFIGURAZIONE
# ═══════════════════════════════════════════════════════════════════════════════

st.set_page_config(
    page_title="MARE MIO · Ordini Natale 2025",
    page_icon="🎄",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ═══════════════════════════════════════════════════════════════════════════════
# SWISS DESIGN SYSTEM - CSS
# ═══════════════════════════════════════════════════════════════════════════════

SWISS_CSS = """
<style>
    /* ─────────────────────────────────────────────────────────────────────────
       FONT IMPORT - Inter (Swiss-style sans-serif)
       ───────────────────────────────────────────────────────────────────────── */
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
    
    /* ─────────────────────────────────────────────────────────────────────────
       CSS VARIABLES - Design Tokens with PHI Spacing
       ───────────────────────────────────────────────────────────────────────── */
    :root {
        --font-primary: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        
        /* Colors - Minimal palette with Christmas red accent */
        --color-black: #0A0A0A;
        --color-white: #FFFFFF;
        --color-gray-50: #FAFAFA;
        --color-gray-100: #F5F5F5;
        --color-gray-200: #E5E5E5;
        --color-gray-300: #D4D4D4;
        --color-gray-400: #A3A3A3;
        --color-gray-500: #737373;
        --color-gray-600: #525252;
        --color-gray-700: #404040;
        --color-gray-800: #262626;
        --color-gray-900: #171717;
        
        /* Accent - Deep Christmas Red */
        --color-accent: #C41E3A;
        --color-accent-light: #DC3545;
        --color-accent-dark: #A01830;
        
        /* Success/Warning/Error */
        --color-success: #059669;
        --color-warning: #D97706;
        --color-error: #DC2626;
        
        /* PHI Spacing Scale (Golden Ratio 1.618) */
        --phi: 1.618;
        --space-base: 1rem;
        --space-phi-xs: 0.382rem;   /* 1/phi^2 */
        --space-phi-sm: 0.618rem;   /* 1/phi */
        --space-phi-md: 1rem;       /* base */
        --space-phi-lg: 1.618rem;   /* phi */
        --space-phi-xl: 2.618rem;   /* phi^2 */
        --space-phi-2xl: 4.236rem;  /* phi^3 */
        
        /* Legacy spacing (keep for compatibility) */
        --space-xs: 0.25rem;
        --space-sm: 0.5rem;
        --space-md: 1rem;
        --space-lg: 1.5rem;
        --space-xl: 2rem;
        --space-2xl: 3rem;
        --space-3xl: 4rem;
    }
    
    /* ─────────────────────────────────────────────────────────────────────────
       REQUIRED FIELD VALIDATION STYLES
       ───────────────────────────────────────────────────────────────────────── */
    .field-required input:placeholder-shown,
    .field-required textarea:placeholder-shown {
        border-color: var(--color-accent) !important;
        border-width: 2px !important;
    }
    
    .required-label::after {
        content: " *";
        color: var(--color-accent);
        font-weight: 700;
    }
    
    /* ─────────────────────────────────────────────────────────────────────────
       GLOBAL RESET & BASE
       ───────────────────────────────────────────────────────────────────────── */
    .stApp {
        font-family: var(--font-primary) !important;
        background-color: var(--color-gray-50) !important;
    }
    
    /* Hide Streamlit branding */
    #MainMenu, footer, header {
        visibility: hidden;
    }
    
    .block-container {
        padding-top: 2rem !important;
        padding-bottom: 2rem !important;
        max-width: 1400px !important;
    }
    
    /* ─────────────────────────────────────────────────────────────────────────
       TYPOGRAPHY
       ───────────────────────────────────────────────────────────────────────── */
    h1, h2, h3, h4, h5, h6, p, span, div, label {
        font-family: var(--font-primary) !important;
    }
    
    h1 {
        font-weight: 800 !important;
        font-size: 2.5rem !important;
        letter-spacing: -0.03em !important;
        color: var(--color-black) !important;
        margin-bottom: 0 !important;
    }
    
    h2 {
        font-weight: 700 !important;
        font-size: 1.5rem !important;
        letter-spacing: -0.02em !important;
        color: var(--color-black) !important;
        text-transform: uppercase !important;
        margin-top: var(--space-xl) !important;
        margin-bottom: var(--space-md) !important;
    }
    
    h3 {
        font-weight: 600 !important;
        font-size: 1.1rem !important;
        letter-spacing: -0.01em !important;
        color: var(--color-gray-700) !important;
        text-transform: uppercase !important;
        margin-bottom: var(--space-sm) !important;
    }
    
    /* ─────────────────────────────────────────────────────────────────────────
       HEADER BRAND
       ───────────────────────────────────────────────────────────────────────── */
    .brand-header {
        display: flex;
        align-items: baseline;
        gap: var(--space-md);
        margin-bottom: var(--space-xs);
        padding-bottom: var(--space-lg);
        border-bottom: 3px solid var(--color-black);
    }
    
    .brand-title {
        font-family: var(--font-primary) !important;
        font-weight: 800 !important;
        font-size: 2.8rem !important;
        letter-spacing: -0.04em !important;
        color: var(--color-black) !important;
        margin: 0 !important;
        line-height: 1 !important;
    }
    
    .brand-subtitle {
        font-family: var(--font-primary) !important;
        font-weight: 400 !important;
        font-size: 1rem !important;
        letter-spacing: 0.1em !important;
        text-transform: uppercase !important;
        color: var(--color-accent) !important;
        margin: 0 !important;
    }
    
    .brand-year {
        font-family: var(--font-primary) !important;
        font-weight: 300 !important;
        font-size: 2.8rem !important;
        color: var(--color-gray-300) !important;
        margin-left: auto !important;
        letter-spacing: -0.02em !important;
    }
    
    /* ─────────────────────────────────────────────────────────────────────────
       KPI METRICS - Minimal Cards
       ───────────────────────────────────────────────────────────────────────── */
    .kpi-container {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: var(--space-md);
        margin: var(--space-xl) 0;
    }
    
    .kpi-card {
        background: var(--color-white);
        border: 1px solid var(--color-gray-200);
        padding: var(--space-lg);
        position: relative;
    }
    
    .kpi-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 4px;
        height: 100%;
        background: var(--color-accent);
    }
    
    .kpi-label {
        font-size: 0.7rem !important;
        font-weight: 600 !important;
        letter-spacing: 0.15em !important;
        text-transform: uppercase !important;
        color: var(--color-gray-500) !important;
        margin-bottom: var(--space-xs) !important;
    }
    
    .kpi-value {
        font-size: 2.5rem !important;
        font-weight: 700 !important;
        letter-spacing: -0.03em !important;
        color: var(--color-black) !important;
        line-height: 1 !important;
    }
    
    /* Override Streamlit metrics */
    [data-testid="stMetric"] {
        background: var(--color-white) !important;
        border: 1px solid var(--color-gray-200) !important;
        border-left: 4px solid var(--color-accent) !important;
        padding: var(--space-lg) !important;
    }
    
    [data-testid="stMetricLabel"] {
        font-size: 0.7rem !important;
        font-weight: 600 !important;
        letter-spacing: 0.15em !important;
        text-transform: uppercase !important;
        color: var(--color-gray-500) !important;
    }
    
    [data-testid="stMetricValue"] {
        font-size: 2rem !important;
        font-weight: 700 !important;
        letter-spacing: -0.02em !important;
        color: var(--color-black) !important;
    }
    
    /* ─────────────────────────────────────────────────────────────────────────
       TABS - Minimal underline style
       ───────────────────────────────────────────────────────────────────────── */
    .stTabs [data-baseweb="tab-list"] {
        gap: 0 !important;
        border-bottom: 2px solid var(--color-gray-200) !important;
        background: transparent !important;
    }
    
    .stTabs [data-baseweb="tab"] {
        font-family: var(--font-primary) !important;
        font-weight: 600 !important;
        font-size: 0.85rem !important;
        letter-spacing: 0.08em !important;
        text-transform: uppercase !important;
        color: var(--color-gray-500) !important;
        background: transparent !important;
        border: none !important;
        padding: var(--space-md) var(--space-lg) !important;
        margin-bottom: -2px !important;
    }
    
    .stTabs [data-baseweb="tab"]:hover {
        color: var(--color-black) !important;
        background: transparent !important;
    }
    
    .stTabs [aria-selected="true"] {
        color: var(--color-black) !important;
        border-bottom: 2px solid var(--color-accent) !important;
        background: transparent !important;
    }
    
    .stTabs [data-baseweb="tab-highlight"] {
        background-color: var(--color-accent) !important;
    }
    
    .stTabs [data-baseweb="tab-border"] {
        display: none !important;
    }
    
    /* ─────────────────────────────────────────────────────────────────────────
       BUTTONS
       ───────────────────────────────────────────────────────────────────────── */
    .stButton > button {
        font-family: var(--font-primary) !important;
        font-weight: 600 !important;
        font-size: 0.8rem !important;
        letter-spacing: 0.05em !important;
        text-transform: uppercase !important;
        background: var(--color-black) !important;
        color: var(--color-white) !important;
        border: none !important;
        border-radius: 0 !important;
        padding: 0.6rem 1.2rem !important;
        transition: all 0.15s ease !important;
    }
    
    .stButton > button:hover {
        background: var(--color-gray-800) !important;
        transform: translateY(-1px) !important;
    }
    
    .stButton > button:active {
        transform: translateY(0) !important;
    }
    
    /* Primary/Accent buttons */
    .stButton > button[kind="primary"],
    .stFormSubmitButton > button {
        background: var(--color-accent) !important;
    }
    
    .stFormSubmitButton > button:hover {
        background: var(--color-accent-dark) !important;
    }
    
    /* Download button */
    .stDownloadButton > button {
        background: var(--color-success) !important;
    }
    
    .stDownloadButton > button:hover {
        background: #047857 !important;
    }
    
    /* ─────────────────────────────────────────────────────────────────────────
       HOT BUTTONS - Grid style
       ───────────────────────────────────────────────────────────────────────── */
    .hot-button-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: var(--space-sm);
        margin: var(--space-md) 0;
    }
    
    .hot-btn {
        font-family: var(--font-primary) !important;
        font-weight: 500 !important;
        font-size: 0.75rem !important;
        background: var(--color-white) !important;
        color: var(--color-black) !important;
        border: 1px solid var(--color-gray-300) !important;
        padding: 0.8rem !important;
        text-align: center !important;
        cursor: pointer;
        transition: all 0.15s ease !important;
    }
    
    .hot-btn:hover {
        border-color: var(--color-accent) !important;
        color: var(--color-accent) !important;
    }
    
    /* ─────────────────────────────────────────────────────────────────────────
       FORMS & INPUTS
       ───────────────────────────────────────────────────────────────────────── */
    .stTextInput > div > div > input,
    .stTextArea > div > div > textarea,
    .stNumberInput > div > div > input,
    .stSelectbox > div > div {
        font-family: var(--font-primary) !important;
        border-radius: 0 !important;
        border: 1px solid var(--color-gray-300) !important;
        background: var(--color-white) !important;
    }
    
    .stTextInput > div > div > input:focus,
    .stTextArea > div > div > textarea:focus,
    .stNumberInput > div > div > input:focus {
        border-color: var(--color-black) !important;
        box-shadow: none !important;
    }
    
    /* Labels */
    .stTextInput > label,
    .stTextArea > label,
    .stNumberInput > label,
    .stSelectbox > label,
    .stRadio > label,
    .stMultiSelect > label {
        font-family: var(--font-primary) !important;
        font-weight: 600 !important;
        font-size: 0.7rem !important;
        letter-spacing: 0.12em !important;
        text-transform: uppercase !important;
        color: var(--color-gray-600) !important;
    }
    
    /* ─────────────────────────────────────────────────────────────────────────
       DATAFRAMES / TABLES
       ───────────────────────────────────────────────────────────────────────── */
    .stDataFrame {
        border: 1px solid var(--color-gray-200) !important;
    }
    
    .stDataFrame [data-testid="stDataFrameResizable"] {
        font-family: var(--font-primary) !important;
    }
    
    /* Table header */
    .stDataFrame th {
        font-family: var(--font-primary) !important;
        font-weight: 600 !important;
        font-size: 0.7rem !important;
        letter-spacing: 0.1em !important;
        text-transform: uppercase !important;
        background: var(--color-gray-100) !important;
        color: var(--color-gray-700) !important;
        border-bottom: 2px solid var(--color-gray-300) !important;
    }
    
    /* Table cells */
    .stDataFrame td {
        font-family: var(--font-primary) !important;
        font-size: 0.85rem !important;
        color: var(--color-gray-800) !important;
    }
    
    /* Alternating rows */
    .stDataFrame tr:nth-child(even) {
        background: var(--color-gray-50) !important;
    }
    
    /* ─────────────────────────────────────────────────────────────────────────
       EXPANDER
       ───────────────────────────────────────────────────────────────────────── */
    .streamlit-expanderHeader {
        font-family: var(--font-primary) !important;
        font-weight: 600 !important;
        font-size: 0.8rem !important;
        letter-spacing: 0.05em !important;
        text-transform: uppercase !important;
        background: var(--color-white) !important;
        border: 1px solid var(--color-gray-200) !important;
        border-radius: 0 !important;
    }
    
    .streamlit-expanderContent {
        background: var(--color-white) !important;
        border: 1px solid var(--color-gray-200) !important;
        border-top: none !important;
    }
    
    /* ─────────────────────────────────────────────────────────────────────────
       ALERTS / SUCCESS / WARNING
       ───────────────────────────────────────────────────────────────────────── */
    .stSuccess {
        font-family: var(--font-primary) !important;
        background: #ECFDF5 !important;
        border-left: 4px solid var(--color-success) !important;
        border-radius: 0 !important;
    }
    
    .stWarning {
        font-family: var(--font-primary) !important;
        background: #FFFBEB !important;
        border-left: 4px solid var(--color-warning) !important;
        border-radius: 0 !important;
    }
    
    .stInfo {
        font-family: var(--font-primary) !important;
        background: var(--color-gray-100) !important;
        border-left: 4px solid var(--color-gray-400) !important;
        border-radius: 0 !important;
    }
    
    /* ─────────────────────────────────────────────────────────────────────────
       RADIO BUTTONS - Horizontal pills
       ───────────────────────────────────────────────────────────────────────── */
    .stRadio > div {
        gap: var(--space-xs) !important;
    }
    
    .stRadio [role="radiogroup"] {
        gap: var(--space-sm) !important;
    }
    
    /* ─────────────────────────────────────────────────────────────────────────
       SLIDER
       ───────────────────────────────────────────────────────────────────────── */
    .stSlider [data-baseweb="slider"] {
        margin-top: var(--space-md) !important;
    }
    
    .stSlider [data-testid="stTickBar"] {
        background: var(--color-gray-300) !important;
    }
    
    .stSlider [role="slider"] {
        background: var(--color-accent) !important;
    }
    
    /* ─────────────────────────────────────────────────────────────────────────
       DIVIDERS
       ───────────────────────────────────────────────────────────────────────── */
    hr {
        border: none !important;
        border-top: 1px solid var(--color-gray-200) !important;
        margin: var(--space-lg) 0 !important;
    }
    
    /* ─────────────────────────────────────────────────────────────────────────
       SECTION HEADERS
       ───────────────────────────────────────────────────────────────────────── */
    .section-header {
        display: flex;
        align-items: center;
        gap: var(--space-md);
        margin: var(--space-xl) 0 var(--space-md) 0;
        padding-bottom: var(--space-sm);
        border-bottom: 1px solid var(--color-gray-200);
    }
    
    .section-title {
        font-family: var(--font-primary) !important;
        font-weight: 700 !important;
        font-size: 0.9rem !important;
        letter-spacing: 0.12em !important;
        text-transform: uppercase !important;
        color: var(--color-black) !important;
        margin: 0 !important;
    }
    
    .section-badge {
        font-family: var(--font-primary) !important;
        font-weight: 600 !important;
        font-size: 0.65rem !important;
        letter-spacing: 0.05em !important;
        background: var(--color-accent) !important;
        color: var(--color-white) !important;
        padding: 0.2rem 0.5rem !important;
    }
    
    /* ─────────────────────────────────────────────────────────────────────────
       ORDER CARD (Draft items)
       ───────────────────────────────────────────────────────────────────────── */
    .draft-card {
        background: var(--color-white);
        border: 1px solid var(--color-gray-200);
        border-left: 4px solid var(--color-warning);
        padding: var(--space-md);
        margin: var(--space-sm) 0;
    }
    
    /* ─────────────────────────────────────────────────────────────────────────
       CAPTION / HELPER TEXT
       ───────────────────────────────────────────────────────────────────────── */
    .stCaption, small {
        font-family: var(--font-primary) !important;
        font-size: 0.75rem !important;
        color: var(--color-gray-500) !important;
        letter-spacing: 0.02em !important;
    }
    
    /* ─────────────────────────────────────────────────────────────────────────
       FOOTER
       ───────────────────────────────────────────────────────────────────────── */
    .footer {
        margin-top: var(--space-3xl);
        padding-top: var(--space-lg);
        border-top: 1px solid var(--color-gray-200);
        text-align: center;
    }
    
    .footer-text {
        font-family: var(--font-primary) !important;
        font-size: 0.7rem !important;
        letter-spacing: 0.1em !important;
        text-transform: uppercase !important;
        color: var(--color-gray-400) !important;
    }
    
    /* ─────────────────────────────────────────────────────────────────────────
       SIDEBAR STYLES
       ───────────────────────────────────────────────────────────────────────── */
    [data-testid="stSidebar"] {
        background-color: var(--color-black) !important;
        padding-top: 1rem !important;
    }
    
    [data-testid="stSidebar"] * {
        color: var(--color-white) !important;
    }
    
    [data-testid="stSidebar"] h1,
    [data-testid="stSidebar"] h2,
    [data-testid="stSidebar"] h3 {
        color: var(--color-white) !important;
    }
    
    [data-testid="stSidebar"] .stMarkdown p {
        color: var(--color-gray-300) !important;
    }
    
    [data-testid="stSidebar"] hr {
        border-color: var(--color-gray-700) !important;
    }
    
    /* Sidebar stat cards */
    .sidebar-stat {
        background: var(--color-gray-800);
        border-left: 3px solid var(--color-accent);
        padding: 0.75rem 1rem;
        margin-bottom: 0.5rem;
    }
    
    .sidebar-stat-label {
        font-size: 0.6rem;
        font-weight: 600;
        letter-spacing: 0.15em;
        text-transform: uppercase;
        color: var(--color-gray-400) !important;
        margin-bottom: 0.25rem;
    }
    
    .sidebar-stat-value {
        font-size: 1.5rem;
        font-weight: 800;
        color: var(--color-white) !important;
        line-height: 1;
    }
    
    /* Sidebar section divider */
    .sidebar-section {
        font-size: 0.6rem;
        font-weight: 700;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        color: var(--color-gray-500) !important;
        padding: 1rem 0 0.5rem 0;
        border-bottom: 1px solid var(--color-gray-700);
        margin-bottom: 0.75rem;
    }
    
    /* Current order highlight */
    .sidebar-current-order {
        background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-dark) 100%);
        padding: 1rem;
        margin: 0.5rem 0;
    }
</style>
"""

st.markdown(SWISS_CSS, unsafe_allow_html=True)

# ═══════════════════════════════════════════════════════════════════════════════
# DATA & CONFIG
# ═══════════════════════════════════════════════════════════════════════════════

MENU_FILE = Path("MENU NATALE 2025 A3.pdf")

# ═══════════════════════════════════════════════════════════════════════════════
# MENU NATALE 2025 - Struttura completa con prezzi e unità
# ═══════════════════════════════════════════════════════════════════════════════

# Unità di misura disponibili
UNITS = {
    "etto": "€/etto",
    "pezzo": "€/pezzo",
    "porzione": "€/porzione",
    "piatto": "€/piatto",
    "vaschetta": "€/vaschetta (2 porzioni)",
}

# Menu completo 2025 - ogni piatto ha: nome, prezzo, unità, note preparazione
MENU_2025 = {
    "Antipasti": {
        "note": "Si consiglia di togliere dal frigo 15 minuti prima del consumo. ~200gr a porzione.",
        "items": [
            {"name": "Salmone marinato agli agrumi", "price": 6.90, "unit": "etto"},
            {"name": "Insalata di polpo alla mediterranea", "price": 6.90, "unit": "etto", "desc": "con pomodorini, olive taggiasche e basilico"},
            {"name": "Insalata di polpo e patate", "price": 5.90, "unit": "etto"},
            {"name": "Insalata di mare", "price": 5.90, "unit": "etto"},
            {"name": "Insalata russa con gamberi", "price": 3.90, "unit": "etto"},
            {"name": "Cocktail di gamberi", "price": 4.40, "unit": "etto"},
            {"name": "Insalata di baccalà, carciofini, sedano e ceci", "price": 4.90, "unit": "etto"},
            {"name": "Gamberi alla catalana", "price": 4.90, "unit": "etto", "desc": "con cipolla di Tropea, pomodorini e basilico"},
            {"name": "Brioche spada affumicato", "price": 4.00, "unit": "pezzo", "desc": "pasta sfoglia"},
            {"name": "Brioche salmone marinato", "price": 4.00, "unit": "pezzo", "desc": "pasta sfoglia"},
            {"name": "Panettoncino gastronomico", "price": 26.00, "unit": "pezzo", "desc": "con salmone, spada e tonno affumicati (assaggio per 4 persone)"},
        ]
    },
    "Sughi": {
        "note": "Riscaldare 5 min in padella. Se necessario, aggiungere 1 cucchiaio di acqua di cottura.",
        "items": [
            {"name": "Sugo all'astice (mezzo)", "price": 6.90, "unit": "etto"},
            {"name": "Ragù di gallinella", "price": 4.40, "unit": "etto"},
            {"name": "Sugo allo scorfano", "price": 4.90, "unit": "etto"},
            {"name": "Sugo di baccalà con guanciale e tartufo", "price": 5.40, "unit": "etto", "desc": "ultimare cottura pasta in padella con 2 cucchiai acqua"},
        ]
    },
    "Primi": {
        "note": "Vaschette da 2 porzioni. Togliere dal frigo 10 min prima. Forno 180° per 8-10 min. Riposare 2 min.",
        "items": [
            {"name": "Cannelloni gamberi, patate e scamorza", "price": 3.40, "unit": "etto"},
            {"name": "Lasagne baccalà, spinaci e pinoli", "price": 3.40, "unit": "etto"},
            {"name": "Lasagne salmone e zafferano", "price": 2.90, "unit": "etto"},
        ]
    },
    "Secondi": {
        "note": "Riscaldare in forno già caldo a 180°.",
        "items": [
            {"name": "Spiedini di branzino con gamberi gratinati", "price": 6.00, "unit": "pezzo", "desc": "forno 180° per 5 min"},
            {"name": "Filetto di branzino ripieno con porcini e salmone", "price": 5.90, "unit": "etto", "desc": "forno 180° per 6-7 min"},
            {"name": "Tortino di gamberi e zucchine", "price": 5.40, "unit": "etto", "desc": "forno 180° per 4-5 min"},
            {"name": "Polpo alla Luciana", "price": 5.90, "unit": "etto", "desc": "riscaldare in padella a fuoco lento 5 min"},
        ]
    },
    "Pronti a Cuocere": {
        "note": "Cuocere in forno già caldo a 180°.",
        "items": [
            {"name": "Capesante gratinate", "price": 5.00, "unit": "pezzo", "desc": "forno 180° per 10 min, poi olio a crudo"},
            {"name": "Spiedini di baccalà, carciofi e limone", "price": 5.90, "unit": "etto", "desc": "forno 180° per 5-6 min"},
            {"name": "Spiedini di salmone, porro e pomodoro secco", "price": 5.90, "unit": "etto", "desc": "forno 180° per 5-6 min"},
            {"name": "Spiedini gambero e bacon con prugne e peperoni", "price": 5.90, "unit": "etto", "desc": "forno 180° per 5-6 min"},
        ]
    },
    "Crudi": {
        "note": "Togliere dal frigo 5 min prima. Condire a piacimento. Consumare entro 2 giorni dall'acquisto.",
        "items": [
            {"name": "Selezione tartare (branzino, orata, salmone, tonno, capasanta)", "price": 21.00, "unit": "piatto"},
            {"name": "MAREMIO per 1 persona", "price": 26.00, "unit": "piatto", "desc": "carpaccio tonno, branzino, salmone, orata, 1 scampo e 2 gamberi rossi Mazara"},
            {"name": "Tartare tonno 120gr", "price": 16.00, "unit": "porzione"},
            {"name": "Tartare salmone 120gr", "price": 13.00, "unit": "porzione"},
            {"name": "Tartare orata 120gr", "price": 13.00, "unit": "porzione"},
            {"name": "Tartare branzino 120gr", "price": 13.00, "unit": "porzione"},
        ]
    },
}

# FALLBACK semplice per compatibilità (solo nomi piatti)
FALLBACK_MENU = {
    category: [item["name"] for item in data["items"]]
    for category, data in MENU_2025.items()
}


# ═══════════════════════════════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════


def get_menu_2025() -> dict:
    """Return the full menu 2025 with prices and units."""
    return MENU_2025


def build_menu() -> dict[str, list[str]]:
    """Build simple menu (just dish names) for compatibility."""
    return FALLBACK_MENU


def get_dish_info(category: str, dish_name: str) -> dict | None:
    """Get full dish info (price, unit, desc) from menu 2025."""
    if category not in MENU_2025:
        return None
    for item in MENU_2025[category]["items"]:
        if item["name"] == dish_name:
            return item
    return None


def get_category_note(category: str) -> str:
    """Get preparation note for a category."""
    if category in MENU_2025:
        return MENU_2025[category].get("note", "")
    return ""


def format_price(price: float, unit: str) -> str:
    """Format price with unit for display."""
    unit_labels = {
        "etto": "/etto",
        "pezzo": "/pz",
        "porzione": "/porz",
        "piatto": "/piatto",
        "vaschetta": "/vasch",
    }
    return f"€{price:.2f}{unit_labels.get(unit, '')}"


def build_default_hot_buttons(menu: dict[str, list[str]]) -> list[dict]:
    """Create default hot buttons from menu."""
    buttons: list[dict] = []
    for category, dishes in menu.items():
        if not dishes:
            continue
        buttons.append({"label": dishes[0], "category": category, "dish": dishes[0]})
        if len(buttons) >= 6:
            break
    return buttons


def ensure_state(menu: dict[str, list[str]]) -> None:
    """Initialize session state."""
    if "orders" not in st.session_state:
        st.session_state.orders: list[dict] = []
    if "current_items" not in st.session_state:
        st.session_state.current_items: list[dict] = []
    if "next_order_id" not in st.session_state:
        st.session_state.next_order_id = 100
    if "menu" not in st.session_state:
        st.session_state.menu = menu
    if "hot_buttons" not in st.session_state:
        st.session_state.hot_buttons = build_default_hot_buttons(menu)
    st.session_state.setdefault("hot_portion", 1)
    st.session_state.setdefault("hot_qty", 1)
    # Editing mode
    st.session_state.setdefault("editing_order_id", None)
    # Form fields - persisted across reruns
    st.session_state.setdefault("form_customer", "")
    st.session_state.setdefault("form_contact", "")
    st.session_state.setdefault("form_note", "")
    # UI state
    st.session_state.setdefault("show_customer_form", True)
    # Rubrica clienti
    if "customers" not in st.session_state:
        st.session_state.customers: list[dict] = []
    st.session_state.setdefault("editing_customer_id", None)
    st.session_state.setdefault("customer_form_name", "")
    st.session_state.setdefault("customer_form_contact", "")
    st.session_state.setdefault("customer_form_note", "")
    if "next_customer_id" not in st.session_state:
        st.session_state.next_customer_id = 1


def build_orders_dataframe(orders: list[dict]) -> pd.DataFrame:
    """Convert orders to DataFrame."""
    rows: list[dict] = []
    for order in orders:
        for item in order["items"]:
            rows.append(
                {
                    "ordine": order["order_id"],
                    "cliente": order["customer"],
                    "contatto": order["contact"],
                    "categoria": item["category"],
                    "piatto": item["dish"],
                    "porzione": f"per {item['portion']}",
                    "vassoi": item["qty"],
                    "coperti": item["qty"] * item["portion"],
                    "note": order["note"],
                },
            )
    if not rows:
        return pd.DataFrame(
            columns=[
                "ordine",
                "cliente",
                "contatto",
                "categoria",
                "piatto",
                "porzione",
                "vassoi",
                "coperti",
                "note",
            ],
        )
    return pd.DataFrame(rows)


def build_totals(orders: list[dict]) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Calculate totals and frequency distribution."""
    totals = defaultdict(lambda: defaultdict(lambda: defaultdict(int)))
    freq = defaultdict(lambda: defaultdict(int))

    for order in orders:
        for item in order["items"]:
            totals[item["category"]][item["dish"]][item["portion"]] += item["qty"]
            freq[item["dish"]][item["qty"]] += 1

    totals_rows: list[dict] = []
    for category, dishes in totals.items():
        for dish, portions in dishes.items():
            for portion, qty in sorted(portions.items()):
                totals_rows.append(
                    {
                        "categoria": category,
                        "piatto": dish,
                        "porzione": f"per {portion}",
                        "vassoi": qty,
                        "coperti": qty * portion,
                    },
                )

    freq_rows: list[dict] = []
    for dish, counts in freq.items():
        for qty, count in sorted(counts.items()):
            freq_rows.append(
                {
                    "piatto": dish,
                    "qta": qty,
                    "frequenza": count,
                },
            )

    totals_df = pd.DataFrame(
        totals_rows,
        columns=["categoria", "piatto", "porzione", "vassoi", "coperti"],
    ).sort_values(["categoria", "piatto", "porzione"])

    freq_df = pd.DataFrame(
        freq_rows,
        columns=["piatto", "qta", "frequenza"],
    ).sort_values(["piatto", "qta"])

    return totals_df, freq_df


def export_excel(orders_df: pd.DataFrame, totals_df: pd.DataFrame, freq_df: pd.DataFrame) -> BytesIO:
    """Export data to Excel."""
    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        orders_df.to_excel(writer, index=False, sheet_name="Ordini")
        totals_df.to_excel(writer, index=False, sheet_name="Totali")
        freq_df.to_excel(writer, index=False, sheet_name="Frequenze")
    output.seek(0)
    return output


def totals_and_freq_from_df(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Calculate totals from filtered DataFrame."""
    if df.empty:
        empty_totals = pd.DataFrame(columns=["categoria", "piatto", "porzione", "vassoi", "coperti"])
        empty_freq = pd.DataFrame(columns=["piatto", "qta", "frequenza"])
        return empty_totals, empty_freq

    totals_df = (
        df.groupby(["categoria", "piatto", "porzione"], dropna=False)
        .agg({"vassoi": "sum", "coperti": "sum"})
        .reset_index()
        .sort_values(["categoria", "piatto", "porzione"])
    )

    freq_df = (
        df.groupby(["piatto", "vassoi"])
        .size()
        .reset_index(name="frequenza")
        .rename(columns={"vassoi": "qta"})
        .sort_values(["piatto", "qta"])
    )

    return totals_df, freq_df


# ═══════════════════════════════════════════════════════════════════════════════
# COMPONENTS
# ═══════════════════════════════════════════════════════════════════════════════


def render_header():
    """Render compact Swiss-style header."""
    st.markdown(
        """
        <div style="
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0.5rem 0;
            border-bottom: 2px solid #0A0A0A;
            margin-bottom: 0.5rem;
        ">
            <div style="display: flex; align-items: baseline; gap: 0.5rem;">
                <span style="font-size: 1.5rem; font-weight: 800; letter-spacing: -0.03em; color: #0A0A0A;">MARE MIO</span>
                <span style="font-size: 0.7rem; letter-spacing: 0.1em; text-transform: uppercase; color: #C41E3A;">Gastronomia di Mare</span>
            </div>
            <span style="font-size: 1.2rem; font-weight: 300; color: #D4D4D4; letter-spacing: -0.02em;">2025</span>
        </div>
        """,
        unsafe_allow_html=True,
    )


def render_kpis(orders_df: pd.DataFrame, num_orders: int):
    """Render KPI metrics."""
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.metric(
            label="Ordini",
            value=num_orders,
        )
    
    with col2:
        st.metric(
            label="Vassoi",
            value=int(orders_df["vassoi"].sum()) if not orders_df.empty else 0,
        )
    
    with col3:
        st.metric(
            label="Coperti",
            value=int(orders_df["coperti"].sum()) if not orders_df.empty else 0,
        )


def render_section_header(title: str, badge: str = None):
    """Render a section header."""
    badge_html = f'<span class="section-badge">{badge}</span>' if badge else ""
    st.markdown(
        f"""
        <div class="section-header">
            <h3 class="section-title">{title}</h3>
            {badge_html}
        </div>
        """,
        unsafe_allow_html=True,
    )


def render_sidebar(orders_df: pd.DataFrame, orders_count: int, menu: dict) -> str:
    """Render the sidebar with navigation and contextual information. Returns selected category."""
    with st.sidebar:
        # Brand/Logo compact
        st.markdown(
            """
            <div style="text-align: center; padding: 0.5rem 0; border-bottom: 1px solid #404040; margin-bottom: 0.75rem;">
                <span style="font-size: 1.5rem;">🎄</span>
                <span style="font-size: 0.9rem; font-weight: 800; letter-spacing: -0.02em; color: white; margin-left: 0.5rem;">MARE MIO</span>
                <span style="font-size: 0.55rem; letter-spacing: 0.1em; color: #C41E3A; margin-left: 0.5rem;">2025</span>
            </div>
            """,
            unsafe_allow_html=True
        )
        
        # ─────────────────────────────────────────────────────────────────
        # NAVIGAZIONE PRINCIPALE - option_menu
        # ─────────────────────────────────────────────────────────────────
        
        # Initialize selected_page if not exists
        if "selected_page" not in st.session_state:
            st.session_state.selected_page = "Ordini"
        
        selected_page = option_menu(
            menu_title=None,
            options=["Ordini", "Rubrica", "Dashboard"],
            icons=["cart3", "person-lines-fill", "graph-up"],
            default_index=["Ordini", "Rubrica", "Dashboard"].index(st.session_state.selected_page),
            styles={
                "container": {"padding": "0", "background-color": "transparent"},
                "icon": {"color": "#C41E3A", "font-size": "14px"},
                "nav-link": {
                    "font-size": "13px",
                    "text-align": "left",
                    "margin": "2px 0",
                    "padding": "8px 12px",
                    "color": "#A3A3A3",
                    "background-color": "transparent",
                    "border-radius": "0",
                },
                "nav-link-selected": {
                    "background-color": "#C41E3A",
                    "color": "white",
                    "font-weight": "600",
                },
            }
        )
        st.session_state.selected_page = selected_page
        
        st.markdown("<div style='height: 0.5rem;'></div>", unsafe_allow_html=True)
        
        # ─────────────────────────────────────────────────────────────────
        # MENU CATEGORIE (solo se pagina Ordini)
        # ─────────────────────────────────────────────────────────────────
        selected_category = None
        if selected_page == "Ordini":
            st.markdown('<div class="sidebar-section">🍽️ MENU</div>', unsafe_allow_html=True)
            
            # Initialize selected_category if not exists
            if "selected_category" not in st.session_state:
                st.session_state.selected_category = list(menu.keys())[0] if menu else "Antipasti"
            
            category_names = list(menu.keys())
            category_icons = ["🥗", "🍝", "🍲", "🐟", "🔥", "🦐"]  # Icons for categories
            
            selected_category = option_menu(
                menu_title=None,
                options=category_names,
                icons=["dot"] * len(category_names),  # Simple dots
                default_index=category_names.index(st.session_state.selected_category) if st.session_state.selected_category in category_names else 0,
                styles={
                    "container": {"padding": "0", "background-color": "transparent"},
                    "icon": {"color": "#737373", "font-size": "8px"},
                    "nav-link": {
                        "font-size": "12px",
                        "text-align": "left",
                        "margin": "1px 0",
                        "padding": "6px 10px",
                        "color": "#9CA3AF",
                        "background-color": "transparent",
                        "border-radius": "0",
                        "border-left": "2px solid transparent",
                    },
                    "nav-link-selected": {
                        "background-color": "#1F2937",
                        "color": "white",
                        "font-weight": "500",
                        "border-left": "2px solid #C41E3A",
                    },
                }
            )
            st.session_state.selected_category = selected_category
        
        st.markdown("<div style='height: 0.75rem;'></div>", unsafe_allow_html=True)
        
        # ─────────────────────────────────────────────────────────────────
        # STATISTICHE LIVE (compatte)
        # ─────────────────────────────────────────────────────────────────
        st.markdown('<div class="sidebar-section">📊 Stats</div>', unsafe_allow_html=True)
        
        total_vassoi = int(orders_df["vassoi"].sum()) if not orders_df.empty else 0
        total_coperti = int(orders_df["coperti"].sum()) if not orders_df.empty else 0
        
        # Compact stats row
        st.markdown(
            f"""
            <div style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem;">
                <div style="flex: 1; background: #1F2937; padding: 0.5rem; border-left: 2px solid #C41E3A;">
                    <div style="font-size: 0.5rem; color: #6B7280; text-transform: uppercase; letter-spacing: 0.1em;">Ordini</div>
                    <div style="font-size: 1.1rem; font-weight: 800; color: white;">{orders_count}</div>
                </div>
                <div style="flex: 1; background: #1F2937; padding: 0.5rem; border-left: 2px solid #22C55E;">
                    <div style="font-size: 0.5rem; color: #6B7280; text-transform: uppercase; letter-spacing: 0.1em;">Vassoi</div>
                    <div style="font-size: 1.1rem; font-weight: 800; color: white;">{total_vassoi}</div>
                </div>
            </div>
            <div style="background: #1F2937; padding: 0.5rem; border-left: 2px solid #3B82F6; margin-bottom: 0.75rem;">
                <div style="font-size: 0.5rem; color: #6B7280; text-transform: uppercase; letter-spacing: 0.1em;">Coperti</div>
                <div style="font-size: 1.1rem; font-weight: 800; color: white;">{total_coperti}</div>
            </div>
            """,
            unsafe_allow_html=True
        )
        
        # ─────────────────────────────────────────────────────────────────
        # STATO ORDINE CORRENTE - BEN VISIBILE
        # ─────────────────────────────────────────────────────────────────
        st.markdown('<div class="sidebar-section">📝 Ordine Corrente</div>', unsafe_allow_html=True)
        
        is_editing = st.session_state.editing_order_id is not None
        current_order_id = st.session_state.editing_order_id if is_editing else st.session_state.next_order_id
        cart_items = len(st.session_state.current_items)
        customer = st.session_state.get("form_customer", "")
        contact = st.session_state.get("form_contact", "")
        
        if is_editing:
            status_color = "#D97706"
            status_text = "MODIFICA"
            status_bg = "linear-gradient(135deg, #78350F 0%, #451A03 100%)"
        elif cart_items > 0:
            status_color = "#22C55E"
            status_text = "IN CORSO"
            status_bg = "linear-gradient(135deg, #14532D 0%, #052E16 100%)"
        else:
            status_color = "#C41E3A"
            status_text = "NUOVO"
            status_bg = "linear-gradient(135deg, #262626 0%, #171717 100%)"
        
        # NUMERO ORDINE - Grande e prominente
        st.markdown(
            f"""
            <div style="
                background: {status_bg};
                border: 2px solid {status_color};
                padding: 1.618rem 1rem;
                margin-bottom: 1rem;
                text-align: center;
            ">
                <div style="font-size: 0.6rem; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; color: {status_color}; margin-bottom: 0.382rem;">{status_text}</div>
                <div style="font-size: 3rem; font-weight: 800; color: white; line-height: 1; letter-spacing: -0.03em;">#{current_order_id}</div>
            </div>
            """,
            unsafe_allow_html=True
        )
        
        # NOME CLIENTE - Grande e chiaro
        if customer:
            st.markdown(
                f"""
                <div style="
                    background: #1F2937;
                    border-left: 4px solid #C41E3A;
                    padding: 1rem;
                    margin-bottom: 0.618rem;
                ">
                    <div style="font-size: 0.55rem; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; color: #6B7280; margin-bottom: 0.25rem;">CLIENTE</div>
                    <div style="font-size: 1.25rem; font-weight: 700; color: white; line-height: 1.2;">{customer}</div>
                    <div style="font-size: 0.75rem; color: #9CA3AF; margin-top: 0.25rem;">{contact if contact else '—'}</div>
                </div>
                """,
                unsafe_allow_html=True
            )
        else:
            st.markdown(
                """
                <div style="
                    background: #1F2937;
                    border-left: 4px solid #4B5563;
                    padding: 1rem;
                    margin-bottom: 0.618rem;
                ">
                    <div style="font-size: 0.55rem; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; color: #6B7280; margin-bottom: 0.25rem;">CLIENTE</div>
                    <div style="font-size: 1rem; color: #6B7280; font-style: italic;">Non inserito</div>
                </div>
                """,
                unsafe_allow_html=True
            )
        
        # Carrello info
        st.markdown(
            f"""
            <div style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0.75rem 1rem;
                background: #111827;
                margin-bottom: 0.5rem;
            ">
                <span style="font-size: 0.7rem; color: #9CA3AF;">🛒 Piatti nel carrello</span>
                <span style="font-size: 1.2rem; font-weight: 800; color: {'#22C55E' if cart_items > 0 else '#6B7280'};">{cart_items}</span>
            </div>
            """,
            unsafe_allow_html=True
        )
        
        # ─────────────────────────────────────────────────────────────────
        # TOP PIATTI (se ci sono ordini)
        # ─────────────────────────────────────────────────────────────────
        if not orders_df.empty:
            st.markdown('<div class="sidebar-section">🏆 Top Piatti</div>', unsafe_allow_html=True)
            
            # Top 5 dishes by quantity
            top_dishes = orders_df.groupby("piatto")["vassoi"].sum().nlargest(5)
            
            for i, (dish, qty) in enumerate(top_dishes.items(), 1):
                # Truncate long names
                display_name = dish[:20] + "…" if len(dish) > 22 else dish
                st.markdown(
                    f"""
                    <div style="
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 0.4rem 0;
                        border-bottom: 1px solid #333;
                    ">
                        <span style="font-size: 0.7rem; color: #A3A3A3;">
                            <span style="color: #C41E3A; font-weight: 700;">{i}.</span> {display_name}
                        </span>
                        <span style="font-size: 0.75rem; font-weight: 700; color: white;">{int(qty)}</span>
                    </div>
                    """,
                    unsafe_allow_html=True
                )
        
        # ─────────────────────────────────────────────────────────────────
        # AZIONI RAPIDE
        # ─────────────────────────────────────────────────────────────────
        st.markdown('<div class="sidebar-section">⚡ Azioni</div>', unsafe_allow_html=True)
        
        # Export button in sidebar
        if orders_count > 0:
            totals_df, freq_df = build_totals(st.session_state.orders)
            excel_data = export_excel(orders_df, totals_df, freq_df)
            st.download_button(
                "⬇️ ESPORTA",
                data=excel_data,
                file_name="ordini_natale_2025.xlsx",
                mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                use_container_width=True,
                key="sidebar_export"
            )
        
        # Footer compact
        st.markdown(
            """
            <div style="
                margin-top: 1rem;
                padding-top: 0.5rem;
                border-top: 1px solid #333;
                text-align: center;
            ">
                <div style="font-size: 0.5rem; color: #404040;">
                    v2.0 · Swiss Design
                </div>
            </div>
            """,
            unsafe_allow_html=True
        )
    
    return selected_page, selected_category


# ═══════════════════════════════════════════════════════════════════════════════
# CALLBACKS
# ═══════════════════════════════════════════════════════════════════════════════


def reset_form_callback():
    """Reset all form fields."""
    st.session_state.form_customer = ""
    st.session_state.form_contact = ""
    st.session_state.form_note = ""
    st.session_state.current_items = []


def cancel_edit_callback():
    """Cancel editing mode and reset form."""
    st.session_state.editing_order_id = None
    st.session_state.form_customer = ""
    st.session_state.form_contact = ""
    st.session_state.form_note = ""
    st.session_state.current_items = []


def save_order_callback():
    """Save or update order - reads from session state."""
    customer = st.session_state.form_customer
    contact = st.session_state.form_contact
    note = st.session_state.form_note
    is_editing = st.session_state.editing_order_id is not None
    
    if is_editing:
        # Update existing
        for idx, order in enumerate(st.session_state.orders):
            if order["order_id"] == st.session_state.editing_order_id:
                st.session_state.orders[idx] = {
                    "order_id": st.session_state.editing_order_id,
                    "customer": customer.strip(),
                    "contact": contact.strip(),
                    "note": note.strip(),
                    "items": list(st.session_state.current_items),
                }
                break
        st.session_state.editing_order_id = None
    else:
        # Create new
        st.session_state.orders.append({
            "order_id": int(st.session_state.next_order_id),
            "customer": customer.strip(),
            "contact": contact.strip(),
            "note": note.strip(),
            "items": list(st.session_state.current_items),
        })
        st.session_state.next_order_id += 1
    # Clear form after save
    st.session_state.current_items = []
    st.session_state.form_customer = ""
    st.session_state.form_contact = ""
    st.session_state.form_note = ""


def clear_cart_callback():
    """Clear cart items."""
    st.session_state.current_items = []


def load_order_for_edit(order_id: int):
    """Load an order into the form for editing."""
    for order in st.session_state.orders:
        if order["order_id"] == order_id:
            st.session_state.editing_order_id = order_id
            st.session_state.form_customer = order['customer']
            st.session_state.form_contact = order['contact']
            st.session_state.form_note = order['note']
            st.session_state.current_items = list(order['items'])
            break


def delete_order_callback(order_id: int):
    """Delete an order."""
    st.session_state.orders = [o for o in st.session_state.orders if o['order_id'] != order_id]
    if st.session_state.editing_order_id == order_id:
        st.session_state.editing_order_id = None
        st.session_state.form_customer = ""
        st.session_state.form_contact = ""
        st.session_state.form_note = ""
        st.session_state.current_items = []


# ═══════════════════════════════════════════════════════════════════════════════
# RUBRICA CALLBACKS
# ═══════════════════════════════════════════════════════════════════════════════


def save_customer_callback():
    """Save or update customer in rubrica."""
    name = st.session_state.customer_form_name.strip()
    contact = st.session_state.customer_form_contact.strip()
    note = st.session_state.customer_form_note.strip()
    
    if not name:
        return
    
    if st.session_state.editing_customer_id is not None:
        # Update existing
        for idx, cust in enumerate(st.session_state.customers):
            if cust["id"] == st.session_state.editing_customer_id:
                st.session_state.customers[idx] = {
                    "id": st.session_state.editing_customer_id,
                    "name": name,
                    "contact": contact,
                    "note": note,
                }
                break
        st.session_state.editing_customer_id = None
    else:
        # Create new
        st.session_state.customers.append({
            "id": st.session_state.next_customer_id,
            "name": name,
            "contact": contact,
            "note": note,
        })
        st.session_state.next_customer_id += 1
    
    # Clear form
    st.session_state.customer_form_name = ""
    st.session_state.customer_form_contact = ""
    st.session_state.customer_form_note = ""


def delete_customer_callback(customer_id: int):
    """Delete a customer from rubrica."""
    st.session_state.customers = [c for c in st.session_state.customers if c["id"] != customer_id]
    if st.session_state.editing_customer_id == customer_id:
        st.session_state.editing_customer_id = None
        st.session_state.customer_form_name = ""
        st.session_state.customer_form_contact = ""
        st.session_state.customer_form_note = ""


def load_customer_for_edit(customer_id: int):
    """Load customer into form for editing."""
    for cust in st.session_state.customers:
        if cust["id"] == customer_id:
            st.session_state.editing_customer_id = customer_id
            st.session_state.customer_form_name = cust["name"]
            st.session_state.customer_form_contact = cust["contact"]
            st.session_state.customer_form_note = cust.get("note", "")
            break


def cancel_customer_edit_callback():
    """Cancel customer editing."""
    st.session_state.editing_customer_id = None
    st.session_state.customer_form_name = ""
    st.session_state.customer_form_contact = ""
    st.session_state.customer_form_note = ""


def select_customer_for_order(customer_id: int):
    """Select a customer from rubrica for the current order."""
    for cust in st.session_state.customers:
        if cust["id"] == customer_id:
            st.session_state.form_customer = cust["name"]
            st.session_state.form_contact = cust["contact"]
            if cust.get("note") and not st.session_state.form_note:
                st.session_state.form_note = cust["note"]
            break


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN APPLICATION
# ═══════════════════════════════════════════════════════════════════════════════


def main() -> None:
    """Main application entry point."""
    
    # Header (compact)
    render_header()
    
    # Initialize
    menu = build_menu()
    ensure_state(menu)
    orders_df = build_orders_dataframe(st.session_state.orders)
    
    # Sidebar with navigation - returns selected page and category
    selected_page, selected_category = render_sidebar(orders_df, len(st.session_state.orders), menu)
    
    # ═══════════════════════════════════════════════════════════════════════════
    # PAGE: ORDINI
    # ═══════════════════════════════════════════════════════════════════════════
    
    if selected_page == "Ordini":
        # PHI ratio layout: Form (1.618) | Orders list (1)
        col_form, col_orders = st.columns([1.618, 1], gap="large")
        
        # ═══════════════════════════════════════════════════════════════════════
        # COLONNA SINISTRA: FORM ORDINE (sempre visibile)
        # ═══════════════════════════════════════════════════════════════════════
        
        with col_form:
            # Determine mode
            is_editing = st.session_state.editing_order_id is not None
            current_order_id = st.session_state.editing_order_id if is_editing else st.session_state.next_order_id
            
            # ─────────────────────────────────────────────────────────────────
            # FORM DATI CLIENTE (sempre visibile per input)
            # ─────────────────────────────────────────────────────────────────
            
            st.markdown(
                """
                <div style="
                    background: white;
                    border: 1px solid #E5E5E5;
                    padding: 1rem;
                    margin: 0.5rem 0 1rem 0;
                ">
                """,
                unsafe_allow_html=True
            )
            
            # Customer and Contact fields - SEMPRE VISIBILI
            cust_col1, cust_col2 = st.columns(2)
            
            with cust_col1:
                st.markdown(
                    "<p style='font-size: 0.7rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #525252; margin-bottom: 0.25rem;'>CLIENTE <span style='color: #C41E3A;'>*</span></p>",
                    unsafe_allow_html=True
                )
                customer = st.text_input(
                    "Cliente",
                    placeholder="Nome / Cognome",
                    key="form_customer",
                    label_visibility="collapsed"
                )
                
                # Quick select from rubrica
                if st.session_state.customers:
                    customer_options = ["— Seleziona dalla rubrica —"] + [c["name"] for c in st.session_state.customers]
                    selected_rubrica = st.selectbox(
                        "Rubrica",
                        customer_options,
                        key="rubrica_select",
                        label_visibility="collapsed"
                    )
                    if selected_rubrica != "— Seleziona dalla rubrica —":
                        # Find and load customer
                        for cust in st.session_state.customers:
                            if cust["name"] == selected_rubrica:
                                if st.session_state.form_customer != cust["name"]:
                                    select_customer_for_order(cust["id"])
                                    st.rerun()
                                break
            
            with cust_col2:
                st.markdown(
                    "<p style='font-size: 0.7rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #525252; margin-bottom: 0.25rem;'>CONTATTO <span style='color: #C41E3A;'>*</span></p>",
                    unsafe_allow_html=True
                )
                contact = st.text_input(
                    "Contatto",
                    placeholder="Telefono / Email",
                    key="form_contact",
                    label_visibility="collapsed"
                )
            
            # Notes field
            st.markdown(
                "<p style='font-size: 0.7rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #525252; margin-bottom: 0.25rem; margin-top: 0.5rem;'>NOTE / ALLERGIE</p>",
                unsafe_allow_html=True
            )
            note = st.text_input(
                "Note",
                placeholder="Eventuali richieste speciali... (opzionale)",
                key="form_note",
                label_visibility="collapsed"
            )
            
            st.markdown("</div>", unsafe_allow_html=True)
            
            # ─────────────────────────────────────────────────────────────────
            # BOTTONI AZIONE
            # ─────────────────────────────────────────────────────────────────
            
            btn_col1, btn_col2 = st.columns([1, 1])
            with btn_col1:
                if is_editing:
                    st.button("✕ ANNULLA MODIFICA", use_container_width=True, key="cancel_edit_btn", on_click=cancel_edit_callback)
            with btn_col2:
                st.button("🔄 RESET FORM", use_container_width=True, key="reset_form_btn", on_click=reset_form_callback)
            
            st.markdown("<div style='height: 0.5rem;'></div>", unsafe_allow_html=True)
            
            # ─────────────────────────────────────────────────────────────────
            # SEZIONE 2: PIATTI (Tab-based selection)
            # ─────────────────────────────────────────────────────────────────
            
            st.markdown(
                """
                <div style="
                    font-size: 0.7rem;
                    font-weight: 700;
                    letter-spacing: 0.15em;
                    text-transform: uppercase;
                    color: #525252;
                    margin-bottom: 0.618rem;
                    padding-bottom: 0.382rem;
                    border-bottom: 2px solid #E5E5E5;
                ">② AGGIUNGI PIATTI</div>
                """,
                unsafe_allow_html=True
            )
            
            # PORZIONI - 5 radio button orizzontali + custom
            st.markdown(
                "<p style='font-size: 0.7rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #525252; margin-bottom: 0.5rem;'>PORZIONI</p>",
                unsafe_allow_html=True
            )
            
            # Radio buttons per porzioni predefinite
            porz_cols = st.columns([1, 1, 1, 1, 1, 0.8, 1])
            
            # Initialize portion state if needed
            if "selected_portion" not in st.session_state:
                st.session_state.selected_portion = 1
            if "custom_portion" not in st.session_state:
                st.session_state.custom_portion = ""
            
            preset_portions = [1, 2, 3, 4, 5]
            
            for i, portion_val in enumerate(preset_portions):
                with porz_cols[i]:
                    is_selected = st.session_state.selected_portion == portion_val and not st.session_state.custom_portion
                    btn_style = "primary" if is_selected else "secondary"
                    if st.button(
                        str(portion_val), 
                        key=f"porz_{portion_val}",
                        use_container_width=True,
                        type=btn_style if is_selected else "secondary"
                    ):
                        st.session_state.selected_portion = portion_val
                        st.session_state.custom_portion = ""
                        st.rerun()
            
            # Custom portion input
            with porz_cols[5]:
                st.markdown("<div style='text-align: center; font-size: 0.7rem; color: #737373; padding-top: 0.5rem;'>o</div>", unsafe_allow_html=True)
            
            with porz_cols[6]:
                custom_val = st.text_input(
                    "Custom",
                    value=st.session_state.custom_portion,
                    placeholder="N°",
                    key="custom_portion_input",
                    label_visibility="collapsed"
                )
                if custom_val != st.session_state.custom_portion:
                    st.session_state.custom_portion = custom_val
                    st.rerun()
            
            # Determine final portion value
            if st.session_state.custom_portion and st.session_state.custom_portion.isdigit():
                dish_portion = int(st.session_state.custom_portion)
            else:
                dish_portion = st.session_state.selected_portion
            
            # Show current selection
            st.markdown(
                f"<p style='font-size: 0.75rem; color: #059669; margin: 0.25rem 0 0.618rem 0;'>✓ Selezionato: <b>{dish_portion}</b> {'porzione' if dish_portion == 1 else 'porzioni'}</p>",
                unsafe_allow_html=True
            )
            
            st.markdown("<div style='height: 0.382rem;'></div>", unsafe_allow_html=True)
            
            # ─────────────────────────────────────────────────────────────────
            # PIATTI DELLA CATEGORIA SELEZIONATA (da sidebar)
            # ─────────────────────────────────────────────────────────────────
            
            cat_name = selected_category if selected_category else list(menu.keys())[0]
            
            # Category header
            st.markdown(
                f"""
                <div style="
                    background: #0A0A0A;
                    color: white;
                    padding: 0.5rem 1rem;
                    margin-bottom: 0.5rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                ">
                    <span style="font-size: 0.9rem; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase;">{cat_name}</span>
                    <span style="font-size: 0.65rem; color: #A3A3A3;">← Cambia categoria dalla sidebar</span>
                </div>
                """,
                unsafe_allow_html=True
            )
            
            # Show category note/preparation instructions
            cat_note = get_category_note(cat_name)
            if cat_note:
                st.markdown(
                    f"""
                    <div style="
                        background: #F0FDF4;
                        border-left: 3px solid #22C55E;
                        padding: 0.5rem 0.75rem;
                        margin-bottom: 0.75rem;
                        font-size: 0.7rem;
                        color: #166534;
                    ">
                        💡 {cat_note}
                    </div>
                    """,
                    unsafe_allow_html=True
                )
            
            # Get full menu data for this category
            if cat_name in MENU_2025:
                items_data = MENU_2025[cat_name]["items"]
            else:
                items_data = [{"name": d, "price": 0, "unit": "etto"} for d in menu.get(cat_name, [])]
            
            # Create button grid - 3 buttons per row (larger to show price)
            cols_per_row = 3
            for row_start in range(0, len(items_data), cols_per_row):
                row_items = items_data[row_start:row_start + cols_per_row]
                cols = st.columns(cols_per_row)
                
                for item_idx, item_data in enumerate(row_items):
                    with cols[item_idx]:
                        dish_name = item_data["name"]
                        price = item_data.get("price", 0)
                        unit = item_data.get("unit", "etto")
                        desc = item_data.get("desc", "")
                        
                        # Format display
                        display_name = dish_name[:22] + "…" if len(dish_name) > 24 else dish_name
                        price_label = format_price(price, unit)
                        btn_key = f"dish_{cat_name}_{row_start + item_idx}"
                        
                        # Button with price badge
                        st.markdown(
                            f"""
                            <div style="
                                font-size: 0.65rem;
                                color: #C41E3A;
                                font-weight: 700;
                                text-align: right;
                                margin-bottom: -0.25rem;
                            ">{price_label}</div>
                            """,
                            unsafe_allow_html=True
                        )
                        
                        if st.button(display_name, key=btn_key, use_container_width=True, help=desc if desc else None):
                            st.session_state.current_items.append({
                                "category": cat_name,
                                "dish": dish_name,
                                "portion": int(dish_portion),
                                "qty": 1,
                                "price": price,
                                "unit": unit,
                            })
                            st.rerun()
            
            st.markdown("<div style='height: 1.618rem;'></div>", unsafe_allow_html=True)
            
            # ─────────────────────────────────────────────────────────────────
            # SEZIONE 3: CARRELLO
            # ─────────────────────────────────────────────────────────────────
            
            st.markdown(
                f"""
                <div style="
                    background: #FEF3C7;
                    border-left: 4px solid #D97706;
                    padding: 0.618rem 1rem;
                    margin-bottom: 1rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                ">
                    <span style="font-size: 0.7rem; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #92400E;">③ CARRELLO</span>
                    <span style="font-size: 1.2rem; font-weight: 800; color: #92400E;">{len(st.session_state.current_items)} piatti</span>
                </div>
                """,
                unsafe_allow_html=True
            )
            
            if st.session_state.current_items:
                # Items list
                for i, item in enumerate(st.session_state.current_items):
                    ic1, ic2 = st.columns([5, 1])
                    with ic1:
                        # Get price info
                        item_price = item.get('price', 0)
                        item_unit = item.get('unit', 'etto')
                        price_display = format_price(item_price, item_unit) if item_price > 0 else ""
                        
                        st.markdown(
                            f"""
                            <div style="
                                background: white;
                                border: 1px solid #E5E5E5;
                                padding: 0.618rem;
                                margin-bottom: 0.382rem;
                                display: flex;
                                justify-content: space-between;
                                align-items: flex-start;
                            ">
                                <div>
                                    <div style="font-weight: 600; font-size: 0.85rem; color: #0A0A0A;">{item['dish']}</div>
                                    <div style="font-size: 0.7rem; color: #737373;">{item['category']} · per {item['portion']} · {item['qty']} vassoi</div>
                                </div>
                                <div style="font-size: 0.75rem; font-weight: 700; color: #C41E3A;">{price_display}</div>
                            </div>
                            """,
                            unsafe_allow_html=True
                        )
                    with ic2:
                        if st.button("✕", key=f"del_item_{i}"):
                            st.session_state.current_items.pop(i)
                            st.rerun()
                
                # Totals
                total_vassoi = sum(it['qty'] for it in st.session_state.current_items)
                total_coperti = sum(it['qty'] * it['portion'] for it in st.session_state.current_items)
                # Estimated price (price * qty, note: this is per unit, not exact total)
                total_stima = sum(it.get('price', 0) * it['qty'] for it in st.session_state.current_items)
                
                st.markdown(
                    f"""
                    <div style="
                        text-align: right;
                        padding: 1rem 0;
                        border-top: 2px solid #E5E5E5;
                        margin-top: 0.618rem;
                    ">
                        <div style="font-size: 0.7rem; color: #737373; text-transform: uppercase; letter-spacing: 0.1em;">Totale</div>
                        <div style="font-size: 1.618rem; font-weight: 800; color: #0A0A0A;">{total_vassoi} vassoi · {total_coperti} coperti</div>
                        <div style="font-size: 0.8rem; color: #C41E3A; font-weight: 600; margin-top: 0.25rem;">Stima: €{total_stima:.2f}</div>
                    </div>
                    """,
                    unsafe_allow_html=True
                )
                
                st.markdown("<div style='height: 0.618rem;'></div>", unsafe_allow_html=True)
                
                # Save button - check validation
                can_save = bool(customer.strip() and contact.strip() and st.session_state.current_items)
                
                save_col1, save_col2 = st.columns([2, 1])
                with save_col1:
                    save_label = "✓ AGGIORNA ORDINE" if is_editing else "✓ SALVA ORDINE"
                    st.button(save_label, use_container_width=True, type="primary", key="save_order_btn", 
                              disabled=not can_save, on_click=save_order_callback)
                
                with save_col2:
                    st.button("🗑 SVUOTA", use_container_width=True, key="clear_cart_btn", 
                              on_click=clear_cart_callback)
                
                if not can_save:
                    st.markdown(
                        "<p style='font-size: 0.7rem; color: #C41E3A; text-align: center; margin-top: 0.5rem;'>⚠ Compila Cliente e Contatto per salvare</p>",
                        unsafe_allow_html=True
                    )
            
            else:
                st.markdown(
                    """
                    <div style="
                        text-align: center;
                        padding: 2.618rem 1rem;
                        color: #A3A3A3;
                    ">
                        <div style="font-size: 2rem; margin-bottom: 0.618rem;">🛒</div>
                        <div style="font-size: 0.8rem;">Aggiungi piatti per iniziare</div>
                    </div>
                    """,
                    unsafe_allow_html=True
                )
        
        # ═══════════════════════════════════════════════════════════════════════
        # COLONNA DESTRA: LISTA ORDINI
        # ═══════════════════════════════════════════════════════════════════════
        
        with col_orders:
            st.markdown(
                f"""
                <div style="
                    background: #ECFDF5;
                    border-left: 4px solid #059669;
                    padding: 0.618rem 1rem;
                    margin-bottom: 1.618rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                ">
                    <span style="font-size: 0.7rem; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #065F46;">ORDINI SALVATI</span>
                    <span style="font-size: 1.2rem; font-weight: 800; color: #065F46;">{len(st.session_state.orders)}</span>
                </div>
                """,
                unsafe_allow_html=True
            )
            
            if not st.session_state.orders:
                st.markdown(
                    """
                    <div style="
                        text-align: center;
                        padding: 2.618rem 1rem;
                        color: #A3A3A3;
                    ">
                        <div style="font-size: 2rem; margin-bottom: 0.618rem;">📋</div>
                        <div style="font-size: 0.8rem;">Nessun ordine salvato</div>
                    </div>
                    """,
                    unsafe_allow_html=True
                )
            else:
                # Orders list (all orders, scrollable)
                for order in reversed(st.session_state.orders):
                    order_id = order['order_id']
                    items_count = len(order['items'])
                    vassoi = sum(i['qty'] for i in order['items'])
                    is_selected = st.session_state.editing_order_id == order_id
                    
                    border_style = "2px solid #D97706" if is_selected else "1px solid #E5E5E5"
                    bg_color = "#FFFBEB" if is_selected else "white"
                    
                    st.markdown(
                        f"""
                        <div style="
                            background: {bg_color};
                            border: {border_style};
                            padding: 0.618rem;
                            margin-bottom: 0.618rem;
                        ">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="font-weight: 800; font-size: 1rem; color: #0A0A0A;">#{order_id}</span>
                                <span style="font-size: 0.7rem; color: #737373;">{vassoi} vassoi</span>
                            </div>
                            <div style="font-size: 0.85rem; font-weight: 600; color: #525252; margin-top: 0.25rem;">{order['customer'] or '—'}</div>
                            <div style="font-size: 0.7rem; color: #A3A3A3;">{order['contact'] or '—'} · {items_count} piatti</div>
                        </div>
                        """,
                        unsafe_allow_html=True
                    )
                    
                    # Action buttons
                    ob1, ob2 = st.columns(2)
                    with ob1:
                        st.button("✏️ Modifica", key=f"edit_{order_id}", use_container_width=True, 
                                  on_click=load_order_for_edit, args=(order_id,))
                    with ob2:
                        st.button("🗑️ Elimina", key=f"del_{order_id}", use_container_width=True,
                                  on_click=delete_order_callback, args=(order_id,))
                    
                    st.markdown("<div style='height: 0.382rem;'></div>", unsafe_allow_html=True)
                
                # Export button
                st.markdown("<div style='height: 1rem;'></div>", unsafe_allow_html=True)
                totals_df, freq_df = build_totals(st.session_state.orders)
                excel_data = export_excel(orders_df, totals_df, freq_df)
                st.download_button(
                    "⬇ ESPORTA EXCEL",
                    data=excel_data,
                    file_name="ordini_natale_2025.xlsx",
                    mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    use_container_width=True,
                )
    
    # ═══════════════════════════════════════════════════════════════════════════
    # PAGE: RUBRICA CLIENTI
    # ═══════════════════════════════════════════════════════════════════════════
    
    elif selected_page == "Rubrica":
        st.markdown(
            """
            <div style="
                background: linear-gradient(135deg, #0A0A0A 0%, #1F2937 100%);
                color: white;
                padding: 1.618rem;
                margin-bottom: 1.618rem;
            ">
                <h2 style="font-size: 1.5rem; font-weight: 800; margin: 0; color: white;">📇 RUBRICA CLIENTI</h2>
                <p style="font-size: 0.8rem; color: #9CA3AF; margin: 0.5rem 0 0 0;">Gestisci i clienti e riutilizzali negli ordini</p>
            </div>
            """,
            unsafe_allow_html=True
        )
        
        rub_col1, rub_col2 = st.columns([1, 1.618], gap="large")
        
        # ─────────────────────────────────────────────────────────────────
        # FORM NUOVO CLIENTE
        # ─────────────────────────────────────────────────────────────────
        with rub_col1:
            is_editing_customer = st.session_state.editing_customer_id is not None
            form_title = "✏️ MODIFICA CLIENTE" if is_editing_customer else "➕ NUOVO CLIENTE"
            
            st.markdown(
                f"""
                <div style="
                    background: {'#FFFBEB' if is_editing_customer else '#F9FAFB'};
                    border: 1px solid {'#D97706' if is_editing_customer else '#E5E5E5'};
                    border-left: 4px solid {'#D97706' if is_editing_customer else '#C41E3A'};
                    padding: 1rem;
                    margin-bottom: 1rem;
                ">
                    <div style="font-size: 0.8rem; font-weight: 700; letter-spacing: 0.1em; color: #0A0A0A;">{form_title}</div>
                </div>
                """,
                unsafe_allow_html=True
            )
            
            st.markdown(
                "<p style='font-size: 0.7rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #525252; margin-bottom: 0.25rem;'>NOME <span style='color: #C41E3A;'>*</span></p>",
                unsafe_allow_html=True
            )
            st.text_input(
                "Nome",
                placeholder="Nome / Cognome",
                key="customer_form_name",
                label_visibility="collapsed"
            )
            
            st.markdown(
                "<p style='font-size: 0.7rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #525252; margin-bottom: 0.25rem; margin-top: 0.5rem;'>CONTATTO</p>",
                unsafe_allow_html=True
            )
            st.text_input(
                "Contatto",
                placeholder="Telefono / Email",
                key="customer_form_contact",
                label_visibility="collapsed"
            )
            
            st.markdown(
                "<p style='font-size: 0.7rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #525252; margin-bottom: 0.25rem; margin-top: 0.5rem;'>NOTE</p>",
                unsafe_allow_html=True
            )
            st.text_input(
                "Note",
                placeholder="Allergie, preferenze...",
                key="customer_form_note",
                label_visibility="collapsed"
            )
            
            st.markdown("<div style='height: 0.5rem;'></div>", unsafe_allow_html=True)
            
            btn_c1, btn_c2 = st.columns(2)
            with btn_c1:
                save_label = "✓ AGGIORNA" if is_editing_customer else "✓ SALVA"
                can_save_customer = bool(st.session_state.customer_form_name.strip())
                st.button(
                    save_label,
                    use_container_width=True,
                    type="primary",
                    disabled=not can_save_customer,
                    on_click=save_customer_callback
                )
            with btn_c2:
                if is_editing_customer:
                    st.button("✕ ANNULLA", use_container_width=True, on_click=cancel_customer_edit_callback)
                else:
                    st.button(
                        "🔄 RESET",
                        use_container_width=True,
                        on_click=cancel_customer_edit_callback
                    )
        
        # ─────────────────────────────────────────────────────────────────
        # LISTA CLIENTI
        # ─────────────────────────────────────────────────────────────────
        with rub_col2:
            st.markdown(
                f"""
                <div style="
                    background: #ECFDF5;
                    border-left: 4px solid #059669;
                    padding: 0.618rem 1rem;
                    margin-bottom: 1rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                ">
                    <span style="font-size: 0.7rem; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #065F46;">CLIENTI IN RUBRICA</span>
                    <span style="font-size: 1.2rem; font-weight: 800; color: #065F46;">{len(st.session_state.customers)}</span>
                </div>
                """,
                unsafe_allow_html=True
            )
            
            if not st.session_state.customers:
                st.markdown(
                    """
                    <div style="
                        text-align: center;
                        padding: 2.618rem 1rem;
                        color: #A3A3A3;
                        background: #F9FAFB;
                        border: 1px dashed #E5E5E5;
                    ">
                        <div style="font-size: 2rem; margin-bottom: 0.618rem;">👥</div>
                        <div style="font-size: 0.8rem;">Nessun cliente in rubrica</div>
                        <div style="font-size: 0.7rem; color: #737373; margin-top: 0.25rem;">Aggiungi il primo cliente dal form a sinistra</div>
                    </div>
                    """,
                    unsafe_allow_html=True
                )
            else:
                # Search filter
                search_query = st.text_input(
                    "🔍 Cerca cliente",
                    placeholder="Cerca per nome o contatto...",
                    key="customer_search"
                )
                
                # Filter customers
                filtered_customers = st.session_state.customers
                if search_query:
                    search_lower = search_query.lower()
                    filtered_customers = [
                        c for c in st.session_state.customers
                        if search_lower in c["name"].lower() or search_lower in c.get("contact", "").lower()
                    ]
                
                st.markdown("<div style='height: 0.5rem;'></div>", unsafe_allow_html=True)
                
                # Customer cards
                for cust in filtered_customers:
                    cust_id = cust["id"]
                    is_selected = st.session_state.editing_customer_id == cust_id
                    
                    border_style = "2px solid #D97706" if is_selected else "1px solid #E5E5E5"
                    bg_color = "#FFFBEB" if is_selected else "white"
                    
                    # Count orders for this customer
                    orders_count = sum(1 for o in st.session_state.orders if o["customer"] == cust["name"])
                    
                    st.markdown(
                        f"""
                        <div style="
                            background: {bg_color};
                            border: {border_style};
                            padding: 0.75rem 1rem;
                            margin-bottom: 0.5rem;
                        ">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                                <div>
                                    <div style="font-weight: 700; font-size: 1rem; color: #0A0A0A;">{cust['name']}</div>
                                    <div style="font-size: 0.8rem; color: #525252;">{cust.get('contact', '—') or '—'}</div>
                                    {f"<div style='font-size: 0.7rem; color: #737373; font-style: italic; margin-top: 0.25rem;'>{cust.get('note', '')}</div>" if cust.get('note') else ''}
                                </div>
                                <div style="
                                    background: {'#C41E3A' if orders_count > 0 else '#E5E5E5'};
                                    color: {'white' if orders_count > 0 else '#737373'};
                                    padding: 0.25rem 0.5rem;
                                    font-size: 0.65rem;
                                    font-weight: 700;
                                ">{orders_count} ordini</div>
                            </div>
                        </div>
                        """,
                        unsafe_allow_html=True
                    )
                    
                    # Action buttons
                    cb1, cb2, cb3 = st.columns(3)
                    with cb1:
                        st.button(
                            "📝 Usa",
                            key=f"use_cust_{cust_id}",
                            use_container_width=True,
                            on_click=select_customer_for_order,
                            args=(cust_id,),
                            help="Usa questo cliente per un nuovo ordine"
                        )
                    with cb2:
                        st.button(
                            "✏️",
                            key=f"edit_cust_{cust_id}",
                            use_container_width=True,
                            on_click=load_customer_for_edit,
                            args=(cust_id,)
                        )
                    with cb3:
                        st.button(
                            "🗑️",
                            key=f"del_cust_{cust_id}",
                            use_container_width=True,
                            on_click=delete_customer_callback,
                            args=(cust_id,)
                        )
                    
                    st.markdown("<div style='height: 0.25rem;'></div>", unsafe_allow_html=True)
    
    # ═══════════════════════════════════════════════════════════════════════════
    # PAGE: DASHBOARD
    # ═══════════════════════════════════════════════════════════════════════════
    
    elif selected_page == "Dashboard":
        if orders_df.empty:
            st.info("Nessun ordine da visualizzare. Vai su 'Ordini' per iniziare a raccogliere ordini.")
        else:
            render_section_header("Filtri", "RICERCA")
            
            # Filter row
            filter_col1, filter_col2, filter_col3 = st.columns(3)
            
            clienti = ["Tutti"] + sorted([c for c in orders_df["cliente"].dropna().unique() if c])
            categorie = ["Tutte"] + sorted(orders_df["categoria"].dropna().unique())
            piatti = ["Tutti"] + sorted(orders_df["piatto"].dropna().unique())
            
            with filter_col1:
                cliente_sel = st.selectbox("Cliente", clienti)
            with filter_col2:
                categoria_sel = st.selectbox("Categoria", categorie)
            with filter_col3:
                piatto_sel = st.selectbox("Piatto", piatti)
            
            # Order range slider
            min_order, max_order = int(orders_df["ordine"].min()), int(orders_df["ordine"].max())
            if min_order < max_order:
                order_range = st.slider(
                    "Intervallo ordini",
                    min_value=min_order,
                    max_value=max_order,
                    value=(min_order, max_order),
                )
            else:
                order_range = (min_order, max_order)
            
            # Apply filters
            df_filtered = orders_df.copy()
            if cliente_sel != "Tutti":
                df_filtered = df_filtered[df_filtered["cliente"] == cliente_sel]
            if categoria_sel != "Tutte":
                df_filtered = df_filtered[df_filtered["categoria"] == categoria_sel]
            if piatto_sel != "Tutti":
                df_filtered = df_filtered[df_filtered["piatto"] == piatto_sel]
            df_filtered = df_filtered[
                (df_filtered["ordine"] >= order_range[0]) & (df_filtered["ordine"] <= order_range[1])
            ]
            
            st.markdown("---")
            
            # Filtered KPIs
            kpi_col1, kpi_col2, kpi_col3 = st.columns(3)
            with kpi_col1:
                st.metric("Ordini filtrati", df_filtered["ordine"].nunique() if not df_filtered.empty else 0)
            with kpi_col2:
                st.metric("Vassoi", int(df_filtered["vassoi"].sum()) if not df_filtered.empty else 0)
            with kpi_col3:
                st.metric("Coperti", int(df_filtered["coperti"].sum()) if not df_filtered.empty else 0)
            
            st.markdown("---")
            
            # Data tabs
            data_tab1, data_tab2, data_tab3 = st.tabs(["ORDINI", "TOTALI", "PER CLIENTE"])
            
            with data_tab1:
                st.dataframe(df_filtered, use_container_width=True, hide_index=True, height=400)
            
            with data_tab2:
                totals_df, freq_df = totals_and_freq_from_df(df_filtered)
                
                st.markdown("**Totale per piatto e formato**")
                st.dataframe(totals_df, use_container_width=True, hide_index=True)
                
                st.markdown("")
                st.markdown("**Frequenza quantità**")
                st.dataframe(freq_df, use_container_width=True, hide_index=True)
            
            with data_tab3:
                per_cliente = (
                    df_filtered.groupby(["cliente", "contatto"], dropna=False)
                    .agg({"ordine": pd.Series.nunique, "vassoi": "sum", "coperti": "sum"})
                    .reset_index()
                    .rename(columns={"ordine": "ordini"})
                    .sort_values("ordini", ascending=False)
                )
                st.dataframe(per_cliente, use_container_width=True, hide_index=True)
            
            st.markdown("---")
            
            # Export filtered
            totals_df, freq_df = totals_and_freq_from_df(df_filtered)
            excel_filtered = export_excel(df_filtered, totals_df, freq_df)
            st.download_button(
                "⬇ Esporta dati filtrati",
                data=excel_filtered,
                file_name="ordini_filtrati.xlsx",
                mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            )
    
    # ═══════════════════════════════════════════════════════════════════════════
    # HELP SECTION
    # ═══════════════════════════════════════════════════════════════════════════
    
    with st.expander("📖 Guida all'uso"):
        st.markdown(
            """
            **Come usare l'applicazione:**
            
            1. **Inserisci i dati cliente** — Nome, contatto e eventuali note/allergie
            2. **Seleziona i piatti** — Categoria → Piatto → Formato → Quantità vassoi
            3. **Aggiungi righe** — Ogni riga è un piatto nell'ordine
            4. **Salva l'ordine** — Conferma per spostarlo nella lista ufficiale
            5. **Usa i bottoni rapidi** — Per i piatti più richiesti
            6. **Dashboard** — Filtra, analizza ed esporta i dati
            
            **Legenda formati:**
            - \`per 1\` = porzione singola
            - \`per 2\` = porzione per 2 persone  
            - \`per 3\` = porzione per 3 persone
            
            **Coperti stimati** = vassoi × formato porzione
            """,
        )
    
    # Footer
    st.markdown(
        """
        <div class="footer">
            <p class="footer-text">Mare Mio Gastronomia · Ordini Natale 2025</p>
        </div>
        """,
        unsafe_allow_html=True,
    )


if __name__ == "__main__":
    main()
