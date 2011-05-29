require 'rake'
require 'rspec/core/rake_task'

task :default => :spec

RSpec::Core::RakeTask.new(:spec) do |t|
  #t.spec_opts = ['--options', "\"#{File.dirname(__FILE__)}/spec/spec.opts\""]
  t.pattern = 'test/*_spec.rb'
end

desc "Run all specs"
task :spec

def templated_build(name, opts={})
  # Create a rule that uses the .tmpl.{pre,post} stuff to make a final,
  # wrapped, output file.
  # There is some extra complexity because Dojo and YUI3 use different
  # template files and final locations.
  short = name.downcase
  source = "mustache-#{short}"
  dependencies = ["mustache.js"] + Dir.glob("#{source}/*.tpl.*")

  desc "Package for #{name}"
  task short.to_sym => dependencies do
    target_js = opts[:location] ? "mustache.js" : "#{short}.mustache.js"

    puts "Packaging for #{name}"
    sh "mkdir -p #{opts[:location]}" if opts[:location]
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
templated_build "requirejs"


def version
  File.read("mustache.js").match('version: "([^\"]+)",$')[1]
end


desc "Remove temporary files."
task :clean do
  sh "git clean -fdx"
end
