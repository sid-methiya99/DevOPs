pipeline {
    agent any

    triggers {
        githubPush()
    }

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    environment {
        // Set your Docker Hub username
        DOCKER_HUB_USERNAME = 'sidmethiya99'
        BACKEND_IMAGE = 'second-brain-backend'
        FRONTEND_IMAGE = 'second-brain-frontend'
        TAG_NAME = "${env.BUILD_NUMBER}"
        DEPLOY_TAG = 'latest'
        DOCKER_CRED_ID = 'docker-hub-credentials' // Jenkins credentials ID ()
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Images') {
            parallel {
                stage('Build Backend') {
                    steps {
                        dir('backend') {
                            sh """
                                docker build -t ${DOCKER_HUB_USERNAME}/${BACKEND_IMAGE}:${TAG_NAME} .
                                docker tag ${DOCKER_HUB_USERNAME}/${BACKEND_IMAGE}:${TAG_NAME} ${DOCKER_HUB_USERNAME}/${BACKEND_IMAGE}:${DEPLOY_TAG}
                            """
                        }
                    }
                }
                stage('Build Frontend') {
                    steps {
                        dir('frontend') {
                            sh """
                                docker build -t ${DOCKER_HUB_USERNAME}/${FRONTEND_IMAGE}:${TAG_NAME} .
                                docker tag ${DOCKER_HUB_USERNAME}/${FRONTEND_IMAGE}:${TAG_NAME} ${DOCKER_HUB_USERNAME}/${FRONTEND_IMAGE}:${DEPLOY_TAG}
                            """
                        }
                    }
                }
            }
        }

        stage('Smoke Test Containers') {
            parallel {
                stage('Test Backend') {
                    steps {
                        sh """
                            docker run -d --rm --name sb-backend-test -p 5001:5000 \
                              -e MONGODB_URI=mongodb://localhost:27017/second-brain-test \
                              ${DOCKER_HUB_USERNAME}/${BACKEND_IMAGE}:${TAG_NAME}
                            sleep 5
                            curl -fsS http://localhost:5001/health
                            docker stop sb-backend-test || true
                        """
                    }
                }
                stage('Test Frontend') {
                    steps {
                        sh """
                            docker run -d --rm --name sb-frontend-test -p 3001:80 \
                              ${DOCKER_HUB_USERNAME}/${FRONTEND_IMAGE}:${TAG_NAME}
                            sleep 3
                            curl -IfsS http://localhost:3001
                            docker stop sb-frontend-test || true
                        """
                    }
                }
            }
        }

        stage('Push to Docker Hub') {
            steps {
                withCredentials([usernamePassword(credentialsId: DOCKER_CRED_ID, usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASSWORD')]) {
                    sh """
                        echo $DOCKER_PASSWORD | docker login -u $DOCKER_USER --password-stdin
                        docker push ${DOCKER_HUB_USERNAME}/${BACKEND_IMAGE}:${TAG_NAME}
                        docker push ${DOCKER_HUB_USERNAME}/${BACKEND_IMAGE}:${DEPLOY_TAG}
                        docker push ${DOCKER_HUB_USERNAME}/${FRONTEND_IMAGE}:${TAG_NAME}
                        docker push ${DOCKER_HUB_USERNAME}/${FRONTEND_IMAGE}:${DEPLOY_TAG}
                        docker logout || true
                    """
                }
            }
        }

        stage('Deploy') {
            steps {
                script {
                    // Generate a .env for docker compose image substitution
                    sh """
                        cat > .env <<EOF
DOCKER_HUB_USERNAME=${DOCKER_HUB_USERNAME}
BACKEND_IMAGE=${BACKEND_IMAGE}
FRONTEND_IMAGE=${FRONTEND_IMAGE}
DEPLOY_TAG=${DEPLOY_TAG}
EOF
                    """

                    // Re-deploy using docker compose and the pulled images
                    sh """
                        docker compose down || true
                        docker compose pull || true
                        docker compose up -d
                    """
                }
            }
        }

        stage('Health Check') {
            steps {
                sleep 10
                sh """
                    curl -f http://localhost:3000/health
                    curl -f http://localhost:5000/health
                """
            }
        }
    }

    post {
        always {
            echo "Pipeline finished! Status: ${currentBuild.result}"
        }
        success {
            echo 'Deployment complete. Your changes are live.'
        }
        failure {
            echo 'Deployment failed. Check logs.'
        }
    }
}
