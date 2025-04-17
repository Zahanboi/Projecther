import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

// Required to use Promises with sqlite3
sqlite3.verbose();

export async function getDBConnection() {
  return open({
    filename: './locations.db',
    driver: sqlite3.Database,
  });
}

export async function initializeDB() {
  const db = await getDBConnection();
  await db.exec(`
    CREATE TABLE IF NOT EXISTS locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lat REAL,
      lng REAL,
      content TEXT
    )
  `);
}
