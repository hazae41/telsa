import { Binary } from "@hazae41/binary"
import { Handshake } from "mods/binary/handshakes/handshake.js"

export class Finished2 {
  readonly #class = Finished2

  static type = Handshake.types.finished

  constructor(
    readonly verify_data: Uint8Array
  ) { }

  get class() {
    return this.#class
  }

  get type() {
    return this.#class.type
  }

  size() {
    return this.verify_data.length
  }

  write(binary: Binary) {
    binary.write(this.verify_data)
  }

  handshake() {
    return new Handshake<Finished2>(this.type, this)
  }

  export() {
    const binary = Binary.allocUnsafe(this.size())
    this.write(binary)
    return binary.buffer
  }
}