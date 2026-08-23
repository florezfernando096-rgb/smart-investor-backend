#!/usr/bin/env python3
"""
Genera las 4 gráficas financieras profesionales y minimalistas solicitadas por el usuario.
Período: Q3 2024 a Q2 2026.
"""

import os
import shutil
import matplotlib.pyplot as plt
import matplotlib.ticker as ticker
import numpy as np

# Configuración de estilo global profesional / minimalista
plt.rcParams['font.sans-serif'] = 'Helvetica, Arial, DejaVu Sans, Bitstream Vera Sans'
plt.rcParams['font.family'] = 'sans-serif'
plt.rcParams['axes.edgecolor'] = '#cbd5e1'
plt.rcParams['axes.linewidth'] = 0.8
plt.rcParams['grid.color'] = '#f1f5f9'
plt.rcParams['grid.linestyle'] = '--'
plt.rcParams['grid.alpha'] = 0.8

# Datos
quarters = ['Q3 2024', 'Q4 2024', 'Q1 2025', 'Q2 2025', 'Q3 2025', 'Q4 2025', 'Q1 2026', 'Q2 2026']

# 1. Gráfica 1: Revenues & Gross Profit Ratio
rev = [11.19, 11.96, 11.53, 12.65, 13.47, 14.37, 13.20, 14.19]
gp_ratio = [39.57, 39.51, 39.85, 39.84, 39.79, 39.57, 45.03, 44.93]

# 2. Gráfica 2: % Change YoY Revenues & Net Income
yoy_rev = [4.56, 6.89, -3.56, 9.69, 6.45, 6.68, -8.10, 7.48]
yoy_ni = [157.34, 163.51, -74.20, -23.70, 389.00, -95.53, -11.15, 810.27]

# 3. Gráfica 3: Gross Profit Ratio vs Net Income Ratio
net_ratio = [23.35, 57.55, 15.40, 10.71, 49.20, 2.06, 1.99, 16.87]

# 4. Gráfica 4: Basic EPS
basic_eps = [1.24, 3.27, 0.85, 0.65, 3.18, 0.14, 0.13, 1.18]

out_dir = "/Users/fernandoflorez/APPv2/static/charts"
os.makedirs(out_dir, exist_ok=True)
art_dir = "/Users/fernandoflorez/.gemini/antigravity-ide/brain/de4dac2b-7c9b-4794-b0cb-994e6eddba29"

# ==============================================================================
# GRÁFICA 1: Tendencia de Ingresos y Margen Bruto (Dual Axis)
# ==============================================================================
fig, ax1 = plt.subplots(figsize=(10, 5.5), dpi=300)
fig.patch.set_facecolor('#ffffff')
ax1.set_facecolor('#fafbfc')

color_rev = '#2563eb'    # Azul Royal
color_gp = '#059669'     # Esmeralda

ax1.plot(quarters, rev, color=color_rev, marker='o', linewidth=2.5, markersize=6, label='Revenues ($B)')
ax1.set_ylabel('Ingresos ($B)', color=color_rev, fontsize=11, fontweight='bold', labelpad=10)
ax1.tick_params(axis='y', labelcolor=color_rev, labelsize=10)
ax1.tick_params(axis='x', labelsize=10)
ax1.yaxis.set_major_formatter(ticker.FormatStrFormatter('$%.1fB'))
ax1.set_ylim(9.0, 16.0)
ax1.grid(True, linestyle='--', alpha=0.5, color='#e2e8f0')

ax2 = ax1.twinx()
ax2.plot(quarters, gp_ratio, color=color_gp, marker='s', linewidth=2.5, markersize=6, linestyle='--', label='Gross Profit Ratio (%)')
ax2.set_ylabel('Margen Bruto (%)', color=color_gp, fontsize=11, fontweight='bold', labelpad=10)
ax2.tick_params(axis='y', labelcolor=color_gp, labelsize=10)
ax2.yaxis.set_major_formatter(ticker.PercentFormatter(decimals=0))
ax2.set_ylim(30.0, 52.0)

# Título y Leyenda combinada
plt.title('Gráfica 1: Tendencia de Ingresos y Margen Bruto (Q3 2024 - Q2 2026)', fontsize=13, fontweight='bold', pad=15, color='#0f172a')
lines1, labels1 = ax1.get_legend_handles_labels()
lines2, labels2 = ax2.get_legend_handles_labels()
ax1.legend(lines1 + lines2, labels1 + labels2, loc='upper left', frameon=True, facecolor='#ffffff', edgecolor='#e2e8f0', fontsize=9.5)

plt.tight_layout()
g1_path = os.path.join(out_dir, 'grafica1_ingresos_margen_bruto.png')
plt.savefig(g1_path, bbox_inches='tight')
plt.close()
print("Guardada:", g1_path)

# ==============================================================================
# GRÁFICA 2: Crecimiento Interanual (YoY) de Ingresos y Ganancia Neta
# ==============================================================================
fig, ax = plt.subplots(figsize=(10, 5.5), dpi=300)
fig.patch.set_facecolor('#ffffff')
ax.set_facecolor('#fafbfc')

x = np.arange(len(quarters))
width = 0.38

color_yoy_rev = '#3b82f6'  # Azul
color_yoy_ni = '#10b981'   # Verde

rects1 = ax.bar(x - width/2, yoy_rev, width, label='% Change YoY Revenues', color=color_yoy_rev, alpha=0.9, edgecolor='none')
rects2 = ax.bar(x + width/2, yoy_ni, width, label='% Change YoY Net Income', color=color_yoy_ni, alpha=0.9, edgecolor='none')

ax.axhline(0, color='#64748b', linewidth=0.9, linestyle='-')
ax.set_ylabel('Crecimiento YoY (%)', fontsize=11, fontweight='bold', color='#0f172a', labelpad=10)
ax.set_xticks(x)
ax.set_xticklabels(quarters, fontsize=10)
ax.yaxis.set_major_formatter(ticker.PercentFormatter(decimals=0))
ax.grid(True, axis='y', linestyle='--', alpha=0.5, color='#e2e8f0')

plt.title('Gráfica 2: Crecimiento Interanual (YoY) de Ingresos y Ganancia Neta', fontsize=13, fontweight='bold', pad=15, color='#0f172a')
ax.legend(loc='upper left', frameon=True, facecolor='#ffffff', edgecolor='#e2e8f0', fontsize=9.5)

plt.tight_layout()
g2_path = os.path.join(out_dir, 'grafica2_crecimiento_yoy.png')
plt.savefig(g2_path, bbox_inches='tight')
plt.close()
print("Guardada:", g2_path)

# ==============================================================================
# GRÁFICA 3: Márgenes de Rentabilidad (Bruto vs. Neto, 0% a 100%)
# ==============================================================================
fig, ax = plt.subplots(figsize=(10, 5.5), dpi=300)
fig.patch.set_facecolor('#ffffff')
ax.set_facecolor('#fafbfc')

color_gp_m = '#0284c7'   # Sky Blue
color_ni_m = '#f59e0b'   # Amber / Orange

ax.plot(quarters, gp_ratio, color=color_gp_m, marker='o', linewidth=2.5, markersize=6, label='Gross Profit Ratio (%)')
ax.plot(quarters, net_ratio, color=color_ni_m, marker='^', linewidth=2.5, markersize=6, linestyle='-.', label='Net Income Ratio (%)')

ax.set_ylabel('Margen (%)', fontsize=11, fontweight='bold', color='#0f172a', labelpad=10)
ax.set_ylim(0, 100)
ax.yaxis.set_major_formatter(ticker.PercentFormatter(decimals=0))
ax.grid(True, linestyle='--', alpha=0.5, color='#e2e8f0')
ax.tick_params(axis='both', labelsize=10)

plt.title('Gráfica 3: Márgenes de Rentabilidad (Bruto vs. Neto, Escala 0% - 100%)', fontsize=13, fontweight='bold', pad=15, color='#0f172a')
ax.legend(loc='upper right', frameon=True, facecolor='#ffffff', edgecolor='#e2e8f0', fontsize=9.5)

plt.tight_layout()
g3_path = os.path.join(out_dir, 'grafica3_margenes_rentabilidad.png')
plt.savefig(g3_path, bbox_inches='tight')
plt.close()
print("Guardada:", g3_path)

# ==============================================================================
# GRÁFICA 4: Ganancias por Acción Básicas (Basic EPS)
# ==============================================================================
fig, ax = plt.subplots(figsize=(10, 5.5), dpi=300)
fig.patch.set_facecolor('#ffffff')
ax.set_facecolor('#fafbfc')

color_eps = '#6366f1'  # Indigo

bars = ax.bar(quarters, basic_eps, color=color_eps, width=0.5, alpha=0.9, edgecolor='none')

ax.set_ylabel('Basic EPS ($)', fontsize=11, fontweight='bold', color='#0f172a', labelpad=10)
ax.yaxis.set_major_formatter(ticker.FormatStrFormatter('$%.2f'))
ax.set_ylim(0, 4.0)
ax.grid(True, axis='y', linestyle='--', alpha=0.5, color='#e2e8f0')
ax.tick_params(axis='both', labelsize=10)

plt.title('Gráfica 4: Ganancias por Acción Básicas (Basic EPS)', fontsize=13, fontweight='bold', pad=15, color='#0f172a')

plt.tight_layout()
g4_path = os.path.join(out_dir, 'grafica4_basic_eps.png')
plt.savefig(g4_path, bbox_inches='tight')
plt.close()
print("Guardada:", g4_path)

# Copiar a artifacts directory
for f in ['grafica1_ingresos_margen_bruto.png', 'grafica2_crecimiento_yoy.png', 'grafica3_margenes_rentabilidad.png', 'grafica4_basic_eps.png']:
    src = os.path.join(out_dir, f)
    dst = os.path.join(art_dir, f)
    shutil.copyfile(src, dst)
    print(f"Copiada a artifacts: {dst}")

print("\n¡Todas las 4 gráficas generadas con éxito!")
