cp ./package.json ./package.json.backup
cp ./package_to_copy.json ./package.json
npm pack
mv ./package.json.backup ./package.json
