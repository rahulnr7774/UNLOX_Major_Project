# Unfazed Therapist Dashboard

Unfazed is a therapist practice-management platform with separate React/Vite frontend and Express/MongoDB backend applications. It supports therapist and client accounts, scheduling, client management, notes, packages, payments, analytics, email notifications, and real-time chat.

## Project Structure

```text
Unfazed_Therapist_Dashboard/
	unfazed-backend/    Express API, MongoDB models, Socket.IO server
	unfazed-frontend/   React/Vite web application
```

The backend and frontend have independent `package.json` files and must be installed and started separately during local development.

## Requirements

- Node.js 20 or newer
- npm 10 or newer
- A MongoDB database (local MongoDB or MongoDB Atlas)
- Git

Optional integrations:

- Google OAuth client for Google sign-in
- Razorpay account for online payments
- SMTP account or Resend credentials for email notifications

Check the installed versions:

```powershell
node --version
npm --version
```

## Installation

From the repository root:

```powershell
cd Unfazed_Therapist_Dashboard\unfazed-backend
npm install

cd ..\unfazed-frontend
npm install
```

Or install both applications in one command from the repository root:

```powershell
npm install
```

The root `postinstall` script installs backend dependencies. The frontend dependencies still need to be installed with the command above if they are not already present.

## Backend Environment Variables

Create `Unfazed_Therapist_Dashboard/unfazed-backend/.env`:

```env
# Server
PORT=5000
CLIENT_URL=http://localhost:5173

# Required database and authentication configuration
MONGO_URI=mongodb://127.0.0.1:27017/unfazed
JWT_SECRET=replace-with-a-long-random-secret

# Optional Google OAuth configuration
GOOGLE_CLIENT_ID=your-google-oauth-client-id

# Optional Razorpay configuration
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret

# SMTP email configuration (used for notifications and invoices)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@example.com
EMAIL_PASSWORD=your-email-app-password

# Optional sender override
RESEND_FROM_EMAIL=Unfazed <your-email@example.com>
```

`MONGO_URI` is required for the backend to start. Use a MongoDB Atlas connection string when using Atlas, for example:

```env
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>/<database>?retryWrites=true&w=majority
```

For Gmail SMTP, use a Google app password rather than your normal account password. Keep `.env` files private and never commit real credentials.

## Frontend Environment Variables

Create `Unfazed_Therapist_Dashboard/unfazed-frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id
VITE_RAZORPAY_KEY_ID=your-razorpay-key-id
```

`VITE_API_URL` is used for both REST requests and Socket.IO chat connections. The frontend defaults to `http://localhost:5000` if it is omitted. Google and Razorpay variables are optional, but their related features will not work without them.

The Razorpay key ID is safe to expose in the browser; the Razorpay key secret and webhook secret must only exist in the backend environment.

## Google OAuth Setup

1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select a project and configure the OAuth consent screen.
3. Create an OAuth client ID for a web application.
4. Add `http://localhost:5173` to the authorized JavaScript origins.
5. Add the production frontend URL to the authorized origins before deployment.
6. Put the client ID in both backend `GOOGLE_CLIENT_ID` and frontend `VITE_GOOGLE_CLIENT_ID`.

## Razorpay Setup

1. Create or select a Razorpay account and obtain API keys.
2. Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in the backend.
3. Set `VITE_RAZORPAY_KEY_ID` in the frontend.
4. Configure a Razorpay webhook pointing to:

	 ```text
	 https://<backend-domain>/payments/webhook
	 ```

Use Razorpay test keys for local development and staging.

## Run Locally

Open two PowerShell terminals.

### Terminal 1: Backend

```powershell
cd Unfazed_Therapist_Dashboard\unfazed-backend
npm run dev
```

The backend runs at `http://localhost:5000`.

### Terminal 2: Frontend

```powershell
cd Unfazed_Therapist_Dashboard\unfazed-frontend
npm run dev
```

The frontend runs at `http://localhost:5173`.

Open `http://localhost:5173` in a browser. The backend health endpoint is:

```text
http://localhost:5000/health
```

Expected response:

```json
{
	"status": "ok",
	"service": "unfazed-api"
}
```

The API uses direct route prefixes such as `/auth`, `/therapists`, `/clients`, `/scheduling`, `/payments`, `/notes`, `/analytics`, `/leads`, and `/packages`; there is no `/api` prefix.

## Available Commands

### Backend

```powershell
npm run dev                 # Start with nodemon
npm start                   # Start production server
npm run dev:session         # Create a development session
npm run backfill:session-codes
```

The backend also contains `scripts/seed-analytics-demo.js` for seeding analytics data. It expects `DEMO_THERAPIST_ID` and `DEMO_CLIENT_ID`; inspect the script and set those values before running it when demo data is needed.

### Frontend

```powershell
npm run dev                 # Start Vite development server
npm run build               # Create a production build
npm run preview             # Preview the production build locally
npm run lint                # Run ESLint
```

## Production Build

Build the frontend:

```powershell
cd Unfazed_Therapist_Dashboard\unfazed-frontend
npm run build
npm run preview
```

The frontend build is generated in `unfazed-frontend/dist`. Set `VITE_API_URL` to the deployed backend URL before building, for example:

```env
VITE_API_URL=https://your-backend.example.com
```

Set the backend `CLIENT_URL` to the exact deployed frontend origin. Multiple allowed frontend origins can be supplied as a comma-separated value.

## Render Deployment: Backend

The root `render.yaml` already defines the backend service:

- Runtime: Node
- Root directory: `Unfazed_Therapist_Dashboard/unfazed-backend`
- Build command: `npm install`
- Start command: `npm start`
- Health check: `/health`

When creating the Render service, configure these environment variables in the Render dashboard:

```text
MONGO_URI
JWT_SECRET
CLIENT_URL
GOOGLE_CLIENT_ID                  optional
RAZORPAY_KEY_ID                   optional
RAZORPAY_KEY_SECRET               optional
EMAIL_HOST                        optional
EMAIL_PORT                        optional
EMAIL_USER                        optional
EMAIL_PASSWORD                    optional
RESEND_FROM_EMAIL                 optional
```

Render provides `PORT` automatically. After deployment, verify:

```text
https://<render-backend-domain>/health
```

## Vercel Deployment: Frontend

1. Import the repository into Vercel.
2. Set the project root to `Unfazed_Therapist_Dashboard/unfazed-frontend`.
3. Use `npm run build` as the build command.
4. Use `dist` as the output directory.
5. Add these Vercel environment variables:

	 ```text
	 VITE_API_URL=https://<render-backend-domain>
	 VITE_GOOGLE_CLIENT_ID=<google-client-id>
	 VITE_RAZORPAY_KEY_ID=<razorpay-key-id>
	 ```

6. Add the Vercel URL to Google OAuth authorized origins and set the backend `CLIENT_URL` to that URL.

The included `vercel.json` rewrites client-side routes to `index.html`, allowing React Router pages to load correctly after refresh.

## Troubleshooting

### Backend exits with `MONGO_URI is not configured`

Confirm that `.env` is inside `Unfazed_Therapist_Dashboard/unfazed-backend`, contains `MONGO_URI`, and that the backend is being started from that directory.

### Browser reports a CORS error

Set backend `CLIENT_URL` to the exact frontend origin, including the correct protocol and port. Do not add a trailing slash. Restart the backend after changing `.env`.

### Google sign-in is unavailable

Set both Google client ID variables and add the frontend origin to the Google OAuth client configuration. Restart Vite after changing frontend environment variables.

### Payments are unavailable

Set the Razorpay key ID in the frontend and both Razorpay keys in the backend. Use matching test or live credentials and configure the webhook secret only on the backend.

### Emails fail to send

Set `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, and `EMAIL_PASSWORD`. For Gmail, use an app password. Email-dependent approval and notification flows require working SMTP credentials.

### Chat does not connect

Ensure `VITE_API_URL` points to the running backend and that the backend `CLIENT_URL` allows the frontend origin. Socket.IO uses the same backend host as the REST API.

## Security Notes

- Never commit `.env` files, JWT secrets, database credentials, payment secrets, or email passwords.
- Use separate credentials for development, staging, and production.
- Keep `RAZORPAY_KEY_SECRET` and `JWT_SECRET` on the server only.
- Restrict MongoDB Atlas network access and database users in production.
- Use HTTPS for deployed frontend, API, OAuth, payment, and webhook URLs.



