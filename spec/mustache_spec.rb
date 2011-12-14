require 'rubygems'
require 'json'

ROOT = File.expand_path('../..', __FILE__)
SPEC = File.join(ROOT, 'spec')
FILES = File.join(SPEC, '_files')

MUSTACHE = File.read(File.join(ROOT, "mustache.js"))

TESTS = Dir.glob(File.join(FILES, '*.js')).map do |name|
  File.basename name, '.js'
end

PARTIALS = TESTS.select {|t| t.include? "partial" }
NON_PARTIALS = TESTS.select {|t| not t.include? "partial" }

NODE_PATH = `which node`.strip
JS_PATH = `which js`.strip
JSC_PATH = "/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Resources/jsc"
RHINO_JAR = "org.mozilla.javascript.tools.shell.Main"

def load_test(name, is_partial=false)
  view = File.read(File.join(FILES, "#{name}.js"))
  template = File.read(File.join(FILES, "#{name}.mustache")).to_json
  expect = File.read(File.join(FILES, "#{name}.txt"))

  test = [view, template, expect]

  if is_partial
    test << File.read(File.join(FILES, "#{name}.2.mustache")).to_json
  end

  test
end

def run_js(runner, js)
  cmd = case runner
    when :spidermonkey
      JS_PATH
    when :jsc
      JSC_PATH
    when :rhino
      "java #{RHINO_JAR}"
    when :node
      NODE_PATH
    end

  runner_file = "runner.js"
  File.open(runner_file, 'w') {|file| file.write(js) }
  `#{cmd} #{runner_file}`
ensure
  FileUtils.rm_r(runner_file)
end

$engines_run = 0

describe "mustache" do
  shared_examples_for "mustache rendering" do
    before(:all) do
      $engines_run += 1
    end

    it "should return the same when invoked multiple times" do
      js = <<-JS
        #{@boilerplate}
        Mustache.to_html("x")
        print(Mustache.to_html("x"));
      JS

      run_js(@runner, js).should == "x\n"
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

      run_js(@runner, js).should == "\n"
    end

    NON_PARTIALS.each do |test|
      describe test do
        it "should generate the correct html" do
          view, template, expect = load_test(test)

          js = <<-JS
            try {
              #{@boilerplate}
              #{view}
              var template = #{template};
              var result = Mustache.to_html(template, #{test});
              print(result);
            } catch(e) {
              print('ERROR: ' + e.message);
            }
          JS

          run_js(@runner, js).should == expect
        end

        it "should sendFun the correct html" do
          view, template, expect = load_test(test)

          js = <<-JS
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
              Mustache.to_html(template, #{test}, null, sendFun);
              print(chunks.join("\\n"));
            } catch(e) {
              print('ERROR: ' + e.message);
            }
          JS

          run_js(@runner, js).strip.should == expect.strip
        end
      end
    end

    PARTIALS.each do |test|
      describe test do
        it "should generate the correct html" do
          view, template, expect, partial = load_test(test, true)

          js = <<-JS
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

          run_js(@runner, js).should == expect
        end

        it "should sendFun the correct html" do
          view, template, expect, partial = load_test(test, true)

          js = <<-JS
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

          run_js(@runner, js).strip.should == expect.strip
        end
      end
    end
  end

  context "running in node" do
    if File.exist?(NODE_PATH)
      before(:all) do
        $stdout.write "Testing in node "
        @runner = :node
        @boilerplate = MUSTACHE.dup
        @boilerplate << <<-JS
        function print(message) {
          console.log(message);
        }
        JS
      end

      after(:all) do
        puts " Done!"
      end

      it_should_behave_like "mustache rendering"
    else
      puts "Skipping tests in node (node not found)"
    end
  end

  context "running in SpiderMonkey (Mozilla, Firefox)" do
    if File.exist?(JS_PATH)
      before(:all) do
        $stdout.write "Testing in SpiderMonkey "
        @runner = :spidermonkey
        @boilerplate = MUSTACHE.dup
      end

      after(:all) do
        puts " Done!"
      end

      it_should_behave_like "mustache rendering"
    else
      puts "Skipping tests in SpiderMonkey (js not found)"
    end
  end

  context "running in JavaScriptCore (WebKit, Safari)" do
    if File.exist?(JSC_PATH)
      before(:all) do
        $stdout.write "Testing in JavaScriptCore "
        @runner = :jsc
        @boilerplate = MUSTACHE.dup
      end

      after(:all) do
        puts " Done!"
      end

      it_should_behave_like "mustache rendering"
    else
      puts "Skipping tests in JavaScriptCore (jsc not found)"
    end
  end

  context "running in Rhino (Mozilla, Java)" do
    if `java #{RHINO_JAR} 'foo' 2>&1` !~ /ClassNotFoundException/
      before(:all) do
        $stdout.write "Testing in Rhino "
        @runner = :rhino
        @boilerplate = MUSTACHE.dup
      end

      after(:all) do
        puts " Done!"
      end

      it_should_behave_like "mustache rendering"
    else
      puts "Skipping tests in Rhino (JAR #{RHINO_JAR} was not found)"
    end
  end

  context "suite" do
    before(:each) do
      $stdout.write "Verifying that we ran at the tests in at least one engine ... "
    end

    after(:each) do
      if @exception.nil?
        puts "OK"
      else
        puts "ERROR!"
      end
    end

    it "should have run at least one time" do
      $engines_run.should > 0
    end
  end
end
