// ------------------------------------------------------------
// Bootstrap del servidor HTTP
// ------------------------------------------------------------
import app from './app.js';
import { env } from './env.js';

app.listen(env.PORT, () => {
  console.log(`API http://localhost:${env.PORT}`);
});
