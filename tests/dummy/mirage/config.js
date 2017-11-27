const mockData = {
  users({schema}) {
    return {
      users: schema.users.all().models
    }
  },

  userCreate({schema, variables}) {
    return {
      userCreate: schema.users.create(variables)
    }
  }
}

export default function() {
  this.urlPrefix = 'http://localhost:4000';

  this.post('graph',  (schema, {requestBody}) => {
    let query = JSON.parse(requestBody)
    let variables = query.variables

    let operationResolver = mockData[query.operationName]
    let responseBody = operationResolver ? operationResolver({schema, variables}) : {}

    return {data: responseBody}
  })
}
