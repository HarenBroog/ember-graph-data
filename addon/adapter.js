import DS                 from 'ember-data'

import {
  get, getProperties
} from '@ember/object'

import {
  isBlank
} from '@ember/utils'

import {
  objectReject
} from './utils'

import {
  assign
} from '@ember/polyfills'

export default DS.RESTAdapter.extend({
  mergedProperties: ['graphOptions'],

  graphOptions: {
    addTypename: true,
  },

  request(opts) {
    let {query, variables} = opts
    let originalVariables = variables
    query     = this.graphHelper('prepareQuery', query)
    variables = this.graphHelper('normalizeVariables', originalVariables, query)

    let data = {
      variables,
      query:          query.string,
      operationName:  this.graphHelper('operationName', query)
    }

    let mergedOpts = assign(
      {},
      opts,
      {variables, originalVariables}
    )

    return this.ajax(
      [this.get('host'), this.get('namespace')].join('/'),
      'POST',
      {data, query}
    )
    .then(r => this.graphHelper('normalizeResponse', r))
    .then(r => this.handleGraphResponse(r, mergedOpts))
    .catch(e => this.handleGraphError(e, mergedOpts))
  },

  //ember-cached-shoe-override
  paramsToTokenize(url, type, options) {
    return [url, type, {data: options.query.definitions}]
  },

  mutate(opts) {
    let query  = opts.mutation
    let variables = opts.variables

    return this.request(
      assign({}, opts, {query, variables})
    )
  },

  query(opts) {
    return this.request(opts)
  },

  handleGraphResponse(response) {
    return response
  },

  handleGraphError(error) {
    return error
  },

  graphHelper(name, ...args) {
    return this.graphHelpers[name].call(this, ...args)
  },

  graphHelpers: {
    operationName(query) {
      return query.definitions[0].name.value
    },

    prepareQuery(query) {
      if(this.get('graphOptions.addTypename')) query.string = query.string.replace(/}/g, `  __typename\n}`)
      return query
    },

    allowedVariables(query) {
      return query
        .definitions
        .map(
          def => (def.variableDefinitions || []).map(x => get(x, 'variable.name.value'))
        )
        .reduce((vars, acc) => acc.concat(vars), [])
    },

    normalizeVariables(variables, query) {
      if(!variables) return {}
      let allowedVariables = this.graphHelper('allowedVariables', query)
      
      return objectReject(
        getProperties(variables, allowedVariables),
        isBlank
      )
    },

    normalizeResponse(response) {
      if(response.errors) {
        throw new DS.AdapterError(response.errors)
      } else {
        return this.get('store').serializerFor('application').normalize(response.data)
      }
    }
  }
})
