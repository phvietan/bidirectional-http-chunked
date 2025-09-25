import { sleep } from "bun";

const reader = Bun.stdin.stream().getReader();

async function send() {
  process.stdout.write("Input number to calculate sum: ");
  const { value } = await reader.read();
  const input = new TextDecoder().decode(value).trim();
  console.log(input);
  await sleep(500);
}

async function main() {
  await send();
  await send();
  await send();
}

main();
