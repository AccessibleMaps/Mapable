import {
  LatLng,
  LatLngBounds,
  Layer,
  LayerGroup,
  Map as LeafletMap,
  Marker,
  TileLayer,
} from "leaflet";

import "leaflet.markercluster";

import {
  INDOOR_LEVEL,
  MAP_START_LAT,
  MAP_START_LNG,
  OSM_ATTRIBUTION,
  OSM_TILE_SERVER,
} from "../../public/strings/constants.json";
import { BuildingInterface } from "../models/buildingInterface";
import levelControl from "./ui/levelControl";
import DescriptionArea from "./ui/descriptionArea";
import BuildingService from "../services/buildingService";
import buildingService from "../services/buildingService";
import LoadingIndicator from "./ui/loadingIndicator";
import LevelService from "../services/levelService";
import { IndoorLayer } from "./indoorLayer";
import { geoMap } from "../main";
import AccessibilityService from "../services/accessibilityService";
import accessibility from "../utils/makeAccessible";
import searchForm from "./ui/searchForm";
import levelService from "../services/levelService";
import colorService from "../services/colorService";
import { lang } from "../services/languageService";
import FeatureService from "../services/featureService";

export class GeoMap {
  currentSearchString = "";
  buildingsBySearchString = new Map<string, BuildingInterface>();
  mapInstance: LeafletMap = null;
  currentLevel = INDOOR_LEVEL;
  accessibilityMarkers: Marker[] = [];
  indoorLayer: IndoorLayer;

  constructor() {
    const osmTileLayer = new TileLayer(OSM_TILE_SERVER, {
      maxZoom: 21,
      attribution: OSM_ATTRIBUTION,
    });

    this.mapInstance = new LeafletMap("map", {
      center: new LatLng(parseFloat(MAP_START_LAT), parseFloat(MAP_START_LNG)),
      zoom: 19,
    })
      .on("moveend", this.makeAccessible)
      .on("load", this.makeAccessible)
      .on("zoomend", this.makeAccessible)
      .on("zoomend", this.updateRoomLabels);

    this.mapInstance.whenReady(() => {
      this.makeAccessible();
      this.applyStyleFilters();
    });
    this.add(osmTileLayer);
  }

  add(obj: LayerGroup | Marker | TileLayer): Layer {
    return obj.addTo(this.mapInstance);
  }

  remove(obj: Layer | Marker): void {
    this.mapInstance.removeLayer(obj);
  }

  removeIndoorLayerFromMap = (): void => {
    this.mapInstance.removeLayer(this.indoorLayer.getIndoorLayerGroup());
  };

  removeAccessibilityMarkers = (): void => {
    for (let i = 0; i < this.accessibilityMarkers.length; i++) {
      geoMap.remove(this.accessibilityMarkers[i]);
    }
    this.accessibilityMarkers = [];
  };

  makeAccessible(): void {
    accessibility.removeShadowPane();
    accessibility.silenceTileImages();
    accessibility.silenceMapMarkers();
    accessibility.silenceLeafletAttribution();
    //accessibility.silenceZoomControls();
    //accessibility.silenceCenteringButton();
    accessibility.silenceMapPane();
    //accessibility.silenceBottomLeafletControls();
  }

  showBuilding(searchString: string): Promise<string> {
    //searchAndShowBuilding

    return buildingService
      .handleSearch(searchString)
      .then((b: BuildingInterface) => {
        this.buildingsBySearchString.set(searchString, b);
        this.currentSearchString = searchString;
        localStorage.setItem("currentBuildingSearchString", searchString);

        this.handleBuildingChange();
        this.centerMapToBuilding();

        return new Promise((resolve) => resolve(lang.searchBuildingFound));
      });
  }

  handleBuildingChange(): void {
    levelControl.handleChange();
    levelService.clearData();

    if (this.indoorLayer) {
      this.removeAccessibilityMarkers();
      this.removeIndoorLayerFromMap();
    }

    this.indoorLayer = new IndoorLayer(LevelService.getCurrentLevelGeoJSON());
    this.handleLevelChange("0");

    AccessibilityService.reset();

    const message = BuildingService.getBuildingDescription();
    DescriptionArea.update(message, "selectedBuilding");
  }

  centerMapToBuilding = (): void => {
    const currentBuildingBBox = this.buildingsBySearchString.get(
      this.currentSearchString
    ).boundingBox;

    if (currentBuildingBBox !== null) {
      /* seems to be a bug somewhere (in leaflet?):
       * elements of returned bounding box are in wrong order (Lat and Lng are interchanged) */

      const currentBuildingBBox_corrected = new LatLngBounds(
        new LatLng(
          currentBuildingBBox.getSouthWest().lng,
          currentBuildingBBox.getSouthWest().lat
        ),
        new LatLng(
          currentBuildingBBox.getNorthEast().lng,
          currentBuildingBBox.getNorthEast().lat
        )
      );

      this.mapInstance.flyToBounds(currentBuildingBBox_corrected);
    }
  };

  updateRoomLabels = (): void => {
    const zoomLevel = this.mapInstance.getZoom();
    const hideIcons = zoomLevel < 21;

    //updating the indoor layer makes sure the tooltips are centered after "unhiding" them
    this.indoorLayer.updateLayer();

    for (
      let i = 0;
      i < document.getElementsByClassName("room-label").length;
      i++
    ) {
      document
        .getElementsByClassName("room-label")
        [i].toggleAttribute("hidden", hideIcons);
    }
  };

  runBuildingSearch(searchQuery: string): void {
    LoadingIndicator.start();

    if (searchQuery) {
      this.showBuilding(searchQuery)
        .then(() => {
          LoadingIndicator.end();
          const navBar = document.getElementById("navbarSupportedContent");
          navBar.classList.remove("show");
          navBar.classList.add("hide");

          searchForm.setBuildingSearchInput(searchQuery);
        })
        .catch((errorMessage: string) => {
          LoadingIndicator.error(errorMessage);
        });
    } else LoadingIndicator.error(lang.searchEmpty);
  }

  handleLevelChange(newLevel: string): void {
    this.currentLevel = newLevel;
    this.indoorLayer.updateLayer();
    this.updateRoomLabels(); //makes sure room numbers are correctly rendered again

    const message = LevelService.getCurrentLevelDescription();
    DescriptionArea.update(message);
  }

  getCurrentLevel(): string {
    return this.currentLevel;
  }

  handleIndoorSearch(searchString: string): void {
    if (searchString) {
      const results = buildingService.runIndoorSearch(searchString);
      if (results.length != 0) {
        this.indoorLayer.setSelectedFeatures(results);

        const selectedLevel = results[0].properties.level.toString();
        levelControl.focusOnLevel(selectedLevel);
        this.handleLevelChange(selectedLevel);

        const feature = results[0];
        const accessibilityDescription =
          FeatureService.getAccessibilityDescription(feature);
        DescriptionArea.update(accessibilityDescription);
      } else LoadingIndicator.error(lang.searchNotFound);
    } else LoadingIndicator.error(lang.searchEmpty);
  }

  applyStyleFilters = (): void => {
    this.mapInstance.getPane("tilePane").style.filter = `opacity(${
      colorService.getEnvOpacity() / 100
    })`;
    this.mapInstance.getPane("overlayPane").style.filter = `saturate(${
      (colorService.getColorStrength() * 2) / 100
    })`;

    //wall weight rendered per feature -> feature service
  };
}
