# 🚀 QUICK DEPLOYMENT GUIDE
**Target:** restaurant.alexandratechlab.com

---

## Option 1: Netlify Drag & Drop (FASTEST - 5 minutes)

### Steps:
1. **Download the dist folder**
   ```bash
   # If on server, compress it
   cd /root/Restaurant-light-control2
   tar -czf restaurant-pos-dist.tar.gz dist/
   # Download this file to your local machine
   ```

2. **Go to Netlify Drop**
   - Open: https://app.netlify.com/drop
   - Login to your Netlify account
   - Drag and drop the `dist` folder (or extract the tar.gz first)

3. **Site Deployed!**
   - You'll get a URL like: `random-name-123456.netlify.app`
   - Site is live immediately!

4. **Add Custom Domain**
   - Click "Domain settings" in Netlify
   - Click "Add custom domain"
   - Enter: `restaurant.alexandratechlab.com`
   - Netlify will show DNS instructions

5. **Configure DNS**
   - Go to your domain registrar (where alexandratechlab.com is hosted)
   - Add CNAME record:
     ```
     Type: CNAME
     Name: restaurant
     Value: random-name-123456.netlify.app
     TTL: 3600
     ```
   - Wait 5-30 minutes for DNS propagation

6. **SSL Auto-Configured!**
   - Netlify automatically provisions SSL certificate
   - Site will be accessible at: https://restaurant.alexandratechlab.com

---

## Option 2: Netlify CLI (For Developers)

```bash
# 1. Login to Netlify
netlify login

# 2. Deploy
cd /root/Restaurant-light-control2
netlify deploy --prod --dir=dist

# 3. Follow prompts to create new site or select existing

# 4. Add custom domain in Netlify dashboard
```

---

## Option 3: GitHub + Netlify (Best for CI/CD)

### Setup Once:
1. **Go to Netlify Dashboard**
   - Click "New site from Git"
   - Choose GitHub
   - Select repository: `ap8114/Restaurant-light-control2`

2. **Build Settings**
   ```
   Build command: npm run build
   Publish directory: dist
   ```

3. **Deploy!**
   - Click "Deploy site"
   - Wait 2-3 minutes for build

4. **Add Custom Domain**
   - Follow same steps as Option 1

### Benefit:
- Every push to main branch auto-deploys
- No manual uploads needed

---

## Option 4: Vercel (Alternative Platform)

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Deploy
cd /root/Restaurant-light-control2
vercel --prod

# 4. Follow prompts

# 5. Add custom domain in Vercel dashboard
```

---

## 🔍 VERIFY DEPLOYMENT

### 1. Check if site is live:
```bash
curl -I https://restaurant.alexandratechlab.com
# Should return: HTTP/2 200
```

### 2. Check SSL:
```bash
openssl s_client -connect restaurant.alexandratechlab.com:443 -servername restaurant.alexandratechlab.com | grep -i "Verify return code"
# Should return: Verify return code: 0 (ok)
```

### 3. Test in browser:
- Open: https://restaurant.alexandratechlab.com
- Should load without errors
- Check browser console (F12) - should be no red errors

---

## ⚙️ BACKEND CORS CONFIGURATION

**CRITICAL:** Update backend to allow frontend domain

### On Railway (Backend):
1. Go to your Railway app
2. Add environment variable or update CORS middleware:

```javascript
// In your backend server file (app.js, server.js, etc.)
const cors = require('cors');

const corsOptions = {
    origin: [
        'https://restaurant.alexandratechlab.com',
        'https://pos.alexandratechlab.com',
        'http://localhost:5173' // Keep for local development
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
```

3. **Deploy/Restart** the backend after changes

---

## 🧪 QUICK TEST CHECKLIST

After deployment, test these immediately:

- [ ] Site loads (no white screen)
- [ ] Login works
- [ ] Dashboard loads
- [ ] API calls succeed (check Network tab)
- [ ] No CORS errors
- [ ] Payment button visible in SessionTracker
- [ ] Click payment button - dialog opens
- [ ] Mobile responsive (test on phone)

If all above work, you're 90% done! ✅

---

## 🐛 COMMON ISSUES

### Issue: White Screen
**Solution:** Check browser console for errors. Usually:
- CORS issue (update backend)
- Asset loading issue (check base path in vite.config.js)

### Issue: API Calls Failing
**Solution:**
1. Check Network tab in DevTools
2. Look for CORS error
3. Update backend CORS (see above)

### Issue: 404 on Refresh
**Solution:**
- Netlify: Should work (has _redirects file)
- If not working, check netlify.toml is in root

### Issue: DNS Not Resolving
**Solution:**
```bash
# Check DNS propagation
nslookup restaurant.alexandratechlab.com

# Or use online tool:
# https://dnschecker.org
```
- Wait 5-30 minutes for DNS to propagate globally

---

## 📞 IMMEDIATE ACTIONS AFTER DEPLOYMENT

1. **Test login:** Use your credentials
2. **Check console:** Open DevTools (F12), look for errors
3. **Test API:** Navigate to dashboard, see if data loads
4. **Test payment:** Click "Pay & End Session" button
5. **Test mobile:** Open on your phone
6. **Check CORS:** If API fails, update backend CORS

---

## ✅ SUCCESS!

When you see:
- ✅ Site loads on https://restaurant.alexandratechlab.com
- ✅ Padlock icon (SSL working)
- ✅ Login works
- ✅ Dashboard shows data
- ✅ Payment dialog opens
- ✅ No console errors

**You're LIVE! 🎉**

---

## 📊 MONITORING

After deployment, monitor:
- Uptime: https://uptimerobot.com (free)
- Performance: Lighthouse in Chrome DevTools
- Errors: Check browser console regularly

---

## 🔄 UPDATES

To update the site after code changes:

### If using Netlify Drop:
1. Run `npm run build` locally
2. Drag new dist folder to Netlify
3. Deploys in seconds

### If using GitHub integration:
1. Push changes to GitHub: `git push`
2. Netlify auto-deploys (2-3 minutes)

### If using Netlify CLI:
```bash
npm run build
netlify deploy --prod --dir=dist
```

---

**Need help?** Check DEPLOYMENT_REPORT.md for detailed testing checklist.

**Ready to deploy?** Choose Option 1 (Netlify Drop) for fastest deployment!
