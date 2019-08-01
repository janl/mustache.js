workflow "Verify changes on push" {
  resolves = ["Run unit tests"]
  on = "push"
}

action "Install dependencies" {
  uses = "actions/npm@59b64a598378f31e49cb76f27d6f3312b582f680"
  args = "install"
}

action "Run unit tests" {
  uses = "actions/npm@59b64a598378f31e49cb76f27d6f3312b582f680"
  needs = "Install dependencies"
  args = "test"
}
