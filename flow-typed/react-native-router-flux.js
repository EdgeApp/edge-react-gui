// @flow

declare module 'react-native-router-flux' {
  declare type FluxRouterProps = {}
  declare class Drawer extends React.Component<FluxRouterProps> {}
  declare class Router extends React.Component<FluxRouterProps> {}
  declare class Scene extends React.Component<FluxRouterProps> {}
  declare class Stack extends React.Component<FluxRouterProps> {}
  declare class Tabs extends React.Component<FluxRouterProps> {}

  // See ../src/types/routerTypes.js for wrapped versions of:
  // Actions

  declare type DontUse = {
    useTheEdgeWrapperInstead: true
  }

  declare var Actions: DontUse
}
