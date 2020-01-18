class SybosSource {
    static defaultOptions() {
        return {
            // 
        }
    }

    constructor(api, options) {
        this.api = api
        this.options = options

        api.loadSource(async actions => {
            // await this.loadFeed(actions)
        })
    }
}

module.exports = SybosSource