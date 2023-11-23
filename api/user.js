const status = require('http-status')
const express = require('express')
const router = express.Router()

const User = require('../db-api/user')
const DocumentTag = require('../db-api/documentTag')
const auth = require('../services/auth')
const middlewares = require('../services/middlewares')
const { query } = require('winston')

router.route('/')
/**
 * @api {get} /users List users
 * @apiName getUsers
 * @apiGroup User
 */
  .get(
    auth.keycloak.protect('realm:admin'),
    async (req, res, next) => {
      try {
        const search = { '$regex': req.query.search, '$options': 'i' }
        let query = {}
        if (req.query.search) {
          query = {
            $or: [
              { 'names': search },
              { 'surnames': search },
              { 'fullname': search },
              { 'fields.party': search }
            ] }
        }

        const results = await User.list(query, {
          limit: req.query.limit,
          page: req.query.page
        }, false)

        let auxOne = parseInt(results.total / req.query.limit)
        let auxTwo = results.total % req.query.limit
        if (auxTwo) {
          auxOne++
        }
        res.status(status.OK).json({
          results: results.docs,
          pagination: {
            count: results.total,
            page: results.page,
            pages: auxOne,
            limit: results.limit
          }
        })
      } catch (err) {
        next(err)
      }
    })
/**
 * @api {put} /users/:id Updates users info
 * @apiName putUser
 * @apiGroup User
 *
 * @apiParam {Number} id Users ID.
 */
  .put(
    auth.keycloak.protect(),
    async (req, res, next) => {
      try {
        const updatedUser = await User.update(req.session.user._id, req.body)
        // actualizamos el usuario de la sesión
        req.session.user = updatedUser
        res.status(status.OK).json(updatedUser)
      } catch (err) {
        next(err)
      }
    })

router.route('/me')
/**
 * @api {get} /me Get the info of the logged user
 * @apiName getMyInfo
 * @apiGroup User
 */
  .get(
    auth.keycloak.protect(),
    async (req, res, next) => {
      try {
        // console.log(req.kauth.grant)
        res.status(status.OK).json(req.session.user)
        // res.status(status.OK).json(req.kauth.grant)
      } catch (err) {
        next(err)
      }
    })

router.route('/:id/avatar')
/**
   * @api {get} /users/:id Gets a user
   * @apiName getUser
   * @apiGroup User
   *
   * @apiParam {Number} id Users ID.
   */
  .get(
    middlewares.checkId,
    async (req, res, next) => {
      try {
        // TODO
        const user = await User.get({ _id: req.params.id }, true)
        const b64 = user.avatar.split(',')[1]
        let img = Buffer.from(b64, 'base64')
        res.writeHead(200, {
          'Content-Type': 'image/jpeg',
          'Content-Length': img.length
        })
        res.end(img)
      } catch (err) {
        next(err)
      }
    })

router.route('/:id')
/**
     * @api {get} /users/:id Gets a user
     * @apiName getUser
     * @apiGroup User
     *
     * @apiParam {Number} id Users ID.
     */
  .get(
    middlewares.checkId,
    async (req, res, next) => {
      try {
        // TODO
        const result = await User.get({ _id: req.params.id }, false)
        res.status(status.OK).json(result)
      } catch (err) {
        next(err)
      }
    })
/**
     * @api {get} /users/:id puts a user
     * @apiName putUser
     * @apiGroup User
     *
     * @apiParam {Number} id Users ID.
     */
  .put(
    auth.keycloak.protect('realm:admin'),
    async (req, res, next) => {
      try {
        const updatedUser = await User.update(req.params.id, req.body)
        res.status(status.OK).json(updatedUser)
      } catch (err) {
        next(err)
      }
    })

/**
     * @api {delete} /users/:id Delets a user
     * @apiName deleteUser
     * @apiGroup User
     *
     * @apiParam {Number} id Users ID.
     */
  .delete(
    middlewares.checkId,
    auth.keycloak.protect('realm:admin'),
    async (req, res, next) => {
      try {
        // TODO
        User.remove(req.params.id)
        res.status(status.OK).json({ id: req.params.id })
      } catch (err) {
        next(err)
      }
    })

router.route('/notifications/settings')
  .get(
    auth.keycloak.protect(),
    async (req, res, next) => {
      try {
        const userId = req.session.user._id.toString()
        // get the user data
        const user = await User.get({ _id: userId }, true)
        // get all the possible documentTags
        const allDocumentTags = await DocumentTag.getAll({}).sort({ name: 1 })
        let userSubscribedTagsIds = user && user.fields && user.fields.tags ? user.fields.tags : [] // array of strings Ids
        let userSubscribedTags = []

        for (let i = 0; i < userSubscribedTagsIds.length; i++) {
          let tag = allDocumentTags.find((tag) => tag._id.toString() === userSubscribedTagsIds[i])
          userSubscribedTags.push(tag)
        }

        const userSubscribedAuthorsIds = user && user.fields && user.fields.authors ? user.fields.authors : [] // array of strings Ids
        const userSubscribedAuthors = await User.query({ _id: { $in: userSubscribedAuthorsIds }, roles: 'accountable' }, false)
        const userSubscribedAuthorsLighter = userSubscribedAuthors.map((author) => {
          return {
            _id: author._id,
            name: author.fullname
          }
        })
        // get the user notifications settings
        const outputData = {
          availableDocumentTags: allDocumentTags,
          tagsNotification: user && user.fields && user.fields.tagsNotification ? user.fields.tagsNotification : false,
          popularNotification: user && user.fields && user.fields.popularNotification ? user.fields.popularNotification : false,
          userSubscribedTags,
          userSubscribedTagsIds,
          userSubscribedAuthors: userSubscribedAuthorsLighter
        }

        return res.json(outputData)
      } catch (err) {
        next(err)
      }
    }
  )

router.route('/notifications/settings/tags/:tagId')
  .post(
    auth.keycloak.protect(),
    async (req, res, next) => {
      try {
        // this endpoint will toggle the subscription of a user to a tag
        const userId = req.session.user._id.toString()
        // get the user data
        const user = await User.get({ _id: userId }, true)
        if (user.fields && !user.fields.tags) {
          user.fields.tags = [req.params.tagId]
          user.markModified('fields')
          await user.save()
          return res.json({
            added: true
          })
        }

        const tagIndex = user.fields.tags.indexOf(req.params.tagId)
        if (tagIndex === -1) {
          user.fields.tags.push(req.params.tagId)
        } else {
          user.fields.tags.splice(tagIndex, 1)
        }
        user.markModified('fields')
        await user.save()

        return res.json({
          userTags: user.fields.tags,
          added: tagIndex === -1
        })
      } catch (err) {
        next(err)
      }
    }
  )

router.route('/notifications/settings/authors/:authorId')
  .post(
    auth.keycloak.protect(),
    async (req, res, next) => {
      try {
        // this endpoint will toggle the subscription of a user to a tag
        const userId = req.session.user._id.toString()
        // get the user data
        const user = await User.get({ _id: userId }, true)
        if (user.fields && !user.fields.authors) {
          user.fields.authors = [req.params.authorId]
          user.markModified('fields')
          await user.save()
          return res.json({
            added: true
          })
        }

        const authorIndex = user.fields.authors.indexOf(req.params.authorId)
        if (authorIndex === -1) {
          user.fields.authors.push(req.params.authorId)
        } else {
          user.fields.authors.splice(authorIndex, 1)
        }
        user.markModified('fields')
        await user.save()

        return res.json({
          added: authorIndex === -1
        })
      } catch (err) {
        next(err)
      }
    }
  )

router.route('/notifications/settings/tagsNotification')
  .post(
    auth.keycloak.protect(),
    async (req, res, next) => {
      try {
        // this endpoint will toggle the subscription of a user to a tag
        const userId = req.session.user._id.toString()
        // get the user data
        const user = await User.get({ _id: userId }, true)

        if (!user.fields && !user.fields.tagsNotification) {
          console.log('hola?')
          user.fields.tagsNotification = true
          user.markModified('fields')
          await user.save()
        }
        console.dir(user.fields)
        user.fields.tagsNotification = !user.fields.tagsNotification
        user.markModified('fields')
        await user.save()
        console.dir(user.fields)

        return res.json({
          tagsNotification: user.fields.tagsNotification
        })
      } catch (err) {
        next(err)
      }
    }
  )

router.route('/notifications/settings/popularNotification')
  .post(
    auth.keycloak.protect(),
    async (req, res, next) => {
      try {
        // this endpoint will toggle the subscription of a user to a tag
        const userId = req.session.user._id.toString()
        // get the user data
        const user = await User.get({ _id: userId }, true)

        if (!user.fields && !user.fields.popularNotification) {
          user.fields.popularNotification = true
          user.markModified('fields')
          await user.save()
        }

        user.fields.popularNotification = !user.fields.popularNotification
        user.markModified('fields')
        await user.save()

        return res.json({
          popularNotification: user.fields.popularNotification
        })
      } catch (err) {
        next(err)
      }
    }
  )

router.route('/notifications/settings/authors/:authorId/check')
  .get(
    auth.keycloak.protect(),
    async (req, res, next) => {
      try {
        const userId = req.session.user._id.toString()
        const authorExists = await User.query({ _id: userId, 'fields.authors': req.params.authorId }, false)
        return res.json({
          isSubscribed: authorExists.length > 0
        })
      } catch (err) {
        next(err)
      }
    }
  )

module.exports = router
