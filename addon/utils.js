export const mapValues = (object, fun) => {
  let result = {}
  Object.keys(object).forEach(key => {
    result[key] = fun(object[key], key)
  })
  return result
}

export const objectFilter = (object, fun) => {
  let result = {}
  Object.keys(object).forEach(key => {
    let val = object[key]
    if(fun(val, key))
      result[key] = object[key]
  })
  return result
}

export const objectReject = (object, fun) => {
  return objectFilter(
    object,
    (val, key) => !fun(val, key)
  )
}

export const isObject = val => val instanceof Object && Object.keys(val).length > 0
