const SybosOperations = require('./api/operations')
const axios = require('axios')
const merge = require('lodash/merge')

class SybosSource {
  static defaultOptions() {
    return {
      token: null,
      baseUrl: 'https://sybos.ooelfv.at/sybServices/',
      operations: {
        enabled: false,
      },
      events: {
        enabled: false,
      },
      personnel: {
        enabled: false,
      },
      equipment: {
        enabled: false,
      },
      departments: {
        enabled: false,
      },
      metadata: {
        enabled: false,
      },
    }
  }

  constructor(api, options) {
    this.api = api
    this.options = options
    this.client = axios.create({
      baseUrl: options.baseUrl,
      params: {
        token: options.token,
      }
    })

    api.loadSource(async actions => {
      this.addCommonSchemaTypes(actions)
    })

    // TODO: Conditionally enable APIs, all APIs are default off
    if (options.operations.enabled) {
      new SybosOperations(
        this.client,
        api,
        merge({}, SybosOperations.defaultOptions(), options.operations)
      )
    }
  }

  addCommonSchemaTypes(actions) {
    actions.addSchemaTypes(`
      type SybosImage {
        description: String
        thumb: String!
        medium: String!
      }

      type SybosVehicle {
        name: String!
        label: String!
        categories: [String!]!
      }

      type SybosOrganization {
        description: String!
        name: String!
        count: Int!
      }

      type SybosDepartment {
        ABnr: String
        ABrefabnr: String
        ABname: String
        ABlang: String
        ABstrasse: String
        ABlkz: String
        ABplz: String
        ABort: String
        ABtel: String
        ABfax: String
        ABemail: String
        ABinternet: String
        ABpstname: String
        ABpstname2: String
        ABpststrasse: String
        ABpstlkz: String
        ABpstplz: String
        ABpstort: String
        ABgruppe: String
        ABgruendung: String
        image1: SybosImage
        image2: SybosImage
        image3: SybosImage
      }
      
      type Metadata @infer {
        sybosDepartment: SybosDepartment!
      }
    `)
  }
}

module.exports = SybosSource
