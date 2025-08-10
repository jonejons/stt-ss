# Environment Management

This project supports multiple environments with different configurations.

## Available Environments

### 1. Development Environment
- **File**: `.env.development`
- **Docker Compose**: `docker-compose.dev.yml`
- **Purpose**: Local development with hot reload
- **Features**:
  - Debug logging
  - Lenient CORS settings
  - Higher rate limits
  - Live reload enabled

### 2. Production Environment
- **File**: `.env.production`
- **Docker Compose**: `docker-compose.prod.yml`
- **Purpose**: Production deployment
- **Features**:
  - Error/warn logging only
  - Strict CORS settings
  - Lower rate limits
  - Health checks enabled
  - Non-root user for security

### 3. Docker Environment
- **File**: `.env.docker`
- **Docker Compose**: `docker-compose.yml`
- **Purpose**: Default Docker setup
- **Features**:
  - Container-to-container communication
  - Balanced settings for testing

## Usage

### Using the Management Script

```bash
# Start development environment
./docker-env.sh up dev

# Start production environment
./docker-env.sh up prod

# Start default environment
./docker-env.sh up default

# View logs for development
./docker-env.sh logs dev

# Stop production environment
./docker-env.sh down prod

# Build development environment
./docker-env.sh build dev

# Check service status
./docker-env.sh status dev
```

### Manual Docker Compose Commands

```bash
# Development
docker compose -f docker-compose.dev.yml up -d

# Production
docker compose -f docker-compose.prod.yml up -d

# Default
docker compose up -d
```

### Running Locally (Without Docker)

```bash
# Copy environment file
cp .env.development .env

# Install dependencies
pnpm install

# Run database migrations
pnpm run prisma:migrate:dev

# Start development server
pnpm run start:dev
```

## Environment Variables

Each environment file contains different configurations:

- **DATABASE_URL**: Database connection string
- **REDIS_URL**: Redis connection string
- **JWT_SECRET**: JWT signing secret (change in production!)
- **NODE_ENV**: Environment mode
- **LOG_LEVEL**: Logging verbosity
- **CORS_ORIGIN**: Allowed CORS origins
- **S3_ENDPOINT**: MinIO/S3 endpoint

## Port Mappings

### Development Environment
- App: `3001:3000`
- PostgreSQL: `5433:5432`
- Redis: `6380:6379`
- MinIO: `9001:9000`, `9002:9001`

### Production Environment
- App: `3000:3000`
- PostgreSQL: `5432:5432`
- Redis: `6379:6379`

### Default Environment
- App: `3000:3000`
- PostgreSQL: `5432:5432`
- Redis: `6379:6379`

## Security Notes

⚠️ **Important**: Always change the JWT secrets in production!

- Update `JWT_SECRET` and `REFRESH_TOKEN_SECRET` in `.env.production`
- Use strong, random secrets for production deployment
- Never commit production secrets to version control

## Troubleshooting

1. **Port conflicts**: Check if ports are already in use
2. **Database connection**: Ensure PostgreSQL is running
3. **Redis connection**: Ensure Redis is running
4. **Environment variables**: Check that the correct `.env` file is loaded

## Database Migrations

```bash
# Development
pnpm run prisma:migrate:dev

# Production (after deployment)
pnpm run prisma:migrate:deploy
```
