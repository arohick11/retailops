pipeline {
    agent any

    environment {
        // Registry parameters - change these for your actual registry
        REGISTRY_URL   = 'docker.io'
        DOCKER_HUB_ORG = 'arohiick11'
        BACKEND_IMAGE  = 'retailops-backend'
        FRONTEND_IMAGE = 'retailops-frontend'
        
        // Credentials IDs set in Jenkins Credentials Manager
        DOCKER_CREDS_ID = 'docker-hub-credentials'
        KUBE_CONFIG_ID  = 'k8s-kubeconfig'
    }

    parameters {
        string(name: 'DEPLOY_ENV', defaultValue: 'staging', description: 'Environment to deploy the application (staging or production)')
        booleanParam(name: 'RUN_SECURITY_SCAN', defaultValue: true, description: 'Run security scanning with Trivy on Docker images')
    }

    stages {
        stage('Checkout Code') {
            steps {
                cleanWs()
                checkout scm
            }
        }

        stage('Install & Test') {
            parallel {
                stage('Backend Checks') {
                    steps {
                        dir('backend') {
                            echo 'Installing backend dependencies...'
                            sh 'npm install --no-audit --no-fund'
                            echo 'Running backend unit tests...'
                            sh 'npm test'
                        }
                    }
                }
                stage('Frontend Checks') {
                    steps {
                        dir('frontend') {
                            echo 'Installing frontend dependencies...'
                            sh 'npm install --no-audit --no-fund'
                            echo 'Building frontend assets...'
                            sh 'npm run build'
                        }
                    }
                }
            }
        }

        stage('Docker Build') {
            steps {
                echo 'Building backend Docker image...'
                sh "docker build -t ${REGISTRY_URL}/${DOCKER_HUB_ORG}/${BACKEND_IMAGE}:${BUILD_NUMBER} ./backend"
                sh "docker build -t ${REGISTRY_URL}/${DOCKER_HUB_ORG}/${BACKEND_IMAGE}:latest ./backend"

                echo 'Building frontend Docker image...'
                sh "docker build -t ${REGISTRY_URL}/${DOCKER_HUB_ORG}/${FRONTEND_IMAGE}:${BUILD_NUMBER} ./frontend"
                sh "docker build -t ${REGISTRY_URL}/${DOCKER_HUB_ORG}/${FRONTEND_IMAGE}:latest ./frontend"
            }
        }

        stage('Vulnerability Scan') {
            when {
                expression { return params.RUN_SECURITY_SCAN }
            }
            steps {
                echo 'Scanning backend image with Trivy...'
                sh "trivy image --severity HIGH,CRITICAL --exit-code 0 ${REGISTRY_URL}/${DOCKER_HUB_ORG}/${BACKEND_IMAGE}:${BUILD_NUMBER}"

                echo 'Scanning frontend image with Trivy...'
                sh "trivy image --severity HIGH,CRITICAL --exit-code 0 ${REGISTRY_URL}/${DOCKER_HUB_ORG}/${FRONTEND_IMAGE}:${BUILD_NUMBER}"
            }
        }

        stage('Docker Push') {
            steps {
                // Log in to Docker registry using Jenkins credentials block
                withCredentials([usernamePassword(credentialsId: env.DOCKER_CREDS_ID, passwordVariable: 'DOCKER_PASSWORD', usernameVariable: 'DOCKER_USERNAME')]) {
                    sh "echo \$DOCKER_PASSWORD | docker login ${REGISTRY_URL} -u \$DOCKER_USERNAME --password-stdin"
                    
                    echo 'Pushing backend images...'
                    sh "docker push ${REGISTRY_URL}/${DOCKER_HUB_ORG}/${BACKEND_IMAGE}:${BUILD_NUMBER}"
                    sh "docker push ${REGISTRY_URL}/${DOCKER_HUB_ORG}/${BACKEND_IMAGE}:latest"

                    echo 'Pushing frontend images...'
                    sh "docker push ${REGISTRY_URL}/${DOCKER_HUB_ORG}/${FRONTEND_IMAGE}:${BUILD_NUMBER}"
                    sh "docker push ${REGISTRY_URL}/${DOCKER_HUB_ORG}/${FRONTEND_IMAGE}:latest"
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                // Read Kubernetes configuration file using Jenkins credential block
                withCredentials([file(credentialsId: env.KUBE_CONFIG_ID, variable: 'KUBECONFIG')]) {
                    echo "Deploying to Kubernetes Environment: ${params.DEPLOY_ENV}..."
                    
                    // Replace image tags dynamically in deployment manifests
                    sh """
                        sed -i 's|image: .*/${BACKEND_IMAGE}:.*|image: ${REGISTRY_URL}/${DOCKER_HUB_ORG}/${BACKEND_IMAGE}:${BUILD_NUMBER}|g' kubernetes/backend-deploy.yaml
                        sed -i 's|image: .*/${FRONTEND_IMAGE}:.*|image: ${REGISTRY_URL}/${DOCKER_HUB_ORG}/${FRONTEND_IMAGE}:${BUILD_NUMBER}|g' kubernetes/frontend-deploy.yaml
                    """

                    // Apply manifests using kubectl
                    sh "kubectl --kubeconfig=\$KUBECONFIG --insecure-skip-tls-verify=true apply -f kubernetes/mongo-statefulset.yaml"
                    sh "kubectl --kubeconfig=\$KUBECONFIG --insecure-skip-tls-verify=true apply -f kubernetes/backend-deploy.yaml"
                    sh "kubectl --kubeconfig=\$KUBECONFIG --insecure-skip-tls-verify=true apply -f kubernetes/frontend-deploy.yaml"
                    sh "kubectl --kubeconfig=\$KUBECONFIG --insecure-skip-tls-verify=true apply -f kubernetes/ingress.yaml"
                    sh "kubectl --kubeconfig=\$KUBECONFIG --insecure-skip-tls-verify=true apply -f kubernetes/hpa.yaml"
                }
            }
        }
    }

    post {
        always {
            echo 'Cleaning up workspace...'
            cleanWs()
        }
        success {
            echo "CI/CD Pipeline succeeded for build #${BUILD_NUMBER}."
        }
        failure {
            echo "CI/CD Pipeline failed on build #${BUILD_NUMBER}. Check logs for details."
        }
    }
}
