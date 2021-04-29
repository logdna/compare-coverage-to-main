'use strict'

// This attempts to find the longest common prefix of strings in an array

module.exports = getPrefix

function getPrefix(items) {
  if (items.length === 0) return ''
  if (items.length === 1) return items[0]

  const sorted = items.slice().sort()

  const first = sorted[0]
  const last = sorted[sorted.length - 1]
  const end = Math.min(first.length, last.length)

  let i = 0
  while (i < end && first[i] === last[i]) {
    i++
  }

  return first.slice(0, i)
}
