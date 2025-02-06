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
    let [_, field, value] = match

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
