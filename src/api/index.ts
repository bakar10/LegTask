// src/api/index.ts

import 'dotenv/config';
import express from 'express';
import { pool } from '../db';

// Routes
import fatwaRoutes from './Routes/fatwas';
import lawRoutes from './Routes/laws';
import judgmentRoutes from './Routes/judgments';
import documentRoutes from './Routes/search';
// src/api/index.ts



// Middleware
import { errorHandler, notFoundHandler, requestLogger } from './Errors/errorHandler';



const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(requestLogger);

// Health check
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ 
      status: 'ok', 
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(503).json({ 
      status: 'error', 
      database: 'disconnected',
      timestamp: new Date().toISOString()
    });
  }
});

// Routes
app.use('/fatwas', fatwaRoutes);
app.use('/laws', lawRoutes);
app.use('/judgments', judgmentRoutes);
app.use('/documents', documentRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log('');
  console.log('='.repeat(50));
  console.log('LEGAL DOCUMENTS API');
  console.log('='.repeat(50));
  console.log(`Server: http://localhost:${PORT}`);
  console.log('');
  console.log('Endpoints:');
  console.log('  GET /health');
  console.log('  GET /documents?type=&q=&page=&pageSize=');
  console.log('  GET /fatwas');
  console.log('  GET /fatwas/:id');
  console.log('  GET /laws');
  console.log('  GET /laws/:id');
  console.log('  GET /judgments');
  console.log('  GET /judgments/:id');
  console.log('='.repeat(50));
});

export default app;