import { Binary } from "@hazae41/binary"
import { Alert } from "mods/binary/alerts/alert.js"
import { Certificate2 } from "mods/binary/handshakes/certificate/handshake2.js"
import { CertificateRequest2 } from "mods/binary/handshakes/certificate_request/handshake2.js"
import { ClientHello2 } from "mods/binary/handshakes/client_hello/handshake2.js"
import { Handshake, HandshakeHeader } from "mods/binary/handshakes/handshake.js"
import { ServerHello2 } from "mods/binary/handshakes/server_hello/handshake2.js"
import { ServerHelloDone2 } from "mods/binary/handshakes/server_hello_done/handshake2.js"
import { ServerKeyExchange2, ServerKeyExchange2Anonymous, ServerKeyExchange2Ephemeral } from "mods/binary/handshakes/server_key_exchange/handshake2.js"
import { RecordHeader } from "mods/binary/record/record.js"
import { CipherSuite } from "mods/ciphers/cipher.js"
import { Transport } from "mods/transports/transport.js"

export type State =
  | NoneState
  | CipheredState

export interface NoneState {
  type: "none"
}

export interface CipheredState {
  type: "ciphered"
  version: number
  cipher: CipherSuite
}

export class Tls {
  private state: State = { type: "none" }

  readonly streams = new TransformStream<Buffer, Buffer>()

  private buffer = Buffer.allocUnsafe(4 * 4096)
  private wbinary = new Binary(this.buffer)
  private rbinary = new Binary(this.buffer)

  constructor(
    readonly transport: Transport,
    readonly ciphers: CipherSuite[]
  ) {
    this.tryRead()

    const onMessage = this.onMessage.bind(this)

    transport.addEventListener("message", onMessage, { passive: true })

    new FinalizationRegistry(() => {
      transport.removeEventListener("message", onMessage)
    }).register(this, undefined)
  }

  async handshake() {
    const hello = ClientHello2
      .default(this.ciphers)
      .handshake()
      .record(0x0301)
      .export()
    await this.transport.send(hello.buffer)
  }

  private async onMessage(event: Event) {
    const message = event as MessageEvent<Buffer>

    const writer = this.streams.writable.getWriter()
    writer.write(message.data).catch(console.warn)
    writer.releaseLock()
  }

  private async tryRead() {
    const reader = this.streams.readable.getReader()

    try {
      await this.read(reader)
    } finally {
      reader.releaseLock()
    }
  }

  private async read(reader: ReadableStreamDefaultReader<Buffer>) {
    while (true) {
      const { done, value } = await reader.read()

      if (done) break

      this.wbinary.write(value)
      await this.onRead()
    }
  }

  private async onRead() {
    this.rbinary.buffer = this.buffer.subarray(0, this.wbinary.offset)

    while (this.rbinary.remaining) {
      try {
        const header = RecordHeader.tryRead(this.rbinary)

        if (!header) break

        await this.onRecord(this.rbinary, header)
      } catch (e: unknown) {
        console.error(e)
      }
    }

    if (!this.rbinary.offset)
      return

    if (this.rbinary.offset === this.wbinary.offset) {
      this.rbinary.offset = 0
      this.wbinary.offset = 0
      return
    }

    if (this.rbinary.remaining && this.wbinary.remaining < 4096) {
      console.debug(`Reallocating buffer`)

      const remaining = this.buffer.subarray(this.rbinary.offset, this.wbinary.offset)

      this.rbinary.offset = 0
      this.wbinary.offset = 0

      this.buffer = Buffer.allocUnsafe(4 * 4096)
      this.rbinary.buffer = this.buffer
      this.wbinary.buffer = this.buffer

      this.wbinary.write(remaining)
      return
    }
  }

  private async onRecord(binary: Binary, record: RecordHeader) {
    if (record.type === Alert.type)
      return this.onAlert(binary, record.length)
    if (record.type === Handshake.type)
      return this.onHandshake(binary, record.length)

    binary.offset += record.length

    console.warn(record)
  }

  private async onAlert(binary: Binary, length: number) {
    const alert = Alert.read(binary, length)

    console.log(alert)
  }

  private async onHandshake(binary: Binary, length: number) {
    const handshake = HandshakeHeader.read(binary, length)

    if (handshake.type === ServerHello2.type)
      return this.onServerHello(binary, handshake.length)
    if (handshake.type === Certificate2.type)
      return this.onCertificate(binary, handshake.length)
    if (handshake.type === ServerHelloDone2.type)
      return this.onServerHelloDone(binary, handshake.length)
    if (handshake.type === ServerKeyExchange2.type)
      return this.onServerKeyExchange(binary, handshake.length)
    if (handshake.type === CertificateRequest2.type)
      return this.onCertificateRequest(binary, handshake.length)

    binary.offset += handshake.length

    console.warn(handshake)
  }

  private async onServerHello(binary: Binary, length: number) {
    const hello = ServerHello2.read(binary, length)

    console.log(hello)

    const version = hello.server_version

    if (version !== 0x0303)
      throw new Error(`Unsupported ${version} version`)

    const cipher = this.ciphers.find(it => it.id === hello.cipher_suite)

    if (cipher === undefined)
      throw new Error(`Unsupported ${hello.cipher_suite} cipher suite`)

    this.state = { type: "ciphered", version, cipher }
  }

  private async onCertificate(binary: Binary, length: number) {
    const hello = Certificate2.read(binary, length)

    const certificates = hello.certificate_list.array
      .map(it => console.log(it.buffer.toString("base64")))
    console.log(certificates)

    console.log(hello)
  }

  private async onServerKeyExchange(binary: Binary, length: number) {
    if (this.state.type !== "ciphered")
      throw new Error(`Invalid state for onServerKeyExchange`)

    const hello = (() => {
      if (this.state.cipher.anonymous)
        return ServerKeyExchange2Anonymous
      if (this.state.cipher.ephemeral)
        return ServerKeyExchange2Ephemeral
      return ServerKeyExchange2
    })().read(binary, length)

    console.log(hello)
  }

  private async onCertificateRequest(binary: Binary, length: number) {
    const hello = CertificateRequest2.read(binary, length)

    console.log(hello)
  }

  private async onServerHelloDone(binary: Binary, length: number) {
    const hello = ServerHelloDone2.read(binary, length)

    console.log(hello)
  }
}