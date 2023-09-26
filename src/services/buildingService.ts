import { BuildingInterface } from "../models/buildingInterface";
import HttpService from "./httpService";
import { GeoJSON, LatLng, LatLngBounds } from "leaflet";
import {
  MAPQUEST_API_KEY,
  NOMINATIM_SERVER,
} from "../../public/strings/constants.json";
import { featureDescriptionHelper } from "../utils/featureDescriptionHelper";
import { buildingAccessibilityProperties } from "../data/buildingAccessibilityProperties";
import { GeoJsonObject, Position } from "geojson";
import { getArrayDepth } from "../utils/getArrayDepth";
import { geoMap } from "../main";
import { lang } from "./languageService";

const toBBox = require("geojson-bounding-box");

/**
 * Finding a building by search string:
 * 1) Iterate through all building Features if there is a Feature with the given name. If so, return the building Feature.
 * 2) Otherwise, call Nominatim service to do a more advanced search. Since Nominatim does not return a GeoJSON Feature,
 *    we have to again iterate through all building Features to find the id returned by Nominatim.
 */

/*Search*/
function handleSearch(searchString: string): Promise<BuildingInterface> {
  let returnBuilding: BuildingInterface;

  const buildings = HttpService.getBuildingData();
  const found = buildings.features.some(
    (building: GeoJSON.Feature<any, any>) => {
      if (
        (building.properties.name !== undefined &&
          building.properties.name === searchString) ||
        (building.properties.loc_ref !== undefined &&
          building.properties.loc_ref === searchString)
      ) {
        const BBox = toBBox(building);
        returnBuilding = {
          boundingBox: new LatLngBounds(
            new LatLng(BBox[2], BBox[3]),
            new LatLng(BBox[0], BBox[1])
          ),
          feature: building,
        };
        return true;
      }
      return false;
    }
  );

  if (found) {
    return new Promise((resolve) => {
      resolve(returnBuilding);
    });
  }

  return nominatimSearch(searchString);
}

function nominatimSearch(searchString: string): Promise<BuildingInterface> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          const nominatimResponse = JSON.parse(xhr.responseText);
          if (
            nominatimResponse.length === 0 ||
            nominatimResponse[0] === undefined
          ) {
            return reject(lang.buildingNotFound);
          }

          const BBox = nominatimResponse[0]["boundingbox"];
          const buildingFeature = getBuilding(
            nominatimResponse[0]["osm_type"] +
              "/" +
              nominatimResponse[0]["osm_id"]
          );

          if (buildingFeature === null) {
            return reject(lang.buildingNotSITconform);
          }

          if (BBox !== undefined) {
            const returnBuilding = {
              boundingBox: new LatLngBounds(
                new LatLng(BBox[2], BBox[3]),
                new LatLng(BBox[0], BBox[1])
              ),
              feature: buildingFeature,
            };
            return resolve(returnBuilding);
          }

          return reject(null);
        } else if (xhr.status > 400) {
          return reject(null);
        }
      }
    };

    xhr.open(
      "GET",
      NOMINATIM_SERVER +
        "?key= " +
        MAPQUEST_API_KEY +
        "&format=json&q=" +
        encodeURIComponent(searchString) +
        "&addressdetails=0&limit=1",
      true
    );
    xhr.send();
  });
}

function runIndoorSearch(searchString: string): GeoJSON.Feature[] {
  const geoJSON = getBuildingGeoJSON();

  const results = geoJSON.features.filter((f) =>
    filterByString(f, searchString)
  );

  return results;
}

function filterByString(f: GeoJSON.Feature, searchString: string) {
  const s = searchString.toLowerCase();
  return (
    (f.properties.ref && f.properties.ref.toLowerCase().startsWith(s)) || //room number
    (f.properties.indoor && f.properties.indoor.toLowerCase().startsWith(s)) || //type
    (f.properties.amenity && f.properties.amenity.toLowerCase().startsWith(s)) //toilet type
  );
}

/*Filter*/
export function filterByBounds(
  geoJSON: GeoJsonObject,
  buildingBBox: LatLngBounds
): GeoJSON.FeatureCollection<any> {
  const featureCollection = <GeoJSON.FeatureCollection<any>>geoJSON;

  if (buildingBBox === null) {
    return null;
  }

  const filteredFeatures = featureCollection.features.filter((f) =>
    doFilterByBounds(f, buildingBBox)
  );

  //create a new object to avoid to original GeoJSON object to be modified
  return {
    type: "FeatureCollection",
    features: filteredFeatures,
  } as GeoJSON.FeatureCollection<any>;
}

function doFilterByBounds(
  feature: GeoJSON.Feature<any>,
  buildingBBox: LatLngBounds
) {
  const { coordinates } = feature.geometry;

  return checkIfValid(feature) && checkIfInside(coordinates, buildingBBox);
}

function checkIfValid(feature: GeoJSON.Feature<any>): boolean {
  return !(
    feature.properties === undefined || feature.properties.level === undefined
  );
}

function checkIfInside(
  featureCoordinates: Position[][] | Position[] | Position,
  buildingBBox: LatLngBounds
): boolean {
  switch (getArrayDepth(featureCoordinates)) {
    case 1: {
      featureCoordinates = <Position>featureCoordinates;
      const latLng = new LatLng(featureCoordinates[0], featureCoordinates[1]);
      return buildingBBox.contains(latLng);
    }
    case 2: {
      featureCoordinates = <Position[]>featureCoordinates;
      return featureCoordinates.some((fc: Position) => {
        const latLng = new LatLng(fc[0], fc[1]);
        return buildingBBox.contains(latLng);
      });
    }
    case 3: {
      featureCoordinates = <Position[][]>featureCoordinates;
      return featureCoordinates.some((fc: Position[]) => {
        return fc.some((fc2: Position) => {
          const latLng = new LatLng(fc2[0], fc2[1]);
          return buildingBBox.contains(latLng);
        });
      });
    }
  }
}

function getBuilding(featureId: string): GeoJSON.Feature<any, any> {
  //findBuildingFeatureInDataset
  const buildings = HttpService.getBuildingData();
  let foundBuilding: GeoJSON.Feature<any, any> = null;

  buildings.features.some((b) => {
    if (b.id === featureId) {
      foundBuilding = b;
      return true;
    }
    return false;
  });

  return foundBuilding;
}

function getBuildingGeoJSON(): GeoJSON.FeatureCollection<any> {
  const buildingInterface = geoMap.buildingsBySearchString.get(
    geoMap.currentSearchString
  );
  if (buildingInterface !== undefined) {
    return filterByBounds(
      HttpService.getIndoorData(),
      buildingInterface.boundingBox
    );
  }

  console.error(lang.buildingNotFound);
  return null;
}

function getBuildingDescription(): string {
  const currentBuildingFeature = geoMap.buildingsBySearchString.get(
    geoMap.currentSearchString
  ).feature;

  let description = "";

  if (currentBuildingFeature.properties.name !== undefined) {
    // description += lang.selectedBuildingPrefix + currentBuildingFeature.properties.name;
    description += currentBuildingFeature.properties.name;

    if (currentBuildingFeature.properties.loc_ref !== undefined) {
      description += " (" + currentBuildingFeature.properties.loc_ref + ")";
    }
  }

  return description;
}

export default {
  getBuildingGeoJSON,
  getBuildingDescription,
  handleSearch,
  runIndoorSearch,
};
