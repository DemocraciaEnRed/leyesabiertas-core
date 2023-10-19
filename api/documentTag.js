const status = require('http-status')
const express = require('express')
const DocumentTag = require('../db-api/documentTag')
const User = require('../db-api/user')
const DocumentVersion = require('../db-api/documentVersion')
const router = express.Router()
const auth = require('../services/auth')
const middlewares = require('../services/middlewares')
const log = require('../services/logger')
const slugify = require('slugify')

router.route('/')
  /**
   * @api {get} /document-tags List
   * @apiDescription Returns a list of available document tags.
   * @apiName getDocumentTags
   * @apiGroup DocumentTag
   */
  .get(
    async (req, res, next) => {
      try {
        let results = await DocumentTag.getAll().sort({ name: 1 })
        res.status(status.OK).json({
          results: results
        })
      } catch (err) {
        next(err)
      }
    })
  .post(
    auth.keycloak.protect('realm:admin'),
    async (req, res, next) => {
      try {
        if (!req.body.name) throw new Error('Name of document tag is required')
        // slugify the name to create the key
        const newTag = {
          name: req.body.name,
          key: slugify(req.body.name, { lower: true })
        }
        let createdTag = await DocumentTag.create(newTag)
        // now we have to update all the users with this tag
        const userQuery = {
          $and: [
            { 'fields.tags': { $exists: true } },
            { 'fields.tags': { $ne: createdTag._id.toString() } }
          ]
        }
        // Fetch all the users with the tag
        const usersWithoutTag = await User.findByQuery(userQuery, true)
        // For every user, add the tag
        for (let user of usersWithoutTag) {
          user.fields.tags.push(createdTag._id.toString())
          user.markModified('fields')
          await user.save()
        }
        return res.status(status.OK).json({
          createdTag: createdTag
        })
      } catch (err) {
        next(err)
      }
    })

router.route('/:id')
  .delete(
    auth.keycloak.protect('realm:admin'),
    async (req, res, next) => {
      try {
        // await DocumentTag.remove(req.params.id)
        // res.json({ message: 'tag borrada exitosamente' })
        // res.status(status.OK)

        // First we need to clean all the tags from every user
        const userQuery = {
          $and: [
            { 'fields.tags': { $exists: true } },
            { 'fields.tags': req.params.id }
          ]
        }
        // Fetch all the users with the tag
        const usersWithTag = await User.findByQuery(userQuery, true)
        // For every user, remove the tag
        for (let user of usersWithTag) {
          user.fields.tags = user.fields.tags.filter((tag) => tag !== req.params.id)
          user.markModified('fields')
          await user.save()
        }
        // Now we need to remove the tag from every documentVersion that has content.tags
        const documentVersionQuery = {
          $and: [
            { 'content.tags': { $exists: true } },
            { 'content.tags': req.params.id }
          ]
        }
        // Fetch all the documentVersions with the tag
        const documentVersionsWithTag = await DocumentVersion.findByQuery(documentVersionQuery, true)
        // For every documentVersion, remove the tag
        for (let documentVersion of documentVersionsWithTag) {
          documentVersion.content.tags = documentVersion.content.tags.filter((tag) => tag !== req.params.id)
          documentVersion.markModified('content')
          await documentVersion.save()
        }

        // Now we can remove the tag
        await DocumentTag.remove(req.params.id)

        return res.status(status.OK).json({
          message: 'Tag borrada exitosamente'
        })

      } catch (err) {
        next(err)
      }
    })

module.exports = router
