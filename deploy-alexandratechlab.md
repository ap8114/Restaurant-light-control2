# Deployment Guide - alexandratechlab.com Subdomain

## 🚀 Quick Deployment to alexandratechlab.com

### Option 1: Netlify (Recommended - Fast & Easy)

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy to production
netlify deploy --prod --dir=dist

# Set custom domain (in Netlify dashboard)
# Domain: restaurant.alexandratechlab.com or pos.alexandratechlab.com
```

### Option 2: Manual Deployment to Server

**Prerequisites:**
- Access to alexandratechlab.com server
- SSH/FTP credentials
- Web server (Nginx/Apache) configured

**Steps:**

1. **Build the project:**
```bash
npm run build
```

2. **Upload dist folder:**
```bash
# Using SCP
scp -r dist/* user@alexandratechlab.com:/var/www/restaurant-pos/

# Or using FTP client (FileZilla, etc.)
# Upload dist/* to web root
```

3. **Configure Nginx:**
```nginx
server {
    listen 80;
    server_name restaurant.alexandratechlab.com;

    root /var/www/restaurant-pos;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy (if needed)
    location /api {
        proxy_pass https://restorant-backend-new-veni-production.up.railway.app/api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

4. **SSL Certificate:**
```bash
# Using Let's Encrypt
sudo certbot --nginx -d restaurant.alexandratechlab.com
```

### Option 3: Vercel Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Add custom domain in Vercel dashboard
```

---

## 🔧 Post-Deployment Configuration

### 1. DNS Configuration

Add subdomain to alexandratechlab.com:

**A Record:**
```
Type: A
Name: restaurant (or pos)
Value: [Your Server IP]
TTL: 3600
```

**CNAME Record (if using hosting service):**
```
Type: CNAME
Name: restaurant
Value: [hosting-service-url]
TTL: 3600
```

### 2. Environment Variables

Create `.env.production`:
```env
VITE_API_BASE_URL=https://restorant-backend-new-veni-production.up.railway.app/api
VITE_APP_NAME=Restaurant POS
VITE_ENABLE_TAPO=true
VITE_ENABLE_PRINTER_SERVICE=true
```

### 3. Update Backend CORS

Add to backend (Railway app):
```javascript
const corsOptions = {
    origin: [
        'https://restaurant.alexandratechlab.com',
        'https://pos.alexandratechlab.com',
        'http://localhost:5173'
    ],
    credentials: true
};
```

---

## 🧪 Testing Checklist

After deployment, test:

- [ ] Application loads successfully
- [ ] Login/Authentication works
- [ ] API calls to backend succeed
- [ ] Tapo device configuration modal opens
- [ ] Printer setup page accessible
- [ ] Session tracker displays
- [ ] Payment button shows and functions
- [ ] Responsive design on mobile
- [ ] SSL certificate valid
- [ ] No console errors

---

## 🔍 Verification Commands

```bash
# Check if site is live
curl -I https://restaurant.alexandratechlab.com

# Test API connectivity
curl https://restaurant.alexandratechlab.com/api/health

# Check SSL
openssl s_client -connect restaurant.alexandratechlab.com:443 -servername restaurant.alexandratechlab.com
```

---

## 📱 Mobile Testing

Test on:
- Chrome Mobile
- Safari iOS
- Samsung Internet
- Different screen sizes

---

## 🆘 Troubleshooting

**Issue: White screen on load**
- Check browser console for errors
- Verify base path in vite.config.js
- Check API URL configuration

**Issue: API calls failing**
- Verify CORS settings on backend
- Check network tab in browser DevTools
- Confirm API base URL is correct

**Issue: Tapo/Printer services not working**
- Check if services are imported correctly
- Verify network connectivity
- Look for browser compatibility issues

---

## 📊 Monitoring

Set up monitoring for:
- Uptime (UptimeRobot, Pingdom)
- Error tracking (Sentry)
- Analytics (Google Analytics, Plausible)
- Performance (Lighthouse CI)

---

## 🎉 Deployment Complete!

Your Restaurant POS system is now live at:
**https://restaurant.alexandratechlab.com**

Next steps:
1. Test all features thoroughly
2. Train staff on the system
3. Set up monitoring
4. Create backup procedures
5. Document any custom configurations
