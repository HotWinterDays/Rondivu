#!/bin/sh
set -e
mkdir -p /data/uploads/events
chown -R nextjs:nodejs /data
exec su-exec nextjs "$@"
