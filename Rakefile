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
  target = "mustache-commonjs"
  copy_distfiles(target);
  `mkdir #{target}/lib`
  `cp mustache.js #{target}/lib`
  print "Done, see ./#{target}\n"
end

task :jquery do
  print "Packaging for jQuery\n"
  target = "mustache-jquery/"
  target_jq = "#{target}/jquery.mustache.js"
  `cat #{target_jq}.tpl.pre mustache.js #{target_jq}.tpl.post > #{target_jq}`
  copy_distfiles(target);
  print "Done, see ./#{target}\n"
end

private
def copy_distfiles(target)
  files = "LICENSE README.md test examples"
  `cp -r #{files} #{target}`
end
