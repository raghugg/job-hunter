# Cloudflare Worker - Gemini API Proxy

This Worker acts as a secure proxy between the frontend and Google Gemini API, preventing user API keys from being exposed in browser DevTools.

## Setup

### 1. Install Wrangler CLI (if not already installed)

```bash
npm install -g wrangler
```

### 2. Login to Cloudflare

```bash
wrangler login
```

### 3. Test Locally

```bash
wrangler dev
```

This will start the Worker on `http://localhost:8787`

### 4. Deploy to Production

```bash
wrangler deploy
```

After deployment, you'll get a URL like:
```
https://job-hunters-gemini-proxy.YOUR_SUBDOMAIN.workers.dev
```

### 5. Update Frontend Environment Variable

Copy the Worker URL from step 4 and update `/web/.env.production`:

```env
VITE_WORKER_URL=https://job-hunters-gemini-proxy.YOUR_SUBDOMAIN.workers.dev
```

### 6. (Optional) Lock Down CORS

For production, update `gemini-proxy.js` to only allow your domain:

```javascript
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://yourdomain.com',
  // ...
};
```

Then redeploy: `wrangler deploy`

## Testing

### Local Test

1. Terminal 1:
   ```bash
   cd workers
   wrangler dev
   ```

2. Terminal 2:
   ```bash
   cd web
   npm run dev
   ```

3. Open browser to the Vite dev server URL
4. Enter a Gemini API key and test the Resume Checker

### Production Test

After deploying both Worker and frontend:

1. Visit your deployed site
2. Enter a Gemini API key
3. Test Resume Checker
4. Open DevTools → Network tab
5. Verify requests go to your Worker URL (not Gemini directly)
6. Verify API key is NOT visible in request URLs or headers

## Troubleshooting

### CORS Errors

If you see CORS errors in the browser console:
- Make sure `Access-Control-Allow-Origin` is set to `*` for testing
- Check that the Worker is deployed and accessible
- Verify the `VITE_WORKER_URL` environment variable is correct

### Worker Not Found

If requests fail with 404:
- Run `wrangler deploy` to ensure Worker is deployed
- Check the Worker URL is correct in `.env.production`
- Rebuild frontend after updating environment variables

### API Errors

If Gemini API calls fail:
- Verify the API key is valid
- Check Gemini API quota/limits
- Look at Worker logs: `wrangler tail`

## Cost

Cloudflare Workers Free Tier:
- 100,000 requests per day
- 10ms CPU time per request
- **Cost: $0/month** for normal usage

## Security

**What this protects against:**
- ✅ API keys visible in browser DevTools Network tab
- ✅ API keys in URL query parameters
- ✅ API keys persisted in localStorage
- ✅ Easier XSS exploitation

**What this doesn't protect against:**
- ⚠️ XSS that intercepts the input field directly
- ⚠️ User sharing their own API key

## Architecture

```
User Browser → Cloudflare Worker → Google Gemini API
   (key in POST body)    (key in header)
```

The key is:
1. Entered in the browser (React state only)
2. Sent in POST body to Worker (HTTPS encrypted)
3. Worker adds key to Gemini request header
4. Response returned to browser
5. Key discarded (never stored)
