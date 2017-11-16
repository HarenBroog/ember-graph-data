'use strict';

const Filter = require('broccoli-filter')
const gql = require('graphql-tag')

module.exports = class GraphQLFilter extends Filter {
  constructor(inputNode, options) {
    super(inputNode, options)
    this.extensions = ['graphql']
    this.targetExtension = 'js'
  }

  processString(source) {
    let output = [
      `const doc = ${JSON.stringify(gql([source]), null, 2)};`
    ]
    output.push('let lines = [];')

    source.split('\n').forEach((line, i) => {
      let match = /^#import\s+(.*)/.exec(line)
      if (match && match[1]) {
        output.push(`import dep${i} from ${match[1]};`)
        output.push(`lines.push(dep${i}.string);`)
        output.push(`doc.definitions = doc.definitions.concat(dep${i}.definitions);`);
      } else {
        output.push('lines.push(`' + line + '`);')
      }
    })
    output.push('doc.string = lines.join(`\n`);')
    output.push('export default doc;')
    return output.join('\n')
  }
}
