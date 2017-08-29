/* eslint-env node */
'use strict';

module.exports = {
  name: 'ember-graph-data',

  options: {
    babel: {
      plugins: ['transform-object-rest-spread']
    }
  },

  isDevelopingAddon: function() {
    return true
  },

  included() {
    this._super.included.apply(this, arguments);

    this.import('vendor/-apollo-client-bundle.js');
    this.import('vendor/-apollo-client-shims.js');
  },

  treeForVendor() {
    const WebpackDependencyPlugin = require('./lib/webpack-dependency-plugin');

    return new WebpackDependencyPlugin({
      outputName: 'apollo-client',
      expose: [
        'graphql',
        'graphql-tools',
        'graphql-tag',
        'apollo-client',
        'extract-files'
      ]
    });
  },

  setupPreprocessorRegistry(type, registry) {
    if (type === 'parent') {
      registry.add('js', {
        name: 'ember-graph-data',
        ext: 'graphql',
        toTree(tree) {
          const GraphQLFilter = require('./lib/graphql-filter');
          return new GraphQLFilter(tree);
        }
      });
    }
  }
};
