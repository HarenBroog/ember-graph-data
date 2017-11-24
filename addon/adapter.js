import DS from 'ember-data'
import adapterFetchMixin      from 'ember-fetch/mixins/adapter-fetch'

export default DS.RESTAdapter.extend(adapterFetchMixin, {
  mergedProperties: ['graphOptions'],

  graphOptions: {
    unwrapSingleNode: true,
    addTypename: true,
  },

  ajax({query, variables}) {
    let body = JSON.stringify({
      query: this.graphHelper('prepareQuery', query),
      variables: variables ? variables : undefined,
    })

    return this._super(
      [this.get('host'), this.get('namespace')].join('/'),
      'POST',
      {body}
    )
    .then(r => this.graphHelper('unwrapSingleNode', r.data))
    .then(r => this.graphHelper('normalizeResponse', r))
    .catch(e => this.catchRequestError(e))
  },

  mutate(opts) {
    let query  = opts.mutation
    let variables = opts.variables.getProperties(this.graphHelper('mutationVariables', query))

    return this.ajax({query, variables})
  },

  query(opts) {
    return this.ajax(opts)
  },

  catchRequestError(error) {
    return error
  },

  graphHelper(name, ...args) {
    return this.graphHelpers[name].call(this, ...args)
  },

  graphHelpers: {
    prepareQuery(query) {
      let queryString = query.string
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
      return this.get('store').serializerFor('application').normalize(null, response)
    }
  }
})
