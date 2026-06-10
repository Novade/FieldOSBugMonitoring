const config = require('./config/env');
const express = require('express');
const path = require('path');
const session = require('express-session');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const jiraRoutes = require('./routes/jiraRoutes');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

if (!config.isDev) {
  app.set('trust proxy', 1);
}

app.use(express.json());

// Allow requests from the Vite dev server in development
app.use(
  cors({
    origin: config.isDev ? /^http:\/\/localhost:\d+$/ : false,
    credentials: true,
  })
);

app.use(
  session({
    secret: config.session.secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: !config.isDev,
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 * 1000, // 8 hours
    },
  })
);

app.use('/auth', authRoutes);
app.use('/api/jira', jiraRoutes);

// Health check
app.get('/health', (req, res) => res.json({ ok: true }));

if (!config.isDev) {
  const frontendDistPath =
    process.env.FRONTEND_DIST_DIR || path.join(__dirname, '../frontend/dist');

  app.use(express.static(frontendDistPath));

  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`[server] Running on http://localhost:${config.port}`);
});
