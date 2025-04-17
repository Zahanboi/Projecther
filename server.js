import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { getDBConnection, initializeDB } from './db.js';

const app = express();
const PORT = 3000;

await initializeDB();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Get all saved markers
app.get('/locations', async (req, res) => {
  const db = await getDBConnection();
  const locations = await db.all('SELECT * FROM locations');
  res.json(locations);
});

// Save a new location
app.post('/locations', async (req, res) => {
  const { lat, lng, content } = req.body;
  const db = await getDBConnection();
  const result = await db.run('INSERT INTO locations (lat, lng, content) VALUES (?, ?, ?)', [lat, lng, content]);
  res.json({ id: result.lastID });
});

// Delete a location by ID
app.delete('/locations/:id', async (req, res) => {
  const id = req.params.id;
  const db = await getDBConnection();
  await db.run('DELETE FROM locations WHERE id = ?', id);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
