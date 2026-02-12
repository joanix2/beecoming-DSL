VERSION=$(jq -r .version package.json)
NAME=$(jq -r .name package.json)

echo "IMAGE_NAME=$NAME" > jenkins.properties
echo "IMAGE_VERSION=$VERSION" >> jenkins.properties