const axios = require('axios')
const xml2js = require('xml2js')
const map = require('lodash/map')
const parse = require('date-fns/parse')
const formatISO = require('date-fns/formatISO')

const convertToISODateTime = (date, time) => {
  return formatISO(parse(`${date} ${time || '00:00'}`, 'dd.MM.yyyy HH:mm', new Date()))
}

class SybosEquipmentSource {
  static defaultOptions() {
    return {
      baseUrl: process.env.SOURCE_SYBOS_URL || 'https://sybos.ooelfv.at/sybServices',
      token: process.env.SOURCE_SYBOS_TOKEN,
      typeName: 'SybosEquipment',
      pageSize: 100,
      maxPages: null,
    }
  }

  constructor(api, options) {
    this.api = api
    this.options = options
    
    api.loadSource(async actions => {
      await this.fetchData(actions)
    })
  }

  async fetchData(actions) {
    actions.addSchemaTypes(`
      type ${this.options.typeName} implements Node {
        klasse1: String
        klasse2: String
        klasse3: String
        bezeichnung: String
        abteilung: String
        anschaffung: String
        Lagerort: String
        LagerortDetail: String
        veroeffentltitel: String
        veroeffentltxt: String
        images: [SybosImage]
      }
    `)
    
    const equipmentCollection = actions.addCollection({
      typeName: this.options.typeName,
    })

    let currentPage = 0
    let data = null

    do {
      const res = await axios.get(`${this.options.baseUrl}/xmlGeraet.php`, {
        params: {
          token: this.options.token,
          a: this.options.pageSize,
          f: currentPage * this.options.pageSize,
        },
        responseType: 'text'
      })

      data = await xml2js.parseStringPromise(res.data)

      if (data.error) {
        throw new Error('Could not fetch SyBOS equipment, check your credentials')
      }

      if (typeof data.items.item === 'undefined' || data.items.item[0] === '') {
        break
      }

      for (const item of data.items.item) {
        const images = []

        if (typeof item.images[0].item !== 'undefined') {
          for (const image of item.images[0].item) {
            images.push({
              description: image.description[0],
              thumb: image.thumb[0],
              medium: image.medium[0],
            })
          }
        }

        const node = {}

        for (const key of Object.keys(item)) {
          node[key] = item[key][0]
        }

        equipmentCollection.addNode({
          id: item.id[0],
          ...node,
          images,
        })
      }

      currentPage++
    } while ((!this.options.maxPages || currentPage < this.options.maxPages))
  }
}

module.exports = SybosEquipmentSource
