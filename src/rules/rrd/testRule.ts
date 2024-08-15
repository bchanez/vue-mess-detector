import type { SFCScriptBlock } from '@vue/compiler-sfc'
import { createRegExp } from 'magic-regexp'
import { BG_ERR, BG_RESET, TEXT_INFO, TEXT_RESET, TEXT_WARN } from '../asceeCodes'
import type { FileCheckResult, Offense } from '../../types'

const results: FileCheckResult[] = []

const checkTestRule = (script: SFCScriptBlock | null, filePath: string) => {
  if (!script) {
    return
  }
  const regex = createRegExp()
  const matches = script.content.match(regex)

  if (matches?.length) {
    results.push({ filePath, message: `add_your_message ${BG_ERR}(${matches.length})${BG_RESET}` })
  }
}

const reportTestRule = () => {
  const offenses: Offense[] = []

  if (results.length > 0) {
    results.forEach((result) => {
      offenses.push({
        file: result.filePath,
        rule: `${TEXT_INFO}RULESET ~ TestRule${TEXT_RESET}`,
        description: `👉 ${TEXT_WARN}add_your_description.${TEXT_RESET} See: https://link_to_docs`,
        message: `${result.message} 🚨`,
      })
    })
  }
  return offenses
}

const resetTestRule = () => (results.length = 0)

export { checkTestRule, reportTestRule, resetTestRule }