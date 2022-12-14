import { Binary } from "@hazae41/binary"

export class Opaque {
  readonly #class = Opaque

  constructor(
    readonly bytes: Uint8Array
  ) { }

  get class() {
    return this.#class
  }

  size() {
    return this.bytes.length
  }

  write(binary: Binary) {
    binary.write(this.bytes)
  }

  static read(binary: Binary, length: number) {
    const buffer = binary.read(length)

    return new this(buffer)
  }
}