# Library Management API

RESTful API for an institutional library. Firebase Firestore as the store,
JWT + bcrypt for role-based auth (student vs librarian), express-rate-limit
for abuse protection, and Swagger UI for live docs. Ships with a small plain
HTML frontend in `frontend/`.

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
