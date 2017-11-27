[![Download count all time](https://img.shields.io/npm/dt/ember-graph-data.svg)](https://www.npmjs.com/package/ember-graph-data) [![npm version](https://img.shields.io/npm/v/ember-graph-data.svg)](https://www.npmjs.com/package/ember-graph-data) [![Ember Observer Score](http://emberobserver.com/badges/ember-graph-data.svg)](http://emberobserver.com/addons/ember-graph-data)
# ember-graph-data  

GraphQL & EmberData integration for ambitious apps!

## Installation

Ensure you have `ember-data`  installed:

```bash
ember install ember-data
```

And then:
```bash
ember install ember-graph-data
```
## Minimal setup

`app/adapters/application.js`
```js
import GraphAdapter from 'ember-graph-data/adapter'

export default GraphAdapter.extend({
  host:       'http://localhost:4000', // your API host
  namespace:  'api/v1/graph',          // your API namespace
})
```
`app/serializers/application.js`
```js
import GraphSerializer from 'ember-graph-data/serializer'

export default GraphSerializer.extend()
```

## Adapter
### headers support
`app/adapters/application.js`
```js
import GraphAdapter from 'ember-graph-data/adapter'
import {computed} from '@ember/object'
import {inject as service} from '@ember/service'

export default GraphAdapter.extend({
  session: service(),
  headers: computed('session.jwt', function() {
    return {
      // authorize reuests
      'Authorization': `Bearer ${this.get('session.jwt')}`,
      // maybe provide localized output?
      'Content-Language': 'pl'
      // etc
    }
  })
})
```

### handle error & handle response
`app/adapters/application.js`
```js
import GraphAdapter from 'ember-graph-data/adapter'
import {inject as service} from '@ember/service'

export default GraphAdapter.extend({
  eventBus: service(),

  handleGraphError(error, {query, variables}) {
    let errors = error.response.errors || []
    if (errors.every((err) => err.code !== 'unauthorized')) return error
    // example only. Do whatever you want :)
    this.get('eventBus').dispatch({type: 'UNAUTHORIZED'})
  }

  // Hook after successful request
  handleGraphResponse(response, {query, variables}) {
    return response
  },
}
```

### additional config
You can configure behaviour of graph adapter. Below options are defaults.
`app/adapters/application.js`
```js
import GraphAdapter from 'ember-graph-data/adapter'
export default GraphAdapter.extend({
  graphOptions: {
    /* appends __typename field to every object in query.
       This is used for model lookup.
    */
    addTypename: true,
  },
})
```
## Serializer
### custom modelName mapping
In case when `__typename` field from API does not directly reflect your DS model names, you can customize it in `modelNameFromGraphResponse`:
`app/serializers/application.js`
```js
import GraphSerializer from 'ember-graph-data/serializer'

export default GraphSerializer.extend({
  modelNameFromGraphResponse(response) {
    return response.__typename
  }
}
```

### custom modelName namespace separator
Proper handling namespaced DS models requires `__typename` to contain namespace separator. For instance, model `user/blog-post` will be looked-up correctly, for following `__typename` values:

* `user--blog-post`
* `User--BlogPost`
* `user--Blog-Post`
* `User--blogPost`
* `User--blog_Post`
* `user/blog-post`
* `user/blog_post`
* `User/BlogPost`

It is not adviced to apply such incoherency in a naming convetion, but still it will be handled. `ember-graph-data` accepts `--` and `/` defaultly as a namespace separator. You can adjust that to your needs like this:

`app/serializers/application.js`
```js
import GraphSerializer from 'ember-graph-data/serializer'

export default GraphSerializer.extend({
  modelNameNamespaceSeparator: '$$$'
}
```

And from now, `user$$$blog-post` and other variations will be recognized correctly.

## Automatic model lookup

`GraphSerializer` automatically lookups and instantiates models for you. This process relies on `__typename` field which is returned from GraphQL server in every object. Lets make some assumptions:

You have defined following models:

`app/models/user-role.js`
```js
import DS from 'ember-data'

const {
  Model,
  attr
} = DS

export default Model.extend({
  name: attr(),
  code: attr()
})
```

`app/models/user.js`
```js
import DS from 'ember-data'

const {
  Model,
  attr,
  belongsTo
} = DS

export default Model.extend({
  firstName:  attr(),
  lastName:   attr(),
  email:      attr(),
  role:       belongsTo('user-role', { async: false })
});
```

You have sent following query to the GraphQL server:

`app/graph/queries/users.graphql`
```graphql
query users {
  users {
    {
      id
      firstName
      lastName

      role {
        id
        name
        code
      }
    }
  }
}
```

In result of above actions, you will get an array of User models. You can also inspect those models in a `Data` tab of Ember inspector. Moreover, each User will have association `role` properly set. Simple, yet powerful.


## Usage

`app/routes/posts.js`
```js
import Route    from '@ember/routing/route'
import query    from 'my-app/gql/queries/posts'
import mutation from 'my-app/gql/queries/posts'

export default Route.extend({
  model(params) {
    let variables = { page: 1 }
    return this.store.graphQuery({query, variables})
  }

  actions: {
    createPost(variables) {
      return this.store.graphMutate({mutation, variables})
    }
  }
})
```
