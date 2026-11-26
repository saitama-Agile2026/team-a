import { describe, expect, test } from "bun:test";
import sharp from "sharp";
import {
  getUploadFiles,
  MAX_IMAGE_BYTES,
  MAX_UPLOAD_BYTES,
  prepareImage,
  readUploadForm,
} from "./upload";

describe("upload validation", () => {
  test("JPEG・PNG・WebPを読み込み、WebPに変換する", async () => {
    for (const [format, type] of [
      ["jpeg", "image/jpeg"],
      ["png", "image/png"],
      ["webp", "image/webp"],
    ] as const) {
      const bytes = await sharp({
        create: { width: 4, height: 4, channels: 3, background: "red" },
      })
        .toFormat(format)
        .toBuffer();
      const output = await prepareImage(
        new File([new Uint8Array(bytes)], "image", { type }),
      );
      expect((await sharp(output).metadata()).format).toBe("webp");
    }
  });
  test("偽装画像、破損画像、空ファイル、サイズ超過を拒否する", async () => {
    const png = await sharp({
      create: { width: 2, height: 2, channels: 3, background: "red" },
    })
      .png()
      .toBuffer();
    const invalid = [
      new File(["<svg/>"], "image.svg", { type: "image/svg+xml" }),
      new File(["broken"], "image.png", { type: "image/png" }),
      new File([new Uint8Array(png)], "fake.jpg", { type: "image/jpeg" }),
      new File([], "empty.png", { type: "image/png" }),
      new File([new Uint8Array(MAX_IMAGE_BYTES + 1)], "large.png", {
        type: "image/png",
      }),
    ];
    for (const file of invalid)
      await expect(prepareImage(file)).rejects.toThrow();
  });
  test("files項目に1〜3枚のみ受け付ける", () => {
    const form = new FormData();
    expect(() => getUploadFiles(form)).toThrow();
    for (let i = 0; i < 3; i++)
      form.append("files", new File(["image"], "image.png"));
    expect(getUploadFiles(form)).toHaveLength(3);
    form.append("files", new File(["image"], "fourth.png"));
    expect(() => getUploadFiles(form)).toThrow();
    const text = new FormData();
    text.append("files", "image");
    expect(() => getUploadFiles(text)).toThrow();
  });
  test("multipartを読み取る", async () => {
    const form = new FormData();
    form.append(
      "files",
      new File(["image"], "image.png", { type: "image/png" }),
    );
    const request = new Request("http://localhost/api/upload", {
      method: "POST",
      body: form,
    });
    const files = getUploadFiles(await readUploadForm(request));
    expect(files[0].name).toBe("image.png");
  });
  test("Content-Lengthがなくてもボディ上限を超えたら拒否する", async () => {
    const request = new Request("http://localhost/api/upload", {
      method: "POST",
      headers: { "Content-Type": "multipart/form-data; boundary=test" },
      body: new Uint8Array(MAX_UPLOAD_BYTES + 1),
    });
    await expect(readUploadForm(request)).rejects.toThrow("合計サイズ");
  });
});
