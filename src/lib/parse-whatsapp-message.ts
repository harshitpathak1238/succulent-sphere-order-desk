import type { ParsedWhatsAppMessage } from "@/lib/types";

function toTitleCase(value: string) {
  return value
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function normalizePhone(rawValue: string) {
  const digits = rawValue.replace(/\D/g, "");

  if (digits.length === 10) {
    return digits;
  }

  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2);
  }

  if (digits.length === 13 && digits.startsWith("091")) {
    return digits.slice(3);
  }

  return digits.length >= 10 ? digits.slice(-10) : "";
}

function extractPhone(text: string) {
  const phoneMatches = text.match(
    /(?:\+?91[\s-]*)?(?:\d[\s-]*){10,12}/g,
  );

  if (!phoneMatches) {
    return "";
  }

  for (const match of phoneMatches) {
    const normalized = normalizePhone(match);

    if (/^[6-9]\d{9}$/.test(normalized)) {
      return normalized;
    }
  }

  return "";
}

function extractPincode(text: string) {
  const match = text.match(/(?<!\d)[1-9]\d{5}(?!\d)/);
  return match?.[0] ?? "";
}

function extractEmail(text: string) {
  const match = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match?.[0] ?? "";
}

function extractAmountHint(text: string) {
  const match = text.match(/(?:rs\.?|rupees?|₹)\s*(\d+(?:\.\d+)?)/i)
    ?? text.match(/(\d+(?:\.\d+)?)\s*(?:rs\.?|rupees?|₹)/i);

  if (!match?.[1]) {
    return null;
  }

  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : null;
}

function extractKeywordName(lines: string[]) {
  for (const line of lines) {
    const match = line.match(
      /(?:naam|name)\s*(?:is|:|-)?\s*([A-Za-z][A-Za-z\s]{1,60})/i,
    );

    if (match?.[1]) {
      return toTitleCase(match[1].trim());
    }
  }

  return "";
}

function removeSensitiveParts(line: string, phone: string, pincode: string, email: string) {
  let nextLine = line;

  if (phone) {
    const phonePattern = new RegExp(phone.split("").join("\\s*"), "g");
    nextLine = nextLine.replace(phonePattern, " ");
  }

  if (pincode) {
    nextLine = nextLine.replace(new RegExp(pincode, "g"), " ");
  }

  if (email) {
    nextLine = nextLine.replace(email, " ");
  }

  return nextLine.trim();
}

export function parseWhatsAppMessage(rawText: string): ParsedWhatsAppMessage {
  const normalizedText = rawText.replace(/\r\n/g, "\n").trim();
  const lines = normalizedText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const phone = extractPhone(normalizedText);
  const pincode = extractPincode(normalizedText);
  const email = extractEmail(normalizedText);
  const amountHint = extractAmountHint(normalizedText);
  const keywordName = extractKeywordName(lines);
  const firstLineName = lines[0] ? toTitleCase(lines[0]) : "";
  const customerName = keywordName || firstLineName;

  const addressLines = lines
    .filter((line, index) => {
      const lower = line.toLowerCase();

      if (index === 0 && customerName === firstLineName) {
        return false;
      }

      if (phone && normalizePhone(line) === phone) {
        return false;
      }

      if (pincode && line.includes(pincode)) {
        return false;
      }

      if (email && line.includes(email)) {
        return false;
      }

      if (
        /(naam|name|number|mobile|mob|phone|call|pin|pincode|zip|mail|email)/i.test(
          lower,
        )
      ) {
        const cleaned = removeSensitiveParts(line, phone, pincode, email)
          .replace(/(?:naam|name|number|mobile|mob|phone|call|pin|pincode|zip|mail|email)\s*(?:is|:|-)?/gi, " ")
          .trim();

        return cleaned.length > 0 && cleaned !== customerName;
      }

      return true;
    })
    .map((line) =>
      removeSensitiveParts(line, phone, pincode, email)
        .replace(/\s{2,}/g, " ")
        .trim(),
    )
    .filter(Boolean);

  return {
    customerName,
    phone,
    email,
    address: addressLines.join(", "),
    pincode,
    city: "",
    state: "",
    amountHint,
    rawText: rawText.trim(),
  };
}
