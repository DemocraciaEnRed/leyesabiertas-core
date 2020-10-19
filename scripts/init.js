const mongoose = require('mongoose')
const Community = require('../models/community')
const dbCommunity = require('../db-api/community')
const CustomForm = require('../models/customForm')
const User = require('../models/user')
const dbCustomForm = require('../db-api/customForm')
const config = require('../config')
const log = require('../services/logger')

let communityData = {
  name: config.SETUP.COMMUNITY_NAME,
  mainColor: config.SETUP.COMMUNITY_COLOR,
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

let userProfileCustomForm = {
  'fields': {
    'required': [],
    'richText': [],
    'allowComments': [],
    'blocks': [
      {
        'fields': [
          'party',
          'occupation',
          'birthday',
          'gender',
          'province'
        ],
        'name': 'About the user'
      }
    ],
    'properties': {
      'occupation': {
        'type': 'string',
        'title': "User's occupation"
      },
      'party': {
        'type': 'string',
        'title': "User's party"
      },
      'gender': {
        'type': 'string',
        'title': "User's gender"
      },
      'birthday': {
        'type': 'string',
        'title': "User's birthday"
      },
      'province': {
        'type': 'string',
        'title': "User's province"
      },
      'tags': {
        'title': "User's tags",
        'type' : "array",
        'uniqueItems': true,
        'items': { 'type': "string" }
      },
      'tagsNotification': {
        'title': "User's tags notification setting",
        'anyof': [
          {
            'type': 'null'
          },
          {
            'type': 'boolean'
          }
        ]
      }
    }
  },
  'name': 'User Profile',
  'slug': 'user-profile',
  'icon': 'fas fa-user',
  'description': 'Template for a user profile'
}

let projectCustomForm = {
  'fields': {
    'required': [
      'fundation',
      'articles',
      'title'
    ],
    'richText': [
      'fundation',
      'articles'
    ],
    'allowComments': [
      'fundation',
      'articles'
    ],
    'blocks': [
      {
        'fields': [
          'title',
          'imgCover',
          'youtubeId',
          'customVideoId',
          'fundation'
        ],
        'name': "Project's basic info"
      },
      {
        'fields': [
          'articles'
        ],
        'name': 'Articles of the project'
      }
    ],
    'properties': {
      'title': {
        'type': 'string',
        'title': "Project's title"
      },
      'imageCover': {
        'anyof': [
          {
            'type': 'null'
          },
          {
            'type': 'string'
          }
        ],
        'title': 'URL for the cover of the image'
      },
      'fundation': {
        'type': 'object',
        'title': "Project's fundations"
      },
      'articles': {
        'type': 'object',
        'title': 'Articles'
      },
      'youtubeId': {
        'anyof': [
          {
            'type': 'null'
          },
          {
            'type': 'String'
          }
        ],
        'title': 'Youtube Video ID'
      },
      'customVideoId': {
        'anyof': [
          {
            'type': 'null'
          },
          {
            'type': 'String'
          }
        ],
        'title': 'HCDN Custom Video ID'
      },
      'closingDate': {
        'oneOf': [
          {
            'type': 'null'
          },
          {
            'type': 'string',
            'format': 'date-time'
          }
        ],
        'title': 'Closing date (to participate)'
      },
      'closure': {
        'anyof': [
          {
            'type': 'null'
          },
          {
            'type': 'object'
          }
        ],
        'title': 'Closure of the document'
      },
      'tags': {
        'title': "Project's tags",
        'type' : "array",
        'uniqueItems': true,
        'items': { 'type': "string" }
      },
      'sendTagsNotification': {
        'anyof': [
          {
            'type': 'null'
          },
          {
            'type': 'boolean'
          }
        ],
        'title': "Project's tags notification settings"
      }
    }
  },
  'name': 'Project',
  'slug': 'project-form',
  'icon': 'far fa-files',
  'description': 'This is the template of fields for projects',
  'version': 0
}

class DatabaseNotEmpty extends Error { }
class StopSetup extends Error { }

async function checkDB() {
  log.debug('* Checking if there are users without tagsNotification setting')
  let users = await User.find({ 'fields.tagsNotification': null })
  if (users && users.length){
    log.debug(`*- Found ${users.length} users. Updating all.`)
    await User.updateMany({ 'fields.tagsNotification': null }, {$set: {'fields.tagsNotification': true}})
    log.debug('--> OK updating users')
  }else
    log.debug('*- No users found. Continuing.')

  log.debug('* Checking if database has data on it')
  let community = await Community.findOne({})
  let customForm = await CustomForm.findOne({})
  if (customForm) {
    log.debug('* There is at least one document type already on the DB.')
    await updateCustomForm()
  }
  if (community || customForm) throw new DatabaseNotEmpty('Skipping new setup because there is data already in the DB')
  log.debug('--> OK checking DB')
}

async function create() {
  log.info('* Creating user profile custom form...')
  let profileSchema = await dbCustomForm.create(userProfileCustomForm)
  log.info('* Creating community...')
  communityData.userProfileSchema = profileSchema._id
  await dbCommunity.create(communityData)
  log.info('--> OK')
  log.info('* Creating document type custom form...')
  await dbCustomForm.create(projectCustomForm)
  log.info('--> OK')
  log.info('--> Setup finished!')
}

async function updateCustomForm() {
  log.info('* Fetching user profile form...')
  let userProfileExistingCustomForm = await CustomForm.findOne({slug: userProfileCustomForm.slug})
  if(!userProfileExistingCustomForm) throw new StopSetup('Critical error while fetching user profile custom form')
  log.info('* Updating user profile form...')
  userProfileExistingCustomForm.fields = userProfileCustomForm.fields
  log.info('* Saving user profile form...')
  await userProfileExistingCustomForm.save()
  log.info('* Fetching user profile form...')
  let projectExistingCustomForm = await CustomForm.findOne({slug: projectCustomForm.slug})
  if(!projectExistingCustomForm) throw new StopSetup('Critical error while fetching user profile custom form')
  log.info('* Updating project custom form...')
  projectExistingCustomForm.fields = projectCustomForm.fields
  log.info('* Saving project custom form...')
  await projectExistingCustomForm.save()
  log.debug('--> updateCustomForm OK')
}

async function startSetup() {
  try {
    await checkDB()
    await create()
  } catch (err) {
    log.warn(err.message)
  }
}

mongoose.Promise = global.Promise

exports.checkInit = async function checkInit() {
  try {
    // await checkEnv()
    log.info(`Seeding mongodb with init values`)
    mongoose
      .connect(config.MONGO_URL, { useNewUrlParser: true })
      .then(() => {
        log.info('--> OK')
        startSetup()
      })
      .catch((err) => {
        log.error(err)
        log.warn('Init stopped unexpectly')
      })
  } catch (err) {
    log.info(err.message)
    log.warn('Init stopped unexpectly')
  }
}
