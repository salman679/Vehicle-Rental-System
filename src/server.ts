import app from './app';
import { config } from './config';
import { initDatabase } from './db/init';

async function start() {
  try {
    await initDatabase();
  } catch (err) {
    console.error('Database init failed:', err);
    process.exit(1);
  }
  app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
  });
}

start();
