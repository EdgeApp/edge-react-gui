/* eslint-disable flowtype/require-valid-file-annotation */

const { exec } = require('child_process')
const path = require('path')

const webpack = require('webpack')

// Run `yarn start.plugins` to enable debug mode.
// This mode will serve the plugin bundle via a local dev-server.
const debug = process.env.WEBPACK_SERVE

// Try exposing our socket to adb (errors are fine):
if (process.env.WEBPACK_SERVE) {
  console.log('adb reverse tcp:8101 tcp:8101')
  exec('adb reverse tcp:8101 tcp:8101', () => {})
}

module.exports = {
  devtool: debug ? 'source-map' : undefined,
  devServer: {
    allowedHosts: 'all',
    hot: false,
    static: false,
    port: 8101
  },
  entry: './src/util/corePluginBundle.js',
  mode: debug ? 'development' : 'production',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(@babel\/runtime|babel-runtime)/,
        use: debug
          ? {
              loader: '@sucrase/webpack-loader',
              options: { transforms: [] }
            }
          : {
              loader: 'babel-loader',
              options: {
                babelrc: false,
                presets: ['@babel/preset-env'],
                plugins: [
                  ['@babel/plugin-transform-for-of', { assumeArray: true }],
                  // Work around metro-react-native-babel-preset issue:
                  ['@babel/plugin-proposal-class-properties', { loose: false }]
                ],
                cacheDirectory: true
              }
            }
      }
    ]
  },
  output: {
    filename: 'plugin-bundle.js',
    path: path.join(path.resolve(__dirname), 'android/app/src/main/assets/edge-core')
  },
  performance: { hints: false },
  plugins: [
    new webpack.IgnorePlugin({ resourceRegExp: /^(https-proxy-agent)$/ }),
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer']
    }),
    new webpack.ProvidePlugin({
      process: 'process/browser'
    })
  ],
  resolve: {
    aliasFields: ['browser'],
    fallback: {
      crypto: require.resolve('crypto-browserify'),
      assert: require.resolve('assert'),
      fs: false,
      http: require.resolve('stream-http'),
      https: require.resolve('https-browserify'),
      os: require.resolve('os-browserify/browser'),
      path: require.resolve('path-browserify'),
      stream: require.resolve('stream-browserify'),
      vm: require.resolve('vm-browserify')
    },
    mainFields: ['browser', 'module', 'main']
  }
}
