import {extractFiles} from './utils'

export const transportJson = function(params) {
  return {data: params}
}

export const transportMultipart = function(params) {
  if (typeof FormData === 'undefined')
    return transportJson(...arguments)
  let variables = params.variables
  let files = extractFiles(variables)
  let formData = new FormData()
  
  formData.append('query', params.query)
  if(params.operationName)
    formData.append('operationName', params.operationName)
  files.forEach(({ path, file }) => {
    let fullPath = `variables.${path}`
    formData.append(fullPath, file)
    variables[path] = fullPath
  })
  formData.append('variables', JSON.stringify(variables))
  return {body: formData}
}

export default {
  json:       transportJson,
  multipart:  transportMultipart
}
