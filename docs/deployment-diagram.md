# RetailOps Deployment Architecture

This document describes the logical deployment topology and the end-to-end CI/CD lifecycle of the RetailOps platform.

## 1. System Deployment & CI/CD Flow Diagram

The diagram below details the entire pipeline from code commit by developers to image building, container registry storage, Kubernetes deployment orchestration, and runtime observability/security configurations.

```mermaid
graph TD
    %% Node Definitions
    Developer[Developer]
    GitHub[(GitHub Repository)]
    Jenkins[Jenkins CI/CD]
    DockerBuild[Docker Build]
    DockerHub[(Docker Hub)]
    Kubernetes[Kubernetes Cluster]
    FrontendPods[Frontend Pods]
    BackendPods[Backend Pods]
    MongoDBStatefulSet[(MongoDB StatefulSet)]
    
    Vault[Vault]
    
    Prometheus[Prometheus]
    Grafana[Grafana]
    
    FluentBit[Fluent Bit]
    Elasticsearch[(Elasticsearch)]
    Kibana[Kibana]

    %% CI/CD Flow
    Developer -->|1. Commit & Push| GitHub
    GitHub -->|2. Webhook Trigger| Jenkins
    Jenkins -->|3. Start Pipeline| DockerBuild
    DockerBuild -->|4. Build & Tag Images| DockerHub
    Jenkins -->|5. Apply Kubernetes Manifests| Kubernetes
    DockerHub -->|6. Pull Container Images| Kubernetes

    %% Kubernetes Runtime
    subgraph K8s [Kubernetes Cluster]
        direction TB
        Kubernetes --> FrontendPods
        Kubernetes --> BackendPods
        Kubernetes --> MongoDBStatefulSet
        
        %% Internal interactions
        FrontendPods -->|HTTP API Requests| BackendPods
        BackendPods -->|Read/Write Operations| MongoDBStatefulSet
    end

    %% Security Injection
    BackendPods -.->|7. Secret Retrieval / Sidecar| Vault

    %% Observability - Logs Stack
    FrontendPods -.->|8. Collect Stdout Logs| FluentBit
    BackendPods -.->|8. Collect Stdout Logs| FluentBit
    MongoDBStatefulSet -.->|8. Collect Stdout Logs| FluentBit
    FluentBit -->|9. Forward Logs| Elasticsearch
    Elasticsearch -->|10. Query Logs| Kibana

    %% Observability - Metrics Stack
    Prometheus -->|8. Scrape Metrics| FrontendPods
    Prometheus -->|8. Scrape Metrics| BackendPods
    Prometheus -->|8. Scrape Metrics| MongoDBStatefulSet
    Grafana -->|9. Query Metrics| Prometheus

    %% Styling
    classDef dev fill:#eceff1,stroke:#607d8b,stroke-width:2px,color:#37474f;
    classDef git fill:#efebe9,stroke:#8d6e63,stroke-width:2px,color:#4e342e;
    classDef cicd fill:#fff3e0,stroke:#ffb74d,stroke-width:2px,color:#e65100;
    classDef reg fill:#e1f5fe,stroke:#4fc3f7,stroke-width:2px,color:#01579b;
    classDef cluster fill:#f3e5f5,stroke:#ba68c8,stroke-width:2px,color:#4a148c;
    classDef pods fill:#e8f5e9,stroke:#81c784,stroke-width:2px,color:#1b5e20;
    classDef security fill:#ffebee,stroke:#e57373,stroke-width:2px,color:#b71c1c;
    classDef observer fill:#e0f2f1,stroke:#4db6ac,stroke-width:2px,color:#004d40;

    class Developer dev;
    class GitHub git;
    class Jenkins,DockerBuild cicd;
    class DockerHub reg;
    class Kubernetes cluster;
    class FrontendPods,BackendPods,MongoDBStatefulSet pods;
    class Vault security;
    class Prometheus,Grafana,FluentBit,Elasticsearch,Kibana observer;
```

---

## 2. CI/CD Lifecycle & Deployment Process

The deployment process follows a fully automated git-ops inspired workflow:

### Step 1: Code Integration
1. The **Developer** pushes code commits or infrastructure changes (Kubernetes manifests, Helm scripts, Terraform code) to the central **GitHub** repository.
2. GitHub fires a repository webhook to notify **Jenkins** of the new code changes.

### Step 2: Build & Package
3. **Jenkins** triggers a build agent that runs unit tests, static code analysis, and the **Docker Build** stage.
4. The **Docker Build** compiles the frontend React code and backend Node.js code, packages them into optimized multi-stage Docker images, and pushes them to **Docker Hub**.

### Step 3: Orchestration & Placement
5. **Jenkins** connects to the **Kubernetes** API server using the cluster credentials (e.g., via `kubectl`) and applies the updated manifests.
6. The **Kubernetes Cluster** pulls the corresponding newly built container images from **Docker Hub** to schedule and run the updated application pods:
   - **Frontend Pods**: Serving the React UI storefront.
   - **Backend Pods**: Hosting the Node.js API services.
   - **MongoDB StatefulSet**: Maintaining the stateful database nodes.

---

## 3. Operational Infrastructure

### Security (Secret Management)
* **Vault**: When the Backend Pods start up, they query the **Vault** instance to retrieve sensitive environment variables (such as MongoDB connection strings and JWT secrets), avoiding storing sensitive information in plaintext configs.

### Observability & Monitoring
* **Fluent Bit**: A lightweight log daemon running on cluster nodes. It collects stdout/stderr logs from the **Frontend Pods**, **Backend Pods**, and **MongoDB StatefulSet** and ships them to **Elasticsearch**.
* **Elasticsearch & Kibana**: Elasticsearch indexes and stores logs chronologically, enabling real-time analytics and querying via the **Kibana** interface.
* **Prometheus**: Scrapes resource usage (CPU, Memory, Request Counts) directly from active pods.
* **Grafana**: Pulls telemetry from Prometheus to populate performance monitoring dashboards.
