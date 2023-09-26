import { INDOOR_LEVEL } from "../../../public/strings/constants.json";
import LevelService from "../../services/levelService";
import { geoMap } from "../../main";
import { lang } from "../../services/languageService";

function handleChange(): void {
  //reCreate

  remove();
  create();
}

function create(): void {
  const levelNames = LevelService.getLevelNames();
  render(levelNames);
}

function remove(): void {
  document.getElementById("levelControl").innerHTML = "";
}

function render(allLevelNames: string[]): void {
  const levelControl = document.getElementById("levelControl");

  allLevelNames.forEach((level: string) => {
    const changeToLevel = lang.changeLevel + level;
    const levelBtn = document.createElement("li");
    levelBtn.className = "page-item";
    levelBtn.innerHTML =
      '<a class="page-link" aria-hidden="true">' + level + "</a>";
    levelBtn.setAttribute("role", "button");
    levelBtn.setAttribute("title", changeToLevel);
    levelBtn.setAttribute("aria-label", changeToLevel);
    levelBtn.setAttribute("tabindex", "0");

    if (level == INDOOR_LEVEL) {
      levelBtn.classList.add("active");
    }

    levelBtn.addEventListener("click", (e: MouseEvent) => {
      geoMap.handleLevelChange(level);

      for (let i = 0; i < levelControl.children.length; i++) {
        levelControl.children[i].classList.remove("active");
      }
      //(<HTMLElement>e.target).parentElement.classList.add("active");
      levelBtn.classList.add("active");
    });

    levelBtn.addEventListener("keyup", (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        geoMap.handleLevelChange(level);

        for (let i = 0; i < levelControl.children.length; i++) {
          levelControl.children[i].classList.remove("active");
        }
        levelBtn.classList.add("active");
      }
    });

    levelControl.appendChild(levelBtn);
  });
  levelControl.classList.add("scale-in");

  // recalculate the width of the wrapper-element to include all (potentially flex-wrapped) child-nodes
  // see also: https://stackoverflow.com/questions/33891709/when-flexbox-items-wrap-in-column-mode-container-does-not-grow-its-width
  // const wrapper = document.getElementById("levelControlWrapper");
  const wrapper = document.getElementById("levelControlWrapper");
  const wrapperPadding =
    parseInt(window.getComputedStyle(wrapper).paddingLeft.replace("px", "")) +
    parseInt(window.getComputedStyle(wrapper).paddingRight.replace("px", ""));
  const firstChild = levelControl.firstElementChild;
  const lastChild = levelControl.lastElementChild;
  const width =
    lastChild.getBoundingClientRect().left -
    firstChild.getBoundingClientRect().left +
    lastChild.clientWidth +
    wrapperPadding;

  wrapper.setAttribute("style", "width: " + width.toString() + "px");
}

function focusOnLevel(selectedLevel: string): void {
  const levelControl = document.getElementById("levelControl");
  const list = levelControl.children;
  for (let item of list) {
    if (item.firstChild.textContent === selectedLevel) {
      item.classList.add("active");
    } else item.classList.remove("active");
  }
}

export default {
  handleChange,
  focusOnLevel,
};
