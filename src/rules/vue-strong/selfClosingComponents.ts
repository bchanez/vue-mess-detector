import { charNotIn, createRegExp, letter, linefeed, maybe, oneOrMore, tab, wordChar } from 'magic-regexp'
import type { SFCDescriptor } from '@vue/compiler-sfc'

import getLineNumber from '../getLineNumber'
import type { FileCheckResult, Offense } from '../../types'

const results: FileCheckResult[] = []

const checkSelfClosingComponents = (descriptor: SFCDescriptor | null, filePath: string) => {
  if (!descriptor) {
    return
  }
  const template = descriptor.template

  const regexSelfClosingComponent = createRegExp(
    '<',
    oneOrMore(letter.uppercase, wordChar),
    maybe(linefeed, tab),
    maybe(oneOrMore(charNotIn('>'))),
    '></',
    oneOrMore(wordChar),
    '>',
    ['g'],
  )
  const matches = template?.content?.match(regexSelfClosingComponent)

  if (matches === null) {
    return
  }

  matches?.forEach((componentTag) => {
    const lineNumber = getLineNumber(descriptor.source, componentTag)
    const lastPart = componentTag.split('\n').at(-1)?.trim() || ''
    results.push({ filePath, message: `line #${lineNumber} <bg_warn>${lastPart}</bg_warn>` })
  })
}

const reportSelfClosingComponents = () => {
  const offenses: Offense[] = []

  if (results.length > 0) {
    results.forEach((result) => {
      offenses.push({
        file: result.filePath,
        rule: `<text_info>vue-strong ~ component is not self closing</text_info>`,
        description: `👉 <text_warn>Components with no content should be self-closing.</text_warn> See: https://vue-mess-detector.webmania.cc/rules/vue-strong/self-closing-components.html`,
        message: `${result.message} 🚨`,
      })
    })
  }
  return offenses
}

const resetSelfClosingComponents = () => (results.length = 0)

export { checkSelfClosingComponents, reportSelfClosingComponents, resetSelfClosingComponents }
