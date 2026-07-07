#!/bin/bash
# Remove the bad DBUS variable
sed -i 's/- DBUS_SESSION_BUS_ADDRESS=\/dev\/null//g' docker-compose.yml
git add docker-compose.yml
git commit -m "fix: remove invalid DBUS_SESSION_BUS_ADDRESS"
git push
