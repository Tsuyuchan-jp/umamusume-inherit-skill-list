import { parseCourses, parseEffectCourseIds } from "./extract_utools_courses.mjs";

const fixture = `
header__name__x","children":"札幌"
pathname":"/race/courses/10101","hash":"$undefined"},"className":"x","children":[["$","div",null,{"children":[1200,"（","短距離","）","右"]}],false,["$","div",null,{"children":"芝"}]]
pathname":"/race/courses/10106","hash":"$undefined"},"className":"x","children":[["$","div",null,{"children":[1000,"（","短距離","）","右"]}],false,["$","div",null,{"children":"ダ"}]]
`;

const courses = parseCourses(fixture);
const turf = courses.find((c) => c.id === 10101);
const dirt = courses.find((c) => c.id === 10106);

if (!turf || turf.ground !== "芝") {
  throw new Error(`turf missing or wrong: ${JSON.stringify(turf)}`);
}
if (!dirt || dirt.ground !== "ダート" || dirt.distance !== 1000) {
  throw new Error(`dirt missing or wrong: ${JSON.stringify(dirt)}`);
}
if (!dirt.name.includes("ダート")) {
  throw new Error(`dirt name should use ダート: ${dirt.name}`);
}

console.log("ok parseCourses turf+dirt");

const effectFixture = `
pathname":"/race/courses/11102"
pathname":"/race/courses/11103","hash":"$undefined"},"children":[["$","div",null,{"className":"raceTrackCourseItem_component_course__effect__daXrR"}]]
pathname":"/race/courses/11301"
`;
const effectIds = parseEffectCourseIds(effectFixture);
if (effectIds.length !== 1 || effectIds[0] !== 11103) {
  throw new Error(`effect ids ${JSON.stringify(effectIds)}`);
}
console.log("ok parseEffectCourseIds");
