#!/bin/sh -ex
if [ -z "$1" ]; then
    echo "Usage: ./build-wrapper.sh x.y.z"
    exit 1
fi
version=$1
cd wrappers
    for wrapper in *; do
        target_dir="mustache-${wrapper}"
        mkdir -p $target_dir
        target=$target_dir/${wrapper}.mustache.js
        touch $target
        cat ${wrapper}/mustache.js.pre >> ${target}
        cat ../mustache.js >> ${target}
        cat ${wrapper}/mustache.js.post >> ${target}
        uglifyjs ${target} > ${target_dir}/${wrapper}.mustache.min.js
        cp ../README.md ${target_dir}
        cp ../LICENSE ${target_dir}
        tar czf ${target_dir}.tar.gz ${target_dir}
        mv ${target_dir}.tar.gz ${target_dir}
    done
cd ..
