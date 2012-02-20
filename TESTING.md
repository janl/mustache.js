## Running the mustache.js Test Suite

Notice: the tests are only expected to run on unixoid systems.

The mustache.js test suite uses the [RSpec](http://rspec.info/) testing
framework. In order to run the tests you'll need to install [Ruby](http://ruby-lang.org/)
as well as the `rake`, `rspec` (>=2), and `json` [RubyGems](http://rubygems.org/).

### How to install Ruby and the required gems from source

Make sure you have the required tools to compile it:

    $ apt-get install build-essential libssl-dev libreadline5-dev zlib1g-dev

Download and extract the Ruby source, and install it:

    $ wget ftp://ftp.ruby-lang.org/pub/ruby/stable-snapshot.tar.gz
    $ tar xvzf stable-snapshot.tar.gz
    $ cd ruby
    $ ./configure && make && make install

Download and extract RubyGems, and install it:

    $ wget http://production.cf.rubygems.org/rubygems/rubygems-1.8.12.tgz
    $ tar xzvf rubygems-1.8.12.tgz
    $ cd rubygems-1.8.12
    $ ruby setup.rb

If you want to update RubyGems:

    $ gem update --system

Install the required gems:

    $ gem install rake rspec json

That's it!

### How to install node.js from source

    $ git clone https://github.com/joyent/node.git
    $ cd node
    $ # select the version to install, master is unstable;
    $ # latest stable version is advertised on http://nodejs.org
    $ git checkout v0.6.11
    $ ./configure
    $ make
    $ sudo make install

### How to run the tests

The mustache.js test suite currently uses 4 different JavaScript runtime engines
to maximize portability across platforms and browsers. They are:

  * node
  * SpiderMonkey (Mozilla, Firefox)
  * JavaScriptCore (WebKit, Safari)
  * Rhino (Mozilla, Java)

When the test suite runs it will automatically determine which platforms are
available on your machine and run on all of them. The suite must run on at least
one platform in order to succeed.

Once you have at least one JavaScript platform installed, you can run the test
suite with the following command:

    $ rake

### How to create a test

All test files live in the spec/_files directory. To create a new test:

  * Create a template file `somename.mustache`
  * Create a javascript file with data and functions `somename.js`
  * Create a file the expected result `somename.txt`
