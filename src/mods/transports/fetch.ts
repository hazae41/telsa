import { Bytes } from "libs/bytes/bytes.js"

export interface BatchedFetchStreamParams {
  lowDelay?: number
  highDelay?: number
}

export class BatchedFetchStream {
  readonly readable: ReadableStream<Uint8Array>
  readonly writable: WritableStream<Uint8Array>

  constructor(
    readonly request: RequestInfo,
    readonly params: BatchedFetchStreamParams = {}
  ) {
    const { lowDelay = 100, highDelay = 10000 } = params

    let rcontroller: ReadableStreamController<Uint8Array>
    let wcontroller: WritableStreamDefaultController

    let batch = new Array<Uint8Array>()

    let timeout: NodeJS.Timeout
    let interval: NodeJS.Timer

    this.readable = new ReadableStream<Uint8Array>({
      // type: "bytes", // Safari
      async start(controller) {
        rcontroller = controller
      },
      async cancel(e) {
        wcontroller.error(e)
      }
    })

    this.writable = new WritableStream<Uint8Array>({
      async start(controller) {
        wcontroller = controller
      },
      async write(chunk) {
        batch.push(chunk)

        clearTimeout(timeout)
        clearInterval(interval)

        timeout = setTimeout(async () => {

          interval = setInterval(async () => {
            const res = await fetch(request, { method: "POST" })
            const data = new Uint8Array(await res.arrayBuffer())
            rcontroller.enqueue(data)
          }, highDelay)

          if (!batch.length) return

          const body = Bytes.concat(batch)

          batch = new Array<Uint8Array>()

          const res = await fetch(request, { method: "POST", body })
          const data = new Uint8Array(await res.arrayBuffer())
          rcontroller.enqueue(data)
        }, lowDelay)
      },
      async abort(e) {
        rcontroller.error(e)
      }
    })
  }
}