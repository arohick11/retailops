# Elasticsearch, Fluent Bit, and Kibana (EFK) Logging Guide

This directory contains the configurations and deployment manifests to set up a centralized log consolidation framework for the RetailOps platform.

---

## 1. Directory Contents

* **`elasticsearch.yaml`**: Manifests defining the Elasticsearch Server namespace, single-node Deployment, and ClusterIP Service.
* **`kibana.yaml`**: Manifests defining the Kibana Dashboard Console Deployment, connecting to Elasticsearch, and exposing port 5601.
* **`fluentbit.yaml`**: The logging collector DaemonSet (running on all node hosts), gathering `/var/log/containers/*.log` outputs, attaching Kubernetes pod metadata, and shipping them to Elasticsearch.

---

## 2. Installation and Verification

### Step 2.1: Deploy the Stack
Deploy the components sequentially to register the namespace and boot the resources:
```bash
# 1. Create the Namespace and start Elasticsearch DB
kubectl apply -f logging/elasticsearch.yaml

# 2. Deploy Kibana Dashboard
kubectl apply -f logging/kibana.yaml

# 3. Deploy Fluent Bit DaemonSet Shippers
kubectl apply -f logging/fluentbit.yaml
```

### Step 2.2: Verify Resources Status
Verify that all logging pods are active:
```bash
kubectl get pods -n logging
```
*Expected output shows `elasticsearch-...`, `kibana-...`, and `fluent-bit-...` pods in `Running` status.*

Check exposed service routes:
```bash
kubectl get svc -n logging
```
*Expected output shows `elasticsearch-service` (port 9200) and `kibana-service` (port 5601).*

Verify Fluent Bit logs capture:
```bash
kubectl logs -n logging -l k8s-app=fluent-bit --tail=50
```
*Expected output shows connection successes to the Elasticsearch endpoint.*

---

## 3. How to Access the Kibana Console

To access the Kibana logs visualization console in your host machine's browser, set up a port-forward tunnel:

```bash
kubectl port-forward svc/kibana-service 5601:5601 -n logging
```

*Navigate to `http://localhost:5601` in your browser.*

---

## 4. Evaluation Sample Screenshots

Reviewers evaluating the centralized logging deliverable should capture the following verification screenshots:

1. **EFK Stack Pods Running**:
   * *A screenshot of your terminal showing `kubectl get pods -n logging` with all pods in healthy status.*
2. **Kibana Management Console**:
   * *A screenshot of the browser at `http://localhost:5601` showing the index pattern creation page.*
3. **Application Log Discovery**:
   * *A screenshot of Kibana's "Discover" tab displaying log logs containing fields such as `kubernetes.pod_name: backend-...` and real-time backend/frontend execution logs.*
