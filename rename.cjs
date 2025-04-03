const fs = require("fs");
const path = require("path");

// Türkçe karakterleri dönüştüren yardımcı fonksiyon
function toSlug(str) {
  return str
    .toLowerCase()
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ü/g, "u")
    .replace(/[^a-z0-9]/g, "-") // boşlukları ve özel karakterleri tire yap
    .replace(/-+/g, "-") // birden fazla tireyi teke indir
    .replace(/^-|-$/g, ""); // baş/son tireleri kaldır
}

const uploadsPath = path.join(__dirname, "public", "uploads");

fs.readdir(uploadsPath, (err, files) => {
  if (err) throw err;

  files.forEach((file) => {
    const ext = path.extname(file); // .png
    const base = path.basename(file, ext); // belcika cikolatali...
    const newSlug = toSlug(base) + ext;

    const oldPath = path.join(uploadsPath, file);
    const newPath = path.join(uploadsPath, newSlug);

    // Dosya adını değiştir
    fs.rename(oldPath, newPath, (err) => {
      if (err) {
        console.error(`Hata: ${file}`, err);
      } else {
        console.log(`${file} ➤ ${newSlug}`);
      }
    });
  });
});
