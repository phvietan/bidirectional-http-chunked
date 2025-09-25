function toNum(readerValue: Uint8Array): number {
  const asciiStr = new TextDecoder().decode(readerValue);
  return Number(asciiStr);
}

Bun.serve({
  port: 10000,
  fetch: async (request) => {
    const reader = request.body?.getReader();
    if (!reader) {
      return new Response("No body", { status: 400 });
    }

    async function read() {
      const { value, done } = await reader!.read();
      if (done) return null;
      return new TextDecoder().decode(value);
    }
    let sum = 0;
    const stream = new ReadableStream({
      async start(controller) {
        while (1) {
          const value = await read();
          if (!value) break;
          console.log({ value: Number(value) });
          if (value) sum += Number(value);
          controller.enqueue(sum.toString());
        }
        controller.close();
      }
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain",
        "Transfer-Encoding": "chunked",
      }
    });
  },
});
