import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CLASSIFICATION_VERSION,
  ClassificationSession,
  KNOWLEDGE_NODES,
  StructureCorrectedEvidence,
} from '@orc/shared';
import { DocumentImportService } from '../document-import/document-import.service';
import { EvidenceService } from '../evidence/evidence.service';
import { KnowledgeExtractionService } from '../knowledge-extraction/knowledge-extraction.service';
import { SaveSessionDto } from './dto/save-session.dto';
import { seedAssignmentsFromExtraction } from './seed-from-extraction';
import { SessionStoreService } from './session-store.service';

const NODE_IDS = new Set(KNOWLEDGE_NODES.map((n) => n.id));

@Injectable()
export class ClassificationService {
  constructor(
    private readonly sessions: SessionStoreService,
    private readonly documents: DocumentImportService,
    private readonly evidence: EvidenceService,
    private readonly extraction: KnowledgeExtractionService,
  ) {}

  async getSession(documentId: string): Promise<ClassificationSession> {
    await this.documents.getDocument(documentId);
    const existing = await this.sessions.read(documentId);
    if (existing) {
      return existing;
    }

    let seeded = this.sessions.emptySession(documentId);
    try {
      const listed = await this.extraction.listByDocument(documentId);
      let latest = listed.items[0];
      if (!latest) {
        latest = await this.extraction.extractForDocument(documentId);
      }
      seeded = {
        ...seeded,
        assignments: seedAssignmentsFromExtraction(latest),
        version: 0,
        updatedAt: new Date().toISOString(),
      };
      return this.sessions.write(seeded);
    } catch {
      return this.sessions.write(seeded);
    }
  }

  async saveSession(
    documentId: string,
    dto: SaveSessionDto,
  ): Promise<{
    session: ClassificationSession;
    evidence: StructureCorrectedEvidence[];
  }> {
    await this.documents.getDocument(documentId);

    for (const assignment of dto.assignments) {
      if (!NODE_IDS.has(assignment.nodeId)) {
        throw new BadRequestException(`Unknown nodeId: ${assignment.nodeId}`);
      }
    }

    const previous = (await this.sessions.read(documentId)) ?? this.sessions.emptySession(documentId);
    const nextVersion = previous.version + 1;
    const reviewer = dto.reviewer?.trim() || previous.reviewer || 'nguoi-duyet';

    const session = await this.sessions.write({
      documentId,
      version: nextVersion,
      assignments: dto.assignments.map((a) => ({
        id: a.id,
        nodeId: a.nodeId,
        text: a.text,
        pageNumber: a.pageNumber,
        createdAt: a.createdAt,
        source: a.source === 'auto' ? 'auto' : 'manual',
      })),
      updatedAt: new Date().toISOString(),
      reviewer,
      classificationVersion: CLASSIFICATION_VERSION,
    });

    const evidence: StructureCorrectedEvidence[] = [];
    for (const correction of dto.corrections) {
      if (!NODE_IDS.has(correction.nodeId)) {
        throw new BadRequestException(`Unknown nodeId: ${correction.nodeId}`);
      }
      const record = await this.evidence.recordStructureCorrected({
        documentId,
        nodeId: correction.nodeId,
        before: correction.before ?? null,
        after: correction.after ?? null,
        reviewer,
        version: nextVersion,
        originalClassification: correction.originalClassification ?? null,
        newClassification: correction.newClassification ?? correction.nodeId,
        reason: correction.reason ?? null,
      });
      if (record.type === 'StructureCorrected') {
        evidence.push(record);
      }
    }

    return { session, evidence };
  }

  async listEvidence(documentId: string) {
    await this.documents.getDocument(documentId);
    const all = await this.evidence.listByDocument(documentId);
    return all.filter((e) => e.type === 'StructureCorrected');
  }

  async requirePdf(documentId: string) {
    const doc = await this.documents.getDocument(documentId);
    if (doc.extension !== 'pdf') {
      throw new NotFoundException(
        `Document ${documentId} is not a PDF. WAVE-01 viewer supports PDF only.`,
      );
    }
    return doc;
  }
}
