export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export class SourceValidator {
  validate(files: string[]): ValidationResult {
    return {
      valid: files.length > 0,
      errors: files.length ? [] : ['No generated files']
    };
  }
}
