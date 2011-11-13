# mustache.js Changes

## 0.5.2-vcs

* Fixed a scoping bug (thanks gjslick)
* Added Mustache.format function (similar to String.format from C#)

## 0.5.1-vcs

* Added Dot Notation Support

## 0.5.0-vcs

* Added Compiled Template support
* Correct Set Delimiter implementation
* Implements & unescaping character
* Multiline Comments
* Syntactically Important Whitespace (Issues 25, 41, 48, and 67)
* QUnit unit tests

## 0.3.0 (21-07-2010)

* Improved whitespace handling.
* Make IMPLICIT ITERATORS a first class feature.
* Fix Rhino compat.
* CommonJS packaging is no longer a special case.
* DRY Rakefile.
* Allow whitespace around tag names.
* Fix partial scope.
* Fix Comments.
* Added inverted sections.
* Avoid double encoding of entities.
* Use sections to dereference subcontexts.
* Added higher order sections.


## 0.2.3 (28-03-2010)

* Better error message for missing partials.
* Added more robust type detection.
* Parse pragmas only once.
* Throw exception when encountering an unknown pragma.
* Ignore undefined partial contexts. Returns verbatim partials.
* Added yui3 packaging.


## 0.2.2 (11-02-2010)

* ctemplate compat: Partials are indicated by >, not <.
* Add support for {{%PRAGMA}} to enable features.
* Made array of strings an option. Enable with `{{%JSTACHE-ENABLE-STRING-ARRAYS}}`.
* mustache compat: Don't barf on unknown variables.
* Add `rake dojo` target to create a dojo package.
* Add streaming api.
* Rename JSTACHE-ENABLE-STRING-ARRAYS to IMPLICIT-ITERATOR.
* Add support for pragma options.
