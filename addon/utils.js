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
export const isObject = val => typeof val === 'object' && val !== null

export const extractFiles = (tree, treePath = '') => {
  const files = []

  const recurse = (node, nodePath) => {
    // Iterate enumerable properties of the node
    Object.keys(node).forEach(key => {
      // Skip non-object
      if (!isObject(node[key])) return

      const path = `${nodePath}${key}`

      if (
        // Node is a File
        (typeof File !== 'undefined' && node[key] instanceof File)
      ) {
        // Extract the file and it's object tree path
        files.push({ path, file: node[key] })

        // Delete the file. Array items must be deleted without reindexing to
        // allow repopulation in a reverse operation.
        delete node[key]

        // No further checks or recursion
        return
      }

      if (typeof FileList !== 'undefined' && node[key] instanceof FileList)
        // Convert read-only FileList to an array for manipulation
        node[key] = Array.from(node[key])

      // Recurse into child node
      recurse(node[key], `${path}.`)
    })
  }

  if (isObject(tree))
    // Recurse object tree
    recurse(
      tree,
      // If a tree path was provided, append a dot
      treePath === '' ? treePath : `${treePath}.`
    )

  return files
}
