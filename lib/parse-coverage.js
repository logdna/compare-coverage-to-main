'use strict'

const getPrefix = require('./get-prefix.js')

module.exports = parseCoverage

function parseCoverage(summary) {
  const files = new Map()
  let total = null
  const keys = Object.keys(summary).filter(filterTotal)
  const prefix = getPrefix(keys)

  for (const [filename, {statements: {pct}}] of Object.entries(summary)) {
    if (filename === 'total') {
      total = pct
      continue
    }

    const name = filename.replace(prefix, '')
    files.set(name, pct)
  }

  return {total, files}
}

function filterTotal(item) {
  return item !== 'total'
}
