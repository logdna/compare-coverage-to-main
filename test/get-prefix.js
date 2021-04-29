'use strict'

const {test} = require('tap')
const getPrefix = require('../lib/get-prefix.js')

test('getPrefix', async (t) => {
  const prefix = '/biscuits/a/b/c/'
  const inputs = [
    `${prefix}e`
  , `${prefix}f`
  , `${prefix}g`
  , `${prefix}h/i`
  , `${prefix}h/i/j`
  ]

  t.strictSame(getPrefix([]), '', 'empty array returns empty string')
  t.strictSame(getPrefix(['abcd']), 'abcd', 'array with one items returns item')
  t.strictSame(getPrefix(inputs), prefix, 'works with multiple items')
})
