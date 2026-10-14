# TalentFlow HRMS

TalentFlow HRMS is a web-based human resources management system for managing employee operations across the employee lifecycle. The repository contains a React/Vite frontend and an Express/TypeScript API backed by MongoDB.

## Features

- **Employee center:** employee profiles, directory, documents, digital locker, and HR document requests
- **Attendance and leave:** attendance records, shifts, holidays, leave approvals, and attendance corrections
- **Recruitment:** requisitions, job openings, candidate applications, interviews, offers, onboarding, and referrals
- **Performance:** review cycles, goals, performance improvement plans, and analytics
- **Payroll:** payroll operations, salary slips, payroll policies, referral rewards, and payroll-related tickets
- **People operations:** employee transfers, promotions, offboarding, meetings, and disciplinary actions
- **Administration:** user and role management, company structure, integrations, system settings, and audit logs
- **Reporting and executive views:** HR reports, recruitment analytics, and executive dashboards

The application exposes features according to the signed-in user's role and permissions.

## Technology

- **Frontend:** React 18, Vite 6, React Router, Tailwind CSS, and TanStack Query
- **Backend:** Node.js, Express 4, TypeScript, and Mongoose
- **Database:** MongoDB
- **Authentication:** JWT-based API authentication

## Repository layout

```text
frontend/   React application and Vite configuration
backend/    Express API, MongoDB models, routes, and scripts
README.md   Project documentation
```

## Prerequisites

- Node.js and npm
- A MongoDB database and connection URI
- Optional service credentials for integrations you plan to use, such as SMTP, Cloudinary, or Google OAuth

## Local setup 

Install dependencies in each application folder:

```bash
cd backend
npm install

cd ../frontend
npm install
```

Create `backend/.env` with the backend settings needed for your environment:

```dotenv
PORT=5001
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/talentflow
ACCESS_TOKEN_SECRET=replace-with-a-long-random-secret
JWT_SECRET=replace-with-a-different-long-random-secret
FRONTEND_URL=http://localhost:5173
```

For a MongoDB Atlas database, use the connection string issued for your own cluster in `MONGODB_URI`. Never commit `.env` files or service credentials.

The frontend defaults to `http://localhost:5001/api`. To point it at another API, create `frontend/.env`:

```dotenv
VITE_API_URL=http://localhost:5001/api
```

Start the API and frontend in separate terminals:

```bash
# Terminal 1
cd backend
npm run dev
```

```bash
# Terminal 2
cd frontend
npm run dev
```

Open the Vite URL shown in the frontend terminal (the default is `http://localhost:5173`). The API health check is available at `http://localhost:5001/health`.

## Backend configuration

The API reads configuration from `backend/.env` when started from the `backend` directory. In addition to the local settings above, the following variables are used when their features are enabled:

| Variable(s) | Purpose |
| --- | --- |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `SMTP_FROM_EMAIL`, `SMTP_FROM_NAME` | Outgoing email |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Cloudinary document storage |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `GOOGLE_REFRESH_TOKEN` | Google integration |
| `REFRESH_TOKEN_EXPIRE`, `ACCESS_TOKEN_EXPIRE` | Token expiration settings |
| `SALARY_ENCRYPTION_KEY` | Salary data encryption |
| `PAYROLL_DISBURSE_SECRET` | Payroll disbursement protection |
| `FRONTEND_URL` | Frontend links and allowed application origin |

Some optional seed and dashboard settings are also read from the backend environment, including `FINANCE_MANAGER_SEED_EMAIL`, `FINANCE_MANAGER_SEED_PASSWORD`, `SEED_PAYROLL_SAMPLE`, and the `CEO_*` target variables.

## Scripts

Run these commands from the relevant application folder.

| Folder | Command | Description |
| --- | --- | --- |
| `frontend` | `npm run dev` | Start the Vite development server |
| `frontend` | `npm run build` | Create a production frontend build |
| `frontend` | `npm run preview` | Preview a production frontend build locally |
| `frontend` | `npm run lint` | Run ESLint |
| `backend` | `npm run dev` | Start the API with automatic reload |
| `backend` | `npm run build` | Compile the TypeScript API into `backend/dist` |
| `backend` | `npm start` | Run the compiled API |
| `backend` | `npm test` | Run backend Vitest tests |
| `backend` | `npm run bootstrap:admin` | Run the guarded initial-admin bootstrap |

The initial-admin bootstrap requires `INITIAL_ADMIN_EMAIL`, `INITIAL_ADMIN_PASSWORD`, and `INITIAL_ADMIN_FIRST_NAME` in `backend/.env`. It is disabled when `NODE_ENV=production`, requires the configured development database, and can be used only once. Do not use production credentials for local development.

## API overview

The backend serves JSON endpoints under `/api`, organized by modules such as `/api/auth`, `/api/employees`, `/api/attendance`, `/api/leaves`, `/api/requisitions`, `/api/job-openings`, `/api/applications`, `/api/payroll`, and `/api/performance`. `GET /api` returns the API endpoint overview; `GET /health` reports API and MongoDB connection status.

## Security

- Keep `.env` files, database connection strings, JWT secrets, and third-party credentials out of version control.
- The Firebase service-account key is not included. `backend/config/serviceAccountKey.json` is ignored by Git; provide credentials through a secure deployment secret mechanism if a feature requires them.
- Use unique, randomly generated secrets outside local development. Rotate credentials that have been exposed.
- Configure production CORS, allowed origins, database access, and file storage for your deployment rather than relying on local defaults.

## License

No project license is specified in this repository. Contact the repository owner before redistributing or using the project beyond the permissions granted by its owner.
