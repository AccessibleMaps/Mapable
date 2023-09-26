/*
 * MIT License
 *
 * Copyright (c) 2023 AccessibleMaps Project, Julian Striegl
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * Developed by Julian Striegl, Till Große, Tomasz Ludyga, and Adrian Köhler
 * Project Lead: Julian Striegl
 */

import { GeoMap } from "./components/geoMap";
import HttpService from "./services/httpService";
import { translate } from "./utils/translate";
import LoadingIndicator from "./components/ui/loadingIndicator";
import Legend from "./components/ui/legend";
import CenterBtn from "./components/ui/centeringButton";
import { DEFAULT_BUILDING_SEARCH_STRING } from "../public/strings/constants.json";
import searchForm from "./components/ui/searchForm";

export let geoMap: GeoMap = null;
document.addEventListener("DOMContentLoaded", function () {
  LoadingIndicator.start();

  HttpService.fetchOverpassData()
    .then(() => {
      geoMap = new GeoMap();
      const buildingSearchString =
        localStorage.getItem("currentBuildingSearchString") ??
        DEFAULT_BUILDING_SEARCH_STRING;
      geoMap.runBuildingSearch(buildingSearchString);
      searchForm.setBuildingSearchInput(buildingSearchString);
      Legend.create();
      CenterBtn.create();
      translate();
    })
    .catch((error) => {
      LoadingIndicator.error(error);
    });
});
