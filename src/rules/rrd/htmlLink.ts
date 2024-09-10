import { caseInsensitive, createRegExp, global, wordBoundary } from 'magic-regexp'
import type { SFCTemplateBlock } from '@vue/compiler-sfc'
import type { FileCheckResult, Offense } from '../../types'

const results: FileCheckResult[] = []

const checkHtmlLink = (template: SFCTemplateBlock | null, filePath: string) => {
  if (!template) {
    return
  }
  const regex = createRegExp('<a', wordBoundary, [global, caseInsensitive])
  // TODO - getLineNumber will not help us here as it will return the line number of the first match for all matches
  const matches = template.content.match(regex)

  if (matches?.length) {
    results.push({ filePath, message: `${matches?.length} <bg_warn>html link found</bg_warn>` })
  }
}

const reportHtmlLink = () => {
  const offenses: Offense[] = []

  if (results.length > 0) {
    results.forEach((result) => {
      offenses.push({
        file: result.filePath,
        rule: `<text_info>rrd ~ html link</text_info>`,
        description: `👉 <text_warn>Use router-link or NuxtLink.</text_warn> See: https://vue-mess-detector.webmania.cc/rules/rrd/html-link.html`,
        message: `${result.message} 🚨`,
      })
    })
  }
  return offenses
}

const resetHtmlLink = () => (results.length = 0)

export { checkHtmlLink, reportHtmlLink, resetHtmlLink }
