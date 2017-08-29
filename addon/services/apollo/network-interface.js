import { extractFiles } from 'extract-files'
import fetch from 'fetch'

import ApolloClient, {
  HTTPFetchNetworkInterface,
  printAST
} from 'apollo-client'

export default class MyNetworkInterface extends HTTPFetchNetworkInterface {
  fetchFromRemoteEndpoint({ request, options }) {
    // Continue if uploads are possible
    if (typeof FormData !== 'undefined') {
      // Extract any files from the request variables

      const files = extractFiles(request.variables, 'variables')

      // Continue if there are files to upload
      if (files.length) {
        // Convert query AST to string for transport
        request.query = printAST(request.query)

        // Construct a multipart form
        const formData = new FormData()
        // formData.append('operations', JSON.stringify(request))
        formData.append('query', request.query)
        formData.append('operationName', request.operationName)
        files.forEach(({ path, file }) => {
          formData.append(path, file)
          request.variables[path.replace("variables.", "")] = path
        })
        formData.append('variables', JSON.stringify(request.variables))

        // Send request
        return fetch(this._uri, {
          method: 'POST',
          body: formData,
          ...options
        })
      }
    }
    // Standard fetch method fallback
    return super.fetchFromRemoteEndpoint({ request, options })
  }
}
