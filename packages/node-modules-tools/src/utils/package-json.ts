import type { PackageJson } from '../types'
import { toArray } from '@antfu/utils'

const RE_GITHUB_SPONSORS = /^(?:https?:\/\/)?(?:www\.)?github\.com\/sponsors\/([\w.-]+)/i
const RE_GITHUB_USER_URL = /^(?:https?:\/\/)?(?:www\.)?github\.com\/([\w.-]+)\/?$/i
const RE_GITHUB_PROFILE_LIKE = /^(?:https?:\/\/)?(?:www\.)?github\.com\/([\w.-]+)/i
const RE_GITHUB_NOREPLY = /^(?:\d+\+)?([\w.-]+)@users\.noreply\.github\.com$/i
const RE_OPENCOLLECTIVE = /^(?:https?:\/\/)?(?:www\.)?opencollective\.com\/([\w.-]+)/i

function githubAvatar(handle: string): string {
  return `https://avatars.antfu.dev/gh/${handle}`
}

function extractGitHubHandle(input: { url?: string, email?: string }): string | undefined {
  if (input.url) {
    const match = input.url.match(RE_GITHUB_USER_URL)
    if (match)
      return match[1]
  }
  if (input.email) {
    const match = input.email.match(RE_GITHUB_NOREPLY)
    if (match)
      return match[1]
  }
  return undefined
}

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

  let match = url.match(RE_GITHUB_SPONSORS)
  if (match) {
    name = match[1]!
    type = 'github'
  }
  if (!name) {
    match = url.match(RE_GITHUB_PROFILE_LIKE)
    if (match) {
      name = match[1]!
      type = 'github'
    }
  }
  if (!name) {
    match = url.match(RE_OPENCOLLECTIVE)
    if (match) {
      name = match[1]!
      type = 'opencollective'
    }
  }

  if (!name)
    name = url.replace(/^(?:https?:\/\/)?(?:www\.)?/, '').replace(/\/$/, '')

  if (type === 'github' && name)
    avatar = githubAvatar(name)
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

export interface RawAuthor {
  name?: string
  email?: string
  url?: string
}

export type ParsedAuthor
  = | {
    type: 'github'
    github: string
    avatar: string
    inferred?: boolean
  }
  | {
    type: 'text'
    name: string
    url?: string
    email?: string
  }

const RE_AUTHOR_EMAIL = /<([^>]+)>/
const RE_AUTHOR_URL = /\(([^)]+)\)/

export function parseAuthor(author: string): RawAuthor {
  let rest = author
  let email: string | undefined
  let url: string | undefined

  const emailMatch = rest.match(RE_AUTHOR_EMAIL)
  if (emailMatch) {
    email = emailMatch[1]!.trim() || undefined
    rest = rest.replace(emailMatch[0], '')
  }

  const urlMatch = rest.match(RE_AUTHOR_URL)
  if (urlMatch) {
    url = urlMatch[1]!.trim() || undefined
    rest = rest.replace(urlMatch[0], '')
  }

  const name = rest.trim() || undefined
  return { name, email, url }
}

function toParsedAuthor(raw: RawAuthor): ParsedAuthor | undefined {
  const github = extractGitHubHandle({ url: raw.url, email: raw.email })
  if (github) {
    return {
      type: 'github',
      github,
      avatar: githubAvatar(github),
    }
  }
  if (!raw.name)
    return undefined
  return {
    type: 'text',
    name: raw.name,
    url: raw.url,
    email: raw.email,
  }
}

export function normalizePkgAuthors(json: PackageJson): ParsedAuthor[] | undefined {
  const rawList = [
    ...toArray(json.authors),
    ...toArray(json.author),
  ].filter(Boolean)

  const parsed: ParsedAuthor[] = []
  for (const author of rawList) {
    const raw: RawAuthor = typeof author === 'string'
      ? parseAuthor(author)
      : { name: author.name, email: author.email, url: author.url }
    const entry = toParsedAuthor(raw)
    if (entry)
      parsed.push(entry)
  }

  const repo = normalizePkgRepository(json)
  const org = repo?.org

  // Inference 1: no explicit authors → synthesize a single inferred github maintainer from the repo org.
  if (!parsed.length && org) {
    return [{
      type: 'github',
      github: org,
      avatar: githubAvatar(org),
      inferred: true,
    }]
  }

  // Inference 2: exactly one text-typed author with no detected handle → enrich with the repo org.
  // The handle takes over as the identity; the explicit author name is dropped.
  if (parsed.length === 1 && parsed[0]!.type === 'text' && org) {
    return [{
      type: 'github',
      github: org,
      avatar: githubAvatar(org),
      inferred: true,
    }]
  }

  if (!parsed.length)
    return undefined

  return parsed
}

export interface ParsedRepository {
  url: string
  repo?: string
  repoName?: string
  org?: string
}

export function normalizePkgRepository(json: PackageJson): ParsedRepository | undefined {
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
