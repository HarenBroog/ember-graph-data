export default function (object, fun) {
  let result = {}
  Object.keys(object).forEach(key => {
    result[key] = fun(object[key], key)
  })
  return result
}
