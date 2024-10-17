import { kilncardanopool } from './pluginInfo/cardanoKilnPool'
import { coreumnative } from './pluginInfo/coreumNativeStaking'
import { kilnpool } from './pluginInfo/ethereumKilnPool'
import { glifpoolCalibration } from './pluginInfo/filecoinCalibrationGlifpool'
import { glifpool } from './pluginInfo/filecoinGlifpool'
import { tarotpool } from './pluginInfo/optimismTarotPool'

export const genericPlugins = [glifpool, glifpoolCalibration, tarotpool, coreumnative, kilnpool, kilncardanopool]
