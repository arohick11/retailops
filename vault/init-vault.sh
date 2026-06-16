#!/bin/bash
# Script to initialize kv-v2 secrets engine and store RetailOps secrets in Vault.
# Run this from your macOS terminal.

set -e

echo "🔐 Initializing HashiCorp Vault Secrets for RetailOps..."

# Find the active Vault pod name
VAULT_POD=$(kubectl get pods -n vault -l app=vault -o jsonpath='{.items[0].metadata.name}')

echo "Found Vault pod: ${VAULT_POD}"

# 1. Enable Key-Value Version 2 Engine at secret/
echo "Enabling KV version 2 secrets engine at path 'secret'..."
kubectl exec "${VAULT_POD}" -n vault -- env VAULT_TOKEN="root-token" vault secrets enable -path=secret kv-v2 || echo "Secret engine already enabled or configured."

# 2. Write Database Connection String
echo "Storing Database secrets at secret/retailops/database..."
kubectl exec "${VAULT_POD}" -n vault -- env VAULT_TOKEN="root-token" vault kv put secret/retailops/database \
  mongodb_uri="mongodb://mongodb-service.default.svc.cluster.local:27017/retailops"

# 3. Write Backend JWT Token Key
echo "Storing Backend secrets at secret/retailops/backend..."
kubectl exec "${VAULT_POD}" -n vault -- env VAULT_TOKEN="root-token" vault kv put secret/retailops/backend \
  jwt_secret="supersecuredemojwttokensecretkey2026"

# 4. Verify Stored Data
echo "--------------------------------------------------"
echo "Verify Database Secret:"
kubectl exec "${VAULT_POD}" -n vault -- env VAULT_TOKEN="root-token" vault kv get secret/retailops/database
echo "--------------------------------------------------"
echo "Verify Backend Secret:"
kubectl exec "${VAULT_POD}" -n vault -- env VAULT_TOKEN="root-token" vault kv get secret/retailops/backend

echo "--------------------------------------------------"
echo "✅ HashiCorp Vault secrets successfully initialized!"
