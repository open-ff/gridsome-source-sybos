const axios = require('axios')
const xml2js = require('xml2js')

class SybosDepartmentMetadata {
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
      actions.addSchemaTypes(`
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

      const res = await axios.get(`${this.options.baseUrl}/xmlAbteilung.php`, {
        params: {
          token: this.options.token,
          a: 1
        },
        responseType: 'text'
      })
    
      const data = await xml2js.parseStringPromise(res.data)
    
      if (data.error) {
        throw new Error('Could not fetch SyBOS operations, check your credentials')
      }
    
      if (typeof data.items.item === 'undefined' || data.items.item[0] === '') {
        return
      }
  
      const node = {}

      for (let key of Object.keys(data.items.item[0])) {
        node[key] = data.items.item[0][key][0] || null
      }
    
      const parseImage = (imageNode) => {
        const out = {}
    
        for (const key of Object.keys(imageNode)) {
          out[key] = imageNode[key][0]
        }
    
        return out
      }
    
      actions.addMetadata('sybosDepartment', {
        id: node.ABnr,
        ...node,
        image1: parseImage(node.image1.item[0]),
        image2: parseImage(node.image2.item[0]),
        image3: parseImage(node.image3.item[0]),
      })
    })
  }
}

module.exports = SybosDepartmentMetadata
