const { Pool } = require('pg');

const pool = new Pool({
  user: 'greenroots',
  host: 'localhost',
  database: 'greenroots',
  password: 'greenroots',
  port: 5432,
});

async function initDatabase() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Création de la table des catégories
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Création de la table des produits avec les caractéristiques intégrées
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
        price DECIMAL(10,2),
        stock INTEGER,
        detailed_description TEXT,
        height VARCHAR(100),
        flower_color VARCHAR(100),
        flowering_period VARCHAR(100),
        watering_frequency VARCHAR(100),
        planting_period VARCHAR(100),
        exposure VARCHAR(100),
        hardiness VARCHAR(100),
        planting_distance VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Création de la table des images
    await client.query(`
      CREATE TABLE IF NOT EXISTS product_images (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        url VARCHAR(255) NOT NULL,
        alt TEXT,
        sizes VARCHAR(100)
      );
    `);

    await client.query('COMMIT');
    console.log('Tables créées avec succès');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erreur lors de la création des tables:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

initDatabase();