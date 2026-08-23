# 🚀 Deploy to Oracle Cloud Free Tier (100% FREE)

## Step 1: Create Oracle Cloud Account
1. Go to https://www.oracle.com/cloud/free/
2. Sign up (requires email verification, no credit card)
3. Choose home region (closest to your users)

## Step 2: Create a VM Instance
1. In Oracle Cloud dashboard → Compute → Instances
2. Click "Create Instance"
3. Choose:
   - **Shape:** VM.Standard.A1.Flex (ARM - FREE)
   - **OCPUs:** 2
   - **Memory:** 12 GB
   - **OS:** Ubuntu 22.04
4. Download SSH keys (keep safe!)
5. Create instance

## Step 3: Configure Firewall
1. Go to instance → Subnet → Security List
2. Add Ingress Rules:
   - Port 22 (SSH)
   - Port 80 (HTTP)
   - Port 443 (HTTPS)
   - Port 3000 (Frontend)
   - Port 3001 (Backend API)

3. Also configure Ubuntu firewall:
```bash
ssh -i your-key.pem ubuntu@your-instance-ip

sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 3000
sudo ufw allow 3001
sudo ufw enable
```

## Step 4: Install Dependencies
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install PM2 (process manager)
sudo npm install -g pm2

# Install Git
sudo apt install -y git

# Install Nginx (reverse proxy)
sudo apt install -y nginx
```

## Step 5: Setup Database
```bash
sudo -u postgres psql

# Create database and user
CREATE DATABASE retailcrm;
CREATE USER retailcrm_user WITH ENCRYPTED PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE retailcrm TO retailcrm_user;
\q
```

## Step 6: Clone and Setup Backend
```bash
cd /home/ubuntu
git clone https://github.com/yourusername/retail-crm.git
cd retail-crm/backend

# Install dependencies
npm install --production

# Create .env file
nano .env
```

Paste this (update values):
```env
DATABASE_URL="postgresql://retailcrm_user:your-secure-password@localhost:5432/retailcrm"
JWT_SECRET="paste-your-128-char-secret-here"
JWT_EXPIRES_IN="7d"
PORT=3001
NODE_ENV=production
REDIS_URL="redis://localhost:6379"
FRONTEND_URL="http://your-ip:3000"
```

Save (Ctrl+X, Y, Enter)

```bash
# Run database migrations
npx prisma migrate deploy

# Build backend
npm run build

# Start with PM2
pm2 start dist/main.js --name retail-crm-api
pm2 save
pm2 startup
```

## Step 7: Setup Frontend
```bash
cd /home/ubuntu/retail-crm/frontend

# Install dependencies
npm install --production

# Create .env.local
nano .env.local
```

Paste:
```env
NEXT_PUBLIC_API_URL=http://your-instance-ip:3001/api
```

```bash
# Build frontend
npm run build

# Start with PM2
pm2 start npm --name retail-crm-frontend -- start
pm2 save
```

## Step 8: Configure Nginx (Optional - for domains)
```bash
sudo nano /etc/nginx/sites-available/retail-crm
```

Paste:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/retail-crm /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Step 9: Access Your App
- Frontend: http://your-instance-ip:3000
- Backend API: http://your-instance-ip:3001/api/docs
- With Nginx: http://your-domain.com

## Step 10: Setup SSL (Free with Let's Encrypt)
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
sudo systemctl restart nginx
```

Now access via: https://your-domain.com

---

## Monitoring & Maintenance

### Check app status:
```bash
pm2 status
pm2 logs retail-crm-api
pm2 logs retail-crm-frontend
```

### Restart apps:
```bash
pm2 restart retail-crm-api
pm2 restart retail-crm-frontend
```

### Update app (when you push changes):
```bash
cd /home/ubuntu/retail-crm
git pull
cd backend && npm run build && pm2 restart retail-crm-api
cd ../frontend && npm run build && pm2 restart retail-crm-frontend
```

### Database backup:
```bash
pg_dump -U retailcrm_user retailcrm > backup_$(date +%Y%m%d).sql
```

---

## Cost: $0/month FOREVER ✅
Oracle Cloud Free Tier never expires!
