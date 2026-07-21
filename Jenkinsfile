// GitHub push -> webhook -> Jenkins -> Azure staging (ACI/File Share) -> test -> AWS EC2 production
// Requires two Jenkins credentials set up beforehand:
//   1. 'priv-key'        (SSH Username with private key) - for AWS EC2 servers
//   2. 'azure-sp-cred'   (Microsoft Azure Service Principal) - for Azure CLI login
pipeline {
    agent any
    options {
        timestamps()
        disableConcurrentBuilds()
    }
    triggers {
        githubPush()   // fires automatically when GitHub webhook notifies Jenkins of a push
    }
    environment {
        // ---- AWS / EC2 (production) ----
        SERVERS = 'ubuntu@10.0.2.5 ubuntu@10.0.4.172'   // your two web servers
        DOCROOT = '/var/www/html'                        // Apache default doc root
        APP_SRC = './'                                   // repo root; 'dist/' if you build

        // ---- Azure / ACI (staging) ----
        AZURE_STORAGE_ACCOUNT = 'yshastg'                // storage account name
        AZURE_FILE_SHARE      = 'webcontent'             // file share name
        ACI_FQDN              = 'yshalabel.centralindia.azurecontainer.io'  // ACI public FQDN
    }
    stages {

        stage('Checkout') {
            steps { checkout scm }
        }

        stage('Build') {
            steps {
                sh 'echo "No build step — deploying repo as-is."'
            }
        }

        stage('Deploy to Staging (Azure)') {
            steps {
                withCredentials([azureServicePrincipal(
                    credentialsId: 'azure-sp-cred',
                    subscriptionIdVariable: 'AZURE_SUBSCRIPTION_ID',
                    clientIdVariable: 'AZURE_CLIENT_ID',
                    clientSecretVariable: 'AZURE_CLIENT_SECRET',
                    tenantIdVariable: 'AZURE_TENANT_ID'
                )]) {
                    sh '''
                        set -eu
                        az login --service-principal \
                            -u "$AZURE_CLIENT_ID" \
                            -p "$AZURE_CLIENT_SECRET" \
                            --tenant "$AZURE_TENANT_ID" > /dev/null
                        az account set --subscription "$AZURE_SUBSCRIPTION_ID"

                        echo "=== Preparing clean deploy folder (excluding .git, Jenkinsfile) ==="
                        rm -rf /tmp/deploy_src
                        mkdir -p /tmp/deploy_src
                        rsync -a --exclude '.git' --exclude 'Jenkinsfile' "${APP_SRC}" /tmp/deploy_src/

                        echo "=== Uploading app files to Azure File Share: ${AZURE_FILE_SHARE} ==="
                        set +e
                        UPLOAD_OUTPUT=$(az storage file upload-batch \
                            --destination "${AZURE_FILE_SHARE}" \
                            --source "/tmp/deploy_src" \
                            --account-name "${AZURE_STORAGE_ACCOUNT}" \
                            --auth-mode login \
                            --pattern "*" 2>&1)
                        UPLOAD_STATUS=$?
                        set -e

                        echo "$UPLOAD_OUTPUT"

                        if [ $UPLOAD_STATUS -ne 0 ]; then
                            echo "FAIL: Azure upload failed (exit code $UPLOAD_STATUS)"
                            exit 1
                        fi

                        echo "=== Staging deploy complete ==="
                    '''
                }
            }
        }

        stage('Test Staging') {
            steps {
                sh '''
                    set -e
                    echo "=== Checking staging endpoint: http://${ACI_FQDN} ==="
                    STATUS=$(curl -s -o /tmp/staging_resp.html -w "%{http_code}" --max-time 15 "http://${ACI_FQDN}")
                    echo "HTTP status: ${STATUS}"

                    if [ "$STATUS" != "200" ]; then
                        echo "FAIL: Staging returned HTTP ${STATUS} instead of 200"
                        exit 1
                    fi

                    if ! grep -q "Welcome to my instance" /tmp/staging_resp.html; then
                        echo "FAIL: Expected content not found on staging page"
                        cat /tmp/staging_resp.html
                        exit 1
                    fi

                    echo "PASS: Staging is up and serving expected content"
                '''
            }
        }

        stage('Deploy to Production (AWS EC2)') {
            steps {
                sshagent(credentials: ['priv-key']) {
                    sh '''
                        set -eu
                        SSH_OPTS="-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null"
                        for HOST in ${SERVERS}; do
                            echo "=== Deploying to ${HOST}:${DOCROOT} ==="
                            rsync -az --delete -e "ssh ${SSH_OPTS}" --rsync-path="sudo rsync" \
                                --exclude '.git' --exclude 'Jenkinsfile' \
                                "${APP_SRC}" "${HOST}:${DOCROOT}/"
                            ssh ${SSH_OPTS} "${HOST}" "sudo systemctl reload apache2"
                            echo "=== ${HOST} updated ==="
                        done
                    '''
                }
            }
        }
    }

    post {
        success {
            echo 'Pipeline completed: staging tested and production updated.'
        }
        failure {
            echo 'Pipeline FAILED — production was NOT touched if failure occurred before the Deploy to Production stage.'
        }
    }
}
