import "jquery.transit";
import { TenOnTen } from "./js/TenOnTen";

import "./main.css";

const container = document.getElementById("app");

if (!container) {
  throw new Error("Container not found");
}

var tenOnTen = new TenOnTen({
  container,
});

console.log("App is ready", tenOnTen);
