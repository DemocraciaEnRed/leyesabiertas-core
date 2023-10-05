const { Types: { ObjectId } } = require('mongoose')
const { merge } = require('lodash/object')
const Document = require('../models/document')
const DocumentVersion = require('../models/documentVersion')
const DocumentTag = require('../models/documentTag')
const dbUser = require('../db-api/user')
const validator = require('../services/jsonSchemaValidator')
const errors = require('../services/errors')

exports.countAuthorDocuments = async function countAuthorDocuments (author) {
  return Document.count({ author: author })
}

exports.isAuthor = async function isAuthor (id, author) {
  let count = await Document.countDocuments({ _id: id, author: author })
  return count
}

// Create document
exports.create = async function create (documentData, customForm) {
  // Check if the data is valid
  validator.isDataValid(
    customForm.fields,
    documentData.content
  )
  // Create a new document
  let documentToSave = {
    author: documentData.author,
    customForm: customForm._id,
    published: documentData.published
  }
  // Save the document, to get the id
  let theDocument = await (new Document(documentToSave)).save()
  // Create a new version
  let versionToSave = {
    document: theDocument._id,
    version: 1,
    content: documentData.content,
    contributions: []
  }
  // Save the documentVersion
  let theVersion = await (new DocumentVersion(versionToSave)).save()
  // Refer the currentVersion of the document to the saved version.
  theDocument.currentVersion = theVersion._id
  // Save on DB
  await theDocument.save()
  theDocument.content = theVersion.content
  return theDocument
}

// Get document (with its last version)
exports.get = async function get (query) {
  let document = await Document.findOne(query).populate({ path: 'author', select: dbUser.exposeAll(false) }).populate('currentVersion').lean()
  return document
}

exports.retrieve = async function get (query, sort) {
  let theSort = sort || {}
  console.log(theSort)
  let document = await Document.find(query).populate({ path: 'author', select: dbUser.exposeAll(false) }).populate('currentVersion').sort(theSort).lean()
  return document
}

// List documents
exports.list = async function list (query, { limit, page, sort }) {
  let optionsPaginate = {}
  optionsPaginate.limit = limit
  optionsPaginate.page = page
  optionsPaginate.lean = true
  optionsPaginate.populate = [{ path: 'author', select: dbUser.exposeAll(false) }, { path: 'currentVersion' }]
  if (sort) {
    optionsPaginate.sort = sort
  }
  let documentList = await Document.paginate(query, optionsPaginate)
  // let promisesPopulate = documentList.docs.map(async (doc) => {
  //   let theVersion = await DocumentVersion.findOne({
  //     document: doc._id,
  //     version: doc.lastVersion
  //   }).lean()
  //   let aux = doc
  //   aux.content = theVersion.content
  //   return aux
  // })
  // let populatedDocs = await Promise.all(promisesPopulate)
  // documentList.docs = populatedDocs
  return documentList
}

// Update document
exports.update = async function update (id, document) {
  // First, find if the document exists
  return Document.findOne({ _id: id })
    .then((_document) => {
      // Founded?
      if (!_document) throw errors.ErrNotFound('Document to update not found')
      // Deep merge the change(s) with the document
      let documentToSave = merge(_document, document)
      // Save!
      return documentToSave.save()
    })
}

// Update document
exports.addComment = async function addComment (id) {
  // First, find if the document exists
  return Document.findOne({ _id: id })
    .then((_document) => {
      // Founded?
      if (!_document) throw errors.ErrNotFound('Document to update not found')
      // Deep merge the change(s) with the document
      _document.commentsCount = _document.commentsCount + 1
      // Save!
      return _document.save()
    })
}

// Update document
exports.subtractComment = async function subtractComment (id) {
  // First, find if the document exists
  return Document.findOne({ _id: id })
    .then((_document) => {
      // Founded?
      if (!_document) throw errors.ErrNotFound('Document to update not found')
      // Deep merge the change(s) with the document
      _document.commentsCount = _document.commentsCount - 1
      // Save!
      return _document.save()
    })
}

exports.remove = function remove (id) {
  return Document.findOne({ _id: id })
    .then((document) => {
      if (!document) throw errors.ErrNotFound('Document to remove not found')
      document.remove()
    })
}

exports.apoyar = async function apoyar (documentId, userId) {
  // primero vemos si ya apoyó
  let documentApoyado = await Document.findOne({ _id: documentId, 'apoyos.userId': userId })
  if (!documentApoyado) { return Document.updateOne({ _id: documentId }, { '$push': { apoyos: { userId: userId } } }) } else { return documentApoyado }
}

exports.apoyarAnon = async function apoyarAnon (apoyoToken) {
  // primero vemos si ya apoyó
  let documentApoyado = await Document.findOne({ _id: apoyoToken.document._id, 'apoyos.email': apoyoToken.email })
  if (!documentApoyado) {
    await Document.updateOne({ _id: apoyoToken.document._id }, {
      '$push': {
        apoyos: {
          email: apoyoToken.email,
          nombreApellido: apoyoToken.nombreApellido
        }
      }
    })
  }
}

exports.countDocumentsPerAuthor = async function countDocumentsPerAuthor (yearCreatedAt) {
  let aggretation = []
  if (yearCreatedAt) {
    aggretation.push({
      '$match': {
        'createdAt': {
          '$gte': new Date(yearCreatedAt, 0, 1),
          '$lt': new Date(yearCreatedAt, 11, 31)
        }
      }
    })
  }

  aggretation = aggretation.concat([
    {
      '$group': {
        '_id': '$author',
        'count': {
          '$sum': 1
        }
      }
    }, {
      '$lookup': {
        'from': 'users',
        'localField': '_id',
        'foreignField': '_id',
        'as': 'user'
      }
    }, {
      '$sort': {
        'count': -1
      }
    }, {
      '$unwind': {
        'path': '$user'
      }
    }, {
      '$project': {
        'count': 1,
        'user': {
          'fullname': 1,
          'email': 1
        }
      }
    }
  ])

  return Document.aggregate(aggretation)
}

exports.getAllDocumentsWithTags = async function getAllDocumentsWithTags (tagsArray, yearCreatedAt) {
  let aggregation = []
  if (yearCreatedAt) {
    aggregation.push({
      '$match': {
        'createdAt': {
          '$gte': new Date(yearCreatedAt, 0, 1),
          '$lt': new Date(yearCreatedAt, 11, 31)
        }
      }
    })
  }

  aggregation = aggregation.concat([
    {
      '$lookup': {
        'from': 'documentversions',
        'localField': 'currentVersion',
        'foreignField': '_id',
        'as': 'currentVersion'
      }
    }, {
      '$unwind': {
        'path': '$currentVersion'
      }
    }, {
      '$lookup': {
        'from': 'users',
        'localField': 'author',
        'foreignField': '_id',
        'as': 'author'
      }
    }, {
      '$unwind': {
        'path': '$author'
      }
    }, {
      '$match': {
        'currentVersion.content.tags': {
          '$in': tagsArray
        }
      }
    }, {
      '$project': {
        'title': '$currentVersion.content.title',
        'documentId': '$_id',
        'version': '$currentVersion.version',
        'closingDate': '$currentVersion.content.closingDate',
        'tags': '$currentVersion.content.tags',
        'published': '$published',
        'author': {
          'id': '$author._id',
          'fullname': '$author.fullname',
          'email': '$author.email'
        },
        'createdAt': '$createdAt',
        'updatedAt': '$updatedAt'
      }
    }, {
      '$sort': {
        'createdAt': -1
      }
    }
  ])

  const docArray = await Document.aggregate(aggregation)

  console.log(docArray)
  
  const documentTags = await DocumentTag.find({})

  for (let i = 0; i < docArray.length; i++) {
    const doc = docArray[i]
    if (doc.tags) {
      doc.tags = doc.tags.map((tag) => {
        return documentTags.find((documentTag) => documentTag._id.toString() === tag)
      }).filter((tag) => tag)
    }
  }

  return docArray
}

exports.getAllDocumentsWithoutTags = async function getAllDocumentsWithoutTags (yearCreatedAt) {
  let aggregation = []
  if (yearCreatedAt) {
    aggregation.push({
      '$match': {
        'createdAt': {
          '$gte': new Date(yearCreatedAt, 0, 1),
          '$lt': new Date(yearCreatedAt, 11, 31)
        }
      }
    })
  }

  aggregation = aggregation.concat([
    {
      '$lookup': {
        'from': 'documentversions',
        'localField': 'currentVersion',
        'foreignField': '_id',
        'as': 'currentVersion'
      }
    }, {
      '$unwind': {
        'path': '$currentVersion'
      }
    }, {
      '$lookup': {
        'from': 'users',
        'localField': 'author',
        'foreignField': '_id',
        'as': 'author'
      }
    }, {
      '$unwind': {
        'path': '$author'
      }
    }, {
      '$match': {
        'currentVersion.content.tags': {
          '$exists': false
        }
      }
    }, {
      '$project': {
        'title': '$currentVersion.content.title',
        'documentId': '$_id',
        'version': '$currentVersion.version',
        'closingDate': '$currentVersion.content.closingDate',
        'tags': '$currentVersion.content.tags',
        'published': '$published',
        'author': {
          'id': '$author._id',
          'fullname': '$author.fullname',
          'email': '$author.email'
        },
        'createdAt': '$createdAt',
        'updatedAt': '$updatedAt'
      }
    }, {
      '$sort': {
        'createdAt': -1
      }
    }
  ])

  return Document.aggregate(aggregation)
}

exports.getCountOfCommentsAndLikesPerDocument = async function getCountOfCommentsAndLikesPerDocument (yearCreatedAt, tag, author) {
  let aggregation = []

  if (yearCreatedAt) {
    aggregation.push({
      '$match': {
        'createdAt': {
          '$gte': new Date(yearCreatedAt, 0, 1),
          '$lt': new Date(yearCreatedAt, 11, 31)
        }
      }
    })
  }
  if (author) {
    aggregation.push({
      '$match': {
        'author': ObjectId(author)
      }
    })
  }

  aggregation = aggregation.concat([
    {
      '$lookup': {
        'from': 'documentversions',
        'localField': 'currentVersion',
        'foreignField': '_id',
        'as': 'currentVersion'
      }
    }, {
      '$unwind': {
        'path': '$currentVersion'
      }
    }, {
      '$lookup': {
        'from': 'users',
        'localField': 'author',
        'foreignField': '_id',
        'as': 'author'
      }
    }, {
      '$unwind': {
        'path': '$author'
      }
    }, {
      '$lookup': {
        'from': 'comments',
        'let': {
          'document_id': '$_id'
        },
        'pipeline': [
          {
            '$match': {
              '$expr': {
                '$eq': [
                  '$document', '$$document_id'
                ]
              }
            }
          }, {
            '$lookup': {
              'from': 'likes',
              'localField': '_id',
              'foreignField': 'comment',
              'as': 'likes'
            }
          }
        ],
        'as': 'comments'
      }
    }
  ])

  const docArray = await Document.aggregate(aggregation)

  if (tag) {
    // tag is an id, if defined, filter projects that includes this tag
    for (let i = 0; i < docArray.length; i++) {
      const doc = docArray[i]
      if (doc.currentVersion.content.tags) {
        if (!doc.currentVersion.content.tags.includes(tag)) {
          docArray.splice(i, 1)
          i--
        }
      } else {
        docArray.splice(i, 1)
        i--
      }
    }
  }

  const documentTags = await DocumentTag.find({})

  for (let i = 0; i < docArray.length; i++) {
    const doc = docArray[i]
    if (doc.currentVersion.content.tags) {
      doc.currentVersion.content.tags = doc.currentVersion.content.tags.map((tag) => {
        return documentTags.find((documentTag) => documentTag._id.toString() === tag)
      }).filter((tag) => tag)
    }
    doc.apoyosCount = doc.apoyos && doc.apoyos.length ? doc.apoyos.length : 0
    doc.likesCount = 0
    doc.commentsFundationCount = doc.comments.filter((comment) => comment.field == 'fundation').length
    doc.commentsArticlesCount = doc.comments.filter((comment) => comment.field == 'articles').length
    doc.comments.forEach((comment) => {
      doc.likesCount += comment.likes.length
    })
    doc.totalInteraction = doc.apoyosCount + doc.likesCount + doc.commentsFundationCount + doc.commentsArticlesCount
  }

  const resData = []

  for (let i = 0; i < docArray.length; i++) {
    const doc = docArray[i]
    resData.push({
      title: doc.currentVersion.content.title,
      documentId: doc._id,
      version: doc.currentVersion.version,
      createdAt: doc.createdAt,
      closingDate: doc.currentVersion.content.closingDate,
      tags: doc.currentVersion.content.tags,
      apoyosCount: doc.apoyosCount,
      likesCount: doc.likesCount,
      published: doc.published,
      commentsFundationCount: doc.commentsFundationCount,
      commentsArticlesCount: doc.commentsArticlesCount,
      totalInteraction: doc.totalInteraction,
      author: {
        id: doc.author._id,
        fullname: doc.author.fullname,
        email: doc.author.email
      }
    })
  }

  // sort by totalInteraction DESC
  resData.sort((a, b) => b.totalInteraction - a.totalInteraction)

  return resData
}
