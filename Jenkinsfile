pipeline {
    agent any

    environment {
        DEPLOY_DIR = 'C:\\apps\\ics-backoffice'
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
                    bat 'npm run build'
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
                bat 'pm2 stop ics-backend ics-frontend 2>nul & exit 0'
                bat 'pm2 delete ics-backend ics-frontend 2>nul & exit 0'
            }
        }

        stage('Deploy Backend') {
            steps {
                bat "if not exist %DEPLOY_DIR%\\backend\\uploads mkdir %DEPLOY_DIR%\\backend\\uploads"

                // Copy compiled output — use robocopy to avoid Copy-Item nested-dir bug on re-deploy
                // robocopy exit codes 0-7 = success (8+ = error), so normalise with conditional exit
                bat "robocopy backend\\dist %DEPLOY_DIR%\\backend\\dist /E /PURGE & if %ERRORLEVEL% LEQ 7 exit 0"
                bat "copy /Y backend\\package.json %DEPLOY_DIR%\\backend\\package.json"
                bat "copy /Y backend\\package-lock.json %DEPLOY_DIR%\\backend\\package-lock.json"

                // Install production dependencies only
                bat "cd %DEPLOY_DIR%\\backend && npm ci --omit=dev"
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
                bat "cd %DEPLOY_DIR% && pm2 start ecosystem.config.js --env production"
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
