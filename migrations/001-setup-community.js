// const mongoose = require('mongoose')
const Migration = require('../models/migration')
const config = require('../config')
const log = require('../services/logger')
// Add the models that the migration will use
const Community = require('../models/community')

// Define the migration
module.exports = {
  async run () {
    // Check if the migration has already been applied
    const migrationName = 'setup-community' // Replace with your migration name
    const existingMigration = await Migration.findOne({ name: migrationName })

    if (existingMigration) {
      // Already applied, skip
      return
    }
    log.info(`* Running migration ${migrationName}`)

    // check if config.SETUP.COMMUNITY_NAME is set

    // check if the db has already a community
    const existingCommunity = await Community.findOne({})

    // if there is no community, create one
    if (!existingCommunity) {
      const communityName = config.SETUP.COMMUNITY_NAME || 'My Community'
      const mainColor = config.SETUP.COMMUNITY_COLOR || '#000000'

      let communityData = {
        name: communityName,
        mainColor: mainColor,
        logo: null,
        user: null,
        userProfileSchema: null,
        initialized: true,
        permissions: {
          user: {}, // Permissions for users
          accountable: { // Permissions for accountables
            documentCreationLimit: 1
          },
          admin: {} // Permissions for admin
        }
      }
      // There is no community, create one
      await Community.create(communityData)
    }

    await Migration.create({ name: migrationName, timestamp: Date.now() })

    // End of migration
    log.info(`*- Migration ${migrationName} finished`)
  }
}
