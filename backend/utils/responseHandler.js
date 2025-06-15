import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const responseMessages = JSON.parse(
  fs.readFileSync(path.join(__dirname, "response.json"), "utf8")
);

export const createSuccessResponse = (type, entity, data = null) => {
  return {
    success: true,
    message: responseMessages.success[type][entity],
    data,
  };
};

export const createErrorResponse = (
  type,
  entity,
  errorType = "COMMON",
  data = null
) => {
  return {
    success: false,
    message:
      responseMessages.error[entity]?.[errorType] ||
      responseMessages.error.COMMON[errorType],
    data,
  };
};

export const handleModelResponse = (response, type, entity) => {
  if (response.success) {
    return createSuccessResponse(type, entity, response.data);
  }
  return createErrorResponse(type, entity, "COMMON", response.data);
};

export const handleValidationError = (entity, errorType) => {
  return createErrorResponse("VALIDATION", entity, errorType);
};

export const handleNotFoundError = (entity) => {
  return createErrorResponse("FETCH", entity, "NOT_FOUND");
};

export const handleInternalError = (entity, error) => {
  console.error(`Error in ${entity}:`, error);
  return createErrorResponse("FETCH", entity, "INTERNAL_ERROR");
};
