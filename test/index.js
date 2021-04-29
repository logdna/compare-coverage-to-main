'use strict'

require('util').inspect.defaultOptions.depth = 5
const path = require('path')
const {test} = require('tap')
const Comparer = require('../index.js')

/* eslint-disable no-new */
test('Comparer', async (t) => {
  t.test('throws if missing GITHUB_TOKEN', async (t) => {
    t.throws(() => {
      new Comparer({})
    }, {
      code: 'EMISSINGTOKEN'
    })
  })

  t.test('throws if missing --pr-id', async (t) => {
    t.throws(() => {
      new Comparer({
        token: 'biscuits'
      })
    }, {
      code: 'EMISSINGPRID'
    })
  })

  t.test('throws if cannot find previous coverage asset', async (t) => {
    const dir = t.testdir({
      coverage: getCoverageString()
    })

    const coverage_filepath = path.join(dir, 'coverage')
    const comparer = new Comparer({
      coverage_filepath
    , owner: 'answerbook'
    , pr_id: 9
    , repo: 'compare-coverage-to-main'
    , token: 'biscuits'
    })

    comparer.client.hook.wrap('request', (_, options) => {
      switch (options.url) {
        case '/repos/{owner}/{repo}/releases/latest': {
          return getLatestRepoMock([{
            id: '1234'
          , name: 'fdsafdsafasdsfdasfds'
          }])
        }
      }
    })

    t.rejects(comparer.run(), {
      code: 'ENOPREVCOVERAGE'
    })
  })

  t.test('works without dry-run', async (t) => {
    const dir = t.testdir({
      coverage: getCoverageString({covered: 78})
    })

    const coverage_filepath = path.join(dir, 'coverage')
    const comparer = new Comparer({
      coverage_filepath
    , owner: 'answerbook'
    , pr_id: 9
    , repo: 'compare-coverage-to-main'
    , token: 'biscuits'
    })

    comparer.client.hook.wrap('request', (_, options) => {
      switch (options.url) {
        case '/repos/{owner}/{repo}/releases/latest': {
          return getLatestRepoMock([{
            id: '1234'
          , name: 'coverage-summary.json'
          }])
        }
        case '/repos/{owner}/{repo}/releases/assets/{asset_id}': {
          return getAssetContentsMock()
        }
        case '/graphql': {
          return getGraphQLMock(options.query, {
            hideComment: {}
          , getIssues: {
              repository: {
                pullRequest: {
                  comments: {
                    nodes: [
                      {
                        isMinimized: true
                      , id: '1234'
                      , body: 'biscuits'
                      }
                    , {
                        isMinimized: false
                      , id: '1235'
                      , body: 'this one gets ignored'
                      }
                    , {
                        isMinimized: false
                      , id: '1236'
                      , body: '<!-- COMPARE_COV_TO_MAIN COMMENT HEADER -->\n\nfasdfda'
                      }
                    ]
                  }
                }
              }
            }
          })
        }
      }
    })

    const changes = await comparer.run()

    t.strictSame(changes, {
      old_pct: 0
    , new_pct: 54.55
    , changes: new Map([
        ['index.js', {
          'old': 0
        , 'new': 86.67
        }]
      ])
    })
  })

  t.test('works with --dry-run', async (t) => {
    const dir = t.testdir({
      coverage: getCoverageString({covered: 78})
    })

    const coverage_filepath = path.join(dir, 'coverage')
    const comparer = new Comparer({
      coverage_filepath
    , dry_run: true
    , owner: 'answerbook'
    , pr_id: 9
    , repo: 'compare-coverage-to-main'
    , token: 'biscuits'
    })

    comparer.client.hook.wrap('request', (_, options) => {
      switch (options.url) {
        case '/repos/{owner}/{repo}/releases/latest': {
          return getLatestRepoMock([{
            id: '1234'
          , name: 'coverage-summary.json'
          }])
        }
        case '/repos/{owner}/{repo}/releases/assets/{asset_id}': {
          return getAssetContentsMock(getCoverageString({covered: 90}))
        }
        case '/graphql': {
          return getGraphQLMock(options.query, {
            hideComment: {}
          , getIssues: {
              repository: {
                pullRequest: {
                  comments: {
                    nodes: [
                      {
                        isMinimized: true
                      , id: '1234'
                      , body: 'biscuits'
                      }
                    , {
                        isMinimized: false
                      , id: '1235'
                      , body: 'this one gets ignored'
                      }
                    , {
                        isMinimized: false
                      , id: '1236'
                      , body: '<!-- COMPARE_COV_TO_MAIN COMMENT HEADER -->\n\nfasdfda'
                      }
                    ]
                  }
                }
              }
            }
          })
        }
      }
    })

    const changes = await comparer.run()

    t.strictSame(changes, {
      old_pct: 62.94
    , new_pct: 54.55
    , changes: new Map([
        ['index.js', {
          'old': 100
        , 'new': 86.67
        }]
      ])
    })
  })

  t.test('works when coverage is the same', async (t) => {
    const dir = t.testdir({
      coverage: getCoverageString({covered: 0})
    })

    const coverage_filepath = path.join(dir, 'coverage')
    const comparer = new Comparer({
      coverage_filepath
    , dry_run: false
    , owner: 'answerbook'
    , pr_id: 9
    , repo: 'compare-coverage-to-main'
    , token: 'biscuits'
    })

    comparer.client.hook.wrap('request', (_, options) => {
      switch (options.url) {
        case '/repos/{owner}/{repo}/releases/latest': {
          return getLatestRepoMock([{
            id: '1234'
          , name: 'coverage-summary.json'
          }])
        }
        case '/repos/{owner}/{repo}/releases/assets/{asset_id}': {
          return getAssetContentsMock(getCoverageString({covered: 0}))
        }
        case '/graphql': {
          return getGraphQLMock(options.query, {
            hideComment: {}
          , getIssues: {
              repository: {
                pullRequest: {
                  comments: {
                    nodes: [
                      {
                        isMinimized: true
                      , id: '1234'
                      , body: 'biscuits'
                      }
                    , {
                        isMinimized: false
                      , id: '1235'
                      , body: 'this one gets ignored'
                      }
                    , {
                        isMinimized: false
                      , id: '1236'
                      , body: '<!-- COMPARE_COV_TO_MAIN COMMENT HEADER -->\n\nfasdfda'
                      }
                    ]
                  }
                }
              }
            }
          })
        }
      }
    })

    const changes = await comparer.run()

    t.strictSame(changes, {
      old_pct: 0
    , new_pct: 0
    , changes: new Map()
    })
  })

  t.test('works when new file is added', async (t) => {
    const cov = JSON.parse(getCoverageString({covered: 0}))
    const covered = 86
    const contents = {
      lines: {
        total: 87
      , covered
      , skipped: 0
      , pct: +(((covered / 87) * 100).toFixed(2))
      }
    , functions: {
        total: 9
      , covered: 0
      , skipped: 0
      , pct: 0
      }
    , statements: {
        total: 87
      , covered
      , skipped: 0
      , pct: +(((covered / 87) * 100).toFixed(2))
      }
    , branches: {
        total: 30
      , covered: 0
      , skipped: 0
      , pct: 0
      }
    }

    cov['new-file.js'] = contents

    updateCoverageTotals(cov)

    const dir = t.testdir({
      coverage: JSON.stringify(cov)
    })

    const coverage_filepath = path.join(dir, 'coverage')
    const comparer = new Comparer({
      coverage_filepath
    , dry_run: false
    , owner: 'answerbook'
    , pr_id: 9
    , repo: 'compare-coverage-to-main'
    , token: 'biscuits'
    })

    comparer.client.hook.wrap('request', (_, options) => {
      switch (options.url) {
        case '/repos/{owner}/{repo}/releases/latest': {
          return getLatestRepoMock([{
            id: '1234'
          , name: 'coverage-summary.json'
          }])
        }
        case '/repos/{owner}/{repo}/releases/assets/{asset_id}': {
          return getAssetContentsMock()
        }
        case '/graphql': {
          return getGraphQLMock(options.query, {
            hideComment: {}
          , getIssues: {
              repository: {
                pullRequest: {
                  comments: {
                    nodes: [
                      {
                        isMinimized: true
                      , id: '1234'
                      , body: 'biscuits'
                      }
                    , {
                        isMinimized: false
                      , id: '1235'
                      , body: 'this one gets ignored'
                      }
                    , {
                        isMinimized: false
                      , id: '1236'
                      , body: '<!-- COMPARE_COV_TO_MAIN COMMENT HEADER -->\n\nfasdfda'
                      }
                    ]
                  }
                }
              }
            }
          })
        }
      }
    })

    const changes = await comparer.run()
    t.strictSame(changes, {
      old_pct: 0
    , new_pct: 37.39
    , changes: new Map([
        ['new-file.js', {
          'old': null
        , 'new': 98.85
        }]
      ])
    })
  })


  t.test('works when new file is added at 100%', async (t) => {
    const cov = JSON.parse(getCoverageString({covered: 0}))
    const covered = 87
    const contents = {
      lines: {
        total: 87
      , covered
      , skipped: 0
      , pct: +(((covered / 87) * 100).toFixed(2))
      }
    , functions: {
        total: 9
      , covered: 0
      , skipped: 0
      , pct: 0
      }
    , statements: {
        total: 87
      , covered
      , skipped: 0
      , pct: +(((covered / 87) * 100).toFixed(2))
      }
    , branches: {
        total: 30
      , covered: 0
      , skipped: 0
      , pct: 0
      }
    }

    cov['new-file.js'] = contents

    updateCoverageTotals(cov)
    const dir = t.testdir({
      coverage: JSON.stringify(cov)
    })

    const coverage_filepath = path.join(dir, 'coverage')
    const comparer = new Comparer({
      coverage_filepath
    , dry_run: false
    , owner: 'answerbook'
    , pr_id: 9
    , repo: 'compare-coverage-to-main'
    , token: 'biscuits'
    })

    comparer.client.hook.wrap('request', (_, options) => {
      switch (options.url) {
        case '/repos/{owner}/{repo}/releases/latest': {
          return getLatestRepoMock([{
            id: '1234'
          , name: 'coverage-summary.json'
          }])
        }
        case '/repos/{owner}/{repo}/releases/assets/{asset_id}': {
          return getAssetContentsMock()
        }
        case '/graphql': {
          return getGraphQLMock(options.query, {
            hideComment: {}
          , getIssues: {
              repository: {
                pullRequest: {
                  comments: {
                    nodes: [
                      {
                        isMinimized: true
                      , id: '1234'
                      , body: 'biscuits'
                      }
                    , {
                        isMinimized: false
                      , id: '1235'
                      , body: 'this one gets ignored'
                      }
                    , {
                        isMinimized: false
                      , id: '1236'
                      , body: '<!-- COMPARE_COV_TO_MAIN COMMENT HEADER -->\n\nfasdfda'
                      }
                    ]
                  }
                }
              }
            }
          })
        }
      }
    })

    const changes = await comparer.run()
    t.strictSame(changes, {
      old_pct: 0
    , new_pct: 37.83
    , changes: new Map()
    })
  })

  t.test('works when new file is removed', async (t) => {
    const cov = JSON.parse(getCoverageString({covered: 0}))
    const covered = 87
    const contents = {
      lines: {
        total: 87
      , covered
      , skipped: 0
      , pct: +(((covered / 87) * 100).toFixed(2))
      }
    , functions: {
        total: 9
      , covered: 0
      , skipped: 0
      , pct: 0
      }
    , statements: {
        total: 87
      , covered
      , skipped: 0
      , pct: +(((covered / 87) * 100).toFixed(2))
      }
    , branches: {
        total: 30
      , covered: 0
      , skipped: 0
      , pct: 0
      }
    }

    cov['new-file.js'] = contents
    updateCoverageTotals(cov)

    const dir = t.testdir({
      coverage: getCoverageString()
    })

    const coverage_filepath = path.join(dir, 'coverage')
    const comparer = new Comparer({
      coverage_filepath
    , dry_run: false
    , owner: 'answerbook'
    , pr_id: 9
    , repo: 'compare-coverage-to-main'
    , token: 'biscuits'
    })

    comparer.client.hook.wrap('request', (_, options) => {
      switch (options.url) {
        case '/repos/{owner}/{repo}/releases/latest': {
          return getLatestRepoMock([{
            id: '1234'
          , name: 'coverage-summary.json'
          }])
        }
        case '/repos/{owner}/{repo}/releases/assets/{asset_id}': {
          return getAssetContentsMock(JSON.stringify(cov))
        }
        case '/graphql': {
          return getGraphQLMock(options.query, {
            hideComment: {}
          , getIssues: {
              repository: {
                pullRequest: {
                  comments: {
                    nodes: [
                      {
                        isMinimized: true
                      , id: '1234'
                      , body: 'biscuits'
                      }
                    , {
                        isMinimized: false
                      , id: '1235'
                      , body: 'this one gets ignored'
                      }
                    , {
                        isMinimized: false
                      , id: '1236'
                      , body: '<!-- COMPARE_COV_TO_MAIN COMMENT HEADER -->\n\nfasdfda'
                      }
                    ]
                  }
                }
              }
            }
          })
        }
      }
    })

    const changes = await comparer.run()
    t.strictSame(changes, {
      old_pct: 37.83
    , new_pct: 0
    , changes: new Map()
    })
  })

  t.test('works when coverage goes down', async (t) => {
    const cov = JSON.parse(getCoverageString({covered: 0}))
    const covered = 12

    cov['index.js'] = {
      lines: {
        total: 90
      , covered
      , skipped: 0
      , pct: +(((covered / 90) * 100).toFixed(2))
      }
    , functions: {
        total: 9
      , covered: 0
      , skipped: 0
      , pct: 0
      }
    , statements: {
        total: 90
      , covered
      , skipped: 0
      , pct: +(((covered / 90) * 100).toFixed(2))
      }
    , branches: {
        total: 30
      , covered: 0
      , skipped: 0
      , pct: 0
      }
    }

    updateCoverageTotals(cov)

    const dir = t.testdir({
      coverage: JSON.stringify(cov)
    })

    const coverage_filepath = path.join(dir, 'coverage')
    const comparer = new Comparer({
      coverage_filepath
    , dry_run: false
    , owner: 'answerbook'
    , pr_id: 9
    , repo: 'compare-coverage-to-main'
    , token: 'biscuits'
    })

    comparer.client.hook.wrap('request', (_, options) => {
      switch (options.url) {
        case '/repos/{owner}/{repo}/releases/latest': {
          return getLatestRepoMock([{
            id: '1234'
          , name: 'coverage-summary.json'
          }])
        }
        case '/repos/{owner}/{repo}/releases/assets/{asset_id}': {
          return getAssetContentsMock(getCoverageString({covered: 40}))
        }
        case '/graphql': {
          return getGraphQLMock(options.query, {
            hideComment: {}
          , getIssues: {
              repository: {
                pullRequest: {
                  comments: {
                    nodes: [
                      {
                        isMinimized: true
                      , id: '1234'
                      , body: 'biscuits'
                      }
                    , {
                        isMinimized: false
                      , id: '1235'
                      , body: 'this one gets ignored'
                      }
                    , {
                        isMinimized: false
                      , id: '1236'
                      , body: '<!-- COMPARE_COV_TO_MAIN COMMENT HEADER -->\n\nfasdfda'
                      }
                    ]
                  }
                }
              }
            }
          })
        }
      }
    })

    const changes = await comparer.run()
    t.strictSame(changes, {
      old_pct: 27.97
    , new_pct: 8.39
    , changes: new Map([
        ['index.js', {
          'old': 44.44
        , 'new': 13.33
        }]
      ])
    })
  })

})

function getGraphQLMock(query, opts) {
  for (const [key, val] of Object.entries(opts)) {
    if (query.includes(key)) {
      return {
        headers: {}
      , status_code: 200
      , data: {data: val}
      }
    }
  }
}

function getAssetContentsMock(contents = getCoverageString()) {
  return {
    headers: {}
  , status_code: 200
  , data: Buffer.from(contents)
  }
}

function getLatestRepoMock(assets) {
  return {
    headers: {}
  , status_code: 200
  , data: {
      assets
    }
  }
}

function getCoverageString({covered = 0} = {}) {
  const pct = +(((covered / 143) * 100).toFixed(2))
  return JSON.stringify({
    'total': {
      lines: {
        total: 138
      , covered: 0
      , skipped: 0
      , pct: 0
      }
    , statements: {
        total: 143
      , covered
      , skipped: 0
      , pct
      }
    , functions: {
        total: 14
      , covered: 0
      , skipped: 0
      , pct: 0
      }
    , branches: {
        total: 46
      , covered: 0
      , skipped: 0
      , pct: 0
      }
    }
  , 'index.js': {
      lines: {
        total: 87
      , covered
      , skipped: 0
      , pct: 0
      }
    , functions: {
        total: 9
      , covered: 0
      , skipped: 0
      , pct: 0
      }
    , statements: {
        total: 90
      , covered: 0
      , skipped: 0
      , pct: +(((covered / 90) * 100).toFixed(2))
      }
    , branches: {
        total: 30
      , covered: 0
      , skipped: 0
      , pct: 0
      }
    }
  , 'bin/cmd.js': {
      lines: {
        total: 22
      , covered: 0
      , skipped: 0
      , pct: 0
      }
    , functions: {
        total: 2
      , covered: 0
      , skipped: 0
      , pct: 0
      }
    , statements: {
        total: 22
      , covered: 0
      , skipped: 0
      , pct: 0
      }
    , branches: {
        total: 8
      , covered: 0
      , skipped: 0
      , pct: 0
      }
    }
  , 'lib/get-prefix.js': {
      lines: {
        total: 12
      , covered: 0
      , skipped: 0
      , pct: 0
      }
    , functions: {
        total: 1
      , covered: 0
      , skipped: 0
      , pct: 0
      }
    , statements: {
        total: 14
      , covered: 0
      , skipped: 0
      , pct: 0
      }
    , branches: {
        total: 6
      , covered: 0
      , skipped: 0
      , pct: 0
      }
    }
  , 'lib/parse-coverage.js': {
      lines: {
        total: 14
      , covered: 0
      , skipped: 0
      , pct: 0
      }
    , functions: {
        total: 2
      , covered: 0
      , skipped: 0
      , pct: 0
      }
    , statements: {
        total: 14
      , covered: 0
      , skipped: 0
      , pct: 0
      }
    , branches: {
        total: 2
      , covered: 0
      , skipped: 0
      , pct: 0
      }
    }
  , 'lib/queries.js': {
      lines: {
        total: 3
      , covered: 0
      , skipped: 0
      , pct: 0
      }
    , functions: {
        total: 0
      , covered: 0
      , skipped: 0
      , pct: 100
      }
    , statements: {
        total: 3
      , covered: 0
      , skipped: 0
      , pct: 0
      }
    , branches: {
        total: 0
      , covered: 0
      , skipped: 0
      , pct: 100
      }
    }
  })
}

function updateCoverageTotals(cov) {
  let total = 0
  let covered = 0
  let skipped = 0
  let pct = 0

  for (const [key, value] of Object.entries(cov)) {
    if (key === 'total') continue
    total += value.statements.total
    covered += value.statements.covered
    skipped += value.statements.skipped
  }

  pct = +((covered / total) * 100).toFixed(2)
  cov.total.statements = {
    total
  , covered
  , skipped
  , pct
  }
}
