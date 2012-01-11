# mustache.js Changes

## 0.5.0-dev (1/11/2012)

  * Complete rewrite
  * Removed support for pragmas

## 0.3.1-dev-twitter-b (8/23/2011)

  * Cached regexes for improved performance

## 0.3.1-dev-twitter (12/3/2010)

  * Fixed double-rendering bug
  * Added Rhino test-runner alongside JavaScriptCore

## 0.3.1 (??-??-????)

## 0.3.0 (21-07-2010)

  * Improved whitespace handling
  * Make IMPLICIT ITERATORS a first class feature
  * Fix Rhino compat
  * CommonJS packaging is no longer a special case
  * DRY Rakefile
  * Allow whitespace around tag names
  * Fix partial scope
  * Fix Comments
  * Added inverted sections
  * Avoid double encoding of entities
  * Use sections to dereference subcontexts
  * Added higher order sections

## 0.2.3 (28-03-2010)

  * Better error message for missing partials
  * Added more robust type detection
  * Parse pragmas only once
  * Throw exception when encountering an unknown pragma
  * Ignore undefined partial contexts. Returns verbatim partials
  * Added yui3 packaging

## 0.2.2 (11-02-2010)

  * ctemplate compat: Partials are indicated by >, not <
  * Add support for {{%PRAGMA}} to enable features
  * Made array of strings an option. Enable with `{{%JSTACHE-ENABLE-STRING-ARRAYS}}`
  * mustache compat: Don't barf on unknown variables
  * Add `rake dojo` target to create a dojo package
  * Add streaming api
  * Rename JSTACHE-ENABLE-STRING-ARRAYS to IMPLICIT-ITERATOR
  * Add support for pragma options
