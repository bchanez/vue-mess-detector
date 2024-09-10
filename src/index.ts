import fs from 'node:fs/promises'
import path from 'node:path'
import Table from 'cli-table3'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { analyze } from './analyzer'
import coerceRules from './helpers/coerceRules'
import { FLAT_RULESETS_RULES } from './helpers/constants'
import { getPackageJson } from './helpers/getPackageJson'
import getProjectRoot from './helpers/getProjectRoot'
import { validateOption } from './helpers/validateOption'
import { wasOptionPassed } from './helpers/wasOptionPassed'
import { tags2Ascee } from './rules/asceeCodes'
import { RULESETS } from './rules/rules'
import { GROUP_BY, OUTPUT_FORMATS, OUTPUT_LEVELS, SORT_BY } from './types'
import type { GroupBy, OutputFormat, OutputLevel, SortBy } from './types'

// eslint-disable-next-line node/prefer-global/process
const pathArg = process.argv[2] == 'analyze' ? process.argv[3] : process.argv[4]
const projectRoot = await getProjectRoot(pathArg || './src')

const vmdPackageJson = await getPackageJson()
const configOutput: { info: string }[] = []

let config = {
  path: './src',
  apply: Object.values(RULESETS).join(','),
  ignore: undefined,
  exclude: undefined,
  group: 'rule',
  level: 'all',
  sort: 'desc',
  output: 'text',
}

const conflictingFlags: Record<string, boolean> = {
  applyFromCLI: wasOptionPassed('apply'),
  ignoreFromCLI: wasOptionPassed('ignore'),
  applyFromFile: false,
  ignoreFromFile: false,
}

// check if the project root has a vue-mess-detector.config.json file and if yes, then read it
try {
  const configPath = path.join(projectRoot, 'vue-mess-detector.json')
  const fileConfig = JSON.parse(await fs.readFile(configPath, 'utf-8'))
  config = { ...config, ...fileConfig }

  // check if the file config has apply or ignore and set the corresponding flag to true
  conflictingFlags.applyFromFile = !!fileConfig.apply
  conflictingFlags.ignoreFromFile = !!fileConfig.ignore

  configOutput.push({ info: `👉 Using configuration from ${configPath}` })
}
catch {
  configOutput.push({ info: `👉 Using default configuration` })
}

// eslint-disable-next-line ts/no-unused-expressions, node/prefer-global/process
yargs(hideBin(process.argv))
  .command(
    'analyze [path]',
    'Analyze Vue files for code smells and best practices',
    yargs => yargs
      .config(config) // Use the config from the file if available
      .positional('path', {
        describe: 'path to the Vue files',
        default: config.path,
      })
      .option('apply', {
        alias: 'a',
        describe: `Comma-separated list of rulesets/rules to apply.`,
        choices: FLAT_RULESETS_RULES,
        coerce: coerceRules('apply'),
        group: 'Filter Rulesets/Rules:',
        default: config.apply,
      })
      .option('exclude', {
        alias: 'e',
        describe: 'Exclude files or directories from the analysis',
        default: config.exclude,
        group: 'Exclude files:',
      })
      .option('group', {
        alias: 'g',
        describe: 'Group results at the output',
        choices: GROUP_BY,
        coerce: value => validateOption<GroupBy>(value, 'groupBy'),
        default: config.group,
        group: 'Group Results:',
      })
      .option('level', {
        alias: 'l',
        describe: 'Output level',
        choices: OUTPUT_LEVELS,
        coerce: value => validateOption<OutputLevel>(value, 'outputLevel'),
        default: config.level,
        group: 'Output:',
      })
      .option('ignore', {
        alias: 'i',
        describe: `Comma-separated list of rulesets to ignore.`,
        coerce: coerceRules('ignore'),
        default: config.ignore,
        group: 'Filter Rulesets:',
      })
      .option('sort', {
        alias: 's',
        describe: 'Sort results at the output',
        choices: SORT_BY,
        coerce: value => validateOption<SortBy>(value, 'sortBy'),
        default: config.sort,
        group: 'Sort Results:',
      })
      .option('output', {
        describe: 'Output format',
        choices: OUTPUT_FORMATS,
        coerce: value => validateOption<OutputFormat>(value, 'outputFormat'),
        default: config.output,
        group: 'Output Format:',
      })
      .check(() => {
        // check if both apply and ignore are provided (from CLI or file)
        const hasApplyFlag = conflictingFlags.applyFromCLI || conflictingFlags.applyFromFile
        const hasIgnoreFlag = conflictingFlags.ignoreFromCLI || conflictingFlags.ignoreFromFile

        if (hasApplyFlag && hasIgnoreFlag) {
          console.error(`\n<bg_err>Cannot use both --ignore and --apply options together.</bg_err>\n`)
          // eslint-disable-next-line node/prefer-global/process
          process.exit(1)
        }

        return true
      }),
    (argv) => {
      analyze({
        dir: argv.path as string,
        apply: argv.apply as string[],
        ignore: argv.ignore as string[],
        exclude: argv.exclude,
        groupBy: argv.group,
        level: argv.level,
        sortBy: argv.sort,
      })
        .then((result) => {
          if (argv.output == 'text') {
            [...configOutput, ...result.output].forEach((line) => {
              console.log(tags2Ascee(line.info))
            })

            for (const group in result.reportOutput) {
              console.log(tags2Ascee(`\n- <text_info> ${group}</text_info>`))
              result.reportOutput[group].forEach((line) => {
                console.log(tags2Ascee(`   ${line.id}`))
                console.log(tags2Ascee(`   ${line.description}`))
                console.log(tags2Ascee(`   ${line.message}\n`))
              })
            }

            result.codeHealthOutput?.forEach((line) => {
              console.log(tags2Ascee(line.info))
            })
          }

          if (argv.output == 'table') {
            [...configOutput, ...result.output].forEach((line) => {
              console.log(tags2Ascee(line.info))
            })

            for (const group in result.reportOutput) {
              const table = new Table({
                head: ['id', 'message'],
                colWidths: [60, 60],
                wordWrap: true,
                wrapOnWordBoundary: false,
              })

              console.log('-'.repeat(120))
              if (argv.group == 'rule') {
                console.log(tags2Ascee(`<text_info>Rule: ${group}</text_info>`))
                console.log(tags2Ascee(`Description: ${result.reportOutput[group][0].description}`))
                result.reportOutput[group].forEach((line) => {
                  table.push([tags2Ascee(line.id), tags2Ascee(line.message)])
                })
              }
              if (argv.group == 'file') {
                console.log(tags2Ascee(`<text_info>File: ${group}</text_info>`))
                result.reportOutput[group].forEach((line) => {
                  table.push([`${tags2Ascee(line.id)}\n${tags2Ascee(line.description.replace('See: ', 'See:\n'))}`, tags2Ascee(line.message)])
                })
              }
              console.log(table.toString())
            }

            result.codeHealthOutput?.forEach((line) => {
              console.log(tags2Ascee(line.info))
            })
          }

          if (argv.output == 'json') {
            console.log(JSON.stringify(result, null, 2))
          }
        })
        .catch((error) => {
          console.error(tags2Ascee(`<bg_err>${error}</bg_err>`))
        })
    },
  )
  .version('version', 'Show version number', vmdPackageJson.version)
  .alias('version', 'v')
  .help()
  .argv
