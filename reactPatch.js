import { hook, wrap } from 'cavy'
import React from 'react'

require('./reactPatcher/index').Cavify(React, {
  // exclude: [
  //   'LayoutContext',
  //   'NavigationContainer',
  //   'Router',
  //   'App',
  //   'AppContainer',
  //   'LogBoxStateSubscription',
  //   'EdgeCoreManager',
  //   'ErrorBoundary',
  //   'GestureHandlerRootView',
  //   'ThemeProvider',
  //   'StatusBarManagerComponent',
  //   'MakeEdgeContext',
  //   'EdgeCoreBridge',
  //   'Services',
  //   'Provider',
  //   'LoginUiProvider',
  //   'MenuProvider',
  //   'Airship',
  //   'Main',
  //   'AutoLogout',
  //   'ContactsLoader',
  //   'DeepLinkingManager',
  //   'AccountCallbackManager',
  //   'SortedWalletList',
  //   'EdgeContextCallbackManager',
  //   'PermissionsManager',
  //   'NetworkActivity',
  //   'PasswordReminderService',
  //   'WalletLifecycle'
  // ],

  // filters: [/[(,)]/, /withTheme/, /^Connect/],

  functionalHOC: wrap,
  classHOC: hook,
  include: ['SideMenuButton', 'ModalCloseArrow', 'MenuTabComponent']
})
