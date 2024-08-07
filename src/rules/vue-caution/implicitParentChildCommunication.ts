import type { SFCScriptBlock } from '@vue/compiler-sfc'
import { createRegExp, exactly, global } from 'magic-regexp'
import { BG_RESET, BG_WARN, TEXT_INFO, TEXT_RESET, TEXT_WARN } from '../asceeCodes'
import getLineNumber from '../getLineNumber'
import type { Offense } from '../../types'

interface ImplicitParentChildCommunicationFile { filename: string, message: string }

const implicitParentChildCommunicationFiles: ImplicitParentChildCommunicationFile[] = []

const checkImplicitParentChildCommunication = (script: SFCScriptBlock | null, filePath: string) => {
  if (!script) {
    return
  }
  const propsRegex = /defineProps\(([^)]+)\)/
  const vModelRegex = /v-model\s*=\s*"([^"]+)"/
  const parentRegex = createRegExp(exactly('$parent').or('getCurrentInstance'), [global])

  // Extract defined props
  const propsMatch = script.content.match(propsRegex)

  // Check for props mutation
  const vModelMatch = script.content.match(vModelRegex)
  if (vModelMatch) {
    const vModelProp = vModelMatch[1].split('.')[0]
    const definedProps = propsMatch ? propsMatch[1] : ''

    // Check if matched prop is inside `v-model` directive
    if (definedProps.includes(vModelProp)) {
      const lineNumber = getLineNumber(script.content.trim(), definedProps)
      implicitParentChildCommunicationFiles.push({
        filename: filePath,
        message: `line #${lineNumber} ${BG_WARN}(${vModelProp})${BG_RESET}`,
      })
    }
  }

  // Check for $parent / getCurrentInstance
  const parentMatch = script.content.match(parentRegex)
  if (parentMatch) {
    const lineNumber = getLineNumber(script.content.trim(), parentMatch[0])
    implicitParentChildCommunicationFiles.push({
      filename: filePath,
      message: `line #${lineNumber} ${BG_WARN}(${parentMatch[0]})${BG_RESET}`,
    })
  }
}

const reportImplicitParentChildCommunication = () => {
  const offenses: Offense[] = []

  if (implicitParentChildCommunicationFiles.length > 0) {
    implicitParentChildCommunicationFiles.forEach((file) => {
      offenses.push({
        file: file.filename,
        rule: `${TEXT_INFO}vue-caution ~ implicit parent-child communication${TEXT_RESET}`,
        description: `👉 ${TEXT_WARN}Avoid implicit parent-child communication to maintain clear and predictable component behavior.${TEXT_RESET} See: https://vuejs.org/style-guide/rules-use-with-caution.html#implicit-parent-child-communication`,
        message: `${file.message} 🚨`,
      })
    })
  }
  return offenses
}

export { checkImplicitParentChildCommunication, reportImplicitParentChildCommunication }
