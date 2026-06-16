# RetailOps Disaster Recovery (DR) Plan

This document establishes the Disaster Recovery (DR) and High Availability (HA) strategies for the RetailOps platform, outlining system-wide recovery steps, backup guidelines, and disaster response procedures.

---

## 1. Recovery Objectives (RTO / RPO)

We define the following Service Level Agreements (SLAs) for disaster recovery:

* **Recovery Time Objective (RTO):** The maximum acceptable duration of downtime before service is restored.
  * **Stateless Applications (Frontend/Backend):** RTO < 5 minutes (via automated self-healing and pod scheduling).
  * **Stateful Database (MongoDB):** RTO < 15 minutes (via StatefulSet volume reattachment and pod rescheduling).
  * **Complete Cluster Rebuild:** RTO < 1 hour (via automated infrastructure-as-code deployment).
* **Recovery Point Objective (RPO):** The maximum acceptable age of data that can be lost due to an outage.
  * **Transaction & User Database:** RPO < 4 hours (daily snapshot schedule with transactional logs).
  * **System Configuration:** RPO = 0 (all deployment configs, IaC files, and pipelines are version-controlled in Git).

---

## 2. Component Failure Recovery Strategies

### Pod Failure Recovery
If a frontend, backend, or utility pod crashes due to application errors or memory leaks:
* **Detection:** Kubernetes liveness and readiness probes check the `/health` or `/healthz` endpoints.
* **Recovery:** The Kubelet daemon automatically terminates the faulty pod and launches a fresh container instance based on the defined restart policy (`Always`).

### Node Failure Recovery
If a physical or virtual VM worker node hosting Kubernetes pods crashes or loses network connectivity:
* **Detection:** The Kubernetes Control Plane detects node unreachability via heartbeat timeouts (default: 40 seconds).
* **Recovery:** The Controller Manager marks the node as `NotReady` or `Unreachable` and reschedules all evicted workloads onto surviving healthy nodes within the cluster.

### MongoDB Recovery
If the MongoDB database instance experiences disk corruption or write failures:
* **Detection:** The database liveness probe fails, or the persistent volume (PV) storage enters an error state.
* **Recovery:** The `MongoDB StatefulSet` controller maintains stable identifiers and automatically re-binds the existing Persistent Volume Claim (PVC) to a newly provisioned pod instance, preserving database state. For corruption, the database is restored using backup snapshots (see [Restore Procedures](#6-restore-procedures)).

### Jenkins Recovery
If the Jenkins controller or build agent fails mid-pipeline:
* **Detection:** The webhook triggers timeout, or the Jenkins server becomes unresponsive.
* **Recovery:** The Jenkins server is deployed with persistent volume storage for `/var/jenkins_home` containing job definitions and credentials. Pipelines are stored as code within the repository's `Jenkinsfile`, allowing Jenkins jobs to be recreated instantly from Git.

### Vault Recovery
If the HashiCorp Vault server restarts:
* **Detection:** Applications report connection issues to Vault, and health checks on `/v1/sys/health` fail.
* **Recovery:** When Vault restarts, it boots in a **sealed** state. In production setups, a minimum threshold of Shamir's Secret Sharing keys must be provided to unseal it. In local dev mode, the initialization script (`vault/init-vault.sh`) is rerun to enable the KV secret engine and seed initial application secrets.

### Prometheus & Grafana Recovery
If the monitoring stack crashes or telemetry data becomes corrupted:
* **Detection:** The Prometheus metrics dashboard or Grafana web interface becomes unreachable.
* **Recovery:** Prometheus and Grafana are deployed as Kubernetes Deployments with Persistent Volume Claims to store time-series metrics. If they restart, they reload config maps automatically. In case of database failure, the Grafana dashboards are re-imported from their JSON configurations checked into Git.

### ELK Recovery
If the Elasticsearch database, Kibana UI, or Fluent Bit agents experience failure:
* **Detection:** Log streams stop displaying in Kibana, or pod status shows crash loops.
* **Recovery:** 
  * **Fluent Bit**: Uses file-based backpressure and buffer mechanisms to queue logs locally on the node until Elasticsearch is reachable again.
  * **Elasticsearch**: Deployed as a stateful service. Out-of-memory or node crashes trigger pod rescheduling. Corrupted indices are deleted and restored from Elasticsearch snapshot repositories.

---

## 3. Kubernetes Rollback Strategy

To recover from problematic code updates or configuration drift:
* **Application Rollback:** Use native Kubernetes rollout commands to revert to the previous working revision:
  ```bash
  kubectl rollout undo deployment/frontend-deployment
  kubectl rollout undo deployment/backend-deployment
  ```
* **Git-Ops / Pipeline Rollback:** Revert the offending commit in the **GitHub Repository** and push to `main`. This triggers **Jenkins** to rebuild the previous stable Docker image and apply the verified stable manifests.

---

## 4. Backup Strategy

* **MongoDB Backups:** Zipped database dumps (`mongodump`) are executed automatically every 4 hours via a Kubernetes CronJob. These backups are encrypted and shipped to secure, offsite object storage (such as AWS S3) with a 30-day lifecycle retention policy.
* **Repository (Git) Backups:** The entire platform configurations (Terraform files, Jenkinsfiles, Kubernetes YAML files) are stored in the git repository history, serving as the source of truth for the entire cluster state.
* **Secrets Backup:** Secrets are managed via HashiCorp Vault. Vault configurations, access control policies, and system metadata are exported and backed up periodically.

---

## 5. Restore Procedures

### Rebuilding a Failed Cluster
If the entire Kubernetes cluster becomes corrupted, run these commands to rebuild the infrastructure from scratch:
1. **Provision Infrastructure:** Run Terraform to deploy the cluster and network configuration:
   ```bash
   cd terraform
   terraform init
   terraform apply -auto-approve
   ```
2. **Apply Workloads:** Load the Kubernetes configuration files:
   ```bash
   kubectl apply -f kubernetes/
   ```

### Restoring MongoDB Database
To restore the database from a backup snapshot:
1. Copy the database backup file to the MongoDB pod:
   ```bash
   kubectl cp /path/to/backup.archive mongodb-service-0:/tmp/backup.archive -n default
   ```
2. Exec into the pod and run `mongorestore` to replace existing data:
   ```bash
   kubectl exec -it mongodb-service-0 -n default -- mongorestore --archive=/tmp/backup.archive --drop
   ```

### Unsealing HashiCorp Vault
If the Vault server pod restarts and enters a sealed state, input the Shamir keys to unseal:
```bash
kubectl exec -it deploy/vault-server -n vault -- vault operator unseal <KEY_1>
kubectl exec -it deploy/vault-server -n vault -- vault operator unseal <KEY_2>
kubectl exec -it deploy/vault-server -n vault -- vault operator unseal <KEY_3>
```
For the local dev mode implementation, run the initial seed script:
```bash
./vault/init-vault.sh
```
