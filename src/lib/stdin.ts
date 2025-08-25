export async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];

  return new Promise((resolve) => {
    process.stdin.on('data', (chunk) => {
      chunks.push(chunk);
    });

    process.stdin.on('end', () => {
      resolve(Buffer.concat(chunks).toString());
    });

    setTimeout(() => {
      if (chunks.length === 0) {
        resolve('{}');
      }
    }, 100);
  });
}