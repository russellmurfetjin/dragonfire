#!/bin/bash
# Bundle Dragon Fire Puzzle into a distributable zip
cd "$(dirname "$0")"

DIST_DIR="browser-dist"
ZIP_NAME="DragonFirePuzzle.zip"

rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"

# Copy game files
cp index.html "$DIST_DIR/"
cp game.html "$DIST_DIR/"
cp editor.html "$DIST_DIR/"

# Create zip
cd "$DIST_DIR"
zip -r "../$ZIP_NAME" . -x ".*"
cd ..

echo ""
echo "Done! Created:"
echo "  $ZIP_NAME - Send this to friends (they unzip and open index.html)"
echo "  $DIST_DIR/ - Unzipped folder ready to play"
