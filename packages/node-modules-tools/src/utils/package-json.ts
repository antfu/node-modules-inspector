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
    name = match[1]!
    type = 'github'
  }
  if (!name) {
    match = url.match(/^(?:https?:\/\/)?(?:www\.)?github\.com\/([\w.-]+)/i)
    if (match) {
      name = match[1]!
      type = 'github'
    }
  }
  if (!name) {
    match = url.match(/^(?:https?:\/\/)?(?:www\.)?opencollective\.com\/([\w.-]+)/i)
    if (match) {
      name = match[1]!
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

export type ParsedLicense = string

export function normalizePkgLicense(json: PackageJson): ParsedLicense | undefined {
  interface LegacyLicense {
    type: string
    url?: string
  }
  const _json = json as (PackageJson | { license?: LegacyLicense, licenses?: LegacyLicense[] })
  switch (typeof _json.license) {
    case 'string':
      return _json.license
    case 'object':
      return _json.license.type
  }

  if (Array.isArray(_json.licenses)) {
    if (!_json.licenses.length)
      return
    if (_json.licenses.length === 1) {
      return _json.licenses[0].type
    }
    return `(${_json.licenses.map(l => l.type).join(' OR ')})`
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
  if (!json.repository && !json.bugs)
    return undefined

  let url = (typeof json.repository === 'string' ? json.repository : json.repository?.url)

  url = url
    ?.replace(/^github:/, '')
    .replace(/^git@github\.com:/, '')

  // Bare repository name
  if (url && /^[a-z0-9][-.\w]*\/[a-z0-9][-.\w]*$/i.test(url))
    url = `https://github.com/${url}`

  url = url
    ?.replace(/^git\+/, '')
    .replace(/\.git$/, '')
    .replace(/^git:\/\//, 'https://')
    .replace(/^ssh:\/\//, 'https://')
    .replace(/git@github\.com/, 'github.com')

  if (json.repository && typeof json.repository !== 'string' && json.repository.directory)
    url += `/tree/HEAD/${json.repository.directory}`

  // Use bugs url to infer repository url
  if (!url) {
    const bugsUrl = typeof json.bugs === 'string' ? json.bugs : json.bugs?.url
    if (bugsUrl && bugsUrl.startsWith('https://github.com/'))
      url = bugsUrl.replace(/\/issues$/, '')
  }

  if (!url)
    return undefined

  url = url.trim()

  let repo: string | undefined
  let org: string | undefined
  let repoName: string | undefined

  const gitHubUrlMatch = url.match(/^https?:\/\/(?:www\.)?github\.com\/([^/]+)\/([^/]+)/)
  if (gitHubUrlMatch) {
    org = gitHubUrlMatch[1]!
    repoName = gitHubUrlMatch[2]!
    repo = `${org}/${repoName}`
  }

  return {
    url,
    repo,
    repoName,
    org,
  }
}
