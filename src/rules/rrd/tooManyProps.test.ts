import type { SFCScriptBlock } from '@vue/compiler-sfc'
import { describe, expect, it } from 'vitest'
import { DEFAULT_OVERRIDE_CONFIG } from '../../helpers/constants'
import { checkTooManyProps, reportTooManyProps } from './tooManyProps'

describe('checkTooManyProps', () => {
  it('should not report files with less then or exactly 5 props without annotation', () => {
    const script = { content: `<script setup>defineProps({title: String, likes: Number})\n</script>` } as SFCScriptBlock
    const fileName = '2-props-no-annotate.vue'
    const maxPropsCount = DEFAULT_OVERRIDE_CONFIG.maxPropsCount
    checkTooManyProps(script, fileName, maxPropsCount)
    const result = reportTooManyProps()
    expect(result.length).toBe(0)
    expect(result).toStrictEqual([])

    const script2 = {
      content: `<script setup>\nconst props = defineProps({\n\ttitle: String,\n\tlikes: Number})\n</script>`,
    } as SFCScriptBlock
    const fileName2 = '2-props-newline-no-annotate.vue'
    checkTooManyProps(script2, fileName2, maxPropsCount)
    const result2 = reportTooManyProps()
    expect(result2.length).toBe(0)
    expect(result2).toStrictEqual([])
  })

  it('should not report files with less then or exactly 5 props with annotations', () => {
    const script = { content: `<script setup>\ndefineProps<{title: string,likes: number}>()\n</script>` } as SFCScriptBlock
    const fileName = '2-props-annotate.vue'
    const maxPropsCount = DEFAULT_OVERRIDE_CONFIG.maxPropsCount
    checkTooManyProps(script, fileName, maxPropsCount)
    const result = reportTooManyProps()
    expect(result.length).toBe(0)
    expect(result).toStrictEqual([])
  })

  it('should report files with more then 5 props without annotations', () => {
    const script = {
      content: `<script setup>\ndefineProps({title: String,likes: Number,\nlink: String, shares: Number, show: Boolean, published: Date})\n</script>`,
    } as SFCScriptBlock
    const fileName = '6-props-no-annotate.vue'
    const maxPropsCount = DEFAULT_OVERRIDE_CONFIG.maxPropsCount
    checkTooManyProps(script, fileName, maxPropsCount)
    const result = reportTooManyProps()
    expect(result.length).toBe(1)
    expect(result).toStrictEqual([{
      file: fileName,
      rule: `<text_info>rrd ~ too many props</text_info>`,
      description: `👉 <text_warn>Try to refactor your code to use less properties.</text_warn> See: https://vue-mess-detector.webmania.cc/rules/rrd/too-many-props.html`,
      message: `props found <bg_err>(6)</bg_err> 🚨`,
    }])
  })

  it('should report files with more then 5 props with annotations', () => {
    const script = {
      content: `<script setup>\nconst props = defineProps<{\n\ttitle: String,\n\tlikes: Number,\n\tlink: String,\n\tshares: Number,\n\tshow: Boolean,\n\tpublished: Date}>()\n</script>`,
    } as SFCScriptBlock
    const fileName = '6-props-annotate.vue'
    const maxPropsCount = DEFAULT_OVERRIDE_CONFIG.maxPropsCount
    checkTooManyProps(script, fileName, maxPropsCount)
    const result = reportTooManyProps()
    expect(result.length).toBe(1)
    expect(result).toStrictEqual([{
      file: fileName,
      rule: `<text_info>rrd ~ too many props</text_info>`,
      description: `👉 <text_warn>Try to refactor your code to use less properties.</text_warn> See: https://vue-mess-detector.webmania.cc/rules/rrd/too-many-props.html`,
      message: `props found <bg_err>(6)</bg_err> 🚨`,
    }])
  })
})
