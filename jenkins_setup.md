# Jenkins CI/CD Pipeline Setup Guide - RetailOps

This guide explains how to set up the Jenkins server and run the CI/CD pipeline for the RetailOps platform.

---

## 1. Prerequisites & Required Plugins

Ensure your Jenkins instance has the following plugins installed:
* **Pipeline** (Core pipeline capabilities)
* **Pipeline Stage View** (Visualizes progress of each build stage)
* **Docker Pipeline** (Allows Jenkins to interact with Docker commands)
* **Credentials Binding** (Secures credentials for Docker Hub and Kubernetes)
* **Git** (Fetches the repository)

---

## 2. Secrets & Credentials Setup

To keep your pipeline secure (cyberattack proof), do not hardcode passwords. Add the following credentials in **Jenkins Dashboard** → **Manage Jenkins** → **Credentials**:

1. **Docker Hub Access Token:**
   * **Kind:** Username with password
   * **ID:** `docker-hub-credentials`
   * **Username:** *Your Docker Hub username*
   * **Password:** *Your Docker Hub personal access token/password*

2. **Kubernetes Configuration File:**
   * **Kind:** Secret file
   * **ID:** `k8s-kubeconfig`
   * **File:** Upload your cluster's `kubeconfig` file (usually found at `~/.kube/config`).

---

## 3. Creating the Jenkins Pipeline Job

1. Go to the Jenkins dashboard and click **New Item**.
2. Enter the name `retailops-pipeline` and select **Pipeline**, then click **OK**.
3. Under the **General** tab, check the box **GitHub project** and enter your repository URL.
4. Scroll down to the **Pipeline** section:
   * **Definition:** Select *Pipeline script from SCM*.
   * **SCM:** Select *Git*.
   * **Repository URL:** Enter your GitHub repository URL.
   * **Script Path:** Enter `Jenkinsfile`.
5. Click **Save**.

---

## 4. Pipeline Stages & Architecture

The pipeline automates the following steps:

```
                  [Developer Commit]
                          │
                          ▼
                 [GitHub Repository]
                          │
                          ▼
              [Jenkins Pipeline Start]
                          │
       ┌──────────────────┴──────────────────┐
       ▼                                     ▼
[Backend Checks]                     [Frontend Checks]
 - npm install                        - npm install
 - npm test (Unit Tests)              - npm run build (Static compiler)
       └──────────────────┬──────────────────┘
                          │
                          ▼
                  [Docker Build]
                   - Backend Image (tag: BUILD_NUMBER, latest)
                   - Frontend Image (tag: BUILD_NUMBER, latest)
                          │
                          ▼
                [Vulnerability Scan]
                 - Trivy scan checks for CVEs (Cyberattack protection)
                          │
                          ▼
                   [Docker Push]
                    - Push to Docker Hub Registry
                          │
                          ▼
               [Deploy to Kubernetes]
                - Dynamic tag injection via sed
                - kubectl apply -f kubernetes/
```

### Explaining the pipeline to reviewers:
* **Quality Gates (Stage 2):** Runs frontend compiler checks and backend unit tests in parallel to save time and ensure no broken builds reach staging.
* **Security & Vulnerability Scans (Stage 4):** Uses **Trivy** to scan built Docker containers, ensuring zero high or critical CVE vulnerabilities are deployed, protecting against cyberattacks.
* **Continuous Deployment (Stage 6):** Safely replaces placeholder tags in Kubernetes manifest files with the unique `${BUILD_NUMBER}` of the current successful run and applies them instantly using `kubectl`.
