import { CycliRecipe, CycliToolbox, ProjectContext } from '../types'
import { join } from 'path'

const FLAG = 'ts'

const execute = async (
  toolbox: CycliToolbox,
  context: ProjectContext
): Promise<void> => {
  toolbox.interactive.vspace()
  toolbox.interactive.sectionHeader('Generating Typescript check workflow')

  await toolbox.dependencies.addDev('typescript', context)

  await toolbox.scripts.add('ts:check', 'tsc -p . --noEmit')

  await toolbox.workflows.generate(
    join('typescript', 'typescript.ejf'),
    context
  )

  if (!toolbox.filesystem.exists('tsconfig.json')) {
    await toolbox.template.generate({
      template: join('typescript', 'tsconfig.json.ejs'),
      target: 'tsconfig.json',
    })

    toolbox.interactive.step(
      'Created tsconfig.json with default configuration.'
    )
  }

  toolbox.interactive.success('Created Typescript check workflow.')
}

export const recipe: CycliRecipe = {
  meta: {
    name: 'TS check',
    flag: FLAG,
    description: 'Generate Typescript check workflow to run on every PR',
    selectHint: 'run typescript check to find compilation errors',
  },
  execute,
}

export default recipe
