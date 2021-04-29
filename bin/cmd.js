#!/usr/bin/env node

'use strict'

const path = require('path')
const help = require('help')()
const nopt = require('nopt')
const Comparer = require('../index.js')
const known_opts = {
  'help': Boolean
, 'version': Boolean
, 'coverage-filepath': path
, 'dry-run': Boolean
, 'owner': String
, 'pr-id': Number
, 'repo': String
}

const short_hand = {
  h: ['--help']
, v: ['--version']
, f: ['--coverage-filepath']
, d: ['--dry-run']
, o: ['--owner']
, p: ['--pr-id']
, r: ['--repo']
}

const parsed = nopt(known_opts, short_hand)

if (parsed.help) {
  return help()
}

if (parsed.version) {
  process.stdout.write(`${require('../package').version}`)
  return
}

if (!process.env.GITHUB_TOKEN) {
  console.error('Please set the GITHUB_TOKEN env var.')
  process.exitCode = 1
  return
}

if (!parsed.repo) {
  console.error('missing --repo flag. Please pass the repository name')
  process.exitCode = 1
  return
}

if (!parsed.owner) {
  console.error('missing --owner flag. Please pass the github organization or user.')
  process.exitCode = 1
  return
}

if (!parsed['coverage-filepath']) {
  console.error('missing --coverage-filepath flag. '
    + 'Please pass the path to the coverage-summary.json file.'
  )
  process.exitCode = 1
  return
}

const comparer = new Comparer({
  coverage_filepath: parsed['coverage-filepath']
, dry_run: parsed['dry-run']
, owner: parsed.owner
, pr_id: parsed['pr-id']
, repo: parsed.repo
, token: process.env.GITHUB_TOKEN
})

/* istanbul ignore next */
function onError(err) {
  console.error(err)
  process.nextTick(() => {
    throw err
  })
}

;(async () => {
  await comparer.run()
})().catch(onError)
