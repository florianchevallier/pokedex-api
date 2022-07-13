/* eslint-disable @typescript-eslint/explicit-member-accessibility */
import NodeCache from 'node-cache'

class PokeAPIOptions {
  /** The protocol to be used
   * @default 'https'
   */
  protocol?: 'https' | 'http'

  /** The hostname of the PokeAPI instance
   * @default 'pokeapi.co'
   */
  hostName?: string

  /** The version path of the API
   * @default '/api/v2/'
   */
  versionPath?: string

  /** The offset to be used in list requests
   * @default 0
   */
  offset?: number

  /** The limit to be used in list requests
   * @default 100000
   */
  limit?: number

  /** The timeout of a response in milliseconds
   * @default 10 * 1000 // (10 seconds)
   */
  timeout?: number

  /** The limit of the cache in milliseconds
   * @default 1000000 * 1000 // (11 days)
   */
  cacheLimit?: number

  /** The version path of the API (e.g. '/api/v2/') */
  cache?: NodeCache

  /* eslint-disable default-param-last */
  constructor(config: PokeAPIOptions = {}, cache: NodeCache) {
    this.protocol = 'https'
    this.hostName = '://pokeapi.co'
    this.versionPath = '/api/v2/'
    this.offset = 0
    this.limit = 100000
    this.timeout = 10 * 1000 // 10 seconds
    this.cacheLimit = 1000000 * 1000 // 11 days
    this.cache = cache

    if (config.protocol) {
      this.protocol = config.protocol
    }
    if (config.hostName) {
      this.hostName = `://${config.hostName}`
    }
    if (config.versionPath) {
      this.versionPath = config.versionPath
    }
    if (config.offset) {
      this.offset = config.offset - 1
    }
    if (config.limit) {
      this.limit = config.limit
    }
    if (config.timeout) {
      this.timeout = (config as PokeAPIOptions).timeout
    }
    if (config.cacheLimit) {
      this.cacheLimit = (config as PokeAPIOptions).cacheLimit
    }
  }
}

export default PokeAPIOptions
