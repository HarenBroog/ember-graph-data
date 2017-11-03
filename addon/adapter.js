import DS from 'ember-data'
import Ember from 'ember'
import ApolloClient, { createNetworkInterface } from 'apollo-client'
import NetworkInterface from './apollo-client/network-interface'

const {
  isArray,
  isNone,
  isPresent,

  get,
  computed,
  RSVP
} = Ember

export default DS.RESTAdapter.extend({
  middlewares: [],
  afterwares: [],

  apolloClient: computed('apolloClientOptions', function() {
    return new ApolloClient(this.get('apolloClientOptions'))
  }),

  apolloClientOptions: computed('apolloNetworkInterface', function() {
    return {
      networkInterface: this.get('apolloNetworkInterface')
    }
  }),

  apolloNetworkInterface: computed('host', 'namespace', 'middlewares.[]', 'afterwares.[]', function() {
    const networkInterface = new NetworkInterface(this.buildURL())
    const middlewares = this.get('middlewares').map(fun => (
      { applyMiddleware: fun.bind(this) }
    ))
    const afterwares  = this.get('afterwares').map(fun => (
      { applyAfterware: fun.bind(this) }
    ))

    networkInterface.use(middlewares)
    networkInterface.useAfter(afterwares)
    return networkInterface
  }),

  mutate(opts) {
    let mutation  = opts.mutation
    let variables = opts.variables.getProperties(this._mutationVariables(mutation))

    return new RSVP.Promise((resolve, reject) => {
      this.get('apolloClient')
        .mutate({mutation, variables})
        .then(response => {
          let data = this.get('store')
            .serializerFor('application')
            .normalize(null, response.data)
          return resolve(data)
        })
        .catch(error => this.catchRequestError(error, reject))
    })
  },

  query(opts) {
    return new RSVP.Promise((resolve, reject) => {
      this.get('apolloClient')
        .query(opts)
        .then(response => {
          let data = this.get('store')
            .serializerFor('application')
            .normalize(null, response.data)
          return resolve(data)
        })
        .catch(error => this.catchRequestError(error, reject))
    })
  },

  catchRequestError(error) {
    return error
  },

  _mutationVariables(mutation) {
    return mutation.definitions[0].variableDefinitions.mapBy('variable.name.value')
  }
})
