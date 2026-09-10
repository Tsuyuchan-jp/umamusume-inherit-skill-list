import { parseEffectCourseIds } from "./parse_utools_effect_course_ids.mjs";

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
