const cookieParser = require('cookie-parser');
require('dotenv').config({ path: '.env' });
const jwt = require('jsonwebtoken');
const createServer = require('./createServer');
const db = require('./db');

const server = createServer();

// Use express middleware to handle cookies (JWT)
server.express.use(cookieParser());
// Use express middleware to populate current user
server.express.use(async (req, res, next) => {
  const { token } = req.cookies;
  if (token) {
    try {
      const { userId } = jwt.verify(token, process.env.APP_SECRET);
      const user = await db.query.user(
        { where: { id: userId } },
        `{ id, name, email, permissions }`
      );
      req.userId = userId;
      req.user = user;
    } catch { }
  }
  next();
});

server.start({
  cors: {
    credentials: true,
    origin: process.env.FRONTEND_URL,
  }
}, deets => {
  console.log(`Server is now running on port ${deets.port}`);
});
