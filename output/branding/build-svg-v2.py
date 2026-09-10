"""Build the logo and its individual vector parts. Run: python3 output/branding/build-svg-v2.py"""
from pathlib import Path
from html import escape
import xml.etree.ElementTree as ET

from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'public/branding/svg-v2'
OUT.mkdir(parents=True, exist_ok=True)
NAVY, BLUE, GOLD = '#0A356A', '#0556B3', '#F4C542'

# One continuous closed path: the arrowhead ends at its tip, with no extra tail.
ARROW = 'M103.580 144 A176 176 0 0 1 380.451 107.549 L399.560 88.440 L417.200 176.800 L328.840 159.160 L349.338 138.662 A132 132 0 0 0 141.685 166 Z'
FRAME = 'M76 177 L126 203 V362 Q126 401 166 401 H346 Q386 401 386 362 V203 L436 177 V196 H452 V216 H436 V242 H452 V262 H436 V288 H452 V308 H436 V334 H452 V354 H436 V364 Q436 452 348 452 H345 V468 H327 V452 H305 V468 H287 V452 H265 V468 H247 V452 H225 V468 H207 V452 H185 V468 H167 V452 H164 Q76 452 76 364 V354 H60 V334 H76 V308 H60 V288 H76 V262 H60 V242 H76 V216 H60 V196 H76 Z'
LETTER_I = 'M176 216 H211 V348 H176 Z'
LETTER_E = 'M224 216 H336 V245 H258 V266 H328 V295 H258 V319 H336 V348 H224 Z'

def part(name, path, color):
    return f'<path id="{name}" fill="{color}" d="{path}"/>'

arrow = part('panah', ARROW, GOLD)
frame = part('bingkai-u', FRAME, NAVY)
monogram = part('huruf-i', LETTER_I, NAVY) + part('huruf-e', LETTER_E, NAVY)
icon = frame + monogram + arrow

# Use the application's installed IBM Plex Sans; outline the glyphs for Canva.
required = set('SIDE SISTEM INFORMASI MANAJEMEN IDLE EQUIPMENTPUSRI · PT PUPUK SRIWIDJAJABiru tuaBiruKuningPutih#0A356F49C542FFFF')
font = None
for candidate in sorted((ROOT / '.next/static/media').glob('*.woff2')):
    loaded = TTFont(candidate)
    families = {n.toUnicode() for n in loaded['name'].names if n.nameID == 1}
    if 'IBM Plex Sans' in families and all(ord(c) in loaded.getBestCmap() for c in required):
        font = loaded
        break
assert font is not None, 'Build the app first so IBM Plex Sans is available in .next/static/media.'

def lettering(text, size, x, y, weight=600, centered=False, color=NAVY):
    glyphs = font.getGlyphSet(location={'wght': weight})
    cmap = font.getBestCmap()
    scale = size / font['head'].unitsPerEm
    width = sum(glyphs[cmap[ord(c)]].width for c in text) * scale
    if centered:
        x -= width / 2
    paths = []
    for char in text:
        glyph = glyphs[cmap[ord(char)]]
        pen = SVGPathPen(glyphs, ntos=lambda v: f'{v:.3f}'.rstrip('0').rstrip('.') if v else '0')
        glyph.draw(TransformPen(pen, (scale, 0, 0, -scale, x, y)))
        if pen.getCommands():
            paths.append(f'<path fill="{color}" d="{pen.getCommands()}"/>')
        x += glyph.width * scale
    return ''.join(paths)

def save(name, viewbox, title, body):
    width, height = viewbox.split()[-2:]
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="{viewbox}"><title>{escape(title)}</title>{body}</svg>\n'
    (OUT / name).write_text(svg)

save('pusri-idle-icon-v2.svg', '0 0 512 512', 'Ikon Sistem Idle Equipment Pusri', icon)
save('pusri-idle-panah-v2.svg', '92 44 338 146', 'Panah pemanfaatan kembali aset', arrow)
save('pusri-idle-bingkai-u-v2.svg', '48 164 416 316', 'Bingkai U dengan gigi mekanis', frame)
save('pusri-idle-monogram-ie-v2.svg', '164 204 184 156', 'Monogram IE: Idle Equipment', monogram)

stacked = f'<g transform="translate(180 60) scale(1.25)">{icon}</g>'
wordmark = lettering('SIDE', 84, 500, 786, centered=True)
wordmark += lettering('SISTEM INFORMASI MANAJEMEN IDLE EQUIPMENT', 27, 500, 838, weight=500, centered=True)
wordmark += lettering('PUSRI · PT PUPUK SRIWIDJAJA', 28, 500, 889, weight=400, centered=True)
stacked += wordmark
save('pusri-idle-logo-v2.svg', '0 0 1000 1000', 'SIDE — Sistem Informasi Manajemen Idle Equipment PUSRI', stacked)
save('pusri-idle-nama-v2.svg', '100 700 800 220', 'SIDE — nama aplikasi dan identitas PUSRI', wordmark)

horizontal = f'<g transform="translate(24 20) scale(.625)">{icon}</g>'
horizontal += lettering('SIDE', 84, 390, 131)
horizontal += lettering('SISTEM INFORMASI MANAJEMEN', 30, 390, 189, weight=500)
horizontal += lettering('IDLE EQUIPMENT', 30, 390, 231, weight=500)
horizontal += lettering('PUSRI · PT PUPUK SRIWIDJAJA', 26, 390, 291, weight=400)
save('pusri-idle-horizontal-v2.svg', '0 0 1200 360', 'SIDE PUSRI — logo horizontal', horizontal)

palette = ''
for name, color, x, y in [('Biru tua', NAVY, 20, 20), ('Biru', BLUE, 340, 20), ('Kuning', GOLD, 20, 225), ('Putih', '#FFFFFF', 340, 225)]:
    palette += f'<rect x="{x}" y="{y}" width="280" height="100" fill="{color}" stroke="#E6E8EA" stroke-width="2"/>'
    palette += lettering(name, 22, x, y + 137)
    palette += lettering(color, 19, x, y + 166, weight=400)
palette += lettering('PUSRI', 48, 320, 492, centered=True)
save('pusri-idle-palet-v2.svg', '0 0 640 520', 'Palet aplikasi dan tulisan Pusri', palette)

# Runnable checks: actual vector geometry, no embedded bitmap or font dependency.
allowed = {'svg', 'title', 'g', 'path', 'rect'}
for path in OUT.glob('*.svg'):
    root = ET.parse(path).getroot()
    assert all(el.tag.split('}')[-1] in allowed for el in root.iter()), path
    assert all('href' not in key for el in root.iter() for key in el.attrib), path
    assert root.attrib.get('viewBox'), path
    print(f'{path.relative_to(ROOT)}: SVG vector verified ({path.stat().st_size:,} bytes)')
assert ARROW.count('M') == 1 and ARROW.count('Z') == 1
assert len(ET.parse(OUT / 'pusri-idle-panah-v2.svg').getroot().findall('{http://www.w3.org/2000/svg}path')) == 1
