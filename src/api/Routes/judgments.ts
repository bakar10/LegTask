// src/api/routes/judgments.ts

import { Router } from 'express';
import { pool } from '../../db';

const router = Router();

// GET /judgments - List all judgments with pagination and search
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const q = req.query.q as string;
    const offset = (page - 1) * pageSize;

    let query = '';
    let countQuery = '';
    let params: any[] = [];

    if (q) {
      query = `
        SELECT id, issuing_authority, court_name, case_type, case_number, case_year,
               session_date, reference_number,
               LEFT(facts, 200) as facts_preview
        FROM judgments
        WHERE full_text ILIKE $1
        ORDER BY case_year DESC, case_number DESC
        LIMIT $2 OFFSET $3
      `;
      countQuery = `SELECT COUNT(*) FROM judgments WHERE full_text ILIKE $1`;
      params = [`%${q}%`, pageSize, offset];
    } else {
      query = `
        SELECT id, issuing_authority, court_name, case_type, case_number, case_year,
               session_date, reference_number,
               LEFT(facts, 200) as facts_preview
        FROM judgments
        ORDER BY case_year DESC, case_number DESC
        LIMIT $1 OFFSET $2
      `;
      countQuery = `SELECT COUNT(*) FROM judgments`;
      params = [pageSize, offset];
    }

    const result = await pool.query(query, params);
    const countResult = await pool.query(countQuery, q ? [`%${q}%`] : []);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      data: result.rows,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });

  } catch (err: any) {
    console.error('[Judgments] Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch judgments' });
  }
});

// GET /judgments/:id - Get single judgment
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM judgments WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Judgment not found' });
    }

    res.json({ data: result.rows[0] });

  } catch (err: any) {
    console.error('[Judgments] Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch judgment' });
  }
});

export default router;