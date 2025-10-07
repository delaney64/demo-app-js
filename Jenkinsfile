pipeline {
  agent any
  environment {
    DOCKER_NET = 'devsecops-lab_devsecops_net'   // your lab network
    SONAR_HOST = 'http://sonarqube:9000'         // SonarQube service name/port in Docker network
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
            credentialsId: 'github-https'
          ]]
        ])
      }
    }

    stage('Install & Test') {
      steps {
        sh '''
          docker run --rm --network ${DOCKER_NET} -v "$PWD:/ws" -w /ws node:20-alpine sh -lc "
            npm ci
            npm run test:jest
          "
        '''
      }
      post {
        always {
          junit testResults: 'junit.xml', allowEmptyResults: true // if you later add junit output
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
              -Dsonar.projectBaseDir=/usr/src \
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
    success { echo "Pipeline complete: tests, Sonar, build, and Trivy ✅" }
    failure { echo "Pipeline failed. Check the stage logs." }
  }
}
