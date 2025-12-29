# Thurman Protocol

Thurman Protocol is a secondary loan marketplace platform. The protocol facilitates laon sales where originators create loan pool drafts and Thurman admins deploy them to the blockchain. Buyers purchase loans through loan pools and receive principal and interest payments from borrowers as the originator services the borrower loans.

## Architecture

This is a full-stack monorepo application consisting of:

- **Frontend (React)**: User interface for loan pool creation, discovery, and interaction
- **Backend (Express/Node.js)**: API server handling authentication, loan pool management, and blockchain interactions
- **Smart Contracts**: Thurman V2 contracts deployed on Base Sepolia
- **Database (PostgreSQL)**: Prisma ORM for data persistence

## Tech Stack

- **Frontend**: React, Material-UI, TypeScript
- **Backend**: Express, TypeScript, Prisma
- **Blockchain**: Circle Developer Controlled Wallets API, ethers.js, Base Sepolia
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with cookie-based sessions

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v16 or higher)
- npm or yarn
- PostgreSQL (v13 or higher)
- ngrok (for webhook testing)

You'll also need:

- A Circle Developer account with API credentials
- A Base Sepolia RPC endpoint
- A PostgreSQL database (local or hosted)

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd thurman-app
```

### 2. Install Dependencies

Install dependencies for both the server and web applications:

```bash
# Install server dependencies
cd server
npm install

# Install web dependencies
cd ../web
npm install
```

### 3. Environment Configuration

#### Server Environment Variables

Create a `.env` file in the `server` directory with the following variables:

```env
# Server Configuration
PORT=3001
API_PREFIX=/api
NODE_ENV=development

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/thurman_db?schema=public"

# JWT Authentication
JWT_SECRET_KEY=your_jwt_secret_key_here

# Circle Developer Controlled Wallets
CIRCLE_TEST_API_KEY=your_circle_api_key
CIRCLE_TEST_ENTITY_SECRET=your_circle_entity_secret
CIRCLE_TEST_ENTITY_SECRET_CIPHERTEXT=your_circle_entity_secret_ciphertext
WALLET_SET_ID=your_wallet_set_id

# Contract Addresses (Base Sepolia)
POOL_MANAGER_ADDRESS=your_deployed_pool_manager_address
POOL_MANAGER_CONTRACT_ADDRESS=your_deployed_pool_manager_address
```

**Getting Circle Credentials:**

1. Sign up at [Circle Developer Console](https://console.circle.com)
2. Create a new Developer Controlled Wallets project
3. Generate API key and entity secret
4. Create a wallet set and copy the ID
5. Add these credentials to your `.env` file

#### Web Environment Variables

Create a `.env` file in the `web` directory:

```env
REACT_APP_API_URL=http://localhost:3001/api
```

### 4. Database Setup

#### Create the Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create the database
CREATE DATABASE thurman_db;

# Exit psql
\q
```

#### Run Migrations

```bash
cd server

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed the database with admin user
npm run seed
```

The seed script creates a default admin user:
- **Email**: admin@thurman.com
- **Password**: admin123!
- **Role**: ADMIN

### 5. Webhook Setup with ngrok

Circle uses webhooks to notify your application about transaction state changes. For local development, you'll need to expose your local server using ngrok.

#### Install ngrok

```bash
# macOS
brew install ngrok

# Or download from https://ngrok.com/download
```

#### Start ngrok Tunnel

```bash
# Expose your local server (default port 3001)
ngrok http 3001
```

You'll see output like:
```
Forwarding   https://abc123.ngrok.io -> http://localhost:3001
```

#### Configure Circle Webhooks

1. Go to [Circle Developer Console](https://console.circle.com)
2. Navigate to your Developer Controlled Wallets project
3. Go to **Webhooks** section
4. Click **Add Endpoint**
5. Add your ngrok URL with the webhook path:
   ```
   https://abc123.ngrok.io/api/webhooks/circle
   ```
6. Subscribe to the following events:
   - `transaction.created`
   - `transaction.confirmed`
   - `transaction.failed`

#### Test Webhook Connection

Circle provides a test webhook button. Click it to verify your endpoint is receiving notifications correctly.

**Important Notes:**
- ngrok URLs change each time you restart ngrok (unless you have a paid account)
- Remember to update the webhook URL in Circle Console when ngrok restarts
- Keep ngrok running while developing to receive transaction updates

### 6. Start the Application

#### Start the Server

```bash
cd server
npm run dev
```

The server will start on `http://localhost:3001`

#### Start the Web Application

```bash
cd web
npm start
```

The web application will start on `http://localhost:3000`

## Project Structure

```
thurman-app/
├── server/                 # Backend application
│   ├── src/
│   │   ├── config/        # Configuration files
│   │   ├── middleware/    # Express middleware (auth, etc.)
│   │   ├── prisma/        # Database schema and models
│   │   │   ├── schema.prisma
│   │   │   ├── seed.ts
│   │   │   └── models/
│   │   ├── routes/        # API route handlers
│   │   ├── services/      # Business logic and external integrations
│   │   │   ├── auth.ts
│   │   │   ├── circle.ts
│   │   │   ├── depositStateManager.ts
│   │   │   └── eventMonitoring.ts
│   │   ├── utils/         # Utility functions
│   │   └── app.ts         # Express app entry point
│   ├── .env               # Server environment variables
│   └── package.json
│
└── web/                   # Frontend application
    ├── public/
    ├── src/
    │   ├── components/    # React components
    │   ├── contexts/      # React contexts (auth, etc.)
    │   ├── hooks/         # Custom React hooks
    │   ├── pages/         # Page components
    │   ├── services/      # API client services
    │   ├── types/         # TypeScript type definitions
    │   └── App.tsx        # React app entry point
    ├── .env               # Web environment variables
    └── package.json
```

## Key Features

### User Management
- JWT-based authentication with cookie sessions
- Role-based access control (ADMIN, USER)
- Circle Developer Controlled Wallets integration
- Automatic wallet creation on signup

### Loan Pool Workflow
1. **Creation**: Users upload loan data via CSV and fill out pool metadata
2. **Approval**: Admins review and approve/reject loan pools
3. **Deployment**: Two-phase blockchain deployment:
   - Phase 1: Pool creation
   - Phase 2: Loan initialization
4. **User Interaction**: Users can discover pools and make deposits

### Real-Time Updates
- Server-Sent Events (SSE) for deployment progress
- Webhook-based transaction monitoring
- In-memory state management for deposit tracking

## Development Workflow

### Database Migrations

When you modify the Prisma schema:

```bash
cd server

# Create a new migration
npx prisma migrate dev --name your_migration_name

# Reset database (warning: deletes all data)
npx prisma migrate reset

# Regenerate Prisma client
npx prisma generate
```

### Testing Webhooks Locally

1. Start ngrok: `ngrok http 3001`
2. Update webhook URL in Circle Console
3. Make a test transaction or click "Test" in Circle Console
4. Monitor server logs for webhook processing

### Common Commands

```bash
# Server
cd server
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Run production build
npm run seed         # Seed database with admin user

# Web
cd web
npm start            # Start development server
npm run build        # Build for production
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/logout` - Logout current user
- `GET /api/auth/me` - Get current user details

### Loan Pools
- `POST /api/loan-pool/create` - Create new loan pool (multipart form with CSV)
- `GET /api/loan-pool/user` - Get user's loan pools
- `GET /api/loan-pool/pending` - Get pending pools (admin)
- `GET /api/loan-pool/active` - Get active/deployed pools
- `POST /api/loan-pool/approve/:id` - Approve loan pool (admin)
- `POST /api/loan-pool/reject/:id` - Reject loan pool (admin)
- `GET /api/loan-pool/:id` - Get loan pool details

### Admin
- `POST /api/admin/deploy/:id` - Deploy approved pool to blockchain (SSE)

### Webhooks
- `POST /api/webhooks/circle` - Circle transaction webhook handler

## Troubleshooting

### Database Connection Issues

If you can't connect to the database:

1. Verify PostgreSQL is running: `brew services list` (macOS) or `systemctl status postgresql` (Linux)
2. Check DATABASE_URL in `.env` has correct credentials
3. Ensure the database exists: `psql -U postgres -l`

### Webhook Not Receiving Events

1. Verify ngrok is running and forwarding to port 3001
2. Check webhook URL in Circle Console matches your ngrok URL
3. Look for webhook events in Circle Console > Webhooks > Logs
4. Check server logs for incoming requests

### Circle API Errors

1. Verify API keys are correct in `.env`
2. Check you're using the test environment credentials
3. Ensure wallet set ID is valid
4. Review Circle API documentation for rate limits

### Prisma Client Not Found

```bash
cd server
npx prisma generate
```

## Production Deployment

For production deployment:

1. Set `NODE_ENV=production`
2. Use a production-grade PostgreSQL database
3. Configure a permanent webhook URL (not ngrok)
4. Use production Circle API credentials
5. Set secure JWT secret
6. Enable HTTPS
7. Configure CORS appropriately

## Resources

- [Circle Developer Docs](https://developers.circle.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Base Sepolia Testnet](https://docs.base.org/network-information)
- [React Documentation](https://react.dev/)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review server logs for error messages
3. Verify environment variables are set correctly
4. Check Circle Console for webhook delivery status

## License

GNU GENERAL PUBLIC LICENSE
