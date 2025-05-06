import "jquery.transit";
import { TenOnTen } from "./js/TenOnTen";

import "./main.css";

var tenOnTen = new TenOnTen({
  appContainer: "#app",
});

console.log("App is ready", tenOnTen);
