const fs = require("fs");
const path = require("path");
const { Client } = require("pg");
const slugify = require("slugify");

// PostgreSQL bağlantısı
const client = new Client({
  user: "postgres",
  host: "localhost",
  database: "qrmenu",
  password: "kaputdrakonis1", // kendi şifreni yaz
  port: 5432,
});

async function updateImageUrls() {
  await client.connect();

  const uploadsDir = path.join(__dirname, "public", "uploads");
  const imageFiles = fs.readdirSync(uploadsDir);

  // Veritabanındaki tüm ürünleri çek
  const res = await client.query("SELECT id, name FROM products");

  let updated = 0;

  for (const product of res.rows) {
    const slugName = slugify(product.name, {
      lower: true,
      strict: true,
      locale: "tr",
    });

    const match = imageFiles.find((file) => file.startsWith(slugName));
    if (match) {
      const imageUrl = `/uploads/${match}`;
      await client.query(
        "UPDATE products SET image_url = $1 WHERE id = $2",
        [imageUrl, product.id]
      );
      console.log(`✅ ${product.name} → ${imageUrl}`);
      updated++;
    } else {
      console.log(`⛔ Eşleşme yok: ${product.name}`);
    }
  }

  await client.end();
  console.log(`\nToplam ${updated} ürün güncellendi.`);
}

updateImageUrls().catch((err) => console.error("Hata:", err)); 