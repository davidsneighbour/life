import { parse } from "smol-toml";
import raw from "../data/life.toml?raw";
import { buildLifeModel, type LifeModel, parseLifeData } from "./life.ts";

/** Read, validate, and expand `src/data/life.toml`. Throws on invalid data so the build fails early. */
export function loadLife(): LifeModel {
  return buildLifeModel(parseLifeData(parse(raw), "src/data/life.toml"));
}
