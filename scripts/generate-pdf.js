const PDFDocument = require('pdfkit');
const fs = require('fs');

// Create a document
const doc = new PDFDocument({ margin: 50 });

// Pipe its output somewhere, like to a file or HTTP response
// See below for browser usage
doc.pipe(fs.createWriteStream('public/laporan_inspeksi_P101.pdf'));

// Header
doc
  .fontSize(20)
  .text('Laporan Inspeksi Peralatan Idle', { align: 'center' })
  .moveDown();

doc
  .fontSize(12)
  .text('PT Pupuk Sriwidjaja Palembang', { align: 'center' })
  .moveDown();

// Content
doc.fontSize(14).text('Data Peralatan', { underline: true }).moveDown(0.5);
doc.fontSize(12)
  .text('Kode Aset: P-101')
  .text('Nama Alat: Pompa Sentrifugal Utama')
  .text('Kategori: Rotating Equipment')
  .text('Plant Asal: Pusri IIB')
  .text('Tahun Pembuatan: 2015')
  .moveDown();

doc.fontSize(14).text('Hasil Inspeksi', { underline: true }).moveDown(0.5);
doc.fontSize(12)
  .text('Tanggal Inspeksi: 10 Juli 2026')
  .text('Jam: 08:30 - 10:00 WIB')
  .text('Kondisi Fisik: Bagus')
  .text('Lokasi Pengecekan: Area Unit 1B')
  .text('Evaluasi: Layak')
  .moveDown();

doc.fontSize(14).text('Catatan Pemeriksaan', { underline: true }).moveDown(0.5);
doc.fontSize(12)
  .text('Pompa dalam keadaan baik. Tidak ada korosi berarti. Pelumasan ulang telah dilakukan. Siap untuk redeployment kapan saja diperlukan.')
  .moveDown();

// Finalize PDF file
doc.end();

console.log('PDF generated at public/laporan_inspeksi_P101.pdf');
