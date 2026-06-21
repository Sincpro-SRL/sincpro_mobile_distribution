export enum EDocumentType {
  FACTURA_ELECTRONICA = "01",
  NOTA_DEBITO_ELECTRONICA = "02",
  NOTA_CREDITO_ELECTRONICA = "03",
  TIQUETE_ELECTRONICO = "04",
  NOTA_DESPACHO = "05",
  CONTRATO = "06",
  PROCEDIMIENTO = "07",
  COMPROBANTE_EMITIDO_CONTINGENCIA = "08",
  DEVOLUCION_MERCADERIA = "09",
  COMPROBANTE_RECHAZADO_MH = "10",
  SUSTITUYE_FACTURA_RECHAZADA_RECEPTOR = "11",
  SUSTITUYE_FACTURA_EXPORTACION = "12",
  FACTURACION_MES_VENCIDO = "13",
  COMPROBANTE_REGIMEN_ESPECIAL = "14",
  SUSTITUYE_FACTURA_ELECTRONICA_COMPRA = "15",
  COMPROBANTE_PROVEEDOR_NO_DOMICILIADO = "16",
  NOTA_CREDITO_FACTURA_ELECTRONICA_COMPRA = "17",
  NOTA_DEBITO_FACTURA_ELECTRONICA_COMPRA = "18",
  OTROS = "99",
}

export const DOCUMENT_TYPE_LABEL: Record<EDocumentType, string> = {
  [EDocumentType.FACTURA_ELECTRONICA]: "Factura electrónica",
  [EDocumentType.NOTA_DEBITO_ELECTRONICA]: "Nota de débito electrónica",
  [EDocumentType.NOTA_CREDITO_ELECTRONICA]: "Nota de crédito electrónica",
  [EDocumentType.TIQUETE_ELECTRONICO]: "Tiquete electrónico",
  [EDocumentType.NOTA_DESPACHO]: "Nota de despacho",
  [EDocumentType.CONTRATO]: "Contrato",
  [EDocumentType.PROCEDIMIENTO]: "Procedimiento",
  [EDocumentType.COMPROBANTE_EMITIDO_CONTINGENCIA]: "Comprobante emitido en contingencia",
  [EDocumentType.DEVOLUCION_MERCADERIA]: "Devolución mercadería",
  [EDocumentType.COMPROBANTE_RECHAZADO_MH]: "Comprobante rechazado Ministerio Hacienda",
  [EDocumentType.SUSTITUYE_FACTURA_RECHAZADA_RECEPTOR]:
    "Sustituye factura rechazada por receptor",
  [EDocumentType.SUSTITUYE_FACTURA_EXPORTACION]: "Sustituye factura de exportación",
  [EDocumentType.FACTURACION_MES_VENCIDO]: "Facturación mes vencido",
  [EDocumentType.COMPROBANTE_REGIMEN_ESPECIAL]: "Comprobante régimen especial",
  [EDocumentType.SUSTITUYE_FACTURA_ELECTRONICA_COMPRA]:
    "Sustituye factura electrónica de compra",
  [EDocumentType.COMPROBANTE_PROVEEDOR_NO_DOMICILIADO]:
    "Comprobante proveedor no domiciliado",
  [EDocumentType.NOTA_CREDITO_FACTURA_ELECTRONICA_COMPRA]:
    "Nota de crédito a factura electrónica de compra",
  [EDocumentType.NOTA_DEBITO_FACTURA_ELECTRONICA_COMPRA]:
    "Nota de débito a factura electrónica de compra",
  [EDocumentType.OTROS]: "Otros",
};

export const ENABLED_DOCUMENT_TYPES: EDocumentType[] = [
  EDocumentType.FACTURA_ELECTRONICA,
  EDocumentType.TIQUETE_ELECTRONICO,
];
