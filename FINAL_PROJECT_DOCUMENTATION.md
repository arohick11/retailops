# RetailOps - Master DevOps & DevSecOps Platform Documentation

This document serves as the master guide and comprehensive documentation for the RetailOps Omnichannel Platform. It details the system architecture, codebases, CI/CD automation pipeline, Infrastructure-as-Code (IaC), Kubernetes container orchestration, security controls, and observability stack.

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Platform Architecture & System Diagrams](#2-platform-architecture--system-diagrams)
3. [Repository Directory Structure](#3-repository-directory-structure)
4. [Application Codebases (Frontend & Backend)](#4-application-codebases-frontend--backend)
5. [CI/CD Pipeline (Jenkins)](#5-cicd-pipeline-jenkins)
6. [Infrastructure as Code (Terraform)](#6-infrastructure-as-code-terraform)
7. [Kubernetes Orchestration & Workloads](#7-kubernetes-orchestration--workloads)
8. [Security & Secrets Management (HashiCorp Vault)](#8-security--secrets-management-hashicorp-vault)
9. [Observability (Metrics & Logging Stack)](#9-observability-metrics--logging-stack)
10. [Disaster Recovery, High Availability & Rollbacks](#10-disaster-recovery-high-availability--rollbacks)

---

## 1. Project Overview

**RetailOps** is an enterprise-grade full-stack Omnichannel Retail Operations application designed to demonstrate a complete DevOps and DevSecOps lifecycle. 

### Key Features
* **Interactive Storefront**: React-based UI displaying products, category filtering, search, and checkout.
* **Transactional Rest APIs**: Node.js/Express.js backend providing catalog routing, order placements, and admin management endpoints.
* **Database persistence**: MongoDB storage for users, catalog records, and orders.
* **Secret Centralization**: Dynamic injection of credentials into application pods via HashiCorp Vault.
* **Automated CI/CD**: Automatic image compiling, linting, vulnerability scanning, and multi-stage container deployment via Jenkins.
* **Telemetry & Ingestion**: Real-time log monitoring (EFK) and metric graphing (Prometheus/Grafana) across all pods.

---

## 2. Platform Architecture & System Diagrams

The platform's architectures, boundaries, and flows are mapped out in detail in the following design documents:

* **[Architecture Diagram](file:///Users/arohichakote/Desktop/retailops/docs/architecture_diagram.md)**: Visualizes platform boundaries, internal service communication paths, and security relationships.
* **[Deployment Diagram](file:///Users/arohichakote/Desktop/retailops/docs/deployment_diagram.md)**: Details the end-to-end GitOps CI/CD flow from the developer's push through the Jenkins build steps to target Kubernetes nodes, alongside the metrics scraping and log forwarding loops.
* **[Disaster Recovery Plan](file:///Users/arohichakote/Desktop/retailops/docs/disaster_recovery_plan.md)**: Establishes RTO/RPO objectives, pod/node rescheduling steps, MongoDB restoration, and Vault unsealing procedures.

---

## 3. Repository Directory Structure

Below is an overview of the key directories and configuration files in this repository:

```
retailops/
├── frontend/                   # React.js application
│   ├── src/                    # Components, styles, and routing logic
│   ├── vite.config.js          # Vite config (runs on Port 3000)
│   └── nginx.conf              # Nginx server configuration for containerized deployment
├── backend/                    # Node.js Express API Server
│   ├── models/                 # MongoDB Mongoose models (Product, Order, User)
│   ├── routes/                 # REST API endpoints (auth, products, orders, suppliers)
│   └── server.js               # Express entrypoint (runs on Port 5001)
├── docs/                       # Architecture diagrams and DR plans
│   ├── architecture_diagram.md # System architecture diagram
│   ├── deployment_diagram.md   # Pipelines and Deployment diagram
│   └── disaster_recovery_plan.md # Disaster Recovery and SLA plan
├── kubernetes/                 # Kubernetes manifests
│   ├── frontend-deploy.yaml    # Frontend Deployment & Service
│   ├── backend-deploy.yaml     # Backend Deployment & Service
│   ├── mongo-statefulset.yaml  # Persistent MongoDB StatefulSet
│   ├── ingress.yaml            # Ingress routing rules
│   └── hpa.yaml                # Horizontal Pod Autoscaler configuration
├── terraform/                  # Infrastructure provisioning
│   ├── main.tf                 # VPC, Subnet, and EKS Cluster declarations
│   ├── variables.tf            # Variables configuration
│   └── outputs.tf              # Outputs definition
├── vault/                      # HashiCorp Vault configuration
│   ├── vault-deployment.yaml   # Vault service and single-replica deployment
│   ├── vault-config.hcl        # Vault server settings
│   └── init-vault.sh           # Secret seeding script
├── monitoring/                 # Metrics collection
│   ├── metrics-server-manifest.yaml # K8s Metrics Server config
│   ├── prometheus-config.yaml  # Scraping rules for Prometheus
│   └── grafana-dashboard.json  # Pre-built dashboard definitions
├── logging/                    # Centralized logging stack
│   ├── filebeat-daemonset.yaml # Filebeat daemon for collecting pod stdout logs
│   └── logstash-config.conf    # Logstash configuration for log parsing and mapping
├── Jenkinsfile                 # Declares the automated CI/CD pipeline
└── README.md                   # Quickstart instructions
```

---

## 4. Application Codebases (Frontend & Backend)

### Frontend React Application
Built with Vite and React, the frontend serves as the storefront. When running locally outside of containers, it starts on `http://localhost:3000` (configured in [vite.config.js](file:///Users/arohichakote/Desktop/retailops/frontend/vite.config.js)).
When deployed to Kubernetes, it is hosted inside an Nginx container defined by [nginx.conf](file:///Users/arohichakote/Desktop/retailops/frontend/nginx.conf) and exposed via a Kubernetes Service.

### Backend Node.js API
Built with Express, the backend exposes REST APIs (e.g., product browsing, checkout cart validation, user authentication, and admin updates) on port `5001`. It connects to MongoDB via Mongoose. The database authentication logic supports both customer credentials (stored as Bcrypt hashes) and default admin accounts (stored as SHA-256 hashes).

---

## 5. CI/CD Pipeline (Jenkins)

The pipeline is declared in [Jenkinsfile](file:///Users/arohichakote/Desktop/retailops/Jenkinsfile). It executes the following build stages:

1. **Checkout**: Pulls the latest code commit from the GitHub repository.
2. **Install Dependencies**: Downloads package files for the frontend and backend microservices.
3. **Run Unit Tests**: Runs mocha/jest tests (`npm run test`) to verify code integrity.
4. **Build Frontend**: Compiles React assets into an optimized production bundle.
5. **Docker Build**: Compiles Docker images for both services:
   - `docker.io/arohiick11/retailops-backend`
   - `docker.io/arohiick11/retailops-frontend`
6. **Vulnerability Scan**: Scrapes container structures for security patches.
7. **Docker Push**: Pushes the verified images to the Docker Hub registry.
8. **Deploy to Kubernetes**: Connects to the target cluster context and applies manifests.
   * *Note:* To execute from inside local container setups without TLS certificate validation blocks, kubectl commands are executed with `--insecure-skip-tls-verify=true`.

---

## 6. Infrastructure as Code (Terraform)

The files in the `terraform/` directory provision a production-ready cloud structure on AWS:
* **Networking**: Configures a dedicated VPC (CIDR `10.0.0.0/16`), public and private subnets, Internet Gateways, NAT Gateways, and route tables.
* **Compute**: Launches an AWS EKS (Elastic Kubernetes Service) cluster with self-managed node groups placed in private subnets for security isolation.
* **Storage**: Provisioning policies map EBS volumes to StatefulSet deployments.

---

## 7. Kubernetes Orchestration & Workloads

Workloads are deployed under separate namespaces:
* **Stateless Workloads**: The frontend and backend pods are managed by Kubernetes Deployments. The [hpa.yaml](file:///Users/arohichakote/Desktop/retailops/kubernetes/hpa.yaml) automatically scales these pods based on resource triggers.
* **Stateful Workloads**: MongoDB runs inside a `StatefulSet` ([mongo-statefulset.yaml](file:///Users/arohichakote/Desktop/retailops/kubernetes/mongo-statefulset.yaml)) referencing persistent volume claims to prevent data loss.
* **Ingress**: Traffic routing is controlled by [ingress.yaml](file:///Users/arohichakote/Desktop/retailops/kubernetes/ingress.yaml), forwarding storefront requests and API streams through a single gateway.

---

## 8. Security & Secrets Management (HashiCorp Vault)

To avoid hardcoded plaintext credentials:
* **Deployment**: Vault is deployed in dev mode via [vault-deployment.yaml](file:///Users/arohichakote/Desktop/retailops/vault/vault-deployment.yaml) in the `vault` namespace and exposed on port `8200`.
* **Initialization**: The [init-vault.sh](file:///Users/arohichakote/Desktop/retailops/vault/init-vault.sh) script mounts the KV v2 secrets engine and seeds secrets:
  - `secret/retailops/database` containing the connection URI.
  - `secret/retailops/backend` containing JWT secret keys.
* **Consumption**: Workload pods query the Vault API to fetch credentials dynamically at startup, ensuring database and validation keys never live in code repository files.

---

## 9. Observability (Metrics & Logging Stack)

### Metrics Stack (Metrics Server, Prometheus, Grafana)
* **Metrics Server**: Aggregates node and pod resource usage (CPU/Memory) locally, allowing the HPA to scale workloads dynamically.
* **Prometheus**: Installed in the `monitoring` namespace, scraping metrics from nodes, pods, and Kubernetes services.
* **Grafana**: Pulls telemetry from Prometheus to present graphical dashboards tracking system throughput, latency, pod lifecycles, and memory profiles.

### Centralized Logging Stack (Fluent Bit, Elasticsearch, Kibana)
* **Fluent Bit**: Deployed as a DaemonSet to capture standard outputs from all pods.
* **Elasticsearch**: Acts as a central database indexing container log streams.
* **Kibana**: Dashboard UI exposed on port `5601` for real-time log querying, filtering, and debugging.

---

## 10. Disaster Recovery, High Availability & Rollbacks

Disaster recovery and system updates follow the rules defined in [disaster_recovery_plan.md](file:///Users/arohichakote/Desktop/retailops/docs/disaster_recovery_plan.md):

* **Service SLAs**:
  * **Stateless RTO**: < 5 minutes (re-scheduled automatically).
  * **Stateful RTO**: < 15 minutes (StatefulSet disk reattachment).
  * **Configuration RPO**: 0 (restored instantly from Git history).
* **Rollback Actions**: Faulty updates can be instantly reverted via:
  ```bash
  kubectl rollout undo deployment/frontend-deployment
  kubectl rollout undo deployment/backend-deployment
  ```
  or by reverting code commits in Git to trigger the Jenkins rebuild pipeline.
* **Unseal Actions**: If the Vault pod restarts, it is unsealed using Shamir keys or initialized via `./vault/init-vault.sh`.
* **Restore Actions**: MongoDB is restored by copying backup snapshot archives to the database container and executing:
  ```bash
  mongorestore --archive=/tmp/backup.archive --drop
  ```
* **Cluster Rebuilding**: Katastrophic cluster failures are repaired by running:
  ```bash
  cd terraform && terraform apply -auto-approve
  kubectl apply -f kubernetes/
  ```
