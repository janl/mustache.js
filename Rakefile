require 'rake'
require 'spec/rake/spectask'

task :default => :spec

Spec::Rake::SpecTask.new(:spec) do |t|
  #t.spec_opts = ['--options', "\"#{File.dirname(__FILE__)}/spec/spec.opts\""]
  t.spec_files = FileList['test/*_spec.rb']
end

desc "Run all specs"
task :spec do
end

task :commonjs do
  print "Packaging for CommonJS\n"
  `mkdir lib`
  `cp mustache.js lib/mustache.js`
  print "Done.\n"
end

task :jquery do
  print "Packaging for jQuery\n"
  source = "mustache-jquery"
  target_jq = "jquery.mustache.js"
  `cat #{source}/#{target_jq}.tpl.pre mustache.js #{source}/#{target_jq}.tpl.post > #{target_jq}`
  print "Done, see ./#{target_jq}\n"
end

task :clean do
  `for file in \`cat .gitignore\`; do rm -rf $file; done`
end
