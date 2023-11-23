const Ajv = require('ajv')
// const localize = require('ajv-i18n')
const ajv = Ajv({ allErrors: true })
const Error = require('./errors')
const log = require('./logger')

const isSchemaValid = (schema) => {
  let validSchema = ajv.validateSchema(schema)
  // console.log('Is this valid? ' + validSchema)
  // console.log(ajv.errorsText(validSchema.errors, { separator: '\n' }))
  log.debug({ validSchema: validSchema })
  if (!validSchema) throw Error.ErrInvalidJSONSchema(ajv.errors)
}

const isDataValid = async (docTypeFields, data) => {
  // ajv: Another JSON Schema Validator - https://www.npmjs.com/package/ajv
  let validate = ajv.compile({
    properties: docTypeFields.properties,
    additionalProperties: false,
    required: docTypeFields.required
  })
  let valid = await validate(data)
  log.debug({ validData: valid })
  if (!valid) throw Error.ErrInvalidData(validate.errors)
  return true
}

module.exports = {
  isSchemaValid,
  isDataValid
}
