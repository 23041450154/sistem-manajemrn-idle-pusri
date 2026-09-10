"""Build six all-vector SIDE philosophy slides. Run: python3 output/branding/build-philosophy-side.py"""
from pathlib import Path
import runpy
import textwrap
import xml.etree.ElementTree as ET
from html import escape

b = runpy.run_path(str(Path(__file__).with_name('build-svg-v2.py')))
text = b['lettering']
navy, gold = b['NAVY'], b['GOLD']
out = Path(__file__).parent / 'side-philosophy'
out.mkdir(exist_ok=True)

def base(title, number):
    return ('<rect width="1920" height="1080" fill="#FFFFFF"/>'
            f'<rect width="34" height="1080" fill="{navy}"/>'
            f'<rect x="120" y="92" width="66" height="8" fill="{gold}"/>'
            + text('SIDE / PUSRI', 24, 210, 104, color='#617187')
            + text(title, 66, 120, 194)
            + '<rect x="120" y="232" width="1680" height="2" fill="#E6E8EA"/>'
            + text('SIDE · Filosofi logo aplikasi', 23, 120, 1020, weight=400, color='#617187')
            + text(f'{number:02d} / 06', 23, 1690, 1020, weight=400, color='#617187'))

def block(heading, body, y, x=1000, width=47):
    result = text(heading, 34, x, y)
    for i, line in enumerate(textwrap.wrap(body, width=width)):
        result += text(line, 32, x, y + 58 + i * 44, weight=400, color='#46586E')
    return result

def art(body, x, y, scale, ox=0, oy=0):
    return f'<g transform="translate({x} {y}) scale({scale}) translate({-ox} {-oy})">{body}</g>'

def save(name, title, body):
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080"><title>{escape(title)}</title>{body}</svg>'
    root = ET.fromstring(svg)
    assert all(e.tag.split('}')[-1] in {'svg', 'title', 'rect', 'g', 'path'} for e in root.iter())
    assert all('href' not in k for e in root.iter() for k in e.attrib)
    (out / name).write_text(svg)

s = base('Filosofi logo', 1)
s += text('SIDE', 140, 120, 433)
for i, line in enumerate(['Sistem Informasi Manajemen', 'Idle Equipment']):
    s += text(line, 43, 120, 516 + i * 59, weight=500)
s += text('Aset idle kembali bernilai.', 37, 120, 735)
s += text('Pendataan, evaluasi kondisi, dan pemanfaatan', 29, 120, 799, weight=400, color='#46586E')
s += text('kembali peralatan yang dinyatakan layak.', 29, 120, 842, weight=400, color='#46586E')
s += art(b['stacked'], 990, 235, .80)
save('cover.svg', 'SIDE — Filosofi logo', s)

s = base('Bingkai U dan gigi mekanis', 2)
s += art(b['frame'], 145, 330, 1.70, 48, 164)
s += block('Menjaga nilai aset', 'Bingkai U melambangkan penjagaan nilai peralatan selama masa idle, pemeriksaan, dan perawatan.', 340)
s += block('Karakter industri yang terhubung', 'Gigi mekanis mewakili peralatan industri dan kerja unit pengelola, inspeksi, serta pemeliharaan yang saling terhubung.', 590)
s += text('Kaitan PUSRI: bentuk U pada lambang perusahaan bermakna urea.', 24, 120, 914, weight=400, color='#617187')
s += text('Rujukan: pusri.co.id/id/about/identity-company', 20, 120, 950, weight=400, color='#617187')
save('frame.svg', 'Bingkai U dan gigi mekanis', s)

s = base('Monogram IE', 3)
s += art(b['monogram'], 215, 350, 3.05, 164, 204)
s += block('Idle Equipment', 'IE menegaskan objek yang dikelola SIDE: peralatan industri yang sedang tidak digunakan.', 330)
s += block('Tegas dan mudah dikenali', 'Huruf berbentuk blok memberi kesan kokoh, teknis, dan teratur, sesuai karakter pengelolaan peralatan.', 545)
s += block('Data sebagai pusat keputusan', 'Posisi IE di tengah melambangkan informasi kondisi, identitas, dan riwayat aset sebagai dasar keputusan.', 760)
save('monogram.svg', 'Monogram IE pada SIDE', s)

s = base('Panah: kembali produktif', 4)
s += art(b['arrow'], 145, 405, 2.15, 92, 44)
s += block('Siklus pengelolaan aset', 'Lengkungan panah menggambarkan proses pengelolaan yang berlanjut, dari pendataan hingga evaluasi pemanfaatan.', 330)
s += block('Evaluasi, perbaikan, guna ulang', 'Arah panah memberi makna bergerak maju: peralatan diperiksa, diperbaiki bila perlu, lalu digunakan kembali jika layak.', 565)
s += block('Potensi nilai yang dipulihkan', 'Guna ulang aset yang layak dapat mendukung operasional dan mengurangi kebutuhan pengadaan pengganti.', 800)
save('arrow.svg', 'Panah pemanfaatan kembali aset', s)

s = base('Warna: biru, kuning, dan putih', 5)
for label, color, y in [('Biru tua', navy, 325), ('Kuning', gold, 510), ('Putih', '#FFFFFF', 695)]:
    s += f'<rect x="145" y="{y}" width="670" height="130" rx="14" fill="{color}" stroke="#E6E8EA" stroke-width="2"/>'
    s += text(f'{label}  {color}', 29, 175, y + 79, color='#FFFFFF' if color == navy else navy)
s += block('Biru tua · kepercayaan', 'Warna utama simbol dan tulisan mengekspresikan ketelitian, kestabilan, dan pengelolaan aset yang tertib.', 335)
s += block('Kuning · energi dan nilai', 'Aksen pada panah menonjolkan semangat mengaktifkan kembali potensi peralatan yang masih bernilai.', 530)
s += block('Putih · kejelasan', 'Ruang putih memberi jeda visual agar simbol, nama, dan informasi mudah dibaca.', 725)
s += text('Biru dan kuning terinspirasi identitas PUSRI; kode di atas adalah palet logo aplikasi.', 23, 120, 934, weight=400, color='#617187')
save('palette.svg', 'Palet warna SIDE', s)

s = base('Nama SIDE dan identitas PUSRI', 6)
s += art(b['wordmark'], 100, 385, 1, 100, 700)
s += block('Nama aplikasi', 'SIDE adalah nama aplikasi Sistem Informasi Manajemen Idle Equipment. Nama lengkap menjelaskan fungsi sistem.', 330)
s += block('Tipografi yang jelas', 'IBM Plex Sans memberi tampilan tegas dan mudah dibaca. SIDE menjadi fokus, diikuti nama lengkap dan organisasi.', 560)
s += block('PUSRI sebagai identitas organisasi', 'Tulisan PUSRI menegaskan keterkaitan aplikasi dengan PT Pupuk Sriwidjaja Palembang.', 790)
save('name.svg', 'Nama SIDE dan identitas PUSRI', s)
print('Six vector slides verified:', out)
