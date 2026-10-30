#!/usr/bin/env bash
# infra/security/ufw-zero-trust.sh
# Production Host Firewall Hardening Script for MAKAREMI-CORE-2026
# Strict Zero Inbound Ports: Blocks all direct inbound ports on public interfaces.
# All inbound traffic MUST be routed exclusively via the outbound encrypted Cloudflare Tunnel.

set -euo pipefail

echo "=========================================================="
echo "APPLYING ZERO-TRUST HOST FIREWALL HARDENING (MAKAREMI 2026)"
echo "=========================================================="

# 1. Reset and establish baseline zero-trust defaults
sudo ufw --force reset
sudo ufw default deny incoming
sudo ufw default allow outgoing

# 2. Block direct access to all application, database, and administrative ports on public NICs
sudo ufw deny in 22/tcp comment 'Block direct SSH - Administrative access strictly via cloudflared access ssh'
sudo ufw deny in 80/tcp comment 'Block direct HTTP - Must use Cloudflare Edge'
sudo ufw deny in 443/tcp comment 'Block direct HTTPS - Must use Cloudflare Edge'
sudo ufw deny in 5432/tcp comment 'Block direct PostgreSQL - Internal VPC only'
sudo ufw deny in 6379/tcp comment 'Block direct Redis - Internal VPC only'
sudo ufw deny in 8055/tcp comment 'Block direct Directus CMS - Access strictly via admin.makaremi.com tunnel'
sudo ufw deny in 8182/tcp comment 'Block direct Cantaloupe IIIF - Access strictly via iiif.makaremi.com tunnel'
sudo ufw deny in 3000/tcp comment 'Block direct Next.js port'

# 3. Allow loopback interface (internal container & local proxy communication)
sudo ufw allow in on lo to any

# 4. Enable UFW with strict ruleset
sudo ufw --force enable
sudo ufw status verbose

echo "✓ Zero-Trust Host Firewall successfully enforced: 0 Public Inbound Ports open."
