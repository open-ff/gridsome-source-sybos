const axios = require('axios')
const xml2js = require('xml2js')

class SybosPersonnelMetadata {
  static defaultOptions() {
    return {
      baseUrl: process.env.SOURCE_SYBOS_URL || 'https://sybos.ooelfv.at/sybServices',
      token: process.env.SOURCE_SYBOS_TOKEN,
    }
  }

  constructor(api, options) {
    this.api = api
    this.options = options

    this.api.loadSource(async actions => {
      const { data } = await axios.get(`${this.options.baseUrl}/API/Personal.php`, {
        params: {
          token: this.options.token,
          json: '1',
        }
      })

      if (typeof data !== 'object') {
        throw new Error('Could not fetch SyBOS personnel, check your credentials')
      }
    
      actions.addMetadata('sybosPersonnelStatistics', data.item)
    })
  }
}

module.exports = SybosPersonnelMetadata
