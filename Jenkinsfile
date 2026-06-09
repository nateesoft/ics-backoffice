pipeline {
    agent any

    environment {
        DEPLOY_DIR = 'D:\\ICS-Projects\\apps\\ics-backoffice'
        PM2_HOME   = 'C:\\ProgramData\\pm2'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Backend') {
            steps {
                dir('backend') {
                    bat 'npm ci'
                    bat 'npm run build'
                }
            }
        }

        stage('Build Frontend') {
            steps {
                dir('frontend') {
                    bat 'npm ci'
                    withEnv(['NEXT_PUBLIC_API_URL=/ics-backoffice/api']) {
                        bat 'npm run build'
                    }
                }
            }
        }

        stage('Prepare Frontend Standalone') {
            steps {
                dir('frontend') {
                    bat 'xcopy /E /I /Y public .next\\standalone\\public\\'
                    bat 'xcopy /E /I /Y .next\\static .next\\standalone\\.next\\static\\'
                }
            }
        }

        stage('Stop PM2') {
            steps {
                // Kill the PM2 daemon entirely — avoids hang when daemon is unresponsive
                // or when app names don't exist yet (first deploy)
                bat 'pm2 kill 2>nul & exit 0'
            }
        }

        stage('Deploy Backend') {
            steps {
                bat "if not exist %DEPLOY_DIR%\\backend\\uploads mkdir %DEPLOY_DIR%\\backend\\uploads"

                // robocopy exit codes 0-7 = success (8+ = error)
                // Must use separate line so %ERRORLEVEL% is read AFTER robocopy, not at parse time
                bat """
                    robocopy backend\\dist %DEPLOY_DIR%\\backend\\dist /E /PURGE
                    if %ERRORLEVEL% GEQ 8 exit 1
                    exit 0
                """
                bat "copy /Y backend\\package.json %DEPLOY_DIR%\\backend\\package.json"
                bat "copy /Y backend\\package-lock.json %DEPLOY_DIR%\\backend\\package-lock.json"

                // Deploy .env if it exists in workspace (skip silently on re-deploy if absent)
                bat "if exist backend\\.env copy /Y backend\\.env %DEPLOY_DIR%\\backend\\.env"

                // Install production dependencies — network-timeout guards against hanging
                bat "cd /d %DEPLOY_DIR%\\backend && npm ci --omit=dev --prefer-offline"
            }
        }

        stage('Deploy Frontend') {
            steps {
                bat "if not exist %DEPLOY_DIR%\\frontend mkdir %DEPLOY_DIR%\\frontend"
                bat '''
                    powershell -Command "Copy-Item -Path frontend\\.next\\standalone\\* -Destination %DEPLOY_DIR%\\frontend -Recurse -Force"
                '''
            }
        }

        stage('Deploy Config') {
            steps {
                bat "copy /Y ecosystem.config.js %DEPLOY_DIR%\\ecosystem.config.js"
            }
        }

        stage('Start PM2') {
            steps {
                bat "cd /d %DEPLOY_DIR% && pm2 start ecosystem.config.js --env production"
                bat 'pm2 save'
            }
        }
    }

    post {
        success {
            bat 'pm2 list'
            echo 'Deployment successful!'
        }
        failure {
            echo 'Deployment failed — check the logs above.'
        }
    }
}
