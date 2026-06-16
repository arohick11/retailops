# RetailOps Cloud-Native Architecture Review Report
This report provides a formal evaluation of the RetailOps platform architecture from the perspective of a Senior Solutions Architect. It details architectural alignment with cloud-native pillars, scalability models, security controls, reliability strategies, and DevOps lifecycle integration.

---

## 1. Why this Architecture is Cloud-Native

The RetailOps architecture is built upon the core principles of **Cloud-Native Computing**:

* **Microservices Decomposition:** The frontend storefront (React/Nginx) and backend API (Node.js/Express) are developed, deployed, and scaled independently. This separation limits failure domains and enables rapid feature delivery.
* **Containerization:** All services are packaged into Docker containers. This standardizes runtime environments across developer workstations, staging systems, and production environments, eliminating "it works on my machine" issues.
* **Declarative API Orchestration:** The platform relies on Kubernetes manifests to define the desired state (e.g., replica count, security contexts, probes). The Kubernetes control plane continuously reconciles the active state to match this declaration.
* **Infrastructure as Code (IaC):** The foundational networking (VPC, subnets, route tables) and EKS clusters are defined in Terraform. This ensures all infrastructure is version-controlled, auditable, and repeatable.

---

## 2. Scalability Approach

The platform manages traffic surges (e.g., Black Friday sales events) using a multi-layered scalability approach:

* **Horizontal Pod Autoscaling (HPA):** The `kubernetes/hpa.yaml` is configured to scale the frontend and backend pods automatically from 2 to 20 replicas based on target metrics (such as CPU utilization > 75% or custom request metrics).
* **Stateless Application Tier:** Both the React frontend and Node.js backend are stateless. Users do not store session affinity on specific servers; request states are held in authorization tokens (JWT) and database records, allowing pods to scale instantly.
* **Database State Isolation:** MongoDB is configured as a StatefulSet. While the stateless app tiers scale out dynamically, the database preserves state identity, scaling disk resources via AWS EBS volume attachments.
* **Load Balancing (VPC Layer):** AWS Application Load Balancers (ALBs) distribute traffic evenly across available Kubernetes nodes and application pods, handling spikes with low latency.

---

## 3. Security Approach (DevSecOps Integration)

Security is integrated directly into the deployment pipeline and runtime cluster rather than treated as an afterthought:

* **Zero-Trust Network Isolation:** Public-private subnet segregation ensures that only the Application Load Balancer is exposed to the internet. The backend, database, Vault, and monitoring stacks run within private subnets with no public IPs.
* **Dynamic Secret Management (Vault):** Application secrets, API keys, and database passwords are not stored in code or base64-encoded Kubernetes secrets. Instead, the **Vault Agent Sidecar Injector** fetches secrets dynamically at runtime and mounts them as short-lived, encrypted, in-memory files.
* **CI/CD Scanning (Trivy):** The Jenkins pipeline runs vulnerability scans on Docker images before pushing them to the Docker Hub registry, preventing common vulnerabilities and exposures (CVEs) from entering production.
* **Fine-Grained Policies:** Network Policies and Vault ACL policies enforce the principle of least privilege, restricting pod-to-pod communication and service account access.

---

## 4. Reliability Approach

High availability and fault tolerance are built into the design of each component:

* **Self-Healing Containers:** Kubernetes continuously monitors containers using Liveness and Readiness probes. If the backend Node.js application locks up, Kubernetes automatically kills and restarts the pod.
* **Rolling Updates:** Deployments specify rolling update strategies. This ensures that new application versions are brought up and verified before older pods are terminated, resulting in zero-downtime deployments.
* **Multi-AZ Node Groups:** The EKS cluster runs across public and private subnets distributed across multiple AWS Availability Zones (AZs). If an entire AWS data center fails, the cluster automatically reschedules pods on nodes in surviving zones.
* **Database Replication:** The StatefulSet architecture facilitates future deployment of MongoDB replica sets (Primary-Secondary-Arbiter), ensuring database failover capabilities.

---

## 5. DevOps Lifecycle Integration

Observability links development, operations, and QA teams throughout the product lifecycle:

* **Continuous Integration (CI):** Jenkins automates tests, builds, and pushes on every pull request, ensuring main branch code is always deployable.
* **Continuous Delivery (CD):** Kubernetes manifest updates are automatically applied by the pipeline, minimizing manual deployment errors.
* **Single Pane of Glass (Monitoring):** Prometheus and Grafana provide real-time dashboard tracking of SRE Golden Signals (Latency, Traffic, Errors, Saturation).
* **Centralized Logging (ELK):** Filebeat harvests logs from ephemeral containers instantly, storing them in Elasticsearch. Operations teams can query historical application logs even after a pod crashes and is terminated.
