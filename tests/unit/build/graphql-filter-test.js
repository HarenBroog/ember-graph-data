import { expect } from 'chai'
import { describe, it, context, beforeEach } from 'mocha'
import gql from 'graphql-tag'
// import { setupTest } from 'ember-mocha'
import testFragment from './test-fragment'
import testQuery from './test-query'

const normalizeString = (str) => str.replace(/\s+/g, ' ').trim()
const compiledFragment = gql`
fragment testFragment on Object {
  name
}`
const compiledQuery = gql`
query TestQuery {
  subject {
    ...testFragment
  }
}

fragment testFragment on Object {
  name
}`

describe('Unit | Build | graphql-filter', function() {
  beforeEach(function() {
    this.query           = testFragment
    this.originalQuery   = compiledFragment
    this.originalString  = normalizeString(`fragment testFragment on Object {
      name
    }`)
  })

  it('compiles AST definitions', function() {
    expect(this.query.definitions).to.deep.equal(this.originalQuery.definitions)
  })

  it('compiles string value', function() {
    expect(normalizeString(this.query.string)).to.equal(this.originalString)
  })

  context('query with #import references', function() {
    beforeEach(function() {
      this.query           = testQuery
      this.originalQuery   = compiledQuery
      this.originalString  = normalizeString(`
        fragment testFragment on Object {
          name
        }

        query TestQuery {
          subject {
            ...testFragment
          }
        }`
      )
    })

    it('compiles AST definitions', function() {
      expect(normalizeString(this.query.string)).to.equal(this.originalString)
    })

    it('compiles string value', function() {
      expect(normalizeString(this.query.string)).to.equal(this.originalString)
    })
  })
})
