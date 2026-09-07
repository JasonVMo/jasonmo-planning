import Ajv, { type ErrorObject } from "ajv";
import addFormats from "ajv-formats";
import contracts from "../../entity-model/schemas/contracts.schema.json";
import { fail } from "./diagnostics.ts";
import {
  eventScheduleRangeError,
  isCalendarDate,
  isCalendarTimestamp,
  isTimeZone,
} from "@planning/entity-model";

const ajv = new Ajv({ allErrors: true, strict: true, strictRequired: false, ownProperties: true });
addFormats(ajv);
ajv.addFormat("calendar-date", isCalendarDate);
ajv.addFormat("calendar-timestamp", isCalendarTimestamp);
ajv.addFormat("iana-time-zone", isTimeZone);
const validateEventRange = Object.assign(
  (
    enabled: boolean,
    value: unknown,
    _schema: unknown,
    context?: { instancePath: string },
  ): boolean => {
    const error = enabled ? eventScheduleRangeError(value) : undefined;
    validateEventRange.errors = error
      ? [
          {
            keyword: "eventRange",
            instancePath: `${context?.instancePath ?? ""}${error.field}`,
            schemaPath: "#/eventRange",
            params: {},
            message: error.message,
          },
        ]
      : [];
    return !error;
  },
  { errors: [] as ErrorObject[] },
);
ajv.addKeyword({
  keyword: "eventRange",
  type: "object",
  schemaType: "boolean",
  errors: true,
  validate: validateEventRange,
});
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
