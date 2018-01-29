#!/bin/bash

function usage {
    echo session.sh USERNAME PASSWORD
    exit 1
}

[ $# -lt 2 ] && usage

USERNAME=$1
PASSWORD=$2

pushd $(mktemp -d) > /dev/null || exit 1

curl -siL -XPOST \
  http://pac.fil.cool/uglix/bin/login/stp \
  -H 'Content-Type: application/json' \
  -d "{
	\"username\": \"$USERNAME\"
}" > uname

COOKIE=$(grep -Fi "Set-Cookie" uname | cut -d: -f2- | cut -d\  -f2- | rev | cut -c2- | rev)
UNAME=$(cat uname | tail -n1)

KEY="$PASSWORD-$UNAME"
echo $KEY

echo '{
    "method": "GET",
    "url": "/bin/login/stp/handshake"
}' > request.json

openssl enc -aes-128-cbc -md sha256 -pass pass:"$KEY" -in request.json -out request.json.bin

curl -siL -XPOST \
  http://pac.fil.cool/uglix/bin/gateway \
  -H 'Content-Type: application/octet-stream' \
  -H "Cookie: $COOKIE" \
  --data-binary @request.json.bin > handshake

grep -Fi "Set-Cookie" handshake | cut -d: -f2- | cut -d\  -f2- | rev | cut -c2- | rev

popd > /dev/null
