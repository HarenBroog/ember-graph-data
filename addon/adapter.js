import DS from 'ember-data'
import {computed} from '@ember/object'
import {join} from '@ember/runloop'
import Client from './client'

export default DS.RESTAdapter.extend({
  mergedProperties: ['graphOptions'],

  graphOptions: {
    unwrapSingleNode: true,
    addTypename: true,
  },

  graphClient: computed('host', 'namespace', 'headers', function() {
    let headers = this.get('headers')
    return new Client(
      [this.get('host'), this.get('namespace')].join('/'),
      {headers}
    )
  }),

  ajax({query, variables}) {
    return this
      .get('graphClient')
      .request(
        this.graphHelper('prepareQueryString', query.string),
        variables
      ).then(
        r => this.graphHelper('unwrapSingleNode', r)
      ).catch(
        e => this.graphHelper('catchRequestError', e)
      )
  },

  mutate(opts) {
    let query  = opts.mutation
    let variables = opts.variables.getProperties(this.graphHelper('mutationVariables', query))

    return this.ajax({query, variables})
      .then(r => this.graphHelper('normalizeResponse', r))
      .catch(e => this.graphHelper('catchRequestError', e))
  },

  query(opts) {
    return this.ajax(opts)
      .then(r => this.graphHelper('normalizeResponse', r))
      .catch(e => this.graphHelper('catchRequestError', e))
  },

  catchRequestError(error) {
    return error
  },

  graphHelper(name, ...args) {
    return this.graphHelpers[name].call(this, ...args)
  },

  graphHelpers: {
    prepareQueryString(queryString) {
      if(this.get('graphOptions.addTypename')) queryString = queryString.replace(/}/g, `  __typename\n}`)
      return queryString
    },

    unwrapSingleNode(response) {
      if (!this.get('graphOptions.unwrapSingleNode')) return response
      let keys = Object.keys(response).filter(k => k != '__typename')
      return keys.length == 1 ? response[keys[0]] : response
    },

    mutationVariables(mutation) {
      return mutation.definitions[0].variableDefinitions.mapBy('variable.name.value')
    },

    normalizeResponse(response) {
      return this
        .get('store')
        .serializerFor('application')
        .normalize(null, response)
    },
    catchRequestError(error) {
      return join(() => this.catchRequestError(error))
    }
  }
})
