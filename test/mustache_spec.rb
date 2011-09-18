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

JS_PATH = `which js`.strip()
JSC_PATH = "/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Resources/jsc"
RHINO_JAR = "org.mozilla.javascript.tools.shell.Main"

engines_run = 0

describe "mustache" do

  shared_examples_for "Mustache rendering" do

    before(:all) do
      engines_run += 1
      mustache = File.read(__DIR__ + "/../mustache.js")
      stubbed_gettext = <<-JS
        // Stubbed gettext translation method for {{_i}}{{/i}} tags in Mustache.
        function _(params) {
          if (typeof params === "string") {
            return params
          }

          return params.text;
        }
      JS

      @boilerplate = <<-JS
        #{mustache}
        #{stubbed_gettext}
      JS
    end

    it "should return the same when invoked multiple times" do
      js = <<-JS
        #{@boilerplate}
        Mustache.to_html("x")
        print(Mustache.to_html("x"));
      JS
      run_js(@run_js, js).should == "x\n"

    end

    it "should clear the context after each run" do
      js = <<-JS
        #{@boilerplate}
        Mustache.to_html("{{#list}}{{x}}{{/list}}", {list: [{x: 1}]})
        try {
          print(Mustache.to_html("{{#list}}{{x}}{{/list}}", {list: [{}]}));
        } catch(e) {
          print('ERROR: ' + e.message);
        }
      JS
      run_js(@run_js, js).should == "\n"
    end

    non_partials.each do |testname|
      describe testname do
        it "should generate the correct html" do

          view, template, expect = load_test(__DIR__, testname)

          runner = <<-JS
            try {
              #{@boilerplate}
              #{view}
              var template = #{template};
              var result = Mustache.to_html(template, #{testname});
              print(result);
            } catch(e) {
              print('ERROR: ' + e.message);
            }
          JS

          run_js(@run_js, runner).should == expect
        end
        it "should sendFun the correct html" do

          view, template, expect = load_test(__DIR__, testname)

          runner = <<-JS
            try {
              #{@boilerplate}
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

          run_js(@run_js, runner).strip.should == expect.strip
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
              #{@boilerplate}
              #{view}
              var template = #{template};
              var partials = {"partial": #{partial}};
              var result = Mustache.to_html(template, partial_context, partials);
              print(result);
            } catch(e) {
              print('ERROR: ' + e.message);
            }
          JS

          run_js(@run_js, runner).should == expect
        end
        it "should sendFun the correct html" do

          view, template, partial, expect =
                load_test(__DIR__, testname, true)

          runner = <<-JS
            try {
              #{@boilerplate}
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

          run_js(@run_js, runner).strip.should == expect.strip
        end
      end
    end
  end

  context "running in SpiderMonkey (Mozilla, Firefox)" do
    p JS_PATH
    if !JS_PATH.empty?
      before(:each) do
        @run_js = :run_js_js
      end

      before(:all) do
        puts "\nTesting mustache.js in SpiderMonkey:\n"
      end

      after(:all) do
        puts "\nDone\n"
      end

      it_should_behave_like "Mustache rendering"
    else
      puts "\nSkipping tests in SpiderMonkey (js not found)\n"
    end
  end

  context "running in JavaScriptCore (WebKit, Safari)" do
    if File.exists?(JSC_PATH)
      before(:each) do
        @run_js = :run_js_jsc
      end

      before(:all) do
        puts "\nTesting mustache.js in JavaScriptCore:\n"
      end

      after(:all) do
        puts "\nDone\n"
      end

      it_should_behave_like "Mustache rendering"
    else
      puts "\nSkipping tests in JavaScriptCore (jsc not found)\n"
    end
  end

  context "running in Rhino (Mozilla)" do
    if !`java #{RHINO_JAR} 'foo' 2>&1`.match(/ClassNotFoundException/)
      before(:each) do
        @run_js = :run_js_rhino
      end

      before(:all) do
        puts "\nTesting mustache.js in Rhino:\n"
      end

      after(:all) do
        puts "\nDone\n"
      end

      it_should_behave_like "Mustache rendering"
    else
      puts "\nSkipping tests in Rhino (JAR #{RHINO_JAR} was not found)\n"
    end
  end

  context "suite" do
    before(:all) do
      puts "\nVerifying that we ran at the tests in at least one engine\n"
    end

    after(:all) do
      puts "\nDone\n"
    end

    it "should have run at least one time" do
      engines_run.should > 0
    end
  end

  def run_js(runner, js)
    send(runner, js)
  end

  def run_js_js(js)
    File.open("runner.js", 'w') {|f| f << js}
    `#{JS_PATH} runner.js`
  end

  def run_js_jsc(js)
    File.open("runner.js", 'w') {|f| f << js}
    `#{JSC_PATH} runner.js`
  end

  def run_js_rhino(js)
    File.open("runner.js", 'w') {|f| f << js}
    `java #{RHINO_JAR} runner.js`
  end
end

