import assertExists from "@xtjs/lib/js/assertExists";
import encodeUtf8 from "@xtjs/lib/js/encodeUtf8";
import decodeUtf8 from "@xtjs/lib/js/decodeUtf8";
import splitString from "@xtjs/lib/js/splitString";

// JS has no equality method for TypedArrays, because slow boxing of byte and linear byte-by-byte object comparison is fun and fast.
const equals = (
  a: Uint8Array,
  ia: number,
  b: Uint8Array,
  ib: number,
  n: number
) => {
  for (let i = 0; i < n; i++) {
    if (a[ia + i] !== b[ib + i]) {
      return false;
    }
  }
  return true;
};

const existsAt = (
  haystack: Uint8Array,
  haystackOffset: number,
  needle: Uint8Array
) => {
  if (haystackOffset + needle.length > haystack.length) {
    return false;
  }
  return equals(haystack, haystackOffset, needle, 0, needle.length);
};

const indexOf = (
  haystack: Uint8Array,
  haystackStart: number,
  needle: Uint8Array
) => {
  for (let i = haystackStart; i < haystack.length - needle.length; i++) {
    if (equals(haystack, i, needle, 0, needle.length)) {
      return i;
    }
  }
  return -1;
};

const CRLF = encodeUtf8("\r\n");

export function* parseMultipartFormData({
  contentType,
  raw,
}: {
  contentType: string;
  raw: Uint8Array;
}) {
  const CONTENT_TYPE_PREFIX = "multipart/form-data; boundary=";

  if (!contentType.startsWith(CONTENT_TYPE_PREFIX)) {
    throw new Error(`Invalid Content-Type: ${contentType}`);
  }

  const formDataBoundary = contentType.slice(CONTENT_TYPE_PREFIX.length);
  const formDataStart = encodeUtf8(`--${formDataBoundary}\r\n`);
  const formDataMidPrefix = encodeUtf8(`\r\n--${formDataBoundary}`);
  const formDataEnd = encodeUtf8("--");

  if (!existsAt(raw, 0, formDataStart)) {
    throw new Error(`Boundary not found at start`);
  }
  let i = formDataStart.length;
  while (true) {
    // Parse headers.
    const headers: { [name: string]: string | undefined } = Object.create(null);
    while (true) {
      // Don't check for colon position first, as there may be no headers.
      const posOfEnd = indexOf(raw, i, CRLF);
      if (posOfEnd == -1) {
        throw new Error(`No CRLF found after ${i}: `);
      }
      if (posOfEnd == i) {
        // End of headers.
        i += CRLF.length;
        break;
      }

      const headerLine = decodeUtf8(raw.subarray(i, posOfEnd));
      i = posOfEnd + CRLF.length;
      const [headerName, headerValue] = splitString(headerLine, ":", 2);
      if (headerValue === undefined) {
        throw new Error(`Header line ending at ${i} does not have a colon`);
      }
      // TODO Support multiple values.
      headers[assertExists(headerName).toLowerCase()] = headerValue.trimStart();
    }

    const posOfBoundary = indexOf(raw, i, formDataMidPrefix);
    if (posOfBoundary == -1) {
      throw new Error(`Boundary not found after ${i}`);
    }
    const value = raw.subarray(i, posOfBoundary);
    yield { headers, value };
    i = posOfBoundary + formDataMidPrefix.length;
    if (existsAt(raw, i, formDataEnd)) {
      break;
    }
    if (!existsAt(raw, i, CRLF)) {
      throw new Error(`CRLF not found at ${i}`);
    }
    i += CRLF.length;
  }
}
