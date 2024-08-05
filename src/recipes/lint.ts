import { Toolbox } from 'gluegun/build/types/domain/toolbox'
import { CycliRecipe, ProjectContext } from '../types'
import { join } from 'path'
import { FLAG as PRETTIER_FLAG } from './prettier'

const FLAG = 'lint'

const ESLINT_CONFIGURATION_FILES = [
  '.eslintrc.js',
  '.eslintrc.json',
  'eslint.config.js',
  'eslint.config.mjs',
  'eslint.config.cjs',
]

const existsEslintConfigurationFile = (toolbox: Toolbox): boolean =>
  toolbox.filesystem
    .list()
    .filter((f) => ESLINT_CONFIGURATION_FILES.includes(f)).length > 0

const execute = () => async (toolbox: Toolbox, context: ProjectContext) => {
  // eslint@9.x introduces new configuration format that is not supported by widely used plugins yet.
  // https://eslint.org/docs/latest/use/migrate-to-9.0.0
  await toolbox.dependencies.add('eslint@^8', context.packageManager, true)

  const withPrettier =
    context.selectedOptions.includes(PRETTIER_FLAG) ||
    toolbox.dependencies.existsDev('prettier') ||
    toolbox.dependencies.exists('prettier')

  if (withPrettier) {
    await toolbox.dependencies.add(
      'eslint-plugin-prettier',
      context.packageManager,
      true
    )

    await toolbox.dependencies.add(
      'eslint-config-prettier',
      context.packageManager,
      true
    )
  }

  await toolbox.scripts.add('lint', 'eslint "**/*.{js,jsx,ts,tsx}"')

  if (!existsEslintConfigurationFile(toolbox)) {
    await toolbox.template.generate({
      template: join('lint', '.eslintrc.json.ejs'),
      target: '.eslintrc.json',
      props: {
        withPrettier,
      },
    })

    toolbox.interactive.step(
      'Created .eslintrc.json with default configuration.'
    )
  }

  await toolbox.workflows.generate(
    join('lint', 'lint.ejf'),
    context.path.absFromRepoRoot('.github', 'workflows', 'lint.yml'),
    context
  )

  toolbox.interactive.step('Created ESLint workflow.')

  return `--${FLAG}`
}

const run = async (
  toolbox: Toolbox,
  context: ProjectContext
): Promise<
  (toolbox: Toolbox, context: ProjectContext) => Promise<string> | null
> => {
  if (toolbox.skipInteractiveForRecipe(FLAG)) {
    context.selectedOptions.push(FLAG)
    return execute()
  }

  if (toolbox.skipInteractive()) {
    return null
  }

  const proceed = await toolbox.interactive.confirm(
    'Do you want to run ESLint on your project on every PR?'
  )

  if (!proceed) {
    return
  }

  context.selectedOptions.push(FLAG)
  return execute()
}

export const recipe: CycliRecipe = {
  meta: {
    flag: FLAG,
    description: 'Generate ESLint workflow to run on every PR',
  },
  run,
}

export default recipe
