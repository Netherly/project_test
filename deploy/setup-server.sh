#!/usr/bin/env bash
set -euo pipefail

# One-time server bootstrap for two environments on one VPS.
# Required env vars:
#   PROD_DOMAIN
#   TEST_DOMAIN
# Optional env vars:
#   DEPLOY_USER (default: deploy)
#   TEST_BASIC_AUTH_USER (default: test)

DEPLOY_USER="${DEPLOY_USER:-deploy}"
TEST_BASIC_AUTH_USER="${TEST_BASIC_AUTH_USER:-test}"

if [[ -z "${PROD_DOMAIN:-}" || -z "${TEST_DOMAIN:-}" ]]; then
  echo "PROD_DOMAIN and TEST_DOMAIN are required" >&2
  exit 1
fi

sudo apt-get update
sudo apt-get install -y nginx certbot python3-certbot-nginx apache2-utils

sudo mkdir -p /var/www/crm-frontend-prod /var/www/crm-frontend-test
sudo mkdir -p /var/www/crm-backend-prod /var/www/crm-backend-test
sudo mkdir -p /var/www/.releases
sudo chown -R "$DEPLOY_USER":"$DEPLOY_USER" /var/www

if [[ ! -f /etc/nginx/.htpasswd-crm-test ]]; then
  echo "Create password for test basic auth user: $TEST_BASIC_AUTH_USER"
  sudo htpasswd -c /etc/nginx/.htpasswd-crm-test "$TEST_BASIC_AUTH_USER"
fi

sudo cp deploy/nginx/prod.conf.template /etc/nginx/sites-available/crm-prod.conf
sudo cp deploy/nginx/test.conf.template /etc/nginx/sites-available/crm-test.conf
sudo sed -i "s/PROD_DOMAIN/$PROD_DOMAIN/g" /etc/nginx/sites-available/crm-prod.conf
sudo sed -i "s/TEST_DOMAIN/$TEST_DOMAIN/g" /etc/nginx/sites-available/crm-test.conf

sudo ln -sf /etc/nginx/sites-available/crm-prod.conf /etc/nginx/sites-enabled/crm-prod.conf
sudo ln -sf /etc/nginx/sites-available/crm-test.conf /etc/nginx/sites-enabled/crm-test.conf
sudo rm -f /etc/nginx/sites-enabled/default

sudo nginx -t
sudo systemctl reload nginx

sudo certbot --nginx -d "$PROD_DOMAIN" -d "$TEST_DOMAIN"

sudo nginx -t
sudo systemctl reload nginx

echo "Server bootstrap complete."
