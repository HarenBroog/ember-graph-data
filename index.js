/* eslint-env node */
'use strict'

const Webpack = require('broccoli-webpack')
const PackOpts = (name, entry = name) => {
  return {
    entry: entry,
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
      'extract-files': {
        vendor: {
          include: ['dist/extract-files.js'],
          processTree(input) {
            return  new Webpack([input], PackOpts('extract-files', './extract-files/dist/extract-files.js'))
          }
        }
      },
      
      'graphql-tag': {
        vendor: {
          include: ['index.js'],
          processTree(input) {
            return  new Webpack([input], PackOpts('graphql-tag'))
          }
        }
      }
    }
  },

  included(app) {
    this._super.included.apply(this, arguments)
    app.import('vendor/extract-files.js', transformAMD('extract-files'))
    app.import('vendor/graphql-tag.js', transformAMD('graphql-tag'))
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
