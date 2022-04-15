// @flow

export type Imperative = (scope: any) => any
export type Executor = (imperative: Imperative) => any

export function makeBuilder(executor: Executor) {
  const imperatives: Imperative[] = []
  function build(imperative?: Imperative) {
    if (imperative != null) imperatives.push(imperative)
    return {
      build,
      run
    }
  }
  async function run() {
    let local = {}
    for (const imperative of imperatives) {
      const definitions = await executor(global => imperative({ ...global, ...local }))
      if (typeof definitions === 'object') local = { ...local, ...definitions }
    }
  }
  function inspect() {
    return imperatives.map(imperative => imperative.toString()).join('\n')
  }

  return {
    build,
    run,
    inspect
  }
}
