#!/bin/bash

pid=$(ps -x | grep dist/server/index.js | grep -v grep | grep -v node_modules | sed "s/\ /%/g" | cut -d'%' -f1)

if [ -z $pid ]
then
	echo "Trader is not running"
else
	echo "Trader is running ${pid}"
fi
