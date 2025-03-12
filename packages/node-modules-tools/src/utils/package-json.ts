import type { PackageJson } from '../types'
import { toArray } from '@antfu/utils'

export interface NormalizedFunding {
  url: string
  type?: string
}

export interface ParsedFunding {
  url: string
  type: string
  name: string
  entry: string
  avatar?: string
}

export function parseFunding(funding: NormalizedFunding): ParsedFunding {
  const url = funding.url
  let name = ''
  let type = funding.type || 'link'
  let avatar: string | undefined

  let match = url.match(/^(?:https?:\/\/)?(?:www\.)?github\.com\/sponsors\/([\w.-]+)/i)
  if (match) {
    name = match[1]
    type = 'github'
  }
  if (!name) {
    match = url.match(/^(?:https?:\/\/)?(?:www\.)?github\.com\/([\w.-]+)/i)
    if (match) {
      name = match[1]
      type = 'github'
    }
  }
  if (!name) {
    match = url.match(/^(?:https?:\/\/)?(?:www\.)?opencollective\.com\/([\w.-]+)/i)
    if (match) {
      name = match[1]
      type = 'opencollective'
    }
  }

  if (!name)
    name = url.replace(/^(?:https?:\/\/)?(?:www\.)?/, '').replace(/\/$/, '')

  if (type === 'github' && name)
    avatar = `https://avatars.antfu.dev/gh/${name}`
  if (type === 'opencollective' && name)
    avatar = `https://opencollective.com/${name}/avatar.png`

  const entry = `${type}@${name}`

  return {
    url,
    type,
    entry,
    name,
    avatar,
  }
}

export function normalizePkgFundings(json: PackageJson): ParsedFunding[] | undefined {
  type RawFunding = string | NormalizedFunding
  const rawFunding: RawFunding | RawFunding[] | undefined = json.funding
  let fundings: NormalizedFunding[]
  if (typeof rawFunding === 'string') {
    fundings = [{ url: rawFunding }]
  }
  else if (Array.isArray(rawFunding)) {
    fundings = rawFunding.map(f => typeof f === 'string' ? { url: f } : f)
  }
  else {
    fundings = rawFunding ? [rawFunding] : []
  }
  if (fundings.length === 0)
    return undefined

  return fundings.map(f => parseFunding(f)).filter(Boolean)
}

export function parseAuthor(author?: string) {
  if (!author)
    return undefined
}

export function normalizePkgAuthors(json: PackageJson) {
  const authors = [
    ...toArray(json.authors),
    ...toArray(json.author),
  ].filter(Boolean)

  if (!authors.length)
    return undefined

  return authors.map((author) => {
    if (typeof author === 'string') {
      let url: string | undefined
      const name = author
        .replace(/<.*>/, '')
        .replace(/\(.*\)/, '')
        .replace(/^https?:\/\//, '')
        .trim()

      return {
        name,
        url,
      }
    }
    else {
      return {
        name: author.name,
        url: author.url,
      }
    }
  })
}

export function normalizePkgRepository(json: PackageJson) {
  if (!json.repository)
    return undefined

  let url = (typeof json.repository === 'string' ? json.repository : json.repository?.url)
  if (url?.startsWith('git+'))
    url = url.slice(4)
  if (url?.endsWith('.git'))
    url = url.slice(0, -4)
  if (url?.startsWith('git://'))
    url = `https://${url.slice(6)}`
  if (json.repository && typeof json.repository !== 'string' && json.repository.directory)
    url += `/tree/HEAD/${json.repository.directory}`

  // Bare repository name
  if (/^[a-z0-9]+(?:[-_.][a-z0-9]+)*\/[a-z0-9]+(?:[-_.][a-z0-9]+)*$/i.test(url))
    url = `https://github.com/${url}`

  return {
    url,
  }
}
