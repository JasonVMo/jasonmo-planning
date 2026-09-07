import Ajv from "ajv";
import addFormats from "ajv-formats";
import contracts from "../../entity-model/schemas/contracts.schema.json";
import { fail } from "./diagnostics.ts";

const ajv = new Ajv({ allErrors: true, strict: true, strictRequired: false, ownProperties: true });
addFormats(ajv);
ajv.addSchema(contracts);
export function assertSchema<T>(
  name: keyof typeof contracts.definitions,
  value: unknown,
  file: string,
): asserts value is T {
  const validate = ajv.getSchema(`${contracts.$id}#/definitions/${name}`);
  if (!validate) throw new Error(`Unregistered code-owned schema: ${name}`);
  if (!validate(value)) {
    const errors = validate.errors
      ?.map(
        (error) =>
          `${error.instancePath || "/"} ${error.message}${error.keyword === "additionalProperties" ? ` (${String(error.params.additionalProperty)})` : ""}`,
      )
      .join("; ");
    fail(file, "", `schema ${name}: ${errors}`);
  }
}
