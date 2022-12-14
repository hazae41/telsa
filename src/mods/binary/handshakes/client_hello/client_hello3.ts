import { Binary } from "@hazae41/binary"
import { Bytes } from "libs/bytes/bytes.js"
import { Extension } from "mods/binary/extensions/extension.js"
import { ClientSupportedVersions } from "mods/binary/extensions/supported_versions/supported_versions.js"
import { Handshake } from "mods/binary/handshakes/handshake.js"
import { Number16, Number8 } from "mods/binary/number.js"
import { ArrayVector, Vector, Vector16, Vector8 } from "mods/binary/vector.js"

export class ClientHello3 {
  readonly #class = ClientHello3

  static type = Handshake.types.client_hello

  constructor(
    readonly legacy_version: number,
    readonly random: Uint8Array,
    readonly legacy_session_id: Vector<Number8>,
    readonly cipher_suites: Vector<Number16>,
    readonly legacy_compression_methods: Vector<Number8>,
    readonly extensions: Vector<Number16>
  ) { }

  get class() {
    return this.#class
  }

  get type() {
    return this.#class.type
  }

  static default(ciphers: number[]) {
    const legacy_version = 0x0303
    const random = Bytes.random(32)

    const legacy_session_id = new (ArrayVector<Number8, Number8>(Number8, Number8))([])
    const cipher_suites = new (Vector16<Number16>(Number16))(ciphers)
    const legacy_compression_methods = new (Vector8<Number8>(Number8))([0])
    const extensions = new (ArrayVector<Number16, Extension>(Number16, Extension))([ClientSupportedVersions.default3().extension()])

    return new this(legacy_version, random, legacy_session_id, cipher_suites, legacy_compression_methods, extensions)
  }

  size() {
    return 0
      + 2
      + this.random.length
      + this.legacy_session_id.size()
      + this.cipher_suites.size()
      + this.legacy_compression_methods.size()
      + this.extensions.size()
  }

  write(binary: Binary) {
    binary.writeUint16(this.legacy_version)
    binary.write(this.random)
    this.legacy_session_id.write(binary)
    this.cipher_suites.write(binary)
    this.legacy_compression_methods.write(binary)
    this.extensions.write(binary)
  }

  handshake() {
    return new Handshake(this.type, this)
  }

  export() {
    const binary = Binary.allocUnsafe(this.size())
    this.write(binary)
    return binary.buffer
  }
}