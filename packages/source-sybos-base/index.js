class SybosBaseSource {
  static defaultOptions() {
    return {}
  }

  constructor(api, options) {
    api.loadSource(async actions => {
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
      `)
    })
  }
}

module.exports = SybosBaseSource
