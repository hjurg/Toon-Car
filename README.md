<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/1548a2fc-f2cb-4001-b3aa-eb8b251fec2b

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`



## Reverse proxy (HTTPS)

No special path env vars required. The client uses relative URLs; the server
auto-rewrites a single path prefix (e.g. `/ralli/api` → `/api`).

Example nginx:

```nginx
# Match both /ralli and /ralli/...
location /ralli/ {
  proxy_pass http://127.0.0.1:3001/;  # strip /ralli for upstream
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
  proxy_set_header Host $host;
  proxy_set_header X-Forwarded-Proto $scheme;
}
location = /ralli {
  return 301 /ralli/;
}
```

Also works if the proxy does **not** strip the prefix (server rewrites automatically).
