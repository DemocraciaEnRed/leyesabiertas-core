const DocumentTag = require('../models/documentTag')
const { ErrNotFound } = require('../services/errors')

exports.get = function get (query) {
  return DocumentTag.findOne(query)
}

exports.getAll = function getAll (query) {
  return DocumentTag.find(query)
}

exports.create = function create (data) {
  return (new DocumentTag(data)).save()
}

exports.remove = function remove (id) {
  return DocumentTag.findById(id)
    .then((documentTag) => {
      if (!documentTag) throw ErrNotFound('DocumentTag to remove not found')
      return documentTag.remove()
    })
}
