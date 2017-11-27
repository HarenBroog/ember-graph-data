import GraphAdapter from 'ember-graph-data/adapter'

export default GraphAdapter.extend({
  host:       'http://localhost:4000',
  namespace:  'graph',

  headers:     {
    'my-header':  'my-header'
  }
})
