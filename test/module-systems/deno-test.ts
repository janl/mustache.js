import { assertEquals } from "https://deno.land/std@0.51.0/testing/asserts.ts";
import mustache from "../../mustache.mjs";

const view = {
  title: "Joe",
  calc: function() {
    return 2 + 4;
  }
};

Deno.test("can use mustache", () => {
  assertEquals(
    mustache.render("{{title}} spends {{calc}}", view),
    "Joe spends 6"
  );
});
