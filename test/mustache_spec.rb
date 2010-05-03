require 'rubygems'
require 'json'

__DIR__ = File.dirname(__FILE__)

testnames = Dir.glob(__DIR__ + '/../examples/*.js').map do |name|
  File.basename name, '.js'
end

non_partials = testnames.select{|t| not t.include? "partial"}
partials = testnames.select{|t| t.include? "partial"}

def load_test(dir, name, partial=false)
  view = File.read(dir + "/../examples/#{name}.js")
  template = File.read(dir + "/../examples/#{name}.html").to_json
  expect = File.read(dir + "/../examples/#{name}.txt")
  if not partial
    [view, template, expect]
  else
    partial = File.read(dir + "/../examples/#{name}.2.html").to_json
    [view, template, partial, expect]
  end
end

describe "mustache" do
  before(:all) do
    @mustache = File.read(__DIR__ + "/../mustache.js")
  end

  it "should return the same when invoked multiple times" do
    js = <<-JS
      #{@mustache}
      Mustache.to_html("x")
      print(Mustache.to_html("x"));
    JS
    run_js(js).should == "x\n"

  end

  it "should clear the context after each run" do
    js = <<-JS
      #{@mustache}
      Mustache.to_html("{{#list}}{{x}}{{/list}}", {list: [{x: 1}]})
      try {
        print(Mustache.to_html("{{#list}}{{x}}{{/list}}", {list: [{}]}));
      } catch(e) {
        print('ERROR: ' + e.message);
      }
    JS
    run_js(js).should == "\n"
  end
  
  non_partials.each do |testname|
    describe testname do 
      it "should generate the correct html" do

        view, template, expect = load_test(__DIR__, testname)
        
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
      it "should sendFun the correct html" do

        view, template, expect = load_test(__DIR__, testname)

        runner = <<-JS
          try {
            #{@mustache}
            #{view}
            var chunks = [];
            var sendFun = function(chunk) {
              if (chunk != "") {
                chunks.push(chunk);
              }
            }
            var template = #{template};
            Mustache.to_html(template, #{testname}, null, sendFun);
            print(chunks.join("\\n"));
          } catch(e) {
            print('ERROR: ' + e.message);
          }
        JS

        run_js(runner).strip.should == expect.strip
      end
    end
  end

  partials.each do |testname|
    describe testname do
      it "should generate the correct html" do

        view, template, partial, expect = 
              load_test(__DIR__, testname, true)

        runner = <<-JS
          try {
            #{@mustache}
            #{view}
            var template = #{template};
            var partials = {"partial": #{partial}};
            var result = Mustache.to_html(template, partial_context, partials);
            print(result);
          } catch(e) {
            print('ERROR: ' + e.message);
          }
        JS
      
        run_js(runner).should == expect
      end
      it "should sendFun the correct html" do

        view, template, partial, expect =
              load_test(__DIR__, testname, true)

        runner = <<-JS
          try {
            #{@mustache}
            #{view};
            var template = #{template};
            var partials = {"partial": #{partial}};
            var chunks = [];
            var sendFun = function(chunk) {
              if (chunk != "") {
                chunks.push(chunk);
              }
            }
            Mustache.to_html(template, partial_context, partials, sendFun);
            print(chunks.join("\\n"));
          } catch(e) {
            print('ERROR: ' + e.message);
          }
        JS

        run_js(runner).strip.should == expect.strip
      end
    end
  end

  def run_js(js)
    File.open("runner.js", 'w') {|f| f << js}
    `js runner.js`
  end
end

