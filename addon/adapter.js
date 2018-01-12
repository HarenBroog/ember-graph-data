import DS                 from 'ember-data'
import adapterFetchMixin  from 'ember-fetch/mixins/adapter-fetch'

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

export default DS.RESTAdapter.extend(adapterFetchMixin, {
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
      {data}
    )
    .then(r => this.graphHelper('normalizeResponse', r))
    .then(r => this.handleGraphResponse(r, mergedOpts))
    .catch(e => this.handleGraphError(e, mergedOpts))
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
      let preparedQuery = assign({}, query)
      if(this.get('graphOptions.addTypename')) preparedQuery.string = preparedQuery.string.replace(/}/g, `  __typename\n}`)
      return preparedQuery
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
