import {GeoJSON, LatLngBounds} from "leaflet";

export interface BuildingInterface {
    boundingBox: LatLngBounds,
    feature: GeoJSON.Feature<any, any> | null
}
