// const mongoose = require('mongoose')
const Migration = require('../models/migration')
const log = require('../services/logger')
// Add the models that the migration will use
const User = require('../models/user')
const DocumentTag = require('../models/documentTag')

// Define the migration
module.exports = {
  async run () {
    // Check if the migration has already been applied
    const migrationName = 'add-every-documenttag-to-users-tags' // Replace with your migration name
    const existingMigration = await Migration.findOne({ name: migrationName })

    if (existingMigration) {
      // Already applied, skip
      return
    }
    log.info(`* Running migration ${migrationName}`)

    // Migration logic
    const allDocumentTags = await DocumentTag.find({})
    // make an array of documentTagsId
    const documentTagsId = allDocumentTags.map((documentTag) => documentTag._id.toString())
    // find all users
    const users = await User.find({})
    // add all documentTagsId to each user
    for (let index = 0; index < users.length; index++) {
      const user = users[index]
      console.log(user)
      user.fields.tags = documentTagsId
      // for Mongoose.Types.Mixed fields, you need to mark them as modified if you change a value inside them
      user.markModified('fields')
      await user.save()
    }
    // Insert a record in the migration table to mark it as applied
    await Migration.create({ name: migrationName, timestamp: Date.now() })
    // End of migration
    log.info(`*- Migration ${migrationName} finished`)
  }
}
