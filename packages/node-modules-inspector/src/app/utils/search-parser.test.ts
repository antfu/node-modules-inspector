import { expect, it } from 'vitest'
import { parseSearch } from './search-parser'

it('basic', () => {
  expect(parseSearch('')).toEqual({ text: '' })
  expect(parseSearch('foo bar')).toEqual({ text: 'foo bar' })
})

it('author simple', () => {
  expect(parseSearch('author:antfu'))
    .toEqual({ text: '', author: [/^antfu$/gi] })
  expect(parseSearch('author:'))
    .toEqual({ text: '' })
  expect(parseSearch('Hello author:antfu'))
    .toEqual({ text: 'Hello', author: [/^antfu$/gi] })
  expect(parseSearch('Hello author:antfu World author:ilyaliao'))
    .toEqual({ text: 'Hello World', author: [/^antfu$/gi, /^ilyaliao$/gi] })
})

it('author with quote', () => {
  expect(parseSearch('author:"Anthony Fu"'))
    .toEqual({ text: '', author: [/^Anthony Fu$/gi] })
  expect(parseSearch('author:""'))
    .toEqual({ text: '' })
  expect(parseSearch(`Hello author:\`Anthony Fu\` World author:"Ilya Liao"`))
    .toEqual({ text: 'Hello World', author: [/^Anthony Fu$/gi, /^Ilya Liao$/gi] })
})

it('mixed fields', () => {
  expect(parseSearch('! Some name license:MIT author:"Anthony Fu" license:Apache-2.0 not:foo'))
    .toEqual({
      invert: true,
      text: 'Some name',
      license: [/^MIT$/gi, /^Apache-2\.0$/gi],
      author: [/^Anthony Fu$/gi],
      not: [/^foo$/gi],
    })
})
