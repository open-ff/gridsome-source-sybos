const axios = require('axios')
const xml2js = require('xml2js')
const parse = require('date-fns/parse')
const formatISO = require('date-fns/formatISO')

const convertToISODateTime = (date, time) => {
  return formatISO(parse(`${date} ${time || '00:00'}`, 'dd.MM.yyyy HH:mm', new Date()))
}

class SybosEventsSource {
  static defaultOptions() {
    return {
      baseUrl: process.env.SOURCE_SYBOS_URL || 'https://sybos.ooelfv.at/sybServices',
      token: process.env.SOURCE_SYBOS_TOKEN,
      typeName: 'SybosEvent',
      type: 'future',
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
        von: String
        vont: String
        bis: String
        bist: String
        referat: String
        bezeichnung1: String
        bezeichnung2: String
        ort: String
        inhalt: String
        voraussetzung: String
        kosten: String
        abteilung: String
        veroeffentltitel: String
        veroeffentltxt: String
        images: [SybosImage]
        startISO: String
        endISO: String
      }
    `)

    const eventsCollection = actions.addCollection({
      typeName: this.options.typeName,
    })

    let currentPage = 0
    let data = null

    do {
      const res = await axios.get(`${this.options.baseUrl}/xmlVeranstaltung.php`, {
        params: {
          token: this.options.token,
          z: this.options.type,
          a: this.options.pageSize,
          f: currentPage * this.options.pageSize,
        },
        responseType: 'text'
      })

      data = await xml2js.parseStringPromise(res.data)

      if (data.error) {
        throw new Error('Could not fetch SyBOS operations, check your credentials')
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

        eventsCollection.addNode({
          id: item.id[0],
          ...node,
          images,
          startISO: convertToISODateTime(node.von, node.vont),
          endISO: convertToISODateTime(node.bis, node.bist),
          internal: {
            content: item.veroeffentltxt[0],
            mimeType: 'text/markdown',
            origin: `operations/${item.id[0]}`,
          }
        })
      }

      currentPage++
    } while ((!this.options.maxPages || currentPage < this.options.maxPages))
  }
}

module.exports = SybosEventsSource
