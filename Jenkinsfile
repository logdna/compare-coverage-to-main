library 'magic-butler-catalogue'

def PROJECT_NAME = "compare-coverage-to-main"
def CURRENT_BRANCH = [env.CHANGE_BRANCH, env.BRANCH_NAME]?.find{branch -> branch != null}
def DEFAULT_BRANCH = 'main'
def TRIGGER_PATTERN = ".*@logdnabot.*"

pipeline {
  agent none

  options {
    timestamps()
    ansiColor 'xterm'
  }

  triggers {
    issueCommentTrigger(TRIGGER_PATTERN)
  }

  environment {
    GITHUB_TOKEN = credentials('github-api-token')
    NPM_TOKEN = credentials('npm-publish-token')
    NPM_CONFIG_CACHE = '.npm'
    NPM_CONFIG_USERCONFIG = '.npm/rc'
    SPAWN_WRAP_SHIM_ROOT = '.npm'
  }

  stages {
    stage('Validate PR Source') {
      when {
        expression { env.CHANGE_FORK }
        not {
          triggeredBy 'issueCommentCause'
        }
      }
      steps {
        error("A maintainer needs to approve this PR for CI by commenting")
      }
    }

    stage('Test Suite') {
      matrix {
        axes {
          axis {
            name 'NODE_VERSION'
            values '12', '14', '16'
          }
        }

        agent {
          docker {
            image "us.gcr.io/logdna-k8s/node:${NODE_VERSION}-ci"
            customWorkspace "${PROJECT_NAME}-${BUILD_NUMBER}"
          }
        }

        stages {
          stage('Test') {
            environment {
              GIT_BRANCH = "${CURRENT_BRANCH}"
              BRANCH_NAME = "${CURRENT_BRANCH}"
            }

            steps {
              sh "mkdir -p ${NPM_CONFIG_CACHE}"
              script {
                npm.install GITHUB_TOKEN
              }
              sh 'npm run test:ci'
            }

            post {
              always {
                junit 'coverage/test.xml'
                script {
                  if (NODE_VERSION == '14') {
                    stash(
                      name: slugify(BUILD_TAG)
                    , allowEmpty: true
                    , includes: 'coverage/*.json'
                    )
                  }
                }
                publishHTML target: [
                  allowMissing: false,
                  alwaysLinkToLastBuild: false,
                  keepAll: true,
                  reportDir: 'coverage/lcov-report',
                  reportFiles: 'index.html',
                  reportName: "coverage-node-v${NODE_VERSION}"
                ]
              }
            }
          }
        }
      }
    }

    stage('Test Release') {
      when {
        beforeAgent true
        not {
          branch DEFAULT_BRANCH
        }
      }

      agent {
        docker {
          image "us.gcr.io/logdna-k8s/node:14-ci"
          customWorkspace "${PROJECT_NAME}-${BUILD_NUMBER}"
        }
      }

      environment {
        GIT_BRANCH = "${CURRENT_BRANCH}"
        BRANCH_NAME = "${CURRENT_BRANCH}"
      }

      steps {
        script {
          sh "mkdir -p ${NPM_CONFIG_CACHE}"
          unstash name: slugify(BUILD_TAG)
          npm.install GITHUB_TOKEN
          sh "npm run release -- --dry-run --no-ci --branches ${CURRENT_BRANCH}"
        }
      }
    }

    stage('Release') {
      when {
        beforeAgent true
        branch DEFAULT_BRANCH
        not {
          changelog '\\[skip ci\\]'
        }
      }

      agent {
        docker {
          image "us.gcr.io/logdna-k8s/node:14-ci"
          customWorkspace "${PROJECT_NAME}-${BUILD_NUMBER}"
        }
      }

      steps {
        script {
          sh "mkdir -p ${NPM_CONFIG_CACHE}"
          unstash name: slugify(BUILD_TAG)
          npm.install GITHUB_TOKEN
          sh "npm run release"
        }
      }
    }
  }
}
