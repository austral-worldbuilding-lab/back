#!/bin/bash

# Set the custom hooks path
git config core.hooksPath ./git-hooks

# Make sure the hook files are executable
chmod +x ./pre-push