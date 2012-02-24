require 'rake'
require 'rake/clean'

task :default => :spec

desc "Run all specs"
task :spec do
  require 'rspec/core/rake_task'
  RSpec::Core::RakeTask.new(:spec) do |t|
    #t.spec_opts = ['--options', "\"#{File.dirname(__FILE__)}/spec/spec.opts\""]
    t.pattern = 'spec/*_spec.rb'
  end
end

# Creates a task that uses the various template wrappers to make a wrapped
# output file. There is some extra complexity because Dojo and YUI use
# different final locations.
def templated_build(name, opts={})
  short = name.downcase
  source = File.join("wrappers", short)
  dependencies = ["mustache.js"] + Dir.glob("#{source}/*.tpl.*")
  target_js = opts[:location] ? "mustache.js" : "#{short}.mustache.js"

  CLEAN.include(opts[:location] ? opts[:location] : target_js)

  desc "Package for #{name}"
  task short.to_sym => dependencies do
    puts "Packaging for #{name}"

    mkdir_p opts[:location] if opts[:location]

    files = [
      "#{source}/mustache.js.pre",
      'mustache.js',
      "#{source}/mustache.js.post"
    ]

    open("#{opts[:location] || '.'}/#{target_js}", 'w') do |f|
      files.each {|file| f << File.read(file) }
    end

    puts "Done, see #{opts[:location] || '.'}/#{target_js}"
  end
end

templated_build "jQuery"
templated_build "MooTools"
templated_build "Dojo", :location => "dojox/string"
templated_build "YUI3", :location => "yui3/mustache"
templated_build "RequireJS"
templated_build "qooxdoo"

task :minify do
  # npm install uglify-js
  mmjs = "mustache.min.js"
  `echo "/*! Version: 0.5.1-dev */" > #{mmjs}`
  `uglifyjs mustache.js >> #{mmjs}`
  puts "Created #{mmjs}"
end
