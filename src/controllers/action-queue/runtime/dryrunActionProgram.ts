import { ActionEffect, ActionProgram, ActionProgramState, ExecutionContext, ExecutionOutput, PendingTxMap } from '../types'
import { checkEffectIsDone } from '../util/checkEffectIsDone'

export async function dryrunActionProgram(
  context: ExecutionContext,
  program: ActionProgram,
  state: ActionProgramState,
  shortCircuit: boolean
): Promise<ExecutionOutput[]> {
  const pendingTxMap: PendingTxMap = {}
  const outputs: ExecutionOutput[] = []
  const simulatedState = { ...state }
  while (true) {
    const executableAction = await context.evaluateAction(program, simulatedState)
    const dryrunOutput = await executableAction.dryrun(pendingTxMap)

    // In order to avoid infinite loops, we must break when we reach the end
    // of the program or detect that the last effect in sequence is null, which
    // means the last action is not "dry-runnable".

    // Exit if we detect a null at the top-level of the dryrunOutput because
    // this means we evaluated a single-action program which does not support
    // dryrun.
    if (dryrunOutput == null) break

    // Short-circuit if we detect any `null` effect in our dryrunOutput which
    // means some action in the execution path failed to dryrun.
    if (shortCircuit && checkEffectForNull(dryrunOutput.effect)) break

    // Add dryrunOutput to array
    outputs.push(dryrunOutput)
    // Update simulated state for next iteration
    simulatedState.effect = dryrunOutput.effect
    // Add all txs to pendingTxMap
    dryrunOutput.broadcastTxs.forEach(broadcastTx => {
      const walletId = broadcastTx.walletId
      pendingTxMap[walletId] = [...(pendingTxMap[walletId] ?? []), broadcastTx.tx]
    })

    // End of the program
    if (checkEffectIsDone(dryrunOutput.effect)) break
  }
  return outputs
}

function checkEffectForNull(effect: ActionEffect): boolean {
  if (effect.type === 'seq' || effect.type === 'par') return effect.childEffects.some(effect => effect === null || checkEffectForNull(effect))
  return false
}
