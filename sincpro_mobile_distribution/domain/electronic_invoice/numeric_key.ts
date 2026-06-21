const COUNTRY_CODE = "506";
const ISSUER_ID_FORMATTED = "3-004-051156";
const ISSUER_ID = "3004051156";
const SITUATION_DIGIT = "3";

function datePartDDMMYY(issueDate: Date | string): string {
  const d = typeof issueDate === "string" ? new Date(issueDate) : issueDate;
  if (Number.isNaN(d.getTime()))
    throw new Error("Fecha de emisión inválida para clave numérica");
  return (
    String(d.getDate()).padStart(2, "0") +
    String(d.getMonth() + 1).padStart(2, "0") +
    String(d.getFullYear()).slice(-2)
  );
}

function issuer12(): string {
  return ISSUER_ID.replace(/\D/g, "").slice(0, 12).padStart(12, "0");
}

function consecutive20(consecutiveRaw: string): string {
  let digits = (consecutiveRaw || "").replace(/\D/g, "");
  if (digits.length > 20) {
    console.warn(
      `[generateNumericKey] Consecutivo con ${digits.length} dígitos; tomando los últimos 20.`,
    );
    digits = digits.slice(-20);
  }
  return digits.padStart(20, "0");
}

function security8(): string {
  return Math.floor(Math.random() * 100_000_000)
    .toString()
    .padStart(8, "0");
}

export function generateNumericKey(issueDate: Date | string, consecutiveRaw: string): string {
  const country = COUNTRY_CODE.padStart(3, "0").slice(0, 3);
  const datePart = datePartDDMMYY(issueDate);
  const issuer = issuer12();
  const cons = consecutive20(consecutiveRaw);
  const sec = security8();

  let key = `${country}${datePart}${issuer}${cons}${SITUATION_DIGIT}${sec}`;

  if (key.length === 49) {
    const i = 3 + 6 + 12 + 20;
    key = key.slice(0, i) + SITUATION_DIGIT + key.slice(i);
  }

  if (key.length !== 50) {
    throw new Error(
      `Clave numérica generada inválida (${key.length} dígitos): ${key} (esperados 50)`,
    );
  }
  return key;
}

export const NumericKeyConstants = {
  COUNTRY_CODE,
  ISSUER_ID,
  ISSUER_ID_FORMATTED,
  SITUATION_DIGIT,
};
