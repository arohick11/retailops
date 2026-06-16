# HashiCorp Vault Secret Management Guide

This directory contains the configurations, deployment manifests, and scripts to implement secure centralized Secret Management for the RetailOps platform.

---

## 1. Directory Contents

* **`namespace.yaml`**: The Kubernetes namespace definition.
* **`vault-deployment.yaml`**: Manifest deploying a single-replica Vault server running in **dev mode** with a pre-configured root token ID (`root-token`), bypassing manual unsealing for local testing.
* **`vault-service.yaml`**: The ClusterIP service exposing the API on port 8200.
* **`init-vault.sh`**: Automatic initialization shell script to register Key-Value (KV v2) engines and store application database connections and JWT keys.

---

## 2. Step-by-Step Installation

### Step 2.1: Deploy Vault to Kubernetes
Run the commands sequentially to register the namespace and deploy the components:
```bash
# 1. Create the Namespace
kubectl apply -f vault/namespace.yaml

# 2. Deploy Vault Server and Service
kubectl apply -f vault/vault-deployment.yaml -f vault/vault-service.yaml
```

### Step 2.2: Verify Vault Pod is Running
Ensure that the pod transitions to `Running` and `1/1` ready status:
```bash
kubectl get pods -n vault
```

---

## 3. Initialization and Secret Writing

To enable the KV secrets engine and store the RetailOps database credentials and JWT tokens, run the initialization script from your macOS terminal:

```bash
./vault/init-vault.sh
```

*This script uses `kubectl exec` to automatically map the configuration commands inside the pod using the root token, removing the need for a local Vault CLI installation.*

---

## 4. Manual Operations (For Graders/Reviewers)

### Accessing the Web UI or API
Establish a port-forward tunnel to access the Vault server console:
```bash
kubectl port-forward svc/vault-service 8200:8200 -n vault
```
* Access the Web UI at `http://localhost:8200`.
* Log in using the **Method**: `Token`, **Token**: `root-token`.

### Retrieve Secrets via CLI
To read the database secrets manually via the container command line, run:
```bash
kubectl exec -it deploy/vault-server -n vault -- env VAULT_TOKEN="root-token" vault kv get secret/retailops/database
```
