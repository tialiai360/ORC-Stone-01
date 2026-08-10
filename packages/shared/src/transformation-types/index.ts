/**
 * Transformation shared types (MVP-004).
 * Rule-based KE → Branch Transformation Model.
 * No AI/LLM, no wording generation, no semantic inference.
 */

export const TRANSFORMATION_VERSION = '1.0.0' as const;
export const TRANSFORM_RULE_VERSION = '1.0.0' as const;

/** Traceability required on every transformed field. */
export interface TransformationTrace {
  sourceDocumentId: string;
  section: string | null;
  paragraph: string | null;
  /** Evidence reference into KE payload path, e.g. ke:payload.metadata.documentTitle */
  evidenceReference: string;
  ruleVersion: string;
}

export interface TracedField<T> {
  value: T;
  trace: TransformationTrace;
}

export interface BusinessContextModel {
  documentNumber: TracedField<string | null>;
  documentTitle: TracedField<string | null>;
  documentType: TracedField<string | null>;
  issuer: TracedField<string | null>;
  documentDate: TracedField<string | null>;
  effectiveDate: TracedField<string | null>;
}

/** Branch Transformation Model — structured ops fields only. */
export interface BranchTransformationModel {
  intent: TracedField<string | null>;
  actions: TracedField<string>[];
  responsibleUnits: TracedField<string>[];
  targetAudience: TracedField<string>[];
  priority: TracedField<string | null>;
  deadlines: TracedField<string>[];
  requiredDeliverables: TracedField<string>[];
  references: TracedField<string>[];
  attachments: TracedField<string>[];
  businessContext: BusinessContextModel;
}

export interface TransformationResult {
  id: string;
  extractionId: string;
  documentId: string;
  transformVersion: typeof TRANSFORMATION_VERSION | string;
  ruleVersion: typeof TRANSFORM_RULE_VERSION | string;
  createdAt: string;
  model: BranchTransformationModel;
  /** Count of traced field values present. */
  fieldCount: number;
}

export function countTransformationFields(model: BranchTransformationModel): number {
  const ctx = model.businessContext;
  const scalars = [
    model.intent.value,
    model.priority.value,
    ctx.documentNumber.value,
    ctx.documentTitle.value,
    ctx.documentType.value,
    ctx.issuer.value,
    ctx.documentDate.value,
    ctx.effectiveDate.value,
  ].filter((v) => v != null && String(v).length > 0).length;

  return (
    scalars +
    model.actions.length +
    model.responsibleUnits.length +
    model.targetAudience.length +
    model.deadlines.length +
    model.requiredDeliverables.length +
    model.references.length +
    model.attachments.length
  );
}

/** Count every traced field slot (including null-valued scalars). */
export function countSourceTraces(model: BranchTransformationModel): number {
  return (
    1 + // intent
    1 + // priority
    model.actions.length +
    model.responsibleUnits.length +
    model.targetAudience.length +
    model.deadlines.length +
    model.requiredDeliverables.length +
    model.references.length +
    model.attachments.length +
    6 // businessContext scalars always present
  );
}
