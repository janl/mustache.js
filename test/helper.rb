require 'test/unit'

module Mustache
  extend self

  ROOT = File.expand_path('../..', __FILE__)
  TEST = File.join(ROOT, 'test')
  TEST_FILES = File.join(TEST, '_files')

  MUSTACHE_JS = File.read(File.join(ROOT, 'mustache.js'))

  TESTS = Dir.glob(File.join(TEST_FILES, '*.js')).map do |name|
    File.basename name, '.js'
  end

  NODE_PATH = `which node`.strip
  JS_PATH = `which js`.strip
  JSC_PATH = "/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Resources/jsc"
  RHINO_JAR = "org.mozilla.javascript.tools.shell.Main"

  def javascript_engines
    %w[v8 spidermonkey javascriptcore rhino]
  end

  def available_javascript_engines
    javascript_engines.select {|engine| send("has_#{engine}?") }
  end

  def has_any_engines?
    available_javascript_engines.any?
  end

  def has_v8?
    File.exist?(NODE_PATH)
  end

  def has_spidermonkey?
    File.exist?(JS_PATH)
  end

  def has_javascriptcore?
    File.exist?(JSC_PATH)
  end

  def has_rhino?
    `java #{RHINO_JAR} 'foo' 2>&1` !~ /ClassNotFoundException/
  end
end
