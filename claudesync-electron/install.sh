#!/bin/bash

# Set the service name and description
SERVICE_NAME=com.claudesync.service
SERVICE_DESCRIPTION="Claude Sync Electron Service"

# Set the path to your Electron app (update this path)
APP_PATH="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/main.js"

# Create the plist file
cat << EOF > ~/Library/LaunchAgents/$SERVICE_NAME.plist
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>$SERVICE_NAME</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>$APP_PATH</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>$HOME/Library/Logs/$SERVICE_NAME.log</string>
    <key>StandardErrorPath</key>
    <string>$HOME/Library/Logs/$SERVICE_NAME.log</string>
</dict>
</plist>
EOF

# Load the service
launchctl load ~/Library/LaunchAgents/$SERVICE_NAME.plist

echo "Service installed and started successfully."