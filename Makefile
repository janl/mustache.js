# Make mustaches

# make a release
release: args tag build-wrappers
	@echo Done!

args:
ifeq ($(version),)
	@echo "Usage make release version=x.y.z"
else
	@echo "Releasing: ${version}"
endif

tag:
	# splice in version
	sed -i.bak -e "s|%version%|${version}|" mustache.js package.json
	git commit -m 'Released ${version}' mustache.js
	#  tag the version
	git tag ${version}
	# revert the version
	sed -i.bak -e 's|exports.version = "${version}"|exports.version = "%version%"|' mustache.js
	sed -i.bak -e 's|"version": "${version}"|"version": "%version%"|' package.json

build-wrappers:
	#   from that tag:
	#     build all wrappers / minify
	git checkout $(version)
	build/wrappers.sh $(version)

	git checkout gh-pages
	mkdir ${version}
	cp -r wrappers/mustache-* $(version)/
	cp mustache.js $(version)/
	cp package.json $(version)/
	#     update gh-pages with release links & travis
	#     update npm
	#     update cdnjs

# make test
test:
	rspec spec/mustache_spec.rb

PHONY: test release args tag build-wrappers
