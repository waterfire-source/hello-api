# IP Checker API with Geolocation

A Node.js API that detects user locations based on IP addresses using the IP2Location service. Works with any request - no specific message required!

## Features

- 🌍 **Real-time IP Geolocation**: Uses IP2Location API for accurate location data
- 🚀 **Vercel Ready**: Optimized for serverless deployment
- ⏰ **Cron Jobs**: Automated health checks every 6 hours
- 📍 **Rich Location Data**: City, country, region, coordinates, timezone, and more
- 🔒 **Environment Variables**: Secure API key management
- ✨ **Flexible Input**: Works with any request body - no specific format required

## API Endpoints

- `POST /api/ip-checker-sample/` - Send **any request** to get IP location data
- `GET /api/ip-checker-sample/` - Get API information
- `GET /api/health` - Health check endpoint (used by cron jobs)
- `GET /` - API documentation
- `POST /api` - Legacy endpoint (deprecated, redirects to new endpoint)

## Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the server**:
   ```bash
   npm run dev
   ```

3. **Test the API**:
   ```bash
   # Test with any JSON body - no specific message required!
   curl -X POST http://localhost:3000/api/ip-checker-sample/ \
     -H "Content-Type: application/json" \
     -d '{"any": "data", "you": "want"}'
   
   # Or even an empty body
   curl -X POST http://localhost:3000/api/ip-checker-sample/ \
     -H "Content-Type: application/json" \
     -d '{}'
   ```

## Vercel Deployment

### Prerequisites

- [Vercel CLI](https://vercel.com/cli) installed
- [GitHub](https://github.com) account (recommended)
- IP2Location API key

### Step 1: Install Vercel CLI

```bash
npm i -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

### Step 3: Deploy

```bash
vercel
```

Follow the prompts:
- Set up and deploy? → `Y`
- Which scope? → Select your account
- Link to existing project? → `N`
- What's your project's name? → `ip-checker-api` (or press Enter for default)
- In which directory is your code located? → `./` (press Enter)
- Want to override the settings? → `N`

### Step 4: Set Environment Variables

```bash
vercel env add IP2LOCATION_API_KEY
```

Enter your IP2Location API key when prompted.

### Step 5: Deploy to Production

```bash
vercel --prod
```

## Cron Jobs

The API includes automated cron jobs that run every 6 hours:

- **Schedule**: `0 */6 * * *` (every 6 hours)
- **Endpoint**: `/api/health`
- **Purpose**: Keep the serverless function warm and monitor health

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `IP2LOCATION_API_KEY` | Your IP2Location API key | Yes |

## Response Format

### Success Response
```json
{
  "message": "IP location detected successfully",
  "address": "Cota, Colombia",
  "ip": "2800:484:6483:2000:44c5:ad1d:1e48:a88d",
  "location": {
    "city": "Cota",
    "country": "Colombia",
    "region": "Cundinamarca",
    "latitude": 4.8095,
    "longitude": -74.09818,
    "zipCode": "250010",
    "timezone": "-05:00",
    "asn": "14080",
    "isProxy": false
  },
  "timestamp": "2024-01-XX...",
  "status": "success"
}
```

### Error Response
```json
{
  "message": "IP check completed",
  "address": "Location unavailable",
  "ip": "127.0.0.1",
  "timestamp": "2024-01-XX...",
  "status": "success",
  "note": "Could not determine exact location: API error"
}
```

## Project Structure

```
hello-api/
├── api/
│   └── index.js          # Main API code
├── vercel.json           # Vercel configuration
├── package.json          # Dependencies and scripts
└── README.md            # This file
```

## Monitoring

- **Vercel Dashboard**: Monitor function invocations and performance
- **Cron Job Logs**: Check `/api/health` endpoint logs
- **Function Logs**: View serverless function execution logs

## Troubleshooting

### Common Issues

1. **Environment Variable Not Set**
   - Ensure `IP2LOCATION_API_KEY` is set in Vercel
   - Use `vercel env ls` to check current variables

2. **Function Timeout**
   - Default timeout is 30 seconds
   - Check IP2Location API response times

3. **Cron Job Not Working**
   - Verify the cron schedule in `vercel.json`
   - Check function logs in Vercel dashboard

### Support

- Check Vercel function logs
- Verify IP2Location API key validity
- Test endpoints locally first

## License

ISC
