import {extractFiles} from 'extract-files'

export const transportJson = function(params, opts) {
  return {data: params}
}

export const transportMultipart = function(params, opts) {
  if (typeof FormData === 'undefined')
    return transportJson(...arguments)
  let variables = params.variables
  let files = extractFiles(variables)
  let formData = new FormData()
  
  formData.append('query', params.query)
  formData.append('operationName', params.operationName)
  files.forEach(({ path, file }, i) => {
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
