#!/bin/bash

HOOK_NAMES="pre-commit"
HOOK_DIR=$(git rev-parse --show-toplevel)/.git/hooks
INSTALL_DIR=$(git rev-parse --show-toplevel)/hooks

for hook in $HOOK_NAMES; do
    # If the hook already exists, is executable, and is not a symlink
    if [ ! -h $HOOK_DIR/$hook -a -x $HOOK_DIR/$hook ]; then
        mv $HOOK_DIR/$hook $HOOK_DIR/$hook.local
    fi
    # create the symlink, overwriting the file if it exists
    # probably the only way this would happen is if you're using an old version of git
    # -- back when the sample hooks were not executable, instead of being named ____.sample
    ln -s -f $INSTALL_DIR/$hook $HOOK_DIR
done