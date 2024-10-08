import type { SFCScriptBlock } from '@vue/compiler-sfc'
import type { FileCheckResult, Offense } from '../../types'
import { skipComments } from '../../helpers/skipComments'
import getLineNumber from '../getLineNumber'

const results: FileCheckResult[] = []
const complicatedComputedFiles: { filePath: string }[] = []

const resetResults = () => (results.length = 0)

const checkSimpleComputed = (script: SFCScriptBlock | null, filePath: string, maxComputedLength: number) => {
  if (!script) {
    return
  }

  // eslint-disable-next-line regexp/prefer-w, regexp/strict, regexp/no-useless-flag
  const regex = /const\s+([a-zA-Z0-9_$]+)\s*=\s*computed\(\s*\(\)\s*=>\s*{([^{}]*(?:{[^{}]*}[^{}]*)*)}\s*\)/gs

  const content = skipComments(script.content)
  const matches = content.match(regex)
  if (matches?.length) {
    matches.forEach((match) => {
      if (match.split('\n').length > maxComputedLength) {
        const firstLine = match.split('\n')[0]
        const lineNumber = getLineNumber(script.content, firstLine)
        results.push({ filePath, message: `line #${lineNumber} <bg_warn>computed</bg_warn>` })
        complicatedComputedFiles.push({ filePath })
        if (!complicatedComputedFiles.some(file => file.filePath === filePath)) {
          complicatedComputedFiles.push({ filePath })
        }
      }
    })
  }
}

const reportSimpleComputed = () => {
  const offenses: Offense[] = []

  if (complicatedComputedFiles.length > 0) {
    results.forEach((result) => {
      offenses.push({
        file: result.filePath,
        rule: `<text_info>vue-strong ~ complicated computed property</text_info>`,
        description: `👉 <text_warn>Refactor the computed properties to smaller ones.</text_warn> See: https://vue-mess-detector.webmania.cc/rules/vue-strong/simple-computed.html`,
        message: `${result.message} 🚨`,
      })
    })
  }
  resetResults()

  return offenses
}

export { checkSimpleComputed, reportSimpleComputed }
