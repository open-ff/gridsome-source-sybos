const axios = require('axios')
const xml2js = require('xml2js')
const map = require('lodash/map')
const parse = require('date-fns/parse')
const formatISO = require('date-fns/formatISO')

const convertToISODateTime = (date, time) => {
  return formatISO(parse(`${date} ${time || '00:00'}`, 'dd.MM.yyyy HH:mm', new Date()))
}

class SybosOperationsSource {
  static defaultOptions() {
    return {
      baseUrl: process.env.SOURCE_SYBOS_URL || 'https://sybos.ooelfv.at/sybServices',
      token: process.env.SOURCE_SYBOS_TOKEN,
      typeName: 'SybosOperation',
      pageSize: 100,
      maxPages: null,
      refs: {},
    }
  }

  constructor(api, options) {
    this.api = api
    this.options = options
    
    api.loadSource(async actions => {
      actions.addSchemaTypes(`
        type ${this.options.typeName} implements Node @infer {
          title: String
          year: String
          commander: String
          alertDate: String
          alertBy: String
          startDate: String
          endDate: String
          duration: String
          type: String
          department: String
          city: String
          deploymentSiteName: String
          personnelCount: Int
          totalPersonnelHours: Float
          category: String
          content: String
          organizations: [SybosOrganization!]!
          vehicles: [SybosVehicle!]!
          images: [SybosImage!]!
          ${map(this.options.refs, (value, key) => {
            return `${key}: ${value}`
          }).join('\n')}
        }
      `)

      await this.fetchData(actions)
    })
  }

  async fetchData(actions) {
    const sybosOperations = actions.addCollection({
      typeName: this.options.typeName
    })

    let currentPage = 0
    let data = null

    do {
      const res = await axios.get(`${this.options.baseUrl}/xmlEinsatz.php`, {
        params: {
          token: this.options.token,
          a: this.options.pageSize,
          f: currentPage * this.options.pageSize
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
        this.addToCollection(sybosOperations, item)
      }

      currentPage++
    } while (typeof data.items.item !== 'undefined' && data.items.item[0] !== '' && (!this.options.maxPages || currentPage < this.options.maxPages))
  }

  addToCollection(collection, item) {
    const organizations = []
    const vehicles = []
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

    if (typeof item.Organisationen[0].Organisation !== 'undefined') {
      for (const organization of item.Organisationen[0].Organisation) {
        organizations.push({
          description: organization.Bezeichnung[0],
          name: organization.Name[0],
          count: organization.Anzahl[0] ? parseInt(organization.Anzahl[0], 10) : null,
        })
      }
    }

    if (typeof item.Fahrzeuge[0].Fahrzeug !== 'undefined') {
      for (const vehicle of item.Fahrzeuge[0].Fahrzeug) {
        vehicles.push({
          name: vehicle.Titel[0],
          label: vehicle.Bezeichnung[0],
          categories: [
            vehicle.Klasse1[0],
            vehicle.Klasse2[0],
            vehicle.Klasse3[0],
          ],
        })
      }
    }

    collection.addNode({
      id: item.id[0],
      title: item.veroeffentltitel[0],
      year: item.LeitstelleJahr[0],
      commander: item.Einsatzleiter[0],
      alertDate: convertToISODateTime(item.alarmierung[0], item.alarmierungt[0]),
      alertBy: item.alarmierungdurch[0],
      startDate: convertToISODateTime(item.von[0], item.vont[0]),
      endDate: convertToISODateTime(item.bis[0], item.bist[0]),
      duration: item.Dauer[0],
      type: item.art[0],
      department: item.abteilung[0],
      city: item.einsatzort[0],
      deploymentSiteName: item.ortkurz[0],
      personnelCount: parseInt(item.mannschaft[0], 10),
      totalPersonnelHours: parseFloat(item.Dauer[0].replace(',', '.')) * parseInt(item.mannschaft[0], 10),
      category: item.kategorie[0],
      // content: item.veroeffentltxt[0],
      organizations,
      vehicles,
      images,
      internal: {
        content: item.veroeffentltxt[0],
        mimeType: 'text/markdown',
        origin: `operations/${item.id[0]}`,
      }
    })
  }
}

module.exports = SybosOperationsSource
