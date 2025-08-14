// @ts-expect-error missing types
import { WEBCONTAINER_SERVER_CODE as _WEBCONTAINER_SERVER_CODE } from '#build/webcontainer-server-code'

export const CODE_SERVER = _WEBCONTAINER_SERVER_CODE as string

export const CODE_PACKAGE_JSON = JSON.stringify({
  name: 'node-modules-inspector-workspace',
  private: true,
  type: 'module',
})
