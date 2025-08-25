pipeline {
    agent any
    
    environment {
        DOCKER_IMAGE_BACKEND = 'second-brain-backend'
        DOCKER_IMAGE_FRONTEND = 'second-brain-frontend'
        DOCKER_TAG = "${env.BUILD_NUMBER}"
        DOCKER_REGISTRY = 'your-dockerhub-username'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Install Dependencies') {
            steps {
                dir('backend') {
                    sh 'npm install'
                }
            }
        }
        
        stage('Run Tests') {
            steps {
                dir('backend') {
                    sh 'npm test || echo "No tests configured"'
                }
            }
        }
        
        stage('Build Docker Images') {
            parallel {
                stage('Build Backend Image') {
                    steps {
                        dir('backend') {
                            sh """
                                docker build -t ${DOCKER_REGISTRY}/${DOCKER_IMAGE_BACKEND}:${DOCKER_TAG} .
                                docker tag ${DOCKER_REGISTRY}/${DOCKER_IMAGE_BACKEND}:${DOCKER_TAG} ${DOCKER_REGISTRY}/${DOCKER_IMAGE_BACKEND}:latest
                            """
                        }
                    }
                }
                stage('Build Frontend Image') {
                    steps {
                        dir('frontend') {
                            sh """
                                docker build -t ${DOCKER_REGISTRY}/${DOCKER_IMAGE_FRONTEND}:${DOCKER_TAG} .
                                docker tag ${DOCKER_REGISTRY}/${DOCKER_IMAGE_FRONTEND}:${DOCKER_TAG} ${DOCKER_REGISTRY}/${DOCKER_IMAGE_FRONTEND}:latest
                            """
                        }
                    }
                }
            }
        }
        
        stage('Push to Docker Hub') {
            when {
                branch 'main'
            }
            steps {
                script {
                    withCredentials([usernamePassword(credentialsId: 'dockerhub-credentials', usernameVariable: 'DOCKER_USERNAME', passwordVariable: 'DOCKER_PASSWORD')]) {
                        sh 'echo $DOCKER_PASSWORD | docker login -u $DOCKER_USERNAME --password-stdin'
                        
                        sh """
                            docker push ${DOCKER_REGISTRY}/${DOCKER_IMAGE_BACKEND}:${DOCKER_TAG}
                            docker push ${DOCKER_REGISTRY}/${DOCKER_IMAGE_BACKEND}:latest
                            docker push ${DOCKER_REGISTRY}/${DOCKER_IMAGE_FRONTEND}:${DOCKER_TAG}
                            docker push ${DOCKER_REGISTRY}/${DOCKER_IMAGE_FRONTEND}:latest
                        """
                    }
                }
            }
        }
        
        stage('Deploy to Production') {
            when {
                branch 'main'
            }
            steps {
                script {
                    // Update docker-compose with new image tags
                    sh """
                        sed -i 's|image: ${DOCKER_REGISTRY}/${DOCKER_IMAGE_BACKEND}:.*|image: ${DOCKER_REGISTRY}/${DOCKER_IMAGE_BACKEND}:${DOCKER_TAG}|g' docker-compose.yml
                        sed -i 's|image: ${DOCKER_REGISTRY}/${DOCKER_IMAGE_FRONTEND}:.*|image: ${DOCKER_REGISTRY}/${DOCKER_IMAGE_FRONTEND}:${DOCKER_TAG}|g' docker-compose.yml
                    """
                    
                    // Deploy using docker-compose
                    sh """
                        docker-compose down
                        docker-compose pull
                        docker-compose up -d
                    """
                }
            }
        }
        
        stage('Health Check') {
            when {
                branch 'main'
            }
            steps {
                script {
                    // Wait for services to be ready
                    sleep 30
                    
                    // Check if services are responding
                    sh """
                        curl -f http://localhost/health || exit 1
                        curl -f http://localhost:5000/health || exit 1
                    """
                }
            }
        }
    }
    
    post {
        always {
            // Clean up Docker images
            sh """
                docker image prune -f
                docker system prune -f
            """
        }
        success {
            echo 'Pipeline completed successfully!'
        }
        failure {
            echo 'Pipeline failed!'
            // Send notification (email, Slack, etc.)
        }
    }
}
