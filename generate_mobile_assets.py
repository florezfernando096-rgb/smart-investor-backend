#!/usr/bin/env python3
import os
from PIL import Image, ImageDraw, ImageFont

assets_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "mobile", "assets")
os.makedirs(assets_dir, exist_ok=True)

def create_app_icon(size=(1024, 1024), bg_color=(9, 13, 22), border_color=(99, 102, 241)):
    img = Image.new("RGBA", size, bg_color + (255,))
    draw = ImageDraw.Draw(img)
    w, h = size
    
    # Dibujar bordes redondeados o gradiente
    padding = w // 10
    draw.rounded_rectangle([padding, padding, w - padding, h - padding], radius=w // 6, fill=(15, 23, 42, 255), outline=border_color, width=w//50)
    
    # Dibujar barras de gráfico estilizadas
    bar_w = w // 12
    gap = w // 20
    start_x = w // 2 - (bar_w * 3 + gap * 2) // 2
    
    bars = [
        (start_x, h * 0.65, bar_w, h * 0.20, (56, 189, 248)),
        (start_x + bar_w + gap, h * 0.50, bar_w, h * 0.35, (99, 102, 241)),
        (start_x + (bar_w + gap) * 2, h * 0.35, bar_w, h * 0.50, (16, 185, 129)),
    ]
    
    for x, y, bw, bh, color in bars:
        draw.rounded_rectangle([x, y, x + bw, y + bh], radius=bw // 4, fill=color)
        
    # Línea de tendencia ascendente
    pts = [
        (start_x + bar_w // 2, h * 0.65),
        (start_x + bar_w + gap + bar_w // 2, h * 0.50),
        (start_x + (bar_w + gap) * 2 + bar_w // 2, h * 0.35),
    ]
    draw.line(pts, fill=(255, 255, 255, 240), width=w // 60)
    for px, py in pts:
        draw.ellipse([px - w//50, py - w//50, px + w//50, py + w//50], fill=(255, 255, 255, 255))
        
    return img

def create_splash_screen(size=(1242, 2436)):
    img = Image.new("RGBA", size, (9, 13, 22, 255))
    icon = create_app_icon(size=(400, 400))
    x = (size[0] - 400) // 2
    y = (size[1] - 400) // 2 - 100
    img.paste(icon, (x, y), icon)
    return img

# Generar assets
icon_img = create_app_icon(size=(1024, 1024))
icon_img.save(os.path.join(assets_dir, "icon.png"))
icon_img.save(os.path.join(assets_dir, "adaptive-icon.png"))

splash_img = create_splash_screen(size=(1242, 2436))
splash_img.save(os.path.join(assets_dir, "splash.png"))

fav_img = create_app_icon(size=(48, 48))
fav_img.save(os.path.join(assets_dir, "favicon.png"))

print("Assets generados exitosamente en mobile/assets/")
