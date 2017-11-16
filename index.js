/* eslint-env node */
'use strict'

const Webpack = require('broccoli-webpack')
const PackOpts = (name) => {
  return {
    entry: name,
    output: {
      filename: `${name}.js`,
      library: name,
      libraryTarget: 'umd'
    }
  }
}

const transformAMD = (name) => ({
  using: [{ transformation: 'amd', as: name }]
})

module.exports = {
  name: 'ember-graph-data',

  options: {
    nodeAssets: {
      'graphql-tag': {
        vendor: {
          include: ['index.js'],
          processTree(input) {
            return  new Webpack([input], PackOpts('graphql-tag'))
          }
        }
      },
      'graphql-request': {
        vendor: {
          srcDir:   'dist/src',
          include: ['index.js'],
          processTree(input) {
            return  new Webpack([input], PackOpts('graphql-request'))
          }
        }
      }
    }
  },

  isDevelopingAddon: function() {
    return true
  },

  included(app) {
    this._super.included.apply(this, arguments)
    app.import('vendor/graphql-tag.js', transformAMD('graphql-tag'))
    app.import('vendor/graphql-request.js', transformAMD('graphql-request'))
  },

  setupPreprocessorRegistry(type, registry) {
    if (type === 'parent') {
      registry.add('js', {
        name: 'ember-graph-data',
        ext: 'graphql',
        toTree(tree) {
          const GraphQLFilter = require('./lib/graphql-filter')
          return new GraphQLFilter(tree)
        }
      })
    }
  }
}
