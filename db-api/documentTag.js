const DocumentTag = require('../models/documentTag')
const { ErrNotFound } = require('../services/errors')

exports.get = function get (query) {
  return DocumentTag.findOne(query)
}

exports.getAll = function getAll (query) {
  return DocumentTag.find(query)
}

exports.loadIfNotExists = function loadIfNotExists (query) {
  const count = DocumentTag.count({})

  if (count > 0)
    throw new Exception(`There are already ${count} document tags loaded in the database.`)

  const categorías = [
    'Ambiente',
    'Ciencia y tecnología',
    'Economía y finanzas',
    'Comercio',
    'Cultura',
    'Deporte',
    'Derechos Humanos',
    'Discapacidad',
    'Educación',
    'Federalización',
    'Género y diversidad',
    'Homenajes y reconocimientos',
    'Impuestos y servicios',
    'Industria',
    'Internacional',
    'Justicia',
    'Legislación Penal',
    'Libertad de expresión',
    'Mercosur',
    'Modernización y transparencia',
    'Obras públicas',
    'Previsión social',
    'Salud',
    'Seguridad',
    'Trabajo',
    'Transporte',
    'Turismo',
    'Agricultura, ganadería, minería y pesca (o actividades primarias)'
  ]

  return DocumentTag.insertMany(categorías.map(c => { return { name: c } }))
    .then(() => {
      console.log("DocumentTags loaded")
      return this.getAll()
    }).catch((error) => {
      console.log("DocumentTags load error")
      console.log(error)
    });
}

/*exports.create = function create (data) {
  return (new DocumentTag(data)).save()
}

exports.remove = function remove (id) {
  return DocumentTag.findById(id)
    .then((like) => {
      if (!like) throw ErrNotFound('DocumentTag to remove not found')
      return like.remove()
    })
}*/
