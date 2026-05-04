# Art Portfolio Site — Setup Guide

## Tech Stack (No Frills)

| Layer | Tool | Why |
|---|---|---|
| Frontend | Plain HTML + CSS + Vanilla JS | No build step, full control |
| Backend | Node.js + Express | Handles forms, file uploads |
| Database | SQLite | Zero config, file-based, perfect for this scale |
| Email | Nodemailer | Sends you inquiry alerts + auto-replies to clients |
| Server | Nginx | Serves static files fast, proxies API to Node |
| Process | PM2 | Keeps Node running after you close SSH |
| SSL | Let's Encrypt (Certbot) | Free HTTPS |

---

## First-Time Setup (Do This Once)

### 1. Clone / upload your files to the server
```bash
# On your server (SSH in first)
mkdir -p /var/www/artsite
cd /var/www/artsite
# Upload your files here via FTP, SCP, or git clone
```

### 2. Install Node.js (if not already installed)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 3. Install dependencies
```bash
cd /var/www/artsite
npm install
```

### 4. Set up your environment variables
```bash
cp .env.example .env
nano .env   # Fill in your Gmail and email address
```

To get a Gmail App Password:
1. Go to myaccount.google.com → Security → 2-Step Verification → App passwords
2. Create a password for "Mail"
3. Paste it into SMTP_PASS in your .env file

### 5. Install and configure Nginx
```bash
sudo apt install nginx
sudo cp nginx/artsite.conf /etc/nginx/sites-available/artsite
sudo ln -s /etc/nginx/sites-available/artsite /etc/nginx/sites-enabled/
# Edit the conf file to replace yourdomain.com with your actual domain
sudo nano /etc/nginx/sites-available/artsite
sudo nginx -t       # Test config
sudo systemctl reload nginx
```

### 6. Get free HTTPS with Let's Encrypt
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
# Follow the prompts — it handles everything automatically
```

### 7. Install PM2 and start the server
```bash
sudo npm install -g pm2
cd /var/www/artsite
pm2 start server/index.js --name artsite
pm2 save          # Save so it restarts on server reboot
pm2 startup       # Follow the command it outputs
```

---

## Day-to-Day Usage

### Adding a new painting
Open `public/js/paintings.js` and add an entry to the `paintings` array:
```js
{
  id:       "my-new-painting",   // unique slug, no spaces
  title:    "Painting Title",
  category: "portrait",          // portrait | landscape | textured
  size:     "60 × 80 cm",
  medium:   "Oil on canvas",
  price:    1100,                // SGD, use 0 for "price on request"
  status:   "available",         // available | sold | displayed | nfs
  img:      "/images/my-photo.jpg",
  story:    "One or two sentences about this piece."
}
```
Then upload the photo to `/var/www/artsite/public/images/`

That's it — it appears automatically on Gallery, Shop, and Homepage.

### Marking a painting as sold
Change `status: "available"` to `status: "sold"` in paintings.js

### Viewing commission inquiries
```bash
# In your browser (only accessible locally for security):
curl http://localhost:3000/api/admin/commissions
```
Or add this to your Nginx config to password-protect it for browser access.

### Checking server status
```bash
pm2 status          # Is Node running?
pm2 logs artsite    # See recent logs / errors
sudo systemctl status nginx   # Is Nginx running?
```

### Restarting after changes
```bash
pm2 restart artsite   # Restart Node server
sudo systemctl reload nginx   # Reload Nginx config
```

---

## File Structure

```
artsite/
├── public/              ← Everything the browser sees
│   ├── css/
│   │   └── style.css    ← Edit CSS variables here to change your palette/fonts
│   ├── js/
│   │   ├── paintings.js ← ADD YOUR PAINTINGS HERE
│   │   └── layout.js    ← Shared nav/footer — edit your name and links here
│   ├── images/          ← Upload your painting photos here
│   ├── pages/
│   │   ├── gallery.html
│   │   ├── shop.html
│   │   ├── commissions.html
│   │   ├── about.html
│   │   └── contact.html
│   └── index.html       ← Homepage
├── server/
│   ├── index.js         ← Express server (forms, file uploads, DB)
│   └── mailer.js        ← Email templates
├── data/                ← SQLite database lives here (auto-created)
├── uploads/             ← Client reference photos stored here
├── nginx/
│   └── artsite.conf     ← Nginx configuration
├── .env                 ← Your secrets (never commit this to git)
├── .env.example         ← Template for .env
└── package.json
```

---

## Customise Your Site

### Change your name / brand
- `public/js/layout.js` — line with `nav__brand` — change "Your Name"
- `public/js/layout.js` — footer copyright line
- Every HTML `<title>` tag in the pages

### Change colors and fonts
Edit the `:root` variables at the top of `public/css/style.css`:
```css
--color-accent: #B5662A;    /* your highlight color */
--color-bg:     #FAF8F5;    /* background */
--font-heading: 'Cormorant Garamond', serif;
--font-body:    'Jost', sans-serif;
```
Swap the Google Fonts import URL at the top of style.css for any fonts you prefer.

### Update your Instagram / Etsy links
`public/js/layout.js` — footer section near the bottom.

---

## What Each Part Does

- **Nginx** serves your HTML/CSS/JS/images super fast directly from disk
- **Node.js + Express** only gets involved when a form is submitted — it saves to SQLite and sends emails
- **SQLite** stores every commission inquiry and contact message as a backup (even if email fails)
- **PM2** makes sure Node restarts automatically if it crashes or the server reboots
- **Let's Encrypt** gives you free HTTPS (auto-renews every 90 days)
