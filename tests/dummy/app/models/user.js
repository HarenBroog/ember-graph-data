import DS from 'ember-data'

const {
  Model,
  attr,
  hasMany,
  belongsTo
} = DS

export default Model.extend({
  email:      attr(),
  firstName:  attr(),

  posts:      hasMany('user/blog-post'),
  role:       belongsTo('user/role')
})
