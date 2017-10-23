import DS     from 'ember-data'

export function initialize() {
  DS.Store.reopen({
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
