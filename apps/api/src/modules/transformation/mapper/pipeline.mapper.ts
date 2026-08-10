import {
  BranchTransformationModel,
  BusinessContextModel,
  KnowledgeExtractionResult,
  TracedField,
  countTransformationFields,
} from '@orc/shared';
import { TRANSFORM_RULES, matchesDeliverableKeyword } from '../rules/transform-rules';
import { findSectionForText, traced } from './trace.helpers';

function mapList(
  values: string[],
  documentId: string,
  evidencePath: string,
  extraction: KnowledgeExtractionResult,
): TracedField<string>[] {
  return [...values]
    .sort((a, b) => a.localeCompare(b))
    .map((value, index) =>
      traced(
        value,
        documentId,
        `${evidencePath}[${index}]`,
        findSectionForText(extraction, value),
        value,
      ),
    );
}

export function mapBusinessContext(
  extraction: KnowledgeExtractionResult,
): BusinessContextModel {
  const docId = extraction.documentId;
  const meta = extraction.payload.metadata;
  return {
    documentNumber: traced(
      meta.documentNumber,
      docId,
      'ke:payload.metadata.documentNumber',
      null,
      meta.documentNumber,
    ),
    documentTitle: traced(
      meta.documentTitle,
      docId,
      'ke:payload.metadata.documentTitle',
      null,
      meta.documentTitle,
    ),
    documentType: traced(
      meta.documentType,
      docId,
      'ke:payload.metadata.documentType',
      null,
      meta.documentType,
    ),
    issuer: traced(meta.issuer, docId, 'ke:payload.metadata.issuer', null, meta.issuer),
    documentDate: traced(
      meta.documentDate,
      docId,
      'ke:payload.metadata.documentDate',
      null,
      meta.documentDate,
    ),
    effectiveDate: traced(
      meta.effectiveDate,
      docId,
      'ke:payload.metadata.effectiveDate',
      null,
      meta.effectiveDate,
    ),
  };
}

/** Deterministic KE → Branch Transformation Model. Same KE → same model. */
export function mapExtractionToBranchModel(
  extraction: KnowledgeExtractionResult,
): { model: BranchTransformationModel; fieldCount: number } {
  const docId = extraction.documentId;
  const payload = extraction.payload;

  const intent = traced(
    payload.metadata.documentTitle,
    docId,
    TRANSFORM_RULES.intentEvidencePath,
    null,
    payload.metadata.documentTitle,
  );

  const actions = mapList(
    payload.actionStatements,
    docId,
    TRANSFORM_RULES.actionEvidencePath,
    extraction,
  );

  const responsibleUnits = mapList(
    payload.responsibleUnits,
    docId,
    TRANSFORM_RULES.responsibleEvidencePath,
    extraction,
  );

  const targetAudience = mapList(
    payload.departments,
    docId,
    TRANSFORM_RULES.targetEvidencePath,
    extraction,
  );

  const priorityValue =
    [...payload.priorityIndicators].sort((a, b) => a.localeCompare(b))[0] ?? null;
  const priority = traced(
    priorityValue,
    docId,
    TRANSFORM_RULES.priorityEvidencePath,
    priorityValue ? findSectionForText(extraction, priorityValue) : null,
    priorityValue,
  );

  const deadlines = mapList(
    payload.deadlines,
    docId,
    TRANSFORM_RULES.deadlineEvidencePath,
    extraction,
  );

  const deliverableFromActions = payload.actionStatements.filter(matchesDeliverableKeyword);
  const deliverableFromAppendices = payload.appendices.map((a) => a.label);
  const requiredDeliverables = mapList(
    [...new Set([...deliverableFromActions, ...deliverableFromAppendices])],
    docId,
    TRANSFORM_RULES.deliverableFromActionPath,
    extraction,
  ).map((item) => {
    const fromAppendix = payload.appendices.some((a) => a.label === item.value);
    return {
      ...item,
      trace: {
        ...item.trace,
        evidenceReference: fromAppendix
          ? TRANSFORM_RULES.deliverableFromAppendixPath
          : `${TRANSFORM_RULES.deliverableFromActionPath}`,
      },
    };
  });

  const references = mapList(
    payload.referencedDocuments,
    docId,
    TRANSFORM_RULES.referenceEvidencePath,
    extraction,
  );

  const attachments = mapList(
    payload.appendices.map((a) => a.label),
    docId,
    TRANSFORM_RULES.attachmentEvidencePath,
    extraction,
  );

  const model: BranchTransformationModel = {
    intent,
    actions,
    responsibleUnits,
    targetAudience,
    priority,
    deadlines,
    requiredDeliverables,
    references,
    attachments,
    businessContext: mapBusinessContext(extraction),
  };

  return { model, fieldCount: countTransformationFields(model) };
}
