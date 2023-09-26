import { GeoJSON } from "leaflet";
import BuildingService from "./buildingService";
import { extractLevels } from "../utils/extractLevels";
import { hasCurrentLevel } from "../utils/hasCurrentLevel";
import AccessibilityService from "./accessibilityService";
import { geoMap } from "../main";
import { lang } from "./languageService";

const geoJSONByLevel = new Map<string, any>();

function clearData(): void {
  geoJSONByLevel.clear();
}

function getCurrentLevelGeoJSON(): GeoJSON.FeatureCollection<any> {
  const currentBuildingIndoorData = BuildingService.getBuildingGeoJSON();
  const currentLevel = geoMap.getCurrentLevel();

  if (geoJSONByLevel.get(currentLevel) !== undefined) {
    return geoJSONByLevel.get(currentLevel);
  }

  const levelFilteredFeatures =
    currentBuildingIndoorData.features.filter(hasCurrentLevel);
  const levelFilteredFeatureCollection: GeoJSON.FeatureCollection<any, any> = {
    type: "FeatureCollection",
    features: levelFilteredFeatures,
  };

  geoJSONByLevel.set(currentLevel, levelFilteredFeatureCollection);
  return levelFilteredFeatureCollection;
}

function getLevelNames(): string[] {
  //TODO bug: beim zweiten mal fetchen fehlt die etage -1
  const currentBuildingIndoorData = BuildingService.getBuildingGeoJSON();
  const allLevelNames = new Array<string>();

  currentBuildingIndoorData.features.map(
    (feature: GeoJSON.Feature<any, any>) => {
      if (Array.isArray(feature.properties.level)) {
        return;
      }

      const level = (feature.properties.level =
        feature.properties.level.trim());

      if (level.includes(";")) {
        feature.properties.level = level.split(";");
      } else if (level.includes("-")) {
        feature.properties.level = extractLevels(level);
      }

      if (Array.isArray(feature.properties.level)) {
        feature.properties.level.forEach((level: string) => {
          if (!allLevelNames.includes(level)) {
            allLevelNames.push(level);
          }
        });
      } else {
        if (!allLevelNames.includes(level)) {
          allLevelNames.push(feature.properties.level);
        }
      }
    }
  );

  return allLevelNames.sort();
}

function getCurrentLevelDescription(): string {
  const currentLevel = geoMap.getCurrentLevel();
  const levelAccessibilityInformation = AccessibilityService.getForLevel(
    currentLevel,
    getCurrentLevelGeoJSON()
  );
  return lang.currentLevel + currentLevel + " " + levelAccessibilityInformation;
}

export default {
  getCurrentLevelGeoJSON,
  getLevelNames,
  getCurrentLevelDescription,
  clearData,
};
