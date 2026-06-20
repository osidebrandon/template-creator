import { Application, Graphics } from "pixi.js";

const SQUARE_SIZE = 150;
const SQUARE_COLOR = 0x4a90e2;

const app = new Application();

const square = new Graphics()
  .rect(-SQUARE_SIZE / 2, -SQUARE_SIZE / 2, SQUARE_SIZE, SQUARE_SIZE)
  .fill(SQUARE_COLOR);

const positionSquare = () => {
  square.x = app.screen.width / 2;
  square.y = app.screen.height / 2;
};

await app.init({
  background: "#1a1a1a",
  resizeTo: window,
  antialias: true,
});

document.body.appendChild(app.canvas);
app.stage.addChild(square);
positionSquare();
app.renderer.on("resize", positionSquare);
