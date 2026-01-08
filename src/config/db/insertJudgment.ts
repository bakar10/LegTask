import { pool } from '../../db';
import { Judgment } from '.././../parsers/types';
import crypto from 'crypto';

export async function insertJudgment(judgment: Judgment): Promise<number | null> {
  const {
    issuing_authority,
    court_name,
    case_type,
    case_number,
    case_year,
    session_date,
    technical_office,
    volume_number,
    page_number,
    rule_number,
    reference_number,
  } = judgment.header;

  // Log extraction info
  console.log('[Judgment Loader] Extracted fields:');
  console.log(`  - Court: ${court_name}`);
  console.log(`  - Case: ${case_number}/${case_year}`);
  console.log(`  - Session Date: ${session_date ?? 'N/A'}`);
  console.log(`  - Principles Count: ${judgment.principles.length}`);

  try {
    // First, check if record already exists
    const existingCheck = await pool.query(
      `SELECT id FROM judgments WHERE case_number = $1 AND case_year = $2`,
      [case_number, case_year]
    );

    const isDuplicate = existingCheck.rowCount && existingCheck.rowCount > 0;

    if (isDuplicate) {
      console.log(`[Judgment Loader] ⚠️  DUPLICATE DETECTED: Case ${case_number}/${case_year} already exists (ID: ${existingCheck.rows[0].id})`);
      console.log(`[Judgment Loader] 🔄 Updating existing record...`);
    }

    // Insert or Update
    const res = await pool.query(
      `
      INSERT INTO judgments (
        issuing_authority,
        court_name,
        case_type,
        case_number,
        case_year,
        session_date,
        technical_office,
        volume_number,
        page_number,
        rule_number,
        reference_number,
        panel,
        principles,
        facts,
        reasoning,
        ruling,
        full_text
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      ON CONFLICT (case_number, case_year) DO UPDATE SET
        issuing_authority = EXCLUDED.issuing_authority,
        court_name = EXCLUDED.court_name,
        case_type = EXCLUDED.case_type,
        session_date = EXCLUDED.session_date,
        technical_office = EXCLUDED.technical_office,
        volume_number = EXCLUDED.volume_number,
        page_number = EXCLUDED.page_number,
        rule_number = EXCLUDED.rule_number,
        reference_number = EXCLUDED.reference_number,
        panel = EXCLUDED.panel,
        principles = EXCLUDED.principles,
        facts = EXCLUDED.facts,
        reasoning = EXCLUDED.reasoning,
        ruling = EXCLUDED.ruling,
        full_text = EXCLUDED.full_text
      RETURNING id
      `,
      [
        issuing_authority ?? null,
        court_name,
        case_type ?? null,
        case_number,
        case_year,
        session_date ?? null,
        technical_office ?? null,
        volume_number ?? null,
        page_number ?? null,
        rule_number ?? null,
        reference_number ?? null,
        judgment.panel ?? null,
        JSON.stringify(judgment.principles),
        judgment.facts ?? null,
        judgment.reasoning ?? null,
        judgment.ruling ?? null,
        judgment.full_text,
      ]
    );

    const insertedId = res.rows[0].id;

    if (isDuplicate) {
      console.log(`[Judgment Loader] ✅ UPDATED existing judgment (ID: ${insertedId})`);
    } else {
      console.log(`[Judgment Loader] ✅ INSERTED new judgment (ID: ${insertedId})`);
    }

    return insertedId;

  } catch (err) {
    console.error('[Judgment Loader] ❌ Failed to insert judgment:', err);
    return null;
  }
}