export const greet = (name: string): string => `Hello, ${name}!`;

const name = process.argv[2] ?? 'World';

console.log(greet(name));
