import DS from 'ember-data'

export function initialize() {
  DS.Store.reopen({
    graphQuery() {
      return this.adapterFor('application').query(...arguments)
    },

    graphMutate() {
      return this.adapterFor('application').mutate(...arguments)
    }
  })
}

export default {
  name: 'graph-data',
  initialize
};
