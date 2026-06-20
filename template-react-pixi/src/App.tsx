import { useEffect, useRef } from "react";
import { Application, Graphics } from "pixi.js";

const SQUARE_SIZE = 150;
const SQUARE_COLOR = 0x4a90e2;

function App() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const app = new Application();
    let cancelled = false;

    const square = new Graphics()
      .rect(-SQUARE_SIZE / 2, -SQUARE_SIZE / 2, SQUARE_SIZE, SQUARE_SIZE)
      .fill(SQUARE_COLOR);

    const positionSquare = () => {
      square.x = app.screen.width / 2;
      square.y = app.screen.height / 2;
    };

    const initPromise = app
      .init({
        background: "#1a1a1a",
        resizeTo: window,
        antialias: true,
      })
      .then(() => {
        if (cancelled) return;
        container.appendChild(app.canvas);
        app.stage.addChild(square);
        positionSquare();
        app.renderer.on("resize", positionSquare);
      });

    return () => {
      cancelled = true;
      void initPromise.then(() => {
        app.destroy(true, { children: true });
      });
    };
  }, []);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}

export default App;
