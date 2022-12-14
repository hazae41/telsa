import { Binary } from "@hazae41/binary"
import { Handshake } from "mods/binary/handshakes/handshake.js"
import { ServerDHParams } from "mods/binary/handshakes/server_key_exchange/server_dh_params.js"

export class ServerKeyExchange2Anonymous {
  readonly #class = ServerKeyExchange2Anonymous

  static type = Handshake.types.server_key_exchange

  constructor(
    readonly params: ServerDHParams
  ) { }

  get class() {
    return this.#class
  }

  static read(binary: Binary, length: number) {
    const start = binary.offset

    const params = ServerDHParams.read(binary)

    if (binary.offset - start !== length)
      throw new Error(`Invalid ${this.name} length`)

    return new this(params)
  }
}