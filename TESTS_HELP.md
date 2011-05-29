## How to run the tests

To run the test, you need ruby and the following gems installed : rake, rspec (>=2), json

### How to install ruby and the required gems from source

Make sure you have the required tools to compile it

    # apt-get install build-essential libssl-dev libreadline5-dev zlib1g-dev

Download ruby source and extract the source

    $ cd ~/
    $ wget ftp://ftp.ruby-lang.org/pub/ruby/stable-snapshot.tar.gz  
    $ tar xvzf stable-snapshot.tar.gz

Install it

    $ ./configure && make
    # make install

download the last version of RubyGems from here
http://rubyforge.org/frs/?group_id=126

Extract the source

    $ tar xzvf rubygems-1.8.4.tgz

Install it

    $ cd rubygems-1.8.4
    # ruby setup.rb

If you want to update RubyGems

    # gem update --system

Install the required gems

    # gem install rake rspec json

That's it!

### How to run the tests

    $ rake

### How to create a test

- Create a template file `somename.html`
- Create a javascript file with data and functions `somename.js`
- Create a file the expected result `somename.txt`

Done!
