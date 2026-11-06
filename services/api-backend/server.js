const http = require('http');
const { app } = require('./src/app');
const { connectDB } = require('./src/config/db');
const { env } = require('./src/config/env');
const { TelehealthStompBroker } = require('../../modules/telehealth-signaling');

async function startServer() {
  await connectDB(env.MONGO_URI);

  const server = http.createServer(app);

  // Initialize Module 1: STOMP over WebSocket broker
  const stompBroker = new TelehealthStompBroker({
    httpServer: server,
    path: '/telehealth-ws',
    jwtSecret: env.JWT_SECRET,
  });

  // Make broker accessible in Express routes (for pharmacy alert broadcasts)
  app.set('stompBroker', stompBroker);

  server.listen(env.PORT, () => {
    console.log(`[SmartTelehealth] API Gateway listening at http://localhost:${env.PORT}`);
    console.log(`[SmartTelehealth] STOMP WebSocket listening at ws://localhost:${env.PORT}/telehealth-ws`);
  });
}

startServer().catch((err) => {
  console.error('[SmartTelehealth] Fatal startup error:', err);
  process.exit(1);
});
