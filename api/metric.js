const status = require('http-status')
const express = require('express')
const { Types: { ObjectId } } = require('mongoose')
const Document = require('../db-api/document')
const DocumentTag = require('../db-api/documentTag')
const DocumentVersion = require('../db-api/documentVersion')
const Community = require('../db-api/community')
const Comment = require('../db-api/comment')
const CustomForm = require('../db-api/customForm')
const Like = require('../db-api/like')
const ApoyoToken = require('../db-api/apoyoToken')
const User = require('../db-api/user')
const router = express.Router()
const auth = require('../services/auth')
const errors = require('../services/errors')
const notifier = require('../services/notifier')
const middlewares = require('../services/middlewares')
const utils = require('../services/utils')
const json2xls = require('json2xls')
const svgCaptcha = require('svg-captcha');
const crypto = require('crypto');
const log = require('../services/logger')
const { v4: uuidv4 } = require('uuid');

/**
 * @apiDefine admin User access only
 * User must be an admin (Keycloak)
 */

/**
 * @apiDefine accountable Accountable members only
 * User must be a member of the Accountable group (Keycloak)
 */

/**
 * @apiDefine authenticated Must be authenticated
 * User must be authenticated before accessing (Keycloak)
 */


router.route('/documentByAuthors')
    /**
       * @api {get} /metric List
       * @apiName getMetrics
       * @apiDescription Returns Metric
       * @apiGroup Metric
       */
    .get(
        async (req, res, next) => {
            try {

                const listUsers = await User.list({ roles: { $in: 'accountable' } }, {
                    limit: 1000,
                    page: 1,
                }, false)

                const userWithDocumentsCount = await Promise.all(
                    listUsers.docs.map(async user => {
                        const usertoReturn = JSON.parse(JSON.stringify(user))
                        usertoReturn.documentsCount = await Document.countAuthorDocuments(user._id)
                        return usertoReturn
                    })

                )

                listUsers.docs = userWithDocumentsCount

                res.status(status.OK).json({
                    results: listUsers,

                })
            } catch (err) {
                next(err)
            }
        })


router.route('/documentByTags')
    /**
       * @api {get} /metric List
       * @apiName getMetrics
       * @apiDescription Returns Metric
       * @apiGroup Metric
       */
    .get(
        async (req, res, next) => {
            try {

                const resultTags = await DocumentTag.getAll()
                const results = await Document.retrieve({})

                const tagsWithDocumentCount = resultTags.map(tag => {
                    const tagToReturn = JSON.parse(JSON.stringify(tag))
                    tagToReturn.documentCount = results.filter(doc => {
                        if (doc.currentVersion.content.tags) {
                            return doc.currentVersion.content.tags.includes(tag._id.toString())
                        }
                    }).length
                    return tagToReturn
                })


                res.status(status.OK).json({
                    tagsWithDocumentCount

                })
            } catch (err) {
                next(err)
            }
        })


module.exports = router