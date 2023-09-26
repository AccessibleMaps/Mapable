import languageService, { lang } from "../services/languageService";

/* used to translate strings in the index.html */
export function translate(): void {
  document.documentElement.setAttribute("lang", languageService.getCurrentLanguageAcronym());

  document.getElementById("navbarBrandText").innerText = lang.navbarBrandText;
  document.getElementById("changeUserProfileBtnLabel").innerText = lang.changeUserProfileBtn;
  document.getElementById("userProfileModalLabel").innerText = lang.userProfileModalLabel;
  document.getElementById("profileQuickSwitchHeader").innerText = lang.profileQuickSwitchHeader;
  document.getElementById("settingsHeader").innerText = lang.settingsHeader;
  document.getElementById("languageHeader").innerText = lang.languageHeader;

  for (let i = 0; i < document.getElementsByClassName("saveButton").length; i++) {
    document.getElementsByClassName("saveButton")[i].textContent = lang.saveButton
  }
  for (let i = 0; i < document.getElementsByClassName("closeButton").length; i++) {
    document.getElementsByClassName("closeButton")[i].textContent = lang.closeButton
  }

  document.getElementById("buildingSearchInput")
    .setAttribute("aria-label", lang.closeButtonLabel);
  document.getElementById("centeringButton")
    .setAttribute("aria-label", lang.centeringButton);
}
