import { UserGroupEnum } from "../models/userGroupEnum";
import { lang } from "../services/languageService";

const UserGroups: Map<UserGroupEnum, any> = new Map<UserGroupEnum, any>();
UserGroups.set(UserGroupEnum.blindPeople, {
  name: lang.userProfileVisImpairments,
  icon: "visibility_off",
});
UserGroups.set(UserGroupEnum.noImpairments, {
  name: lang.userProfileNoSpecialNeeds,
  icon: "people",
});
UserGroups.set(UserGroupEnum.wheelchairUsers, {
  name: lang.userProfileWheelchair,
  icon: "accessible",
});

export { UserGroups };
