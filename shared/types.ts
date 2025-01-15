export interface Payload {
  meta: PayloadMeta
}

export interface ResolvedPayload extends Payload {

}

export interface ErrorInfo {
  error: string
  message?: string
}

export interface PayloadMeta {
  wsPort?: number
  lastUpdate: number
  root: string
}
