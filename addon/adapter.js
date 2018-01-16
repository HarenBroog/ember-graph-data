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

import Transport from './transport'

export default DS.RESTAdapter.extend({
  mergedProperties: ['graphOptions'],

  graphOptions: {
    addTypename: true,
  },

  request(opts) {
    let {query, variables} = opts
    let originalVariables = variables
    let operationName = this.graphHelper('operationName', query)
    
    query     = this.graphHelper('prepareQuery', query)
    variables = this.graphHelper('normalizeVariables', originalVariables, query)

    let data = {
      variables,
      query:          query.string,
    }
    if(operationName)
      data.operationName = operationName

    let mergedOpts = assign(
      {},
      opts,
      {variables, originalVariables}
    )

    return this.ajax(
      [this.get('host'), this.get('namespace')].join('/'),
      'POST',
      this.requestParams(data, mergedOpts)
    )
    .then(r => this.graphHelper('normalizeResponse', r))
    .then(r => this.handleGraphResponse(r, mergedOpts))
    .catch(e => this.handleGraphError(e, mergedOpts))
  },

  ajaxOptions() {
    let opts = this._super(...arguments)

    if(opts.body && opts.body instanceof FormData) {
      opts.processData = false
      opts.contentType = false
      opts.data = opts.body
    }

    return opts
  },

  requestParams(data, opts) {
    let transportType = null
    try {
      transportType = opts.options.transport
    } catch(e) {
      transportType = 'json'
    }
    return Transport[transportType](...arguments)
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
      try {
        return query.definitions[0].name.value
      } catch(e) {
        return null
      }
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
