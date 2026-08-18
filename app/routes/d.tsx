import { useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { getOcr } from "~/lib/ocr";

/** OCR 识别 demo:上传图片 → 下方显示识别结果 */
export default function OcrDemo() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recognize = async (file?: File) => {
    if (!file) return;
    setText("");
    setError(null);
    setBusy(true);
    setPreview(URL.createObjectURL(file));
    try {
      const ocr = await getOcr("zh");
      const [res] = await ocr.predict(file);
      const lines = (res?.items ?? [])
        .map((it) => it.text)
        .filter(Boolean)
        .join("\n");
      setText(lines || "(未识别到文字)");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold">OCR 识别 demo</h1>
        <Button type="button" onClick={() => inputRef.current?.click()}>
          选择图片
        </Button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => recognize(e.target.files?.[0])}
      />

      {preview && (
        <img
          src={preview}
          alt="preview"
          className="max-h-80 rounded-md border object-contain"
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>处理结果</CardTitle>
          <CardDescription>
            {busy
              ? "识别中…"
              : error
                ? "识别出错"
                : text
                  ? "识别完成"
                  : "上传图片后开始识别"}
          </CardDescription>
        </CardHeader>
        <CardContent className="whitespace-pre-wrap text-sm">
          {busy ? (
            <span className="text-muted-foreground">识别中…</span>
          ) : error ? (
            <span className="text-red-500">{error}</span>
          ) : (
            text
          )}
        </CardContent>
      </Card>
    </div>
  );
}
