import Controller from '@ember/controller'
import mutation from 'dummy/graph/mutations/user-create'

export default Controller.extend({
  actions: {
    userCreate() {
      let variables = this.getProperties('id', 'email', 'firstName')
      return this.store.graphMutate({mutation, variables}).then(
        ({userCreate}) => this.transitionToRoute('users.show', userCreate)
      )
    }
  }
})
