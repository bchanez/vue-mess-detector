import type { SFCDescriptor } from '@vue/compiler-sfc'
import { charNotIn, createRegExp, letter, linefeed, maybe, oneOrMore, tab, wordChar } from 'magic-regexp'
import { BG_RESET, BG_WARN, TEXT_INFO, TEXT_RESET, TEXT_WARN } from '../asceeCodes'
import getLineNumber from '../getLineNumber'
import type { Offense } from '../../types'

const selfClosingComponentsFiles: { filename: string, message: string }[] = []

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

  if (matches === null)
    return

  matches?.forEach((componentTag) => {
    const lineNumber = getLineNumber(descriptor.source, componentTag)
    const lastPart = componentTag.split('\n').at(-1)?.trim() || ''
    selfClosingComponentsFiles.push({ filename: filePath, message: `line #${lineNumber} ${BG_WARN}${lastPart}${BG_RESET}` })
  })
}

const reportSelfClosingComponents = () => {
  const offenses: Offense[] = []

  if (selfClosingComponentsFiles.length > 0) {
    selfClosingComponentsFiles.forEach((file) => {
      offenses.push({
        file: file.filename,
        rule: `${TEXT_INFO}vue-strong ~ component is not self closing${TEXT_RESET}`,
        description: `👉 ${TEXT_WARN}Components with no content should be self-closing.${TEXT_RESET} See: https://vuejs.org/style-guide/rules-strongly-recommended.html#self-closing-components`,
        message: `${file.message} 🚨`,
      })
    })
  }
  return offenses
}

const resetSelfClosingComponents = () => (selfClosingComponentsFiles.length = 0)

export { checkSelfClosingComponents, reportSelfClosingComponents, resetSelfClosingComponents }
