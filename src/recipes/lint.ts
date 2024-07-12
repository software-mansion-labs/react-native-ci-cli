import { Toolbox } from 'gluegun/build/types/domain/toolbox'
import { ProjectContext } from '../types'
import { parse, stringify } from 'yaml'

const COMMAND = 'lint'

const execute = () => async (toolbox: Toolbox, context: ProjectContext) => {
  await toolbox.dependencies.add('eslint', context.packageManager, true)

  await toolbox.scripts.add('lint', 'eslint "**/*.{js,jsx,ts,tsx}"')

  const pathRelativeToRoot =
    '.' + context.packageRoot.slice(context.monorepoRoot?.length ?? 0)

  const workflowYml = parse(
    await toolbox.template.generate({
      template: 'lint.ejf',
      props: { ...context, pathRelativeToRoot },
    })
  )

  toolbox.filesystem.write(
    toolbox.filesystem.path(
      context.monorepoRoot ?? context.packageRoot,
      '.github',
      'workflows',
      'lint.yml'
    ),
    stringify(workflowYml)
  )

  toolbox.print.info('✔ Created ESLint workflow.')

  return `--${COMMAND}`
}

const run = async (
  toolbox: Toolbox
): Promise<
  (toolbox: Toolbox, context: ProjectContext) => Promise<string> | null
> => {
  if (toolbox.skipInteractiveForCommand(COMMAND)) {
    return execute()
  }

  const proceed = await toolbox.interactive.confirm(
    'Do you want to run ESLint on your project on every PR?'
  )

  if (!proceed) {
    return
  }

  return execute()
}

export default run
