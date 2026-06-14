// ============================================================
//  MOHAP/EDE API Test Pipeline
//  Reporter : newman-reporter-Newman_Report
//
//  Required Jenkins plugins:
//    - NodeJS Plugin          (for tools { nodejs })
//    - HTML Publisher Plugin  (for publishHTML)
//    - Timestamper Plugin     (for timestamps())
//
//  Required Jenkins global tool config:
//    Manage Jenkins → Tools → NodeJS → Add → Name: "NodeJS-20"
// ============================================================

pipeline {

    agent any

    // ── Node.js version ──────────────────────────────────────
    tools {
        nodejs 'NodeJS-20'
    }

    // ── Pipeline-level options ───────────────────────────────
    options {
        timestamps()                              // prefix every log line with time
        buildDiscarder(logRotator(numToKeepStr: '10'))  // keep last 10 builds
        timeout(time: 30, unit: 'MINUTES')        // abort if run exceeds 30 min
        disableConcurrentBuilds()                 // prevent parallel runs
    }

    // ── Parameters (editable before each run) ───────────────
    parameters {

        string(
            name:         'REPORT_TITLE',
            defaultValue: 'MOHAP/EDE API Test Run Report',
            description:  'Title shown in the HTML report hero header'
        )

        choice(
            name:        'ENVIRONMENT_FILE',
            choices:     ['MOHAP-EDE_OldAPI'],
            description: 'Postman environment file to run tests against (name without .json)'
        )

        booleanParam(
            name:         'FAIL_ON_TEST_ERRORS',
            defaultValue: false,
            description:  'Fail the build (red) when API tests fail. Default: mark UNSTABLE (yellow) and still publish the report.'
        )

    }

    // ── Reusable path variables ──────────────────────────────
    environment {
        COLLECTION  = 'collections/MOH_Internal_API.postman_collection.json'
        ENV_FILE    = "environments/${params.ENVIRONMENT_FILE}.postman_environment.json"
        REPORT_PATH = 'reports/report.html'
        REPORT_DIR  = 'reports'
    }

    // ════════════════════════════════════════════════════════
    //  STAGES
    // ════════════════════════════════════════════════════════
    stages {

        // ── 1. Checkout ──────────────────────────────────────
        stage('Checkout') {
            steps {
                checkout scm
                echo "Branch   : ${env.GIT_BRANCH}"
                echo "Commit   : ${env.GIT_COMMIT}"
                echo "Build #  : ${env.BUILD_NUMBER}"
            }
        }

        // ── 2. Install dependencies ──────────────────────────
        stage('Install Dependencies') {
            steps {
                sh 'node --version'
                sh 'npm --version'
                sh 'npm install'
                sh 'npx newman --version'
            }
        }

        // ── 3. Run API tests ─────────────────────────────────
        //
        //  catchError keeps the pipeline alive even when Newman
        //  exits with code 1 (test assertion failures).
        //  FAIL_ON_TEST_ERRORS parameter controls final status:
        //    false (default) → build goes UNSTABLE (yellow)
        //    true            → build goes FAILED   (red)
        //
        stage('Run API Tests') {
            steps {
                catchError(
                    buildResult:  params.FAIL_ON_TEST_ERRORS ? 'FAILURE' : 'UNSTABLE',
                    stageResult:  params.FAIL_ON_TEST_ERRORS ? 'FAILURE' : 'UNSTABLE'
                ) {
                    sh """
                        npx newman run ${env.COLLECTION} \\
                          --environment ${env.ENV_FILE} \\
                          --reporters Newman_Report \\
                          --reporter-Newman_Report-export ${env.REPORT_PATH} \\
                          --reporter-Newman_Report-title "${params.REPORT_TITLE} — Build #${env.BUILD_NUMBER}"
                    """
                }
            }
        }

        // ── 4. Publish HTML report ───────────────────────────
        stage('Publish Report') {
            steps {
                publishHTML([
                    allowMissing:          false,
                    alwaysLinkToLastBuild: true,
                    keepAll:               true,
                    reportDir:             "${env.REPORT_DIR}",
                    reportFiles:           'report.html',
                    reportName:            'MOHAP API Test Report'
                ])
                echo "Report published → check the MOHAP API Test Report link on the build page."
            }
        }

    }

    // ════════════════════════════════════════════════════════
    //  POST ACTIONS  (always run regardless of outcome)
    // ════════════════════════════════════════════════════════
    post {

        always {
            // Archive report.html as a downloadable build artifact
            archiveArtifacts(
                artifacts:         "${env.REPORT_PATH}",
                allowEmptyArchive: true,
                fingerprint:       true
            )
            // Stamp the build description shown in the build list
            script {
                currentBuild.description =
                    "Build #${env.BUILD_NUMBER} | ${params.ENVIRONMENT_FILE}"
            }
        }

        success {
            echo '✅  All tests passed — report published successfully.'
        }

        unstable {
            echo '⚠️   Some API tests failed — report published. Review the HTML report for details.'
        }

        failure {
            echo '❌  Pipeline failed — review the console output above for errors.'
        }

    }

}
