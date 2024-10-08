import type { FileCheckResult, Offense } from '../../types'
import path from 'node:path'
import { createRegExp, letter } from 'magic-regexp'
import { IGNORE_NAME_RULES } from '../../helpers/constants'

const results: FileCheckResult[] = []

const resetResults = () => (results.length = 0)

const checkSingleNameComponent = (filePath: string) => {
  // in the pages and layouts directory this rule does not apply
  if (filePath.includes('pages') || filePath.includes('layouts')) {
    return
  }

  const fileName = path.basename(filePath)
  if (IGNORE_NAME_RULES.includes(fileName.toLowerCase())) {
    return
  }

  // Check for filenames inside square brackets (e.g. [id].vue)
  if (fileName.startsWith('[') && fileName.endsWith('].vue')) {
    return
  }

  const regex = createRegExp(letter.uppercase)
  const matches = fileName.slice(1).match(regex) // ignore the first character

  if (!matches?.length) {
    results.push({ filePath, message: `Component name is <bg_err>single word</bg_err>` })
  }
}

const reportSingleNameComponent = () => {
  const offenses: Offense[] = []

  if (results.length > 0) {
    results.forEach((result) => {
      offenses.push({
        file: result.filePath,
        rule: `<text_info>vue-essential ~ single name component</text_info>`,
        description: `👉 <text_warn>Rename the component to use multi-word name.</text_warn> See: https://vue-mess-detector.webmania.cc/rules/vue-essential/single-name-component.html`,
        message: `${result.message} 🚨`,
      })
    })
  }
  resetResults()

  return offenses
}

export { checkSingleNameComponent, reportSingleNameComponent }
