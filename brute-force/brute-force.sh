#!/bin/bash

response='U2FsdGVkX1+R3aP+6+J5MzKcCda0Q8fNGYvvXI0o5vH7B3/hx6jFZsa36/POCaUx\nX5vbqRYlSvqN+QiN/xMwjw=='
expected='robertssheri-ac5e4ef00b1b4fed9fce2a64243fc225'

while IFS='' read -r line || [[ -n "$line" ]]; do
    decrypted=$(echo -en "$response" | openssl enc -d -base64 -aes-128-cbc -md sha256 -pass pass:"$line" 2>/dev/null)
    if [[ "$decrypted" = "$expected" ]]; then
        echo $line
        break
    fi
done < "$1"
