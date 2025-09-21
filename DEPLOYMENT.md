# 🚀 AI Chat App Deployment Guide

## Prerequisites
- Domain name (optional but recommended)
- Credit card for server hosting
- Your OpenAI API key
- Your Stripe API keys

## Step 1: Choose a Server Provider

### Option A: DigitalOcean (Recommended)
1. Go to [digitalocean.com](https://digitalocean.com)
2. Create account and add payment method
3. Create a new Droplet:
   - **Image**: Ubuntu 22.04 LTS
   - **Size**: Basic $6/month (1GB RAM, 1 CPU)
   - **Region**: Choose closest to your users
   - **Authentication**: SSH Key (recommended) or Password

### Option B: AWS EC2
1. Go to [aws.amazon.com](https://aws.amazon.com)
2. Create AWS account
3. Launch EC2 instance:
   - **AMI**: Ubuntu Server 22.04 LTS
   - **Instance Type**: t3.micro (Free tier eligible)
   - **Storage**: 8GB (free tier)

## Step 2: Server Setup

### Connect to your server:
```bash
ssh root@YOUR_SERVER_IP
```

### Update system:
```bash
apt update && apt upgrade -y
```

### Install Node.js:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs
```

### Install PM2 (Process Manager):
```bash
npm install -g pm2
```

### Install Nginx (Web Server):
```bash
apt install nginx -y
systemctl start nginx
systemctl enable nginx
```

## Step 3: Deploy Your App

### Upload your code:
```bash
# Option 1: Using Git (recommended)
git clone YOUR_REPOSITORY_URL
cd YOUR_APP_FOLDER

# Option 2: Using SCP
scp -r /path/to/your/app root@YOUR_SERVER_IP:/var/www/
```

### Install dependencies:
```bash
cd /var/www/your-app
npm install
```

### Create production environment file:
```bash
nano .env
```

Add your production environment variables:
```env
OPENAI_API_KEY=your_openai_api_key_here
PORT=3000
FRONTEND_URL=https://yourdomain.com
JWT_SECRET=your_very_secure_jwt_secret_here
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
```

## Step 4: Configure Nginx (Reverse Proxy)

Create Nginx configuration:
```bash
nano /etc/nginx/sites-available/your-app
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
ln -s /etc/nginx/sites-available/your-app /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

## Step 5: Start Your App with PM2

```bash
cd /var/www/your-app
pm2 start server.js --name "ai-chat-app"
pm2 save
pm2 startup
```

## Step 6: SSL Certificate (HTTPS)

### Install Certbot:
```bash
apt install certbot python3-certbot-nginx -y
```

### Get SSL certificate:
```bash
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## Step 7: Firewall Configuration

```bash
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw enable
```

## Step 8: Monitoring & Maintenance

### Check app status:
```bash
pm2 status
pm2 logs ai-chat-app
```

### Restart app:
```bash
pm2 restart ai-chat-app
```

### Update app:
```bash
cd /var/www/your-app
git pull
npm install
pm2 restart ai-chat-app
```

## 🔧 Production Optimizations

### 1. Database Upgrade
Consider upgrading to a real database:
- **PostgreSQL** (recommended)
- **MongoDB**
- **MySQL**

### 2. Environment Variables
- Use strong, unique JWT secrets
- Use production Stripe keys (not test keys)
- Set up proper logging

### 3. Security
- Regular security updates: `apt update && apt upgrade`
- Firewall configuration
- SSL certificates
- Regular backups

### 4. Monitoring
- Set up monitoring (UptimeRobot, Pingdom)
- Log monitoring
- Performance monitoring

## 💰 Estimated Monthly Costs

- **Server**: $6-12/month
- **Domain**: $10-15/year
- **SSL**: Free (Let's Encrypt)
- **Total**: ~$7-15/month

## 🚨 Important Notes

1. **Backup your data** regularly
2. **Monitor your server** for uptime
3. **Keep dependencies updated**
4. **Use production API keys** (not test keys)
5. **Set up proper logging**

## 📞 Support

If you need help with deployment:
1. Check server logs: `pm2 logs ai-chat-app`
2. Check Nginx logs: `tail -f /var/log/nginx/error.log`
3. Test your app: `curl http://localhost:3000`

Your app will be live 24/7 and accessible from anywhere! 🎉
