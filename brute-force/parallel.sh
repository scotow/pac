#!/bin/bash

for chunk in $(ls words-chunk*.txt); do
    ./brute_force.sh $chunk &
done
