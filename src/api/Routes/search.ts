// src/api/routes/search.ts

import { Router } from 'express';
import { pool } from '../../db';

const router = Router();

// GET /documents - Search across all document types
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const type = req.query.type as string;
    const q = req.query.q as string;
    const offset = (page - 1) * pageSize;

    // Validate type
    const validTypes = ['fatwa', 'law', 'judgment'];
    if (type && !validTypes.includes(type)) {
      return res.status(400).json({
        error: 'Invalid type. Must be: fatwa, law, or judgment'
      });
    }

    let results: any[] = [];
    let total = 0;

    if (type === 'fatwa') {
      const data = await searchFatwas(q, pageSize, offset);
      results = data.rows;
      total = data.total;
    } else if (type === 'law') {
      const data = await searchLaws(q, pageSize, offset);
      results = data.rows;
      total = data.total;
    } else if (type === 'judgment') {
      const data = await searchJudgments(q, pageSize, offset);
      results = data.rows;
      total = data.total;
    } else {
      // Search all types
      const [fatwas, laws, judgments] = await Promise.all([
        searchFatwas(q, 100, 0),
        searchLaws(q, 100, 0),
        searchJudgments(q, 100, 0),
      ]);

      const allResults = [
        ...fatwas.rows,
        ...laws.rows,
        ...judgments.rows,
      ];

      total = allResults.length;
      results = allResults.slice(offset, offset + pageSize);
    }

    res.json({
      data: results,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
      filters: {
        type: type || 'all',
        q: q || null,
      },
    });

  } catch (err: any) {
    console.error('[Search] Error:', err.message);
    res.status(500).json({ error: 'Failed to search documents' });
  }
});

// ============================================
// SEARCH HELPERS (Simple ILIKE - No pg_trgm)
// ============================================

async function searchFatwas(q: string | undefined, limit: number, offset: number) {
  let query = '';
  let countQuery = '';
  let params: any[] = [];

  if (q) {
    query = `
      SELECT 
        id, 
        'fatwa' as type, 
        issuing_authority, 
        number, 
        year,
        issue_date,
        LEFT(facts, 200) as preview
      FROM fatwas
      WHERE full_text ILIKE $1
      ORDER BY year DESC, number DESC
      LIMIT $2 OFFSET $3
    `;
    countQuery = `SELECT COUNT(*) FROM fatwas WHERE full_text ILIKE $1`;
    params = [`%${q}%`, limit, offset];
  } else {
    query = `
      SELECT 
        id, 
        'fatwa' as type, 
        issuing_authority, 
        number, 
        year,
        issue_date,
        LEFT(facts, 200) as preview
      FROM fatwas
      ORDER BY year DESC, number DESC
      LIMIT $1 OFFSET $2
    `;
    countQuery = `SELECT COUNT(*) FROM fatwas`;
    params = [limit, offset];
  }

  const result = await pool.query(query, params);
  const countResult = await pool.query(countQuery, q ? [`%${q}%`] : []);
  const total = parseInt(countResult.rows[0].count);

  return { rows: result.rows, total };
}

async function searchLaws(q: string | undefined, limit: number, offset: number) {
  let query = '';
  let countQuery = '';
  let params: any[] = [];

  if (q) {
    query = `
      SELECT 
        id, 
        'law' as type, 
        issuing_authority, 
        number, 
        year, 
        title,
        issue_date,
        LEFT(preamble, 200) as preview
      FROM laws
      WHERE full_text ILIKE $1 OR title ILIKE $1
      ORDER BY year DESC, number DESC
      LIMIT $2 OFFSET $3
    `;
    countQuery = `SELECT COUNT(*) FROM laws WHERE full_text ILIKE $1 OR title ILIKE $1`;
    params = [`%${q}%`, limit, offset];
  } else {
    query = `
      SELECT 
        id, 
        'law' as type, 
        issuing_authority, 
        number, 
        year, 
        title,
        issue_date,
        LEFT(preamble, 200) as preview
      FROM laws
      ORDER BY year DESC, number DESC
      LIMIT $1 OFFSET $2
    `;
    countQuery = `SELECT COUNT(*) FROM laws`;
    params = [limit, offset];
  }

  const result = await pool.query(query, params);
  const countResult = await pool.query(countQuery, q ? [`%${q}%`] : []);
  const total = parseInt(countResult.rows[0].count);

  return { rows: result.rows, total };
}

async function searchJudgments(q: string | undefined, limit: number, offset: number) {
  let query = '';
  let countQuery = '';
  let params: any[] = [];

  if (q) {
    query = `
      SELECT 
        id, 
        'judgment' as type, 
        issuing_authority, 
        court_name, 
        case_type,
        case_number, 
        case_year,
        session_date,
        reference_number,
        LEFT(facts, 200) as preview
      FROM judgments
      WHERE full_text ILIKE $1
      ORDER BY case_year DESC, case_number DESC
      LIMIT $2 OFFSET $3
    `;
    countQuery = `SELECT COUNT(*) FROM judgments WHERE full_text ILIKE $1`;
    params = [`%${q}%`, limit, offset];
  } else {
    query = `
      SELECT 
        id, 
        'judgment' as type, 
        issuing_authority, 
        court_name, 
        case_type,
        case_number, 
        case_year,
        session_date,
        reference_number,
        LEFT(facts, 200) as preview
      FROM judgments
      ORDER BY case_year DESC, case_number DESC
      LIMIT $1 OFFSET $2
    `;
    countQuery = `SELECT COUNT(*) FROM judgments`;
    params = [limit, offset];
  }

  const result = await pool.query(query, params);
  const countResult = await pool.query(countQuery, q ? [`%${q}%`] : []);
  const total = parseInt(countResult.rows[0].count);

  return { rows: result.rows, total };
}

export default router;