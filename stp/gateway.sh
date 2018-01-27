#!/bin/bash

function usage {
    echo session.sh KEY SESSION_COOKIE [REQUEST_FILE...]
    exit 1
}

[ $# -lt 2 ] && usage

KEY=$1 && shift
COOKIE=$1 && shift

function send_request {
    if [ $1 = "-" ]
    then
        file=$(mktemp)
        cat > $file
    else
        if [ -f $file -a -r $file ]
        then
            file=$1
        else
            echo "Cannot upload '$1'. Skipping."
        fi
    fi

    crypted=$(mktemp)
    openssl enc -aes-128-cbc -md sha256 -pass pass:"$KEY" -in $file -out $crypted || exit 1

    response=$(mktemp)

    curl -sL -XPOST \
      http://pac.fil.cool/uglix/bin/gateway \
      -H 'Content-Type: application/octet-stream' \
      -H "Cookie: $COOKIE" \
      --data-binary "@$crypted" \
      -o $response

     openssl enc -d -aes-128-cbc -md sha256 -pass pass:"$KEY" -in $response || exit 1
}

if [ $# -eq 0 ]
then
    send_request -
else
    while [ $# -ne 0 ]
    do
        send_request $1
        shift
    done
fi
