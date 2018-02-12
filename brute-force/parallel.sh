#!/bin/bash

for chunk in $(ls words-chunk*.txt); do
    ./brute-force.sh $chunk &
done
