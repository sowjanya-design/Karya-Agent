# KVM4 VPS setup — app + PostgreSQL, no more Neon compute-hour limits

Follow this top to bottom, in order, over SSH into your KVM4 VPS. Each block is
meant to be pasted as-is. Replace anything in `<ANGLE_BRACKETS>` with your own
value before running it. Stop and ask if any step errors — don't skip ahead.

Assumes a fresh Ubuntu 22.04/24.04 VPS (Hostinger's default KVM template).
Run `lsb_release -a` first if you're not sure what's on it.

---

## 0. Confirm you're on the right machine

```bash
curl -s ifconfig.me
```

Compare the output to the IP shown for your VPS in hPanel. They must match —
this is the box we're installing everything on.

---

## 1. Base setup: sudo user + firewall

If you're logged in as `root`, create a normal user first (don't run the app as root):

```bash
adduser deploy
usermod -aG sudo deploy
su - deploy
```

Firewall — only SSH, HTTP, HTTPS get in from the outside. Postgres (5432) is
deliberately **not** opened; the app reaches it over `localhost` only.

```bash
sudo apt update && sudo apt install -y ufw
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
sudo ufw status
```

---

## 2. Node.js 20 + build tools

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git build-essential
node -v   # should print v20.x
npm -v
```

---

## 3. PostgreSQL

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl status postgresql   # should say "active (running)"
```

Create the database and a dedicated app user (pick your own strong password
and remember it — you'll put it in `.env` in step 5):

```bash
sudo -u postgres psql -c "CREATE USER karya_user WITH PASSWORD '<STRONG_PASSWORD>';"
sudo -u postgres psql -c "CREATE DATABASE karya OWNER karya_user;"
```

By default, the apt Postgres package only listens on `localhost` and only
allows local connections — which is exactly what we want (no exposure to the
internet at all, so port 5432 doesn't even need the firewall rule above).
Verify:

```bash
sudo -u postgres psql -c "SHOW listen_addresses;"   # should be 'localhost'
```

Quick connection test:

```bash
PGPASSWORD='<STRONG_PASSWORD>' psql -h localhost -U karya_user -d karya -c "SELECT 1;"
```

---

## 4. Automated backups

Self-hosting means backups are now your responsibility (Neon did this for
you before). This sets up a nightly dump, kept for 14 days.

```bash
sudo mkdir -p /var/backups/karya
sudo chown deploy:deploy /var/backups/karya
```

Copy `deploy/backup.sh` from this repo onto the VPS (after step 5, once the
repo is cloned) to `/home/deploy/backup.sh`, then:

```bash
chmod +x /home/deploy/backup.sh
crontab -e
```

Add this line (runs nightly at 2:30 AM server time):

```
30 2 * * * PGPASSWORD='<STRONG_PASSWORD>' /home/deploy/backup.sh >> /home/deploy/backup.log 2>&1
```

Periodically (weekly is fine) copy a dump from `/var/backups/karya/` down to
your own machine — VPS disk isn't a real offsite backup if the VPS itself is
ever lost or reimaged.

---

## 5. Deploy the app

```bash
cd ~
git clone <YOUR_GITHUB_REPO_URL> karya
cd karya
```

Create `.env` (this is never committed — see `.env.example` in the repo for
the full list of variables):

```bash
cat > .env << 'EOF'
DATABASE_URL=postgresql://karya_user:<STRONG_PASSWORD>@localhost:5432/karya?schema=public
JWT_SECRET=<GENERATE_A_LONG_RANDOM_STRING>
SETUP_SECRET=<GENERATE_ANOTHER_RANDOM_STRING>
ANTHROPIC_API_KEY=<YOUR_KEY>
NODE_ENV=production
PORT=3000
PUPPETEER_SKIP_DOWNLOAD=true
EOF
```

Install + build (runs `prisma generate`, builds the React app, compiles the server):

```bash
npm install
```

Create the schema in the new database:

```bash
npx prisma db push
```

(Skip `prisma db seed` — the app creates admin accounts automatically on boot.)

---

## 6. Process manager (PM2)

Keeps the app running, restarts it if it crashes, and brings it back up after
a VPS reboot.

```bash
sudo npm install -g pm2
pm2 start server.js --name karya
pm2 startup systemd -u deploy --hp /home/deploy
```

Run the command that `pm2 startup` prints (it needs `sudo`), then:

```bash
pm2 save
```

Verify:

```bash
curl http://127.0.0.1:3000/api/health
# {"status":"ok","timestamp":"..."}
```

---

## 7. Nginx reverse proxy + TLS

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

```bash
sudo tee /etc/nginx/sites-available/karya > /dev/null << 'EOF'
server {
    listen 80;
    server_name karya.services www.karya.services;

    location / {
        proxy_pass http://127.0.0.1:3000;
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
EOF

sudo ln -s /etc/nginx/sites-available/karya /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

**Don't run certbot yet** — it needs `karya.services` to already resolve to
this VPS, which it doesn't until Part 4 (DNS cutover) below. Come back to this
after DNS is switched:

```bash
sudo certbot --nginx -d karya.services -d www.karya.services
```

---

## 8. Verify before touching DNS

While DNS still points at the old host, you can still confirm this VPS works
by forcing your own machine to resolve `karya.services` to it temporarily.

On your local machine (not the VPS), edit your hosts file
(`C:\Windows\System32\drivers\etc\hosts` on Windows, as Administrator) and add:

```
<VPS_IP>  karya.services
<VPS_IP>  www.karya.services
```

Then visit `http://karya.services` in your browser (plain HTTP — no cert yet)
and test login, browsing candidates, etc. Remove those hosts-file lines when
done testing.

Once this all checks out and data migration (see `deploy/MIGRATE_DATA.md`) is
complete, move on to the DNS cutover.

---

## DNS cutover

1. In whichever DNS zone manages `karya.services` (check hPanel → Domains →
   DNS Zone), update the **A record** for `karya.services` and `www` to point
   to `<VPS_IP>`.
2. Wait for propagation (usually minutes, up to the old TTL).
3. Run the certbot command from step 7 once `karya.services` resolves to the VPS.
4. Confirm `https://www.karya.services` works end to end.
5. Keep the old Neon project and the old Hostinger Node.js Web App around for
   about a week as a rollback option, then decommission both.

## Reboot test (proves the compute-hours problem is actually gone)

```bash
sudo reboot
```

Wait a minute, then:

```bash
curl https://www.karya.services/api/health
```

PM2 and Postgres both come back automatically — no manual restart, no
sleep/wake cycle, no usage metering.
