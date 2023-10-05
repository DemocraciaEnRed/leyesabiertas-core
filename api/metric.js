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
const svgCaptcha = require('svg-captcha')
const crypto = require('crypto')
const log = require('../services/logger')
const { v4: uuidv4 } = require('uuid')

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

function escapeTxt(text) {
  if (!text) return ''

  return text
    .toString()
    .replace(/"/g, '\'')
    .replace(/\r/g, '')
    .replace(/\n/g, '')
    .trim()
}

function formatXlsDate(date) {
  if (!date) return ''
  // if it is a string, conver to date
  if (typeof date === 'string') {
    date = new Date(date)
  }

  let isoStr = date.toISOString() // '2020-08-28T15:30:07.185Z'
  let mainParts = isoStr.split('T') // [ 2020-08-28 , 15:30:07.185Z ]
  let timeParts = mainParts[1].split('.') // [ 15:30:07 , 185Z ]

  return `${mainParts[0]} ${timeParts[0]}`.trim() // '2020-08-28 15:30:07'
}

function formatXlsNameDate(date) {
  if(!date) return ''
  // if it is a string, conver to date
  if (typeof date === 'string') {
    date = new Date(date)
  }
  let isoStr = date.toISOString() // '2020-08-28T15:30:07.185Z' 
  let mainParts = isoStr.split('T') // [ 2020-08-28 , 15:30:07.185Z ]
  let timeParts = mainParts[1].split('.') // [ 15:30:07 , 185Z ]
  // replace - with _ and : with _
  
  return `${mainParts[0].replace(/-/g, '')}-${timeParts[0].replace(/:/g, '_')}`.trim() // '2020_08_28-15_30_07'
}

router.route('/documentByAuthors')
  /**
         * @api {get} /metric List
         * @apiName getMetrics
         * @apiDescription Returns Metric
         * @apiGroup Metric
         */
  .get(
    auth.keycloak.protect('realm:admin'),
    async (req, res, next) => {
      try {
        let yearCreatedAt = req.query.year
        const authorsAndDocuments = await Document.countDocumentsPerAuthor(yearCreatedAt)
        return res.json(authorsAndDocuments)
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
    auth.keycloak.protect('realm:admin'),
    async (req, res, next) => {
      try {
        let tagsQuery = null
        let yearCreatedAt = req.query.year || null
        let allTags = null

        let resData = {
          tags: [],
          withoutTags: {
            count: 0,
            documents: []
          }
        }
        if (req.query.tags) {
          tagsQuery = req.query.tags.split(',')
        }
        if (!tagsQuery) {
          // if no tags in query, then we have to get all tags
          allTags = await DocumentTag.getAll().lean()
          //   console.log(allTags)
          //   tagsArray = allTags.map((tag) => tag._id.toString())
          //   console.log(tagsArray)
          for (let i = 0; i < allTags.length; i++) {
            const documentsWithThisTag = await Document.getAllDocumentsWithTags([allTags[i]._id.toString()], yearCreatedAt)
            resData.tags.push({
              name: allTags[i].name,
              key: allTags[i].key,
              id: allTags[i]._id.toString(),
              documentsCount: documentsWithThisTag.length,
              documents: documentsWithThisTag
            })
          }

          // sort by documentsCount
          resData.tags.sort((a, b) => {
            return b.documentsCount - a.documentsCount
          })

          const documentsWithoutTags = await Document.getAllDocumentsWithoutTags(yearCreatedAt)
          resData.withoutTags = {
            count: documentsWithoutTags.length,
            documents: documentsWithoutTags
          }
          return res.json(resData)
        }
        // const tagsAndDocuments = await Document.countDocumentsPerTag(tagsQuery, yearCreatedAt)

        return res.json({})
      } catch (err) {
        next(err)
      }
    })

router.route('/users')
  .get(
    auth.keycloak.protect('realm:admin'),
    async (req, res, next) => {
      let yearCreatedAt = req.query.year || null
      let months = req.query.months || 1

      try {
        const totalUsers = await User.getCountOfUsers(yearCreatedAt)
        const totalCommonUsers = await User.getCountOfUsersWithoutRolesAdminAndAccountable(yearCreatedAt)
        const totalActiveUsers = await User.getCountOfActiveUsersInTheLastXMonth(months)
        return res.json({
          totalUsers,
          totalCommonUsers,
          totalActiveUsers
        })
      } catch (err) {
        next(err)
      }
    }
  )

router.route('/usersByRole')
  .get(
    auth.keycloak.protect('realm:admin'),
    async (req, res, next) => {
      try {
        const totalAdminUsers = await User.getCountOfUsersByRole('admin')
        const totalAccountableUsers = await User.getCountOfUsersByRole('accountable')
        const adminUsers = await User.getUsersByRole('admin')
        const accountableUsers = await User.getUsersByRole('accountable')
        return res.json({
          totalAdminUsers,
          totalAccountableUsers,
          adminUsers,
          accountableUsers
        })
      } catch (err) {
        next(err)
      }
    }
  )

router.route('/interactions')
  .get(
    auth.keycloak.protect('realm:admin'),
    async (req, res, next) => {
      try {
        let yearCreatedAt = req.query.year || null
        let tag = req.query.tag || null
        let author = req.query.author || null
        const result = await Document.getCountOfCommentsAndLikesPerDocument(yearCreatedAt, tag, author)
        return res.json(result)
      } catch (err) {
        next(err)
      }
    }
  )

router.route('/interactions/xls')
  .get(
    auth.keycloak.protect('realm:admin'),
    async (req, res, next) => {
      try {
        // let yearCreatedAt = req.query.year || null
        const result = await Document.getCountOfCommentsAndLikesPerDocument()
        const xlsData = result.map((project) => {
          return {
            'id': project.documentId,
            'titulo': project.title,
            'version': project.version,
            'tags': project.tags ? (project.tags.length > 0 ? project.tags.map((tag) => tag.name).join(', ') : '(Sin tags)') : '(Sin tags)',
            'autorNombre': project.author.fullname,
            'autorEmail': project.author.email,
            'apoyos': project.apoyosCount,
            'likes': project.likesCount,
            'comentariosFundamentos': project.commentsFundationCount,
            'comentariosAportesArticulado': project.commentsArticlesCount,
            'totalInteracciones': project.totalInteraction,
            'fechaCreacion': formatXlsDate(project.createdAt),
            'fechaCierre': project.closingDate ? formatXlsDate(project.closingDate) : '-'
          }
        })
        const todayDate = new Date()
        const xlsDateName = formatXlsNameDate(todayDate)
        return res.xls(xlsDateName + '_proyectos-interacciones.xlsx', xlsData)
      } catch (err) {
        next(err)
      }
    }
  )

router.route('/users/xls')
  .get(
    auth.keycloak.protect('realm:admin'),
    async (req, res, next) => {
      try {
        const users = await User.getAll()
        const xlsData = users.map((user) => {
          return {
            'id': user._id.toString(),
            'nombre': user.names,
            'apellido': user.surnames,
            'nombreCompleto': user.fullname,
            'email': user.email,
            'ocupacion': user.fields && user.fields.occupation ? user.fields.occupation : '(Sin completar)',
            'genero': user.fields && user.fields.gender ? user.fields.gender : '(Sin completar)',
            'fechaNacimiento': user.fields && user.fields.birthdate ? user.fields.birthdate : '(Sin completar)',
            'provincia': user.fields && user.fields.province ? user.fields.province : '(Sin completar)',
            'partido': user.fields && user.fields.party ? user.fields.party : '(Sin completar)',
            'notificaciones_activadas': user.fields.tagsNotification ? 'Si' : 'No',
            'fechaCreacion': formatXlsDate(user.createdAt),
            'fechaActualizacion': formatXlsDate(user.updatedAt),
            'fechaUltimoLogin': formatXlsDate(user.lastLogin)
          }
        })
        const todayDate = new Date()
        const xlsDateName = formatXlsNameDate(todayDate)
        return res.xls(xlsDateName + '_usuarios.xlsx', xlsData)
      } catch (err) {
        next(err)
      }
    }
  )

module.exports = router
