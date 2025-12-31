import "i18next";
import enCommon from "./locales/en-US/common.json";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "common";
    resources: {
      common: typeof enCommon;
    };
    returnNull: false;
    returnObjects: false;
  }
}
