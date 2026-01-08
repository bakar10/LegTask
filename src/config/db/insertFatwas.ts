// insertFatwa.ts
import { pool } from '.././../db';
import { Fatwa } from '.././../parsers/types';


interface FatwaDB {
  issuing_authority: string;
  number: number;
  year: number;
  file_number?: string | null;
  issue_date?: string | null;
  session_date?: string | null;
  entity?: string | null;
  principles?: any[];
  facts?: string | null;
  application?: string | null;
  opinion?: string | null;
  full_text: string;
}
// insertFatwa.ts


export async function insertFatwa(fatwa: Fatwa) {
  if (!fatwa.header) {
    console.warn('[Insert] Skipping fatwa: missing header');
    return;
    
  }
  

  const {
    issuing_authority,
    number,
    year,
    issue_date,
    session_date,
    file_number,
  } = fatwa.header;
  const { header } = fatwa;
  console.log(
    `[Fatwa Loader] Attempting to insert Fatwa ${header.number}/${header.year}`
  );

  try {
    const res =await pool.query(
    `INSERT INTO fatwas
      (issuing_authority, number, year, file_number, issue_date, session_date, entity, principles, facts, application, opinion, full_text)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      ON CONFLICT (number, year) DO NOTHING
      RETURNING id`,
    [
      issuing_authority,
      number,
      year,
      file_number || null,
      issue_date || null,
      session_date || null,
      fatwa.entity || null,
      JSON.stringify(fatwa.principles || []),
      fatwa.facts || null,
      fatwa.application || null,
      fatwa.opinion || null,
      fatwa.full_text,
    ]
  );

  
    if (res.rowCount === 0) {
      console.log(
        `[Fatwa Loader] Duplicate detected, skipping Fatwa ${header.number}/${header.year}`
      );
    } else {
      console.log(
        `[Fatwa Loader] Inserted Fatwa with ID ${res.rows[0].id}`
      );
    }

  } catch (err) {
    console.error(
      `[Fatwa Loader] Failed to insert Fatwa ${header.number}/${header.year}`,
      err
    );
    throw err;
  }
}



