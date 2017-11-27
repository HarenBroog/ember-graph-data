import { expect } from 'chai'
import { describe, context, it, beforeEach, afterEach } from 'mocha'
import { setupTest } from 'ember-mocha'
import { startMirage } from 'dummy/initializers/ember-cli-mirage'

import ApplicationSerializer    from 'dummy/serializers/application'
import mutation      from 'dummy/graph/mutations/user-create'
import gql      from 'graphql-tag'

const multipleDefinitionsQuery = gql`
query users($firstName: String!) {
  users(firstName: $firstName) {
    id
  }
}

query friends($lastName: String!) {
  friends(lastName: $lastName) {
    id
  }
}
`
describe('Unit | Adapter | application', function() {
  setupTest('adapter:application', {
  })
  let adapter

  beforeEach(function() {
    this.server = startMirage()
    this.subject({
      store: {
        serializerFor() {
          return ApplicationSerializer.create()
        }
      }
    })
    adapter = this.subject()
  })

  afterEach(function() {
    this.server.shutdown()
  })

  describe('#query', function() {
    it('exists', function() {
      expect(this.subject().query).to.be.ok
    })
  })

  describe('#mutate', function() {
    it('exists', function() {
      expect(this.subject().mutate).to.be.ok
    })
  })

  describe('#request', function() {
    it('returns response', function() {
      let variables = {email: 'madderdin@hez-hezron.com', firstName: 'M'}
      this.subject().mutate({mutation, variables}).then(
        ({userCreate}) => {
          let result = userCreate
          expect(result).to.be.an('object')
          expect(result.email).to.be.eq('madderdin@hez-hezron.com')
          expect(result.firstName).to.be.eq('M')
        }
      )
    })
  })

  describe('graphHelpers', function() {
    let variables,
        _subject,
        testQuery

    beforeEach(function() {
      testQuery = mutation
    })

    describe('#normalizeVariables', function() {
      beforeEach(function() {
        variables = {
          notAllowedVar: 1,
          email: undefined,
          firstName: 'Mordimer',
          lastName:  'Madderdin'
        }

        _subject  = () => adapter.graphHelper('normalizeVariables', variables, testQuery)
      })

      it('filters not allowed variables', function() {
        expect(_subject()).not.to.have.key('notAllowedVar')
      })

      it('filters undefined variables', function() {
        expect(_subject()).not.to.have.key('email')

        adapter.mutate({mutation, variables})
      })

      it('passes allowed variables', function() {
        expect(_subject()).to.have.key('firstName')
        expect(_subject().firstName).to.eq(variables.firstName)

        adapter.mutate({mutation, variables})
      })

      context('query with multiple definitions', function() {
        beforeEach(function() {
          testQuery = multipleDefinitionsQuery
        })

        it('passes allowed variables', function() {
          expect(_subject()).to.have.keys('firstName', 'lastName')
        })
      })
    })

    describe('#prepareQuery', function() {
      beforeEach(function() {
        testQuery = {
          string: `query users {
            users {
              id
            }
          }`
        }
        _subject  = () => adapter.graphHelper('prepareQuery', testQuery).string
      })

      it('appends __typename on all levels', function() {
        let occurences = _subject().match(/__typename/g || []).length
        expect(occurences).to.eq(2)
      })

      context('graphOptions.addTypename disabled', function() {
        beforeEach(function() {
          adapter.graphOptions.addTypename = false
        })

        it('does not append any __typename', function() {
          expect(_subject()).not.to.contains('__typename')
        })
      })
    })
  })
})
