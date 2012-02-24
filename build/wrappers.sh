#!/bin/sh -ex
if [ -z "$1" ]; then
    echo "Usage: ./build-wrapper.sh x.y.z"
    exit 1
fi
version=$1
cd wrappers
    for wrapper in *; do
        target_dir="mustache-${wrapper}-${version}"
        mkdir -p $target_dir
        target=$target_dir/${wrapper}.mustache.js
        touch $target
        cat ${wrapper}/mustache.js.pre >> ${target}
        cat ../mustache.js >> ${target}
        cat ${wrapper}/mustache.js.post >> ${target}
    done
cd ..