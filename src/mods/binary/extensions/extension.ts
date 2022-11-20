import { Binary } from "libs/binary.js"
import { Number16 } from "mods/binary/number.js"
import { AnyVector, Vector } from "mods/binary/vector.js"
import { Writable } from "mods/binary/writable.js"

export interface IExtension extends Writable {
  type: number
}

export class Extension {
  readonly class = Extension

  constructor(
    readonly type: number,
    readonly data: Vector<Number16>
  ) { }

  static from(extension: IExtension) {
    const data = new AnyVector(extension, Number16)

    return new this(extension.type, data)
  }

  size() {
    return 2 + this.data.size()
  }

  write(binary: Binary) {
    binary.writeUint16(this.type)
    this.data.write(binary)
  }
}