const { Types: { ObjectId } } = require('mongoose')
const { merge } = require('lodash/object')
const { ErrNotFound } = require('../services/errors')
const User = require('../models/user')
const CommunityDB = require('./community')
const validator = require('../services/jsonSchemaValidator')
const log = require('../services/logger')
const user = require('../models/user')

const exposeAll = (expose) => {
  if (expose) return null // expose == true then show all
  else return '-avatar -email -username' // hide sensitive info
}

exports.exposeAll = exposeAll

// Create uset

exports.create = function create (user) {
  return (new User(user)).save()
}

// Get user

exports.get = function get (query, expose) {
  return User.findOne(query).select(exposeAll(expose))
}

// List users

exports.isEmpty = function isEmpty () {
  return User.findOne({})
    .then((user) => {
      if (user === null) return true
      return false
    })
}

// Find by query
exports.findByQuery = function findByQuery (query, expose) {
  return User.find(query).select(exposeAll(expose))
}

exports.list = function list (query, { limit, page }, expose) {
  return User
    .paginate(query, { limit, page, select: exposeAll(expose) })
}

// Update user

exports.update = async function update (id, userWithUpdatedFields) {
  return User.findOne({ _id: id })
    .then(async (_user) => {
      if (!_user) throw ErrNotFound('User to update not found')
      if (userWithUpdatedFields.fields) {
        let community = await CommunityDB.get()
        validator.isDataValid(
          community.userProfileSchema.fields,
          userWithUpdatedFields.fields
        )
        if (_user.fields) {
          // get the keys inside userWithUpdatedFields.fields
          let keys = Object.keys(userWithUpdatedFields.fields)
          // iterate over the keys
          for (let index = 0; index < keys.length; index++) {
            // get the key
            const key = keys[index]
            // update the value inside _user.fields
            _user.fields[key] = userWithUpdatedFields.fields[key]
          }
          _user.markModified('fields')
        }
      }
      if (userWithUpdatedFields.avatar) {
        _user.avatar = userWithUpdatedFields.avatar
      }
      return _user.save()
    })
}

// Remove user

exports.remove = function remove (id) {
  return User.findOne({ _id: id })
    .then((user) => {
      if (!user) throw ErrNotFound('User to remove not found')
      return user.remove()
    })
}

exports.getCountOfUsers = async function getCountOfUsers (yearCreatedAt) {
  let query = {}

  if (yearCreatedAt) {
    query.createdAt = {
      '$gte': new Date(yearCreatedAt, 0, 1),
      '$lt': new Date(yearCreatedAt, 11, 31)
    }
  }

  return User.countDocuments(query)
}

exports.getCountOfActiveUsersInTheLastXMonth = async function getCountOfActiveUsersInTheLastXMonth (months = 1) {
  return User.countDocuments({
    'lastLogin': {
      '$gte': new Date(new Date().setMonth(new Date().getMonth() - months))
    }
  })
}

exports.getCountOfUsersByRole = async function getCountOfUsersByRole (role) {
  return User.countDocuments({ roles: role })
}

exports.getCountOfUsersWithoutRolesAdminAndAccountable = async function getCountOfUsersWithoutRolesAdminAndAccountable (yearCreatedAt) {
  // normal users might have a "roles" field array but they are not role "admin" or "accountable"
  let query = {
    roles: { $nin: ['admin', 'accountable'] }
  }

  if (yearCreatedAt) {
    query.createdAt = {
      '$gte': new Date(yearCreatedAt, 0, 1),
      '$lt': new Date(yearCreatedAt, 11, 31)
    }
  }

  return User.countDocuments(query).sort({ createdAt: -1 })
}

// exports.getUsersWithoutRolesAdminAndAccountable = async function getCountOfUsersWithoutRolesAdminAndAccountable () {
//   // normal users might have a "roles" field array but they are not role "admin" or "accountable"
//   return User.find({ roles: { $nin: ['admin', 'accountable'] } }, 'fullname email createdAt lastLogin').sort({ createdAt: -1 })
// }

exports.getUsersByRole = async function getUsersByRole (role) {
  return User.find({ roles: role }, 'fullname email createdAt lastLogin').sort({ createdAt: -1 })
}

exports.getAll = async function getAll () {
  return User.find({}).sort({ createdAt: -1 })
}

exports.query = async function query (query, expose) {
  return User.find(query).select(exposeAll(expose))
}