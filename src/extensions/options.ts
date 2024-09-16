import { NON_INTERACTIVE_FLAG, PRESET_FLAG } from '../constants'
import { CycliToolbox } from '../types'

module.exports = (toolbox: CycliToolbox) => {
  const isPreset = () => Boolean(toolbox.parameters.options[PRESET_FLAG])

  const isRecipeSelected = (recipeFlag: string) =>
    Boolean(toolbox.parameters.options[PRESET_FLAG]) &&
    Boolean(toolbox.parameters.options[recipeFlag])

  const isNonInteractive = () =>
    Boolean(toolbox.parameters.options[NON_INTERACTIVE_FLAG])

  toolbox.options = {
    isPreset,
    isRecipeSelected,
    isNonInteractive,
  }
}

export interface OptionsExtension {
  options: {
    isPreset: () => boolean
    isRecipeSelected: (recipeFlag: string) => boolean
    isNonInteractive: () => boolean
  }
}
