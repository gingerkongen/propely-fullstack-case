import { createApp } from './app.js';
import { openDatabase } from './db.js';

const PORT = Number(process.env.PORT ?? 8080);

createApp(openDatabase()).listen(PORT, () => {
  console.log(`API listening at http://localhost:${PORT}`);
});
