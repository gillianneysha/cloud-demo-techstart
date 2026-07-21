pipeline {

  agent any

  environment {

    AZ_ACCOUNT = 'yshastg'   // same as $STG

    AZ_SHARE   = 'webcontent'

  }

  stages {

    stage('Checkout') { steps { checkout scm } }

    stage('Deploy to ACI (file share)') {

      steps {

        withCredentials([string(credentialsId: 'azure-storage-key', variable: 'AZ_KEY')]) {

          sh '''

            az storage file upload-batch \

              --account-name "yshastg" --account-key " BN4QBWhBifz6/AVvO6oAk0t4m6wf7kcT5dShfrBqrHAh5tEtoqFCHoM0jH/7Eazyc1jZwri95avQ+AStsLVhKQ==" \

              --destination "webcontent" --source . \

              --pattern "*.html" --no-progress

          '''

        }

      }

    }

  }

}
