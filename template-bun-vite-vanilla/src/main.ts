const app = document.querySelector<HTMLElement>('#app');

if (!app) {
  throw new Error('Missing #app element');
}

app.innerHTML = `
  <h1>Bun + Vite</h1>
  <p>A minimal TypeScript app, ready to customize.</p>
`;
