import { GeoJSON } from "leaflet";
import { geoMap } from "../main";

export function hasCurrentLevel(feature: GeoJSON.Feature<any>): boolean {
  const currentLevel = geoMap.getCurrentLevel();
  return (
    feature.properties.level === currentLevel ||
    feature.properties.level.includes(currentLevel)
  );
}
