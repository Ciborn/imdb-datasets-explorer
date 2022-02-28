#!/bin/bash

TEMP_DIR="$(mktemp -d)"
BASE_URL=https://datasets.imdbws.com/

declare -A url=(
    ["episodes"]=="${BASE_URL}title.episode.tsv.gz"
    ["ratings"]="${BASE_URL}title.ratings.tsv.gz"
    ["titles"]="${BASE_URL}title.basics.tsv.gz"
)

# Downloads and extracts data from the IMDb datasets website
# $1 - File to download and extract
download_extract () {
    wget ${url[$1]} -O "$TEMP_DIR/$1.gz"
    gzip -cdf "$TEMP_DIR/$1.gz" > "$TEMP_DIR/$1" "../data/$1.tsv"
}

cd "$(dirname "${BASH_SOURCE[0]}")"
mkdir -p ../data
download_extract "ratings"

if [[ "$*" == *"--all"* ]]
then
    download_extract "episodes"
    download_extract "titles"
fi
