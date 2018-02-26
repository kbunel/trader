#!/bin/bash

datetime=$(date +"%m-%d-%y-%H-%m-%S")
date=$(date +"%m-%d-%y")
logfile_reloader="./logs/reloader.log"
logfile="./logs/${date}.log"
pid=$(ps -x | grep dist/server/index.js | grep -v grep | grep -v node_modules | sed "s/\ /%/g" | cut -d'%' -f1)
prompt="[$datetime]"

cd ~/trader
if [ "$1" = "force" ]
then
	echo "${prompt} Forcing trader to reload"
	echo "${prompt} Forcing trader to reload" >> $logfile_reloader
	killall node
	npm run server >> $logfile &
elif [ -z $pid ]
then
	echo "${prompt} Trader is not running, reloading"
	echo "${prompt} Trader is not running, reloading" >> $logfile_reloader
	killall node
	npm run server >> $logfile &
else
	echo "${prompt} Trader is running"
	echo "${prompt} Trader is running" >> $logfile_reloader
fi
