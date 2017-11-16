import DS from 'ember-data'
import { GraphQLClient} from 'graphql-request'
import {computed} from '@ember/object'
import {Promise} from 'rsvp'

export default DS.RESTAdapter.extend({
  mergedProperties: ['graphOptions'],

  graphOptions: {
    unwrapSingleNode: true,
    addTypename: true,
  },

  graphClient: computed('host', 'namespace', 'headers', function() {
    let headers = this.get('headers')
    return new GraphQLClient(
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
        e => this.catchRequestError(e)
      )
  },

  mutate(opts) {
    let query  = opts.mutation
    let variables = opts.variables.getProperties(this.graphHelper('mutationVariables', query))

    return new Promise((resolve, reject) => {
      this
        .ajax({query, variables})
        .then(response => {
          let data = this.get('store')
            .serializerFor('application')
            .normalize(null, response)
          return resolve(data)
        })
        .catch(error => this.catchRequestError(error, reject))
    })
  },

  query(opts) {
    return new Promise((resolve, reject) => {
      this
        .ajax(opts)
        .then(response => {
          let data = this.get('store')
            .serializerFor('application')
            .normalize(null, response)
          return resolve(data)
        })
        .catch(error => this.catchRequestError(error, reject))
    })
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
    }
  }
})
