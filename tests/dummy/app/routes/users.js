import Route    from '@ember/routing/route'
import query    from 'dummy/graph/queries/users'

export default Route.extend({
  model() {
    let variables =  {page: 1, size: 10}
    return this.store.graphQuery({query, variables})
  }
})
