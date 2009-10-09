require 'rake/testtask'

task :default => :test

Rake::TestTask.new do |t|
  Dir.glob("examples/*.html") do |file|
    test = File.basename(file, ".html")
    cmd = "ruby test/mustache_test.rb #{test}"
    print `#{cmd}`
  end
end
