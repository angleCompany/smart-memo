import { Clipboard, open, showHUD, showToast, Toast } from "@raycast/api";
import { buildSchemeUrl, getDomain, isValidUrl } from "./utils";

export default async function Command() {
  const text = (await Clipboard.readText())?.trim() ?? "";

  if (!text) {
    await showToast({
      style: Toast.Style.Failure,
      title: "클립보드가 비어있습니다",
    });
    return;
  }

  if (!isValidUrl(text)) {
    await showToast({
      style: Toast.Style.Failure,
      title: "URL이 아닙니다",
      message: text.slice(0, 60),
    });
    return;
  }

  await open(buildSchemeUrl(text));
  await showHUD(`✓ 저장됨 — ${getDomain(text)}`);
}
