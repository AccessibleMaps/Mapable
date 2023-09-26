const osmToGeoJson = require("osmtogeojson");
const fs = require("fs");
const path = require("path");

module.exports = function transformToGeoJSONAndSaveFile(responseText, dest) {
    console.log('saving transformed GeoJSON data to ' + dest);
    const osmData = JSON.parse(responseText);

    let transformedData = osmToGeoJson(osmData);
    transformedData = JSON.stringify(transformedData);

    fs.writeFileSync(path.resolve(__dirname, dest), transformedData);
}
