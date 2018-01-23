import {
  get
} from '@ember/object'
import {
  dasherize
} from '@ember/string'

import { expect } from 'chai'
import { describe, context, it, beforeEach, afterEach } from 'mocha'
import { setupTest } from 'ember-mocha'

import startApp from '../../helpers/start-app'
import destroyApp from '../../helpers/destroy-app'

const isModel = (obj, name) => {
  if(name)
    return obj._internalModel.modelName == name
  return !!obj._internalModel
}

const behavesLikePOJO = function() {
  it('returns POJO', function() {
    expect(this._subject()).to.be.an('object')
    expect(isModel(this._subject())).not.to.be.ok
  })

  it('assigns all attributes', function() {
    expect(this._subject()).to.have.keys(Object.keys(this.payload()))
  })

  it('lookups models on nested levels', function() {
    let result = this._subject()
    let probablyUserRole =      get(result, 'role')
    let probablyUserBlogPosts = get(result, 'posts')

    expect(isModel(probablyUserRole, 'user/role')).to.be.ok
    expect(isModel(probablyUserBlogPosts.get('firstObject'), 'user/blog-post')).to.be.ok
  })
}

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
    beforeEach(function() {
      this.payload = function() {
        return {
          id: '1',
          email: 'madderdin@hez-hezron.com',
          nonModelAttribute: 'madderdin@hez-hezron.com',

          posts: [
            {id: '1', title: 'A', body: 'aaaa', __typename: 'user/blog-post' },
            {id: '2', title: 'B', body: 'bbbb', __typename: 'user/blog-post' }
          ],

          role: {
            id:         '1',
            name:       'inquisitor',
            __typename: 'user/role'
          },

          __typename: this.typename
        }}
      this._subject = function() { return this.serializer.normalize(this.payload()) }
    })

    context('model for __typename exists', function() {
      beforeEach(function() {
        this.typename = 'user'
      })

      it('returns DS.Model', function() {
        expect(this._subject()._internalModel.modelName).to.eq('user')
      })

      it('assigns DS.Model attributes', function() {
        expect(this._subject().get('id')).to.eq(this.payload().id)
        expect(this._subject().get('email')).to.eq(this.payload().email)
      })

      it('omits attributes not defined in DS.Model', function() {
        expect(this._subject().get('nonModelAttribute')).not.to.ok
      })

      it('serializes hasMany relationship', function() {
        let relationship = this._subject().get('posts').toArray()
        expect(relationship).to.be.an('array')
        expect(isModel(relationship[0], 'user/blog-post')).to.be.ok
      })

      it('serializes belongsTo relationship', function() {
        let relationship = this._subject().get('role.content')
        expect(isModel(relationship, 'user/role')).to.be.ok
      })
    })

    context('model for __typename does not exist', function() {
      beforeEach(function() {
        this.typename = 'non-existing-model'
      })

      behavesLikePOJO()
    })

    context('__typename missing', function() {
      beforeEach(function() {
        this.payload = function() {
          return {
            id: '1',
            email: 'madderdin@hez-hezron.com',
            nonModelAttribute: 'madderdin@hez-hezron.com',

            posts: [
              {id: '1', title: 'A', body: 'aaaa', __typename: 'user/blog-post' },
              {id: '2', title: 'B', body: 'bbbb', __typename: 'user/blog-post' }
            ],

            role: {
              id:         '1',
              name:       'inquisitor',
              __typename: 'user/role'
            }
          }
        }
      })

      behavesLikePOJO()
    })
  })

  describe('#extractModelClass', function() {
    beforeEach(function() {
      this._subject = function() { return this.serializer.extractModelClass(this.payload()) }
      this.payload = function() {
        return {
          __typename: this.typename
        }
      }
      this.typename = 'user/blog-post'
    }),

    it('calls #modelNameFromGraphResponse', function() {
      let called = false
      this.serializer.modelNameFromGraphResponse = function() {
        called = true
      }

      this._subject()
      expect(called).to.be.ok
    })

    it('returns DS.Model class', function() {
      expect(this._subject().modelName).to.eq(this.typename)
    })

    context('__typename in PascalCase', function() {
      beforeEach(function() {
        this.typename = 'AdminUser'
      })

      it('returns DS.Model class', function() {
        expect(this._subject().modelName).to.eq(dasherize(this.typename))
      })
    })

    context('__typename in camelCase', function() {
      beforeEach(function() {
        this.typename = 'adminUser'
      })

      it('returns DS.Model class', function() {
        expect(this._subject().modelName).to.eq(dasherize(this.typename))
      })
    })

    context('__typename dasherized with double dash', function() {
      beforeEach(function() {
        this.typename = 'user--blog-post'
      })

      it('returns DS.Model class', function() {
        expect(this._subject().modelName).to.eq('user/blog-post')
      })
    })

    context('__typename with custom namespace separator', function() {
      beforeEach(function() {
        this.typename = 'User$$$BlogPost'
        this.serializer.modelNameNamespaceSeparator = '$$$'
      })

      it('returns DS.Model class', function() {
        expect(this._subject().modelName).to.eq('user/blog-post')
      })
    })

    it('returns DS.Model class for some strange cases', function() {
      [
        `user--blog-post`,
        `User--BlogPost`,
        `user--Blog-Post`,
        `User--blogPost`,
        `User--blog_Post`,
        `user/blog-post`,
        `user/blog_post`,
        `User/BlogPost`,
      ].forEach((typename) => {
        this.typename = typename
        expect(this._subject().modelName).to.eq('user/blog-post')
      })
    })
  })
})
