// @flow

import { makeStakePlugin } from '../plugins/stake-plugins'

// TODO: Get the plugin instance from the core context when the plugin is loaded into the core
export const stakePlugin = makeStakePlugin()
