import { test } from "https://deno.land/std@v0.21.0/testing/mod.ts";
import { assertEquals } from "https://deno.land/std@v0.21.0/testing/asserts.ts";
import mustache from "../../mustache.mjs";

const view = {
  title: "Joe",
  calc: function() {
    return 2 + 4;
  }
};

test(function canUseMustache() {
  assertEquals(
    mustache.render("{{title}} spends {{calc}}", view),
    "Joe spends 6"
  );
});
