const mongoose = require('mongoose')
const fs = require('fs')
const path = require('path')
const { promisify } = require('util')
// Models
const CustomForm = require('../models/customForm')
// Others
const log = require('../services/logger')
const config = require('../config')
// Data
const userProfileCustomForm = require('./userProfileCustomForm')
const projectCustomForm = require('./projectCustomForm')

async function init () {
  try {
    log.info('================================')
    log.info(`START MIGRATION PROCESS`)
    log.info('================================')
    log.info(`* Connecting to mongodb 3.6`)
    await mongoose.connect(config.MONGO_URL, { useNewUrlParser: true })
    log.info(`*- Connected to mongodb 3.6`)
    // Update user profile custom form
    await updateUserProfileCustomForm()

    // Update project custom form
    await updateProjectCustomForm()

    // Run migrations
    await runMigrations()
  } catch (err) {
    log.warn('================================')
    log.warn(`Migration process failed`)
    log.warn('================================')
    log.error(err.message)
  }
}

async function updateUserProfileCustomForm () {
  try {
    log.info('* Checking if there is a user profile custom form')
    let customForm = await CustomForm.findOne({ slug: 'user-profile' })
    if (!customForm) {
      log.info('*- User profile custom form not found. Creating...')
      customForm = new CustomForm(userProfileCustomForm)
      await customForm.save()
      log.info('*- User profile custom form created')
    } else {
      log.info('*- User profile custom form found. Updating...')
      customForm.fields = userProfileCustomForm.fields
      await customForm.save()
      log.info('*- User profile custom form updated')
    }
  } catch (err) {
    throw err
  }
}

async function updateProjectCustomForm () {
  try {
    log.info('* Checking if there is a project custom form')
    let customForm = await CustomForm.findOne({ slug: 'project-form' })
    if (!customForm) {
      log.info('*- Project custom form not found. Creating...')
      customForm = new CustomForm(projectCustomForm)
      await customForm.save()
      log.info('*- Project custom form created')
    } else {
      log.info('*- Project custom form found. Updating...')
      customForm.fields = projectCustomForm.fields
      await customForm.save()
      log.info('*- Project custom form updated')
    }
  } catch (err) {
    throw err
  }
}

async function runMigrations () {
  const migrationDir = path.join(__dirname, '../migrations')
  const migrations = await promisify(fs.readdir)(migrationDir)

  try {
    for (let migration of migrations) {
      const migrationPath = path.join(migrationDir, migration)
      const migrationModule = require(migrationPath)
      await migrationModule.run()
    }
  } catch (err) {
    throw err
  }
}

module.exports = {
  init
}
