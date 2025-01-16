// strip UTF-8 BOM
// copied from https://github.com/vitejs/vite/blob/90f1420430d7eff45c1e00a300fb0edd972ee0df/packages/vite/src/node/utils.ts#L1322
export function stripBomTag(content: string): string {
  // eslint-disable-next-line unicorn/number-literal-case
  if (content.charCodeAt(0) === 0xfeff) {
    return content.slice(1)
  }

  return content
}
