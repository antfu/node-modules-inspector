export interface ParsedSearchResult {
  text: string
  invert?: boolean
  not?: RegExp[]
  license?: RegExp[]
  author?: RegExp[]
}

const RE_COLLON_FIELDS = /\b(\w+):("[^"]*"|'[^']*'|`[^`]*`|\S*)/g

function createRegExp(input: string, flags = 'gi') {
  const escaped = input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(escaped, flags)
}

function unescapeRegExp(input: RegExp) {
  return input.source.replace(/\\(.)/g, '$1')
}

export function parseSearch(input: string) {
  let text = input
  let invert = false
  const exclude: RegExp[] = []
  const license: RegExp[] = []
  const author: RegExp[] = []
  let removal: [number, number][] = []

  if (text.startsWith('!')) {
    invert = true
    text = text.slice(1)
  }

  for (const match of text.matchAll(RE_COLLON_FIELDS) || []) {
    let [_, field, value] = match as unknown as [string, string, string]

    // de-quote
    if (value.startsWith('"') && value.endsWith('"'))
      value = value.slice(1, -1)
    else if (value.startsWith('\'') && value.endsWith('\''))
      value = value.slice(1, -1)
    else if (value.startsWith('`') && value.endsWith('`'))
      value = value.slice(1, -1)

    switch (field) {
      case 'not':
        if (value)
          exclude.push(createRegExp(value, 'gi'))
        break
      case 'license':
        if (value)
          license.push(createRegExp(value, 'gi'))
        break
      case 'author':
        if (value)
          author.push(createRegExp(value, 'gi'))
        break
      default:
        continue
    }

    removal.push([match.index!, match.index! + match[0].length])
  }

  if (removal.length) {
    removal = removal.sort((a, b) => b[0] - a[0])
    for (const [start, end] of removal) {
      text = text.slice(0, start) + text.slice(end)
    }
  }

  text = text.replace(/\s+/g, ' ').trim()

  const result: ParsedSearchResult = {
    text,
  }
  if (invert)
    result.invert = true
  if (exclude.length)
    result.not = exclude
  if (license.length)
    result.license = license
  if (author.length)
    result.author = author

  return result
}

export function serializedSearch(search: ParsedSearchResult) {
  let result = search.text

  function quote(value: string) {
    if (value.includes(' ')) {
      return `"${value}"`
    }
    return value
  }

  if (search.not?.length)
    result += ` ${search.not.map(r => `not:${quote(unescapeRegExp(r))}`).join(' ')}`
  if (search.author?.length)
    result += ` ${search.author.map(r => `author:${quote(unescapeRegExp(r))}`).join(' ')}`
  if (search.license?.length)
    result += ` ${search.license.map(r => `license:${quote(unescapeRegExp(r))}`).join(' ')}`

  if (search.invert)
    result = `! ${result}`

  return result
}
