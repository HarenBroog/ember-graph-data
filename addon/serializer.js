import DS from 'ember-data';
import Ember from 'ember';

import mapValues from './utils/map-values'

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
    let data = this._normalize(modelClass, payload)
    if (!this.get('unwrapSingleResponseNode')) return data
    let keys = Object.keys(data)
    return keys.length == 1 ? data[keys[0]] : data
  },

  _normalize(modelClass, payload) {
    let store = this.get('store')
    let data  = null

    if (isArray(payload)) {
      data = payload.map(item => this._normalize(null, item))
    } else if(payload instanceof Object && Object.keys(payload).length > 0) {
      let modelName  = this.extractType(payload)
      modelClass = modelClass || this.extractModelClass(payload)

      if (modelName && modelClass)  {
        let resourceHash = {
          id:            this.extractId(modelClass, payload),
          type:          modelName,
          attributes:    this.extractAttributes(modelClass, payload),
          relationships: this.extractRelationships(modelClass, payload)
        };

        this.applyTransforms(modelClass, resourceHash.attributes);
        data = store.push({data: resourceHash})
      } else {
        data = mapValues(payload, (val, key) => this._normalize(null, val))
      }
    }
    return data
  },

  extractType(resourceHash) {
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

  extractRelationships(modelClass, resourceHash) {
    let relationships = {}
    modelClass.eachRelationship((key, meta) => {
      let data = resourceHash[key]
      if (isNone(data)) return

      let normalized = this._normalize(null, data)
      if(meta.kind === "hasMany") {
        relationships[key] = {
          data: normalized.map(item => ({ id: get(item, 'id'), type: meta.type }))
        }
      } else {
        relationships[key] = {
          data: { id: get(normalized, 'id'), type: meta.type }
        }
      }
    })
    return relationships
  },
});
