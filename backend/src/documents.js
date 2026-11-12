const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");
const { z } = require("zod");
const { PDFDocument } = require("pdf-lib");
const {
  BadRequestException,
  NotFoundException,
  ServiceUnavailableException,
} = require("@nestjs/common");
const { db, timestamp } = require("./firebase");
const { assertScope, assertId } = require("./domain");
const MAX_PDF_BYTES = 8 * 1024 * 1024;
const inputSchema = z
  .object({
    fileName: z
      .string()
      .trim()
      .min(1)
      .max(180)
      .regex(/\.pdf$/i),
    mimeType: z.literal("application/pdf"),
    scope: z.enum(["superiores", "integrados"]),
    base64: z
      .string()
      .min(1)
      .max(Math.ceil(MAX_PDF_BYTES / 3) * 4)
      .regex(/^[A-Za-z0-9+/]+={0,2}$/),
  })
  .strict();
const directory = () =>
  path.resolve(
    process.env.HIFPB_UPLOAD_DIR || path.join(__dirname, "../data/uploads"),
  );
function bucket() {
  if (!process.env.FIREBASE_STORAGE_BUCKET)
    throw new ServiceUnavailableException(
      "Armazenamento de documentos indisponível.",
    );
  return require("firebase-admin/storage")
    .getStorage()
    .bucket(process.env.FIREBASE_STORAGE_BUCKET);
}
async function validatePdf(input) {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success)
    throw new BadRequestException(
      "Envie um PDF de até 8 MB para integrado ou superior.",
    );
  const body = parsed.data,
    bytes = Buffer.from(body.base64, "base64");
  if (
    bytes.length > MAX_PDF_BYTES ||
    bytes.toString("base64") !== body.base64 ||
    bytes.subarray(0, 5).toString() !== "%PDF-"
  )
    throw new BadRequestException("Arquivo PDF inválido ou maior que 8 MB.");
  let pdf;
  try {
    pdf = await PDFDocument.load(bytes, {
      ignoreEncryption: false,
      throwOnInvalidObject: true,
    });
  } catch {
    throw new BadRequestException(
      "PDF inválido ou protegido por senha. Envie um documento que possa ser aberto.",
    );
  }
  const pageCount = pdf.getPageCount();
  if (pageCount < 1 || pageCount > 2000)
    throw new BadRequestException("O PDF deve ter entre 1 e 2000 páginas.");
  return { bytes, pageCount, body };
}
async function uploadDocument(input, user) {
  assertScope(user, {});
  const { bytes, pageCount, body } = await validatePdf(input);
  const id = crypto.randomUUID(),
    fileName = id + ".pdf",
    storageKey = "academic-documents/" + fileName;
  const metadata = {
    title: path.basename(body.fileName).replace(/[\r\n]/g, ""),
    fileName,
    mimeType: "application/pdf",
    scope: body.scope,
    pageCount,
    size: bytes.length,
    sha256: crypto.createHash("sha256").update(bytes).digest("hex"),
    managedBy: "coordinator",
    createdAt: timestamp(),
    storage: process.env.DATA_MODE === "local" ? "local" : "firebase",
  };
  if (metadata.storage === "local") {
    await fs.mkdir(directory(), { recursive: true });
    await fs.writeFile(path.join(directory(), fileName), bytes, { flag: "wx" });
  } else
    await bucket()
      .file(storageKey)
      .save(bytes, {
        resumable: false,
        metadata: { contentType: "application/pdf" },
      });
  try {
    await db.runTransaction(async (tx) => {
      await tx.get(db.doc("_system/academic-write-lock"));
      tx.create(db.doc("documents/" + id), metadata);
      tx.set(db.doc("_system/academic-write-lock"), { updatedAt: timestamp() });
    });
  } catch (error) {
    if (metadata.storage === "local")
      await fs.unlink(path.join(directory(), fileName)).catch(() => {});
    else
      await bucket()
        .file(storageKey)
        .delete()
        .catch(() => {});
    throw error;
  }
  return {
    id,
    title: metadata.title,
    pageCount,
    size: bytes.length,
    scope: body.scope,
  };
}
async function documentContent(id) {
  assertId(id);
  const snapshot = await db.doc("documents/" + id).get();
  if (!snapshot.exists || snapshot.data().archived)
    throw new NotFoundException("Documento não encontrado.");
  const record = snapshot.data();
  if (!/^[a-zA-Z0-9_-]+\.pdf$/.test(record.fileName))
    throw new NotFoundException("Documento não encontrado.");
  try {
    const bytes =
      record.storage === "firebase"
        ? (
            await bucket()
              .file("academic-documents/" + record.fileName)
              .download()
          )[0]
        : await fs.readFile(
            record.storage === "local"
              ? path.join(directory(), record.fileName)
              : path.resolve(
                  __dirname,
                  "../../frontend/public/documents",
                  record.fileName,
                ),
          );
    return { bytes, fileName: record.fileName };
  } catch (error) {
    if (error instanceof ServiceUnavailableException) throw error;
    throw new NotFoundException("Arquivo do documento não encontrado.");
  }
}
module.exports = {
  uploadDocument,
  documentContent,
  validatePdf,
  MAX_PDF_BYTES,
};
