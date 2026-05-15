import { Action, ActionPanel, Form, open, popToRoot, showHUD, showToast, Toast, Clipboard } from "@raycast/api";
import { useEffect, useState } from "react";
import { buildSchemeUrl, getDomain, isValidUrl } from "./utils";

export default function Command() {
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 클립보드에 URL이 있으면 자동 채움
  useEffect(() => {
    Clipboard.readText().then((text) => {
      const t = text?.trim() ?? "";
      if (t && isValidUrl(t)) setUrl(t);
    });
  }, []);

  function validateUrl(value: string): string | undefined {
    if (!value.trim()) return "URL을 입력하세요";
    if (!isValidUrl(value.trim())) return "유효한 URL이 아닙니다 (http/https만 허용)";
    return undefined;
  }

  async function handleSubmit(values: { url: string }) {
    const rawUrl = values.url.trim();
    const err = validateUrl(rawUrl);
    if (err) {
      setUrlError(err);
      return;
    }

    setIsSubmitting(true);
    try {
      await open(buildSchemeUrl(rawUrl));
      await showHUD(`✓ 저장됨 — ${getDomain(rawUrl)}`);
      await popToRoot();
    } catch {
      await showToast({ style: Toast.Style.Failure, title: "저장 실패", message: "Smart Memo가 설치되어 있는지 확인하세요" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form
      isLoading={isSubmitting}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Smart Memo에 저장" onSubmit={handleSubmit} />
          <Action
            title="클립보드에서 붙여넣기"
            shortcut={{ modifiers: ["cmd"], key: "v" }}
            onAction={async () => {
              const text = (await Clipboard.readText())?.trim() ?? "";
              if (text) setUrl(text);
            }}
          />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="url"
        title="URL"
        placeholder="https://..."
        value={url}
        onChange={(v) => { setUrl(v); setUrlError(undefined); }}
        error={urlError}
        onBlur={(e) => setUrlError(validateUrl(e.target.value ?? ""))}
        autoFocus
      />
      <Form.Description text="Enter 또는 ⌘↵ 로 저장합니다. 클립보드에 URL이 있으면 자동 입력됩니다." />
    </Form>
  );
}
