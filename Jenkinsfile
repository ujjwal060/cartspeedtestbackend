pipeline {
    agent any

    environment {
        IMAGE_NAME = "docker.io/kartikeytiwari/cart-back"
        CONTAINER_PORT = "9090"
        HOST_PORT = "9090"
        DOCKER_HUB_USERNAME = credentials('docker-hub-username')
        DOCKER_HUB_PASSWORD = credentials('docker-hub-password')
        EMAIL_RECIPIENTS = "ujjwal.singh@aayaninfotech.com"
        SONARTOKEN = credentials('sonartoken')
        AWS_ACCESS_KEY_ID = credentials('AWS_ACCESS_KEY_ID')
        AWS_SECRET_ACCESS_KEY = credentials('AWS_SECRET_ACCESS_KEY')
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Login to Docker Hub') {
            steps {
                script {
                    sh '''
                    echo "Logging in to Docker Hub..."
                    echo "$DOCKER_HUB_PASSWORD" | docker login -u "$DOCKER_HUB_USERNAME" --password-stdin
                    '''
                }
            }
        }

        stage('Generate Next Image Tag') {
            steps {
                script {
                    def latestTag = sh(
                        script: '''
                        curl -s https://hub.docker.com/v2/repositories/kartikeytiwari/cart-back/tags/ | \
                        jq -r '.results[].name' | grep -E '^stage-v[0-9]+$' | sort -V | tail -n1 | awk -F'v' '{print $2}'
                        ''',
                        returnStdout: true
                    ).trim()

                    def newTag = latestTag ? "stage-v${latestTag.toInteger() + 1}" : "stage-v1"
                    env.NEW_STAGE_TAG = newTag
                    echo "🆕 New Docker Image Tag: ${newTag}"
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    def buildResult = sh(
                        script: '''#!/bin/bash
                        set -eo pipefail
                        echo "Building Docker image..."
                        docker build -t ${IMAGE_NAME}:latest . 2>&1 | tee failure.log
                        ''',
                        returnStatus: true
                    )

                    if (buildResult != 0) {
                        error "❌ Docker build failed! Check failure.log"
                    }
                }
            }
        }

        stage('Tag Docker Image') {
            steps {
                sh '''
                docker tag ${IMAGE_NAME}:latest ${IMAGE_NAME}:${NEW_STAGE_TAG}
                docker tag ${IMAGE_NAME}:latest ${IMAGE_NAME}:prodv1
                '''
            }
        }

        stage('Security Scan with Trivy') {
            steps {
                sh '''
                echo "Running Trivy security scan..."
                docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy image \
                    --exit-code 0 --severity HIGH,CRITICAL ${IMAGE_NAME}:${NEW_STAGE_TAG} || \
                echo "⚠️ Trivy scan found vulnerabilities"
                '''
            }
        }

        stage('Push Docker Image to Docker Hub') {
            steps {
                sh '''
                docker push ${IMAGE_NAME}:${NEW_STAGE_TAG}
                docker push ${IMAGE_NAME}:prodv1
                '''
            }
        }

        stage('Stop Existing Container') {
            steps {
                sh '''
                CONTAINER_ID=$(docker ps -q --filter "publish=${HOST_PORT}")
                if [ -n "$CONTAINER_ID" ]; then
                    docker stop "$CONTAINER_ID" || true
                    docker rm "$CONTAINER_ID" || true
                else
                    echo "No container running on port ${HOST_PORT}"
                fi
                '''
            }
        }

        stage('Run New Docker Container') {
            steps {
                sh '''
                echo "Starting new container with prodv1 tag..."
                docker run -d \
                    -e AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID} \
                    -e AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY} \
                    -p ${HOST_PORT}:${CONTAINER_PORT} ${IMAGE_NAME}:prodv1
                '''
            }
        }
    }
}
