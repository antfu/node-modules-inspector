import StreamJSON from 'stream-json'
import Assembler from 'stream-json/Assembler'

export function parseJsonStream<T>(
  stream: NodeJS.ReadableStream,
): Promise<T> {
  const assembler = new Assembler()
  const parser = StreamJSON.parser()

  return new Promise<T>((resolve) => {
    parser.on('data', (chunk) => {
      // @ts-expect-error casting
      assembler[chunk.name]?.(chunk.value)
    })
    stream.pipe(parser)
    parser.on('end', () => {
      resolve(assembler.current)
    })
  })
}

export function parseJsonStreamWithConcatArrays<T>(
  stream: NodeJS.ReadableStream,
): Promise<T[]> {
  const assembler = new Assembler()
  const parser = StreamJSON.parser({
    jsonStreaming: true,
  })

  const values: T[] = []

  return new Promise<T[]>((resolve) => {
    parser.on('data', (chunk) => {
      // @ts-expect-error casting
      assembler[chunk.name]?.(chunk.value)
      if (assembler.done) {
        if (!Array.isArray(assembler.current))
          throw new Error(`Expected an array but got: ${String(assembler.current)}`)
        values.push(...assembler.current)
      }
    })
    stream.pipe(parser)
    parser.on('end', () => {
      resolve(values)
    })
  })
}
