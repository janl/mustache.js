require 'rubygems'
require 'json'

__DIR__ = File.dirname(__FILE__)

testnames = Dir.glob(__DIR__ + '/../examples/*.js').map do |name|
  File.basename name, '.js'
end

describe "mustache" do
  testnames.each do |testname|
    
    describe testname do
      it "should generate the correct html" do
        view = File.read(__DIR__ + "/../examples/#{testname}.js")
        template = File.read(__DIR__ + "/../examples/#{testname}.html").to_json
        expect = File.read(__DIR__ + "/../examples/#{testname}.txt")

        mustache = File.read(__DIR__ + "/../mustache.js")
        runner = <<-JS
        try {
          #{mustache}
          #{view}
          var template = #{template};
          var result = Mustache.to_html(template, #{testname});
          print(result);
        } catch(e) {
          print('ERROR: ' + e.message);
        }
        JS

        File.open("runner.js", 'w') {|f| f << runner}

        result = `js runner.js`
        result.should == expect
      end
    end
  end
end

