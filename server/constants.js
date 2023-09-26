const URLS = {
    OVERPASS_API: 'https://z.overpass-api.de/api/interpreter?data=',
    OSM_TILE_SERVER: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
}

const OVERPASS_QUERIES = {
    // get all indoor data from Dresden
    INDOOR: '[out:json];(area["name"="Dresden"];- nwr[building][!min_level](area.a);)->.a;(nwr[indoor](area.a););(._;>;); out;',
    // get all buildings that conform the SIT standard (min_level tag is set)
    SIT_BUILDINGS: '[out:json];(area["name"="Dresden"];)->.a;(nwr[building][min_level](area.a););(._;>;); out;'
};

const RESOURCES_TO_DOWNLOAD = [
    {
        url: URLS.OVERPASS_API + encodeURI(OVERPASS_QUERIES.INDOOR),
        dest: '../public/overpass/indoor.json'
    },
    {
        url: URLS.OVERPASS_API + encodeURI(OVERPASS_QUERIES.SIT_BUILDINGS),
        dest: '../public/overpass/buildings.json'
    }
];

const MAX_OVERPASS_FILE_AGE_IN_DAYS = 5;

module.exports = {URLS, OVERPASS_QUERIES, RESOURCES_TO_DOWNLOAD, MAX_OVERPASS_FILE_AGE_IN_DAYS};
