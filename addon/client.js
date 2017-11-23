import {GraphQLClient, ClientError} from 'graphql-request'
import {join}          from '@ember/runloop'
import fetch           from 'fetch'

class Client extends GraphQLClient {
  getResult(response) {
    let contentType = response.headers.get('Content-Type')
    if (contentType && contentType.startsWith('application/json'))
      return response.json()
    return response.text()
  }

  request(query, variables) {
    let body = JSON.stringify({
      query,
      variables: variables ? variables : undefined,
    })

    return fetch(this.url, {
      method: 'POST',
      ...this.options,
      headers: Object.assign({'Content-Type': 'application/json'}, this.options.headers),
      body
    }).then((response) => {
      return join(() => this.getResult(response).then(
      (result) => {
        return join(() => {
          if (response.ok && !result.errors && result.data)
          return result.data
          let errorResult = typeof result === 'string' ? {error: result} : result
          throw new ClientError({ ...errorResult, status: response.status}, {query, variables})
        })
      }))
    })
  }
}

export { Client as default }
