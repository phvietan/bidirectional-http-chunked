import { POW, readUntil } from "./common";

const port = Bun.env.PORT ? Number(Bun.env.PORT) : 10000;

Bun.serve({
  // Comment out tls if you try to run as http for development
  tls: {
    key: Bun.file("./key.key"),
    cert: Bun.file("./key.crt"),
  },
  port,
  hostname: "0.0.0.0",
  routes: {
    "/": {
      "GET": (req) => {
        return new Response(Bun.file("index.html"));
      },
      "POST": async (request) => {
        const reader = request.body?.getReader();
        if (!reader) {
          return new Response("Request does not have body", { status: 400 });
        }

        const stream = new ReadableStream({
          async start(controller) {
            // POW phase
            const powChallenge = new POW(2);
            const { salt, challenge } = powChallenge.generateChallenge();
            controller.enqueue(challenge + '\n');

            const powSolution = await readUntil('\n', reader);
            const candidate = powSolution?.trim() || "";
            console.log('Client POW solution:', candidate);
            if (!powChallenge.verifySolution(salt, candidate)) {
              controller.enqueue("Proof of work failed. Try again.\n");
              controller.close();
              console.log('POW failed');
              return;
            }
            console.log('POW succeeded');
            controller.enqueue("Correct" + "\n");

            // Sum phase
            let sum = 0;
            while (1) {
              const message = await readUntil('\n', reader);
              if (message === "end" || message === null) break;
              const num = Number(message);
              if (isNaN(num)) {
                controller.enqueue("Not a number, sum is still " + sum + "\n");
                continue;
              } else {
                sum += num;
                controller.enqueue("Current sum: " + sum + "\n");
              }
            }
            controller.close();
            console.log('Ended sum calculation with', sum);
          }
        });
        return new Response(stream, {
          headers: {
            "Content-Type": "text/plain",
            "Transfer-Encoding": "chunked",
          }
        });
      },
    },
  },
});

console.log(`Server running at https://localhost:${port}/`);
