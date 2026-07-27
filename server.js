import express from 'express';
// eslint-disable-next-line import/extensions
import router from './routes/index.js';
// eslint-disable-next-line import/extensions
import dbClient from './utils/db.mjs';

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use('/', router);

const waitForDB = () => new Promise((resolve) => {
  const check = () => {
    if (dbClient.isAlive()) {
      resolve();
    } else {
      setTimeout(check, 100);
    }
  };
  check();
});

(async () => {
  await waitForDB();
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
})();
