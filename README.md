# ember-graph-data

GraphQL & EmberData integration for ambitious apps!

WIP

## Installation

Ensure you have `ember-data` and `ember-fetch` installed:

```bash
ember install ember-data ember-fetch
```

And then:
```bash
ember install ember-graph-data
```
## Configuration
### minimal config
`app/adapters/application.js`
```js
import Ember  from 'ember'
import GraphAdapter from 'ember-graph-data/adapter'

const {
  computed
} = Ember

export default GraphAdapter.extend({
  host:       'http://localhost:4000', // your API host
  namespace:  'api/v1/graphq',         //your API namespace
})
```
`app/serializers/application.js`
```js
import Ember from 'ember'
import GraphSerializer from 'ember-graph-data/serializer'

export default GraphSerializer.extend()
```

### middle & after wares

`app/adapters/application.js`
```js
export default GraphAdapter.extend({
  // ...
  middlewares: computed(function() {
    return [this.authorize]
  }),

  afterwares: computed(function() {
    return [this.checkUnauthorized]
  }),

  // Example: authorizing request with token
  authorize(request, next) {
    if (!request.options.headers) request.options.headers = {}
    request.options.headers["Authorization"] = 'my_secret_token'
    next()
  },

  // Example: checking unauthorized response and signing out
  checkUnauthorized(response, next) {
    let errors = response.graphQLErrors || []

    if (errors.every((err) => err.code !== "unauthorized")) {
      next()
    } else {
      this.logout() // your logout action
    }
  }
})
```

## Usage

`app/routes/posts.js`
```js
import Ember from 'ember'
import query from 'my-app/gql/queries/posts'

export default Ember.Route.extend({
  model(params) {
    let variables = { page: 1 }
    return this.store.query({query, variables})
  }
})
```
