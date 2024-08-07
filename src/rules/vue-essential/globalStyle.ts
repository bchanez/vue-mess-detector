import { SFCStyleBlock } from '@vue/compiler-sfc'
import { BG_ERR, BG_RESET, TEXT_INFO, TEXT_RESET, TEXT_WARN } from '../asceeCodes'

const globalStyleFiles: { filePath: string }[] = []

const checkGlobalStyle = (styles: SFCStyleBlock[] | null, filePath: string) => {
  if (!styles) {
    return
  }
  styles.forEach(style => {
    if (!style.scoped) {
      globalStyleFiles.push({ filePath })
    }
  })
}

const reportGlobalStyle = () => {
  if (globalStyleFiles.length > 0) {
    console.log(
      `\n${TEXT_INFO}vue-essential${TEXT_RESET} ${BG_ERR}Global style ${BG_RESET} is used in ${globalStyleFiles.length} files.`
    )
    console.log(
      `👉 ${TEXT_WARN}Use <style scoped>.${TEXT_RESET} See: https://vuejs.org/style-guide/rules-essential.html#use-component-scoped-styling`
    )
    globalStyleFiles.forEach(file => {
      console.log(`- ${file.filePath} 🚨`)
    })
  }
  return globalStyleFiles.length
}

export { checkGlobalStyle, reportGlobalStyle }
