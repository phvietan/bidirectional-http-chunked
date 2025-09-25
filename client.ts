import { sleep, type ReadableStreamController } from "bun";
import { ReadableStream } from "stream/web";

async function sendChunkedRequest(url: string, chunks: string[]) {
  let globalController: ReadableStreamController<any>;

  const stream = new ReadableStream({
    async start(controller) {
      globalController = controller;
      // for (const chunk of chunks) {
        globalController.enqueue(new TextEncoder().encode('1'));
        await sleep(500);

      // }
    }
  });
  console.log('getting reader')

  const response = await fetch(url, {
    method: "POST",
    body: stream,
    headers: {
      "Transfer-Encoding": "chunked",
      "Content-Type": "text/plain"
    }
  });

  const reader = response.body?.getReader()!;

  let value = (await reader.read()).value;
  let decodedVal = new TextDecoder().decode(value);
  console.log("Received chunk:", decodedVal, "\n");

  console.log('sending');
  globalController!.enqueue(new TextEncoder().encode("2"));
  await sleep(500);

  value = (await reader.read()).value;
  decodedVal = new TextDecoder().decode(value);
  console.log("Received chunk:", decodedVal, "\n");

  globalController!.enqueue(new TextEncoder().encode("3"));
  await sleep(500);

  value = (await reader.read()).value;
  decodedVal = new TextDecoder().decode(value);
  console.log("Received chunk:", decodedVal, "\n");

  globalController!.close();
}

// Example usage
const url = "http://localhost:10000";
const chunks = ["1"];
sendChunkedRequest(url, chunks);
