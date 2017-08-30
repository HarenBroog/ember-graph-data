import config from '../config/environment';

export function initialize() {
  const application = arguments[1] || arguments[0];
  const { 'ember-graph-data': options } = config;

  application.register('config:ember-graph-data', options, { instantiate: false });
  let store = application.__container__.lookup('service:store')

  store.reopen({
    query() {
      return this.adapterFor('application').query(...arguments)
    },

    mutate() {
      return this.adapterFor('application').mutate(...arguments)
    }
  })
}

export default {
  name: 'graph-data',
  initialize
};
