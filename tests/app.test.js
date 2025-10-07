import request from "supertest";
import app, { add } from "../src/index.js";

test("GET /health returns ok", async () => {
  const res = await request(app).get("/health");
  expect(res.status).toBe(200);
  expect(res.body).toEqual({ ok: true });
});

test("add works", () => {
  expect(add(2, 3)).toBe(5);
});
