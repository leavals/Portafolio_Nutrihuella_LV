// ------------------------------------------------------------
// Bootstrap del servidor HTTP
// ------------------------------------------------------------
import app from './app.ts';
import { env } from './env.ts';

app.listen(env.PORT, () => {
  console.log(`API http://localhost:${env.PORT}`);
});

