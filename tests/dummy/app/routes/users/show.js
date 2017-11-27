import Route from '@ember/routing/route'
import query from 'dummy/graph/queries/user'

export default Route.extend({
  model({id}) {
    return this.store.graphQuery({query, variables: {id}})
  }
})
