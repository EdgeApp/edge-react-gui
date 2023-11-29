export type Imperative = (scope: any) => any
export type Executor = (imperative: Imperative) => any

export interface Builder {
  build: (imperative?: Imperative) => Builder
  run: () => Promise<void>
  inspect: () => string
}

export function makeBuilder(executor: Executor): Builder {
  const imperatives: Imperative[] = []
  function build(imperative?: Imperative): Builder {
    if (imperative != null) imperatives.push(imperative)
    return {
      build,
      inspect,
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
    inspect,
    run
  }
}
