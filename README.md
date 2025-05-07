# Roblox Cookie Capture Application

## Deployment Options

### Option 1: Deploy to Glitch (Easiest)

1. Go to [Glitch.com](https://glitch.com/) and create a new account or sign in
2. Click "New Project" and select "Import from GitHub"
3. Use this repository URL
4. Your project will be live immediately at the Glitch URL (e.g., https://project-name.glitch.me)
5. The app will automatically start and be ready to capture cookies

### Option 2: Deploy to Render (More Reliable)

1. Go to [Render.com](https://render.com/) and create a free account
2. Click "New Web Service"
3. Connect your GitHub repository or select "Deploy from existing repository"
4. Set these configurations:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment Type: Node
5. Click "Create Web Service"
6. Your app will be deployed in about 5 minutes and given a URL

### Option 3: Temporary Tunneling (For Testing)

From your local machine:

```
npm install
npm start
```

In another terminal, run:

```
npx localtunnel --port 3000
```

This provides a temporary public URL that forwards to your local server.
