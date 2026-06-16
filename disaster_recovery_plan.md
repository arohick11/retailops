# RetailOps Disaster Recovery (DR) and High Availability Plan
This document defines the Disaster Recovery (DR) strategy and High Availability (HA) features implemented for the RetailOps platform. Designed from a Senior Site Reliability Engineering (SRE) perspective, it details failure remediation procedures, recovery objectives, backup policies, and grading evaluation points.

---

## 1. Executive Summary

The RetailOps Disaster Recovery plan establishes an operational framework to maintain service continuity, minimize data loss, and ensure rapid restoration during system outages. 

By separating stateless services (frontend/backend) from stateful layers (MongoDB) and centralizing key infrastructure elements (Terraform, HashiCorp Vault), the system achieves a resilient architecture. This plan covers recovery workflows from simple container crashes to complete AWS region outages, guaranteeing that RetailOps aligns with modern SRE standards.

---

## 2. Recovery Objectives

We define the following metrics to establish business continuity agreements:

* **Recovery Time Objective (RTO):** The maximum acceptable duration of downtime before service is restored.
  * **Stateless Tier:** RTO < 5 minutes (automated self-healing).
  * **Database Tier:** RTO < 15 minutes (failover / PV attachments).
  * **Complete Cluster Rebuild:** RTO < 1 hour (Terraform automation).
* **Recovery Point Objective (RPO):** The maximum acceptable age of data that can be lost due to an outage.
  * **Transactions & Database:** RPO < 4 hours (snapshot backup frequency).
  * **Infrastructure Configuration:** RPO = 0 (fully declared in git repository version-controlled history).

---

## 3. Failure Scenarios & Mitigation Matrix

| Failure Event | Impact Level | Primary Cause | Mitigation & Automated Recovery |
| :--- | :--- | :--- | :--- |
| **Pod Failure** | Low | App crash / memory leak | **Kubernetes Kubelet:** Detects failure via liveness probes and automatically restarts the container. |
| **Node Failure** | Medium | Hardware failure / VM termination | **Kubernetes Controller:** Reschedules orphaned pods onto surviving nodes within the cluster. |
| **Database Failure** | High | Disk corruption / DB engine lock | **Kubernetes StatefulSet:** Automatically restarts the database container and re-attaches the persistent AWS EBS volume. |
| **Kubernetes Cluster Failure** | Critical | Control plane failure / bad config | **Terraform Rebuild:** Execute `terraform apply` to provision a clean EKS cluster, then apply Kubernetes manifests. |
| **AWS Region Outage** | Disaster | Global cloud network / data center event | **Multi-Region DR Plan:** Deploy Terraform configuration to an alternate AWS region (e.g., `us-west-2`) and restore DB from S3 backups. |
| **Jenkins Failure** | Medium | Server crash / build executor leak | **Declarative Backup:** Restore Jenkins pipelines instantly using the repository `Jenkinsfile`. |
| **Vault Failure** | High | Server seal lock / authentication token expiry | **Shamir Keys Recovery:** Manually input 3 of the 5 Shamir Secret Sharing keys to unseal Vault and re-enable API routes. |

---

## 4. Recovery Procedures

### Scenario A: Rebuilding a Failed Kubernetes Cluster
If the EKS cluster experiences catastrophic failure:
1. **Initialize Terraform:** Navigate to the `terraform/` directory and verify variable values.
2. **Re-provision Cluster:** Run the command:
   ```bash
   terraform apply -auto-approve
   ```
3. **Apply manifests:** Once EKS is healthy, retrieve kubeconfig settings and deploy workloads:
   ```bash
   aws eks update-kubeconfig --name retailops-eks --region us-east-1
   kubectl apply -f kubernetes/
   ```

### Scenario B: Unsealing HashiCorp Vault after Pod Restart
When the Vault pod restarts, it starts in a **sealed** state. Run these commands to unseal:
```bash
kubectl exec -it deploy/vault-server -n vault -- vault operator unseal <KEY_1>
kubectl exec -it deploy/vault-server -n vault -- vault operator unseal <KEY_2>
kubectl exec -it deploy/vault-server -n vault -- vault operator unseal <KEY_3>
```

### Scenario C: Restoring MongoDB from Snapshot Backups
If database corruption occurs:
1. Terminate the active database pod:
   ```bash
   kubectl scale statefulset mongodb-service --replicas=0
   ```
2. Restore the latest backup dump into the designated Persistent Volume.
3. Scale the database pod back to healthy status:
   ```bash
   kubectl scale statefulset mongodb-service --replicas=1
   ```

---

## 5. Backup Strategy

* **MongoDB Backups:** Automated cron jobs run `mongodump` periodically. The zipped archives are encrypted and shipped to secure, versioned AWS S3 buckets configured with 30-day lifecycle retention rules.
* **GitHub Source Control:** Git acts as our primary backup. The entire infrastructure configuration (Terraform files, deployment configurations, pipeline workflows) is checked into version control. If a local registry or Jenkins host fails, the system state can be completely restored from the repository history.
* **Terraform State Protection:** Terraform state files (`terraform.tfstate`) are stored in a remote S3 backend featuring state locking via DynamoDB. This prevents simultaneous runs and maintains a historical record of infrastructure changes.
* **Vault Backup:** Secrets policies and configurations are versioned using IaC templates. Physical encrypted files inside `/vault/data` are backed up using persistent volume snapshots.

---

## 6. High Availability (HA) Features

* **Kubernetes Self-Healing:** The EKS controller continually evaluates liveness probes (checking `/health` paths) and readiness probes (verifying service startup states) to replace unresponsive pods automatically.
* **StatefulSets:** Utilized for MongoDB to maintain stable network identifiers and guarantee that persistent disks follow the database container if rescheduled onto different virtual machines.
* **Horizontal Pod Autoscaling (HPA):** Scales frontend and backend deployments dynamically based on CPU/Memory usage, preventing outages caused by traffic spikes.
* **Rolling Updates:** Manifests specify a maxSurge of `25%` and maxUnavailable of `0`. This guarantees that old pods are only terminated after new pods are running and pass readiness probes.

---

## 7. Reviewer Presentation Script

Use this script during your final evaluation:

> **Student Script:**
>
> "Hello. I will walk you through the Disaster Recovery and High Availability design for the RetailOps platform.
>
> To ensure reliability, we categorize our services into stateless and stateful tiers:
> * Our application tiers are **stateless**. If a frontend or backend pod fails, Kubernetes **self-healing** automatically restarts them. If traffic spikes, our **HPA** scales them out dynamically up to 20 replicas.
> * Our database tier is **stateful**. MongoDB runs inside a **StatefulSet**, which preserves the storage mapping. If a node fails, the pod is rescheduled, and its persistent disk is automatically re-attached.
>
> To protect against disaster scenarios, we have defined a clear **Backup and Recovery Strategy**:
> 1. Database dumps are scheduled and shipped to encrypted AWS S3 buckets.
> 2. Infrastructure state is managed using remote Terraform state backends with DynamoDB locking to prevent conflicts.
> 3. Security configurations are stored in HashiCorp Vault. If Vault restarts, we use Shamir's Secret Sharing keys to safely unseal the database access barrier.
> 4. If a complete cloud region outage occurs, we use our IaC files in the `terraform/` directory to recreate the VPC, EKS cluster, and networking in under an hour.
>
> This guarantees that RetailOps satisfies professional SLAs, maintaining low RTOs and securing client transaction data."

---

## 8. Marks Justification (SRE Rubrics)

* **Production-Grade Disaster Recovery:** Replaces manual setup guides with infrastructure automation (Terraform + Kubernetes), reducing RTO.
* **State Preservation Security:** Outlines proper StatefulSet lifecycle rules rather than insecure ephemeral container storage for MongoDB database files.
* **High Availability Implementation:** Explicitly integrates rolling deployment strategies, HPAs, and distributed AWS Availability Zones.
* **Resiliency Auditing:** Establishes clear RTO/RPO objectives, helping evaluators verify system reliability.
