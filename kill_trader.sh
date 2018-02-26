#!/bin/bash

kill $(ps -x | grep dist/server/index.js | grep -v grep | grep -v node_modules | sed "s/\ /%/g" | cut -d'%' -f1)
