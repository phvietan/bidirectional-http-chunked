import { type ReadableStreamController } from "bun";
import { ReadableStream } from "stream/web";
import { POW, readUntil } from "./common";

async function main(url: string) {
  let globalController!: ReadableStreamController<any>;

  const response = await fetch(url, {
    method: "POST",
    body: new ReadableStream({
      async start(controller) {
        globalController = controller;
      }
    }),
  });

  const reader = response.body?.getReader();
  if (!reader) {
    console.error("No body in response");
    return;
  }

  // ====== POW PHASE ======
  // Get POW challenge
  let val = await readUntil('\n', reader);
  console.log(`[Server] ${val}`);

  // Solve POW challenge
  const powChallenge = new POW(2);
  const salt = powChallenge.parseChallengeMessage(val);
  const solution = powChallenge.solveChallenge(salt);
  console.log(`[Client] POW solution: ${solution} sending it to server`);
  globalController.enqueue(solution + '\n');

  // Wait for "Correct" response
  val = await readUntil('\n', reader);
  console.log(`[Server] ${val}`);

  if (val !== "Correct") {
    console.error("POW failed, exiting");
    globalController.close();
    return;
  }

  // ====== SUM PHASE ======
  console.log("POW succeeded, you can now send numbers to sum. Type 'end' to finish.");
  const prompt = "[Client] Input number: ";
  process.stdout.write(prompt);
  for await (const line of console) {
    const input = line.trim();
    globalController.enqueue(input + '\n');

    val = await readUntil('\n', reader);
    console.log(`[Server] ${val}`);
    if (input === 'end') break;

    process.stdout.write(prompt);
  }

  globalController.close();
}

// Example usage
main("https://bi-http.drstrange.org:10001/");
