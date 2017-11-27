import { expect } from 'chai'
import { describe, context, it, beforeEach, afterEach } from 'mocha'
import { setupTest } from 'ember-mocha'

import startApp from '../../helpers/start-app'
import destroyApp from '../../helpers/destroy-app'

describe('Unit | Serializer | application', function() {
  setupTest('serializer:application', {
  })

  beforeEach(function() {
    this.application = startApp()
    this.store = this.application.__container__.lookup('service:store', true)
    this.serializer = this.subject()
    this.serializer.set('store', this.store)
  })

  afterEach(function() {
    destroyApp(this.application)
  })

  describe('#normalize', function() {
    let payload, _subject
    beforeEach(function() {
      payload = {
        id: '1',
        email: 'madderdin@hez-hezron.com',
        __typename: 'user'
      }
      _subject = () => this.serializer.normalize(payload)
    })

    it('returns user model', function() {
      expect(_subject()._internalModel.modelName).to.eq('user')
    })

    it('assigns attributes', function() {
      expect(_subject().get('id')).to.eq(payload.id)
      expect(_subject().get('email')).to.eq(payload.email)
    })

    context('non existing model', function() {
      beforeEach(function() {
        payload = {
          id: '1',
          email: 'madderdin@hez-hezron.com',
          __typename: 'non-existing-user'
        }
      })

      it('returns POJO', function() {
        expect(_subject()).to.be.an('object')
      })
    })
  })
})
