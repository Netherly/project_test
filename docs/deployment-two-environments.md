# Two Environments on One VPS (`prod` + `test`)

This project now supports two isolated deployments on one server:

- `prod` (`main` branch) -> `crm-frontend-prod`, `crm-backend-prod`, pm2 app `crm-backend-prod`, backend port `3000`
- `test` (`develop` branch) -> `crm-frontend-test`, `crm-backend-test`, pm2 app `crm-backend-test`, backend port `3001`

## 1. GitHub Actions workflows

- `.github/workflows/deploy-prod.yml` uses GitHub Environment `prod`
- `.github/workflows/deploy-test.yml` uses GitHub Environment `test`

Both workflows require these secrets in each environment:

- `VPS_HOST`
- `VPS_USER`
- `SSH_PORT`
- `VPS_SSH_KEY`
- `VPS_SSH_PASSPHRASE`
- `PRIMARY_DOMAIN`
- `FRONTEND_ENV`
- `BACKEND_ENV`
- optional: `NODE_VERSION`

Important: workflows run backend commands as the SSH user from `VPS_USER` (for your setup, use `root`).

## 2. Required env contracts

`FRONTEND_ENV` must contain:

```env
VITE_API_URL=/api
```

`BACKEND_ENV` must contain at least:

```env
PORT=3000|3001
NODE_ENV=production
DATABASE_URL=postgresql://...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
CORS_ORIGINS=https://<env-domain>
BOT_DISABLED=0
TELEGRAM_BOT_TOKEN=...
```

Use separate `DATABASE_URL` and Telegram token for `prod` and `test`.

## 3. One-time server setup

1. Prepare directories:

```bash
sudo mkdir -p /var/www/crm-frontend-prod /var/www/crm-frontend-test
sudo mkdir -p /var/www/crm-backend-prod /var/www/crm-backend-test
sudo mkdir -p /var/www/.releases
sudo chown -R root:root /var/www
```

2. Create test Basic Auth file:

```bash
sudo apt-get update
sudo apt-get install -y apache2-utils
sudo htpasswd -c /etc/nginx/.htpasswd-crm-test YOUR_TEST_USER
```

3. Install Nginx configs from templates:

- `deploy/nginx/prod.conf.template`
- `deploy/nginx/test.conf.template`

4. Enable HTTPS certificates:

```bash
sudo certbot --nginx -d PROD_DOMAIN -d TEST_DOMAIN
```

5. Validate and reload Nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 4. Runtime checks

- `pm2 ls`
- `pm2 logs crm-backend-prod`
- `pm2 logs crm-backend-test`
- `curl -H "Host: PROD_DOMAIN" http://127.0.0.1/health`
- `curl -H "Host: TEST_DOMAIN" http://127.0.0.1/health`

## 5. Branch -> environment flow

- push to `develop` => deploys only `test`
- push to `main` => deploys only `prod`
