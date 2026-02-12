VERSION=$(jq -r .version version.json)
NAME=$(jq -r .name version.json)

echo "IMAGE_NAME=$NAME" > jenkins.properties
echo "IMAGE_VERSION=$VERSION" >> jenkins.properties