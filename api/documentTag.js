const status = require('http-status')
const express = require('express')
const DocumentTag = require('../db-api/documentTag')
const router = express.Router()
const auth = require('../services/auth')
const middlewares = require('../services/middlewares')
const log = require('../services/logger')

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
        let results = await DocumentTag.getAll()
        if (results.length == 0)
          results = await DocumentTag.loadIfNotExists()
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
      results = await DocumentTag.create(req.body)
      res.status(status.OK).json({
        results: results
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
    await DocumentTag.remove(req.params.id)
    res.json({ message: 'tag borrada exitosamente' })
    res.status(status.OK)
  } catch (err) {
    next(err)
  }
})

module.exports = router
