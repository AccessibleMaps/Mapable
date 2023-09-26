import * as L from "leaflet";
import { GeoJSON, Layer, LayerGroup, LeafletMouseEvent, Marker } from "leaflet";
import "leaflet.markercluster";
import DescriptionArea from "./ui/descriptionArea";
import FeatureService from "../services/featureService";
import LevelService from "../services/levelService";
import { geoMap } from "../main";
import { colors } from "../services/colorService";
import { ICONS } from "../../public/strings/constants.json";
import MarkerClusterGroup = L.MarkerClusterGroup;

export class IndoorLayer {
  private readonly indoorLayerGroup: LayerGroup;
  markers: MarkerClusterGroup;
  selectedFeatures: GeoJSON.Feature[] = [];
  layerInstance: Layer;

  constructor(geoJSON: GeoJSON.FeatureCollection) {
    // console.log(geoMap.accessibilityMarkers);
    // geoMap.removeAccessibilityMarkers();
    this.markers = L.markerClusterGroup({
      iconCreateFunction: function (cluster) {
        const markers = cluster.getAllChildMarkers();
        const currentIcon = markers[0].getIcon().options.iconUrl;
        let html = "";
        let sameIcon = true;

        for (let i = 0; i < markers.length; i++) {
          if (currentIcon != markers[i].getIcon().options.iconUrl) {
            sameIcon = false;
          }
        }

        if (sameIcon) {
          // if all markers in the cluster group have the same icon: assign that icon to group
          html = "<img src='" + markers[0].getIcon().options.iconUrl + "' alt>";
        } else {
          // if markers in the cluster group have different icons: use the "additional"-icon
          html = "<img src='/images/" + ICONS.ADDITIONAL + "' alt>";
        }
        return L.divIcon({
          html: html,
          className: "icon-cluster",
          iconSize: L.point(48, 48),
        });
      },
    });

    this.indoorLayerGroup = new LayerGroup();

    geoMap.removeAccessibilityMarkers();
    geoMap.remove(this.markers);
    this.drawIndoorLayerByGeoJSON(geoJSON);
    this.layerInstance = geoMap.add(this.indoorLayerGroup);
    // geoMap.add(this.indoorLayerGroup);
    geoMap.add(this.markers);
  }

  clearIndoorLayer(): void {
    this.indoorLayerGroup.clearLayers();
    this.markers.clearLayers();
  }

  updateLayer(): void {
    this.clearIndoorLayer();
    this.drawIndoorLayerByGeoJSON(LevelService.getCurrentLevelGeoJSON());
  }

  private drawIndoorLayerByGeoJSON(geoJSON: GeoJSON.FeatureCollection) {
    geoMap.removeAccessibilityMarkers();
    geoMap.remove(this.markers);

    const layer = new L.GeoJSON(geoJSON, {
      style: FeatureService.getFeatureStyle,
      onEachFeature: this.onEachFeature,
      pointToLayer: () => null,
    });
    this.indoorLayerGroup.addLayer(layer);
    this.makeFeaturesAccessible();
  }

  private onEachFeature = (
    feature: GeoJSON.Feature<any, any>,
    layer?: Layer
  ) => {
    this.addMarker(feature, layer);
    this.selectFeature(feature, layer);
    this.showRoomNumber(feature, layer);
  };

  private addMarker = (
    feature: GeoJSON.Feature<any, any>,
    layer: Layer
  ): void => {
    const marker = FeatureService.getAccessibilityMarker(feature);
    if (marker) {
      //geoMap.add(marker);
      geoMap.accessibilityMarkers.push(marker);
      this.markers.addLayer(marker);

      marker.on("click", () => {
        layer.fire("click");
      });
    }

    geoMap.add(this.markers);

    layer.on("click", (e: LeafletMouseEvent) => {
      this.handleClick(e);
    });
  };

  private showRoomNumber(
    feature: GeoJSON.Feature<any, any>,
    layer: Layer
  ): void {
    const {
      indoor,
      stairs,
      ref: roomNo,
      handrail,
      amenity,
    } = feature.properties;

    //only rooms; no toilets/..
    if (roomNo && indoor == "room" && !amenity && !handrail && !stairs) {
      layer.bindTooltip(roomNo, {
        permanent: true,
        className: "room-label",
        offset: [0, 0],
        direction: "center",
      });
    }
  }

  private handleClick = (e: LeafletMouseEvent) => {
    const { feature } = e.sourceTarget;

    const accessibilityDescription =
      FeatureService.getAccessibilityDescription(feature);
    DescriptionArea.update(accessibilityDescription, "description");

    this.selectedFeatures = [feature];
    this.updateLayer();

    //makes sure room labels dont appear after clicking on a room
    geoMap.updateRoomLabels();
  };

  makeFeaturesAccessible(): void {
    const featurePaths = document.getElementsByClassName("leaflet-interactive");
    for (let i = 0; i < featurePaths.length; i++) {
      featurePaths[i].setAttribute("aria-disabled", "true");
    }

    const markerIcons = document.getElementsByClassName("leaflet-marker-icon");
    for (let i = 0; i < markerIcons.length; i++) {
      markerIcons[i].setAttribute("aria-disabled", "true");
      markerIcons[i].removeAttribute("tabindex");
    }
  }

  getIndoorLayerGroup(): LayerGroup {
    return this.indoorLayerGroup;
  }

  selectFeature(feature: GeoJSON.Feature<any, any>, layer: Layer): void {
    if (this.selectedFeatures.includes(feature)) {
      // @ts-ignore
      layer.options.fillColor = colors.roomColorS;
    }
  }

  setSelectedFeatures(features: GeoJSON.Feature[]): void {
    this.selectedFeatures = features;
  }
}
