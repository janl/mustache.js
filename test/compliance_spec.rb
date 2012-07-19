require 'rubygems'
require 'yaml'
require 'json'

YAML::add_builtin_type('code') do |_, value|
  value['js'].tap do |func|
    def func.to_json(_)
      "function() { return #{self}; }"
    end
  end
end

__DIR__ = File.dirname(__FILE__)

testnames = Dir.glob(__DIR__ + '/../ext/spec/specs/[^~]*.yml').map do |name|
  File.basename name, '.yml'
end

def load_tests(dir, name)
  file = File.join(dir, '..', 'ext', 'spec', 'specs', "#{name}.yml")
  return YAML.load_file(file)['tests']
end

describe "Mustache Spec compliance" do
  before(:all) do
    @mustache = File.read(__DIR__ + "/../mustache.js")
  end

  testnames.each do |testname|
    load_tests(__DIR__, testname).each do |test|
      describe test['name'] do
        it test['desc'] do
          runner = <<-JS
            #{@mustache}
            print(Mustache.to_html(
              #{test['template'].to_json},
              #{test['data'].to_json},
              #{test['partials'].to_json}
            ));
          JS

          # #print appends a newline
          run_js(runner).should == test['expected'] + "\n"
        end
      end
    end
  end

  def run_js(js)
    File.open("runner.js", 'w') {|f| f << js}
    `js runner.js`
  end
end
