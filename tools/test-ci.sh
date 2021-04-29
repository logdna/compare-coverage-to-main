#!/bin/bash
mkdir -p coverage
npm run tap

code=$?
set -e
cat .tap | tap-parser -t -f | tap-xunit > coverage/test.xml
exit $code
