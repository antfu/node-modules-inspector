export function parseAuthor(author?: string) {
  if (!author)
    return undefined

  let link: string | undefined
  const name = author
    .replace(/<.*>/, '')
    .replace(/\(.*\)/, '')
    .replace(/^https?:\/\//, '')

  return {
    name,
    link,
  }
}
