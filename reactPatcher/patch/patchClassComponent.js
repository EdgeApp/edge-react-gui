// @flow
import { type ReactStore } from '../types.js'

export default (ClassComponent: any, displayName: string, reactStore: ReactStore) => {
  class PatchedClassComponent extends ClassComponent {
    constructor(props, context) {
      super(props, context)

      const origRender = super.render ?? this.render

      // this probably means that render is an arrow function or this.render.bind(this) was called on the original class
      const renderIsABindedFunction = origRender !== ClassComponent.prototype.render
      if (renderIsABindedFunction) {
        // $FlowFixMe
        this.render = () => {
          PatchedClassComponent.prototype.render.apply(this)
          return origRender()
        }
      }
    }

    render() {
      return super.render ? super.render() : null
    }
  }
  PatchedClassComponent.displayName = displayName
  return reactStore.settings.classHOC(PatchedClassComponent)
}
