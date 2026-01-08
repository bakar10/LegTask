
import { pool } from '.././../db';

import { log } from '../../utils/logger';

export async function insertLaw(law: any) {
  if (!law.header) {
    console.log('Law Loader', 'Skipping law: missing header', 'WARN');
    return;
  }

  // Destructure normalized DB-ready fields
  const {
    issuing_authority,
    number,
    year,
    president_name,
    issue_date,
    publish_date,
    effective_date,
    gazette_ref,
    title,
  } = law.header;

  console.log('Law Loader', `Attempting insert Law ${number}/${year}`);

  try {
    const res = await pool.query(
      `
      INSERT INTO laws
      (
        issuing_authority,
        number,
        year,
        president_name,
        issue_date,
        publish_date,
        effective_date,
        gazette_ref,
        title,
        preamble,
        articles,
        full_text
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      ON CONFLICT (number, year) DO NOTHING
      RETURNING id
      `,
      [
        issuing_authority,
        number,
        year,
        president_name ?? null,
        issue_date ?? null,
        publish_date ?? null,
        effective_date ?? null,
        gazette_ref ?? null,
        title ?? null,
        law.preamble ?? null,              // ✅ FIX: now inserted
        JSON.stringify(law.articles),
        law.full_text,
      ]
    );

    if (res.rowCount === 0) {
      console.log('Law Loader', `Duplicate law skipped ${number}/${year}`);
    } else {
      console.log('Law Loader', `Inserted law ID ${res.rows[0].id}`);
    }
  } catch (err) {
    console.error('[Error] Failed to insert law:', err);
  }
}

