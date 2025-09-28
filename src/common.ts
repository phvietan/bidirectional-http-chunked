import { ReadableStreamDefaultReader } from 'node:stream/web'
import crypto, { randomInt } from 'node:crypto';

var bufferBefore = '';
export async function read(reader: ReadableStreamDefaultReader<any>) {
  const { value, done } = await reader.read();
  if (done) return null;
  const res = bufferBefore + new TextDecoder().decode(value);
  bufferBefore = '';
  return res;
}
export async function readUntil(delimiter: string, reader: ReadableStreamDefaultReader<any>) {
  let result = "";
  while (true) {
    const chunk = await read(reader);
    if (chunk === null) return null;
    result += chunk;
    if (result.includes(delimiter)) {
      const parts = result.split(delimiter);
      result = parts[0]!;
      bufferBefore = parts.slice(1).join(delimiter);
      break;
    }
  }
  return result;
}

function sha256(s: string) {
  const hash = crypto.createHash('sha256');
  hash.update(s);
  return hash.digest('hex');
}

export class POW {
  difficulty: number;

  constructor(difficulty: number) {
    this.difficulty = difficulty;
  }

  generateChallenge() {
    const salt = crypto.randomBytes(16).toString('hex');
    return {
      salt,
      challenge: `Find a string such that sha256(salt + string) starts with ${'0'.repeat(this.difficulty)} in hex. Salt: ${salt}`,
    }
  }

  parseChallengeMessage(message: string | null): string {
    if (!message) throw new Error("Empty challenge message");
    const match = message.match(/Salt: (\w{32})/);
    if (match) return match[1]!;
    throw new Error("Invalid challenge message");
  }

  verifySolution(salt: string, candidate: string) {
    const hashed = sha256(salt + candidate);
    return hashed.startsWith('0'.repeat(this.difficulty));
  }

  solveChallenge(salt: string) {
    let nonce = randomInt(0, 1e9);
    while (true) {
      const candidate = nonce.toString();
      if (this.verifySolution(salt, candidate)) {
        return candidate;
      }
      nonce = randomInt(0, 1e9);
    }
  }
}

