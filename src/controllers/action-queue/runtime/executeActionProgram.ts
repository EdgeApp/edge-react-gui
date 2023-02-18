import { ENV } from '../../../env'
import { logActivity } from '../../../util/logger'
import { effectCanBeATrigger, prepareNewPushEvents, uploadPushEvents } from '../push'
import { ActionEffect, ActionProgram, ActionProgramState, EffectCheckResult, ExecutionContext, ExecutionResults } from '../types'
import { checkEffectIsDone } from '../util/checkEffectIsDone'
import { dryrunActionProgram } from './dryrunActionProgram'

export const executeActionProgram = async (context: ExecutionContext, program: ActionProgram, state: ActionProgramState): Promise<ExecutionResults> => {
  const { effect } = state

  //
  // Dryrun Phase
  //

  if (ENV.ACTION_QUEUE?.enableDryrun && effect != null && (await effectCanBeATrigger(context, effect))) {
    try {
      logActivity(`Starting action program dry-run`, { programId: program.programId })

      const dryrunOutputs = await dryrunActionProgram(context, program, state, true)

      if (dryrunOutputs.length > 0) {
        // Convert each dryrun result into an array of push events for the push-server.
        const pushEventInfos = await prepareNewPushEvents(context, program, effect, dryrunOutputs)

        // Send PushEvents to the push server:
        const newPushEvents = pushEventInfos.map(({ newPushEvent }) => newPushEvent)
        await uploadPushEvents(context, { createEvents: newPushEvents })

        // Mutate the nextState accordingly; effect should be awaiting push events:
        const nextChildEffects = pushEventInfos.map(({ pushEventEffect }) => pushEventEffect)
        let nextEffect: ActionEffect
        if (effect.type === 'seq') {
          // Drop the last effect because it is to be replaced by the first push-event effect
          const prevOpIndex = effect.opIndex // Same opIndex because the first of nextChildEffects replaces the last or prevChildEffects
          const prevChildEffects = effect.childEffects.slice(0, -1) // Slice to drop the last of prevChildEffects
          nextEffect = {
            type: 'seq',
            opIndex: prevOpIndex,
            childEffects: [...prevChildEffects, ...nextChildEffects]
          }
        } else {
          if (nextChildEffects.length > 1) throw new Error('Unexpected push events length for non-seq/par program')
          nextEffect = nextChildEffects[0]
        }

        // Update the state for the next evaluation
        const nextState = { ...state, effect: nextEffect }

        logActivity(`Completed dry-run`, { programId: program.programId, pushEventInfos })

        // Exit early with dryrun results:
        return { nextState }
      }

      logActivity(`No results for dry-run`, { programId: program.programId })
    } catch (error: any) {
      // Silently fail dryrun
      console.error(error)
    }
  }

  //
  // Check Phase
  //

  if (!state.effective && effect != null) {
    let effectCheck: EffectCheckResult
    try {
      effectCheck = await context.checkActionEffect(effect)
    } catch (err: any) {
      console.warn(`Action effect check failed:\n\t${String(err)}`)
      console.error(err)
      // Increase retry delay (min 2 seconds and max 10 minutes)
      const lastDelay = state.nextExecutionTime - state.lastExecutionTime
      const delay = Math.min(Math.max(lastDelay * 1.2, 2000, 10 * 60 * 1000))
      // Shim an ineffective check result
      effectCheck = {
        delay,
        isEffective: false
      }
    }

    // Return the updated next state using the fields from effectCheck
    return {
      nextState: {
        ...state,
        ...(effectCheck.updatedEffect ? { effect: effectCheck.updatedEffect } : {}),
        effective: effectCheck.isEffective,
        lastExecutionTime: Date.now(),
        nextExecutionTime: Date.now() + effectCheck.delay
      }
    }
  }

  //
  // Execution Phase
  //

  logActivity(`Executing next action`, { programId: program.programId, program, state })

  // Execute Action
  const executableAction = await context.evaluateAction(program, state)
  const output = await executableAction.execute()
  const { effect: nextEffect } = output
  const isEffectDone = checkEffectIsDone(nextEffect)

  // Update the state for the next evaluation
  const nextState = {
    ...state,
    effect: nextEffect,
    effective: isEffectDone,
    lastExecutionTime: Date.now(),
    nextExecutionTime: isEffectDone ? -1 : Date.now() // -1 means never
  }

  logActivity(`Execution results`, { programId: program.programId, nextState })

  // Return results
  return {
    nextState
  }
}
