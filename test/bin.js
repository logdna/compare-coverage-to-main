'use strict'

const child_process = require('child_process')
const fs = require('fs').promises
const path = require('path')
const {promisify} = require('util')
const {test} = require('tap')
const pkg = require('../package.json')

const exec = promisify(child_process.exec)
const bin = path.join(__dirname, '../bin/cmd.js')
const usage_fp = path.join(__dirname, '../bin/usage.txt')

async function run(args, opts = {}) {
  const {stdout, stderr} = await exec(`${process.execPath} ${bin} ${args}`, opts)
  return {stdout, stderr}
}

test('compare-coverage-to-main CLI', async (t) => {
  const usage = await fs.readFile(usage_fp, 'utf8')
  const version_output = `${pkg.version}`
  t.test('outputs usage when -h is passed', async (t) => {
    const {stdout, stderr} = await run('-h')
    if (stderr) console.error(stderr)
    t.strictSame(stdout, usage, 'usage is printed to stdout')
  })

  t.test('outputs usage when --help is passed', async (t) => {
    const {stdout, stderr} = await run('--help')
    if (stderr) console.error(stderr)
    t.strictSame(stdout, usage, 'usage is printed to stdout')
  })

  t.test('outputs version when -v is passed', async (t) => {
    const {stdout, stderr} = await run('-v')
    if (stderr) console.error(stderr)
    t.strictSame(stdout, version_output, 'version is printed to stdout')
  })

  t.test('outputs version when --version is passed', async (t) => {
    const {stdout, stderr} = await run('--version')
    if (stderr) console.error(stderr)
    t.strictSame(stdout, version_output, 'version is printed to stdout')
  })

  t.test('exits with error if missing GITHUB_TOKEN', async (t) => {
    t.rejects(run('', {
      env: {
        GITHUB_TOKEN: ''
      }
    }), {
      code: 1
    , stdout: ''
    , stderr: /GITHUB_TOKEN/
    })
  })

  t.test('exits with error if missing --repo flag', async (t) => {
    t.rejects(run('', {
      env: {
        GITHUB_TOKEN: 'this is a test suite'
      }
    }), {
      code: 1
    , stdout: ''
    , stderr: /missing --repo flag/
    })
  })

  t.test('exits with error if missing --owner flag', async (t) => {
    t.rejects(run('--repo compare-coverage-to-main', {
      env: {
        GITHUB_TOKEN: 'this is a test suite'
      }
    }), {
      code: 1
    , stdout: ''
    , stderr: /missing --owner flag/
    })
  })

  t.test('exits with error if missing --coverage-filepath flag', async (t) => {
    t.rejects(run('--repo compare-coverage-to-main --owner logdna', {
      env: {
        GITHUB_TOKEN: 'this is a test suite'
      }
    }), {
      code: 1
    , stdout: ''
    , stderr: /missing --coverage-filepath flag/
    })
  })
})
