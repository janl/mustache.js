require 'rubygems'
require 'json'

ROOT = File.expand_path('../..', __FILE__)
SPEC = File.join(ROOT, 'spec')
FILES = File.join(SPEC, '_files')

MUSTACHE = File.read(File.join(ROOT, "mustache.js"))

TESTS = Dir.glob(File.join(FILES, '*.js')).map do |name|
  File.basename name, '.js'
end

NODE_PATH = `which node`.strip
JS_PATH = `which js`.strip
JSC_PATH = "/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Resources/jsc"
RHINO_JAR = "org.mozilla.javascript.tools.shell.Main"

def load_test(name)
  template = File.read(File.join(FILES, "#{name}.mustache"))
  view = File.read(File.join(FILES, "#{name}.js"))
  partial_file = File.join(FILES, "#{name}.partial")
  partial = if File.exist?(partial_file)
    File.read(partial_file)
  end
  expect = File.read(File.join(FILES, "#{name}.txt"))

  [template, view, partial, expect]
end

def run_js(runner, js)
  cmd = case runner
    when :spidermonkey
      JS_PATH
    when :jsc
      JSC_PATH
    when :rhino
      "java #{RHINO_JAR}"
    when :v8
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

    it "should return the same result when invoked multiple times" do
      js = <<-JS
        #{@boilerplate}
        Mustache.render("x")
        print(Mustache.render("x"));
      JS

      run_js(@runner, js).should == "x\n"
    end

    it "should clear the context after each run" do
      js = <<-JS
        #{@boilerplate}
        Mustache.render("{{#list}}{{x}}{{/list}}", {list: [{x: 1}]})
        try {
          print(Mustache.render("{{#list}}{{x}}{{/list}}", {list: [{}]}));
        } catch(e) {
          print('ERROR: ' + e.message);
        }
      JS

      run_js(@runner, js).should == "\n"
    end

    TESTS.each do |test|
      describe test do
        it "should render the correct output" do
          template, view, partial, expect = load_test(test)

          js = <<-JS
            try {
              #{@boilerplate}
              var template = #{template.to_json};
              #{view}
              var partials = {partial: #{partial ? partial.to_json : '""'}};
              print(Mustache.render(template, #{test}, partials));
            } catch(e) {
              print('ERROR: ' + e.message);
            }
          JS

          run_js(@runner, js).chomp.should == expect
        end

        # it "should send the correct output" do
        #   template, view, partial, expect = load_test(test)
        #
        #   js = <<-JS
        #     try {
        #       #{@boilerplate}
        #       var template = #{template.to_json};
        #       #{view}
        #       var partials = {
        #         "partial": #{(partial || '').to_json}
        #       };
        #       var buffer = [];
        #       var send = function (chunk) {
        #         buffer.push(chunk);
        #       };
        #       Mustache.render(template, #{test}, partials, send);
        #       print(buffer.join(""));
        #     } catch(e) {
        #       print('ERROR: ' + e.message);
        #     }
        #   JS
        #
        #   run_js(@runner, js).chomp.should == expect
        # end
      end
    end
  end

  context "running in V8 (Chrome, node)" do
    if File.exist?(NODE_PATH)
      before(:all) do
        $stdout.write "Testing in V8 "
        @runner = :v8
        @boilerplate = MUSTACHE.dup
        @boilerplate << <<-JS
        var print = console.log;
        JS
      end

      after(:all) do
        puts " Done!"
      end

      it_should_behave_like "mustache rendering"
    else
      puts "Skipping tests in V8 (node not found)"
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
      $stdout.write "Verifying that we ran the tests in at least one engine ... "
    end

    after(:each) do
      puts @exception.nil? ? "OK" : "ERROR"
    end

    it "should have run at least one time" do
      $engines_run.should > 0
    end
  end
end
