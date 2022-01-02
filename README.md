# multipart

Synchronous parser of `multipart/form-data` bytes.

## Install

```bash
npm i @wzlin/multipart
```

## Usage

```typescript
import { parseMultipartFormData } from "@wzlin/multipart";
import decodeUtf8 from "@xtjs/lib/js/decodeUtf8";

const contentType = "multipart/form-data; boundary=-----12345";
const raw: Uint8Array = somehowGetRawBytesOfRequestBody();
const parser = parseMultipartFormData({
  contentType,
  raw,
});
for (const { headers, value } of parser) {
  console.log("Parsed field:");
  for (const [name, value] of Object.entries(headers)) {
    console.log("Header", name, "=", value);
  }
  console.log("Magic bytes:", [...value.subarray(0, 8)]);
  console.log("Has BOM:", value[0] == 0xEF && value[1] == 0xBB && value[2] == 0xBF);
  console.log("Value as string:", decodeUtf8(value));
}
```
