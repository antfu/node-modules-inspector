export interface ResolvedFunding {
  url: string
  type: string
  name: string
  entry: string
  avatar?: string
}

export function parseFunding(url?: string): ResolvedFunding | undefined {
  if (!url)
    return undefined
  let name = ''
  let type = 'link'
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
    avatar = `https://github.com/${name}.png`
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
