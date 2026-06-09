const config = require('./config/env');
const express = require('express');
const session = require('express-session');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const jiraRoutes = require('./routes/jiraRoutes');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

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
      sameSite: config.isDev ? 'lax' : 'strict',
      maxAge: 8 * 60 * 60 * 1000, // 8 hours
    },
  })
);

app.use('/auth', authRoutes);
app.use('/api/jira', jiraRoutes);

// Health check
app.get('/health', (req, res) => res.json({ ok: true }));

app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`[server] Running on http://localhost:${config.port}`);
});
