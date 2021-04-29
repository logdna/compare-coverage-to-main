'use strict'

const {test} = require('tap')
const parseCoverage = require('../lib/parse-coverage.js')

test('parseCoverage', async (t) => {
  const input = {
    'total': {
      lines: {
        total: 138
      , covered: 0
      , skipped: 0
      , pct: 0

      }
    , statements: {
        total: 143
      , covered: 0
      , skipped: 0
      , pct: 0

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
      }}
  , '/Users/evan/dev/code/compare-coverage-to-main/index.js': {
      lines: {
        total: 87
      , covered: 0
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
      , pct: 0
      }
    , branches: {
        total: 30
      , covered: 0
      , skipped: 0
      , pct: 0
      }}
  , '/Users/evan/dev/code/compare-coverage-to-main/bin/cmd.js': {
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
      }}
  , '/Users/evan/dev/code/compare-coverage-to-main/lib/get-prefix.js': {
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
      }}
  , '/Users/evan/dev/code/compare-coverage-to-main/lib/parse-coverage.js': {
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
      }}
  , '/Users/evan/dev/code/compare-coverage-to-main/lib/queries.js': {
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
  }

  const parsed = parseCoverage(input)
  t.same(parsed, {
    total: 0
  , files: new Map([
      ['index.js', 0]
    , ['bin/cmd.js', 0]
    , ['lib/get-prefix.js', 0]
    , ['lib/parse-coverage.js', 0]
    , ['lib/queries.js', 0]
    ])
  })
})
