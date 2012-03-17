require File.expand_path('../helper', __FILE__)
require 'fileutils'
require 'json'

module Mustache
  class Test < Test::Unit::TestCase

    def self.run_tests_for(engine)
      TESTS.each do |test|
        define_method("test_#{engine}_#{test}") do
          template, view, partial, expect = load_test(test)

          assert_equal expect, run_js(engine, <<-JS).chomp
            try {
              #{boilerplate_for(engine)}
              var template = #{template.to_json};
              var view = #{view};
              var partials = {partial: #{partial.to_json}};
              print(Mustache.render(template, view, partials));
            } catch(e) {
              print('ERROR: ' + e.message);
            }
          JS
        end
      end
    end

    unless Mustache.has_any_engines?
      abort "ERROR: Please install node, SpiderMonkey, JavaScriptCore or Rhino"
    end

    run_tests_for :v8 if Mustache.has_v8?
    run_tests_for :spidermonkey if Mustache.has_spidermonkey?
    run_tests_for :javascriptcore if Mustache.has_javascriptcore?
    run_tests_for :rhino if Mustache.has_rhino?

  private

    def load_test(name)
      template_file = File.join(TEST_FILES, "#{name}.mustache")
      view_file = File.join(TEST_FILES, "#{name}.js")
      partial_file = File.join(TEST_FILES, "#{name}.partial")
      expect_file = File.join(TEST_FILES, "#{name}.txt")

      [template_file, view_file, partial_file, expect_file].map do |file|
        File.exist?(file) ? File.read(file) : ""
      end
    end

    def runner_file
      "runner.js"
    end

    def run_js(engine, js)
      cmd = case engine
        when :v8              then NODE_PATH
        when :spidermonkey    then JS_PATH
        when :javascriptcore  then JSC_PATH
        when :rhino           then "java #{RHINO_JAR}"
        end

      File.open(runner_file, 'w') {|file| file.write(js) }

      `#{cmd} #{runner_file}`
    ensure
      FileUtils.rm_r(runner_file)
    end

    def boilerplate_for(engine)
      boilerplate = MUSTACHE_JS
      boilerplate += "\nvar print = console.log;" if engine == :v8
      boilerplate
    end

  end
end
