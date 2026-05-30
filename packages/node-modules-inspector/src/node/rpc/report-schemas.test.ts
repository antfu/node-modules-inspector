import { toJsonSchema } from '@valibot/to-json-schema'
import { describe, expect, it } from 'vitest'
import { reportDuplicatesRpc } from './report-duplicates'
import { reportMaintainersRpc } from './report-maintainers'
import { reportSizesRpc } from './report-sizes'

/**
 * Locks down the MCP-facing JSON Schemas for each report tool. devframe runs
 * the same conversion via @valibot/to-json-schema before exposing tools via
 * `tools/list`, so these snapshots are the contract agents see. Any drift here
 * is a public-API change.
 */

const stubHandlers = {} as any

function schemasOf(def: { args?: readonly unknown[], returns?: unknown }) {
  return {
    input: def.args?.[0] ? toJsonSchema(def.args[0] as any) : null,
    output: def.returns ? toJsonSchema(def.returns as any) : null,
  }
}

describe('report RPC schemas', () => {
  it('duplicates', () => {
    expect(schemasOf(reportDuplicatesRpc(stubHandlers))).toMatchInlineSnapshot(`
      {
        "input": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "default": {},
          "properties": {
            "limit": {
              "type": "number",
            },
            "minVersions": {
              "default": 2,
              "minimum": 2,
              "type": "integer",
            },
          },
          "required": [],
          "type": "object",
        },
        "output": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "items": {
            "properties": {
              "name": {
                "type": "string",
              },
              "specs": {
                "items": {
                  "type": "string",
                },
                "type": "array",
              },
              "versions": {
                "items": {
                  "type": "string",
                },
                "type": "array",
              },
            },
            "required": [
              "name",
              "versions",
              "specs",
            ],
            "type": "object",
          },
          "type": "array",
        },
      }
    `)
  })

  it('sizes', () => {
    expect(schemasOf(reportSizesRpc(stubHandlers))).toMatchInlineSnapshot(`
      {
        "input": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "default": {},
          "properties": {
            "includeWorkspace": {
              "default": false,
              "type": "boolean",
            },
            "limit": {
              "default": 50,
              "type": "integer",
            },
          },
          "required": [],
          "type": "object",
        },
        "output": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "items": {
            "properties": {
              "bytes": {
                "type": "number",
              },
              "categories": {
                "additionalProperties": {
                  "properties": {
                    "bytes": {
                      "type": "number",
                    },
                    "count": {
                      "type": "number",
                    },
                  },
                  "required": [
                    "bytes",
                    "count",
                  ],
                  "type": "object",
                },
                "propertyNames": {
                  "type": "string",
                },
                "type": "object",
              },
              "name": {
                "type": "string",
              },
              "spec": {
                "type": "string",
              },
              "version": {
                "type": "string",
              },
              "workspace": {
                "type": "boolean",
              },
            },
            "required": [
              "spec",
              "name",
              "version",
              "workspace",
              "bytes",
              "categories",
            ],
            "type": "object",
          },
          "type": "array",
        },
      }
    `)
  })

  it('maintainers', () => {
    expect(schemasOf(reportMaintainersRpc(stubHandlers))).toMatchInlineSnapshot(`
      {
        "input": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "default": {},
          "properties": {
            "authors": {
              "default": [],
              "items": {
                "type": "string",
              },
              "type": "array",
            },
            "includePublint": {
              "default": true,
              "type": "boolean",
            },
            "latestOnly": {
              "default": true,
              "type": "boolean",
            },
            "limit": {
              "type": "number",
            },
            "sort": {
              "default": "depth",
              "enum": [
                "depth",
                "migration",
                "latest",
              ],
              "type": "string",
            },
          },
          "required": [],
          "type": "object",
        },
        "output": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "items": {
            "properties": {
              "authors": {
                "items": {},
                "type": "array",
              },
              "consumer": {
                "properties": {
                  "depth": {
                    "type": "number",
                  },
                  "name": {
                    "type": "string",
                  },
                  "spec": {
                    "type": "string",
                  },
                  "version": {
                    "type": "string",
                  },
                },
                "required": [
                  "spec",
                  "name",
                  "version",
                  "depth",
                ],
                "type": "object",
              },
              "items": {
                "items": {},
                "type": "array",
              },
              "latestReleasedAt": {
                "type": "number",
              },
              "maxMigrationRatio": {
                "type": "number",
              },
            },
            "required": [
              "consumer",
              "authors",
              "items",
              "maxMigrationRatio",
              "latestReleasedAt",
            ],
            "type": "object",
          },
          "type": "array",
        },
      }
    `)
  })
})
