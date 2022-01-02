import encodeUtf8 from "@xtjs/lib/js/encodeUtf8";
import { parseMultipartFormData } from "./main";

test("it works", () => {
  const raw = encodeUtf8(
    [
      `-----------------------------9051914041544843365972754266`,
      `Content-Disposition: form-data; name="text"`,
      ``,
      `text default`,
      `-----------------------------9051914041544843365972754266`,
      `Content-Disposition: form-data; name="file1"; filename="a.txt"`,
      `Content-Type: text/plain`,
      ``,
      `Content of a.txt.\n`,
      `-----------------------------9051914041544843365972754266`,
      `Content-Disposition: form-data; name="file2"; filename="a.html"`,
      `Content-Type: text/html`,
      ``,
      `<!DOCTYPE html><title>Content of a.html.</title>\n`,
      `-----------------------------9051914041544843365972754266--`,
    ].join("\r\n")
  );
  expect([
    ...parseMultipartFormData({
      contentType:
        "multipart/form-data; boundary=---------------------------9051914041544843365972754266",
      raw,
    }),
  ]).toEqual([
    {
      headers: {
        "Content-Disposition": 'form-data; name="text"',
      },
      value: encodeUtf8("text default"),
    },
    {
      headers: {
        "Content-Disposition": 'form-data; name="file1"; filename="a.txt"',
        "Content-Type": "text/plain",
      },
      value: encodeUtf8("Content of a.txt.\n"),
    },
    {
      headers: {
        "Content-Disposition": 'form-data; name="file2"; filename="a.html"',
        "Content-Type": "text/html",
      },
      value: encodeUtf8("<!DOCTYPE html><title>Content of a.html.</title>\n"),
    },
  ]);
});
