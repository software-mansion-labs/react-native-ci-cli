import { CycliRecipe, CycliToolbox, ProjectContext } from '../types'
import { createReleaseBuildWorkflowsForExpo } from './build-release'
import { join } from 'path'

const DETOX_EXPO_PLUGIN = '@config-plugins/detox'
const FLAG = 'detox'

const createDetoxWorkflowsForExpo = async (
  toolbox: CycliToolbox,
  context: ProjectContext
) => {
  toolbox.interactive.info('⚙️ Setting up app release build for Detox.')

  await createReleaseBuildWorkflowsForExpo(toolbox, context, ['android', 'ios'])

  await toolbox.dependencies.addDev('detox', context)
  // >=29 because of https://wix.github.io/Detox/docs/introduction/project-setup#step-1-bootstrap
  await toolbox.dependencies.addDev('jest', context, {
    version: '">=29"',
    skipInstalledCheck: true,
  })
  await toolbox.dependencies.addDev('ts-jest', context)
  await toolbox.dependencies.addDev('@types/jest', context)
  await toolbox.dependencies.addDev(DETOX_EXPO_PLUGIN, context)

  const currentExpoPlugins =
    toolbox.projectConfig.appJson()?.expo?.plugins || []

  if (!currentExpoPlugins.includes(DETOX_EXPO_PLUGIN)) {
    await toolbox.patching.update('app.json', (config) => {
      if (!config.expo.plugins) {
        config.expo.plugins = []
      }

      if (!config.expo.plugins.includes(DETOX_EXPO_PLUGIN)) {
        config.expo.plugins.push(DETOX_EXPO_PLUGIN)
      }

      return config
    })

    toolbox.interactive.step(`Added ${DETOX_EXPO_PLUGIN} plugin to app.json`)
  }

  await toolbox.scripts.add(
    'detox:test:android',
    'detox test --config-path .detoxrc-ci.js --configuration android.emu.release --cleanup'
  )

  await toolbox.scripts.add(
    'detox:test:ios',
    'detox test --config-path .detoxrc-ci.js --configuration ios.sim.release --cleanup'
  )

  await toolbox.template.generate({
    template: join('detox', '.detoxrc-ci.js.ejs'),
    target: `.detoxrc-ci.js`,
  })

  toolbox.interactive.step('Created .detoxrc-ci.js configuration file.')

  if (!toolbox.filesystem.exists('e2e')) {
    await toolbox.template.generate({
      template: join('detox', 'jest.config.js.ejs'),
      target: join('e2e', 'jest.config.js'),
    })

    await toolbox.template.generate({
      template: join('detox', 'starter.test.ts.ejs'),
      target: join('e2e', 'starter.test.ts'),
    })

    toolbox.interactive.step(
      'Initialized e2e/ directory with default detox jest configuration.'
    )

    toolbox.interactive.warning(
      'Consider adding "modulePathIgnorePatterns": ["e2e"] to your jest config.'
    )

    toolbox.interactive.warning(
      'Remember to edit example test in e2e/starter.test.ts to match your app.'
    )
  }

  await toolbox.workflows.generate(
    join('detox', 'test-detox-android.ejf'),
    context
  )

  await toolbox.workflows.generate(join('detox', 'test-detox-ios.ejf'), context)

  toolbox.interactive.step('Created Detox workflow for Expo.')

  toolbox.interactive.warning(
    [
      'Remember to create GH_TOKEN repository secret to make Detox workflow work. For more information check',
      'https://github.com/software-mansion-labs/react-native-ci-cli?tab=readme-ov-file#-repository-secrets',
    ].join(' ')
  )
}

const execute = async (
  toolbox: CycliToolbox,
  context: ProjectContext
): Promise<void> => {
  if (toolbox.projectConfig.appJson()?.expo) {
    await createDetoxWorkflowsForExpo(toolbox, context)
  } else {
    toolbox.interactive.error(
      'Detox workflows generation is currently not supported for non-expo projects. Skipping detox recipe.'
    )
  }
}

export const recipe: CycliRecipe = {
  meta: {
    name: 'Detox E2E tests',
    flag: FLAG,
    description: 'Generate workflow to run Detox e2e tests on every PR',
  },
  execute,
} as const

export default recipe
