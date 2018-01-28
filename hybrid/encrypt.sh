#!/bin/bash

function usage {
    echo session.sh RECIPIENT [FILE...]
    exit 1
}

[ $# -lt 1 ] && usage

RECIPIENT=$1 && shift

login=$(mktemp)

curl -siL -XPOST \
  http://pac.fil.cool/uglix/bin/login \
  -H 'Content-Type: application/json' \
  -d '{
	"user": "guest",
    "password": "guest"
}' > $login

COOKIE=$(grep -Fi "Set-Cookie" $login | cut -d: -f2- | cut -d\  -f2- | rev | cut -c2- | rev)

RECIPIENT_PK=$(mktemp)

curl -sL \
  "http://pac.fil.cool/uglix/bin/key-management/$RECIPIENT/pk" \
  -H "Cookie: $COOKIE" \
  -o $RECIPIENT_PK

head -n1 $RECIPIENT_PK | grep -Fiq 'BEGIN PUBLIC KEY' || exit 1

function encrypt {
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
            return
        fi
    fi

    key=$(cat /dev/urandom | env LC_CTYPE=C tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n1)
    session_key=$(echo -n $key | openssl pkeyutl -encrypt -pubin -inkey $RECIPIENT_PK | base64)

    payload=$(openssl enc -aes-128-cbc -md sha256 -pass pass:"$key" -in $file | base64)

    echo "{\"session_key\": \"$session_key\",\"payload\": \"$payload\"}"
}

if [ $# -eq 0 ]
then
    encrypt -
else
    while [ $# -ne 0 ]
    do
        encrypt $1
        shift
    done
fi
