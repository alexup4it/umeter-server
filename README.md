# UMeter Server

API server for collecting data from UMeter devices, built with Next.js + Prisma.

## Installation

```bash
npm install
```

This will automatically set up Git hooks via [Husky](https://typicode.github.io/husky/) (through the `prepare` script).

## Database Setup

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Edit `.env` and set your MySQL connection parameters:
```
DATABASE_URL="mysql://user:password@localhost:3306/umeter"
HMAC_SECRET="your-32-byte-hex-secret"
```

3. Sync the schema with the database:
```bash
npm run db:push
```

Or use migrations for production:
```bash
npm run db:migrate
```

## Running

```bash
npm run dev
```

## API Endpoints

All API endpoints use HMAC-SHA256 authentication. Responses are signed via the `Authorization` header.

### GET /api/time
Returns the current server time.

**Response:**
```json
{ "status": "ok", "ts": 1234567890 }
```

### POST /api/info
Saves device information.

**Request body:**
```json
{
  "uid": "device-id",
  "ts": 1234567890,
  "name": "Device Name",
  "bl_git": "git-hash",
  "bl_status": 0,
  "app_git": "git-hash",
  "app_ver": 1,
  "mcu": "STM32",
  "apn": "internet",
  "url_ota": "http://...",
  "url_app": "http://...",
  "period_upload": 60,
  "period_sensors": 10,
  "period_anemometer": 100,
  "sens": 1
}
```

### POST /api/cnet
Saves cellular network information.

**Request body:**
```json
{
  "uid": "device-id",
  "ts": 1234567890,
  "mcc": 250,
  "mnc": 1,
  "lac": 1234,
  "cid": 5678,
  "lev": -70
}
```

### POST /api/data
Saves sensor data. Fields `temp`, `hum`, `wind_direction`, `wind_speed_avg`, `wind_speed_max`, `wind_speed_min` are base64-encoded.

**Request body:**
```json
{
  "uid": "device-id",
  "ts": 1234567890,
  "ticks": 123456,
  "bat": 4200,
  "temp": "base64...",
  "hum": "base64...",
  "wind_direction": "base64...",
  "wind_speed_avg": "base64...",
  "wind_speed_max": "base64...",
  "wind_speed_min": "base64...",
  "dist": 100,
  "tamper": false
}
```

## Scripts

- `npm run dev` — start in development mode
- `npm run build` — build for production
- `npm run start` — start production server
- `npm run db:generate` — generate Prisma Client
- `npm run db:push` — sync schema with database
- `npm run db:migrate` — create a migration
- `npm run db:studio` — launch Prisma Studio (database UI)

## Git Hooks

Git hooks are managed by [Husky](https://typicode.github.io/husky/) and set up automatically on `npm install`.

| Hook | Action | Tool |
|------|--------|------|
| `pre-commit` | Lint staged files | [lint-staged](https://github.com/lint-staged/lint-staged) + ESLint |
| `pre-push` | Full production build | `next build` |

If hooks weren't installed (e.g. you cloned before dependencies were installed), run:

```bash
npm run prepare
```
