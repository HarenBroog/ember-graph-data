import { Factory, faker } from 'ember-cli-mirage'

export default Factory.extend({
  firstName(i) {
    return `Person ${i}`
  },
  email() {
    return faker.internet.email()
  }
})
