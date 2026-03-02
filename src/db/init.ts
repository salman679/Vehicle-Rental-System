import fs from 'fs';
import path from 'path';
import { pool } from './pool';

export async function initDatabase(): Promise<void> {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf-8');
  await pool.query(sql);
  console.log('Database schema ready.');
}
