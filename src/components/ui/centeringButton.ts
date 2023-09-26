import { geoMap } from "../../main";

function create(): void {
  const btnString = `<button type="button" class="btn btn-light d-flex p-1 shadow leaflet-control" 
                             aria-label="Set view to the focused building"
                             id="centeringButton">
                        <span class="material-icons" role="presentation" aria-hidden="true">center_focus_weak</span>
                     </button>`;

  const container = document.querySelector(".leaflet-top.leaflet-right");
  container.insertAdjacentHTML("beforeend", btnString);

  const btn = document.getElementById("centeringButton");
  btn.addEventListener("click", geoMap.centerMapToBuilding);
}

export default {
  create,
};
