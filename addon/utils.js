export const mapValues = (object, fun) => {
  let result = {}
  Object.keys(object).forEach(key => {
    result[key] = fun(object[key], key)
  })
  return result
}

export const isObject = val => val instanceof Object && Object.keys(val).length > 0
