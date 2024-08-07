import type { SFCTemplateBlock } from '@vue/compiler-sfc'
import { caseInsensitive, charNotIn, createRegExp, global, oneOrMore } from 'magic-regexp'
import { TEXT_INFO, TEXT_RESET, TEXT_WARN } from '../asceeCodes'
import type { Offense } from '../../types'

const vifWithVforFiles: { filePath: string }[] = []

const checkVifWithVfor = (template: SFCTemplateBlock | null, filePath: string) => {
  if (!template) {
    return
  }
  const regex1 = createRegExp(
    '<',
    oneOrMore(charNotIn('>')),
    ' v-if',
    oneOrMore(charNotIn('>')),
    ' v-for',
    oneOrMore(charNotIn('>')),
    '>',
    [global, caseInsensitive],
  )
  const regex2 = createRegExp(
    '<',
    oneOrMore(charNotIn('>')),
    ' v-for',
    oneOrMore(charNotIn('>')),
    ' v-if',
    oneOrMore(charNotIn('>')),
    '>',
    [global, caseInsensitive],
  )
  const matches1 = template.content.match(regex1)
  const matches2 = template.content.match(regex2)

  if (matches1?.length || matches2?.length) {
    vifWithVforFiles.push({ filePath })
  }
}

const reportVifWithVfor = () => {
  const offenses: Offense[] = []

  if (vifWithVforFiles.length > 0) {
    vifWithVforFiles.forEach((file) => {
      offenses.push({
        file: file.filePath,
        rule: `${TEXT_INFO}vue-essential ~ v-if used with v-for${TEXT_RESET}`,
        description: `👉 ${TEXT_WARN}Move out the v-if to a computed property.${TEXT_RESET} See: https://vuejs.org/style-guide/rules-essential.html#avoid-v-if-with-v-for`,
        message: `🚨`,
      })
    })
  }
  return offenses
}

export { checkVifWithVfor, reportVifWithVfor }
