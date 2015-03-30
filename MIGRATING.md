# Migrating Guide

## Moving to mustache.js v2

### Overview

mustache.js v2 introduces a bug fix that breaks compatibility with older versions: fixing null and undefined lookup.

When mustache.js tries to render a variable `{{name}}`, it executes a `lookup` function to figure out which value it should render. This function looks up the value for the key `name` in the current context, and if there is no such key in the current context it looks up the parent contexts recursively.

Value lookup should stop whenever the key exists in the context. However, due to a bug, this was not happening when the value was `null` or `undefined` even though the key existed in the context.

Here's a simple example of the same template rendered with both mustache.js v1 and v2:

Template:
```mustache
{{#friends}}
{{name}}'s twitter is: {{twitter}}
{{/friends}}
```

View:
```json
{
    "name": "David",
    "twitter": "@dasilvacontin",
    "friends": [
        {
            "name": "Phillip",
            "twitter": "@phillipjohnsen"
        },
        {
            "name": "Jan",
            "twitter": null
        }
    ]
}
```

Rendered using mustache.js v1:
```text
Phillip's twitter is: @phillipjohnsen
Jan's twitter is: @dasilvacontin
```

Rendered using mustache.js v2:
```text
Phillip's twitter is: @phillipjohnsen
Jan's twitter is:
```