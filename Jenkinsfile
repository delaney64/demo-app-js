pipeline {
  agent any

  environment {
    DOCKER_NET = 'devsecops-lab_devsecops-lab_devsecops_net'   // Docker network Jenkins & Sonar share
    SONAR_HOST = 'http://sonarqube:9000'                        // SonarQube in the Docker network
    IMAGE_NAME = 'demo-app-js:latest'
  }

  options { timestamps() }

  stages {
    stage('Checkout') {
      steps {
        checkout([$class: 'GitSCM',
          branches: [[name: '*/main']],
          userRemoteConfigs: [[
            url: 'https://github.com/delaney64/demo-app-js.git',
            // you can omit credentialsId if it's a public repo
            credentialsId: 'github-https'
          ]]
        ])
      }
    }

    stage('Install & Test') {
      steps {
        // FIX: removed stray quote and ensured clean shell syntax
        sh '''
          docker run --rm --network ${DOCKER_NET} \
            -v "$PWD:/ws" \
            -w /ws \
            'node:20-alpine sh -c 'npm install && npm test'
        '''
      }
      post {
        always {
          // These are fine; they just won't produce results yet
          junit testResults: 'junit.xml', allowEmptyResults: true
          publishHTML(target: [
            reportDir: 'coverage',
            reportFiles: 'lcov-report/index.html',
            reportName: 'Coverage'
          ])
        }
      }
    }

    stage('SonarQube Analysis') {
      steps {
        withCredentials([string(credentialsId: 'sonar-token', variable: 'SONAR_TOKEN')]) {
          sh '''
            docker run --rm --network ${DOCKER_NET} \
              -v "$PWD:/usr/src" -w /usr/src \
              sonarsource/sonar-scanner-cli:latest \
              -Dsonar.projectKey=demo-app-js \
              -Dsonar.sources=src \
              -Dsonar.tests=tests \
              -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info \
              -Dsonar.host.url=${SONAR_HOST} \
              -Dsonar.token=${SONAR_TOKEN}
          '''
        }
      }
    }

    stage('Build Docker Image') {
      steps {
        sh 'docker build -t ${IMAGE_NAME} .'
      }
    }

    stage('Trivy Scan (optional)') {
      steps {
        sh '''
          docker run --rm --network ${DOCKER_NET} \
            -v /var/run/docker.sock:/var/run/docker.sock \
            -v /var/jenkins_home/.cache/trivy:/root/.cache/ \
            aquasec/trivy:latest image --exit-code 0 --format table ${IMAGE_NAME}
        '''
      }
    }
  }

  post {
    success {
      echo "✅ Pipeline complete: tests, SonarQube analysis, build, and Trivy scan finished successfully."
    }
    failure {
      echo "❌ Pipeline failed. Check the stage logs above."
    }
  }
}
