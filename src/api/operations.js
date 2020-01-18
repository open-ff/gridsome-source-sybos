const axios = require('axios')
const xml2js = require('xml2js')
const parse = require('date-fns/parse')
const formatISO = require('date-fns/formatISO')
const upperFirst = require('lodash/upperFirst')
const map = require('lodash/map')

class SybosOperations {
  static defaultOptions() {
    return {
      typeName: 'SybosOperation',
      maxPages: null,
      pageSize: 500,
    }
  }

  constructor(client, api, options) {
    this.client = client
    this.api = api
    this.options = options

    this.api.loadSource(async actions => {

    })
  }
}

module.exports = Operations
