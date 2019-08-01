workflow "Verify changes on push" {
  resolves = ["Run all tests"]
  on = "push"
}

action "Run all tests" {
  uses = "actions/npm@59b64a598378f31e49cb76f27d6f3312b582f680"
  args = "test"
}
