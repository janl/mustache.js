require 'rake'
require 'rake/testtask'

task :default => :test

task :test do
  Rake::TestTask.new do |t|
    Dir.glob("examples/*.html") do |file|
      test = File.basename(file, ".html")
      cmd = "ruby test/mustache_test.rb #{test}"
      print `#{cmd}`
    end
  end
end

task :commonjs do
  print "Packaging for CommonJS\n"
  target = "mustache-commonjs"
  files = "LICENSE README.md test examples"
  `cp -r #{files} #{target}`
  `mkdir #{target}/lib`
  `cp mustache.js #{target}/lib`
  print "Done, see ./#{target}\n"
end
