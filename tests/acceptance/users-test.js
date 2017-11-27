import { describe, it, beforeEach, afterEach } from 'mocha'
import { expect } from 'chai'
import startApp from '../helpers/start-app'
import destroyApp from '../helpers/destroy-app'

describe('Acceptance | users', function() {
  let application

  beforeEach(function() {
    application = startApp()
    server.createList('user', 10)
  })

  afterEach(function() {
    destroyApp(application)
  })

  it('displays users list', function() {
    visit('/users')

    andThen(() => {
      expect(currentURL()).to.equal('/users')

      expect(find('ul')).to.ok
      expect(find('li').length).to.eq(10)
    })
  })

  it('adds new user', function() {
    visit('/users')
    andThen(() => {
      fillIn('input[name=id]', 314)
      fillIn('input[name=email]', 'madderdin@hez-hezron.com')
      fillIn('input[name=firstName]', 'Mordimer')

      click('button.add-user')
      andThen(() => {
        expect(currentURL()).to.equal('/users/314')
      })
    })
  })
})
