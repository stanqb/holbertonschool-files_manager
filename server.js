import express from 'express';
// eslint-disable-next-line import/extensions
import router from './routes/index.js';

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use('/', router);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
