import { Pool } from "pg";
import dotenv from "dotenv";
// test-mammoth.ts
import mammoth from 'mammoth';

dotenv.config();

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD?.trim() // <--- trim spaces just in case
});
console.log("Password from env:", process.env.DB_PASSWORD, typeof process.env.DB_PASSWORD);


console.log(typeof mammoth.extractRawText);


pool.connect()
  .then(client => {
    console.log("✅ Connected to PostgreSQL database");
    client.release();
  })
  .catch(err => {
    console.error("❌ Database connection error:", err.message);
  });
