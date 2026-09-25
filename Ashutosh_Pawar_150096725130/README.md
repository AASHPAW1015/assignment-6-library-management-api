# Library Management API

RESTful API for an institutional library. Firebase Firestore as the store,
JWT + bcrypt for role-based auth (student vs librarian), express-rate-limit
for abuse protection, and Swagger UI for live docs. Ships with a small plain
HTML frontend in `frontend/`.

## Live demo

- Frontend (Vercel): https://library-webapp-sable.vercel.app
- API (Render): https://assignment-6-library-management-api-2oy9.onrender.com
- Swagger UI: https://assignment-6-library-management-api-2oy9.onrender.com/api-docs

The API runs on Render's free tier, so the first request after a period of
inactivity can take up to a minute while the server wakes up.

## Setup

```bash
npm install
```

1. Firebase Console → Project Settings → Service Accounts → **Generate new
   private key**. Save the file as `serviceAccountKey.json` in this folder.
   (It is git-ignored — never commit it.)
2. Copy `.env.example` to `.env` and fill in the values:

   ```env
   PORT=5000
   JWT_SECRET=some_long_random_string
   LIBRARIAN_SECRET_KEY=super-secret-librarian-key
   ```

3. Run it:

   ```bash
   npm run dev      # auto-restart on change
   # or
   npm start
   ```

- API root: `http://localhost:5000/`
- Swagger UI: `http://localhost:5000/api-docs`
- Frontend: open `frontend/index.html` in a browser (or serve the folder).
  Opened locally it talks to `http://localhost:5000`, otherwise to the Render
  URL set in `frontend/config.js`.

## Deployment

- **API** on Render: root directory `Ashutosh_Pawar_150096725130`, build
  `npm install`, start `npm start`. Set `JWT_SECRET`, `LIBRARIAN_SECRET_KEY`
  and `FIREBASE_SERVICE_ACCOUNT` (the whole service account JSON, since the
  key file is not committed). Render provides `PORT`. `trust proxy` is on so
  the rate limiter sees each client's real IP behind Render's proxy.
- **Frontend** on Vercel: the `frontend/` folder deployed as static files.

## Roles

| Action                         | Student | Librarian | Public |
| ------------------------------ | :-----: | :-------: | :----: |
| Register / login               |   ✅    |    ✅     |   ✅   |
| Browse catalog                 |   ✅    |    ✅     |   ✅   |
| Add / edit / delete books      |   ❌    |    ✅     |   ❌   |
| Borrow / return                |   ✅    |    ❌     |   ❌   |
| View own history               |   ✅    |    ❌     |   ❌   |
| All borrow records / overdue   |   ❌    |    ✅     |   ❌   |

A librarian account can only be created by supplying `LIBRARIAN_SECRET_KEY`.

## Endpoints

| Method | Path                              | Access         |
| ------ | --------------------------------- | -------------- |
| POST   | `/api/auth/register`              | Public         |
| POST   | `/api/auth/register-librarian`    | Public + key   |
| POST   | `/api/auth/login`                 | Public         |
| GET    | `/api/auth/profile`               | Authenticated  |
| GET    | `/api/books`                      | Public         |
| GET    | `/api/books/:id`                  | Public         |
| POST   | `/api/books`                      | Librarian      |
| PUT    | `/api/books/:id`                  | Librarian      |
| DELETE | `/api/books/:id`                  | Librarian      |
| POST   | `/api/books/:id/borrow`           | Student        |
| POST   | `/api/books/:id/return`           | Student        |
| GET    | `/api/books/my-history`           | Student        |
| GET    | `/api/librarian/borrow-records`   | Librarian      |
| GET    | `/api/reports/overdue`            | Librarian      |

All `/api/*` routes are rate limited to 100 requests per 15 minutes per IP.

## Notes on the design

- **Atomic borrow/return.** Both run inside a Firestore transaction so
  `availableCopies` is changed and the borrow record is written together —
  two students grabbing the last copy at once can never push it below 0.
- **Firestore querying.** Multi-field lookups (e.g. a student's active borrow
  of one book) use equality-only filters so Firestore serves them from its
  automatic indexes — no composite index setup needed. Text search and
  history sorting are done in memory for the same reason.
- **Layout.** `config/` (Firebase + Swagger), `middleware/` (auth, RBAC, rate
  limiter), `models/` (Firestore data layer), `controllers/`, `routes/`.
