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

def version
  File.read("mustache.js").match('version: "([^\"]+)",$')[1]
end

# Creates a rule that uses the .tmpl.{pre,post} stuff to make a final,
# wrapped, output file. There is some extra complexity because Dojo and YUI3
# use different template files and final locations.
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

    sh "cat #{source}/#{target_js}.tpl.pre mustache.js \
      #{source}/#{target_js}.tpl.post > #{opts[:location] || '.'}/#{target_js}"

    # extra
    if opts[:extra]
      sh "sed -e 's/{{version}}/#{version}/' #{source}/#{opts[:extra]} \
        > #{opts[:location]}/#{opts[:extra]}"
    end

    puts "Done, see #{opts[:location] || '.'}/#{target_js}"
  end
end

templated_build "CommonJS", :location => "lib", :extra => "package.json"
templated_build "jQuery"
templated_build "Dojo", :location => "dojox/string"
templated_build "YUI3", :location => "yui3/mustache"
templated_build "RequireJS"
templated_build "qooxdoo"

task :minify do
  # npm install uglify-js
  mmjs = "mustache.min.js"
  `echo "/*! Version: 0.4.2 */" > #{mmjs}`
  `uglifyjs mustache.js >> #{mmjs}`
  puts "Created #{mmjs}"
end
