// src/api/routes/fatwas.ts

import { Router } from 'express';
import { pool } from '../../db';

const router = Router();

// GET /fatwas - List all fatwas with pagination and search
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
      // Search query
      query = `
        SELECT id, issuing_authority, number, year, issue_date, session_date, entity,
               LEFT(facts, 200) as facts_preview
        FROM fatwas
        WHERE full_text ILIKE $1
        ORDER BY year DESC, number DESC
        LIMIT $2 OFFSET $3
      `;
      countQuery = `SELECT COUNT(*) FROM fatwas WHERE full_text ILIKE $1`;
      params = [`%${q}%`, pageSize, offset];
    } else {
      // List all
      query = `
        SELECT id, issuing_authority, number, year, issue_date, session_date, entity,
               LEFT(facts, 200) as facts_preview
        FROM fatwas
        ORDER BY year DESC, number DESC
        LIMIT $1 OFFSET $2
      `;
      countQuery = `SELECT COUNT(*) FROM fatwas`;
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
    console.error('[Fatwas] Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch fatwas' });
  }
});

// GET /fatwas/:id - Get single fatwa
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM fatwas WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Fatwa not found' });
    }

    res.json({ data: result.rows[0] });

  } catch (err: any) {
    console.error('[Fatwas] Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch fatwa' });
  }
});

export default router;