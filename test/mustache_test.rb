# mustache.js runs ruby tests, sorta
# run with mustache_test.rb testname

require 'json'

testname = ARGV[0]
puts "doing #{testname}"

view = File.read("examples/#{testname}.js")
template = File.read("examples/#{testname}.html").to_json
expect = File.read("examples/#{testname}.txt")

mustache = File.read("mustache.js")
runner = <<-JS
#{mustache}
#{view}
var template = #{template};
var result = Mustache.to_html(template, #{testname});
print(result);
JS

File.open("runner.js", 'w') {|f| f << runner}

result = `js runner.js`

if(result == expect)
  puts "OK"
else
  puts "Error in #{testname}"
  puts "Expected"
  puts "'#{expect}'"
  puts "Actual"
  puts "'#{result}'"
end
