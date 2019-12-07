require 'rake'
require 'rake/clean'

task :default => :test

def minified_file
  ENV['FILE'] || 'mustache.min.js'
end

desc "Run all tests"
task :test do
  sh "./node_modules/.bin/mocha test"
end

desc "Run JSHint"
task :hint do
  sh "./node_modules/.bin/jshint mustache.js"
end

# Creates a task that uses the various template wrappers to make a wrapped
# output file. There is some extra complexity because Dojo and YUI use
# different final locations.
def templated_build(name, final_location=nil)
  short = name.downcase
  source = File.join("wrappers", short)
  dependencies = ["mustache.js"] + Dir.glob("#{source}/*.tpl.*")
  target_js = final_location.nil? ? "#{short}.mustache.js" : "mustache.js"

  desc "Package for #{name}"
  task short.to_sym => dependencies do
    puts "Packaging for #{name}"

    mkdir_p final_location unless final_location.nil?

    sources = [ "#{source}/mustache.js.pre", 'mustache.js', "#{source}/mustache.js.post" ]
    relative_name = "#{final_location || '.'}/#{target_js}"

    open(relative_name, 'w') do |f|
      sources.each {|source| f << File.read(source) }
    end

    puts "Done, see #{relative_name}"
  end

  CLEAN.include(final_location.nil? ? target_js : final_location)
end

templated_build "jQuery"
templated_build "MooTools"
templated_build "Dojo", "dojox/string"
templated_build "YUI3", "yui3/mustache"
templated_build "qooxdoo"
