// const mongoose = require('mongoose')
const Migration = require('../models/migration')
const log = require('../services/logger')
// Add the models that the migration will use
const DocumentModel = require('../models/document')
const DocumentDbApi = require('../db-api/document')
const CommentsModel = require('../models/comment')

// Define the migration
module.exports = {
  async run () {
    // Check if the migration has already been applied
    const migrationName = 'set-if-document-was-popular' // Replace with your migration name
    const existingMigration = await Migration.findOne({ name: migrationName })

    if (existingMigration) {
      // Already applied, skip
      return
    }
    log.info(`* Running migration ${migrationName}`)

    // Migration logic
    // get all the documents from the db
    const documentListUnpopulated = await DocumentModel.find({})
    log.info(`*- Found ${documentListUnpopulated.length} documents`)
    // for each document, get them with the current version
    const documents = []
    for (let index = 0; index < documentListUnpopulated.length; index++) {
      const document = documentListUnpopulated[index]
      const documentPopulated = await DocumentDbApi.get({ _id: document.id })
      documents.push(documentPopulated)
    }
    // for each document, check if it is popular, if so, mark it as popular
    for (let index = 0; index < documents.length; index++) {
      log.info(`*-- ==========================`)
      const document = documents[index]
      const documentAuthorId = document.author._id.toString()
      const countApoyosDocument = document && document.apoyos ? document.apoyos.length : 0
      const countContributionsArticles = await CommentsModel.count({ document: document.id, field: 'articles', author: { $ne: documentAuthorId } })
      const countCommentsFundation = await CommentsModel.count({ document: document.id, field: 'fundation', author: { $ne: documentAuthorId } })
      log.info(`*-- Document: ${document.currentVersion.content.title}`)
      log.info(`*--- countApoyosDocument ${countApoyosDocument} (needs to be >= 30)`)
      log.info(`*--- countCommentsFundation ${countCommentsFundation} (needs to be >= 10)`)
      log.info(`*--- countContributionsArticles ${countContributionsArticles} (needs to be >= 5)`)

      // a document is popular if one fo the following applies:
      // 30 countApoyosDocument
      // 10 countCommentsFundation
      // 5 countContributionsArticles
      const isPopular = (countApoyosDocument >= 30) || (countCommentsFundation >= 10) || (countContributionsArticles >= 5)
      log.info(`*--- isPopular? ${isPopular ? 'YES... mark the document' : 'No... skip'}`)
      // if it is popular, mark it as popular
      const documentUnpopulated = documentListUnpopulated.find((doc) => doc._id.toString() === document._id.toString())
      if (isPopular) {
        // get from documentListUnpopulated the document with the same id
        // mark it as popular
        documentUnpopulated.popularMailSent = true
      } else {
        documentUnpopulated.popularMailSent = false
      }
      // save the document
      await documentUnpopulated.save()
    }

    // Insert a record in the migration table to mark it as applied
    await Migration.create({ name: migrationName, timestamp: Date.now() })
    // End of migration
    log.info(`*- Migration ${migrationName} finished`)
  }
}
