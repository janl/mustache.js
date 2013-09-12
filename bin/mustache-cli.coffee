#!/usr/bin/env coffee

Mustache = require('mustache')
Fs = require('fs')

mustacheIt = (template,data,callback) ->
  output = Mustache.render(template, data)
  callback(output)

if process.argv.length < 3
  console.log("usage mustache data.json template.mustache > result")
  console.log("cat data.json | usage mustache template.mustache > result")
  process.exit(code=0)

if process.argv[2]?
  if process.argv[2][-6..-1] == 'coffee'
    template = require process.argv[2]
  else
    template = Fs.readFileSync(process.argv[2], 'utf8')

if process.argv[3]?
  if process.argv[3][-6..-1] == 'coffee'
    data = require process.argv[2]
  else
    str = Fs.readFileSync(process.argv[3], 'utf8')
    data = JSON.parse(str);

  mustacheIt(template, data, (output) ->
    console.log(output)
  )

else # read the data from standard in.
  process.stdin.resume()
  process.stdin.setEncoding('utf8')

  str = ''
  process.stdin.on('data', (chunk) ->
    str+=chunk
  )
  process.stdin.on('end', ->
    data = JSON.parse(str);

    mustacheIt(template, data, (output) ->
      console.log(output)
    )
  )