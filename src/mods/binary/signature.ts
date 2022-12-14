import { Binary } from "@hazae41/binary";
import { Number16 } from "mods/binary/number.js";
import { BytesVector, Vector } from "mods/binary/vector.js";

export class HashAlgorithm {
  readonly #class = HashAlgorithm

  static types = {
    none: 0,
    md5: 1,
    sha1: 2,
    sha224: 3,
    sha256: 4,
    sha384: 5,
    sha512: 6,
  }

  constructor(
    readonly type: number
  ) { }

  get class() {
    return this.#class
  }

  size() {
    return 1
  }

  write(binary: Binary) {
    binary.writeUint8(this.type)
  }

  static read(binary: Binary) {
    return new this(binary.readUint8())
  }
}

export class SignatureAlgorithm {
  readonly #class = SignatureAlgorithm

  static types = {
    anonymous: 0,
    rsa: 1,
    dsa: 2,
    ecdsa: 3
  }

  constructor(
    readonly type: number
  ) { }

  get class() {
    return this.#class
  }

  size() {
    return 1
  }

  write(binary: Binary) {
    binary.writeUint8(this.type)
  }

  static read(binary: Binary) {
    return new this(binary.readUint8())
  }
}

export class SignatureAndHashAlgorithm {
  readonly #class = SignatureAndHashAlgorithm

  constructor(
    readonly hash: HashAlgorithm,
    readonly signature: SignatureAlgorithm
  ) { }

  get class() {
    return this.#class
  }

  size() {
    return this.hash.size() + this.signature.size()
  }

  write(binary: Binary) {
    this.hash.write(binary)
    this.signature.write(binary)
  }

  static read(binary: Binary) {
    const hash = HashAlgorithm.read(binary)
    const signature = SignatureAlgorithm.read(binary)

    return new this(hash, signature)
  }
}

export class DigitallySigned {
  readonly #class = DigitallySigned

  constructor(
    readonly algorithm: SignatureAndHashAlgorithm,
    readonly signature: Vector<Number16>
  ) { }

  get class() {
    return this.#class
  }

  size() {
    return this.algorithm.size() + this.signature.size()
  }

  write(binary: Binary) {
    this.algorithm.write(binary)
    this.signature.write(binary)
  }

  static read(binary: Binary) {
    const algorithm = SignatureAndHashAlgorithm.read(binary)
    const signature = BytesVector<Number16>(Number16).read(binary)

    return new this(algorithm, signature)
  }
}