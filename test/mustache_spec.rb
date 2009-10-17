require 'rubygems'
require 'json'

__DIR__ = File.dirname(__FILE__)

testnames = Dir.glob(__DIR__ + '/../examples/*.js').map do |name|
  File.basename name, '.js'
end

describe "mustache" do
  before(:all) do
    @mustache = File.read(__DIR__ + "/../mustache.js")
  end

  it "should clear the context after each run" do
    js = <<-JS
      #{@mustache}
      Mustache.to_html("{{#list}}{{x}}{{/list}}", {list: [{x: 1}]})
      try {
        print(Mustache.to_html("{{#list}}{{x}}{{/list}}", {list: [{}]}));
      } catch(e) {
        print('ERROR: ' + e);
      }
    JS
    run_js(js).should == "ERROR: Can't find x in [object Object]\n"
  end
  
  testnames.each do |testname|
    describe testname do
      it "should generate the correct html" do
        view = File.read(__DIR__ + "/../examples/#{testname}.js")
        template = File.read(__DIR__ + "/../examples/#{testname}.html").to_json
        expect = File.read(__DIR__ + "/../examples/#{testname}.txt")
  
        
        runner = <<-JS
        try {
          #{@mustache}
          #{view}
          var template = #{template};
          var result = Mustache.to_html(template, #{testname});
          print(result);
        } catch(e) {
          print('ERROR: ' + e.message);
        }
        JS
  
        
        run_js(runner).should == expect
      end
    end
  end
  
  def run_js(js)
    File.open("runner.js", 'w') {|f| f << js}
    `js runner.js`
  end
end

