

import 'dotenv/config';
import { pool } from '../db';

async function setupIndexes() {
  console.log('='.repeat(50));
  console.log('SETTING UP DATABASE INDEXES');
  console.log('='.repeat(50));

  try {
    // Enable trigram extension
    console.log('\n[1] Enabling pg_trgm extension...');
    await pool.query('CREATE EXTENSION IF NOT EXISTS pg_trgm');
    console.log('    Done!');

    // Fatwas indexes
    console.log('\n[2] Creating fatwas indexes...');
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_fatwas_full_text_trgm 
      ON fatwas USING gin (full_text gin_trgm_ops)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_fatwas_number_year 
      ON fatwas (number, year)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_fatwas_year 
      ON fatwas (year DESC)
    `);
    console.log('    Done!');

    // Laws indexes
    console.log('\n[3] Creating laws indexes...');
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_laws_full_text_trgm 
      ON laws USING gin (full_text gin_trgm_ops)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_laws_title_trgm 
      ON laws USING gin (title gin_trgm_ops)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_laws_number_year 
      ON laws (number, year)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_laws_year 
      ON laws (year DESC)
    `);
    console.log('    Done!');

    // Judgments indexes
    console.log('\n[4] Creating judgments indexes...');
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_judgments_full_text_trgm 
      ON judgments USING gin (full_text gin_trgm_ops)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_judgments_case_number_year 
      ON judgments (case_number, case_year)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_judgments_year 
      ON judgments (case_year DESC)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_judgments_court_name 
      ON judgments (court_name)
    `);
    console.log('    Done!');

    console.log('\n' + '='.repeat(50));
    console.log('ALL INDEXES CREATED SUCCESSFULLY!');
    console.log('='.repeat(50));

    // Show created indexes
    console.log('\n[Indexes Summary]');
    
    const indexes = await pool.query(`
      SELECT tablename, indexname 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND tablename IN ('fatwas', 'laws', 'judgments')
      ORDER BY tablename, indexname
    `);

    indexes.rows.forEach(row => {
      console.log(`  ${row.tablename}: ${row.indexname}`);
    });

  } catch (err: any) {
    console.error('\n[ERROR]', err.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

setupIndexes();