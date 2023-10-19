const { Types: { ObjectId } } = require('mongoose')
const { merge } = require('lodash/object')
const { union } = require('lodash/array')
const DocumentVersion = require('../models/documentVersion')
const validator = require('../services/jsonSchemaValidator')
const errors = require('../services/errors')
const Comment = require('./comment')

exports.get = function get (query) {
  return DocumentVersion.findOne(query)
}

exports.findByQuery = function findByQuery (query) {
  return DocumentVersion.find(query)
}

exports.update = async function update (id, content, customForm) {
  return DocumentVersion.findOne({ _id: id })
    .then((version) => {
      // Not found? Throw error
      if (!version) throw errors.ErrNotFound('Version document to update not found')
      // Merge content into version
      version.content = Object.assign(version.content, content)
      // Validate!
      validator.isDataValid(
        customForm.fields,
        version.content
      )
      // Save!
      version.markModified('content')
      return version.save()
    })
}

exports.create = async function create (prevVersionId, documentData, customForm) {
  return DocumentVersion.findOne({ _id: prevVersionId })
    .then((prevVersion) => {
      if (!prevVersion) throw errors.ErrNotFound('Version document to update not found')
      // Merge content into version
      documentData.content = Object.assign(prevVersion.content, documentData.content)

      validator.isDataValid(
        customForm.fields,
        documentData.content
      )

      const versionToSave = {
        document: documentData.document,
        version: documentData.version,
        content: documentData.content,
        contributions: documentData.contributions
      }

      return (new DocumentVersion(versionToSave)).save()
    })
}

// Update document
exports.updateField = async function updateField (id, field, content, customForm) {
  // First, find if the document exists
  return DocumentVersion.findOne({ _id: id })
    .then((version) => {
      // Found?
      if (!version) throw errors.ErrNotFound('DocumentVersion to update not found')
      // Change the content of the fied
      version.content[field] = content
      // Validate the data
      validator.isDataValid(
        customForm.fields,
        version.content
      )
      // Marked that this changed!
      version.markModified('content')
      // Save!
      return version.save()
    })
}

// Count contributions
exports.countContributions = async function countContributions (query) {
  // First, find if the document exists
  let count = 0
  let contributions = []
  let contributors = []
  return DocumentVersion.find(query)
    .then(async (versions) => {
    // Found?
      if (!versions) throw errors.ErrNotFound('Error retrieving versions')
      // Do stuff
      await Promise.all(versions.map(async (v) => {
        contributions = union(contributions, v.contributions)
        count += v.contributions.length
        let comments = await Comment.getAll({ _id: { $in: v.contributions } })
        let contributorsId = comments.map((c) => {
          return c.user.id
        })
        contributors = union(contributors, contributorsId)
        console.log('========================================================')
        console.log(contributors)
      }))
      return {
        contributionsCount: count,
        contributorsCount: contributors.length
      }
    })
}
