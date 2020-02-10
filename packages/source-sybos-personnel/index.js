const axios = require('axios')

class SybosPersonnelSource {
  static defaultOptions() {
    return {
      baseUrl: process.env.SOURCE_SYBOS_URL || 'https://sybos.ooelfv.at/sybServices',
      token: process.env.SOURCE_SYBOS_TOKEN,
      typeName: 'SybosPersonal',
      type: 'MITGLIEDER',
      groupTypeNumber: null,
      groupNumber: null,
      sort: null,
    }
  }

  constructor(api, options) {
    this.api = api
    this.options = options
    
    api.loadSource(async actions => {
      actions.addSchemaTypes(`
        type ${this.options.typeName} implements Node {
          Nachname: String
          Vorname: String
          Titel1: String
          Titel2: String
          Dienstgrad: String
          Gruppe: String
          Dienststelle: String
          Email1: String
          Email2: String
          Mobil1: String
          Mobil2: String
          Foto: String
          GRnr: String
          Funktionen: String
        }
      `)

      await this.fetchData(actions)
    })
  }

  async fetchData(actions) {
    const personnelCollection = actions.addCollection({
      typeName: this.options.typeName,
    })

    const { data } = await axios.get(`${this.options.baseUrl}/API/Personal.php`, {
      params: {
        token: this.options.token,
        json: '1',
        Art: this.options.type,
        ...(this.options.groupTypeNumber !== null ? { GTnr: this.options.groupTypeNumber } : {}),
        ...(this.options.groupNumber !== null ? { GRnr: this.options.groupNumber } : {}),
        ...(this.options.sort !== null ? { sort: this.options.sort } : {}),
        a: 500
      }
    })

    if (typeof data !== 'object') {
      throw new Error('Could not fetch SyBOS personnel, check your credentials')
    }

    for (const item of data.item) {
      personnelCollection.addNode({
        id: item.ID,
        ...item,
      })
    }
  }
}

module.exports = SybosPersonnelSource
