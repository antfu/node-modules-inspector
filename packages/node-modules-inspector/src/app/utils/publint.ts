import type { Message } from 'publint'

// TODO: remove this file when publint provides browser consumable `formatMessage`

function formatMessagePath(path: string[]): string {
  let formatted = 'pkg'
  for (const part of path) {
    if (/^\d+$/.test(part)) {
      // plain number
      formatted += `[${part}]`
    }
    else if (!/^[a-z_$][\w$]*$/i.test(part)) {
      // is invalid js var name
      formatted += `["${part}"]`
    }
    else {
      formatted += `.${part}`
    }
  }
  return formatted
}

const fp = formatMessagePath

function getPkgPathValue(pkg: any, path: string[]): any {
  let v: any = pkg
  try {
    for (const p of path) {
      v = v[p]
    }
  }
  catch (e) {
    console.error(e)
    return '<unknown>'
  }
  return v
}

function exportsRel(s: string): string {
  if (s[0] === '.')
    return s
  if (s[0] === '/')
    return `.${s}`
  return `./${s}`
}

function replaceLast(str: string, search: string, replace: string): string {
  const index = str.lastIndexOf(search)
  if (index === -1)
    return str
  return str.slice(0, index) + replace + str.slice(index + search.length)
}

export function formatMessage(
  m: Message,
  pkg: any,
  // opts: FormatMessageOptions = {},
): string | undefined {
  const pv = (path: string[]): string => getPkgPathValue(pkg, path)
  const bold = (s: string) => `<code><b>${s}</b></code>`

  switch (m.code) {
    case 'IMPLICIT_INDEX_JS_INVALID_FORMAT':
      return `index.js should be ${m.args.expectFormat} but it is ${m.args.actualFormat}`
    case 'FILE_INVALID_FORMAT': {
      const is = pv(m.path).includes('*') ? 'matches' : 'is'
      const relativePath = m.args.actualFilePath ?? pv(m.path)
      const start = m.path[0] === 'name'
        ? relativePath
        : `${fp(m.path)} ${is} ${relativePath} and`
      return `${start} is written in ${m.args.actualFormat}, but is interpreted as ${m.args.expectFormat}. Consider using the ${m.args.expectExtension} extension, e.g. ${replaceLast(relativePath, '.js', m.args.expectExtension)}`
    }
    case 'FILE_INVALID_EXPLICIT_FORMAT': {
      const is = pv(m.path).includes('*') ? 'matches' : 'is'
      const relativePath = m.args.actualFilePath ?? pv(m.path)
      const start = m.path[0] === 'name'
        ? bold(relativePath)
        : `${bold(fp(m.path))} ${is} ${bold(relativePath)} which`
      return `${start} ends with the ${(m.args.actualExtension)} extension, but the code is written in ${(m.args.actualFormat)}. Consider using the ${(m.args.expectExtension)} extension, e.g. ${bold(replaceLast(relativePath, m.args.actualExtension, m.args.expectExtension))}`
    }
    case 'FILE_INVALID_JSX_EXTENSION': {
      const is = m.args.globbedFilePath ? 'matches' : 'is'
      const relativePath = m.args.globbedFilePath ?? pv(m.path)
      const start
        = m.path[0] === 'name'
          ? bold(relativePath)
          : `${bold(fp(m.path))} ${is} ${bold(relativePath)} which`

      return `${start} uses an invalid ${bold(m.args.actualExtension)} extension. You don't need to split ESM and CJS formats for JSX. You should write a single file in ESM with the ${bold('.jsx')} extension instead, e.g. ${bold(replaceLast(pv(m.path), m.args.actualExtension, '.jsx'))}`
    }
    case 'FILE_DOES_NOT_EXIST':
      return `${bold(fp(m.path))} is ${bold(pv(m.path))} but the file does not exist.`
    case 'FILE_NOT_PUBLISHED':
      return `${bold(fp(m.path))} is ${bold(pv(m.path))} but the file is not published. Is it specified in ${bold('pkg.files')}?`
    case 'HAS_ESM_MAIN_BUT_NO_EXPORTS':
      return `${bold('pkg.main')} is an ESM file, but it is usually better to use ${bold('pkg.exports')} instead. If you don't support Node.js 12.6 and below, you can also remove ${bold('pkg.main')}. (This will be a breaking change)`
    case 'HAS_MODULE_BUT_NO_EXPORTS':
      return `${bold('pkg.module')} is used to output ESM, but ${bold('pkg.exports')} is not defined. As Node.js doesn't read ${bold('pkg.module')}, the ESM output may be skipped. Consider adding ${bold('pkg.exports')} to the ESM output. ${bold('pkg.module')} can usually be removed alongside too. (This will be a breaking change)`
    case 'MODULE_SHOULD_BE_ESM':
      return `${bold('pkg.module')} should be ESM, but the code is written in CJS.`
    case 'EXPORTS_GLOB_NO_MATCHED_FILES':
    case 'IMPORTS_GLOB_NO_MATCHED_FILES':
      return `${bold(fp(m.path))} is ${bold(pv(m.path))} but does not match any files.`
    case 'EXPORTS_GLOB_NO_DEPRECATED_SUBPATH_MAPPING':
    case 'IMPORTS_GLOB_NO_DEPRECATED_SUBPATH_MAPPING':
      return `${bold(fp(m.path))} maps to a path that ends with ${bold('/')} which is deprecated. Use ${bold(fp(m.args.expectPath))}: "${bold(m.args.expectValue)}" instead.`
    case 'EXPORTS_TYPES_SHOULD_BE_FIRST':
      return `${bold(fp(m.path))} should be the first in the object as conditions are order-sensitive so it can be resolved by TypeScript.`
    case 'EXPORTS_MODULE_SHOULD_PRECEDE_REQUIRE':
    case 'IMPORTS_MODULE_SHOULD_PRECEDE_REQUIRE': {
      return `${bold(fp(m.path))} should come before the "require" condition so it can take precedence when used by a bundler.`
    }
    case 'EXPORTS_DEFAULT_SHOULD_BE_LAST':
    case 'IMPORTS_DEFAULT_SHOULD_BE_LAST':
      return `${bold(fp(m.path))} should be the last in the object so it doesn't take precedence over the keys following it.`
    case 'EXPORTS_MODULE_SHOULD_BE_ESM':
    case 'IMPORTS_MODULE_SHOULD_BE_ESM':
      return `${bold(fp(m.path))} should be ESM, but the code is written in CJS.`
    case 'EXPORTS_VALUE_INVALID':
    case 'IMPORTS_VALUE_INVALID':
      return `${bold(fp(m.path))} is ${bold(pv(m.path))} but is invalid as it does not start with "${bold('./')}". Use ${bold(m.args.suggestValue)} instead.`
    case 'EXPORTS_MISSING_ROOT_ENTRYPOINT': {
      const mainField = m.args.mainFields[0]
      return `${bold(fp(m.path))} is missing the root entrypoint export, which is defined in ${bold(`pkg.${mainField}`)}. Environments that support the ${bold('"exports"')} field will ignore ${bold(`pkg.${mainField}`)} as ${bold('"exports"')} takes the highest priority. Consider adding ${bold(fp(m.path.concat('.')))}: "${bold(pv([mainField]))}".`
    }
    case 'USE_EXPORTS_BROWSER':
      return `${bold('pkg.browser')} with a string value can be refactored to use ${bold('pkg.exports')} and the ${bold('"browser"')} condition to declare browser-specific exports. `
        + `e.g. ${bold('pkg.exports["."].browser')}: "${bold(pv(m.path))}". (This will be a breaking change)`
    case 'USE_EXPORTS_OR_IMPORTS_BROWSER':
      return `${bold('pkg.browser')} with an object value can be refactored to use ${bold('pkg.exports')}/${bold('pkg.imports')} and the ${bold('"browser"')} condition to declare browser-specific exports. (This will be a breaking change)`
    case 'USE_FILES':
      return `The package ${bold('publishes internal tests or config files')}. You can use ${bold('pkg.files')} to only publish certain files and save user bandwidth.`
    case 'USE_TYPE':
      return `The package does not specify the ${bold('"type"')} field. Node.js may attempt to detect the package type causing a small performance hit. Consider adding ${bold('"type"')}: "${bold('commonjs')}".`
    case 'USE_LICENSE':
      return `The package does not specify the ${bold('"license"')} field but a license file was detected at ${bold(m.args.licenseFilePath)}. Consider adding a ${bold('"license"')} field so it's displayed on npm.`
    case 'TYPES_NOT_EXPORTED': {
      const typesFilePath = exportsRel(m.args.typesFilePath)
      if (m.args.actualExtension && m.args.expectExtension) {
        return `${bold(fp(m.path))} types is not exported. Consider adding ${bold(`${fp(m.path)}.types`)} to be compatible with TypeScript's ${bold('"moduleResolution": "bundler"')} compiler option. `
          + `Note that you cannot use "${bold(typesFilePath)}" because it has a mismatching format. Instead, you can duplicate the file and use the ${bold(m.args.expectExtension)} extension, e.g. `
          + `${bold(`${fp(m.path)}.types`)}: "${bold(replaceLast(typesFilePath, m.args.actualExtension, m.args.expectExtension))}"`
      }
      else {
        return `${bold(fp(m.path))} types is not exported. Consider adding ${bold(`${fp(m.path)}.types`)}: "${bold(typesFilePath)}" to be compatible with TypeScript's ${bold('"moduleResolution": "bundler"')} compiler option.`
      }
    }
    case 'EXPORTS_TYPES_INVALID_FORMAT': {
      let additionalMessage = ''
      // ambiguous default export
      if (m.args.expectFormat === 'ESM' && m.args.actualFormat === 'CJS') {
        additionalMessage = `This causes the types to be ambiguous when default importing the package due to its implied interop. `
      }
      // incorrect dynamic import restriction
      else if (m.args.expectFormat === 'CJS' && m.args.actualFormat === 'ESM') {
        additionalMessage = `This causes the types to only work when dynamically importing the package, even though the package exports CJS. `
      }

      return `${bold(fp(m.path))} types is interpreted as ${m.args.actualFormat} when resolving with the "${bold(m.args.condition)}" condition. ${
        additionalMessage
      }Consider splitting out two ${bold('"types"')} conditions for ${bold('"import"')} and ${bold('"require"')}, and use the ${(m.args.expectExtension)} extension, `
      + `e.g. ${bold(fp(m.args.expectPath))}: "${bold(replaceLast(pv(m.path), m.args.actualExtension, m.args.expectExtension))}"`
    }
    case 'FIELD_INVALID_VALUE_TYPE': {
      let expectStr = m.args.expectTypes[0]
      for (let i = 1; i < m.args.expectTypes.length; i++) {
        if (i === m.args.expectTypes.length - 1) {
          expectStr += ` or ${m.args.expectTypes[i]}`
        }
        else {
          expectStr += `, ${m.args.expectTypes[i]}`
        }
      }
      return `${bold(fp(m.path))} is ${bold(pv(m.path))} which is an invalid ${bold(m.args.actualType)} type. Expected a ${bold(expectStr)} type instead.`
    }
    case 'EXPORTS_VALUE_CONFLICTS_WITH_BROWSER':
      return `${bold(fp(m.path))} is ${bold(pv(m.path))} which also matches ${bold(fp(m.args.browserPath))}: "${bold(pv(m.args.browserPath))}", which overrides the path when building the library with the "${bold(m.args.browserishCondition)}" condition. This is usually unintentional and may cause build issues. Consider using a different file name for ${bold(pv(m.path))}.`
    case 'DEPRECATED_FIELD_JSNEXT':
      return `${bold(fp(m.path))} is deprecated. ${bold('pkg.module')} should be used instead.`
    case 'LOCAL_DEPENDENCY':
      return `The "${bold(m.path[m.path.length - 1])}" dependency references "${bold(pv(m.path))}" that will likely not work when installed by end-users.`
    case 'BIN_FILE_NOT_EXECUTABLE':
      return `${bold(fp(m.path))} is ${bold(pv(m.path))} but the file is not executable. It should start with shebang, e.g. ${bold('#!/usr/bin/env node')}.`
    case 'IMPORTS_KEY_INVALID':
      return `${bold(fp(m.path))} is invalid as the imports key does not start with "${bold('#')}". Use ${bold(m.args.suggestKey)} instead.`
    case 'INVALID_REPOSITORY_VALUE': {
      switch (m.args.type) {
        case 'invalid-string-shorthand':
          return `${bold(fp(m.path))} is ${bold(pv(m.path))} which isn't a valid shorthand value supported by npm. Consider using an object that references a repository.`
        case 'invalid-git-url':
          return `${bold(fp(m.path))} is ${bold(pv(m.path))} which isn't a valid git URL. A valid git URL is usually in the form of "${bold('git+https://example.com/user/repo.git')}".`
        case 'deprecated-github-git-protocol':
          return `${bold(fp(m.path))} is ${bold(pv(m.path))} which uses the git:// protocol that is deprecated by GitHub due to security concerns. Consider replacing the protocol with https://.`
        case 'shorthand-git-sites': {
          return `${bold(fp(m.path))} is ${bold(pv(m.path))} but could be a full git URL like "${bold(m.args.suggestValue)}".`
        }
      }
    }
  }
}
