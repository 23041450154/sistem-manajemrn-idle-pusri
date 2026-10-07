// Self-check tanpa server untuk src/lib/file-url.ts:
//   node --experimental-strip-types scripts/check-file-url.mjs
// Menutup bug "Token tidak ditemukan": dulu file_url attachment bisa jadi URL
// backend absolut, sehingga <img> kena 401 karena tidak bisa memasang token.
import assert from "node:assert/strict";

// BASE_PATH dibaca saat modul dimuat, jadi env di-set sebelum import dinamis.
process.env.NEXT_PUBLIC_BASE_URL = "/idle";
const { fileUrl, proxyAttachmentUrls } = await import("../src/lib/file-url.ts");

const PROXY = "/idle/api/proxy-image?url=%2Fuploads%2Fx.png";

assert.equal(fileUrl(""), "");
assert.equal(fileUrl(undefined), "");
assert.equal(fileUrl("uploads/x.png"), PROXY, "path relatif tanpa leading slash");
assert.equal(fileUrl("/uploads/x.png"), PROXY, "path absolut");
assert.equal(fileUrl("uploads\\x.png"), PROXY, "backslash Windows");

// Bug utama: URL absolut ke backend harus ikut lewat proxy, bukan dipakai apa adanya.
assert.equal(
  fileUrl("http://127.0.0.1:8080/uploads/x.png"),
  PROXY,
  "URL backend absolut wajib lewat proxy",
);
assert.ok(
  !fileUrl("http://127.0.0.1:8080/uploads/x.png").includes("127.0.0.1:8080"),
  "URL proxy tidak boleh mengandung origin backend",
);

// Host lain (CDN/mirror) bukan backend, jadi aman dipakai langsung.
assert.equal(
  fileUrl("https://cdn.example.com/a.png"),
  "https://cdn.example.com/a.png",
  "URL host lain dibiarkan",
);

// Idempoten: jangan bungkus dua kali.
assert.equal(fileUrl(PROXY), PROXY, "URL proxy tidak boleh dibungkus ulang");
assert.equal(
  fileUrl("http://127.0.0.1:8080/uploads/x.png?token=a"),
  PROXY,
  "query backend dibuang, hanya path yang diteruskan",
);

// Tanpa basePath: URL tetap relatif ke origin aplikasi.
process.env.NEXT_PUBLIC_BASE_URL = "";
assert.equal(
  fileUrl("/uploads/x.png"),
  "/api/proxy-image?url=%2Fuploads%2Fx.png",
  "basePath kosong tidak boleh menyisakan prefix",
);
process.env.NEXT_PUBLIC_BASE_URL = "/idle";

const payload = {
  attachments: [
    { file_url: "/uploads/a.png" },
    { fileUrl: "http://127.0.0.1:8080/uploads/b.png" },
    { url: "uploads/c.png" },
    { file_url: "" },
    null,
    "bukan-objek",
  ],
};
proxyAttachmentUrls(payload);
assert.deepEqual(
  payload.attachments.slice(0, 3).map((a) => a.file_url),
  [
    "/idle/api/proxy-image?url=%2Fuploads%2Fa.png",
    "/idle/api/proxy-image?url=%2Fuploads%2Fb.png",
    "/idle/api/proxy-image?url=%2Fuploads%2Fc.png",
  ],
  "semua bentuk field attachment dinormalkan, nama berkas tetap",
);
assert.equal(payload.attachments[3].file_url, "");
assert.doesNotThrow(() => proxyAttachmentUrls(null));
assert.doesNotThrow(() => proxyAttachmentUrls({ attachments: "bukan-array" }));

console.log("check-file-url.mjs OK");
