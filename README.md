# ember-graph-data

GraphQL & EmberData integration for ambitious apps!

WIP

## Usage

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

`app/serializers/application.js`
```js
import Ember from 'ember'
import GraphSerializer from 'ember-graph-data/serializer'

export default GraphSerializer.extend()
```
