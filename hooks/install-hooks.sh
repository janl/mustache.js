#!/bin/bash

HOOK_NAMES="pre-commit"
HOOK_DIR=$(git rev-parse --show-toplevel)/.git/hooks
INSTALL_DIR=$(git rev-parse --show-toplevel)/hooks
COLOR_GREEN=`tput setaf 2`
COLOR_RESET=`tput sgr0`

for hook in $HOOK_NAMES; do
    echo -n "Installing $hook hook..."
    # If the hook already exists, is executable, and is not a symlink
    if [ ! -h $HOOK_DIR/$hook -a -x $HOOK_DIR/$hook ]; then
        echo -n " Hook already exists, saving old hook backup at $HOOK_DIR/$hook.local..."
        mv $HOOK_DIR/$hook $HOOK_DIR/$hook.local
    fi
    # create the symlink, overwriting the file if it exists
    # probably the only way this would happen is if you're using an old version of git
    # -- back when the sample hooks were not executable, instead of being named ____.sample
    echo -n " Creating symlink..."
    ln -s -f $INSTALL_DIR/$hook $HOOK_DIR
    echo "${COLOR_GREEN} Done! ✓${COLOR_RESET}"
done