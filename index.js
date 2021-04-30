'use strict'

const fs = require('fs').promises
const {Octokit} = require('@octokit/rest')
const {
  GET_ISSUES_QUERY
, HIDE_COMMENTS_QUERY
} = require('./lib/queries.js')
const parseCoverage = require('./lib/parse-coverage.js')

const COMMENT_HEADER = '<!-- COMPARE_COV_TO_MAIN COMMENT HEADER -->'

module.exports = class Comparer {
  constructor({
    coverage_filepath
  , dry_run
  , owner
  , pr_id
  , repo
  , token
  }) {
    this.coverage_filepath = coverage_filepath
    this.dry_run = dry_run === true
    this.owner = owner
    this.pr_id = pr_id
    this.repo = repo
    this.token = token

    if (!this.token) {
      const err = new Error('Missing github token. Set GITHUB_TOKEN env var.')
      err.code = 'EMISSINGTOKEN'
      throw err
    }

    if (!this.dry_run) {
      if (!this.pr_id) {
        const err = new Error('Missing pr_id. Please specify the PR ID')
        err.code = 'EMISSINGPRID'
        throw err
      }
    }

    this.client = new Octokit({
      auth: token
    })

    this.old_pct = 0
    this.new_pct = 0
    this.changes = new Map()
  }

  async run() {
    console.log('running...')
    await this.compare()
    console.log('done', {
      'old': this.old_pct
    , 'new': this.new_pct
    })
    if (!this.dry_run) {
      await this.hideOldComments()
      await this.createPRComment()
    }

    // Reset
    const changes = this.changes
    const old_pct = this.old_pct
    const new_pct = this.new_pct
    this.changes = new Map()
    this.old_pct = 0
    this.new_pct = 0
    return {
      old_pct
    , new_pct
    , changes
    }
  }

  async hideOldComments() {
    const comments_list = await this.client.graphql(GET_ISSUES_QUERY, {
      owner: this.owner
    , repo: this.repo
    , issue_id: this.pr_id
    })

    const comments = comments_list.repository.pullRequest.comments.nodes

    for (const issue of comments) {
      if (issue.isMinimized || !issue.body.includes(COMMENT_HEADER)) continue
      console.log('minimize issue %s', issue.id)
      await this.client.graphql(HIDE_COMMENTS_QUERY, {
        owner: this.owner
      , repo: this.repo
      , id: issue.id
      , classifier: 'OUTDATED'
      })
    }
  }

  async createPRComment() {
    const body = `${COMMENT_HEADER}\n\n${this.buildIssueContent()}`

    await this.client.issues.createComment({
      owner: this.owner
    , repo: this.repo
    , issue_number: this.pr_id
    , body
    })
  }

  async getLatestCoverage() {
    // Fetch the latest release from GitHub.
    // If the release has a coverage.json file.
    const release = await this.client.repos.getLatestRelease({
      owner: this.owner
    , repo: this.repo
    })

    let asset_id

    for (const asset of release.data.assets) {
      if (asset.name === 'coverage-summary.json') {
        asset_id = asset.id
        break
      }
    }

    if (!asset_id) {
      const err = new Error('Unable to find previous coverage file')
      err.code = 'ENOPREVCOVERAGE'
      throw err
    }

    const asset = await this.client.repos.getReleaseAsset({
      owner: this.owner
    , repo: this.repo
    , asset_id
    , request: {
        headers: {
          accept: 'application/octet-stream'
        , authorization: `token ${this.token}`
        }
      }
    })

    const latest = JSON.parse(Buffer.from(asset.data))
    return parseCoverage(latest)
  }

  async getCurrentCoverage() {
    const contents = await fs.readFile(this.coverage_filepath, 'utf8')
    return parseCoverage(JSON.parse(contents))
  }

  async compare() {
    const [main, current] = await Promise.all([
      this.getLatestCoverage()
    , this.getCurrentCoverage()
    ])

    this.old_pct = main.total
    this.new_pct = current.total

    const checked = new Set()

    for (const [filename, pct] of main.files) {
      checked.add(filename)
      if (!current.files.has(filename)) {
        // File was (re)moved
        continue
      }

      const new_pct = current.files.get(filename)
      if (new_pct !== pct) {
        this.changes.set(filename, {
          'old': pct
        , 'new': new_pct
        })
      }
    }

    for (const [filename, pct] of current.files) {
      if (checked.has(filename)) continue
      checked.add(filename)

      if (pct !== 100) {
        this.changes.set(filename, {
          'old': null
        , 'new': pct
        })
      }
    }
  }

  buildIssueContent() {
    if (!this.changes.size) {
      return 'Coverage remained the same'
    }

    const buf = []
    const title = this.getTotalChangeMessage()
    buf.push(COMMENT_HEADER, '', title, '')
    buf.push('| Change | File | Coverage |')
    buf.push('| ------ | ---- | -------- |')
    for (const [filename, result] of this.changes) {
      const row = []
      let change
      if (result.new && result.old === null) {
        // new file without 100% coverage
        row.push(':warning:')
        change = `new file (${result.new.toFixed(2)}%)`
      } else if (result.new < result.old) {
        row.push(':warning:')
        change = `-${(result.old - result.new).toFixed(2)}%`
      } else {
        row.push(':white_check_mark:')
        change = `${(result.new - result.old).toFixed(2)}%`
      }

      row.push(`\`${filename}\``)
      row.push(change)
      buf.push(`| ${row.join(' | ')} |`)
    }

    buf.push('')
    return buf.join('\n')
  }

  getTotalChangeMessage() {
    if (this.old_pct < this.new_pct) {
      const diff = (this.new_pct - this.old_pct).toFixed(2)
      return `:tada: Total coverage went up by ${diff}%`
    }

    const diff = (this.old_pct - this.new_pct).toFixed(2)
    return `:warning: Total coverage went down by ${diff}%`
  }
}
