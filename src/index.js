import express from "express";
const app = express();

app.get("/health", (_req, res) => res.json({ ok: true }));

// Example logic Sonar can analyze
export function add(a, b) {
  return a + b;
}

if (process.env.NODE_ENV !== "test") {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`demo-app-js listening on ${port}`));
}

export default app;
