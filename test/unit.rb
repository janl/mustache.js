require File.expand_path('../helper', __FILE__)

if Mustache.has_v8?
  exec "vows #{Mustache::TEST}/*_test.js"
else
  abort "ERROR: Please install node"
end
