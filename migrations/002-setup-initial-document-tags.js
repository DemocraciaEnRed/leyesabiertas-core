// const mongoose = require('mongoose')
const Migration = require('../models/migration')
const log = require('../services/logger')
// Add the models that the migration will use
const DocumentTag = require('../models/documentTag')

// Define the migration
module.exports = {
  async run () {
    // Check if the migration has already been applied
    const migrationName = 'setup-initial-document-tags' // Replace with your migration name
    const existingMigration = await Migration.findOne({ name: migrationName })

    if (existingMigration) {
      // Already applied, skip
      return
    }
    log.info(`* Running migration ${migrationName}`)

    // Migration logic

    // get all the documentTags from the db
    // if it is an existing db, there will be some documentTags
    const allDocumentTags = await DocumentTag.find({})

    // if there are no documentTags, add the initial ones
    if (allDocumentTags.length === 0) {
      const categorias = [
        { name: 'Ambiente', key: 'ambiente' },
        { name: 'Ciencia y tecnología', key: 'ciencia-tecnologia' },
        { name: 'Economía y finanzas', key: 'economia' },
        { name: 'Comercio', key: 'comercio' },
        { name: 'Cultura', key: 'cultura' },
        { name: 'Deporte', key: 'deporte' },
        { name: 'Derechos Humanos', key: 'derechos-humanos' },
        { name: 'Discapacidad', key: 'discapacidad' },
        { name: 'Educación', key: 'educacion' },
        { name: 'Federalización', key: 'federalizacion' },
        { name: 'Género y diversidad', key: 'genero-diversidad' },
        { name: 'Homenajes y reconocimientos', key: 'homenajes' },
        { name: 'Impuestos y servicios', key: 'impuestos' },
        { name: 'Industria', key: 'industria' },
        { name: 'Internacional', key: 'internacional' },
        { name: 'Justicia', key: 'justicia' },
        { name: 'Legislación Penal', key: 'legislacion' },
        { name: 'Libertad de expresión', key: 'libertad' },
        { name: 'Mercosur', key: 'mercosur' },
        { name: 'Modernización y transparencia', key: 'modernizacion-transparencia' },
        { name: 'Obras públicas', key: 'obras-publicas' },
        { name: 'Previsión social', key: 'prevision-social' },
        { name: 'Salud', key: 'salud' },
        { name: 'Seguridad', key: 'seguridad' },
        { name: 'Trabajo', key: 'trabajo' },
        { name: 'Transporte', key: 'transporte' },
        { name: 'Turismo', key: 'turismo' },
        { name: 'Agricultura, ganadería, minería y pesca (o actividades primarias)', key: 'agricultura' },
        { name: 'Foro Legislativo Ambiental', key: 'foro-legislativo-ambiental' }
      ]
      // create documentTags
      for (let index = 0; index < categorias.length; index++) {
        const categoria = categorias[index]
        await DocumentTag.create({
          name: categoria.name,
          key: categoria.key
        })
      }
    }

    // Insert a record in the migration table to mark it as applied
    await Migration.create({ name: migrationName, timestamp: Date.now() })
    // End of migration
    log.info(`*- Migration ${migrationName} finished`)
  }
}
