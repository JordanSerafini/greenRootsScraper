const fs = require('fs');
const { Pool } = require('pg');

// Configuration de la catégorie
const CATEGORY_NAME = "arbres-a-fleurs";

const pool = new Pool({
  user: 'greenroots',
  host: 'localhost',
  database: 'greenroots',
  password: 'greenroots',
  port: 5432,
});

function cleanPrice(price) {
  if (typeof price === 'string') {
    return parseFloat(price.replace('€', '').trim().replace(',', '.'));
  }
  return price;
}

async function insertData() {
  try {
    console.log('Lecture du fichier...');
    const fileContent = fs.readFileSync('arbres-willemse.jsonl', 'utf8');
    const lines = fileContent.split('\n').filter(line => line.trim());
    console.log(`Nombre de lignes à traiter: ${lines.length}`);

    const client = await pool.connect();
    console.log('Connecté à la base de données');

    try {
      await client.query('BEGIN');
      console.log('Début de la transaction');

      let count = 0;
      for (const line of lines) {
        if (!line.trim()) continue;

        const data = JSON.parse(line);
        console.log('Traitement de:', data.name);

        const characteristics = data.characteristics || {};
        const esthetique = characteristics.Esthétique || {};
        const jardinage = characteristics.Jardinage || {};
        const emplacement = characteristics.Emplacement || {};

        try {
          const productQuery = {
            text: `WITH ins_category AS (
              INSERT INTO categories (name)
              VALUES ($1)
              ON CONFLICT DO NOTHING
              RETURNING id
            ),
            sel_category AS (
              SELECT id FROM categories WHERE name = $1
              UNION ALL
              SELECT id FROM ins_category
              LIMIT 1
            )
            INSERT INTO products (
              name,
              category_id,
              price,
              stock,
              detailed_description,
              height,
              flower_color,
              planting_distance,
              watering_frequency,
              planting_period,
              exposure,
              hardiness
            ) 
            SELECT 
              $2, 
              (SELECT id FROM sel_category), 
              $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
            RETURNING id`,
            values: [
              CATEGORY_NAME,
              data.name,
              cleanPrice(data.price),
              data.stock,
              characteristics['Description détaillée'],
              esthetique['Hauteur à maturité'],
              esthetique['Couleur de la fleur'],
              jardinage['Distance de plantation'],
              jardinage['Fréquence d\'arrosage'],
              jardinage['Période de plantation'],
              emplacement['Exposition'],
              jardinage['Rusticité']
            ]
          };

          const productResult = await client.query(productQuery);
          const productId = productResult.rows[0].id;

          if (data.images && data.images.length > 0) {
            for (const image of data.images) {
              await client.query(
                `INSERT INTO product_images (product_id, url)
                 VALUES ($1, $2)`,
                [productId, image.url]
              );
            }
          }

          count++;
          console.log(`Produit ${count} inséré avec succès (${data.name})`);
        } catch (productError) {
          console.error('Erreur lors de l\'insertion du produit:', data.name, productError);
          continue;
        }
      }

      await client.query('COMMIT');
      console.log(`Import terminé. ${count} produits insérés`);

    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Erreur lors de l\'import:', err);
    } finally {
      client.release();
      await pool.end();
      console.log('Connexion fermée');
    }
  } catch (err) {
    console.error('Erreur générale:', err);
  }
}

console.log('Démarrage du script...');
insertData().catch(err => {
  console.error('Erreur non gérée:', err);
  process.exit(1);
});