/* eslint-disable flowtype/require-valid-file-annotation */

const path = require('path')

const webpack = require('webpack')

// Set this to false for easier debugging:
const production = true

module.exports = {
  devtool: 'cheap-source-map',
  entry: './src/util/corePluginBundle.js',
  mode: production ? 'production' : 'development',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(@babel\/runtime|babel-runtime)/,
        use: production
          ? {
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
          : { loader: '@sucrase/webpack-loader', options: { transforms: [] } }
      }
    ]
  },
  output: {
    filename: 'plugin-bundle.js',
    path: path.join(path.resolve(__dirname), 'android/app/src/main/assets/edge-core')
  },
  performance: { hints: false },
  node: { fs: 'empty' },
  plugins: [new webpack.IgnorePlugin(/^(https-proxy-agent)$/)],
  resolve: {
    aliasFields: ['browser'],
    mainFields: ['browser', 'module', 'main']
  }
}
