import 'dotenv/config';
import { greet } from 'template-node-package';

const name = process.env['NAME'] ?? 'World';

console.log(greet(name));
