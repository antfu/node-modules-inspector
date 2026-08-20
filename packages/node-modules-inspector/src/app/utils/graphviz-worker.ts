import type { Graphviz } from '@hpcc-js/wasm-graphviz'

export interface GraphvizLayoutRequest {
  id: number
  dot: string
}

export interface GraphvizLayoutResponse {
  id: number
  json?: string
  error?: string
}

let _graphviz: Promise<Graphviz> | undefined

globalThis.addEventListener('message', async (event: MessageEvent<GraphvizLayoutRequest>) => {
  const { id, dot } = event.data
  try {
    _graphviz ||= import('@hpcc-js/wasm-graphviz').then(r => r.Graphviz.load())
    const graphviz = await _graphviz
    const json = graphviz.dot(dot, 'json')
    globalThis.postMessage({ id, json } satisfies GraphvizLayoutResponse)
  }
  catch (error) {
    globalThis.postMessage({ id, error: String(error) } satisfies GraphvizLayoutResponse)
  }
})
