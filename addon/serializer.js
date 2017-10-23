import DS from 'ember-data';
import Ember from 'ember';

import {mapValues, isObject} from './utils'

const {
  String: {
    camelize,
    pluralize,
    singularize,
    underscore
  },
  isArray,
  isNone,
  get
} = Ember



export default DS.JSONSerializer.extend({
  isNewSerializerAPI: true,
  unwrapSingleResponseNode: true,

  normalizeCase(string) {
    return camelize(string);
  },

  normalize(modelClass, payload) {
    let data = this._normalize(payload)
    if (!this.get('unwrapSingleResponseNode')) return data
    let keys = Object.keys(data)
    return keys.length == 1 ? data[keys[0]] : data
  },

  _normalize(payload) {
    let modelClass = this.extractModelClass(payload)
    if(isArray(payload))   return this._normalizeArray(payload)
    if(modelClass)         return this._normalizeModel(payload, modelClass)
    if(isObject(payload))  return this._normalizeObject(payload)
    return payload
  },

  _normalizeArray(array) { return array.map(item => this._normalize(item)) },

  _normalizeModel(payload, modelClass = null) {
    modelClass = modelClass || this.extractModelClass(payload)

    let resourceHash = {
      id:            this.extractId(modelClass, payload),
      type:          modelClass.modelName,
      attributes:    this.extractAttributes(modelClass, payload)
      // relationships: this.extractRelationships(modelClass, payload)
    }

    this.applyTransforms(modelClass, resourceHash.attributes);
    return this.get('store').push({data: resourceHash})
  },

  _normalizeObject(payload) {
    return mapValues(payload, (val) => this._normalize(val))
  },

  extractType(resourceHash) {
    if(!resourceHash) return null
    let type = resourceHash.__typename
    let mappedModelName = this.mapTypeToModelName(type) || type
    return mappedModelName ? underscore(mappedModelName) : null
  },

  mapTypeToModelName(type) {
    return type
  },

  extractModelClass(resourceHash) {
    let type = this.extractType(resourceHash)
    try {
      return type ? this.get('store').modelFor(type) : null
    } catch(e) {
      return null
    }
  },

  extractAttributes(modelClass, resourceHash) {
    let attributeKey
    let attributes = {}

    modelClass.eachAttribute((key) => {
      attributeKey = this.keyForAttribute(key, 'deserialize');
      if (resourceHash.hasOwnProperty(attributeKey)) {
        let val = resourceHash[attributeKey]

        attributes[key] = this._normalize(val)
      }
    })

    return attributes
  },

  // extractRelationships(modelClass, resourceHash) {
  //   let relationships = {}
  //   modelClass.eachRelationship((key, meta) => {
  //     let data = resourceHash[key]
  //     if (isNone(data)) return

  //     let normalized = this._normalize(null, data)
  //     if(meta.kind === "hasMany") {
  //       relationships[key] = {
  //         data: normalized.map(item => ({ id: get(item, 'id'), type: meta.type }))
  //       }
  //     } else {
  //       relationships[key] = {
  //         data: { id: get(normalized, 'id'), type: meta.type }
  //       }
  //     }
  //   })
  //   return relationships
  // },
});
