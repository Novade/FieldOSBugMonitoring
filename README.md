# Field OS — Bug Monitoring Dashboard

Internal dashboard that displays live Jira bug data. Access is restricted to users with a Novade Atlassian account.

---

## Stack

| Layer | Tech |
|---|---|
| Backend | Node.js + Express (MVC) |
| Frontend | React 18 + Vite + Tailwind CSS |
| Charts | Chart.js + react-chartjs-2 |
| Auth | Atlassian OAuth 2.0 (3LO) |
| Sessions | express-session (in-memory) |

---

## Setup

### 1. Register the Atlassian OAuth App

1. Go to [developer.atlassian.com/console/myapps](https://developer.atlassian.com/console/myapps/) and sign in.
2. Click **Create** → **OAuth 2.0 integration** → name it `Bug Dashboard` → **Create**.
3. In the sidebar, click **Authorization** → under "OAuth 2.0 (3LO)", click **Add**.
4. Set the callback URL:
   - Development: `http://localhost:3001/auth/callback`
   - Production: `https://your-domain.com/auth/callback`
5. In the sidebar, click **Permissions** → find **Jira API** → **Add** → **Edit Scopes**.
   Enable: `read:jira-work`, `read:jira-user`
6. In the sidebar, click **Settings** → copy the **Client ID** and **Secret**.

### 2. Create a Jira API Token (Service Account)

1. Log in as the account you want to use for data fetching.
2. Go to [id.atlassian.com/manage-profile/security/api-tokens](https://id.atlassian.com/manage-profile/security/api-tokens).
3. Click **Create API token** → name it `bug-dashboard` → copy the token.

### 3. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and fill in all values:

```env
ATLASSIAN_CLIENT_ID=        # From step 1
ATLASSIAN_CLIENT_SECRET=    # From step 1
ATLASSIAN_CALLBACK_URL=http://localhost:3001/auth/callback

JIRA_BASE_URL=https://novade.atlassian.net
JIRA_CLOUD_ID=9cf2bfa7-9e6c-47ef-b29b-05663e0e99fe
JIRA_USER_EMAIL=            # Email of the service account from step 2
JIRA_API_TOKEN=             # Token from step 2

SESSION_SECRET=             # Any long random string
PORT=3001
NODE_ENV=development
```

Generate a session secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Running Locally

```bash
# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install

# In one terminal: start backend
cd backend && npm run dev

# In another terminal: start frontend
cd frontend && npm run dev
```

Open [http://localhost:5173](http://localhost:5173). You will be redirected to the Atlassian login page. If you are already logged into Jira, it is one click.

---

## Project Structure

```
bug-dashboard/
├── backend/
│   ├── config/
│   │   ├── env.js          # Validates and exports all env vars
│   │   └── jira.js         # JQL queries and Jira field constants
│   ├── controllers/
│   │   ├── authController.js   # OAuth flow, session management
│   │   └── jiraController.js   # Jira data fetching with pagination
│   ├── middleware/
│   │   ├── auth.js             # Session guard (requireAuth)
│   │   └── errorHandler.js     # Global error handler (sanitizes errors)
│   ├── models/
│   │   └── issueModel.js       # Transforms raw Jira issue → app shape
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── jiraRoutes.js
│   └── server.js
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── auth/           # LoginPage
│       │   ├── backlog/        # BacklogTable, FilterBar, DrillBadge
│       │   ├── charts/         # One component per chart (9 charts)
│       │   ├── common/         # Card, Pill, Banner, Tooltip, ErrorBoundary
│       │   ├── dashboard/      # BugsDashboard, RegressionDashboard
│       │   ├── kpi/            # KpiCard, KpiRow
│       │   └── layout/         # TopBar, TabBar
│       ├── constants/jira.js   # PORDER, PC, statuses, targets
│       ├── context/            # AuthContext
│       ├── hooks/              # useJiraData
│       ├── services/           # authService, jiraService (all API calls)
│       └── utils/              # dateUtils, issueUtils, chartPlugins
├── .env                        # Never committed
├── .env.example
├── .gitignore
└── README.md
```

---

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/auth/atlassian` | No | Initiates Atlassian OAuth |
| GET | `/auth/callback` | No | OAuth callback, creates session |
| DELETE | `/auth/logout` | No | Destroys session |
| GET | `/auth/session` | No | Returns current session info |
| GET | `/api/jira/bugs` | Yes | Returns all bugs (paginated, all pages) |
| GET | `/api/jira/regressions` | Yes | Returns all regression bugs |

---

## Deploying

### Backend

The backend can be deployed to any Node.js host (Render, Railway, Fly.io, etc.).

1. Set all environment variables on your platform.
2. Set `NODE_ENV=production`.
3. Update `ATLASSIAN_CALLBACK_URL` to your production URL.
4. Update the OAuth app in [developer.atlassian.com](https://developer.atlassian.com) to add your production callback URL.
5. Run: `npm start`

### Frontend

```bash
cd frontend && npm run build
```

The `dist/` folder can be hosted on any static host (Netlify, Vercel, etc.) or served by your backend.

For production with the frontend served by the backend, add to `server.js`:
```js
const path = require('path');
app.use(express.static(path.join(__dirname, '../frontend/dist')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../frontend/dist/index.html')));
```

---

## Security Notes

- API tokens and secrets are never sent to the frontend.
- All Jira API calls happen server-side with Basic Auth.
- Session cookies are `httpOnly` and `secure` in production.
- OAuth state parameter prevents CSRF on the login flow.
- Stack traces are never exposed to the client.
