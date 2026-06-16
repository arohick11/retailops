# Prometheus & Grafana Monitoring Guide for RetailOps

This directory contains the configurations, deployment manifests, and dashboard definitions to deploy a complete observability plane for the RetailOps platform.

---

## 1. Directory Contents

* **`prometheus-config.yaml`**: The scrape configuration detailing how Prometheus fetches endpoints (Microservices, Nodes, and Kubelet metrics).
* **`prometheus-deployment.yaml`**: Manifests defining the Prometheus Server Namespace, ServiceAccount, RBAC rules, Deployment, and internal ClusterIP Service.
* **`grafana-deployment.yaml`**: Manifests defining the Grafana Dashboard Server, exposing port 3000, and auto-provisioning the Prometheus data source.
* **`grafana-dashboard.json`**: The pre-built dashboard JSON configuration titled **"RetailOps Platform Monitoring"** which contains custom timeseries panel statistics.
* **`metrics-server-manifest.yaml`**: Deployment definition for Metrics Server (used to populate HPA resource targets).

---

## 2. Step-by-Step Installation

### Step 2.1: Deploy Prometheus Configuration and Server
```bash
# 1. Create the ConfigMap containing the prometheus.yml scrape configs
kubectl apply -f monitoring/prometheus-config.yaml

# 2. Deploy the Prometheus Server, SA, and RBAC rules
kubectl apply -f monitoring/prometheus-deployment.yaml
```

### Step 2.2: Deploy Grafana Dashboard Server
```bash
# Deploy Grafana server along with its automatic datasource configuration ConfigMap
kubectl apply -f monitoring/grafana-deployment.yaml
```

### Step 2.3: Verify Observability Pods are Running
Ensure that all pods inside the `monitoring` namespace transition to `Running` state:
```bash
kubectl get pods -n monitoring
```

---

## 3. How to Access the Observability Consoles

Since this is running in a local Docker Desktop / KinD environment, services are exposed internally. To access them in your local web browser, establish port-forward tunnels:

### Access Prometheus UI (Metrics Database)
```bash
kubectl port-forward svc/prometheus-service 9090:9090 -n monitoring
```
*Navigate to `http://localhost:9090` to query raw metrics (e.g. `kube_pod_status_ready` or `http_requests_total`).*

### Access Grafana UI (Dashboards Console)
```bash
kubectl port-forward svc/grafana-service 3000:3000 -n monitoring
```
*Navigate to `http://localhost:3000` in your browser.*
* **Username**: `admin`
* **Password**: `admin`

---

## 4. Importing the RetailOps Grafana Dashboard

To load the pre-built dashboard:
1. Log in to the Grafana Console (`http://localhost:3000`).
2. Click on the top-right **"+" (Plus Icon)** -> **Import dashboard**.
3. Copy the raw JSON text from `monitoring/grafana-dashboard.json` and paste it into the **"Import via panel json"** text field.
4. Click **Load**, verify the datasource is mapped to the auto-provisioned "Prometheus" source, and select **Import**.
5. You will now see live timeseries panels rendering pod utilization, request errors, latency metrics, and active Kubernetes replica counts.
