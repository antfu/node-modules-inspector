import { MARK_ERROR } from './constants'

export class InspectorError extends Error {
  prettyPrint() {
    console.error(MARK_ERROR, this.message)
  }
}
