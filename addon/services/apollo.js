import Ember from 'ember'
import ApolloClient, { createNetworkInterface } from 'apollo-client';

import NetworkInterface       from './apollo/network-interface'

const {
  A,
  copy,
  computed,
  isArray,
  isNone,
  isPresent,
  getOwner,
  merge,
  Object: EmberObject,
  RSVP,
  run,
  Service,
  setProperties,
  Test,
  testing,
  inject: { service }
} = Ember;

const { alias } = computed;

export default Service.extend({
  store:  service(),
  resultNormalizer: null,
  client: null,
  apiURL: alias('options.apiURL'),
  middlewares: [],
  // options are injected by an initializer and configured in your environment.js.
  options: { apiURL: null },

  addMiddleware(func) {
    this.get('middlewares').addObject(
      { applyMiddleware: func.bind(this) }
    )
  },

  modelMapping(name) {
    return null
  },

  init() {
    this._super(...arguments);

    const owner = getOwner(this);
    if (owner) {
      owner.registerOptionsForType('apollo', { instantiate: false });
    }
  },

  client:           computed('clientOptions', function() {
    return new ApolloClient(this.get('clientOptions'))
  }),

  networkInterface: computed('apiURL', function() {
    const networkInterface = new NetworkInterface(this.get('apiURL'))
    const middlewares = this.get('middlewares')

    if (isPresent(middlewares))  networkInterface.use(middlewares)
    return networkInterface
  }),

  clientOptions: computed('networkInterface', function() {
    const networkInterface = this.get('networkInterface')
    return { networkInterface }
  }),

  addMiddleware(fun) {
    this.get('middlewares').addObject({
      applyMiddleware: fun
    })
  },

  mutate(opts, resultKey) {
    return new RSVP.Promise((resolve, reject) => {
      this.get('client')
        .mutate(opts)
        .then(result => {
          let dataToSend = isNone(resultKey)
            ? result.data
            : result.data[resultKey];
          dataToSend = copy(dataToSend, true);
          return resolve(dataToSend);
        })
        .catch(error => {
          let errors;
          if (isPresent(error.networkError)) {
            error.networkError.code = 'network_error';
            errors = [error.networkError];
          } else if (isPresent(error.graphQLErrors)) {
            errors = error.graphQLErrors;
          }
          if (errors) {
            return reject({ errors });
          }
          throw error;
        });
    })
  },

  query(opts) {
    return new RSVP.Promise((resolve, reject) => {
      this.get('client')
        .query(opts)
        .then(response => {
          let data = this.get('store')
            .serializerFor('application')
            .normalize(null, response.data)
          return resolve(data)
        })
    })
  }
});
